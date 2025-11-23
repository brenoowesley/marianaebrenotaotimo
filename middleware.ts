import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
        'Missing Supabase environment variables in middleware. Please check your .env.local file.'
    )
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Create Supabase client for auth checking
    const supabase = createServerClient(
        SUPABASE_URL as string,
        SUPABASE_ANON_KEY as string,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    // Not used in middleware, but required by interface
                },
                remove(name: string, options: CookieOptions) {
                    // Not used in middleware, but required by interface
                },
            },
        }
    )

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    const isAuthenticated = !!user

    // Define route types
    const isAuthRoute = pathname === '/login' || pathname === '/signup'
    const isProtectedRoute = pathname.startsWith('/dashboard') ||
        pathname.startsWith('/category') ||
        pathname.startsWith('/calendar-view')
    const isRootPath = pathname === '/'

    // Route protection logic
    if (isRootPath) {
        // Root path: redirect based on auth status
        if (isAuthenticated) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        } else {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    if (isAuthRoute && isAuthenticated) {
        // Authenticated users trying to access login/signup -> redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (isProtectedRoute && !isAuthenticated) {
        // Unauthenticated users trying to access protected routes -> redirect to login
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Update session for all other requests
    return await updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - Static assets (svg, png, jpg, jpeg, gif, webp)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
