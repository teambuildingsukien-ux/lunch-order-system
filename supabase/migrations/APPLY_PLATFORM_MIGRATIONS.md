# Platform Owner Migrations - Apply Guide

## 📋 Migration Files Created

1. **20260201210000_add_whitelabel_fields.sql** - Extends tenants table
2. **20260201210100_create_platform_owners.sql** - Creates platform_owners table
3. **20260201210200_create_platform_audit_logs.sql** - Creates audit logging

---

## 🚀 How to Apply Migrations

### Option A: Supabase Dashboard (Recommended)

1. Go to: https://supabase.com/dashboard/project/dlekahcgkzfrjyzczxyl
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy & paste migration files **in order**:
   - First: `20260201210000_add_whitelabel_fields.sql`
   - Second: `20260201210100_create_platform_owners.sql`
   - Third: `20260201210200_create_platform_audit_logs.sql`
5. Click **Run** for each migration
6. Verify success (no errors)

---

### Option B: Command Line (psql)

```powershell
# Navigate to project root
cd C:\\Users\\APC\\Downloads\\Dua_an_an_trua\\lunch-order-system

# Set database URL
$env:DATABASE_URL = "postgresql://postgres:Congdanh%4079@db.dlekahcgkzfrjyzczxyl.supabase.co:5432/postgres"

# Run migrations in order
psql $env:DATABASE_URL -f supabase/migrations/20260201210000_add_whitelabel_fields.sql
psql $env:DATABASE_URL -f supabase/migrations/20260201210100_create_platform_owners.sql
psql $env:DATABASE_URL -f supabase/migrations/20260201210200_create_platform_audit_logs.sql
```

---

## ✅ Verification Steps

After running migrations, verify in Supabase Dashboard → **Table Editor**:

### Check 1: Tenants Table Has New Columns

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tenants' 
AND column_name LIKE 'custom%';
```

**Expected output:**
- custom_domain (text)
- custom_logo_url (text)
- custom_primary_color (text)
- custom_secondary_color (text)
- custom_fonts (jsonb)
- custom_pricing (jsonb)

### Check 2: Platform Owners Table Exists

```sql
SELECT * FROM public.platform_owners LIMIT 1;
```

**Expected:** Table exists (may be empty)

### Check 3: Audit Logs Table Exists

```sql
SELECT * FROM public.platform_audit_logs LIMIT 1;
```

**Expected:** Table exists (may be empty)

### Check 4: Helper Functions Created

```sql
SELECT proname FROM pg_proc WHERE proname IN ('is_platform_owner', 'log_platform_action');
```

**Expected:** Both functions exist

---

## 🧪 Test Platform Owner Setup

After migrations applied, create a test platform owner account:

```sql
-- Step 1: Create auth user (if doesn't exist)
-- Do this in Supabase Dashboard → Authentication → Users → Add User
-- Email: platform@comngon.vn
-- Password: [set strong password]

-- Step 2: Link to platform_owners table
INSERT INTO public.platform_owners (user_id, full_name, email)
VALUES (
    (SELECT id FROM auth.users WHERE email = 'platform@comngon.vn'),
    'Platform Admin',
    'platform@comngon.vn'
);

-- Step 3: Verify platform owner created
SELECT * FROM public.platform_owners WHERE email = 'platform@comngon.vn';
```

---

## 🐛 Troubleshooting

### Error: "relation already exists"
**Solution:** Column/table already exists, safe to ignore OR drop and recreate

### Error: "permission denied"
**Solution:** Make sure you're using service_role key or postgres user

### Error: "syntax error"
**Solution:** Check SQL syntax, ensure you copied full migration file

---

## 📊 Migration Impact

**Tables Modified:**
- ✅ `tenants` - Added 8 new columns
- ✅ `platform_owners` - NEW table
- ✅ `platform_audit_logs` - NEW table

**Functions Created:**
- ✅ `is_platform_owner()` - Check if user has platform access
- ✅ `log_platform_action()` - Log audit trail

**Indexes Created:**
- ✅ 6 new indexes for performance

**No data loss** - All migrations are additive (ADD COLUMN, CREATE TABLE)

---

## Next Steps After Migration

1. ✅ Verify all tables/columns created
2. ✅ Create platform owner account
3. ⏳ Build platform owner auth helpers (TypeScript)
4. ⏳ Create platform APIs
5. ⏳ Build platform dashboard UI

---

**Ready to apply migrations?** Choose Option A or B above! 🚀
