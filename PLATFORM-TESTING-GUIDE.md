# 🧪 Platform Owner Features - Testing Guide

## 📋 Pre-Test Setup

**Account cần dùng:**
- Platform Owner: `admin@company.vn` / `123456`

**URL cần test:**
- Dashboard: http://localhost:3000/platform
- Branding Editor: http://localhost:3000/platform/tenants/[tenant-id]/branding

---

## ✅ Test Case 1: Login & Authorization

### Bước 1: Test Platform Owner Login
1. Mở http://localhost:3000
2. Login với `admin@company.vn` / `123456`
3. **Expected:** ✅ Login thành công

### Bước 2: Test Platform Dashboard Access
1. Navigate đến http://localhost:3000/platform
2. **Expected:** ✅ Dashboard hiển thị với tenant list

### Bước 3: Test Regular User Protection
1. Logout
2. Login bằng user thường (VD: `nhanvien@vietvisiontravel.com`)
3. Truy cập http://localhost:3000/platform
4. **Expected:** ✅ Redirect về `/dashboard` (403 forbidden)

**✅ PASS nếu:** Platform owner vào được, user thường bị chặn

---

## ✅ Test Case 2: Platform Dashboard UI

### Bước 1: Stats Cards
1. Login as platform owner
2. Truy cập http://localhost:3000/platform
3. Kiểm tra 4 stats cards ở top
4. **Expected:**
   - Tổng Tenants: 4
   - Active: 1
   - Trial: 3
   - Enterprise: 1

### Bước 2: Tenant List
1. Scroll xuống tenant list
2. **Expected:** Thấy 4 tenants:
   - PayOS Test Org
   - Production Test Corp
   - Victory Corp 2026
   - VietVision Travel

### Bước 3: Tenant Card Info
1. Check mỗi tenant card có đầy đủ:
   - Tên tenant
   - Slug (@xxx)
   - Status badge (active/trialing)
   - Plan (BASIC/ENTERPRISE)
   - User count
   - Payment count
   - 2 buttons: Branding + Settings
   - Created date ở footer

**✅ PASS nếu:** Tất cả thông tin hiển thị đúng

---

## ✅ Test Case 3: Search & Filter

### Bước 1: Search by Name
1. Ở platform dashboard, type "viet" vào search box
2. **Expected:** Chỉ hiện "VietVision Travel"

### Bước 2: Search by Slug
1. Clear search
2. Type "payos" 
3. **Expected:** Chỉ hiện "PayOS Test Org"

### Bước 3: Clear Search
1. Clear search box
2. **Expected:** Hiện lại tất cả 4 tenants

**✅ PASS nếu:** Search hoạt động với cả name và slug

---

## ✅ Test Case 4: Branding Editor - Navigation

### Bước 1: Copy Tenant ID
1. Ở platform dashboard, mở DevTools (F12)
2. Console, chạy:
```javascript
console.log(document.querySelector('.bg-white').textContent)
```
3. Hoặc check URL sau khi click button

### Bước 2: Manual Navigation (RECOMMENDED)
1. Copy tenant ID từ database hoặc API response
2. Navigate đến:
```
http://localhost:3000/platform/tenants/c2ffc5dc-f236-46d6-b801-87ace1dd4177/branding
```
3. **Expected:** ✅ Branding editor loads

### Bước 3: Button Navigation (May have issues)
1. Click "Branding" button (orange button with palette icon)
2. **Expected:** Should navigate to branding editor
3. **Note:** Nếu không work, dùng manual navigation ở Step 2

**✅ PASS nếu:** Truy cập được branding editor (manual hoặc button)

---

## ✅ Test Case 5: Branding Editor - Logo

### Test Logo URL Input
1. Ở branding editor, tìm "Logo URL" field
2. Nhập URL:
```
https://via.placeholder.com/150x50/FF6600/FFFFFF?text=TestLogo
```
3. **Expected:** 
   - ✅ Preview panel bên phải update ngay
   - ✅ Logo mới hiện trong preview

### Test Logo Validation
1. Xóa logo URL (để trống)
2. **Expected:** ✅ Preview hiện default/no logo

**✅ PASS nếu:** Logo preview update real-time

---

## ✅ Test Case 6: Branding Editor - Colors

### Test Primary Color
1. Click vào color picker "Primary Color"
2. Chọn màu cam: **#FF6600**
3. **Expected:**
   - ✅ Hex input hiện #FF6600
   - ✅ Preview button background đổi sang cam

### Test Secondary Color
1. Click vào color picker "Secondary Color"
2. Chọn màu xanh navy: **#003366**
3. **Expected:**
   - ✅ Hex input hiện #003366
   - ✅ Preview secondary elements đổi màu

### Test Manual Hex Input
1. Click vào hex input của primary color
2. Type trực tiếp: `#9C27B0` (purple)
3. **Expected:** 
   - ✅ Color picker update
   - ✅ Preview update

**✅ PASS nếu:** Cả picker và hex input đều sync + preview real-time

---

## ✅ Test Case 7: Branding Editor - Fonts

### Test Heading Font
1. Click dropdown "Heading Font"
2. Chọn "Poppins"
3. **Expected:**
   - ✅ Preview heading text đổi font
   - ✅ Font áp dụng ngay

### Test Body Font
1. Click dropdown "Body Font"
2. Chọn "Roboto"
3. **Expected:**
   - ✅ Preview body text đổi font
   - ✅ Font áp dụng ngay

