# 🚀 QUICK START - CHẠY MIGRATION SQL

## Bước 1: Mở Supabase Dashboard

1. Vào: https://supabase.com/dashboard
2. Chọn project của bạn
3. Click **SQL Editor** (biểu tượng database bên trái)

## Bước 2: Chạy Migration

1. Click **"New Query"**
2. Copy toàn bộ nội dung file: `EMPLOYEE-DASHBOARD-MIGRATION.sql`
3. Paste vào SQL Editor
4. Click **"Run"** (hoặc Ctrl+Enter)

## Bước 3: Verify

Chạy query này để kiểm tra:

```sql
-- Check tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('shifts', 'groups', 'announcements');

-- Check data
SELECT * FROM shifts;
SELECT * FROM groups;
SELECT * FROM announcements;
```

Kết quả mong đợi:
- ✅ 3 tables: shifts, groups, announcements
- ✅ 3 shifts
- ✅ 3 groups  
- ✅ 3 announcements

## Bước 4: Test Dashboard

1. Login: `http://localhost:3000/login`
   - Email: `test@company.vn`
   - Password: `123456`

2. Vào: `http://localhost:3000/dashboard/employee-demo`

3. Kiểm tra:
   - ✅ Loading spinner xuất hiện
   - ✅ User name hiển thị
   - ✅ Group info: "Sản xuất A"
   - ✅ Shift: "11:30 - 12:15"
   - ✅ Table area: "Khu A - Tầng 1"
   - ✅ Announcements chạy marquee
   - ✅ Click slider → status đổi → toast hiện

---

**SAU KHI CHẠY XONG, BÁO TÔI BIẾT ĐỂ TÔI GIÚP DEBUG NẾU CÓ LỖI!**
