'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { Commitment } from '@/lib/mentu/types';
import { GitPullRequest, Loader2, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CreatePRButtonProps {
  commitment: Commitment;
  workspaceId: string;
  hasWorktree?: boolean;
}

export function CreatePRButton({
  commitment,
  workspaceId,
  hasWorktree,
}: CreatePRButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [prUrl, setPrUrl] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState(() => {
    // Auto-generate title from commitment body
    const truncated = commitment.body.length > 50
      ? commitment.body.slice(0, 50) + '...'
      : commitment.body;
    return `${truncated} (${commitment.id})`;
  });
  const [description, setDescription] = useState(commitment.body);
  const [baseBranch, setBaseBranch] = useState('main');

  // Only show for commitments with worktrees that haven't been merged
  if (!hasWorktree || commitment.state === 'closed') {
    return null;
  }

  // Check if PR already exists (via external_ref annotation)
  const existingPr = commitment.annotations?.find(
    (a) => a.kind === 'external_ref' && a.body.includes('github')
  );

  if (existingPr) {
    // Show link to existing PR
    return (
      <Button
        variant="outline"
        size="sm"
        asChild
        className="gap-1"
      >
        <a
          href={existingPr.body}
          target="_blank"
          rel="noopener noreferrer"
        >
          <GitPullRequest className="h-3 w-3" />
          View PR
          <ExternalLink className="h-3 w-3" />
        </a>
      </Button>
    );
  }

  const handleCreate = async () => {
    setIsCreating(true);

    try {
      const response = await fetch('/api/bridge/create-pr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspace_id: workspaceId,
          commitment_id: commitment.id,
          title,
          description,
          base_branch: baseBranch,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create PR');
      }

      const data = await response.json();
      setPrUrl(data.url);
    } catch (error) {
      console.error('Create PR error:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-1"
      >
        <GitPullRequest className="h-3 w-3" />
        Create PR
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create GitHub Pull Request</DialogTitle>
            <DialogDescription>
              Create a pull request for this commitment
            </DialogDescription>
          </DialogHeader>

          {prUrl ? (
            <div className="py-4 space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                <GitPullRequest className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700 dark:text-green-300">
                  PR created successfully!
                </span>
              </div>
              <a
                href={prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                <span className="text-sm font-medium">{prUrl}</span>
                <ExternalLink className="h-4 w-4" />
              </a>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setIsOpen(false);
                  setPrUrl(null);
                }}
              >
                Close
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="PR title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="PR description"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="base">Base Branch</Label>
                <Select value={baseBranch} onValueChange={setBaseBranch}>
                  <SelectTrigger id="base">
                    <SelectValue placeholder="Select base branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">main</SelectItem>
                    <SelectItem value="develop">develop</SelectItem>
                    <SelectItem value="staging">staging</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {!prUrl && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isCreating || !title}>
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <GitPullRequest className="h-4 w-4 mr-2" />
                    Create PR
                  </>
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
