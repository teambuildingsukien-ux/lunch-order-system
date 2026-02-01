import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPaymentLink, generateOrderCode, PAYOS_PLANS, PayOSPlan } from '@/lib/payos/config';

/**
 * Create PayOS Payment Link
 * POST /api/billing/create-payos-payment
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { plan } = body;

        // Validate plan
        if (!plan || !PAYOS_PLANS[plan as PayOSPlan]) {
            return NextResponse.json(
                { error: 'Invalid plan selected' },
                { status: 400 }
            );
        }

        const planConfig = PAYOS_PLANS[plan as PayOSPlan];

        if (planConfig.amount === 0) {
            return NextResponse.json(
                { error: 'Enterprise plan requires contact' },
                { status: 400 }
            );
        }

        // Get tenant information
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select(`
                tenant_id,
                tenants (
                    id,
                    name,
                    slug
                )
            `)
            .eq('id', user.id)
            .single();

        if (userError || !userData) {
            return NextResponse.json(
                { error: 'Tenant not found' },
                { status: 404 }
            );
        }

        const tenant = userData.tenants as any;
        const orderCode = generateOrderCode(tenant.id, plan as PayOSPlan);

        console.log('[PAYOS] Creating payment link for tenant:', tenant.id, 'plan:', plan, 'orderCode:', orderCode);

        // Create PayOS payment link
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        const paymentLink = await createPaymentLink({
            orderCode,
            amount: planConfig.amount,
            description: planConfig.description, // PayOS limit: 25 chars
            returnUrl: `${appUrl}/dashboard?payment_success=true`,
            cancelUrl: `${appUrl}/billing?payment_cancelled=true`,
        });

        console.log('[PAYOS] Payment link created:', paymentLink);

        // Store pending payment transaction
        const { error: transactionError } = await supabase
            .from('payment_transactions')
            .insert({
                tenant_id: tenant.id,
                transaction_id: orderCode.toString(),
                amount: planConfig.amount,
                currency: 'VND',
                payment_content: planConfig.description,
                payment_reference: `ORDER_${orderCode}`,
                status: 'pending',
            });

        if (transactionError) {
            console.error('[PAYOS] Failed to create transaction record:', transactionError);
        }

        return NextResponse.json({
            success: true,
            checkoutUrl: paymentLink.checkoutUrl,
            orderCode,
            amount: planConfig.amount,
            qrCode: paymentLink.qrCode, // PayOS provides ready QR code
        });

    } catch (error: any) {
        console.error('[PAYOS] Error creating payment link:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create payment link' },
            { status: 500 }
        );
    }
}

/**
 * Check Payment Status
 * GET /api/billing/create-payos-payment?orderCode=xxx
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const orderCode = searchParams.get('orderCode');

        if (!orderCode) {
            return NextResponse.json(
                { error: 'Order code required' },
                { status: 400 }
            );
        }

        // Get tenant's payment transactions
        const { data: userData } = await supabase
            .from('users')
            .select('tenant_id')
            .eq('id', user.id)
            .single();

        if (!userData) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Find transaction by order code
        const { data: transaction, error } = await supabase
            .from('payment_transactions')
            .select('*')
            .eq('tenant_id', userData.tenant_id)
            .eq('transaction_id', orderCode)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            return NextResponse.json(
                { status: 'not_found', message: 'Payment not found or still pending' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            status: transaction.status,
            amount: transaction.amount,
            processedAt: transaction.processed_at,
            transaction,
        });

    } catch (error: any) {
        console.error('[PAYOS] Error checking payment status:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to check payment status' },
            { status: 500 }
        );
    }
}
