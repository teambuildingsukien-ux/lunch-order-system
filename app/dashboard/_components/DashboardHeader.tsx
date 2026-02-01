'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import SettingsModal from './SettingsModal';

const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

interface DashboardHeaderProps {
    userName?: string;
    userRole?: string;
    activeTab?: 'employee' | 'manager'; // Tab hiện tại cho Admin/HR
    onTabChange?: (tab: 'employee' | 'manager') => void; // Callback khi đổi tab
}


/**
 * Shared Dashboard Header Component
 * Used by all dashboards: Employee, Kitchen, Admin
 * 
 * Features:
 * - Logo "Cơm Ngon"
 * - Dark mode toggle
 * - Settings button (opens modal)
 * - Action buttons (Chọn thêm, Tối hạn sáng)
 * - User dropdown menu with logout
 */
export default function DashboardHeader({
    userName = 'User',
    userRole = 'employee',
    activeTab = 'employee',
    onTabChange
}: DashboardHeaderProps) {

    const router = useRouter();
    const supabase = createClient();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [userId, setUserId] = useState<string>('');

    useEffect(() => {
        getUserId();
    }, []);

    const getUserId = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            // Get user ID from users table by email
            const { data } = await supabase
                .from('users')
                .select('id')
                .eq('email', user.email)
                .single();
            if (data) setUserId(data.id);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const getInitials = (name: string) => {
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <>
            <header className="w-full px-6 py-4 flex items-center justify-between border-b border-orange-200/50 dark:border-orange-900/30 bg-white/80 dark:bg-black/40 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-6">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#B24700] shadow-lg shadow-primary/30">
                            <svg className="w-8 h-8" fill="white" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" />
                            </svg>
                        </div>
                        <span className="text-xl font-extrabold tracking-tight text-[#B24700]">Cơm Ngon</span>
                    </div>

                    {/* Tabs cho Admin/HR */}
                    {(userRole === 'admin' || userRole === 'hr') && (
                        <div className="flex items-center gap-2 border-l border-orange-200/50 dark:border-orange-900/30 pl-6">
                            <button
                                onClick={() => onTabChange?.('employee')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-semibold text-sm ${activeTab === 'employee'
                                    ? 'bg-[#B24700] text-white shadow-md shadow-primary/30'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-orange-50 dark:hover:bg-orange-950/30'
                                    }`}
                            >
                                <Icon name="restaurant" className="text-[20px]" />
                                <span>Báo cơm</span>
                            </button>
                            <button
                                onClick={() => onTabChange?.('manager')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-semibold text-sm ${activeTab === 'manager'
                                    ? 'bg-[#B24700] text-white shadow-md shadow-primary/30'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-orange-50 dark:hover:bg-orange-950/30'
                                    }`}
                            >
                                <Icon name="dashboard" className="text-[20px]" />
                                <span>Quản trị</span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            setIsDarkMode(!isDarkMode);
                            document.documentElement.classList.toggle('dark');
                        }}
                        className="p-2.5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-[#B24700] hover:bg-orange-200 transition-colors"
                    >
                        <Icon name={isDarkMode ? "light_mode" : "dark_mode"} className="block text-[24px]" />
                    </button>

                    <button
                        onClick={() => setShowSettings(true)}
                        className="p-2.5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-[#B24700] hover:bg-orange-200 transition-colors"
                        title="Cài đặt"
                    >
                        <Icon name="settings" className="block text-[24px]" />
                    </button>



                    <div className="flex items-center gap-3">
                        {/* Upgrade/Billing Button - Only for Admin/HR */}
                        {(userRole === 'admin' || userRole === 'hr') && (
                            <button
                                onClick={() => router.push('/billing')}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#B24700] to-[#D65D0E] hover:from-[#8F3900] hover:to-[#B24700] text-white font-bold transition-all shadow-md hover:shadow-lg shadow-primary/30 group"
                                title="Quản lý gói dịch vụ"
                            >
                                <Icon name="workspace_premium" className="text-[20px] group-hover:scale-110 transition-transform" />
                                <span className="text-sm">Nâng cấp</span>
                            </button>
                        )}
                    </div>

                    <div className="relative">
                        <div
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full border-2 border-[#B24700]/30 hover:border-[#B24700] dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-all cursor-pointer group"
                        >
                            <div className="w-8 h-8 rounded-full bg-[#B24700] overflow-hidden border-2 border-white shadow-sm flex items-center justify-center text-white font-bold text-xs">
                                {getInitials(userName)}
                            </div>
                            <span className="font-bold text-sm text-[#B24700] group-hover:text-[#8F3900]">{userName}</span>
                            <Icon name="keyboard_arrow_down" className="text-[20px] text-[#B24700]" />
                        </div>

                        {showUserMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1E1A17] rounded-2xl shadow-xl border border-orange-100 dark:border-white/10 py-2 z-50">
                                <button
                                    onClick={handleLogout}
                                    className="w-full px-4 py-2.5 text-left hover:bg-orange-50 dark:hover:bg-[#B24700]/10 transition-colors flex items-center gap-3 text-slate-700 dark:text-slate-200"
                                >
                                    <Icon name="logout" className="text-[#B24700]" />
                                    <span className="font-bold">Đăng xuất</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Settings Modal */}
            <SettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                userId={userId}
                userRole={userRole}
            />
        </>
    );
}
