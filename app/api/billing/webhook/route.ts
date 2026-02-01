import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { createAdminClient } from '@/lib/supabase/admin';
import Stripe from 'stripe';

// Disable body parsing for webhook signature verification
export const runtime = 'nodejs';

/**
 * Stripe Webhook Handler
 * POST /api/billing/webhook
 * 
 * Handles subscription lifecycle events from Stripe
 */
export async function POST(request: NextRequest) {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
        console.error('[WEBHOOK] Missing Stripe signature');
        return NextResponse.json(
            { error: 'Missing signature' },
            { status: 400 }
        );
    }

    let event: Stripe.Event;

    try {
        // Verify webhook signature
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        console.error('[WEBHOOK] Signature verification failed:', error.message);
        return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 400 }
        );
    }

    console.log('[WEBHOOK] Received event:', event.type, event.id);

    // Use admin client to bypass RLS
    const supabase = createAdminClient();

    try {
        switch (event.type) {
            // Checkout completed - subscription created
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const tenantId = session.metadata?.tenant_id;

                console.log('[WEBHOOK] Checkout completed for tenant:', tenantId);

                if (session.mode === 'subscription' && tenantId) {
                    const { error } = await supabase
                        .from('tenants')
                        .update({
                            stripe_subscription_id: session.subscription as string,
                            subscription_status: 'active',
                        })
                        .eq('id', tenantId);

                    if (error) {
                        console.error('[WEBHOOK] Error updating tenant:', error);
                    } else {
                        console.log('[WEBHOOK] Tenant subscription activated:', tenantId);
                    }
                }
                break;
            }

            // Subscription updated (status change, plan change, etc.)
            case 'customer.subscription.updated': {
                const subscription = event.data.object as any; // Cast to any for runtime properties

                console.log('[WEBHOOK] Subscription updated:', subscription.id, subscription.status);

                const periodEnd = subscription.current_period_end
                    ? new Date(subscription.current_period_end * 1000).toISOString()
                    : null;

                const { error } = await supabase
                    .from('tenants')
                    .update({
                        subscription_status: subscription.status,
                        current_period_end: periodEnd,
                        cancel_at_period_end: subscription.cancel_at_period_end || false,
                    })
                    .eq('stripe_subscription_id', subscription.id);

                if (error) {
                    console.error('[WEBHOOK] Error updating subscription:', error);
                }
                break;
            }

            // Subscription deleted/canceled
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;

                console.log('[WEBHOOK] Subscription deleted:', subscription.id);

                const { error } = await supabase
                    .from('tenants')
                    .update({
                        subscription_status: 'canceled',
                        stripe_subscription_id: null,
                    })
                    .eq('stripe_subscription_id', subscription.id);

                if (error) {
                    console.error('[WEBHOOK] Error canceling subscription:', error);
                }
                break;
            }

            // Invoice payment succeeded
            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as any; // Cast to any for runtime properties

                console.log('[WEBHOOK] Payment succeeded for invoice:', invoice.id);

                const subscriptionId = typeof invoice.subscription === 'string'
                    ? invoice.subscription
                    : invoice.subscription?.id;

                if (subscriptionId) {
                    const { error } = await supabase
                        .from('tenants')
                        .update({
                            subscription_status: 'active',
                        })
                        .eq('stripe_subscription_id', subscriptionId);

                    if (error) {
                        console.error('[WEBHOOK] Error updating after payment:', error);
                    }
                }
                break;
            }

            // Invoice payment failed
            case 'invoice.payment_failed': {
                const invoice = event.data.object as any; // Cast to any for runtime properties

                console.log('[WEBHOOK] Payment failed for invoice:', invoice.id);

                const subscriptionId = typeof invoice.subscription === 'string'
                    ? invoice.subscription
                    : invoice.subscription?.id;

                if (subscriptionId) {
                    const { error } = await supabase
                        .from('tenants')
                        .update({
                            subscription_status: 'past_due',
                        })
                        .eq('stripe_subscription_id', subscriptionId);

                    if (error) {
                        console.error('[WEBHOOK] Error updating after failed payment:', error);
                    }
                }
                break;
            }

            // Trial will end soon (3 days before)
            case 'customer.subscription.trial_will_end': {
                const subscription = event.data.object as Stripe.Subscription;
                console.log('[WEBHOOK] Trial will end for subscription:', subscription.id);
                // TODO: Send email notification to tenant admin
                // This will be implemented when we add email notifications
                break;
            }

            default:
                console.log('[WEBHOOK] Unhandled event type:', event.type);
        }

        return NextResponse.json({ received: true });

    } catch (error: any) {
        console.error('[WEBHOOK] Handler error:', error);
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
        );
    }
}
