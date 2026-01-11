# OAuth Server Deployment Guide

## Quick Setup (5 Minutes)

### Step 1: Apply Database Migration

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/nwhtjzgcbjuewuhapjua/sql/new)
2. Click **SQL Editor** → **New Query**
3. Copy the contents of `migrations/create_oauth_tables.sql`
4. Click **Run** (or press Cmd+Enter)
5. Verify success - you should see "Success. No rows returned"

### Step 2: Register Claude Code OAuth Client

1. Still in SQL Editor, create a **New Query**
2. Copy this SQL (update YOUR_EMAIL):

```sql
DO $$
DECLARE
  v_client_secret TEXT;
  v_owner_id UUID;
BEGIN
  -- Generate secure client secret
  v_client_secret := encode(gen_random_bytes(32), 'base64');
  v_client_secret := replace(replace(replace(v_client_secret, '+', '-'), '/', '_'), '=', '');

  -- Get your user ID
  SELECT id INTO v_owner_id
  FROM auth.users
  WHERE email = 'YOUR_EMAIL@EXAMPLE.COM'  -- ← CHANGE THIS
  LIMIT 1;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'User not found. Please update your email address.';
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
    'Anthropic Claude Code CLI',
    ARRAY[
      'http://localhost:60956/callback',
      'http://127.0.0.1:60956/callback'
    ],
    ARRAY[
      'read', 'write',
      'ledger:read', 'ledger:write',
      'commitments:read', 'commitments:write',
      'memories:read', 'memories:write',
      'profile', 'email'
    ],
    v_owner_id,
    true
  )
  ON CONFLICT (client_id) DO UPDATE
  SET client_secret = EXCLUDED.client_secret;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'OAuth Client Created!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Client ID: claude-code-client';
  RAISE NOTICE 'Client Secret: %', v_client_secret;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'SAVE THIS SECRET - YOU WON''T SEE IT AGAIN!';
END $$;
```

3. **IMPORTANT**: Copy the `client_secret` from the output (shown in NOTICE messages at bottom)

### Step 3: Enable OAuth Server in Supabase

1. Go to **Authentication** → **OAuth Server**
2. Toggle **Enable OAuth server functionality** → ON
3. Set:
   - **Site URL**: `https://www.mentu.ai/`
   - **Authorization Path**: `/oauth/consent`
   - **Allow Dynamic OAuth Apps**: ✅ Enabled
4. Click **Save changes**

### Step 4: Configure Claude Code

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "mentu": {
      "type": "http",
      "url": "https://www.mentu.ai/api/mcp",
      "oauth": {
        "authorization_endpoint": "https://www.mentu.ai/oauth/authorize",
        "token_endpoint": "https://www.mentu.ai/api/oauth/token",
        "client_id": "claude-code-client",
        "client_secret": "PASTE_YOUR_CLIENT_SECRET_HERE",
        "redirect_uri": "http://localhost:60956/callback",
        "scope": "read write ledger:read ledger:write"
      }
    }
  }
}
```

### Step 5: Deploy mentu-web

```bash
cd /Users/rashid/Desktop/Workspaces/mentu-web

# Push to git
git add .
git commit -m "feat: implement OAuth server consent screen and endpoints"
git push

# Vercel will auto-deploy (if connected)
# Or deploy manually:
vercel --prod
```

### Step 6: Test OAuth Flow

1. Open terminal
2. Run: `claude`
3. Claude Code will:
   - Open browser to `https://www.mentu.ai/oauth/consent`
   - Show login screen (if not logged in)
   - Show consent screen with permissions
   - Redirect to `http://localhost:60956/callback` with code
   - Exchange code for access token
   - Start using Mentu MCP

## Verification Checklist

- [ ] Database tables created (check in Supabase Table Editor)
- [ ] OAuth application registered (run `SELECT * FROM oauth_applications`)
- [ ] OAuth Server enabled in Supabase Dashboard
- [ ] Site URL and Authorization Path configured
- [ ] Client secret saved securely
- [ ] Claude Code settings.json updated
- [ ] mentu-web deployed to production
- [ ] `/oauth/consent` page accessible
- [ ] OAuth flow tested end-to-end

## Troubleshooting

### "Table does not exist"
- Re-run the migration SQL in Supabase SQL Editor
- Check for errors in the SQL output

### "User not found" when registering client
- Update the email in the registration SQL
- Verify you have an account in `auth.users` table

### "Invalid client credentials"
- Double-check the client_secret in settings.json
- Ensure no extra spaces or quotes

### Browser doesn't open during OAuth
- Check Claude Code version (needs to support OAuth)
- Verify redirect_uri matches exactly: `http://localhost:60956/callback`

### Consent screen shows error
- Check browser console for errors
- Verify mentu-web is deployed and `/oauth/consent` is accessible
- Check Supabase logs for errors

## Next Steps

After successful OAuth setup:

1. **Test MCP calls**:
   ```bash
   # In Claude Code
   echo "Use mcp__mentu__* tools to interact with Mentu"
   ```

2. **Monitor usage**:
   ```sql
   -- See active tokens
   SELECT * FROM oauth_access_tokens
   WHERE expires_at > NOW()
   ORDER BY created_at DESC;
   ```

3. **Revoke access** (if needed):
   ```sql
   DELETE FROM oauth_access_tokens
   WHERE user_id = 'your-user-id';
   ```

---

**Ready to Deploy?**

Run through Steps 1-6 above, then test with `claude` command!
