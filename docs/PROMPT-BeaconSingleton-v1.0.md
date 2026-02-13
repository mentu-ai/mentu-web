---
id: PROMPT-BeaconSingleton-v1.0
path: docs/PROMPT-BeaconSingleton-v1.0.md
type: prompt
intent: execute

version: "1.0"
created: 2026-01-11
last_updated: 2026-01-11

tier: T2

actor: (from manifest)

parent: HANDOFF-BeaconSingleton-v1.0

mentu:
  commitment: cmt_228cb0ba
  status: pending
---

# Executable Prompt: BeaconSingleton v1.0

## Launch Commands

### Option A: Native Claude (NO mentu-enforcer)

Use this when you do NOT need stop-time commitment enforcement:

```bash
claude \
  --dangerously-skip-permissions \
  --max-turns 40 \
  "
# IDENTITY
Your actor identity comes from the repository manifest (.mentu/manifest.yaml).
Your role (author_type) comes from the HANDOFF document you are executing.

Read .mentu/manifest.yaml to discover your actor.
Read the HANDOFF to discover your author_type (executor/auditor/architect).

# COGNITIVE STANCE
Your domain depends on your author_type:
- executor: TECHNICAL domain. Fix technical failures, defer on intent/safety.
- auditor: SAFETY domain. Fix safety failures, defer on technical/intent.
- architect: INTENT domain. Fix intent failures, defer on technical/safety.

The Rule: Failure in YOUR domain → own and fix. Failure elsewhere → you drifted.

# MISSION
Implement singleton pattern for Mentu Beacon to ensure only one instance can run at a time.

# CONTRACT
Done when:
- completion.json checks pass (build)
- Commitment submitted with evidence
- src-tauri/src/singleton.rs created with lock management
- src-tauri/src/main.rs modified with singleton check
- Unit tests pass (cargo test singleton)
- Integration tests pass (test-singleton.sh)

# PROTOCOL
1. Read .mentu/manifest.yaml to discover your actor identity
2. Read docs/HANDOFF-BeaconSingleton-v1.0.md (complete instructions, includes author_type)
3. Update .claude/completion.json with provided contract
4. Check commitment status - if already claimed, proceed. If not:
   mentu claim cmt_XXX --author-type executor  # Actor auto-resolved
5. Add commitment ID to completion.json mentu.commitments.ids
6. Follow Build Order in HANDOFF (5 stages)
7. Capture evidence:
   mentu capture 'Progress' --kind execution-progress --author-type executor
8. On completion: mentu submit cmt_XXX --summary 'Summary' --include-files

# IDENTITY MODEL
- Actor: auto-resolved from .mentu/manifest.yaml (WHO)
- Author Type: from HANDOFF's author_type field (ROLE)
- Context: added to operations via meta.context (WHERE)

# CONSTRAINTS
- DO NOT create new files outside the specified paths
- MUST work on macOS (primary platform)
- MUST handle crash recovery (stale locks)
- Lock file MUST be at ~/.mentu/beacon.lock

# RECOVERY
- If cargo check fails: fix Rust type errors before proceeding
- If build fails: check imports and module declarations
- If mentu commands fail: verify .mentu/ exists
- If validation fails: check stance, fix, don't argue

# CONTEXT
Read: docs/HANDOFF-BeaconSingleton-v1.0.md (build instructions)
Reference: docs/PRD-BeaconSingleton-v1.0.md (full specification)

# EVIDENCE
Final message must include:
- All files created/modified
- Build status (cargo build --release)
- Test results (cargo test singleton)
- Integration test results
- Commitment ID submitted
"
```

---

### Option B: With Mentu Enforcer (WRAPPER SCRIPT)

Use this when you NEED stop-time commitment enforcement (agent cannot stop until commitments are closed):

```bash
~/claude-code-app/run-claude.sh \
  --dangerously-skip-permissions \
  --max-turns 40 \
  --mentu-enforcer \
  "Read .mentu/manifest.yaml for your actor, then read docs/HANDOFF-BeaconSingleton-v1.0.md and execute."
```

> **IMPORTANT**: `--mentu-enforcer` is a CUSTOM FLAG that ONLY works with the wrapper script.
> The native `claude` command does NOT recognize this flag and will error.

---

## Minimal Prompts

### Without Enforcer (native claude):

```bash
claude \
  --dangerously-skip-permissions \
  --max-turns 40 \
  "Read .mentu/manifest.yaml for your actor identity, then read docs/HANDOFF-BeaconSingleton-v1.0.md and execute as the HANDOFF's author_type."
```

### With Enforcer (wrapper script):

```bash
~/claude-code-app/run-claude.sh \
  --dangerously-skip-permissions \
  --max-turns 40 \
  --mentu-enforcer \
  "Read .mentu/manifest.yaml for your actor identity, then read docs/HANDOFF-BeaconSingleton-v1.0.md and execute as the HANDOFF's author_type."
```

---

## What This Prompt Delivers

| Deliverable | Description |
|-------------|-------------|
| `src-tauri/src/singleton.rs` | Singleton lock management module with acquire/release/check |
| `src-tauri/src/main.rs` | Modified to check singleton before starting |
| `--allow-multiple` flag | CLI flag to bypass singleton for development |
| Unit tests | Tests for lock acquisition, release, and stale lock handling |
| Integration tests | Script to verify end-to-end singleton behavior |

---

## Expected Duration

- **Turns**: 20-40
- **Complexity**: T2 (Single feature with testing)
- **Commitments**: 1

---

## Verification After Completion

```bash
# Verify singleton module exists
ls -la /Users/rashid/Desktop/Workspaces/mentu-beacon/src-tauri/src/singleton.rs

# Verify build passes
cd /Users/rashid/Desktop/Workspaces/mentu-beacon/src-tauri
cargo build --release

# Verify unit tests pass
cargo test singleton

# Run integration tests
./test-singleton.sh

# Verify commitment closed
mentu show cmt_XXX
```

---

*Guarantee single-instance beacon for predictable operation.*
