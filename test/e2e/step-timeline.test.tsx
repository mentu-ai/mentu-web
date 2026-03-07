import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StepTimeline } from '@/components/sequence/step-timeline';
import type { WorkflowStep } from '@/hooks/useWorkflowInstance';

// Mock the StepLogViewer since it depends on Supabase realtime
vi.mock('@/components/sequence/step-log-viewer', () => ({
  StepLogViewer: ({ stepId }: { stepId: string }) => (
    <div data-testid={`log-viewer-${stepId}`}>Log viewer</div>
  ),
}));

function makeStep(overrides: Partial<WorkflowStep> & { id: string }): WorkflowStep {
  return {
    id: overrides.id,
    type: overrides.type ?? 'action',
    state: overrides.state ?? 'pending',
    started_at: overrides.started_at,
    completed_at: overrides.completed_at,
    error: overrides.error,
    commitment_id: overrides.commitment_id,
    commitment_state: overrides.commitment_state,
    outcome: overrides.outcome,
    activated_at: overrides.activated_at,
  };
}

describe('StepTimeline', () => {
  it('renders "No steps defined" when empty', () => {
    render(<StepTimeline instanceId="wfi_001" stepStates={{}} />);
    expect(screen.getByText('No steps defined')).toBeDefined();
  });

  it('renders step names from keys', () => {
    const steps: Record<string, WorkflowStep> = {
      detection: makeStep({ id: 'detection', state: 'completed' }),
      investigation: makeStep({ id: 'investigation', state: 'running' }),
      fix: makeStep({ id: 'fix', state: 'pending' }),
    };
    render(<StepTimeline instanceId="wfi_001" stepStates={steps} />);
    expect(screen.getByText('detection')).toBeDefined();
    expect(screen.getByText('investigation')).toBeDefined();
    expect(screen.getByText('fix')).toBeDefined();
  });

  it('displays state labels for non-pending steps', () => {
    const steps: Record<string, WorkflowStep> = {
      detection: makeStep({ id: 'detection', state: 'completed' }),
      investigation: makeStep({ id: 'investigation', state: 'running' }),
      fix: makeStep({ id: 'fix', state: 'failed' }),
    };
    render(<StepTimeline instanceId="wfi_001" stepStates={steps} />);
    expect(screen.getByText('completed')).toBeDefined();
    expect(screen.getByText('running')).toBeDefined();
    expect(screen.getByText('failed')).toBeDefined();
  });

  it('does not show state label for pending steps', () => {
    const steps: Record<string, WorkflowStep> = {
      detection: makeStep({ id: 'detection', state: 'pending' }),
    };
    render(<StepTimeline instanceId="wfi_001" stepStates={steps} />);
    expect(screen.getByText('detection')).toBeDefined();
    // "pending" should NOT appear as a text label
    expect(screen.queryByText('pending')).toBeNull();
  });

  it('shows error message for failed steps', () => {
    const steps: Record<string, WorkflowStep> = {
      validation: makeStep({
        id: 'validation',
        state: 'failed',
        error: 'Tests failed: 2 of 45',
      }),
    };
    render(<StepTimeline instanceId="wfi_001" stepStates={steps} />);
    expect(screen.getByText('Tests failed: 2 of 45')).toBeDefined();
  });

  it('computes duration from started_at and completed_at', () => {
    const steps: Record<string, WorkflowStep> = {
      detection: makeStep({
        id: 'detection',
        state: 'completed',
        started_at: '2026-01-11T10:00:00Z',
        completed_at: '2026-01-11T10:00:30Z',
      }),
    };
    render(<StepTimeline instanceId="wfi_001" stepStates={steps} />);
    expect(screen.getByText('30s')).toBeDefined();
  });

  it('computes duration in minutes for longer steps', () => {
    const steps: Record<string, WorkflowStep> = {
      investigation: makeStep({
        id: 'investigation',
        state: 'completed',
        started_at: '2026-01-11T10:00:00Z',
        completed_at: '2026-01-11T10:05:00Z',
      }),
    };
    render(<StepTimeline instanceId="wfi_001" stepStates={steps} />);
    expect(screen.getByText('5m')).toBeDefined();
  });

  it('shows "Started" time for steps with started_at', () => {
    const steps: Record<string, WorkflowStep> = {
      detection: makeStep({
        id: 'detection',
        state: 'completed',
        started_at: '2026-01-11T10:00:00Z',
      }),
    };
    render(<StepTimeline instanceId="wfi_001" stepStates={steps} />);
    // relativeTime will produce something like "Started X ago" or similar
    const startedElements = screen.getAllByText(/Started/);
    expect(startedElements.length).toBeGreaterThan(0);
  });

  it('shows log viewer for running steps by default', () => {
    const steps: Record<string, WorkflowStep> = {
      investigation: makeStep({ id: 'investigation', state: 'running' }),
    };
    render(<StepTimeline instanceId="wfi_001" stepStates={steps} />);
    expect(screen.getByTestId('log-viewer-investigation')).toBeDefined();
  });

  it('shows log viewer for failed steps by default', () => {
    const steps: Record<string, WorkflowStep> = {
      fix: makeStep({ id: 'fix', state: 'failed' }),
    };
    render(<StepTimeline instanceId="wfi_001" stepStates={steps} />);
    expect(screen.getByTestId('log-viewer-fix')).toBeDefined();
  });

  it('handles "active" state alias as running', () => {
    const steps: Record<string, WorkflowStep> = {
      executor: makeStep({ id: 'executor', state: 'active' }),
    };
    render(<StepTimeline instanceId="wfi_001" stepStates={steps} />);
    // "active" should render with running icon (blue, animate-spin)
    expect(screen.getByText('active')).toBeDefined();
    expect(screen.getByTestId('log-viewer-executor')).toBeDefined();
  });

  it('renders full pipeline with mixed states', () => {
    const steps: Record<string, WorkflowStep> = {
      detection: makeStep({
        id: 'detection',
        state: 'completed',
        started_at: '2026-01-11T10:00:00Z',
        completed_at: '2026-01-11T10:01:00Z',
      }),
      investigation: makeStep({
        id: 'investigation',
        state: 'completed',
        started_at: '2026-01-11T10:01:00Z',
        completed_at: '2026-01-11T10:05:00Z',
      }),
      approval_gate: makeStep({
        id: 'approval_gate',
        state: 'running',
        started_at: '2026-01-11T10:05:00Z',
      }),
      fix: makeStep({ id: 'fix', state: 'pending' }),
      validation: makeStep({ id: 'validation', state: 'pending' }),
    };
    render(<StepTimeline instanceId="wfi_001" stepStates={steps} />);

    expect(screen.getAllByText('completed').length).toBe(2);
    expect(screen.getByText('running')).toBeDefined();
    expect(screen.getByText('detection')).toBeDefined();
    expect(screen.getByText('investigation')).toBeDefined();
    expect(screen.getByText('approval_gate')).toBeDefined();
    expect(screen.getByText('fix')).toBeDefined();
    expect(screen.getByText('validation')).toBeDefined();
  });
});
