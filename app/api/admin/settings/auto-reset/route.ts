import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/settings/auto-reset
 * Fetch auto-reset configuration settings
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Fetch all auto-reset settings
        const { data: settings, error } = await supabase
            .from('system_settings')
            .select('key, value')
            .in('key', ['auto_reset_enabled', 'auto_reset_time', 'auto_reset_last_run']);

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch settings' },
                { status: 500 }
            );
        }

        // Transform array to object
        const settingsMap: Record<string, string> = {};
        settings?.forEach((item) => {
            settingsMap[item.key] = item.value;
        });

        // Parse and format response
        const response = {
            enabled: settingsMap.auto_reset_enabled === 'true',
            reset_time: settingsMap.auto_reset_time || '00:00',
            last_run: settingsMap.auto_reset_last_run || '',
        };

        return NextResponse.json({
            success: true,
            data: response,
        });

    } catch (error) {
        console.error('Error in GET /api/admin/settings/auto-reset:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/admin/settings/auto-reset
 * Update auto-reset configuration settings
 */
export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Parse request body
        const body = await request.json();
        const { enabled, reset_time } = body;

        // Validate inputs
        if (typeof enabled !== 'boolean') {
            return NextResponse.json(
                { error: 'Invalid enabled value' },
                { status: 400 }
            );
        }

        // Validate time format (HH:MM)
        const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
        if (!timeRegex.test(reset_time)) {
            return NextResponse.json(
                { error: 'Invalid time format. Expected HH:MM (00:00 - 23:59)' },
                { status: 400 }
            );
        }

        // Upsert settings (insert if not exists, update if exists)
        const updates = [
            {
                key: 'auto_reset_enabled',
                value: enabled.toString(),
                description: 'Enable automatic meal registration reset for not_eating orders',
            },
            {
                key: 'auto_reset_time',
                value: reset_time,
                description: 'Time to automatically reset meal registrations (HH:MM in Asia/Ho_Chi_Minh timezone)',
            },
        ];

        for (const update of updates) {
            const { error } = await supabase
                .from('system_settings')
                .upsert(
                    {
                        key: update.key,
                        value: update.value,
                        description: update.description,
                        updated_at: new Date().toISOString(),
                    },
                    {
                        onConflict: 'key',
                    }
                );

            if (error) {
                console.error(`Error upserting ${update.key}:`, error);
                return NextResponse.json(
                    { error: `Failed to save ${update.key}` },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Settings updated successfully',
            data: {
                enabled,
                reset_time,
            },
        });

    } catch (error) {
        console.error('Error in PUT /api/admin/settings/auto-reset:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
