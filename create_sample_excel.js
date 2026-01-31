const XLSX = require('xlsx');

const data = [
    ["STT", "UUID", "Họ Tên", "Phòng Ban", "Nhóm Ăn", "Ca Ăn", "User", "Pass", "Role"],
    [1, "", "Nguyễn Văn Test01", "IT", "Nhóm 1", "12:00 - 12:30", "test01@company.com", "123456", "Nhân Viên"],
    [2, "", "Trần Thị Test02", "HR", "Nhóm 2", "12:30 - 13:00", "test02@company.com", "123456", "Quản Lý"],
    [3, "", "Lê Văn Test03", "Sales", "Nhóm 1", "12:00 - 12:30", "test03@company.com", "123456", "Admin"]
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(data);
XLSX.utils.book_append_sheet(wb, ws, "Danh Sách");

XLSX.writeFile(wb, "sample_employees.xlsx");
console.log("Created sample_employees.xlsx");
