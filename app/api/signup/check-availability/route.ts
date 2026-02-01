import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateSlug, isReservedSlug } from '@/lib/utils/slug';

/**
 * Check availability of organization slug and admin email
 * POST /api/signup/check-availability
 */
export async function POST(request: NextRequest) {
    try {
        const { slug, email } = await request.json();

        // Validate input
        if (!slug && !email) {
            return NextResponse.json(
                { available: false, message: 'Slug hoặc email là bắt buộc' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Check slug if provided
        if (slug) {
            // Validate format
            if (!validateSlug(slug)) {
                return NextResponse.json({
                    available: false,
                    field: 'slug',
                    message: 'Slug không hợp lệ. Chỉ chấp nhận chữ thường, số và dấu gạch ngang (3-50 ký tự)',
                });
            }

            // Check if reserved
            if (isReservedSlug(slug)) {
                return NextResponse.json({
                    available: false,
                    field: 'slug',
                    message: 'Slug này đã được hệ thống sử dụng',
                });
            }

            // Check database
            const { data: existingTenant } = await supabase
                .from('tenants')
                .select('id')
                .eq('slug', slug)
                .single();

            if (existingTenant) {
                return NextResponse.json({
                    available: false,
                    field: 'slug',
                    message: 'Slug này đã được sử dụng bởi tổ chức khác',
                });
            }
        }

        // Check email if provided
        if (email) {
            // Check in Auth users
            const { data: existingUser } = await supabase.auth.admin.listUsers();
            const emailExists = existingUser.users.some(
                (user) => user.email?.toLowerCase() === email.toLowerCase()
            );

            if (emailExists) {
                return NextResponse.json({
                    available: false,
                    field: 'email',
                    message: 'Email này đã được đăng ký',
                });
            }
        }

        return NextResponse.json({
            available: true,
            message: 'Có thể sử dụng',
        });
    } catch (error) {
        console.error('Check availability error:', error);
        return NextResponse.json(
            { available: false, message: 'Lỗi khi kiểm tra' },
            { status: 500 }
        );
    }
}
