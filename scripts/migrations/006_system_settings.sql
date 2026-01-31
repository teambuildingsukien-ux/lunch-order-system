-- Migration: Create system_settings table
-- Description: Store application-wide settings like cooking days configuration

BEGIN;

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES users(id)
);

-- Add index on key for fast lookups
CREATE INDEX idx_system_settings_key ON system_settings(key);

-- Add RLS policies
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Admin can read all settings
CREATE POLICY "Admin can read settings"
    ON system_settings
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Admin can update settings
CREATE POLICY "Admin can update settings"
    ON system_settings
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Admin can insert settings
CREATE POLICY "Admin can insert settings"
    ON system_settings
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Seed default cooking days setting (Monday to Friday)
INSERT INTO system_settings (key, value, description)
VALUES (
    'cooking_days',
    '{"start_day": 1, "end_day": 5}'::jsonb,
    'Configure which days of the week to cook. 0=Sunday, 1=Monday, ..., 6=Saturday. Default is Monday(1) to Friday(5).'
)
ON CONFLICT (key) DO NOTHING;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_system_settings_updated_at();

COMMIT;
