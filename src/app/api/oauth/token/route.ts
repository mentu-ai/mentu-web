import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const body = await request.json();
    const {
      grant_type,
      code,
      client_id,
      client_secret,
      redirect_uri,
      refresh_token,
    } = body;

    if (!grant_type) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'grant_type is required' },
        { status: 400 }
      );
    }

    if (grant_type === 'authorization_code') {
      // Exchange authorization code for access token
      if (!code || !client_id || !client_secret || !redirect_uri) {
        return NextResponse.json(
          {
            error: 'invalid_request',
            error_description: 'Missing required parameters',
          },
          { status: 400 }
        );
      }

      const { data, error } = await supabase.rpc('exchange_oauth_code', {
        p_code: code,
        p_client_id: client_id,
        p_client_secret: client_secret,
        p_redirect_uri: redirect_uri,
      });

      if (error) {
        console.error('Token exchange error:', error);
        return NextResponse.json(
          {
            error: 'invalid_grant',
            error_description: error.message || 'Invalid authorization code',
          },
          { status: 400 }
        );
      }

      return NextResponse.json(data);
    } else if (grant_type === 'refresh_token') {
      // Refresh access token
      if (!refresh_token || !client_id || !client_secret) {
        return NextResponse.json(
          {
            error: 'invalid_request',
            error_description: 'Missing required parameters',
          },
          { status: 400 }
        );
      }

      // Verify client credentials
      const { data: app } = await supabase
        .from('oauth_applications')
        .select('*')
        .eq('client_id', client_id)
        .eq('client_secret', client_secret)
        .eq('is_active', true)
        .single();

      if (!app) {
        return NextResponse.json(
          { error: 'invalid_client', error_description: 'Invalid client credentials' },
          { status: 401 }
        );
      }

      // Get refresh token
      const { data: refreshTokenData } = await supabase
        .from('oauth_refresh_tokens')
        .select('*')
        .eq('token', refresh_token)
        .eq('client_id', client_id)
        .single();

      if (!refreshTokenData || (refreshTokenData.expires_at && new Date(refreshTokenData.expires_at) < new Date())) {
        return NextResponse.json(
          { error: 'invalid_grant', error_description: 'Invalid or expired refresh token' },
          { status: 400 }
        );
      }

      // Generate new access token
      const newAccessToken = Buffer.from(crypto.getRandomValues(new Uint8Array(32)))
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

      const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour

      // Get scope from previous token
      const { data: prevToken } = await supabase
        .from('oauth_access_tokens')
        .select('scope')
        .eq('id', refreshTokenData.access_token_id)
        .single();

      const scope = prevToken?.scope || 'read';

      // Insert new access token
      const { data: newToken, error: insertError } = await supabase
        .from('oauth_access_tokens')
        .insert({
          token: newAccessToken,
          client_id,
          user_id: refreshTokenData.user_id,
          scope,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating new access token:', insertError);
        return NextResponse.json(
          { error: 'server_error', error_description: 'Failed to create access token' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        access_token: newAccessToken,
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: refresh_token, // Return same refresh token
        scope,
      });
    } else {
      return NextResponse.json(
        { error: 'unsupported_grant_type', error_description: 'Only authorization_code and refresh_token are supported' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Token endpoint error:', error);
    return NextResponse.json(
      { error: 'server_error', error_description: 'Internal server error' },
      { status: 500 }
    );
  }
}
