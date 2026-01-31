# 📖 Hướng Dẫn Sử Dụng - NHÂN VIÊN

## 🎯 Mục Đích
Tài liệu này hướng dẫn nhân viên sử dụng hệ thống **VV-Rice Premium** để đăng ký suất ăn trua hàng ngày.

---

## ⏰ TIMELINE - LỊCH TRÌNH HÀNG NGÀY

### 📅 Chu Kỳ Công Việc Hàng Ngày

| Thời Gian | Nhân Viên Cần Làm Gì | Trạng Thái Hệ Thống |
|-----------|----------------------|---------------------|
| **00:00** | - | 🤖 Hệ thống tự động tạo đơn ăn mặc định cho tất cả NV |
| **06:00 - 10:00** | ✅ **Báo nghỉ ăn** (nếu không ăn) | ⚠️ Còn thời gian báo nghỉ |
| **10:00** | - | 🔒 **HỆ THỐNG KHÓA** - Không thể thay đổi |
| **10:00 - 13:00** | 🍚 Đến ca ăn theo lịch | Bếp chuẩn bị và phục vụ |
| **13:00 - 17:00** | 👀 Xem lại lịch sử đặt ăn | Hệ thống cập nhật số liệu |

> **⚠️ LƯU Ý QUAN TRỌNG:**  
> - Mặc định: **Đã đăng ký ăn** (không cần làm gì)
> - Chỉ cần vào hệ thống khi: **KHÔNG ĂN** hoặc **XEM LỊCH SỬ**

---

## 🚀 HƯỚNG DẪN CHI TIẾT

### 1️⃣ ĐĂNG NHẬP HỆ THỐNG

#### Bước 1: Truy cập trang web
```
https://lunch-order-system-beryl.vercel.app
```

#### Bước 2: Nhập email công ty
- Nhập email: `ten.ban@congty.vn`
- pass : `passdacap@79`
- Đăng nhập

---

### 2️⃣ DASHBOARD - MÀN HÌNH CHÍNH

Sau khi đăng nhập, bạn sẽ thấy:

#### 📊 Thông Tin Chính

**A. Thông Báo (Banner Trên Đỉnh)**
- 📢 Thông báo từ Ban quản lý
- Chạy tự động (marquee)
- Di chuột vào để đọc kỹ

**B. Thẻ Trạng Thái Hôm Nay**
```
┌────────────────────────────┐
│  TRẠNG THÁI HÔM NAY        │
│  ✅ ĐÃ ĐĂNG KÝ ĂN         │
│  🕐 Thời gian: 11:30-12:15 │
│  📍 Khu A - Tầng 1         │
└────────────────────────────┘
```

**D. Nút Hành Động Nhanh**
- 🚫 **Báo nghỉ ăn hôm nay** (màu đỏ)

---

### 3️⃣ BÁO NGHỈ ĂN (Opt-Out)

> **Khi nào cần báo nghỉ?**
> - Đi công tác
> - Nghỉ phép
> - Tự lo bữa trưa

#### Các Bước Thực Hiện:

**Bước 1:** Click nút **"Báo nghỉ ăn hôm nay"**


**Kết quả:**
```
┌────────────────────────────┐
│  TRẠNG THÁI HÔM NAY        │
│  ❌ KHÔNG ĂN               │
│  Bạn đã hủy đăng ký ăn     │
└────────────────────────────┘
```

> **Muốn ăn lại?**  
> Click nút **"Đăng ký ăn trở lại"** (nếu chưa quá 10:00 sáng)

---

### 4️⃣ XEM LỊCH SỬ ĐẶT ĂN

Click vào **"Xem lịch sử đặt ăn"** để xem:

#### 📅 Bảng Lịch Sử

| Ngày | Trạng Thái | Thời Gian Đăng Ký | Ghi Chú |
|------|-----------|-------------------|---------|
| 31/01/2026 | ✅ Đã ăn | 00:00 (Tự động) | - |
| 30/01/2026 | ❌ Không ăn | 08:30 (Thủ công) | Đi công tác |
| 29/01/2026 | ✅ Đã ăn | 00:00 (Tự động) | - |

#### 📊 Thống Kê Cá Nhân
```
📈 Tháng này:
   - Đã ăn: 18 ngày
   - Không ăn: 3 ngày
   - Tỷ lệ tham gia: 85.7%
```

---

### 5️⃣ XEM THÔNG TIN NHÓM ĂN

