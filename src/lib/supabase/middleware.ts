import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Update Supabase session cookies on each request. Returns the NextResponse
 * to forward. Used from Next middleware.ts to gate /user2admin routes.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    // No Supabase configured  let the request through; /user2admin pages will
    // render an "auth not configured" empty state instead of redirecting.
    return response
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options })
        response = NextResponse.next({ request: { headers: request.headers } })
        response.cookies.set({ name, value, ...options })
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: '', ...options })
        response = NextResponse.next({ request: { headers: request.headers } })
        response.cookies.set({ name, value: '', ...options })
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const onLogin = path.startsWith('/user2admin/login')
  const onAdmin = path.startsWith('/user2admin')

  const allowedEmail = process.env.ADMIN_ALLOWED_EMAIL?.trim().toLowerCase()
  const userAllowed =
    user != null &&
    (!allowedEmail ||
      (user.email ?? '').trim().toLowerCase() === allowedEmail)

  // Redirect disallowed users hitting /user2admin/* (except /user2admin/login) to login.
  if (onAdmin && !onLogin && !userAllowed) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/user2admin/login'
    return NextResponse.redirect(redirectUrl)
  }

  // When an authenticated+allowed user visits /user2admin/login, send them home.
  if (onLogin && userAllowed) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/user2admin'
    return NextResponse.redirect(redirectUrl)
  }

  return response
}
