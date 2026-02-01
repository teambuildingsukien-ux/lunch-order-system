-- Migration: Add Stripe subscription fields to tenants table
-- Created: 2026-02-01
-- Purpose: Enable Stripe billing integration for multi-tenant SaaS

-- Add Stripe-related columns to tenants table
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'trialing',
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;

-- Create indexes for efficient subscription queries
CREATE INDEX IF NOT EXISTS idx_tenants_subscription_status 
ON public.tenants(subscription_status);

CREATE INDEX IF NOT EXISTS idx_tenants_stripe_customer_id 
ON public.tenants(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_tenants_stripe_subscription_id 
ON public.tenants(stripe_subscription_id);

-- Update existing tenants with trial end date (14 days from creation)
UPDATE public.tenants
SET trial_ends_at = created_at + INTERVAL '14 days',
    subscription_status = 'trialing'
WHERE trial_ends_at IS NULL;

-- Add column comments for documentation
COMMENT ON COLUMN public.tenants.stripe_customer_id IS 'Stripe Customer ID for billing';
COMMENT ON COLUMN public.tenants.stripe_subscription_id IS 'Active Stripe Subscription ID';
COMMENT ON COLUMN public.tenants.subscription_status IS 'Subscription status: trialing | active | past_due | canceled | paused';
COMMENT ON COLUMN public.tenants.trial_ends_at IS 'When the free trial period ends';
COMMENT ON COLUMN public.tenants.current_period_end IS 'Current billing period end date';
COMMENT ON COLUMN public.tenants.cancel_at_period_end IS 'Whether subscription will cancel at period end';
