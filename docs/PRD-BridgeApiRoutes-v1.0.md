---
id: PRD-BridgeApiRoutes-v1.0
path: docs/PRD-BridgeApiRoutes-v1.0.md
type: prd
intent: reference
version: "1.0"
created: 2026-01-05
last_updated: 2026-01-05
tier: T2
children:
  - HANDOFF-BridgeApiRoutes-v1.0
dependencies:
  - AUDIT-BridgeApiRoutes-v1.0
  - INTENT-BridgeApiRoutes-v1.0
mentu:
  commitment: cmt_4dd68c78
  status: pending
---

# PRD: BridgeApiRoutes v1.0

## Mission

Implement missing Next.js API route handlers that proxy bridge operations (spawn, stop, dev-server, create-pr, merge) to mentu-proxy, enabling the Kanban board's action buttons to function end-to-end.

---

## Problem Statement

### Current State

```
Frontend (buttons)          Next.js API             mentu-proxy
──────────────────          ───────────            ──────────────
SpawnAgentButton ────────→ /api/bridge/spawn ──X   (route missing)
DevServerButton ─────────→ /api/bridge/dev-server ──X
CreatePRButton ──────────→ /api/bridge/create-pr ──X
MergeButton ─────────────→ /api/bridge/merge ──X

Result: 405 Method Not Allowed
```

The UI components (buttons, dialogs) are fully implemented but the backend API routes don't exist. Users clicking these buttons receive 405 errors because Next.js has no route handlers for `/api/bridge/*` paths.

### Desired State

```
Frontend (buttons)          Next.js API             mentu-proxy
──────────────────          ───────────            ──────────────
SpawnAgentButton ────────→ /api/bridge/spawn ───→ /bridge/spawn ───→ mentu-bridge
DevServerButton ─────────→ /api/bridge/dev-server → /bridge/dev-server → mentu-bridge
CreatePRButton ──────────→ /api/bridge/create-pr → /bridge/create-pr → mentu-bridge
MergeButton ─────────────→ /api/bridge/merge ───→ /bridge/merge ───→ mentu-bridge

Result: 200 OK, operation executed
```

All bridge buttons work end-to-end, following the same proxy pattern as `/api/ops/approve`.

---

## Completion Contract

**First action**: Update `.claude/completion.json`:

```json
{
  "version": "2.0",
  "name": "BridgeApiRoutes",
  "tier": "T2",
  "required_files": [
    "src/app/api/bridge/spawn/route.ts",
    "src/app/api/bridge/stop/route.ts",
    "src/app/api/bridge/dev-server/route.ts",
    "src/app/api/bridge/create-pr/route.ts",
    "src/app/api/bridge/merge/route.ts"
  ],
  "checks": {
    "tsc": true,
    "build": true,
    "test": false
  },
  "mentu": {
    "enabled": true,
    "actor": "agent:claude-executor",
    "commitments": {
      "mode": "dynamic",
      "min_count": 1,
      "require_closed": true,
      "require_evidence": true
    }
  },
  "max_iterations": 50
}
```

---

## Core Concepts

### Proxy Pattern

The dashboard doesn't execute operations directly. It proxies requests to mentu-proxy (Cloudflare Worker) which routes them to mentu-bridge (daemon). This maintains the dashboard's read-only nature while enabling orchestration.

### Bridge Operations

Operations that spawn agents, manage dev servers, or interact with git worktrees. These are executed by mentu-bridge on a machine with file system access.

### Environment Variables

- `MENTU_API_URL`: Base URL for mentu-proxy (default: `https://mentu-proxy.affihub.workers.dev`)
- `MENTU_PROXY_TOKEN`: Authentication token for proxy requests

---

## Specification

### Types

```typescript
// Request body for spawn
interface SpawnRequest {
  workspace_id: string;
  commitment_id: string;
  prompt: string;
  with_worktree?: boolean;
}

// Request body for dev-server
interface DevServerRequest {
  workspace_id: string;
  commitment_id: string;
  action: 'start' | 'stop';
}

// Request body for create-pr
interface CreatePRRequest {
  workspace_id: string;
  commitment_id: string;
  title: string;
  description?: string;
  base_branch?: string;
}

// Request body for merge
interface MergeRequest {
  workspace_id: string;
  commitment_id: string;
}

// Request body for stop
interface StopRequest {
  workspace_id: string;
  commitment_id?: string;
  command_id?: string;
}
```

