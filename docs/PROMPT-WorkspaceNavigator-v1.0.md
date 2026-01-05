---
id: PROMPT-WorkspaceNavigator-v1.0
type: prompt
version: "1.0"
created: 2026-01-05
status: ready
source: docs/HANDOFF-WorkspaceNavigator-v1.0.md
---

# Executor Prompt: WorkspaceNavigator

## Launch Command

```bash
~/run-claude.sh --dangerously-skip-permissions --max-turns 100 --mentu-enforcer \
  "Read docs/HANDOFF-WorkspaceNavigator-v1.0.md and execute all implementation instructions. Create all files specified in the handoff. Use the reference prototype at docs/reference/mentu-navigator-mobile.jsx as your implementation guide. Convert CSS-in-JS to Tailwind CSS. Test renders by running npm run dev."
```

## Context Files

Before starting, read these files in order:

1. `docs/PRD-WorkspaceNavigator-v1.0.md` - Requirements overview
2. `docs/HANDOFF-WorkspaceNavigator-v1.0.md` - Detailed implementation instructions (includes CloudTerminal infrastructure)
3. `docs/reference/mentu-navigator-mobile.jsx` - Complete reference prototype
4. `src/components/terminal/CloudTerminal.tsx` - Existing terminal component (LIVE at wss://api.mentu.ai/terminal)

## Deliverables

| File | Priority | Notes |
|------|----------|-------|
| `src/hooks/useWorkspaceNavigator.ts` | P0 | State machine with reducer pattern |
| `src/components/navigator/WorkspaceNavigator.tsx` | P0 | Main component, renders based on view |
| `src/components/navigator/InfrastructureBar.tsx` | P0 | VPS/Local/Sync status bar |
| `src/components/navigator/WorkspaceCard.tsx` | P0 | Individual workspace card |
| `src/components/navigator/ConfirmSheet.tsx` | P0 | Slide-up modal confirmation |
| `src/components/navigator/DeployingView.tsx` | P1 | Animated deployment stages |
| `src/components/navigator/DeployedView.tsx` | P1 | Command center post-deploy |
| `src/components/navigator/index.ts` | P2 | Barrel exports |

## Key Instructions

1. **State Machine**: Copy reducer pattern from prototype lines 198-285
2. **Tailwind Conversion**: Replace CSS-in-JS with Tailwind classes
3. **Dark Mode**: Use `dark:` variants matching existing codebase
4. **Accessibility**: Include ARIA labels, `motion-safe:` variants
5. **Integration**: Wire to existing hooks (`useWorkspaces`, `useBridgeMachines`, etc.)
6. **Terminal**: CloudTerminal is LIVE - connects to `wss://api.mentu.ai/terminal` (VPS with claude CLI). See HANDOFF section "CloudTerminal Infrastructure (LIVE)" for integration details.

## Verification

After implementation, verify:
- [ ] `npm run dev` starts without errors
- [ ] All 4 view states render correctly
- [ ] Dark mode works
- [ ] Mobile responsive (375px+)
- [ ] No console errors

## Evidence Required

Upon completion, create `docs/RESULT-WorkspaceNavigator-v1.0.md` with:
- Files created
- Screenshot or description of working UI
- Any deviations from handoff

---

*Ready for Executor agent*
