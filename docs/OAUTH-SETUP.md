# Mentu OAuth Server Setup Guide

This guide explains how to set up and use the Mentu OAuth Server to allow third-party applications (like Claude Code) to authenticate and access your Mentu workspace.

## Architecture

```
┌─────────────────┐
│  Third-Party    │
│  Application    │
│  (Claude Code)  │
└────────┬────────┘
         │
         │ 1. Authorization Request
         ▼
┌─────────────────┐
│   /oauth/       │
│   authorize     │
└────────┬────────┘
         │
         │ 2. User not logged in?
         ▼
┌─────────────────┐
│   /login        │
└────────┬────────┘
         │
         │ 3. After login
         ▼
┌─────────────────┐
│   /oauth/       │
│   consent       │ ← User approves/denies
└────────┬────────┘
         │
         │ 4. Redirect with code
         ▼
┌─────────────────┐
│  Application    │
│  Callback       │
└────────┬────────┘
         │
         │ 5. Exchange code for token
         ▼
┌─────────────────┐
│   /api/oauth/   │
│   token         │
└────────┬────────┘
         │
         │ 6. Access token
         ▼
┌─────────────────┐
│  Application    │
│  Uses API       │
└─────────────────┘
```

## Database Setup

### 1. Apply Migration

Run the migration to create OAuth tables:

```bash
# Via Supabase Dashboard
# Go to SQL Editor → New Query
# Paste contents of migrations/create_oauth_tables.sql
# Run the query

# Or via CLI
supabase db push
```

### 2. Enable OAuth Server in Supabase Dashboard

1. Go to **Authentication** → **OAuth Server**
2. Click **Enable OAuth server functionality**
3. Set configuration:
   - **Site URL**: `https://www.mentu.ai/`
   - **Authorization Path**: `/oauth/consent`
   - **Allow Dynamic OAuth Apps**: Enabled (optional)
4. Click **Save changes**

## Registering an OAuth Application

### Option 1: Via Supabase Dashboard

1. Go to SQL Editor
2. Run:

```sql
INSERT INTO oauth_applications (
  client_id,
  client_secret,
  name,
  description,
  redirect_uris,
  allowed_scopes,
  owner_id
) VALUES (
  'claude-code-client',
  -- Generate a secure secret
  encode(gen_random_bytes(32), 'base64'),
  'Claude Code',
  'Anthropic Claude Code CLI',
  ARRAY['http://localhost:60956/callback', 'http://127.0.0.1:60956/callback'],
  ARRAY['read', 'write', 'ledger:read', 'ledger:write', 'commitments:read', 'commitments:write'],
  (SELECT id FROM auth.users WHERE email = 'your-email@example.com')
);

-- Retrieve the client_secret
SELECT client_id, client_secret FROM oauth_applications WHERE client_id = 'claude-code-client';
```

**Save the `client_secret` - it will only be shown once!**

### Option 2: Programmatic Registration (if dynamic apps enabled)

```bash
curl -X POST https://www.mentu.ai/api/oauth/apps \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Claude Code",
    "description": "Anthropic Claude Code CLI",
    "redirect_uris": ["http://localhost:60956/callback"],
    "scopes": ["read", "write", "ledger:read"]
  }'
```

## OAuth Flow

### 1. Authorization Request

Application redirects user to:

```
https://www.mentu.ai/oauth/authorize?
  client_id=claude-code-client&
  redirect_uri=http://localhost:60956/callback&
  response_type=code&
  scope=read%20write&
  state=random-state-string
```

### 2. User Consent

User sees consent screen at `/oauth/consent` and approves or denies.

### 3. Authorization Code

Application receives callback:

```
http://localhost:60956/callback?
  code=949d7e12-1321-4994-8ded-3efd4fc67abd&
  state=random-state-string
```

### 4. Token Exchange

Application exchanges code for access token:

```bash
curl -X POST https://www.mentu.ai/api/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "authorization_code",
    "code": "949d7e12-1321-4994-8ded-3efd4fc67abd",
    "client_id": "claude-code-client",
    "client_secret": "YOUR_CLIENT_SECRET",
    "redirect_uri": "http://localhost:60956/callback"
  }'
```

Response:

```json
{
  "access_token": "eyJhbGc...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "def502...",
  "scope": "read write"
}
```

### 5. Using Access Token

```bash
curl https://www.mentu.ai/api/workspace/default/commitments \
  -H "Authorization: Bearer eyJhbGc..."
```

### 6. Refreshing Token

