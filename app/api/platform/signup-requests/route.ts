import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformOwner } from '@/lib/supabase/platform-admin';

/**
 * GET /api/platform/signup-requests
 * List all signup requests with filtering
 */
export async function GET(request: NextRequest) {
    try {
        // Verify platform owner
        await requirePlatformOwner();

        const supabase = createAdminClient();
        const { searchParams } = request.nextUrl;

        // Filters
        const status = searchParams.get('status'); // pending, email_verified, approved, rejected
        const search = searchParams.get('search'); // Search by company name or email

        let query = supabase
            .from('tenant_signup_requests')
            .select(`
                *,
                tenants:tenant_id (
                    id,
                    name,
                    slug,
                    approval_status,
                    email_verified
                )
            `)
            .order('created_at', { ascending: false });

        // Apply filters
        if (status) {
            query = query.eq('status', status);
        }

        if (search) {
            query = query.or(`company_name.ilike.%${search}%,contact_email.ilike.%${search}%,contact_name.ilike.%${search}%`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Fetch signup requests error:', error);
            return NextResponse.json(
                { error: 'Không thể tải danh sách đăng ký' },
                { status: 500 }
            );
        }

        return NextResponse.json({ requests: data });
    } catch (error) {
        console.error('Get signup requests error:', error);
        return NextResponse.json(
            { error: 'Lỗi hệ thống' },
            { status: 500 }
        );
    }
}
