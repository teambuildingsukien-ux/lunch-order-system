# 📖 Hướng Dẫn Sử Dụng - HÀNH CHÍNH / QUẢN LÝ XUẤT ĂN

## 🎯 Mục Đích
Tài liệu này hướng dẫn **Bộ phận Hành chính** và **Quản lý xuất ăn** (Admin/Kitchen Manager) sử dụng hệ thống **VV-Rice Premium** để quản lý suất ăn cho toàn công ty.

---

## ⏰ TIMELINE - LỊCH TRÌNH CÔNG VIỆC

### 📅 Chu Kỳ Hàng Ngày

| Thời Gian | Admin/Kitchen Cần Làm | Tần Suất | Ưu Tiên |
|-----------|----------------------|----------|---------|
| **00:00** | 🤖 Kiểm tra auto-create orders đã chạy chưa | Mỗi ngày | ⚠️ Cao |
| **06:00** | 📊 Xem tổng quan số liệu ban đầu | Mỗi ngày | 📌 Trung bình |
| **08:00 - 10:00** | 👀 Theo dõi real-time opt-outs | Liên tục | ⚠️ Cao |
| **10:00** | 🔒 Xác nhận orders đã lock | Mỗi ngày | ⚠️ Cao |
| **10:00 - 10:30** | 📋 Export danh sách cuối cùng cho bếp | Mỗi ngày | 🔥 Rất cao |
| **10:30 - 11:00** | 📞 Xử lý các yêu cầu đặc biệt | Theo nhu cầu | 📌 Trung bình |
| **11:00 - 13:00** | 🍚 Giám sát quá trình phục vụ | Theo ca | ⚠️ Cao |
| **13:00 - 14:00** | ✅ Cập nhật thực tế (nếu có chênh lệch) | Mỗi ngày | 📌 Trung bình |
| **14:00 - 17:00** | 📊 Xem báo cáo, phân tích xu hướng | Mỗi ngày | 📌 Trung bình |
| **17:00** | 💾 Backup dữ liệu ngày (tùy chọn) | Mỗi ngày | 🟢 Thấp |

### 📅 Chu Kỳ Hàng Tuần

| Thời Điểm | Công Việc | Thời Gian Thực Hiện |
|-----------|-----------|---------------------|
| **Thứ 2** | 📈 Review báo cáo tuần trước | 30 phút |
| **Thứ 3-5** | 🔧 Cập nhật thông tin nhân viên mới/nghỉ việc | Theo nhu cầu |
| **Thứ 6** | 📊 Tạo báo cáo tổng kết tuần | 1 giờ |
| **Thứ 6** | 🗑️ Dọn dẹp dữ liệu cũ (nếu cần) | 15 phút |

### 📅 Chu Kỳ Hàng Tháng

| Thời Điểm | Công Việc | Thời Gian Thực Hiện |
|-----------|-----------|---------------------|
| **Ngày 1-5** | 📊 Tạo báo cáo tháng trước gửi Ban Giám Đốc | 2 giờ |
| **Ngày 10-15** | 💰 Đối chiếu chi phí với kế toán | 1 giờ |
| **Ngày 20-25** | 🔧 Cập nhật cấu hình hệ thống (nếu cần) | 30 phút |
| **Cuối tháng** | 💾 Backup dữ liệu tháng đầy đủ | 15 phút |

---

## 🚀 HƯỚNG DẪN CHI TIẾT

### 1️⃣ ĐĂNG NHẬP VÀ DASHBOARD

#### Đăng Nhập
- URL: `https://lunch-order-system-beryl.vercel.app`
- Email: Tài khoản admin đã được cấp
- Quyền: **Admin** hoặc **Kitchen Manager**

#### Dashboard Tổng Quan

Sau khi đăng nhập, bạn sẽ thấy:

```
┌─────────────────────────────────────────┐
│  TỔNG QUAN HÔM NAY                      │
├─────────────────────────────────────────┤
│  👥 Tổng nhân viên: 120                 │
│  ✅ Đã đăng ký: 105 (87.5%)             │
│  ❌ Đã hủy: 15 (12.5%)                  │
│  ⏰ Chưa xác nhận: 0                    │
│  📊 So với hôm qua: ↑ 2%                │
└─────────────────────────────────────────┘
```

**Biểu Đồ Real-Time:**
- 📈 Xu hướng opt-out 7 ngày qua
- 🥧 Phân bố theo phòng ban
- ⏰ Timeline opt-out trong ngày

---

### 2️⃣ QUẢN LÝ NHÂN VIÊN

#### A. Xem Danh Sách Nhân Viên

**Menu:** Quản trị → **Danh sách nhân viên**

