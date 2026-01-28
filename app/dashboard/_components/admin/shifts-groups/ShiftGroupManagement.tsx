'use client';

/**
 * Shift & Group Management Component
 * Admin quản lý ca ăn và nhóm ăn
 * 
 * Features:
 * - Shift CRUD: Tạo/sửa/xóa ca ăn, time picker
 * - Group CRUD: Tạo/sửa/xóa nhóm ăn
 * - Member management: Thêm/xóa nhân viên trong nhóm
 * - Group notifications: Gửi thông báo cho nhóm
 */
export default function ShiftGroupManagement() {
    return (
        <div className="p-8">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-[#dbdfe6] dark:border-slate-800 text-center">
                <h2 className="text-2xl font-bold dark:text-white mb-4">
                    Quản Lý Ca &amp; Nhóm Ăn
                </h2>
                <p className="text-[#606e8a] mb-6">
                    Chức năng đang được phát triển...
                </p>
                <div className="text-sm text-[#606e8a] space-y-2">
                    <p>⏰ Quản lý ca ăn: Tạo/sửa/xóa, thay đổi giờ</p>
                    <p>👥 Quản lý nhóm: Tạo/sửa/xóa nhóm ăn</p>
                    <p>➕ Thêm/xóa nhân viên trong nhóm</p>
                    <p>📢 Gửi thông báo cho nhóm cụ thể</p>
                </div>
            </div>
        </div>
    );
}
