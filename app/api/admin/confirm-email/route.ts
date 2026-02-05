import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Manually confirm user email (for testing/admin purposes)
 * POST /api/admin/confirm-email
 */
export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Get user by email
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
            console.error('Error listing users:', listError);
            return NextResponse.json(
                { error: 'Failed to find user' },
                { status: 500 }
            );
        }

        const user = users.find(u => u.email === email);

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Update user to confirm email
        const { data, error: updateError } = await supabase.auth.admin.updateUserById(
            user.id,
            { email_confirm: true }
        );

        if (updateError) {
            console.error('Error confirming email:', updateError);
            return NextResponse.json(
                { error: 'Failed to confirm email' },
                { status: 500 }
            );
        }

        // Update tenant_signup_requests
        const { error: signupUpdateError } = await supabase
            .from('tenant_signup_requests')
            .update({
                email_verified: true,
                email_verified_at: new Date().toISOString(),
                status: 'email_verified'
            })
            .eq('contact_email', email);

        if (signupUpdateError) {
            console.error('Error updating signup request:', signupUpdateError);
        }

        // Update tenant
        const tenantId = user.user_metadata?.tenant_id;
        if (tenantId) {
            await supabase
                .from('tenants')
                .update({
                    email_verified: true,
                    email_verified_at: new Date().toISOString()
                })
                .eq('id', tenantId);
        }

        return NextResponse.json({
            success: true,
            message: 'Email confirmed successfully',
            user: {
                id: user.id,
                email: user.email,
                email_confirmed_at: data.user.email_confirmed_at
            }
        });
    } catch (error) {
        console.error('Confirm email error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
