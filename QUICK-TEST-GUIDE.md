# Quick Testing Setup - Employee Dashboard

## 🚀 Fast Track Setup (5 phút)

### Bước 1: Install Dependencies

```bash
cd c:\Users\APC\Downloads\Dua_an_an_trua\lunch-order-system
npm install
```

---

### Bước 2: Setup Supabase Local

**Option A: Supabase Local (Recommended - No account needed)**

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Start Supabase local
npx supabase start
```

**🔑 Lưu output này - mày sẽ cần:**
```
API URL: http://localhost:54321
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**📧 Email testing:**
- Mở Inbucket: `http://localhost:54324`
- Magic links sẽ xuất hiện ở đây

---

### Bước 3: Create .env.local

```bash
# Copy template
copy .env.local.example .env.local
```

**Edit `.env.local` với values từ Bước 2:**
```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key_from_step_2>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key_from_step_2>
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_TIMEZONE=Asia/Ho_Chi_Minh
NODE_ENV=development

# Không cần Telegram/SendGrid cho testing
TELEGRAM_BOT_TOKEN=not_needed_yet
TELEGRAM_KITCHEN_ADMIN_CHAT_ID=not_needed_yet
SENDGRID_API_KEY=not_needed_yet
SENDGRID_FROM_EMAIL=noreply@company.vn

CRON_SECRET=local_test_secret
RATE_LIMIT_MAX_REQUESTS=60
RATE_LIMIT_WINDOW_MS=60000
```

---

### Bước 4: Run Database Migrations

```bash
# Chạy migrations (tạo tables)
npx supabase db push

# Chạy seed (insert test users)
npx supabase db seed
```

**✅ Kết quả:**
- 5 tables created (users, orders, notification_logs, import_logs, auth_sessions)
- 2 admin users inserted:
  - `kitchen@company.vn` (Kitchen Admin)
  - `manager@company.vn` (Manager)

---

### Bước 5: Add Test Employee

**Mở Supabase Studio:** `http://localhost:54323`

**Table Editor → users → Insert row:**
```
email: test@company.vn
full_name: Test Employee
department: IT
role: Employee
```

Click **Save**

---

### Bước 6: Start Dev Server

```bash
npm run dev
```

**✅ App running:** `http://localhost:3000`

---

## 🧪 Testing Checklist (30 phút)

### TC-001: Login Flow ✅

**Steps:**
1. Open: `http://localhost:3000`
2. Enter email: `test@company.vn`
3. Click "Sign in with Email"
4. Open Inbucket: `http://localhost:54324`
5. Click newest email
6. Click magic link trong email

**Expected:**
- ✅ Email sent message
- ✅ Email received trong Inbucket (<30s)
- ✅ Magic link redirect to `/dashboard/employee`
- ✅ Dashboard shows "Xin chào, Test Employee!"

**Result:** [ ] Pass / [ ] Fail

---

### TC-002: View Today's Order ✅

**Precondition:** Logged in as employee

**Verify:**
- ✅ Status card visible
- ✅ Shows "HÔM NAY ĂN CƠM" (green background)
- ✅ Icon: 🍚
- ✅ Date: Today's date
- ✅ Countdown timer shows time until 5:00 AM
- ✅ Button: "Hôm nay tôi NGHỈ ĂN" (enabled)

**Result:** [ ] Pass / [ ] Fail

---

### TC-003: Countdown Timer Real-time ✅

**Steps:**
1. Watch countdown timer
2. Wait 5 seconds

**Expected:**
- ✅ Seconds decrease: 59 → 58 → 57 → 56 → 55
- ✅ Minutes decrease when seconds hit 00
- ✅ Format: HH:MM:SS

**Result:** [ ] Pass / [ ] Fail

---

### TC-004: Opt-out (Toggle to NGHỈ ĂN) ✅

**Precondition:** Status = "ĂN CƠM"

**Steps:**
1. Click button "Hôm nay tôi NGHỈ ĂN"
2. Wait for response

