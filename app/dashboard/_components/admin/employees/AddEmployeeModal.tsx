'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

interface AddEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    mealGroups: Array<{ id: string; name: string }>;
}

export default function AddEmployeeModal({ isOpen, onClose, onSuccess, mealGroups }: AddEmployeeModalProps) {
    const supabase = createClient();

    const [formData, setFormData] = useState({
        email: '',
        fullName: '',
        employeeCode: '',
        password: '',
        role: 'employee' as 'employee' | 'manager' | 'admin' | 'kitchen',
        mealGroupId: '',
        shift: '',
        department: ''
    });

    // State for dynamic options
    const [departments, setDepartments] = useState<string[]>([]);
    const [shifts, setShifts] = useState<Array<{ id: string, name: string }>>([]);

    // Custom values state
    const [customValues, setCustomValues] = useState({
        department: '',
        shift: '',
        shiftStartTime: '',
        shiftEndTime: '',
        mealGroupName: '',
        mealGroupTableArea: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                // Fetch Departments from departments table
                const { data: deptData } = await supabase.from('departments').select('name').order('name');
                if (deptData) {
                    setDepartments(deptData.map(d => d.name));
                }

                // Fetch Shifts
                const { data: shiftData } = await supabase.from('shifts').select('id, name').order('name');
                setShifts(shiftData || []);
            };
            fetchData();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // ... validation ...
        if (!formData.email || !formData.fullName || !formData.password || !formData.employeeCode) {
            setError('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        // Validate custom inputs
        if (formData.department === 'custom' && !customValues.department.trim()) {
            setError('Vui lòng nhập tên phòng ban mới');
            return;
        }
        if (formData.shift === 'custom' && !customValues.shift.trim()) {
            setError('Vui lòng nhập tên ca ăn mới');
            return;
        }
        if (formData.mealGroupId === 'custom' && !customValues.mealGroupName.trim()) {
            setError('Vui lòng nhập tên nhóm ăn mới');
            return;
        }
        if (formData.mealGroupId === 'custom' && !customValues.mealGroupTableArea.trim()) {
            setError('Vui lòng nhập khu vực bàn ăn cho nhóm mới');
            return;
        }

        setIsSubmitting(true);

        try {
            let finalMealGroupId = formData.mealGroupId;
            let finalDepartment = formData.department === 'custom' ? customValues.department : formData.department;
            const finalShift = formData.shift === 'custom' ? customValues.shift : formData.shift;

            // Handle custom department creation
            if (formData.department === 'custom') {
                const { error: deptError } = await supabase
                    .from('departments')
                    .insert({ name: customValues.department })
                    .single();

                if (deptError && deptError.code !== '23505') { // Ignore unique constraint violation
                    throw new Error(`Không thể tạo phòng ban mới: ${deptError.message}`);
                }
            }

            let finalShiftId: string | null = null;

            // Handle Custom Shift Creation (persist to DB)
            if (formData.shift === 'custom') {
                // Validate time inputs
                if (!customValues.shift || !customValues.shiftStartTime || !customValues.shiftEndTime) {
                    throw new Error('Vui lòng nhập đầy đủ tên ca và khung giờ');
                }

                // Check if shift name already exists
                const { data: existingShift } = await supabase
                    .from('shifts')
                    .select('id, name')
                    .ilike('name', finalShift)
                    .single();

                if (existingShift) {
                    // If exists (case insensitive), use it
                    finalShiftId = existingShift.id;
                } else {
                    const { data: createdShift, error: shiftError } = await supabase
                        .from('shifts')
                        .insert({
                            name: finalShift,
                            start_time: customValues.shiftStartTime,
                            end_time: customValues.shiftEndTime
                        })
                        .select('id')
                        .single();

                    if (shiftError) {
                        console.error('Error creating custom shift:', shiftError);
                        throw new Error(`Không thể tạo ca ăn mới: ${shiftError.message}`);
                    }
                    if (createdShift) finalShiftId = createdShift.id;
                }
            } else {
                // Existing shift selected
                if (formData.shift) {
                    const selectedShiftObj = shifts.find(s => s.name === formData.shift);
                    if (selectedShiftObj) finalShiftId = selectedShiftObj.id;
                }
            }

            // Handle custom meal group creation
            if (formData.mealGroupId === 'custom') {
                const { data: newGroup, error: groupError } = await supabase
                    .from('groups')
                    .insert({
                        name: customValues.mealGroupName,
                        table_area: customValues.mealGroupTableArea,
                        department: finalDepartment,
                        shift_id: finalShiftId
                    })
                    .select('id')
                    .single();

                if (groupError) throw groupError;
                finalMealGroupId = newGroup.id;
            }

            // 1. Create auth user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        role: formData.role,
                        employee_code: formData.employeeCode
                    }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('Không thể tạo tài khoản');

            // 2. Create/Update user profile
            const { error: upsertError } = await supabase
                .from('users')
                .upsert({
                    id: authData.user.id,
                    email: formData.email,
                    full_name: formData.fullName,
                    role: formData.role,
                    employee_code: formData.employeeCode,
                    shift: finalShift,
                    department: finalDepartment,
                    group_id: finalMealGroupId || null,
                    is_active: true
                });

            if (upsertError) throw upsertError;

            // 4. Log activity
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (currentUser) {
                await supabase.from('activity_logs').insert({
                    action: 'CREATE_USER',
                    performed_by: currentUser.id,
                    target_type: 'user',
                    target_id: authData.user.id,
                    details: {
                        email: formData.email,
                        role: formData.role,
                        employee_code: formData.employeeCode,
                        shift: finalShift,
                        department: finalDepartment,
                        group_id: finalMealGroupId,
                        is_custom_meal_group: formData.mealGroupId === 'custom',
                        is_custom_shift: formData.shift === 'custom',
                        is_custom_department: formData.department === 'custom'
                    }
                });
            }

            // Success
            onSuccess();
            onClose();

            // Reset form
            setFormData({
                email: '',
                fullName: '',
                employeeCode: '',
                password: '',
                role: 'employee',
                mealGroupId: '',
                shift: '',
                department: ''
            });
            setCustomValues({
                department: '',
                shift: '',
                shiftStartTime: '',
                shiftEndTime: '',
                mealGroupName: '',
                mealGroupTableArea: ''
            });

        } catch (err: any) {
            console.error('Error adding employee:', err);
            setError(err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-[800px] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 px-6 py-4 bg-white dark:bg-slate-900">
                    <h2 className="text-[#181410] dark:text-white text-xl font-bold leading-tight">Thêm nhân viên mới</h2>
                    <button
                        onClick={onClose}
                        type="button"
                        className="flex items-center justify-center rounded-lg h-10 w-10 bg-[#f5f2f0] dark:bg-white/10 text-[#181410] dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                    >
                        <Icon name="close" />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Error Alert */}
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
                            <Icon name="error" className="text-[20px]" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {/* Avatar Section */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <div className="bg-gray-200 dark:bg-white/10 rounded-full h-32 w-32 flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-sm">
                                <div className="flex items-center justify-center bg-black/10 dark:bg-white/10 rounded-full inset-0 absolute">
                                    <Icon name="add_a_photo" className="text-white text-4xl" />
                                </div>
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-[#181410] dark:text-white text-lg font-bold">Ảnh đại diện</p>
                            <p className="text-[#8d715e] dark:text-gray-400 text-sm">Tải lên ảnh chân dung định dạng JPG, PNG</p>
                        </div>
                        <button
                            type="button"
                            className="flex min-w-[120px] cursor-pointer items-center justify-center gap-2 rounded-lg h-10 px-6 bg-primary/10 text-primary text-sm font-bold border border-primary/20 hover:bg-primary/20 transition-colors"
                        >
                            <Icon name="upload" className="text-sm" />
                            <span>Tải ảnh lên</span>
                        </button>
                    </div>

                    {/* Section: Thông tin cá nhân */}
                    <section>
                        <div className="flex items-center gap-2 mb-4 border-l-4 border-primary pl-3">
                            <h3 className="text-[#181410] dark:text-white text-lg font-bold tracking-tight">Thông tin cá nhân</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[#181410] dark:text-white text-sm font-semibold">
                                    Họ và tên <span className="text-primary">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="flex w-full rounded-lg text-[#181410] dark:text-white border border-[#e7dfda] dark:border-white/20 bg-white dark:bg-white/5 h-12 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-[#8d715e]"
                                    placeholder="VD: Nguyễn Văn A"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[#181410] dark:text-white text-sm font-semibold">
                                    Mã nhân viên <span className="text-primary">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.employeeCode}
                                    onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                                    className="flex w-full rounded-lg text-[#181410] dark:text-white border border-primary bg-white dark:bg-white/5 h-12 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-[#8d715e]"
                                    placeholder="VD: NV001"
                                />
                                <span className="text-primary text-[11px] font-medium">Mã nhân viên không được để trống</span>
                            </div>
                        </div>
                    </section>

                    {/* Section: Thông tin tổ chức */}
                    <section>
                        <div className="flex items-center gap-2 mb-4 border-l-4 border-primary pl-3">
                            <h3 className="text-[#181410] dark:text-white text-lg font-bold tracking-tight">Thông tin tổ chức</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Department */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[#181410] dark:text-white text-sm font-semibold">Phòng ban</label>
                                {formData.department === 'custom' ? (
                                    <div className="relative flex items-center gap-2">
                                        <input
                                            type="text"
                                            autoFocus
                                            value={customValues.department}
                                            onChange={(e) => setCustomValues({ ...customValues, department: e.target.value })}
                                            className="flex w-full rounded-lg text-[#181410] dark:text-white border border-primary bg-white dark:bg-white/5 h-12 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-[#8d715e]"
                                            placeholder="Nhập tên phòng ban mới..."
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFormData({ ...formData, department: '' });
                                                setCustomValues({ ...customValues, department: '' });
                                            }}
                                            className="h-12 w-12 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 transition-colors"
                                            title="Quay lại danh sách"
                                        >
                                            <Icon name="close" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <select
                                            value={formData.department}
                                            onChange={(e) => {
                                                if (e.target.value === 'custom') {
                                                    setFormData({ ...formData, department: 'custom' });
                                                } else {
                                                    setFormData({ ...formData, department: e.target.value });
                                                }
                                            }}
                                            className="appearance-none flex w-full rounded-lg text-[#181410] dark:text-white border border-[#e7dfda] dark:border-white/20 bg-white dark:bg-white/5 h-12 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        >
                                            <option value="">Chọn phòng ban</option>
                                            <option value="hr">Phòng Nhân sự</option>
                                            <option value="it">Phòng Kỹ thuật / IT</option>
                                            <option value="sales">Phòng Kinh doanh</option>
                                            <option value="production">Bộ phận Sản xuất</option>
                                            <option value="accounting">Phòng Kế toán</option>
                                            <option className="font-bold text-primary" value="custom">+ Thêm phòng ban mới...</option>
                                        </select>
                                        <Icon name="expand_more" className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Meal Group */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[#181410] dark:text-white text-sm font-semibold">Nhóm ăn</label>
                                    {formData.mealGroupId === 'custom' ? (
                                        <div className="flex flex-col gap-2 p-3 rounded-lg border-2 border-primary/30 bg-primary/5">
                                            <div>
                                                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Tên nhóm</label>
                                                <input
                                                    type="text"
                                                    autoFocus
                                                    value={customValues.mealGroupName}
                                                    onChange={(e) => setCustomValues({ ...customValues, mealGroupName: e.target.value })}
                                                    className="flex w-full rounded-lg text-[#181410] dark:text-white border border-primary bg-white dark:bg-white/5 h-10 px-3 text-sm focus:ring-1 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                                    placeholder="Nhập tên nhóm..."
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Khu vực bàn</label>
                                                <input
                                                    type="text"
                                                    value={customValues.mealGroupTableArea}
                                                    onChange={(e) => setCustomValues({ ...customValues, mealGroupTableArea: e.target.value })}
                                                    className="flex w-full rounded-lg text-[#181410] dark:text-white border border-primary bg-white dark:bg-white/5 h-10 px-3 text-sm focus:ring-1 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                                    placeholder="VD: Bàn 12 - Tầng 2"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFormData({ ...formData, mealGroupId: '' });
                                                    setCustomValues({ ...customValues, mealGroupName: '', mealGroupTableArea: '' });
                                                }}
                                                className="self-end text-xs text-red-500 font-semibold hover:underline"
                                            >
                                                Hủy
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <select
                                                value={formData.mealGroupId}
                                                onChange={(e) => setFormData({ ...formData, mealGroupId: e.target.value })}
                                                className="appearance-none flex w-full rounded-lg text-[#181410] dark:text-white border border-[#e7dfda] dark:border-white/20 bg-white dark:bg-white/5 h-12 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                            >
                                                <option value="">Chọn nhóm</option>
                                                {mealGroups.map(group => (
                                                    <option key={group.id} value={group.id}>{group.name}</option>
                                                ))}
                                                <option className="font-bold text-primary" value="custom">+ Thêm nhóm & bàn ăn mới...</option>
                                            </select>
                                            <Icon name="groups" className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                                        </div>
                                    )}
                                </div>

                                {/* Shift */}
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[#181410] dark:text-white text-sm font-semibold">Ca ăn</label>
                                        <div className="flex items-center gap-1 text-primary">
                                            <Icon name="auto_fix_high" className="text-[14px]" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Linked</span>
                                        </div>
                                    </div>
                                    {formData.shift === 'custom' ? (
                                        <div className="flex flex-col gap-3 p-3 rounded-lg border-2 border-primary/30 bg-primary/5">
                                            {/* Shift Name */}
                                            <div>
                                                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">
                                                    Tên ca ăn
                                                </label>
                                                <input
                                                    type="text"
                                                    value={customValues.shift}
                                                    onChange={(e) => setCustomValues({ ...customValues, shift: e.target.value })}
                                                    className="w-full rounded-lg text-[#181410] dark:text-white border border-gray-300 dark:border-white/20 bg-white dark:bg-white/5 h-10 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                                    placeholder="VD: Ca trưa 1"
                                                    required
                                                />
                                            </div>

                                            {/* Time Range */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 block">
                                                        Giờ bắt đầu
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={customValues.shiftStartTime}
                                                        onChange={(e) => setCustomValues({ ...customValues, shiftStartTime: e.target.value })}
                                                        placeholder="VD: 12:30"
                                                        pattern="[0-2][0-9]:[0-5][0-9]"
                                                        className="w-full rounded-lg text-[#181410] dark:text-white border-2 border-gray-300 dark:border-white/20 bg-white dark:bg-white/5 h-14 px-4 text-base font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                                        required
                                                    />
                                                    <span className="text-xs text-gray-500 mt-1">Format: HH:MM (24h)</span>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 block">
                                                        Giờ kết thúc
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={customValues.shiftEndTime}
                                                        onChange={(e) => setCustomValues({ ...customValues, shiftEndTime: e.target.value })}
                                                        placeholder="VD: 13:00"
                                                        pattern="[0-2][0-9]:[0-5][0-9]"
                                                        className="w-full rounded-lg text-[#181410] dark:text-white border-2 border-gray-300 dark:border-white/20 bg-white dark:bg-white/5 h-14 px-4 text-base font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                                        required
                                                    />
                                                    <span className="text-xs text-gray-500 mt-1">Format: HH:MM (24h)</span>
                                                </div>
                                            </div>

                                            {/* Cancel Button */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFormData({ ...formData, shift: '' });
                                                    setCustomValues({ ...customValues, shift: '', shiftStartTime: '', shiftEndTime: '' });
                                                }}
                                                className="text-xs text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 font-semibold"
                                            >
                                                ✕ Hủy tạo ca mới
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <select
                                                value={formData.shift}
                                                onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                                                className="appearance-none flex w-full rounded-lg text-[#181410] dark:text-white border border-primary/40 bg-white dark:bg-white/5 h-12 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                            >
                                                <option value="">Chọn ca</option>
                                                <option value="shift0">11:00 - 11:45</option>
                                                <option value="shift1">11:30 - 12:15</option>
                                                <option value="shift2">12:15 - 13:00</option>
                                                <option value="shift3">13:00 - 13:45</option>
                                                <option className="font-bold text-primary" value="custom">+ Thêm ca mới...</option>
                                            </select>
                                            <Icon name="restaurant" className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-primary" />
                                        </div>
                                    )}
                                    {formData.mealGroupId && (
                                        <div className="flex items-center gap-1 text-primary text-[11px] font-medium mt-1">
                                            <Icon name="info" className="text-[12px]" />
                                            <span>Tự động theo nhóm</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[#181410] dark:text-white text-sm font-semibold">Vai trò</label>
                                <div className="relative">
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                                        className="appearance-none flex w-full rounded-lg text-[#181410] dark:text-white border border-[#e7dfda] dark:border-white/20 bg-white dark:bg-white/5 h-12 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    >
                                        <option value="employee">Nhân viên</option>
                                        <option value="manager">Quản lý</option>
                                        <option value="admin">Quản trị</option>
                                        <option value="kitchen">Nhà bếp</option>
                                    </select>
                                    <Icon name="expand_more" className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section: Bảo mật tài khoản */}
                    <section>
                        <div className="flex items-center gap-2 mb-4 border-l-4 border-primary pl-3">
                            <h3 className="text-[#181410] dark:text-white text-lg font-bold tracking-tight">Bảo mật tài khoản</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[#181410] dark:text-white text-sm font-semibold">
                                    Email/Username <span className="text-primary">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="flex w-full rounded-lg text-[#181410] dark:text-white border border-[#e7dfda] dark:border-white/20 bg-white dark:bg-white/5 h-12 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-[#8d715e]"
                                    placeholder="example@company.vn"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[#181410] dark:text-white text-sm font-semibold">
                                    Mật khẩu <span className="text-primary">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        minLength={6}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="flex w-full rounded-lg text-[#181410] dark:text-white border border-[#e7dfda] dark:border-white/20 bg-white dark:bg-white/5 h-12 pl-4 pr-12 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-[#8d715e]"
                                        placeholder="Nhập mật khẩu"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                                    >
                                        <Icon name={showPassword ? 'visibility' : 'visibility_off'} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                </form >

                {/* Footer */}
                < div className="p-6 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3" >
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="flex min-w-[100px] cursor-pointer items-center justify-center rounded-lg h-11 px-6 bg-[#f5f2f0] dark:bg-white/5 text-[#181410] dark:text-white text-sm font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        onClick={handleSubmit}
                        className="flex min-w-[140px] cursor-pointer items-center justify-center rounded-lg h-11 px-8 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/25 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {isSubmitting ? 'Đang xử lý...' : 'Lưu thông tin'}
                    </button>
                </div >
            </div >
        </div >
    );
}
