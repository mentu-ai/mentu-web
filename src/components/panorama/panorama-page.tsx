'use client';

import { useMemo } from 'react';
import { usePanorama } from '@/hooks/usePanorama';
import { ActiveSequencesPanel } from './active-sequences-panel';
import { WorkspaceGrid } from './workspace-grid';
import { CrossWorkspaceFeed } from './cross-workspace-feed';
import { Layers, Activity } from 'lucide-react';

export function PanoramaPage() {
  const { data, isLoading } = usePanorama();

  const workspaceNames = useMemo(() => {
    const map = new Map<string, string>();
    data?.workspaces.forEach((ws) => {
      map.set(ws.workspace_id, ws.name);
    });
    return map;
  }, [data?.workspaces]);

  const activeCount = data?.activeSequences?.length || 0;
  const workspaceCount = data?.workspaces?.length || 0;

  if (isLoading) {
    return (
      <div className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-8">
          <Layers className="h-5 w-5 text-amber-500/70" />
          <h1 className="text-xl font-semibold">Panorama</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers className="h-5 w-5 text-amber-500/70" />
          <div>
            <h1 className="text-xl font-semibold">Panorama</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {workspaceCount} workspace{workspaceCount !== 1 ? 's' : ''}
              {activeCount > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <Activity className="h-3 w-3" />
                  {activeCount} running
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Active sequences — only show if there are any */}
      {activeCount > 0 && (
        <ActiveSequencesPanel sequences={data?.activeSequences || []} />
      )}

      {/* Workspace grid */}
      <div>
        <h2 className="text-xs font-medium tracking-wider text-zinc-400 dark:text-zinc-600 uppercase mb-3">
          Projects
        </h2>
        <WorkspaceGrid workspaces={data?.workspaces || []} />
      </div>

      {/* Activity feed */}
      <CrossWorkspaceFeed workspaceNames={workspaceNames} />
    </div>
  );
}
