---
# ============================================================
# CANONICAL YAML FRONT MATTER
# ============================================================
id: PRD-ThreePlanesNavigation-W1-v1.0
path: docs/PRD-ThreePlanesNavigation-W1-v1.0.md
type: prd
intent: reference

# VERSIONING
version: "1.0"
created: 2026-01-03
last_updated: 2026-01-03

# TIER
tier: T3

# RELATIONSHIPS
children:
  - HANDOFF-ThreePlanesNavigation-W1-v1.0
dependencies:
  - INTENT-ThreePlanesNavigation-v1.0
  - AUDIT-ThreePlanesNavigation-v1.0

# MENTU INTEGRATION
mentu:
  commitment: pending
  status: pending
---

# PRD: ThreePlanesNavigation-W1 v1.0

## Mission

Build the navigation shell for mentu-web's three-plane architecture. This establishes the foundational navigation infrastructure (TopNav, WorkspaceSelector, plane-aware Sidebar, routing) that all subsequent planes (Context, Capability, Execution) will use. W1 is the critical path - W2, W3, and W4 depend on this shell being complete.

---

## Problem Statement

### Current State

```
┌─────────────────────────────────────────────────────────────────┐
│  [logo] mentu                                     [user avatar] │
├────────────┬────────────────────────────────────────────────────┤
│ Sidebar    │  Content Area                                      │
│            │                                                    │
│ Dashboard  │  (Flat navigation - no plane concept)              │
│ Commits    │                                                    │
│ Memories   │                                                    │
│ Ledger     │                                                    │
│ Bridge     │                                                    │
│ ────────── │                                                    │
│ Settings   │                                                    │
│            │                                                    │
└────────────┴────────────────────────────────────────────────────┘
```

Navigation is flat. All views exist at the same level. Users cannot distinguish between:
- **Context** (who am I, what principles govern)
- **Capability** (what tools do I have)
- **Execution** (what work is happening)

### Desired State

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [logo] mentu · [workspace-selector ▼]    [Context] [Capability] [Execution]   [user] │
├─────────────┬────────────────────────────────────────────────────────────┤
│ Sidebar     │  Content Area                                              │
│ (plane-     │                                                            │
│  aware)     │  (Content changes based on active plane + view)            │
│             │                                                            │
│ Overview    │                                                            │
│ View 1      │                                                            │
│ View 2      │                                                            │
│ View N      │                                                            │
│             │                                                            │
└─────────────┴────────────────────────────────────────────────────────────┘
```

Navigation is structured. Plane tabs in TopNav. Sidebar adapts per plane. Each plane has its own views.

---

## Completion Contract

**First action**: Update `.claude/completion.json`:

```json
{
  "version": "2.0",
  "name": "ThreePlanesNavigation-W1",
  "tier": "T3",
  "required_files": [
    "src/components/nav/TopNav.tsx",
    "src/components/nav/WorkspaceSelector.tsx",
    "src/components/nav/PlaneTabs.tsx",
    "src/components/modals/ProjectSettingsModal.tsx",
    "src/components/layout/PlaneSidebar.tsx",
    "src/components/shared/PlaneCard.tsx",
    "src/components/planes/context/ContextOverview.tsx",
    "src/components/planes/capability/CapabilityOverview.tsx",
    "src/components/planes/execution/ExecutionOverview.tsx",
    "src/app/workspace/[workspace]/[plane]/layout.tsx",
    "src/app/workspace/[workspace]/[plane]/page.tsx"
  ],
  "checks": {
    "tsc": true,
    "build": true,
    "test": false
  },
  "mentu": {
    "enabled": true,
    "commitments": {
      "mode": "dynamic",
      "min_count": 1,
      "require_closed": true,
      "require_evidence": true
    }
  },
  "max_iterations": 75
}
```

---

## Core Concepts

### Plane

A top-level navigational grouping that represents a distinct aspect of the workspace:
- **Context**: Identity, governance, knowledge, actors
- **Capability**: Tools, agents, automation
- **Execution**: Work items, commitments, memories, ledger

### Plane-Aware Sidebar

The sidebar dynamically changes its navigation items based on the active plane. Each plane has its own set of views.

### Workspace Selector

A dropdown in the TopNav that allows switching between workspaces and accessing project settings.

---

## Specification

### Types

```typescript
type Plane = 'context' | 'capability' | 'execution';

interface PlaneView {
  id: string;
  label: string;
  href: string;
}

interface PlaneConfig {
  label: string;
  views: PlaneView[];
}

