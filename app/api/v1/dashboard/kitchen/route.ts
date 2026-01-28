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

    // Role check - Kitchen or Admin HR
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!userData || !['Kitchen', 'Admin HR'].includes(userData.role)) {
        return NextResponse.json(
            { code: 'ERR_FORBIDDEN', message: 'Kitchen or Admin HR access required' },
            { status: 403 }
        )
    }

    try {
        const today = getTodayDate()
        const searchParams = request.nextUrl.searchParams
        const statusFilter = searchParams.get('status') // 'all', 'eating', 'cancelled'
        const searchQuery = searchParams.get('search') || ''

        // Get all active employees (not deleted)
        let usersQuery = supabase
            .from('users')
            .select('id, email, full_name, department, role')
            .is('deleted_at', null)
            .eq('role', 'Employee')

        if (searchQuery) {
            usersQuery = usersQuery.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,department.ilike.%${searchQuery}%`)
        }

        const { data: employees, error: usersError } = await usersQuery

        if (usersError) {
            return NextResponse.json(
                { code: 'ERR_INTERNAL_SERVER', message: 'Failed to fetch employees' },
                { status: 500 }
            )
        }

        // Get today's orders for all employees
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('*')
            .eq('date', today)

        if (ordersError) {
            return NextResponse.json(
                { code: 'ERR_INTERNAL_SERVER', message: 'Failed to fetch orders' },
                { status: 500 }
            )
        }

        // Create orders map for quick lookup
        const ordersMap = new Map(orders?.map(order => [order.user_id, order]) || [])

        // Combine employees with their orders
        const employeesWithOrders = employees?.map(emp => {
            const order = ordersMap.get(emp.id)
            return {
                ...emp,
                order: order || {
                    id: null,
                    user_id: emp.id,
                    date: today,
                    status: 'eating', // Default if no order exists yet
                    locked: false,
                    created_at: null,
                    updated_at: null,
                }
            }
        }) || []

        // Apply status filter
        let filteredEmployees = employeesWithOrders
        if (statusFilter && statusFilter !== 'all') {
            filteredEmployees = employeesWithOrders.filter(emp =>
                emp.order.status === statusFilter
            )
        }

        // Calculate summary
        const total_employees = employeesWithOrders.length
        const total_eating = employeesWithOrders.filter(emp => emp.order.status === 'eating').length
        const total_not_eating = employeesWithOrders.filter(emp => emp.order.status === 'cancelled').length

        return NextResponse.json({
            summary: {
                total_employees,
                total_eating,
                total_not_eating,
                date: today,
            },
            employees: filteredEmployees,
        }, { status: 200 })
    } catch (error) {
        console.error('GET /api/v1/dashboard/kitchen error:', error)
        return NextResponse.json(
            { code: 'ERR_INTERNAL_SERVER', message: 'Internal server error' },
            { status: 500 }
        )
    }
}
