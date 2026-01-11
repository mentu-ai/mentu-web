# Agent Service Deployment

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PRODUCTION ARCHITECTURE                                                    │
│                                                                             │
│  Browser (mentu.ai)                                                         │
│       │                                                                     │
│       ▼                                                                     │
│  mentu-web (Vercel)                                                         │
│       │                                                                     │
│       │ WebSocket: wss://agent.mentu.ai/agent                              │
│       ▼                                                                     │
│  ┌─────────────────┐                                                        │
│  │  Caddy (VPS)    │  SSL termination, reverse proxy                       │
│  │  :443 → :8081   │                                                        │
│  └────────┬────────┘                                                        │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────┐                                                        │
│  │ agent-service   │  Node.js service                                      │
│  │ (PM2 managed)   │  Uses Claude Agent SDK                                │
│  │     :8081       │                                                        │
│  └────────┬────────┘                                                        │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────┐                                                        │
│  │ Claude Code     │  OAuth token stored in ~/.claude/                     │
│  │ (authenticated) │                                                        │
│  └─────────────────┘                                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Why VPS?

The Claude Agent SDK uses OAuth tokens stored locally on the machine where Claude Code is authenticated. This means:
- **Cannot deploy to serverless** (Vercel, Cloudflare Workers) - no persistent filesystem
- **Cannot deploy to container platforms** easily - requires Claude Code auth
- **Must run on VPS** where `claude login` has been performed

## Prerequisites

1. **VPS Access**: SSH access to mentu-vps-01 (208.167.255.71)
2. **Claude Code Auth**: Run `claude` on VPS and authenticate with OAuth
3. **Node.js**: v18+ installed on VPS
4. **PM2**: For process management
5. **Caddy**: For SSL termination and reverse proxy (already configured)

## Deployment Steps

### 1. Sync Code to VPS

The code syncs automatically via SyncThing:
```
Mac: /Users/rashid/Desktop/Workspaces/mentu-web
VPS: /home/mentu/Workspaces/mentu-web
```

Or manually:
```bash
rsync -avz --exclude node_modules \
  /Users/rashid/Desktop/Workspaces/mentu-web/agent-service \
  mentu@208.167.255.71:/home/mentu/Workspaces/mentu-web/
```

### 2. Install Dependencies

```bash
ssh mentu@208.167.255.71
cd /home/mentu/Workspaces/mentu-web/agent-service
npm install
```

### 3. Configure Environment

Create `.env` on VPS:
```bash
cat > .env << 'EOF'
# Server
PORT=8081

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=xxx
EOF
```

**IMPORTANT**: Do NOT set `ANTHROPIC_API_KEY` in .env. The service uses OAuth tokens from Claude Code authentication, not API keys.

### 4. Authenticate Claude Code

```bash
# On VPS - authenticate once
claude

# Follow OAuth flow in browser
# Token stored in ~/.claude/
```

### 5. Start with PM2

```bash
# Build TypeScript
npm run build

# Start with PM2 (uses server.js which imports from dist/)
cd /home/mentu/Workspaces/mentu-web/agent-service
npx pm2 start server.js --name agent-service
npx pm2 save

# To restart after changes:
npm run build
npx pm2 restart agent-service
```

### 6. Configure Caddy (already done)

The VPS uses Caddy for reverse proxy. The configuration is in `/home/mentu/mentu-vps/config/caddy/Caddyfile`:

```caddyfile
agent.mentu.ai {
    handle /agent* {
        reverse_proxy localhost:8081
    }
    handle /health {
        reverse_proxy localhost:8081
    }
    handle {
        respond "Agent Service" 200
    }
}
```

Caddy automatically handles SSL certificates via Let's Encrypt.

### 7. Update Frontend

In mentu-web, update `.env.production`:
```
NEXT_PUBLIC_AGENT_WS_URL=wss://agent.mentu.ai/agent
```

## Security Features

### Anti-Loop Protection
- Only read-only tools allowed (Read, Glob, Grep)
- No Bash, Write, Edit, Task tools
- System prompt explicitly forbids spawning agents
- maxTurns=25 prevents runaway agents

### Authentication
- Production requires Supabase JWT token
- Token passed in WebSocket URL: `wss://host/agent?token=xxx`
- Development mode allows unauthenticated connections

### Rate Limiting
- 10 requests/minute per user
- 60 requests/hour per user
- 100 requests/minute global
- 3 concurrent connections per user

### Observability
- Structured JSON logging in production
- Request IDs for tracing
- Duration tracking for all requests
- Tool use logging

## Monitoring

### Health Check
```bash
curl https://agent.mentu.ai/health
# {"status":"ok","service":"agent-service"}
```

### Logs
```bash
pm2 logs agent-service
# or
pm2 logs agent-service --lines 100 --raw | jq .
```

### Metrics
```bash
pm2 monit
```

## Troubleshooting

### Connection Refused
```bash
# Check if service is running
pm2 status
pm2 restart agent-service
```

### Authentication Errors
```bash
# Re-authenticate Claude Code
claude
# Follow OAuth flow
```

### WebSocket Not Connecting
```bash
# Check Caddy status
sudo systemctl status caddy

# Check WebSocket headers
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: test" \
  https://agent.mentu.ai/agent
```

### Rate Limited
```bash
# Check current limits in rate-limiter.ts
# Adjust CONFIG values if needed
```

## Rollback

```bash
# If issues, restart with last known good:
pm2 stop agent-service
cd /home/mentu/Workspaces/mentu-web/agent-service
git checkout HEAD~1
npm install
pm2 start agent-service
```
