'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Material Symbol Icon component
const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export function TrialBanner() {
    const router = useRouter();
    const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
    const [dismissed, setDismissed] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkTrialStatus();
    }, []);

    async function checkTrialStatus() {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) return;

            const { data, error } = await supabase
                .from('users')
                .select(`
                    tenants (
                        subscription_status,
                        trial_ends_at
                    )
                `)
                .eq('id', user.id)
                .single();

            if (error || !data) return;

            const tenant = data.tenants as any;

            // Only show if trialing
            if (tenant?.subscription_status === 'trialing' && tenant.trial_ends_at) {
                const days = Math.ceil(
                    (new Date(tenant.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );
                setDaysRemaining(Math.max(0, days));
            }
        } catch (err) {
            console.error('Error checking trial status:', err);
        } finally {
            setLoading(false);
        }
    }

    // Don't show banner if:
    // - Loading
    // - No trial days remaining data
    // - Dismissed
    // - More than 7 days remaining (only show last week of trial)
    if (loading || daysRemaining === null || dismissed || daysRemaining > 7) {
        return null;
    }

    const urgencyLevel = daysRemaining <= 3 ? 'high' : 'medium';

    return (
        <div
            className={`
                relative overflow-hidden rounded-2xl p-6 mb-6
                ${urgencyLevel === 'high'
                    ? 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800'
                    : 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800'
                }
            `}
        >
            {/* Close button */}
            <button
                onClick={() => setDismissed(true)}
                className="absolute top-4 right-4 p-2 hover:bg-white/50 dark:hover:bg-black/20 rounded-lg transition-all"
                aria-label="Đóng"
            >
                <Icon name="close" className="text-[20px] text-slate-600 dark:text-slate-400" />
            </button>

            <div className="flex items-center gap-6 pr-10">
                {/* Icon */}
                <div className={`
                    p-4 rounded-2xl
                    ${urgencyLevel === 'high'
                        ? 'bg-red-100 dark:bg-red-900/40'
                        : 'bg-blue-100 dark:bg-blue-900/40'
                    }
                `}>
                    <Icon
                        name={urgencyLevel === 'high' ? 'schedule' : 'info'}
                        className={`
                            text-[40px]
                            ${urgencyLevel === 'high'
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-blue-600 dark:text-blue-400'
                            }
                        `}
                    />
                </div>

                {/* Content */}
                <div className="flex-1">
                    <h3 className={`
                        text-xl font-bold mb-2
                        ${urgencyLevel === 'high'
                            ? 'text-red-900 dark:text-red-100'
                            : 'text-blue-900 dark:text-blue-100'
                        }
                    `}>
                        {urgencyLevel === 'high'
                            ? '🔥 Dùng thử sắp hết hạn!'
                            : '⏰ Nhắc nhở dùng thử'
                        }
                    </h3>
                    <p className={`
                        mb-4
                        ${urgencyLevel === 'high'
                            ? 'text-red-700 dark:text-red-300'
                            : 'text-blue-700 dark:text-blue-300'
                        }
                    `}>
                        Bạn còn <span className="font-bold text-2xl">{daysRemaining}</span> ngày dùng thử miễn phí.
                        Nâng cấp ngay để tiếp tục sử dụng sau khi hết hạn.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => router.push('/billing')}
                            className={`
                                px-6 py-3 rounded-xl font-bold transition-all inline-flex items-center gap-2
                                ${urgencyLevel === 'high'
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }
                            `}
                        >
                            <Icon name="upgrade" className="text-[20px]" />
                            Nâng cấp ngay
                        </button>
                        <button
                            onClick={() => router.push('/billing')}
                            className="px-6 py-3 rounded-xl font-bold transition-all border-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
                        >
                            Xem các gói
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
