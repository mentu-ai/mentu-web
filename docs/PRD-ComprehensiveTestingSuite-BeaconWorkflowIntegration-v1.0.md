---
id: PRD-ComprehensiveTestingSuite-BeaconWorkflowIntegration-v1.0
path: docs/PRD-ComprehensiveTestingSuite-BeaconWorkflowIntegration-v1.0.md
type: prd
intent: reference

version: "1.0"
created: 2026-01-11
last_updated: 2026-01-11

tier: T3

children:
  - HANDOFF-ComprehensiveTestingSuite-BeaconWorkflowIntegration-v1.0
dependencies:
  - /Users/rashid/.claude/plans/structured-sauteeing-robin.md

mentu:
  commitment: cmt_8f9f6d12
  status: pending
---

# PRD: Comprehensive Testing Suite - Beacon & Workflow Integration v1.0

## Mission

Establish comprehensive test coverage across the Mentu ecosystem's execution and orchestration layers (workflow orchestration, beacon execution, and cross-system integration) to ensure reliable automated bug investigation and fix deployment.

---

## Problem Statement

### Current State

```
mentu-web:     NO test framework ❌
mentu-beacon:  NO unit tests (Rust or TypeScript) ❌
               Only 2 bash integration tests
mentu-ai:      100+ Vitest tests ✅
mentu-bridge:  40+ Vitest tests ✅

Workflow System:  No dedicated tests for DAG execution, gates, branching
Beacon System:    No tests for WebSocket, command execution, evidence capture
Integration:      No tests for bug report → workflow → beacon → fix flow
```

**Issues:**
- No confidence in workflow orchestration (DAG execution, approval gates)
- Beacon execution reliability unknown (WebSocket, command claiming)
- Integration paths untested (bug report → investigation → fix → deploy)
- Regression risk high when making changes

### Desired State

```
mentu-web:     Vitest + Testing Library ✅
               Component tests (ScreenshotViewer, WorkflowProgress)
               Hook tests (useBugReports, useWorkflowInstance)

mentu-beacon:  Rust unit tests ✅
               TypeScript component tests ✅
               WebSocket connection tests
               Command execution tests

mentu-ai:      Workflow orchestration tests ✅
               DAG validation tests
               Gate mechanism tests
               Bug investigation workflow tests

Integration:   End-to-end flow tests ✅
               Bug report → workflow trigger
               Workflow → beacon execution
               Approval gate → resume
               Complete bug fix cycle
```

**Benefits:**
- High confidence in deployment
- Rapid iteration without breaking changes
- Automated regression detection
- Documented behavior through tests

---

## Completion Contract

**First action**: Update `.claude/completion.json`:

```json
{
  "version": "2.0",
  "name": "Comprehensive Testing Suite - Beacon & Workflow Integration",
  "tier": "T3",
  "required_files": [
    "mentu-web/vitest.config.ts",
    "mentu-web/src/test/setup.ts",
    "mentu-web/src/components/bug-report/__tests__/screenshot-viewer.test.tsx",
    "mentu-web/src/hooks/__tests__/useBugReports.test.ts",
    "test-fixtures/README.md",
    "test-fixtures/bug-reports/sample-with-screenshot.json",
    "test-fixtures/workflows/bug-investigation.json",
    "test-fixtures/workflow-instances/at-approval-gate.json",
    "mentu-ai/test/workflows/workflow-parser.test.ts",
    "mentu-ai/test/workflows/dag-validator.test.ts",
    "mentu-ai/test/workflows/bug-investigation-workflow.test.ts",
    "mentu-ai/test/workflows/gate-mechanisms.test.ts",
    "mentu-beacon/src-tauri/Cargo.toml",
    "mentu-beacon/src-tauri/src/tests/mod.rs",
    "mentu-beacon/src-tauri/src/tests/websocket.rs",
    "mentu-beacon/src-tauri/src/tests/command_execution.rs",
    "mentu-beacon/src-tauri/src/tests/evidence_capture.rs",
    "test/integration/bug-report-to-workflow.test.ts",
    "test/integration/workflow-to-beacon.test.ts",
    "test/integration/approval-gate-resume.test.ts",
    "test/integration/end-to-end-bug-fix.test.ts"
  ],
  "checks": {
    "tsc": true,
    "build": false,
    "test": true
  },
  "mentu": {
    "enabled": true,
    "actor": "agent:claude-executor",
    "commitments": {
      "mode": "dynamic",
      "min_count": 3,
      "require_closed": true,
      "require_evidence": true
    }
  },
  "max_iterations": 150
}
```

---

## Core Concepts

### Test Pyramid

```
        ┌─────────────────┐
        │   E2E Tests     │ ← Integration tests (4 tests)
        │   (Slow)        │   Full system verification
        └─────────────────┘
       ┌───────────────────┐
       │ Integration Tests │ ← Cross-component tests
       │   (Medium)        │   Workflow ↔ Beacon
       └───────────────────┘
      ┌─────────────────────┐
      │   Unit Tests        │ ← Component isolation tests
      │   (Fast)            │   High volume, quick feedback
      └─────────────────────┘
```

