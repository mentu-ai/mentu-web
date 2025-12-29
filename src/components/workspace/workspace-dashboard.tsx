'use client';

import { useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { Header } from '@/components/layout/header';
import { useOperations, useRecentOperations } from '@/hooks/useOperations';
import { useBridgeMachines } from '@/hooks/useBridgeMachines';
import { useRealtimeOperations, useRealtimeBridge } from '@/hooks/useRealtime';
import { computeStats } from '@/lib/mentu/state';
import { StatsCards } from './stats-cards';
import { ActivityFeed } from './activity-feed';
import { CaptureMemoryDialog } from '@/components/memory/capture-memory-dialog';
import { CreateCommitmentDialog } from '@/components/commitment/create-commitment-dialog';
import { Target, Brain, CheckCircle, Clock, Terminal, Users } from 'lucide-react';

interface WorkspaceDashboardProps {
  workspaceName: string;
  workspaceId: string;
  user: User;
}

export function WorkspaceDashboard({
  workspaceName,
  workspaceId,
  user,
}: WorkspaceDashboardProps) {
  const [captureOpen, setCaptureOpen] = useState(false);
  const [commitOpen, setCommitOpen] = useState(false);

  // Data fetching
  const { data: operations } = useOperations(workspaceId);
  const { data: recentOps } = useRecentOperations(workspaceId, 10);
  const { data: machines } = useBridgeMachines(workspaceId);

  // Realtime subscriptions
  useRealtimeOperations(workspaceId);
  useRealtimeBridge(workspaceId);

  // Computed stats
  const stats = useMemo(() => {
    if (!operations) return null;
    return computeStats(operations);
  }, [operations]);

  const onlineMachines = machines?.filter(m => m.status === 'online' || m.status === 'busy').length || 0;

  return (
    <div className="flex flex-col h-full">
      <Header
        user={user}
        onCaptureMemory={() => setCaptureOpen(true)}
        onCreateCommitment={() => setCommitOpen(true)}
      />

      <div className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
        <div>
          <h1 className="text-2xl font-bold">{workspaceName}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Workspace Dashboard
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatsCards
            icon={Target}
            label="Open"
            value={stats?.openCount ?? 0}
            variant="open"
          />
          <StatsCards
            icon={Clock}
            label="Claimed"
            value={stats?.claimedCount ?? 0}
            variant="claimed"
          />
          <StatsCards
            icon={CheckCircle}
            label="Closed"
            value={stats?.closedCount ?? 0}
            variant="closed"
          />
          <StatsCards
            icon={CheckCircle}
            label="This Week"
            value={stats?.closedThisWeek ?? 0}
            variant="secondary"
          />
          <StatsCards
            icon={Brain}
            label="Memories"
            value={stats?.totalMemories ?? 0}
            variant="secondary"
          />
          <StatsCards
            icon={Users}
            label="Contributors"
            value={stats?.activeActors?.size ?? 0}
            variant="secondary"
          />
        </div>

        {/* Bridge Status */}
        {machines && machines.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Terminal className="h-4 w-4" />
              <h2 className="font-semibold">Terminal Bridge</h2>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {onlineMachines} of {machines.length} machine{machines.length !== 1 ? 's' : ''} online
            </p>
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
          <h2 className="font-semibold mb-4">Recent Activity</h2>
          <ActivityFeed operations={recentOps || []} workspaceName={workspaceName} />
        </div>
      </div>

      {/* Dialogs */}
      <CaptureMemoryDialog
        open={captureOpen}
        onOpenChange={setCaptureOpen}
        workspaceId={workspaceId}
        user={user}
      />
      <CreateCommitmentDialog
        open={commitOpen}
        onOpenChange={setCommitOpen}
        workspaceId={workspaceId}
        user={user}
      />
    </div>
  );
}
