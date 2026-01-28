# 🔗 EMPLOYEE DASHBOARD - BACKEND INTEGRATION

## ✅ ĐÃ HOÀN THÀNH

### **1. Database Migration** 📊
File: `EMPLOYEE-DASHBOARD-MIGRATION.sql`

**Tables created:**
- ✅ `shifts` - Ca ăn (11:00-11:45, 11:30-12:15, 12:00-12:45)
- ✅ `groups` - Nhóm nhân viên
- ✅ `announcements` - Thông báo hệ thống
- ✅ `users.group_id` - Foreign key to groups

**Seed data:**
- 3 shifts
- 3 groups (Sản xuất A, Văn phòng B, Kỹ thuật C)
- 3 announcements mẫu

### **2. EmployeeDashboard Component** 🎯
File: `app/dashboard/_components/EmployeeDashboard.tsx`

**Backend integration:**
- ✅ Fetch user profile + group info
- ✅ Fetch today's order status
- ✅ Fetch group members + their status
- ✅ Fetch active announcements
- ✅ Fetch monthly eating days count
- ✅ Update order status (slider)
- ✅ Toast notifications
- ✅ Loading states
- ✅ Error handling

---

## 🚀 SETUP HƯỚNG DẪN

### **Bước 1: Chạy Migration SQL**

1. Mở **Supabase Dashboard**:
   ```
   https://supabase.com/dashboard/project/YOUR_PROJECT/editor
   ```

2. Vào **SQL Editor** → **New Query**

3. Copy toàn bộ nội dung file `EMPLOYEE-DASHBOARD-MIGRATION.sql`

4. Paste vào SQL Editor và click **Run**

5. Kiểm tra kết quả:
   - ✅ 4 tables mới: shifts, groups, announcements + users.group_id
   - ✅ 3 shifts
   - ✅ 3 groups
   - ✅ 3 announcements

---

### **Bước 2: Verify Data**

Chạy queries sau để kiểm tra:

```sql
-- Check shifts
SELECT * FROM shifts;

-- Check groups with shift info
SELECT g.*, s.name as shift_name, s.start_time, s.end_time 
FROM groups g 
LEFT JOIN shifts s ON g.shift_id = s.id;

-- Check announcements
SELECT * FROM announcements WHERE active = true;

-- Check users with groups
SELECT u.email, u.full_name, u.role, g.name as group_name 
FROM users u 
LEFT JOIN groups g ON u.group_id = g.id;
```

---

### **Bước 3: Test Dashboard**

1. **Đăng nhập:**
   ```
   http://localhost:3000/login
   Email: test@company.vn
   Password: 123456
   ```

2. **Vào Dashboard:**
   ```
   http://localhost:3000/dashboard/employee-demo
   ```

3. **Kiểm tra:**
   - ✅ Loading spinner hiển thị
   - ✅ User name hiển thị đúng
   - ✅ Order status từ database
   - ✅ Group info (Sản xuất A, ca 11:30-12:15, Khu A - Tầng 1)
   - ✅ Member list với status
   - ✅ Announcements marquee
   - ✅ Monthly eating days count

4. **Test slider:**
   - Click slider → Status đổi (eating ↔ not_eating)
   - Toast notification hiển thị
   - Database cập nhật
   - Page refresh tự động

---

## 📊 API Flow

### **1. fetchDashboardData()**

```typescript
// Step 1: Get current user
const { user } = await supabase.auth.getUser();

// Step 2: Get profile + group (JOIN)
const profile = await supabase
  .from('users')
  .select(`
    *,
    groups (
      *,
      shifts (*)
    )
  `)
  .eq('email', user.email)
  .single();

// Step 3: Get today's order
const order = await supabase
  .from('orders')
  .select('status')
  .eq('user_id', profile.id)
  .eq('date', today)
  .single();

// Step 4: Get group members
const members = await supabase
  .from('users')
  .select('*')
  .eq('group_id', profile.group_id);

// For each member, get their order status
for (member of members) {
  const order = await supabase
    .from('orders')
    .select('status')
    .eq('user_id', member.id)
    .eq('date', today);
}

// Step 5: Get announcements
const announcements = await supabase
  .from('announcements')
  .select('*')
  .eq('active', true)
  .order('created_at', { ascending: false });

// Step 6: Get monthly stats
const monthlyOrders = await supabase
  .from('orders')
  .select('*')
  .eq('user_id', profile.id)
  .eq('status', 'eating')
  .gte('date', startOfMonth)
  .lte('date', endOfMonth);
```

