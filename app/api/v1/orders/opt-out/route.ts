import { createClient } from '@/lib/supabase/server'
import { getTodayDate, isBeforeDeadline } from '@/lib/utils/date'
import { NextResponse } from 'next/server'

export async function POST() {
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
        const today = getTodayDate()

        // Deadline check (<6:00 AM GMT+7)
        if (!isBeforeDeadline()) {
            return NextResponse.json(
                {
                    code: 'ERR_DEADLINE_PASSED',
                    message: 'Cannot change order after 6:00 AM'
                },
                { status: 403 }
            )
        }

        // Get current order
        const { data: currentOrder, error: fetchError } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', today)
            .single()

        if (fetchError) {
            return NextResponse.json(
                { code: 'ERR_NOT_FOUND', message: 'Order not found for today' },
                { status: 404 }
            )
        }

        // Check if locked
        if (currentOrder.locked) {
            return NextResponse.json(
                { code: 'ERR_ORDER_LOCKED', message: 'Order already locked' },
                { status: 403 }
            )
        }

        // Toggle status (eating ↔ not_eating)
        const newStatus = currentOrder.status === 'eating' ? 'not_eating' : 'eating'

        // Update order
        const { data: updatedOrder, error: updateError } = await supabase
            .from('orders')
            .update({
                status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', currentOrder.id)
            .select()
            .single()

        if (updateError) {
            return NextResponse.json(
                { code: 'ERR_INTERNAL_SERVER', message: 'Failed to update order' },
                { status: 500 }
            )
        }

        return NextResponse.json(updatedOrder, { status: 200 })
    } catch (error) {
        console.error('POST /api/v1/orders/opt-out error:', error)
        return NextResponse.json(
            { code: 'ERR_INTERNAL_SERVER', message: 'Internal server error' },
            { status: 500 }
        )
    }
}
