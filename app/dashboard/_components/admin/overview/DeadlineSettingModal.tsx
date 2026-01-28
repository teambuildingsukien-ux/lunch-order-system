'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/providers/toast-provider';

const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

interface DeadlineSettingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function DeadlineSettingModal({ isOpen, onClose }: DeadlineSettingModalProps) {
    const supabase = createClient();
    const { showToast } = useToast();

    const [deadline, setDeadline] = useState('05:00');
    const [offset, setOffset] = useState('0'); // '0' = Today, '-1' = Yesterday
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchDeadline();
        }
    }, [isOpen]);

    const fetchDeadline = async () => {
        setIsLoading(true);
        const { data } = await supabase
            .from('system_settings')
            .select('key, value')
            .in('key', ['registration_deadline', 'registration_deadline_offset']);

        if (data) {
            const timeSetting = data.find(s => s.key === 'registration_deadline');
            const offsetSetting = data.find(s => s.key === 'registration_deadline_offset');

            if (timeSetting) setDeadline(timeSetting.value);
            if (offsetSetting) setOffset(offsetSetting.value);
        }
        setIsLoading(false);
    };

    const handleSave = async () => {
        setIsSaving(true);

        // Validate format HH:MM
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(deadline)) {
            showToast('Định dạng giờ không hợp lệ', 'error');
            setIsSaving(false);
            return;
        }

        const updates = [
            { key: 'registration_deadline', value: deadline, description: 'Giờ hết hạn đăng ký (HH:MM)' },
            { key: 'registration_deadline_offset', value: offset, description: 'Chênh lệch ngày (-1: Hôm qua, 0: Hôm nay)' }
        ];

        const { error } = await supabase
            .from('system_settings')
            .upsert(updates);

        if (error) {
            console.error('Error saving deadline:', error);
            showToast('Lỗi lưu cài đặt', 'error');
        } else {
            showToast('Đã lưu thời gian hạn đăng ký', 'success');
            onClose();
        }
        setIsSaving(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                            <Icon name="timer" className="text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold dark:text-white">Cài đặt Hạn đăng ký</h2>
                            <p className="text-sm text-[#606e8a]">Thiết lập giờ chốt suất ăn</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <Icon name="close" className="text-[#606e8a]" />
                    </button>
                </div>

                {/* Body */}
                <div className="mb-6">
                    {isLoading ? (
                        <div className="flex justify-center py-4">
                            <Icon name="progress_activity" className="animate-spin text-orange-500" />
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-bold text-[#111318] dark:text-white mb-2">
                                    Giờ hết hạn (HH:MM)
                                </label>
                                <input
                                    type="time"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                    className="w-full p-4 rounded-xl bg-[#f5f6f8] dark:bg-slate-800 border-2 border-transparent focus:border-[#c04b00] dark:focus:border-[#c04b00] outline-none text-2xl font-bold text-center text-[#111318] dark:text-white tracking-widest"
                                />
                                <p className="text-xs text-[#606e8a] mt-2 text-center">
                                    Nhân viên sẽ thấy thời gian này trên bảng điều khiển.
                                </p>
                            </div>

                            <div className="mt-4">
                                <label className="block text-sm font-bold text-[#111318] dark:text-white mb-2">
                                    Áp dụng cho
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setOffset('0')}
                                        className={`p-3 rounded-lg border-2 text-sm font-semibold transition-all ${offset === '0'
                                                ? 'border-[#c04b00] bg-[#c04b00]/10 text-[#c04b00]'
                                                : 'border-[#dbdfe6] dark:border-slate-700 text-[#606e8a] hover:border-[#c04b00]/50'
                                            }`}
                                    >
                                        Cùng ngày ăn (Hôm nay)
                                    </button>
                                    <button
                                        onClick={() => setOffset('-1')}
                                        className={`p-3 rounded-lg border-2 text-sm font-semibold transition-all ${offset === '-1'
                                                ? 'border-[#c04b00] bg-[#c04b00]/10 text-[#c04b00]'
                                                : 'border-[#dbdfe6] dark:border-slate-700 text-[#606e8a] hover:border-[#c04b00]/50'
                                            }`}
                                    >
                                        Ngày hôm trước (Hôm qua)
                                    </button>
                                </div>
                            </div>

                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="flex-1 py-3 rounded-xl border border-[#dbdfe6] dark:border-slate-700 text-[#606e8a] font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 py-3 rounded-xl bg-[#c04b00] text-white font-bold shadow-lg shadow-[#c04b00]/25 hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <Icon name="progress_activity" className="animate-spin" />
                                Đang lưu...
                            </>
                        ) : (
                            <>
                                <Icon name="save" />
                                Lưu thay đổi
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div >
    );
}
