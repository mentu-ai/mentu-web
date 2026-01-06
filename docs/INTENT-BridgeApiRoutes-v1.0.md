---
id: INTENT-BridgeApiRoutes-v1.0
path: docs/INTENT-BridgeApiRoutes-v1.0.md
type: intent
intent: strategic
version: "1.0"
created: 2026-01-05
last_updated: 2026-01-05
architect: user:rashid
status: submitted
mentu:
  evidence: pending
---

# Intent: Bridge API Routes

> **Strategic Intent Document**
>
> This document captures the strategic goal for fixing missing Bridge API routes.
> Provided inline via error report in conversation.

---

## What

The mentu-web dashboard has UI components (buttons, dialogs) for bridge operations but lacks the corresponding API route handlers. Users clicking these buttons receive 405 (Method Not Allowed) errors because the Next.js API routes don't exist.

Additionally, the CloudTerminal component attempts WebSocket connections to `wss://api.mentu.ai/agent` which fails.

---

## Why

1. **User Experience**: Buttons exist but don't work - this creates confusion and broken workflows
2. **Feature Completion**: The Kanban board workflow relies on spawn, dev-server, create-pr, and merge operations
3. **Architecture Integrity**: The proxy pattern is established (`/api/ops/approve` works) but incomplete for bridge operations
4. **Dashboard Value**: Without these routes, the dashboard cannot orchestrate agent work on commitments

---

## Constraints

1. **Follow Existing Pattern**: Must use the same proxy pattern as `/api/ops/approve`
2. **No Direct Execution**: Dashboard routes proxy to mentu-proxy, not execute directly
3. **Authentication Required**: All bridge routes must verify workspace membership
4. **Environment Variables**: Use existing `MENTU_API_URL` and `MENTU_PROXY_TOKEN` config
5. **CloudTerminal Scope**: WebSocket infrastructure is out of scope (separate concern)

---

## Expected Outcome

1. POST `/api/bridge/spawn` returns 200 and proxies to mentu-proxy
2. POST `/api/bridge/stop` returns 200 and proxies to mentu-proxy
3. POST `/api/bridge/dev-server` returns 200 and proxies to mentu-proxy
4. POST `/api/bridge/create-pr` returns 200 and proxies to mentu-proxy
5. POST `/api/bridge/merge` returns 200 and proxies to mentu-proxy
6. All existing UI components (buttons) work end-to-end
7. Error handling matches the existing `/api/ops/approve` pattern

---

## Open Questions

1. Should CloudTerminal WebSocket be addressed in this scope or deferred?
2. Is mentu-proxy ready to receive these bridge operations?
3. Are there additional environment variables needed beyond existing ones?

---

*This intent was synthesized from inline error report provided by the user.*