### Operations

| Operation | HTTP Method | Endpoint | Proxies To |
|-----------|-------------|----------|------------|
| Spawn Agent | POST | `/api/bridge/spawn` | `/bridge/spawn` |
| Stop Agent | POST | `/api/bridge/stop` | `/bridge/stop` |
| Dev Server | POST | `/api/bridge/dev-server` | `/bridge/dev-server` |
| Create PR | POST | `/api/bridge/create-pr` | `/bridge/create-pr` |
| Merge | POST | `/api/bridge/merge` | `/bridge/merge` |

### Validation Rules

- All requests must include `workspace_id`
- `MENTU_PROXY_TOKEN` must be configured (500 error if missing)
- Invalid JSON body returns 400
- Proxy errors are passed through with original status code

---

## Implementation

### Deliverables

| File | Purpose |
|------|---------|
| `src/app/api/bridge/spawn/route.ts` | Proxy spawn agent requests |
| `src/app/api/bridge/stop/route.ts` | Proxy stop agent requests |
| `src/app/api/bridge/dev-server/route.ts` | Proxy dev server start/stop |
| `src/app/api/bridge/create-pr/route.ts` | Proxy create PR requests |
| `src/app/api/bridge/merge/route.ts` | Proxy merge requests |

### Build Order

1. **Spawn Route**: Core operation for starting agent work
2. **Stop Route**: Complement to spawn for cancellation
3. **Dev Server Route**: Development workflow support
4. **Create PR Route**: Git integration for review workflow
5. **Merge Route**: Final step in review workflow

### Integration Points

| System | Integration | Notes |
|--------|-------------|-------|
| mentu-proxy | HTTP API | All routes proxy through this gateway |
| Supabase | Real-time | UI updates via subscriptions (already working) |
| Kanban Buttons | Frontend | Already implemented, waiting for backend |

---

## Constraints

- **Must follow existing pattern**: Use `/api/ops/approve` as template
- **No direct execution**: Routes only proxy, never execute operations
- **Backwards compatible**: No changes to existing routes or components
- **Error pass-through**: Preserve error details from mentu-proxy

---

## Success Criteria

### Functional

- [ ] POST `/api/bridge/spawn` returns 200 when given valid payload
- [ ] POST `/api/bridge/stop` returns 200 when given valid payload
- [ ] POST `/api/bridge/dev-server` returns 200 when given valid payload
- [ ] POST `/api/bridge/create-pr` returns 200 when given valid payload
- [ ] POST `/api/bridge/merge` returns 200 when given valid payload
- [ ] All routes return 500 if `MENTU_PROXY_TOKEN` is not configured
- [ ] All routes return 400 if required fields are missing

### Quality

- [ ] All files compile without TypeScript errors (`tsc --noEmit`)
- [ ] `npm run build` completes successfully
- [ ] Routes follow the same code style as `/api/ops/approve`

### Integration

- [ ] SpawnAgentButton works end-to-end (UI → API → proxy)
- [ ] DevServerButton works end-to-end
- [ ] CreatePRButton works end-to-end
- [ ] MergeButton works end-to-end

---

## Verification Commands

```bash
# Verify build
npm run build

# Verify TypeScript
npx tsc --noEmit

# Verify routes exist
ls -la src/app/api/bridge/*/route.ts

# Test spawn endpoint (requires valid token and proxy)
curl -X POST http://localhost:3000/api/bridge/spawn \
  -H "Content-Type: application/json" \
  -d '{"workspace_id":"test","commitment_id":"cmt_test","prompt":"test"}'

# Verify Mentu state
mentu list commitments --state open
```

---

## References

- `docs/AUDIT-BridgeApiRoutes-v1.0.md`: Audit approval for this work
- `docs/INTENT-BridgeApiRoutes-v1.0.md`: Original strategic intent
- `src/app/api/ops/approve/route.ts`: Pattern to follow

---

*Complete the bridge between UI and backend - make the Kanban buttons work.*
