# 🚀 Platform Owner Features - Deployment Guide

## 📋 Pre-Deployment Checklist

### ✅ Local Testing Complete
- [ ] All 13 test cases passed (see PLATFORM-TESTING-GUIDE.md)
- [ ] No critical bugs found
- [ ] Performance acceptable (<500ms page loads)
- [ ] Code reviewed

### ✅ Code Ready
- [ ] All files committed to git
- [ ] No console errors
- [ ] TypeScript builds without errors
- [ ] No lint warnings

---

## 🗄️ Step 1: Database Migrations (Production)

### Option A: Via Supabase Dashboard (RECOMMENDED)

1. **Login to Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your production project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in sidebar
   - Click "New query"

3. **Apply Migration 1: White-Label Fields**
   ```sql
   -- Copy/paste from:
   -- supabase/migrations/20260201210000_add_whitelabel_fields.sql
   
   -- Add white-label customization fields to tenants table
   ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS custom_domain TEXT;
   ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS custom_logo_url TEXT;
   -- ... (full migration content)
   ```
   - Click "RUN" (bottom right)
   - **Expected:** "Success. No rows returned"

4. **Apply Migration 2: Platform Owners Table**
   ```sql
   -- Copy/paste from:
   -- supabase/migrations/20260201210100_create_platform_owners.sql
   -- ... (full migration content)
   ```
   - Click "RUN"
   - **Expected:** "Success. No rows returned"

5. **Apply Migration 3: Audit Logs Table**
   ```sql
   -- Copy/paste from:
   -- supabase/migrations/20260201210200_create_platform_audit_logs.sql
   -- ... (full migration content)
   ```
   - Click "RUN"
   - **Expected:** "Success. No rows returned"

### Option B: Via psql (Advanced)

```bash
# Connect to production DB
psql "postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres"

# Run migrations in order
\i supabase/migrations/20260201210000_add_whitelabel_fields.sql
\i supabase/migrations/20260201210100_create_platform_owners.sql
\i supabase/migrations/20260201210200_create_platform_audit_logs.sql
```

### Verify Migrations Applied

```sql
-- Check tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('platform_owners', 'platform_audit_logs');
-- Expected: 2 rows

-- Check functions created
SELECT proname 
FROM pg_proc 
WHERE proname IN ('is_platform_owner', 'log_platform_action');
-- Expected: 2 rows

-- Check tenants columns added
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'tenants' 
AND column_name LIKE 'custom%';
-- Expected: 7 rows (custom_domain, custom_logo_url, etc.)
```

✅ **Migration Success** nếu tất cả queries return expected rows

---

## 👤 Step 2: Create Production Platform Owner

### Create Auth User (Supabase Dashboard)

1. **Go to Authentication > Users**
2. **Click "Add User"**
3. **Fill in:**
   - Email: `platform@yourcompany.com`
   - Password: `[STRONG-PASSWORD]` (generate & save securely)
   - Auto Confirm User: ✅ Checked
4. **Click "Create"**
5. **Copy** the user ID (UUID)

### Link to Platform Owners Table (SQL Editor)

```sql
-- Replace [USER-ID] with actual UUID from step above
INSERT INTO public.platform_owners (
    user_id, 
    full_name, 
    email, 
    phone,
    is_active
)
VALUES (
    '[USER-ID]',
    'Platform Administrator',
    'platform@yourcompany.com',
    '+84 XXX XXX XXX',
    true
)
RETURNING *;
```

**Expected:** Returns 1 row with platform owner details

### Verify Platform Owner

```sql
SELECT 
  po.full_name,
  po.email,
  po.is_active,
  au.email as auth_email,
  au.confirmed_at
FROM platform_owners po
LEFT JOIN auth.users au ON po.user_id = au.id
WHERE po.email = 'platform@yourcompany.com';
```

✅ **Success** nếu thấy platform owner với `is_active = true`

---

## 📦 Step 3: Deploy Code to Vercel

### Push to Git

