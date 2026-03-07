'use client';

import { cn } from '@/lib/utils';
import { relativeTime } from '@/lib/utils';
import type { WorkflowStep } from '@/hooks/useWorkflowInstance';
import { StepLogViewer } from './step-log-viewer';
import { Check, X, Circle, Loader2, SkipForward } from 'lucide-react';

interface StepTimelineProps {
  instanceId: string;
  stepStates: Record<string, WorkflowStep>;
}

const stepIcons: Record<string, typeof Check> = {
  completed: Check,
  failed: X,
  running: Loader2,
  active: Loader2,
  skipped: SkipForward,
  pending: Circle,
};

const stepColors: Record<string, string> = {
  completed: 'text-green-500 bg-green-100 dark:bg-green-900/30',
  failed: 'text-red-500 bg-red-100 dark:bg-red-900/30',
  running: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
  active: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
  skipped: 'text-zinc-400 bg-zinc-100 dark:bg-zinc-800',
  pending: 'text-zinc-400 bg-zinc-100 dark:bg-zinc-800',
};

function getDuration(step: WorkflowStep): string | null {
  if (!step.started_at) return null;
  const start = new Date(step.started_at).getTime();
  const end = step.completed_at ? new Date(step.completed_at).getTime() : Date.now();
  const seconds = Math.round((end - start) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  return `${minutes}m`;
}

export function StepTimeline({ instanceId, stepStates }: StepTimelineProps) {
  const steps = Object.entries(stepStates);

  if (steps.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400 py-4">
        No steps defined
      </p>
    );
  }

  return (
    <div className="space-y-0">
      {steps.map(([stepId, step], index) => {
        const Icon = stepIcons[step.state] || Circle;
        const colorClasses = stepColors[step.state] || stepColors.pending;
        const duration = getDuration(step);
        const isLast = index === steps.length - 1;

        return (
          <div key={stepId} className="flex gap-3">
            {/* Vertical line + icon */}
            <div className="flex flex-col items-center">
              <div className={cn('rounded-full p-1', colorClasses)}>
                <Icon className={cn(
                  'h-3.5 w-3.5',
                  (step.state === 'running' || step.state === 'active') && 'animate-spin'
                )} />
              </div>
              {!isLast && (
                <div className="w-px flex-1 bg-zinc-200 dark:bg-zinc-700 my-1" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{stepId}</span>
                {step.state !== 'pending' && (
                  <span className={cn(
                    'text-xs',
                    step.state === 'completed' ? 'text-green-600 dark:text-green-400' :
                    step.state === 'failed' ? 'text-red-600 dark:text-red-400' :
                    (step.state === 'running' || step.state === 'active') ? 'text-blue-600 dark:text-blue-400' :
                    'text-zinc-500 dark:text-zinc-400'
                  )}>
                    {step.state}
                  </span>
                )}
                {duration && (
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    {duration}
                  </span>
                )}
              </div>

              {step.error && (
                <p className="text-xs text-red-500 mt-1">{step.error}</p>
              )}

              {step.started_at && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                  Started {relativeTime(step.started_at)}
                </p>
              )}

              {(step.state === 'running' || step.state === 'active') && (
                <StepLogViewer instanceId={instanceId} stepId={stepId} defaultOpen />
              )}
              {step.state === 'completed' && (
                <StepLogViewer instanceId={instanceId} stepId={stepId} />
              )}
              {step.state === 'failed' && (
                <StepLogViewer instanceId={instanceId} stepId={stepId} defaultOpen />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
