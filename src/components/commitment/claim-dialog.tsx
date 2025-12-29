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
import { useQueryClient } from '@tanstack/react-query';
import { claimCommitment } from '@/lib/mentu/operations';
import { getActor } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface ClaimDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  commitmentId: string;
  user: User;
}

export function ClaimDialog({
  open,
  onOpenChange,
  workspaceId,
  commitmentId,
  user,
}: ClaimDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleClaim = async () => {
    setIsLoading(true);
    try {
      const actor = getActor(user);
      await claimCommitment(workspaceId, actor, commitmentId);

      await queryClient.invalidateQueries({
        queryKey: ['operations', workspaceId],
      });

      toast({
        title: 'Commitment claimed',
        description: 'You are now responsible for this commitment.',
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to claim commitment',
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
          <DialogTitle>Claim Commitment</DialogTitle>
          <DialogDescription>
            This will create a claim operation. You will become responsible for
            this commitment.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-zinc-500">
            This will create the following operation:
          </p>
          <pre className="mt-2 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-md text-xs overflow-auto">
{JSON.stringify(
  {
    op: 'claim',
    payload: {
      commitment: commitmentId,
    },
  },
  null,
  2
)}
          </pre>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleClaim} disabled={isLoading}>
            {isLoading ? 'Claiming...' : 'Confirm Claim'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
