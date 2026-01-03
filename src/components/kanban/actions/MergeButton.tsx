'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Commitment } from '@/lib/mentu/types';
import { GitMerge, Loader2, Check } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/dialog';

interface MergeButtonProps {
  commitment: Commitment;
  workspaceId: string;
}

export function MergeButton({ commitment, workspaceId }: MergeButtonProps) {
  const [isMerging, setIsMerging] = useState(false);
  const [isMerged, setIsMerged] = useState(false);

  // Only show for in_review commitments
  if (commitment.state !== 'in_review') {
    return null;
  }

  const handleMerge = async () => {
    setIsMerging(true);

    try {
      const response = await fetch('/api/bridge/merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspace_id: workspaceId,
          commitment_id: commitment.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to merge');
      }

      setIsMerged(true);
    } catch (error) {
      console.error('Merge error:', error);
    } finally {
      setIsMerging(false);
    }
  };

  if (isMerged) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-1">
        <Check className="h-3 w-3 text-green-500" />
        Merged
      </Button>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="default" size="sm" className="gap-1">
          <GitMerge className="h-3 w-3" />
          Merge
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Merge to main?</AlertDialogTitle>
          <AlertDialogDescription>
            This will squash merge the branch for commitment {commitment.id} into main.
            The worktree will be cleaned up and the commitment will be closed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleMerge} disabled={isMerging}>
            {isMerging ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Merging...
              </>
            ) : (
              <>
                <GitMerge className="h-4 w-4 mr-2" />
                Merge
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
