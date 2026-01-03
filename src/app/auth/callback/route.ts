import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const origin = requestUrl.origin;

  console.log('[AUTH CALLBACK] Starting auth callback');
  console.log('[AUTH CALLBACK] Origin:', origin);
  console.log('[AUTH CALLBACK] Full URL:', request.url);
  console.log('[AUTH CALLBACK] Code present:', !!code);
  console.log('[AUTH CALLBACK] Error:', error);
  console.log('[AUTH CALLBACK] Error description:', errorDescription);

  // If there's an OAuth error, redirect to login with error
  if (error) {
    console.log('[AUTH CALLBACK] OAuth error, redirecting to login');
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorDescription || error)}`);
  }

  if (!code) {
    console.log('[AUTH CALLBACK] No code provided, redirecting to login');
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  // Create the redirect response first, then set cookies on it
  const redirectUrl = new URL('/', origin);
  const response = NextResponse.redirect(redirectUrl);

  // Track cookies that need to be set
  const cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }> = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies) {
          console.log('[AUTH CALLBACK] Supabase wants to set cookies:', cookies.map(c => c.name));
          cookies.forEach(({ name, value, options }) => {
            cookiesToSet.push({ name, value, options });
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
  console.log('[AUTH CALLBACK] Access token length:', data.session?.access_token?.length);

  // Now set all cookies on the response
  console.log('[AUTH CALLBACK] Setting', cookiesToSet.length, 'cookies on response');
  for (const { name, value, options } of cookiesToSet) {
    console.log('[AUTH CALLBACK] Setting cookie:', name, 'with options:', JSON.stringify(options));
    response.cookies.set(name, value, options as Record<string, unknown>);
  }

  console.log('[AUTH CALLBACK] Success! Redirecting to /');
  return response;
}
