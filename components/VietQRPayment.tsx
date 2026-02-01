'use client';

import { useState } from 'react';
import Image from 'next/image';
import { formatVND } from '@/lib/vietqr/config';

// Material Symbol Icon component
const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

interface VietQRPaymentProps {
    plan: 'basic' | 'pro' | 'enterprise';
    onBack: () => void;
}

export function VietQRPayment({ plan, onBack }: VietQRPaymentProps) {
    const [loading, setLoading] = useState(false);
    const [qrData, setQRData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [checking, setChecking] = useState(false);

    async function generateQR() {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/billing/create-vietqr-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate QR code');
            }

            setQRData(data);
        } catch (err: any) {
            console.error('QR generation error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function checkPaymentStatus() {
        if (!qrData) return;

        try {
            setChecking(true);

            const response = await fetch(
                `/api/billing/create-vietqr-payment?reference=${qrData.paymentReference}`
            );

            const data = await response.json();

            if (data.status === 'completed') {
                // Payment confirmed! Reload page to show new subscription
                window.location.href = '/dashboard?payment_success=true';
            } else {
                alert('Chưa nhận được thanh toán. Vui lòng đợi vài phút sau khi chuyển khoản.');
            }
        } catch (err: any) {
            console.error('Status check error:', err);
            alert('Không thể kiểm tra trạng thái. Vui lòng thử lại.');
        } finally {
            setChecking(false);
        }
    }

    // Generate QR on mount if not already generated
    if (!qrData && !loading && !error) {
        generateQR();
    }

    if (loading) {
        return (
            <div className="text-center py-12">
                <Icon name="progress_activity" className="text-[60px] text-[#c04b00] animate-spin mx-auto" />
                <p className="mt-4 text-slate-600 dark:text-slate-400">Đang tạo mã QR...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <Icon name="error" className="text-[60px] text-red-500 mx-auto" />
                <p className="mt-4 text-red-600 dark:text-red-400">{error}</p>
                <button
                    onClick={onBack}
                    className="mt-6 bg-slate-200 dark:bg-slate-700 px-6 py-3 rounded-xl font-bold"
                >
                    Quay lại
                </button>
            </div>
        );
    }

    if (!qrData) return null;

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                >
                    <Icon name="arrow_back" className="text-[24px]" />
                </button>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Thanh toán bằng VietQR
                </h2>
            </div>

            {/* Payment Info Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 mb-6">
                {/* QR Code */}
                <div className="text-center mb-6">
                    <div className="inline-block bg-white p-4 rounded-2xl">
                        <Image
                            src={qrData.qrCode}
                            alt="VietQR Payment Code"
                            width={300}
                            height={300}
                            className="rounded-xl"
                        />
                    </div>
                    <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                        Quét mã QR bằng app ngân hàng để thanh toán
                    </p>
                </div>

                {/* Payment Details */}
                <div className="space-y-3 bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl">
                    <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Ngân hàng:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                            {qrData.bankInfo.bankId === '970415' ? 'VietinBank' : 'Ngân hàng'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Số tài khoản:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {qrData.bankInfo.accountNumber}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Tên tài khoản:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                            {qrData.bankInfo.accountName}
                        </span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                        <span className="text-slate-600 dark:text-slate-400">Số tiền:</span>
                        <span className="text-2xl font-bold text-[#c04b00] dark:text-orange-400">
                            {formatVND(qrData.amount)}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Nội dung CK:</span>
                        <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                            {qrData.paymentReference}
                        </span>
                    </div>
                </div>

                {/* Instructions */}
                <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
                    <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                        <Icon name="info" className="text-[24px]" />
                        Hướng dẫn thanh toán
                    </h3>
                    <ol className="space-y-2 text-blue-800 dark:text-blue-200">
                        <li className="flex items-start gap-2">
                            <span className="font-bold">1.</span>
                            <span>Mở app ngân hàng và chọn chức năng quét QR</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="font-bold">2.</span>
                            <span>Quét mã QR phía trên</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="font-bold">3.</span>
                            <span>Kiểm tra thông tin và xác nhận thanh toán</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="font-bold">4.</span>
                            <span>Sau khi chuyển khoản thành công, nhấn nút "Đã chuyển khoản" bên dưới</span>
                        </li>
                    </ol>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex gap-3">
                    <button
                        onClick={checkPaymentStatus}
                        disabled={checking}
                        className="flex-1 bg-[#c04b00] hover:bg-[#a03e00] text-white px-8 py-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                    >
                        {checking ? (
                            <>
                                <Icon name="progress_activity" className="text-[20px] animate-spin" />
                                Đang kiểm tra...
                            </>
                        ) : (
                            <>
                                <Icon name="check_circle" className="text-[20px]" />
                                Đã chuyển khoản
                            </>
                        )}
                    </button>
                    <button
                        onClick={onBack}
                        className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-6 py-4 rounded-xl font-bold transition-all hover:bg-slate-300 dark:hover:bg-slate-600"
                    >
                        Hủy
                    </button>
                </div>

                {/* Note */}
                <p className="mt-4 text-xs text-center text-slate-500 dark:text-slate-400">
                    💡 Thanh toán được xác nhận tự động trong vòng 1-2 phút sau khi chuyển khoản thành công
                </p>
            </div>
        </div>
    );
}
