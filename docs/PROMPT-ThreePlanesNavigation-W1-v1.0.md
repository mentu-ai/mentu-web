---
# ============================================================
# CANONICAL YAML FRONT MATTER
# ============================================================
id: PROMPT-ThreePlanesNavigation-W1-v1.0
path: docs/PROMPT-ThreePlanesNavigation-W1-v1.0.md
type: prompt
intent: execute

# VERSIONING
version: "1.0"
created: 2026-01-03
last_updated: 2026-01-03

# TIER
tier: T3

# ACTOR
actor: (from manifest)

# RELATIONSHIPS
parent: HANDOFF-ThreePlanesNavigation-W1-v1.0

# MENTU INTEGRATION
mentu:
  commitment: pending
  status: pending
---

# Executable Prompt: ThreePlanesNavigation-W1 v1.0

## Launch Commands

### Option A: Native Claude (NO mentu-enforcer)

```bash
claude \
  --dangerously-skip-permissions \
  --max-turns 100 \
  "
# IDENTITY
Your actor identity comes from the repository manifest (.mentu/manifest.yaml).
Your role (author_type) comes from the HANDOFF document you are executing.

Read .mentu/manifest.yaml to discover your actor.
Read the HANDOFF to discover your author_type (executor).

# COGNITIVE STANCE
Your domain is TECHNICAL (executor role).
- Technical failures → Own it. Fix it. Don't explain.
- Intent/safety failures → You drifted. Re-read HANDOFF.

# MISSION
Build the three-plane navigation shell for mentu-web: TopNav with plane tabs, WorkspaceSelector, plane-aware Sidebar, and routing infrastructure.

# CONTRACT
Done when:
- completion.json checks pass (tsc, build)
- All 12 required files exist
- Can navigate between Context, Capability, Execution planes
- Sidebar changes per plane
- Workspace selector and project settings modal work
- Commitment submitted with evidence

# PROTOCOL
1. Read .mentu/manifest.yaml to discover your actor identity
2. Read docs/HANDOFF-ThreePlanesNavigation-W1-v1.0.md (complete instructions)
3. Update .claude/completion.json with provided contract
4. Claim commitment: mentu claim cmt_XXX --author-type executor
5. Follow Build Order in HANDOFF (11 stages)
6. Capture evidence: mentu capture 'Progress' --kind execution-progress
7. On completion: mentu submit cmt_XXX --summary 'W1 complete' --include-files

# CONSTRAINTS
- Use zinc-* color palette (NOT slate-*)
- Follow existing shadcn component patterns
- Preserve existing routes as redirects
- Read-only Phase 1 - no mutations
- Bridge moves to Capability plane

# RECOVERY
- If tsc fails: fix type errors before proceeding
- If build fails: check imports and exports
- If mentu commands fail: verify .mentu/ exists

# CONTEXT
Read: docs/HANDOFF-ThreePlanesNavigation-W1-v1.0.md (build instructions)
Reference: docs/PRD-ThreePlanesNavigation-W1-v1.0.md (full specification)
Reference: docs/mentu-dashboard-v6.jsx (design prototype)

# EVIDENCE
Final message must include:
- All files created/modified
- Build status (npm run build)
- Commitment ID submitted
"
```

---

### Option B: With Mentu Enforcer (WRAPPER SCRIPT)

```bash
~/claude-code-app/run-claude.sh \
  --dangerously-skip-permissions \
  --max-turns 100 \
  --mentu-enforcer \
  "Read .mentu/manifest.yaml for your actor, then read docs/HANDOFF-ThreePlanesNavigation-W1-v1.0.md and execute."
```

> **IMPORTANT**: `--mentu-enforcer` is a CUSTOM FLAG that ONLY works with the wrapper script.

---

## Minimal Prompts

### Without Enforcer (native claude):

```bash
claude \
  --dangerously-skip-permissions \
  --max-turns 100 \
  "Read .mentu/manifest.yaml for your actor identity, then read docs/HANDOFF-ThreePlanesNavigation-W1-v1.0.md and execute as the HANDOFF's author_type."
```

### With Enforcer (wrapper script):

```bash
~/claude-code-app/run-claude.sh \
  --dangerously-skip-permissions \
  --max-turns 100 \
  --mentu-enforcer \
  "Read .mentu/manifest.yaml for your actor identity, then read docs/HANDOFF-ThreePlanesNavigation-W1-v1.0.md and execute as the HANDOFF's author_type."
```

---

## What This Prompt Delivers

| Deliverable | Description |
|-------------|-------------|
| `src/lib/navigation/planeConfig.ts` | Plane types and configuration |
| `src/components/nav/TopNav.tsx` | Main navigation bar |
| `src/components/nav/PlaneTabs.tsx` | Context/Capability/Execution tabs |
| `src/components/nav/WorkspaceSelector.tsx` | Workspace dropdown |
| `src/components/modals/ProjectSettingsModal.tsx` | Settings modal |
| `src/components/layout/PlaneSidebar.tsx` | Plane-aware sidebar |
| `src/components/shared/PlaneCard.tsx` | Reusable overview card |
| `src/components/planes/*/Overview.tsx` | 3 plane overview pages |
| `src/app/workspace/[workspace]/[plane]/*` | Plane routing |

---

## Expected Duration

- **Turns**: 50-75
- **Complexity**: T3 (Multi-part, cross-cutting)
- **Commitments**: 1

---

## Verification After Completion

```bash
# Verify deliverables exist
ls src/lib/navigation/planeConfig.ts
ls src/components/nav/
ls src/components/planes/

# Verify build passes
npm run build

# Verify types pass
npx tsc --noEmit

# Verify commitment closed
mentu show cmt_XXX
```

---

## Key Design Reference

Before building, read the prototype:

```bash
cat docs/mentu-dashboard-v6.jsx
```

This shows exact UI structure. Adapt colors from `slate-*` to `zinc-*`.

---

*W1 establishes the navigation foundation for the three-plane architecture.*
