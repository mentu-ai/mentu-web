import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip logging for static assets
  const shouldLog = !pathname.includes('_next') && !pathname.includes('favicon');

  if (shouldLog) {
    console.log('[MIDDLEWARE] Path:', pathname);
    console.log('[MIDDLEWARE] Cookies present:', request.cookies.getAll().map(c => c.name));
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (shouldLog) {
    console.log('[MIDDLEWARE] User:', user?.email || 'null');
    console.log('[MIDDLEWARE] Auth error:', error?.message || 'none');
  }

  // Protect workspace routes
  if (
    !user &&
    pathname.startsWith('/workspace')
  ) {
    if (shouldLog) console.log('[MIDDLEWARE] No user, redirecting to /login');
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect logged-in users away from login page
  if (user && pathname === '/login') {
    if (shouldLog) console.log('[MIDDLEWARE] User logged in, redirecting from /login to /');
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
