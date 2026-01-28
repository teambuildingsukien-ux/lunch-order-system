# 🗄️ Database Migration Guide

**Migration File**: `20260127_add_admin_features.sql`  
**Purpose**: Add support for Admin Management features

---

## 📋 Step-by-Step Instructions

### Option 1: Supabase Dashboard (Recommended) ✅

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Login with your account

2. **Select Your Project**
   - Find và click vào project: **Lunch Order System**

3. **Navigate to SQL Editor**
   - Sidebar → Click **SQL Editor**
   - Hoặc: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql

4. **Create New Query**
   - Click button **"+ New query"**
   - Đặt tên: `Admin Features Migration`

5. **Copy Migration SQL**
   - Mở file: `lunch-order-system/supabase/migrations/20260127_add_admin_features.sql`
   - Copy toàn bộ nội dung SQL

6. **Paste và Execute**
   - Paste vào SQL Editor
   - Click **"Run"** (hoặc Ctrl+Enter)

7. **Verify Success**
   - Bạn sẽ thấy message: `Success. No rows returned`
   - Hoặc check số lượng statements executed

8. **Verify Tables Created**
   - Run verification query:
   ```sql
   -- Check new tables
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('urgent_notifications', 'activity_logs');
   
   -- Check new column
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'users' 
   AND column_name = 'avatar_url';
   ```
   - Expected results:
     - 2 tables found: `urgent_notifications`, `activity_logs`
     - 1 column found: `avatar_url`

---

### Option 2: Supabase CLI (Advanced) 🔧

**Prerequisites**: Supabase CLI installed
```bash
npm install -g supabase
```

**Steps**:
```bash
# 1. Navigate to project
cd C:\Users\APC\Downloads\Dua_an_an_trua\lunch-order-system

# 2. Login to Supabase
supabase login

# 3. Link project (if not linked)
supabase link --project-ref YOUR_PROJECT_REF

# 4. Push migrations
supabase db push

# Alternative: Apply specific migration
supabase db push --include-all --include-roles --include-seed
```

---

### Option 3: psql Command Line (Expert) 💻

**Prerequisites**: PostgreSQL client installed

```bash
# Get connection string from Supabase Dashboard
# Settings → Database → Connection string

psql "postgresql://postgres:[YOUR-PASSWORD]@[HOST]:5432/postgres" \
  -f supabase/migrations/20260127_add_admin_features.sql
```

---

## ✅ Post-Migration Verification

### 1. Check Tables Created
```sql
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('urgent_notifications', 'activity_logs')
ORDER BY table_name;
```

**Expected Output**:
```
table_name            | table_type
---------------------+------------
activity_logs        | BASE TABLE
urgent_notifications | BASE TABLE
```

### 2. Check Indexes Created
```sql
SELECT 
    indexname,
    tablename
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('urgent_notifications', 'activity_logs')
ORDER BY tablename, indexname;
```

**Expected Output**: 4 indexes
- `idx_activity_logs_performed_by`
- `idx_activity_logs_target`
- `idx_urgent_notifications_active`
- `idx_urgent_notifications_target`

### 3. Check Column Added
```sql
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'avatar_url';
```

**Expected Output**:
```
column_name | data_type | is_nullable
-----------+-----------+-------------
avatar_url  | text      | YES
```

### 4. Test Insert (Optional)
```sql
-- Test urgent_notifications table
INSERT INTO urgent_notifications (title, message, target_audience)
VALUES ('Test', 'Migration successful!', 'all')
RETURNING *;

-- Clean up test
DELETE FROM urgent_notifications WHERE title = 'Test';
```

---

## 🚨 Troubleshooting

### Error: "relation already exists"
**Cause**: Migration already run  
**Solution**: Skip or modify migration to use `IF NOT EXISTS`

### Error: "permission denied"
**Cause**: Insufficient privileges  
**Solution**: Ensure using service_role or postgres role in Supabase

### Error: "column already exists"
**Cause**: `avatar_url` column already added  
**Solution**: 
```sql
-- Check if column exists first
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE users ADD COLUMN avatar_url TEXT;
    END IF;
END $$;
```

---

## 📊 What This Migration Adds

### 1. urgent_notifications Table
**Purpose**: Store urgent admin notifications  
**Fields**:
- `id` - UUID primary key
- `title` - Notification title
- `message` - Notification content
- `target_audience` - Who receives it (all/employees/kitchen/group)
- `target_id` - Specific group ID (if targeting group)
- `created_by` - Admin who created it
- `created_at` - Timestamp
- `is_active` - Whether still active

### 2. activity_logs Table
**Purpose**: Audit trail for admin actions  
**Fields**:
- `id` - UUID primary key
- `action` - What action was performed
- `performed_by` - Who performed it
- `target_type` - Type of entity affected
- `target_id` - ID of entity affected
- `details` - JSON metadata
- `created_at` - Timestamp

### 3. users.avatar_url Column
**Purpose**: Store user avatar images  
**Type**: TEXT (URL to Supabase Storage)

---

## ⏭️ Next Steps After Migration

Once migration is successful:
1. ✅ Verify all tables/columns created
2. 🚀 Test Urgent Notification feature in UI
3. 📸 Enable avatar uploads in Employee Management
4. 📊 View activity logs in Admin Dashboard

---

**Migration Status**: ⏳ Pending manual execution
