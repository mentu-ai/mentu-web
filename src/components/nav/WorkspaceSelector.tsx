'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useWorkspaceNavigator,
  MOCK_WORKSPACES,
  MOCK_INFRASTRUCTURE,
  type NavigatorWorkspace,
} from '@/hooks/useWorkspaceNavigator';
import { InfrastructureBar } from '@/components/navigator/InfrastructureBar';
import { WorkspaceCard } from '@/components/navigator/WorkspaceCard';
import { ConfirmSheet } from '@/components/navigator/ConfirmSheet';
import { DeployingView } from '@/components/navigator/DeployingView';

interface WorkspaceSelectorProps {
  onSettingsClick: () => void;
}

export function WorkspaceSelector({ onSettingsClick }: WorkspaceSelectorProps) {
  const [open, setOpen] = useState(false);
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspace as string;

  const handleDeployComplete = useCallback((workspace: NavigatorWorkspace) => {
    setOpen(false);
    router.push(`/workspace/${workspace.id}`);
  }, [router]);

  const {
    view,
    selectedWorkspace,
    deployStage,
    logs,
    selectWorkspace,
    confirmDeploy,
    cancel,
    reset,
  } = useWorkspaceNavigator({
    onDeployComplete: handleDeployComplete,
  });

  const handleClose = () => {
    setOpen(false);
    // Reset navigator state when closing
    setTimeout(reset, 300);
  };

  const handleCancel = () => {
    cancel();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md"
      >
        {workspaceId}
        <ChevronDown className="w-4 h-4 opacity-50" />
      </button>

      {open && (
        <>
          {/* Overlay - clicking closes the selector (except during deployment) */}
          {view !== 'deploying' && (
            <div className="fixed inset-0 z-40" onClick={handleClose} />
          )}

          {/* Navigator Modal */}
          <div
            className={cn(
              'fixed inset-0 z-50 flex items-center justify-center p-4',
              view === 'deploying' && 'bg-zinc-50 dark:bg-zinc-950'
            )}
          >
            {/* Browse View */}
            {view === 'browse' && (
              <div
                className={cn(
                  'w-full max-w-2xl bg-white dark:bg-zinc-900',
                  'border border-zinc-200 dark:border-zinc-700',
                  'rounded-2xl shadow-2xl overflow-hidden',
                  'motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-200'
                )}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-zinc-900 dark:bg-zinc-100 rounded-md" />
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        Switch Workspace
                      </span>
                    </div>
                    <button
                      onClick={handleClose}
                      className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                {/* Infrastructure status bar */}
                <InfrastructureBar infrastructure={MOCK_INFRASTRUCTURE} />

                {/* Workspace cards */}
                <div className="p-4 max-h-[60vh] overflow-y-auto">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {MOCK_WORKSPACES.map((workspace) => (
                      <WorkspaceCard
                        key={workspace.id}
                        workspace={workspace}
                        onDeploy={selectWorkspace}
                      />
                    ))}
                  </div>
                </div>

                {/* Footer with settings */}
                <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                  <button
                    onClick={() => {
                      handleClose();
                      onSettingsClick();
                    }}
                    className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  >
                    Project Settings
                  </button>
                </div>
              </div>
            )}

            {/* Confirm View */}
            {view === 'confirm' && (
              <ConfirmSheet
                workspace={selectedWorkspace}
                onConfirm={confirmDeploy}
                onCancel={handleCancel}
              />
            )}

            {/* Deploying View - Full screen */}
            {view === 'deploying' && (
              <DeployingView
                workspace={selectedWorkspace}
                stage={deployStage}
                logs={logs}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
