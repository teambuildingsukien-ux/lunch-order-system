import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'

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

        // Calculate date range
        const today = new Date()
        const startDate = new Date(today)
        startDate.setDate(startDate.getDate() - days)

        // Fetch orders with pagination
        const { data: orders, error, count } = await supabase
            .from('orders')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id)
            .gte('date', startDate.toISOString().split('T')[0])
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
