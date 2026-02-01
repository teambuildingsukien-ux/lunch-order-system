'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import KitchenDashboard from '../../kitchen/_components/KitchenDashboard';
import EmployeeDashboard from '../EmployeeDashboard';
import { createClient } from '@/lib/supabase/client';
import EmployeeManagement from './employees/EmployeeManagement';
import ShiftGroupManagement from './shifts-groups/ShiftGroupManagement';
import UrgentNotificationModal from './overview/UrgentNotificationModal';
import AnnouncementsHistoryModal from './overview/AnnouncementsHistoryModal';
import DeadlineSettingModal from './overview/DeadlineSettingModal';
import CookingDaysSettingModal from './overview/CookingDaysSettingModal';
import ActivityHistoryModal from './overview/ActivityHistoryModal';
import ActivityLogsPage from './activitylogs/ActivityLogsPage';
import AutoResetSettingModal from './overview/AutoResetSettingModal';
import ForecastCards from './ForecastCards';

// Material Symbol Icon component
const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

// Types
interface DashboardStats {
    totalRegistered: number;
    notRegistered: number;
    cancelRate: number;
}

interface WeeklyData {
    day: string;
    date: string;
    registered: number;
    actual: number;
}

interface RecentActivity {
    id: string;
    user_name: string;
    email: string;
    department?: string;
    shift?: string;
    group_name?: string;
    eating_status: string;        // Trạng thái đăng ký ăn (cho cột HÀNH ĐỘNG)
    employee_status: string;      // Trạng thái nhân viên (cho cột TRẠNG THÁI)
    status: string;               // Legacy field for compatibility
    time: string;
}

/**
 * Admin Manager Dashboard
 * Analytics dashboard với sidebar navigation cho Admin/HR roles
 *
 * Features:
 * - Sidebar navigation (Tổng quan, Nhân viên, Thực đơn, Báo cáo, Chat)
 * - Stats cards (Tổng đăng ký, Chưa đăng ký, Tỷ lệ hủy)
 * - Weekly registration chart
 * - Quick actions (Gửi thông báo nhắc nhở)
 * - Real-time status table
 */
