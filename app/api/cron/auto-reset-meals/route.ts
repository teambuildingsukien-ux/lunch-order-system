import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/cron/auto-reset-meals
 * Cron job endpoint to automatically reset meal registrations
 * 
 * This endpoint is called by Vercel Cron (or manual trigger for testing)
 * to reset orders with status='not_eating' from previous days back to default.
 */
export async function POST(request: NextRequest) {
    try {
        // Security: Verify Vercel Cron Secret or Authorization header
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            console.warn('Unauthorized cron access attempt');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const supabase = await createClient();

        console.log('🔄 Auto-reset cron job started at:', new Date().toISOString());

        // Step 1: Fetch settings
        const { data: settings, error: settingsError } = await supabase
            .from('system_settings')
            .select('key, value')
            .in('key', ['auto_reset_enabled', 'auto_reset_time', 'auto_reset_last_run']);

        if (settingsError) {
            console.error('Failed to fetch settings:', settingsError);
            return NextResponse.json(
                { error: 'Failed to fetch settings' },
                { status: 500 }
            );
        }

        // Parse settings
        const settingsMap: Record<string, string> = {};
        settings?.forEach((item) => {
            settingsMap[item.key] = item.value;
        });

        const isEnabled = settingsMap.auto_reset_enabled === 'true';
        const resetTime = settingsMap.auto_reset_time || '00:00';
        const lastRun = settingsMap.auto_reset_last_run || '';

        // Step 2: Check if feature is enabled
        if (!isEnabled) {
            console.log('❌ Auto-reset feature is disabled');
            return NextResponse.json({
                success: true,
                message: 'Auto-reset is disabled',
                skipped: true,
            });
        }

        // Step 3: Check current time (Vietnam timezone)
        const now = new Date();
        const vnTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
        const currentHour = vnTime.getHours().toString().padStart(2, '0');
        const currentMinute = vnTime.getMinutes().toString().padStart(2, '0');
        const currentTime = `${currentHour}:${currentMinute}`;

        console.log(`⏰ Current time (VN): ${currentTime}, Reset time: ${resetTime}`);

        // Allow ±5 minutes tolerance for cron timing variations
        const [resetHour, resetMinute] = resetTime.split(':').map(Number);
        const currentMinutes = parseInt(currentHour) * 60 + parseInt(currentMinute);
        const resetMinutes = resetHour * 60 + resetMinute;
        const minutesDiff = Math.abs(currentMinutes - resetMinutes);

        if (minutesDiff > 30) { // 30 minutes tolerance
            console.log(`⏭️ Not time to reset yet (diff: ${minutesDiff} minutes)`);
            return NextResponse.json({
                success: true,
                message: 'Not scheduled time yet',
                skipped: true,
                current_time: currentTime,
                reset_time: resetTime,
            });
        }

        // Step 4: Check if already ran today
        const today = vnTime.toISOString().split('T')[0];
        if (lastRun.startsWith(today)) {
            console.log('✅ Already ran today, skipping');
            return NextResponse.json({
                success: true,
                message: 'Already ran today',
                skipped: true,
                last_run: lastRun,
            });
        }

        // Step 5: Reset orders with status='not_eating' from previous days
        console.log('🔄 Resetting not_eating orders...');

        const { data: resetOrders, error: resetError } = await supabase
            .from('orders')
            .update({
                status: 'eating',
                updated_at: new Date().toISOString(),
            })
            .eq('status', 'not_eating')
            .lt('date', today)
            .select();

        if (resetError) {
            console.error('Failed to reset orders:', resetError);
            return NextResponse.json(
                { error: 'Failed to reset orders' },
                { status: 500 }
            );
        }

        const resetCount = resetOrders?.length || 0;
        console.log(`✅ Reset ${resetCount} orders`);

        // Step 6: Update last_run timestamp
        const { error: updateError } = await supabase
            .from('system_settings')
            .update({
                value: now.toISOString(),
                updated_at: now.toISOString(),
            })
            .eq('key', 'auto_reset_last_run');

        if (updateError) {
            console.error('Failed to update last_run:', updateError);
            // Non-critical error, continue
        }

        // Step 7: Log activity - SKIPPED
        // NOTE: activity_logs table has NOT NULL constraint on tenant_id
        // System cron jobs don't have tenant context, so we skip audit logging
        // Console logs are sufficient for system operations
        console.log(`📋 Activity: auto_reset_meals completed with ${resetCount} orders reset`);

        console.log('🎉 Auto-reset completed successfully');

        return NextResponse.json({
            success: true,
            message: 'Auto-reset completed',
            data: {
                reset_count: resetCount,
                executed_at: now.toISOString(),
                next_run: `${today} ${resetTime}`,
            },
        });

    } catch (error) {
        console.error('Error in auto-reset cron job:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Allow GET for manual testing in development
export async function GET(request: NextRequest) {
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json(
            { error: 'GET method only available in development' },
            { status: 403 }
        );
    }

    return POST(request);
}
