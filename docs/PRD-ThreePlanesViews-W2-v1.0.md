---
# ============================================================
# CANONICAL YAML FRONT MATTER
# ============================================================
id: PRD-ThreePlanesViews-W2-v1.0
path: docs/PRD-ThreePlanesViews-W2-v1.0.md
type: prd
intent: reference

# VERSIONING
version: "1.0"
created: 2026-01-04
last_updated: 2026-01-04

# TIER
tier: T3

# RELATIONSHIPS
children:
  - HANDOFF-ThreePlanesViews-W2-v1.0
dependencies:
  - PRD-ThreePlanesNavigation-W1-v1.0
  - HANDOFF-ThreePlanesNavigation-W1-v1.0

# MENTU INTEGRATION
mentu:
  commitment: pending
  status: pending
---

# PRD: ThreePlanesViews-W2 v1.0

## Mission

Build the complete view pages for all three planes (Context, Capability, Execution) as specified in the interactive prototype. W1 established the navigation shell; W2 populates it with functional, read-only views that surface data from Supabase and display the full information architecture.

---

## Problem Statement

### Current State

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [logo] mentu · [workspace ▼]    [Context] [Capability] [Execution] [user] │
├─────────────┬────────────────────────────────────────────────────────────┤
│ Sidebar     │  Content Area                                              │
│ (plane-     │                                                            │
│  aware)     │  ┌─────────────────────────────────────────────────────┐  │
│             │  │  Basic Overview Page                                 │  │
│ Overview ✓  │  │  - PlaneCard grid linking to views                   │  │
│ Genesis     │  │  - No actual data displayed                          │  │
│ Knowledge   │  │  - Placeholder content only                          │  │
│ Actors      │  │                                                       │  │
│ Skills      │  └─────────────────────────────────────────────────────┘  │
│             │                                                            │
└─────────────┴────────────────────────────────────────────────────────────┘
```

W1 delivered the navigation shell but views are empty placeholders. Users cannot:
- See their Genesis principles and trust gradient
- Browse Knowledge documents
- View Actors (humans and agents)
- Explore Skills definitions
- Check Integration status (Plugin, Remote Access, MCPs)
- Monitor running Agents
- Review Automation hooks and schedules
- See Execution activity feed

### Desired State

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [logo] mentu · [workspace ▼]    [Context] [Capability] [Execution] [user] │
├─────────────┬────────────────────────────────────────────────────────────┤
│ Sidebar     │  Content Area                                              │
│ (plane-     │                                                            │
│  aware)     │  ┌─────────────────────────────────────────────────────┐  │
│             │  │  GENESIS VIEW                                        │  │
│ Overview    │  │  ┌───────────────┬───────────────────────────────┐  │  │
│ Genesis ◀   │  │  │ Principles    │ Trust Gradient                │  │  │
│ Knowledge   │  │  │ • No secrets  │ [▓▓▓▓▓▓░░░░] 6.5/10          │  │  │
│ Actors      │  │  │ • Ask first   │ Owner: rashid                 │  │  │
│ Skills      │  │  │ • Evidence    │ Tier: T2                      │  │  │
│             │  │  │ • Own errors  │                               │  │  │
│             │  │  └───────────────┴───────────────────────────────┘  │  │
│             │  └─────────────────────────────────────────────────────┘  │
└─────────────┴────────────────────────────────────────────────────────────┘
```

Each plane has fully populated views with real data structures (mock data for Phase 1, then Supabase integration).

---

## Completion Contract

**First action**: Update `.claude/completion.json`:

