---
id: PROMPT-ComprehensiveTestingSuite-BeaconWorkflowIntegration-v1.0
path: docs/PROMPT-ComprehensiveTestingSuite-BeaconWorkflowIntegration-v1.0.md
type: prompt
intent: execute

version: "1.0"
created: 2026-01-11
last_updated: 2026-01-11

tier: T3

actor: (from manifest)

parent: HANDOFF-ComprehensiveTestingSuite-BeaconWorkflowIntegration-v1.0

mentu:
  commitment: cmt_8f9f6d12
  status: pending
---

# Executable Prompt: Comprehensive Testing Suite - Beacon & Workflow Integration v1.0

## Launch Commands

### Option A: Native Claude (NO mentu-enforcer)

Use this when you do NOT need stop-time commitment enforcement:

```bash
claude \
  --dangerously-skip-permissions \
  --max-turns 150 \
  "
# IDENTITY
Your actor identity comes from the repository manifest (.mentu/manifest.yaml).
Your role (author_type) comes from the HANDOFF document you are executing.

Read .mentu/manifest.yaml to discover your actor.
Read the HANDOFF to discover your author_type (executor).

# COGNITIVE STANCE
Your domain: TECHNICAL
- executor: Fix technical failures (build, tests, types), defer on intent/safety.

The Rule: Failure in YOUR domain → own and fix. Failure elsewhere → you drifted.

# MISSION
Implement comprehensive test coverage across workflow orchestration (mentu-ai), beacon execution (mentu-beacon), and cross-system integration (Phases 2-4).

# CONTRACT
Done when:
- completion.json checks pass (tsc, tests)
- All phase tests passing (workflow, beacon, integration)
- Commitment submitted with evidence
- Phase 2: 4 workflow test files (parser, DAG, bug workflow, gates)
- Phase 3: 3 beacon test files (WebSocket, execution, evidence)
- Phase 4: 4 integration test files (bug→workflow, workflow→beacon, approval, E2E)
- RESULT document created with test results

# PROTOCOL
1. Read .mentu/manifest.yaml to discover your actor identity
2. Read docs/HANDOFF-ComprehensiveTestingSuite-BeaconWorkflowIntegration-v1.0.md (complete instructions)
3. Update .claude/completion.json with provided contract
4. Check commitment status - if already claimed, proceed. If not:
   mentu claim cmt_XXX --author-type executor
5. Add commitment ID to completion.json mentu.commitments.ids
6. Follow Build Order in HANDOFF (3 phases: Workflow, Beacon, Integration)
7. Capture evidence after each phase:
   mentu capture 'Phase N complete' --kind execution-progress --author-type executor
8. Run validators before submit
9. Create RESULT document
10. On completion: mentu submit cmt_XXX --summary '{Summary}' --include-files

# IDENTITY MODEL
- Actor: auto-resolved from .mentu/manifest.yaml (WHO)
- Author Type: executor (ROLE - from HANDOFF)
- Context: mentu-web (WHERE - from working dir)

# CONSTRAINTS
- DO NOT modify existing test infrastructure in mentu-web (Phase 1 complete)
- DO NOT skip test verification between phases
- DO NOT create tests that depend on production data
- DO NOT create flaky tests (must be 100% reproducible)
- All tests must clean up resources (files, processes)

# RECOVERY
- If tsc fails: fix type errors in test files
- If tests fail: check test logic, not implementation
- If mentu commands fail: verify .mentu/ exists in each repo
- If validation fails: check stance (mentu stance executor --failure technical), fix

# CONTEXT
Read: docs/HANDOFF-ComprehensiveTestingSuite-BeaconWorkflowIntegration-v1.0.md (build instructions)
Reference: docs/PRD-ComprehensiveTestingSuite-BeaconWorkflowIntegration-v1.0.md (full specification)
Reference: test-fixtures/ (sample test data)

# EVIDENCE
Final message must include:
- All test files created (12+)
- Test results for each phase
- Build status (tsc passes)
- Test coverage numbers
- Commitment ID submitted
"
```

---

### Option B: With Mentu Enforcer (WRAPPER SCRIPT)

Use this when you NEED stop-time commitment enforcement (agent cannot stop until commitments are closed):

```bash
~/claude-code-app/run-claude.sh \
  --dangerously-skip-permissions \
  --max-turns 150 \
  --mentu-enforcer \
  "Read .mentu/manifest.yaml for your actor, then read docs/HANDOFF-ComprehensiveTestingSuite-BeaconWorkflowIntegration-v1.0.md and execute."
```

> **IMPORTANT**: `--mentu-enforcer` is a CUSTOM FLAG that ONLY works with the wrapper script.
> The native `claude` command does NOT recognize this flag and will error.

---

## Minimal Prompts

### Without Enforcer (native claude):

```bash
claude \
  --dangerously-skip-permissions \
  --max-turns 150 \
  "Read .mentu/manifest.yaml for your actor identity, then read docs/HANDOFF-ComprehensiveTestingSuite-BeaconWorkflowIntegration-v1.0.md and execute as executor."
```

### With Enforcer (wrapper script):

```bash
~/claude-code-app/run-claude.sh \
  --dangerously-skip-permissions \
  --max-turns 150 \
  --mentu-enforcer \
  "Read .mentu/manifest.yaml for your actor identity, then read docs/HANDOFF-ComprehensiveTestingSuite-BeaconWorkflowIntegration-v1.0.md and execute as executor."
```

---

## What This Prompt Delivers

| Deliverable | Description |
|-------------|-------------|
| **Phase 2: Workflow Testing** | 4 test files covering workflow parsing, DAG validation, bug investigation, and gate mechanisms |
| **Phase 3: Beacon Testing** | 3 Rust test files covering WebSocket connections, command execution, and evidence capture |
| **Phase 4: Integration Testing** | 4 integration test files covering bug→workflow, workflow→beacon, approval gates, and E2E flows |
| **Test Infrastructure** | Updated Cargo.toml, test module structure, and integration test directory |
| **Documentation** | RESULT document with test results and coverage metrics |

---

## Expected Duration

- **Turns**: 100-150
- **Complexity**: T3 (Multi-part feature across 3 repositories)
- **Commitments**: 3 minimum (1 per phase)
- **Phases**: 3 (Workflow Testing, Beacon Testing, Integration Testing)

---

## Verification After Completion

```bash
# Verify Phase 2: Workflow Testing
cd /Users/rashid/Desktop/Workspaces/mentu-ai
npm test -- test/workflows/
# Expected: 4 test files, 30+ tests passing

# Verify Phase 3: Beacon Testing
cd /Users/rashid/Desktop/Workspaces/mentu-beacon/src-tauri
cargo test
# Expected: 3 test modules, 15+ tests passing

# Verify Phase 4: Integration Testing
cd /Users/rashid/Desktop/Workspaces/mentu-web
npm test -- test/integration/
# Expected: 4 test files, 10+ tests passing

# Verify all tests across ecosystem
cd /Users/rashid/Desktop/Workspaces/mentu-ai && npm test
cd /Users/rashid/Desktop/Workspaces/mentu-beacon/src-tauri && cargo test
cd /Users/rashid/Desktop/Workspaces/mentu-web && npm test

# Verify commitment closed
mentu show cmt_XXX
# Expected: state=closed, evidence captured
```

---

*Implement comprehensive test coverage across the Mentu ecosystem to ensure reliable automated bug investigation and deployment.*
