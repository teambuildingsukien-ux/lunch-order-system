'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Material Symbol Icon component
const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

// Loading component for Suspense fallback
function VerifyLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-[#c04b00] dark:text-white mb-2">
                        Cơm Ngon
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Hệ thống quản lý đăng ký suất ăn Premium
                    </p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8">
                    <div className="text-center">
                        <div className="mb-6">
                            <Icon name="progress_activity" className="text-[80px] text-[#c04b00] animate-spin" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                            Đang tải...
                        </h2>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Main verification component (needs to be separate to use useSearchParams)
function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('');
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        const verifyEmail = async () => {
            // Get token from URL
            const token = searchParams.get('token');
            const type = searchParams.get('type');

            if (!token || type !== 'email') {
                setStatus('error');
                setMessage('Link xác thực không hợp lệ');
                return;
            }

            try {
                const supabase = createClient();

                // Verify email using Supabase Auth
                const { error } = await supabase.auth.verifyOtp({
                    token_hash: token,
                    type: 'email',
                });

                if (error) {
                    console.error('Verification error:', error);
                    setStatus('error');
                    setMessage('Link xác thực đã hết hạn hoặc không hợp lệ');
                } else {
                    setStatus('success');
                    setMessage('Email đã được xác thực thành công!');
                }
            } catch (error) {
                console.error('Verification error:', error);
                setStatus('error');
                setMessage('Có lỗi xảy ra khi xác thực email');
            }
        };

        verifyEmail();
    }, [searchParams]);

    // Countdown and auto-redirect on success
    useEffect(() => {
        if (status === 'success') {
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        router.push('/login');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [status, router]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-[#c04b00] dark:text-white mb-2">
                        Cơm Ngon
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Hệ thống quản lý đăng ký suất ăn Premium
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8">
                    <div className="text-center">
                        {/* Verifying State */}
                        {status === 'verifying' && (
                            <>
                                <div className="mb-6">
                                    <Icon name="progress_activity" className="text-[80px] text-[#c04b00] animate-spin" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                                    Đang xác thực...
                                </h2>
                                <p className="text-slate-600 dark:text-slate-400">
                                    Vui lòng đợi trong giây lát
                                </p>
                            </>
                        )}

                        {/* Success State */}
                        {status === 'success' && (
                            <>
                                <div className="mb-6">
                                    <Icon name="check_circle" className="text-[80px] text-green-500" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                                    Xác thực thành công!
                                </h2>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">
                                    {message}
                                </p>
                                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-6">
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Tự động chuyển tới trang đăng nhập trong{' '}
                                        <span className="font-bold text-[#c04b00] dark:text-orange-400">
                                            {countdown}
                                        </span>{' '}
                                        giây...
                                    </p>
                                </div>
                                <button
                                    onClick={() => router.push('/login')}
                                    className="w-full bg-[#c04b00] hover:bg-[#a03e00] text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                >
                                    <Icon name="login" className="text-[20px]" />
                                    Đăng nhập ngay
                                </button>
                            </>
                        )}

                        {/* Error State */}
                        {status === 'error' && (
                            <>
                                <div className="mb-6">
                                    <Icon name="error" className="text-[80px] text-red-500" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                                    Xác thực thất bại
                                </h2>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">
                                    {message}
                                </p>
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => router.push('/signup')}
                                        className="w-full bg-[#c04b00] hover:bg-[#a03e00] text-white px-8 py-3 rounded-xl font-bold transition-all"
                                    >
                                        Đăng ký lại
                                    </button>
                                    <button
                                        onClick={() => router.push('/login')}
                                        className="w-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 px-8 py-3 rounded-xl font-bold transition-all"
                                    >
                                        Về trang đăng nhập
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Help Text */}
                <div className="text-center mt-6">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Cần hỗ trợ?{' '}
                        <a href="mailto:support@vv-rice.com" className="text-[#c04b00] dark:text-orange-400 font-bold hover:underline">
                            Liên hệ hỗ trợ
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}

// Wrap in Suspense boundary (required for useSearchParams in Next.js 15)
export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<VerifyLoading />}>
            <VerifyEmailContent />
        </Suspense>
    );
}