**Chức Năng:**
- 🔍 Tìm kiếm theo tên, email, ID
- 🏢 Filter theo phòng ban (11 phòng ban)
- 📄 Phân trang (10 nhân viên/trang)
- 👁️ Xem chi tiết từng nhân viên

**Thông Tin Hiển Thị:**
| Cột | Nội Dung |
|-----|----------|
| ID | Mã nhân viên |
| Họ Tên | Tên đầy đủ |
| Email | Email đăng nhập |
| Phòng Ban | Bộ phận làm việc |
| Nhóm Ăn | Nhóm và ca ăn |
| Trạng Thái | Hoạt động / Tạm dừng |
| Hành Động | Sửa / Xóa |

#### B. Thêm Nhân Viên Mới (Thủ Công)

**Bước 1:** Click nút **"+ Thêm nhân viên"**

**Bước 2:** Điền form:
```
┌──────────────────────────────┐
│  THÊM NHÂN VIÊN MỚI          │
├──────────────────────────────┤
│  Mã NV:      VV-123          │
│  Họ tên:     Nguyễn Văn A    │
│  Email:      a.nguyen@...    │
│  Phòng ban:  [Dropdown]      │
│  Nhóm ăn:    [Dropdown]      │
│  Trạng thái: ☑ Hoạt động     │
└──────────────────────────────┘
```

**Bước 3:** Click **"Lưu"**

> **💡 Lưu ý:** Email phải unique trong hệ thống

#### C. Import Nhân Viên Hàng Loạt (Excel)

**Khi Nào Dùng:**
- Nhập nhân viên mới hàng loạt
- Cập nhật thông tin nhiều người cùng lúc
- Khởi tạo hệ thống lần đầu

**Các Bước:**

**Bước 1: Tải Template Excel**
- Click **"Import Excel"**
- Click **"Tải template mẫu"**
- File mẫu có 15 cột:
  ```
  | STT | Mã NV | Họ tên | Email | SĐT | Phòng ban | Chức vụ | ... |
  ```

**Bước 2: Điền Dữ Liệu**
- Mở file Excel vừa tải
- Điền thông tin nhân viên
- **KHÔNG** xóa dòng header
- **KHÔNG** thay đổi tên cột

**Cấu Trúc 15 Cột:**
1. `STT` - Số thứ tự
2. `Ma_NV` - Mã nhân viên (unique)
3. `Ho_ten` - Họ và tên
4. `Email` - Email đăng nhập
5. `So_dien_thoai` - Số điện thoại
6. `Phong_ban` - Tên phòng ban
7. `Chuc_vu` - Chức vụ
8. `Ngay_vao_lam` - Ngày bắt đầu làm việc
9. `Gioi_tinh` - Nam/Nữ
10. `Ngay_sinh` - Ngày sinh
11. `Dia_chi` - Địa chỉ
12. `CCCD` - Số CCCD/CMND
13. `Trinh_do` - Trình độ học vấn
14. `Nhom_an` - Tên nhóm ăn
15. `Ghi_chu` - Ghi chú thêm

**Bước 3: Upload File**
- Click **"Chọn file"**
- Chọn file Excel vừa điền
- Click **"Import"**

**Bước 4: Kiểm Tra Kết Quả**
```
┌──────────────────────────────┐
│  KẾT QUẢ IMPORT              │
├──────────────────────────────┤
│  ✅ Thành công: 45/50        │
│  ❌ Lỗi: 5/50                │
│                              │
│  Chi tiết lỗi:               │
│  - Dòng 10: Email đã tồn tại │
│  - Dòng 23: Thiếu phòng ban  │
│  - Dòng 35: Sai format email │
│  - Dòng 42: Trùng mã NV      │
│  - Dòng 48: Thiếu họ tên     │
└──────────────────────────────┘
```

**Bước 5: Sửa Lỗi và Import Lại**
- Download file lỗi
- Sửa các dòng bị lỗi
- Import lại

> **⚠️ Lưu Ý Quan Trọng:**
> - File Excel phải có đúng 15 cột
> - Không được bỏ trống các cột bắt buộc: Mã NV, Họ tên, Email, Phòng ban
> - Email phải unique (không trùng)
> - Mã NV phải unique (không trùng)

#### D. Sửa Thông Tin Nhân Viên

**Bước 1:** Click icon ✏️ (Edit) ở cột "Hành động"

**Bước 2:** Cập nhật thông tin cần thiết

**Bước 3:** Click **"Lưu thay đổi"**

**Các Trường Có Thể Sửa:**
- ✅ Họ tên
- ✅ Email
- ✅ Phòng ban
- ✅ Nhóm ăn
- ✅ Trạng thái (Hoạt động/Tạm dừng)
- ❌ Mã nhân viên (KHÔNG được sửa)

