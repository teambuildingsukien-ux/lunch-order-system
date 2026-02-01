import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformOwner, logPlatformAction, getClientIp, getClientUserAgent } from '@/lib/supabase/platform-admin';

/**
 * GET /api/platform/tenants
 * List all tenants with stats (platform owner only)
 */
export async function GET(request: NextRequest) {
    try {
        // Verify platform owner access
        const owner = await requirePlatformOwner();

        const supabase = createAdminClient();

        // Get all tenants with user count and payment transaction count
        const { data: tenants, error } = await supabase
            .from('tenants')
            .select(`
                *,
                users:users(count),
                payment_transactions:payment_transactions(count)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[Platform API] Error fetching tenants:', error);
            throw error;
        }

        // Log action
        await logPlatformAction(
            'list_tenants',
            undefined,
            { tenant_count: tenants?.length || 0 },
            getClientIp(request.headers),
            getClientUserAgent(request.headers)
        );

        return NextResponse.json({
            tenants: tenants || [],
            total: tenants?.length || 0
        });

    } catch (error: any) {
        console.error('[Platform API] GET /api/platform/tenants error:', error);

        if (error.message === 'Platform owner access required') {
            return NextResponse.json(
                { error: 'Forbidden: Platform owner access required' },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/platform/tenants
 * Create new tenant (platform owner only)
 */
export async function POST(request: NextRequest) {
    try {
        // Verify platform owner access
        const owner = await requirePlatformOwner();

        const body = await request.json();
        const { name, slug, plan, max_users } = body;

        // Validation
        if (!name || !slug) {
            return NextResponse.json(
                { error: 'Name and slug are required' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Create tenant
        const { data: tenant, error } = await supabase
            .from('tenants')
            .insert({
                name,
                slug,
                plan: plan || 'trial',
                max_users: max_users || 10,
                subscription_status: 'trialing',
                trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days trial
            })
            .select()
            .single();

        if (error) {
            console.error('[Platform API] Error creating tenant:', error);
            throw error;
        }

        // Log action
        await logPlatformAction(
            'create_tenant',
            tenant.id,
            { name, slug, plan },
            getClientIp(request.headers),
            getClientUserAgent(request.headers)
        );

        return NextResponse.json({
            tenant,
            message: 'Tenant created successfully'
        }, { status: 201 });

    } catch (error: any) {
        console.error('[Platform API] POST /api/platform/tenants error:', error);

        if (error.message === 'Platform owner access required') {
            return NextResponse.json(
                { error: 'Forbidden: Platform owner access required' },
                { status: 403 }
            );
        }

        // Handle duplicate slug
        if (error.code === '23505') {
            return NextResponse.json(
                { error: 'Slug already exists' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
