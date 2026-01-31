'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/providers/toast-provider';
import DashboardHeader from '@/app/dashboard/_components/DashboardHeader';


const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

interface Employee {
    id: string;
    full_name: string;
    email: string;
    role: string;
    department?: string;
    order_status?: 'eating' | 'not_eating' | null;
    order_time?: string;
}

interface DailyStats {
    total: number;
    eating: number;
    not_eating: number;
    pending: number;
}

interface GroupStat {
    id: string;
    name: string;
    shift_time: string;
    table_area: string;
    employee_count: number;
}

interface KitchenDashboardProps {
    hideHeader?: boolean;
}

export default function KitchenDashboard({ hideHeader = false }: KitchenDashboardProps) {
    const router = useRouter();
    const supabase = createClient();
    const { showToast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<DailyStats>({ total: 0, eating: 0, not_eating: 0, pending: 0 });
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [groupStats, setGroupStats] = useState<GroupStat[]>([]);
    const [currentGroupPage, setCurrentGroupPage] = useState(0);
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 20;

    const departments = [
        'Tất cả phòng ban',
        'Công nghệ thông tin',
        'Kế toán - Tài chính',
        'Nhân sự',
        'Kinh doanh & Marketing',
        'Sản xuất',
        'Bảo vệ & Tạp vụ'
    ];

    useEffect(() => {
        fetchDashboardData();
    }, [selectedDepartment, selectedDate, currentPage]);

    const fetchDashboardData = async () => {
        try {
            setIsLoading(true);

            // Count all users except kitchen staff (admin + employees = 11 people need meals)
            const { count: totalUsers } = await supabase
                .from('users')
                .select('id', { count: 'exact', head: true })
                .not('role', 'ilike', 'kitchen');

            const { data: ordersToday } = await supabase
                .from('orders')
                .select('status')
                .eq('date', selectedDate);

            // Default Eating Logic
            const notEatingCount = ordersToday?.filter(o => o.status === 'not_eating').length || 0;
            const eatingCount = Math.max(0, (totalUsers || 0) - notEatingCount);
            const pendingCount = 0;

            setStats({ total: totalUsers || 0, eating: eatingCount, not_eating: notEatingCount, pending: pendingCount });

            const offset = (currentPage - 1) * itemsPerPage;
            let query = supabase
                .from('users')
                .select('id, full_name, email, role, department', { count: 'exact' })
                .not('role', 'ilike', 'kitchen');

            if (selectedDepartment !== 'all' && selectedDepartment !== 'Tất cả phòng ban') {
                query = query.eq('department', selectedDepartment);
            }

            const { data: usersData, count } = await query.range(offset, offset + itemsPerPage - 1).order('full_name');

            if (count) {
                setTotalPages(Math.ceil(count / itemsPerPage));
            }

            if (usersData) {
                const employeesWithStatus = await Promise.all(
                    usersData.map(async (user) => {
                        const { data: order } = await supabase
                            .from('orders')
                            .select('status, created_at')
                            .eq('user_id', user.id)
                            .eq('date', selectedDate)
                            .single();
                        return { ...user, order_status: order?.status || 'eating', order_time: order?.created_at || null };
                    })
                );
                setEmployees(employeesWithStatus);
            }

            const { data: groups } = await supabase.from('groups').select('id, name, table_area, shifts(start_time, end_time)');

            if (groups) {
                const groupsWithCounts = await Promise.all(
                    groups.map(async (group: any) => {
                        const { count } = await supabase
                            .from('users')
                            .select('id', { count: 'exact', head: true })
                            .eq('group_id', group.id);
                        return {
                            id: group.id,
                            name: group.name,
                            shift_time: group.shifts ? `${group.shifts.start_time.substring(0, 5)} - ${group.shifts.end_time.substring(0, 5)}` : 'N/A',
                            table_area: group.table_area || 'Chưa định nghĩa',
                            employee_count: count || 0
                        };
                    })
                );
                setGroupStats(groupsWithCounts);
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('❌ Không thể tải dữ liệu', '⚠️', 4000);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const getStatusBadge = (status: string | null | undefined) => {
        if (status === 'eating') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Đã báo ăn
                </span>
            );
        }
        if (status === 'not_eating') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    Đã báo nghỉ
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Chưa báo
            </span>
        );
    };

    const formatDateTime = (dateTime: string | null | undefined) => {
        if (!dateTime) return <span className="text-slate-400 dark:text-slate-500 italic">Chưa ghi nhận</span>;
        const date = new Date(dateTime);
        return `${date.toLocaleDateString('vi-VN')} ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
    };

    const getInitials = (name: string) => {
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const getAvatarColor = (index: number) => {
        const colors = ['bg-[#b74b0c]/10 text-[#b74b0c]', 'bg-purple-100 text-purple-600', 'bg-amber-100 text-amber-600', 'bg-teal-100 text-teal-600', 'bg-pink-100 text-pink-600', 'bg-blue-100 text-blue-600'];
        return colors[index % colors.length];
    };

    const [showUserMenu, setShowUserMenu] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[#b74b0c] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">Đang tải...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-[#FFFBF7] dark:bg-[#12100E] text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : ''}`}>
            {!hideHeader && <DashboardHeader userName="Chị Huệ" userRole="kitchen" />}

            <main className="flex-1 w-full max-w-7xl mx-auto px-6 lg:px-20 py-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Tổng nhân viên</span>
                            <Icon name="groups" className="text-[#b74b0c] bg-[#b74b0c]/10 p-2 rounded-lg" />
                        </div>
                        <p className="text-3xl font-extrabold">{stats.total.toLocaleString()}</p>
                        <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                            <Icon name="trending_up" className="text-sm font-bold" />
                            <span>0% so với hôm qua</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Đã báo ăn</span>
                            <Icon name="check_circle" className="text-emerald-500 bg-emerald-500/10 p-2 rounded-lg" />
                        </div>
                        <p className="text-3xl font-extrabold">{stats.eating.toLocaleString()}</p>
                        <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                            <Icon name="trending_up" className="text-sm font-bold" />
                            <span>+2% so với hôm qua</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Đã báo nghỉ</span>
                            <Icon name="cancel" className="text-rose-500 bg-rose-500/10 p-2 rounded-lg" />
                        </div>
                        <p className="text-3xl font-extrabold">{stats.not_eating.toLocaleString()}</p>
                        <div className="flex items-center gap-1 text-xs font-semibold text-rose-600">
                            <Icon name="trending_down" className="text-sm font-bold" />
                            <span>-1% so với hôm qua</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Chưa báo</span>
                            <Icon name="pending" className="text-amber-500 bg-amber-500/10 p-2 rounded-lg" />
                        </div>
                        <p className="text-3xl font-extrabold">{stats.pending.toLocaleString()}</p>
                        <div className="flex items-center gap-1 text-xs font-semibold text-rose-600">
                            <Icon name="trending_down" className="text-sm font-bold" />
                            <span>-1% so với hôm qua</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-8">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="w-full sm:w-64">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Phòng ban</label>
                                <div className="relative">
                                    <select
                                        value={selectedDepartment}
                                        onChange={(e) => { setSelectedDepartment(e.target.value); setCurrentPage(1); }}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm appearance-none focus:ring-2 focus:ring-[#b74b0c]/20 focus:border-[#b74b0c] outline-none transition-all"
                                    >
                                        {departments.map(dept => (
                                            <option key={dept} value={dept === 'Tất cả phòng ban' ? 'all' : dept}>{dept}</option>
                                        ))}
                                    </select>
                                    <Icon name="expand_more" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xl" />
                                </div>
                            </div>

                            <div className="w-full sm:w-48">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Ngày xem</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => { setSelectedDate(e.target.value); setCurrentPage(1); }}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#b74b0c]/20 focus:border-[#b74b0c] outline-none transition-all"
                                    />
                                    <Icon name="calendar_today" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xl" />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-end h-full">
                            <button className="bg-[#b74b0c] hover:bg-[#9a3e0a] text-white px-6 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-[#b74b0c]/20 transition-all">
                                <Icon name="download" className="text-lg" />
                                Xuất báo cáo (Excel)
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50">
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Nhân viên</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Phòng ban</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Trạng thái</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Thời gian đăng ký</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {employees.map((emp, idx) => (
                                    <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${getAvatarColor(idx)}`}>
                                                    {getInitials(emp.full_name)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm">{emp.full_name}</p>
                                                    <p className="text-xs text-slate-500">{emp.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium">{emp.department || 'N/A'}</td>
                                        <td className="px-6 py-4">{getStatusBadge(emp.order_status)}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{formatDateTime(emp.order_time)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-slate-400 hover:text-[#b74b0c] transition-colors">
                                                <Icon name="more_horiz" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <p className="text-xs font-medium text-slate-500">
                            Đang hiển thị {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, stats.total)} trên tổng số {stats.total} nhân viên
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Icon name="chevron_left" className="text-sm" />
                            </button>

                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-8 h-8 rounded text-xs font-bold ${currentPage === page ? 'bg-[#b74b0c] text-white' : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}

                            {totalPages > 5 && (
                                <>
                                    <span className="px-1 text-slate-400">...</span>
                                    <button
                                        onClick={() => setCurrentPage(totalPages)}
                                        className="w-8 h-8 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold"
                                    >
                                        {totalPages}
                                    </button>
                                </>
                            )}

                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Icon name="chevron_right" className="text-sm" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                    <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                            <Icon name="event" className="text-[#b74b0c] text-lg" />
                            Lịch sử báo cáo
                        </h3>
                        <p className="text-xs text-slate-500">Calendar widget - Coming soon</p>
                    </div>

                    <div className="lg:col-span-9 flex flex-col gap-6">
                        <div className="bg-gradient-to-br from-[#b74b0c] to-orange-800 rounded-xl p-8 text-white flex flex-col justify-center gap-4 relative overflow-hidden shadow-lg h-1/2">
                            <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                            <div className="absolute bottom-[-20%] left-[-5%] w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
                            <div className="relative z-10">
                                <h2 className="text-2xl font-bold mb-2">Thông báo từ Bếp trưởng</h2>
                                <p className="text-white/80 text-sm max-w-md">
                                    Thực đơn ngày mai sẽ có món đặc biệt: "Cơm sườn nướng mật ong".
                                    Vui lòng nhắc nhở nhân viên báo ăn trước 16:00 chiều nay để bếp có kế hoạch chuẩn bị tốt nhất.
                                </p>
                            </div>
                            <div className="relative z-10 mt-2">
                                <button className="bg-white text-[#b74b0c] font-bold px-6 py-2 rounded-lg text-sm hover:bg-slate-100 transition-colors">
                                    Gửi nhắc nhở ngay
                                </button>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm h-1/2">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold flex items-center gap-2">
                                    <Icon name="pie_chart" className="text-[#b74b0c] text-lg" />
                                    Thống kê Nhóm ăn
                                </h3>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hôm nay</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {groupStats.slice(currentGroupPage * 4, (currentGroupPage + 1) * 4).map(group => (
                                    <div key={group.id} className="flex flex-col justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="text-sm font-bold">{group.name}</p>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <Icon name="schedule" className="text-xs text-slate-400" />
                                                    <span className="text-xs text-slate-500 font-medium">{group.shift_time}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-extrabold text-[#b74b0c]">{group.employee_count}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">Nhân viên</p>
                                            </div>
                                        </div>
                                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700/50 flex items-center gap-1.5">
                                            <Icon name="table_restaurant" className="text-xs text-slate-400" />
                                            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                                                {group.table_area}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination Controls */}
                            {groupStats.length > 4 && (
                                <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        onClick={() => setCurrentGroupPage(p => Math.max(0, p - 1))}
                                        disabled={currentGroupPage === 0}
                                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Icon name="chevron_left" className="text-lg text-slate-500" />
                                    </button>
                                    <span className="text-xs font-bold text-slate-500 self-center">
                                        {currentGroupPage + 1} / {Math.ceil(groupStats.length / 4)}
                                    </span>
                                    <button
                                        onClick={() => setCurrentGroupPage(p => Math.min(Math.ceil(groupStats.length / 4) - 1, p + 1))}
                                        disabled={currentGroupPage === Math.ceil(groupStats.length / 4) - 1}
                                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Icon name="chevron_right" className="text-lg text-slate-500" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <footer className="w-full py-8 px-6 lg:px-20 text-center text-slate-400 text-xs">
                <p>© 2026 Cơm Ngon Kitchen Dashboard. Hệ thống quản lý suất ăn doanh nghiệp. • BY Thân Công Hải</p>
            </footer>
        </div>
    );
}
