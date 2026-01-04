// State computation - ported from CLI src/core/state.ts
// All state is computed by replaying the ledger

import type {
  OperationRow,
  Memory,
  Commitment,
  CommitmentState,
  Annotation,
  WorkspaceStats,
  CapturePayload,
  CommitPayload,
  AnnotatePayload,
} from './types';

/**
 * Compute commitment state by replaying the ledger.
 */
export function computeCommitmentState(
  ops: OperationRow[],
  cmtId: string
): { state: CommitmentState; owner: string | null; evidence: string | null; closed_by: string | null } {
  let state: CommitmentState = 'open';
  let owner: string | null = null;
  let evidence: string | null = null;
  let closed_by: string | null = null;

  for (const op of ops) {
    if (op.op === 'claim' && (op.payload as { commitment: string }).commitment === cmtId) {
      state = 'claimed';
      owner = op.actor;
    } else if (op.op === 'release' && (op.payload as { commitment: string }).commitment === cmtId) {
      state = 'open';
      owner = null;
    } else if (op.op === 'submit' && (op.payload as { commitment: string }).commitment === cmtId) {
      state = 'in_review';
      // owner stays the same during review
    } else if (op.op === 'approve' && (op.payload as { commitment: string }).commitment === cmtId) {
      state = 'closed';
      owner = null;
      evidence = (op.payload as { evidence?: string }).evidence || null;
      closed_by = op.actor;
    } else if (op.op === 'reopen' && (op.payload as { commitment: string }).commitment === cmtId) {
      state = 'reopened';
      // owner stays claimed to the original claimant
    } else if (op.op === 'close' && (op.payload as { commitment: string }).commitment === cmtId) {
      state = 'closed';
      owner = null;
      evidence = (op.payload as { evidence: string }).evidence;
      closed_by = op.actor;
    }
  }

  // Debug log for in_review state
  if (state === 'in_review') {
    console.log('[computeCommitmentState] Found in_review commitment:', cmtId);
  }

  return { state, owner, evidence, closed_by };
}

/**
 * Get annotations for a target ID.
 */
export function getAnnotations(ops: OperationRow[], targetId: string): Annotation[] {
  const annotations: Annotation[] = [];

  for (const op of ops) {
    if (op.op === 'annotate') {
      const payload = op.payload as AnnotatePayload;
      if (payload.target === targetId) {
        annotations.push({
          id: op.id,
          body: payload.body,
          kind: payload.kind,
          actor: op.actor,
          ts: op.ts,
        });
      }
    }
  }

  return annotations;
}

/**
 * Compute all memories from ledger.
 */
export function computeMemories(ops: OperationRow[]): Memory[] {
  const memories: Memory[] = [];

  for (const op of ops) {
    if (op.op === 'capture') {
      const payload = op.payload as CapturePayload;
      memories.push({
        id: op.id,
        body: payload.body,
        kind: payload.kind ?? null,
        actor: op.actor,
        ts: op.ts,
        refs: payload.refs,
        meta: payload.meta,
        annotations: getAnnotations(ops, op.id),
      });
    }
  }

  return memories;
}

/**
 * Compute all commitments from ledger.
 */
export function computeCommitments(ops: OperationRow[]): Commitment[] {
  const commitments: Commitment[] = [];
  const stateBreakdown: Record<string, number> = {};

  for (const op of ops) {
    if (op.op === 'commit') {
      const payload = op.payload as CommitPayload;
      const { state, owner, evidence, closed_by } = computeCommitmentState(ops, op.id);

      stateBreakdown[state] = (stateBreakdown[state] || 0) + 1;

      commitments.push({
        id: op.id,
        body: payload.body,
        source: payload.source,
        state,
        owner,
        evidence,
        closed_by,
        actor: op.actor,
        ts: op.ts,
        tags: payload.tags,
        meta: payload.meta,
        annotations: getAnnotations(ops, op.id),
      });
    }
  }

  console.log('[computeCommitments] Total:', commitments.length, '| States:', stateBreakdown);

  // Log in_review specifically
  const inReviewCommitments = commitments.filter(c => c.state === 'in_review');
  if (inReviewCommitments.length > 0) {
    console.log('[computeCommitments] IN_REVIEW commitments:', inReviewCommitments.map(c => c.id));
  }

  return commitments;
}

