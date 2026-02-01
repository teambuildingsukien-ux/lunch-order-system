-- Migration: Create Platform Audit Logs
-- Date: 2026-02-01
-- Purpose: Audit trail for all platform owner actions

CREATE TABLE IF NOT EXISTS public.platform_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform_owner_id UUID REFERENCES public.platform_owners(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- 'create_tenant', 'update_pricing', 'suspend_tenant', 'update_branding', etc.
    target_tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
    details JSONB DEFAULT '{}', -- Action-specific details (what changed, old/new values)
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance and common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_owner ON public.platform_audit_logs(platform_owner_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON public.platform_audit_logs(target_tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.platform_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.platform_audit_logs(created_at DESC);

-- Composite index for filtering by owner + tenant
CREATE INDEX IF NOT EXISTS idx_audit_logs_owner_tenant ON public.platform_audit_logs(platform_owner_id, target_tenant_id);

-- Enable RLS
ALTER TABLE public.platform_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Platform owners can see their own audit logs
CREATE POLICY audit_logs_platform_owner_select ON public.platform_audit_logs
    FOR SELECT
    USING (
        platform_owner_id IN (
            SELECT id FROM public.platform_owners WHERE user_id = auth.uid()
        )
    );

-- Service role can do anything (for backend operations)
CREATE POLICY audit_logs_service_all ON public.platform_audit_logs
    FOR ALL
    USING (
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    );

-- Helper function to log platform actions
CREATE OR REPLACE FUNCTION log_platform_action(
    p_action TEXT,
    p_target_tenant_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT '{}'::jsonb,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_platform_owner_id UUID;
    v_log_id UUID;
BEGIN
    -- Get platform owner ID from current user
    SELECT id INTO v_platform_owner_id
    FROM public.platform_owners
    WHERE user_id = auth.uid()
    AND is_active = true;
    
    IF v_platform_owner_id IS NULL THEN
        RAISE EXCEPTION 'User is not an active platform owner';
    END IF;
    
    -- Insert audit log
    INSERT INTO public.platform_audit_logs (
        platform_owner_id,
        action,
        target_tenant_id,
        details,
        ip_address,
        user_agent
    ) VALUES (
        v_platform_owner_id,
        p_action,
        p_target_tenant_id,
        p_details,
        p_ip_address,
        p_user_agent
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE public.platform_audit_logs IS 'Audit trail for all platform owner actions across tenants';
COMMENT ON COLUMN public.platform_audit_logs.action IS 'Action type (create_tenant, update_pricing, etc)';
COMMENT ON COLUMN public.platform_audit_logs.details IS 'Action-specific details including old/new values';
COMMENT ON FUNCTION log_platform_action IS 'Helper function to create audit log entries';