```bash
cd lunch-order-system

# Check status
git status

# Add all platform files
git add .

# Commit
git commit -m "feat: Platform Owner & White-Label features

- Add platform_owners and platform_audit_logs tables
- Add white-label fields to tenants (logo, colors, fonts)
- Create /api/platform/* APIs for tenant management
- Build platform dashboard UI at /platform
- Add branding editor with live preview
- Implement RLS policies and audit logging"

# Push to main (or your production branch)
git push origin main
```

### Verify Vercel Deployment

1. **Go to Vercel Dashboard**
   - https://vercel.com/your-team/lunch-order-system

2. **Check Deployment Status**
   - Should auto-deploy after git push
   - Wait for "Building..." → "Ready"

3. **Check Build Logs**
   - Click on deployment
   - Check for errors in logs
   - **Expected:** No TypeScript or build errors

### Test Production URLs

```bash
# Test platform dashboard
curl https://your-domain.vercel.app/platform
# Expected: 200 OK (or 403 if not logged in)

# Test API
curl https://your-domain.vercel.app/api/platform/tenants
# Expected: 403 Forbidden (no auth)
```

---

## 🔐 Step 4: Environment Variables

### Verify on Vercel

1. **Go to Vercel Project Settings**
2. **Click "Environment Variables"**
3. **Check these exist:**
   - `NEXT_PUBLIC_SUPABASE_URL` ✅
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅
   - `SUPABASE_SERVICE_ROLE_KEY` ✅

**If missing**, add them:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
```

### Redeploy if env changed

```bash
vercel --prod
```

---

## ✅ Step 5: Post-Deployment Verification

### Test Platform Owner Login

1. **Go to production URL**
   - https://your-domain.vercel.app

2. **Login as platform owner**
   - Email: `platform@yourcompany.com`
   - Password: [password you set]

3. **Access platform dashboard**
   - Navigate to: https://your-domain.vercel.app/platform
   - **Expected:** Dashboard loads with tenant list

### Test Branding Editor

1. **Get a tenant ID from dashboard**
   - Open DevTools, check network tab
   - Or query database

2. **Navigate to branding editor**
   ```
   https://your-domain.vercel.app/platform/tenants/[TENANT-ID]/branding
   ```

3. **Test changes**
   - Update logo, colors, fonts
   - Save
   - **Expected:** Success message + redirect

### Verify Database Changes

```sql
-- Check branding saved
SELECT 
  name,
  custom_logo_url,
  custom_primary_color,
  custom_secondary_color
FROM tenants
WHERE custom_logo_url IS NOT NULL;

-- Check audit logs created
SELECT 
  action,
  target_tenant_id,
  created_at
FROM platform_audit_logs
ORDER BY created_at DESC
LIMIT 5;
```

✅ **Production Verified** nếu tất cả hoạt động như local

---

## 🔒 Step 6: Security Check

### Test Authorization

**As Non-Platform Owner:**
1. Login as regular user (employee/admin of a tenant)
2. Try to access: `https://your-domain.vercel.app/platform`
3. **Expected:** ✅ Redirect to `/dashboard` (403)

**Without Login:**
1. Open incognito window
2. Go to platform URL
3. **Expected:** ✅ Redirect to login

### Test API Protection

```bash
# Without auth
curl https://your-domain.vercel.app/api/platform/tenants
# Expected: 403 Forbidden

# With wrong user
curl https://your-domain.vercel.app/api/platform/tenants \
  -H "Cookie: [non-platform-owner-session]"
# Expected: 403 Forbidden
```

✅ **Security OK** nếu unauthorized access bị block

---

## 📊 Step 7: Monitoring Setup

### Vercel Analytics

1. **Enable Web Analytics**
   - Vercel Dashboard → Analytics
   - Enable for production

2. **Monitor:**
   - Page views on `/platform`
   - Error rates
   - Response times

### Supabase Logs

1. **Go to Supabase Dashboard → Logs**
2. **Monitor:**
   - Database queries
   - API requests
   - Auth events

