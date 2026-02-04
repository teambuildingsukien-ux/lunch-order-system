'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateSlug } from '@/lib/utils/slug';
import CompanyInfoForm, { CompanyInfo } from './_components/CompanyInfoForm';

// Material Symbol Icon component
const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export default function SignupPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form data
    const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
    const [orgName, setOrgName] = useState('');
    const [orgSlug, setOrgSlug] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [adminName, setAdminName] = useState('');

    // Validation states
    const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
    const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);

    // Auto-generate slug from organization name
    const handleOrgNameChange = (name: string) => {
        setOrgName(name);
        const slug = generateSlug(name);
        setOrgSlug(slug);
        setSlugAvailable(null); // Reset availability check
    };

    // Check slug availability
    const checkSlugAvailability = async () => {
        if (!orgSlug || orgSlug.length < 3) return;

        setLoading(true);
        try {
            const res = await fetch('/api/signup/check-availability', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug: orgSlug }),
            });
            const data = await res.json();
            setSlugAvailable(data.available);
            if (!data.available) {
                setError(data.message);
            } else {
                setError('');
            }
        } catch (err) {
            console.error('Slug check error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Check email availability
    const checkEmailAvailability = async () => {
        if (!adminEmail) return;

        setLoading(true);
        try {
            const res = await fetch('/api/signup/check-availability', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: adminEmail }),
            });
            const data = await res.json();
            setEmailAvailable(data.available);
            if (!data.available) {
                setError(data.message);
            } else {
                setError('');
            }
        } catch (err) {
            console.error('Email check error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Handle signup submission
    const handleSignup = async () => {
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/signup/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    company: companyInfo,
                    organization: {
                        name: orgName,
                        slug: orgSlug,
                    },
                    admin: {
                        email: adminEmail,
                        password: adminPassword,
                        full_name: adminName,
                    },
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Có lỗi xảy ra khi đăng ký');
                return;
            }

            // Success! Go to step 5 (email verification)
            setStep(5);
        } catch (err) {
            console.error('Signup error:', err);
            setError('Lỗi kết nối. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => {
        setError('');
        // Step 1 (Company Info) validation handled by CompanyInfoForm
        if (step === 2) {
            if (!orgName || !orgSlug) {
                setError('Vui lòng điền đầy đủ thông tin tổ chức');
                return;
            }
            if (slugAvailable === false) {
                setError('Slug không khả dụng. Vui lòng chọn slug khác.');
                return;
            }
        }
        if (step === 3) {
            if (!adminEmail || !adminPassword || !adminName) {
                setError('Vui lòng điền đầy đủ thông tin admin');
                return;
            }
            if (adminPassword.length < 8) {
                setError('Mật khẩu phải có ít nhất 8 ký tự');
                return;
            }
            if (emailAvailable === false) {
                setError('Email đã được sử dụng');
                return;
            }
        }
        setStep(step + 1);
    };

    const prevStep = () => {
        setError('');
        setStep(step - 1);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-[#c04b00] dark:text-white mb-2">
                        Cơm Ngon
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Hệ thống quản lý đăng ký suất ăn Premium
                    </p>
                </div>

                {/* Progress Steps */}
                {step < 5 && (
                    <div className="flex justify-center mb-8">
                        {[1, 2, 3, 4].map((s) => (
                            <div key={s} className="flex items-center">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= s
                                        ? 'bg-[#c04b00] text-white'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                                        }`}
                                >
                                    {s}
                                </div>
                                {s < 4 && (
                                    <div
                                        className={`w-16 h-1 mx-2 ${step > s
                                            ? 'bg-[#c04b00]'
                                            : 'bg-slate-200 dark:bg-slate-700'
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Main Card */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8">
                    {/* Step 1: Company Info */}
                    {step === 1 && (
                        <CompanyInfoForm
                            onNext={(data) => {
                                setCompanyInfo(data);
                                setAdminEmail(data.contact_email);
                                setAdminName(data.contact_name);
                                nextStep();
                            }}
                            initialData={companyInfo || undefined}
                        />
                    )}

                    {/* Step 2: Organization Info */}
                    {step === 2 && (
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                                Thông tin tổ chức
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Tên tổ chức <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={orgName}
                                        onChange={(e) => handleOrgNameChange(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-[#c04b00] focus:outline-none transition-colors"
                                        placeholder="VD: Công ty ABC"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Slug (URL) <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={orgSlug}
                                            onChange={(e) => {
                                                setOrgSlug(e.target.value.toLowerCase());
                                                setSlugAvailable(null);
                                            }}
                                            onBlur={checkSlugAvailability}
                                            className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-[#c04b00] focus:outline-none transition-colors"
                                            placeholder="cong-ty-abc"
                                        />
                                        {slugAvailable === true && (
                                            <Icon name="check_circle" className="text-green-500 text-[24px]" />
                                        )}
                                        {slugAvailable === false && (
                                            <Icon name="cancel" className="text-red-500 text-[24px]" />
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        Slug sẽ được sử dụng trong URL: {orgSlug}.vv-rice.com
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Admin Account */}
                    {step === 3 && (
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                                Tài khoản quản trị viên
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Họ và tên <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={adminName}
                                        onChange={(e) => setAdminName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-[#c04b00] focus:outline-none transition-colors"
                                        placeholder="Nguyễn Văn A"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="email"
                                            value={adminEmail}
                                            onChange={(e) => {
                                                setAdminEmail(e.target.value);
                                                setEmailAvailable(null);
                                            }}
                                            onBlur={checkEmailAvailability}
                                            className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-[#c04b00] focus:outline-none transition-colors"
                                            placeholder="admin@example.com"
                                        />
                                        {emailAvailable === true && (
                                            <Icon name="check_circle" className="text-green-500 text-[24px]" />
                                        )}
                                        {emailAvailable === false && (
                                            <Icon name="cancel" className="text-red-500 text-[24px]" />
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Mật khẩu <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        value={adminPassword}
                                        onChange={(e) => setAdminPassword(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-[#c04b00] focus:outline-none transition-colors"
                                        placeholder="Ít nhất 8 ký tự"
                                    />
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        Tối thiểu 8 ký tự, nên bao gồm chữ hoa, chữ thường và số
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Confirmation */}
                    {step === 4 && (
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                                Xác nhận thông tin
                            </h2>

                            <div className="space-y-6 bg-slate-50 dark:bg-slate-800 rounded-xl p-6">
                                <div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Tổ chức</p>
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">{orgName}</p>
                                    <p className="text-sm text-slate-500">{orgSlug}.vv-rice.com</p>
                                </div>

                                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Quản trị viên</p>
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">{adminName}</p>
                                    <p className="text-sm text-slate-500">{adminEmail}</p>
                                </div>

                                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                        <Icon name="check_circle" className="text-[20px]" />
                                        <p className="font-medium">14 ngày dùng thử miễn phí</p>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                                        Không cần thẻ tín dụng. Hủy bất cứ lúc nào.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Email Verification Required */}
                    {step === 5 && (
                        <div className="text-center py-8">
                            <div className="mb-6">
                                <Icon name="mark_email_unread" className="text-[80px] text-orange-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                                Vui lòng xác nhận email!
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400 mb-6">
                                Chúng tôi đã gửi email xác thực đến <strong>{adminEmail}</strong>
                                <br />
                                Vui lòng kiểm tra hộp thư và click vào link để kích hoạt email.
                            </p>
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                    ⚠️ Sau khi xác nhận email, tài khoản của bạn sẽ được admin platform duyệt trước khi có thể sử dụng.
                                </p>
                            </div>
                            <button
                                onClick={() => router.push('/login')}
                                className="bg-[#c04b00] hover:bg-[#a03e00] text-white px-8 py-3 rounded-xl font-bold transition-all"
                            >
                                Đi tới đăng nhập
                            </button>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && step < 5 && (
                        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2">
                            <Icon name="error" className="text-red-500 text-[20px] mt-0.5" />
                            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    {step < 5 && step !== 1 && (
                        <div className="flex items-center justify-between mt-8">
                            {step > 1 && (
                                <button
                                    onClick={prevStep}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all disabled:opacity-50"
                                >
                                    <Icon name="arrow_back" className="text-[20px]" />
                                    Quay lại
                                </button>
                            )}
                            {step < 4 && (
                                <button
                                    onClick={nextStep}
                                    disabled={loading}
                                    className="ml-auto flex items-center gap-2 px-8 py-3 bg-[#c04b00] hover:bg-[#a03e00] text-white rounded-xl font-bold transition-all disabled:opacity-50"
                                >
                                    Tiếp tục
                                    <Icon name="arrow_forward" className="text-[20px]" />
                                </button>
                            )}
                            {step === 4 && (
                                <button
                                    onClick={handleSignup}
                                    disabled={loading}
                                    className="ml-auto flex items-center gap-2 px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold transition-all disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <Icon name="progress_activity" className="text-[20px] animate-spin" />
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        <>
                                            <Icon name="check_circle" className="text-[20px]" />
                                            Hoàn tất đăng ký
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Login Link */}
                {step < 5 && (
                    <div className="text-center mt-6">
                        <p className="text-slate-600 dark:text-slate-400">
                            Đã có tài khoản?{' '}
                            <a href="/login" className="text-[#c04b00] dark:text-orange-400 font-bold hover:underline">
                                Đăng nhập ngay
                            </a>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
