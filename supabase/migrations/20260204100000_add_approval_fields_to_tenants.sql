-- Migration: Add approval fields to tenants table
-- Author: Antigravity AI
-- Date: 2026-02-04
-- Description: Add fields to track approval status and email verification

BEGIN;

-- Add approval status field
ALTER TABLE public.tenants 
  ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'pending_approval';

COMMENT ON COLUMN public.tenants.approval_status IS 
  'Approval status: pending_approval, approved, rejected';

-- Add email verification tracking
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.tenants.email_verified IS 
  'Whether admin email has been verified';

-- Create index for querying by approval status
CREATE INDEX IF NOT EXISTS idx_tenants_approval_status 
  ON public.tenants(approval_status) 
  WHERE deleted_at IS NULL;

-- Update existing tenants to 'approved' status (legacy data)
UPDATE public.tenants 
SET approval_status = 'approved', email_verified = true
WHERE approval_status = 'pending_approval';

COMMIT;
