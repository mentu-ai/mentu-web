'use client';

import { cn } from '@/lib/utils';
import { Folder, Globe, Bot, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { NavigatorWorkspace } from '@/hooks/useWorkspaceNavigator';

interface WorkspaceCardProps {
  workspace: NavigatorWorkspace;
  onDeploy: (workspace: NavigatorWorkspace) => void;
}

export function WorkspaceCard({ workspace, onDeploy }: WorkspaceCardProps) {
  const handleDeployClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeploy(workspace);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onDeploy(workspace);
    }
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-zinc-900 rounded-2xl',
        'border border-zinc-200 dark:border-zinc-700',
        'p-5 transition-all duration-150',
        'hover:border-zinc-300 dark:hover:border-zinc-600',
        'hover:shadow-sm cursor-pointer',
        'relative overflow-hidden'
      )}
      onClick={() => onDeploy(workspace)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${workspace.name} workspace. ${workspace.activeAgents} agents, ${workspace.openWork} work items.`}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            {/* Activity pulse for active workspaces */}
            {workspace.hasActivity && (
              <div
                className={cn(
                  'absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full',
                  'bg-emerald-500',
                  'motion-safe:animate-pulse'
                )}
                aria-label="Active"
              />
            )}
            {workspace.type === 'local' ? (
              <Folder className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            ) : (
              <Globe className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            )}
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {workspace.name}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              {workspace.description}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <Bot className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {workspace.activeAgents}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">agents</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ClipboardList className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {workspace.openWork}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">work</span>
        </div>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {workspace.lastActivity}
        </span>
      </div>

      {/* Footer with sync status and deploy button */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <div
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              workspace.synced ? 'bg-emerald-500' : 'bg-amber-500'
            )}
          />
          {workspace.synced ? 'Synced' : 'Pending sync'}
        </div>
        <Button
          onClick={handleDeployClick}
          className={cn(
            'min-h-[44px] min-w-[44px] px-5 rounded-xl',
            'font-semibold text-sm'
          )}
          aria-label={`Deploy ${workspace.name}`}
        >
          Deploy
        </Button>
      </div>
    </div>
  );
}
