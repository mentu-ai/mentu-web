---
# ============================================================
# CANONICAL YAML FRONT MATTER
# ============================================================
id: AUDIT-ThreePlanesNavigation-v1.0
path: docs/AUDIT-ThreePlanesNavigation-v1.0.md
type: audit
intent: reference

# VERSIONING
version: "1.0"
created: 2026-01-03
last_updated: 2026-01-03

# RELATIONSHIPS
intent_ref: INTENT-ThreePlanesNavigation-v1.0
craft_ref: pending

# AUDITOR IDENTITY
auditor: agent:claude-auditor
checkpoint:
  git_sha: 3eb9ec05116b5833cf2d2e28117ab4ae41ebdb74
  stash: auditor-checkpoint-20260103-231302
  timestamp: 2026-01-03T23:13:02Z

# VERDICT
verdict: MODIFY
verdict_timestamp: 2026-01-03T23:25:00Z

# MENTU INTEGRATION
mentu:
  evidence: pending
  status: approved-with-modifications
---

# Audit: ThreePlanesNavigation

> **Auditor Report**
>
> This document records the audit of an Architect's strategic intent.
> The verdict determines whether the intent proceeds to implementation.

---

## Intent Summary

**Source**: `docs/INTENT-ThreePlanesNavigation-v1.0.md`

The Architect proposes restructuring mentu-web's navigation from a flat sidebar into a three-plane architecture that surfaces **Context** (identity/governance), **Capability** (tools/automation), and **Execution** (work/commitments) as first-class navigational concepts.

### What the Architect Wants
Implement a three-plane navigation with Execution as the default landing plane, centered on the commitment ledger.

### Why It Matters
Users currently only see execution data; agents and humans need to understand their identity (Context), available tools (Capability), and ongoing work (Execution) in a unified interface.

### Stated Constraints
- Phase 1 is read-only — views display existing data, no mutations
- No backend schema changes — read from existing tables and files
- Preserve existing views — Kanban, Commitments, Memories, Ledger remain intact
- Match design system — use existing Tailwind classes, slate color palette, rounded-xl cards

---

## Philosophy Alignment

Evaluated against project foundational documents.

### Project Purpose

**Source**: `CLAUDE.md`, `.mentu/manifest.yaml`

| Question | Answer |
|----------|--------|
| Does this intent serve the project's stated purpose? | **yes** |
| Does it align with the project's direction? | **yes** |
| Would maintainers likely support this? | **yes** |

**Assessment**: aligned

**Evidence**:
- manifest.yaml states: `description: "Next.js dashboard - visualization layer for Mentu ecosystem"`
- CLAUDE.md: "The dashboard is the **Eyes** of the Mentu organism—a read-only visualization layer"
- Adding Context and Capability planes extends visualization without changing the read-only contract

### Governance Compliance

**Source**: Hub-level `.mentu/genesis.key`

| Question | Answer |
|----------|--------|
| Does this respect the governance model? | **yes** |
| Are there permission boundaries being crossed? | **no** |
| Does this require elevated authorization? | **no** |

**Assessment**: compliant

Evidence: Phase 1 is read-only, respecting "evidence-required" and "append-only" principles from genesis.key.

---

## Technical Feasibility

### Architecture Support

| Question | Answer |
|----------|--------|
| Can the existing architecture support this? | **yes** |
| Does this require new infrastructure? | **no** (API routes only) |
| Are there existing patterns to follow? | **yes** |

**Assessment**: feasible

### Affected Components

| Component | Path(s) | Impact Level |
|-----------|---------|--------------|
| Header | `src/components/layout/header.tsx` | medium |
| Sidebar | `src/components/layout/sidebar.tsx` | medium |
| WorkspaceLayout | `src/app/workspace/[workspace]/layout.tsx` | medium |
| Mobile Nav | `src/components/layout/mobile-nav.tsx` | low |
| Execution Views (14) | `src/app/workspace/[workspace]/**/page.tsx` | low (path changes) |
| New Plane Views (12) | `src/components/planes/*/` | new |
| New Hooks (8) | `src/hooks/use*.ts` | new |
| New API Routes (5) | `src/app/api/*/route.ts` | new |

### Existing Patterns

```
Pattern: React Query hooks for data fetching
Location: src/hooks/useOperations.ts, useCommitments.ts
Relevance: All new hooks should follow this pattern with TanStack React Query
```

```
Pattern: Supabase client integration
Location: src/lib/supabase/
Relevance: Data fetching from tables (actors, workspaces) uses this
```

```
Pattern: shadcn/ui components
Location: src/components/ui/
Relevance: All UI should use existing button, dialog, dropdown-menu, etc.
```

### Dependencies

| Dependency | Type | Concern |
|------------|------|---------|
| React Query | external | Already installed, no issue |
| Supabase | external | Already integrated, no issue |
| File system access | infrastructure | Needs API routes for Knowledge, Skills, Integrations |

---

## Risk Assessment

| Risk Category | Level | Rationale | Mitigation |
|---------------|-------|-----------|------------|
| **Scope Creep** | medium | 4 phases with 12 new views could expand | Lock Phase 1 scope; defer W3/W4 to separate HANDOFFs |
| **Breaking Changes** | low | Existing routes preserved | Keep old routes as redirects during transition |
| **Security** | low | Phase 1 read-only | File scanning APIs need auth validation |
| **Technical Debt** | low | Follows established patterns | Use existing components as templates |
| **Reversibility** | low | Git-based, can revert | Feature flag for new navigation |

