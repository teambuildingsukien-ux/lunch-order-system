'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/providers/toast-provider';
import DashboardHeader from './DashboardHeader';
import BulkRegistrationCalendar from './BulkRegistrationCalendar';
import { toLocalDateString } from '@/lib/utils/date-helpers';

// Material Symbol Icon component
const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

// Types
interface GroupMember {
    id: string;
    full_name: string;
    email: string;
    role: string;
    order_status?: 'eating' | 'not_eating' | null;
    avatar_url?: string;
}

interface GroupInfo {
    id: string;
    name: string;
    department: string;
    table_area: string;
    shift?: {
        name: string;
        start_time: string;
        end_time: string;
    };
}

interface Announcement {
    id: string;
    content: string;
}

interface EmployeeDashboardProps {
    hideHeader?: boolean;
}

export default function EmployeeDashboard({ hideHeader = false }: EmployeeDashboardProps) {
    const router = useRouter();
    const supabase = createClient();
    const { showToast } = useToast();

    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [orderStatus, setOrderStatus] = useState<'eating' | 'not_eating'>('not_eating');
    const [userName, setUserName] = useState('Đăng Rice');
    const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
    const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([
        { id: '1', content: '🎉 Thực đơn tuần mới đã được cập nhật! Vui lòng đăng ký trước 16:00 mỗi ngày.' },
        { id: '2', content: '📢 Lưu ý: Ngày 30/06 công ty có tiệc buffet trưa tại sảnh chính.' },
        { id: '3', content: '⚠️ Hệ thống sẽ bảo trì vào lúc 22:00 tối nay.' },
    ]);
    const [monthlyEatingDays, setMonthlyEatingDays] = useState(0);
    const [registrationDeadline, setRegistrationDeadline] = useState('05:00');
    const [deadlineOffset, setDeadlineOffset] = useState(0);
    const [totalGroupMembers, setTotalGroupMembers] = useState(0);
    const [memberPage, setMemberPage] = useState(1);
    const MEMBERS_PER_PAGE = 4;
    const [showCalendar, setShowCalendar] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data: profile } = await supabase
                .from('users')
                .select(`*, groups(*, shifts(*))`)
                .eq('email', user.email)
                .single();

            if (profile) {
                setUserName(profile.full_name || 'Đăng Rice');


                // Set default group info first based on user profile
                let currentGroupInfo: GroupInfo = {
                    id: profile.group_id || 'default',
                    name: '-',
                    department: profile.department || 'Chưa cập nhật',
                    table_area: '-',
                    shift: {
                        name: profile.shift || '-',
                        start_time: '11:00',
                        end_time: '13:00'
                    }
                };

                // If user belongs to a group, fetch group details
                if (profile.groups) {
                    // Check if groups is an array or object (Supabase returns array for 1:N but we used single())
                    // Based on query `groups(*, shifts(*))`, usually returns object if One-to-One or many if One-to-Many
                    // Here we treat it as an object
                    const groupData = Array.isArray(profile.groups) ? profile.groups[0] : profile.groups;
                    if (groupData) {
                        currentGroupInfo = {
                            ...currentGroupInfo,
                            id: groupData.id,
                            name: groupData.name,
                            table_area: groupData.table_area || 'Khu vực chung',
                        };
                        // If group has shift info, we might use it, but user's shift takes precedence if set
                    }
                }

                setGroupInfo(currentGroupInfo);


                setGroupInfo(currentGroupInfo);


                const today = toLocalDateString(new Date());
                const { data: orderData } = await supabase
                    .from('orders')
                    .select('status')
                    .eq('user_id', profile.id)
                    .eq('date', today)
                    .single();

                setOrderStatus(orderData?.status || 'eating');

                if (profile.group_id) {
                    // First, get total count of members in group
                    const { count } = await supabase
                        .from('users')
                        .select('*', { count: 'exact', head: true })
                        .eq('group_id', profile.group_id);

                    setTotalGroupMembers(count || 0);

                    // Then fetch first page of members (0-3 = first 4)
                    const { data: members } = await supabase
                        .from('users')
                        .select('id, full_name, email, role')
                        .eq('group_id', profile.group_id)
                        .range(0, MEMBERS_PER_PAGE - 1);

                    if (members) {
                        // Don't fetch individual order status - RLS prevents employees from seeing others' orders
                        // This is a security feature, not a bug
                        setGroupMembers(members as GroupMember[]);
                    }
                }

                const { data: announcementsData } = await supabase
                    .from('announcements')
                    .select('id, content')
                    .eq('active', true)
                    .order('created_at', { ascending: false })
                    .limit(5);
                setAnnouncements(announcementsData || []);

                const startOfMonth = toLocalDateString(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
                const endOfMonth = toLocalDateString(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));
                const { data: monthlyOrders } = await supabase
                    .from('orders')
                    .select('status')
                    .eq('user_id', profile.id)
                    .eq('status', 'eating')
                    .gte('date', startOfMonth)
                    .lte('date', endOfMonth);
                setMonthlyEatingDays(monthlyOrders?.length || 0);

                // Fetch deadline and offset
                const { data: settingsData } = await supabase
                    .from('system_settings')
                    .select('key, value')
                    .in('key', ['registration_deadline', 'registration_deadline_offset']);

                if (settingsData) {
                    const time = settingsData.find(s => s.key === 'registration_deadline')?.value;
                    const offset = settingsData.find(s => s.key === 'registration_deadline_offset')?.value;
                    if (time) setRegistrationDeadline(time);
                    if (offset) setDeadlineOffset(parseInt(offset));
                }
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSliderClick = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;


            const { data: profile } = await supabase
                .from('users')
                .select('id, tenant_id')
                .eq('email', user.email)
                .single();

            if (!profile) return;

            const newStatus = orderStatus === 'eating' ? 'not_eating' : 'eating';
            const today = toLocalDateString(new Date());

            const { error } = await supabase
                .from('orders')
                .upsert({
                    tenant_id: profile.tenant_id,  // REQUIRED for RLS
                    user_id: profile.id,
                    date: today,
                    status: newStatus,
                    locked: false,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'tenant_id,user_id,date' });

            if (error) throw error;


            // Get current deadline for penalty tracking
            const { data: deadlineSettings } = await supabase
                .from('system_settings')
                .select('key, value')
                .in('key', ['registration_deadline', 'registration_deadline_offset']);

            const deadlineTime = deadlineSettings?.find(s => s.key === 'registration_deadline')?.value || '05:00';
            const deadlineOffsetDays = parseInt(deadlineSettings?.find(s => s.key === 'registration_deadline_offset')?.value || '1');

            // Calculate actual deadline datetime for THIS meal (deadline is for NEXT day's meal)
            const targetDate = new Date(today);
            targetDate.setDate(targetDate.getDate() + deadlineOffsetDays);
            const targetDateStr = toLocalDateString(targetDate);
            const deadlineDateTime = new Date(targetDateStr + 'T' + deadlineTime + ':00+07:00');

            const currentTime = new Date();
            const isLateAction = currentTime > deadlineDateTime && newStatus === 'not_eating';

            // Enhanced log activity for audit trail and penalty tracking
            await supabase.from('activity_logs').insert({
                tenant_id: profile.tenant_id,  // REQUIRED for RLS
                action: newStatus === 'eating' ? 'meal_registration' : 'meal_cancellation',
                performed_by: profile.id,
                target_type: 'order',
                target_id: profile.id,
                details: {
                    // Original fields
                    date: today,
                    status: newStatus,
                    previous_status: orderStatus,

                    // NEW: Penalty system support
                    action_timestamp: currentTime.toISOString(),
                    deadline: deadlineDateTime.toISOString(),
                    is_late: isLateAction,
                    minutes_late: isLateAction ? Math.floor((currentTime.getTime() - deadlineDateTime.getTime()) / 60000) : 0,

                    // User context
                    user_name: userName,
                    user_email: user.email,

                    // Optional: System context (for audit)
                    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
                    platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown'
                }
            });

            setOrderStatus(newStatus);
            showToast(
                `✅ Đã ${newStatus === 'eating' ? 'đăng ký ăn' : 'hủy suất ăn'}!`,
                newStatus === 'eating' ? '🍚' : '❌',
                3000
            );
            fetchDashboardData();
        } catch (error) {
            console.error('Error:', error);
            showToast('❌ Không thể cập nhật!', '⚠️', 4000);
        }
    };

    const formatTime = (time: string) => time?.substring(0, 5) || '';

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const loadMemberPage = async (page: number) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('users')
                .select('group_id')
                .eq('email', user.email)
                .single();

            if (!profile?.group_id) return;

            const from = (page - 1) * MEMBERS_PER_PAGE;
            const to = from + MEMBERS_PER_PAGE - 1;

            const { data: members } = await supabase
                .from('users')
                .select('id, full_name, email, role')
                .eq('group_id', profile.group_id)
                .range(from, to);

            if (members) {
                // Don't fetch individual order status - RLS prevents employees from seeing others' orders
                setGroupMembers(members as GroupMember[]);
                setMemberPage(page);
            }
        } catch (error) {
            console.error('Error loading member page:', error);
        }
    };

    const getStatusIcon = (status: string | null | undefined) => {
        if (status === 'eating') return <Icon name="check_circle" className="text-green-500 text-[20px]" />;
        if (status === 'not_eating') return <Icon name="cancel" className="text-red-400 text-[20px]" />;
        return <Icon name="radio_button_unchecked" className="text-slate-300 text-[20px]" />;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#FFFBF7] dark:bg-[#12100E] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[#B24700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">Đang tải...</p>
                </div>
            </div>
        );
    }

    // If showing calendar view, render calendar component
    if (showCalendar) {
        return <BulkRegistrationCalendar onClose={() => setShowCalendar(false)} />;
    }

    return (
        <div className={`min-h-screen bg-[#FFFBF7] dark:bg-[#12100E] text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : ''}`}>
            {/* Header - Hide khi được render bởi Admin Dashboard */}
            {!hideHeader && (
                <DashboardHeader userName={userName} userRole="employee" />
            )}


            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 py-6 md:px-6 md:py-10">
                {/* Announcement Marquee */}
                {announcements.length > 0 && (
                    <div className="mb-8 overflow-hidden rounded-2xl bg-orange-50 dark:bg-orange-900/20 border border-[#B24700]/20 flex items-center shadow-sm">
                        <div className="bg-[#B24700] px-4 py-3 text-white flex items-center gap-2 z-10 shadow-lg">
                            <Icon name="campaign" className="text-[20px]" />
                            <span className="font-extrabold whitespace-nowrap text-sm uppercase tracking-wider">Thông báo từ Admin</span>
                        </div>
                        <div className="flex-1 overflow-hidden relative h-full flex items-center">
                            <p className="animate-marquee text-[#8F3900] dark:text-orange-300 font-bold text-sm px-4">
                                {announcements.map((a, i) => `${a.content}${i < announcements.length - 1 ? ' | ' : ''}`).join('')}
                            </p>
                        </div>
                    </div>
                )}

                {/* Welcome */}
                <div className="mb-6 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">Chào buổi trưa!</h1>
                        <p className="text-slate-600 dark:text-slate-400 text-lg font-medium mb-4">
                            Hôm nay bạn đã được ghi nhận trạng thái: <span className={`font-bold ${orderStatus === 'eating' ? 'text-green-600' : 'text-[#D12B37]'}`}>
                                {orderStatus === 'eating' ? 'Đã đăng ký ăn' : 'Đã báo nghỉ'}
                            </span>.
                        </p>
                    </div>

                    {/* Calendar Toggle Button */}
                    <button
                        onClick={() => setShowCalendar(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-[#B24700] hover:bg-[#8F3900] text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all"
                    >
                        <Icon name="calendar_month" className="text-[20px]" />
                        Đăng ký theo lịch
                    </button>
                </div>

                {/* Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
                    {/* Main Status Card */}
                    <div className={`md:col-span-1 ${orderStatus === 'eating' ? 'bg-green-600' : 'bg-[#D12B37]'} rounded-3xl p-5 md:p-6 text-white flex flex-col justify-between items-center text-center shadow-2xl shadow-red-900/40 dark:shadow-none min-h-[220px] md:min-h-[300px] relative overflow-hidden group transition-colors duration-500`}>
                        <div className="absolute top-0 left-0 w-full h-1 bg-white/20"></div>

                        <div className="z-10">
                            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-white/80">TRẠNG THÁI HIỆN TẠI</span>
                            <h2 className="text-3xl font-black mt-2 drop-shadow-md">
                                {orderStatus === 'eating' ? 'Đã đăng ký ăn' : 'Đã báo nghỉ'}
                            </h2>
                            <div className="mt-2 w-12 h-1 bg-white/40 mx-auto rounded-full"></div>
                        </div>

                        {/* Button */}
                        <div className="w-full relative z-10">
                            <button
                                onClick={handleSliderClick}
                                className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full py-4 px-6 flex items-center justify-center gap-3 border border-white/30 shadow-inner transition-all active:scale-95"
                            >
                                <Icon name="restaurant" className="text-white text-[24px]" />
                                <span className="text-white font-black text-sm uppercase tracking-widest">
                                    {orderStatus === 'eating' ? 'BẤM ĐỂ HỦY ĂN' : 'BẤM ĐỂ ĐĂNG KÝ LẠI'}
                                </span>
                                <Icon name="double_arrow" className="text-white text-[18px]" />
                            </button>
                        </div>

                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    </div>

                    {/* Info Cards */}
                    <div className="bg-white dark:bg-[#1E1A17] rounded-3xl px-4 py-5 md:p-6 flex flex-col items-center justify-center text-center shadow-md border border-orange-100 dark:border-white/5 hover:border-[#B24700]/40 transition-all group">
                        <div className="w-16 h-16 bg-orange-100 dark:bg-[#B24700]/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                            <Icon name="notifications_active" className="text-[32px] text-[#B24700] font-bold" />
                        </div>
                        <h3 className="text-[11px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-[0.2em] mb-1">CẬP NHẬT</h3>
                        <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
                            {orderStatus === 'eating' ? 'Đã đăng ký' : 'Đã báo nghỉ'}
                        </p>
                    </div>

                    <div className="bg-white dark:bg-[#1E1A17] rounded-3xl px-4 py-5 md:p-6 flex flex-col items-center justify-center text-center shadow-md border border-orange-100 dark:border-white/5 hover:border-[#B24700]/40 transition-all group">
                        <div className="w-16 h-16 bg-orange-100 dark:bg-[#B24700]/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                            <Icon name="event_available" className="text-[32px] text-[#B24700] font-bold" />
                        </div>
                        <h3 className="text-[11px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-[0.2em] mb-1">HẠN ĐĂNG KÝ</h3>
                        <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
                            {registrationDeadline}
                            <span className="text-xs font-semibold text-slate-500 ml-1 block">
                                {(() => {
                                    const d = new Date();
                                    d.setDate(d.getDate() + deadlineOffset);
                                    return `(${d.getDate()}/${d.getMonth() + 1})`;
                                })()}
                            </span>
                        </p>
                    </div>

                    <div className="bg-white dark:bg-[#1E1A17] rounded-3xl px-4 py-5 md:p-6 flex flex-col items-center justify-center text-center shadow-md border border-orange-100 dark:border-white/5 hover:border-[#B24700]/40 transition-all group">
                        <div className="w-16 h-16 bg-orange-100 dark:bg-[#B24700]/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                            <Icon name="calendar_month" className="text-[32px] text-[#B24700] font-bold" />
                        </div>
                        <h3 className="text-[11px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-[0.2em] mb-1">THÁNG NÀY</h3>
                        <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{monthlyEatingDays} ngày ăn</p>
                    </div>
                </div>

                {/* Group Schedule */}
                {
                    groupInfo && (
                        <div className="mb-12">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-[#B24700] rounded-lg text-white">
                                    <Icon name="groups" className="block" />
                                </div>
                                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Lịch ăn theo nhóm</h2>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                                {/* Group Info */}
                                <div className="lg:col-span-1 bg-white dark:bg-[#1E1A17] rounded-3xl p-5 md:p-8 shadow-md border border-orange-100 dark:border-white/10 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-6 opacity-5">
                                        <Icon name="badge" className="text-[120px]" />
                                    </div>

                                    <div className="relative z-10">
                                        <div className="mb-6">
                                            <p className="text-[11px] font-black text-[#B24700] uppercase tracking-[0.2em] mb-2">Thông tin định danh</p>
                                            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1">Nhóm: {groupInfo.name}</h3>
                                            <p className="text-slate-500 dark:text-slate-400 font-medium">{groupInfo.department}</p>
                                        </div>

                                        <div className="space-y-4">
                                            {groupInfo.shift && (
                                                <div className="flex items-center gap-4 bg-orange-50 dark:bg-[#B24700]/10 p-4 rounded-2xl border border-[#B24700]/10">
                                                    <div className="w-12 h-12 rounded-xl bg-[#B24700] text-white flex items-center justify-center shadow-sm">
                                                        <Icon name="schedule" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-[#B24700]/70 uppercase">Ca ăn của bạn</p>
                                                        <p className="text-lg font-black text-[#B24700]">
                                                            {formatTime(groupInfo.shift.start_time)} - {formatTime(groupInfo.shift.end_time)}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-4 bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/5">
                                                <div className="w-12 h-12 rounded-xl bg-slate-800 text-white flex items-center justify-center">
                                                    <Icon name="location_on" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Khu vực bàn</p>
                                                    <p className="text-lg font-black text-slate-800 dark:text-slate-200">{groupInfo.table_area}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Group Members */}
                                <div className="lg:col-span-2 bg-white dark:bg-[#1E1A17] rounded-3xl p-5 md:p-8 shadow-md border border-orange-100 dark:border-white/10">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Thành viên nhóm ({totalGroupMembers})</h3>

                                        {/* Pagination Controls */}
                                        {totalGroupMembers > MEMBERS_PER_PAGE && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => loadMemberPage(memberPage - 1)}
                                                    disabled={memberPage === 1}
                                                    className="p-2 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                                    aria-label="Trang trước"
                                                >
                                                    <Icon name="chevron_left" className="text-[#B24700]" />
                                                </button>
                                                <span className="text-sm font-bold text-slate-600 dark:text-slate-400 min-w-[80px] text-center">
                                                    Trang {memberPage}/{Math.ceil(totalGroupMembers / MEMBERS_PER_PAGE)}
                                                </span>
                                                <button
                                                    onClick={() => loadMemberPage(memberPage + 1)}
                                                    disabled={memberPage >= Math.ceil(totalGroupMembers / MEMBERS_PER_PAGE)}
                                                    className="p-2 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                                    aria-label="Trang sau"
                                                >
                                                    <Icon name="chevron_right" className="text-[#B24700]" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {groupMembers.map((member) => (
                                            <div key={member.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-orange-50 dark:hover:bg-[#B24700]/5 transition-colors border border-transparent hover:border-[#B24700]/20">
                                                <div className="w-12 h-12 rounded-full bg-[#B24700]/10 border-2 border-white shadow-sm flex items-center justify-center">
                                                    <span className="text-sm font-bold text-[#B24700]">
                                                        {member.full_name.substring(0, 2).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold text-slate-900 dark:text-white">{member.full_name}</p>
                                                    <p className="text-xs text-slate-500 font-medium">{member.role}</p>
                                                </div>
                                                {getStatusIcon(member.order_status)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Instructions */}
                <div className="bg-white dark:bg-[#1E1A17] rounded-3xl p-5 md:p-8 shadow-sm border border-orange-100 dark:border-white/5">
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-8 flex items-center gap-2">
                        <Icon name="info" className="text-[#B24700]" />
                        Hướng dẫn sử dụng
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="flex gap-4 items-start">
                            <div className="w-12 h-12 shrink-0 bg-orange-100 dark:bg-[#B24700]/10 rounded-xl flex items-center justify-center text-[#B24700] shadow-sm">
                                <Icon name="swipe" className="font-bold" />
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                                Trượt thanh gạt tại thẻ "Trạng thái" để đăng ký hoặc báo nghỉ bữa ăn trong ngày.
                            </p>
                        </div>

                        <div className="flex gap-4 items-start">
                            <div className="w-12 h-12 shrink-0 bg-orange-100 dark:bg-[#B24700]/10 rounded-xl flex items-center justify-center text-[#B24700] shadow-sm">
                                <Icon name="timer" className="font-bold" />
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                                Theo dõi Deadline và Thông báo từ Admin để không bỏ lỡ thời gian đăng ký suất ăn.
                            </p>
                        </div>

                        <div className="flex gap-4 items-start">
                            <div className="w-12 h-12 shrink-0 bg-orange-100 dark:bg-[#B24700]/10 rounded-xl flex items-center justify-center text-[#B24700] shadow-sm">
                                <Icon name="restaurant_menu" className="font-bold" />
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                                Kiểm tra lịch ăn theo nhóm để biết chính xác thời gian và vị trí chỗ ngồi của bạn.
                            </p>
                        </div>
                    </div>
                </div>
            </main >

            {/* Footer */}
            < footer className="mt-auto py-12 text-center border-t border-orange-100 dark:border-white/5 bg-white/50 dark:bg-black/20" >
                <p className="text-slate-500 dark:text-slate-500 text-sm font-bold">
                    Hệ thống Cơm Ngon - Quản lý suất ăn công nghiệp.{' '}
                    <a className="text-[#B24700] font-black hover:underline underline-offset-4 ml-1" href="#">Chính sách bảo mật</a>
                </p>
                <div className="mt-8 flex justify-center opacity-30 hover:opacity-100 transition-opacity">
                    <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                        <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" />
                    </svg>
                </div>
            </footer >
        </div >
    );
}
