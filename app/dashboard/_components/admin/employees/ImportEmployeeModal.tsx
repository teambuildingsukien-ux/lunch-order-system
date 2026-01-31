'use client';

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

interface ImportEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface ParsedEmployee {
    id: number;
    fullName: string;
    email: string;
    password: string;
    employeeCode: string;
    department: string;
    workShift: string;
    mealShift: string;
    mealGroupName: string;
    tableArea: string;
    role: 'employee' | 'admin' | 'manager' | 'kitchen';
    isActive: boolean;
    phone: string;
    address: string;
    notes: string;
    status: 'pending' | 'success' | 'error';
    message?: string;
}

const ROLE_MAP: Record<string, string> = {
    'Nhân Viên': 'employee',
    'Admin': 'admin',
    'Quản Lý': 'manager',
    'Nhà Bếp': 'kitchen',
    'nhân viên': 'employee',
    'admin': 'admin',
    'quản lý': 'manager',
    'nhà bếp': 'kitchen'
};

export default function ImportEmployeeModal({ isOpen, onClose, onSuccess }: ImportEmployeeModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [parsedData, setParsedData] = useState<ParsedEmployee[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'importing' | 'result'>('upload');
    const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, fail: 0 });

    if (!isOpen) return null;

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });

                const rows = data.slice(1);
                const parsed: ParsedEmployee[] = rows
                    .filter(row => row[1] && row[2]) // Họ tên và Email bắt buộc
                    .map((row, index) => {
                        // Parse 15 columns (index 0-14)
                        const fullName = row[1]?.toString().trim() || '';
                        const email = row[2]?.toString().trim() || '';
                        const password = row[3]?.toString().trim() || '123456';
                        const employeeCode = row[4]?.toString().trim() || `NV${Date.now()}${index}`;
                        const department = row[5]?.toString().trim() || 'Chưa phân loại';
                        const workShift = row[6]?.toString().trim() || '09:00-18:00';
                        const mealShift = row[7]?.toString().trim() || '12:00-13:00';
                        const mealGroupName = row[8]?.toString().trim() || '';
                        const tableArea = row[9]?.toString().trim() || '';
                        const roleRaw = row[10]?.toString().trim() || 'Nhân Viên';
                        const statusRaw = row[11]?.toString().trim() || 'Hoạt động';
                        const phone = row[12]?.toString().trim() || '';
                        const address = row[13]?.toString().trim() || '';
                        const notes = row[14]?.toString().trim() || '';

                        // Map role
                        const role = (ROLE_MAP[roleRaw] || 'employee') as any;

                        // Map status
                        const isActive = statusRaw.toLowerCase().includes('hoạt động');

                        return {
                            id: index,
                            fullName,
                            email,
                            password,
                            employeeCode,
                            department,
                            workShift,
                            mealShift,
                            mealGroupName,
                            tableArea,
                            role,
                            isActive,
                            phone,
                            address,
                            notes,
                            status: 'pending'
                        };
                    });

                setParsedData(parsed);
                setCurrentStep('preview');
            } catch (error) {
                console.error("Error reading excel:", error);
                alert("File không đúng định dạng hoặc bị lỗi.");
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleImport = async () => {
        setCurrentStep('importing');
        setIsProcessing(true);
        const total = parsedData.length;
        let successCount = 0;
        let failCount = 0;

        const newParsedData = [...parsedData];

        for (let i = 0; i < total; i++) {
            const row = newParsedData[i];
            try {
                const response = await fetch('/api/admin/users/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: row.email,
                        password: row.password,
                        fullName: row.fullName,
                        role: row.role,
                        employeeCode: row.employeeCode,
                        department: 'custom',
                        shift: 'custom',
                        mealGroupId: 'custom',
                        isCustomDepartment: true,
                        isCustomShift: true,
                        isCustomMealGroup: !!row.mealGroupName,
                        customValues: {
                            department: row.department,
                            shift: row.mealShift,
                            workShift: row.workShift,
                            mealGroupName: row.mealGroupName,
                            tableArea: row.tableArea
                        },
                        // Enhanced fields for v2.1
                        isActive: row.isActive,
                        metadata: {
                            phone: row.phone || null,
                            address: row.address || null,
                            notes: row.notes || null,
                            table_area: row.tableArea || null,
                            work_shift: row.workShift || null,
                            imported_at: new Date().toISOString(),
                            import_source: 'excel_v2.1'
                        }
                    })
                });

                const res = await response.json();
                if (!response.ok) throw new Error(res.error || 'Failed');

                newParsedData[i].status = 'success';
                successCount++;
            } catch (err: any) {
                newParsedData[i].status = 'error';
                newParsedData[i].message = err.message;
                failCount++;
            }

            setProgress({ current: i + 1, total, success: successCount, fail: failCount });
            setParsedData([...newParsedData]);
        }

        setIsProcessing(false);
        setCurrentStep('result');
    };

    const downloadSample = () => {
        const ws_data = [
            // Header row with Vietnamese column names (* = required)
            [
                "STT",
                "Họ và Tên (*)",
                "Email (*)",
                "Mật khẩu",
                "Mã Nhân Viên",
                "Phòng Ban (*)",
                "Ca Làm Việc",
                "Thời gian Ăn (*)",
                "Nhóm Ăn",
                "Vị Trí/Bàn",
                "Vai Trò",
                "Trạng Thái",
                "Số Điện Thoại",
                "Địa Chỉ",
                "Ghi Chú"
            ],
            // Example row 1: Normal employee with full info
            [
                1,
                "Nguyễn Văn A",
                "nguyenvana@company.vn",
                "123456",
                "NV001",
                "Phòng Kỹ Thuật",
                "09:00-18:00",
                "12:00-13:00",
                "Nhóm 1",
                "Lầu 2, Bàn 5",
                "Nhân Viên",
                "Hoạt động",
                "0912345678",
                "Quận 1, TP.HCM",
                "Nhân viên mới onboard"
            ],
            // Example row 2: Manager
            [
                2,
                "Trần Thị Bảo",
                "tranthib@company.vn",
                "manager123",
                "MNG001",
                "Phòng Kế Toán",
                "08:00-17:00",
                "11:30-12:30",
                "Nhóm 2",
                "Lầu 3, Phòng Riêng",
                "Quản Lý",
                "Hoạt động",
                "0987654321",
                "Quận 3, TP.HCM",
                "Manager cấp 2, VIP member"
            ],
            // Example row 3: Inactive employee (minimal info)
            [
                3,
                "Lê Văn Cường",
                "levanc@company.vn",
                "",
                "NV999",
                "IT Support",
                "09:00-18:00",
                "12:30-13:30",
                "",
                "",
                "Nhân Viên",
                "Tạm nghỉ",
                "",
                "",
                "",
                "Nghỉ sinh con"
            ],
            // Example row 4: Kitchen staff
            [
                4,
                "Phạm Ngọc Dung",
                "phamdung@company.vn",
                "kitchen456",
                "KB001",
                "Nhà Bếp",
                "06:00-15:00",
                "10:00-11:00",
                "",
                "Khu bếp chính",
                "Nhà Bếp",
                "Hoạt động",
                "",
                "0909123456",
                "",
                "Ca sáng"
            ]
        ];

        const ws = XLSX.utils.aoa_to_sheet(ws_data);

        // Set column widths for better readability
        ws['!cols'] = [
            { wch: 5 },   // STT
            { wch: 20 },  // Họ tên
            { wch: 28 },  // Email
            { wch: 12 },  // Password
            { wch: 12 },  // Mã NV
            { wch: 18 },  // Phòng ban
            { wch: 15 },  // Ca làm việc
            { wch: 15 },  // Thời gian ăn
            { wch: 12 },  // Nhóm ăn
            { wch: 20 },  // Vị trí
            { wch: 12 },  // Vai trò
            { wch: 12 },  // Trạng thái
            { wch: 15 },  // SĐT
            { wch: 25 },  // Địa chỉ
            { wch: 30 }   // Ghi chú
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Danh_Sach_Nhan_Vien");

        // Create detailed instruction sheet
        const instructionSheet = XLSX.utils.aoa_to_sheet([
            ["📋 HƯỚNG DẪN IMPORT NHÂN VIÊN VÀO HỆ THỐNG"],
            [""],
            ["═══════════════════════════════════════════════════════════════"],
            ["🔴 1. CÁC TRƯỜNG BẮT BUỘC (có dấu * trong tên cột)"],
            ["═══════════════════════════════════════════════════════════════"],
            ["   ✓ Họ và Tên: Tên đầy đủ của nhân viên (VD: Nguyễn Văn A)"],
            ["   ✓ Email: Email công ty, phải UNIQUE (VD: nguyenvana@company.vn)"],
            ["   ✓ Phòng Ban: Tên phòng ban (VD: Kỹ Thuật, Kế Toán, IT)"],
            ["   ✓ Thời gian Ăn: Giờ ăn của nhân viên (VD: 12:00-13:00)"],
            [""],
            ["═══════════════════════════════════════════════════════════════"],
            ["🟢 2. CÁC TRƯỜNG TỰ ĐỘNG (có thể để trống)"],
            ["═══════════════════════════════════════════════════════════════"],
            ["   • Mật khẩu: Để trống → Mặc định là '123456'"],
            ["   • Mã Nhân Viên: Để trống → Tự động tạo NVxxxx"],
            ["   • Ca Làm Việc: Để trống → Mặc định 09:00-18:00"],
            ["   • Vai Trò: Để trống → Mặc định 'Nhân Viên'"],
            ["   • Trạng Thái: Để trống → Mặc định 'Hoạt động'"],
            ["   • SĐT, Địa chỉ, Ghi chú: Optional"],
            [""],
            ["═══════════════════════════════════════════════════════════════"],
            ["📝 3. GIÁ TRỊ HỢP LỆ"],
            ["═══════════════════════════════════════════════════════════════"],
            ["   Vai trò (Role):"],
            ["     - Nhân Viên    (employee - quyền thấp nhất)"],
            ["     - Quản Lý      (manager - quản lý phòng ban)"],
            ["     - Admin        (admin - toàn quyền hệ thống)"],
            ["     - Nhà Bếp      (kitchen - quản lý bếp ăn)"],
            [""],
            ["   Trạng thái (Status):"],
            ["     - Hoạt động    (is_active = true)"],
            ["     - Tạm nghỉ     (is_active = false)"],
            [""],
            ["═══════════════════════════════════════════════════════════════"],
            ["🎯 4. ĐỊNH DẠNG DỮ LIỆU"],
            ["═══════════════════════════════════════════════════════════════"],
            ["   • Thời gian: HH:MM-HH:MM (VD: 09:00-18:00, 12:00-13:00)"],
            ["   • Email: abc@domain.com (phải có @ và domain)"],

            ["   • Số điện thoại: 10 chữ số (VD: 0912345678)"],
            [""],
            ["═══════════════════════════════════════════════════════════════"],
            ["⚠️ 5. LƯU Ý QUAN TRỌNG"],
            ["═══════════════════════════════════════════════════════════════"],
            ["   ❗ Email phải UNIQUE - Không được trùng với nhân viên khác"],
            ["   ❗ Không được để trống: Họ Tên, Email, Phòng Ban, Thời gian Ăn"],
            ["   ❗ Nếu Nhóm Ăn chưa tồn tại → Hệ thống TỰ ĐỘNG TẠO MỚI"],
            ["   ❗ Nếu nhập sai định dạng thời gian → Import sẽ BỊ LỖI"],
            ["   ❗ Nhân viên 'Tạm nghỉ' vẫn tạo tài khoản nhưng không hoạt động"],
            [""],
            ["═══════════════════════════════════════════════════════════════"],
            ["📊 6. VÍ DỤ MẪU"],
            ["═══════════════════════════════════════════════════════════════"],
            ["   Xem tab 'Danh_Sach_Nhan_Vien' để tham khảo 4 ví dụ:"],
            ["   ✓ Ví dụ 1: Nhân viên thông thường (đầy đủ thông tin)"],
            ["   ✓ Ví dụ 2: Quản lý (có Telegram notification)"],
            ["   ✓ Ví dụ 3: Nhân viên tạm nghỉ (thông tin tối thiểu)"],
            ["   ✓ Ví dụ 4: Nhân viên bếp (ca đặc biệt)"],
            [""],
            ["═══════════════════════════════════════════════════════════════"],
            ["🚀 7. QUY TRÌNH IMPORT"],
            ["═══════════════════════════════════════════════════════════════"],
            ["   1. Điền thông tin nhân viên vào file Excel này"],
            ["   2. Lưu file (giữ nguyên format .xlsx)"],
            ["   3. Vào hệ thống → Quản lý nhân viên → Import Excel"],
            ["   4. Chọn file đã điền → Xem trước → Xác nhận Import"],
            ["   5. Hệ thống sẽ xử lý từng nhân viên và báo kết quả"],
            [""],
            ["═══════════════════════════════════════════════════════════════"],
            ["✅ 8. SAU KHI IMPORT THÀNH CÔNG"],
            ["═══════════════════════════════════════════════════════════════"],
            ["   ✓ Hệ thống tạo tài khoản Supabase cho mỗi nhân viên"],
            ["   ✓ Ghi log hoạt động 'user_created' trong Activity Logs"],
            ["   ✓ Nhân viên có thể đăng nhập ngay với email và mật khẩu"],
            ["   ✓ Khuyến nghị: Nhân viên nên ĐỔI MẬT KHẨU sau lần đầu đăng nhập"],

            [""],
            ["═══════════════════════════════════════════════════════════════"],
            ["❌ 9. XỬ LÝ LỖI THƯỜNG GẶP"],
            ["═══════════════════════════════════════════════════════════════"],
            ["   Lỗi: 'Email already exists'"],
            ["   → Email đã tồn tại trong hệ thống, kiểm tra lại"],
            [""],
            ["   Lỗi: 'Invalid email format'"],
            ["   → Email sai định dạng (thiếu @, domain không hợp lệ)"],
            [""],
            ["   Lỗi: 'Required field missing'"],
            ["   → Thiếu Họ Tên, Email, Phòng Ban hoặc Thời gian Ăn"],
            [""],
            ["   Lỗi: 'Invalid time format'"],
            ["   → Thời gian phải theo format HH:MM-HH:MM"],
            [""],
            ["═══════════════════════════════════════════════════════════════"],
            ["💡 10. MẸO VÀ KHUYẾN NGHỊ"],
            ["═══════════════════════════════════════════════════════════════"],
            ["   • Import từng đợt 20-50 người để dễ kiểm soát"],
            ["   • Kiểm tra kỹ email trước khi import (tránh trùng lặp)"],
            ["   • Dùng Mã Nhân Viên có quy chuẩn (VD: NV001, MNG001, KB001)"],
            ["   • Nhập đầy đủ SĐT và Địa chỉ để tiện quản lý sau này"],
            ["   • Test import với 2-3 nhân viên trước khi import hàng loạt"],
            [""],
            ["═══════════════════════════════════════════════════════════════"],
            ["📞 HỖ TRỢ"],
            ["═══════════════════════════════════════════════════════════════"],
            ["   Nếu gặp vấn đề, liên hệ Admin hệ thống hoặc IT Support"],
            [""],
            ["   File này được tạo tự động bởi: Hệ thống Cơm Ngon Premium"],
            ["   Phiên bản: v2.1 - Enhanced Template (15 columns)"],
            ["   Cập nhật: " + new Date().toLocaleDateString('vi-VN')]
        ]);

        // Set width for instruction sheet
        instructionSheet['!cols'] = [{ wch: 80 }];

        XLSX.utils.book_append_sheet(wb, instructionSheet, "Huong_Dan_Chi_Tiet");

        // Download file with timestamp
        const timestamp = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `Mau_Nhap_Nhan_Vien_${timestamp}.xlsx`);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-[900px] h-[80vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 px-6 py-4 bg-white dark:bg-slate-900">
                    <h2 className="text-[#181410] dark:text-white text-xl font-bold">Import Nhân viên từ Excel</h2>
                    <button onClick={onClose} disabled={isProcessing} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10">
                        <Icon name="close" />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col p-6">
                    {currentStep === 'upload' && (
                        <div className="flex-1 flex flex-col items-center justify-center gap-6 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-800/50 m-4">
                            <Icon name="upload_file" className="text-6xl text-gray-400" />
                            <div className="text-center">
                                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Kéo thả file Excel vào đây</p>
                                <p className="text-sm text-gray-500">hoặc nhấn vào nút bên dưới để chọn file</p>
                            </div>
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                            <div className="flex gap-4">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-6 py-3 bg-primary text-white font-bold rounded-lg shadow hover:bg-primary/90 transition-colors"
                                >
                                    Chọn file Excel
                                </button>
                                <button
                                    onClick={downloadSample}
                                    className="px-6 py-3 bg-white dark:bg-transparent border border-gray-300 dark:border-slate-600 font-bold rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-gray-700 dark:text-white"
                                >
                                    Tải file mẫu
                                </button>
                            </div>
                        </div>
                    )}

                    {(currentStep === 'preview' || currentStep === 'importing' || currentStep === 'result') && (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="font-bold text-lg dark:text-white">Danh sách xem trước ({parsedData.length} nhân viên)</h3>
                                    {currentStep === 'importing' && (
                                        <p className="text-sm text-gray-500">Đang xử lý: {progress.current}/{progress.total} (Thành công: {progress.success})</p>
                                    )}
                                </div>
                                {currentStep === 'preview' && (
                                    <div className="flex gap-2">
                                        <button onClick={() => { setParsedData([]); setCurrentStep('upload'); }} className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-semibold">
                                            Hủy / Chọn lại
                                        </button>
                                        <button onClick={handleImport} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow hover:bg-primary/90">
                                            Tiến hành Import
                                        </button>
                                    </div>
                                )}
                                {currentStep === 'result' && (
                                    <button onClick={onSuccess} className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-bold shadow hover:bg-green-700">
                                        Hoàn tất & Đóng
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 overflow-auto border border-gray-200 dark:border-slate-700 rounded-lg">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-gray-50 dark:bg-slate-800 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">#</th>
                                            <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Trạng thái</th>
                                            <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Họ tên</th>
                                            <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">User/Email</th>
                                            <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Phòng ban</th>
                                            <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Ca ăn</th>
                                            <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Nhóm</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                        {parsedData.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                                <td className="px-4 py-2 text-gray-500">{idx + 1}</td>
                                                <td className="px-4 py-2">
                                                    {row.status === 'pending' && <span className="text-gray-400">Chờ...</span>}
                                                    {row.status === 'success' && <span className="text-green-600 font-bold flex items-center gap-1"><Icon name="check_circle" className="text-base" /> OK</span>}
                                                    {row.status === 'error' && <span className="text-red-500 font-medium flex items-center gap-1" title={row.message}><Icon name="error" className="text-base" /> Lỗi</span>}
                                                </td>
                                                <td className="px-4 py-2 dark:text-gray-300 font-medium">{row.fullName}</td>
                                                <td className="px-4 py-2 text-gray-500">{row.email}</td>
                                                <td className="px-4 py-2 dark:text-gray-400">{row.department}</td>
                                                <td className="px-4 py-2 dark:text-gray-400">{row.mealShift} <span className="text-xs text-gray-400">({row.workShift})</span></td>
                                                <td className="px-4 py-2 dark:text-gray-400">{row.mealGroupName || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
