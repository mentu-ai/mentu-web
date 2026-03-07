import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorkflowProgress } from '@/components/bug-report/workflow-progress';
import { StepTimeline } from '@/components/sequence/step-timeline';
import type { WorkflowStep } from '@/hooks/useWorkflowInstance';

// Mock StepLogViewer
vi.mock('@/components/sequence/step-log-viewer', () => ({
  StepLogViewer: ({ stepId }: { stepId: string }) => (
    <div data-testid={`log-viewer-${stepId}`}>Log viewer</div>
  ),
}));

describe('Protocol-Native State Alignment', () => {
  describe('commitment_state mapping to UI states', () => {
    // The protocol uses: open, claimed, in_review, closed, reopened
    // The UI maps: open→pending, claimed→running, in_review→running, closed→completed, reopened→running
    // Plus "active" is a backward-compat alias for "running"

    it('"running" renders as running in WorkflowProgress', () => {
      render(
        <WorkflowProgress
          stepStates={{ architect: { state: 'running' } }}
        />
      );
      expect(screen.getByTitle('Architect: Running')).toBeDefined();
    });

    it('"active" renders identically to "running" in WorkflowProgress', () => {
      const { unmount } = render(
        <WorkflowProgress
          stepStates={{ architect: { state: 'running' } }}
        />
      );
      const runningIcon = screen.getByTitle('Architect: Running');
      expect(runningIcon).toBeDefined();
      unmount();

      render(
        <WorkflowProgress
          stepStates={{ architect: { state: 'active' } }}
        />
      );
      const activeIcon = screen.getByTitle('Architect: Running');
      expect(activeIcon).toBeDefined();
    });

    it('"active" gets same CSS treatment as "running" in StepTimeline', () => {
      const makeStep = (state: string): WorkflowStep => ({
        id: 'test',
        type: 'action',
        state: state as WorkflowStep['state'],
      });

      const { container: c1 } = render(
        <StepTimeline instanceId="wfi_001" stepStates={{ step1: makeStep('running') }} />
      );
      const runningIconContainer = c1.querySelector('.animate-spin');

      const { container: c2 } = render(
        <StepTimeline instanceId="wfi_002" stepStates={{ step1: makeStep('active') }} />
      );
      const activeIconContainer = c2.querySelector('.animate-spin');

      // Both should have animate-spin class
      expect(runningIconContainer).not.toBeNull();
      expect(activeIconContainer).not.toBeNull();
    });
  });

  describe('step_states with protocol-native fields', () => {
    it('renders steps with commitment_id and commitment_state', () => {
      const steps: Record<string, WorkflowStep> = {
        detection: {
          id: 'detection',
          type: 'action',
          state: 'completed',
          commitment_id: 'cmt_abc123',
          commitment_state: 'closed',
          outcome: 'completed',
          started_at: '2026-01-11T10:00:00Z',
          completed_at: '2026-01-11T10:01:00Z',
        },
        investigation: {
          id: 'investigation',
          type: 'action',
          state: 'running',
          commitment_id: 'cmt_def456',
          commitment_state: 'claimed',
          activated_at: '2026-01-11T10:01:00Z',
        },
      };

      render(<StepTimeline instanceId="wfi_001" stepStates={steps} />);
      expect(screen.getByText('detection')).toBeDefined();
      expect(screen.getByText('investigation')).toBeDefined();
      expect(screen.getByText('completed')).toBeDefined();
      expect(screen.getByText('running')).toBeDefined();
    });
  });

  describe('all valid step states render without errors', () => {
    const states: WorkflowStep['state'][] = ['pending', 'running', 'active', 'completed', 'failed', 'skipped'];

    for (const state of states) {
      it(`renders "${state}" state without throwing`, () => {
        const steps: Record<string, WorkflowStep> = {
          testStep: {
            id: 'testStep',
            type: 'action',
            state,
          },
        };

        expect(() => {
          render(<StepTimeline instanceId="wfi_001" stepStates={steps} />);
        }).not.toThrow();
      });
    }

    for (const state of states) {
      it(`renders "${state}" in WorkflowProgress without throwing`, () => {
        expect(() => {
          render(
            <WorkflowProgress
              stepStates={{ architect: { state } }}
            />
          );
        }).not.toThrow();
      });
    }
  });
});
