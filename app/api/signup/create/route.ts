import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateSlug, isReservedSlug } from '@/lib/utils/slug';
import { calculateTrialEnd } from '@/lib/utils/trial';

/**
 * Create new tenant and admin user
 * POST /api/signup/create
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { organization, admin } = body;

        // Validate required fields
        if (!organization?.name || !organization?.slug) {
            return NextResponse.json(
                { error: 'Thông tin tổ chức không đầy đủ' },
                { status: 400 }
            );
        }

        if (!admin?.email || !admin?.password || !admin?.full_name) {
            return NextResponse.json(
                { error: 'Thông tin admin không đầy đủ' },
                { status: 400 }
            );
        }

        // Validate slug
        if (!validateSlug(organization.slug) || isReservedSlug(organization.slug)) {
            return NextResponse.json(
                { error: 'Slug không hợp lệ' },
                { status: 400 }
            );
        }

        // Validate password strength
        if (admin.password.length < 8) {
            return NextResponse.json(
                { error: 'Mật khẩu phải có ít nhất 8 ký tự' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Double-check slug availability
        const { data: existingTenant } = await supabase
            .from('tenants')
            .select('id')
            .eq('slug', organization.slug)
            .single();

        if (existingTenant) {
            return NextResponse.json(
                { error: 'Slug đã được sử dụng' },
                { status: 409 }
            );
        }

        // Step 1: Create tenant
        const trialEndsAt = calculateTrialEnd(14); // 14 days trial
        const { data: tenant, error: tenantError } = await supabase
            .from('tenants')
            .insert({
                name: organization.name,
                slug: organization.slug,
                trial_ends_at: trialEndsAt.toISOString(),
                subscription_status: 'trialing',
                is_active: true,
                status: 'trial',
            })
            .select()
            .single();

        if (tenantError || !tenant) {
            console.error('Tenant creation error:', tenantError);
            return NextResponse.json(
                { error: 'Không thể tạo tổ chức' },
                { status: 500 }
            );
        }

        // Step 2: Create admin user in Auth
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: admin.email,
            password: admin.password,
            email_confirm: false, // Require email verification
            user_metadata: {
                full_name: admin.full_name,
                tenant_id: tenant.id,
            },
        });

        if (authError || !authUser.user) {
            console.error('Auth user creation error:', authError);

            // Rollback: Delete tenant
            await supabase.from('tenants').delete().eq('id', tenant.id);

            return NextResponse.json(
                { error: 'Không thể tạo tài khoản admin' },
                { status: 500 }
            );
        }

        // Step 3: Create user record in public.users
        console.log('[SIGNUP] Creating user record:', {
            id: authUser.user.id,
            email: admin.email,
            full_name: admin.full_name,
            role: 'admin',
            tenant_id: tenant.id,
        });

        const { error: userError } = await supabase
            .from('users')
            .insert({
                id: authUser.user.id,
                email: admin.email,
                full_name: admin.full_name,
                department: 'Management', // Default department for admin users
                role: 'admin',
                tenant_id: tenant.id,
                is_active: true,
            });

        if (userError) {
            console.error('[SIGNUP] User record creation error:', {
                message: userError.message,
                details: userError.details,
                hint: userError.hint,
                code: userError.code,
            });

            // Rollback: Delete auth user and tenant
            await supabase.auth.admin.deleteUser(authUser.user.id);
            await supabase.from('tenants').delete().eq('id', tenant.id);

            return NextResponse.json(
                { error: 'Không thể tạo hồ sơ người dùng' },
                { status: 500 }
            );
        }

        // Step 4: Send verification email
        // Note: Supabase Auth automatically sends confirmation email if SMTP is configured
        // If using custom email service (Resend), implement here

        // Log activity
        await fetch(`${request.nextUrl.origin}/api/activity/log`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: authUser.user.id,
                action: 'organization_created',
                details: {
                    tenant_id: tenant.id,
                    organization_name: organization.name,
                },
            }),
        });

        return NextResponse.json({
            success: true,
            message: 'Tổ chức đã được tạo thành công! Vui lòng kiểm tra email để xác thực tài khoản.',
            tenant: {
                id: tenant.id,
                name: tenant.name,
                slug: tenant.slug,
            },
            admin: {
                id: authUser.user.id,
                email: admin.email,
            },
        });
    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json(
            { error: 'Lỗi hệ thống khi đăng ký' },
            { status: 500 }
        );
    }
}
