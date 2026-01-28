# 🔐 Hướng Dẫn Tích Hợp Backend Đăng Nhập

## ✅ Đã Hoàn Thành

### **1. LoginScreen Component** 
📍 `app/dashboard/_components/LoginScreen.tsx`

**Tính năng:**
- ✅ Supabase Auth integration với email/password
- ✅ Toast notifications (success/error messages)
- ✅ Form validation (HTML5 + custom)
- ✅ Loading states với spinner animation
- ✅ Error handling chi tiết
- ✅ Dark mode support
- ✅ Password show/hide toggle
- ✅ Auto-redirect sau khi login thành công

**Authentication Flow:**
1. User nhập email + password
2. Gọi `supabase.auth.signInWithPassword()`
3. Kiểm tra user có trong database `users` table không
4. Lấy thông tin `role`, `full_name`, `department`
5. Hiển thị toast "Chào mừng [tên]!"
6. Redirect về `/dashboard`
7. Middleware xử lý role-based routing

---

### **2. Middleware Updates**
📍 `middleware.ts`

**Thay đổi:**
```typescript
// ✅ Protected routes: /dashboard
if (!user && pathname.startsWith('/dashboard')) {
  redirect to /login  // Thay vì /
}

// ✅ Authenticated users không được vào /login
if (user && pathname === '/login') {
  redirect to /dashboard
}

// ✅ Root route / redirect to /login
if (!user && pathname === '/') {
  redirect to /login
}
```

---

### **3. Login Page**
📍 `app/login/page.tsx`

**Setup:**
- Wrap `LoginScreen` với `ToastProvider`
- Route: `http://localhost:3000/login`

---

## 🧪 Hướng Dẫn Test

### **Test 1: Đăng nhập thành công**

**Bước thực hiện:**
1. Mở browser: `http://localhost:3000/login`
2. Nhập email: `test@company.vn`
3. Nhập password: `123456`
4. Click "Đăng nhập ngay"

**Kết quả mong đợi:**
- ✅ Loading spinner hiển thị
- ✅ Toast notification: "✅ Chào mừng Test Employee! 👋"
- ✅ Tự động redirect về `/dashboard`
- ✅ Dashboard hiển thị role-appropriate content

---

### **Test 2: Email/Password sai**

**Bước thực hiện:**
1. Nhập email: `wrong@email.com`
2. Nhập password: `wrongpassword`
3. Click "Đăng nhập ngay"

**Kết quả mong đợi:**
- ✅ Toast notification: "❌ Email hoặc mật khẩu không đúng! 🔒"
- ✅ Loading spinner biến mất
- ✅ Vẫn ở trang login
- ✅ Form không reset (user có thể sửa)

---

### **Test 3: Email không tồn tại trong database**

**Bước thực hiện:**
1. Tạo auth user trong Supabase (Email: `newuser@test.com`)
2. KHÔNG thêm vào `users` table
3. Login với email đó

**Kết quả mong đợi:**
- ✅ Toast: "❌ Không tìm thấy thông tin nhân viên trong hệ thống! ⚠️"
- ✅ Auto sign out user
- ✅ Vẫn ở trang login

---

### **Test 4: Dark Mode**

**Bước thực hiện:**
1. Bật Dark Mode trong OS/Browser settings
2. Refresh trang login

**Kết quả mong đợi:**
- ✅ Background: Dark (#23170f)
- ✅ Text: White
- ✅ Input borders: Dark gray
- ✅ Tất cả elements readable trong dark mode

---

### **Test 5: Redirect Logic**

**Test 5a: User đã login cố vào /login**
```
User logged in → Visit /login → Auto redirect to /dashboard
```

**Test 5b: User chưa login cố vào /dashboard**
```
User not logged in → Visit /dashboard → Auto redirect to /login
```

**Test 5c: User chưa login vào root**
```
User not logged in → Visit / → Auto redirect to /login
```

---

## 🎯 Test Accounts

| Email | Password | Role | Dashboard View |
|-------|----------|------|----------------|
| `test@company.vn` | `123456` | Employee | Orders/Opt-out |
| `kitchen@company.vn` | `123456` | Kitchen Admin | Summary table |
| `manager@company.vn` | `123456` | Manager | KPI dashboard |

---

## 🔧 Troubleshooting

### **Lỗi: "Không tìm thấy thông tin người dùng"**
**Nguyên nhân:** User có trong Supabase Auth nhưng không có trong `users` table

**Cách sửa:**
```sql
INSERT INTO users (email, full_name, department, role)
VALUES ('email@company.vn', 'Tên đầy đủ', 'IT', 'Employee');
```

---

### **Lỗi: Toast không hiển thị**
**Nguyên nhân:** Thiếu `ToastProvider` wrapper

**Cách sửa:** Đảm bảo `app/login/page.tsx` đã wrap:
```tsx
<ToastProvider>
  <LoginScreen />
</ToastProvider>
```

---

### **Lỗi: Redirect loop**
**Nguyên nhân:** Middleware logic conflict

**Cách kiểm tra:**
1. Clear cookies/localStorage
2. Hard refresh (Ctrl + Shift + R)
3. Kiểm tra logs trong console

---

## 📝 Code Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│  User nhập Email + Password                         │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  handleSubmit() triggered                           │
│  - Set isLoading = true                             │
│  - Call supabase.auth.signInWithPassword()          │
└──────────────────┬──────────────────────────────────┘
                   │
          ┌────────┴────────┐
          │                 │
          ▼                 ▼
    ┌─────────┐      ┌──────────┐
    │ Success │      │  Error   │
    └────┬────┘      └─────┬────┘
         │                 │
         │                 ▼
         │           Show toast error
         │           Set isLoading = false
         │           Return
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  Query database for user profile                    │
│  - SELECT * FROM users WHERE email = ?              │
└──────────────────┬──────────────────────────────────┘
                   │
          ┌────────┴────────┐
          │                 │
          ▼                 ▼
    ┌─────────┐      ┌──────────┐
    │  Found  │      │ Not Found│
    └────┬────┘      └─────┬────┘
         │                 │
         │                 ▼
         │           Sign out user
         │           Show toast error
         │           Return
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  Show success toast                                 │
│  - "Chào mừng [full_name]!"                         │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  Redirect to /dashboard                             │
│  - router.push('/dashboard')                        │
│  - router.refresh()                                 │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  Middleware handles role-based content              │
│  - Employee → Order management                      │
│  - Kitchen Admin → Summary table                    │
│  - Manager → KPI dashboard                          │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 Production Checklist

Trước khi deploy lên production:

- [ ] Thay đổi password test accounts
- [ ] Enable email confirmation trong Supabase
- [ ] Rate limiting cho login attempts
- [ ] Add CAPTCHA nếu cần
- [ ] Enable 2FA cho Manager/Kitchen Admin
- [ ] Log login attempts vào `audit_logs` table
- [ ] Setup session timeout
- [ ] Add "Quên mật khẩu" feature (nếu cần)
- [ ] Test trên mobile devices
- [ ] Test với slow 3G connection

---

## 📚 Related Files

- `app/dashboard/_components/LoginScreen.tsx` - Main component
- `app/login/page.tsx` - Login route
- `middleware.ts` - Auth + redirect logic
- `lib/supabase/client.ts` - Supabase browser client
- `components/providers/toast-provider.tsx` - Toast notifications

---

**Tác giả:** Antigravity AI  
**Ngày tạo:** 2026-01-26  
**Phiên bản:** 1.0.0
