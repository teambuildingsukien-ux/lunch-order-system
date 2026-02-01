import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, STRIPE_PLANS, StripePlan } from '@/lib/stripe/config';

/**
 * Create Stripe Checkout Session for subscription
 * POST /api/billing/create-checkout-session
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
        if (!plan || !STRIPE_PLANS[plan as StripePlan]) {
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
                    slug,
                    stripe_customer_id
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
        let customerId = tenant.stripe_customer_id;

        // Create Stripe customer if doesn't exist
        if (!customerId) {
            console.log('[CHECKOUT] Creating Stripe customer for tenant:', tenant.id);

            const customer = await stripe.customers.create({
                email: user.email!,
                metadata: {
                    tenant_id: tenant.id,
                    tenant_name: tenant.name,
                    tenant_slug: tenant.slug,
                },
            });

            customerId = customer.id;

            // Update tenant with customer ID
            const { error: updateError } = await supabase
                .from('tenants')
                .update({ stripe_customer_id: customerId })
                .eq('id', tenant.id);

            if (updateError) {
                console.error('[CHECKOUT] Failed to save customer ID:', updateError);
            }
        }

        const planConfig = STRIPE_PLANS[plan as StripePlan];

        // Create checkout session
        console.log('[CHECKOUT] Creating session for plan:', plan);

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: planConfig.priceId,
                    quantity: 1,
                },
            ],
            success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing?payment_canceled=true`,
            metadata: {
                tenant_id: tenant.id,
                tenant_slug: tenant.slug,
                plan: plan,
            },
            subscription_data: {
                metadata: {
                    tenant_id: tenant.id,
                    plan: plan,
                },
            },
        });

        console.log('[CHECKOUT] Session created:', session.id);

        return NextResponse.json({
            sessionId: session.id,
            url: session.url,
        });

    } catch (error: any) {
        console.error('[CHECKOUT] Error creating checkout session:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create checkout session' },
            { status: 500 }
        );
    }
}
