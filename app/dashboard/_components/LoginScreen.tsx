'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, User, Lock, Globe, Utensils } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/providers/toast-provider';

/**
 * LoginScreen Component
 * Màn hình đăng nhập Cơm Ngon với thiết kế hiện đại
 * Tích hợp Supabase Auth, Dark Mode, Form validation, và UX animations
 */
export default function LoginScreen() {
    const router = useRouter();
    const { showToast } = useToast();
    const supabase = createClient();

    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // 1. Authenticate with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password,
            });

            if (authError) {
                // Handle authentication errors
                if (authError.message.includes('Invalid login credentials')) {
                    showToast('❌ Email hoặc mật khẩu không đúng!', '🔒', 4000);
                } else if (authError.message.includes('Email not confirmed')) {
                    showToast('⚠️ Tài khoản chưa được kích hoạt!', '📧', 4000);
                } else {
                    showToast(`❌ Đăng nhập thất bại: ${authError.message}`, '⚠️', 4000);
                }
                setIsLoading(false);
                return;
            }

            if (!authData.user) {
                showToast('❌ Không tìm thấy thông tin người dùng!', '⚠️', 4000);
                setIsLoading(false);
                return;
            }

            // 2. Fetch user profile from database to get role
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id, email, full_name, role, department')
                .eq('email', authData.user.email)
                .single();

            if (userError || !userData) {
                showToast('❌ Không tìm thấy thông tin nhân viên trong hệ thống!', '⚠️', 4000);
                // Sign out if user not in database
                await supabase.auth.signOut();
                setIsLoading(false);
                return;
            }

            // 3. Show success toast with user info
            showToast(`✅ Chào mừng ${userData.full_name}!`, '👋', 3000);

            // 4. Redirect to dashboard (middleware will handle role-based routing)
            // The unified dashboard at /dashboard will show different content based on role
            router.push('/dashboard');
            router.refresh();

        } catch (error) {
            console.error('Login error:', error);
            showToast('❌ Đã có lỗi xảy ra, vui lòng thử lại!', '⚠️', 4000);
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full overflow-hidden bg-[#f8f7f5] dark:bg-[#23170f]">
            {/* Left Side: Visual Panel - Hidden on mobile, visible on lg screens */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                {/* Background Image with blur effect */}
                <div
                    className="absolute inset-0 bg-cover bg-center scale-105 blur-[2px]"
                    style={{
                        backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAXppsyDblsTqOQYlsk1Aqjit9XS1uDYPs7BkMAAjx9onfLPDUJFp5mb2q0JOogC2XNMUSEtkjNapiI1xZaA4PtagyxKOzBU87hIepOq83JbAgotR_j5NtsqHpiU2Wfv40z1pcrt-nvvCcwORuMHxhQZF_Y1jyMy9Xng1Vdm2xCIQ3QF1hf2UPgr1paCV0jbFxsOUsYQfV5xqTneuEbn7qXn-vROW5LgwK4MNmkpL0K1gIphcOUnxPaJPEMXhC5vorlN_Ki-PdYdj0")'
                    }}
                    aria-label="Blurred image of a healthy office meal with fresh vegetables"
                />

                {/* Animated Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#b24700]/80 via-[#d35400]/60 to-[#23170f]/50 animate-gradient" />

                {/* Floating Particles Effect */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[20%] left-[10%] w-2 h-2 bg-white/30 rounded-full animate-float-slow" />
                    <div className="absolute top-[60%] left-[30%] w-3 h-3 bg-white/20 rounded-full animate-float-medium" />
                    <div className="absolute top-[40%] right-[20%] w-2 h-2 bg-white/25 rounded-full animate-float-fast" />
                    <div className="absolute bottom-[30%] right-[15%] w-4 h-4 bg-white/15 rounded-full animate-float-slow" />
                    <div className="absolute top-[70%] left-[60%] w-2 h-2 bg-white/30 rounded-full animate-float-medium" />
                </div>

                {/* Main Content */}
                <div className="absolute inset-0 flex flex-col justify-center px-20 z-10">
                    <div className="max-w-md animate-fade-in-up">
                        {/* Logo with pulse animation */}
                        <div className="mb-8 animate-pulse-slow">
                            <svg
                                className="text-white w-20 h-20 drop-shadow-2xl"
                                fill="none"
                                viewBox="0 0 48 48"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z"
                                    fill="currentColor"
                                />
                            </svg>
                        </div>

                        {/* Heading with gradient text */}
                        <h1 className="text-white text-5xl font-black leading-tight tracking-tight mb-6 drop-shadow-lg animate-slide-in-left">
                            Cơm Ngon
                        </h1>

                        {/* Description with updated text */}
                        <p className="text-white/95 text-xl font-medium leading-relaxed mb-4 drop-shadow-md animate-slide-in-left" style={{ animationDelay: '0.1s' }}>
                            Nâng tầm trải nghiệm bữa ăn Viet Vision. Sức khỏe của bạn là ưu tiên hàng đầu của chúng tôi.
                        </p>

                        {/* Additional info badge inline */}
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 animate-slide-in-left" style={{ animationDelay: '0.2s' }}>
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-ping" />
                            <span className="text-white/90 text-sm font-semibold">
                                Cung cấp hơn 100 suất ăn mỗi ngày
                            </span>
                        </div>

                        {/* Pagination indicators with animation */}
                        <div className="mt-12 flex gap-4 animate-slide-in-left" style={{ animationDelay: '0.3s' }}>
                            <div className="h-1.5 w-14 bg-white rounded-full shadow-lg shadow-white/30 transition-all" />
                            <div className="h-1.5 w-5 bg-white/40 rounded-full transition-all hover:bg-white/70 hover:w-14 cursor-pointer" />
                            <div className="h-1.5 w-5 bg-white/40 rounded-full transition-all hover:bg-white/70 hover:w-14 cursor-pointer" />
                        </div>
                    </div>
                </div>

                {/* Bottom Stats Badge with hover effect */}
                <div className="absolute bottom-12 left-12 group z-20">
                    <div className="flex items-center gap-4 bg-white/15 backdrop-blur-lg p-5 rounded-2xl border border-white/25 transition-all duration-300 hover:bg-white/20 hover:scale-105 hover:shadow-2xl cursor-pointer">
                        <div className="bg-white/20 p-3 rounded-xl group-hover:bg-white/30 transition-colors">
                            <Utensils className="text-white w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-white text-lg font-bold">100+</p>
                            <p className="text-white/80 text-xs font-medium">Suất ăn mỗi ngày</p>
                        </div>
                    </div>
                </div>

                {/* Decorative glow effect */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse-slow" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
            </div>

            {/* Right Side: Login Panel */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-white dark:bg-[#23170f] p-8 md:p-16 lg:p-24">
                <div className="w-full max-w-[440px] flex flex-col">

                    {/* Brand Mobile Logo - Only shown on mobile */}
                    <div className="lg:hidden flex items-center gap-3 mb-12">
                        <div className="text-[#b24700] size-8">
                            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z"
                                    fill="currentColor"
                                />
                            </svg>
                        </div>
                        <span className="text-2xl font-bold text-[#181410] dark:text-white">Cơm Ngon</span>
                    </div>

                    {/* Welcome Text */}
                    <div className="mb-10">
                        <h2 className="text-[#181410] dark:text-white text-3xl font-bold leading-tight tracking-tight mb-2">
                            Chào mừng bạn quay trở lại
                        </h2>
                        <p className="text-[#8d715e] dark:text-gray-400 text-base">
                            Vui lòng đăng nhập vào hệ thống để bắt đầu đăng ký suất ăn.
                        </p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                        {/* Email Field */}
                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="email"
                                className="text-[#181410] dark:text-white text-sm font-bold leading-normal"
                            >
                                Email
                            </label>
                            <div className="relative flex items-center">
                                <User className="absolute left-4 text-[#b24700] w-5 h-5" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="flex w-full h-14 pl-12 pr-4 bg-white dark:bg-[#23170f] border border-[#e7dfda] dark:border-gray-700 rounded-lg text-[#181410] dark:text-white focus:ring-2 focus:ring-[#b24700]/20 focus:border-[#b24700] placeholder:text-[#8d715e]/50 text-base font-normal transition-all outline-none"
                                    placeholder="Ví dụ: ten@company.vn"
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="password"
                                className="text-[#181410] dark:text-white text-sm font-bold leading-normal"
                            >
                                Mật khẩu
                            </label>
                            <div className="relative flex items-center">
                                <Lock className="absolute left-4 text-[#b24700] w-5 h-5" />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="flex w-full h-14 pl-12 pr-12 bg-white dark:bg-[#23170f] border border-[#e7dfda] dark:border-gray-700 rounded-lg text-[#181410] dark:text-white focus:ring-2 focus:ring-[#b24700]/20 focus:border-[#b24700] placeholder:text-[#8d715e]/50 text-base font-normal transition-all outline-none"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 text-[#8d715e] hover:text-[#b24700] transition-colors"
                                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me Checkbox */}
                        <div className="flex items-center gap-3">
                            <input
                                id="remember"
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-[#b24700] focus:ring-[#b24700] cursor-pointer transition-all"
                            />
                            <label
                                htmlFor="remember"
                                className="text-sm text-[#8d715e] dark:text-gray-400 cursor-pointer select-none"
                            >
                                Ghi nhớ đăng nhập
                            </label>
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex w-full items-center justify-center rounded-lg h-14 bg-[#b24700] hover:bg-[#b24700]/90 transition-all text-white text-base font-bold shadow-lg shadow-[#b24700]/20 mt-4 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#b24700]"
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    <span>Đang xử lý...</span>
                                </div>
                            ) : (
                                <span className="truncate">Đăng nhập ngay</span>
                            )}
                        </button>
                    </form>

                    {/* Footer Links */}
                    <div className="mt-12 pt-8 border-t border-[#f5f2f0] dark:border-gray-800 text-center space-y-3">
                        <p className="text-sm text-[#8d715e] dark:text-gray-400">
                            Bạn gặp vấn đề khi đăng nhập?{' '}
                            <a className="text-[#b24700] font-bold hover:underline ml-1 transition-all" href="#">
                                Liên hệ nhân sự
                            </a>
                        </p>
                        <p className="text-sm text-[#8d715e] dark:text-gray-400">
                            Chưa có tài khoản?{' '}
                            <a className="text-[#b24700] font-bold hover:underline ml-1 transition-all" href="/signup">
                                Đăng ký ngay
                            </a>
                        </p>
                    </div>

                    {/* Bottom Bar */}
                    <div className="mt-auto pt-10 flex items-center justify-center gap-4">
                        <div className="text-[#8d715e] dark:text-gray-500 text-xs font-medium">
                            © 2026 Cơm Ngon • BY Thân Công Hải
                        </div>
                        <div className="w-1 h-1 bg-[#8d715e]/30 rounded-full" />
                        <button className="flex items-center gap-1 cursor-pointer hover:text-[#b24700] transition-colors text-xs font-bold text-[#8d715e]">
                            <Globe className="w-3 h-3" />
                            Tiếng Việt
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
