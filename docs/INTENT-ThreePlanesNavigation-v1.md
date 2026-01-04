# INTENT-ThreePlanesNavigation-v1.0

**Author:** Architect  
**Date:** 2026-01-03  
**Status:** Ready for Decomposition

---

## What

Implement a three-plane navigation architecture for mentu-web that surfaces **Context**, **Capability**, and **Execution** as first-class navigational concepts, with Execution as the default landing plane centered on the commitment ledger.

## Why

Today, users see only execution data (Kanban, Commitments, Memories, Ledger). Agents and humans need to understand:

1. **Context** — Who am I? What principles govern this workspace? Who can do what?
2. **Capability** — What tools do I have? What agents exist? What automation is enabled?
3. **Execution** — What work is happening? (Already exists, needs enhancement)

This is the "Git moment" for AI coordination: making identity, capability, and work visible in a unified interface.

## Design Specification

### Navigation Structure

```
┌──────────────────────────────────────────────────────────────────┐
│  [logo] mentu · [workspace-selector ▼]     [Context] [Capability] [Execution]     [user] │
├──────────────────────────────────────────────────────────────────┤
│ Sidebar        │  Content Area                                   │
│                │                                                 │
│ [plane views]  │  [plane overview or selected view]             │
│                │                                                 │
└──────────────────────────────────────────────────────────────────┘
```

### Workspace Selector (Top Nav)

Located after logo divider. Dropdown contains:
- List of connected workspaces (local + GitHub)
- Current workspace indicator (green dot)
- "Project Settings" → opens modal
- "Add Project" → add new workspace

### Project Settings Modal

- Current project info (name, path, sync status)
- Sync toggles (auto-sync, cloud backup)
- Danger zone (disconnect project)

### Plane: Context

**Purpose:** Identity and governance

| View | Description | Data Source |
|------|-------------|-------------|
| Overview | Cards linking to sub-views | — |
| Genesis | Identity, principles, trust gradient | `genesis.key`, config |
| Knowledge | Documents, specs, guides | `.mentu/knowledge/`, project files |
| Actors | Humans + agents with roles/permissions | `actors` table, genesis.key |
| Skills | Knowledge + Actor directives | `.claude/skills/`, SKILL.md files |

### Plane: Capability

**Purpose:** Tools and automation available

| View | Description | Data Source |
|------|-------------|-------------|
| Overview | Cards linking to sub-views | — |
| Integrations | Plugin status, Remote Access, MCPs | `.claude/settings.json`, bridge status |
| Agents | Running agents, defined agents | `agents` table, completion.json |
| Automation | Hooks (toggleable), Schedules | `.claude/hooks/`, cron config |

**Integrations Sub-sections:**
- **Core:** Mentu Plugin (active/inactive, version, hooks count), Remote Access (connected machine, last seen)
- **MCP Servers:** List of connected MCPs with tool counts

### Plane: Execution

**Purpose:** The commitment ledger (primary interface)

| View | Description | Data Source |
|------|-------------|-------------|
| Overview | Stats + Recent Activity + Quick Links | Aggregated |
| Kanban | Visual workflow board (To Do, In Progress, In Review) | `commitments` table |
| Commitments | List view of all commitments | `commitments` table |
| Memories | Evidence and captures | `memories` table |
| Ledger | Full operation history | `ledger.jsonl` |

**Overview includes:**
- Stats: Open, In Progress, Memories count, Operations count
- Recent Activity: Last 5 ledger operations with "View All →" link
- Quick Links: Cards to Kanban, Commitments, Memories, Ledger

### Default Behavior

- App loads to **Execution > Overview**
- Clicking logo returns to **Execution > Overview**
- Each plane has an Overview as its first sidebar item

## Constraints

1. **Phase 1: Read-only** — Views display existing data, no mutations
2. **No backend schema changes** — Read from existing tables and files
3. **Preserve existing views** — Kanban, Commitments, Memories, Ledger remain intact
4. **Match design system** — Use existing Tailwind classes, slate color palette, rounded-xl cards

## Data Sources

| Entity | Source | Notes |
|--------|--------|-------|
| Workspaces | `workspaces` table + local config | Workspace selector |
| Genesis | `genesis.key` file | Parse YAML/JSON |
| Knowledge | `.mentu/knowledge/`, project `.md` files | File system scan |
| Actors | `actors` table, `genesis.key` trust section | Merge sources |
| Skills | `.claude/skills/*/SKILL.md` | Parse skill definitions |
| Integrations | `.claude/settings.json` | MCP configs |
| Plugin Status | Bridge health check | Mentu Plugin active? |
| Remote Access | `bridge_commands` table, heartbeat | Machine connected? |
| Agents | `agents` table, `.claude/completion.json` | Active + defined |
| Hooks | `.claude/hooks/*.py` | List hook files |
| Schedules | TBD (cron config or schedules table) | Future |

