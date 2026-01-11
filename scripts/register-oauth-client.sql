-- Script to register Claude Code as an OAuth client
-- Run this in Supabase SQL Editor

-- First, check if you have an active user
SELECT id, email FROM auth.users LIMIT 5;

-- Register Claude Code OAuth Application
-- IMPORTANT: Save the generated client_secret - it will only be shown once!

DO $$
DECLARE
  v_client_secret TEXT;
  v_owner_id UUID;
BEGIN
  -- Generate secure client secret
  v_client_secret := encode(gen_random_bytes(32), 'base64');
  v_client_secret := replace(replace(replace(v_client_secret, '+', '-'), '/', '_'), '=', '');

  -- Get your user ID (replace with your email)
  SELECT id INTO v_owner_id
  FROM auth.users
  WHERE email = 'your-email@example.com' -- CHANGE THIS
  LIMIT 1;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'User not found. Please update the email address in this script.';
  END IF;

  -- Insert OAuth application
  INSERT INTO oauth_applications (
    client_id,
    client_secret,
    name,
    description,
    redirect_uris,
    allowed_scopes,
    owner_id,
    is_active
  ) VALUES (
    'claude-code-client',
    v_client_secret,
    'Claude Code',
    'Anthropic Claude Code CLI - Local Development',
    ARRAY[
      'http://localhost:60956/callback',
      'http://127.0.0.1:60956/callback',
      'http://localhost:3000/callback'  -- Add your dev callback URL if different
    ],
    ARRAY[
      'read',
      'write',
      'ledger:read',
      'ledger:write',
      'commitments:read',
      'commitments:write',
      'memories:read',
      'memories:write',
      'profile',
      'email'
    ],
    v_owner_id,
    true
  )
  ON CONFLICT (client_id) DO UPDATE
  SET
    client_secret = EXCLUDED.client_secret,
    redirect_uris = EXCLUDED.redirect_uris,
    allowed_scopes = EXCLUDED.allowed_scopes,
    updated_at = NOW();

  -- Show the credentials
  RAISE NOTICE 'OAuth Client registered successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'CLIENT CREDENTIALS (SAVE THESE SECURELY!)';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'Client ID: claude-code-client';
  RAISE NOTICE 'Client Secret: %', v_client_secret;
  RAISE NOTICE '=================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Add these to your Claude Code settings.json:';
  RAISE NOTICE '';
  RAISE NOTICE '{';
  RAISE NOTICE '  "mcpServers": {';
  RAISE NOTICE '    "mentu": {';
  RAISE NOTICE '      "type": "http",';
  RAISE NOTICE '      "url": "https://www.mentu.ai/api/mcp",';
  RAISE NOTICE '      "oauth": {';
  RAISE NOTICE '        "authorization_endpoint": "https://www.mentu.ai/oauth/authorize",';
  RAISE NOTICE '        "token_endpoint": "https://www.mentu.ai/api/oauth/token",';
  RAISE NOTICE '        "client_id": "claude-code-client",';
  RAISE NOTICE '        "client_secret": "%",', v_client_secret;
  RAISE NOTICE '        "redirect_uri": "http://localhost:60956/callback",';
  RAISE NOTICE '        "scope": "read write ledger:read ledger:write"';
  RAISE NOTICE '      }';
  RAISE NOTICE '    }';
  RAISE NOTICE '  }';
  RAISE NOTICE '}';
END $$;

-- Verify the registration
SELECT
  client_id,
  name,
  description,
  array_length(redirect_uris, 1) AS redirect_uri_count,
  array_length(allowed_scopes, 1) AS scope_count,
  is_active,
  created_at
FROM oauth_applications
WHERE client_id = 'claude-code-client';
