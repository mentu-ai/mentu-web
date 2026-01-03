import Link from 'next/link';
import { relativeTime, absoluteTime } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { OperationRow, CapturePayload, CommitPayload, ClaimPayload, ReleasePayload, ClosePayload, AnnotatePayload } from '@/lib/mentu/types';
import { Camera, Target, Hand, ArrowRightLeft, CheckCircle, MessageSquare, Send, ThumbsUp, RotateCcw, Upload, LucideIcon } from 'lucide-react';

interface ActivityFeedProps {
  operations: OperationRow[];
  workspaceName: string;
}

const opIcons: Record<string, LucideIcon> = {
  capture: Camera,
  commit: Target,
  claim: Hand,
  release: ArrowRightLeft,
  close: CheckCircle,
  annotate: MessageSquare,
  submit: Send,
  approve: ThumbsUp,
  reopen: RotateCcw,
  publish: Upload,
};

const opLabels: Record<string, string> = {
  capture: 'captured a memory',
  commit: 'created a commitment',
  claim: 'claimed a commitment',
  release: 'released a commitment',
  close: 'closed a commitment',
  annotate: 'annotated a record',
  submit: 'submitted for review',
  approve: 'approved a submission',
  reopen: 'reopened a commitment',
  publish: 'published a document',
};

function getOpLink(op: OperationRow, workspaceName: string): string {
  switch (op.op) {
    case 'capture':
      return `/workspace/${workspaceName}/memories/${op.id}`;
    case 'commit':
      return `/workspace/${workspaceName}/commitments/${op.id}`;
    case 'claim':
    case 'release':
    case 'close':
      return `/workspace/${workspaceName}/commitments/${(op.payload as ClaimPayload | ReleasePayload | ClosePayload).commitment}`;
    case 'annotate':
      const target = (op.payload as AnnotatePayload).target;
      if (target.startsWith('mem_')) {
        return `/workspace/${workspaceName}/memories/${target}`;
      }
      return `/workspace/${workspaceName}/commitments/${target}`;
    default:
      return '#';
  }
}

function getOpDescription(op: OperationRow): string {
  switch (op.op) {
    case 'capture':
      return (op.payload as CapturePayload).body.slice(0, 50);
    case 'commit':
      return (op.payload as CommitPayload).body.slice(0, 50);
    case 'claim':
    case 'release':
    case 'close':
      return (op.payload as ClaimPayload).commitment;
    case 'annotate':
      return (op.payload as AnnotatePayload).body.slice(0, 50);
    default:
      return '';
  }
}

export function ActivityFeed({ operations, workspaceName }: ActivityFeedProps) {
  if (operations.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400 py-4 text-center">
        No recent activity
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {operations.map((op) => {
        const Icon = opIcons[op.op];
        const link = getOpLink(op, workspaceName);
        const description = getOpDescription(op);

        return (
          <Link
            key={op.id}
            href={link}
            className="flex items-start gap-3 p-2 -mx-2 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <div className="mt-0.5">
              <Icon className="h-4 w-4 text-zinc-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium">{op.actor}</span>{' '}
                <span className="text-zinc-500 dark:text-zinc-400">{opLabels[op.op]}</span>
              </p>
              {description && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                  {description}
                </p>
              )}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-zinc-400 dark:text-zinc-500 shrink-0">
                  {relativeTime(op.ts)}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {absoluteTime(op.ts)}
              </TooltipContent>
            </Tooltip>
          </Link>
        );
      })}
    </div>
  );
}
