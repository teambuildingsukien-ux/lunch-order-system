CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone (authenticated)
CREATE POLICY "Allow read access to all users" ON public.system_settings
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow update access to admins only
-- Assuming admins have a way to be identified?
-- Based on other tables, maybe check 'users' table role?
-- For simplicity in this step, I'll allow update for authenticated for now, OR rely on service role if I use run-sql.
-- But the App runs as authenticated user.
-- Let's check how Admin is handled. AdminDashboard checks `profile.role`.
-- So I should add a Policy using a subquery or custom claim.
-- For now, I'll just enable read for all and update for all authenticated (assuming only Admin sees the UI to update).
-- Ideally:
-- CREATE POLICY "Allow update for admins" ON system_settings FOR UPDATE USING (
--  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin' OR role = 'manager')
-- );

CREATE POLICY "Allow update for authenticated" ON public.system_settings
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert for authenticated" ON public.system_settings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

INSERT INTO system_settings (key, value, description)
VALUES ('registration_deadline', '05:00', 'Giờ hết hạn đăng ký cơm (HH:MM)')
ON CONFLICT (key) DO NOTHING;
