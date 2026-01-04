---
# ============================================================
# CANONICAL YAML FRONT MATTER
# ============================================================
id: PROMPT-ThreePlanesData-W3-v1.0
path: docs/PROMPT-ThreePlanesData-W3-v1.0.md
type: prompt
intent: execute

# VERSIONING
version: "1.0"
created: 2026-01-04
last_updated: 2026-01-04

# TIER
tier: T3

# ACTOR
actor: (from manifest)

# RELATIONSHIPS
parent: HANDOFF-ThreePlanesData-W3-v1.0

# MENTU INTEGRATION
mentu:
  commitment: cmt_3d389548
  status: pending
---

# Executable Prompt: ThreePlanesData-W3 v1.0

## Launch Commands

### Option A: Native Claude (NO mentu-enforcer)

Use this when you do NOT need stop-time commitment enforcement:

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
Your domain is TECHNICAL (you are an executor).
- Technical failures → Own it. Fix it. Don't explain.
- Intent/safety failures → You drifted. Re-read HANDOFF.

# MISSION
Connect three-plane views to Supabase data sources, replacing mock data with real queries.

# CONTRACT
Done when:
- completion.json checks pass (tsc, build)
- 6 hooks created (useGenesis, useActors, useIntegrations, useAgents, useExecutionStats, actors types)
- Views updated to use hooks
- Graceful fallback to mock data works
- Commitment submitted with evidence

# PROTOCOL
1. Read .mentu/manifest.yaml for actor identity
2. Read docs/HANDOFF-ThreePlanesData-W3-v1.0.md (complete instructions)
3. Update .claude/completion.json with provided contract
4. Claim commitment: mentu claim cmt_XXX --author-type executor
5. Follow Build Order (8 stages)
6. Verify: npm run build
7. Create RESULT document
8. Submit: mentu submit cmt_XXX --summary 'W3 Data Integration' --include-files

# CONSTRAINTS
- Read-only queries only (no mutations)
- Graceful fallback to mock data required
- Follow existing hook patterns (useBridgeMachines.ts)
- No new Supabase tables

# RECOVERY
- If tsc fails: check import paths and types
- If build fails: verify hook exports
- If Supabase query fails: ensure fallback returns mock data

# CONTEXT
Read: docs/HANDOFF-ThreePlanesData-W3-v1.0.md
Reference: docs/PRD-ThreePlanesData-W3-v1.0.md
Pattern: src/hooks/useBridgeMachines.ts

# EVIDENCE
Final message must include:
- All hooks created
- Views updated
- Build status (npm run build)
- Commitment ID submitted
"
```

---

### Option B: With Mentu Enforcer (WRAPPER SCRIPT)

Use this when you NEED stop-time commitment enforcement:

```bash
~/claude-code-app/run-claude.sh \
  --dangerously-skip-permissions \
  --max-turns 100 \
  --mentu-enforcer \
  "Read .mentu/manifest.yaml for your actor, then read docs/HANDOFF-ThreePlanesData-W3-v1.0.md and execute."
```

> **IMPORTANT**: `--mentu-enforcer` is a CUSTOM FLAG that ONLY works with the wrapper script.

---

## Minimal Prompts

### Without Enforcer (native claude):

```bash
claude \
  --dangerously-skip-permissions \
  --max-turns 100 \
  "Read .mentu/manifest.yaml for your actor identity, then read docs/HANDOFF-ThreePlanesData-W3-v1.0.md and execute as executor."
```

### With Enforcer (wrapper script):

```bash
~/claude-code-app/run-claude.sh \
  --dangerously-skip-permissions \
  --max-turns 100 \
  --mentu-enforcer \
  "Read .mentu/manifest.yaml for your actor identity, then read docs/HANDOFF-ThreePlanesData-W3-v1.0.md and execute as executor."
```

---

## What This Prompt Delivers

| Deliverable | Description |
|-------------|-------------|
| `src/hooks/useGenesis.ts` | Fetch workspace genesis metadata |
| `src/hooks/useActors.ts` | Fetch actor_mappings with transform |
| `src/hooks/useIntegrations.ts` | Fetch bridge_machines for status |
| `src/hooks/useAgents.ts` | Derive agents from bridge_commands |
| `src/hooks/useExecutionStats.ts` | Aggregate commitment/memory stats |
| `src/lib/supabase/types/actors.ts` | Actor type definitions |
| Updated views | Views use hooks instead of mock imports |

---

## Expected Duration

- **Turns**: 40-60
- **Complexity**: T3 (multi-file, multiple hooks)
- **Commitments**: 1

---

## Verification After Completion

```bash
# Verify hooks exist
ls src/hooks/useGenesis.ts src/hooks/useActors.ts src/hooks/useIntegrations.ts

# Verify types exist
ls src/lib/supabase/types/actors.ts

# Verify build passes
npm run build

# Verify commitment closed
mentu show cmt_XXX
```

---

*W3 connects UI to data. After completion, views display live workspace state.*