```bash
curl -X POST https://www.mentu.ai/api/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "refresh_token",
    "refresh_token": "def502...",
    "client_id": "claude-code-client",
    "client_secret": "YOUR_CLIENT_SECRET"
  }'
```

## Available Scopes

| Scope | Description |
|-------|-------------|
| `read` | Read commitments, memories, and ledger data |
| `write` | Create and modify commitments and memories |
| `ledger:read` | Read ledger operations and history |
| `ledger:write` | Append operations to the ledger |
| `commitments:read` | Read commitments |
| `commitments:write` | Create and update commitments |
| `memories:read` | Read memories |
| `memories:write` | Create and capture memories |
| `actor:manage` | Manage actor mappings |
| `integrations:manage` | Manage external integrations |
| `profile` | Access profile information |
| `email` | Access email address |

## Claude Code Integration

### 1. Configure Claude Code

Edit your Claude Code settings to use Mentu OAuth:

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
        "client_secret": "YOUR_CLIENT_SECRET",
        "redirect_uri": "http://localhost:60956/callback",
        "scope": "read write ledger:read ledger:write"
      }
    }
  }
}
```

### 2. First Authentication

1. Start Claude Code
2. It will open your browser to the consent screen
3. Log in to Mentu (if not already)
4. Review permissions and click "Authorize"
5. Browser redirects to `localhost:60956/callback` with code
6. Claude Code exchanges code for token
7. Token is stored securely

### 3. Subsequent Uses

Claude Code automatically:
- Uses stored access token
- Refreshes when expired
- Re-authorizes if refresh fails

## Security Best Practices

1. **Client Secrets**: Store securely, never commit to git
2. **HTTPS Only**: Use HTTPS in production for all OAuth URLs
3. **State Parameter**: Always use and validate state parameter to prevent CSRF
4. **Token Expiration**: Access tokens expire in 1 hour, refresh tokens in 30 days
5. **Scope Limitation**: Request only the scopes you need
6. **Redirect URI Validation**: Exact match required, no wildcards

## Troubleshooting

### "Invalid client credentials"
- Verify `client_id` and `client_secret` match database
- Check if application is active (`is_active = true`)

### "Invalid redirect_uri"
- Ensure redirect_uri exactly matches one in `redirect_uris` array
- Check for trailing slashes, http vs https

### "Invalid authorization code"
- Codes expire in 10 minutes
- Codes can only be used once
- Verify `redirect_uri` matches the one used in authorization request

### "Access denied"
- User clicked "Deny" on consent screen
- Check application logs for error details

## Monitoring

### View Active Tokens

```sql
SELECT
  oa.name AS app_name,
  u.email AS user_email,
  oat.scope,
  oat.expires_at,
  oat.created_at
FROM oauth_access_tokens oat
JOIN oauth_applications oa ON oat.client_id = oa.client_id
JOIN auth.users u ON oat.user_id = u.id
WHERE oat.expires_at > NOW()
ORDER BY oat.created_at DESC;
```

### Revoke Access

```sql
-- Revoke all tokens for a user
DELETE FROM oauth_access_tokens WHERE user_id = 'user-uuid';
DELETE FROM oauth_refresh_tokens WHERE user_id = 'user-uuid';

-- Revoke tokens for specific app
DELETE FROM oauth_access_tokens WHERE client_id = 'claude-code-client';
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/oauth/authorize` | GET | Start authorization flow |
| `/oauth/consent` | GET | User consent screen (UI) |
| `/api/oauth/token` | POST | Exchange code for token or refresh token |
| `/api/oauth/callback` | GET | OAuth callback handler |

## Testing

### Manual Testing

Use curl to test the full flow:

```bash
# 1. Get authorization code (open in browser)
https://www.mentu.ai/oauth/authorize?client_id=test-client&redirect_uri=http://localhost:3000&response_type=code&scope=read

# 2. Exchange code (from callback URL)
curl -X POST https://www.mentu.ai/api/oauth/token \
  -H "Content-Type: application/json" \
  -d '{"grant_type":"authorization_code","code":"CODE_FROM_CALLBACK","client_id":"test-client","client_secret":"SECRET","redirect_uri":"http://localhost:3000"}'

# 3. Use access token
curl https://www.mentu.ai/api/workspace/default/commitments \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## Next Steps

- [ ] Apply database migration
- [ ] Enable OAuth Server in Supabase Dashboard
- [ ] Register Claude Code as OAuth client
- [ ] Configure Claude Code with client credentials
- [ ] Test authentication flow
- [ ] Monitor token usage

---

**Documentation Version**: 1.0
**Last Updated**: 2026-01-11
**Mentu OAuth Server**: https://www.mentu.ai/oauth/consent