#### E. Xóa/Vô Hiệu Hóa Nhân Viên

**Trường Hợp 1: Nhân Viên Nghỉ Việc**
- Click icon ✏️ (Edit)
- Bỏ tick **"Hoạt động"**
- Click **"Lưu"**
- → Nhân viên không nhận orders mới, dữ liệu lịch sử giữ nguyên

**Trường Hợp 2: Xóa Hẳn (Nhập Nhầm)**
- Click icon 🗑️ (Delete)
- Xác nhận xóa
- → **CẢNH BÁO:** Dữ liệu lịch sử cũng bị xóa!

> **💡 Best Practice:**  
> Nên dùng "Vô hiệu hóa" thay vì "Xóa" để giữ lại dữ liệu lịch sử

---

### 3️⃣ QUẢN LÝ SUẤT ĂN HÀNG NGÀY

#### A. Quy Trình Hàng Ngày

**00:00 - Kiểm Tra Auto-Create**

**Menu:** Dashboard → **Xem đơn hôm nay**

Kiểm tra hệ thống đã tạo orders chưa:
```
┌──────────────────────────────┐
│  ĐƠN ĂN HÔM NAY (31/01)      │
├──────────────────────────────┤
│  ✅ Đã tạo: 120 đơn          │
│  📅 Thời gian tạo: 00:00:15  │
│  ⏰ Trạng thái: Chờ xác nhận │
└──────────────────────────────┘
```

**Nếu CHƯA tạo:**
- Click **"Tạo đơn thủ công"**
- Chọn ngày: 31/01/2026
- Click **"Tạo ngay"**

**06:00-10:00 - Theo Dõi Opt-Outs**

**Menu:** Dashboard → **Real-time Monitor**

Xem ai đã báo nghỉ:
```
┌──────────────────────────────┐
│  OPT-OUT REAL-TIME           │
├──────────────────────────────┤
│  08:15 - Nguyễn Văn A (IT)   │
│         Lý do: Đi công tác   │
│                              │
│  08:42 - Trần Thị B (Sales)  │
│         Lý do: Nghỉ phép     │
│                              │
│  09:30 - Lê Văn C (Kho)      │
│         Lý do: Tự lo         │
└──────────────────────────────┘

📊 Tổng hủy: 15/120 (12.5%)
```

**10:00 - Xác Nhận Lock**

Kiểm tra hệ thống đã khóa:
```
🔒 ĐÃ KHÓA ĐĂNG KÝ LÚC 10:00:00
✅ Không ai có thể thay đổi
```

**10:00-10:30 - Export Danh Sách Cho Bếp**

**Bước 1:** Click **"Export cho bếp"**

**Bước 2:** Chọn format:
- 📄 Excel (.xlsx)
- 📋 PDF
- 🖨️ In trực tiếp

**Bước 3:** Chọn loại báo cáo:
- ☑ **Danh sách ăn** (theo nhóm/ca)
- ☑ **Tổng hợp số lượng**
- ☐ Chi tiết từng người

**Ví Dụ Export:**
```
┌─────────────────────────────────────┐
│  DANH SÁCH ĂN TRƯA - 31/01/2026     │
├─────────────────────────────────────┤
│  CA 1 (11:00-11:45) - KHU A         │
│    Nhóm Sản Xuất A: 20 người        │
│    Nhóm Sản Xuất B: 18 người        │
│    TỔNG: 38 suất                    │
│                                     │
│  CA 2 (11:30-12:15) - KHU B         │
│    Nhóm Văn Phòng: 35 người         │
│    Nhóm IT: 12 người                │
│    TỔNG: 47 suất                    │
│                                     │
│  CA 3 (12:00-12:45) - KHU C         │
│    Nhóm Sales: 20 người             │
│    TỔNG: 20 suất                    │
│                                     │
│  📊 TỔNG CỘNG: 105 SUẤT             │
└─────────────────────────────────────┘
```

**Bước 4:** Gửi cho bếp qua:
- 📧 Email
- 🖨️ In giấy
- 💬 Telegram Bot

#### B. Xử Lý Yêu Cầu Đặc Biệt (10:00-11:00)

**Tình Huống 1: Nhân Viên Muốn Ăn Sau Khi Đã Hủy**

- Vào **Quản lý đơn ăn**
- Tìm nhân viên theo ID/Email
- Click **"Khôi phục đơn"**
- Cập nhật bếp ngay

**Tình Huống 2: Nhân Viên Quên Hủy, Không Ăn Được**

- Vào **Quản lý đơn ăn**
- Tìm nhân viên
- Click **"Hủy đơn (Admin)"**
- Ghi chú lý do
- Báo cho bếp giảm số lượng

