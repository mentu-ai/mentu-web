---
id: HANDOFF-WorkspaceNavigator-v1.0
type: handoff
version: "1.0"
created: 2026-01-05
auditor:
  actor: agent:claude-auditor
  session: workspace-navigator-audit
approved: true
tier: T3
---

# HANDOFF: WorkspaceNavigator Implementation

> **Status**: APPROVED
> **Audit Date**: 2026-01-05
> **Reference**: docs/INTENT-WorkspaceNavigator-v1.0.md
> **Prototype**: docs/reference/mentu-navigator-mobile.jsx

## Audit Summary

The 4-state deploy flow design has been validated against:

| Criterion | Status | Notes |
|-----------|--------|-------|
| Completeness | Pass | All 4 states fully specified with clear transitions |
| Feasibility | Pass | Integrates with existing hooks and infrastructure |
| Accessibility | Pass | ARIA, focus management, reduced-motion support included |
| Mobile-first | Pass | 44x44px touch targets, slide-up modals, responsive grid |

## Architecture Decision

The reference prototype uses CSS-in-JS inline styles. For production, **convert to Tailwind CSS** to match existing codebase patterns (see `tailwind.config.ts` with `darkMode: 'class'`).

## Integration Points

### Existing Infrastructure to Leverage

| Component | Location | Purpose |
|-----------|----------|---------|
| `useWorkspaces()` | `src/hooks/useWorkspace.ts` | Fetch workspace list from Supabase |
| `useBridgeMachines()` | `src/hooks/useBridgeMachines.ts` | VPS/Local machine status |
| `useRealtimeBridge()` | `src/hooks/useRealtime.ts` | Real-time bridge status |
| `useCommitments()` | `src/hooks/useCommitments.ts` | Open work count per workspace |
| `CloudTerminal` | `src/components/terminal/CloudTerminal.tsx` | xterm.js WebSocket terminal |
| `SpawnAgentButton` | `src/components/kanban/actions/SpawnAgentButton.tsx` | Agent spawn via `/api/bridge/spawn` |
| `Dialog` | `src/components/ui/dialog.tsx` | Radix-based modal (use for desktop variant) |

### New Components to Create

```
src/components/navigator/
├── WorkspaceNavigator.tsx      # Main component with state machine
├── InfrastructureBar.tsx       # VPS/Local/Sync status bar
├── WorkspaceCard.tsx           # Individual workspace card
├── ConfirmSheet.tsx            # Mobile slide-up / desktop dialog
├── DeployingView.tsx           # Animation + log terminal
├── DeployedView.tsx            # Command center with quick actions
└── index.ts                    # Exports
```

### New Hook to Create

```typescript
// src/hooks/useWorkspaceNavigator.ts
export function useWorkspaceNavigator() {
  // State machine: browse | confirm | deploying | deployed
  // Selected workspace
  // Deploy stage (0-4)
  // Logs array
  // Actions: selectWorkspace, confirmDeploy, cancel, back
}
```

## Implementation Instructions

### Phase 1: State Machine & Browse State

1. Create `useWorkspaceNavigator` hook with reducer pattern (copy from prototype lines 198-285)
2. Create `WorkspaceNavigator.tsx` - renders based on view state
3. Create `InfrastructureBar.tsx`:
   - Use `useBridgeMachines()` for VPS/Local status
   - Horizontal scroll on mobile (`overflow-x-auto`)
   - Status dots: green (online), amber (syncing), red (offline)
4. Create `WorkspaceCard.tsx`:
   - Use `useWorkspaces()` for workspace data
   - Use `useCommitments(workspaceId)` for open work count
   - Activity pulse: `hasActivity` from last operation timestamp
   - 44x44px Deploy button with `min-h-[44px] min-w-[44px]`

### Phase 2: Confirm State

1. Create `ConfirmSheet.tsx`:
   - Mobile: Slide-up sheet (use Radix `Dialog` with custom positioning)
   - Desktop: Centered modal
   - Show: workspace name, paths, agent count, sync status
   - Warning banner if `activeAgents > 0`
   - Touch-friendly buttons: `min-h-[52px]`

### Phase 3: Deploying State

