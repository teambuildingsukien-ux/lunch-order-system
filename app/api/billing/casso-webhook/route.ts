import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parsePaymentReference } from '@/lib/vietqr/config';

// Casso webhook payload types
interface CassoTransaction {
    id: number;
    tid: string; // Transaction ID from bank
    description: string; // Transaction description/content
    amount: number;
    when: string; // ISO timestamp
    bank_sub_acc_id: string;
    subAccId: string;
}

interface CassoWebhookPayload {
    error: number;
    messages: string[];
    data: CassoTransaction[];
}

/**
 * Casso Webhook Handler
 * POST /api/billing/casso-webhook
 * 
 * Receives transaction notifications from Casso when payments are detected
 */
export async function POST(request: NextRequest) {
    const body = await request.text();

    // Verify Casso webhook signature (if configured)
    const signature = request.headers.get('x-casso-signature');
    const webhookSecret = process.env.CASSO_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
        // TODO: Implement signature verification when Casso credentials are available
        // const isValid = verifyCassoSignature(body, signature, webhookSecret);
        // if (!isValid) {
        //     console.error('[CASSO] Invalid webhook signature');
        //     return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        // }
    }

    let payload: CassoWebhookPayload;

    try {
        payload = JSON.parse(body);
    } catch (error) {
        console.error('[CASSO] Invalid JSON payload:', error);
        return NextResponse.json(
            { error: 'Invalid payload' },
            { status: 400 }
        );
    }

    console.log('[CASSO] Received webhook:', payload);

    // Use admin client to bypass RLS
    const supabase = createAdminClient();

    try {
        // Process each transaction
        for (const transaction of payload.data || []) {
            await processTransaction(supabase, transaction);
        }

        return NextResponse.json({ received: true, processed: payload.data?.length || 0 });

    } catch (error: any) {
        console.error('[CASSO] Webhook handler error:', error);
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
        );
    }
}

/**
 * Process a single Casso transaction
 */
async function processTransaction(supabase: any, transaction: CassoTransaction) {
    console.log('[CASSO] Processing transaction:', transaction.tid);

    // Extract payment reference from description
    // Format: "TENANT_{id}_{plan}_{YYYYMM} ..."
    const match = transaction.description.match(/TENANT_[A-F0-9]+_[A-Z]+_\d{6}/i);

    if (!match) {
        console.log('[CASSO] No valid payment reference found in:', transaction.description);
        return;
    }

    const paymentReference = match[0];
    const parsed = parsePaymentReference(paymentReference);

    if (!parsed.tenantId || !parsed.plan) {
        console.log('[CASSO] Invalid payment reference format:', paymentReference);
        return;
    }

    console.log('[CASSO] Parsed reference:', parsed);

    // Find matching tenant by payment reference
    const { data: tenants, error: findError } = await supabase
        .from('tenants')
        .select('id, subscription_status, plan')
        .ilike('id', `%${parsed.tenantId}%`)
        .limit(1);

    if (findError || !tenants || tenants.length === 0) {
        console.error('[CASSO] Tenant not found for reference:', paymentReference);
        return;
    }

    const tenant = tenants[0];

    // Check if transaction already processed (idempotency)
    const { data: existing } = await supabase
        .from('payment_transactions')
        .select('id')
        .eq('transaction_id', transaction.tid)
        .single();

    if (existing) {
        console.log('[CASSO] Transaction already processed:', transaction.tid);
        return;
    }

    // Validate amount (should match plan price)
    const expectedAmounts: { [key: string]: number } = {
        basic: 200000,
        pro: 500000,
    };

    const expectedAmount = expectedAmounts[parsed.plan];
    const isAmountValid = expectedAmount && Math.abs(transaction.amount - expectedAmount) < 100;

    if (!isAmountValid) {
        console.warn('[CASSO] Amount mismatch. Expected:', expectedAmount, 'Got:', transaction.amount);

        // Still record but mark as needs review
        await supabase
            .from('payment_transactions')
            .insert({
                tenant_id: tenant.id,
                transaction_id: transaction.tid,
                amount: transaction.amount,
                currency: 'VND',
                payment_content: transaction.description,
                payment_reference: paymentReference,
                status: 'failed',
                casso_data: transaction,
                payment_notes: `Amount mismatch: expected ${expectedAmount}, got ${transaction.amount}`,
            });

        return;
    }

    // Record successful transaction
    const { error: transactionError } = await supabase
        .from('payment_transactions')
        .insert({
            tenant_id: tenant.id,
            transaction_id: transaction.tid,
            amount: transaction.amount,
            currency: 'VND',
            payment_content: transaction.description,
            payment_reference: paymentReference,
            status: 'completed',
            casso_data: transaction,
            processed_at: new Date().toISOString(),
        });

    if (transactionError) {
        console.error('[CASSO] Failed to record transaction:', transactionError);
        return;
    }

    // Activate subscription
    const newPeriodEnd = new Date();
    newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1); // +30 days subscription

    const { error: updateError } = await supabase
        .from('tenants')
        .update({
            subscription_status: 'active',
            plan: parsed.plan,
            last_payment_date: new Date().toISOString(),
            current_period_end: newPeriodEnd.toISOString(),
            cancel_at_period_end: false,
        })
        .eq('id', tenant.id);

    if (updateError) {
        console.error('[CASSO] Failed to activate subscription:', updateError);
    } else {
        console.log('[CASSO] ✅ Subscription activated for tenant:', tenant.id);
    }

    // TODO: Send confirmation email/SMS to tenant
}

/**
 * Verify Casso webhook signature (placeholder)
 */
function verifyCassoSignature(
    payload: string,
    signature: string,
    secret: string
): boolean {
    // TODO: Implement actual signature verification
    // when Casso documentation is available
    return true;
}