### **2. handleSliderConfirm()**

```typescript
// Update order status
await supabase
  .from('orders')
  .upsert({
    user_id: userId,
    date: today,
    status: newStatus,
    locked: false,
    updated_at: now
  }, {
    onConflict: 'user_id,date'
  });

// Show toast
showToast(`✅ Đã ${newStatus === 'eating' ? 'đăng ký' : 'hủy'} suất ăn!`);

// Refresh data
fetchDashboardData();
```

---

## 🗄️ Database Schema

### **shifts**
```sql
id          UUID PRIMARY KEY
name        VARCHAR(100)      -- 'Ca 1', 'Ca 2', 'Ca 3'
start_time  TIME              -- '11:00:00'
end_time    TIME              -- '11:45:00'
active      BOOLEAN
```

### **groups**
```sql
id          UUID PRIMARY KEY
name        VARCHAR(255)      -- 'Sản xuất A'
department  VARCHAR(255)      -- 'Bộ phận lắp ráp'
shift_id    UUID              -- FK to shifts
table_area  VARCHAR(100)      -- 'Khu A - Tầng 1'
active      BOOLEAN
```

### **announcements**
```sql
id          UUID PRIMARY KEY
title       VARCHAR(255)
content     TEXT              -- Full message
priority    VARCHAR(20)       -- 'normal', 'high', 'urgent'
active      BOOLEAN
created_by  UUID              -- FK to users
```

### **users (updated)**
```sql
...existing columns...
group_id    UUID              -- FK to groups (NEW)
```

---

## 🔧 Troubleshooting

### **Lỗi: "group_id không tồn tại"**
→ Run migration SQL để add column

### **Lỗi: "No members found"**
→ Assign users to groups:
```sql
UPDATE users SET group_id = (SELECT id FROM groups WHERE name = 'Sản xuất A' LIMIT 1)
WHERE email IN ('test@company.vn', 'user2@company.vn');
```

### **Lỗi: "Cannot read announcements"**
→ Insert seed data:
```sql
INSERT INTO announcements (content, priority, active, created_by)
VALUES ('🎉 Test announcement', 'normal', true, (SELECT id FROM users LIMIT 1));
```

### **Member status không cập nhật**
→ Check orders table:
```sql
SELECT * FROM orders WHERE date = CURRENT_DATE;
```

---

## 📋 Checklist

- [ ] Run migration SQL
- [ ] Verify shifts, groups, announcements created
- [ ] Assign test users to groups
- [ ] Login với test@company.vn
- [ ] Dashboard loads successfully
- [ ] Group info hiển thị đúng
- [ ] Member list hiển thị
- [ ] Slider updates order status
- [ ] Toast notifications work
- [ ] Monthly count accurate

---

## 🎯 Kết Quả Mong Đợi

Sau khi setup xong:

1. **Login:** test@company.vn
2. **Dashboard hiển thị:**
   - Nhóm: Sản xuất A
   - Ca: 11:30 - 12:15
   - Bàn: Khu A - Tầng 1
   - Members: 4 người (có thể ít hơn nếu chưa assign)
   - Announcements: 3 thông báo chạy marquee
   - Monthly: Số ngày ăn trong tháng

3. **Click slider:**
   - Status đổi ngay lập tức
   - Toast hiển thị
   - Database update
   - Member list refresh

---

**Status:** ✅ READY TO TEST  
**Date:** 2026-01-26  
**Version:** 2.0 - Full Backend Integration
