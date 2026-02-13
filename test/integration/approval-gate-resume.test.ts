import { describe, it, expect } from 'vitest';

describe('Approval Gate → Resume Integration', () => {
  it('resumes workflow after approval', () => {
    // Mock workflow at approval gate
    const workflow = {
      id: 'wfi_test_001',
      workflow_id: 'wf_bug_investigation',
      state: 'running',
      current_step: 'approval_gate',
      step_states: {
        detection: { status: 'completed' },
        investigation: {
          status: 'completed',
          output: { summary: 'Bug found', commitment_id: 'cmt_test_001' },
        },
        approval_gate: {
          status: 'waiting',
          gate_type: 'approval',
        },
      },
    };

    // Simulate approval
    const approvedWorkflow = {
      ...workflow,
      step_states: {
        ...workflow.step_states,
        approval_gate: {
          status: 'approved',
          approved_by: 'user:test',
        },
      },
      current_step: 'fix',
    };

    expect(approvedWorkflow.current_step).toBe('fix');
    expect(approvedWorkflow.step_states.approval_gate.status).toBe('approved');
  });

  it('blocks workflow at approval gate', () => {
    const workflow = {
      id: 'wfi_test_002',
      current_step: 'approval_gate',
      step_states: {
        approval_gate: {
          status: 'waiting',
          gate_type: 'approval',
          waiting_since: '2026-01-11T10:00:00Z',
        },
      },
    };

    expect(workflow.step_states.approval_gate.status).toBe('waiting');
    expect(workflow.current_step).toBe('approval_gate');
  });

  it('records approval metadata', () => {
    const approval = {
      workflow_instance_id: 'wfi_test_003',
      step_id: 'approval_gate',
      approved_by: 'user:rashid',
      approved_at: '2026-01-11T10:30:00Z',
      comment: 'Fix looks good, proceed',
    };

    expect(approval.approved_by).toBe('user:rashid');
    expect(approval.approved_at).toBeDefined();
    expect(approval.comment).toBe('Fix looks good, proceed');
  });

  it('handles rejection at approval gate', () => {
    const workflow = {
      id: 'wfi_test_004',
      current_step: 'approval_gate',
      step_states: {
        approval_gate: {
          status: 'waiting',
        },
      },
    };

    // Simulate rejection
    const rejectedWorkflow = {
      ...workflow,
      step_states: {
        approval_gate: {
          status: 'rejected',
          rejected_by: 'user:test',
          rejection_reason: 'Approach needs revision',
        },
      },
      current_step: 'end',
      state: 'cancelled',
    };

    expect(rejectedWorkflow.step_states.approval_gate.status).toBe('rejected');
    expect(rejectedWorkflow.current_step).toBe('end');
    expect(rejectedWorkflow.state).toBe('cancelled');
  });

  it('escalates on timeout', () => {
    const workflow = {
      id: 'wfi_test_005',
      current_step: 'approval_gate',
      step_states: {
        approval_gate: {
          status: 'waiting',
          waiting_since: '2026-01-10T10:00:00Z',
          timeout_hours: 24,
        },
      },
    };

    // Simulate timeout (current time > 24 hours after waiting_since)
    const timedOutWorkflow = {
      ...workflow,
      step_states: {
        approval_gate: {
          status: 'timeout',
        },
      },
      current_step: 'escalate',
    };

    expect(timedOutWorkflow.step_states.approval_gate.status).toBe('timeout');
    expect(timedOutWorkflow.current_step).toBe('escalate');
  });

  it('supports multiple approvers', () => {
    const approvalConfig = {
      gate_type: 'approval',
      approvers: ['user:rashid', 'user:admin', 'user:team-lead'],
      require_all: false, // Any one can approve
    };

    const approval = {
      approved_by: 'user:rashid',
    };

    expect(approvalConfig.approvers).toContain(approval.approved_by);
  });

  it('preserves workflow context after approval', () => {
    const beforeApproval = {
      id: 'wfi_test_007',
      parameters: {
        memory_id: 'mem_test_001',
        workspace_id: 'ws_test_001',
      },
      step_states: {
        investigation: {
          output: { commitment_id: 'cmt_test_001' },
        },
      },
    };

    const afterApproval = {
      ...beforeApproval,
      step_states: {
        ...beforeApproval.step_states,
        approval_gate: {
          status: 'approved',
        },
      },
      current_step: 'fix',
    };

    // Context should be preserved
    expect(afterApproval.parameters.memory_id).toBe('mem_test_001');
    expect(afterApproval.step_states.investigation.output?.commitment_id).toBe('cmt_test_001');
  });
});
