'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ActivityLog {
    id: string;
    action: string;
    target_type: string;
    target_id: string;
    details: any;
    created_at: string;
    performed_by: {
        id: string;
        full_name: string;
        email: string;
        avatar_url?: string;
    };
}

// Material Symbol Icon component
const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

const ACTION_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
    'meal_registration': { icon: '🍽️', label: 'Đăng ký ăn', color: 'text-green-600' },
    'meal_cancellation': { icon: '🚫', label: 'Hủy suất ăn', color: 'text-red-600' },
    'user_created': { icon: '👤', label: 'Tạo nhân viên', color: 'text-blue-600' },
    'user_updated': { icon: '✏️', label: 'Cập nhật NV', color: 'text-yellow-600' },
    'user_deleted': { icon: '🗑️', label: 'Xóa nhân viên', color: 'text-red-600' },
    'DELETE_USER': { icon: '🗑️', label: 'Xóa nhân viên', color: 'text-red-600' },
    'UPDATE_USER': { icon: '✏️', label: 'Cập nhật NV', color: 'text-yellow-600' },
    'group_created': { icon: '👥', label: 'Tạo nhóm', color: 'text-purple-600' },
    'shift_created': { icon: '⏰', label: 'Tạo ca làm', color: 'text-indigo-600' },
    'notification_sent': { icon: '📢', label: 'Gửi thông báo', color: 'text-orange-600' },
    'SEND_NOTIFICATION': { icon: '📢', label: 'Gửi thông báo', color: 'text-orange-600' },
};

export default function ActivityLogsPage() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Filters
    const [actionFilter, setActionFilter] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const supabase = createClient();

    useEffect(() => {
        fetchLogs();
    }, [page, actionFilter, fromDate, toDate]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
            });

            if (actionFilter) params.append('action', actionFilter);
            if (fromDate) params.append('from_date', fromDate);
            if (toDate) params.append('to_date', toDate);

            const response = await fetch(`/api/admin/activity-logs?${params}`);
            const result = await response.json();

            if (result.success) {
                setLogs(result.data.logs);
                setTotal(result.data.total);
                setTotalPages(result.data.totalPages);
            }
        } catch (error) {
            console.error('Error fetching activity logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Ho_Chi_Minh'
        });
    };

    const getActionConfig = (action: string) => {
        return ACTION_CONFIG[action] || {
            icon: '📝',
            label: action,
            color: 'text-gray-600'
        };
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-slate-900">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-8 py-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                        <Icon name="history" className="text-white text-[28px]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Lịch sử hoạt động
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Theo dõi toàn bộ hoạt động trong hệ thống • Tổng {total} bản ghi
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-8 py-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <Icon name="filter_list" className="text-[18px] inline mr-1" />
                            Loại hoạt động
                        </label>
                        <select
                            value={actionFilter}
                            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        >
                            <option value="">Tất cả</option>
                            <option value="meal_registration">Đăng ký ăn</option>
                            <option value="meal_cancellation">Hủy suất ăn</option>
                            <option value="user_created">Tạo nhân viên</option>
                            <option value="user_updated">Cập nhật NV</option>
                            <option value="UPDATE_USER">Cập nhật NV</option>
                            <option value="DELETE_USER">Xóa nhân viên</option>
                            <option value="notification_sent">Gửi thông báo</option>
                            <option value="SEND_NOTIFICATION">Gửi thông báo</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <Icon name="event" className="text-[18px] inline mr-1" />
                            Từ ngày
                        </label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <Icon name="event" className="text-[18px] inline mr-1" />
                            Đến ngày
                        </label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Timeline Content */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                            <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium">Đang tải...</p>
                        </div>
                    </div>
                ) : logs.length > 0 ? (
                    <div className="max-w-4xl mx-auto space-y-4">
                        {logs.map((log, index) => {
                            const config = getActionConfig(log.action);
                            const isLast = index === logs.length - 1;

                            return (
                                <div key={log.id} className="flex gap-4 group">
                                    {/* Timeline Icon */}
                                    <div className="flex flex-col items-center">
                                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-xl border-2 border-primary/30 shadow-sm">
                                            {config.icon}
                                        </div>
                                        {!isLast && (
                                            <div className="w-0.5 flex-1 bg-gray-200 dark:bg-slate-700 mt-2 min-h-[40px]"></div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 pb-6">
                                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 hover:shadow-lg hover:border-primary/30 transition-all">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                                                        {log.performed_by?.full_name?.split(' ').slice(-2).map(n => n[0]).join('').toUpperCase() || '??'}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 dark:text-white">
                                                            {log.performed_by?.full_name || 'Unknown User'}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {log.performed_by?.email}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                    <Icon name="schedule" className="text-[16px]" />
                                                    {formatTime(log.created_at)}
                                                </div>
                                            </div>

                                            <div className={`text-sm font-semibold ${config.color} mb-2 flex items-center gap-2`}>
                                                <Icon name="label" className="text-[18px]" />
                                                {config.label}
                                            </div>

                                            {log.details && Object.keys(log.details).length > 0 && (
                                                <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-900/50 rounded-lg p-3 space-y-1">
                                                    {log.details.date && (
                                                        <div className="flex items-center gap-2">
                                                            <Icon name="calendar_today" className="text-[14px]" />
                                                            <span>Ngày: {log.details.date}</span>
                                                        </div>
                                                    )}
                                                    {log.details.status && (
                                                        <div className="flex items-center gap-2">
                                                            <Icon name="info" className="text-[14px]" />
                                                            <span>Trạng thái: {log.details.status}</span>
                                                        </div>
                                                    )}
                                                    {log.details.previous_status && (
                                                        <div className="flex items-center gap-2">
                                                            <Icon name="history" className="text-[14px]" />
                                                            <span>Từ: {log.details.previous_status}</span>
                                                        </div>
                                                    )}
                                                    {log.details.email && (
                                                        <div className="flex items-center gap-2">
                                                            <Icon name="email" className="text-[14px]" />
                                                            <span>{log.details.email}</span>
                                                        </div>
                                                    )}
                                                    {log.details.full_name && (
                                                        <div className="flex items-center gap-2">
                                                            <Icon name="person" className="text-[14px]" />
                                                            <span>{log.details.full_name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <Icon name="history" className="text-6xl text-gray-300 dark:text-gray-600" />
                            <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium">Không có hoạt động nào</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Thử thay đổi bộ lọc để xem kết quả khác</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 px-8 py-4">
                    <div className="flex items-center justify-between max-w-4xl mx-auto">
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                            Trang {page} / {totalPages}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors font-medium flex items-center gap-2"
                            >
                                <Icon name="chevron_left" className="text-[20px]" />
                                Trước
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors font-medium flex items-center gap-2"
                            >
                                Sau
                                <Icon name="chevron_right" className="text-[20px]" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
