---
# ============================================================
# CANONICAL YAML FRONT MATTER
# ============================================================
id: PRD-ThreePlanesData-W3-v1.0
path: docs/PRD-ThreePlanesData-W3-v1.0.md
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
  - HANDOFF-ThreePlanesData-W3-v1.0
dependencies:
  - INTENT-ThreePlanesNavigation-v1.md
  - PRD-ThreePlanesNavigation-W1-v1.0
  - PRD-ThreePlanesViews-W2-v1.0

# MENTU INTEGRATION
mentu:
  commitment: cmt_3d389548
  status: pending
---

# PRD: ThreePlanesData-W3 v1.0

## Mission

Replace mock data in three-plane views with real data from Supabase tables and local files. W1 built the navigation shell, W2 built the view components with mock data. W3 connects those views to actual data sources - making the dashboard truly functional.

---

## Problem Statement

### Current State

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Views                                                                   │
│  ──────                                                                  │
│  GenesisView.tsx         ─────→  mockGenesis (hardcoded)                │
│  KnowledgeView.tsx       ─────→  mockKnowledge (hardcoded)              │
│  ActorsView.tsx          ─────→  mockActors (hardcoded)                 │
│  SkillsView.tsx          ─────→  mockSkills (hardcoded)                 │
│  IntegrationsView.tsx    ─────→  mockIntegrations (hardcoded)           │
│  AgentsView.tsx          ─────→  mockAgents (hardcoded)                 │
│  AutomationView.tsx      ─────→  mockHooks, mockSchedules (hardcoded)  │
│  ExecutionOverview.tsx   ─────→  mockStats, mockActivity (hardcoded)   │
└─────────────────────────────────────────────────────────────────────────┘
```

Views display static mock data. Data doesn't update. No connection to Supabase or filesystem.

### Desired State

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Views                      Hooks                    Data Sources       │
│  ──────                     ─────                    ────────────       │
│  GenesisView.tsx      ────→ useGenesis()      ────→ Supabase workspaces │
│  KnowledgeView.tsx    ────→ useKnowledge()    ────→ (future: files API) │
│  ActorsView.tsx       ────→ useActors()       ────→ Supabase actors     │
│  SkillsView.tsx       ────→ useSkills()       ────→ (future: files API) │
│  IntegrationsView.tsx ────→ useIntegrations() ────→ Bridge status       │
│  AgentsView.tsx       ────→ useAgents()       ────→ Bridge commands     │
│  AutomationView.tsx   ────→ useAutomation()   ────→ (future: config)    │
│  ExecutionOverview.tsx────→ useExecutionStats()────→ Aggregated queries │
└─────────────────────────────────────────────────────────────────────────┘
```

Views use React Query hooks. Data comes from Supabase. Real-time updates via subscriptions.

---

## Completion Contract

**First action**: Update `.claude/completion.json`:

```json
{
  "version": "2.0",
  "name": "ThreePlanesData-W3",
  "tier": "T3",
  "required_files": [
    "src/hooks/useGenesis.ts",
    "src/hooks/useActors.ts",
    "src/hooks/useIntegrations.ts",
    "src/hooks/useAgents.ts",
    "src/hooks/useExecutionStats.ts",
    "src/lib/supabase/types/actors.ts"
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

### React Query Hook Pattern

All data fetching uses React Query with Supabase client. Hooks return `{ data, isLoading, error, refetch }`.

### Graceful Fallback

When real data is unavailable (no actors table yet, no genesis.key), views fall back to mock data with an indicator.

### Progressive Enhancement

Phase 1 connects what exists in Supabase. Filesystem-based sources (Knowledge, Skills, Automation) remain mock with "Coming Soon" indicators.

---

## Specification

### Data Source Mapping

| View | Supabase Table | Fallback |
|------|----------------|----------|
| Genesis | `workspaces` (workspace config) | mockGenesis |
| Knowledge | (future: files API) | mockKnowledge |
| Actors | `actor_mappings` | mockActors |
| Skills | (future: skills API) | mockSkills |
| Integrations | `bridge_machines` | mockIntegrations |
| Agents | `bridge_commands` (filter agents) | mockAgents |
| Automation | (future: config API) | mockHooks/mockSchedules |
| ExecutionOverview | aggregated queries | mockStats |

### Types

```typescript
// src/lib/supabase/types/actors.ts
export interface ActorMapping {
  id: string;
  external_id: string;
  mentu_id: string;
  platform: string;
  workspace_id: string;
  created_at: string;
}

