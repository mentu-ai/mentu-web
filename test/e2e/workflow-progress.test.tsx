import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorkflowProgress, WorkflowProgressExpanded } from '@/components/bug-report/workflow-progress';

describe('WorkflowProgress', () => {
  it('renders all 7 workflow steps', () => {
    render(<WorkflowProgress />);
    const steps = ['Architect', 'Auditor', 'Gate', 'Approval', 'Executor', 'Validate', 'Complete'];
    for (const label of steps) {
      expect(screen.getByTitle(`${label}: Pending`)).toBeDefined();
    }
  });

  it('shows completed step with green check', () => {
    render(
      <WorkflowProgress
        stepStates={{ architect: { state: 'completed' } }}
      />
    );
    expect(screen.getByTitle('Architect: Complete')).toBeDefined();
    expect(screen.getByTitle('Auditor: Pending')).toBeDefined();
  });

  it('shows running step with spinner', () => {
    render(
      <WorkflowProgress
        stepStates={{ auditor: { state: 'running' } }}
      />
    );
    expect(screen.getByTitle('Auditor: Running')).toBeDefined();
  });

  it('treats "active" as "running" (protocol backward compat)', () => {
    render(
      <WorkflowProgress
        stepStates={{ executor: { state: 'active' } }}
      />
    );
    expect(screen.getByTitle('Executor: Running')).toBeDefined();
  });

  it('shows failed step with X icon', () => {
    render(
      <WorkflowProgress
        stepStates={{ validate: { state: 'failed' } }}
      />
    );
    expect(screen.getByTitle('Validate: Failed')).toBeDefined();
  });

  it('shows skipped step', () => {
    render(
      <WorkflowProgress
        stepStates={{ complete: { state: 'skipped' } }}
      />
    );
    expect(screen.getByTitle('Complete: Skipped')).toBeDefined();
  });

  it('marks currentStep as running when no stepStates provided', () => {
    render(<WorkflowProgress currentStep="auditor" />);
    expect(screen.getByTitle('Auditor: Running')).toBeDefined();
    expect(screen.getByTitle('Architect: Pending')).toBeDefined();
  });

  it('renders a full pipeline: 3 completed, 1 running, rest pending', () => {
    render(
      <WorkflowProgress
        stepStates={{
          architect: { state: 'completed' },
          auditor: { state: 'completed' },
          auditor_gate: { state: 'completed' },
          approval_gate: { state: 'running' },
        }}
      />
    );
    expect(screen.getByTitle('Architect: Complete')).toBeDefined();
    expect(screen.getByTitle('Auditor: Complete')).toBeDefined();
    expect(screen.getByTitle('Gate: Complete')).toBeDefined();
    expect(screen.getByTitle('Approval: Running')).toBeDefined();
    expect(screen.getByTitle('Executor: Pending')).toBeDefined();
  });
});

describe('WorkflowProgressExpanded', () => {
  it('renders step labels and state text', () => {
    render(
      <WorkflowProgressExpanded
        stepStates={{
          architect: { state: 'completed' },
          executor: { state: 'running' },
        }}
      />
    );
    expect(screen.getByText('Architect')).toBeDefined();
    expect(screen.getByText('Executor')).toBeDefined();
    expect(screen.getByText('completed')).toBeDefined();
    expect(screen.getByText('running')).toBeDefined();
  });

  it('renders step counter for each step', () => {
    render(<WorkflowProgressExpanded />);
    expect(screen.getByText('1/7')).toBeDefined();
    expect(screen.getByText('7/7')).toBeDefined();
  });

  it('handles "active" alias in expanded view', () => {
    render(
      <WorkflowProgressExpanded
        stepStates={{ auditor: { state: 'active' } }}
      />
    );
    // "active" renders with running icon title
    expect(screen.getByTitle('Auditor: Running')).toBeDefined();
    // But text shows the raw state
    expect(screen.getByText('active')).toBeDefined();
  });
});