1. Create `DeployingView.tsx`:
   - 5 stages with vertical connector lines
   - Stage indicators: pending (gray ring) | active (pulse) | complete (green check)
   - Terminal log output - reuse xterm.js styling pattern from `CloudTerminal`
   - Stage timing matches prototype `DEPLOY_STAGES` (lines 50-56)

2. Real deployment integration:
   - Call `/api/bridge/deploy` (new endpoint) or reuse spawn pattern
   - Stream logs via Supabase real-time on `bridge_logs` table
   - Update stage based on actual bridge response

### Phase 4: Deployed State

1. Create `DeployedView.tsx`:
   - Success badge with check icon
   - 2x2 action grid (120px min-height cards)
   - Quick actions:
     - **Terminal**: Opens `CloudTerminal` in dialog/modal
     - **Kanban**: Navigate to `/workspace/[id]/kanban`
     - **Spawn Agent**: Opens agent spawn flow
     - **New Work**: Opens commitment creation

### Phase 5: Integration

1. Add route: `src/app/navigator/page.tsx` (standalone) OR
2. Replace workspace selector: Update `src/components/nav/WorkspaceSelector.tsx` to use new navigator
3. Add entry point in sidebar/nav for "Switch Workspace"

## Styling Guidelines

### Convert Prototype Styles to Tailwind

```jsx
// Prototype (CSS-in-JS)
style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}

// Production (Tailwind)
className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-700"
```

### Dark Mode

Use Tailwind `dark:` variants to match existing pattern:
```jsx
className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
```

### Reduced Motion

Add to global CSS or use Tailwind plugin:
```css
@media (prefers-reduced-motion: reduce) {
  .animate-pulse { animation: none; }
}
```

Or use Tailwind: `motion-safe:animate-pulse motion-reduce:animate-none`

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    WorkspaceNavigator                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  useWorkspaces()         → WorkspaceCard[]                      │
│  useBridgeMachines()     → InfrastructureBar                    │
│  useCommitments(ws.id)   → openWork count per card              │
│  useRealtimeBridge()     → Live status updates                  │
│                                                                  │
│  State Machine:                                                  │
│  ┌─────────┐  select   ┌─────────┐  deploy  ┌───────────┐       │
│  │ BROWSE  │ ────────► │ CONFIRM │ ───────► │ DEPLOYING │       │
│  └─────────┘           └─────────┘          └───────────┘       │
│       ▲                     │                     │              │
│       │      cancel         │                     │ complete     │
│       └─────────────────────┘                     ▼              │
│                                             ┌──────────┐         │
│       ◄─────────────────────────────────────┤ DEPLOYED │         │
│                     back                    └──────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Acceptance Checklist

Before marking complete, verify:

- [ ] All workspaces visible with real-time status from Supabase
- [ ] Deploy triggers confirmation modal with accurate preview
- [ ] Deployment animates with live feedback (or real logs)
- [ ] Deployed view has functional Terminal quick action
- [ ] Terminal connects to VPS via existing WebSocket infrastructure
- [ ] Works on iPhone SE (375px) and larger
- [ ] Light mode matches existing dashboard aesthetic
- [ ] Dark mode respects `darkMode: 'class'` config
- [ ] Animations respect `prefers-reduced-motion`
- [ ] No console errors, no layout shifts, no horizontal scroll

## Files to Create

| File | Priority | Estimate |
|------|----------|----------|
| `src/hooks/useWorkspaceNavigator.ts` | P0 | State machine hook |
| `src/components/navigator/WorkspaceNavigator.tsx` | P0 | Main component |
| `src/components/navigator/InfrastructureBar.tsx` | P0 | Status bar |
| `src/components/navigator/WorkspaceCard.tsx` | P0 | Card component |
| `src/components/navigator/ConfirmSheet.tsx` | P0 | Confirmation modal |
| `src/components/navigator/DeployingView.tsx` | P1 | Deploy animation |
| `src/components/navigator/DeployedView.tsx` | P1 | Command center |
| `src/app/navigator/page.tsx` | P1 | Page route |
| `src/components/navigator/index.ts` | P2 | Barrel export |

## Notes for Executor

1. **Terminal Integration**: The `CloudTerminal` component already exists at `src/components/terminal/CloudTerminal.tsx`. Wire the "Terminal" quick action to open it in a Dialog modal.

