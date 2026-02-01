import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformOwner, logPlatformAction, getClientIp, getClientUserAgent } from '@/lib/supabase/platform-admin';

/**
 * PUT /api/platform/tenants/[id]/branding
 * Update tenant branding (platform owner only)
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Verify platform owner access
        const owner = await requirePlatformOwner();

        // Next.js 15: params is now a Promise, must await
        const { id: tenantId } = await params;
        const body = await request.json();

        const {
            custom_logo_url,
            custom_primary_color,
            custom_secondary_color,
            custom_fonts,
            branding_settings
        } = body;

        const supabase = createAdminClient();

        // Update tenant branding
        const { data: tenant, error } = await supabase
            .from('tenants')
            .update({
                custom_logo_url,
                custom_primary_color,
                custom_secondary_color,
                custom_fonts,
                branding_settings,
                updated_at: new Date().toISOString()
            })
            .eq('id', tenantId)
            .select()
            .single();

        if (error) {
            console.error('[Platform API] Error updating tenant branding:', error);

            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Tenant not found' },
                    { status: 404 }
                );
            }

            throw error;
        }

        // Log action with details
        await logPlatformAction(
            'update_branding',
            tenantId,
            {
                tenant_name: tenant.name,
                changes: {
                    logo: !!custom_logo_url,
                    colors: !!(custom_primary_color || custom_secondary_color),
                    fonts: !!custom_fonts,
                    settings: !!branding_settings
                }
            },
            getClientIp(request.headers),
            getClientUserAgent(request.headers)
        );

        return NextResponse.json({
            tenant,
            message: 'Branding updated successfully'
        });

    } catch (error: any) {
        console.error('[Platform API] PUT /api/platform/tenants/[id]/branding error:', error);

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