### Set Up Alerts (Optional)

**Vercel:**
- Set up deployment notifications
- Error rate alerts

**Supabase:**
- Database CPU alerts
- Connection pool alerts

---

## 📝 Step 8: Documentation Update

### Update Production Docs

1. **Create/Update ADMIN-SETUP.md**
   ```markdown
   # Platform Owner Access
   
   URL: https://your-domain.vercel.app/platform
   Login: platform@yourcompany.com
   
   Features:
   - View all tenants
   - Update branding (logo, colors, fonts)
   - Create new tenants
   ```

2. **Update README.md**
   - Add section on platform owner features
   - Add screenshot of dashboard

### Notify Team

**Email template:**
```
Subject: Platform Owner Dashboard - Now Live

Team,

The Platform Owner dashboard is now live in production.

Access: https://your-domain.vercel.app/platform
Credentials: [shared securely via 1Password/Vault]

Features:
✅ View all tenant stats
✅ Customize tenant branding
✅ Audit logs for all actions

Documentation: [link to docs]

Please test and report any issues.
```

---

## 🐛 Step 9: Rollback Plan (If Issues)

### Quick Rollback via Vercel

1. **Go to Vercel Dashboard**
2. **Deployments tab**
3. **Find previous working deployment**
4. **Click "..." → Promote to Production**

### Database Rollback (If needed)

```sql
-- Rollback migrations (in reverse order)
-- ONLY if absolutely necessary

-- 1. Drop audit logs
DROP TABLE IF EXISTS public.platform_audit_logs CASCADE;

-- 2. Drop platform owners
DROP TABLE IF EXISTS public.platform_owners CASCADE;

-- 3. Remove white-label fields
ALTER TABLE public.tenants 
  DROP COLUMN IF EXISTS custom_domain,
  DROP COLUMN IF EXISTS custom_logo_url,
  DROP COLUMN IF EXISTS custom_primary_color,
  DROP COLUMN IF EXISTS custom_secondary_color,
  DROP COLUMN IF EXISTS custom_fonts,
  DROP COLUMN IF EXISTS branding_settings,
  DROP COLUMN IF EXISTS custom_pricing,
  DROP COLUMN IF EXISTS domain_verified,
  DROP COLUMN IF EXISTS domain_verification_token;
```

⚠️ **WARNING:** Only rollback database if critical issues. Data will be lost!

---

## ✅ Deployment Complete Checklist

Final sign-off:

- [ ] Migrations applied to production DB
- [ ] Platform owner account created
- [ ] Code deployed to Vercel (green build)
- [ ] Environment variables configured
- [ ] Platform dashboard accessible in production
- [ ] Branding editor works in production
- [ ] Database changes persist
- [ ] Audit logs being created
- [ ] Authorization working (non-owners blocked)
- [ ] API protection working
- [ ] Monitoring enabled
- [ ] Documentation updated
- [ ] Team notified

---

## 🎉 Success Criteria

✅ **PRODUCTION READY** nếu:
- Platform owner can login
- Dashboard shows all tenants
- Branding editor functional
- Changes save to database
- Audit logs tracking actions
- Regular users cannot access

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue: 403 on /platform even as platform owner**
- Check `platform_owners` table has your user_id
- Verify email matches auth.users email
- Check `is_active = true`

**Issue: Branding not saving**
- Check Supabase service role key in env vars
- Verify RLS policies applied
- Check audit logs for errors

**Issue: 404 on branding editor**
- Verify URL format: `/platform/tenants/[ID]/branding`
- Check tenant ID exists in database

### Get Help

- Check logs: Vercel Dashboard → Logs
- Check database: Supabase → Logs
- Review testing guide: PLATFORM-TESTING-GUIDE.md
- Contact: [your support channel]

---

**Deployment Date:** __________  
**Deployed By:** __________  
**Version:** 1.0.0  
**Status:** ✅ LIVE
