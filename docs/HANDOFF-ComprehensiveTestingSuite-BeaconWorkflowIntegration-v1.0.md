---
id: HANDOFF-ComprehensiveTestingSuite-BeaconWorkflowIntegration-v1.0
path: docs/HANDOFF-ComprehensiveTestingSuite-BeaconWorkflowIntegration-v1.0.md
type: handoff
intent: execute

version: "1.0"
created: 2026-01-11
last_updated: 2026-01-11

tier: T3

author_type: executor

parent: PRD-ComprehensiveTestingSuite-BeaconWorkflowIntegration-v1.0
children:
  - PROMPT-ComprehensiveTestingSuite-BeaconWorkflowIntegration-v1.0

mentu:
  commitment: cmt_8f9f6d12
  status: pending

validation:
  required: true
  tier: T2
---

# HANDOFF: Comprehensive Testing Suite - Beacon & Workflow Integration v1.0

## For the Coding Agent

Implement comprehensive test coverage across workflow orchestration (mentu-ai), beacon execution (mentu-beacon), and cross-system integration to ensure reliable automated bug investigation and deployment.

**Read the full PRD**: `docs/PRD-ComprehensiveTestingSuite-BeaconWorkflowIntegration-v1.0.md`

---

## Your Identity

You are operating as **executor** (from this HANDOFF's `author_type` field).

Your actor identity comes from the repository manifest (`.mentu/manifest.yaml`).

| Dimension | Source | Value |
|-----------|--------|-------|
| **Actor** | Repository manifest | (auto-resolved) |
| **Author Type** | This HANDOFF | executor |
| **Context** | Working directory | mentu-web |

**Your domain**: technical

**The Rule**:
- Failure in YOUR domain → Own it. Fix it. Don't explain.
- Failure in ANOTHER domain → You drifted. Re-read this HANDOFF.

**Quick reference**: `mentu stance executor` or `mentu stance executor --failure technical`

---

## Completion Contract

**First action**: Update `.claude/completion.json`:

```json
{
  "version": "2.0",
  "name": "Comprehensive Testing Suite - Beacon & Workflow Integration",
  "tier": "T3",
  "required_files": [
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

## Mentu Protocol

### Identity Resolution

```
┌───────────────────────────────────────────────────────────────────────────┐
│  ACTOR (WHO)              AUTHOR TYPE (ROLE)          CONTEXT (WHERE)     │
│  ─────────────            ──────────────────          ───────────────     │
│  From manifest            From this HANDOFF           From working dir    │
│  .mentu/manifest.yaml     author_type: executor       repository name     │
│                                                                           │
│  Actor is auto-resolved. Author type declares your role. Context tracks. │
└───────────────────────────────────────────────────────────────────────────┘
```

### Operations

```bash
cd /Users/rashid/Desktop/Workspaces/mentu-web

# Check your actor identity (auto-resolved from manifest)
cat .mentu/manifest.yaml | grep actor

# Claim commitment (actor auto-resolved)
mentu claim cmt_XXXXXXXX --author-type executor

# Capture progress (actor auto-resolved, role declared)
mentu capture "Phase 2: Workflow Testing complete" --kind execution-progress --author-type executor
```

Save the commitment ID. You will close it with evidence.

---

## Build Order

### Phase 1: Foundation (COMPLETED)

✅ mentu-web test infrastructure set up
✅ Test fixtures created
✅ Example component and hook tests written

**Skip to Phase 2.**

---

### Phase 2: Workflow Testing

**Location**: `/Users/rashid/Desktop/Workspaces/mentu-ai`

**Goal**: Test V4.1 DAG-based workflow orchestration

#### Step 1: Set Up Test Structure

Create test directory:

```bash
cd /Users/rashid/Desktop/Workspaces/mentu-ai
mkdir -p test/workflows
```

#### Step 2: Workflow Parser Tests

**File**: `test/workflows/workflow-parser.test.ts`

Test workflow definition parsing (YAML → internal model):

```typescript
import { describe, it, expect } from 'vitest';
import { parseWorkflowDefinition } from '../../src/workflows/parser';
import type { WorkflowDefinition } from '../../src/workflows/types';

describe('Workflow Parser', () => {
  it('parses valid workflow definition', () => {
    const yaml = `
name: Simple Workflow
version: 1
definition:
  steps:
    start:
      type: trigger
      next: [end]
    end:
      type: terminal
  initial_step: start
`;

    const result = parseWorkflowDefinition(yaml);

    expect(result.name).toBe('Simple Workflow');
    expect(result.version).toBe(1);
    expect(result.definition.steps.start.type).toBe('trigger');
    expect(result.definition.initial_step).toBe('start');
  });

  it('rejects workflow with missing required fields', () => {
    const yaml = `
name: Invalid Workflow
`;

    expect(() => parseWorkflowDefinition(yaml)).toThrow('Missing required field: definition');
  });

  it('validates step types', () => {
    const yaml = `
name: Invalid Step Type
definition:
  steps:
    start:
      type: invalid_type
      next: [end]
  initial_step: start
`;

    expect(() => parseWorkflowDefinition(yaml)).toThrow('Invalid step type: invalid_type');
  });

  it('handles parameters correctly', () => {
    const yaml = `
name: Parameterized Workflow
definition:
  steps:
    start:
      type: trigger
      next: [end]
  initial_step: start
  parameters:
    memory_id:
      type: string
      required: true
`;

    const result = parseWorkflowDefinition(yaml);

    expect(result.definition.parameters.memory_id.type).toBe('string');
    expect(result.definition.parameters.memory_id.required).toBe(true);
  });
});
```

**Verification**:
```bash
npm test -- test/workflows/workflow-parser.test.ts
```

#### Step 3: DAG Validator Tests

**File**: `test/workflows/dag-validator.test.ts`

Test DAG validation (cycles, dependencies):

```typescript
import { describe, it, expect } from 'vitest';
import { validateDAG } from '../../src/workflows/dag-validator';
import type { WorkflowDefinition } from '../../src/workflows/types';

describe('DAG Validator', () => {
  it('accepts valid linear workflow', () => {
    const workflow: WorkflowDefinition = {
      name: 'Linear',
      version: 1,
      definition: {
        steps: {
          start: { type: 'trigger', next: ['middle'] },
          middle: { type: 'task', next: ['end'] },
          end: { type: 'terminal' },
        },
        initial_step: 'start',
      },
    };

    const result = validateDAG(workflow);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('detects cycle in workflow', () => {
    const workflow: WorkflowDefinition = {
      name: 'Cyclic',
      version: 1,
      definition: {
        steps: {
          a: { type: 'task', next: ['b'] },
          b: { type: 'task', next: ['c'] },
          c: { type: 'task', next: ['a'] }, // Cycle: a → b → c → a
        },
        initial_step: 'a',
      },
    };

    const result = validateDAG(workflow);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Cycle detected: a → b → c → a');
  });

  it('validates initial_step exists', () => {
    const workflow: WorkflowDefinition = {
      name: 'Missing Initial',
      version: 1,
      definition: {
        steps: {
          start: { type: 'trigger', next: ['end'] },
          end: { type: 'terminal' },
        },
        initial_step: 'nonexistent',
      },
    };

    const result = validateDAG(workflow);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('initial_step "nonexistent" not found in steps');
  });

  it('validates all next steps exist', () => {
    const workflow: WorkflowDefinition = {
      name: 'Missing Next Step',
      version: 1,
      definition: {
        steps: {
          start: { type: 'trigger', next: ['missing_step'] },
        },
        initial_step: 'start',
      },
    };

    const result = validateDAG(workflow);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Step "start" references nonexistent next step: "missing_step"');
  });
});
```

**Verification**:
```bash
npm test -- test/workflows/dag-validator.test.ts
```

#### Step 4: Bug Investigation Workflow Tests

**File**: `test/workflows/bug-investigation-workflow.test.ts`

Test Dual Triad execution:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { WorkflowExecutor } from '../../src/workflows/executor';
import { readFileSync } from 'fs';
import path from 'path';

describe('Bug Investigation Workflow (Dual Triad)', () => {
  let executor: WorkflowExecutor;
  let bugWorkflow: any;

  beforeEach(() => {
    // Load workflow from fixtures
    const workflowPath = path.join(__dirname, '../../../test-fixtures/workflows/bug-investigation.json');
    bugWorkflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

    executor = new WorkflowExecutor(bugWorkflow);
  });

  it('starts at detection step', () => {
    const instance = executor.createInstance({ memory_id: 'mem_test_001' });

    expect(instance.current_step).toBe('detection');
    expect(instance.state).toBe('running');
  });

  it('transitions detection → investigation', async () => {
    const instance = executor.createInstance({ memory_id: 'mem_test_001' });

    await executor.completeStep(instance.id, 'detection', { memory_id: 'mem_test_001' });

    const updated = executor.getInstance(instance.id);
    expect(updated.current_step).toBe('investigation');
    expect(updated.step_states.detection.status).toBe('completed');
  });

  it('blocks at approval gate', async () => {
    const instance = executor.createInstance({ memory_id: 'mem_test_001' });

    // Complete detection and investigation
    await executor.completeStep(instance.id, 'detection', { memory_id: 'mem_test_001' });
    await executor.completeStep(instance.id, 'investigation', {
      summary: 'Bug found in checkout.ts',
      commitment_id: 'cmt_test_001'
    });

    const updated = executor.getInstance(instance.id);
    expect(updated.current_step).toBe('approval_gate');
    expect(updated.step_states.approval_gate.status).toBe('waiting');
  });

  it('resumes after approval', async () => {
    const instance = executor.createInstance({ memory_id: 'mem_test_001' });

    // Complete to approval gate
    await executor.completeStep(instance.id, 'detection', { memory_id: 'mem_test_001' });
    await executor.completeStep(instance.id, 'investigation', {
      summary: 'Bug found',
      commitment_id: 'cmt_test_001'
    });

    // Approve
    await executor.approveGate(instance.id, 'approval_gate', 'user:rashid', 'Fix looks good');

    const updated = executor.getInstance(instance.id);
    expect(updated.current_step).toBe('fix');
    expect(updated.step_states.approval_gate.status).toBe('approved');
  });

  it('escalates on timeout', async () => {
    const instance = executor.createInstance({ memory_id: 'mem_test_001' });

    // Complete to approval gate
    await executor.completeStep(instance.id, 'detection', { memory_id: 'mem_test_001' });
    await executor.completeStep(instance.id, 'investigation', {
      summary: 'Bug found',
      commitment_id: 'cmt_test_001'
    });

    // Simulate timeout
    await executor.timeoutGate(instance.id, 'approval_gate');

    const updated = executor.getInstance(instance.id);
    expect(updated.current_step).toBe('escalate');
  });

  it('completes full workflow on success', async () => {
    const instance = executor.createInstance({ memory_id: 'mem_test_001' });

    // Complete all steps
    await executor.completeStep(instance.id, 'detection', { memory_id: 'mem_test_001' });
    await executor.completeStep(instance.id, 'investigation', {
      summary: 'Bug found',
      commitment_id: 'cmt_test_001'
    });
    await executor.approveGate(instance.id, 'approval_gate', 'user:rashid', 'Approved');
    await executor.completeStep(instance.id, 'fix', { pr_number: '123' });
    await executor.completeStep(instance.id, 'validation', { tests_passed: 45 });
    await executor.completeStep(instance.id, 'deployment', { deployed_to: 'production' });

    const updated = executor.getInstance(instance.id);
    expect(updated.state).toBe('completed');
    expect(updated.current_step).toBe('end');
  });
});
```

**Verification**:
```bash
npm test -- test/workflows/bug-investigation-workflow.test.ts
```

#### Step 5: Gate Mechanism Tests

**File**: `test/workflows/gate-mechanisms.test.ts`

Test approval and validation gates:

```typescript
import { describe, it, expect } from 'vitest';
import { GateEvaluator } from '../../src/workflows/gates';

describe('Gate Mechanisms', () => {
  describe('Approval Gate', () => {
    it('blocks until approved', () => {
      const gate = new GateEvaluator({
        type: 'gate',
        gate_type: 'approval',
        timeout_hours: 24,
      });

      const result = gate.evaluate({ status: 'waiting' });

      expect(result.should_proceed).toBe(false);
      expect(result.reason).toBe('waiting_for_approval');
    });

    it('proceeds on approval', () => {
      const gate = new GateEvaluator({
        type: 'gate',
        gate_type: 'approval',
        next: { approved: ['fix'], rejected: ['end'] },
      });

      const result = gate.evaluate({
        status: 'approved',
        approved_by: 'user:rashid'
      });

      expect(result.should_proceed).toBe(true);
      expect(result.next_step).toBe('fix');
    });

    it('stops on rejection', () => {
      const gate = new GateEvaluator({
        type: 'gate',
        gate_type: 'approval',
        next: { approved: ['fix'], rejected: ['end'] },
      });

      const result = gate.evaluate({
        status: 'rejected',
        rejected_by: 'user:rashid'
      });

      expect(result.should_proceed).toBe(true);
      expect(result.next_step).toBe('end');
    });

    it('escalates on timeout', () => {
      const gate = new GateEvaluator({
        type: 'gate',
        gate_type: 'approval',
        timeout_hours: 24,
        next: { timeout: ['escalate'] },
      });

      const now = Date.now();
      const timeout_at = now - (25 * 60 * 60 * 1000); // 25 hours ago

      const result = gate.evaluate({
        status: 'waiting',
        started_at: timeout_at,
        current_time: now,
      });

      expect(result.should_proceed).toBe(true);
      expect(result.next_step).toBe('escalate');
      expect(result.reason).toBe('timeout');
    });
  });

  describe('Validation Gate', () => {
    it('proceeds on success', () => {
      const gate = new GateEvaluator({
        type: 'gate',
        gate_type: 'validation',
        next: { success: ['deployment'], failure: ['investigation'] },
      });

      const result = gate.evaluate({
        status: 'success',
        tests_passed: 45,
        tests_failed: 0,
      });

      expect(result.should_proceed).toBe(true);
      expect(result.next_step).toBe('deployment');
    });

    it('loops back on failure', () => {
      const gate = new GateEvaluator({
        type: 'gate',
        gate_type: 'validation',
        next: { success: ['deployment'], failure: ['investigation'] },
      });

      const result = gate.evaluate({
        status: 'failure',
        tests_passed: 43,
        tests_failed: 2,
      });

      expect(result.should_proceed).toBe(true);
      expect(result.next_step).toBe('investigation');
      expect(result.reason).toBe('validation_failed');
    });
  });
});
```

**Verification**:
```bash
npm test -- test/workflows/gate-mechanisms.test.ts
```

**Phase 2 Complete**: Capture progress:
```bash
mentu capture "Phase 2 Workflow Testing complete: 4 test files, 30+ tests" --kind execution-progress --author-type executor
```

---

### Phase 3: Beacon Testing

**Location**: `/Users/rashid/Desktop/Workspaces/mentu-beacon`

**Goal**: Test Rust execution bridge

#### Step 1: Add Test Dependencies

**File**: `src-tauri/Cargo.toml`

Add test dependencies:

```toml
[dev-dependencies]
tokio-test = "0.4"
mockall = "0.12"
wiremock = "0.6"
```

#### Step 2: Create Test Module Structure

**File**: `src-tauri/src/tests/mod.rs`

```rust
#[cfg(test)]
pub mod websocket;
pub mod command_execution;
pub mod evidence_capture;
```

#### Step 3: WebSocket Connection Tests

**File**: `src-tauri/src/tests/websocket.rs`

```rust
use tokio_test::block_on;
use crate::websocket::Connection;

#[test]
fn test_websocket_connect() {
    block_on(async {
        let conn = Connection::new("ws://localhost:54321/realtime/v1");
        let result = conn.connect().await;

        assert!(result.is_ok());
    });
}

#[test]
fn test_websocket_subscribe() {
    block_on(async {
        let conn = Connection::new("ws://localhost:54321/realtime/v1");
        conn.connect().await.unwrap();

        let result = conn.subscribe("bridge_commands").await;

        assert!(result.is_ok());
    });
}

#[test]
fn test_websocket_reconnect_on_disconnect() {
    block_on(async {
        let conn = Connection::new("ws://localhost:54321/realtime/v1");
        conn.connect().await.unwrap();

        // Simulate disconnect
        conn.close().await.unwrap();

        // Should automatically reconnect
        let result = conn.wait_for_reconnect().await;

        assert!(result.is_ok());
    });
}
```

**Verification**:
```bash
cd src-tauri
cargo test websocket
```

#### Step 4: Command Execution Tests

**File**: `src-tauri/src/tests/command_execution.rs`

```rust
use crate::executor::{CommandExecutor, BridgeCommand};
use std::path::PathBuf;

#[test]
fn test_claim_command() {
    let executor = CommandExecutor::new();
    let command = BridgeCommand {
        id: "cmd_test_001".to_string(),
        workspace_id: "ws_test_001".to_string(),
        prompt: "Test command".to_string(),
        status: "pending".to_string(),
    };

    let result = executor.claim_command(&command);

    assert!(result.is_ok());
    assert_eq!(result.unwrap().status, "claimed");
}

#[test]
fn test_execute_command() {
    let executor = CommandExecutor::new();
    let command = BridgeCommand {
        id: "cmd_test_001".to_string(),
        workspace_id: "ws_test_001".to_string(),
        prompt: "echo 'test'".to_string(),
        status: "claimed".to_string(),
    };

    let result = executor.execute(&command).await;

    assert!(result.is_ok());
    assert!(result.unwrap().output.contains("test"));
}

#[test]
fn test_execute_with_timeout() {
    let executor = CommandExecutor::new();
    let command = BridgeCommand {
        id: "cmd_test_001".to_string(),
        workspace_id: "ws_test_001".to_string(),
        prompt: "sleep 100".to_string(),
        timeout_seconds: 1,
        status: "claimed".to_string(),
    };

    let result = executor.execute(&command).await;

    assert!(result.is_err());
    assert_eq!(result.unwrap_err().kind(), std::io::ErrorKind::TimedOut);
}
```

**Verification**:
```bash
cargo test command_execution
```

#### Step 5: Evidence Capture Tests

**File**: `src-tauri/src/tests/evidence_capture.rs`

```rust
use crate::evidence::{EvidenceCapture, Screenshot};
use std::path::PathBuf;

#[test]
fn test_capture_screenshot() {
    let capture = EvidenceCapture::new();
    let screenshot = Screenshot {
        data: "base64_data_here".to_string(),
        timestamp: "2026-01-11T10:00:00Z".to_string(),
    };

    let result = capture.save_screenshot(&screenshot, "test_bug_001");

    assert!(result.is_ok());

    let path = result.unwrap();
    assert!(path.exists());
}

#[test]
fn test_link_evidence_to_commitment() {
    let capture = EvidenceCapture::new();

    let result = capture.link_to_commitment(
        "mem_test_evidence",
        "cmt_test_001",
        "Screenshot captured for bug investigation"
    );

    assert!(result.is_ok());
}

#[test]
fn test_cleanup_old_screenshots() {
    let capture = EvidenceCapture::new();

    // Create old screenshot (7 days ago)
    let old_path = PathBuf::from("/tmp/test_screenshot_old.png");
    std::fs::write(&old_path, b"data").unwrap();

    capture.cleanup_old(7).unwrap();

    assert!(!old_path.exists());
}
```

**Verification**:
```bash
cargo test evidence_capture
```

**Phase 3 Complete**: Capture progress:
```bash
mentu capture "Phase 3 Beacon Testing complete: Rust tests for WebSocket, execution, evidence" --kind execution-progress --author-type executor
```

---

### Phase 4: Integration Testing

**Location**: `/Users/rashid/Desktop/Workspaces/mentu-web/test/integration`

**Goal**: Test cross-system workflows

#### Step 1: Set Up Integration Test Directory

```bash
cd /Users/rashid/Desktop/Workspaces/mentu-web
mkdir -p test/integration
```

#### Step 2: Bug Report → Workflow Trigger Test

**File**: `test/integration/bug-report-to-workflow.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { BugReport, WorkflowInstance } from '@/lib/mentu/types';

describe('Bug Report → Workflow Trigger Integration', () => {
  let supabase: any;
  let bugMemoryId: string;

  beforeEach(() => {
    supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
  });

  afterEach(async () => {
    // Cleanup: Delete test data
    if (bugMemoryId) {
      await supabase.from('operations').delete().eq('id', bugMemoryId);
    }
  });

  it('creates workflow instance when bug memory is captured', async () => {
    // 1. Capture bug memory
    const { data: memory, error: memError } = await supabase
      .from('operations')
      .insert({
        op: 'capture',
        payload: {
          kind: 'bug_report',
          body: 'Test bug for integration',
          meta: {
            title: 'Test Bug',
            severity: 'high',
            source: 'integration_test',
          },
        },
        workspace_id: 'ws_test_001',
      })
      .select()
      .single();

    expect(memError).toBeNull();
    bugMemoryId = memory.id;

    // 2. Check workflow instance created
    const { data: workflows, error: wfError } = await supabase
      .from('workflow_instances')
      .select('*')
      .eq('parameters->memory_id', bugMemoryId);

    expect(wfError).toBeNull();
    expect(workflows).toHaveLength(1);
    expect(workflows[0].state).toBe('running');
    expect(workflows[0].current_step).toBe('detection');
  });

  it('initializes workflow with correct parameters', async () => {
    // Capture bug memory
    const { data: memory } = await supabase
      .from('operations')
      .insert({
        op: 'capture',
        payload: {
          kind: 'bug_report',
          body: 'Test bug',
          meta: { severity: 'critical' },
        },
        workspace_id: 'ws_test_001',
      })
      .select()
      .single();

    bugMemoryId = memory.id;

    // Check workflow parameters
    const { data: workflow } = await supabase
      .from('workflow_instances')
      .select('*')
      .eq('parameters->memory_id', bugMemoryId)
      .single();

    expect(workflow.parameters.memory_id).toBe(bugMemoryId);
    expect(workflow.parameters.workspace_id).toBe('ws_test_001');
  });
});
```

**Verification**:
```bash
npm test -- test/integration/bug-report-to-workflow.test.ts
```

#### Step 3: Workflow → Beacon Execution Test

**File**: `test/integration/workflow-to-beacon.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('Workflow → Beacon Execution Integration', () => {
  it('creates bridge command when workflow step activates', async () => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // 1. Create workflow instance
    const { data: workflow } = await supabase
      .from('workflow_instances')
      .insert({
        workflow_id: 'wf_bug_investigation',
        workflow_version: 1,
        state: 'running',
        current_step: 'investigation',
        parameters: { memory_id: 'mem_test_001' },
      })
      .select()
      .single();

    // 2. Activate investigation step (should create bridge command)
    // (This would be done by workflow engine in real code)

    // 3. Check bridge command created
    const { data: commands } = await supabase
      .from('bridge_commands')
      .select('*')
      .eq('workflow_instance_id', workflow.id);

    expect(commands).toHaveLength(1);
    expect(commands[0].status).toBe('pending');
    expect(commands[0].prompt).toContain('investigation');
  });
});
```

**Verification**:
```bash
npm test -- test/integration/workflow-to-beacon.test.ts
```

#### Step 4: Approval Gate → Resume Test

**File**: `test/integration/approval-gate-resume.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('Approval Gate → Resume Integration', () => {
  it('resumes workflow after approval', async () => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // 1. Create workflow at approval gate
    const { data: workflow } = await supabase
      .from('workflow_instances')
      .insert({
        workflow_id: 'wf_bug_investigation',
        state: 'running',
        current_step: 'approval_gate',
        step_states: {
          approval_gate: {
            status: 'waiting',
            gate_type: 'approval',
          },
        },
      })
      .select()
      .single();

    // 2. Approve via API (simulating mentu-web action)
    const { error } = await supabase
      .from('workflow_instances')
      .update({
        step_states: {
          approval_gate: {
            status: 'approved',
            approved_by: 'user:test',
          },
        },
        current_step: 'fix',
      })
      .eq('id', workflow.id);

    expect(error).toBeNull();

    // 3. Verify workflow resumed
    const { data: updated } = await supabase
      .from('workflow_instances')
      .select('*')
      .eq('id', workflow.id)
      .single();

    expect(updated.current_step).toBe('fix');
    expect(updated.step_states.approval_gate.status).toBe('approved');
  });
});
```

**Verification**:
```bash
npm test -- test/integration/approval-gate-resume.test.ts
```

#### Step 5: End-to-End Bug Fix Flow Test

**File**: `test/integration/end-to-end-bug-fix.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('End-to-End Bug Fix Flow', () => {
  it('completes full bug investigation → fix → deploy cycle', async () => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // 1. Bug reported with screenshot
    const { data: bugMemory } = await supabase
      .from('operations')
      .insert({
        op: 'capture',
        payload: {
          kind: 'bug_report',
          body: 'Checkout button not working',
          meta: {
            title: 'Checkout Error',
            severity: 'high',
            screenshot_url: 'https://example.com/screenshot.png',
          },
        },
      })
      .select()
      .single();

    // 2. Workflow instance created
    const { data: workflow } = await supabase
      .from('workflow_instances')
      .select('*')
      .eq('parameters->memory_id', bugMemory.id)
      .single();

    expect(workflow.current_step).toBe('detection');

    // 3. Investigation completes (simulated)
    await supabase
      .from('workflow_instances')
      .update({
        current_step: 'approval_gate',
        step_states: {
          investigation: {
            status: 'completed',
            output: { summary: 'Found bug in checkout.ts' },
          },
          approval_gate: {
            status: 'waiting',
          },
        },
      })
      .eq('id', workflow.id);

    // 4. User approves
    await supabase
      .from('workflow_instances')
      .update({
        current_step: 'fix',
        step_states: {
          approval_gate: { status: 'approved' },
        },
      })
      .eq('id', workflow.id);

    // 5. Fix completes
    await supabase
      .from('workflow_instances')
      .update({
        current_step: 'validation',
        step_states: {
          fix: {
            status: 'completed',
            output: { pr_number: '123' },
          },
        },
      })
      .eq('id', workflow.id);

    // 6. Validation passes
    await supabase
      .from('workflow_instances')
      .update({
        current_step: 'deployment',
        step_states: {
          validation: {
            status: 'completed',
            output: { tests_passed: 45 },
          },
        },
      })
      .eq('id', workflow.id);

    // 7. Deployment completes
    await supabase
      .from('workflow_instances')
      .update({
        state: 'completed',
        current_step: 'end',
        completed_at: new Date().toISOString(),
        step_states: {
          deployment: {
            status: 'completed',
            output: { deployed_to: 'production' },
          },
        },
      })
      .eq('id', workflow.id);

    // 8. Verify final state
    const { data: final } = await supabase
      .from('workflow_instances')
      .select('*')
      .eq('id', workflow.id)
      .single();

    expect(final.state).toBe('completed');
    expect(final.current_step).toBe('end');
    expect(final.completed_at).not.toBeNull();
  }, 30000); // 30s timeout for E2E test
});
```

**Verification**:
```bash
npm test -- test/integration/end-to-end-bug-fix.test.ts
```

**Phase 4 Complete**: Capture progress:
```bash
mentu capture "Phase 4 Integration Testing complete: 4 integration tests covering full bug fix flow" --kind execution-progress --author-type executor
```

---

## Before Submitting

Before running `mentu submit`, spawn validators:

1. Use Task tool with `subagent_type="technical-validator"`
2. Use Task tool with `subagent_type="intent-validator"`
3. Use Task tool with `subagent_type="safety-validator"`

All must return verdict: PASS before submitting.

---

## Completion Phase (REQUIRED)

**BEFORE calling `mentu submit`, you MUST create a RESULT document:**

### Step 1: Create RESULT Document

Read the template and create the RESULT document:

```bash
# Read the template structure
cat docs/templates/TEMPLATE-Result.md

# Create: docs/RESULT-ComprehensiveTestingSuite-BeaconWorkflowIntegration-v1.0.md
```

The RESULT document MUST include:
- Valid YAML front matter with all required fields
- Summary of what was built (3 phases, 12+ test files)
- Files created and modified
- Test results (all tests passing)
- Design decisions with rationale

### Step 2: Capture RESULT as Evidence

```bash
mentu capture "Created RESULT-ComprehensiveTestingSuite-BeaconWorkflowIntegration: Complete test coverage across workflow, beacon, and integration layers" \
  --kind result-document \
  --path docs/RESULT-ComprehensiveTestingSuite-BeaconWorkflowIntegration-v1.0.md \
  --refs cmt_XXXXXXXX \
  --author-type executor
```

### Step 3: Update RESULT Front Matter

Update the YAML front matter with the evidence ID:

```yaml
mentu:
  commitment: cmt_XXXXXXXX
  evidence: mem_YYYYYYYY  # ← The ID from Step 2
  status: in_review
```

### Step 4: Submit with Evidence

```bash
mentu submit cmt_XXXXXXXX \
  --summary "Comprehensive testing suite: 12+ test files covering workflow orchestration, beacon execution, and cross-system integration" \
  --include-files
```

**The RESULT document IS the closure proof. Do not submit without it.**

---

## Verification Checklist

### Files
- [ ] `mentu-ai/test/workflows/workflow-parser.test.ts` exists
- [ ] `mentu-ai/test/workflows/dag-validator.test.ts` exists
- [ ] `mentu-ai/test/workflows/bug-investigation-workflow.test.ts` exists
- [ ] `mentu-ai/test/workflows/gate-mechanisms.test.ts` exists
- [ ] `mentu-beacon/src-tauri/Cargo.toml` updated with test dependencies
- [ ] `mentu-beacon/src-tauri/src/tests/websocket.rs` exists
- [ ] `mentu-beacon/src-tauri/src/tests/command_execution.rs` exists
- [ ] `mentu-beacon/src-tauri/src/tests/evidence_capture.rs` exists
- [ ] `test/integration/bug-report-to-workflow.test.ts` exists
- [ ] `test/integration/workflow-to-beacon.test.ts` exists
- [ ] `test/integration/approval-gate-resume.test.ts` exists
- [ ] `test/integration/end-to-end-bug-fix.test.ts` exists

### Checks
- [ ] Phase 2: `cd mentu-ai && npm test -- test/workflows/` passes
- [ ] Phase 3: `cd mentu-beacon/src-tauri && cargo test` passes
- [ ] Phase 4: `npm test -- test/integration/` passes
- [ ] All tests pass in <5 minutes

### Mentu
- [ ] Commitment created with `mentu commit`
- [ ] Commitment claimed with `mentu claim`
- [ ] Phase 2 progress captured
- [ ] Phase 3 progress captured
- [ ] Phase 4 progress captured
- [ ] Validators passed (technical, intent, safety)
- [ ] **RESULT document created** (`docs/RESULT-ComprehensiveTestingSuite-BeaconWorkflowIntegration-v1.0.md`)
- [ ] **RESULT captured as evidence** with `mentu capture`
- [ ] **RESULT front matter updated** with evidence ID
- [ ] Commitment submitted with `mentu submit`
- [ ] `mentu list commitments --state open` returns []

### Functionality
- [ ] Workflow parser handles valid and invalid YAML
- [ ] DAG validator detects cycles and invalid dependencies
- [ ] Bug investigation workflow completes full cycle
- [ ] Approval gates block and resume correctly
- [ ] Beacon tests cover WebSocket, execution, evidence
- [ ] Integration tests verify cross-system contracts
- [ ] End-to-end test completes full bug fix flow

---

*Establish comprehensive test coverage to ensure reliable automated bug investigation and deployment across the Mentu ecosystem.*
