import Link from 'next/link';
import { relativeTime, absoluteTime } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { OperationRow, CommitPayload, ReleasePayload, ClosePayload, AnnotatePayload } from '@/lib/mentu/types';
import { Target, Hand, ArrowRightLeft, CheckCircle, MessageSquare } from 'lucide-react';

interface CommitmentTimelineProps {
  operations: OperationRow[];
  workspaceName: string;
}

const opConfig: Record<string, { icon: typeof Target; label: string; color: string }> = {
  commit: { icon: Target, label: 'Created', color: 'text-purple-600' },
  claim: { icon: Hand, label: 'Claimed', color: 'text-blue-600' },
  release: { icon: ArrowRightLeft, label: 'Released', color: 'text-zinc-600' },
  close: { icon: CheckCircle, label: 'Closed', color: 'text-green-600' },
  annotate: { icon: MessageSquare, label: 'Annotated', color: 'text-zinc-600' },
};

function getOpDetails(op: OperationRow): string | null {
  switch (op.op) {
    case 'commit':
      return (op.payload as CommitPayload).body;
    case 'release':
      return (op.payload as ReleasePayload).reason || null;
    case 'close':
      return `Evidence: ${(op.payload as ClosePayload).evidence}`;
    case 'annotate':
      return (op.payload as AnnotatePayload).body;
    default:
      return null;
  }
}

export function CommitmentTimeline({ operations, workspaceName }: CommitmentTimelineProps) {
  if (operations.length === 0) {
    return (
      <p className="text-sm text-zinc-500 text-center py-4">No events yet</p>
    );
  }

  return (
    <div className="space-y-4">
      {operations.map((op, index) => {
        const config = opConfig[op.op];
        if (!config) return null;

        const Icon = config.icon;
        const details = getOpDetails(op);
        const isLast = index === operations.length - 1;

        return (
          <div key={op.id} className="relative flex gap-4">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-zinc-200 dark:bg-zinc-800" />
            )}

            {/* Icon */}
            <div className={`relative z-10 h-6 w-6 rounded-full bg-white dark:bg-zinc-950 flex items-center justify-center ring-4 ring-white dark:ring-zinc-950 ${config.color}`}>
              <Icon className="h-3 w-3" />
            </div>

            {/* Content */}
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{config.label}</span>
                <span className="text-zinc-500">by</span>
                <Link
                  href={`/workspace/${workspaceName}/actors/${op.actor}`}
                  className="font-medium hover:underline"
                >
                  {op.actor}
                </Link>
                <Tooltip>
                  <TooltipTrigger>
                    <span className="text-sm text-zinc-400">
                      {relativeTime(op.ts)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{absoluteTime(op.ts)}</TooltipContent>
                </Tooltip>
              </div>

              {details && (
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {op.op === 'close' ? (
                    <Link
                      href={`/workspace/${workspaceName}/memories/${(op.payload as ClosePayload).evidence}`}
                      className="font-mono text-xs hover:underline"
                    >
                      {details}
                    </Link>
                  ) : (
                    details
                  )}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
