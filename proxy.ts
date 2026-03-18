import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Deny-by-default route protection (P1-1).
 *
 * Every route requires authentication UNLESS it is listed in PUBLIC_ROUTES.
 * New routes — including future /api/exam/* endpoints — are automatically
 * protected without any code change here.
 *
 * PUBLIC_ROUTES: accessible without a session.
 * AUTH_ONLY_ROUTES: subset of public routes that redirect to /dashboard
 *   when the user IS already authenticated (prevents logged-in users
 *   from seeing the login page).
 *
 * Matching uses exact equality OR startsWith(route + '/') to avoid
 * false positives like /dashboard matching /dashboardx (P1-1 fix).
 */

const PUBLIC_ROUTES: string[]    = ['/', '/login']
const AUTH_ONLY_ROUTES: string[] = ['/login']

function matches(pathname: string, routes: string[]): boolean {
  return routes.some(r => pathname === r || pathname.startsWith(r + '/'))
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Deny-by-default: any route not in PUBLIC_ROUTES requires a session
  if (!matches(pathname, PUBLIC_ROUTES) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Auth-only routes redirect to dashboard when user is already signed in
  if (matches(pathname, AUTH_ONLY_ROUTES) && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
