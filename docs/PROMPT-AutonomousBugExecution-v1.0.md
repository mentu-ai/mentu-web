---
# ============================================================
# CANONICAL YAML FRONT MATTER
# ============================================================
id: PROMPT-AutonomousBugExecution-v1.0
path: docs/PROMPT-AutonomousBugExecution-v1.0.md
type: prompt
intent: execute

version: "1.0"
created: 2026-01-12
last_updated: 2026-01-12

tier: T3
actor: (from manifest)

parent: HANDOFF-AutonomousBugExecution-v1.0

mentu:
  commitment: cmt_bcfb7d21
  status: pending
---

# Executable Prompt: AutonomousBugExecution v1.0

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
Your domain: TECHNICAL
- You are an executor. Fix technical failures, defer on intent/safety.
- Failure in YOUR domain → own and fix. Failure elsewhere → you drifted.

# MISSION
Build the UI layer for autonomous bug execution in mentu-web: execution plane page, inline execution from bug detail, real-time log streaming, and execution controls.

# CONTRACT
Done when:
- completion.json checks pass (tsc, build)
- All required files exist and compile
- Execution plane page renders at /workspace/[ws]/[plane]/bug-execution
- Execute button works on bug report detail
- Logs stream in real-time
- Commitment submitted with evidence

# PROTOCOL
1. Read .mentu/manifest.yaml to discover your actor identity
2. Read docs/HANDOFF-AutonomousBugExecution-v1.0.md (complete build instructions)
3. Update .claude/completion.json with provided contract
4. Check commitment status - if already claimed, proceed. If not:
   mentu claim cmt_XXX --author-type executor
5. Follow Build Order in HANDOFF (9 stages)
6. Run build verification after each stage
7. Create RESULT document
8. Capture evidence:
   mentu capture 'Created RESULT-AutonomousBugExecution' --kind result-document
9. Submit: mentu submit cmt_XXX --summary 'Autonomous bug execution UI' --include-files

# CONSTRAINTS
- DO NOT modify CloudTerminal files
- DO NOT create new components outside src/components/bug-report/
- DO NOT skip database schema setup
- Follow existing patterns from useBridgeCommands and useBridgeMachines hooks

# RECOVERY
- If tsc fails: fix type errors before proceeding
- If build fails: check imports and exports
- If Supabase types missing: run npm run generate:types
- If hooks fail: check createClient() import path

# CONTEXT
Read: docs/HANDOFF-AutonomousBugExecution-v1.0.md (build instructions)
Reference: docs/PRD-AutonomousBugExecution-v1.0.md (full specification)
Reference: src/hooks/useBridgeCommands.ts (existing pattern)
Reference: src/hooks/useRealtime.ts (subscription pattern)

# EVIDENCE
Final message must include:
- All files created/modified
- Build status (npm run build)
- TypeScript check (npx tsc --noEmit)
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
  "Read .mentu/manifest.yaml for your actor, then read docs/HANDOFF-AutonomousBugExecution-v1.0.md and execute."
```

> **IMPORTANT**: `--mentu-enforcer` is a CUSTOM FLAG that ONLY works with the wrapper script.

---

## Minimal Prompts

### Without Enforcer (native claude):

```bash
claude \
  --dangerously-skip-permissions \
  --max-turns 100 \
  "Read .mentu/manifest.yaml for your actor identity, then read docs/HANDOFF-AutonomousBugExecution-v1.0.md and execute as the HANDOFF's author_type."
```

### With Enforcer (wrapper script):

```bash
~/claude-code-app/run-claude.sh \
  --dangerously-skip-permissions \
  --max-turns 100 \
  --mentu-enforcer \
  "Read .mentu/manifest.yaml for your actor identity, then read docs/HANDOFF-AutonomousBugExecution-v1.0.md and execute as the HANDOFF's author_type."
```

---

## What This Prompt Delivers

| Deliverable | Description |
|-------------|-------------|
| `src/hooks/useSpawnLogs.ts` | Real-time subscription to spawn_logs |
| `src/hooks/useBugExecution.ts` | Trigger and monitor executions |
| `src/components/bug-report/BugExecutionPanel.tsx` | Execution controls UI |
| `src/components/bug-report/ExecutionOutput.tsx` | Terminal-like log viewer |
| `src/app/workspace/.../bug-execution/page.tsx` | Execution plane page |
| `src/lib/api/bug-execution.ts` | API helpers |

---

## Expected Duration

- **Turns**: 40-60
- **Complexity**: T3 (Multi-part feature)
- **Commitments**: 1

---

## Verification After Completion

```bash
# Verify deliverables exist
ls -la src/hooks/useSpawnLogs.ts
ls -la src/hooks/useBugExecution.ts
ls -la src/components/bug-report/BugExecutionPanel.tsx
ls -la src/components/bug-report/ExecutionOutput.tsx
ls -la src/app/workspace/\[workspace\]/\[plane\]/bug-execution/page.tsx
ls -la src/lib/api/bug-execution.ts

# Verify build passes
npm run build

# Verify TypeScript
npx tsc --noEmit

# Verify commitment closed
mentu show cmt_XXX
```

---

*Autonomous bug execution UI: trigger, monitor, and manage bug fixes from the dashboard.*