### Test Fixtures

Shared test data across the ecosystem:
- **Location**: `Workspaces/test-fixtures/`
- **Purpose**: Consistent, realistic test data
- **Versioning**: Update when schema changes

### Test Infrastructure

- **mentu-web**: Vitest + React Testing Library (DONE in Phase 1)
- **mentu-ai**: Vitest (existing, add workflow tests)
- **mentu-beacon**: Cargo test (Rust) + Vitest (TypeScript)
- **Integration**: Vitest with cross-repo imports

---

## Specification

### Workflow Testing (Phase 2)

**Scope**: Test V4.1 DAG-based orchestrator

#### Test Categories

| Category | Purpose | Test Count |
|----------|---------|------------|
| **Parser Tests** | YAML → internal model conversion | 5-8 tests |
| **DAG Validation** | Cycle detection, dependency validation | 8-10 tests |
| **Bug Investigation Workflow** | Dual Triad execution | 6-8 tests |
| **Gate Mechanisms** | Approval, validation gates | 10-12 tests |

#### Key Test Scenarios

1. **Workflow Definition Parsing**:
   - Parse valid YAML workflow definition
   - Reject invalid definitions (missing fields, invalid types)
   - Handle workflow versioning
   - Validate step dependencies

2. **DAG Validation**:
   - Detect cycles in workflow graph
   - Validate all steps have valid next transitions
   - Ensure initial_step exists
   - Validate parameter types and requirements

3. **Bug Investigation Workflow**:
   - Detection → Investigation transition
   - Investigation produces commitment
   - Approval gate blocks execution
   - Fix → Validation → Deployment chain
   - Timeout and escalation paths

4. **Gate Mechanisms**:
   - Approval gate: waiting → approved/rejected
   - Validation gate: success/failure branching
   - Timeout gates: escalation on timeout
   - Gate resumption after approval

### Beacon Testing (Phase 3)

**Scope**: Test Rust/Tauri execution bridge

#### Test Categories

| Category | Purpose | Test Count |
|----------|---------|------------|
| **WebSocket Connection** | Connection lifecycle, reconnection | 4-6 tests |
| **Command Execution** | Claim, execute, report flow | 6-8 tests |
| **Evidence Capture** | Screenshot, logs, annotations | 5-7 tests |

#### Key Test Scenarios

1. **WebSocket Connection**:
   - Connect to Supabase Realtime
   - Subscribe to bridge_commands channel
   - Handle connection drops and reconnection
   - Process incoming command messages

2. **Command Execution**:
   - Claim command from queue
   - Execute Claude agent on isolated worktree
   - Capture stdout/stderr
   - Report completion status
   - Handle execution failures

3. **Evidence Capture**:
   - Capture command output as evidence
   - Link evidence to commitment via annotations
   - Store screenshots in proper directory
   - Clean up temporary files

### Integration Testing (Phase 4)

**Scope**: Test cross-system workflows

#### Test Categories

| Category | Purpose | Test Count |
|----------|---------|------------|
| **Bug Report → Workflow** | Memory trigger creates workflow instance | 2-3 tests |
| **Workflow → Beacon** | Workflow step creates bridge command | 3-4 tests |
| **Approval Gate → Resume** | UI approval resumes workflow | 2-3 tests |
| **End-to-End Bug Fix** | Full investigation → fix → deploy | 1-2 tests |

#### Key Test Scenarios

1. **Bug Report → Workflow Trigger**:
   - Bug memory captured
   - Workflow instance created with correct parameters
   - Initial step activated
   - Step state initialized

2. **Workflow → Beacon Execution**:
   - Workflow step generates bridge command
   - Command queued in bridge_commands table
   - Beacon claims command
   - Execution results update workflow state

3. **Approval Gate → Resume**:
   - Workflow pauses at approval gate
   - UI displays approval request
   - User approves via mentu-web
   - Workflow resumes with next step

4. **End-to-End Bug Fix Flow**:
   - Bug reported with screenshot
   - Investigation workflow triggered
   - Beacon executes investigation
   - Approval gate waits for review
   - User approves fix
   - Beacon executes fix
   - Validation runs tests
   - Deployment step completes

---

## Implementation

### Deliverables

#### Phase 1: Foundation (COMPLETED)

| File | Purpose |
|------|---------|
| `mentu-web/vitest.config.ts` | Vitest configuration |
| `mentu-web/src/test/setup.ts` | Test setup with jest-dom |
| `mentu-web/src/components/bug-report/__tests__/screenshot-viewer.test.tsx` | Example component test |
| `mentu-web/src/hooks/__tests__/useBugReports.test.ts` | Example hook test |
| `test-fixtures/README.md` | Fixture documentation |
| `test-fixtures/bug-reports/*.json` | Sample bug report data |
| `test-fixtures/workflows/*.json` | Sample workflow definitions |
| `test-fixtures/workflow-instances/*.json` | Sample workflow states |

