import vietqr from 'vietqr';
import QRCode from 'qrcode';

/**
 * VietQR Configuration & Generator
 * Generates QR codes for Vietnamese banking transfers
 */

// Bank configuration (placeholder - will be replaced with real values from env)
export const BANK_CONFIG = {
    bankId: process.env.BANK_ID || '970415', // Default: VietinBank
    accountNumber: process.env.BANK_ACCOUNT_NUMBER || '1234567890',
    accountName: process.env.BANK_ACCOUNT_NAME || 'CONG_TY_ABC',
};

// Payment plans (matching existing Stripe plans)
export const VIETQR_PLANS = {
    basic: {
        name: 'Basic',
        amount: 200000, // VNĐ
        description: 'Gói Basic - 50 nhân viên',
    },
    pro: {
        name: 'Pro',
        amount: 500000, // VNĐ
        description: 'Gói Pro - 200 nhân viên',
    },
    enterprise: {
        name: 'Enterprise',
        amount: 0, // Custom - contact sales
        description: 'Gói Enterprise - Không giới hạn',
    },
} as const;

export type VietQRPlan = keyof typeof VIETQR_PLANS;

/**
 * Generate payment reference code
 * Format: TENANT_{tenant_id}_{plan}_{YYYYMM}
 */
export function generatePaymentReference(
    tenantId: string,
    plan: VietQRPlan
): string {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Shorten tenant ID to last 8 chars for readability
    const shortId = tenantId.slice(-8).toUpperCase();

    return `TENANT_${shortId}_${plan.toUpperCase()}_${yearMonth}`;
}

/**
 * Generate VietQR content string
 * Following VietQR standard format
 */
export function generateVietQRContent(params: {
    amount: number;
    paymentReference: string;
    description?: string;
}): string {
    const { amount, paymentReference, description } = params;

    // VietQR format using vietqr library
    const qrContent = vietqr.generate({
        bankId: BANK_CONFIG.bankId,
        accountNumber: BANK_CONFIG.accountNumber,
        accountName: BANK_CONFIG.accountName,
        amount: amount,
        memo: `${paymentReference} ${description || ''}`.trim(),
        template: 'compact', // Use compact template
    });

    return qrContent;
}

/**
 * Generate QR code image as data URL
 */
export async function generateQRCodeImage(
    content: string,
    size: number = 300
): Promise<string> {
    try {
        const qrDataUrl = await QRCode.toDataURL(content, {
            width: size,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF',
            },
        });

        return qrDataUrl;
    } catch (error) {
        console.error('[VIETQR] Error generating QR code image:', error);
        throw error;
    }
}

/**
 * Generate complete payment QR code
 * Returns QR image data URL and payment details
 */
export async function generatePaymentQR(params: {
    tenantId: string;
    plan: VietQRPlan;
}): Promise<{
    qrDataUrl: string;
    paymentReference: string;
    amount: number;
    bankInfo: typeof BANK_CONFIG;
    description: string;
}> {
    const { tenantId, plan } = params;

    const planConfig = VIETQR_PLANS[plan];
    const paymentReference = generatePaymentReference(tenantId, plan);

    // Generate VietQR content
    const qrContent = generateVietQRContent({
        amount: planConfig.amount,
        paymentReference,
        description: planConfig.description,
    });

    // Generate QR code image
    const qrDataUrl = await generateQRCodeImage(qrContent);

    return {
        qrDataUrl,
        paymentReference,
        amount: planConfig.amount,
        bankInfo: BANK_CONFIG,
        description: planConfig.description,
    };
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
 * Parse payment reference to extract tenant ID and plan
 */
export function parsePaymentReference(reference: string): {
    tenantId: string | null;
    plan: string | null;
    yearMonth: string | null;
} {
    // Format: TENANT_{id}_{plan}_{YYYYMM}
    const match = reference.match(/^TENANT_([A-F0-9]+)_([A-Z]+)_(\d{6})$/i);

    if (!match) {
        return { tenantId: null, plan: null, yearMonth: null };
    }

    return {
        tenantId: match[1],
        plan: match[2].toLowerCase(),
        yearMonth: match[3],
    };
}