```json
{
  "version": "2.0",
  "name": "ThreePlanesViews-W2",
  "tier": "T3",
  "required_files": [
    "src/components/planes/context/GenesisView.tsx",
    "src/components/planes/context/KnowledgeView.tsx",
    "src/components/planes/context/ActorsView.tsx",
    "src/components/planes/context/SkillsView.tsx",
    "src/components/planes/capability/IntegrationsView.tsx",
    "src/components/planes/capability/AgentsView.tsx",
    "src/components/planes/capability/AutomationView.tsx",
    "src/components/planes/execution/ExecutionOverview.tsx",
    "src/lib/data/mockData.ts",
    "src/app/workspace/[workspace]/[plane]/genesis/page.tsx",
    "src/app/workspace/[workspace]/[plane]/knowledge/page.tsx",
    "src/app/workspace/[workspace]/[plane]/actors/page.tsx",
    "src/app/workspace/[workspace]/[plane]/skills/page.tsx",
    "src/app/workspace/[workspace]/[plane]/integrations/page.tsx",
    "src/app/workspace/[workspace]/[plane]/agents/page.tsx",
    "src/app/workspace/[workspace]/[plane]/automation/page.tsx"
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

### Mock Data Layer

For Phase 1 (read-only), views use mock data that mirrors the eventual Supabase schema. This allows UI development to proceed independently of backend integration.

### View Component Pattern

Each view follows the established pattern:
- Page component in `src/app/workspace/[workspace]/[plane]/[view]/page.tsx`
- View component in `src/components/planes/[plane]/[View]View.tsx`
- Shared components reused across views (cards, lists, badges)

### Information Architecture

Data displayed per view matches the prototype exactly:
- Genesis: Principles list, Trust Gradient visualization
- Knowledge: Document cards with metadata
- Actors: Human and Agent entities
- Skills: Skill cards with associations
- Integrations: Plugin, Remote Access, MCP sections
- Agents: Running vs Defined states
- Automation: Hooks and Schedules
- Execution Overview: Stats + Recent Activity feed

---

## Specification

### Types

```typescript
// Context Plane Types
interface Principle {
  id: string;
  text: string;
  order: number;
}

interface TrustGradient {
  level: number; // 0-10
  owner: string;
  tier: 'T1' | 'T2' | 'T3' | 'T4';
}

interface Genesis {
  principles: Principle[];
  trustGradient: TrustGradient;
}

interface KnowledgeDocument {
  id: string;
  title: string;
  type: 'prd' | 'handoff' | 'guide' | 'reference';
  path: string;
  lastUpdated: string;
}

interface Actor {
  id: string;
  name: string;
  type: 'human' | 'agent';
  role: string;
  status: 'active' | 'inactive';
  avatar?: string;
}

interface Skill {
  id: string;
  name: string;
  description: string;
  knowledge: string[];  // Document IDs
  actors: string[];     // Actor IDs
  enabled: boolean;
}

// Capability Plane Types
interface Integration {
  id: string;
  name: string;
  type: 'plugin' | 'remote' | 'mcp';
  status: 'connected' | 'disconnected' | 'error';
  description: string;
  lastSync?: string;
}

interface Agent {
  id: string;
  name: string;
  state: 'running' | 'defined' | 'stopped';
  description: string;
  lastRun?: string;
  nextRun?: string;
}

interface Hook {
  id: string;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
}

interface Schedule {
  id: string;
  name: string;
  cron: string;
  nextRun: string;
  lastRun?: string;
  enabled: boolean;
}

// Execution Plane Types
interface ActivityItem {
  id: string;
  type: 'commitment' | 'memory' | 'evidence' | 'spawn';
  title: string;
  timestamp: string;
  actor: string;
  status?: string;
}

