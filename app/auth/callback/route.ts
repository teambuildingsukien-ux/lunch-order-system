import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    if (code) {
        const supabase = await createClient()

        // Exchange code for session
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
            // Redirect back to login with error
            return NextResponse.redirect(
                `${requestUrl.origin}/?error=invalid_token`
            )
        }

        // Get user to determine role-based redirect (US-003)
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            // Query user role from database
            const { data: userData } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single()

            // Role-based redirect
            if (userData) {
                switch (userData.role) {
                    case 'Kitchen Admin':
                        return NextResponse.redirect(`${requestUrl.origin}/dashboard/kitchen`)
                    case 'Manager':
                        return NextResponse.redirect(`${requestUrl.origin}/dashboard/manager`)
                    default: // Employee
                        return NextResponse.redirect(`${requestUrl.origin}/dashboard/employee`)
                }
            }
        }
    }

    // Default redirect to employee dashboard
    return NextResponse.redirect(`${requestUrl.origin}/dashboard/employee`)
}
