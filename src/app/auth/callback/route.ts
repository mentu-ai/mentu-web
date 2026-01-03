import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const origin = requestUrl.origin;

  console.log('[AUTH CALLBACK] Starting auth callback');
  console.log('[AUTH CALLBACK] Origin:', origin);
  console.log('[AUTH CALLBACK] Code present:', !!code);
  console.log('[AUTH CALLBACK] Error:', error);
  console.log('[AUTH CALLBACK] Error description:', errorDescription);

  // If there's an OAuth error, redirect to login with error
  if (error) {
    console.log('[AUTH CALLBACK] OAuth error, redirecting to login');
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorDescription || error)}`);
  }

  if (code) {
    const cookieStore = await cookies();
    console.log('[AUTH CALLBACK] Existing cookies:', cookieStore.getAll().map(c => c.name));

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            console.log('[AUTH CALLBACK] Setting cookies:', cookiesToSet.map(c => c.name));
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.log('[AUTH CALLBACK] Exchange error:', exchangeError.message);
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(exchangeError.message)}`);
    }

    console.log('[AUTH CALLBACK] Session created for user:', data.user?.email);
    console.log('[AUTH CALLBACK] Session expires at:', data.session?.expires_at);
  } else {
    console.log('[AUTH CALLBACK] No code provided, redirecting to login');
    return NextResponse.redirect(`${origin}/login`);
  }

  // URL to redirect to after sign in process completes
  console.log('[AUTH CALLBACK] Success! Redirecting to /');
  return NextResponse.redirect(`${origin}/`);
}