### Overall Risk Profile

**Risk Score**: low

The biggest concern is scope creep due to the number of new views. Mitigated by decomposing into 4 separate workstreams with explicit dependencies.

---

## Effort Estimate

### Tier Assessment

| Tier | Description | This Intent |
|------|-------------|-------------|
| T1 | Simple change, single file | no |
| T2 | Feature, multiple files | no |
| T3 | Multi-part, cross-cutting | no |
| T4 | Orchestrated, multi-agent | **yes** |

**Assigned Tier**: T4

**Rationale**:
- ~20 new files, ~15 modified files
- 4 distinct phases with dependencies (W1 → W2-4)
- W3 and W4 can parallelize after W1
- Cross-cutting changes to routing, layout, navigation
- Estimated 11-17 days total

### Scope Breakdown

1. **W1: Navigation Shell** - 2-3 days
   - TopNav, WorkspaceSelector, ProjectSettingsModal
   - Sidebar refactor (plane-aware)
   - Route restructuring

2. **W2: Execution Enhancement** - 1-2 days
   - ExecutionOverview with stats + activity
   - Move existing views under /execution

3. **W3: Context Plane** - 3-4 days
   - Genesis, Knowledge, Actors, Skills views
   - useGenesis, useActors hooks
   - API routes for file scanning

4. **W4: Capability Plane** - 3-4 days
   - Integrations, Agents, Automation views
   - Supporting hooks and API routes

---

## Open Questions Resolution

No open questions were raised in the INTENT document. However, audit identified these clarifications:

### Question 1: Component path convention
**Answer**: Use existing pattern `components/{domain}/` not `components/planes/{plane}/`
**Evidence**: Existing components follow `components/commitment/`, `components/memory/` pattern

### Question 2: Color palette
**Answer**: Use `zinc-*` not `slate-*` (prototype uses slate, codebase uses zinc)
**Evidence**: Grep of existing components shows zinc throughout

---

## Verdict

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   VERDICT: MODIFY                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Rationale

The intent is **valid and should proceed** with the following modifications:

1. **Decompose into 4 HANDOFFs**: The scope is T4 (orchestrated). A single HANDOFF would be overwhelming. Produce separate HANDOFFs for W1, W2, W3, W4 with explicit dependencies.

2. **Align component paths**: INTENT specifies `components/planes/` but existing pattern is `components/{domain}/`. New components should follow existing convention.

3. **Color palette alignment**: Prototype uses `slate-*`, codebase uses `zinc-*`. Implementation must use zinc for consistency.

4. **API route specifications needed**: Phases 3-4 require file scanning (Knowledge, Skills, Integrations). HANDOFFs must specify API route contracts.

5. **W1 is critical path**: Complete W1 before crafting W2-4 HANDOFFs to validate navigation architecture.

---

## Conditions (MODIFY → APPROVE)

> These conditions MUST be met during implementation.

1. **Decompose scope**: Produce 4 separate HANDOFFs (W1 first, then W2-4)
2. **W1 completion gates W2-4**: Do not craft W2-4 until W1 is validated
3. **Use existing patterns**: shadcn components, React Query hooks, zinc palette
4. **Preserve existing routes**: Old paths must redirect to new structure
5. **File scanning via API**: No browser filesystem access; all file ops via API routes
6. **Read-only Phase 1**: No mutations in any view

### Recommended Approach

```
1. /craft ThreePlanesNavigation-W1-v1.0  → Navigation Shell
   [Build and validate]

2. /craft ThreePlanesNavigation-W2-v1.0  → Execution Enhancement
   (can start after W1 merged)

3. /craft ThreePlanesNavigation-W3-v1.0  → Context Plane
4. /craft ThreePlanesNavigation-W4-v1.0  → Capability Plane
   (W3 and W4 can parallelize after W1)
```

---

## Next Steps

### MODIFY → Proceed with Craft (W1 First)

```bash
# Capture approval evidence
mentu capture "MODIFY-APPROVED: INTENT-ThreePlanesNavigation-v1.0 - Decompose into 4 workstreams. W1 (Navigation Shell) first." \
  --kind audit-approval \
  --path docs/AUDIT-ThreePlanesNavigation-v1.0.md \
  --actor agent:claude-auditor

# Execute craft chain for W1 only
/craft ThreePlanesNavigation-W1-v1.0
```

After W1 is built and validated, craft W2-4 sequentially or in parallel.

---

## Audit Trail

| Timestamp | Action | Actor | Evidence |
|-----------|--------|-------|----------|
| 2026-01-03T23:13:02Z | Audit started | agent:claude-auditor | Checkpoint: 3eb9ec05116b5833cf2d2e28117ab4ae41ebdb74 |
| 2026-01-03T23:15:00Z | Philosophy evaluated | agent:claude-auditor | Aligned with mentu-web purpose |
| 2026-01-03T23:20:00Z | Feasibility assessed | agent:claude-auditor | HIGH feasibility via Explore agent |
| 2026-01-03T23:22:00Z | Risks assessed | agent:claude-auditor | LOW overall risk |
| 2026-01-03T23:25:00Z | Verdict rendered | agent:claude-auditor | MODIFY - decompose into 4 workstreams |

---

*This audit was performed by agent:claude-auditor with full local filesystem access, MCP tooling, and codebase context.*
