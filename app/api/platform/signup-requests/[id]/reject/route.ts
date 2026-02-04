import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformOwner } from '@/lib/supabase/platform-admin';

/**
 * POST /api/platform/signup-requests/[id]/reject
 * Reject a signup request with a reason
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Verify platform owner
        const platformOwner = await requirePlatformOwner();

        const supabase = createAdminClient();
        const { id } = await params;
        const body = await request.json();
        const { reason } = body;

        if (!reason || !reason.trim()) {
            return NextResponse.json(
                { error: 'Vui lòng nhập lý do từ chối' },
                { status: 400 }
            );
        }

        // Get signup request
        const { data: signupRequest, error: fetchError } = await supabase
            .from('tenant_signup_requests')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !signupRequest) {
            return NextResponse.json(
                { error: 'Không tìm thấy yêu cầu đăng ký' },
                { status: 404 }
            );
        }

        // Check if already approved/rejected
        if (signupRequest.status === 'approved') {
            return NextResponse.json(
                { error: 'Yêu cầu đã được duyệt. Không thể từ chối.' },
                { status: 400 }
            );
        }
        if (signupRequest.status === 'rejected') {
            return NextResponse.json(
                { error: 'Yêu cầu đã bị từ chối trước đó' },
                { status: 400 }
            );
        }

        // Update signup request
        const { error: updateRequestError } = await supabase
            .from('tenant_signup_requests')
            .update({
                status: 'rejected',
                rejected_by: platformOwner.id,
                rejected_at: new Date().toISOString(),
                rejection_reason: reason,
            })
            .eq('id', id);

        if (updateRequestError) {
            console.error('Update signup request error:', updateRequestError);
            return NextResponse.json(
                { error: 'Không thể cập nhật trạng thái yêu cầu' },
                { status: 500 }
            );
        }

        // Update tenant - Mark as rejected and inactive
        const { error: updateTenantError } = await supabase
            .from('tenants')
            .update({
                approval_status: 'rejected',
                is_active: false,
                status: 'suspended',
            })
            .eq('id', signupRequest.tenant_id);

        if (updateTenantError) {
            console.error('Update tenant error:', updateTenantError);
            return NextResponse.json(
                { error: 'Không thể cập nhật trạng thái tổ chức' },
                { status: 500 }
            );
        }

        // Log to platform audit logs
        await supabase.from('platform_audit_logs').insert({
            action: 'signup_rejected',
            platform_owner_id: platformOwner.id,
            target_tenant_id: signupRequest.tenant_id,
            details: {
                signup_request_id: id,
                company_name: signupRequest.company_name,
                contact_email: signupRequest.contact_email,
                rejection_reason: reason,
            },
        });

        // TODO: Send rejection email to customer (optional)
        // await sendRejectionEmail(signupRequest.contact_email, { reason });

        return NextResponse.json({
            success: true,
            message: 'Đã từ chối yêu cầu đăng ký',
        });
    } catch (error) {
        console.error('Reject signup error:', error);

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
