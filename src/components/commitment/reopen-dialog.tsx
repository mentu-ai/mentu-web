'use client';

import { useState } from 'react';
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
import { useQueryClient } from '@tanstack/react-query';
import { reopenCommitment } from '@/lib/mentu/operations';
import { getActor } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import type { CommitmentState } from '@/lib/mentu/types';

interface ReopenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  commitmentId: string;
  currentState: CommitmentState;
  user: User;
}

export function ReopenDialog({
  open,
  onOpenChange,
  workspaceId,
  commitmentId,
  currentState,
  user,
}: ReopenDialogProps) {
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleReopen = async () => {
    if (!reason.trim()) return;

    setIsLoading(true);
    try {
      const actor = getActor(user);
      await reopenCommitment(
        workspaceId,
        actor,
        commitmentId,
        reason.trim(),
        currentState
      );

      await queryClient.invalidateQueries({
        queryKey: ['operations', workspaceId],
      });

      toast({
        title: 'Commitment reopened',
        description: 'The commitment has been reopened.',
      });

      setReason('');
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reopen commitment',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reopen Commitment</DialogTitle>
          <DialogDescription>
            This will create a reopen operation, moving the commitment from{' '}
            <strong>{currentState}</strong> back to an open state.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (required)</Label>
            <Textarea
              id="reason"
              placeholder="Why is this commitment being reopened?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReopen}
            disabled={isLoading || !reason.trim()}
          >
            {isLoading ? 'Reopening...' : 'Confirm Reopen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
