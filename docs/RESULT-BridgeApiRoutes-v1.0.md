---
id: RESULT-BridgeApiRoutes-v1.0
path: docs/RESULT-BridgeApiRoutes-v1.0.md
type: result
intent: reference
version: "1.0"
created: 2026-01-06
last_updated: 2026-01-06
actor: agent:claude-code
parent: HANDOFF-BridgeApiRoutes-v1.0
mentu:
  commitment: cmt_4dd68c78
  evidence: mem_a961895e
  status: pending
---

# RESULT: BridgeApiRoutes v1.0

**Completed:** 2026-01-06

---

## Summary

Implemented 5 API route handlers in mentu-web that proxy bridge operations to mentu-proxy. These routes enable the dashboard's Kanban buttons to trigger agent spawn, stop, dev-server, PR creation, and merge operations through the bridge system. All routes follow the established pattern from `/api/ops/approve`, ensuring consistent error handling, token validation, and request proxying.

---

## Activation

The routes are automatically available after deployment. They require `MENTU_PROXY_TOKEN` environment variable to be configured.

```bash
# Test spawn route locally
curl -X POST http://localhost:3000/api/bridge/spawn \
  -H "Content-Type: application/json" \
  -d '{"workspace_id": "ws_xxx", "commitment_id": "cmt_xxx", "prompt": "Execute task"}'

# Test stop route
curl -X POST http://localhost:3000/api/bridge/stop \
  -H "Content-Type: application/json" \
  -d '{"workspace_id": "ws_xxx", "command_id": "cmd_xxx"}'
```

---

## How It Works

```
Dashboard Button Click
        │
        ▼
┌──────────────────────┐
│  Next.js API Route   │
│  /api/bridge/{action}│
└──────────────────────┘
        │
        │ 1. Validate required fields
        │ 2. Check PROXY_TOKEN config
        │ 3. Forward to proxy
        ▼
┌──────────────────────┐
│    mentu-proxy       │
│ /bridge/{action}     │
│ (Cloudflare Worker)  │
└──────────────────────┘
        │
        ▼
┌──────────────────────┐
│    mentu-bridge      │
│  (Local Daemon)      │
│  Executes Command    │
└──────────────────────┘
```

---

## Files Created

### src/app/api/bridge/spawn/route.ts

POST handler for spawning agents. Accepts `workspace_id` (required), `commitment_id`, `prompt`, and `with_worktree` parameters. Proxies to `/bridge/spawn` endpoint.

### src/app/api/bridge/stop/route.ts

POST handler for stopping agents. Accepts `workspace_id` (required), `commitment_id`, and `command_id` parameters. Proxies to `/bridge/stop` endpoint.

### src/app/api/bridge/dev-server/route.ts

POST handler for dev server control. Accepts `workspace_id` (required), `commitment_id`, and `action` (must be "start" or "stop"). Proxies to `/bridge/dev-server` endpoint.

### src/app/api/bridge/create-pr/route.ts

POST handler for GitHub PR creation. Accepts `workspace_id` (required), `commitment_id` (required), `title` (required), `description`, and `base_branch` parameters. Proxies to `/bridge/create-pr` endpoint.

### src/app/api/bridge/merge/route.ts

POST handler for merging worktrees. Accepts `workspace_id` (required) and `commitment_id` (required). Proxies to `/bridge/merge` endpoint.

---

## Files Modified

| File | Change |
|------|--------|
| `.claude/completion.json` | Updated to BridgeApiRoutes configuration |

---

## Test Results

| Test | Command | Result |
|------|---------|--------|
| TypeScript Compilation | `npx tsc --noEmit` | Pass |
| Build | `npm run build` | Pass |

---

## Design Decisions

### 1. Followed Existing Pattern Exactly

**Rationale:** The HANDOFF explicitly required following the `/api/ops/approve` pattern. This ensures consistency across all API routes and reduces cognitive load for future maintenance.

### 2. Required Field Validation Before Token Check

**Rationale:** Validating required fields before checking the token configuration allows for more helpful error messages. A 400 error for missing fields is more actionable than a 500 for misconfigured tokens.

### 3. Default Values for Optional Fields

**Rationale:** `with_worktree` defaults to `true`, `base_branch` defaults to `main`, and `description` defaults to empty string. These defaults match common use cases and reduce required parameters for simple operations.

---

## Mentu Ledger Entry

```
Commitment: cmt_4dd68c78
Status: pending
Evidence: pending
Actor: agent:claude-code
Body: "Implement 5 bridge API routes for mentu-web dashboard"
```

---

## Usage Examples

### Example 1: Spawn Agent for Commitment

```bash
curl -X POST http://localhost:3000/api/bridge/spawn \
  -H "Content-Type: application/json" \
  -d '{
    "workspace_id": "ws_default",
    "commitment_id": "cmt_abc123",
    "prompt": "Read HANDOFF and execute",
    "with_worktree": true
  }'
```

Returns command ID for tracking execution.

### Example 2: Create PR for Completed Work

```bash
curl -X POST http://localhost:3000/api/bridge/create-pr \
  -H "Content-Type: application/json" \
  -d '{
    "workspace_id": "ws_default",
    "commitment_id": "cmt_abc123",
    "title": "feat: implement new feature",
    "description": "Closes #123",
    "base_branch": "main"
  }'
```

Returns PR URL and details from GitHub.

---

## Constraints and Limitations

- Routes require `MENTU_PROXY_TOKEN` environment variable to be configured
- All routes are POST-only; GET requests are not supported
- No authentication/authorization at the route level (relies on proxy token)
- Error details from upstream are passed through but may be truncated

---

## Future Considerations

1. **Rate Limiting**: Add rate limiting to prevent abuse of spawn operations
2. **Request Logging**: Add structured logging for debugging and audit trails
3. **GET Status Endpoints**: Add GET endpoints for checking operation status

---

*Bridge API routes complete - the Kanban can now spawn agents.*