#### 👥 Thông Tin Nhóm Của Bạn
```
┌────────────────────────────────┐
│  NHÓM: Sản Xuất A              │
│  🏢 Bộ phận lắp ráp linh kiện  │
│  🕐 Ca ăn: 11:30 - 12:15       │
│  📍 Khu A - Tầng 1             │
└────────────────────────────────┘
```

#### 👤 Danh Sách Thành Viên Nhóm

```
Trưởng nhóm:
  Nguyễn Văn An          ✅ Đã đăng ký

Nhân viên:
  Trần Thị Bích          ⭕ Chưa xác nhận
  Lê Hoàng Cường         ✅ Đã đăng ký
  Phạm Minh Đức          ❌ Đã báo nghỉ
  ... (xem thêm 8 người)
```

> **💡 Giải thích icon:**
> - ✅ Màu xanh: Đã đăng ký ăn
> - ⭕ Màu xám: Chưa xác nhận (chưa báo nghỉ)
> - ❌ Màu đỏ: Đã báo nghỉ

---

## ⚙️ CÀI ĐẶT CÁ NHÂN

Click vào **Avatar** ở góc phải trên → **"Cài đặt"**

### Thông Tin Có Thể Cập Nhật:
- 📧 Email (chỉ xem, không sửa)
- 📞 Số điện thoại
- 🏢 Phòng ban (chỉ xem)
- 👥 Nhóm ăn (chỉ xem)
- 🌓 Chế độ Dark Mode

--




## ❓ CÂU HỎI THƯỜNG GẶP (FAQ)

### 1. Tôi quên không báo nghỉ, giờ đã quá 10:00?
**Trả lời:**  
- Hệ thống đã khóa, không thể thay đổi
- Liên hệ bộ phận Hành chính để báo cáo
- Suất ăn sẽ vẫn được tính (có thể bị phạt nếu không ăn)

### 2. Tôi báo nghỉ nhưng lại muốn ăn?
**Trả lời:**  
- Nếu chưa quá 10:00: Click "Đăng ký ăn trở lại"
- Nếu đã quá 10:00: Liên hệ Hành chính ngay

### 3. Email đăng nhập không đến?
**Trả lời:**  
- Kiểm tra mục Spam/Junk
- Đợi 5 phút rồi thử lại
- Liên hệ IT nếu vẫn không nhận được

### 4. Tôi đổi ca làm việc, làm sao đổi ca ăn?
**Trả lời:**  
- Liên hệ Hành chính để cập nhật
- Admin sẽ chuyển bạn sang nhóm ăn phù hợp

### 5. Các ngày nghỉ lễ có cần báo không?
**Trả lời:**  
- **KHÔNG** - Hệ thống tự động tắt vào ngày nghỉ lễ
- Chỉ cần báo vào các ngày làm việc bình thường

---

## 📋 CHECKLIST HÀNG NGÀY

### ✅ Sáng (Trước 10:00)
- [ ] Kiểm tra email nhắc nhở (nếu có)
- [ ] Vào hệ thống xem trạng thái hôm nay
- [ ] **Nếu KHÔNG ĂN**: Click "Báo nghỉ ăn"
- [ ] **Nếu ĂN**: Không cần làm gì ✨

### 🍚 Trưa (Theo Ca Ăn)
- [ ] Đến khu vực ăn theo lịch nhóm
- [ ] Nhận suất ăn từ bếp

### 🔍 Chiều (Tùy Chọn)
- [ ] Xem lại lịch sử đặt ăn tháng này
- [ ] Kiểm tra thống kê cá nhân

---

## 📞 HỖ TRỢ

**Cần Trợ Giúp?**

- 📧 Email: hanh.chinh@congty.vn
- ☎️ Hotline: 0900 123 456
- 💬 Telegram: @VVRiceSupport

**Giờ Hỗ Trợ:**
- Thứ 2 - Thứ 6: 7:30 - 17:00
- Thứ 7 & CN: Không hỗ trợ

---

## 📌 TÓM TẮT NHANH

### Nhân viên chỉ cần nhớ 3 điều:

1. **MẶC ĐỊNH ĂN** - Không làm gì cả ✨
2. **KHÔNG ĂN** - Báo trước 10:00 sáng 🚫
3. **QUÁ 10:00** - Liên hệ Hành chính ngay ☎️

---

**Phiên bản:** 1.0  
**Cập nhật lần cuối:** 31/01/2026  
**Dành cho:** Tất cả nhân viên công ty
