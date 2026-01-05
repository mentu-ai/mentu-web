'use client';

import { cn } from '@/lib/utils';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { NavigatorWorkspace } from '@/hooks/useWorkspaceNavigator';

interface ConfirmSheetProps {
  workspace: NavigatorWorkspace | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmSheet({ workspace, onConfirm, onCancel }: ConfirmSheetProps) {
  if (!workspace) return null;

  const hasRunningAgents = workspace.activeAgents > 0;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50',
        'bg-black/50 dark:bg-black/70',
        'flex items-end sm:items-center justify-center',
        'motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200'
      )}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={cn(
          'bg-white dark:bg-zinc-900',
          'w-full max-w-lg',
          'rounded-t-3xl sm:rounded-2xl',
          'max-h-[90vh] overflow-auto',
          'motion-safe:animate-in motion-safe:slide-in-from-bottom motion-safe:duration-300 sm:motion-safe:slide-in-from-bottom-0 sm:motion-safe:zoom-in-95'
        )}
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        {/* Drag handle for mobile */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" aria-hidden="true" />
        </div>

        {/* Close button for desktop */}
        <button
          onClick={onCancel}
          className={cn(
            'absolute right-4 top-4 p-2 rounded-lg',
            'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200',
            'hover:bg-zinc-100 dark:hover:bg-zinc-800',
            'transition-colors hidden sm:block'
          )}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center sm:text-left">
          <h2 id="modal-title" className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Deploy Workspace
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Review before connecting
          </p>
        </div>

        {/* Body */}
        <div className="px-6 pb-4">
          {/* Warning banner if agents are running */}
          {hasRunningAgents && (
            <div className={cn(
              'flex items-center gap-3 p-3 mb-5',
              'bg-amber-50 dark:bg-amber-900/20',
              'border border-amber-200 dark:border-amber-800',
              'rounded-lg'
            )}>
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                {workspace.activeAgents} agent{workspace.activeAgents > 1 ? 's' : ''} currently running
              </span>
            </div>
          )}

          {/* Workspace Info */}
          <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-4 mb-4">
            <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
              Workspace
            </div>
            <PreviewItem label="Name" value={workspace.name} />
            <PreviewItem label="Description" value={workspace.description} isLast />
          </div>

          {/* Path Info */}
          <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-4 mb-4">
            <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
              Paths
            </div>
            <PreviewItem
              label="Local"
              value={workspace.path}
              isPath
              title={workspace.path}
            />
            <PreviewItem
              label="VPS"
              value={workspace.vpsPath}
              isPath
              isLast
              title={workspace.vpsPath}
            />
          </div>

          {/* Status Info */}
          <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-4">
            <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
              Status
            </div>
            <PreviewItem
              label="Active Agents"
              value={String(workspace.activeAgents)}
              valueClassName={workspace.activeAgents > 0 ? 'text-amber-600 dark:text-amber-400' : ''}
            />
            <PreviewItem
              label="Open Work"
              value={String(workspace.openWork)}
            />
            <PreviewItem
              label="Sync Status"
              value={workspace.synced ? 'Synced' : 'Pending'}
              valueClassName={workspace.synced ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}
              isLast
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 p-6 pt-4">
          <Button
            variant="secondary"
            onClick={onCancel}
            className="flex-1 min-h-[52px] text-base font-semibold rounded-xl"
            aria-label="Cancel deployment"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-[2] min-h-[52px] text-base font-semibold rounded-xl"
            aria-label={`Deploy ${workspace.name}`}
          >
            Deploy Now
          </Button>
        </div>
      </div>
    </div>
  );
}

interface PreviewItemProps {
  label: string;
  value: string;
  isLast?: boolean;
  isPath?: boolean;
  title?: string;
  valueClassName?: string;
}

function PreviewItem({ label, value, isLast, isPath, title, valueClassName }: PreviewItemProps) {
  return (
    <div
      className={cn(
        'flex justify-between items-center py-2',
        !isLast && 'border-b border-zinc-200 dark:border-zinc-700'
      )}
    >
      <span className="text-sm text-zinc-600 dark:text-zinc-400">
        {label}
      </span>
      <span
        className={cn(
          'text-sm font-medium text-zinc-900 dark:text-zinc-100 font-mono',
          isPath && 'text-xs max-w-[180px] truncate',
          valueClassName
        )}
        title={title}
      >
        {value}
      </span>
    </div>
  );
}