**Tình Huống 3: Khách Hoặc Nhân Viên Mới Chưa Có Tài Khoản**

- Click **"Tạo đơn tạm thời"**
- Điền thông tin:
  ```
  Tên: Khách mời ABC
  Số lượng: 1
  Nhóm ăn: Chọn ca phù hợp
  Ghi chú: Khách của phòng Sales
  ```
- Thông báo cho bếp

#### C. Giám Sát Phục Vụ (11:00-13:00)

**Dashboard Kitchen (Màn Hình Bếp):**

```
┌──────────────────────────────┐
│  CA ĐANG PHỤC VỤ             │
│  🕐 11:30 - 12:15            │
├──────────────────────────────┤
│  KHU B - Tầng 1              │
│                              │
│  ✅ Đã phục vụ: 35/47        │
│  ⏰ Còn lại: 12              │
│  📊 Tiến độ: 74%             │
│                              │
│  [▓▓▓▓▓▓▓▓░░] 74%            │
└──────────────────────────────┘
```

**Các Chỉ Số Theo Dõi:**
- Số suất đã phục vụ
- Số suất còn lại
- Thời gian còn lại của ca
- Tỷ lệ thực tế / kế hoạch

#### D. Cập Nhật Thực Tế (13:00-14:00)

**Nếu Có Chênh Lệch:**

**Menu:** Báo cáo → **Cập nhật thực tế**

```
┌──────────────────────────────┐
│  SO SÁNH KẾ HOẠCH - THỰC TẾ  │
├──────────────────────────────┤
│  Kế hoạch: 105 suất          │
│  Thực tế phục vụ: 103 suất   │
│  Chênh lệch: -2 suất         │
│                              │
│  Lý do:                      │
│  - 2 người ăn nhưng đã hủy   │
│    (quên hủy sớm)            │
└──────────────────────────────┘
```

Click **"Lưu thực tế"** để cập nhật vào hệ thống

---

### 4️⃣ QUẢN LÝ NHÓM ĂN & CA ĂN

#### A. Xem Danh Sách Nhóm

**Menu:** Cài đặt → **Nhóm ăn**

```
┌────────────────────────────────────┐
│  DANH SÁCH NHÓM ĂN                 │
├────────────────────────────────────┤
│  📍 Nhóm Sản Xuất A                │
│     Ca: 11:00-11:45                │
│     Khu: A - Tầng 1                │
│     Thành viên: 20 người           │
│                                    │
│  📍 Nhóm Văn Phòng                 │
│     Ca: 11:30-12:15                │
│     Khu: B - Tầng 1                │
│     Thành viên: 35 người           │
│                                    │
│  ... (xem thêm 8 nhóm)             │
└────────────────────────────────────┘
```

#### B. Tạo Nhóm Mới

**Khi Nào Cần:**
- Có phòng ban mới
- Tái cơ cấu tổ chức
- Tăng/giảm số lượng nhân viên

**Các Bước:**

**Bước 1:** Click **"+ Tạo nhóm mới"**

**Bước 2:** Điền thông tin:
```
Tên nhóm: Nhóm Marketing
Phòng ban: Marketing
Ca ăn: [Chọn từ dropdown]
Khu vực bàn: Khu C - Tầng 2
Mô tả: Nhóm ăn của phòng Marketing
```

**Bước 3:** Click **"Lưu"**

#### C. Thêm/Xóa Thành Viên Nhóm

**Thêm Nhân Viên Vào Nhóm:**
- Vào **Quản lý nhân viên**
- Click Edit nhân viên
- Chọn **Nhóm ăn** mới
- Lưu

**Di Chuyển Nhóm Hàng Loạt:**
- Chọn nhiều nhân viên (checkbox)
- Click **"Di chuyển nhóm"**
- Chọn nhóm đích
- Xác nhận

#### D. Quản Lý Ca Ăn (Shifts)

**Menu:** Cài đặt → **Ca ăn**

**Danh Sách Ca:**
```
CA 1: 11:00 - 11:45 (45 phút)
CA 2: 11:30 - 12:15 (45 phút)
CA 3: 12:00 - 12:45 (45 phút)
```

**Tạo Ca Mới:**
- Click **"+ Thêm ca"**
- Nhập giờ bắt đầu: 12:30
- Nhập giờ kết thúc: 13:15
- Click **"Lưu"**

> **⚠️ Lưu Ý:** Nên tránh các ca chồng chéo quá nhiều

---

### 5️⃣ BÁO CÁO & THỐNG KÊ

#### A. Báo Cáo Hàng Ngày

**Menu:** Báo cáo → **Báo cáo ngày**

**Chọn ngày:** 31/01/2026

