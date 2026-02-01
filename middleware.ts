import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value)
                        response.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    // Refresh session if expired
    const { data: { user } } = await supabase.auth.getUser()

    // Redirect old dashboard URLs to new unified dashboard
    if (request.nextUrl.pathname.match(/\/dashboard\/(employee|kitchen|manager)$/)) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Protected routes: /dashboard (including /dashboard/*)
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
        if (!user) {
            // Redirect to login if not authenticated
            return NextResponse.redirect(new URL('/login', request.url))
        }

        // Check subscription status for authenticated users
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select(`
                tenants (
                    subscription_status,
                    trial_ends_at
                )
            `)
            .eq('id', user.id)
            .single();

        if (!userError && userData?.tenants) {
            const tenant = userData.tenants as any;
            const { subscription_status, trial_ends_at } = tenant;

            // Check if trial expired
            if (subscription_status === 'trialing' && trial_ends_at) {
                const trialEndDate = new Date(trial_ends_at);
                if (trialEndDate < new Date()) {
                    return NextResponse.redirect(
                        new URL('/billing?trial_expired=true', request.url)
                    );
                }
            }

            // Check if subscription inactive (past_due or canceled)
            if (['canceled', 'past_due'].includes(subscription_status)) {
                return NextResponse.redirect(
                    new URL('/billing?payment_required=true', request.url)
                );
            }
        }
    }

    // If authenticated and trying to access login page, redirect to unified dashboard
    if ((request.nextUrl.pathname === '/' || request.nextUrl.pathname === '/login') && user) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Redirect to login page if trying to access root without authentication
    if (request.nextUrl.pathname === '/' && !user) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - Images (svg, png, jpg, jpeg, gif, webp)
         * - API routes (api/*)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
