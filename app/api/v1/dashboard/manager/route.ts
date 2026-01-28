import { createClient } from '@/lib/supabase/server'
import { getTodayDate } from '@/lib/utils/date'
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

    // Role check - Manager or Admin HR
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!userData || !['Manager', 'Admin HR'].includes(userData.role)) {
        return NextResponse.json(
            { code: 'ERR_FORBIDDEN', message: 'Manager or Admin HR access required' },
            { status: 403 }
        )
    }

    try {
        const searchParams = request.nextUrl.searchParams
        const days = parseInt(searchParams.get('days') || '30') // Default 30 days

        // Calculate date range
        const today = getTodayDate()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)
        const startDateStr = startDate.toISOString().split('T')[0]

        // Get total active employees count
        const { count: totalEmployees } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'Employee')
            .is('deleted_at', null)

        // Get orders for date range
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('date, status, user_id')
            .gte('date', startDateStr)
            .lte('date', today)

        if (ordersError) {
            return NextResponse.json(
                { code: 'ERR_INTERNAL_SERVER', message: 'Failed to fetch orders' },
                { status: 500 }
            )
        }

        // Group orders by date
        const ordersByDate = new Map<string, any[]>()
        orders?.forEach(order => {
            if (!ordersByDate.has(order.date)) {
                ordersByDate.set(order.date, [])
            }
            ordersByDate.get(order.date)!.push(order)
        })

        // Calculate KPIs
        let totalOrders = 0
        let totalNotEating = 0

        orders?.forEach(order => {
            totalOrders++
            if (order.status === 'not_eating') {
                totalNotEating++
            }
        })

        const waste_rate = totalOrders > 0
            ? parseFloat(((totalNotEating / totalOrders) * 100).toFixed(1))
            : 0

        // Cost savings calculation (25,000 VND per meal)
        const cost_per_meal = 25000
        const cost_savings = totalNotEating * cost_per_meal

        // Compliance rate (employees who confirmed on time)
        const compliance_rate = totalOrders > 0
            ? parseFloat((((totalOrders) / (totalEmployees || 1) / days) * 100).toFixed(1))
            : 0

        // Trend data - last N days
        const trendData: any[] = []
        const dateIterator = new Date(startDate)

        while (dateIterator <= new Date(today)) {
            const dateStr = dateIterator.toISOString().split('T')[0]
            const dayOrders = ordersByDate.get(dateStr) || []

            const dayTotalEmployees = totalEmployees || 0
            const dayTotalOrders = dayOrders.length
            const dayEating = dayOrders.filter(o => o.status === 'eating').length
            const dayNotEating = dayOrders.filter(o => o.status === 'not_eating').length
            const dayWasteRate = dayTotalOrders > 0
                ? parseFloat(((dayNotEating / dayTotalOrders) * 100).toFixed(1))
                : 0

            trendData.push({
                date: dateStr,
                total_employees: dayTotalEmployees,
                total_orders: dayTotalOrders,
                total_eating: dayEating,
                total_not_eating: dayNotEating,
                waste_rate: dayWasteRate,
            })

            dateIterator.setDate(dateIterator.getDate() + 1)
        }

        return NextResponse.json({
            kpis: {
                waste_rate,
                cost_savings,
                compliance_rate,
                total_employees: totalEmployees || 0,
                total_orders: totalOrders,
                total_not_eating: totalNotEating,
            },
            trend_data: trendData,
            date_range: {
                start: startDateStr,
                end: today,
                days,
            },
        }, { status: 200 })
    } catch (error) {
        console.error('GET /api/v1/dashboard/manager error:', error)
        return NextResponse.json(
            { code: 'ERR_INTERNAL_SERVER', message: 'Internal server error' },
            { status: 500 }
        )
    }
}
