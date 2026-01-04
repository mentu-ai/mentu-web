'use client';

import { useState } from 'react';
import { useDiff, useDiffApiStatus } from '@/hooks/useDiff';
import type { DiffFile, DiffChangeKind } from '@/types/diff';
import { cn } from '@/lib/utils';
import {
  FileText,
  FilePlus,
  FileMinus,
  FileEdit,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  RefreshCw,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Icon for file change kind.
 */
function FileChangeIcon({ kind }: { kind: DiffChangeKind }) {
  switch (kind) {
    case 'added':
      return <FilePlus className="h-4 w-4 text-green-500" />;
    case 'deleted':
      return <FileMinus className="h-4 w-4 text-red-500" />;
    case 'modified':
      return <FileEdit className="h-4 w-4 text-yellow-500" />;
    case 'renamed':
    case 'copied':
      return <FileText className="h-4 w-4 text-blue-500" />;
    default:
      return <FileText className="h-4 w-4 text-zinc-500" />;
  }
}

/**
 * Badge for file change kind.
 */
function FileChangeBadge({ kind }: { kind: DiffChangeKind }) {
  const variants: Record<DiffChangeKind, { bg: string; text: string }> = {
    added: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-700 dark:text-green-300' },
    deleted: { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-700 dark:text-red-300' },
    modified: { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-700 dark:text-yellow-300' },
    renamed: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-700 dark:text-blue-300' },
    copied: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-700 dark:text-blue-300' },
    permission_change: { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-700 dark:text-zinc-300' },
  };
  const v = variants[kind];
  return (
    <span className={cn('px-1.5 py-0.5 text-xs font-medium rounded', v.bg, v.text)}>
      {kind}
    </span>
  );
}

/**
 * Header showing diff summary stats.
 */
function DiffHeader({
  additions,
  deletions,
  fileCount,
  onRefresh,
  isRefreshing,
}: {
  additions: number;
  deletions: number;
  fileCount: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 mb-4 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {fileCount} {fileCount === 1 ? 'file' : 'files'} changed
        </span>
        <div className="flex items-center gap-2 text-sm">
          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <Plus className="h-3 w-3" />
            {additions}
          </span>
          <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
            <Minus className="h-3 w-3" />
            {deletions}
          </span>
        </div>
      </div>
      {onRefresh && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-8 px-2"
        >
          <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
        </Button>
      )}
    </div>
  );
}

/**
 * Render a line from unified diff with appropriate styling.
 */
function DiffLine({ line }: { line: string }) {
  if (line.startsWith('+') && !line.startsWith('+++')) {
    return (
      <div className="bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300">
        {line}
      </div>
    );
  }
  if (line.startsWith('-') && !line.startsWith('---')) {
    return (
      <div className="bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300">
        {line}
      </div>
    );
  }
  if (line.startsWith('@@')) {
    return (
      <div className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-medium">
        {line}
      </div>
    );
  }
  if (line.startsWith('diff ') || line.startsWith('index ') || line.startsWith('---') || line.startsWith('+++')) {
    return (
      <div className="text-zinc-500 dark:text-zinc-400">
        {line}
      </div>
    );
  }
  return <div>{line}</div>;
}

/**
 * Single file diff display.
 */
function FileDiff({
  file,
  defaultExpanded = true,
  onRevert,
}: {
  file: DiffFile;
  defaultExpanded?: boolean;
  onRevert?: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [isReverting, setIsReverting] = useState(false);

  const handleRevert = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onRevert) return;

    setIsReverting(true);
    try {
      await onRevert(file.path);
    } finally {
      setIsReverting(false);
    }
  };

  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden mb-3">
      {/* File header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-zinc-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-zinc-500" />
        )}
        <FileChangeIcon kind={file.kind} />
        <span className="flex-1 text-left text-sm font-mono truncate">
          {file.old_path && file.kind === 'renamed' ? (
            <>
              <span className="text-zinc-500">{file.old_path}</span>
              <span className="text-zinc-400 mx-1">→</span>
              <span>{file.path}</span>
            </>
          ) : (
            file.path
          )}
        </span>
        <FileChangeBadge kind={file.kind} />
        {onRevert && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRevert}
            disabled={isReverting}
            className="h-6 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
            title="Revert this file"
          >
            <Trash2 className={cn('h-3 w-3', isReverting && 'animate-pulse')} />
          </Button>
        )}
        <div className="flex items-center gap-2 text-xs ml-2">
          {file.additions > 0 && (
            <span className="text-green-600 dark:text-green-400">+{file.additions}</span>
          )}
          {file.deletions > 0 && (
            <span className="text-red-600 dark:text-red-400">-{file.deletions}</span>
          )}
        </div>
      </button>

      {/* File content */}
      {expanded && (
        <div className="border-t border-zinc-200 dark:border-zinc-700">
          {file.content_omitted ? (
            <div className="p-4 text-center text-sm text-zinc-500">
              <AlertCircle className="h-5 w-5 mx-auto mb-2" />
              File too large to display (content omitted)
            </div>
          ) : file.content ? (
            <pre className="p-3 text-xs font-mono overflow-x-auto leading-5">
              {file.content.split('\n').map((line, i) => (
                <DiffLine key={i} line={line} />
              ))}
            </pre>
          ) : (
            <div className="p-4 text-center text-sm text-zinc-500">
              No diff content available
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Empty state when no changes.
 */
function EmptyDiff() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <FileText className="h-12 w-12 text-zinc-300 dark:text-zinc-600 mb-4" />
      <p className="text-zinc-500 dark:text-zinc-400">No changes detected</p>
      <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
        The worktree matches the base branch
      </p>
    </div>
  );
}

/**
 * Loading skeleton.
 */
function DiffSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-12 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
      <div className="h-32 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
      <div className="h-32 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
    </div>
  );
}

/**
 * Error state when API unavailable.
 */
function DiffError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle className="h-12 w-12 text-amber-400 mb-4" />
      <p className="text-zinc-700 dark:text-zinc-300 font-medium">Diff API unavailable</p>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-md">
        The diff viewer requires the local mentu-ai server to be running.
        Start it with <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">mentu serve</code>
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      )}
    </div>
  );
}

