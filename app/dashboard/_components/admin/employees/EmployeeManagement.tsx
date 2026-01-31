'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import AddEmployeeModal from './AddEmployeeModal';
import EditEmployeeModal from './EditEmployeeModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import ImportEmployeeModal from './ImportEmployeeModal';

const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

interface Employee {
    id: string;
    employee_code: string | null;
    email: string;
    full_name: string;
    role: 'employee' | 'manager' | 'admin' | 'kitchen';
    avatar_url: string | null;
    created_at: string;
    is_active?: boolean;
    department?: string;
    shift?: string;
    group_id?: string;
    group?: {
        id: string;
        name: string;
    } | null;
}

interface Group {
    id: string;
    name: string;
}

export default function EmployeeManagement() {
    const supabase = createClient();

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [mealGroups, setMealGroups] = useState<Group[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

    const [stats, setStats] = useState({ total: 0, active: 0, groups: 0, departments: 0 });

    // Department filter state
    const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
    const [departments, setDepartments] = useState<string[]>([]);
    const [departmentCounts, setDepartmentCounts] = useState<Record<string, number>>({});

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        fetchEmployees();
        fetchMealGroups();
        fetchStats();
        fetchDepartments();
    }, [currentPage, selectedDepartment]);

    const fetchEmployees = async () => {
        setIsLoading(true);
        try {
            // Build query with department filter
            let countQuery = supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .or('is_active.is.null,is_active.eq.true');

            // Apply department filter for count
            if (selectedDepartment) {
                countQuery = countQuery.eq('department', selectedDepartment.trim());
            }

            const { count: totalCount } = await countQuery;

            // Calculate total pages
            const pages = Math.ceil((totalCount || 0) / ITEMS_PER_PAGE);
            setTotalPages(pages);

            // Build data query with department filter
            let dataQuery = supabase
                .from('users')
                .select(`
                    *,
                    group:groups (
                        id,
                        name
                    )
                `)
                .or('is_active.is.null,is_active.eq.true')
                .order('created_at', { ascending: false })
                .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

            // Apply department filter for data
            if (selectedDepartment) {
                dataQuery = dataQuery.eq('department', selectedDepartment.trim());
            }

            const { data, error } = await dataQuery;

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            setEmployees(data || []);
        } catch (err: any) {
            console.error('Error fetching employees:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMealGroups = async () => {
        const { data } = await supabase
            .from('groups') // Fetch from 'groups' table
            .select('id, name')
            .order('name');
        setMealGroups(data || []);
    };

    const fetchStats = async () => {
        try {
            const { count: totalCount } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true });

            const { count: activeCount } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .or('is_active.is.null,is_active.eq.true');

            // Count meal groups from 'groups' table
            const { count: groupsCount } = await supabase
                .from('groups')
                .select('*', { count: 'exact', head: true });

            // Count unique departments (active users only, normalized)
            const { data: usersData } = await supabase
                .from('users')
                .select('department')
                .or('is_active.is.null,is_active.eq.true')
                .not('department', 'is', null);

            const uniqueDepartments = new Set(
                usersData?.map(u => u.department?.trim()).filter(Boolean) || []
            );

            setStats({
                total: totalCount || 0,
                active: activeCount || 0,
                groups: groupsCount || 0,
                departments: uniqueDepartments.size
            });
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    };

    const fetchDepartments = async () => {
        try {
            // Fetch all active employees with departments
            const { data: usersData } = await supabase
                .from('users')
                .select('department')
                .or('is_active.is.null,is_active.eq.true')
                .not('department', 'is', null);

            if (usersData) {
                // Get unique departments (normalized)
                const uniqueDepts = Array.from(
                    new Set(usersData.map(u => u.department?.trim()).filter(Boolean))
                );
                setDepartments(uniqueDepts.sort());

                // Count employees per department (normalized)
                const counts: Record<string, number> = {};
                usersData.forEach(u => {
                    const dept = u.department?.trim();
                    if (dept) {
                        counts[dept] = (counts[dept] || 0) + 1;
                    }
                });
                setDepartmentCounts(counts);
            }
        } catch (err) {
            console.error('Error fetching departments:', err);
        }
    };

    // Client-side search filter only (department filter is server-side)
    const filteredEmployees = employees.filter(emp => {
        const matchesSearch =
            emp.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.id?.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesSearch;
    });

    const getRoleBadge = (role: string) => {
        const badges = {
            admin: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
            manager: 'bg-primary/10 text-primary border-primary/20',
            kitchen: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
            employee: 'bg-gray-100 dark:bg-slate-800 text-[#111318] dark:text-white border-gray-200 dark:border-slate-700'
        };
        return badges[role as keyof typeof badges] || badges.employee;
    };

    const getRoleLabel = (role: string) => {
        const labels = {
            admin: 'Quản trị',
            manager: 'Quản lý',
            kitchen: 'Nhà bếp',
            employee: 'Nhân viên'
        };
        return labels[role as keyof typeof labels] || role;
    };

    return (
        <div className="p-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-[#dbdfe6] dark:border-slate-800 shadow-sm">
                    <p className="text-xs font-semibold text-[#606e8a] uppercase">Tổng nhân sự</p>
                    <p className="text-2xl font-bold text-primary">{stats.total}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-[#dbdfe6] dark:border-slate-800 shadow-sm">
                    <p className="text-xs font-semibold text-[#606e8a] uppercase">Đang hoạt động</p>
                    <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-[#dbdfe6] dark:border-slate-800 shadow-sm">
                    <p className="text-xs font-semibold text-[#606e8a] uppercase">Phòng ban</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.departments}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-[#dbdfe6] dark:border-slate-800 shadow-sm">
                    <p className="text-xs font-semibold text-[#606e8a] uppercase">Nhóm ăn</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.groups}</p>
                </div>
            </div>

            {/* Main Content: Sidebar + Table */}
            <div className="flex gap-6">
                {/* Department Sidebar */}
                <div className="w-60 flex-shrink-0">
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#dbdfe6] dark:border-slate-800 shadow-sm p-4 sticky top-8">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Icon name="corporate_fare" className="text-primary text-[20px]" />
                                <h3 className="font-bold text-sm text-[#111318] dark:text-white">Phòng ban</h3>
                            </div>
                            <span className="text-xs font-bold text-[#606e8a] bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                {departments.length}
                            </span>
                        </div>

                        {/* All Departments Option */}
                        <button
                            onClick={() => {
                                setSelectedDepartment(null);
                                setCurrentPage(1); // Reset to page 1
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-2 ${selectedDepartment === null
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-[#606e8a] dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Icon name="apps" className="text-[18px]" />
                                <span>Tất cả</span>
                            </div>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${selectedDepartment === null
                                ? 'bg-white/20 text-white'
                                : 'bg-gray-100 dark:bg-slate-800 text-[#606e8a]'
                                }`}>
                                {stats.total}
                            </span>
                        </button>

                        {/* Department List */}
                        <div className="space-y-1 max-h-[500px] overflow-y-auto">
                            {departments.map((dept) => (
                                <button
                                    key={dept}
                                    onClick={() => {
                                        setSelectedDepartment(dept);
                                        setCurrentPage(1); // Reset to page 1
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${selectedDepartment === dept
                                        ? 'bg-primary/10 text-primary border border-primary/20'
                                        : 'text-[#606e8a] dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    <span className="truncate">{dept}</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${selectedDepartment === dept
                                        ? 'bg-primary/20 text-primary'
                                        : 'bg-gray-100 dark:bg-slate-800 text-[#606e8a]'
                                        }`}>
                                        {departmentCounts[dept] || 0}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* No Departments Message */}
                        {departments.length === 0 && (
                            <div className="text-center py-8">
                                <Icon name="corporate_fare" className="text-[36px] text-[#606e8a] mb-2" />
                                <p className="text-xs text-[#606e8a]">Chưa có phòng ban</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Table Container */}
                <div className="flex-1 min-w-0">
                    {/* Table Container */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#dbdfe6] dark:border-slate-800 shadow-sm flex flex-col">
                        {/* Search Header */}
                        <div className="p-6 border-b border-[#dbdfe6] dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="relative w-full md:w-96">
                                <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606e8a] text-[20px]" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-background-light dark:bg-slate-800 border border-[#dbdfe6] dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                    placeholder="Tìm kiếm tên, mã nhân viên, phòng ban..."
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowImportModal(true)}
                                    className="cursor-pointer flex items-center justify-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-green-600/20 hover:bg-green-700 transition-all"
                                >
                                    <Icon name="upload_file" className="text-[20px]" />
                                    <span>Import Excel</span>
                                </button>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="cursor-pointer flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
                                >
                                    <Icon name="person_add" className="text-[20px]" />
                                    <span>Thêm nhân viên</span>
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-background-light dark:bg-slate-800/50">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-[#606e8a] uppercase tracking-wider">Nhân viên</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#606e8a] uppercase tracking-wider">Thông tin TK</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#606e8a] uppercase tracking-wider">Phòng ban / Nhóm</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#606e8a] uppercase tracking-wider">Vai trò</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#606e8a] uppercase tracking-wider">Trạng thái</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#606e8a] uppercase tracking-wider text-right w-48">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#dbdfe6] dark:divide-slate-800">
                                    {isLoading ? (
                                        [...Array(5)].map((_, i) => (
                                            <tr key={i}>
                                                <td className="px-6 py-4"><div className="h-10 bg-gray-200 dark:bg-slate-800 rounded animate-pulse" /></td>
                                                <td className="px-6 py-4"><div className="h-10 bg-gray-200 dark:bg-slate-800 rounded animate-pulse" /></td>
                                                <td className="px-6 py-4"><div className="h-10 bg-gray-200 dark:bg-slate-800 rounded animate-pulse" /></td>
                                                <td className="px-6 py-4"><div className="h-6 w-20 bg-gray-200 dark:bg-slate-800 rounded animate-pulse" /></td>
                                                <td className="px-6 py-4"><div className="h-6 w-20 bg-gray-200 dark:bg-slate-800 rounded-full animate-pulse" /></td>
                                                <td className="px-6 py-4"><div className="h-8 bg-gray-200 dark:bg-slate-800 rounded animate-pulse" /></td>
                                            </tr>
                                        ))
                                    ) : filteredEmployees.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center">
                                                <Icon name="group_off" className="text-[48px] text-[#606e8a] mb-3" />
                                                <p className="text-sm font-semibold text-[#606e8a]">Không tìm thấy nhân viên</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredEmployees.map((employee) => (
                                            <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                                                {/* Nhân viên */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="size-10 rounded-full bg-slate-200 bg-cover bg-center border border-gray-100"
                                                            style={employee.avatar_url ? { backgroundImage: `url(${employee.avatar_url})` } : {}}
                                                        >
                                                            {!employee.avatar_url && (
                                                                <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                                                    <span className="text-sm font-bold text-[#606e8a]">
                                                                        {employee.full_name?.charAt(0).toUpperCase() || 'U'}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <div className="text-sm font-bold dark:text-white">{employee.full_name || 'Chưa cập nhật'}</div>
                                                            <div className="text-[11px] text-[#606e8a]">Mã: {employee.id.slice(0, 8)}</div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Thông tin TK */}
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-[#111318] dark:text-slate-300">{employee.email.split('@')[0]}</div>
                                                    <div className="text-[11px] text-[#606e8a]">Pass: ********</div>
                                                </td>

                                                {/* Phòng ban / Nhóm */}
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1.5">
                                                        {/* Department */}
                                                        <div className="flex items-center gap-2 text-sm text-[#606e8a] dark:text-slate-400">
                                                            <Icon name="corporate_fare" className="text-[16px] text-primary" />
                                                            <span className="font-medium">{(employee as any).department || 'Chưa có phòng ban'}</span>
                                                        </div>
                                                        {/* Shift */}
                                                        <div className="flex items-center gap-2 text-sm text-[#606e8a] dark:text-slate-400">
                                                            <Icon name="schedule" className="text-[16px] text-orange-500" />
                                                            <span className="font-medium">{(employee as any).shift || 'Chưa có ca'}</span>
                                                        </div>
                                                        {/* Meal Group */}
                                                        {employee.group ? (
                                                            <span className="w-fit px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-100 dark:border-blue-800/30">
                                                                {employee.group.name}
                                                            </span>
                                                        ) : (
                                                            <span className="w-fit px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-50 text-gray-600 dark:bg-slate-800 dark:text-slate-400 border border-gray-100 dark:border-slate-700">
                                                                Chưa có nhóm
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Vai trò */}
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded text-[11px] font-semibold border uppercase ${getRoleBadge(employee.role)}`}>
                                                        {getRoleLabel(employee.role)}
                                                    </span>
                                                </td>

                                                {/* Trạng thái */}
                                                <td className="px-6 py-4">
                                                    {employee.is_active !== false ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                            <span className="size-1.5 rounded-full bg-green-600"></span>
                                                            Hoạt động
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400">
                                                            <span className="size-1.5 rounded-full bg-gray-400"></span>
                                                            Tạm nghỉ
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Thao tác */}
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedEmployee(employee);
                                                                setShowEditModal(true);
                                                            }}
                                                            className="p-1.5 text-[#606e8a] hover:text-primary hover:bg-primary/10 rounded transition-colors"
                                                            title="Sửa"
                                                        >
                                                            <Icon name="edit" className="text-[20px]" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedEmployee(employee);
                                                                setShowDeleteModal(true);
                                                            }}
                                                            className="p-1.5 text-[#606e8a] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                            title="Xóa"
                                                        >
                                                            <Icon name="delete" className="text-[20px]" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        {!isLoading && filteredEmployees.length > 0 && (
                            <div className="p-6 border-t border-[#dbdfe6] dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 rounded-b-xl">
                                <p className="text-sm text-[#606e8a] dark:text-slate-400">
                                    Hiển thị <span className="font-bold">{filteredEmployees.length}</span> trên tổng số <span className="font-bold">{stats.total}</span> nhân viên
                                </p>

                                {/* Pagination Controls */}
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
                {/* End Main Table Container */}
            </div>
            {/* End Sidebar + Table Flex */}

            {/* Modals */}
            <AddEmployeeModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={() => {
                    fetchEmployees();
                    fetchStats();
                    fetchMealGroups();
                    fetchDepartments(); // Update sidebar
                }}
                mealGroups={mealGroups}
            />

            {selectedEmployee && (
                <>
                    <EditEmployeeModal
                        isOpen={showEditModal}
                        onClose={() => {
                            setShowEditModal(false);
                            setSelectedEmployee(null);
                        }}
                        onSuccess={() => {
                            fetchEmployees();
                            fetchStats();
                            fetchMealGroups();
                            fetchDepartments(); // Update sidebar
                        }}
                        employee={selectedEmployee}
                        mealGroups={mealGroups}
                    />

                    <DeleteConfirmModal
                        isOpen={showDeleteModal}
                        onClose={() => {
                            setShowDeleteModal(false);
                            setSelectedEmployee(null);
                        }}
                        onSuccess={() => {
                            fetchEmployees();
                            fetchStats();
                            fetchDepartments(); // Update sidebar
                        }}
                        employee={selectedEmployee}
                    />
                </>
            )}

            <ImportEmployeeModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onSuccess={() => {
                    fetchEmployees();
                    fetchStats();
                    fetchMealGroups();
                    fetchDepartments(); // Update sidebar
                }}
            />
        </div>
    );
}
