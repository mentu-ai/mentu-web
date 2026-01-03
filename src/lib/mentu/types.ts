// Mentu Protocol Types for Web Interface
// Mirrors the CLI types

export type OperationType = 'capture' | 'commit' | 'claim' | 'release' | 'close' | 'annotate' | 'submit' | 'approve' | 'reopen' | 'publish';

export type CommitmentState = 'open' | 'claimed' | 'in_review' | 'closed' | 'reopened';

export interface CapturePayload {
  body: string;
  kind?: string;
  refs?: string[];
  meta?: Record<string, unknown>;
}

export interface CommitPayload {
  body: string;
  source: string;
  tags?: string[];
  meta?: Record<string, unknown>;
}

export interface ClaimPayload {
  commitment: string;
}

export interface ReleasePayload {
  commitment: string;
  reason?: string;
}

export interface ClosePayload {
  commitment: string;
  evidence: string;
}

export interface AnnotatePayload {
  target: string;
  body: string;
  kind?: string;
  refs?: string[];
  meta?: Record<string, unknown>;
}

export type Payload =
  | CapturePayload
  | CommitPayload
  | ClaimPayload
  | ReleasePayload
  | ClosePayload
  | AnnotatePayload;

// Database operation row
export interface OperationRow {
  id: string;
  workspace_id: string;
  op: OperationType;
  ts: string;
  actor: string;
  payload: Payload;
  client_id: string | null;
  synced_at: string | null;
}

// Computed types
export interface Annotation {
  id: string;
  body: string;
  kind?: string;
  actor: string;
  ts: string;
}

export interface Memory {
  id: string;
  body: string;
  kind: string | null;
  actor: string;
  ts: string;
  refs?: string[];
  meta?: Record<string, unknown>;
  annotations: Annotation[];
}

export interface Commitment {
  id: string;
  body: string;
  source: string;
  state: CommitmentState;
  owner: string | null;
  evidence: string | null;
  closed_by: string | null;
  actor: string;
  ts: string;
  tags?: string[];
  meta?: Record<string, unknown>;
  annotations: Annotation[];
}

// External reference (for GitHub integration)
export interface ExternalRef {
  system: 'github' | 'linear' | 'jira';
  type: 'issue' | 'project_card' | 'pr';
  id: string;
  url: string;
  synced_at: string;
}

// Workspace stats
export interface WorkspaceStats {
  openCount: number;
  claimedCount: number;
  closedCount: number;
  closedThisWeek: number;
  totalMemories: number;
  activeActors: Set<string>;
}

// Bridge types
export interface BridgeMachine {
  id: string;
  workspace_id: string;
  user_id: string;
  name: string;
  hostname: string | null;
  agents_available: string[] | null;
  status: 'online' | 'busy' | 'offline';
  last_seen_at: string | null;
  current_command_id: string | null;
  created_at: string;
}

export interface BridgeCommand {
  id: string;
  workspace_id: string;
  target_machine_id: string | null;
  prompt: string;
  working_directory: string;
  agent: string;
  flags: string[] | null;
  timeout_seconds: number | null;
  status: 'pending' | 'claimed' | 'running' | 'completed' | 'failed' | 'timeout' | 'cancelled';
  created_at: string;
  claimed_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_by: string | null;
  claimed_by_machine_id: string | null;
  commitment_id: string | null;
  meta: Record<string, unknown> | null;
}

export interface BridgeResult {
  id: string;
  command_id: string;
  machine_id: string;
  started_at: string;
  completed_at: string;
  status: 'success' | 'failed' | 'timeout' | 'cancelled';
  exit_code: number | null;
  stdout: string | null;
  stderr: string | null;
  stdout_truncated: boolean | null;
  stderr_truncated: boolean | null;
  error_message: string | null;
}

// Actor mapping
export interface ActorMapping {
  id: string;
  workspace_id: string;
  external_system: string;
  external_id: string;
  mentu_actor: string;
  created_at: string;
  created_by: string | null;
}

// Webhook log
export interface WebhookLog {
  id: string;
  workspace_id: string | null;
  source: string;
  event_type: string;
  event_action: string | null;
  payload: Record<string, unknown>;
  processed_at: string | null;
  result: string | null;
  error_message: string | null;
  received_at: string;
}
