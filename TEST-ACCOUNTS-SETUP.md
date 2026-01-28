# Quick Test Account Setup Guide

## 🔑 Tạo Test Accounts

Vì mình đổi sang email/password login, cần tạo accounts trong Supabase Auth.

### **Option 1: Via Supabase Dashboard (Recommended)**

1. **Mở Supabase Dashboard:**
   - Go to: https://supabase.com/dashboard/project/dlekahcgkzfrjyzczxyl/auth/users

2. **Add User (Employee):**
   - Click "Add User" → "Create new user"
   - **Email:** `test@company.vn` (hoặc `thanconghaibiin@gmail.com`)
   - **Password:** `123456`
   - **Auto Confirm:** ✅ Checked
   - Click "Create user"

3. **Add User to Database:**
   - Go to Table Editor → `users` table
   - Insert row:
     - email: `test@company.vn`
     - full_name: `Test Employee`
     - department: `IT`
     - role: `Employee`

### **Option 2: Via SQL (Faster)**

Chạy SQL này trong Supabase SQL Editor:

```sql
-- Insert users vào database (nếu chưa có)
INSERT INTO users (email, full_name, department, role)
VALUES 
  ('test@company.vn', 'Test Employee', 'IT', 'Employee'),
  ('kitchen@company.vn', 'Chị Huệ', 'Operations', 'Kitchen Admin'),
  ('manager@company.vn', 'Chị Hường', 'HR', 'Manager')
ON CONFLICT (email) DO NOTHING;
```

**LƯU Ý:** Sau đó vẫn phải tạo Auth users qua Dashboard (bước 2 ở Option 1)

---

## 🧪 Test Accounts Ready to Use

| Email | Password | Role | Dashboard |
|-------|----------|------|-----------|
| `test@company.vn` | `123456` | Employee | Opt-out dashboard |
| `kitchen@company.vn` | `123456` | Kitchen Admin | Summary dashboard |
| `manager@company.vn` | `123456` | Manager | KPI dashboard |

---

## ✅ Testing Steps

### **1. Login as Employee**
```
Email: test@company.vn
Password: 123456
```

**Expected:**
- Redirect to `/dashboard/employee`
- See order status card (green/red)
- See countdown timer
- Opt-out button enabled

**Test:**
- Click "Hôm nay tôi NGHỈ ĂN"
- Status changes to red
- Click "Hủy nghỉ ăn"
- Status back to green

---

### **2. Login as Kitchen Admin**
```
Email: kitchen@company.vn
Password: 123456
```

**Expected:**
- Redirect to `/dashboard/kitchen`
- See 3 summary cards (eating/not eating/waste rate)
- See employee table
- Filter buttons work
- Search box functional

**Test:**
- Click filter "Ăn" → Only eating employees
- Click filter "Nghỉ" → Only not eating
- Type in search → Filter results
- Wait 30s → Auto-refresh

---

### **3. Login as Manager**
```
Email: manager@company.vn
Password: 123456
```

**Expected:**
- Redirect to `/dashboard/manager`
- See 3 KPI cards
  - Waste Rate (%)
  - Cost Savings (VNĐ)
  - Compliance Rate (%)
- See trend table (last 14 days)
- Date range buttons (7/30/90 days)

**Test:**
- Click "7 ngày" → Data updates
- Click "30 ngày" → Different data
- Scroll trend table
- Click refresh

---

## 🚀 Quick Start (Mày làm ngay)

**Đã có user `thanconghaibiin@gmail.com` login rồi, nên:**

1. **Add vào database:**
```sql
INSERT INTO users (email, full_name, department, role)
VALUES ('thanconghaibiin@gmail.com', 'Thân Công Hải Bình', 'IT', 'Employee')
ON CONFLICT (email) DO NOTHING;
```

2. **Tạo Auth user:**
   - Supabase Dashboard → Authentication → Add User
   - Email: `thanconghaibiin@gmail.com`
   - Password: `123456`
   - Auto Confirm: ✅

3. **Login:**
   - Go to: http://localhost:3000
   - Email: `thanconghaibiin@gmail.com`
   - Password: `123456`
   - Click "Đăng nhập"

Done! 🎉
