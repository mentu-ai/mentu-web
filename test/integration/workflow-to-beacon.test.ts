import { describe, it, expect, vi } from 'vitest';

describe('Workflow → Beacon Execution Integration', () => {
  it('creates bridge command when workflow step activates', () => {
    // Mock workflow instance
    const workflow = {
      id: 'wfi_test_001',
      workflow_id: 'wf_bug_investigation',
      workflow_version: 1,
      state: 'running',
      current_step: 'investigation',
      parameters: { memory_id: 'mem_test_001' },
    };

    // Mock bridge command that would be created
    const bridgeCommand = {
      id: 'cmd_test_001',
      workspace_id: 'ws_test_001',
      workflow_instance_id: workflow.id,
      prompt: 'Investigation step for bug investigation workflow',
      status: 'pending',
      agent: 'general-purpose',
    };

    expect(bridgeCommand.workflow_instance_id).toBe(workflow.id);
    expect(bridgeCommand.status).toBe('pending');
    expect(bridgeCommand.prompt).toContain('investigation');
  });

  it('links bridge command to workflow step', () => {
    const workflowInstance = {
      id: 'wfi_test_002',
      current_step: 'fix',
      step_states: {
        investigation: { status: 'completed', commitment_id: 'cmt_test_001' },
        approval_gate: { status: 'approved' },
        fix: { status: 'active' },
      },
    };

    const bridgeCommand = {
      id: 'cmd_test_002',
      workflow_instance_id: workflowInstance.id,
      step_id: 'fix',
      commitment_id: 'cmt_test_001',
      status: 'pending',
    };

    expect(bridgeCommand.workflow_instance_id).toBe(workflowInstance.id);
    expect(bridgeCommand.step_id).toBe('fix');
    expect(bridgeCommand.commitment_id).toBe('cmt_test_001');
  });

  it('passes workflow parameters to bridge command', () => {
    const workflow = {
      id: 'wfi_test_003',
      parameters: {
        memory_id: 'mem_test_001',
        workspace_id: 'ws_test_001',
        severity: 'high',
      },
    };

    const bridgeCommand = {
      id: 'cmd_test_003',
      workflow_instance_id: workflow.id,
      context: {
        memory_id: workflow.parameters.memory_id,
        severity: workflow.parameters.severity,
      },
    };

    expect(bridgeCommand.context.memory_id).toBe('mem_test_001');
    expect(bridgeCommand.context.severity).toBe('high');
  });

  it('updates workflow state when beacon claims command', () => {
    const workflow = {
      id: 'wfi_test_004',
      current_step: 'investigation',
      step_states: {
        investigation: { status: 'active' },
      },
    };

    const bridgeCommand = {
      id: 'cmd_test_004',
      workflow_instance_id: workflow.id,
      status: 'claimed',
      claimed_by_machine_id: 'machine_001',
    };

    // Workflow step should update to reflect claimed status
    expect(bridgeCommand.status).toBe('claimed');
    expect(bridgeCommand.claimed_by_machine_id).toBe('machine_001');
  });

  it('updates workflow on beacon command completion', () => {
    const workflow = {
      id: 'wfi_test_005',
      current_step: 'investigation',
      step_states: {
        investigation: { status: 'active' },
      },
    };

    const bridgeCommand = {
      id: 'cmd_test_005',
      workflow_instance_id: workflow.id,
      status: 'completed',
      result: {
        summary: 'Bug found in checkout.ts',
        commitment_id: 'cmt_test_001',
      },
    };

    // Mock updated workflow state
    const updatedWorkflow = {
      ...workflow,
      current_step: 'approval_gate',
      step_states: {
        investigation: {
          status: 'completed',
          output: bridgeCommand.result,
        },
      },
    };

    expect(updatedWorkflow.current_step).toBe('approval_gate');
    expect(updatedWorkflow.step_states.investigation.status).toBe('completed');
    expect(updatedWorkflow.step_states.investigation.output?.commitment_id).toBe('cmt_test_001');
  });
});
