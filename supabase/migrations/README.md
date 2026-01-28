Migration Manual Execution Instructions

**File**: supabase/migrations/20260127_add_admin_features.sql

## How to Run:

### Option 1: Supabase Dashboard (Recommended)
1. Go to https://supabase.com/dashboard
2. Select your project: Lunch Order System
3. Navigate to SQL Editor
4. Copy & paste content from `supabase/migrations/20260127_add_admin_features.sql`
5. Click "Run"

### Option 2: Supabase CLI (if installed)
```bash
supabase db push
```

### Option 3: Direct SQL Execution via Script
```bash
# Create migration script
npm run migrate
```
(Cần add script to package.json first)

## Tables Created:
- `urgent_notifications` - For admin urgent messages
- `activity_logs` - Audit trail for admin actions

## Columns Added:
- `users.avatar_url` - User avatar URL

## Verification Query:
```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('urgent_notifications', 'activity_logs');

-- Check if avatar_url column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'avatar_url';
```
