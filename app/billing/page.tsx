'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PAYOS_PLANS, formatVND, PayOSPlan } from '@/lib/payos/config';

// Material Symbol Icon component
const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

interface TenantData {
    subscription_status: string;
    plan: string;
    trial_ends_at: string | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
}

export default function BillingPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [processingPlan, setProcessingPlan] = useState<string | null>(null);
    const [tenantData, setTenantData] = useState<TenantData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadTenantData();
    }, []);

    async function loadTenantData() {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            const { data, error } = await supabase
                .from('users')
                .select(`
                    tenants (
                        subscription_status,
                        plan,
                        trial_ends_at,
                        current_period_end,
                        cancel_at_period_end
                    )
                `)
                .eq('id', user.id)
                .single();

            if (error) throw error;

            if (data?.tenants) {
                setTenantData(data.tenants as any);
            }
        } catch (err: any) {
            console.error('Error loading tenant data:', err);
            setError('Không thể tải thông tin thanh toán');
        } finally {
            setLoading(false);
        }
    }

    async function handleUpgrade(plan: string) {
        try {
            setProcessingPlan(plan);
            setError(null);

            const response = await fetch('/api/billing/create-payos-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create payment link');
            }

            // Redirect to PayOS checkout page
            if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
            }
        } catch (err: any) {
            console.error('Payment error:', err);
            setError(err.message);
            setProcessingPlan(null);
        }
    }

    function getTrialDaysRemaining(): number | null {
        if (!tenantData?.trial_ends_at) return null;
        const daysRemaining = Math.ceil(
            (new Date(tenantData.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return Math.max(0, daysRemaining);
    }

    const trialDays = getTrialDaysRemaining();
    const isTrialing = tenantData?.subscription_status === 'trialing';
    const isActive = tenantData?.subscription_status === 'active';
    const isPastDue = tenantData?.subscription_status === 'past_due';

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <Icon name="progress_activity" className="text-[80px] text-[#c04b00] animate-spin" />
                    <p className="mt-4 text-slate-600 dark:text-slate-400">Đang tải...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-12 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
                        Quản lý Thanh toán
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400">
                        Chọn gói phù hợp với nhu cầu của bạn
                    </p>
                </div>

                {/* Current Status Banner */}
                {isTrialing && trialDays !== null && (
                    <div className="mb-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
                        <div className="flex items-center gap-4">
                            <Icon name="info" className="text-[40px] text-blue-600 dark:text-blue-400" />
                            <div className="flex-1">
                                <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-1">
                                    Bạn đang dùng thử miễn phí
                                </h3>
                                <p className="text-blue-700 dark:text-blue-300">
                                    Còn <span className="font-bold">{trialDays} ngày</span> dùng thử.
                                    Nâng cấp ngay để tiếp tục sử dụng sau khi hết hạn.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {isPastDue && (
                    <div className="mb-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
                        <div className="flex items-center gap-4">
                            <Icon name="error" className="text-[40px] text-red-600 dark:text-red-400" />
                            <div className="flex-1">
                                <h3 className="font-bold text-red-900 dark:text-red-100 mb-1">
                                    Thanh toán thất bại
                                </h3>
                                <p className="text-red-700 dark:text-red-300">
                                    Vui lòng gia hạn gói để tiếp tục sử dụng dịch vụ.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mb-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
                        <p className="text-red-700 dark:text-red-300">{error}</p>
                    </div>
                )}

                {/* Pricing Plans */}
                <div className="grid md:grid-cols-3 gap-8 mb-12">
                    {Object.entries(PAYOS_PLANS).map(([key, plan]) => (
                        <div
                            key={key}
                            className={`
                                bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8
                                ${key === 'pro' ? 'ring-4 ring-[#c04b00] scale-105' : ''}
                            `}
                        >
                            {key === 'pro' && (
                                <div className="bg-[#c04b00] text-white px-4 py-2 rounded-full text-sm font-bold inline-block mb-4">
                                    PHỔ BIẾN NHẤT
                                </div>
                            )}

                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                {plan.name}
                            </h3>

                            <div className="mb-6">
                                <span className="text-4xl font-bold text-[#c04b00] dark:text-orange-400">
                                    {plan.amount > 0 ? formatVND(plan.amount) : 'Liên hệ'}
                                </span>
                                {plan.amount > 0 && (
                                    <span className="text-slate-600 dark:text-slate-400">/tháng</span>
                                )}
                            </div>

                            <p className="text-slate-600 dark:text-slate-400 mb-6">
                                {plan.description}
                            </p>

                            {isActive && tenantData?.plan === key ? (
                                <button
                                    className="w-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-8 py-4 rounded-xl font-bold transition-all cursor-default"
                                >
                                    Gói hiện tại
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleUpgrade(key)}
                                    disabled={processingPlan === key || key === 'enterprise'}
                                    className={`
                                        w-full px-8 py-4 rounded-xl font-bold transition-all
                                        ${key === 'pro'
                                            ? 'bg-[#c04b00] hover:bg-[#a03e00] text-white'
                                            : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100'
                                        }
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                    `}
                                >
                                    {processingPlan === key ? 'Đang xử lý...' : key === 'enterprise' ? 'Liên hệ' : 'Nâng cấp ngay'}
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Payment Method Info */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8">
                    <div className="flex items-start gap-4">
                        <Icon name="account_balance" className="text-[48px] text-[#c04b00]" />
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                Thanh toán qua PayOS
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                Chuyển khoản ngân hàng nhanh chóng, an toàn qua PayOS. Gói sẽ được kích hoạt tự động ngay sau khi thanh toán thành công.
                            </p>
                            <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                                <li className="flex items-center gap-2">
                                    <Icon name="check_circle" className="text-green-500 text-[20px]" />
                                    <span>Hỗ trợ tất cả ngân hàng Việt Nam</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Icon name="check_circle" className="text-green-500 text-[20px]" />
                                    <span>QR code tự động & link thanh toán</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Icon name="check_circle" className="text-green-500 text-[20px]" />
                                    <span>Kích hoạt gói ngay lập tức</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
