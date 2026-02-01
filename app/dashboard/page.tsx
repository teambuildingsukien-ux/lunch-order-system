'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import EmployeeDashboard from './_components/EmployeeDashboard';
import KitchenDashboard from './kitchen/_components/KitchenDashboard';
import AdminManagerDashboard from './_components/admin/AdminManagerDashboard';
import DashboardHeader from './_components/DashboardHeader';
import { TrialBanner } from '@/components/TrialBanner';

/**
 * Dashboard Page - Role-based routing với tab support cho Admin
 * Route: /dashboard
 */
export default function DashboardPage() {
    const router = useRouter();
    const supabase = createClient();
    const [role, setRole] = useState<string | null>(null);
    const [userName, setUserName] = useState<string>('User');
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'employee' | 'manager'>('employee');

    useEffect(() => {
        const checkUserRole = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            const { data: profile } = await supabase
                .from('users')
                .select('role, full_name')
                .eq('email', user.email)
                .single();

            setRole(profile?.role || 'employee');
            setUserName(profile?.full_name || 'User');
            setIsLoading(false);
        };

        checkUserRole();
    }, [router, supabase]);

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

    // Admin/HR: Có 2 tabs
    if (role === 'admin' || role === 'hr') {
        return (
            <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922]">
                <DashboardHeader
                    userName={userName}
                    userRole={role}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <TrialBanner />
                </div>
                {activeTab === 'employee' ? (
                    <EmployeeDashboard hideHeader={true} />
                ) : (
                    <AdminManagerDashboard />
                )}
            </div>
        );
    }

    // Kitchen staff: Kitchen Dashboard
    if (role === 'kitchen') {
        return <KitchenDashboard />;
    }

    // Employee: Employee Dashboard
    return <EmployeeDashboard />;
}
