/**
 * Diff types for commitment worktree changes.
 *
 * These types mirror the diff data returned by the mentu-ai diff API endpoint.
 */

/**
 * Kind of change for a file in the diff.
 */
export type DiffChangeKind = 'added' | 'deleted' | 'modified' | 'renamed' | 'copied' | 'permission_change';

/**
 * A single file in the diff.
 */
export interface DiffFile {
  /** File path (relative to worktree root) */
  path: string;

  /** Kind of change */
  kind: DiffChangeKind;

  /** Number of lines added */
  additions: number;

  /** Number of lines deleted */
  deletions: number;

  /**
   * Unified diff content (optional).
   * Omitted for large files.
   */
  content?: string;

  /**
   * Whether content was omitted due to size limits.
   * True when file exceeds 2MB threshold.
   */
  content_omitted: boolean;

  /** Old path (for renamed/copied files) */
  old_path?: string;
}

/**
 * Full diff response for a commitment's worktree.
 */
export interface CommitmentDiff {
  /** Commitment ID */
  commitment_id: string;

  /** Worktree path on the local filesystem */
  worktree_path: string;

  /** Base commit SHA that the worktree branched from */
  base_commit?: string;

  /** List of changed files */
  files: DiffFile[];

  /** Total lines added across all files */
  total_additions: number;

  /** Total lines deleted across all files */
  total_deletions: number;

  /** When the diff was captured */
  captured_at: string;
}

/**
 * Size limits for diff content.
 * Matches VibeKanban's proven thresholds.
 */
export const DIFF_LIMITS = {
  /** Maximum size for a single file (2MB) */
  SINGLE_FILE_BYTES: 2 * 1024 * 1024,

  /** Maximum cumulative size before stats-only mode (200MB) */
  CUMULATIVE_BYTES: 200 * 1024 * 1024,
} as const;