export default function AdminManagerDashboard() {
    const router = useRouter();
    const supabase = createClient();
    const [activeSidebarItem, setActiveSidebarItem] = useState('dashboard');
    const [isLoading, setIsLoading] = useState(true);
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    const [showAnnouncementsHistoryModal, setShowAnnouncementsHistoryModal] = useState(false);
    const [showDeadlineModal, setShowDeadlineModal] = useState(false);
    const [showCookingDaysModal, setShowCookingDaysModal] = useState(false);
    const [showActivityHistoryModal, setShowActivityHistoryModal] = useState(false);
    const [showAutoResetModal, setShowAutoResetModal] = useState(false);
    const [cookingDays, setCookingDays] = useState<{ start_day: number; end_day: number }>({ start_day: 1, end_day: 5 });

    // View Mode State
    const [viewMode, setViewMode] = useState<'admin' | 'kitchen' | 'employee'>('admin');

    // Stats state
    const [stats, setStats] = useState<DashboardStats>({
        totalRegistered: 0,
        notRegistered: 0,
        cancelRate: 0
    });

    // Weekly chart data
    const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);

    // Recent activities
    const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
    const [totalEmployees, setTotalEmployees] = useState(14);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Filter state
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [statusFilter, setStatusFilter] = useState<'all' | 'eating' | 'not_eating' | 'not_registered'>('all');

    const [currentDate, setCurrentDate] = useState('');
    const [showMobileMenu, setShowMobileMenu] = useState(false);


    // Track previous filter values to reset page when filters change
    const prevFiltersRef = useRef({ selectedDate, statusFilter });

    useEffect(() => {
        // Initial fetch
        fetchCookingDays();
        fetchDashboardData();

        // Set current date for display
        const today = new Date();
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        setCurrentDate(today.toLocaleDateString('vi-VN', options));

        // Force reset selectedDate to today (prevent browser autofill)
        setSelectedDate(today.toISOString().split('T')[0]);

        // Setup Realtime subscriptions
        const ordersChannel = supabase
            .channel('orders-changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'orders' },
                () => {
                    console.log('Orders table changed, refreshing dashboard...');
                    fetchDashboardData();
                }
            )
            .subscribe();

        const usersChannel = supabase
            .channel('users-changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'users' },
                () => {
                    console.log('Users table changed, refreshing dashboard...');
                    fetchDashboardData();
                }
            )
            .subscribe();

        // Cleanup subscriptions on unmount
        return () => {
            supabase.removeChannel(ordersChannel);
            supabase.removeChannel(usersChannel);
        };
    }, []);

    // Re-fetch when page or filters change
    useEffect(() => {
        // Check if filters changed (not just page)
        const filtersChanged =
            prevFiltersRef.current.selectedDate !== selectedDate ||
            prevFiltersRef.current.statusFilter !== statusFilter;

        if (filtersChanged) {
            prevFiltersRef.current = { selectedDate, statusFilter };
            setCurrentPage(1); // Reset to page 1 when filters change
        }

        fetchDashboardData();
    }, [currentPage, selectedDate, statusFilter]);

    const fetchCookingDays = async () => {
        try {
            const response = await fetch('/api/admin/settings/cooking-days');
            if (response.ok) {
                const result = await response.json();
                setCookingDays(result.data);
            } else {
                // If API fails, use default Monday-Friday
                console.log('Using default cooking days: Monday-Friday');
                setCookingDays({ start_day: 1, end_day: 5 });
            }
        } catch (error) {
            console.error('Failed to fetch cooking days, using default:', error);
            // Fallback to default
            setCookingDays({ start_day: 1, end_day: 5 });
        }
    };

    const fetchDashboardData = async () => {
        try {
            setIsLoading(true);
            const today = new Date().toISOString().split('T')[0];

            // 1. Fetch today's stats
            // Count "Not Eating" explicitly (Báo nghỉ)
            const { count: notEatingCount } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('date', today)
                .eq('status', 'not_eating');

            // Count all users except kitchen staff
            const { count: totalEmployeesCount } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .not('role', 'ilike', 'kitchen');

            const totalEmployees = totalEmployeesCount || 14;
            // Registered = Total - Not Eating
            const totalRegistered = totalEmployees - (notEatingCount || 0);

            // Repurpose notRegistered to track "Reported Off" (Not Eating)
            const notRegistered = notEatingCount || 0;

            setStats({
                totalRegistered,
                notRegistered,
                cancelRate: 2.4
            });
            setTotalEmployees(totalEmployees);

            // 2. Fetch weekly data (last 7 days)
            const weekData: WeeklyData[] = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                const dayName = dayNames[date.getDay()];

                const dateDisplay = `${date.getDate()}/${date.getMonth() + 1}`;

                const { count: notEatingCount } = await supabase
                    .from('orders')
                    .select('*', { count: 'exact', head: true })
                    .eq('date', dateStr)
                    .eq('status', 'not_eating');

                const registered = (totalEmployees || 14) - (notEatingCount || 0);

                weekData.push({
                    day: dayName,
                    date: dateDisplay,
                    registered: registered,
                    actual: registered
                });
            }
            setWeeklyData(weekData);



            // 3. Fetch user activities with pagination and filters
            // First, get current user's tenant_id for filtering
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (!currentUser) {
                console.error('[AdminManagerDashboard] No authenticated user');
                setRecentActivities([]);
                setTotalPages(1);
                return;
            }

            const { data: currentProfile } = await supabase
                .from('users')
                .select('tenant_id')
                .eq('id', currentUser.id)
                .single();

            if (!currentProfile?.tenant_id) {
                console.error('[AdminManagerDashboard] Current user has no tenant_id');
                setRecentActivities([]);
                setTotalPages(1);
                return;
            }

            // Get ALL users from SAME TENANT only
            const { data: allUsers } = await supabase
                .from('users')
                .select(`
                    id,
                    full_name,
                    email,
                    department,
                    shift,
                    is_active,
                    group:groups(name)
                `)
                .eq('tenant_id', currentProfile.tenant_id) // ✅ TENANT FILTERING
                .order('full_name', { ascending: true });

            if (!allUsers) {
                setRecentActivities([]);
                setTotalPages(1);
                return;
            }

            // Then get orders for selected date
            const { data: ordersForDate } = await supabase
                .from('orders')
                .select('user_id, status, created_at')
                .eq('date', selectedDate);

            // Fetch activity logs for this date to get accurate timestamps
            // Filter by details.date to avoid UTC/VN timezone mismatch
            const { data: activityLogs } = await supabase
                .from('activity_logs')
                .select('performed_by, action, created_at, details')
                .in('action', ['meal_registration', 'meal_cancellation'])
                .filter('details->>date', 'eq', selectedDate)
                .order('created_at', { ascending: false });

            // Create maps for fast lookup
            const orderMap = new Map();
            ordersForDate?.forEach((order: any) => {
                orderMap.set(order.user_id, order);
            });

            // Create activity map (most recent activity per user for the date)
            const activityMap = new Map();
            activityLogs?.forEach((log: any) => {
                if (!activityMap.has(log.performed_by)) {
                    activityMap.set(log.performed_by, log);
                }
            });

            // Combine users with their orders and activity logs
            let combinedData = allUsers.map((user: any) => {
                const order = orderMap.get(user.id);
                const activity = activityMap.get(user.id);

                // Eating Status Logic: No record = Eating (Đã đăng ký)
                // Only explicitly 'not_eating' = Not Eating (Không ăn)
                let eatingStatus = 'Đã đăng ký';

                if (order && order.status === 'not_eating') {
                    eatingStatus = 'Không ăn';
                }

                return {
                    id: user.id,
                    user_name: user.full_name,
                    email: user.email,
                    department: user.department || '-',
                    shift: user.shift || '-',
                    group_name: user.group?.name || '-',
                    is_active: user.is_active !== false, // Default true nếu null/undefined
                    eating_status: eatingStatus, // Status đăng ký ăn (cho cột HÀNH ĐỘNG)
                    order_status: eatingStatus, // Legacy field (giữ để tương thích)
                    // Use activity log timestamp if available, fallback to order created_at
                    created_at: activity?.created_at || order?.created_at || null,
                    raw_status: order?.status || 'eating'
                };
            });

            // Apply status filter
            if (statusFilter === 'eating') {
                // Eating: raw_status is 'eating' OR null/undefined (default - người không báo nghỉ)
                combinedData = combinedData.filter(item => item.raw_status === 'eating' || !item.raw_status);
            } else if (statusFilter === 'not_eating') {
                // Not eating: raw_status is 'not_eating'
                combinedData = combinedData.filter(item => item.raw_status === 'not_eating');
            } else if (statusFilter === 'not_registered') {
                // No one is unregistered now
                combinedData = [];
            }

            // Calculate pagination
            const totalCount = combinedData.length;
            const pages = Math.ceil(totalCount / ITEMS_PER_PAGE);
            setTotalPages(pages);

            // Apply pagination
            const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
            const endIndex = startIndex + ITEMS_PER_PAGE;
            const paginatedData = combinedData.slice(startIndex, endIndex);

            // Format activities
            const activities = paginatedData.map((item: any) => {
                // Use the ALREADY MAPPED eating_status from combinedData
                // DON'T re-parse it, it's already been mapped correctly
                const eatingStatus = item.eating_status;

                // Employee status SYNCHRONIZED with eating status
                // Đã đăng ký → Hoạt động
                // Không ăn → Không hoạt động
                const employeeStatus = eatingStatus === 'Đã đăng ký'
                    ? 'Hoạt động'
                    : 'Không hoạt động';

                return {
                    id: item.id,
                    user_name: item.user_name,
                    email: item.email,
                    department: item.department,
                    shift: item.shift,
                    group_name: item.group_name,
                    eating_status: eatingStatus,
                    employee_status: employeeStatus,
                    status: eatingStatus, // Legacy field
                    time: item.created_at
                        ? new Date(item.created_at).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'Asia/Ho_Chi_Minh'  // Force Vietnam timezone
                        })
                        : '-'
                };
            });
            setRecentActivities(activities);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <div className="flex h-screen bg-[#f8f9fa] dark:bg-[#12100E]">
            {/* Sidebar - Conditional */}
            {viewMode === 'admin' && (
                <aside className="w-64 flex flex-col bg-white dark:bg-slate-900 border-r border-[#dbdfe6] dark:border-slate-800 hidden md:flex">
                    <div className="p-6 flex flex-col h-full">
                        {/* Mobile Menu Button - Visible in Sidebar? No, Sidebar IS hidden on mobile */}
                        <div className="flex items-center gap-4 mb-6">

                            <div>
                                <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">
                                    Meal Manager
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                    Văn phòng Admin
                                </p>
                            </div>
                        </div>

                        {/* View Switcher in Sidebar? No, kept in Header or top of Sidebar. 
                             Let's keep it consistent: Sidebar is for Admin Navigation. 
                             The View Switcher is global. */}

                        {/* Navigation */}
                        <nav className="flex flex-col gap-2 flex-grow">
                            <button
                                onClick={() => setActiveSidebarItem('dashboard')}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${activeSidebarItem === 'dashboard' ? 'font-semibold' : 'font-medium'} transition-colors ${activeSidebarItem === 'dashboard'
                                    ? 'bg-[#c04b00]/10 text-[#c04b00]'
                                    : 'text-[#606e8a] hover:bg-gray-100 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <Icon name="dashboard" className="text-[24px]" />
                                <span>Tổng quan</span>
                            </button>

                            <button
                                onClick={() => setActiveSidebarItem('employees')}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${activeSidebarItem === 'employees' ? 'font-semibold' : 'font-medium'} transition-colors ${activeSidebarItem === 'employees'
                                    ? 'bg-[#c04b00]/10 text-[#c04b00]'
                                    : 'text-[#606e8a] hover:bg-gray-100 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <Icon name="group" className="text-[24px]" />
                                <span>Danh sách nhân viên</span>
                            </button>

                            <button
                                onClick={() => setActiveSidebarItem('shifts-groups')}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${activeSidebarItem === 'shifts-groups' ? 'font-semibold' : 'font-medium'} transition-colors ${activeSidebarItem === 'shifts-groups'
                                    ? 'bg-[#c04b00]/10 text-[#c04b00]'
                                    : 'text-[#606e8a] hover:bg-gray-100 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <Icon name="schedule" className="text-[24px]" />
                                <span>Quản lý ca nhóm ăn</span>
                            </button>

                            <button
                                onClick={() => setActiveSidebarItem('activity-logs')}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${activeSidebarItem === 'activity-logs' ? 'font-semibold' : 'font-medium'} transition-colors ${activeSidebarItem === 'activity-logs'
                                    ? 'bg-[#c04b00]/10 text-[#c04b00]'
                                    : 'text-[#606e8a] hover:bg-gray-100 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <Icon name="history" className="text-[24px]" />
                                <span>Lịch sử hoạt động</span>
                            </button>
                        </nav>

                        {/* Logout Button */}
                        <div className="pt-4 border-t border-[#dbdfe6] dark:border-slate-800">
                            <button
                                onClick={handleLogout}
                                className="flex w-full items-center justify-center gap-2 rounded-lg h-10 bg-[#c04b00] text-white text-sm font-bold tracking-tight hover:opacity-90 transition-opacity"
                            >
                                <Icon name="logout" className="text-[20px]" />
                                <span>Đăng xuất</span>
                            </button>
                        </div>
                    </div>
                </aside>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header - Always Visible (or at least for Admin) */}
                <header className="sticky top-0 z-10 flex items-center justify-between bg-white dark:bg-slate-900 border-b border-[#dbdfe6] dark:border-slate-800 px-8 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            className="md:hidden p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                        >
                            <Icon name="menu" />
                        </button>
                        <div className="flex flex-col">
                            <h2 className="text-xl font-extrabold text-slate-800 dark:text-white hidden md:block">
                                {viewMode === 'admin' ? 'Bảng điều khiển quản lý' :
                                    viewMode === 'kitchen' ? 'Bảng điều khiển Bếp' : 'Giao diện Nhân viên'}
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden md:block">
                                {currentDate || new Date().toLocaleDateString('vi-VN')}
                            </p>
                        </div>
                    </div>

                    {/* View Switcher */}
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('admin')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'admin'
                                ? 'bg-white dark:bg-slate-700 text-[#b74b0c] shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                }`}
                        >
                            Quản trị
                        </button>
                        <button
                            onClick={() => setViewMode('kitchen')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'kitchen'
                                ? 'bg-white dark:bg-slate-700 text-[#b74b0c] shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                }`}
                        >
                            Bếp
                        </button>
                        <button
                            onClick={() => setViewMode('employee')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'employee'
                                ? 'bg-white dark:bg-slate-700 text-[#b74b0c] shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                }`}
                        >
                            Cá nhân
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        {viewMode === 'admin' && (
                            <>
                                <button
                                    onClick={() => setShowDeadlineModal(true)}
                                    className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/10 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all shadow-sm hover:shadow"
                                    title="Cài đặt hạn đăng ký"
                                >
                                    <Icon name="timer" className="text-[22px]" />
                                </button>
                                <button
                                    onClick={() => setShowAnnouncementsHistoryModal(true)}
                                    className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-900/10 text-[#c04b00] hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-all shadow-sm hover:shadow"
                                    title="Quản lý thông báo"
                                >
                                    <Icon name="notifications" className="text-[22px]" />
                                </button>
                                <button
                                    onClick={() => setShowActivityHistoryModal(true)}
                                    className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/10 text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all shadow-sm hover:shadow"
                                    title="Lịch sử hoạt động"
                                >
                                    <Icon name="history" className="text-[22px]" />
                                </button>
                                <button
                                    onClick={() => setShowCookingDaysModal(true)}
                                    className="p-2.5 rounded-xl bg-green-50 dark:bg-green-900/10 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-all shadow-sm hover:shadow"
                                    title="Cài đặt ngày nấu ăn"
                                >
                                    <Icon name="settings" className="text-[22px]" />
                                </button>
                                <button
                                    onClick={() => setShowAutoResetModal(true)}
                                    className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-900/10 text-teal-600 hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-all shadow-sm hover:shadow"
                                    title="Tự động đăng ký lại"
                                >
                                    <Icon name="autorenew" className="text-[22px]" />
                                </button>
                            </>
                        )}
                        {/* Generic Logout for other modes if sidebar is hidden? 
                            Actually, Kitchen/Employee dashboards might have their own headers OR we rely on this header.
                            KitchenDashboard has its own Header but we enabled hideHeader.
                            So we should provide Logout here if needed, or rely on internal logic.
                            Let's add Logout if NOT in admin mode (since Admin has sidebar logout)
                        */}
                        {viewMode !== 'admin' && (
                            <button
                                onClick={handleLogout}
                                className="p-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-slate-600 hover:bg-gray-200 transition-all"
                                title="Đăng xuất"
                            >
                                <Icon name="logout" className="text-[22px]" />
                            </button>
                        )}
                    </div>
                </header>

                {/* ADMIN VIEW */}
                {viewMode === 'admin' && (
                    <main className="flex-1 overflow-auto bg-[#F8F9FA] dark:bg-[#12100E] p-4 md:p-8">
                        {activeSidebarItem === 'dashboard' && (
                            <div className="space-y-8">
                                {/* Stats Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                                    {/* Card 1: Tổng đăng ký */}
                                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-[#dbdfe6] dark:border-slate-800 shadow-sm">
                                        <div className="flex justify-between items-start mb-4">
                                            <p className="text-[#606e8a] text-sm font-medium">Tổng suất ăn hôm nay</p>
                                            <Icon name="how_to_reg" className="text-[#c04b00]" />
                                        </div>
                                        <div className="flex items-end gap-3">
                                            <p className="text-3xl font-bold dark:text-white">
                                                {isLoading ? '...' : stats.totalRegistered}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Card 2: Chưa đăng ký */}
                                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-[#dbdfe6] dark:border-slate-800 shadow-sm">
                                        <div className="flex justify-between items-start mb-4">
                                            <p className="text-[#606e8a] text-sm font-medium">Báo nghỉ / Không ăn</p>
                                            <Icon name="pending_actions" className="text-orange-500" />
                                        </div>
                                        <div className="flex items-end gap-3">
                                            <p className="text-3xl font-bold dark:text-white">
                                                {isLoading ? '...' : stats.notRegistered}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Card 3: Tỷ lệ hủy */}
                                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-[#dbdfe6] dark:border-slate-800 shadow-sm">
                                        <div className="flex justify-between items-start mb-4">
                                            <p className="text-[#606e8a] text-sm font-medium">Tỷ lệ hủy</p>
                                            <Icon name="cancel" className="text-red-500" />
                                        </div>
                                        <div className="flex items-end gap-3">
                                            <p className="text-3xl font-bold dark:text-white">2.4%</p>
                                            <p className="text-[#07883b] text-sm font-semibold mb-1 flex items-center">
                                                <Icon name="trending_up" className="text-[18px]" /> +0.5%
                                            </p>
                                        </div>
                                    </div>

                                    {/* NEW: Forecast Cards for Tomorrow */}
                                    <ForecastCards />
                                </div>

                                {/* Chart & Quick Actions */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Weekly Chart */}
                                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-[#dbdfe6] dark:border-slate-800 shadow-sm">
                                        <div className="flex justify-between items-center mb-6">
                                            <div>
                                                <h3 className="text-lg font-bold dark:text-white">Thống kê suất ăn theo tuần</h3>
                                                <p className="text-sm text-[#606e8a]">Biểu đồ hiển thị theo cài đặt ngày nấu cơm</p>
                                            </div>
                                            <button
                                                onClick={() => setShowCookingDaysModal(true)}
                                                className="flex items-center gap-1 px-3 py-2 bg-[#f5f1ee] dark:bg-slate-800 hover:bg-[#dbdfe6] dark:hover:bg-slate-700 rounded-lg transition-colors"
                                            >
                                                <Icon name="settings" className="text-lg text-[#606e8a]" />
                                                <span className="text-xs font-bold text-[#606e8a]">Cài đặt</span>
                                            </button>
                                            <div className="flex gap-2">
                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-[#c04b00]/10 text-[#c04b00] text-xs font-bold rounded-full">
                                                    Tuần này: {weeklyData.reduce((sum, d) => sum + d.registered, 0)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Chart Bars */}
                                        <div className="relative h-[280px] w-full">
                                            {/* Grid lines for reference */}
                                            <div className="absolute inset-0 flex flex-col justify-end pb-12">
                                                <div className="border-t border-gray-200 dark:border-gray-700 opacity-30 h-0" style={{ marginBottom: '70px' }}></div>
                                                <div className="border-t border-gray-200 dark:border-gray-700 opacity-30 h-0" style={{ marginBottom: '70px' }}></div>
                                                <div className="border-t border-gray-200 dark:border-gray-700 opacity-30 h-0" style={{ marginBottom: '70px' }}></div>
                                            </div>

                                            {/* Bars container */}
                                            <div className="absolute inset-0 flex items-center justify-around px-2">
                                                {(() => {
                                                    // Filter weeklyData based on cooking_days setting
                                                    const { start_day, end_day } = cookingDays;
                                                    const filteredData = weeklyData.filter((dayData) => {
                                                        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                                                        const dayIndex = dayNames.indexOf(dayData.day);

                                                        // Handle wrap-around week (e.g., Sat to Mon)
                                                        if (start_day <= end_day) {
                                                            return dayIndex >= start_day && dayIndex <= end_day;
                                                        } else {
                                                            return dayIndex >= start_day || dayIndex <= end_day;
                                                        }
                                                    });

                                                    return filteredData.length > 0 ? filteredData.map((dayData, index) => {
                                                        const percentage = totalEmployees > 0 ? Math.round((dayData.registered / totalEmployees) * 100) : 0;
                                                        return (
                                                            <div key={dayData.day} className="flex flex-col items-center gap-2 flex-1 max-w-[60px]">
                                                                {/* Percentage label on top */}
                                                                <span className="text-xs font-bold text-primary mb-1">
                                                                    {percentage}%
                                                                </span>

                                                                {/* Bar with percentage fill */}
                                                                <div className="relative w-8 h-[180px] bg-[#c04b00]/20 rounded-lg overflow-hidden group">
                                                                    {/* Filled portion (from bottom) */}
                                                                    <div
                                                                        className="absolute bottom-0 left-0 right-0 bg-[#c04b00] transition-all rounded-b-lg"
                                                                        style={{ height: `${percentage}%` }}
                                                                    />

                                                                    {/* Hover tooltip */}
                                                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                                                                        {dayData.registered}/{totalEmployees}
                                                                    </div>
                                                                </div>

                                                                {/* Day label */}
                                                                <span className="text-xs font-bold text-[#606e8a] mt-1">{dayData.day}</span>
                                                                {/* Date label */}
                                                                <span className="text-[10px] bg-gray-100 dark:bg-slate-800 text-[#606e8a] px-1 rounded">
                                                                    {dayData.date}
                                                                </span>

                                                                {/* Count/Total label */}
                                                                <span className="text-[10px] font-semibold text-primary mt-0.5">
                                                                    {dayData.registered}/{totalEmployees}
                                                                </span>
                                                            </div>
                                                        );
                                                    }) : (
                                                        <div className="flex items-center justify-center w-full h-full">
                                                            <p className="text-sm text-[#606e8a]">Không có dữ liệu cho các ngày được chọn</p>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-[#dbdfe6] dark:border-slate-800 shadow-sm flex flex-col justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold dark:text-white mb-2">Thao tác nhanh</h3>
                                            <p className="text-sm text-[#606e8a] mb-6">
                                                Gửi thông báo đến toàn bộ nhân viên.
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => setIsNotificationModalOpen(true)}
                                            className="w-full py-3 bg-[#c04b00] text-white rounded-lg font-bold text-sm shadow-lg shadow-[#c04b00]/25 hover:opacity-90 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Icon name="send" className="text-[20px]" />
                                            Gửi thông báo
                                        </button>
                                    </div>
                                </div>

                                {/* Real-time Status Table */}
                                <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#dbdfe6] dark:border-slate-800 shadow-sm overflow-hidden">
                                    <div className="p-6 border-b border-[#dbdfe6] dark:border-slate-800">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-bold dark:text-white">Trạng thái thời gian thực</h3>
                                            <div className="flex items-center gap-2 text-[#c04b00] font-semibold text-sm">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c04b00] opacity-75" />
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c04b00]" />
                                                </span>
                                                Đang cập nhật
                                            </div>
                                        </div>

                                        {/* Filters Row */}
                                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                                            {/* Date Picker */}
                                            <div className="flex items-center gap-2">
                                                <Icon name="calendar_today" className="text-[20px] text-[#606e8a]" />
                                                <input
                                                    type="date"
                                                    value={selectedDate}
                                                    onChange={(e) => setSelectedDate(e.target.value)}
                                                    className="px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary dark:bg-slate-800 dark:text-white"
                                                />
                                            </div>

                                            {/* Status Filter Buttons */}
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setStatusFilter('all')}
                                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${statusFilter === 'all'
                                                        ? 'bg-primary text-white'
                                                        : 'bg-gray-100 dark:bg-slate-800 text-[#606e8a] dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                                                        }`}
                                                >
                                                    Tất cả
                                                </button>
                                                <button
                                                    onClick={() => setStatusFilter('eating')}
                                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${statusFilter === 'eating'
                                                        ? 'bg-green-600 text-white'
                                                        : 'bg-gray-100 dark:bg-slate-800 text-[#606e8a] dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                                                        }`}
                                                >
                                                    <Icon name="check_circle" className="inline text-[16px] mr-1" />
                                                    Đã đăng ký
                                                </button>
                                                <button
                                                    onClick={() => setStatusFilter('not_eating')}
                                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${statusFilter === 'not_eating'
                                                        ? 'bg-red-600 text-white'
                                                        : 'bg-gray-100 dark:bg-slate-800 text-[#606e8a] dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                                                        }`}
                                                >
                                                    <Icon name="cancel" className="inline text-[16px] mr-1" />
                                                    Không ăn
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-[#f5f6f8] dark:bg-slate-800/50">
                                                <tr>
                                                    <th className="px-6 py-3 text-xs font-bold text-[#606e8a] uppercase">Nhân viên</th>
                                                    <th className="px-6 py-3 text-xs font-bold text-[#606e8a] uppercase">Thông tin</th>
                                                    <th className="px-6 py-3 text-xs font-bold text-[#606e8a] uppercase">Thời gian</th>
                                                    <th className="px-6 py-3 text-xs font-bold text-[#606e8a] uppercase">Hành động</th>
                                                    <th className="px-6 py-3 text-xs font-bold text-[#606e8a] uppercase">Trạng thái</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#dbdfe6] dark:divide-slate-800">
                                                {isLoading ? (
                                                    <tr>
                                                        <td colSpan={5} className="px-6 py-8 text-center text-[#606e8a]">
                                                            Loading activities...
                                                        </td>
                                                    </tr>
                                                ) : recentActivities.length > 0 ? (
                                                    recentActivities.map((activity, index) => {
                                                        const colors = [
                                                            'from-blue-400 to-blue-600',
                                                            'from-pink-400 to-pink-600',
                                                            'from-purple-400 to-purple-600',
                                                            'from-green-400 to-green-600',
                                                            'from-orange-400 to-orange-600'
                                                        ];
                                                        const initials = activity.user_name
                                                            .split(' ')
                                                            .slice(-2)
                                                            .map(n => n[0])
                                                            .join('')
                                                            .toUpperCase();

                                                        return (
                                                            <tr key={activity.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`size-8 rounded-full bg-gradient-to-br ${colors[index % colors.length]} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                                                                            {initials}
                                                                        </div>
                                                                        <div>
                                                                            <div className="text-sm font-bold text-gray-900 dark:text-white">{activity.user_name}</div>
                                                                            <div className="text-xs text-[#606e8a]">{activity.email}</div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="flex flex-col gap-1">
                                                                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                                            <span className="text-[#606e8a]">PB:</span> {activity.department || '-'}
                                                                        </div>
                                                                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                                            <span className="text-[#606e8a]">Ca:</span> {activity.shift || '-'}
                                                                        </div>
                                                                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                                            <span className="text-[#606e8a]">Nhóm:</span> {activity.group_name || '-'}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 text-sm font-medium text-[#606e8a]">{activity.time}</td>
                                                                {/* HÀNH ĐỘNG column - Eating Status */}
                                                                <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">{activity.eating_status}</td>
                                                                {/* TRẠNG THÁI column - Employee Active Status */}
                                                                <td className="px-6 py-4">
                                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold ${activity.employee_status === 'Hoạt động'
                                                                        ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                                                                        : 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400'
                                                                        }`}>
                                                                        {activity.employee_status}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                ) : (
                                                    <tr>
                                                        <td colSpan={5} className="px-6 py-8 text-center text-[#606e8a]">
                                                            Không có hoạt động nào
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>

                                        {/* Pagination Controls */}
                                        {!isLoading && recentActivities.length > 0 && (
                                            <div className="px-6 py-4 border-t border-[#dbdfe6] dark:border-slate-800 flex items-center justify-between bg-background-light dark:bg-slate-800/50">
                                                <p className="text-sm text-[#606e8a] dark:text-slate-400">
                                                    Trang <span className="font-bold">{currentPage}</span> / <span className="font-bold">{totalPages}</span>
                                                </p>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                        disabled={currentPage === 1}
                                                        className="px-4 py-2 text-sm font-medium text-[#606e8a] dark:text-slate-400 hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#606e8a]"
                                                    >
                                                        <Icon name="chevron_left" className="text-[20px]" />
                                                    </button>

                                                    <div className="flex items-center gap-1">
                                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                            <button
                                                                key={page}
                                                                onClick={() => setCurrentPage(page)}
                                                                className={`min-w-[40px] h-10 px-3 text-sm font-medium rounded-lg transition-colors ${currentPage === page
                                                                    ? 'bg-primary text-white'
                                                                    : 'text-[#606e8a] dark:text-slate-400 hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20'
                                                                    }`}
                                                            >
                                                                {page}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    <button
                                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                        disabled={currentPage === totalPages}
                                                        className="px-4 py-2 text-sm font-medium text-[#606e8a] dark:text-slate-400 hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#606e8a]"
                                                    >
                                                        <Icon name="chevron_right" className="text-[20px]" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSidebarItem === 'employees' && (
                            <EmployeeManagement />
                        )}

                        {activeSidebarItem === 'shifts-groups' && (
                            <ShiftGroupManagement />
                        )}

                        {activeSidebarItem === 'activity-logs' && (
                            <ActivityLogsPage />
                        )}
                    </main>
                )}

                {/* KITCHEN VIEW */}
                {viewMode === 'kitchen' && (
                    <div className="flex-1 overflow-auto bg-[#FFFBF7] dark:bg-[#12100E]">
                        <KitchenDashboard hideHeader={true} />
                    </div>
                )}

                {/* EMPLOYEE VIEW */}
                {viewMode === 'employee' && (
                    <div className="flex-1 overflow-auto bg-[#FFFBF7] dark:bg-[#12100E]">
                        <EmployeeDashboard hideHeader={true} />
                    </div>
                )}

                <UrgentNotificationModal
                    isOpen={isNotificationModalOpen}
                    onClose={() => setIsNotificationModalOpen(false)}
                    unregisteredCount={stats.notRegistered}
                />

                <AnnouncementsHistoryModal
                    isOpen={showAnnouncementsHistoryModal}
                    onClose={() => setShowAnnouncementsHistoryModal(false)}
                />

                <DeadlineSettingModal
                    isOpen={showDeadlineModal}
                    onClose={() => setShowDeadlineModal(false)}
                />

                <CookingDaysSettingModal
                    isOpen={showCookingDaysModal}
                    onClose={() => setShowCookingDaysModal(false)}
                    onSuccess={() => {
                        fetchCookingDays();
                        fetchDashboardData();
                    }}
                />

                <ActivityHistoryModal
                    isOpen={showActivityHistoryModal}
                    onClose={() => setShowActivityHistoryModal(false)}
                />

                <AutoResetSettingModal
                    isOpen={showAutoResetModal}
                    onClose={() => setShowAutoResetModal(false)}
                    onSuccess={() => {
                        // Optional: Refetch dashboard data or show success message
                        console.log('Auto-reset settings saved successfully');
                    }}
                />
            </div>
        </div>
    );
}
