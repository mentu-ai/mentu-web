'use client';

import { cn } from '@/lib/utils';
import {
  useWorkspaceNavigator,
  MOCK_WORKSPACES,
  MOCK_INFRASTRUCTURE,
} from '@/hooks/useWorkspaceNavigator';
import { InfrastructureBar } from './InfrastructureBar';
import { WorkspaceCard } from './WorkspaceCard';
import { ConfirmSheet } from './ConfirmSheet';
import { DeployingView } from './DeployingView';
import { DeployedView } from './DeployedView';

export function WorkspaceNavigator() {
  const {
    view,
    selectedWorkspace,
    deployStage,
    logs,
    selectWorkspace,
    confirmDeploy,
    cancel,
    back,
  } = useWorkspaceNavigator();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* ================================================================= */}
      {/* BROWSE STATE: Show workspace grid                                  */}
      {/* ================================================================= */}
      {view === 'browse' && (
        <>
          {/* Header */}
          <header className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 sticky top-0 z-40">
            <div className="flex items-center justify-center max-w-3xl mx-auto">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-zinc-900 dark:bg-zinc-100 rounded-md" />
                <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  mentu
                </span>
              </div>
            </div>
          </header>

          {/* Infrastructure status bar */}
          <InfrastructureBar infrastructure={MOCK_INFRASTRUCTURE} />

          {/* Workspace card grid */}
          <div
            className={cn(
              'grid gap-4 p-5',
              'grid-cols-1 sm:grid-cols-2',
              'max-w-3xl mx-auto'
            )}
          >
            {MOCK_WORKSPACES.map((workspace) => (
              <WorkspaceCard
                key={workspace.id}
                workspace={workspace}
                onDeploy={selectWorkspace}
              />
            ))}
          </div>
        </>
      )}

      {/* ================================================================= */}
      {/* CONFIRM STATE: Show confirmation modal over browse view           */}
      {/* ================================================================= */}
      {view === 'confirm' && (
        <>
          {/* Keep browse view visible behind modal for context */}
          <header className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 sticky top-0 z-40">
            <div className="flex items-center justify-center max-w-3xl mx-auto">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-zinc-900 dark:bg-zinc-100 rounded-md" />
                <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  mentu
                </span>
              </div>
            </div>
          </header>

          <InfrastructureBar infrastructure={MOCK_INFRASTRUCTURE} />

          <div
            className={cn(
              'grid gap-4 p-5',
              'grid-cols-1 sm:grid-cols-2',
              'max-w-3xl mx-auto'
            )}
          >
            {MOCK_WORKSPACES.map((workspace) => (
              <WorkspaceCard
                key={workspace.id}
                workspace={workspace}
                onDeploy={selectWorkspace}
              />
            ))}
          </div>

          {/* Modal overlay */}
          <ConfirmSheet
            workspace={selectedWorkspace}
            onConfirm={confirmDeploy}
            onCancel={cancel}
          />
        </>
      )}

      {/* ================================================================= */}
      {/* DEPLOYING STATE: Show deployment progress                         */}
      {/* ================================================================= */}
      {view === 'deploying' && (
        <DeployingView
          workspace={selectedWorkspace}
          stage={deployStage}
          logs={logs}
        />
      )}

      {/* ================================================================= */}
      {/* DEPLOYED STATE: Show command center                               */}
      {/* ================================================================= */}
      {view === 'deployed' && (
        <DeployedView
          workspace={selectedWorkspace}
          onBack={back}
        />
      )}
    </div>
  );
}