interface Workspace {
  id: string;
  name: string;
  type: 'local' | 'github';
  path?: string;
  repo?: string;
  synced: boolean;
  current: boolean;
}
```

### Navigation Structure

```typescript
const planeConfig: Record<Plane, PlaneConfig> = {
  context: {
    label: 'Context',
    views: [
      { id: 'overview', label: 'Overview', href: '' },
      { id: 'genesis', label: 'Genesis', href: '/genesis' },
      { id: 'knowledge', label: 'Knowledge', href: '/knowledge' },
      { id: 'actors', label: 'Actors', href: '/actors' },
      { id: 'skills', label: 'Skills', href: '/skills' },
    ]
  },
  capability: {
    label: 'Capability',
    views: [
      { id: 'overview', label: 'Overview', href: '' },
      { id: 'integrations', label: 'Integrations', href: '/integrations' },
      { id: 'agents', label: 'Agents', href: '/agents' },
      { id: 'automation', label: 'Automation', href: '/automation' },
      { id: 'bridge', label: 'Bridge', href: '/bridge' },  // Existing bridge views
    ]
  },
  execution: {
    label: 'Execution',
    views: [
      { id: 'overview', label: 'Overview', href: '' },
      { id: 'kanban', label: 'Kanban', href: '/kanban' },
      { id: 'commitments', label: 'Commitments', href: '/commitments' },
      { id: 'memories', label: 'Memories', href: '/memories' },
      { id: 'ledger', label: 'Ledger', href: '/ledger' },
    ]
  }
};
```

### Routing

```
/workspace/[workspace]                  → Redirect to /workspace/[workspace]/execution
/workspace/[workspace]/[plane]          → Plane overview (context|capability|execution)
/workspace/[workspace]/[plane]/[view]   → Specific view within plane
```

### Validation Rules

- Plane must be one of: 'context', 'capability', 'execution'
- Default plane is 'execution' (the commitment ledger)
- Clicking logo returns to execution overview
- Workspace selector must show current workspace with green dot indicator
- Project settings modal must be accessible from workspace selector

---

## Implementation

### Deliverables

| File | Purpose |
|------|---------|
| `src/components/nav/TopNav.tsx` | Logo, workspace selector, plane tabs, user profile |
| `src/components/nav/WorkspaceSelector.tsx` | Dropdown with workspaces + settings link |
| `src/components/nav/PlaneTabs.tsx` | Context/Capability/Execution tabs |
| `src/components/modals/ProjectSettingsModal.tsx` | Workspace settings modal |
| `src/components/layout/PlaneSidebar.tsx` | Dynamic sidebar based on active plane |
| `src/components/shared/PlaneCard.tsx` | Clickable card for overview grids |
| `src/components/planes/context/ContextOverview.tsx` | Context plane landing page |
| `src/components/planes/capability/CapabilityOverview.tsx` | Capability plane landing page |
| `src/components/planes/execution/ExecutionOverview.tsx` | Execution plane landing page |
| `src/app/workspace/[workspace]/[plane]/layout.tsx` | Plane-scoped layout |
| `src/app/workspace/[workspace]/[plane]/page.tsx` | Plane overview router |
| `src/lib/navigation/planeConfig.ts` | Plane configuration and types |

### Build Order

1. **Types & Config**: Create planeConfig.ts with types and navigation structure
2. **TopNav Components**: Build TopNav, WorkspaceSelector, PlaneTabs
3. **ProjectSettingsModal**: Build the settings modal
4. **PlaneSidebar**: Refactor sidebar to be plane-aware
5. **Overview Components**: Build placeholder overviews for each plane
6. **Routing**: Create plane-scoped layout and routing
7. **Integration**: Wire everything together, update existing layout

### Integration Points

| System | Integration | Notes |
|--------|-------------|-------|
| Existing layout | Replace Header/Sidebar with TopNav/PlaneSidebar | Preserve mobile nav |
| Existing routes | Move under /execution | Keep as redirects initially |
| Existing hooks | No changes | W1 is navigation only |

---

## Constraints

- **Color palette**: Use `zinc-*` (existing), NOT `slate-*` (prototype)
- **Read-only Phase 1**: No mutations, just navigation
- **Preserve existing views**: Kanban, Commitments, Memories, Ledger remain intact
- **Follow existing patterns**: shadcn components, React Query hooks
- **Mobile responsive**: Must work on all screen sizes

---

## Success Criteria

### Functional

- [ ] User can click between Context, Capability, Execution tabs
- [ ] Sidebar changes based on active plane
- [ ] Workspace selector shows current workspace with green indicator
- [ ] Project settings modal opens from workspace selector
- [ ] Clicking logo returns to Execution > Overview
- [ ] Each plane has an Overview page with navigation cards

### Quality

- [ ] `npm run build` passes without errors
- [ ] `tsc --noEmit` passes without errors
- [ ] No console errors in browser

### Integration

- [ ] Existing views (Kanban, Commitments, Memories, Ledger) still work
- [ ] Old routes redirect to new structure
- [ ] Mobile navigation still functions

---

## Verification Commands

```bash
# Verify build
npm run build

# Verify types
npx tsc --noEmit

# Verify routes exist
ls src/app/workspace/\[workspace\]/\[plane\]/

# Verify components exist
ls src/components/nav/
ls src/components/planes/

# Verify functionality (manual)
npm run dev
# Navigate to http://localhost:3000
# Click between planes
# Open workspace selector
# Check sidebar changes
```

---

## References

- `INTENT-ThreePlanesNavigation-v1.0.md`: Original architecture intent
- `AUDIT-ThreePlanesNavigation-v1.0.md`: Audit findings and conditions
- `docs/mentu-dashboard-v6.jsx`: Complete interactive prototype
- `src/components/layout/sidebar.tsx`: Existing sidebar to reference
- `src/components/layout/header.tsx`: Existing header to reference

---

*W1 establishes the navigation foundation. Without this shell, W2-4 cannot proceed.*
