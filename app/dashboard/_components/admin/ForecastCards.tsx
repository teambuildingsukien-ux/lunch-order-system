'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import BreakdownModal from './BreakdownModal';

interface ForecastData {
    registered: number;
    notRegistered: number;
    total: number;
    date: string;
    dayName: string;
}

// Material Symbol Icon component
const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export default function ForecastCards() {
    const [forecast, setForecast] = useState<ForecastData>({
        registered: 0,
        notRegistered: 0,
        total: 0,
        date: '',
        dayName: ''
    });
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isCookingDay, setIsCookingDay] = useState(true);

    useEffect(() => {
        fetchForecast();
    }, []);

    const fetchForecast = async () => {
        try {
            const supabase = createClient();

            // Calculate tomorrow's date
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowDate = tomorrow.toISOString().split('T')[0];

            // Get Vietnamese day name
            const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
            const dayName = dayNames[tomorrow.getDay()];

            // Format date as DD/MM/YYYY
            const formattedDate = tomorrow.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

            // Check if tomorrow is a cooking day
            const response = await fetch('/api/admin/settings/cooking-days');
            let cookingDays = { start_day: 1, end_day: 5 }; // Default Monday-Friday

            if (response.ok) {
                const result = await response.json();
                cookingDays = result.data;
            }

            const tomorrowDayIndex = tomorrow.getDay();
            let isInCookingRange = false;

            if (cookingDays.start_day <= cookingDays.end_day) {
                isInCookingRange = tomorrowDayIndex >= cookingDays.start_day && tomorrowDayIndex <= cookingDays.end_day;
            } else {
                isInCookingRange = tomorrowDayIndex >= cookingDays.start_day || tomorrowDayIndex <= cookingDays.end_day;
            }

            setIsCookingDay(isInCookingRange);

            if (!isInCookingRange) {
                setForecast({
                    registered: 0,
                    notRegistered: 0,
                    total: 0,
                    date: formattedDate,
                    dayName
                });
                setLoading(false);
                return;
            }

            // Get total active employees
            const { count: totalEmployees } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('active', true);

            // Get employees registered for tomorrow (status = 'eating')
            const { count: registeredCount } = await supabase
                .from('orders')
                .select('user_id, users!inner(active)', { count: 'exact', head: true })
                .eq('date', tomorrowDate)
                .eq('status', 'eating')
                .eq('users.active', true);

            const registered = registeredCount || 0;
            const total = totalEmployees || 0;
            const notRegistered = total - registered;

            setForecast({
                registered,
                notRegistered,
                total,
                date: formattedDate,
                dayName
            });
        } catch (error) {
            console.error('Error fetching forecast:', error);
        } finally {
            setLoading(false);
        }
    };

    const openBreakdown = () => {
        setShowModal(true);
    };

    if (loading) {
        return (
            <>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-3xl p-6 animate-pulse">
                    <div className="h-20 bg-green-200 dark:bg-green-800 rounded"></div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-3xl p-6 animate-pulse">
                    <div className="h-20 bg-orange-200 dark:bg-orange-800 rounded"></div>
                </div>
            </>
        );
    }

    const registeredPercentage = forecast.total > 0
        ? ((forecast.registered / forecast.total) * 100).toFixed(1)
        : '0.0';

    const notRegisteredPercentage = forecast.total > 0
        ? ((forecast.notRegistered / forecast.total) * 100).toFixed(1)
        : '0.0';

    // If tomorrow is not a cooking day, show a message
    if (!isCookingDay) {
        return (
            <>
                <div className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 rounded-3xl p-6 shadow-md border border-slate-200 dark:border-slate-700 col-span-1 md:col-span-2">
                    <div className="flex items-center gap-3 mb-3">
                        <Icon name="event_busy" className="text-slate-500 text-[24px]" />
                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">
                            Không có nấu ăn ngày mai
                        </h3>
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        {forecast.dayName}, {forecast.date}
                    </p>

                    <p className="text-xs text-slate-500 dark:text-slate-500">
                        Ngày mai không thuộc lịch nấu ăn. Dự báo sẽ hiển thị khi có ngày nấu ăn tiếp theo.
                    </p>
                </div>
            </>
        );
    }

    return (
        <>
            {/* Registered Card */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-3xl p-6 shadow-md border border-green-100 dark:border-green-800/30 hover:shadow-xl transition-all">
                <div className="flex items-center gap-2 mb-3">
                    <Icon name="restaurant" className="text-green-600 text-[20px]" />
                    <h3 className="text-sm font-bold text-green-700 dark:text-green-400 uppercase tracking-wide">
                        Suất ăn ngày mai
                    </h3>
                </div>

                <p className="text-xs text-green-600 dark:text-green-500 mb-3 flex items-center gap-1">
                    <Icon name="check_circle" className="text-[16px]" />
                    Đã đăng ký
                </p>

                <div className="mb-3">
                    <p className="text-4xl font-black text-green-600 dark:text-green-400">
                        {forecast.registered}
                        <span className="text-2xl text-green-500 dark:text-green-500 font-bold"> / {forecast.total}</span>
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-500 font-bold">
                        ({registeredPercentage}%)
                    </p>
                </div>

                <div className="mb-4 pt-3 border-t border-green-200 dark:border-green-800">
                    <p className="text-sm font-bold text-green-700 dark:text-green-400">
                        {forecast.dayName}, {forecast.date}
                    </p>
                </div>

                <button
                    onClick={openBreakdown}
                    className="w-full flex items-center justify-center gap-2 text-green-700 dark:text-green-400 font-bold text-sm hover:bg-green-100 dark:hover:bg-green-900/30 py-2 px-3 rounded-xl transition-all"
                >
                    <Icon name="visibility" className="text-[18px]" />
                    Xem chi tiết
                </button>
            </div>

            {/* Not Registered Card */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-3xl p-6 shadow-md border border-orange-100 dark:border-orange-800/30 hover:shadow-xl transition-all">
                <div className="flex items-center gap-2 mb-3">
                    <Icon name="notification_important" className="text-orange-600 text-[20px]" />
                    <h3 className="text-sm font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wide">
                        Suất ăn ngày mai
                    </h3>
                </div>

                <p className="text-xs text-orange-600 dark:text-orange-500 mb-3 flex items-center gap-1">
                    <Icon name="warning" className="text-[16px]" />
                    Chưa đăng ký
                </p>

                <div className="mb-3">
                    <p className="text-4xl font-black text-orange-600 dark:text-orange-400">
                        {forecast.notRegistered}
                        <span className="text-2xl text-orange-500 dark:text-orange-500 font-bold"> / {forecast.total}</span>
                    </p>
                    <p className="text-sm text-orange-600 dark:text-orange-500 font-bold">
                        ({notRegisteredPercentage}%)
                    </p>
                </div>

                <div className="mb-4 pt-3 border-t border-orange-200 dark:border-orange-800">
                    <p className="text-sm font-bold text-orange-700 dark:text-orange-400">
                        {forecast.dayName}, {forecast.date}
                    </p>
                </div>

                <button
                    onClick={openBreakdown}
                    className="w-full flex items-center justify-center gap-2 text-orange-700 dark:text-orange-400 font-bold text-sm hover:bg-orange-100 dark:hover:bg-orange-900/30 py-2 px-3 rounded-xl transition-all"
                >
                    <Icon name="visibility" className="text-[18px]" />
                    Xem chi tiết
                </button>
            </div>

            {/* Breakdown Modal */}
            {showModal && (
                <BreakdownModal
                    date={forecast.date}
                    dayName={forecast.dayName}
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    );
}
