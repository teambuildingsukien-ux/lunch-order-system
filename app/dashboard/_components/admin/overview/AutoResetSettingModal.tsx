'use client';

import { useState, useEffect } from 'react';

// Material Symbol Icon component
const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

interface AutoResetSettingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function AutoResetSettingModal({ isOpen, onClose, onSuccess }: AutoResetSettingModalProps) {
    const [isEnabled, setIsEnabled] = useState(false);
    const [resetTime, setResetTime] = useState('00:00');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch current settings when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchSettings();
        }
    }, [isOpen]);

    const fetchSettings = async () => {
        try {
            setIsLoading(true);
            setError('');

            const response = await fetch('/api/admin/settings/auto-reset');
            if (!response.ok) {
                throw new Error('Failed to fetch settings');
            }

            const result = await response.json();
            setIsEnabled(result.data.enabled);
            setResetTime(result.data.reset_time);
        } catch (err) {
            console.error('Error fetching auto-reset settings:', err);
            setError('Không thể tải cài đặt. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            setError('');

            // Validate time format (HH:MM)
            const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
            if (!timeRegex.test(resetTime)) {
                setError('Định dạng giờ không hợp lệ. Vui lòng nhập theo định dạng HH:MM (00:00 - 23:59)');
                setIsSaving(false);
                return;
            }

            const response = await fetch('/api/admin/settings/auto-reset', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    enabled: isEnabled,
                    reset_time: resetTime,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save settings');
            }

            // Success
            if (onSuccess) {
                onSuccess();
            }
            onClose();
        } catch (err) {
            console.error('Error saving auto-reset settings:', err);
            setError('Không thể lưu cài đặt. Vui lòng thử lại.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <Icon name="autorenew" className="text-green-600 text-[24px]" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Tự động đăng ký lại
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Cấu hình tự động reset trạng thái
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <Icon name="close" className="text-gray-500 text-[20px]" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {isLoading ? (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <p className="mt-2 text-sm text-gray-500">Đang tải...</p>
                        </div>
                    ) : (
                        <>
                            {/* Enable/Disable Toggle */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                                <div className="flex-1">
                                    <label className="text-sm font-semibold text-gray-900 dark:text-white">
                                        Bật tính năng tự động
                                    </label>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Tự động đăng ký lại cho nhân viên đã báo nghỉ
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsEnabled(!isEnabled)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isEnabled ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Time Picker */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                    Thời gian reset
                                </label>
                                <div className="flex items-center gap-3">
                                    <Icon name="schedule" className="text-gray-400 text-[20px]" />
                                    <input
                                        type="time"
                                        value={resetTime}
                                        onChange={(e) => setResetTime(e.target.value)}
                                        disabled={!isEnabled}
                                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    Múi giờ: Việt Nam (GMT+7)
                                </p>
                            </div>

                            {/* Preview */}
                            {isEnabled && (
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <Icon name="info" className="text-green-600 text-[20px] mt-0.5" />
                                        <div>
                                            <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                                                Tính năng đang bật
                                            </p>
                                            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                                                Hệ thống sẽ tự động đăng ký lại vào lúc <strong>{resetTime}</strong> hàng ngày
                                                cho những nhân viên đã báo "Không ăn" trong các ngày trước đó.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Error Message */}
                            {error && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <Icon name="error" className="text-red-600 text-[20px] mt-0.5" />
                                        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-slate-800 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || isLoading}
                        className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Đang lưu...
                            </>
                        ) : (
                            <>
                                <Icon name="save" className="text-[18px]" />
                                Lưu cài đặt
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
