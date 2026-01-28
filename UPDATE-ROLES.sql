-- Phase 1: Update Role System
-- Run this in Supabase SQL Editor

-- Step 1: Rename Kitchen Admin to Kitchen
UPDATE users 
SET role = 'Kitchen' 
WHERE role = 'Kitchen Admin';

-- Step 2: Verify current users
SELECT id, email, full_name, role FROM users ORDER BY role;

-- Step 3: Create Admin HR account (if you want a dedicated admin)
-- Option A: Convert manager to Admin HR
-- UPDATE users SET role = 'Admin HR' WHERE email = 'manager@company.vn';

-- Option B: Create new Admin HR account
-- First create auth user in Supabase Auth with email admin@company.vn, password 123456
-- Then insert into users table:
-- INSERT INTO users (id, email, full_name, role, department, phone)
-- VALUES ('PASTE_ADMIN_UID_HERE', 'admin@company.vn', 'Admin HR', 'Admin HR', 'HR', '0123456789');

-- Current valid roles: 'Employee', 'Manager', 'Kitchen', 'Admin HR'
