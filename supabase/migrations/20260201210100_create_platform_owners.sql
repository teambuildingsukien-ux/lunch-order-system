-- Migration: Create Platform Owners Table
-- Date: 2026-02-01
-- Purpose: Platform owner (super admin) role for managing all tenants

-- Create platform_owners table
CREATE TABLE IF NOT EXISTS public.platform_owners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    permissions JSONB DEFAULT '{"all": true}', -- Future: granular permissions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_platform_owners_user_id ON public.platform_owners(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_owners_email ON public.platform_owners(email);
CREATE INDEX IF NOT EXISTS idx_platform_owners_active ON public.platform_owners(is_active) WHERE is_active = true;

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_platform_owners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_platform_owners_updated_at
    BEFORE UPDATE ON public.platform_owners
    FOR EACH ROW
    EXECUTE FUNCTION update_platform_owners_updated_at();

-- Enable Row Level Security
ALTER TABLE public.platform_owners ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Platform owners can see their own record
CREATE POLICY platform_owners_self_select ON public.platform_owners
    FOR SELECT
    USING (user_id = auth.uid());

-- Platform owners can update their own record (profile)
CREATE POLICY platform_owners_self_update ON public.platform_owners
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Service role (backend) can do anything
CREATE POLICY platform_owners_service_all ON public.platform_owners
    FOR ALL
    USING (
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    );

-- Helper function: Check if current user is platform owner
CREATE OR REPLACE FUNCTION is_platform_owner()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.platform_owners
        WHERE user_id = auth.uid()
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE public.platform_owners IS 'Platform owners (super admins) who can manage all tenants';
COMMENT ON COLUMN public.platform_owners.user_id IS 'Link to auth.users table';
COMMENT ON COLUMN public.platform_owners.permissions IS 'Granular permissions (future use)';
COMMENT ON COLUMN public.platform_owners.is_active IS 'Active status - inactive owners cannot login';
