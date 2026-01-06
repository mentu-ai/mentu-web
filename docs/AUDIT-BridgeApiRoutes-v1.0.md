---
id: AUDIT-BridgeApiRoutes-v1.0
path: docs/AUDIT-BridgeApiRoutes-v1.0.md
type: audit
intent: reference
version: "1.0"
created: 2026-01-05
last_updated: 2026-01-05
intent_ref: INTENT-BridgeApiRoutes-v1.0
craft_ref: PRD-BridgeApiRoutes-v1.0
auditor: agent:claude-auditor
checkpoint:
  git_sha: d47bb9394ceabff074643978a1ecbe67a3d19c72
  timestamp: 2026-01-05T00:00:00Z
verdict: APPROVE
verdict_timestamp: 2026-01-05
mentu:
  evidence: pending
  status: approved
---

# Audit: BridgeApiRoutes

> **Auditor Audit Report**
>
> This document records the audit of the Bridge API Routes strategic intent.
> The verdict determines whether the intent proceeds to implementation.

---

## Intent Summary

**Source**: `docs/INTENT-BridgeApiRoutes-v1.0.md`

The dashboard UI has fully implemented buttons and dialogs for bridge operations (spawn agent, dev server, create PR, merge) but the corresponding Next.js API route handlers don't exist, causing 405 errors when users click these buttons.

### What the Architect Wants

Implement missing API route handlers that proxy bridge operations to mentu-proxy.

### Why It Matters

The dashboard cannot orchestrate agent work on commitments without these routes, leaving the Kanban workflow broken.

### Stated Constraints

- Follow existing proxy pattern (`/api/ops/approve`)
- Dashboard routes proxy to mentu-proxy, not execute directly
- Authentication required for all bridge routes
- CloudTerminal WebSocket is out of scope

---

## Philosophy Alignment

Evaluated against project foundational documents.

### Project Purpose

**Source**: `CLAUDE.md`, `.mentu/manifest.yaml`

| Question | Answer |
|----------|--------|
| Does this intent serve the project's stated purpose? | yes |
| Does it align with the project's direction? | yes |
| Would maintainers likely support this? | yes |

**Assessment**: aligned

**Evidence**:
- CLAUDE.md: "Dashboard is the **Eyes** of the Mentu organism—a read-only visualization layer"
- However, it also states dependency on `mentu-proxy` as `gateway-consumer`
- The routes don't execute operations directly; they proxy to mentu-proxy which handles actual execution
- This maintains the "read-only" spirit by being a pass-through layer

### Governance Compliance

**Source**: `.mentu/genesis.key`

| Question | Answer |
|----------|--------|
| Does this respect the governance model? | yes |
| Are there permission boundaries being crossed? | no |
| Does this require elevated authorization? | no |

**Assessment**: compliant

The `user:dashboard` actor has role "viewer" with `capture, annotate` operations only. The routes themselves don't create commitments or perform write operations - they delegate to mentu-proxy where proper authorization occurs.

---

## Technical Feasibility

### Architecture Support

| Question | Answer |
|----------|--------|
| Can the existing architecture support this? | yes |
| Does this require new infrastructure? | no |
| Are there existing patterns to follow? | yes |

**Assessment**: feasible

### Affected Components

| Component | Path(s) | Impact Level |
|-----------|---------|--------------|
| API Routes | `src/app/api/bridge/*/route.ts` (NEW) | high |
| SpawnAgentButton | `src/components/kanban/actions/SpawnAgentButton.tsx` | none (already complete) |
| DevServerButton | `src/components/kanban/actions/DevServerButton.tsx` | none (already complete) |
| CreatePRButton | `src/components/kanban/actions/CreatePRButton.tsx` | none (already complete) |
| MergeButton | `src/components/kanban/actions/MergeButton.tsx` | none (already complete) |

### Existing Patterns

```
Pattern: API Proxy to mentu-proxy
Location: src/app/api/ops/approve/route.ts
Relevance: Direct template for bridge routes
```

The existing `/api/ops/approve` route demonstrates:
- Reading environment variables (`MENTU_API_URL`, `MENTU_PROXY_TOKEN`)
- Proxying POST requests to mentu-proxy
- Error handling and response formatting
- Proper headers including `X-Proxy-Token`

### Dependencies

| Dependency | Type | Concern |
|------------|------|---------|
| mentu-proxy | external | Must have `/bridge/*` endpoints ready |
| Environment vars | infrastructure | `MENTU_API_URL`, `MENTU_PROXY_TOKEN` must be set |
| Supabase auth | internal | May need to verify user workspace membership |

---

## Risk Assessment

| Risk Category | Level | Rationale | Mitigation |
|---------------|-------|-----------|------------|
| **Scope Creep** | low | Routes are well-defined, pattern is established | Explicit route list |
| **Breaking Changes** | low | Adding new routes, not modifying existing | None needed |
| **Security** | medium | Bridge operations spawn agents | Auth verification on each route |
| **Technical Debt** | low | Following existing patterns | Code review |
| **Reversibility** | high | Routes can simply be deleted | Git revert |

