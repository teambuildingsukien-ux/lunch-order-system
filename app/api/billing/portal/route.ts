import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/config';

/**
 * Create Stripe Customer Portal Session
 * POST /api/billing/portal
 * 
 * Allows customers to manage their subscription, payment methods, and invoices
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

        // Get tenant with Stripe customer ID
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select(`
                tenants (
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

        if (!tenant?.stripe_customer_id) {
            return NextResponse.json(
                { error: 'No billing account found' },
                { status: 404 }
            );
        }

        console.log('[PORTAL] Creating session for customer:', tenant.stripe_customer_id);

        // Create portal session
        const session = await stripe.billingPortal.sessions.create({
            customer: tenant.stripe_customer_id,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
        });

        console.log('[PORTAL] Session created:', session.id);

        return NextResponse.json({ url: session.url });

    } catch (error: any) {
        console.error('[PORTAL] Error creating portal session:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create portal session' },
            { status: 500 }
        );
    }
}
