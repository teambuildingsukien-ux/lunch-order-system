'use client';

import { useState } from 'react';
import { Crown, Users, UserPlus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SignupRequestsTab from '@/components/platform/SignupRequestsTab';
import TenantsTab from '@/components/platform/TenantsTab';

export default function PlatformDashboard() {
    const [activeTab, setActiveTab] = useState('signup-requests');

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Luxury Header with Tabs */}
            <div className="relative overflow-hidden border-b border-amber-500/20 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(251,191,36,0.1),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(251,191,36,0.05),transparent_40%)]" />

                <div className="relative max-w-7xl mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/25">
                            <Crown className="w-6 h-6 text-slate-950" />
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-200 via-amber-300 to-amber-200 bg-clip-text text-transparent">
                            Platform Management
                        </h1>
                    </div>

                    {/* Tabs Navigation */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="bg-slate-950/50 border border-slate-800 p-1 h-auto">
                            <TabsTrigger
                                value="signup-requests"
                                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-slate-950 data-[state=active]:shadow-lg data-[state=active]:shadow-amber-500/25 text-slate-400 hover:text-slate-200 transition-all px-6 py-3 font-semibold"
                            >
                                <UserPlus className="w-4 h-4 mr-2" />
                                Quản lý đăng ký
                            </TabsTrigger>
                            <TabsTrigger
                                value="tenants"
                                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-slate-950 data-[state=active]:shadow-lg data-[state=active]:shadow-amber-500/25 text-slate-400 hover:text-slate-200 transition-all px-6 py-3 font-semibold"
                            >
                                <Users className="w-4 h-4 mr-2" />
                                Quản lý Tenants
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="signup-requests" className="mt-6">
                            <SignupRequestsTab />
                        </TabsContent>

                        <TabsContent value="tenants" className="mt-6">
                            <TenantsTab />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
