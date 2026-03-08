'use client';

import Link from 'next/link';
import { relativeTime } from '@/lib/utils';
import type { PanoramaSequence } from '@/lib/mentu/types';
import { Play, Clock, ChevronRight } from 'lucide-react';

interface ActiveSequencesPanelProps {
  sequences: (PanoramaSequence & { workspace_name: string })[];
}

export function ActiveSequencesPanel({ sequences }: ActiveSequencesPanelProps) {
  if (sequences.length === 0) return null;

  const running = sequences.filter(s => s.state === 'running' || s.state === 'active');
  const scheduled = sequences.filter(
    s => s.state === 'pending' && s.scheduled_start_at && new Date(s.scheduled_start_at) > new Date()
  );

  return (
    <div className="space-y-4">
      {/* Running Now */}
      {running.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-medium tracking-wider text-zinc-400 dark:text-zinc-600 uppercase flex items-center gap-1.5">
            <Play className="h-3 w-3 text-blue-500" />
            Running Now
          </h2>
          <div className="space-y-2">
            {running.map((seq) => {
              const progress = seq.total_steps > 0
                ? Math.round((seq.completed_steps / seq.total_steps) * 100)
                : 0;

              return (
                <Link
                  key={seq.instance_id}
                  href={`/workspace/${seq.workspace_name}/sequences/${seq.instance_id}`}
                  className="group flex items-center gap-4 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                >
                  {/* Pulse indicator */}
                  <div className="shrink-0">
                    <div className="relative h-2 w-2">
                      <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-40" />
                      <div className="absolute inset-0 rounded-full bg-blue-500" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                        {seq.workspace_name}
                      </span>
                      <span className="text-sm font-medium truncate">{seq.name}</span>
                    </div>

                    {/* Progress bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-500 dark:bg-blue-400 transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 shrink-0">
                        {seq.completed_steps}/{seq.total_steps}
                      </span>
                    </div>
                  </div>

                  {/* Time + arrow */}
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                      {relativeTime(seq.started_at)}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-300 dark:text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Scheduled */}
      {scheduled.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-medium tracking-wider text-zinc-400 dark:text-zinc-600 uppercase flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-amber-500" />
            Scheduled
          </h2>
          <div className="space-y-2">
            {scheduled.map((seq) => (
              <Link
                key={seq.instance_id}
                href={`/workspace/${seq.workspace_name}/sequences/${seq.instance_id}`}
                className="group flex items-center gap-4 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
              >
                {/* Static amber dot */}
                <div className="shrink-0">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                      {seq.workspace_name}
                    </span>
                    <span className="text-sm font-medium truncate">{seq.name}</span>
                  </div>
                </div>

                {/* Scheduled time + arrow */}
                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-[11px] text-amber-500 dark:text-amber-400">
                    {relativeTime(seq.scheduled_start_at!)}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-zinc-300 dark:text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
