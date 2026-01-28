import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createClient()

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get current month start and end dates (GMT+7)
        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth()
        const monthStart = new Date(year, month, 1)
        const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999)

        // Format dates as YYYY-MM-DD for Supabase query
        const startDate = monthStart.toISOString().split('T')[0]
        const endDate = monthEnd.toISOString().split('T')[0]

        // Get all orders for current month
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', user.id)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: true })

        if (ordersError) {
            console.error('Error fetching monthly orders:', ordersError)
            return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
        }

        // Calculate statistics
        const totalDays = orders?.length || 0
        const eatingDays = orders?.filter(o => o.status === 'eating').length || 0
        const skippedDays = orders?.filter(o => o.status === 'cancelled').length || 0

        // Calculate compliance rate (orders updated before 6 AM)
        const compliantOrders = orders?.filter(order => {
            if (!order.updated_at) return true // Default orders are compliant
            const updateTime = new Date(order.updated_at)
            const updateHour = updateTime.getHours()
            return updateHour < 6
        }).length || 0
        const complianceRate = totalDays > 0 ? Math.round((compliantOrders / totalDays) * 100) : 100

        // Calculate cost saved (assuming 30,000 VND per meal)
        const mealCost = 30000
        const costSaved = skippedDays * mealCost

        // Calculate CO2 saved (assuming 0.8kg CO2 per meal wasted)
        const co2PerMeal = 0.8
        const co2Saved = Math.round(skippedDays * co2PerMeal * 10) / 10

        // Calculate longest streak of consecutive eating days
        let topStreak = 0
        let currentStreak = 0
        orders?.forEach(order => {
            if (order.status === 'eating') {
                currentStreak++
                topStreak = Math.max(topStreak, currentStreak)
            } else {
                currentStreak = 0
            }
        })

        const stats = {
            totalDays,
            eatingDays,
            skippedDays,
            complianceRate,
            costSaved,
            co2Saved,
            topStreak
        }

        return NextResponse.json(stats)
    } catch (error) {
        console.error('Error in monthly stats API:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
