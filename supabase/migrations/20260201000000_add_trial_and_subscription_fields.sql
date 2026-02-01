-- Phase 3.1: Add trial period and subscription tracking to tenants table

-- Add new columns for trial and subscription management
ALTER TABLE public.tenants 
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'trialing';

-- Add index for faster subscription status queries
CREATE INDEX IF NOT EXISTS idx_tenants_subscription_status 
  ON public.tenants(subscription_status) 
  WHERE subscription_status IN ('trialing', 'active', 'past_due');

-- Update existing default tenant with trial info
UPDATE public.tenants
SET 
  trial_ends_at = NOW() + INTERVAL '365 days',  -- Legacy tenant gets 1 year
  subscription_status = 'active'
WHERE slug = 'vietvision-travel';

-- Add comment
COMMENT ON COLUMN public.tenants.trial_ends_at IS 'Trial expiration timestamp. NULL = no trial (paid customer)';
COMMENT ON COLUMN public.tenants.subscription_status IS 'Subscription status: trialing, active, past_due, canceled, incomplete';