interface ExecutionStats {
  openCommitments: number;
  closedToday: number;
  memoriesThisWeek: number;
  activeAgents: number;
}
```

### View Specifications

| View | Data Source | Key Components |
|------|-------------|----------------|
| Genesis | `genesis.key` parsing | PrinciplesList, TrustGradientBar |
| Knowledge | Document index | DocumentCard grid with filters |
| Actors | Actor registry | ActorCard with type badge |
| Skills | Skill definitions | SkillCard with associations |
| Integrations | Integration status | IntegrationSection (Plugin/Remote/MCP) |
| Agents | Agent registry | AgentCard with state indicator |
| Automation | Hooks + Schedules | HookList, ScheduleList |
| Execution Overview | Aggregated stats | StatsGrid, RecentActivityFeed |

### Validation Rules

- All views must be read-only (no mutations in W2)
- Mock data must match eventual Supabase schema
- Components must use zinc color palette
- Views must be responsive (mobile-friendly)
- Empty states must be handled gracefully

---

## Implementation

### Deliverables

| File | Purpose |
|------|---------|
| `src/lib/data/mockData.ts` | Mock data for all views |
| `src/components/planes/context/GenesisView.tsx` | Principles + Trust Gradient |
| `src/components/planes/context/KnowledgeView.tsx` | Document browser |
| `src/components/planes/context/ActorsView.tsx` | Human/Agent list |
| `src/components/planes/context/SkillsView.tsx` | Skill definitions |
| `src/components/planes/capability/IntegrationsView.tsx` | Integration status |
| `src/components/planes/capability/AgentsView.tsx` | Agent management |
| `src/components/planes/capability/AutomationView.tsx` | Hooks + Schedules |
| `src/components/planes/execution/ExecutionOverview.tsx` | Enhanced overview |
| `src/app/workspace/[workspace]/[plane]/genesis/page.tsx` | Genesis route |
| `src/app/workspace/[workspace]/[plane]/knowledge/page.tsx` | Knowledge route |
| `src/app/workspace/[workspace]/[plane]/actors/page.tsx` | Actors route |
| `src/app/workspace/[workspace]/[plane]/skills/page.tsx` | Skills route |
| `src/app/workspace/[workspace]/[plane]/integrations/page.tsx` | Integrations route |
| `src/app/workspace/[workspace]/[plane]/agents/page.tsx` | Agents route |
| `src/app/workspace/[workspace]/[plane]/automation/page.tsx` | Automation route |

### Build Order

1. **Mock Data**: Create `mockData.ts` with all type-safe mock data
2. **Context Views**: Genesis → Knowledge → Actors → Skills
3. **Capability Views**: Integrations → Agents → Automation
4. **Execution Enhancement**: Enhance ExecutionOverview with stats + activity
5. **Route Pages**: Create all page.tsx files
6. **Integration**: Wire views to routes, verify navigation

### Integration Points

| System | Integration | Notes |
|--------|-------------|-------|
| W1 Navigation | Use existing PlaneSidebar | Add view routes |
| Existing Views | Kanban, Commitments, Memories, Ledger | Preserve, link from overview |
| planeConfig.ts | Already defines view routes | Use existing hrefs |

---

## Constraints

- **Read-only Phase 1**: No create/update/delete operations
- **Mock data only**: No Supabase queries yet (W3 scope)
- **Zinc palette**: Match existing dashboard colors
- **No new dependencies**: Use existing shadcn components
- **Responsive**: All views must work on mobile
- **Preserve existing**: Don't break Kanban/Commitments/Memories/Ledger

---

## Success Criteria

### Functional

- [ ] Genesis view shows principles list and trust gradient
- [ ] Knowledge view displays document cards
- [ ] Actors view shows human and agent entities
- [ ] Skills view displays skill cards with associations
- [ ] Integrations view shows Plugin, Remote Access, MCP sections
- [ ] Agents view displays running and defined agents
- [ ] Automation view shows hooks and schedules
- [ ] Execution Overview shows stats grid and recent activity

### Quality

- [ ] `npm run build` passes without errors
- [ ] `npx tsc --noEmit` passes without errors
- [ ] All views render without console errors
- [ ] Views handle empty data gracefully

### Integration

- [ ] All sidebar navigation links work
- [ ] Existing views (Kanban, Commitments, etc.) still function
- [ ] Mobile navigation works for all new views

---

## Verification Commands

```bash
# Verify build
npm run build

# Verify types
npx tsc --noEmit

# Verify routes exist
ls src/app/workspace/\[workspace\]/\[plane\]/*/page.tsx

# Verify components exist
ls src/components/planes/context/
ls src/components/planes/capability/
ls src/components/planes/execution/

# Verify mock data
cat src/lib/data/mockData.ts

# Verify functionality (manual)
npm run dev
# Navigate to each view via sidebar
# Verify data displays correctly
# Test on mobile viewport
```

---

## References

- `PRD-ThreePlanesNavigation-W1-v1.0.md`: Navigation shell specification
- `docs/mentu-dashboard-v6.jsx`: Complete interactive prototype with all views
- `src/lib/navigation/planeConfig.ts`: Existing plane configuration
- `src/components/layout/PlaneSidebar.tsx`: Existing sidebar with view links

---

*W2 populates the navigation shell with functional views. After W2, users can explore all planes with representative data.*