### Overall Risk Profile

**Risk Score**: low

The biggest concern is ensuring proper authentication on bridge routes since they can spawn agents and create PRs. However, the actual execution happens in mentu-proxy/mentu-bridge, so the dashboard routes are just pass-through with auth verification.

---

## Effort Estimate

### Tier Assessment

| Tier | Description | This Intent |
|------|-------------|-------------|
| T1 | Simple change, single file | no |
| T2 | Feature, multiple files | yes |
| T3 | Multi-part, cross-cutting | no |
| T4 | Orchestrated, multi-agent | no |

**Assigned Tier**: T2

**Rationale**: 5 new route files, all following the same pattern. No UI changes needed since buttons already exist.

### Scope Breakdown

1. Create `src/app/api/bridge/spawn/route.ts` - proxy spawn requests
2. Create `src/app/api/bridge/stop/route.ts` - proxy stop requests
3. Create `src/app/api/bridge/dev-server/route.ts` - proxy dev-server requests
4. Create `src/app/api/bridge/create-pr/route.ts` - proxy create-pr requests
5. Create `src/app/api/bridge/merge/route.ts` - proxy merge requests
6. Verify environment variables are documented

---

## Open Questions Resolution

### Question 1: Should CloudTerminal WebSocket be addressed in this scope?

**Answer**: No, defer to separate scope
**Evidence**: CloudTerminal requires WebSocket server infrastructure at `wss://api.mentu.ai/terminal`. This is an infrastructure concern beyond API routes. The terminal can be disabled/hidden until infrastructure exists.

### Question 2: Is mentu-proxy ready to receive these bridge operations?

**Answer**: Assumed yes, but needs verification
**Evidence**: The intent assumes mentu-proxy has `/bridge/*` endpoints. The executor should verify this during implementation and document any missing proxy routes.

### Question 3: Are there additional environment variables needed?

**Answer**: No, existing variables should suffice
**Evidence**: `/api/ops/approve` uses `MENTU_API_URL` and `MENTU_PROXY_TOKEN` which are the same variables needed for bridge routes.

---

## Verdict

```
+-------------------------------------------------------------------+
|                                                                   |
|   VERDICT: APPROVE                                                |
|                                                                   |
+-------------------------------------------------------------------+
```

### Rationale

This intent is **approved** for the following reasons:

1. **Clear Gap**: The UI exists, the backend routes do not - this is a straightforward completion task
2. **Established Pattern**: `/api/ops/approve` provides an exact template to follow
3. **Low Risk**: Adding new routes doesn't break existing functionality
4. **Philosophy Aligned**: Dashboard remains a pass-through layer; mentu-proxy handles actual operations
5. **Governance Compliant**: No permission boundaries crossed
6. **Well Scoped**: CloudTerminal WebSocket correctly deferred as separate infrastructure concern

---

## Conditions (if APPROVE)

> These conditions MUST be met during implementation.

1. **Follow Existing Pattern**: Use `/api/ops/approve` as the template for all bridge routes
2. **Auth Verification**: Each route must verify the request is authenticated
3. **Error Handling**: Match the error response format of existing routes
4. **Environment Variables**: Document required env vars in CLAUDE.md or README
5. **CloudTerminal Out of Scope**: Do not attempt to fix WebSocket issues - that's infrastructure

### Recommended Approach

1. Read `/api/ops/approve/route.ts` to understand the pattern
2. Create 5 route files following the same structure
3. Each route should:
   - Accept POST requests
   - Extract body parameters
   - Proxy to `${MENTU_API_URL}/bridge/{action}`
   - Include `X-Proxy-Token` header
   - Return JSON response
4. Test with curl or the existing UI buttons

---

## Next Steps

### Approved - Proceed to Craft

```bash
# Capture approval evidence
mentu capture "Approved INTENT-BridgeApiRoutes: Complete missing bridge API routes" \
  --kind audit-approval \
  --path docs/AUDIT-BridgeApiRoutes-v1.0.md \
  --actor agent:claude-auditor

# Execute craft chain
/craft BridgeApiRoutes-v1.0
```

---

## Audit Trail

| Timestamp | Action | Actor | Evidence |
|-----------|--------|-------|----------|
| 2026-01-05 | Audit started | agent:claude-auditor | Checkpoint: d47bb939 |
| 2026-01-05 | Codebase explored | agent:claude-auditor | Explore agent |
| 2026-01-05 | Philosophy evaluated | agent:claude-auditor | CLAUDE.md, genesis.key |
| 2026-01-05 | Feasibility assessed | agent:claude-auditor | Pattern: /api/ops/approve |
| 2026-01-05 | Risks assessed | agent:claude-auditor | Low overall risk |
| 2026-01-05 | Verdict rendered | agent:claude-auditor | APPROVE |

---

*This audit was performed by agent:claude-auditor with full local filesystem access and codebase context.*
