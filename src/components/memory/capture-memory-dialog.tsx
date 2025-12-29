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
import { Input } from '@/components/ui/input';
import { useQueryClient } from '@tanstack/react-query';
import { captureMemory } from '@/lib/mentu/operations';
import { getActor } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface CaptureMemoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  user: User;
}

export function CaptureMemoryDialog({
  open,
  onOpenChange,
  workspaceId,
  user,
}: CaptureMemoryDialogProps) {
  const [body, setBody] = useState('');
  const [kind, setKind] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    setIsLoading(true);
    try {
      const actor = getActor(user);
      await captureMemory(workspaceId, actor, body.trim(), {
        kind: kind.trim() || undefined,
      });

      // Refresh data
      await queryClient.invalidateQueries({
        queryKey: ['operations', workspaceId],
      });

      toast({
        title: 'Memory captured',
        description: 'Your observation has been recorded.',
      });

      // Reset form
      setBody('');
      setKind('');
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to capture memory',
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
          <DialogTitle>Capture Memory</DialogTitle>
          <DialogDescription>
            Record an observation. This will create a capture operation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="body">Observation</Label>
            <Textarea
              id="body"
              placeholder="What did you observe?"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="kind">Kind (optional)</Label>
            <Input
              id="kind"
              placeholder="e.g., observation, evidence, note"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !body.trim()}>
              {isLoading ? 'Capturing...' : 'Capture'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
