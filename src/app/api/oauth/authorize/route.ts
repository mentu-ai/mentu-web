import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const clientId = requestUrl.searchParams.get('client_id');
  const redirectUri = requestUrl.searchParams.get('redirect_uri');
  const responseType = requestUrl.searchParams.get('response_type');
  const scope = requestUrl.searchParams.get('scope') || 'read';
  const state = requestUrl.searchParams.get('state');

  // Validate parameters
  if (!clientId || !redirectUri || !responseType) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );
  }

  if (responseType !== 'code') {
    return NextResponse.json(
      { error: 'Only response_type=code is supported' },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    // Redirect to login with return URL
    const returnUrl = encodeURIComponent(request.url);
    return NextResponse.redirect(
      `${requestUrl.origin}/login?return_to=${returnUrl}`
    );
  }

  // Validate client_id and redirect_uri
  const { data: app, error } = await supabase
    .from('oauth_applications')
    .select('*')
    .eq('client_id', clientId)
    .eq('is_active', true)
    .single();

  if (error || !app) {
    return NextResponse.json(
      { error: 'Invalid client_id' },
      { status: 400 }
    );
  }

  const appData = app as { redirect_uris: string[] | string };
  const redirectUris = Array.isArray(appData.redirect_uris)
    ? appData.redirect_uris
    : [appData.redirect_uris];

  if (!redirectUris.includes(redirectUri)) {
    return NextResponse.json(
      { error: 'Invalid redirect_uri' },
      { status: 400 }
    );
  }

  // Redirect to consent screen
  const consentUrl = new URL('/oauth/consent', requestUrl.origin);
  consentUrl.searchParams.set('client_id', clientId);
  consentUrl.searchParams.set('redirect_uri', redirectUri);
  consentUrl.searchParams.set('response_type', responseType);
  consentUrl.searchParams.set('scope', scope);
  if (state) {
    consentUrl.searchParams.set('state', state);
  }

  return NextResponse.redirect(consentUrl.toString());
}
