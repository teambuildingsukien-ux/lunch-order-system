import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'
import { getVietnamDateString } from '@/lib/utils/date-helpers';

export async function GET(request: NextRequest) {
    const supabase = await createClient()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return NextResponse.json(
            { code: 'ERR_UNAUTHORIZED', message: 'Not authenticated' },
            { status: 401 }
        )
    }

    try {
        // Query params
        const searchParams = request.nextUrl.searchParams
        const days = parseInt(searchParams.get('days') || '30')
        const page = parseInt(searchParams.get('page') || '1')
        const pageSize = parseInt(searchParams.get('page_size') || '50')

        // Validate params
        if (days > 90) {
            return NextResponse.json(
                { code: 'ERR_VALIDATION', message: 'Max days is 90' },
                { status: 400 }
            )
        }

        // ... (inside GET)

        // Calculate date range
        // For server-side, ensuring consistent "Today" in Vietnam Time
        const todayStr = getVietnamDateString();
        const endDate = new Date(todayStr); // 00:00 VN Time roughly (but object is local/UTC, doesn't matter as long as we shift)

        // Actually simplest is: filter by string comparison
        // If we want "Last 30 days" INCLUDING today:
        // We need a date N days ago. 
        const d = new Date(todayStr);
        d.setDate(d.getDate() - days);
        const startDateStr = getVietnamDateString(d);

        // Fetch orders with pagination
        const { data: orders, error, count } = await supabase
            .from('orders')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id)
            .gte('date', startDateStr)
            .order('date', { ascending: false })
            .range((page - 1) * pageSize, page * pageSize - 1)

        if (error) {
            return NextResponse.json(
                { code: 'ERR_INTERNAL_SERVER', message: 'Database error' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            data: orders || [],
            pagination: {
                page,
                page_size: pageSize,
                total: count || 0,
                total_pages: Math.ceil((count || 0) / pageSize),
            },
        }, { status: 200 })
    } catch (error) {
        console.error('GET /api/v1/orders/history error:', error)
        return NextResponse.json(
            { code: 'ERR_INTERNAL_SERVER', message: 'Internal server error' },
            { status: 500 }
        )
    }
}
