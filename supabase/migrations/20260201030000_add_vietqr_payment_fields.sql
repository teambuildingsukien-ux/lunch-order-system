-- Migration: Add VietQR payment tracking fields
-- Created: 2026-02-01
-- Purpose: Support VietQR + Casso payment system

-- Add payment tracking columns to tenants table
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'vietqr',
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_notes TEXT;

-- Create index for payment reference lookups
CREATE INDEX IF NOT EXISTS idx_tenants_payment_reference 
ON public.tenants(payment_reference);

CREATE INDEX IF NOT EXISTS idx_tenants_last_payment_date 
ON public.tenants(last_payment_date);

-- Add column comments for documentation
COMMENT ON COLUMN public.tenants.payment_method IS 'Payment method: vietqr | stripe (for future flexibility)';
COMMENT ON COLUMN public.tenants.last_payment_date IS 'Date of last successful payment';
COMMENT ON COLUMN public.tenants.payment_reference IS 'Unique payment reference code for transaction matching';
COMMENT ON COLUMN public.tenants.payment_notes IS 'Additional payment notes or admin comments';

-- Create payments audit log table for tracking all transactions
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    transaction_id VARCHAR(255) UNIQUE, -- From Casso
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'VND',
    payment_content TEXT, -- Transaction description from bank
    payment_reference VARCHAR(255), -- Our reference code
    status VARCHAR(50) DEFAULT 'pending', -- pending | completed | failed | refunded
    casso_data JSONB, -- Raw webhook data from Casso
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for payment transactions
CREATE INDEX IF NOT EXISTS idx_payment_transactions_tenant_id 
ON public.payment_transactions(tenant_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_transaction_id 
ON public.payment_transactions(transaction_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_status 
ON public.payment_transactions(status);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at 
ON public.payment_transactions(created_at DESC);

-- Add RLS policies for payment_transactions
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own tenant's payment transactions
CREATE POLICY payment_transactions_tenant_isolation ON public.payment_transactions
FOR ALL
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.users WHERE id = auth.uid()
    )
);

-- Policy: Service role bypasses RLS
CREATE POLICY payment_transactions_service_role ON public.payment_transactions
FOR ALL
USING (is_service_role())
WITH CHECK (is_service_role());

-- Add comment
COMMENT ON TABLE public.payment_transactions IS 'Audit log for all payment transactions from VietQR/Casso';
