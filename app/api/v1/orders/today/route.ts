import { createClient } from '@/lib/supabase/server'
import { getTodayDate } from '@/lib/utils/date'
import { NextResponse } from 'next/server'

export async function GET() {
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

        // Get today's order for current user
        const { data: order, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', today)
            .single()

        if (error) {
            // If order doesn't exist, create it (auto-create logic)
            if (error.code === 'PGRST116') {
                // Get user's tenant_id REQUIRED for RLS
                const { data: userProfile } = await supabase
                    .from('users')
                    .select('tenant_id')
                    .eq('id', user.id)
                    .single()

                if (!userProfile?.tenant_id) {
                    return NextResponse.json(
                        { code: 'ERR_FORBIDDEN', message: 'Tenant not found' },
                        { status: 403 }
                    )
                }

                const { data: newOrder, error: createError } = await supabase
                    .from('orders')
                    .insert({
                        tenant_id: userProfile.tenant_id,  // REQUIRED for RLS
                        user_id: user.id,
                        date: today,
                        status: 'eating', // Default status
                        locked: false,
                    })
                    .select()
                    .single()

                if (createError) {
                    return NextResponse.json(
                        { code: 'ERR_INTERNAL_SERVER', message: 'Failed to create order' },
                        { status: 500 }
                    )
                }

                return NextResponse.json(newOrder, { status: 200 })
            }

            return NextResponse.json(
                { code: 'ERR_INTERNAL_SERVER', message: 'Database error' },
                { status: 500 }
            )
        }

        return NextResponse.json(order, { status: 200 })
    } catch (error) {
        console.error('GET /api/v1/orders/today error:', error)
        return NextResponse.json(
            { code: 'ERR_INTERNAL_SERVER', message: 'Internal server error' },
            { status: 500 }
        )
    }
}
