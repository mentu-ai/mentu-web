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
import { releaseCommitment } from '@/lib/mentu/operations';
import { getActor } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface ReleaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  commitmentId: string;
  user: User;
}

export function ReleaseDialog({
  open,
  onOpenChange,
  workspaceId,
  commitmentId,
  user,
}: ReleaseDialogProps) {
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleRelease = async () => {
    setIsLoading(true);
    try {
      const actor = getActor(user);
      await releaseCommitment(
        workspaceId,
        actor,
        commitmentId,
        reason.trim() || undefined
      );

      await queryClient.invalidateQueries({
        queryKey: ['operations', workspaceId],
      });

      toast({
        title: 'Commitment released',
        description: 'You are no longer responsible for this commitment.',
      });

      setReason('');
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to release commitment',
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
          <DialogTitle>Release Commitment</DialogTitle>
          <DialogDescription>
            This will create a release operation. The commitment will become
            open for others to claim.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              placeholder="Why are you releasing this commitment?"
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
          <Button onClick={handleRelease} disabled={isLoading}>
            {isLoading ? 'Releasing...' : 'Confirm Release'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