**✅ PASS nếu:** Font changes visible trong preview

---

## ✅ Test Case 8: Branding Editor - Save

### Test Save Functionality
1. Thay đổi:
   - Logo: `https://via.placeholder.com/150x50/9C27B0/FFFFFF?text=SAVED`
   - Primary Color: `#9C27B0`
   - Secondary Color: `#673AB7`
   - Heading Font: `Montserrat`
   - Body Font: `Open Sans`
2. Click "Lưu thay đổi" button
3. **Expected:**
   - ✅ Loading spinner xuất hiện
   - ✅ Success alert: "Branding updated successfully!"
   - ✅ Redirect về `/platform`

### Test Data Persistence
1. Quay lại branding editor (same tenant)
2. **Expected:**
   - ✅ Form pre-filled với values vừa save
   - ✅ Preview hiện đúng branding đã lưu

**✅ PASS nếu:** Save thành công + data persist

---

## ✅ Test Case 9: Database Verification

### Check Branding Data in DB
1. Mở Supabase Dashboard hoặc psql
2. Run query:
```sql
SELECT 
  name,
  custom_logo_url,
  custom_primary_color,
  custom_secondary_color,
  custom_fonts->>'heading' as heading_font,
  custom_fonts->>'body' as body_font
FROM tenants
WHERE id = 'c2ffc5dc-f236-46d6-b801-87ace1dd4177';
```
3. **Expected:**
   - ✅ Logo URL đúng
   - ✅ Colors đúng
   - ✅ Fonts đúng

**✅ PASS nếu:** Data trong DB match với UI

---

## ✅ Test Case 10: Audit Logs

### Check Audit Logs Created
1. Run query:
```sql
SELECT 
  action,
  target_tenant_id,
  details,
  ip_address,
  created_at
FROM platform_audit_logs
ORDER BY created_at DESC
LIMIT 10;
```
2. **Expected:** Thấy logs:
   - `list_tenants` (khi vào dashboard)
   - `update_branding` (khi save branding)

### Check Log Details
1. Kiểm tra `details` column
2. **Expected:**
   - ✅ Contains changed fields
   - ✅ IP address logged
   - ✅ Timestamp accurate

**✅ PASS nếu:** Mọi action đều được log

---

## ✅ Test Case 11: API Testing

### Test GET /api/platform/tenants
```bash
# Với auth token của platform owner
curl http://localhost:3000/api/platform/tenants \
  -H "Cookie: your-session-cookie"
```
**Expected:** JSON với tenant list + stats

### Test PUT /api/platform/tenants/[id]/branding
```bash
curl -X PUT http://localhost:3000/api/platform/tenants/[id]/branding \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "logo_url": "https://example.com/logo.png",
    "primary_color": "#FF6600",
    "secondary_color": "#003366"
  }'
```
**Expected:** 200 OK response

### Test API Protection (Without Auth)
```bash
curl http://localhost:3000/api/platform/tenants
```
**Expected:** 403 Forbidden

**✅ PASS nếu:** APIs work với auth, reject without auth

---

## ✅ Test Case 12: Responsive Design

### Desktop View (1920x1080)
1. Resize browser to full desktop
2. **Expected:**
   - ✅ 2 columns trong tenant list
   - ✅ Stats cards 4 columns
   - ✅ Branding editor: form left, preview right

### Tablet View (768px)
1. Resize browser to 768px width
2. **Expected:**
   - ✅ 1 column tenant list
   - ✅ Stats cards 2 columns
   - ✅ Branding preview stack below form

### Mobile View (375px)
1. Resize to 375px
2. **Expected:**
   - ✅ Stats cards stack vertically
   - ✅ All buttons full width
   - ✅ Text readable

**✅ PASS nếu:** UI responsive tốt trên mọi device

---

## ✅ Test Case 13: Dark Mode

### Test Dark Mode Toggle
1. Click dark mode toggle (nếu có)
2. **Expected:**
   - ✅ Dashboard chuyển sang dark theme
   - ✅ Branding editor dark theme
   - ✅ Colors contrast tốt

**✅ PASS nếu:** Dark mode hoạt động

---

## 📊 Test Results Summary

### Test Pass Rate
Fill in sau khi test:

- [ ] Test Case 1: Login & Authorization
- [ ] Test Case 2: Platform Dashboard UI
- [ ] Test Case 3: Search & Filter
- [ ] Test Case 4: Branding Editor - Navigation
- [ ] Test Case 5: Branding Editor - Logo
- [ ] Test Case 6: Branding Editor - Colors
- [ ] Test Case 7: Branding Editor - Fonts
- [ ] Test Case 8: Branding Editor - Save
- [ ] Test Case 9: Database Verification
- [ ] Test Case 10: Audit Logs
- [ ] Test Case 11: API Testing
- [ ] Test Case 12: Responsive Design
- [ ] Test Case 13: Dark Mode

**TOTAL:** ___ / 13 tests passed

---

## 🐛 Bugs Found

| Bug ID | Description | Severity | Status |
|--------|-------------|----------|--------|
| | | | |

---

## ✅ Sign-Off

**Tested By:** _________________  
**Date:** _________________  
**Overall Status:** ⚪ PASS / ⚪ FAIL  

**Notes:**

---

## 🚀 Ready for Production?

Nếu **ALL tests PASS**, ready to deploy! ✅

Proceed to: `PLATFORM-DEPLOYMENT-GUIDE.md`
