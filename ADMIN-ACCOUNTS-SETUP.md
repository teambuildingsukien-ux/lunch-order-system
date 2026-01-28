# 🔑 Admin Accounts Setup - Kitchen & Manager

## Quick Setup (2 phút)

### **Bước 1: Tạo Auth Users**

**Vào Supabase Dashboard:**
https://supabase.com/dashboard/project/dlekahcgkzfrjyzczxyl/auth/users

**Tạo 2 users:**

#### **1. Kitchen Admin (Chị Huệ)**
- Click "Add user" → "Create new user"
- Email: `kitchen@company.vn`
- Password: `123456`
- Auto Confirm User: ✅ (checked)
- Click "Create user"

#### **2. Manager (Chị Hường)**
- Click "Add user" → "Create new user"
- Email: `manager@company.vn`
- Password: `123456`
- Auto Confirm User: ✅ (checked)
- Click "Create user"

### **Bước 2: Sync User IDs**

**Sau khi tạo xong 2 users, copy UIDs từ Auth Users list:**

Kitchen UID: `________-____-____-____-____________` (copy từ dashboard)
Manager UID: `________-____-____-____-____________` (copy từ dashboard)

**Chạy SQL này (update với UIDs thật):**

```sql
-- Update Kitchen Admin ID
UPDATE users 
SET id = 'PASTE_KITCHEN_UID_HERE'
WHERE email = 'kitchen@company.vn';

-- Update Manager ID  
UPDATE users 
SET id = 'PASTE_MANAGER_UID_HERE'
WHERE email = 'manager@company.vn';

-- Verify
SELECT id, email, role FROM users WHERE role IN ('Kitchen Admin', 'Manager');
```

---

## ✅ Test Kitchen Dashboard

**Login:**
1. Go to: http://localhost:3000
2. Email: `kitchen@company.vn`
3. Password: `123456`
4. Click "Đăng nhập"

**Expected redirect:** `/dashboard/kitchen`

**Features to verify:**
- ✅ Summary cards (eating/not eating/waste rate)
- ✅ Employee table với status
- ✅ Filter buttons (All/Eating/Not Eating)
- ✅ Search box
- ✅ Auto-refresh toggle

---

## ✅ Test Manager Dashboard

**Login:**
1. Logout Kitchen account
2. Login: `manager@company.vn`
3. Password: `123456`

**Expected redirect:** `/dashboard/manager`

**Features to verify:**
- ✅ 3 KPI cards
  - Waste Rate (%)
  - Cost Savings (VNĐ)
  - Compliance Rate (%)
- ✅ Trend table (14 days)
- ✅ Date range filters (7/30/90 days)

---

## 🎯 Test Checklist

### Kitchen Dashboard Tests:
- [ ] Login successful
- [ ] Summary cards display data
- [ ] Employee table shows employees
- [ ] Filter "Ăn" works
- [ ] Filter "Nghỉ" works
- [ ] Search works
- [ ] Auto-refresh triggers

### Manager Dashboard Tests:
- [ ] Login successful
- [ ] KPI cards display
- [ ] Trend table shows data
- [ ] "7 ngày" filter works
- [ ] "30 ngày" filter works
- [ ] "90 ngày" filter works

---

## 🐛 Troubleshooting

**If stuck on "Đang tải...":**
→ User ID mismatch - run sync SQL above

**If "Failed to fetch":**
→ Check terminal for API errors
→ Verify database has data

**If redirect fails:**
→ Check middleware.ts role mapping
→ Verify user.role in database

---

**Ready to test!** 🚀
