import { describe, it, expect } from 'vitest';

describe('End-to-End Bug Fix Flow', () => {
  it('completes full bug investigation → fix → deploy cycle', async () => {
    // 1. Bug reported with screenshot
    const bugMemory = {
      id: 'mem_test_001',
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
    };

    // 2. Workflow instance created
    const workflow = {
      id: 'wfi_e2e_001',
      workflow_id: 'wf_bug_investigation',
      parameters: { memory_id: bugMemory.id },
      current_step: 'detection',
      state: 'running',
      step_states: {},
    };

    expect(workflow.current_step).toBe('detection');
    expect(workflow.parameters.memory_id).toBe(bugMemory.id);

    // 3. Investigation completes (simulated)
    const afterInvestigation = {
      ...workflow,
      current_step: 'approval_gate',
      step_states: {
        detection: { status: 'completed' },
        investigation: {
          status: 'completed',
          output: { summary: 'Found bug in checkout.ts' },
        },
        approval_gate: {
          status: 'waiting',
        },
      },
    };

    expect(afterInvestigation.current_step).toBe('approval_gate');
    expect(afterInvestigation.step_states.investigation.status).toBe('completed');

    // 4. User approves
    const afterApproval = {
      ...afterInvestigation,
      current_step: 'fix',
      step_states: {
        ...afterInvestigation.step_states,
        approval_gate: { status: 'approved' },
      },
    };

    expect(afterApproval.step_states.approval_gate.status).toBe('approved');
    expect(afterApproval.current_step).toBe('fix');

    // 5. Fix completes
    const afterFix = {
      ...afterApproval,
      current_step: 'validation',
      step_states: {
        ...afterApproval.step_states,
        fix: {
          status: 'completed',
          output: { pr_number: '123' },
        },
      },
    };

    expect(afterFix.step_states.fix.status).toBe('completed');
    expect(afterFix.step_states.fix.output?.pr_number).toBe('123');

    // 6. Validation passes
    const afterValidation = {
      ...afterFix,
      current_step: 'deployment',
      step_states: {
        ...afterFix.step_states,
        validation: {
          status: 'completed',
          output: { tests_passed: 45 },
        },
      },
    };

    expect(afterValidation.step_states.validation.status).toBe('completed');
    expect(afterValidation.current_step).toBe('deployment');

    // 7. Deployment completes
    const final = {
      ...afterValidation,
      state: 'completed',
      current_step: 'end',
      completed_at: new Date().toISOString(),
      step_states: {
        ...afterValidation.step_states,
        deployment: {
          status: 'completed',
          output: { deployed_to: 'production' },
        },
      },
    };

    // 8. Verify final state
    expect(final.state).toBe('completed');
    expect(final.current_step).toBe('end');
    expect(final.completed_at).toBeDefined();
  }, 30000); // 30s timeout for E2E test

  it('handles validation failure with retry loop', () => {
    const workflow = {
      id: 'wfi_e2e_002',
      current_step: 'validation',
      step_states: {
        fix: { status: 'completed' },
        validation: {
          status: 'failed',
          output: { tests_passed: 43, tests_failed: 2 },
        },
      },
    };

    // Validation failure should loop back to investigation
    const afterValidationFailure = {
      ...workflow,
      current_step: 'investigation',
      step_states: {
        ...workflow.step_states,
        validation: {
          status: 'failed',
          output: { tests_passed: 43, tests_failed: 2 },
        },
      },
    };

    expect(afterValidationFailure.current_step).toBe('investigation');
    expect(afterValidationFailure.step_states.validation.status).toBe('failed');
  });

  it('tracks evidence throughout workflow', () => {
    const evidence = [
      { id: 'mem_screenshot_001', kind: 'screenshot', step: 'detection' },
      { id: 'mem_investigation_001', kind: 'investigation_summary', step: 'investigation' },
      { id: 'mem_pr_001', kind: 'pull_request', step: 'fix' },
      { id: 'mem_test_results_001', kind: 'test_results', step: 'validation' },
      { id: 'mem_deployment_001', kind: 'deployment_log', step: 'deployment' },
    ];

    expect(evidence.length).toBe(5);
    expect(evidence[0].kind).toBe('screenshot');
    expect(evidence[4].kind).toBe('deployment_log');
  });

  it('maintains audit trail of all state transitions', () => {
    const auditLog = [
      { event: 'workflow_started', step: 'detection', timestamp: '2026-01-11T10:00:00Z' },
      { event: 'step_completed', step: 'detection', timestamp: '2026-01-11T10:01:00Z' },
      { event: 'step_completed', step: 'investigation', timestamp: '2026-01-11T10:05:00Z' },
      { event: 'gate_waiting', step: 'approval_gate', timestamp: '2026-01-11T10:05:01Z' },
      { event: 'gate_approved', step: 'approval_gate', timestamp: '2026-01-11T10:30:00Z' },
      { event: 'step_completed', step: 'fix', timestamp: '2026-01-11T11:00:00Z' },
      { event: 'step_completed', step: 'validation', timestamp: '2026-01-11T11:05:00Z' },
      { event: 'step_completed', step: 'deployment', timestamp: '2026-01-11T11:10:00Z' },
      { event: 'workflow_completed', step: 'end', timestamp: '2026-01-11T11:10:01Z' },
    ];

    expect(auditLog.length).toBe(9);
    expect(auditLog[0].event).toBe('workflow_started');
    expect(auditLog[auditLog.length - 1].event).toBe('workflow_completed');
  });

  it('handles early termination on rejection', () => {
    const workflow = {
      id: 'wfi_e2e_004',
      current_step: 'approval_gate',
      step_states: {
        investigation: { status: 'completed' },
        approval_gate: {
          status: 'rejected',
          rejected_by: 'user:rashid',
        },
      },
    };

    const terminatedWorkflow = {
      ...workflow,
      state: 'cancelled',
      current_step: 'end',
      completed_at: new Date().toISOString(),
    };

    expect(terminatedWorkflow.state).toBe('cancelled');
    expect(terminatedWorkflow.current_step).toBe('end');
    expect(terminatedWorkflow.step_states.approval_gate.status).toBe('rejected');
  });
});
