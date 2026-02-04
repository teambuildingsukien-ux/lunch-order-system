import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformOwner } from '@/lib/supabase/platform-admin';

/**
 * PATCH /api/platform/signup-requests/[id]/notes
 * Update sales notes for a signup request
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Verify platform owner
        await requirePlatformOwner();

        const supabase = createAdminClient();
        const { id } = await params;
        const body = await request.json();
        const { notes } = body;

        // Update signup request notes
        const { error: updateError } = await supabase
            .from('tenant_signup_requests')
            .update({ signup_notes: notes })
            .eq('id', id);

        if (updateError) {
            console.error('Update notes error:', updateError);
            return NextResponse.json(
                { error: 'Không thể cập nhật ghi chú' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Đã cập nhật ghi chú',
        });
    } catch (error) {
        console.error('Update notes error:', error);

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
