'use client';

import { useState, useMemo } from 'react';
import { useKanbanCommitments } from '@/hooks/useKanbanCommitments';
import { useRealtimeOperations } from '@/hooks/useRealtime';
import { useBridgeCommands } from '@/hooks/useBridgeCommands';
import { KanbanBoard } from './KanbanBoard';
import { CommitmentPanel } from './CommitmentPanel';
import { CloudTerminal } from '@/components/terminal/CloudTerminal';
import { Search, X, Bug, RefreshCcw, Terminal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface KanbanPageProps {
  workspaceName: string;
  workspaceId: string;
}

export function KanbanPage({ workspaceName, workspaceId }: KanbanPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDebug, setShowDebug] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);

  const { columns, counts, operationStats, isLoading, refetch } = useKanbanCommitments(workspaceId);
  const { data: bridgeCommands } = useBridgeCommands(workspaceId);
  useRealtimeOperations(workspaceId);

  // Compute running commitment IDs from bridge commands
  const runningCommitmentIds = useMemo(() => {
    if (!bridgeCommands) return [];
    return bridgeCommands
      .filter(cmd => cmd.status === 'running' || cmd.status === 'pending')
      .filter(cmd => cmd.commitment_id)
      .map(cmd => cmd.commitment_id as string);
  }, [bridgeCommands]);

  // Filter commitments by search query
  const filteredColumns = searchQuery
    ? {
        todo: columns.todo.filter((c) =>
          c.body.toLowerCase().includes(searchQuery.toLowerCase())
        ),
        in_progress: columns.in_progress.filter((c) =>
          c.body.toLowerCase().includes(searchQuery.toLowerCase())
        ),
        in_review: columns.in_review.filter((c) =>
          c.body.toLowerCase().includes(searchQuery.toLowerCase())
        ),
        done: columns.done.filter((c) =>
          c.body.toLowerCase().includes(searchQuery.toLowerCase())
        ),
        cancelled: columns.cancelled.filter((c) =>
          c.body.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      }
    : columns;

  const handleCardClick = (id: string) => {
    setSelectedId(selectedId === id ? null : id);
  };

  const handleClosePanel = () => {
    setSelectedId(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex overflow-hidden">
        {/* Main board area */}
        <div
          className={cn(
            'flex-1 p-4 md:p-6 overflow-auto transition-all duration-200',
            selectedId ? 'pr-0 md:pr-[400px]' : ''
          )}
        >
          {/* Header row with search */}
          <div className="flex items-center justify-between mb-4 gap-4">
            <div>
              <h1 className="text-2xl font-bold">Kanban</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {counts.total} commitments
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => refetch()}
                title="Refresh data"
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDebug(!showDebug)}
                title="Toggle debug info"
              >
                <Bug className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowTerminal(!showTerminal)}
                title="Toggle cloud terminal"
                className={showTerminal ? 'bg-zinc-200 dark:bg-zinc-700' : ''}
              >
                <Terminal className="h-4 w-4" />
              </Button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px] md:w-[280px]"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Debug panel */}
          {showDebug && (
            <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm font-mono">
              <div className="font-bold mb-2">Debug Info</div>

              {/* Operations stats */}
              {operationStats && (
                <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <div className="font-bold text-blue-700 dark:text-blue-300">Operations Fetched</div>
                  <div>Total: {operationStats.total}</div>
                  <div>commit ops: {operationStats.commitCount} | submit ops: {operationStats.submitCount}</div>
                  <div className="text-xs mt-1">
                    {Object.entries(operationStats.breakdown).map(([op, count]) => `${op}:${count}`).join(' | ')}
                  </div>
                </div>
              )}

              {/* Commitment counts */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <div>todo: {counts.todo}</div>
                <div>in_progress: {counts.in_progress}</div>
                <div className="font-bold text-yellow-700 dark:text-yellow-300">in_review: {counts.in_review}</div>
                <div>done: {counts.done}</div>
                <div>cancelled: {counts.cancelled}</div>
              </div>
              <div className="mt-2 text-xs text-zinc-500">
                workspaceId: {workspaceId}
              </div>
              <div className="text-xs text-zinc-500">
                In Review Items: {columns.in_review.map(c => c.id).join(', ') || 'none'}
              </div>
            </div>
          )}

          {/* Cloud Terminal panel */}
          {showTerminal && (
            <div className="mb-4 rounded-lg overflow-hidden border border-zinc-700">
              <CloudTerminal />
            </div>
          )}

          {/* Loading state */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-pulse text-zinc-500">Loading...</div>
            </div>
          ) : (
            <KanbanBoard
              columns={filteredColumns}
              selectedId={selectedId}
              onCardClick={handleCardClick}
              runningCommitmentIds={runningCommitmentIds}
            />
          )}
        </div>

        {/* Slide-in panel */}
        <CommitmentPanel
          commitmentId={selectedId}
          onClose={handleClosePanel}
          workspaceName={workspaceName}
          workspaceId={workspaceId}
        />
      </div>
    </div>
  );
}
