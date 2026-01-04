'use client';

import { useState, useMemo } from 'react';
import type { User } from '@supabase/supabase-js';
import { Header } from '@/components/layout/header';
import { useKanbanCommitments } from '@/hooks/useKanbanCommitments';
import { useRealtimeOperations } from '@/hooks/useRealtime';
import { useBridgeCommands } from '@/hooks/useBridgeCommands';
import { KanbanBoard } from './KanbanBoard';
import { CommitmentPanel } from './CommitmentPanel';
import { CaptureMemoryDialog } from '@/components/memory/capture-memory-dialog';
import { CreateCommitmentDialog } from '@/components/commitment/create-commitment-dialog';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface KanbanPageProps {
  workspaceName: string;
  workspaceId: string;
  user: User;
}

export function KanbanPage({ workspaceName, workspaceId, user }: KanbanPageProps) {
  const [captureOpen, setCaptureOpen] = useState(false);
  const [commitOpen, setCommitOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { columns, counts, isLoading } = useKanbanCommitments(workspaceId);
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
      <Header
        user={user}
        onCaptureMemory={() => setCaptureOpen(true)}
        onCreateCommitment={() => setCommitOpen(true)}
      />

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
          user={user}
        />
      </div>

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
