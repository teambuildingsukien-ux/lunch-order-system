-- Migration: Add White-Label Customization Fields to Tenants
-- Date: 2026-02-01
-- Purpose: Enable per-tenant branding and custom domains

-- Add white-label customization fields
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS custom_domain TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS custom_logo_url TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS custom_primary_color TEXT DEFAULT '#B24700';
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS custom_secondary_color TEXT DEFAULT '#D65D0E';
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS custom_fonts JSONB DEFAULT '{"heading": "Inter", "body": "Inter"}';
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS branding_settings JSONB DEFAULT '{}';

-- Add custom pricing (per-tenant pricing overrides)
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS custom_pricing JSONB DEFAULT NULL;
-- Example structure: {"basic": 150000, "pro": 400000, "enterprise": 1000000}
-- NULL means use default platform pricing

-- Add domain verification fields
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS domain_verified BOOLEAN DEFAULT false;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS domain_verification_token TEXT;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_tenants_custom_domain ON public.tenants(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_domain_verified ON public.tenants(domain_verified) WHERE domain_verified = true;

-- Comments for documentation
COMMENT ON COLUMN public.tenants.custom_domain IS 'Custom domain for white-label (e.g., lunch.company.com)';
COMMENT ON COLUMN public.tenants.custom_logo_url IS 'URL to tenant custom logo';
COMMENT ON COLUMN public.tenants.custom_primary_color IS 'Primary brand color in hex format';
COMMENT ON COLUMN public.tenants.custom_secondary_color IS 'Secondary brand color in hex format';
COMMENT ON COLUMN public.tenants.custom_fonts IS 'Custom font configuration';
COMMENT ON COLUMN public.tenants.branding_settings IS 'Additional branding settings (themes, layouts, etc)';
COMMENT ON COLUMN public.tenants.custom_pricing IS 'Per-tenant pricing overrides, NULL = use platform defaults';
COMMENT ON COLUMN public.tenants.domain_verified IS 'Whether custom domain has been verified';
COMMENT ON COLUMN public.tenants.domain_verification_token IS 'Token for DNS TXT record verification';
