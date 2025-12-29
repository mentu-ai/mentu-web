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
import { annotateRecord } from '@/lib/mentu/operations';
import { getActor } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface AnnotateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  targetId: string;
  user: User;
}

export function AnnotateDialog({
  open,
  onOpenChange,
  workspaceId,
  targetId,
  user,
}: AnnotateDialogProps) {
  const [body, setBody] = useState('');
  const [kind, setKind] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleAnnotate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    setIsLoading(true);
    try {
      const actor = getActor(user);
      await annotateRecord(workspaceId, actor, targetId, body.trim(), {
        kind: kind.trim() || undefined,
      });

      await queryClient.invalidateQueries({
        queryKey: ['operations', workspaceId],
      });

      toast({
        title: 'Annotation added',
        description: 'Your note has been attached.',
      });

      setBody('');
      setKind('');
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to annotate',
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
          <DialogTitle>Add Annotation</DialogTitle>
          <DialogDescription>
            Attach a note to this record. This will create an annotate operation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAnnotate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="body">Note</Label>
            <Textarea
              id="body"
              placeholder="Your annotation..."
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
              placeholder="e.g., comment, update, blocker"
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
              {isLoading ? 'Adding...' : 'Add Annotation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
