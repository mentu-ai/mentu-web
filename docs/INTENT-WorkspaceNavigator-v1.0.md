---
id: INTENT-WorkspaceNavigator-v1.0
type: intent
version: "1.0"
created: 2026-01-05
architect:
  actor: agent:claude-architect
  session: workspace-navigator-design
tier_hint: T3
---

# Strategic Intent: WorkspaceNavigator

> **Mode**: Architect
> You lack local filesystem access. Produce strategic intent only.

## What

Build a futuristic, game-inspired Workspace Navigator that transforms the existing "select workspace" interface into an immersive deployment experience with a **4-state deploy flow**:

1. **Browse** — Workspace cards with real-time status
2. **Confirm** — Slide-up modal with deployment preview
3. **Deploying** — Animated sequence with live log output
4. **Deployed** — Command center with quick actions (Terminal, Kanban, Spawn Agent, New Work)

Reference prototype: `docs/reference/mentu-navigator-mobile.jsx`

## Why

- No situational awareness before entering workspace
- Context-switching feels arbitrary, not intentional
- Mobile unusable for remote ops
- Multi-repo management is cognitively expensive

## Constraints

**Design:**
- Light design for now (match existing platform)
- Dark mode compatible
- Same visual language as existing dashboard

**Technical:**
- Integrate with existing workspace selector
- Use existing Supabase real-time subscriptions
- VPS terminal via existing bridge infrastructure
- Animations respect `prefers-reduced-motion`

**Responsive:**
- Mobile-first (375px+)
- Touch-friendly (44x44px targets)
- Slide-up modals on mobile, centered on desktop

## Expected Outcome

### Browse State
- Global infrastructure bar (VPS, Local, Sync status)
- Workspace cards: name, description, activity pulse, running agents, active work, hooks, infrastructure dots, Deploy button

### Confirm State
- Slide-up modal with workspace identity
- Shows: VPS IP, sync size, context docs to load, hooks to activate, work items awaiting
- Warning if agents already running
- Cancel / Deploy → buttons

### Deploying State
- Full-screen animated sequence
- Stages: 🔗 Connecting → 🔄 Syncing → 📚 Loading Context → ⚡ Activating → ✓ Ready
- Live log output (terminal style)
- Scan line animations

### Deployed State
- Success banner
- Quick actions grid: Terminal, Kanban, Spawn Agent, New Work
- Tabs: Actions, Agents (with progress rings), Status
- Exit button

### Terminal Integration
- Every VPS workspace gets Terminal quick action
- Opens via bridge, inline or modal
- Connection persists across navigation

## Acceptance Criteria

1. ✓ All workspaces visible with real-time status
2. ✓ Deploy triggers confirmation with accurate preview
3. ✓ Deployment animates with live feedback
4. ✓ Deployed view has functional Terminal
5. ✓ Terminal connects to VPS via bridge
6. ✓ Works on mobile (iPhone SE+)
7. ✓ Light mode matches dashboard
8. ✓ Dark mode works
9. ✓ Animations respect accessibility
10. ✓ No console errors, layout shifts, horizontal scroll
