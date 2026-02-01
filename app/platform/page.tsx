'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';

interface Tenant {
    id: string;
    name: string;
    slug: string;
    plan: string;
    subscription_status: string;
    created_at: string;
    users?: { count: number }[];
    payment_transactions?: { count: number }[];
}

export default function PlatformDashboard() {
    const router = useRouter();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadTenants();
    }, []);

    async function loadTenants() {
        try {
            setLoading(true);
            const res = await fetch('/api/platform/tenants');

            if (res.status === 403) {
                // Not authorized - redirect to dashboard
                router.push('/dashboard');
                return;
            }

            if (!res.ok) {
                throw new Error('Failed to load tenants');
            }

            const data = await res.json();
            setTenants(data.tenants || []);
        } catch (err: any) {
            console.error('Error loading tenants:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    const filteredTenants = tenants.filter(tenant =>
        tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'trialing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'past_due': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'canceled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        }
    };

    const getPlanColor = (plan: string) => {
        switch (plan.toLowerCase()) {
            case 'enterprise': return 'text-purple-600 dark:text-purple-400';
            case 'pro': return 'text-orange-600 dark:text-orange-400';
            case 'basic': return 'text-blue-600 dark:text-blue-400';
            default: return 'text-gray-600 dark:text-gray-400';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Đang tải...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <Icon name="error" className="text-red-600 text-6xl mb-4" />
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                <Icon name="admin_panel_settings" className="text-4xl text-primary-600" />
                                Platform Dashboard
                            </h1>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">
                                Quản lý {tenants.length} doanh nghiệp
                            </p>
                        </div>

                        <button
                            onClick={() => router.push('/dashboard')}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
                        >
                            <Icon name="arrow_back" className="text-xl" />
                            <span>Về Dashboard</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                <Icon name="business" className="text-2xl text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Tổng Tenants</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{tenants.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                                <Icon name="check_circle" className="text-2xl text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {tenants.filter(t => t.subscription_status === 'active').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                <Icon name="schedule" className="text-2xl text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Trial</p>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {tenants.filter(t => t.subscription_status === 'trialing').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                                <Icon name="trending_up" className="text-2xl text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Enterprise</p>
                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    {tenants.filter(t => t.plan === 'enterprise').length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <div className="relative">
                        <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm tenant (tên hoặc slug)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Tenant List */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredTenants.map((tenant) => (
                        <div
                            key={tenant.id}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                            {tenant.name}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            @{tenant.slug}
                                        </p>
                                    </div>

                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(tenant.subscription_status)}`}>
                                        {tenant.subscription_status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Gói</p>
                                        <p className={`text-sm font-semibold uppercase ${getPlanColor(tenant.plan)}`}>
                                            {tenant.plan}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Users</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {tenant.users?.[0]?.count || 0}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Payments</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {tenant.payment_transactions?.[0]?.count || 0}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => router.push(`/platform/tenants/${tenant.id}/branding`)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition-colors"
                                    >
                                        <Icon name="palette" className="text-lg" />
                                        <span className="text-sm font-medium">Branding</span>
                                    </button>

                                    <button
                                        onClick={() => router.push(`/platform/tenants/${tenant.id}`)}
                                        className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
                                    >
                                        <Icon name="settings" className="text-lg" />
                                    </button>
                                </div>
                            </div>

                            <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Tạo: {new Date(tenant.created_at).toLocaleDateString('vi-VN')}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredTenants.length === 0 && (
                    <div className="text-center py-12">
                        <Icon name="search_off" className="text-6xl text-gray-400 mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">
                            {searchQuery ? 'Không tìm thấy tenant nào' : 'Chưa có tenant nào'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
