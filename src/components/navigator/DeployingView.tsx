'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { DEPLOY_STAGES, type DeployLog, type NavigatorWorkspace } from '@/hooks/useWorkspaceNavigator';

interface DeployingViewProps {
  workspace: NavigatorWorkspace | null;
  stage: number;
  logs: DeployLog[];
}

type StageStatus = 'pending' | 'active' | 'complete';

export function DeployingView({ workspace, stage, logs }: DeployingViewProps) {
  const terminalRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal to bottom when new logs added
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const getStageStatus = (index: number): StageStatus => {
    if (index < stage) return 'complete';
    if (index === stage) return 'active';
    return 'pending';
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      <div className="flex-1 px-5 py-6 max-w-lg mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Deploying
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            {workspace?.name}
          </p>
        </div>

        {/* Stages */}
        <div
          className="mb-6"
          role="progressbar"
          aria-valuenow={stage}
          aria-valuemax={DEPLOY_STAGES.length}
        >
          {DEPLOY_STAGES.map((stageItem, index) => {
            const status = getStageStatus(index);
            const isLast = index === DEPLOY_STAGES.length - 1;

            return (
              <div key={stageItem.id} className="flex items-center gap-4 py-3 relative">
                {/* Connector line between stages */}
                {!isLast && (
                  <div
                    className={cn(
                      'absolute left-4 top-10 w-0.5 h-[calc(100%-24px)]',
                      status === 'complete'
                        ? 'bg-emerald-500'
                        : 'bg-zinc-200 dark:bg-zinc-700'
                    )}
                    aria-hidden="true"
                  />
                )}

                {/* Stage indicator (circle) */}
                <StageIndicator status={status} index={index} />

                {/* Stage label */}
                <span
                  className={cn(
                    'text-sm transition-colors duration-200',
                    status === 'complete' && 'text-emerald-600 dark:text-emerald-400',
                    status === 'active' && 'text-zinc-900 dark:text-zinc-100 font-medium',
                    status === 'pending' && 'text-zinc-500 dark:text-zinc-400'
                  )}
                >
                  {stageItem.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Terminal output */}
        <div
          className="bg-zinc-900 rounded-xl overflow-hidden font-mono"
          role="log"
          aria-live="polite"
          aria-label="Deployment logs"
        >
          {/* Terminal header */}
          <div className="flex items-center gap-2 px-4 py-3 bg-zinc-800">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="ml-auto text-xs text-zinc-400 font-sans">
              deploy.log
            </span>
          </div>

          {/* Terminal body */}
          <div
            ref={terminalRef}
            className="px-4 py-4 max-h-[200px] overflow-y-auto text-xs leading-relaxed"
          >
            {logs.map((log, index) => (
              <div
                key={index}
                className={cn(
                  'flex gap-3 mb-1',
                  'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-1 motion-safe:duration-200'
                )}
              >
                <span className="text-zinc-500 flex-shrink-0">{log.time}</span>
                <span
                  className={cn(
                    log.level === 'success' && 'text-emerald-400',
                    log.level === 'error' && 'text-red-400',
                    log.level === 'info' && 'text-zinc-400'
                  )}
                >
                  {log.message}
                </span>
              </div>
            ))}
            {/* Blinking cursor */}
            <span
              className="text-emerald-400 motion-safe:animate-pulse motion-reduce:opacity-100"
              aria-hidden="true"
            >
              _
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StageIndicatorProps {
  status: StageStatus;
  index: number;
}

function StageIndicator({ status, index }: StageIndicatorProps) {
  return (
    <div
      className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center',
        'text-sm font-semibold flex-shrink-0 z-10 transition-all duration-300',
        status === 'pending' && 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 border-2 border-zinc-300 dark:border-zinc-600',
        status === 'active' && 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 motion-safe:animate-pulse',
        status === 'complete' && 'bg-emerald-500 text-white'
      )}
      aria-hidden="true"
    >
      {status === 'complete' ? (
        <Check className="w-4 h-4" />
      ) : status === 'active' ? (
        <span className="w-2 h-2 rounded-full bg-current" />
      ) : (
        index + 1
      )}
    </div>
  );
}
