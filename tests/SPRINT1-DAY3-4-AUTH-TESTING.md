# Sprint 1 Day 3-4: Auth Flow Testing Guide

## ✅ Features Implemented

1. **Login Page** (`/`)
   - Email input với validation
   - Domain check (@company.vn)
   - Magic link via Supabase Auth
   - Loading states
   - Error messages

2. **Auth Callback** (`/auth/callback`)
   - Magic link verification
   - Role-based redirect (Employee/Kitchen Admin/Manager)

3. **Dashboard Placeholders**
   - `/dashboard/employee`
   - `/dashboard/kitchen`
   - `/dashboard/manager`
   - Auth check (redirect to login if not authenticated)

4. **Middleware**
   - Global auth state management
   - Protected routes (/dashboard/*)
   - Auto-redirect authenticated users from login page

---

## 🧪 Testing Checklist (TC-001, TC-002 fromStep 11)

### Prerequisites:
- [ ] Supabase project created và configured
- [ ] `.env.local` có values đúng
- [ ] Database migrations đã run
- [ ] Seed data đã insert (2 admin users)
- [ ] Dev server running: `npm run dev`

---

### Test Case TC-001: Login với email valid

**Steps:**
1. Navigate to `http://localhost:3000`
2. Enter email: `kitchen@company.vn` (hoặc employee test email)
3. Click "Sign in with Email"
4. Check email inbox (hoặc Supabase Inbucket nếu dùng local)
5. Click magic link trong email
6. Observe redirect

**Expected:**
- Step 3: Success message "Email đã được gửi..."
- Step 4: Email received trong <30 seconds
- Step 5: Magic link valid (navigate to `/auth/callback?code=xxx`)
- Step 6: 
  - `kitchen@company.vn` → Redirect to `/dashboard/kitchen`
  - Regular employee → Redirect to `/dashboard/employee`
  - `manager@company.vn` → Redirect to `/dashboard/manager`
- Dashboard shows role + full name

**Actual Result:**
- [ ] Pass / [ ] Fail
- Notes: ___________________________________

---

### Test Case TC-002: Login với email invalid domain

**Steps:**
1. Navigate to `http://localhost:3000`
2. Enter email: `test@gmail.com` (not @company.vn)
3. Click "Sign in with Email"

**Expected:**
- Error message: "Email phải là email công ty (@company.vn)"
- Form không submit
- No email sent

**Actual Result:**
- [ ] Pass / [ ] Fail
- Notes: ___________________________________

---

### Test Case TC-003: Login với email not in database

**Steps:**
1. Navigate to `http://localhost:3000`
2. Enter email: `notexist@company.vn`
3. Click "Sign in with Email"

**Expected:**
- Error message: "Email chưa được đăng ký. Liên hệ admin."
- No redirect

**Actual Result:**
- [ ] Pass / [ ] Fail
- Notes: ___________________________________

---

### Test Case TC-004: Protected route access (not authenticated)

**Steps:**
1. Open incognito window
2. Navigate directly to `http://localhost:3000/dashboard/employee`

**Expected:**
- Auto-redirect to `/` (login page)
- No dashboard content shown

**Actual Result:**
- [ ] Pass / [ ] Fail
- Notes: ___________________________________

---

### Test Case TC-005: Login page access (already authenticated)

**Steps:**
1. Login successfully (TC-001)
2. Navigate back to `http://localhost:3000`

**Expected:**
- Auto-redirect to `/dashboard/employee`
- No login form shown

**Actual Result:**
- [ ] Pass / [ ] Fail
- Notes: ___________________________________

---

## 🐛 Known Issues / Limitations

1. **Supabase local setup:** 
   - Emails sent to Inbucket (`http://localhost:54324`)
   - Real emails require Supabase cloud project

2. **Role-based redirect:**
   - Requires `users` table populated
   - Falls back to `/dashboard/employee` if role query fails

3. **Session management:**
   - JWT expires after 7 days (configurable)
   - Refresh handled by middleware

---

## 📊 Test Results Summary

**Total test cases:** 5  
**Passed:** ___  
**Failed:** ___  
**Blocked:** ___

**Date tested:** _______________  
**Tester:** _______________  
**Environment:** Local development

---

## ✅ Next Steps (Sprint 1 Day 5-6)

- [ ] Build Employee Dashboard (opt-out flow)
- [ ] Build Order status API (`GET /api/v1/orders/today`)
- [ ] Build Opt-out API (`POST /api/v1/orders/opt-out`)
- [ ] Test US-004, US-005, US-006, US-007

