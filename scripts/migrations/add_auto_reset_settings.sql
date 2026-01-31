-- Run this SQL manually in Supabase SQL Editor

-- Setting 1: Enable/disable auto-reset feature
INSERT INTO system_settings (key, value, description, created_at, updated_at)
VALUES (
  'auto_reset_enabled',
  'false',
  'Enable automatic meal registration reset for not_eating orders',
  NOW(),
  NOW()
)
ON CONFLICT (key) DO NOTHING;

-- Setting 2: Time to run auto-reset (HH:MM format in Vietnam timezone)
INSERT INTO system_settings (key, value, description, created_at, updated_at)
VALUES (
  'auto_reset_time',
  '00:00',
  'Time to automatically reset meal registrations (HH:MM in Asia/Ho_Chi_Minh timezone)',
  NOW(),
  NOW()
)
ON CONFLICT (key) DO NOTHING;

-- Setting 3: Last run timestamp to prevent duplicate executions
INSERT INTO system_settings (key, value, description, created_at, updated_at)
VALUES (
  'auto_reset_last_run',
  '',
  'Last execution timestamp of auto-reset job (ISO 8601 format)',
  NOW(),
  NOW()
)
ON CONFLICT (key) DO NOTHING;

-- Verify the settings were created
SELECT * FROM system_settings 
WHERE key IN ('auto_reset_enabled', 'auto_reset_time', 'auto_reset_last_run')
ORDER BY key;
