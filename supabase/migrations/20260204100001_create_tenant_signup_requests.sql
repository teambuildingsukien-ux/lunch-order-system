-- Migration: Create tenant_signup_requests table
-- Author: Antigravity AI
-- Date: 2026-02-04
-- Description: Store company information and signup details for approval workflow

BEGIN;

-- Create tenant_signup_requests table
CREATE TABLE IF NOT EXISTS public.tenant_signup_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    -- Company Information (for sales team)
    company_name VARCHAR(255) NOT NULL,
    company_address TEXT,
    company_phone VARCHAR(50),
    company_website VARCHAR(255),
    employee_count VARCHAR(50), -- "1-10", "11-50", "51-200", "200+"
    
    -- Contact Person
    contact_name VARCHAR(255) NOT NULL,
    contact_title VARCHAR(100),
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    
    -- Signup Details
    signup_source VARCHAR(50), -- 'website', 'referral', 'sales', 'other'
    signup_notes TEXT, -- Sales team notes
    
    -- Status Tracking
    status VARCHAR(50) DEFAULT 'pending', -- pending, email_verified, approved, rejected
    email_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMPTZ,
    
    -- Approval Info
    approved_by UUID REFERENCES public.platform_owners(id),
    approved_at TIMESTAMPTZ,
    rejected_by UUID REFERENCES public.platform_owners(id),
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_signup_requests_tenant_id 
    ON public.tenant_signup_requests(tenant_id);

CREATE INDEX IF NOT EXISTS idx_signup_requests_status 
    ON public.tenant_signup_requests(status);

CREATE INDEX IF NOT EXISTS idx_signup_requests_email 
    ON public.tenant_signup_requests(contact_email);

CREATE INDEX IF NOT EXISTS idx_signup_requests_created 
    ON public.tenant_signup_requests(created_at DESC);

-- Comments for documentation
COMMENT ON TABLE public.tenant_signup_requests IS 
    'Stores company information and tracks signup approval workflow';

COMMENT ON COLUMN public.tenant_signup_requests.employee_count IS 
    'Employee count range: 1-10, 11-50, 51-200, 200+';

COMMENT ON COLUMN public.tenant_signup_requests.signup_source IS 
    'Source: website, referral, sales, other';

COMMENT ON COLUMN public.tenant_signup_requests.status IS 
    'Status: pending, email_verified, approved, rejected';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_signup_requests_updated_at
    BEFORE UPDATE ON public.tenant_signup_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;
