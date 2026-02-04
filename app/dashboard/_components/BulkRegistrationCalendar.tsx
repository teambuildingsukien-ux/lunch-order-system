'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toLocalDateString } from '@/lib/utils/date-helpers';


// Material Symbol Icon component
const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

interface DayData {
    date: string; // YYYY-MM-DD
    dayOfMonth: number;
    dayName: string;
    isToday: boolean;
    isPast: boolean;
    isCookingDay: boolean;
    isRegistered: boolean;
    isOptedOut: boolean;
}

interface BulkRegistrationCalendarProps {
    onClose: () => void;
}

export default function BulkRegistrationCalendar({ onClose }: BulkRegistrationCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
    const [calendarDays, setCalendarDays] = useState<DayData[]>([]);
    const [loading, setLoading] = useState(true);
    const [cookingDays, setCookingDays] = useState({ start_day: 1, end_day: 5 });
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchCookingDays();
    }, []);

    useEffect(() => {
        if (cookingDays) {
            loadCalendar();
        }
    }, [currentMonth, cookingDays]);

    const fetchCookingDays = async () => {
        try {
            const response = await fetch('/api/admin/settings/cooking-days');
            if (response.ok) {
                const result = await response.json();
                setCookingDays(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch cooking days:', error);
        }
    };

    const loadCalendar = async () => {
        setLoading(true);
        try {
            const supabase = createClient();

            // Get user session
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.error('No user found');
                return;
            }

            // Get first and last day of current month
            const year = currentMonth.getFullYear();
            const month = currentMonth.getMonth();
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);

            // Get all user's orders for this month
            const firstDateStr = toLocalDateString(firstDay);
            const lastDateStr = toLocalDateString(lastDay);

            const { data: orders } = await supabase
                .from('orders')
                .select('date, status')
                .eq('user_id', user.id)
                .gte('date', firstDateStr)
                .lte('date', lastDateStr);

            const orderMap = new Map<string, string>();
            orders?.forEach(order => {
                orderMap.set(order.date, order.status);
            });

            // Generate calendar days
            const days: DayData[] = [];
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

            // ... (inside component)

            for (let d = 1; d <= lastDay.getDate(); d++) {
                const date = new Date(year, month, d);
                const dateStr = toLocalDateString(date);
                const dayIndex = date.getDay();

                // Check if it's a cooking day
                let isCookingDay = false;
                if (cookingDays.start_day <= cookingDays.end_day) {
                    isCookingDay = dayIndex >= cookingDays.start_day && dayIndex <= cookingDays.end_day;
                } else {
                    isCookingDay = dayIndex >= cookingDays.start_day || dayIndex <= cookingDays.end_day;
                }

                const orderStatus = orderMap.get(dateStr);

                days.push({
                    date: dateStr,
                    dayOfMonth: d,
                    dayName: dayNames[dayIndex],
                    isToday: date.getTime() === today.getTime(),
                    isPast: date < today,
                    isCookingDay,
                    isRegistered: orderStatus === 'eating',
                    isOptedOut: orderStatus === 'not_eating'
                });
            }

            setCalendarDays(days);
        } catch (error) {
            console.error('Error loading calendar:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleDateSelection = (dateStr: string, day: DayData) => {
        if (day.isPast || !day.isCookingDay) return;

        const newSelected = new Set(selectedDates);
        if (newSelected.has(dateStr)) {
            newSelected.delete(dateStr);
        } else {
            newSelected.add(dateStr);
        }
        setSelectedDates(newSelected);
    };

    const handleBulkRegister = async () => {
        if (selectedDates.size === 0) {
            alert('Vui lòng chọn ít nhất 1 ngày');
            return;
        }

        setProcessing(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get user's tenant_id
            const { data: profile } = await supabase
                .from('users')
                .select('id, tenant_id')
                .eq('email', user.email)
                .single();

            if (!profile || !profile.tenant_id) return;

            const dates = Array.from(selectedDates);

            // Register for all selected dates
            for (const date of dates) {
                // Check if order exists
                const { data: existing } = await supabase
                    .from('orders')
                    .select('id, status')
                    .eq('user_id', profile.id)
                    .eq('date', date)
                    .single();

                if (existing) {
                    // Update to eating
                    await supabase
                        .from('orders')
                        .update({ status: 'eating' })
                        .eq('id', existing.id);
                } else {
                    // Create new order with tenant_id
                    await supabase
                        .from('orders')
                        .insert({
                            tenant_id: profile.tenant_id,  // REQUIRED for RLS
                            user_id: profile.id,
                            date: date,
                            status: 'eating'
                        });
                }

                // Log activity
                await fetch('/api/activity/log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'meal_registration',
                        details: { date }
                    })
                });
            }

            alert(`Đã đăng ký thành công ${selectedDates.size} ngày!`);
            setSelectedDates(new Set());
            loadCalendar();
        } catch (error) {
            console.error('Error registering:', error);
            alert('Có lỗi xảy ra khi đăng ký');
        } finally {
            setProcessing(false);
        }
    };

    const handleBulkOptOut = async () => {
        if (selectedDates.size === 0) {
            alert('Vui lòng chọn ít nhất 1 ngày');
            return;
        }

        setProcessing(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get user's tenant_id
            const { data: profile } = await supabase
                .from('users')
                .select('id, tenant_id')
                .eq('email', user.email)
                .single();

            if (!profile || !profile.tenant_id) return;

            const dates = Array.from(selectedDates);

            for (const date of dates) {
                const { data: existing } = await supabase
                    .from('orders')
                    .select('id, status')
                    .eq('user_id', profile.id)
                    .eq('date', date)
                    .single();

                if (existing) {
                    await supabase
                        .from('orders')
                        .update({ status: 'not_eating' })
                        .eq('id', existing.id);
                } else {
                    await supabase
                        .from('orders')
                        .insert({
                            tenant_id: profile.tenant_id,  // REQUIRED for RLS
                            user_id: profile.id,
                            date: date,
                            status: 'not_eating'
                        });
                }

                await fetch('/api/activity/log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'meal_cancellation',
                        details: { date }
                    })
                });
            }

            alert(`Đã báo nghỉ thành công ${selectedDates.size} ngày!`);
            setSelectedDates(new Set());
            loadCalendar();
        } catch (error) {
            console.error('Error opting out:', error);
            alert('Có lỗi xảy ra khi báo nghỉ');
        } finally {
            setProcessing(false);
        }
    };

    const previousMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const monthName = currentMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

    return (
        <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#12100E] p-4 md:p-8">
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Đăng ký theo lịch
                        </h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            Chọn nhiều ngày để đăng ký hoặc báo nghỉ cùng lúc
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                    >
                        <Icon name="arrow_back" className="text-[20px]" />
                        Quay lại
                    </button>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 text-xs">
                    <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                        <span className="text-slate-600 dark:text-slate-400">Đã đăng ký</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                        <span className="text-slate-600 dark:text-slate-400">Đã báo nghỉ</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-blue-500 rounded"></div>
                        <span className="text-slate-600 dark:text-slate-400">Đang chọn</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                        <span className="text-slate-600 dark:text-slate-400">Không nấu ăn</span>
                    </div>
                </div>
            </div>

            {/* Calendar */}
            <div className="max-w-6xl mx-auto bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-lg">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={previousMonth}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                    >
                        <Icon name="chevron_left" className="text-[24px] text-slate-600 dark:text-slate-400" />
                    </button>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white capitalize">
                        {monthName}
                    </h2>
                    <button
                        onClick={nextMonth}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                    >
                        <Icon name="chevron_right" className="text-[24px] text-slate-600 dark:text-slate-400" />
                    </button>
                </div>

                {/* Calendar Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin">
                            <Icon name="refresh" className="text-[40px] text-slate-400" />
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Day headers */}
                        <div className="grid grid-cols-7 gap-2 mb-2">
                            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
                                <div key={day} className="text-center text-sm font-bold text-slate-600 dark:text-slate-400 py-2">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar days */}
                        <div className="grid grid-cols-7 gap-2">
                            {/* Empty cells for days before month starts */}
                            {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() }).map((_, i) => (
                                <div key={`empty-${i}`} className="aspect-square"></div>
                            ))}

                            {/* Actual days */}
                            {calendarDays.map(day => {
                                const isSelected = selectedDates.has(day.date);

                                let bgColor = 'bg-white dark:bg-slate-800';
                                let textColor = 'text-slate-900 dark:text-white';
                                let borderColor = 'border-slate-200 dark:border-slate-700';
                                let cursor = 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700';

                                if (!day.isCookingDay) {
                                    bgColor = 'bg-slate-100 dark:bg-slate-800/50';
                                    textColor = 'text-slate-400';
                                    cursor = 'cursor-not-allowed';
                                }

                                if (day.isPast) {
                                    bgColor = 'bg-slate-50 dark:bg-slate-900';
                                    textColor = 'text-slate-300 dark:text-slate-600';
                                    cursor = 'cursor-not-allowed';
                                }

                                if (day.isRegistered && !isSelected) {
                                    bgColor = 'bg-green-100 dark:bg-green-900/30';
                                    borderColor = 'border-green-300 dark:border-green-700';
                                }

                                if (day.isOptedOut && !isSelected) {
                                    bgColor = 'bg-red-100 dark:bg-red-900/30';
                                    borderColor = 'border-red-300 dark:border-red-700';
                                }

                                if (isSelected) {
                                    bgColor = 'bg-blue-500';
                                    textColor = 'text-white';
                                    borderColor = 'border-blue-600';
                                }

                                if (day.isToday && !isSelected) {
                                    borderColor = 'border-[#B24700] border-2';
                                }

                                return (
                                    <button
                                        key={day.date}
                                        onClick={() => toggleDateSelection(day.date, day)}
                                        disabled={day.isPast || !day.isCookingDay}
                                        className={`aspect-square rounded-xl border-2 ${bgColor} ${textColor} ${borderColor} ${cursor} transition-all flex flex-col items-center justify-center p-1`}
                                    >
                                        <span className="text-xs font-medium">{day.dayName}</span>
                                        <span className="text-lg font-bold">{day.dayOfMonth}</span>
                                        {day.isRegistered && !isSelected && (
                                            <Icon name="check_circle" className="text-[14px] text-green-600" />
                                        )}
                                        {day.isOptedOut && !isSelected && (
                                            <Icon name="cancel" className="text-[14px] text-red-600" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Action Buttons */}
            <div className="max-w-6xl mx-auto mt-6">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Đã chọn: <span className="font-bold text-slate-900 dark:text-white">{selectedDates.size}</span> ngày
                        </p>
                        {selectedDates.size > 0 && (
                            <button
                                onClick={() => setSelectedDates(new Set())}
                                className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
                            >
                                Bỏ chọn tất cả
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleBulkRegister}
                            disabled={selectedDates.size === 0 || processing}
                            className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <Icon name="restaurant" className="text-[20px]" />
                            Đăng ký ăn ({selectedDates.size} ngày)
                        </button>
                        <button
                            onClick={handleBulkOptOut}
                            disabled={selectedDates.size === 0 || processing}
                            className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <Icon name="event_busy" className="text-[20px]" />
                            Báo nghỉ ({selectedDates.size} ngày)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
