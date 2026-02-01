import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyWebhookSignature } from '@/lib/payos/config';

/**
 * PayOS Webhook Handler
 * POST /api/billing/payos-webhook
 * 
 * Receives payment notifications from PayOS when payments are completed
 */
export async function POST(request: NextRequest) {
    const body = await request.text();

    let webhookData: any;

    try {
        webhookData = JSON.parse(body);
    } catch (error) {
        console.error('[PAYOS] Invalid JSON payload:', error);
        return NextResponse.json(
            { error: 'Invalid payload' },
            { status: 400 }
        );
    }

    console.log('[PAYOS] Received webhook:', webhookData);

    // Verify webhook signature
    try {
        const verifiedData = await verifyWebhookSignature(webhookData);
        console.log('[PAYOS] Webhook verified successfully');
    } catch (error) {
        console.error('[PAYOS] Invalid webhook signature:', error);
        return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 401 }
        );
    }

    // Use admin client to bypass RLS
    const supabase = createAdminClient();

    try {
        // Extract payment data from webhook
        const { code, desc, data: paymentData } = webhookData;

        if (code !== '00') {
            console.error('[PAYOS] Payment failed:', desc);
            return NextResponse.json({ received: true, error: desc });
        }

        const {
            orderCode,
            amount,
            description,
            accountNumber,
            reference,
        } = paymentData;

        console.log('[PAYOS] Processing successful payment:', orderCode);

        // Find transaction by order code
        const { data: transactions, error: findError } = await supabase
            .from('payment_transactions')
            .select('*, tenants(*)')
            .eq('transaction_id', orderCode.toString())
            .limit(1);

        if (findError || !transactions || transactions.length === 0) {
            console.error('[PAYOS] Transaction not found for order code:', orderCode);
            return NextResponse.json({ received: true, error: 'Transaction not found' });
        }

        const transaction = transactions[0];
        const tenant = transaction.tenants;

        // Check if already processed (idempotency)
        if (transaction.status === 'completed') {
            console.log('[PAYOS] Transaction already processed:', orderCode);
            return NextResponse.json({ received: true, message: 'Already processed' });
        }

        // Update transaction status
        const { error: updateTransactionError } = await supabase
            .from('payment_transactions')
            .update({
                status: 'completed',
                processed_at: new Date().toISOString(),
                casso_data: paymentData, // Store PayOS data
            })
            .eq('id', transaction.id);

        if (updateTransactionError) {
            console.error('[PAYOS] Failed to update transaction:', updateTransactionError);
        }

        // Activate subscription
        const newPeriodEnd = new Date();
        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1); // +30 days subscription

        const { error: updateTenantError } = await supabase
            .from('tenants')
            .update({
                subscription_status: 'active',
                last_payment_date: new Date().toISOString(),
                current_period_end: newPeriodEnd.toISOString(),
                cancel_at_period_end: false,
            })
            .eq('id', tenant.id);

        if (updateTenantError) {
            console.error('[PAYOS] Failed to activate subscription:', updateTenantError);
        } else {
            console.log('[PAYOS] ✅ Subscription activated for tenant:', tenant.id);
        }

        return NextResponse.json({ received: true, orderCode });

    } catch (error: any) {
        console.error('[PAYOS] Webhook handler error:', error);
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
        );
    }
}
