# Mentu Web

Next.js dashboard for the Mentu ecosystem. Visualizes commitments, memories, ledger operations, and bridge status.

## Identity

```
Location: /Users/rashid/Desktop/Workspaces/mentu-web
Role: Visualization dashboard (Eyes of the organism)
Version: 0.1.0
Actor: user:dashboard
Deployed: Vercel
```

## What This Repo Does

The dashboard is the **Eyes** of the Mentu organism—a read-only visualization layer that displays:

1. **Commitments** → Task lifecycle from open → claimed → in_review → closed
2. **Memories** → Captures, observations, and evidence
3. **Ledger** → Append-only operation history
4. **Bridge** → Command queue status and machine heartbeats
5. **Settings** → Actor mappings, GitHub integration, webhooks

## Architecture

```
src/
├── app/                          # Next.js App Router pages
│   ├── workspace/[workspace]/    # Workspace-scoped routes
│   │   ├── commitments/          # Commitment list & detail
│   │   ├── memories/             # Memory list & detail
│   │   ├── ledger/               # Operation log
│   │   ├── bridge/               # Bridge commands & machines
│   │   └── settings/             # Configuration pages
│   ├── login/                    # Supabase auth
│   └── auth/callback/            # OAuth callback
├── components/
│   ├── ui/                       # Shared UI components (shadcn)
│   ├── layout/                   # Sidebar, header, mobile nav
│   ├── workspace/                # Dashboard, stats, activity
│   ├── commitment/               # Commitment views & dialogs
│   ├── memory/                   # Memory views & dialogs
│   ├── bridge/                   # Bridge views
│   ├── ledger/                   # Ledger view
│   └── settings/                 # Settings pages
├── hooks/                        # Data fetching hooks
│   ├── useCommitments.ts
│   ├── useMemories.ts
│   ├── useOperations.ts
│   ├── useBridgeCommands.ts
│   ├── useBridgeMachines.ts
│   └── useRealtime.ts
└── lib/
    ├── supabase/                 # Supabase client & types
    ├── mentu/                    # Domain types & operations
    └── utils/                    # Helpers (cn, time, actor)
```

## Pages

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | redirect | Redirects to workspace |
| `/login` | LoginPage | Supabase authentication |
| `/workspace/[id]` | WorkspaceDashboard | Overview with stats |
| `/workspace/[id]/commitments` | CommitmentsListPage | Filtered commitment list |
| `/workspace/[id]/commitments/[id]` | CommitmentDetailPage | Single commitment with timeline |
| `/workspace/[id]/memories` | MemoriesListPage | Filtered memory list |
| `/workspace/[id]/memories/[id]` | MemoryDetailPage | Single memory |
| `/workspace/[id]/ledger` | LedgerPage | Operation history |
| `/workspace/[id]/bridge` | BridgePage | Command queue |
| `/workspace/[id]/bridge/[id]` | BridgeCommandDetailPage | Command detail |
| `/workspace/[id]/settings` | SettingsPage | Settings hub |
| `/workspace/[id]/settings/actors` | ActorMappingsPage | Actor configuration |
| `/workspace/[id]/settings/github` | GitHubSettingsPage | GitHub integration |
| `/workspace/[id]/settings/webhooks` | WebhookLogsPage | Webhook history |

## Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)

# Build & Deploy
npm run build            # Production build
npm run start            # Start production server
vercel deploy            # Deploy to Vercel

# Quality
npm run lint             # ESLint check
npm run type-check       # TypeScript check
```

## Ecosystem Context

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MENTU ECOSYSTEM                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────┐                                                │
│  │   mentu-web     │  ← This repo (Eyes)                            │
│  │   (Vercel)      │  • Visualization only                          │
│  │                 │  • No write operations                         │
│  │                 │  • Displays state, doesn't modify              │
│  └────────┬────────┘                                                │
│           │                                                          │
│           ▼                                                          │
│  ┌─────────────────┐                                                │
│  │  mentu-proxy    │  API gateway (for mobile compatibility)        │
│  │  (Cloudflare)   │                                                │
│  └────────┬────────┘                                                │
│           │                                                          │
│     ┌─────┴─────┐                                                   │
│     │           │                                                    │
│     ▼           ▼                                                    │
│  ┌──────┐   ┌──────────┐                                            │
│  │Mentu │   │ Supabase │  Direct for web, via proxy for mobile      │
│  │ API  │   │          │                                            │
│  └──────┘   └──────────┘                                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Dependencies

| Repo | Relationship | What I Use |
|------|--------------|------------|
| mentu-ai | schema-consumer | Types, state machine, operation definitions |
| mentu-proxy | gateway-consumer | API routing for external/mobile access |

## Environment Variables

Set in Vercel project settings:

```bash
NEXT_PUBLIC_SUPABASE_URL      # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY # Supabase anon key (public)
MENTU_API_URL                 # Mentu API endpoint
MENTU_WORKSPACE_ID            # Default workspace ID
```

## Authentication (Agent Service)

The agent service (`agent-service/`) uses the **Claude Agent SDK** which automatically uses your Claude Code OAuth token:

```typescript
// agent-service/src/claude/client.ts
import { query, type Options } from '@anthropic-ai/claude-agent-sdk';

// Agent SDK auto-detects Claude Code authentication
export function createAgentQuery(prompt: string, options?: Partial<Options>) {
  return query({
    prompt,
    options: {
      systemPrompt: SYSTEM_PROMPT,
      allowedTools: ['Read', 'Glob', 'Grep', 'Bash', 'Edit', 'Write'],
      permissionMode: 'acceptEdits',
      ...options,
    },
  });
}
```

**Authentication**: The Agent SDK automatically uses `CLAUDE_CODE_OAUTH_TOKEN` from Claude Code's authentication. This means:
- Uses Max subscription ($200/mo unlimited) instead of per-API-call billing
- No need to set `ANTHROPIC_API_KEY` for the agent service
- Claude Code must be authenticated on the machine running the agent service

### Running the Agent Service

```bash
cd agent-service
npm run dev  # Starts on port 8081
```

See `Workspaces/CLAUDE.md` for the full authentication convention.

## Agent Entry Protocol

When entering this repo:
1. Read this file first
2. Check `.mentu/manifest.yaml` for capabilities
3. This is a Next.js app - changes require `npm run build` to validate
4. Test locally with `npm run dev` before deploying
5. Dashboard is read-only - it displays data, doesn't create commitments

## Rules

1. **Read-Only**: Dashboard displays data, doesn't modify commitments
2. **No Secrets in Code**: Use environment variables
3. **Type Safety**: All Supabase queries must be typed
4. **Real-time**: Use Supabase subscriptions for live updates
5. **Responsive**: All views must work on mobile

## Data Flow

```
Supabase Tables          Dashboard Hooks           Components
─────────────────        ─────────────────         ──────────────
memories          ─────► useMemories()      ─────► MemoriesListPage
commitments       ─────► useCommitments()   ─────► CommitmentsListPage
operations        ─────► useOperations()    ─────► LedgerPage
bridge_commands   ─────► useBridgeCommands()─────► BridgePage
bridge_machines   ─────► useBridgeMachines()─────► BridgePage
webhook_logs      ─────► useWebhookLogs()   ─────► WebhookLogsPage
actor_mappings    ─────► useActorMappings() ─────► ActorMappingsPage
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Auth redirect loop | Check Supabase callback URL configuration |
| Data not loading | Verify Supabase anon key and RLS policies |
| Real-time not working | Check Supabase subscription limits |
| Build fails | Run `npm run type-check` for TypeScript errors |
