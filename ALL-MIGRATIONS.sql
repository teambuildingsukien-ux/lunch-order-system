-- ========================================
-- ALL-IN-ONE MIGRATION SCRIPT
-- Copy toàn bộ file này vào Supabase SQL Editor và Run
-- ========================================

-- Migration 001: Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Employee',
    telegram_chat_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
   metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

COMMENT ON TABLE users IS 'Employees, Kitchen Admin, Manager - authentication and profile';
COMMENT ON COLUMN users.role IS 'Employee, Kitchen Admin, or Manager';
COMMENT ON COLUMN users.telegram_chat_id IS 'For notification delivery (optional)';

-- Migration 002: Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'eating',
    locked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(date);
CREATE INDEX IF NOT EXISTS idx_orders_user_id_date ON orders(user_id, date);
CREATE INDEX IF NOT EXISTS idx_orders_updated_at ON orders(updated_at);

COMMENT ON TABLE orders IS 'Daily meal orders - opt-in/opt-out tracking';
COMMENT ON COLUMN orders.status IS 'eating or not_eating';
COMMENT ON COLUMN orders.locked IS 'Locked after 5:00 AM deadline';

-- Migration 003: Create notification_logs table
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    channel VARCHAR(50) NOT NULL,
    content TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_recipient_id ON notification_logs(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at);

COMMENT ON TABLE notification_logs IS 'History of notifications sent (Telegram/Email)';
COMMENT ON COLUMN notification_logs.notification_type IS 'reminder, daily_report, welcome_email';
COMMENT ON COLUMN notification_logs.channel IS 'telegram or email';
COMMENT ON COLUMN notification_logs.status IS 'pending, sent, or failed';

-- Migration 004: Create import_logs table
CREATE TABLE IF NOT EXISTS import_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    imported_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    file_name VARCHAR(255) NOT NULL,
    total_rows INTEGER NOT NULL,
    success_count INTEGER NOT NULL DEFAULT 0,
    error_count INTEGER NOT NULL DEFAULT 0,
    error_details JSONB,
    status VARCHAR(50) NOT NULL DEFAULT 'processing',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_import_logs_imported_by ON import_logs(imported_by);
CREATE INDEX IF NOT EXISTS idx_import_logs_status ON import_logs(status);
CREATE INDEX IF NOT EXISTS idx_import_logs_created_at ON import_logs(created_at);

COMMENT ON TABLE import_logs IS 'History of CSV bulk imports';
COMMENT ON COLUMN import_logs.status IS 'processing, completed, or failed';
COMMENT ON COLUMN import_logs.error_details IS 'JSON array of row-level errors';

-- Migration 005: Create triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON FUNCTION update_updated_at_column() IS 'Auto-update updated_at column on UPDATE';

-- Seed data: Insert test users
INSERT INTO users (email, full_name, department, role) 
VALUES
  ('kitchen@company.vn', 'Chị Huệ', 'Operations', 'Kitchen Admin'),
  ('manager@company.vn', 'Chị Hường', 'HR', 'Manager'),
  ('test@company.vn', 'Test Employee', 'IT', 'Employee')
ON CONFLICT (email) DO NOTHING;

-- Done!
-- ========================================
-- Migration complete! 🎉
-- Tables created: users, orders, notification_logs, import_logs
-- Test users inserted: 3 users
-- ========================================
