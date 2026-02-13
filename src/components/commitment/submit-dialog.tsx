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
import { submitCommitment } from '@/lib/mentu/operations';
import { getActor } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface SubmitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  commitmentId: string;
  user: User;
}

export function SubmitDialog({
  open,
  onOpenChange,
  workspaceId,
  commitmentId,
  user,
}: SubmitDialogProps) {
  const [summary, setSummary] = useState('');
  const [evidenceIds, setEvidenceIds] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const actor = getActor(user);
      const evidence = evidenceIds
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);

      await submitCommitment(workspaceId, actor, commitmentId, {
        evidence: evidence.length > 0 ? evidence : undefined,
        summary: summary.trim() || undefined,
      });

      await queryClient.invalidateQueries({
        queryKey: ['operations', workspaceId],
      });

      toast({
        title: 'Commitment submitted',
        description: 'The commitment has been submitted for review.',
      });

      setSummary('');
      setEvidenceIds('');
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit commitment',
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
          <DialogTitle>Submit for Review</DialogTitle>
          <DialogDescription>
            This will create a submit operation, moving the commitment to review.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="summary">Summary (optional)</Label>
            <Textarea
              id="summary"
              placeholder="Brief summary of what was done..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="evidenceIds">Evidence IDs (optional)</Label>
            <Textarea
              id="evidenceIds"
              placeholder="Comma-separated memory IDs, e.g. mem_abc, mem_def"
              value={evidenceIds}
              onChange={(e) => setEvidenceIds(e.target.value)}
              rows={2}
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
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Submitting...' : 'Confirm Submit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
