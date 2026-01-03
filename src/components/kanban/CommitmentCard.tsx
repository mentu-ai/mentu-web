'use client';

import type { Commitment } from '@/lib/mentu/types';
import { Badge } from '@/components/ui/badge';
import { relativeTime, absoluteTime } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TreeDeciduous, GitPullRequest, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommitmentCardProps {
  commitment: Commitment;
  onClick: () => void;
  isSelected?: boolean;
}

export function CommitmentCard({ commitment, onClick, isSelected }: CommitmentCardProps) {
  const hasWorktree = commitment.state === 'claimed' || commitment.state === 'in_review' || commitment.state === 'reopened';

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left bg-white dark:bg-zinc-900 border rounded-lg p-3 transition-all',
        'hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-sm',
        isSelected
          ? 'border-blue-500 dark:border-blue-400 ring-1 ring-blue-500 dark:ring-blue-400'
          : 'border-zinc-200 dark:border-zinc-800'
      )}
    >
      {/* Title */}
      <p className="font-medium text-sm line-clamp-2 mb-2">
        {commitment.body}
      </p>

      {/* Tags */}
      {commitment.tags && commitment.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {commitment.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs py-0 px-1.5">
              {tag}
            </Badge>
          ))}
          {commitment.tags.length > 3 && (
            <Badge variant="outline" className="text-xs py-0 px-1.5">
              +{commitment.tags.length - 3}
            </Badge>
          )}
        </div>
      )}

      {/* Meta info row */}
      <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        {/* Worktree indicator */}
        {hasWorktree && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-0.5 text-green-600 dark:text-green-400">
                <TreeDeciduous className="h-3 w-3" />
              </span>
            </TooltipTrigger>
            <TooltipContent>Active worktree</TooltipContent>
          </Tooltip>
        )}

        {/* PR indicator (placeholder - would need external ref) */}
        {commitment.annotations?.some(a => a.kind === 'external_ref') && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-0.5 text-purple-600 dark:text-purple-400">
                <GitPullRequest className="h-3 w-3" />
              </span>
            </TooltipTrigger>
            <TooltipContent>PR linked</TooltipContent>
          </Tooltip>
        )}

        {/* Owner */}
        {commitment.owner && (
          <span className="flex items-center gap-0.5">
            <User className="h-3 w-3" />
            <span className="truncate max-w-[80px]">{commitment.owner}</span>
          </span>
        )}

        {/* Age */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="ml-auto">{relativeTime(commitment.ts)}</span>
          </TooltipTrigger>
          <TooltipContent>{absoluteTime(commitment.ts)}</TooltipContent>
        </Tooltip>
      </div>
    </button>
  );
}
