---
id: PROMPT-BridgeApiRoutes-v1.0
path: docs/PROMPT-BridgeApiRoutes-v1.0.md
type: prompt
intent: execute
version: "1.0"
created: 2026-01-05
last_updated: 2026-01-05
tier: T2
actor: (from manifest)
parent: HANDOFF-BridgeApiRoutes-v1.0
mentu:
  commitment: cmt_4dd68c78
  status: pending
---

# Executable Prompt: BridgeApiRoutes v1.0

## Launch Commands

### Option A: Native Claude (NO mentu-enforcer)

Use this when you do NOT need stop-time commitment enforcement:

```bash
claude \
  --dangerously-skip-permissions \
  --max-turns 50 \
  "
# IDENTITY
Your actor identity comes from the repository manifest (.mentu/manifest.yaml).
Your role (author_type) comes from the HANDOFF document you are executing.

Read .mentu/manifest.yaml to discover your actor.
Read the HANDOFF to discover your author_type (executor).

# COGNITIVE STANCE
Your domain is TECHNICAL.
- executor: TECHNICAL domain. Fix technical failures, defer on intent/safety.

The Rule: Failure in YOUR domain → own and fix. Failure elsewhere → you drifted.

# MISSION
Implement 5 Next.js API route handlers that proxy bridge operations to mentu-proxy.

# CONTRACT
Done when:
- completion.json checks pass (tsc, build)
- All 5 route files exist
- Commitment submitted with evidence
- RESULT document created

# PROTOCOL
1. Read .mentu/manifest.yaml to discover your actor identity
2. Read docs/HANDOFF-BridgeApiRoutes-v1.0.md (complete instructions)
3. Update .claude/completion.json with provided contract
4. Check commitment status - if already claimed, proceed. If not:
   mentu claim cmt_XXX --author-type executor
5. Follow Build Order in HANDOFF (5 stages)
6. Capture evidence:
   mentu capture 'Progress' --kind execution-progress --author-type executor
7. On completion: create RESULT, capture evidence, then:
   mentu submit cmt_XXX --summary 'Implemented 5 bridge API routes' --include-files

# CONSTRAINTS
- DO NOT create new files outside the specified paths
- DO NOT modify existing routes
- DO NOT change any frontend components
- MUST follow the /api/ops/approve pattern exactly

# RECOVERY
- If tsc fails: fix type errors before proceeding
- If build fails: check imports and exports
- If mentu commands fail: verify .mentu/ exists

# CONTEXT
Read: docs/HANDOFF-BridgeApiRoutes-v1.0.md (build instructions)
Reference: docs/PRD-BridgeApiRoutes-v1.0.md (full specification)
Pattern: src/app/api/ops/approve/route.ts (existing pattern to follow)

# EVIDENCE
Final message must include:
- All files created
- Build status (npm run build)
- Commitment ID submitted
"
```

---

### Option B: With Mentu Enforcer (WRAPPER SCRIPT)

Use this when you NEED stop-time commitment enforcement (agent cannot stop until commitments are closed):

```bash
~/claude-code-app/run-claude.sh \
  --dangerously-skip-permissions \
  --max-turns 50 \
  --mentu-enforcer \
  "Read .mentu/manifest.yaml for your actor, then read docs/HANDOFF-BridgeApiRoutes-v1.0.md and execute."
```

> **IMPORTANT**: `--mentu-enforcer` is a CUSTOM FLAG that ONLY works with the wrapper script.
> The native `claude` command does NOT recognize this flag and will error.

---

## Minimal Prompts

### Without Enforcer (native claude):

```bash
claude \
  --dangerously-skip-permissions \
  --max-turns 50 \
  "Read .mentu/manifest.yaml for your actor identity, then read docs/HANDOFF-BridgeApiRoutes-v1.0.md and execute as executor."
```

### With Enforcer (wrapper script):

```bash
~/claude-code-app/run-claude.sh \
  --dangerously-skip-permissions \
  --max-turns 50 \
  --mentu-enforcer \
  "Read .mentu/manifest.yaml for your actor identity, then read docs/HANDOFF-BridgeApiRoutes-v1.0.md and execute as executor."
```

---

## What This Prompt Delivers

| Deliverable | Description |
|-------------|-------------|
| `src/app/api/bridge/spawn/route.ts` | Proxy spawn agent requests to mentu-proxy |
| `src/app/api/bridge/stop/route.ts` | Proxy stop agent requests |
| `src/app/api/bridge/dev-server/route.ts` | Proxy dev server start/stop |
| `src/app/api/bridge/create-pr/route.ts` | Proxy create PR requests |
| `src/app/api/bridge/merge/route.ts` | Proxy merge requests |

---

## Expected Duration

- **Turns**: 15-30
- **Complexity**: T2 (Feature, multiple files)
- **Commitments**: 1

---

## Verification After Completion

```bash
# Verify deliverables exist
ls -la src/app/api/bridge/*/route.ts

# Verify build passes
npm run build

# Verify TypeScript passes
npx tsc --noEmit

# Verify commitment closed
mentu show cmt_XXX
```

---

*Launch the agent to complete the bridge API routes implementation.*
