-- Seed initial admin users
-- Kitchen Admin (chị Huệ) và Manager (chị Hường)

INSERT INTO users (email, full_name, department, role) 
VALUES
  ('kitchen@company.vn', 'Chị Huệ', 'Operations', 'Kitchen Admin'),
  ('manager@company.vn', 'Chị Hường', 'HR', 'Manager')
ON CONFLICT (email) DO NOTHING;

-- Note: Telegram chat_id sẽ được update sau khi link Telegram account
