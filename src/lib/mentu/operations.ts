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
  options?: { tags?: string[]; meta?: Record<string, unknown> }
): Promise<OperationRow> {
  return createOperation({
    workspaceId,
    op: 'commit',
    actor,
    payload: {
      body,
      source,
      tags: options?.tags,
      meta: options?.meta,
    },
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
