'use client';

import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Sparkles } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { SignupRequestDetail } from './SignupRequestDetail';
import { formatEmployeeCount, formatRelativeTime, type SignupRequest } from '@/lib/platform/signup-requests';

interface SignupRequestsTableProps {
    requests: SignupRequest[];
    loading: boolean;
    onRequestUpdated: () => void;
}

export function SignupRequestsTable({ requests, loading, onRequestUpdated }: SignupRequestsTableProps) {
    const [selectedRequest, setSelectedRequest] = useState<SignupRequest | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    function handleViewDetails(request: SignupRequest) {
        setSelectedRequest(request);
        setDetailOpen(true);
    }

    function handleDetailClose() {
        setDetailOpen(false);
        setSelectedRequest(null);
        onRequestUpdated();
    }

    if (loading) {
        return (
            <Card className="border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 shadow-xl">
                <div className="p-12 text-center">
                    <div className="inline-flex items-center gap-3 text-amber-400">
                        <Sparkles className="w-5 h-5 animate-pulse" />
                        <span className="text-lg font-medium">Đang tải dữ liệu...</span>
                        <Sparkles className="w-5 h-5 animate-pulse" />
                    </div>
                </div>
            </Card>
        );
    }

    if (requests.length === 0) {
        return (
            <Card className="border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 shadow-xl">
                <div className="p-12 text-center">
                    <div className="mb-4 inline-flex p-4 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/30">
                        <Sparkles className="w-8 h-8 text-amber-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-200 mb-2">Chưa có yêu cầu nào</h3>
                    <p className="text-slate-400">Không tìm thấy yêu cầu đăng ký phù hợp với bộ lọc hiện tại</p>
                </div>
            </Card>
        );
    }

    return (
        <>
            <Card className="border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-slate-800 hover:bg-slate-800/50">
                                <TableHead className="text-amber-400 font-semibold">Công ty</TableHead>
                                <TableHead className="text-amber-400 font-semibold">Người liên hệ</TableHead>
                                <TableHead className="text-amber-400 font-semibold">Email</TableHead>
                                <TableHead className="text-amber-400 font-semibold">Số nhân viên</TableHead>
                                <TableHead className="text-amber-400 font-semibold">Trạng thái</TableHead>
                                <TableHead className="text-amber-400 font-semibold">Ngày đăng ký</TableHead>
                                <TableHead className="text-amber-400 font-semibold text-right">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.map((request) => (
                                <TableRow
                                    key={request.id}
                                    className="border-slate-800 hover:bg-gradient-to-r hover:from-amber-500/5 hover:to-transparent transition-all duration-200 group"
                                >
                                    <TableCell className="font-medium text-slate-200">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 h-8 bg-gradient-to-b from-amber-500 to-amber-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                            {request.company_name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-300">{request.contact_name}</TableCell>
                                    <TableCell className="text-slate-400 font-mono text-sm">{request.contact_email}</TableCell>
                                    <TableCell className="text-slate-300">{formatEmployeeCount(request.employee_count)}</TableCell>
                                    <TableCell>
                                        <StatusBadge status={request.status} />
                                    </TableCell>
                                    <TableCell className="text-slate-400 text-sm">{formatRelativeTime(request.created_at)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleViewDetails(request)}
                                            className="gap-1.5 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
                                        >
                                            <Eye className="w-4 h-4" />
                                            Xem
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Premium Footer */}
                <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">
                            Hiển thị <span className="text-amber-400 font-semibold">{requests.length}</span> yêu cầu
                        </span>
                        <div className="h-1 flex-1 mx-8 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent rounded-full" />
                        <span className="text-slate-500 text-xs">Platform Dashboard v2.0</span>
                    </div>
                </div>
            </Card>

            {/* Detail Sheet */}
            {selectedRequest && (
                <SignupRequestDetail
                    request={selectedRequest}
                    open={detailOpen}
                    onOpenChange={handleDetailClose}
                />
            )}
        </>
    );
}