## Component Structure

```
src/
├── components/
│   ├── nav/
│   │   ├── TopNav.tsx           # Logo, workspace selector, plane tabs, user
│   │   ├── WorkspaceSelector.tsx # Dropdown with workspaces + settings
│   │   └── Sidebar.tsx          # Dynamic based on active plane
│   ├── modals/
│   │   └── ProjectSettingsModal.tsx
│   ├── planes/
│   │   ├── context/
│   │   │   ├── ContextOverview.tsx
│   │   │   ├── Genesis.tsx
│   │   │   ├── Knowledge.tsx
│   │   │   ├── Actors.tsx
│   │   │   └── Skills.tsx
│   │   ├── capability/
│   │   │   ├── CapabilityOverview.tsx
│   │   │   ├── Integrations.tsx
│   │   │   ├── Agents.tsx
│   │   │   └── Automation.tsx
│   │   └── execution/
│   │       ├── ExecutionOverview.tsx  # Stats + Recent Activity
│   │       ├── Kanban.tsx             # (existing, enhanced)
│   │       ├── Commitments.tsx        # (existing)
│   │       ├── Memories.tsx           # (existing)
│   │       └── Ledger.tsx             # (existing)
│   └── shared/
│       ├── PlaneCard.tsx        # Clickable card for overview grids
│       ├── StatCard.tsx         # Numeric stat display
│       └── ActivityFeed.tsx     # Recent ledger operations
├── hooks/
│   ├── useWorkspaces.ts
│   ├── useGenesis.ts
│   ├── useAgents.ts
│   └── useIntegrations.ts
└── lib/
    ├── parsers/
    │   ├── genesisParser.ts
    │   └── skillParser.ts
    └── api/
        ├── workspaces.ts
        └── bridge.ts
```

## Routing

```
/                           → Execution Overview (default)
/context                    → Context Overview
/context/genesis            → Genesis view
/context/knowledge          → Knowledge view
/context/actors             → Actors view
/context/skills             → Skills view
/capability                 → Capability Overview
/capability/integrations    → Integrations view
/capability/agents          → Agents view
/capability/automation      → Automation view
/execution                  → Execution Overview
/execution/kanban           → Kanban view
/execution/commitments      → Commitments view
/execution/memories         → Memories view
/execution/ledger           → Ledger view
```

## Implementation Phases

### Phase 1: Navigation Shell
- TopNav with plane tabs
- WorkspaceSelector dropdown
- Sidebar that changes per plane
- Routing setup
- ProjectSettingsModal

### Phase 2: Execution Enhancement
- ExecutionOverview with stats + recent activity
- Ensure existing views (Kanban, Commitments, Memories, Ledger) work within new shell

### Phase 3: Context Plane
- Genesis view (read from genesis.key)
- Knowledge view (list files)
- Actors view (merge tables + genesis)
- Skills view (parse SKILL.md files)

### Phase 4: Capability Plane
- Integrations view (plugin + remote access + MCPs)
- Agents view (running + defined)
- Automation view (hooks + schedules)

## Success Criteria

1. User can navigate between three planes without page reload
2. Workspace selector shows all connected projects
3. Project settings modal allows viewing/toggling sync settings
4. Execution overview shows accurate stats and recent activity
5. All existing functionality (Kanban, etc.) preserved
6. Context and Capability views display read-only data from sources

## Design Reference

See: `mentu-web/docs/mentu-dashboard-v6.jsx` — Complete interactive prototype with all views, workspace selector, and project settings modal.

## Out of Scope (Phase 1)

- Editing genesis.key from UI
- Creating/editing skills from UI
- Adding/removing MCPs from UI
- Inline hook editing
- Schedule creation UI

---

## Handoff Notes

This INTENT is ready for decomposition into parallel workstreams:

1. **W1: Navigation Shell** — TopNav, Sidebar, Routing, WorkspaceSelector, ProjectSettingsModal
2. **W2: Execution Enhancement** — ExecutionOverview, stats aggregation, activity feed
3. **W3: Context Views** — Genesis, Knowledge, Actors, Skills (can parallelize)
4. **W4: Capability Views** — Integrations, Agents, Automation (can parallelize)

Dependencies:
- W2, W3, W4 depend on W1 (shell must exist first)
- W3 and W4 can run in parallel after W1

Estimated complexity: Medium-High (new architectural pattern, but read-only phase 1)