'use client';

import { cn } from '@/lib/utils';
import type { Infrastructure, InfraStatus } from '@/hooks/useWorkspaceNavigator';

interface InfrastructureBarProps {
  infrastructure: Infrastructure;
  className?: string;
}

function getStatusColor(status: InfraStatus): string {
  switch (status) {
    case 'online':
      return 'bg-emerald-500';
    case 'offline':
      return 'bg-red-500';
    case 'syncing':
      return 'bg-amber-500 motion-safe:animate-pulse';
    case 'error':
      return 'bg-red-500';
    default:
      return 'bg-zinc-400';
  }
}

export function InfrastructureBar({ infrastructure, className }: InfrastructureBarProps) {
  return (
    <div
      className={cn(
        'flex gap-3 px-5 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700',
        'overflow-x-auto scrollbar-hide',
        '-webkit-overflow-scrolling-touch',
        className
      )}
    >
      {Object.entries(infrastructure).map(([key, infra]) => (
        <div
          key={key}
          className={cn(
            'flex items-center gap-2 px-3 py-2',
            'bg-zinc-100 dark:bg-zinc-800 rounded-lg',
            'whitespace-nowrap min-w-fit'
          )}
        >
          <div
            className={cn(
              'w-2 h-2 rounded-full flex-shrink-0',
              getStatusColor(infra.status)
            )}
            aria-label={`${infra.label} status: ${infra.status}`}
          />
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
            {infra.label}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {infra.detail}
          </span>
        </div>
      ))}
    </div>
  );
}
