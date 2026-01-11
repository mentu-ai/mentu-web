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
│       │ WebSocket: wss://mentu.rashidazarang.com/agent                     │
│       ▼                                                                     │
│  ┌─────────────────┐                                                        │
│  │  Nginx (VPS)    │  SSL termination, reverse proxy                       │
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
5. **Nginx**: For SSL termination and reverse proxy

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
NODE_ENV=production
REQUIRE_AUTH=true
LOG_LEVEL=info

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=xxx

# Security
ALLOWED_ORIGINS=https://mentu.ai,https://www.mentu.ai
EOF
```

### 4. Authenticate Claude Code

```bash
# On VPS - authenticate once
claude

# Follow OAuth flow in browser
# Token stored in ~/.claude/
```

### 5. Start with PM2

```bash
# Build (if using TypeScript compilation)
npm run build

# Start with PM2
pm2 start npm --name "agent-service" -- run start
pm2 save

# Or for development with hot reload:
pm2 start npm --name "agent-service" -- run dev
```

### 6. Configure Nginx

Add to `/etc/nginx/sites-available/mentu`:

```nginx
# WebSocket proxy for agent service
location /agent {
    proxy_pass http://127.0.0.1:8081;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # WebSocket timeouts
    proxy_read_timeout 86400;
    proxy_send_timeout 86400;
}

# Health check endpoint
location /agent-health {
    proxy_pass http://127.0.0.1:8081/health;
    proxy_set_header Host $host;
}
```

Reload Nginx:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

### 7. Update Frontend

In mentu-web, update `.env.production`:
```
NEXT_PUBLIC_AGENT_WS_URL=wss://mentu.rashidazarang.com/agent
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
curl https://mentu.rashidazarang.com/agent-health
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
# Check Nginx config
sudo nginx -t
sudo systemctl status nginx

# Check WebSocket headers
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: test" \
  https://mentu.rashidazarang.com/agent
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
