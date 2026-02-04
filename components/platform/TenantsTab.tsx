'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Building2, TrendingUp, CheckCircle2, Clock, Sparkles, Users, CreditCard, Settings, Palette } from 'lucide-react';

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

export default function TenantsTab() {
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

    const stats = {
        total: tenants.length,
        active: tenants.filter(t => t.subscription_status === 'active').length,
        trial: tenants.filter(t => t.subscription_status === 'trialing').length,
        enterprise: tenants.filter(t => t.plan === 'enterprise').length,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="inline-flex items-center gap-3 text-amber-400">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                    <span className="text-lg font-medium">Đang tải dữ liệu...</span>
                    <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <Card className="border-red-500/30 bg-gradient-to-br from-red-900/20 to-red-800/20 p-12">
                <div className="text-center">
                    <p className="text-red-300">{error}</p>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Total */}
                <Card className="relative overflow-hidden border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 shadow-xl hover:shadow-amber-500/10 transition-all duration-300 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-400">Tổng Tenants</p>
                            <Building2 className="w-4 h-4 text-amber-400" />
                        </div>
                        <p className="text-3xl font-bold text-amber-300">{stats.total}</p>
                        <div className="mt-2 h-1 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full" />
                    </div>
                </Card>

                {/* Active */}
                <Card className="relative overflow-hidden border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-400">Active</p>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        </div>
                        <p className="text-3xl font-bold text-emerald-300">{stats.active}</p>
                        <div className="mt-2 h-1 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full" />
                    </div>
                </Card>

                {/* Trial */}
                <Card className="relative overflow-hidden border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 shadow-xl hover:shadow-blue-500/10 transition-all duration-300 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-400">Trial</p>
                            <Clock className="w-4 h-4 text-blue-400" />
                        </div>
                        <p className="text-3xl font-bold text-blue-300">{stats.trial}</p>
                        <div className="mt-2 h-1 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full" />
                    </div>
                </Card>

                {/* Enterprise */}
                <Card className="relative overflow-hidden border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 shadow-xl hover:shadow-purple-500/10 transition-all duration-300 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-400">Enterprise</p>
                            <TrendingUp className="w-4 h-4 text-purple-400" />
                        </div>
                        <p className="text-3xl font-bold text-purple-300">{stats.enterprise}</p>
                        <div className="mt-2 h-1 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full" />
                    </div>
                </Card>
            </div>

            {/* Search */}
            <Card className="border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 shadow-xl">
                <div className="p-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            type="text"
                            placeholder="Tìm kiếm tenant (tên hoặc slug)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-slate-950 border-slate-700 text-slate-200 placeholder:text-slate-500 hover:border-amber-500/50 focus:border-amber-500 transition-colors"
                        />
                    </div>
                </div>
            </Card>

            {/* Tenant Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredTenants.map((tenant) => (
                    <Card
                        key={tenant.id}
                        className="border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 shadow-xl hover:shadow-amber-500/10 transition-all duration-300 group overflow-hidden"
                    >
                        {/* Hover glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="relative p-6">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-slate-200 mb-1 group-hover:text-amber-300 transition-colors">
                                        {tenant.name}
                                    </h3>
                                    <p className="text-sm text-slate-400 font-mono">
                                        @{tenant.slug}
                                    </p>
                                </div>

                                <StatusBadge status={tenant.subscription_status} />
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="text-center p-3 rounded-lg bg-slate-950/50 border border-slate-800">
                                    <p className="text-xs text-slate-500 mb-1">Gói</p>
                                    <PlanBadge plan={tenant.plan} />
                                </div>
                                <div className="text-center p-3 rounded-lg bg-slate-950/50 border border-slate-800">
                                    <p className="text-xs text-slate-500 mb-1">Users</p>
                                    <div className="flex items-center justify-center gap-1">
                                        <Users className="w-3 h-3 text-blue-400" />
                                        <p className="text-sm font-semibold text-slate-200">
                                            {tenant.users?.[0]?.count || 0}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-center p-3 rounded-lg bg-slate-950/50 border border-slate-800">
                                    <p className="text-xs text-slate-500 mb-1">Payments</p>
                                    <div className="flex items-center justify-center gap-1">
                                        <CreditCard className="w-3 h-3 text-amber-400" />
                                        <p className="text-sm font-semibold text-slate-200">
                                            {tenant.payment_transactions?.[0]?.count || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => router.push(`/platform/tenants/${tenant.id}/branding`)}
                                    className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-semibold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all"
                                >
                                    <Palette className="w-4 h-4 mr-2" />
                                    Branding
                                </Button>
                                <Button
                                    onClick={() => router.push(`/platform/tenants/${tenant.id}`)}
                                    className="px-4 bg-slate-950 border-slate-700 hover:border-amber-500/50 hover:bg-slate-800 text-slate-300 transition-colors"
                                    variant="outline"
                                >
                                    <Settings className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-3 bg-slate-950/50 border-t border-slate-800">
                            <p className="text-xs text-slate-500">
                                Tạo: {new Date(tenant.created_at).toLocaleDateString('vi-VN')}
                            </p>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Empty State */}
            {filteredTenants.length === 0 && (
                <Card className="border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 p-12">
                    <div className="text-center">
                        <div className="mb-4 inline-flex p-4 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/30">
                            <Sparkles className="w-8 h-8 text-amber-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-200 mb-2">
                            {searchQuery ? 'Không tìm thấy tenant nào' : 'Chưa có tenant nào'}
                        </h3>
                        <p className="text-slate-400">
                            {searchQuery ? 'Thử tìm kiếm với từ khóa khác' : 'Các tenant mới sẽ hiển thị ở đây'}
                        </p>
                    </div>
                </Card>
            )}
        </div>
    );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
    const configs: Record<string, { label: string; className: string }> = {
        active: {
            label: 'Active',
            className: 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 border-emerald-500/50',
        },
        trialing: {
            label: 'Trialing',
            className: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border-blue-500/50',
        },
        past_due: {
            label: 'Past Due',
            className: 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 border-yellow-500/50',
        },
        canceled: {
            label: 'Canceled',
            className: 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-300 border-red-500/50',
        },
    };

    const config = configs[status] || configs.canceled;

    return (
        <Badge variant="outline" className={`px-3 py-1 font-semibold ${config.className}`}>
            {config.label}
        </Badge>
    );
}

// Plan Badge Component
function PlanBadge({ plan }: { plan: string }) {
    const configs: Record<string, { className: string }> = {
        enterprise: { className: 'text-purple-400 font-bold uppercase' },
        pro: { className: 'text-orange-400 font-bold uppercase' },
        basic: { className: 'text-blue-400 font-bold uppercase' },
    };

    const config = configs[plan.toLowerCase()] || configs.basic;

    return <p className={`text-sm ${config.className}`}>{plan}</p>;
}
