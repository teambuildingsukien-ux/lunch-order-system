-- Fix user ID mismatch between Supabase Auth and users table
-- Run this in Supabase SQL Editor

-- Step 1: Check current user IDs
SELECT id, email, full_name, role FROM users;

-- Step 2: Get Auth user UID (from Supabase Auth dashboard)
-- For tthanconghaibiin@gmail.com the UID is: 2bf9b6a0-5082-4a28-8dc6-8030160ee594

-- Step 3: Update user ID to match Auth UID
UPDATE users 
SET id = '2bf9b6a0-5082-4a28-8dc6-8030160ee594'
WHERE email = 'tthanconghaibiin@gmail.com';

-- Verify
SELECT id, email, full_name, role FROM users WHERE email = 'tthanconghaibiin@gmail.com';
