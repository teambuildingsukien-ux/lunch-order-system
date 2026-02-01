# Multi-tenant Database Migrations

**Date:** 2026-01-31  
**Purpose:** Transform single-tenant to multi-tenant architecture with RLS security

---

## 📋 Migration Files (Run in Order)

### 1. `20260131200000_create_tenants_table.sql`
Creates the `tenants` table to manage multiple organizations.

**What it does:**
- ✅ Creates `tenants` table with settings, branding, billing info
- ✅ Adds indexes for performance
- ✅ Inserts default tenant "VietVision Travel"
- ✅ Sets up auto-update trigger for `updated_at`

**Schema:**
```sql
tenants (
  id, name, slug, status,   -- Basic info
  settings (JSONB),          -- Flexible settings
  logo_url, primary_color,   -- Branding
  plan, max_users,           -- Subscription
  billing_email, created_at  -- Billing & metadata
)
```

---

### 2. `20260131201000_add_tenant_id_columns.sql`
Adds `tenant_id` foreign key to all existing tables.

**What it does:**
- ✅ Adds `tenant_id` column to: users, orders, groups, activity_logs
- ✅ Populates `tenant_id` with default tenant for existing data
- ✅ Creates performance indexes on `tenant_id` columns
- ✅ Updates unique constraints to include `tenant_id`

**Key changes:**
```sql
-- Before
users.email UNIQUE
orders (user_id, date) UNIQUE

-- After
users (tenant_id, email) UNIQUE
orders (tenant_id, user_id, date) UNIQUE
```

---

### 3. `20260131202000_enable_row_level_security.sql`
Enables Row-Level Security for data isolation.

**What it does:**
- ✅ Enables RLS on all tables
- ✅ Creates helper functions: `get_user_tenant_id()`, `is_service_role()`
- ✅ Creates RLS policies for:
  - Tenants table (users see own tenant only)
  - Users table (tenant isolation + role-based access)
  - Orders table (employees see own, admin sees all in tenant)
  - Groups table (tenant isolation)
  - Activity logs table (audit trail protection)

**Security impact:**
```sql
-- User CANNOT query across tenants
SELECT * FROM orders;  
-- ✅ RLS auto-filters to current user's tenant

-- Admin sees all in their tenant, not globally
SELECT * FROM users;  
-- ✅ Only users with same tenant_id
```

---

## 🚀 How to Run Migrations

### Option A: Supabase Cloud (Recommended)

**Via Supabase Dashboard:**
1. Go to Supabase project → SQL Editor
2. Copy-paste migration files in order (1 → 2 → 3)
3. Click "Run" for each
4. Verify success in Table Editor

**Via Supabase CLI:**
```bash
# From project root
npx supabase db push

# Or manually run each file
psql $DATABASE_URL < supabase/migrations/20260131200000_create_tenants_table.sql
psql $DATABASE_URL < supabase/migrations/20260131201000_add_tenant_id_columns.sql
psql $DATABASE_URL < supabase/migrations/20260131202000_enable_row_level_security.sql
```

---

### Option B: Local Development

```bash
# Start Supabase locally
npx supabase start

# Run migrations
npx supabase db reset

# Or apply specific migration
npx supabase migration up
```

---

## ✅ Post-Migration Verification

### 1. Check Tables Created
```sql
-- Should see tenants table
SELECT * FROM public.tenants;

-- Should see tenant_id columns
\d public.users
\d public.orders
```

### 2. Verify Default Tenant
```sql
SELECT id, name, slug, status 
FROM public.tenants 
WHERE slug = 'vietvision';

-- Should return 1 row: VietVision Travel
```

### 3. Check RLS is Enabled
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- rowsecurity should be 't' (true) for all tables
```

### 4. Test RLS Policies
```sql
-- Login as regular user
-- This should only return users from their tenant
SELECT COUNT(*) FROM public.users;

-- Service role should see all (bypass RLS)
-- Set role service_role; -- if testing locally
```

---

## 🔄 Rollback (If Needed)

**⚠️ WARNING:** Rollback will remove multi-tenant structure!

```sql
-- Reverse RLS
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
-- ... (disable for all tables)

-- Drop RLS policies
DROP POLICY IF EXISTS users_tenant_isolation_select ON public.users;
-- ... (drop all policies)

-- Remove tenant_id columns
ALTER TABLE public.users DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE public.orders DROP COLUMN IF EXISTS tenant_id;
-- ... (remove from all tables)

-- Drop tenants table
DROP TABLE IF EXISTS public.tenants CASCADE;
```

---

## 🧪 Testing Checklist

- [ ] Migrations run without errors
- [ ] Default tenant exists
- [ ] All tables have `tenant_id` column
- [ ] Existing data has `tenant_id` populated
- [ ] RLS is enabled on all tables
- [ ] User can login and see their data
- [ ] User CANNOT see other tenant's data (test with SQL)
- [ ] Performance is acceptable (check query times)

---

## 📊 Impact on Application

### Backend (No changes needed for basic functionality)
- ✅ RLS automatically filters queries by tenant
- ✅ Supabase SDK continues to work as-is
- ⚠️ Ensure auth session has correct user info

### Frontend (Minor updates)
- ⚠️ Signup flow will need tenant selection (future)
- ⚠️ Admin panel needs tenant context (future)
- ✅ Current app continues to work with default tenant

---

## 🎯 Next Steps

After successful migration:

1. **Test current app** - Verify everything still works
2. **Monitor performance** - Check query times with new indexes
3. **Update application code** - Add tenant context helpers
4. **Build tenant signup** - Allow new companies to register
5. **Add billing** - Stripe integration for subscriptions

---

## 📞 Support

**Migration issues?**
- Check Supabase logs: Dashboard → Logs
- Verify DATABASE_URL is correct
- Ensure you have admin/service_role permissions

**RLS not working?**
- Clear browser cache
- Check user is authenticated (`auth.uid()` returns value)
- Verify `tenant_id` is populated on user record

---

**Documentation updated:** 2026-01-31  
**Migration version:** Phase 1 - Database Foundation
