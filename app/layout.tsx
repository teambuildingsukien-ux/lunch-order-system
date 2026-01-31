import type { Metadata } from 'next';
import { ToastProvider } from '@/components/providers/toast-provider';
import './globals.css';

export const metadata: Metadata = {
    title: 'VV-Rice Premium - Hệ thống đăng ký suất ăn',
    description: 'Nâng tầm trải nghiệm bữa ăn công sở. Sức khỏe của bạn là ưu tiên hàng đầu của chúng tôi.',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="vi" suppressHydrationWarning>
            <head>
                <link
                    href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
                    rel="stylesheet"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
                    rel="stylesheet"
                />
            </head>
            <body className="antialiased font-[family-name:var(--font-work-sans)]" suppressHydrationWarning>
                <ToastProvider>
                    {children}
                </ToastProvider>
            </body>
        </html>
    );
}
