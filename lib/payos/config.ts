import { PayOS } from '@payos/node';

/**
 * PayOS SDK Configuration
 * Official payment gateway by Casso
 */

const payOS = new PayOS({
    clientId: process.env.PAYOS_CLIENT_ID || '',
    apiKey: process.env.PAYOS_API_KEY || '',
    checksumKey: process.env.PAYOS_CHECKSUM_KEY || '',
});

export { payOS };

/**
 * Payment plans for PayOS
 */
export const PAYOS_PLANS = {
    basic: {
        name: 'Basic',
        amount: 200000, // VNĐ
        description: 'Goi Basic', // Max 25 chars for PayOS
    },
    pro: {
        name: 'Pro',
        amount: 500000, // VNĐ
        description: 'Goi Pro', // Max 25 chars for PayOS
    },
    enterprise: {
        name: 'Enterprise',
        amount: 0, // Custom
        description: 'Goi Enterprise', // Max 25 chars for PayOS
    },
} as const;

export type PayOSPlan = keyof typeof PAYOS_PLANS;

/**
 * Generate order code from tenant ID and plan
 * Format: Numeric only (PayOS requirement)
 */
export function generateOrderCode(tenantId: string, plan: PayOSPlan): number {
    // Combine tenant ID hash + timestamp for uniqueness
    const tenantHash = tenantId.split('').reduce((acc, char) => {
        return acc + char.charCodeAt(0);
    }, 0);

    const planCode = plan === 'basic' ? 1 : plan === 'pro' ? 2 : 3;
    const timestamp = Date.now() % 1000000; // Last 6 digits of timestamp

    // Combine to create unique order code
    return parseInt(`${planCode}${tenantHash % 1000}${timestamp}`);
}

/**
 * Format amount for display
 */
export function formatVND(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount);
}

/**
 * Create PayOS payment link
 */
export async function createPaymentLink(params: {
    orderCode: number;
    amount: number;
    description: string;
    returnUrl: string;
    cancelUrl: string;
}) {
    try {
        const paymentData = {
            orderCode: params.orderCode,
            amount: params.amount,
            description: params.description,
            returnUrl: params.returnUrl,
            cancelUrl: params.cancelUrl,
        };

        const paymentLinkResponse = await payOS.paymentRequests.create(paymentData);

        return paymentLinkResponse;
    } catch (error: any) {
        console.error('[PAYOS] Error creating payment link:', error);
        throw error;
    }
}

/**
 * Get payment link information
 */
export async function getPaymentLinkInfo(orderCode: number) {
    try {
        return await payOS.paymentRequests.get(orderCode);
    } catch (error: any) {
        console.error('[PAYOS] Error getting payment info:', error);
        throw error;
    }
}

/**
 * Verify webhook signature
 */
export async function verifyWebhookSignature(webhookData: any): Promise<any> {
    try {
        return await payOS.webhooks.verify(webhookData);
    } catch (error: any) {
        console.error('[PAYOS] Error verifying webhook:', error);
        throw error;
    }
}