**Báo Cáo Bao Gồm:**

**1. Tổng Quan Đăng Ký**
```
┌──────────────────────────────┐
│  BÁO CÁO NGÀY 31/01/2026     │
├──────────────────────────────┤
│  Tổng nhân viên: 120         │
│  Đã đăng ký: 105 (87.5%)     │
│  Đã hủy: 15 (12.5%)          │
│  Thực tế phục vụ: 103        │
│  Chênh lệch: -2              │
└──────────────────────────────┘
```

**2. Phân Tích Theo Ca**
```
CA 1 (11:00-11:45): 38 suất
CA 2 (11:30-12:15): 47 suất
CA 3 (12:00-12:45): 20 suất
```

**3. Phân Tích Theo Phòng Ban**
```
📊 Top 3 Phòng Ban Ăn Nhiều:
1. Văn Phòng: 35 suất (87.5% tham gia)
2. Sản Xuất: 38 suất (95% tham gia)
3. Sales: 20 suất (80% tham gia)

📊 Top 3 Phòng Ban Hủy Nhiều:
1. IT: 5/12 (41.7%)
2. Marketing: 3/15 (20%)
3. Kho: 2/10 (20%)
```

**4. Lý Do Hủy**
```
Đi công tác: 8 người
Nghỉ phép: 4 người
Tự lo bữa trưa: 3 người
```

**Export:**
- 📄 Excel
- 📋 PDF
- 📧 Email qua Ban Giám Đốc

#### B. Báo Cáo Tuần

**Menu:** Báo cáo → **Báo cáo tuần**

**Chọn tuần:** 27/01 - 31/01/2026

**Nội Dung:**

**1. Tổng Quan 5 Ngày**
```
┌──────────────────────────────────────┐
│  BÁO CÁO TUẦN 27/01 - 31/01/2026     │
├──────────────────────────────────────┤
│  Tổng số bữa: 600 bữa (120 NV x 5)   │
│  Đã phục vụ: 520 bữa (86.7%)         │
│  Đã hủy: 80 bữa (13.3%)              │
│  Xu hướng: ↑ 2% so với tuần trước    │
└──────────────────────────────────────┘
```

**2. Biểu Đồ Xu Hướng**
```
Tỷ lệ tham gia theo ngày:
T2:  ▓▓▓▓▓▓▓▓░░ 85%
T3:  ▓▓▓▓▓▓▓▓▓░ 90%
T4:  ▓▓▓▓▓▓▓▓░░ 87%
T5:  ▓▓▓▓▓▓▓░░░ 82%
T6:  ▓▓▓▓▓▓▓▓▓░ 92%
```

**3. Top Performers**
```
✅ Phòng Ban Tham Gia Cao Nhất:
1. Sản Xuất: 95% (190/200 bữa)
2. Văn Phòng: 88% (154/175 bữa)
3. Kho: 85% (42/50 bữa)

⚠️ Phòng Ban Cần Quan Tâm:
1. IT: 65% (39/60 bữa) - Thấp nhất
2. Marketing: 75% (56/75 bữa)
```

#### C. Báo Cáo Tháng

**Menu:** Báo cáo → **Báo cáo tháng**

**Chọn tháng:** Tháng 01/2026

**Nội Dung Chính:**

**1. Executive Summary**
```
┌──────────────────────────────────────┐
│  BÁO CÁO THÁNG 01/2026               │
├──────────────────────────────────────┤
│  Tổng số bữa kế hoạch: 2,640 bữa     │
│  Thực tế phục vụ: 2,310 bữa (87.5%)  │
│  Tiết kiệm: 330 bữa (12.5%)          │
│                                      │
│  💰 Chi phí ước tính:                │
│     - Kế hoạch: 2,640 x 35k = 92.4M  │
│     - Thực tế: 2,310 x 35k = 80.9M   │
│     - Tiết kiệm: 11.5M VNĐ           │
└──────────────────────────────────────┘
```

**2. Waste Rate (Tỷ Lệ Lãng Phí)**
```
Lãng phí = (Dự tính - Thực tế) / Dự tính
         = (2,640 - 2,310) / 2,640
         = 12.5%

✅ Mục tiêu: < 15% (Đạt!)
```

**3. Phân Tích Theo Phòng Ban**

| Phòng Ban | Kế Hoạch | Thực Tế | Tỷ Lệ | Đánh Giá |
|-----------|----------|---------|-------|----------|
| Sản Xuất | 440 | 418 | 95% | ⭐⭐⭐⭐⭐ |
| Văn Phòng | 770 | 678 | 88% | ⭐⭐⭐⭐ |
| IT | 264 | 172 | 65% | ⭐⭐ |
| Sales | 440 | 352 | 80% | ⭐⭐⭐ |
| ... | ... | ... | ... | ... |

