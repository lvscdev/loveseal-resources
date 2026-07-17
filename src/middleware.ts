import createIntlMiddleware from 'next-intl/middleware'
import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { routing } from '@/i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  /* ───────── ADMIN API ROUTES — JSON 401 if not authenticated ───────── */
  if (pathname.startsWith('/api/admin')) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll() {},
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.next()
  }

  /* ───────── ADMIN ROUTES — Supabase auth check ───────── */
  if (pathname.startsWith('/admin')) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // Login page: allow if not signed in, redirect to dashboard if signed in
    if (pathname === '/admin/login') {
      if (user) return NextResponse.redirect(new URL('/admin', request.url))
      return supabaseResponse
    }

    // Invite-accept page: allow without auth (user is creating account here)
    if (pathname.startsWith('/admin/invite/accept')) {
      return supabaseResponse
    }

    // All other admin routes: require auth
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // Verify the user is in admin_users
    const { data: adminRow } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!adminRow) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    return supabaseResponse
  }

  /* ───────── EVERYTHING ELSE — i18n locale routing ───────── */
  return intlMiddleware(request)
}

export const config = {
  matcher: [
    // All public + admin page routes (excludes all /api/*, static, and file extensions)
    '/((?!api|_next/static|_next/image|sitemap.xml|robots.txt|favicon.ico|.*\\..*).*)',
    // Admin API routes — protected separately with JSON 401
    '/api/admin/:path*',
  ],
}