/**
 * Get a single memory by ID.
 */
export function getMemory(ops: OperationRow[], id: string): Memory | null {
  for (const op of ops) {
    if (op.op === 'capture' && op.id === id) {
      const payload = op.payload as CapturePayload;
      return {
        id: op.id,
        body: payload.body,
        kind: payload.kind ?? null,
        actor: op.actor,
        ts: op.ts,
        refs: payload.refs,
        meta: payload.meta,
        annotations: getAnnotations(ops, op.id),
      };
    }
  }

  return null;
}

/**
 * Get a single commitment by ID.
 */
export function getCommitment(ops: OperationRow[], id: string): Commitment | null {
  for (const op of ops) {
    if (op.op === 'commit' && op.id === id) {
      const payload = op.payload as CommitPayload;
      const { state, owner, evidence, closed_by } = computeCommitmentState(ops, op.id);

      return {
        id: op.id,
        body: payload.body,
        source: payload.source,
        state,
        owner,
        evidence,
        closed_by,
        actor: op.actor,
        ts: op.ts,
        tags: payload.tags,
        meta: payload.meta,
        annotations: getAnnotations(ops, op.id),
      };
    }
  }

  return null;
}

/**
 * Check if a memory exists.
 */
export function memoryExists(ops: OperationRow[], id: string): boolean {
  return ops.some((op) => op.op === 'capture' && op.id === id);
}

/**
 * Check if a commitment exists.
 */
export function commitmentExists(ops: OperationRow[], id: string): boolean {
  return ops.some((op) => op.op === 'commit' && op.id === id);
}

/**
 * Check if a record (memory or commitment) exists.
 */
export function recordExists(ops: OperationRow[], id: string): boolean {
  return memoryExists(ops, id) || commitmentExists(ops, id);
}

/**
 * Compute workspace statistics.
 */
export function computeStats(ops: OperationRow[]): WorkspaceStats {
  const commitments = computeCommitments(ops);
  const memories = computeMemories(ops);

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const activeActors = new Set<string>();
  ops.forEach(op => activeActors.add(op.actor));

  const closedThisWeek = commitments.filter(c => {
    if (c.state !== 'closed' || !c.evidence) return false;
    // Find the close operation to get its timestamp
    const closeOp = ops.find(op =>
      op.op === 'close' &&
      (op.payload as { commitment: string }).commitment === c.id
    );
    if (!closeOp) return false;
    return new Date(closeOp.ts) >= oneWeekAgo;
  }).length;

  return {
    openCount: commitments.filter(c => c.state === 'open').length,
    claimedCount: commitments.filter(c => c.state === 'claimed').length,
    closedCount: commitments.filter(c => c.state === 'closed').length,
    closedThisWeek,
    totalMemories: memories.length,
    activeActors,
  };
}

/**
 * Get timeline events for a commitment.
 */
export function getCommitmentTimeline(ops: OperationRow[], cmtId: string): OperationRow[] {
  return ops.filter(op => {
    if (op.op === 'commit' && op.id === cmtId) return true;
    if (op.op === 'claim' && (op.payload as { commitment: string }).commitment === cmtId) return true;
    if (op.op === 'release' && (op.payload as { commitment: string }).commitment === cmtId) return true;
    if (op.op === 'close' && (op.payload as { commitment: string }).commitment === cmtId) return true;
    if (op.op === 'annotate' && (op.payload as { target: string }).target === cmtId) return true;
    return false;
  }).sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
}

/**
 * Get commitments that reference a specific memory as source.
 */
export function getCommitmentsFromSource(ops: OperationRow[], memoryId: string): Commitment[] {
  return computeCommitments(ops).filter(c => c.source === memoryId);
}

/**
 * Get commitments that use a memory as evidence.
 */
export function getCommitmentsWithEvidence(ops: OperationRow[], memoryId: string): Commitment[] {
  return computeCommitments(ops).filter(c => c.evidence === memoryId);
}

/**
 * Find external references (annotations with kind=external_ref) for a commitment.
 */
export function getExternalRefs(ops: OperationRow[], targetId: string): Annotation[] {
  return getAnnotations(ops, targetId).filter(a => a.kind === 'external_ref');
}