**4. Xu Hướng Theo Ngày Trong Tuần**
```
Tỷ lệ tham gia trung bình:
Thứ 2: 85%
Thứ 3: 90%
Thứ 4: 88%
Thứ 5: 84%
Thứ 6: 92%

📌 Insight: Thứ 6 cao nhất (cuối tuần)
📌 Insight: Thứ 5 thấp nhất (có thể do meeting)
```

**5. Khuyến Nghị**
- 🎯 Tăng campaign nhắc nhở cho IT (tỷ lệ thấp)
- 📧 Gửi email khảo sát lý do hủy cao vào Thứ 5
- 💰 Tiết kiệm tốt, duy trì mô hình opt-out

**Export:**
- 📊 PowerPoint (cho họp BGĐ)
- 📋 PDF
- 📄 Excel (raw data)

---

### 6️⃣ CÀI ĐẶT HỆ THỐNG

#### A. Cấu Hình Chung

**Menu:** Cài đặt → **Cấu hình hệ thống**

**Các Tham Số Điều Chỉnh:**

**1. Thời Gian Khóa Đăng Ký**
```
Khóa lúc: [10:00] ▼
Múi giờ: GMT+7 (Hà Nội)
```

**2. Ngày Nấu Ăn**
```
☑ Thứ 2
☑ Thứ 3
☑ Thứ 4
☑ Thứ 5
☑ Thứ 6
☐ Thứ 7
☐ Chủ nhật
```

**3. Giá Suất Ăn (Tham Khảo)**
```
Giá tiêu chuẩn: 35,000 VNĐ
Cập nhật lần cuối: 01/01/2026
```

**4. Thông Báo Tự Động**
```
☑ Email nhắc nhở lúc 08:00
☑ Email xác nhận hủy
☐ Telegram notifications
☐ SMS (chưa kích hoạt)
```

#### B. Quản Lý Thông Báo (Announcements)

**Menu:** Nội dung → **Thông báo**

**Tạo Thông Báo Mới:**

**Bước 1:** Click **"+ Tạo thông báo"**

**Bước 2:** Điền nội dung:
```
┌──────────────────────────────┐
│  TẠO THÔNG BÁO MỚI           │
├──────────────────────────────┤
│  Tiêu đề (tùy chọn):         │
│  [Thông báo quan trọng]      │
│                              │
│  Nội dung:                   │
│  [Nghỉ Tết từ 26/01-02/02,   │
│   hệ thống tạm dừng]         │
│                              │
│  Trạng thái:                 │
│  ☑ Hiển thị (Active)         │
│                              │
│  Ưu tiên:                    │
│  ○ Thấp  ● Trung bình ○ Cao │
└──────────────────────────────┘
```

**Bước 3:** Click **"Đăng"**

**Kết Quả:**
- Thông báo hiển thị trên banner marquee
- Tất cả nhân viên đều thấy khi đăng nhập

**Xóa/Ẩn Thông Báo:**
- Vào danh sách thông báo
- Bỏ tick **"Active"** để ẩn
- Hoặc click 🗑️ để xóa hẳn

#### C. Quản Lý Ngày Nghỉ Lễ

**Menu:** Cài đặt → **Ngày nghỉ lễ**

**Danh Sách Ngày Nghỉ:**
```
┌──────────────────────────────┐
│  NGÀY NGHỈ LỄ 2026           │
├──────────────────────────────┤
│  01/01 - Tết Dương Lịch      │
│  26/01-02/02 - Tết Nguyên Đán│
│  10/03 - Giỗ Tổ Hùng Vương   │
│  30/04 - Giải Phóng          │
│  01/05 - Quốc Tế Lao Động    │
│  02/09 - Quốc Khánh          │
└──────────────────────────────┘
```

**Thêm Ngày Nghỉ:**
- Click **"+ Thêm ngày nghỉ"**
- Chọn ngày
- Nhập tên (vd: "Company Day")
- Lưu

**Tác Động:**
- Hệ thống **KHÔNG** tạo orders vào ngày nghỉ
- Nhân viên không nhận email nhắc nhở

---

### 7️⃣ XỬ LÝ TÌNH HUỐNG ĐẶC BIỆT

#### Tình Huống 1: Hệ Thống Không Tạo Orders Tự Động

**Nguyên nhân có thể:**
- Cron job Vercel bị lỗi
- Database connection timeout
- Ngày nghỉ lễ (đã cấu hình)

**Cách xử lý:**

**Bước 1:** Kiểm tra logs
- Menu: Hệ thống → **Activity Logs**
- Filter theo ngày hôm nay
- Tìm event: `auto_create_orders`

