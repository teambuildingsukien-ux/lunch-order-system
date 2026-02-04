'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, TrendingUp, CheckCircle2, XCircle, Mail } from 'lucide-react';
import { SignupRequestsTable } from '@/components/platform/SignupRequestsTable';
import { fetchSignupRequests, type SignupRequest } from '@/lib/platform/signup-requests';

export default function SignupRequestsTab() {
    const [requests, setRequests] = useState<SignupRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Stats
    const totalRequests = requests.length;
    const pendingCount = requests.filter(r => r.status === 'pending').length;
    const approvedCount = requests.filter(r => r.status === 'approved').length;
    const rejectedCount = requests.filter(r => r.status === 'rejected').length;
    const emailVerifiedCount = requests.filter(r => r.email_verified).length;

    useEffect(() => {
        loadRequests();
    }, [statusFilter]);

    async function loadRequests() {
        setLoading(true);
        try {
            const data = await fetchSignupRequests({
                status: statusFilter === 'all' ? undefined : statusFilter,
                search: search || undefined
            });
            setRequests(data);
        } catch (error) {
            console.error('Failed to load requests:', error);
        } finally {
            setLoading(false);
        }
    }

    function handleSearch() {
        loadRequests();
    }

    return (
        <div className="space-y-6">
            {/* Premium Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Total */}
                <Card className="relative overflow-hidden border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 shadow-xl hover:shadow-amber-500/10 transition-all duration-300 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-400">Tổng số</p>
                            <TrendingUp className="w-4 h-4 text-amber-400" />
                        </div>
                        <p className="text-3xl font-bold text-amber-300">{totalRequests}</p>
                        <div className="mt-2 h-1 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full" />
                    </div>
                </Card>

                {/* Pending */}
                <Card className="relative overflow-hidden border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 shadow-xl hover:shadow-amber-500/10 transition-all duration-300 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-400">Chờ xác nhận</p>
                            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        </div>
                        <p className="text-3xl font-bold text-white">{pendingCount}</p>
                        <div className="mt-2 h-1 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full" />
                    </div>
                </Card>

                {/* Approved */}
                <Card className="relative overflow-hidden border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-400">Đã duyệt</p>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        </div>
                        <p className="text-3xl font-bold text-white">{approvedCount}</p>
                        <div className="mt-2 h-1 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full" />
                    </div>
                </Card>

                {/* Rejected */}
                <Card className="relative overflow-hidden border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 shadow-xl hover:shadow-red-500/10 transition-all duration-300 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-400">Từ chối</p>
                            <XCircle className="w-4 h-4 text-red-400" />
                        </div>
                        <p className="text-3xl font-bold text-white">{rejectedCount}</p>
                        <div className="mt-2 h-1 bg-gradient-to-r from-red-400 to-red-500 rounded-full" />
                    </div>
                </Card>

                {/* Email Verified */}
                <Card className="relative overflow-hidden border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 shadow-xl hover:shadow-blue-500/10 transition-all duration-300 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-400">Xác nhận email</p>
                            <Mail className="w-4 h-4 text-blue-400" />
                        </div>
                        <p className="text-3xl font-bold text-white">{emailVerifiedCount}</p>
                        <div className="mt-2 h-1 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full" />
                    </div>
                </Card>
            </div>

            {/* Search & Filters */}
            <Card className="border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 shadow-xl">
                <div className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Status Filter */}
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full md:w-48 bg-slate-950 border-slate-700 text-slate-200 hover:border-amber-500/50 transition-colors">
                                <SelectValue placeholder="Tất cả" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-700">
                                <SelectItem value="all" className="text-slate-200 hover:bg-slate-800">Tất cả</SelectItem>
                                <SelectItem value="pending" className="text-slate-200 hover:bg-slate-800">Chờ xác nhận</SelectItem>
                                <SelectItem value="email_verified" className="text-slate-200 hover:bg-slate-800">Đã xác nhận email</SelectItem>
                                <SelectItem value="approved" className="text-slate-200 hover:bg-slate-800">Đã duyệt</SelectItem>
                                <SelectItem value="rejected" className="text-slate-200 hover:bg-slate-800">Từ chối</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Search */}
                        <div className="flex-1 flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Tìm kiếm công ty, người liên hệ, email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className="pl-10 bg-slate-950 border-slate-700 text-slate-200 placeholder:text-slate-500 hover:border-amber-500/50 focus:border-amber-500 transition-colors"
                                />
                            </div>
                            <Button
                                onClick={handleSearch}
                                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-semibold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all"
                            >
                                Tìm kiếm
                            </Button>
                        </div>
                    </div>

                    {/* Active Filters */}
                    {(statusFilter !== 'all' || search) && (
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-800">
                            <span className="text-sm text-slate-400">Hiển thị:</span>
                            <div className="flex flex-wrap gap-2">
                                {statusFilter !== 'all' && (
                                    <Badge variant="outline" className="bg-amber-500/10 border-amber-500/30 text-amber-300">
                                        {statusFilter}
                                    </Badge>
                                )}
                                {search && (
                                    <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-300">
                                        "{search}"
                                    </Badge>
                                )}
                            </div>
                            <span className="text-sm text-slate-500 ml-auto">
                                Hiển thị {requests.length} / {totalRequests} yêu cầu
                            </span>
                        </div>
                    )}
                </div>
            </Card>

            {/* Table */}
            <SignupRequestsTable
                requests={requests}
                loading={loading}
                onRequestUpdated={loadRequests}
            />
        </div>
    );
}
