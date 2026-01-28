-- ========================================
-- EMPLOYEE DASHBOARD BACKEND - MIGRATION
-- Groups, Shifts, Announcements Tables
-- ========================================

-- 1. Create Shifts Table
CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shifts_active ON shifts(active);

COMMENT ON TABLE shifts IS 'Meal shifts - different time slots for eating';
COMMENT ON COLUMN shifts.start_time IS 'Start time of the shift';
COMMENT ON COLUMN shifts.end_time IS 'End time of the shift';

-- 2. Create Groups Table
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
    table_area VARCHAR(100),
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_groups_shift_id ON groups(shift_id);
CREATE INDEX IF NOT EXISTS idx_groups_active ON groups(active);
CREATE INDEX IF NOT EXISTS idx_groups_department ON groups(department);

COMMENT ON TABLE groups IS 'Employee groups for organized meal times';
COMMENT ON COLUMN groups.shift_id IS 'Assigned shift for this group';
COMMENT ON COLUMN groups.table_area IS 'Designated table area (e.g., Khu A - Tầng 1)';

-- 3. Create Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255),
    content TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal',
    active BOOLEAN NOT NULL DEFAULT true,
    start_date DATE,
    end_date DATE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(active);
CREATE INDEX IF NOT EXISTS idx_announcements_dates ON announcements(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority);

COMMENT ON TABLE announcements IS 'System announcements displayed to employees';
COMMENT ON COLUMN announcements.priority IS 'normal, high, urgent';
COMMENT ON COLUMN announcements.start_date IS 'Display from this date';
COMMENT ON COLUMN announcements.end_date IS 'Display until this date';

-- 4. Update Users Table - Add group_id
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_group_id ON users(group_id);

-- 5. Update triggers for new tables
DROP TRIGGER IF EXISTS update_shifts_updated_at ON shifts;
CREATE TRIGGER update_shifts_updated_at
    BEFORE UPDATE ON shifts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_groups_updated_at ON groups;
CREATE TRIGGER update_groups_updated_at
    BEFORE UPDATE ON groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_announcements_updated_at ON announcements;
CREATE TRIGGER update_announcements_updated_at
    BEFORE UPDATE ON announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Seed Shifts Data
INSERT INTO shifts (name, start_time, end_time, description) VALUES
    ('Ca 1', '11:00:00', '11:45:00', 'Ca ăn sớm - Nhóm sản xuất buổi sáng'),
    ('Ca 2', '11:30:00', '12:15:00', 'Ca ăn chính - Nhóm văn phòng'),
    ('Ca 3', '12:00:00', '12:45:00', 'Ca ăn muộn - Nhóm sản xuất buổi chiều')
ON CONFLICT DO NOTHING;

-- 7. Seed Groups Data
INSERT INTO groups (name, department, shift_id, table_area, description) VALUES
    (
        'Sản xuất A',
        'Bộ phận lắp ráp linh kiện',
        (SELECT id FROM shifts WHERE name = 'Ca 2' LIMIT 1),
        'Khu A - Tầng 1',
        'Nhóm sản xuất chính - Ca 11:30-12:15'
    ),
    (
        'Văn phòng B',
        'Phòng hành chính',
        (SELECT id FROM shifts WHERE name = 'Ca 2' LIMIT 1),
        'Khu B - Tầng 2',
        'Nhóm văn phòng - Ca 11:30-12:15'
    ),
    (
        'Kỹ thuật C',
        'Phòng R&D',
        (SELECT id FROM shifts WHERE name = 'Ca 3' LIMIT 1),
        'Khu C - Tầng 3',
        'Nhóm kỹ thuật - Ca 12:00-12:45'
    )
ON CONFLICT DO NOTHING;

-- 8. Seed Announcements Data
INSERT INTO announcements (title, content, priority, active, created_by) VALUES
    (
        'Cập nhật thực đơn tuần mới',
        '🎉 Thực đơn tuần mới đã được cập nhật! Vui lòng đăng ký trước 16:00 mỗi ngày.',
        'normal',
        true,
        (SELECT id FROM users WHERE role = 'Manager' LIMIT 1)
    ),
    (
        'Tiệc buffet ngày 30/06',
        '📢 Lưu ý: Ngày 30/06 công ty có tiệc buffet trưa tại sảnh chính.',
        'high',
        true,
        (SELECT id FROM users WHERE role = 'Manager' LIMIT 1)
    ),
    (
        'Bảo trì hệ thống',
        '⚠️ Hệ thống sẽ bảo trì vào lúc 22:00 tối nay.',
        'urgent',
        true,
        (SELECT id FROM users WHERE role = 'Manager' LIMIT 1)
    )
ON CONFLICT DO NOTHING;

-- 9. Assign test users to groups (update existing users)
UPDATE users 
SET group_id = (SELECT id FROM groups WHERE name = 'Sản xuất A' LIMIT 1)
WHERE email = 'test@company.vn';

UPDATE users 
SET group_id = (SELECT id FROM groups WHERE name = 'Văn phòng B' LIMIT 1)
WHERE email = 'kitchen@company.vn';

UPDATE users 
SET group_id = (SELECT id FROM groups WHERE name = 'Kỹ thuật C' LIMIT 1)
WHERE email = 'manager@company.vn';

-- Done!
-- ========================================
-- Migration complete! 🎉
-- Tables created: shifts, groups, announcements
-- Users table updated with group_id
-- Seed data inserted
-- ========================================
