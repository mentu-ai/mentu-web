// Operations API for creating ledger operations
import { createClient } from '@/lib/supabase/client';
import { generateId } from '@/lib/utils';
import type {
  OperationType,
  CapturePayload,
  CommitPayload,
  ClaimPayload,
  ReleasePayload,
  ClosePayload,
  AnnotatePayload,
  OperationRow,
} from './types';

interface CreateOperationParams {
  workspaceId: string;
  op: OperationType;
  actor: string;
  payload: CapturePayload | CommitPayload | ClaimPayload | ReleasePayload | ClosePayload | AnnotatePayload;
}

export async function createOperation({
  workspaceId,
  op,
  actor,
  payload,
}: CreateOperationParams): Promise<OperationRow> {
  const supabase = createClient();

  // Generate ID based on operation type
  let prefix: 'mem' | 'cmt' | 'op';
  if (op === 'capture') {
    prefix = 'mem';
  } else if (op === 'commit') {
    prefix = 'cmt';
  } else {
    prefix = 'op';
  }

  const id = generateId(prefix);
  const ts = new Date().toISOString();

  const insertData = {
    id,
    workspace_id: workspaceId,
    op,
    ts,
    actor,
    payload: payload as unknown as Record<string, unknown>,
  };

  const { data, error } = await supabase
    .from('operations')
    .insert(insertData as never)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as unknown as OperationRow;
}

// Helper functions for specific operations

export async function captureMemory(
  workspaceId: string,
  actor: string,
  body: string,
  options?: { kind?: string; refs?: string[]; meta?: Record<string, unknown> }
): Promise<OperationRow> {
  return createOperation({
    workspaceId,
    op: 'capture',
    actor,
    payload: {
      body,
      kind: options?.kind,
      refs: options?.refs,
      meta: options?.meta,
    },
  });
}

export async function createCommitment(
  workspaceId: string,
  actor: string,
  body: string,
  source: string,
  options?: {
    tags?: string[];
    meta?: {
      scheduled_start_at?: string;
      duration_estimate?: number;
      depends_on?: string[];
      execution_window?: { start: string; end: string; days?: number[] };
      timezone?: string;
      priority?: number;
      late_policy?: 'skip' | 'execute_immediately' | 'reschedule';
      idempotency_key?: string;
      earliest_start_at?: string;
    };
  }
): Promise<OperationRow> {
  // Build payload with temporal fields spread directly into it
  const payload: CommitPayload & Record<string, unknown> = {
    body,
    source,
    tags: options?.tags,
  };

  // Spread temporal fields from meta directly into payload (Temporal Primitives v1.0)
  if (options?.meta) {
    if (options.meta.scheduled_start_at) payload.scheduled_start_at = options.meta.scheduled_start_at;
    if (options.meta.duration_estimate) payload.duration_estimate = options.meta.duration_estimate;
    if (options.meta.depends_on) payload.depends_on = options.meta.depends_on;
    if (options.meta.execution_window) payload.execution_window = options.meta.execution_window;
    if (options.meta.timezone) payload.timezone = options.meta.timezone;
    if (options.meta.priority !== undefined) payload.priority = options.meta.priority;
    if (options.meta.late_policy) payload.late_policy = options.meta.late_policy;
    if (options.meta.idempotency_key) payload.idempotency_key = options.meta.idempotency_key;
    if (options.meta.earliest_start_at) payload.earliest_start_at = options.meta.earliest_start_at;
  }

  return createOperation({
    workspaceId,
    op: 'commit',
    actor,
    payload,
  });
}

export async function claimCommitment(
  workspaceId: string,
  actor: string,
  commitmentId: string
): Promise<OperationRow> {
  return createOperation({
    workspaceId,
    op: 'claim',
    actor,
    payload: {
      commitment: commitmentId,
    },
  });
}

export async function releaseCommitment(
  workspaceId: string,
  actor: string,
  commitmentId: string,
  reason?: string
): Promise<OperationRow> {
  return createOperation({
    workspaceId,
    op: 'release',
    actor,
    payload: {
      commitment: commitmentId,
      reason,
    },
  });
}

export async function closeCommitment(
  workspaceId: string,
  actor: string,
  commitmentId: string,
  evidenceId: string
): Promise<OperationRow> {
  return createOperation({
    workspaceId,
    op: 'close',
    actor,
    payload: {
      commitment: commitmentId,
      evidence: evidenceId,
    },
  });
}

export async function annotateRecord(
  workspaceId: string,
  actor: string,
  targetId: string,
  body: string,
  options?: { kind?: string; refs?: string[]; meta?: Record<string, unknown> }
): Promise<OperationRow> {
  return createOperation({
    workspaceId,
    op: 'annotate',
    actor,
    payload: {
      target: targetId,
      body,
      kind: options?.kind,
      refs: options?.refs,
      meta: options?.meta,
    },
  });
}
