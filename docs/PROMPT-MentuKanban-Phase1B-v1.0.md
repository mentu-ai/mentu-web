---
id: PROMPT-MentuKanban-Phase1B-v1.0
path: docs/PROMPT-MentuKanban-Phase1B-v1.0.md
type: prompt
intent: execute
version: "1.0"
created: 2026-01-03
last_updated: 2026-01-03
parent: HANDOFF-MentuKanban-Phase1B-v1.0
---

# Executor Prompt: Kanban Phase 1B

Copy and paste the following into a new Claude Code session:

---

```
You are an executor agent implementing Kanban Phase 1B visual enhancements.

## Mission

Read and execute: docs/HANDOFF-MentuKanban-Phase1B-v1.0.md

## Context

This is mentu-web, a Next.js dashboard. The Kanban board exists and works. Your job is to add 4 visual polish features:

1. **Add 5th column (Cancelled)** - Currently 4 columns, need 5
2. **Add running indicator to cards** - Spinner when agent is running
3. **Add emoji icons to logs** - Replace Lucide icons with emoji in BridgeLogsViewer
4. **Add per-file revert button** - Trash icon on each file in DiffViewer

## Key Files

- `src/hooks/useKanbanCommitments.ts` - Column types
- `src/components/kanban/KanbanBoard.tsx` - Column order
- `src/components/kanban/KanbanColumn.tsx` - Column config
- `src/components/kanban/CommitmentCard.tsx` - Card component
- `src/components/kanban/KanbanPage.tsx` - Page with bridge commands hook
- `src/components/kanban/BridgeLogsViewer.tsx` - Log icons
- `src/components/diff/DiffViewer.tsx` - File diff with revert

## Constraints

- DO NOT add chat input (requires new API)
- DO NOT add pause/resume (requires new API)
- DO NOT add edit/delete buttons (requires mutation API)
- Follow existing patterns exactly
- Run npm run build before declaring done

## Verification

When done:
1. npm run type-check passes
2. npm run build passes
3. All 5 columns render (To Do, In Progress, In Review, Done, Cancelled)
4. Cards show spinner when agent running
5. Logs show emoji icons
6. Diff files show revert button

Begin by reading docs/HANDOFF-MentuKanban-Phase1B-v1.0.md then execute stage by stage.
```

---

## Alternative: One-Liner for CLI

```bash
cd /Users/rashid/Desktop/Workspaces/mentu-web && claude "Read and execute docs/HANDOFF-MentuKanban-Phase1B-v1.0.md - Kanban Phase 1B visual enhancements. Add: 5th column (Cancelled), running indicator on cards, emoji log icons, per-file revert button. Run npm run build when done."
```

---

## With run-claude.sh Wrapper

```bash
~/claude-code-app/run-claude.sh \
    --dangerously-skip-permissions \
    --max-turns 50 \
    "
You are agent:claude-executor implementing Kanban Phase 1B.

# MISSION
Read docs/HANDOFF-MentuKanban-Phase1B-v1.0.md and execute all 4 stages.

# DELIVERABLES
1. Add 5th column (Cancelled) to Kanban
2. Add running indicator (spinner) to CommitmentCard
3. Add emoji icons to BridgeLogsViewer
4. Add per-file revert button to DiffViewer

# CONSTRAINTS
- DO NOT add features requiring new API endpoints
- Follow existing code patterns
- npm run build must pass

# VERIFICATION
- npm run type-check
- npm run build
- Visual check: 5 columns, spinner on running cards, emoji in logs, revert button on files

Execute stage by stage. Build before declaring done.
"
```
