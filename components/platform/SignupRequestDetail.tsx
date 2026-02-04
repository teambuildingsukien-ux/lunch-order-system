'use client';

import { useState } from 'react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { StatusBadge } from './StatusBadge';
import {
    SignupRequest,
    approveSignupRequest,
    rejectSignupRequest,
    updateSignupNotes,
    formatEmployeeCount,
    formatSignupSource,
    formatDate,
} from '@/lib/platform/signup-requests';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Save, ExternalLink, Crown, Building2, User, Globe, Calendar, Sparkles } from 'lucide-react';

interface SignupRequestDetailProps {
    request: SignupRequest | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onActionComplete?: () => void;
}

export function SignupRequestDetail({
    request,
    open,
    onOpenChange,
    onActionComplete,
}: SignupRequestDetailProps) {
    const [notes, setNotes] = useState(request?.signup_notes || '');
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);

    if (!request) return null;

    const canApprove = request.status === 'pending' || request.status === 'email_verified';
    const canReject = request.status === 'pending' || request.status === 'email_verified';

    const handleSaveNotes = async () => {
        setIsSavingNotes(true);
        try {
            await updateSignupNotes(request.id, notes);
            toast.success('Đã lưu ghi chú');
        } catch (error) {
            toast.error('Không thể lưu ghi chú');
            console.error(error);
        } finally {
            setIsSavingNotes(false);
        }
    };

    const handleApprove = async () => {
        setIsApproving(true);
        try {
            await approveSignupRequest(request.id);
            toast.success('Đã duyệt đăng ký thành công!');
            onOpenChange(false);
            onActionComplete?.();
        } catch (error) {
            toast.error('Không thể duyệt đăng ký');
            console.error(error);
        } finally {
            setIsApproving(false);
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            toast.error('Vui lòng nhập lý do từ chối');
            return;
        }

        setIsRejecting(true);
        try {
            await rejectSignupRequest(request.id, rejectionReason);
            toast.success('Đã từ chối đăng ký');
            setShowRejectDialog(false);
            onOpenChange(false);
            onActionComplete?.();
        } catch (error) {
            toast.error('Không thể từ chối đăng ký');
            console.error(error);
        } finally {
            setIsRejecting(false);
        }
    };

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent className="w-full sm:max-w-3xl overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-l border-slate-800">
                    {/* Premium Header */}
                    <SheetHeader className="pb-6 border-b border-slate-800/50">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/25">
                                <Crown className="w-5 h-5 text-slate-950" />
                            </div>
                            <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-amber-200 to-amber-300 bg-clip-text text-transparent">
                                Chi tiết đăng ký
                            </SheetTitle>
                        </div>
                        <SheetDescription className="text-slate-400">
                            Thông tin công ty và liên hệ
                        </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-6 py-6">
                        {/* Status Section with Gold Card */}
                        <div className="p-6 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 border border-amber-500/20 shadow-lg shadow-amber-500/5">
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles className="w-4 h-4 text-amber-400" />
                                <h3 className="text-sm font-semibold text-amber-300">Trạng thái</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-400">Trạng thái hiện tại</span>
                                    <StatusBadge status={request.status} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-400">Ngày đăng ký</span>
                                    <div className="flex items-center gap-2 text-sm text-slate-300">
                                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                                        {formatDate(request.created_at)}
                                    </div>
                                </div>
                                {request.email_verified_at && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-400">Xác nhận email</span>
                                        <span className="text-sm text-blue-300">{formatDate(request.email_verified_at)}</span>
                                    </div>
                                )}
                                {request.approved_at && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-400">Ngày duyệt</span>
                                        <span className="text-sm text-emerald-300">{formatDate(request.approved_at)}</span>
                                    </div>
                                )}
                                {request.rejected_at && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-400">Ngày từ chối</span>
                                        <span className="text-sm text-red-300">{formatDate(request.rejected_at)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Company Information */}
                        <div className="p-6 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-800">
                            <div className="flex items-center gap-2 mb-4">
                                <Building2 className="w-4 h-4 text-amber-400" />
                                <h3 className="text-sm font-semibold text-amber-300">Thông tin công ty</h3>
                            </div>
                            <div className="space-y-3">
                                <InfoRow label="Tên công ty" value={request.company_name} />
                                <InfoRow label="Địa chỉ" value={request.company_address} />
                                <InfoRow label="Điện thoại" value={request.company_phone} />
                                <InfoRow
                                    label="Website"
                                    value={request.company_website}
                                    isLink
                                />
                                <InfoRow
                                    label="Số lượng nhân viên"
                                    value={formatEmployeeCount(request.employee_count)}
                                />
                            </div>
                        </div>

                        {/* Contact Person */}
                        <div className="p-6 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-800">
                            <div className="flex items-center gap-2 mb-4">
                                <User className="w-4 h-4 text-amber-400" />
                                <h3 className="text-sm font-semibold text-amber-300">Người liên hệ</h3>
                            </div>
                            <div className="space-y-3">
                                <InfoRow label="Họ và tên" value={request.contact_name} />
                                <InfoRow label="Chức vụ" value={request.contact_title} />
                                <InfoRow label="Email" value={request.contact_email} />
                                <InfoRow label="Điện thoại" value={request.contact_phone} />
                            </div>
                        </div>

                        {/* Organization Info */}
                        {request.tenant && (
                            <div className="p-6 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-800">
                                <div className="flex items-center gap-2 mb-4">
                                    <Globe className="w-4 h-4 text-amber-400" />
                                    <h3 className="text-sm font-semibold text-amber-300">Thông tin tổ chức</h3>
                                </div>
                                <div className="space-y-3">
                                    <InfoRow label="Tên tổ chức" value={request.tenant.name} />
                                    <InfoRow label="Slug" value={request.tenant.slug} />
                                    <InfoRow
                                        label="Subdomain"
                                        value={`${request.tenant.slug}.vv-rice.com`}
                                    />
                                    <InfoRow
                                        label="Trạng thái tenant"
                                        value={request.tenant.is_active ? 'Active' : 'Inactive'}
                                        highlight={request.tenant.is_active ? 'success' : 'error'}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Signup Source - Compact */}
                        <div className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-800">
                            <span className="text-sm text-slate-400">Nguồn đăng ký</span>
                            <span className="text-sm font-medium text-amber-300">{formatSignupSource(request.signup_source)}</span>
                        </div>

                        {/* Rejection Reason */}
                        {request.status === 'rejected' && request.rejection_reason && (
                            <div className="p-6 rounded-xl bg-gradient-to-br from-red-900/20 to-red-800/20 border border-red-500/30">
                                <h3 className="text-sm font-semibold mb-3 text-red-400">
                                    Lý do từ chối
                                </h3>
                                <p className="text-sm text-red-200/80">
                                    {request.rejection_reason}
                                </p>
                            </div>
                        )}

                        {/* Sales Notes */}
                        <div className="p-6 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-800">
                            <Label htmlFor="notes" className="text-sm font-semibold text-amber-300 flex items-center gap-2 mb-3">
                                <Save className="w-4 h-4" />
                                Ghi chú (Sales)
                            </Label>
                            <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Thêm ghi chú về khách hàng này..."
                                className="min-h-[120px] bg-slate-950 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:border-amber-500"
                            />
                            <Button
                                onClick={handleSaveNotes}
                                disabled={isSavingNotes || notes === request.signup_notes}
                                className="mt-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-lg shadow-amber-500/25"
                                size="sm"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {isSavingNotes ? 'Đang lưu...' : 'Lưu ghi chú'}
                            </Button>
                        </div>
                    </div>

                    {/* Premium Action Buttons */}
                    <div className="sticky bottom-0 flex gap-3 pt-6 pb-4 border-t border-slate-800 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent backdrop-blur-sm">
                        {canApprove && (
                            <Button
                                onClick={handleApprove}
                                disabled={isApproving}
                                className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all font-semibold"
                            >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                {isApproving ? 'Đang duyệt...' : 'Duyệt đăng ký'}
                            </Button>
                        )}
                        {canReject && (
                            <Button
                                onClick={() => setShowRejectDialog(true)}
                                disabled={isRejecting}
                                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all font-semibold"
                            >
                                <XCircle className="w-4 h-4 mr-2" />
                                Từ chối
                            </Button>
                        )}
                        <Button
                            onClick={() => onOpenChange(false)}
                            className="border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:border-amber-500/50"
                            variant="outline"
                        >
                            Đóng
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Luxury Reject Dialog */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent className="bg-gradient-to-br from-slate-950 to-slate-900 border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-red-400">Từ chối đăng ký</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Vui lòng nhập lý do từ chối đăng ký này. Lý do sẽ được ghi lại trong hệ
                            thống.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2 py-4">
                        <Label htmlFor="rejection-reason" className="text-amber-300">Lý do từ chối *</Label>
                        <Textarea
                            id="rejection-reason"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Ví dụ: Công ty không đủ điều kiện..."
                            className="min-h-[120px] bg-slate-950 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:border-red-500"
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowRejectDialog(false)}
                            disabled={isRejecting}
                            className="border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300"
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handleReject}
                            disabled={isRejecting || !rejectionReason.trim()}
                            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/30"
                        >
                            {isRejecting ? 'Đang từ chối...' : 'Xác nhận từ chối'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

// Luxury Info Row Component
function InfoRow({
    label,
    value,
    isLink,
    highlight,
}: {
    label: string;
    value?: string;
    isLink?: boolean;
    highlight?: 'success' | 'error';
}) {
    const highlightColors = {
        success: 'text-emerald-300',
        error: 'text-red-300',
    };

    return (
        <div className="flex items-start justify-between gap-4 group">
            <span className="text-sm text-slate-400 min-w-[140px]">{label}</span>
            {value ? (
                isLink ? (
                    <a
                        href={value.startsWith('http') ? value : `https://${value}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors group-hover:underline"
                    >
                        {value}
                        <ExternalLink className="w-3 h-3" />
                    </a>
                ) : (
                    <span className={`text-sm flex-1 text-right font-medium ${highlight ? highlightColors[highlight] : 'text-slate-200'}`}>
                        {value}
                    </span>
                )
            ) : (
                <span className="text-sm text-slate-600 flex-1 text-right">—</span>
            )}
        </div>
    );
}