/**
 * Props for DiffViewer component.
 */
export interface DiffViewerProps {
  /** Commitment ID to show diff for */
  commitmentId: string;
  /** Whether to auto-expand file diffs */
  defaultExpanded?: boolean;
  /** Polling interval in ms (default: 5000). Set to false to disable. */
  pollingInterval?: number | false;
  /** Optional CSS class */
  className?: string;
  /** Callback to revert a single file */
  onRevertFile?: (path: string) => Promise<void>;
}

/**
 * DiffViewer component for displaying commitment worktree changes.
 *
 * Shows real-time file changes for active commitments with their own worktrees.
 *
 * @example
 * ```tsx
 * <DiffViewer commitmentId="cmt_abc12345" />
 * ```
 */
export function DiffViewer({
  commitmentId,
  defaultExpanded = true,
  pollingInterval = 5000,
  className,
  onRevertFile,
}: DiffViewerProps) {
  const {
    data: diff,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useDiff(commitmentId, { refetchInterval: pollingInterval });

  const { data: apiAvailable } = useDiffApiStatus();

  if (isLoading) {
    return (
      <div className={cn('diff-viewer', className)}>
        <DiffSkeleton />
      </div>
    );
  }

  // If API is not available
  if (apiAvailable === false || error) {
    return (
      <div className={cn('diff-viewer', className)}>
        <DiffError onRetry={() => refetch()} />
      </div>
    );
  }

  // No diff data (no worktree or empty)
  if (!diff || diff.files.length === 0) {
    return (
      <div className={cn('diff-viewer', className)}>
        <EmptyDiff />
      </div>
    );
  }

  return (
    <div className={cn('diff-viewer', className)}>
      <DiffHeader
        additions={diff.total_additions}
        deletions={diff.total_deletions}
        fileCount={diff.files.length}
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
      />

      <div className="space-y-0">
        {diff.files.map((file) => (
          <FileDiff
            key={file.path}
            file={file}
            defaultExpanded={defaultExpanded && diff.files.length <= 5}
            onRevert={onRevertFile ? async (path) => {
              await onRevertFile(path);
              refetch();
            } : undefined}
          />
        ))}
      </div>

      {diff.base_commit && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-4 text-center">
          Comparing against base commit {diff.base_commit.substring(0, 8)}
        </p>
      )}
    </div>
  );
}

export default DiffViewer;
