---
id: PRD-WorkspaceNavigator-v1.0
type: prd
version: "1.0"
created: 2026-01-05
status: approved
tier: T3
source: docs/INTENT-WorkspaceNavigator-v1.0.md
---

# PRD: WorkspaceNavigator

> **Feature**: Futuristic 4-state deploy flow for workspace navigation
> **Priority**: P0
> **Complexity**: T3 (Major component suite)

## Problem Statement

The current "select workspace" interface lacks:
- Situational awareness before entering workspace
- Intentional context-switching (feels arbitrary)
- Mobile usability for remote operations
- Efficient multi-repo management

## Solution Overview

Transform the workspace selector into an immersive deployment experience with a 4-state flow:

| State | Description |
|-------|-------------|
| **Browse** | Workspace cards with real-time status, infrastructure bar |
| **Confirm** | Slide-up modal with deployment preview, warnings |
| **Deploying** | Animated 5-stage sequence with live log output |
| **Deployed** | Command center with quick actions grid |

## User Stories

### US-1: Browse Workspaces
> As a developer, I want to see all my workspaces with real-time status so I can understand the ecosystem state at a glance.

**Acceptance Criteria:**
- Infrastructure bar shows VPS, Local, Sync status
- Each workspace card shows: name, description, active agents, open work, sync status
- Activity pulse indicator for workspaces with recent activity
- 44x44px minimum touch targets

### US-2: Confirm Deployment
> As a developer, I want to preview what will happen before deploying so I can make an informed decision.

**Acceptance Criteria:**
- Slide-up modal on mobile, centered on desktop
- Shows: workspace paths (local + VPS), agent count, sync status
- Warning banner if agents already running
- Cancel and Deploy Now buttons (52px min height)

### US-3: Watch Deployment
> As a developer, I want to see deployment progress so I know what's happening.

**Acceptance Criteria:**
- 5 stages: Connecting, Validating, Syncing, Provisioning, Ready
- Stage indicators: pending (gray), active (pulse), complete (green check)
- Terminal-style log output with timestamps
- Vertical connector lines between stages

### US-4: Access Command Center
> As a developer, I want quick actions after deployment so I can immediately start working.

**Acceptance Criteria:**
- Success badge with "Connected" status
- 2x2 action grid: Terminal, Kanban, Spawn Agent, New Work
- Back button to return to browse view
- Actions integrate with existing infrastructure

## Technical Specification

### New Components

```
src/components/navigator/
├── WorkspaceNavigator.tsx      # Main component, state machine
├── InfrastructureBar.tsx       # VPS/Local/Sync status bar
├── WorkspaceCard.tsx           # Individual workspace card
├── ConfirmSheet.tsx            # Mobile slide-up / desktop dialog
├── DeployingView.tsx           # Animation + log terminal
├── DeployedView.tsx            # Command center with quick actions
└── index.ts                    # Barrel exports
```

### New Hook

```typescript
// src/hooks/useWorkspaceNavigator.ts
type ViewState = 'browse' | 'confirm' | 'deploying' | 'deployed';

interface NavigatorState {
  view: ViewState;
  selectedWorkspace: Workspace | null;
  deployStage: number;
  logs: LogEntry[];
}

export function useWorkspaceNavigator(): {
  state: NavigatorState;
  selectWorkspace: (ws: Workspace) => void;
  confirmDeploy: () => void;
  cancel: () => void;
  back: () => void;
}
```

### Integration Points

| Existing Component | Purpose |
|-------------------|---------|
| `useWorkspaces()` | Fetch workspace list |
| `useBridgeMachines()` | VPS/Local machine status |
| `useRealtimeBridge()` | Real-time status updates |
| `useCommitments()` | Open work count per workspace |
| `CloudTerminal` | Terminal quick action |
| `SpawnAgentButton` | Agent spawn flow |

### Styling

- Convert reference prototype CSS-in-JS to Tailwind CSS
- Use existing `darkMode: 'class'` configuration
- Respect `prefers-reduced-motion` via `motion-safe:` / `motion-reduce:` variants
- Light mode matches existing dashboard aesthetic

## Constraints

- Mobile-first (375px minimum width)
- Touch-friendly (44x44px minimum targets)
- Slide-up modals on mobile, centered on desktop
- No horizontal scroll on any viewport
- No console errors or layout shifts

## Out of Scope

- Actual deployment backend (mock/simulate for now)
- Workspace creation/deletion
- Settings or configuration
- Multi-select or batch operations

## Reference

- **Prototype**: `docs/reference/mentu-navigator-mobile.jsx`
- **Intent**: `docs/INTENT-WorkspaceNavigator-v1.0.md`
- **Handoff**: `docs/HANDOFF-WorkspaceNavigator-v1.0.md`

---

*Generated from INTENT-WorkspaceNavigator-v1.0.md*
