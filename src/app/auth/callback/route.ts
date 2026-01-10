import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Validate that the return_to URL is safe to redirect to.
 * Only allows localhost (for CLI), HTTP/HTTPS same-origin, and relative paths.
 */
function isValidReturnTo(returnTo: string): boolean {
  try {
    const url = new URL(returnTo, 'http://localhost');

    // Allow localhost URLs (for CLI)
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      return true;
    }

    // Allow http/https URLs (will be validated by browser anyway)
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return true;
    }

    return false;
  } catch {
    // If URL parsing fails, reject it
    return false;
  }
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const returnTo = requestUrl.searchParams.get('return_to');
  const origin = requestUrl.origin;

  console.log('[AUTH CALLBACK] Starting auth callback');
  console.log('[AUTH CALLBACK] Origin:', origin);
  console.log('[AUTH CALLBACK] Full URL:', request.url);
  console.log('[AUTH CALLBACK] Code present:', !!code);
  console.log('[AUTH CALLBACK] Error:', error);
  console.log('[AUTH CALLBACK] Error description:', errorDescription);
  console.log('[AUTH CALLBACK] Return to:', returnTo);

  // Helper to build error redirect URL
  const buildErrorRedirect = (errorMsg: string) => {
    let loginUrl = `${origin}/login?error=${encodeURIComponent(errorMsg)}`;
    if (returnTo) {
      loginUrl += `&return_to=${encodeURIComponent(returnTo)}`;
    }
    return loginUrl;
  };

  // If there's an OAuth error, redirect to login with error
  if (error) {
    console.log('[AUTH CALLBACK] OAuth error, redirecting to login');
    return NextResponse.redirect(buildErrorRedirect(errorDescription || error));
  }

  if (!code) {
    console.log('[AUTH CALLBACK] No code provided, redirecting to login');
    return NextResponse.redirect(buildErrorRedirect('no_code'));
  }

  // Determine final redirect URL (either returnTo or dashboard)
  let finalRedirectUrl: string;
  let isLocalhostReturn = false;
  if (returnTo && isValidReturnTo(returnTo)) {
    try {
      const returnUrl = new URL(returnTo);
      isLocalhostReturn = returnUrl.hostname === 'localhost' || returnUrl.hostname === '127.0.0.1';
    } catch {
      // ignore
    }
    finalRedirectUrl = returnTo;
  } else {
    finalRedirectUrl = `${origin}/`;
  }

  // Create the redirect response first, then set cookies on it
  const redirectUrl = new URL(finalRedirectUrl);
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

  // If redirecting to localhost (CLI), include tokens as query params
  if (isLocalhostReturn && data.session) {
    const localhostUrl = new URL(finalRedirectUrl);
    localhostUrl.searchParams.set('access_token', data.session.access_token || '');
    if (data.session.refresh_token) {
      localhostUrl.searchParams.set('refresh_token', data.session.refresh_token);
    }
    // Update the response with the new URL including tokens
    const tokenResponse = NextResponse.redirect(localhostUrl.toString());
    // Still set cookies for mentu-web, even though localhost won't use them
    for (const { name, value, options } of cookiesToSet) {
      tokenResponse.cookies.set(name, value, options as Record<string, unknown>);
    }
    console.log('[AUTH CALLBACK] Localhost redirect with tokens');
    return tokenResponse;
  }

  // Now set all cookies on the response (for non-localhost redirects)
  console.log('[AUTH CALLBACK] Setting', cookiesToSet.length, 'cookies on response');
  for (const { name, value, options } of cookiesToSet) {
    console.log('[AUTH CALLBACK] Setting cookie:', name, 'with options:', JSON.stringify(options));
    response.cookies.set(name, value, options as Record<string, unknown>);
  }

  console.log('[AUTH CALLBACK] Success! Redirecting to:', finalRedirectUrl);
  return response;
}
