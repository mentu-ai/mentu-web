import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SequencesListPage } from '@/components/sequence/sequences-list-page';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock the hook — we control the data
const mockUseWorkflowInstances = vi.fn();
vi.mock('@/hooks/useWorkflowInstances', () => ({
  useWorkflowInstances: (...args: unknown[]) => mockUseWorkflowInstances(...args),
}));

describe('SequencesListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state', () => {
    mockUseWorkflowInstances.mockReturnValue({ data: undefined, isLoading: true });
    render(<SequencesListPage workspaceName="test-ws" workspaceId="ws_001" />);
    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('shows empty state', () => {
    mockUseWorkflowInstances.mockReturnValue({ data: [], isLoading: false });
    render(<SequencesListPage workspaceName="test-ws" workspaceId="ws_001" />);
    expect(screen.getByText('No sequences yet')).toBeDefined();
  });

  it('renders sequence table with headers', () => {
    mockUseWorkflowInstances.mockReturnValue({
      data: [
        {
          id: 'wfi_001',
          workflow_id: 'wf_bug',
          workflow_name: 'Bug Investigation',
          state: 'running',
          parameters: {},
          step_states: {
            detection: { state: 'completed', id: 'detection', type: 'action' },
            investigation: { state: 'running', id: 'investigation', type: 'action' },
            fix: { state: 'pending', id: 'fix', type: 'action' },
          },
          current_step: 'investigation',
          created_at: '2026-01-11T10:00:00Z',
          updated_at: '2026-01-11T10:05:00Z',
        },
      ],
      isLoading: false,
    });

    render(<SequencesListPage workspaceName="test-ws" workspaceId="ws_001" />);

    // Headers
    expect(screen.getByText('Name')).toBeDefined();
    expect(screen.getByText('State')).toBeDefined();
    expect(screen.getByText('Progress')).toBeDefined();
    expect(screen.getByText('Started')).toBeDefined();
    expect(screen.getByText('Duration')).toBeDefined();

    // Data
    expect(screen.getByText('Bug Investigation')).toBeDefined();
    expect(screen.getByText('running')).toBeDefined();
    expect(screen.getByText('1/3')).toBeDefined(); // 1 completed of 3 steps
  });

  it('links sequence name to detail page', () => {
    mockUseWorkflowInstances.mockReturnValue({
      data: [
        {
          id: 'wfi_002',
          workflow_id: 'wf_deploy',
          workflow_name: 'Deploy Pipeline',
          state: 'completed',
          parameters: {},
          step_states: {
            build: { state: 'completed', id: 'build', type: 'action' },
            deploy: { state: 'completed', id: 'deploy', type: 'action' },
          },
          current_step: 'end',
          created_at: '2026-01-11T10:00:00Z',
          updated_at: '2026-01-11T10:10:00Z',
        },
      ],
      isLoading: false,
    });

    render(<SequencesListPage workspaceName="my-workspace" workspaceId="ws_002" />);

    const link = screen.getByText('Deploy Pipeline').closest('a');
    expect(link?.getAttribute('href')).toBe('/workspace/my-workspace/sequences/wfi_002');
  });

  it('shows correct progress for fully completed sequence', () => {
    mockUseWorkflowInstances.mockReturnValue({
      data: [
        {
          id: 'wfi_003',
          workflow_id: 'wf_test',
          workflow_name: 'Test Workflow',
          state: 'completed',
          parameters: {},
          step_states: {
            step1: { state: 'completed', id: 'step1', type: 'action' },
            step2: { state: 'completed', id: 'step2', type: 'action' },
            step3: { state: 'completed', id: 'step3', type: 'action' },
          },
          current_step: 'end',
          created_at: '2026-01-11T10:00:00Z',
          updated_at: '2026-01-11T10:15:00Z',
        },
      ],
      isLoading: false,
    });

    render(<SequencesListPage workspaceName="test-ws" workspaceId="ws_001" />);
    expect(screen.getByText('3/3')).toBeDefined();
    expect(screen.getByText('completed')).toBeDefined();
  });

  it('renders multiple sequences', () => {
    mockUseWorkflowInstances.mockReturnValue({
      data: [
        {
          id: 'wfi_a',
          workflow_id: 'wf_1',
          workflow_name: 'Sequence Alpha',
          state: 'running',
          parameters: {},
          step_states: { s1: { state: 'running', id: 's1', type: 'action' } },
          current_step: 's1',
          created_at: '2026-01-11T10:00:00Z',
          updated_at: '2026-01-11T10:01:00Z',
        },
        {
          id: 'wfi_b',
          workflow_id: 'wf_2',
          workflow_name: 'Sequence Beta',
          state: 'failed',
          parameters: {},
          step_states: { s1: { state: 'failed', id: 's1', type: 'action' } },
          current_step: 's1',
          created_at: '2026-01-11T09:00:00Z',
          updated_at: '2026-01-11T09:05:00Z',
        },
      ],
      isLoading: false,
    });

    render(<SequencesListPage workspaceName="test-ws" workspaceId="ws_001" />);
    expect(screen.getByText('Sequence Alpha')).toBeDefined();
    expect(screen.getByText('Sequence Beta')).toBeDefined();
    expect(screen.getByText('running')).toBeDefined();
    expect(screen.getByText('failed')).toBeDefined();
  });

  it('passes workspaceId to the hook', () => {
    mockUseWorkflowInstances.mockReturnValue({ data: [], isLoading: false });
    render(<SequencesListPage workspaceName="test-ws" workspaceId="ws_specific" />);
    expect(mockUseWorkflowInstances).toHaveBeenCalledWith('ws_specific');
  });
});