#### Phase 2: Workflow Testing

| File | Purpose |
|------|---------|
| `mentu-ai/test/workflows/workflow-parser.test.ts` | YAML parsing tests |
| `mentu-ai/test/workflows/dag-validator.test.ts` | Graph validation tests |
| `mentu-ai/test/workflows/bug-investigation-workflow.test.ts` | Dual Triad tests |
| `mentu-ai/test/workflows/gate-mechanisms.test.ts` | Gate approval/rejection tests |

#### Phase 3: Beacon Testing

| File | Purpose |
|------|---------|
| `mentu-beacon/src-tauri/Cargo.toml` | Add test dependencies |
| `mentu-beacon/src-tauri/src/tests/mod.rs` | Test module setup |
| `mentu-beacon/src-tauri/src/tests/websocket.rs` | WebSocket connection tests |
| `mentu-beacon/src-tauri/src/tests/command_execution.rs` | Command execution tests |
| `mentu-beacon/src-tauri/src/tests/evidence_capture.rs` | Evidence capture tests |

#### Phase 4: Integration Testing

| File | Purpose |
|------|---------|
| `test/integration/bug-report-to-workflow.test.ts` | Bug → workflow trigger test |
| `test/integration/workflow-to-beacon.test.ts` | Workflow → beacon test |
| `test/integration/approval-gate-resume.test.ts` | Approval → resume test |
| `test/integration/end-to-end-bug-fix.test.ts` | Full bug fix cycle test |

### Build Order

1. **Phase 2: Workflow Testing (Days 3-4)**
   - Set up test structure in mentu-ai/test/workflows/
   - Write workflow parser tests
   - Write DAG validator tests
   - Write bug investigation workflow tests
   - Write gate mechanism tests

2. **Phase 3: Beacon Testing (Days 5-6)**
   - Add Rust test dependencies to Cargo.toml
   - Create test module structure
   - Write WebSocket connection tests
   - Write command execution tests
   - Write evidence capture tests

3. **Phase 4: Integration Testing (Days 7-9)**
   - Set up integration test directory
   - Write bug report → workflow trigger test
   - Write workflow → beacon execution test
   - Write approval gate → resume test
   - Write end-to-end bug fix flow test

### Integration Points

| System | Integration | Notes |
|--------|-------------|-------|
| **mentu-web** | Frontend tests use hooks that read from Supabase | Mock Supabase responses |
| **mentu-ai** | Workflow engine tests use in-memory executor | No database required |
| **mentu-beacon** | Beacon tests mock WebSocket and Claude agent | Use test fixtures |
| **Supabase** | Integration tests use local Supabase or mocks | Document test database setup |

---

## Constraints

- **No Production Data**: Tests must use fixtures only
- **Isolation**: Tests must not depend on external state
- **Speed**: Unit tests <100ms, integration tests <5s, E2E tests <30s
- **Cleanup**: Tests must clean up resources (temp files, processes)
- **Determinism**: Tests must be reproducible and not flaky
- **Backwards Compatibility**: Tests must not break existing functionality

---

## Success Criteria

### Functional

- [ ] Workflow parser correctly converts YAML to internal model
- [ ] DAG validator detects cycles and invalid dependencies
- [ ] Bug investigation workflow executes all steps correctly
- [ ] Approval gates block and resume execution properly
- [ ] Beacon claims commands and executes agents
- [ ] Evidence is captured and linked to commitments
- [ ] Full bug fix flow completes end-to-end

### Quality

- [ ] All test files compile without errors
- [ ] Test coverage >70% for workflow orchestration
- [ ] Test coverage >60% for beacon execution
- [ ] All tests pass in CI/CD
- [ ] Tests run in <5 minutes total
- [ ] No flaky tests (100% reproducible)

### Integration

- [ ] Tests work with existing mentu-ai test infrastructure
- [ ] Fixtures are reusable across repos
- [ ] Integration tests verify cross-system contracts
- [ ] Test database setup documented

---

## Verification Commands

```bash
# Verify Phase 2: Workflow Testing
cd mentu-ai
npm test -- test/workflows/

# Verify Phase 3: Beacon Testing
cd mentu-beacon/src-tauri
cargo test

# Verify Phase 4: Integration Testing
npm test -- test/integration/

# Verify all tests
npm test

# Verify coverage
npm run test:coverage
```

---

## References

- `/Users/rashid/.claude/plans/structured-sauteeing-robin.md`: Testing plan with detailed phases
- `mentu-ai/test/`: Existing Vitest test patterns
- `mentu-bridge/test/`: Fixture-based test examples
- `test-fixtures/README.md`: Test fixture documentation

---

*This PRD establishes comprehensive test coverage to ensure reliable automated bug investigation and deployment across the Mentu ecosystem.*
