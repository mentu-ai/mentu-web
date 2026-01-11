-- OAuth Applications table
CREATE TABLE IF NOT EXISTS oauth_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT UNIQUE NOT NULL,
  client_secret TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  redirect_uris TEXT[] NOT NULL,
  allowed_scopes TEXT[] NOT NULL DEFAULT ARRAY['read'],
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- OAuth Authorization Codes table
CREATE TABLE IF NOT EXISTS oauth_authorization_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  client_id TEXT NOT NULL REFERENCES oauth_applications(client_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  redirect_uri TEXT NOT NULL,
  scope TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- OAuth Access Tokens table
CREATE TABLE IF NOT EXISTS oauth_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  client_id TEXT NOT NULL REFERENCES oauth_applications(client_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scope TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- OAuth Refresh Tokens table (optional, for long-lived access)
CREATE TABLE IF NOT EXISTS oauth_refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  access_token_id UUID REFERENCES oauth_access_tokens(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL REFERENCES oauth_applications(client_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_oauth_codes_client_id ON oauth_authorization_codes(client_id);
CREATE INDEX IF NOT EXISTS idx_oauth_codes_user_id ON oauth_authorization_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_client_id ON oauth_access_tokens(client_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_id ON oauth_access_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_token ON oauth_access_tokens(token);

-- Function to create authorization code
CREATE OR REPLACE FUNCTION create_oauth_authorization_code(
  p_client_id TEXT,
  p_user_id UUID,
  p_redirect_uri TEXT,
  p_scope TEXT
)
RETURNS JSON AS $$
DECLARE
  v_code TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Generate random code
  v_code := encode(gen_random_bytes(32), 'base64');
  v_code := replace(replace(replace(v_code, '+', '-'), '/', '_'), '=', '');

  -- Set expiration (10 minutes from now)
  v_expires_at := NOW() + INTERVAL '10 minutes';

  -- Insert authorization code
  INSERT INTO oauth_authorization_codes (
    code, client_id, user_id, redirect_uri, scope, expires_at
  ) VALUES (
    v_code, p_client_id, p_user_id, p_redirect_uri, p_scope, v_expires_at
  );

  RETURN json_build_object(
    'code', v_code,
    'expires_at', v_expires_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to exchange code for token
CREATE OR REPLACE FUNCTION exchange_oauth_code(
  p_code TEXT,
  p_client_id TEXT,
  p_client_secret TEXT,
  p_redirect_uri TEXT
)
RETURNS JSON AS $$
DECLARE
  v_auth_code RECORD;
  v_app RECORD;
  v_access_token TEXT;
  v_refresh_token TEXT;
  v_token_expires_at TIMESTAMPTZ;
BEGIN
  -- Verify application credentials
  SELECT * INTO v_app
  FROM oauth_applications
  WHERE client_id = p_client_id
    AND client_secret = p_client_secret
    AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid client credentials';
  END IF;

  -- Get authorization code
  SELECT * INTO v_auth_code
  FROM oauth_authorization_codes
  WHERE code = p_code
    AND client_id = p_client_id
    AND redirect_uri = p_redirect_uri
    AND expires_at > NOW()
    AND used = false;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired authorization code';
  END IF;

  -- Mark code as used
  UPDATE oauth_authorization_codes
  SET used = true
  WHERE code = p_code;

  -- Generate access token
  v_access_token := encode(gen_random_bytes(32), 'base64');
  v_access_token := replace(replace(replace(v_access_token, '+', '-'), '/', '_'), '=', '');

  -- Generate refresh token
  v_refresh_token := encode(gen_random_bytes(32), 'base64');
  v_refresh_token := replace(replace(replace(v_refresh_token, '+', '-'), '/', '_'), '=', '');

  -- Token expires in 1 hour
  v_token_expires_at := NOW() + INTERVAL '1 hour';

  -- Insert access token
  INSERT INTO oauth_access_tokens (
    token, client_id, user_id, scope, expires_at
  ) VALUES (
    v_access_token, p_client_id, v_auth_code.user_id, v_auth_code.scope, v_token_expires_at
  )
  RETURNING id INTO v_access_token;

  -- Insert refresh token (expires in 30 days)
  INSERT INTO oauth_refresh_tokens (
    token, access_token_id, client_id, user_id, expires_at
  ) VALUES (
    v_refresh_token, v_access_token, p_client_id, v_auth_code.user_id, NOW() + INTERVAL '30 days'
  );

  RETURN json_build_object(
    'access_token', v_access_token,
    'token_type', 'Bearer',
    'expires_in', 3600,
    'refresh_token', v_refresh_token,
    'scope', v_auth_code.scope
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE oauth_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_authorization_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_refresh_tokens ENABLE ROW LEVEL SECURITY;

-- Users can see their own OAuth applications
CREATE POLICY "Users can view own OAuth apps"
  ON oauth_applications FOR SELECT
  USING (auth.uid() = owner_id);

-- Users can create OAuth applications
CREATE POLICY "Users can create OAuth apps"
  ON oauth_applications FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Users can update own applications
CREATE POLICY "Users can update own OAuth apps"
  ON oauth_applications FOR UPDATE
  USING (auth.uid() = owner_id);

-- Service role can see all (for OAuth server operations)
CREATE POLICY "Service can manage all OAuth apps"
  ON oauth_applications FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
