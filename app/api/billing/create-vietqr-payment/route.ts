import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generatePaymentQR, VietQRPlan, VIETQR_PLANS } from '@/lib/vietqr/config';

/**
 * Generate VietQR Payment Code
 * POST /api/billing/create-vietqr-payment
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
        if (!plan || !VIETQR_PLANS[plan as VietQRPlan]) {
            return NextResponse.json(
                { error: 'Invalid plan selected' },
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

        console.log('[VIETQR] Generating payment QR for tenant:', tenant.id, 'plan:', plan);

        // Generate VietQR code
        const paymentData = await generatePaymentQR({
            tenantId: tenant.id,
            plan: plan as VietQRPlan,
        });

        // Update tenant with payment reference
        const { error: updateError } = await supabase
            .from('tenants')
            .update({
                payment_reference: paymentData.paymentReference,
            })
            .eq('id', tenant.id);

        if (updateError) {
            console.error('[VIETQR] Failed to save payment reference:', updateError);
        }

        // Create pending payment transaction record
        const { error: transactionError } = await supabase
            .from('payment_transactions')
            .insert({
                tenant_id: tenant.id,
                amount: paymentData.amount,
                currency: 'VND',
                payment_reference: paymentData.paymentReference,
                payment_content: paymentData.description,
                status: 'pending',
            });

        if (transactionError) {
            console.error('[VIETQR] Failed to create transaction record:', transactionError);
        }

        console.log('[VIETQR] Payment QR generated successfully:', paymentData.paymentReference);

        return NextResponse.json({
            success: true,
            qrCode: paymentData.qrDataUrl,
            paymentReference: paymentData.paymentReference,
            amount: paymentData.amount,
            bankInfo: paymentData.bankInfo,
            description: paymentData.description,
        });

    } catch (error: any) {
        console.error('[VIETQR] Error creating payment QR:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate payment QR' },
            { status: 500 }
        );
    }
}

/**
 * Check Payment Status
 * GET /api/billing/create-vietqr-payment?reference=TENANT_xxx
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
        const reference = searchParams.get('reference');

        if (!reference) {
            return NextResponse.json(
                { error: 'Payment reference required' },
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

        // Find transaction by reference
        const { data: transaction, error } = await supabase
            .from('payment_transactions')
            .select('*')
            .eq('tenant_id', userData.tenant_id)
            .eq('payment_reference', reference)
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
        console.error('[VIETQR] Error checking payment status:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to check payment status' },
            { status: 500 }
        );
    }
}
