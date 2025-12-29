'use client';

import { useState, useMemo } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQueryClient } from '@tanstack/react-query';
import { useMemories } from '@/hooks/useMemories';
import { captureMemory, closeCommitment } from '@/lib/mentu/operations';
import { getActor, relativeTime } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, Search, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CloseWithEvidenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  commitmentId: string;
  user: User;
}

/**
 * SACRED INVARIANT: Commitments cannot be closed without evidence.
 *
 * This dialog enforces the core constraint of the Mentu protocol.
 * The Close button is DISABLED until evidence is selected or created.
 * There is no workaround. This is intentional.
 */
export function CloseWithEvidenceDialog({
  open,
  onOpenChange,
  workspaceId,
  commitmentId,
  user,
}: CloseWithEvidenceDialogProps) {
  const [mode, setMode] = useState<'select' | 'create'>('select');
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newEvidenceBody, setNewEvidenceBody] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const { memories } = useMemories(workspaceId);

  // Filter memories for evidence selection
  const filteredMemories = useMemo(() => {
    let filtered = memories;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.body.toLowerCase().includes(query) ||
          m.id.toLowerCase().includes(query) ||
          m.kind?.toLowerCase().includes(query)
      );
    }

    // Sort by newest first
    return [...filtered].sort(
      (a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()
    );
  }, [memories, searchQuery]);

  // SACRED INVARIANT: Evidence is required
  const hasEvidence =
    mode === 'select' ? selectedEvidenceId !== null : newEvidenceBody.trim().length > 0;

  const handleClose = async () => {
    // SACRED INVARIANT: Cannot proceed without evidence
    if (!hasEvidence) {
      toast({
        title: 'Evidence Required',
        description: 'You must provide evidence to close this commitment.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const actor = getActor(user);
      let evidenceId: string;

      if (mode === 'create') {
        // Create new evidence memory first
        const evidenceOp = await captureMemory(
          workspaceId,
          actor,
          newEvidenceBody.trim(),
          { kind: 'evidence' }
        );
        evidenceId = evidenceOp.id;
      } else {
        evidenceId = selectedEvidenceId!;
      }

      // Close the commitment with evidence
      await closeCommitment(workspaceId, actor, commitmentId, evidenceId);

      await queryClient.invalidateQueries({
        queryKey: ['operations', workspaceId],
      });

      toast({
        title: 'Commitment closed',
        description: 'The commitment has been closed with evidence.',
      });

      // Reset form
      setSelectedEvidenceId(null);
      setNewEvidenceBody('');
      setSearchQuery('');
      setMode('select');
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to close commitment',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset state when closing
      setSelectedEvidenceId(null);
      setNewEvidenceBody('');
      setSearchQuery('');
      setMode('select');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Close Commitment with Evidence
          </DialogTitle>
          <DialogDescription>
            <span className="flex items-center gap-2 mt-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              Evidence is required. This is the core constraint of Mentu.
            </span>
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="select">Select Existing</TabsTrigger>
            <TabsTrigger value="create">Capture New</TabsTrigger>
          </TabsList>

          <TabsContent value="select" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search memories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-64 border border-zinc-200 dark:border-zinc-800 rounded-md">
              <div className="p-2 space-y-1">
                {filteredMemories.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-4">
                    No memories found
                  </p>
                ) : (
                  filteredMemories.map((memory) => (
                    <button
                      key={memory.id}
                      type="button"
                      onClick={() => setSelectedEvidenceId(memory.id)}
                      className={cn(
                        'w-full text-left p-3 rounded-md transition-colors',
                        selectedEvidenceId === memory.id
                          ? 'bg-green-100 dark:bg-green-900 border border-green-500'
                          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <code className="text-xs text-zinc-500 font-mono">
                            {memory.id}
                          </code>
                          {memory.kind && (
                            <span className="ml-2 text-xs px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700">
                              {memory.kind}
                            </span>
                          )}
                          <p className="text-sm mt-1 truncate">{memory.body}</p>
                        </div>
                        <span className="text-xs text-zinc-400 shrink-0">
                          {relativeTime(memory.ts)}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>

            {selectedEvidenceId && (
              <p className="text-sm text-green-600 dark:text-green-400">
                Selected: <code className="font-mono">{selectedEvidenceId}</code>
              </p>
            )}
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="evidence">Evidence Description</Label>
              <Textarea
                id="evidence"
                placeholder="Describe what was done. Link to artifacts, PRs, or screenshots..."
                value={newEvidenceBody}
                onChange={(e) => setNewEvidenceBody(e.target.value)}
                rows={6}
              />
              <p className="text-xs text-zinc-500">
                This will create a new memory with kind &quot;evidence&quot;.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleClose}
            disabled={isLoading || !hasEvidence}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? 'Closing...' : 'Close'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