**Bước 2:** Nếu không thấy log (chưa chạy)
- Click **"Tạo đơn thủ công"**
- Chọn ngày: Hôm nay
- Click **"Tạo ngay"**

**Bước 3:** Thông báo IT (nếu lặp lại)

#### Tình Huống 2: Nhân Viên Than Phiền Không Nhận Email

**Cách xử lý:**

**Bước 1:** Kiểm tra email NV có trong hệ thống không
- Vào **Quản lý nhân viên**
- Tìm theo tên/ID
- Xem email có đúng không

**Bước 2:** Kiểm tra trạng thái NV
- Nếu **"Tạm dừng"** → Active lại
- Nếu email sai → Sửa email

**Bước 3:** Kiểm tra logs gửi email
- Menu: Hệ thống → **Notification Logs**
- Tìm email của NV
- Xem status: Success/Failed

**Bước 4:** Gửi lại email test
- Click **"Gửi email test"**
- Nhập email NV
- Kiểm tra

#### Tình Huống 3: Số Liệu Thực Tế Khác Với Kế Hoạch

**Nguyên nhân:**
- NV quên hủy nhưng không ăn
- NV hủy nhưng lại ăn
- Khách hoặc NV mới chưa có trong hệ thống

**Cách xử lý:**

**Bước 1:** Ghi nhận chênh lệch
- Vào **Cập nhật thực tế**
- Nhập số thực tế
- Ghi chú lý do

**Bước 2:** Phân tích
- Nếu chênh lệch > 5%: Cần điều tra
- Nếu chênh lệch < 5%: Chấp nhận được

**Bước 3:** Hành động
- Gửi email nhắc nhở NV vi phạm
- Cập nhật quy định (nếu cần)
- Đề xuất hình phạt (nếu tái diễn)

#### Tình Huống 4: Muốn Thay Đổi Thời Gian Khóa (10:00 → 09:30)

**Cách xử lý:**

**Bước 1:** Thông báo trước cho toàn bộ NV
- Tạo announcement: "Từ ngày X, hệ thống khóa lúc 09:30"
- Gửi email công bố chính thức

**Bước 2:** Thay đổi trong hệ thống
- Vào **Cài đặt hệ thống**
- Sửa **"Thời gian khóa"** → 09:30
- Lưu

**Bước 3:** Giám sát 1-2 tuần đầu
- Xem có NV bị ảnh hưởng không
- Điều chỉnh nếu cần

---

### 8️⃣ BACKUP & BẢO TRÌ

#### A. Backup Dữ Liệu Hàng Tháng

**Tần suất:** Cuối mỗi tháng

**Menu:** Hệ thống → **Backup dữ liệu**

**Các Bước:**

**Bước 1:** Chọn loại backup
```
☑ Danh sách nhân viên
☑ Lịch sử đặt ăn
☑ Cấu hình hệ thống
☐ Logs (cân nhắc vì dung lượng lớn)
```

**Bước 2:** Chọn khoảng thời gian
```
Từ ngày: 01/01/2026
Đến ngày: 31/01/2026
```

**Bước 3:** Click **"Export Backup"**

**Bước 4:** Lưu file an toàn
- Lưu vào server nội bộ
- Backup lên cloud (Google Drive, Dropbox)
- Giữ ít nhất 3 tháng gần nhất

#### B. Dọn Dẹp Dữ Liệu Cũ

**Tần suất:** 3-6 tháng/lần

**Dữ liệu có thể xóa:**
- Logs cũ hơn 90 ngày
- Orders cũ hơn 1 năm (sau khi backup)
- Notification logs cũ

**Cách thực hiện:**
- Menu: Hệ thống → **Dọn dẹp dữ liệu**
- Chọn loại dữ liệu
- Chọn ngày cũ hơn: 90 ngày
- Click **"Xóa"**

> **⚠️ Cảnh báo:** Backup trước khi xóa!

---

## 📊 BẢNG TÓM TẮT CÔNG VIỆC

### Hàng Ngày (Thời Gian: ~45 phút)

| STT | Công Việc | Thời Gian | Bắt Buộc? |
|-----|-----------|-----------|-----------|
| 1 | Kiểm tra auto-create orders | 00:00-00:05 | ✅ |
| 2 | Xem tổng quan dashboard | 06:00-06:10 | ✅ |
| 3 | Theo dõi opt-outs real-time | 08:00-10:00 | ⚠️ |
| 4 | Xác nhận lock thành công | 10:00 | ✅ |
| 5 | Export danh sách cho bếp | 10:00-10:30 | 🔥 |
| 6 | Xử lý yêu cầu đặc biệt | 10:30-11:00 | 📌 |
| 7 | Giám sát phục vụ | 11:00-13:00 | ⚠️ |
| 8 | Cập nhật thực tế (nếu cần) | 13:00-14:00 | 📌 |
| 9 | Xem báo cáo cuối ngày | 14:00-14:15 | ✅ |