**Expected:**
- ✅ Button shows loading spinner
- ✅ Alert: "❌ Đã xác nhận nghỉ ăn"
- ✅ Click OK
- ✅ Status changes to "HÔM NAY NGHỈ ĂN"
- ✅ Background: Red
- ✅ Icon: ❌
- ✅ Button text: "✅ Hủy nghỉ ăn"

**Result:** [ ] Pass / [ ] Fail

---

### TC-005: Undo Opt-out (Toggle back to ĂN) ✅

**Precondition:** Status = "NGHỈ ĂN"

**Steps:**
1. Click button "Hủy nghỉ ăn"
2. Wait for response

**Expected:**
- ✅ Alert: "✅ Đã hủy nghỉ ăn"
- ✅ Status back to "HÔM NAY ĂN CƠM"
- ✅ Background: Green
- ✅ Icon: 🍚
- ✅ Button text: "Hôm nay tôi NGHỈ ĂN"

**Result:** [ ] Pass / [ ] Fail

---

### TC-006: Multiple Toggles ✅

**Steps:**
1. Opt-out → Undo → Opt-out → Undo (4 clicks)

**Expected:**
- ✅ Each toggle works
- ✅ No errors
- ✅ Final status depends on last click

**Result:** [ ] Pass / [ ] Fail

---

### TC-007: Database Verification ✅

**After TC-004 (opted out):**

**Open Supabase Studio:** `http://localhost:54323`

**Table Editor → orders:**
1. Find row với `user_id` = test employee
2. Check `date` = today
3. Verify `status` = `not_eating`
4. Verify `locked` = `false`

**Result:** [ ] Pass / [ ] Fail

---

### TC-008: API Direct Test ✅

**Get today's order:**

```bash
# Get session cookie from browser DevTools (Application → Cookies)
# Copy sb-localhost-auth-token value

curl http://localhost:3000/api/v1/orders/today \
  -H "Cookie: sb-localhost-auth-token=<token>"
```

**Expected Response (200):**
```json
{
  "id": "...",
  "user_id": "...",
  "date": "2026-01-21",
  "status": "eating" (or "not_eating"),
  "locked": false,
  ...
}
```

**Result:** [ ] Pass / [ ] Fail

---

### TC-009: Logout ✅

**Steps:**
1. Click "Đăng xuất" button (top right)

**Expected:**
- ✅ Redirect to login page (`/`)
- ✅ Cannot access `/dashboard/employee` (auto-redirect to `/`)

**Result:** [ ] Pass / [ ] Fail

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to Supabase"
**Fix:**
```bash
# Check Supabase status
npx supabase status

# If not running, start it
npx supabase start
```

---

### Issue: "Email not found" on login
**Fix:**
```bash
# Re-run seed or add user manually via Studio
npx supabase db seed
```

---

### Issue: TypeScript errors
**Fix:**
```bash
# Reinstall dependencies
npm install

# Restart VSCode TypeScript server
# Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

---

### Issue: Countdown shows wrong time
**Fix:**
- Check system clock (should be GMT+7 or any timezone)
- Countdown calculates difference to 5:00 AM

---

## ✅ Testing Complete Criteria

All 9 tests pass:
- [TC-001] Login flow
- [TC-002] View order
- [TC-003] Countdown timer
- [TC-004] Opt-out
- [TC-005] Undo
- [TC-006] Multiple toggles
- [TC-007] DB verification
- [TC-008] API test
- [TC-009] Logout

**Total time:** ~30 mins

---

## 📸 Screenshot Checklist

Before marking complete, capture:
- [ ] Login page
- [ ] Employee Dashboard (ĂN CƠM status - green)
- [ ] Employee Dashboard (NGHỈ ĂN status - red)
- [ ] Countdown timer active
- [ ] Inbucket email
- [ ] Supabase Studio (orders table)

---

## 🎯 Next After Testing

Khi tất cả tests pass:
1. Report bugs (nếu có) 
2. Continue Day 7-8 (Kitchen Dashboard)
3. hoặc refactor/improve code

**Ready to test!** 🚀
