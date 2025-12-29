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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQueryClient } from '@tanstack/react-query';
import { useMemories } from '@/hooks/useMemories';
import { createCommitment } from '@/lib/mentu/operations';
import { getActor } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface CreateCommitmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  user: User;
  defaultSourceId?: string;
}

export function CreateCommitmentDialog({
  open,
  onOpenChange,
  workspaceId,
  user,
  defaultSourceId,
}: CreateCommitmentDialogProps) {
  const [body, setBody] = useState('');
  const [sourceId, setSourceId] = useState(defaultSourceId || '');
  const [tags, setTags] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const { memories } = useMemories(workspaceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || !sourceId) return;

    setIsLoading(true);
    try {
      const actor = getActor(user);
      const tagList = tags.trim()
        ? tags.split(',').map(t => t.trim()).filter(Boolean)
        : undefined;

      await createCommitment(workspaceId, actor, body.trim(), sourceId, {
        tags: tagList,
      });

      // Refresh data
      await queryClient.invalidateQueries({
        queryKey: ['operations', workspaceId],
      });

      toast({
        title: 'Commitment created',
        description: 'Your commitment has been recorded.',
      });

      // Reset form
      setBody('');
      setSourceId('');
      setTags('');
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create commitment',
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
          <DialogTitle>Create Commitment</DialogTitle>
          <DialogDescription>
            Create an obligation that traces to a source memory.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="source">Source Memory *</Label>
            <Select value={sourceId} onValueChange={setSourceId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a memory" />
              </SelectTrigger>
              <SelectContent>
                {memories.map((memory) => (
                  <SelectItem key={memory.id} value={memory.id}>
                    <div className="flex flex-col">
                      <span className="font-mono text-xs">{memory.id}</span>
                      <span className="text-sm truncate max-w-[250px]">
                        {memory.body.slice(0, 40)}
                        {memory.body.length > 40 ? '...' : ''}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-zinc-500">
              Every commitment must reference a source memory.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Commitment *</Label>
            <Textarea
              id="body"
              placeholder="What are you committing to?"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (optional)</Label>
            <Input
              id="tags"
              placeholder="e.g., bug, feature, urgent (comma-separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
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
            <Button
              type="submit"
              disabled={isLoading || !body.trim() || !sourceId}
            >
              {isLoading ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
