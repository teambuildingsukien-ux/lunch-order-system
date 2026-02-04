import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformOwner } from '@/lib/supabase/platform-admin';

/**
 * POST /api/platform/signup-requests/[id]/approve
 * Approve a signup request
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

        // Get signup request
        const { data: signupRequest, error: fetchError } = await supabase
            .from('tenant_signup_requests')
            .select('*, tenants:tenant_id(*)')
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
                { error: 'Yêu cầu đã được duyệt trước đó' },
                { status: 400 }
            );
        }
        if (signupRequest.status === 'rejected') {
            return NextResponse.json(
                { error: 'Yêu cầu đã bị từ chối. Không thể duyệt lại.' },
                { status: 400 }
            );
        }

        // Update signup request
        const { error: updateRequestError } = await supabase
            .from('tenant_signup_requests')
            .update({
                status: 'approved',
                approved_by: platformOwner.id,
                approved_at: new Date().toISOString(),
            })
            .eq('id', id);

        if (updateRequestError) {
            console.error('Update signup request error:', updateRequestError);
            return NextResponse.json(
                { error: 'Không thể cập nhật trạng thái yêu cầu' },
                { status: 500 }
            );
        }

        // Update tenant - Mark as approved and active
        const { error: updateTenantError } = await supabase
            .from('tenants')
            .update({
                approval_status: 'approved',
                is_active: true, // NOW active!
            })
            .eq('id', signupRequest.tenant_id);

        if (updateTenantError) {
            console.error('Update tenant error:', updateTenantError);
            return NextResponse.json(
                { error: 'Không thể kích hoạt tổ chức' },
                { status: 500 }
            );
        }

        // Log to platform audit logs
        await supabase.from('platform_audit_logs').insert({
            action: 'signup_approved',
            platform_owner_id: platformOwner.id,
            target_tenant_id: signupRequest.tenant_id,
            details: {
                signup_request_id: id,
                company_name: signupRequest.company_name,
                contact_email: signupRequest.contact_email,
            },
        });

        // TODO: Send welcome email to customer
        // await sendWelcomeEmail(signupRequest.contact_email, { ... });

        return NextResponse.json({
            success: true,
            message: 'Đã duyệt yêu cầu đăng ký thành công',
        });
    } catch (error) {
        console.error('Approve signup error:', error);

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
