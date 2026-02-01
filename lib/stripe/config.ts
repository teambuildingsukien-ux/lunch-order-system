import Stripe from 'stripe';

/**
 * Stripe client configuration
 * Uses latest API version for optimal compatibility
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    apiVersion: '2026-01-28.clover',
    typescript: true,
});

/**
 * Subscription plan definitions
 * Maps to Stripe Products and Prices created in dashboard
 */
export const STRIPE_PLANS = {
    basic: {
        name: 'Basic',
        priceId: process.env.STRIPE_BASIC_PRICE_ID || 'price_basic_placeholder',
        price: 200000, // VND
        currency: 'VND',
        interval: 'month' as const,
        features: [
            'Lên đến 50 nhân viên',
            'Đăng ký & theo dõi suất ăn',
            'Báo cáo cơ bản',
            'Hỗ trợ qua email',
        ],
        maxUsers: 50,
    },
    pro: {
        name: 'Pro',
        priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_placeholder',
        price: 500000, // VND
        currency: 'VND',
        interval: 'month' as const,
        features: [
            'Lên đến 200 nhân viên',
            'Phân tích nâng cao',
            'Tùy chỉnh thương hiệu',
            'Hỗ trợ ưu tiên',
            'Truy cập API',
        ],
        maxUsers: 200,
    },
    enterprise: {
        name: 'Enterprise',
        priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_placeholder',
        price: 'custom' as const,
        currency: 'VND',
        interval: 'month' as const,
        features: [
            'Không giới hạn nhân viên',
            'Hỗ trợ chuyên biệt',
            'Tích hợp tùy chỉnh',
            'Cam kết SLA',
            'Tùy chọn on-premise',
        ],
        maxUsers: -1, // unlimited
    },
} as const;

export type StripePlan = keyof typeof STRIPE_PLANS;

/**
 * Helper to get plan details by key
 */
export function getPlan(plan: StripePlan) {
    return STRIPE_PLANS[plan];
}

/**
 * Helper to format price for display
 */
export function formatPrice(amount: number | 'custom', currency: string = 'VND'): string {
    if (amount === 'custom') {
        return 'Liên hệ';
    }

    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: currency,
    }).format(amount);
}
