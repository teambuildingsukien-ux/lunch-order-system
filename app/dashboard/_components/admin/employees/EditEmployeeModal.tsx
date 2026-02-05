'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

// Material Symbol Icon component
const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

interface Employee {
    id: string;
    email: string;
    full_name: string;
    role: 'employee' | 'manager' | 'admin' | 'kitchen';
    avatar_url: string | null;
    user_meal_groups?: Array<{
        meal_group: {
            id: string;
            name: string;
        };
    }> | null;
}

interface EditEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    employee: Employee;
    mealGroups: Array<{ id: string; name: string }>;
}

export default function EditEmployeeModal({ isOpen, onClose, onSuccess, employee, mealGroups }: EditEmployeeModalProps) {
    const supabase = createClient();

    const [formData, setFormData] = useState({
        fullName: employee.full_name || '',
        role: employee.role,
        groupId: employee.user_meal_groups?.[0]?.meal_group?.id || '',
        employeeCode: (employee as any).employee_code || '',
        shift: (employee as any).shift || '',
        department: (employee as any).department || ''
    });

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

    // Standard values lists
    const StandardDepartments = ['hr', 'it', 'sales', 'production', 'accounting'];
    const StandardShifts = ['shift0', 'shift1', 'shift2', 'shift3'];

    useEffect(() => {
        if (isOpen && employee) {
            const currentDept = (employee as any).department || '';
            const currentShift = (employee as any).shift || '';
            const currentGroup = (employee as any).group_id || ''; // Using group_id from user table

            // Check if values are custom
            const isCustomDept = currentDept && !StandardDepartments.includes(currentDept);
            const isCustomShift = currentShift && !StandardShifts.includes(currentShift);

            setFormData({
                fullName: employee.full_name || '',
                role: employee.role,
                groupId: currentGroup,
                employeeCode: (employee as any).employee_code || '',
                shift: isCustomShift ? 'custom' : currentShift,
                department: isCustomDept ? 'custom' : currentDept
            });

            setCustomValues({
                department: isCustomDept ? currentDept : '',
                shift: isCustomShift ? currentShift : '',
                shiftStartTime: '',
                shiftEndTime: '',
                mealGroupName: '',
                mealGroupTableArea: ''
            });
        }
    }, [isOpen, employee]);

    // State for dynamic options
    const [departments, setDepartments] = useState<string[]>([]);
    const [shifts, setShifts] = useState<Array<{ id: string, name: string }>>([]);

    // Fetch dynamic options
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.fullName.trim()) {
            setError('Vui lòng nhập họ tên');
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
        if (formData.groupId === 'custom' && !customValues.mealGroupName.trim()) {
            setError('Vui lòng nhập tên nhóm ăn mới');
            return;
        }

        setIsSubmitting(true);

        try {
            let finalGroupId = formData.groupId;
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

            // Handle Custom Shift Creation
            if (formData.shift === 'custom') {
                // Validate shift name first
                if (!customValues.shift.trim()) {
                    throw new Error('Vui lòng nhập tên ca ăn');
                }
                // Validate time inputs
                if (!customValues.shiftStartTime || !customValues.shiftEndTime) {
                    throw new Error('Vui lòng nhập đầy đủ khung giờ cho ca ăn');
                }

                // Check if shift name already exists
                const { data: existingShift } = await supabase
                    .from('shifts')
                    .select('id, name')
                    .ilike('name', finalShift)
                    .single();

                if (existingShift) {
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
            if (formData.groupId === 'custom') {
                // Get current user's tenant_id first
                const { data: { user: currentUser } } = await supabase.auth.getUser();
                if (!currentUser) throw new Error('Not authenticated');

                const { data: currentProfile } = await supabase
                    .from('users')
                    .select('tenant_id')
                    .eq('id', currentUser.id)
                    .single();

                if (!currentProfile) throw new Error('User profile not found');

                const { data: newGroup, error: groupError } = await supabase
                    .from('groups') // Use existing 'groups' table
                    .insert({
                        tenant_id: currentProfile.tenant_id,  // REQUIRED for RLS
                        name: customValues.mealGroupName,
                        table_area: customValues.mealGroupTableArea,
                        department: finalDepartment,
                        shift_id: finalShiftId
                    })
                    .select('id')
                    .single();

                if (groupError) throw groupError;
                finalGroupId = newGroup.id;
            }

            // Step 1: Update user data (including group_id)
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    full_name: formData.fullName,
                    role: formData.role,
                    employee_code: formData.employeeCode,
                    shift: finalShift,
                    department: finalDepartment,
                    group_id: finalGroupId || null
                })
                .eq('id', employee.id);

            if (updateError) throw updateError;

            // Step 3: Log activity
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (currentUser) {
                const { data: adminProfile } = await supabase
                    .from('users')
                    .select('tenant_id')
                    .eq('id', currentUser.id)
                    .single();

                if (adminProfile) {
                    await supabase.from('activity_logs').insert({
                        tenant_id: adminProfile.tenant_id,  // REQUIRED for RLS
                        action: 'UPDATE_USER',
                        performed_by: currentUser.id,
                        target_type: 'user',
                        target_id: employee.id,
                        details: {
                            changes: {
                                full_name: formData.fullName,
                                role: formData.role,
                                group_id: finalGroupId,
                                employee_code: formData.employeeCode,
                                department: finalDepartment,
                                shift: finalShift,
                                is_custom_meal_group: formData.groupId === 'custom'
                            }
                        }
                    });
                }
            }

            // Success!
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error updating employee:', err);
            setError(err.message || 'Không thể cập nhật nhân viên. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-[#dbdfe6] dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Icon name="edit" className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold dark:text-white">Chỉnh Sửa Nhân Viên</h2>
                            <p className="text-sm text-[#606e8a]">{employee.email}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <Icon name="close" className="text-[#606e8a]" />
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mx-6 mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
                        <Icon name="error" className="text-red-600 dark:text-red-400" />
                        <span className="text-sm font-semibold text-red-700 dark:text-red-400">{error}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Full Name & Employee Code */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-[#111318] dark:text-white mb-2">
                                Họ và tên *
                            </label>
                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                className="w-full p-3 rounded-lg bg-[#f5f6f8] dark:bg-slate-800 border-none text-sm focus:ring-2 focus:ring-[#c04b00] dark:text-white"
                                placeholder="Nguyễn Văn A"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-[#111318] dark:text-white mb-2">
                                Mã nhân viên
                            </label>
                            <input
                                type="text"
                                value={formData.employeeCode}
                                onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                                className="w-full p-3 rounded-lg bg-[#f5f6f8] dark:bg-slate-800 border-none text-sm focus:ring-2 focus:ring-[#c04b00] dark:text-white"
                                placeholder="NV001"
                            />
                        </div>
                    </div>

                    {/* Department & Role */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-[#111318] dark:text-white mb-2">
                                Phòng ban
                            </label>
                            {formData.department === 'custom' ? (
                                <div className="relative flex items-center gap-2">
                                    <input
                                        type="text"
                                        autoFocus
                                        value={customValues.department}
                                        onChange={(e) => setCustomValues({ ...customValues, department: e.target.value })}
                                        className="w-full p-3 rounded-lg bg-[#f5f6f8] dark:bg-slate-800 border-none text-sm focus:ring-2 focus:ring-[#c04b00] dark:text-white"
                                        placeholder="Nhập tên phòng ban..."
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData({ ...formData, department: '' });
                                        }}
                                        className="size-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg dark:bg-slate-700"
                                    >
                                        <Icon name="close" className="text-sm" />
                                    </button>
                                </div>
                            ) : (
                                <select
                                    value={formData.department}
                                    onChange={(e) => {
                                        if (e.target.value === 'custom') {
                                            setFormData({ ...formData, department: 'custom' });
                                            setCustomValues({ ...customValues, department: '' });
                                        } else {
                                            setFormData({ ...formData, department: e.target.value });
                                            // Reset custom value if standard selected
                                            setCustomValues({ ...customValues, department: '' });
                                        }
                                    }}
                                    className="w-full p-3 rounded-lg bg-[#f5f6f8] dark:bg-slate-800 border-none text-sm focus:ring-2 focus:ring-[#c04b00] dark:text-white"
                                >
                                    <option value="">Chọn phòng ban</option>
                                    {departments.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                    <option className="font-bold text-orange-600" value="custom">+ Thêm phòng ban mới...</option>
                                </select>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-[#111318] dark:text-white mb-2">
                                Vai trò *
                            </label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                                className="w-full p-3 rounded-lg bg-[#f5f6f8] dark:bg-slate-800 border-none text-sm focus:ring-2 focus:ring-[#c04b00] dark:text-white"
                            >
                                <option value="employee">Nhân Viên</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Quản Trị</option>
                                <option value="kitchen">Nhà Bếp</option>
                            </select>
                        </div>
                    </div>

                    {/* Meal Group & Shift */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-[#111318] dark:text-white mb-2">
                                Nhóm ăn
                            </label>
                            {formData.groupId === 'custom' ? (
                                <div className="relative flex items-center gap-2">
                                    <input
                                        type="text"
                                        autoFocus
                                        value={customValues.mealGroupName}
                                        onChange={(e) => setCustomValues({ ...customValues, mealGroupName: e.target.value })}
                                        className="w-full p-3 rounded-lg bg-[#f5f6f8] dark:bg-slate-800 border-none text-sm focus:ring-2 focus:ring-[#c04b00] dark:text-white"
                                        placeholder="Nhập tên nhóm..."
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData({ ...formData, groupId: '' });
                                        }}
                                        className="size-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg dark:bg-slate-700"
                                    >
                                        <Icon name="close" className="text-sm" />
                                    </button>
                                </div>
                            ) : (
                                <select
                                    value={formData.groupId}
                                    onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                                    className="w-full p-3 rounded-lg bg-[#f5f6f8] dark:bg-slate-800 border-none text-sm focus:ring-2 focus:ring-[#c04b00] dark:text-white"
                                >
                                    <option value="">-- Không thuộc nhóm nào --</option>
                                    {mealGroups.map(group => (
                                        <option key={group.id} value={group.id}>{group.name}</option>
                                    ))}
                                    <option className="font-bold text-orange-600" value="custom">+ Thêm nhóm mới...</option>
                                </select>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-[#111318] dark:text-white mb-2">
                                Ca ăn
                            </label>
                            {formData.shift === 'custom' ? (
                                <div className="relative flex items-center gap-2">
                                    <input
                                        type="text"
                                        autoFocus
                                        value={customValues.shift}
                                        onChange={(e) => setCustomValues({ ...customValues, shift: e.target.value })}
                                        className="w-full p-3 rounded-lg bg-[#f5f6f8] dark:bg-slate-800 border-none text-sm focus:ring-2 focus:ring-[#c04b00] dark:text-white"
                                        placeholder="Nhập ca ăn..."
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData({ ...formData, shift: '' });
                                        }}
                                        className="size-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg dark:bg-slate-700"
                                    >
                                        <Icon name="close" className="text-sm" />
                                    </button>
                                </div>
                            ) : (
                                <select
                                    value={formData.shift}
                                    onChange={(e) => {
                                        if (e.target.value === 'custom') {
                                            setFormData({ ...formData, shift: 'custom' });
                                            setCustomValues({ ...customValues, shift: '' });
                                        } else {
                                            setFormData({ ...formData, shift: e.target.value });
                                            setCustomValues({ ...customValues, shift: '' });
                                        }
                                    }}
                                    className="w-full p-3 rounded-lg bg-[#f5f6f8] dark:bg-slate-800 border-none text-sm focus:ring-2 focus:ring-[#c04b00] dark:text-white"
                                >
                                    <option value="">Chọn ca ăn</option>
                                    {shifts.map(shift => (
                                        <option key={shift.id} value={shift.name}>{shift.name}</option>
                                    ))}
                                    <option className="font-bold text-orange-600" value="custom">+ Thêm ca mới...</option>
                                </select>
                            )}
                        </div>
                    </div>

                    {/* Info note */}
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-xs text-blue-700 dark:text-blue-400">
                            <Icon name="info" className="text-[16px] inline mr-1" />
                            Email không thể thay đổi. Để đổi avatar, sử dụng chức năng upload avatar riêng.
                        </p>
                    </div>
                </form>

                {/* Footer */}
                <div className="p-6 border-t border-[#dbdfe6] dark:border-slate-800 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="flex-1 py-3 px-4 rounded-lg border-2 border-[#dbdfe6] dark:border-slate-700 text-[#606e8a] font-semibold text-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex-1 py-3 px-4 rounded-lg bg-[#c04b00] text-white font-bold text-sm shadow-lg shadow-[#c04b00]/25 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Icon name="progress_activity" className="text-[20px] animate-spin" />
                                Đang lưu...
                            </>
                        ) : (
                            <>
                                <Icon name="save" className="text-[20px]" />
                                Lưu thay đổi
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
