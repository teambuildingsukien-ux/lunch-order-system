-- Migration: Add RLS policies for tenant_signup_requests
-- Author: Antigravity AI  
-- Date: 2026-02-04
-- Description: Enable RLS and create policies for signup requests access

BEGIN;

-- Enable RLS
ALTER TABLE public.tenant_signup_requests ENABLE ROW LEVEL SECURITY;

-- Policy 1: Platform owners can SELECT all requests
CREATE POLICY platform_owners_select_signup_requests
    ON public.tenant_signup_requests 
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.platform_owners 
            WHERE user_id = auth.uid()
        )
    );

-- Policy 2: Platform owners can UPDATE requests (approve/reject/notes)
CREATE POLICY platform_owners_update_signup_requests
    ON public.tenant_signup_requests 
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.platform_owners 
            WHERE user_id = auth.uid()
        )
    );

-- Policy 3: Service role has full access (for API operations)
CREATE POLICY service_role_full_access_signup_requests
    ON public.tenant_signup_requests 
    FOR ALL
    USING (
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    );

-- Comments
COMMENT ON POLICY platform_owners_select_signup_requests 
    ON public.tenant_signup_requests IS 
    'Platform owners can view all signup requests';

COMMENT ON POLICY platform_owners_update_signup_requests 
    ON public.tenant_signup_requests IS 
    'Platform owners can update signup requests (approve/reject/notes)';

COMMENT ON POLICY service_role_full_access_signup_requests 
    ON public.tenant_signup_requests IS 
    'Service role bypass for API operations';

COMMIT;