// Transformed for UI
export interface Actor {
  id: string;
  name: string;
  type: 'human' | 'agent';
  role: string;
  email?: string;
  trust?: 'trusted' | 'authorized' | 'untrusted';
}
```

### Hook Signatures

```typescript
// useGenesis
interface UseGenesisReturn {
  genesis: Genesis | null;
  isLoading: boolean;
  error: Error | null;
  isMockData: boolean;
}

// useActors
interface UseActorsReturn {
  actors: Actor[];
  isLoading: boolean;
  error: Error | null;
  isMockData: boolean;
}

// useIntegrations
interface UseIntegrationsReturn {
  plugin: PluginIntegration;
  remoteAccess: RemoteAccess | null;
  mcps: MCPServer[];
  isLoading: boolean;
  isMockData: boolean;
}

// useAgents
interface UseAgentsReturn {
  agents: Agent[];
  running: Agent[];
  defined: Agent[];
  isLoading: boolean;
  isMockData: boolean;
}

// useExecutionStats
interface UseExecutionStatsReturn {
  stats: ExecutionStats;
  activity: ActivityItem[];
  isLoading: boolean;
  isMockData: boolean;
}
```

### Validation Rules

- Hooks must not throw on empty data (return empty arrays)
- `isMockData` must be true when falling back to mock
- Loading states must be handled in views
- Hooks must accept workspaceId parameter

---

## Implementation

### Deliverables

| File | Purpose |
|------|---------|
| `src/hooks/useGenesis.ts` | Fetch workspace genesis data |
| `src/hooks/useActors.ts` | Fetch actor mappings |
| `src/hooks/useIntegrations.ts` | Fetch bridge machine status |
| `src/hooks/useAgents.ts` | Fetch bridge commands (agent type) |
| `src/hooks/useExecutionStats.ts` | Aggregate commitment/memory stats |
| `src/lib/supabase/types/actors.ts` | Actor type definitions |

### Build Order

1. **Types**: Create Supabase type definitions for actors
2. **Hooks**: Build data fetching hooks with fallbacks
3. **View Updates**: Update views to use hooks instead of mock data
4. **Loading States**: Add loading indicators
5. **Verification**: Test with real Supabase data

### Integration Points

| System | Integration | Notes |
|--------|-------------|-------|
| Supabase | Query via `@supabase/ssr` | Use existing client from `src/lib/supabase` |
| React Query | Already installed | Use `@tanstack/react-query` |
| Existing hooks | Pattern from `useCommitments.ts` | Follow same structure |

---

## Constraints

- **Read-only**: No mutations, just fetching
- **No new tables**: Work with existing Supabase schema
- **Graceful degradation**: Must work with empty tables
- **No blocking**: Views must render during loading
- **Preserve mock data**: Keep as fallback, don't delete

---

## Success Criteria

### Functional

- [ ] Genesis view shows workspace name from Supabase
- [ ] Actors view shows actor_mappings from Supabase
- [ ] Integrations view shows bridge_machines status
- [ ] Agents view shows active bridge_commands
- [ ] ExecutionOverview shows real commitment/memory counts
- [ ] Views fall back to mock data when tables empty

### Quality

- [ ] `npm run build` passes without errors
- [ ] `npx tsc --noEmit` passes without errors
- [ ] Loading states render without flicker
- [ ] No console errors when tables are empty

### Integration

- [ ] Hooks follow existing useCommitments pattern
- [ ] Data refreshes on navigation
- [ ] Views display `isMockData` indicator when using fallback

---

## Verification Commands

```bash
# Verify build
npm run build

# Verify types
npx tsc --noEmit

# Verify hooks exist
ls src/hooks/use*.ts

# Check Supabase connection (via dev server)
npm run dev
# Navigate to /workspace/mentu-ai/context/actors
# Should show real data or fallback indicator

# Verify tables have data
# (In Supabase dashboard or via CLI)
```

---

## References

- `INTENT-ThreePlanesNavigation-v1.md`: Original architecture spec
- `PRD-ThreePlanesViews-W2-v1.0.md`: View components with mock data
- `src/hooks/useCommitments.ts`: Existing hook pattern to follow
- `src/lib/supabase/types.ts`: Existing Supabase types

---

*W3 connects the UI to real data. After W3, the dashboard displays live workspace state.*
