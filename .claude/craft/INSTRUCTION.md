# INSTRUCTION: Architecture Completion for mentu-web

**Mode:** Executor
**Author:** agent:claude-auditor
**Date:** 2026-01-03
**Audit Status:** APPROVED

---

## Audit Summary

The PRD requirements have been validated against:
- ✅ Canonical schema: `mentu-ai/.mentu/genesis.key`
- ✅ Recent example: `claude-code/.mentu/genesis.key`
- ✅ Config pattern: `claude-code/.mentu/config.yaml`
- ✅ CLAUDE.md template: `mentu-proxy/CLAUDE.md`
- ✅ Existing manifest: `.mentu/manifest.yaml`

**Findings:**
1. Actor `user:dashboard` confirmed in manifest.yaml line 182
2. Dashboard is read-only visualization layer (consumes via mentu-proxy)
3. Trust gradient required per ecosystem standards
4. All referenced files and dependencies exist

---

## File 1: CLAUDE.md

**Location:** `CLAUDE.md` (repository root)

```markdown
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
```

---

## File 2: .mentu/genesis.key

**Location:** `.mentu/genesis.key`

```yaml
genesis:
  version: "1.0"
  created: "2026-01-03T00:00:00Z"

identity:
  workspace: "mentu-web"
  owner: "Rashid Azarang"
  name: "Mentu Dashboard"
  description: "Visualization interface for the Mentu commitment ledger"

constitution:
  principles:
    - id: "evidence-required"
      statement: "Commitments close with proof, not assertion"
    - id: "lineage-preserved"
      statement: "Every commitment traces to its origin"
    - id: "append-only"
      statement: "Nothing edited, nothing deleted"

permissions:
  actors:
    # Owners - full access
    "Rashid Azarang":
      role: "owner"
      author_types: [architect, auditor, executor]
      operations: [capture, commit, claim, release, close, annotate, submit, approve, reopen, publish]
    "rashid.azarang.e@gmail.com":
      role: "owner"
      author_types: [architect, auditor, executor]
      operations: [capture, commit, claim, release, close, annotate, submit, approve, reopen, publish]

    # Primary actor for this repository - read-only dashboard
    "user:dashboard":
      role: "viewer"
      author_types: []
      operations: [capture, annotate]
      description: "Dashboard interface - displays data, captures observations only"

    # Trust Gradient Agents (inherited from ecosystem)
    "agent:claude-architect":
      role: "architect"
      author_type: architect
      operations: [capture, annotate]
      description: "Remote agent producing strategic intent only"
    "agent:claude-auditor":
      role: "auditor"
      author_types: [auditor, executor]
      operations: [capture, commit, claim, release, close, annotate, submit]
      description: "Leading agent that audits and validates intents"
    "agent:claude-executor":
      role: "executor"
      author_type: executor
      operations: [capture, commit, claim, release, close, annotate, submit]
      description: "Agent that implements audited instructions"

    # Services
    "system":
      role: "system"
      operations: [approve]

  defaults:
    authenticated:
      operations: [capture, annotate]

trust_gradient:
  enabled: true

  author_types:
    architect:
      trust_level: untrusted
      allowed_operations: [capture, annotate]
      allowed_kinds:
        - architect-intent
        - strategic-intent
        - clarification
      constraints:
        no_file_paths: true
        no_code_snippets: true
        no_implementation_details: true

    auditor:
      trust_level: trusted
      allowed_operations: [capture, annotate, commit, claim, release, close]
      allowed_kinds:
        - audit-evidence
        - audit-approval
        - audit-rejection
        - audit-modification
        - validated-instruction
        - checkpoint
      can_approve_intents: true
      can_reject_intents: true
      can_transform_to_craft: true

    executor:
      trust_level: authorized
      allowed_operations: [capture, commit, claim, release, close, annotate, submit]
      allowed_kinds:
        - execution-progress
        - result-document
        - implementation-evidence
        - execution-start
      requires_audit: true
      scope_bounded: true

  constraints:
    - match: { author_type: architect }
      deny: [close, approve, submit, commit]
    - match: { author_type: executor }
      recommend_provenance: true

constraints:
  require_claim:
    - match: all

federation:
  enabled: false

lineage:
  parent: null
  amendments: []
```

---

## File 3: .mentu/config.yaml

**Location:** `.mentu/config.yaml`

```yaml
# Configuration for mentu-web repository
# Environment-specific settings - NO SECRETS

api:
  # Reference environment variables, do not hardcode
  proxy_url: ${MENTU_API_URL}
  workspace_id: ${MENTU_WORKSPACE_ID}

actor:
  default: user:dashboard

cloud:
  enabled: true
  endpoint: ${MENTU_API_URL}
  workspace_id: ${MENTU_WORKSPACE_ID}

integrations:
  # Dashboard is read-only, consumes data only
  github:
    enabled: false
  notion:
    enabled: false
```

---

## Execution Checklist

The Executor MUST perform these steps in order:

1. [ ] **Create CLAUDE.md**
   - Location: `/Users/rashid/Desktop/Workspaces/mentu-web/CLAUDE.md`
   - Content: Exact markdown from File 1 section above
   - Verification: File exists at root level

2. [ ] **Create genesis.key**
   - Location: `/Users/rashid/Desktop/Workspaces/mentu-web/.mentu/genesis.key`
   - Content: Exact YAML from File 2 section above
   - Verification: YAML is valid, actor `user:dashboard` present

3. [ ] **Create config.yaml**
   - Location: `/Users/rashid/Desktop/Workspaces/mentu-web/.mentu/config.yaml`
   - Content: Exact YAML from File 3 section above
   - Verification: No hardcoded secrets, uses ${ENV_VAR} syntax

4. [ ] **Validate structure**
   - Run: `ls -la .mentu/` to confirm all files present
   - Expected: `genesis.key`, `config.yaml`, `manifest.yaml`, `ledger.jsonl`

5. [ ] **Report completion**
   - All three files created
   - No modifications to existing files
   - Ready for production

---

## Constraints Verified

| Constraint | Status |
|------------|--------|
| genesis.key actor is `user:dashboard` | ✅ Confirmed from manifest.yaml |
| Dashboard is read-only | ✅ Operations limited to capture, annotate |
| Trust gradient enabled | ✅ Full trust_gradient section included |
| config.yaml uses environment variables | ✅ No hardcoded secrets |
| CLAUDE.md follows mentu-proxy template | ✅ Same structure applied |

---

*Audit complete. Executor may proceed with implementation.*