2. **Spawn Agent Integration**: Reuse `SpawnAgentButton` logic but adapt for workspace-level spawning (no commitment required).

3. **Deploy Endpoint**: May need to create `/api/bridge/deploy` if not using existing spawn pattern. The "deploy" action should:
   - Validate workspace exists
   - Check sync status
   - Update workspace `last_deployed_at` timestamp
   - Return success/failure

4. **Mock Mode**: Prototype includes mock data (`MOCK_WORKSPACES`, etc.). For real integration, replace with actual hook data but keep mock patterns for development/testing.

5. **Keyboard Navigation**: Add `onKeyDown` handlers for Enter/Space on interactive elements per prototype pattern (line 1165).

## CloudTerminal Infrastructure (LIVE)

The terminal infrastructure is fully operational. Here are the key details for integration:

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     CloudTerminal Flow                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Browser (mentu-web)                                            │
│       │                                                         │
│       │ wss://api.mentu.ai/terminal                            │
│       ▼                                                         │
│  ┌─────────────┐                                               │
│  │   Caddy     │  (Docker: mentu-caddy)                        │
│  │   HTTPS     │  - SSL termination                            │
│  │   Reverse   │  - Routes /terminal* to host:3002             │
│  └─────────────┘                                               │
│       │                                                         │
│       │ http://172.17.0.1:3002                                 │
│       ▼                                                         │
│  ┌─────────────┐                                               │
│  │  terminal   │  (Host: systemd user service)                 │
│  │  server     │  - node-pty spawns bash as mentu user         │
│  │  :3002      │  - Full VPS environment (claude CLI, etc.)    │
│  └─────────────┘                                               │
│       │                                                         │
│       ▼                                                         │
│  /home/mentu/Workspaces (VPS filesystem)                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Endpoints

| Endpoint | Purpose |
|----------|---------|
| `https://api.mentu.ai/health` | Health check (returns JSON) |
| `wss://api.mentu.ai/terminal` | WebSocket terminal connection |

### CloudTerminal Component

Located at `src/components/terminal/CloudTerminal.tsx`:

```typescript
// WebSocket endpoint (can be overridden via env)
const wsUrl = process.env.NEXT_PUBLIC_TERMINAL_URL || 'wss://api.mentu.ai/terminal';

// Message protocol:
// Browser → Server: { type: 'input', data: string }
// Browser → Server: { type: 'resize', cols: number, rows: number }
// Server → Browser: { type: 'output', data: string }
```

### Using Terminal in Navigator

The "Terminal" quick action in DeployedView should:

```tsx
import { CloudTerminal } from '@/components/terminal/CloudTerminal';
import { Dialog, DialogContent } from '@/components/ui/dialog';

// In DeployedView.tsx
const [terminalOpen, setTerminalOpen] = useState(false);

<Dialog open={terminalOpen} onOpenChange={setTerminalOpen}>
  <DialogContent className="max-w-4xl h-[600px] p-0">
    <CloudTerminal className="h-full rounded-lg overflow-hidden" />
  </DialogContent>
</Dialog>
```

### VPS Services

The terminal connects to these services on VPS (208.167.255.71):

| Service | Port | Run As | Notes |
|---------|------|--------|-------|
| terminal-server | 3002 | mentu (systemd user) | node-pty WebSocket server |
| mentu-serve | 3001 | Docker container | Mentu API (health, diff) |
| Caddy | 443 | Docker container | HTTPS/WSS reverse proxy |

### Environment Variables (Optional)

In `.env.local` or Vercel:
```
NEXT_PUBLIC_TERMINAL_URL=wss://api.mentu.ai/terminal
```

### Troubleshooting

If terminal shows "Disconnected":
1. Check VPS: `ssh mentu@208.167.255.71 'systemctl --user status terminal-server'`
2. Check Caddy: `docker logs mentu-caddy --tail 20`
3. Test endpoint: `curl -s https://api.mentu.ai/health`

If Docker can't reach host ports (502 errors):
```bash
# SSH as root and run:
ssh root@208.167.255.71
iptables -I DOCKER-USER -j ACCEPT
iptables -I INPUT -p tcp --dport 3002 -j ACCEPT
netfilter-persistent save
```

---

*Generated by Auditor Agent - Ready for Executor*