### Hàng Tuần (Thời Gian: ~2 giờ)

| STT | Công Việc | Thời Điểm | Thời Gian |
|-----|-----------|-----------|-----------|
| 1 | Review báo cáo tuần trước | Thứ 2 | 30 phút |
| 2 | Cập nhật nhân viên mới/nghỉ | Thứ 3-5 | 30-60 phút |
| 3 | Tạo báo cáo tuần | Thứ 6 | 1 giờ |
| 4 | Dọn dẹp dữ liệu | Thứ 6 | 15 phút |

### Hàng Tháng (Thời Gian: ~4 giờ)

| STT | Công Việc | Thời Điểm | Thời Gian |
|-----|-----------|-----------|-----------|
| 1 | Tạo báo cáo tháng (BGĐ) | Ngày 1-5 | 2 giờ |
| 2 | Đối chiếu chi phí | Ngày 10-15 | 1 giờ |
| 3 | Cập nhật cấu hình | Ngày 20-25 | 30 phút |
| 4 | Backup dữ liệu | Cuối tháng | 30 phút |

---

## ❓ CÂU HỎI THƯỜNG GẶP (FAQ)

### 1. Import Excel bị lỗi "Email đã tồn tại"?
**Trả lời:** Email bị trùng trong hệ thống. Kiểm tra lại file Excel, sửa email hoặc xóa dòng trùng.

### 2. Tại sao một số nhân viên không thấy trong dropdown "Nhóm ăn"?
**Trả lời:** Các nhân viên đó chưa được assign vào nhóm nào. Vào **Sửa nhân viên** → Chọn nhóm.

### 3. Tôi muốn xóa nhân viên nghỉ việc nhưng sợ mất dữ liệu?
**Trả lời:** Dùng **"Vô hiệu hóa"** (bỏ tick "Hoạt động") thay vì **Xóa**. Dữ liệu lịch sử vẫn giữ nguyên.

### 4. Làm sao để thay đổi giờ khóa đăng ký?
**Trả lời:** Vào **Cài đặt hệ thống** → Sửa **"Thời gian khóa"** → Lưu. Nhớ thông báo trước cho NV.

### 5. Tôi muốn tạo báo cáo custom (không có sẵn)?
**Trả lời:** Sử dụng **Export Excel** từ các báo cáo có sẵn, sau đó xử lý thêm trong Excel.

### 6. Hệ thống có tự động gửi báo cáo cho BGĐ không?
**Trả lời:** Chưa. Admin cần export thủ công và gửi email. (Feature này có thể được thêm sau)

---

## 📞 HỖ TRỢ KỸ THUẬT

### Liên Hệ IT Support

**Khi Nào Cần Liên Hệ IT:**
- Hệ thống không tạo orders tự động
- Lỗi khi export báo cáo
- Không đăng nhập được
- Database timeout
- Cron jobs không chạy

**Thông Tin Liên Hệ:**
- 📧 Email: it.support@congty.vn
- ☎️ Hotline: 0900 999 888
- 💬 Slack: #vv-rice-support

**Giờ Hỗ Trợ:**
- Thứ 2 - Thứ 6: 8:00 - 17:30
- Khẩn cấp: 24/7 (qua hotline)

---

## 📌 CHECKLIST ĐỊNH KỲ

### ✅ Checklist Hàng Ngày
- [ ] 00:00 - Kiểm tra auto-create
- [ ] 06:00 - Xem dashboard tổng quan
- [ ] 08:00-10:00 - Monitor opt-outs
- [ ] 10:00 - Confirm lock
- [ ] 10:00-10:30 - Export cho bếp
- [ ] 11:00-13:00 - Giám sát phục vụ
- [ ] 14:00 - Review báo cáo ngày

### ✅ Checklist Hàng Tuần
- [ ] Thứ 2: Review báo cáo tuần trước
- [ ] Thứ 3-5: Update nhân viên
- [ ] Thứ 6: Tạo báo cáo tuần
- [ ] Thứ 6: Cleanup logs cũ

### ✅ Checklist Hàng Tháng
- [ ] Ngày 1-5: Báo cáo tháng cho BGĐ
- [ ] Ngày 10-15: Đối chiếu chi phí
- [ ] Ngày 20-25: Update config
- [ ] Cuối tháng: Backup đầy đủ

---

**Phiên bản:** 1.0  
**Cập nhật lần cuối:** 31/01/2026  
**Dành cho:** Admin, Kitchen Manager, Hành chính
