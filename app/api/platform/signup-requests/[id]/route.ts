import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformOwner } from '@/lib/supabase/platform-admin';

/**
 * GET /api/platform/signup-requests/[id]
 * Get detailed info for one signup request
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Verify platform owner
        await requirePlatformOwner();

        const supabase = createAdminClient();
        const { id } = await params;

        const { data, error } = await supabase
            .from('tenant_signup_requests')
            .select(`
                *,
                tenants:tenant_id (
                    id,
                    name,
                    slug,
                    approval_status,
                    email_verified,
                    is_active,
                    status
                )
            `)
            .eq('id', id)
            .single();

        if (error || !data) {
            return NextResponse.json(
                { error: 'Không tìm thấy yêu cầu đăng ký' },
                { status: 404 }
            );
        }

        return NextResponse.json({ request: data });
    } catch (error) {
        console.error('Get signup request error:', error);

        // Check if it's an auth error from requirePlatformOwner
        if (error instanceof Error && error.message === 'Platform owner access required') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json(
            { error: 'Lỗi hệ thống' },
            { status: 500 }
        );
    }
}
