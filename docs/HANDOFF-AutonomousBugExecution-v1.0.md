---
# ============================================================
# CANONICAL YAML FRONT MATTER
# ============================================================
id: HANDOFF-AutonomousBugExecution-v1.0
path: docs/HANDOFF-AutonomousBugExecution-v1.0.md
type: handoff
intent: execute

version: "1.0"
created: 2026-01-12
last_updated: 2026-01-12

tier: T3
author_type: executor

parent: PRD-AutonomousBugExecution-v1.0
children:
  - PROMPT-AutonomousBugExecution-v1.0

mentu:
  commitment: cmt_bcfb7d21
  status: pending

validation:
  required: true
  tier: T2
---

# HANDOFF: AutonomousBugExecution v1.0

## For the Coding Agent

Build the UI layer for autonomous bug execution in mentu-web: execution plane page, inline execution from bug detail, real-time log streaming, and execution controls. This HANDOFF covers **mentu-web only**—cross-repo changes are listed as dependencies.

**Read the full PRD**: `docs/PRD-AutonomousBugExecution-v1.0.md`

---

## Your Identity

You are operating as **executor** (from this HANDOFF's `author_type` field).

| Dimension | Source | Value |
|-----------|--------|-------|
| **Actor** | Repository manifest | (auto-resolved from .mentu/manifest.yaml) |
| **Author Type** | This HANDOFF | executor |
| **Context** | Working directory | mentu-web |

**Your domain**: technical

**The Rule**:
- Failure in YOUR domain → Own it. Fix it. Don't explain.
- Failure in ANOTHER domain → You drifted. Re-read this HANDOFF.

---

## Cross-Repo Scope

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  THIS HANDOFF (mentu-web)                                                    │
│  ─────────────────────────                                                   │
│  • UI Components: Execution panel, output viewer, execution page            │
│  • Hooks: useSpawnLogs, useBugExecution                                     │
│  • Pages: /workspace/[ws]/[plane]/bug-execution                             │
│  • Integration: "Execute" button on bug report detail                       │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  DEPENDENCY: mentu-bridge (separate repo, separate HANDOFF)                 │
│  ───────────────────────────────────────────────────────────                │
│  • /craft integration in bug-executor.ts                                    │
│  • Agent chaining logic                                                      │
│  • Worktree-isolated execution                                               │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  DEPENDENCY: mentu-proxy (separate repo, separate HANDOFF)                  │
│  ──────────────────────────────────────────────────────────                 │
│  • Auto-commitment creation on bug receipt                                   │
│  • Bridge command insertion with /craft prompt                               │
│  • Workspace settings lookup for source mapping                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**This HANDOFF assumes mentu-bridge and mentu-proxy changes exist or will be implemented separately.**

---

## Completion Contract

**First action**: Update `.claude/completion.json`:

```json
{
  "version": "2.0",
  "name": "AutonomousBugExecution-v1.0 (mentu-web)",
  "tier": "T3",
  "required_files": [
    "src/hooks/useSpawnLogs.ts",
    "src/hooks/useBugExecution.ts",
    "src/components/bug-report/BugExecutionPanel.tsx",
    "src/components/bug-report/ExecutionOutput.tsx",
    "src/app/workspace/[workspace]/[plane]/bug-execution/page.tsx",
    "src/lib/api/bug-execution.ts"
  ],
  "checks": {
    "tsc": true,
    "build": true,
    "test": false
  },
  "mentu": {
    "enabled": true,
    "commitments": {
      "mode": "dynamic",
      "min_count": 1,
      "require_closed": true,
      "require_evidence": true
    }
  },
  "max_iterations": 100
}
```

---

## Build Order

### Stage 1: Workspace Settings Schema (Database)

Extend workspace settings to include source mappings for bug execution.

**Migration**: Apply via Supabase MCP

```sql
-- Workspace settings already exists as JSONB
-- This documents the expected structure for bug_reports config

COMMENT ON COLUMN workspaces.settings IS 'Workspace configuration including:
{
  "bug_reports": {
    "approval_mode": "autonomous" | "human_in_loop",
    "sources": {
      "<source_name>": {
        "working_directory": "/path/on/mac",
        "vps_directory": "/path/on/vps",
        "target_machine_id": "beacon-xxx | vps-mentu-01",
        "timeout_seconds": 3600
      }
    }
  }
}';
```

**Seed WarrantyOS config** (run via SQL):

```sql
UPDATE workspaces
SET settings = jsonb_set(
  COALESCE(settings, '{}'::jsonb),
  '{bug_reports}',
  '{
    "approval_mode": "autonomous",
    "sources": {
      "warrantyos": {
        "working_directory": "/Users/rashid/Desktop/Workspaces/projects/inline-substitute/vin-to-value-main",
        "vps_directory": "/home/mentu/Workspaces/projects/inline-substitute/vin-to-value-main",
        "target_machine_id": "beacon-ae0eee9f",
        "timeout_seconds": 3600
      }
    }
  }'::jsonb
)
WHERE name = 'inline-substitute';
```

---

### Stage 2: useSpawnLogs Hook

Real-time subscription to spawn_logs for live execution output.

**File**: `src/hooks/useSpawnLogs.ts`

```typescript
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface SpawnLog {
  id: string;
  command_id: string;
  workspace_id: string;
  stream: "stdout" | "stderr";
  message: string;
  ts: string;
}

interface UseSpawnLogsOptions {
  commandId: string;
  enabled?: boolean;
  maxLines?: number;
}

export function useSpawnLogs({
  commandId,
  enabled = true,
  maxLines = 1000,
}: UseSpawnLogsOptions) {
  const [logs, setLogs] = useState<SpawnLog[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  // Fetch initial logs
  const fetchInitialLogs = useCallback(async () => {
    if (!commandId) return;

    const { data, error: fetchError } = await supabase
      .from("spawn_logs")
      .select("*")
      .eq("command_id", commandId)
      .order("ts", { ascending: true })
      .limit(maxLines);

    if (fetchError) {
      setError(new Error(fetchError.message));
      return;
    }

    setLogs(data || []);
  }, [commandId, maxLines, supabase]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!enabled || !commandId) return;

    fetchInitialLogs();

    const channel = supabase
      .channel(`spawn_logs_${commandId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "spawn_logs",
          filter: `command_id=eq.${commandId}`,
        },
        (payload) => {
          const newLog = payload.new as SpawnLog;
          setLogs((prev) => {
            const updated = [...prev, newLog];
            // Trim to maxLines
            return updated.slice(-maxLines);
          });
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
        if (status === "CHANNEL_ERROR") {
          setError(new Error("Failed to subscribe to logs"));
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [commandId, enabled, fetchInitialLogs, maxLines, supabase]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    logs,
    isConnected,
    error,
    clearLogs,
    refetch: fetchInitialLogs,
  };
}
```

**Verification**:
```bash
npx tsc --noEmit src/hooks/useSpawnLogs.ts
```

---

### Stage 3: useBugExecution Hook

Trigger and monitor bug execution lifecycle.

**File**: `src/hooks/useBugExecution.ts`

```typescript
"use client";

import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { triggerBugExecution, cancelBugExecution } from "@/lib/api/bug-execution";

export type ExecutionStatus =
  | "idle"
  | "pending"
  | "crafting"
  | "executing"
  | "validating"
  | "completed"
  | "failed"
  | "cancelled";

interface BridgeCommand {
  id: string;
  workspace_id: string;
  prompt: string;
  working_directory: string;
  status: string;
  commitment_id?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  exit_code?: number;
  error?: string;
}

interface UseBugExecutionOptions {
  ticketId?: string;
  commandId?: string;
  workspaceId: string;
}

export function useBugExecution({
  ticketId,
  commandId,
  workspaceId,
}: UseBugExecutionOptions) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [activeCommandId, setActiveCommandId] = useState<string | null>(
    commandId || null
  );

  // Query current command status
  const { data: command, isLoading: isLoadingCommand } = useQuery({
    queryKey: ["bridge-command", activeCommandId],
    queryFn: async () => {
      if (!activeCommandId) return null;

      const { data, error } = await supabase
        .from("bridge_commands")
        .select("*")
        .eq("id", activeCommandId)
        .single();

      if (error) throw error;
      return data as BridgeCommand;
    },
    enabled: !!activeCommandId,
    refetchInterval: (data) => {
      // Poll every 2s while running
      if (data?.status === "running" || data?.status === "claimed") {
        return 2000;
      }
      return false;
    },
  });

  // Derive execution status from command status
  const getExecutionStatus = useCallback((): ExecutionStatus => {
    if (!command) return "idle";

    switch (command.status) {
      case "pending":
        return "pending";
      case "claimed":
      case "running":
        // Could distinguish crafting vs executing via command metadata
        return "executing";
      case "completed":
        return "completed";
      case "failed":
        return "failed";
      case "cancelled":
        return "cancelled";
      default:
        return "idle";
    }
  }, [command]);

  // Trigger execution mutation
  const triggerMutation = useMutation({
    mutationFn: async () => {
      if (!ticketId) throw new Error("No ticket ID provided");
      const result = await triggerBugExecution({
        ticketId,
        workspaceId,
      });
      return result;
    },
    onSuccess: (result) => {
      setActiveCommandId(result.commandId);
      queryClient.invalidateQueries({ queryKey: ["bridge-command"] });
    },
  });

  // Cancel execution mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!activeCommandId) throw new Error("No active command");
      await cancelBugExecution(activeCommandId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bridge-command", activeCommandId],
      });
    },
  });

  return {
    // State
    command,
    commandId: activeCommandId,
    status: getExecutionStatus(),
    isLoading: isLoadingCommand,

    // Actions
    trigger: triggerMutation.mutate,
    cancel: cancelMutation.mutate,

    // Mutation states
    isTriggering: triggerMutation.isPending,
    isCancelling: cancelMutation.isPending,
    triggerError: triggerMutation.error,
    cancelError: cancelMutation.error,
  };
}
```

**Verification**:
```bash
npx tsc --noEmit src/hooks/useBugExecution.ts
```

---

### Stage 4: API Helpers

Create API helpers for triggering bug execution.

**File**: `src/lib/api/bug-execution.ts`

```typescript
import { createClient } from "@/lib/supabase/client";

interface TriggerExecutionParams {
  ticketId: string;
  workspaceId: string;
}

interface TriggerExecutionResult {
  commandId: string;
  commitmentId: string;
}

/**
 * Trigger bug execution by creating a bridge command.
 * This creates a commitment and inserts a bridge command with the /craft prompt.
 */
export async function triggerBugExecution({
  ticketId,
  workspaceId,
}: TriggerExecutionParams): Promise<TriggerExecutionResult> {
  const supabase = createClient();

  // 1. Get ticket details
  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", ticketId)
    .single();

  if (ticketError || !ticket) {
    throw new Error(`Ticket not found: ${ticketId}`);
  }

  // 2. Get workspace settings for source mapping
  const { data: workspace, error: wsError } = await supabase
    .from("workspaces")
    .select("settings")
    .eq("id", workspaceId)
    .single();

  if (wsError || !workspace) {
    throw new Error(`Workspace not found: ${workspaceId}`);
  }

  const settings = workspace.settings as {
    bug_reports?: {
      sources?: Record<string, {
        working_directory: string;
        target_machine_id?: string;
        timeout_seconds?: number;
      }>;
    };
  };

  const sourceConfig = settings?.bug_reports?.sources?.[ticket.source];
  if (!sourceConfig) {
    throw new Error(`No source mapping for: ${ticket.source}`);
  }

  // 3. Create commitment for this bug fix
  const commitmentId = `cmt_${crypto.randomUUID().slice(0, 8)}`;

  const { error: commitError } = await supabase.from("operations").insert({
    id: commitmentId,
    workspace_id: workspaceId,
    op: "commit",
    ts: new Date().toISOString(),
    actor: "agent:bug-executor",
    payload: {
      body: `Fix bug: ${ticket.title || ticket.description?.slice(0, 100)}`,
      source: ticketId,
      tags: ["bug", "auto"],
    },
  });

  if (commitError) {
    throw new Error(`Failed to create commitment: ${commitError.message}`);
  }

  // 4. Build the /craft prompt with bug context
  const craftPrompt = buildCraftPrompt(ticket, commitmentId);

  // 5. Insert bridge command
  const { data: command, error: cmdError } = await supabase
    .from("bridge_commands")
    .insert({
      workspace_id: workspaceId,
      prompt: craftPrompt,
      working_directory: sourceConfig.working_directory,
      target_machine_id: sourceConfig.target_machine_id,
      timeout_seconds: sourceConfig.timeout_seconds || 3600,
      commitment_id: commitmentId,
      agent: "claude",
      flags: ["--dangerously-skip-permissions"],
      meta: {
        ticket_id: ticketId,
        source: ticket.source,
        execution_type: "bug_fix",
      },
    })
    .select()
    .single();

  if (cmdError || !command) {
    throw new Error(`Failed to create bridge command: ${cmdError?.message}`);
  }

  return {
    commandId: command.id,
    commitmentId,
  };
}

/**
 * Build the /craft prompt with full bug context.
 */
function buildCraftPrompt(
  ticket: Record<string, unknown>,
  commitmentId: string
): string {
  const bugId = (ticket.id as string).slice(0, 8);
  const title = (ticket.title as string) || "Bug Fix";
  const description = (ticket.description as string) || "";
  const screenshotUrl = ticket.screenshot as string;
  const consoleLogs = ticket.console_logs as Array<{ level: string; message: string }>;
  const environment = ticket.environment as Record<string, string>;

  let prompt = `/craft BugFix-${bugId}-v1.0

## Bug Context

**Commitment ID**: ${commitmentId}
**Ticket ID**: ${ticket.id}
**Title**: ${title}

### Description
${description}

### Environment
- Page URL: ${environment?.page_url || "N/A"}
- Browser: ${environment?.browser || "N/A"} ${environment?.browser_version || ""}
- OS: ${environment?.os || "N/A"}
- Viewport: ${environment?.viewport || "N/A"}
`;

  if (screenshotUrl) {
    prompt += `
### Screenshot
![Bug Screenshot](${screenshotUrl})
`;
  }

  if (consoleLogs && consoleLogs.length > 0) {
    prompt += `
### Console Logs
\`\`\`
${consoleLogs.slice(-20).map((log) => `[${log.level}] ${log.message}`).join("\n")}
\`\`\`
`;
  }

  prompt += `
## Instructions

1. Analyze the bug report above
2. Create a PRD for the fix with clear success criteria
3. Create a HANDOFF with step-by-step implementation
4. Execute the fix in a worktree
5. Run tests and capture evidence
6. Close commitment ${commitmentId} with the RESULT document

## Constraints

- DO NOT modify CloudTerminal files
- Create fix in isolated worktree
- All changes must pass tsc and build
- Capture screenshots as evidence if UI is involved
`;

  return prompt;
}

/**
 * Cancel a running bug execution.
 */
export async function cancelBugExecution(commandId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("bridge_commands")
    .update({
      status: "cancelled",
      completed_at: new Date().toISOString(),
    })
    .eq("id", commandId)
    .in("status", ["pending", "claimed", "running"]);

  if (error) {
    throw new Error(`Failed to cancel execution: ${error.message}`);
  }
}

/**
 * Retry a failed bug execution.
 */
export async function retryBugExecution(
  ticketId: string,
  workspaceId: string
): Promise<TriggerExecutionResult> {
  // Simply trigger a new execution
  return triggerBugExecution({ ticketId, workspaceId });
}
```

**Verification**:
```bash
npx tsc --noEmit src/lib/api/bug-execution.ts
```

---

### Stage 5: ExecutionOutput Component

Terminal-like output viewer using existing patterns.

**File**: `src/components/bug-report/ExecutionOutput.tsx`

```typescript
"use client";

import { useEffect, useRef } from "react";
import { useSpawnLogs, SpawnLog } from "@/hooks/useSpawnLogs";
import { cn } from "@/lib/utils";
import { Terminal, Loader2, CheckCircle, XCircle } from "lucide-react";

interface ExecutionOutputProps {
  commandId: string;
  status: "running" | "completed" | "failed" | "idle";
  className?: string;
}

export function ExecutionOutput({
  commandId,
  status,
  className,
}: ExecutionOutputProps) {
  const { logs, isConnected, error } = useSpawnLogs({
    commandId,
    enabled: !!commandId,
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getStatusIcon = () => {
    switch (status) {
      case "running":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Terminal className="h-4 w-4 text-zinc-500" />;
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm font-medium text-zinc-300">
            Execution Output
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          {isConnected ? (
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Live
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-zinc-500" />
              Disconnected
            </span>
          )}
        </div>
      </div>

      {/* Output */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto p-4 font-mono text-sm min-h-[300px] max-h-[500px]"
      >
        {error ? (
          <div className="text-red-400">Error: {error.message}</div>
        ) : logs.length === 0 ? (
          <div className="text-zinc-500">
            {status === "running"
              ? "Waiting for output..."
              : "No output available"}
          </div>
        ) : (
          logs.map((log) => <LogLine key={log.id} log={log} />)
        )}
      </div>
    </div>
  );
}

function LogLine({ log }: { log: SpawnLog }) {
  const isError = log.stream === "stderr";

  return (
    <div
      className={cn(
        "whitespace-pre-wrap break-all",
        isError ? "text-red-400" : "text-zinc-300"
      )}
    >
      {log.message}
    </div>
  );
}
```

**Verification**:
```bash
npx tsc --noEmit src/components/bug-report/ExecutionOutput.tsx
```

---

### Stage 6: BugExecutionPanel Component

Controls for triggering and managing bug execution.

**File**: `src/components/bug-report/BugExecutionPanel.tsx`

```typescript
"use client";

import { useBugExecution } from "@/hooks/useBugExecution";
import { ExecutionOutput } from "./ExecutionOutput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Play,
  Square,
  RotateCcw,
  ExternalLink,
  Loader2,
  Bug,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BugExecutionPanelProps {
  ticketId: string;
  workspaceId: string;
  className?: string;
}

export function BugExecutionPanel({
  ticketId,
  workspaceId,
  className,
}: BugExecutionPanelProps) {
  const {
    command,
    commandId,
    status,
    isLoading,
    trigger,
    cancel,
    isTriggering,
    isCancelling,
    triggerError,
  } = useBugExecution({
    ticketId,
    workspaceId,
  });

  const canTrigger = status === "idle" || status === "failed";
  const canCancel = status === "pending" || status === "executing";
  const isRunning = status === "pending" || status === "executing";

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bug className="h-4 w-4" />
            Bug Execution
          </CardTitle>

          {/* Status Badge */}
          <StatusBadge status={status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Actions */}
        <div className="flex items-center gap-2">
          {canTrigger && (
            <Button
              onClick={() => trigger()}
              disabled={isTriggering}
              size="sm"
            >
              {isTriggering ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : status === "failed" ? (
                <RotateCcw className="h-4 w-4 mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {status === "failed" ? "Retry" : "Execute Fix"}
            </Button>
          )}

          {canCancel && (
            <Button
              onClick={() => cancel()}
              disabled={isCancelling}
              variant="destructive"
              size="sm"
            >
              {isCancelling ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Square className="h-4 w-4 mr-2" />
              )}
              Cancel
            </Button>
          )}

          {command?.commitment_id && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={`/workspace/${workspaceId}/commitments/${command.commitment_id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Commitment
              </a>
            </Button>
          )}
        </div>

        {/* Error Display */}
        {triggerError && (
          <div className="p-3 bg-red-950 border border-red-800 rounded-lg text-sm text-red-400">
            {triggerError.message}
          </div>
        )}

        {/* Execution Output */}
        {commandId && (
          <ExecutionOutput
            commandId={commandId}
            status={isRunning ? "running" : status === "completed" ? "completed" : "failed"}
          />
        )}

        {/* Metadata */}
        {command && (
          <div className="grid grid-cols-2 gap-2 text-xs text-zinc-500">
            <div>
              <span className="font-medium">Command ID:</span>{" "}
              {command.id.slice(0, 8)}
            </div>
            <div>
              <span className="font-medium">Started:</span>{" "}
              {command.started_at
                ? new Date(command.started_at).toLocaleTimeString()
                : "—"}
            </div>
            <div>
              <span className="font-medium">Directory:</span>{" "}
              {command.working_directory.split("/").slice(-2).join("/")}
            </div>
            <div>
              <span className="font-medium">Exit Code:</span>{" "}
              {command.exit_code ?? "—"}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { bg: string; text: string; label: string }> = {
    idle: { bg: "bg-zinc-800", text: "text-zinc-400", label: "Idle" },
    pending: { bg: "bg-yellow-900", text: "text-yellow-400", label: "Pending" },
    crafting: { bg: "bg-blue-900", text: "text-blue-400", label: "Crafting" },
    executing: { bg: "bg-blue-900", text: "text-blue-400", label: "Executing" },
    validating: {
      bg: "bg-purple-900",
      text: "text-purple-400",
      label: "Validating",
    },
    completed: {
      bg: "bg-green-900",
      text: "text-green-400",
      label: "Completed",
    },
    failed: { bg: "bg-red-900", text: "text-red-400", label: "Failed" },
    cancelled: { bg: "bg-zinc-800", text: "text-zinc-400", label: "Cancelled" },
  };

  const variant = variants[status] || variants.idle;

  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded-full text-xs font-medium",
        variant.bg,
        variant.text
      )}
    >
      {variant.label}
    </span>
  );
}
```

**Verification**:
```bash
npx tsc --noEmit src/components/bug-report/BugExecutionPanel.tsx
```

---

### Stage 7: Bug Execution Page

Execution plane page for monitoring all bug executions.

**File**: `src/app/workspace/[workspace]/[plane]/bug-execution/page.tsx`

```typescript
"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { BugExecutionPanel } from "@/components/bug-report/BugExecutionPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bug, Clock, CheckCircle, XCircle, Play } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface BridgeCommandWithTicket {
  id: string;
  status: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  commitment_id?: string;
  exit_code?: number;
  meta: {
    ticket_id?: string;
    source?: string;
    execution_type?: string;
  };
}

export default function BugExecutionPage() {
  const params = useParams();
  const workspaceId = params.workspace as string;
  const supabase = createClient();

  // Fetch bug execution commands
  const { data: commands, isLoading } = useQuery({
    queryKey: ["bug-executions", workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bridge_commands")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("meta->>execution_type", "bug_fix")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as BridgeCommandWithTicket[];
    },
    refetchInterval: 5000, // Poll every 5s
  });

  // Group commands by status
  const running = commands?.filter(
    (c) => c.status === "running" || c.status === "claimed"
  );
  const pending = commands?.filter((c) => c.status === "pending");
  const completed = commands?.filter((c) => c.status === "completed");
  const failed = commands?.filter((c) => c.status === "failed");

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bug className="h-6 w-6" />
          Bug Execution
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Monitor and manage autonomous bug fix executions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={<Play className="h-5 w-5 text-blue-500" />}
          label="Running"
          value={running?.length || 0}
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-yellow-500" />}
          label="Pending"
          value={pending?.length || 0}
        />
        <StatCard
          icon={<CheckCircle className="h-5 w-5 text-green-500" />}
          label="Completed"
          value={completed?.length || 0}
        />
        <StatCard
          icon={<XCircle className="h-5 w-5 text-red-500" />}
          label="Failed"
          value={failed?.length || 0}
        />
      </div>

      {/* Active Executions */}
      {running && running.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Active Executions</h2>
          {running.map((cmd) => (
            <BugExecutionPanel
              key={cmd.id}
              ticketId={cmd.meta.ticket_id || ""}
              workspaceId={workspaceId}
            />
          ))}
        </div>
      )}

      {/* Execution History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Execution History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-zinc-500">Loading...</div>
          ) : commands?.length === 0 ? (
            <div className="text-zinc-500">No executions yet</div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {commands?.map((cmd) => (
                <ExecutionRow key={cmd.id} command={cmd} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-500">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function ExecutionRow({ command }: { command: BridgeCommandWithTicket }) {
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500",
    claimed: "bg-blue-500",
    running: "bg-blue-500",
    completed: "bg-green-500",
    failed: "bg-red-500",
    cancelled: "bg-zinc-500",
  };

  return (
    <div className="py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Badge
          variant="outline"
          className={`${statusColors[command.status]} bg-opacity-20`}
        >
          {command.status}
        </Badge>
        <div>
          <p className="text-sm font-medium">
            {command.meta.source || "Unknown"} - {command.meta.ticket_id?.slice(0, 8)}
          </p>
          <p className="text-xs text-zinc-500">
            {formatDistanceToNow(new Date(command.created_at), {
              addSuffix: true,
            })}
          </p>
        </div>
      </div>
      <div className="text-sm text-zinc-500">
        {command.exit_code !== null && command.exit_code !== undefined && (
          <span>Exit: {command.exit_code}</span>
        )}
      </div>
    </div>
  );
}
```

**Verification**:
```bash
npx tsc --noEmit src/app/workspace/[workspace]/[plane]/bug-execution/page.tsx
```

---

### Stage 8: Integrate with Bug Report Detail

Add "Execute" action to bug report detail page.

**File**: `src/components/bug-report/bug-report-detail.tsx`

Find the existing component and add the BugExecutionPanel. Add this import at the top:

```typescript
import { BugExecutionPanel } from './BugExecutionPanel';
```

Add the panel after the main content sections (before the closing `</div>`):

```typescript
{/* Execution Panel - for human_in_loop mode */}
<BugExecutionPanel
  ticketId={bug.id}
  workspaceId={workspaceId}
  className="mt-6"
/>
```

---

### Stage 9: Update Exports

**File**: `src/components/bug-report/index.ts`

Add exports for new components:

```typescript
export { BugExecutionPanel } from './BugExecutionPanel';
export { ExecutionOutput } from './ExecutionOutput';
```

---

## Verification Checklist

### Files
- [ ] `src/hooks/useSpawnLogs.ts` exists
- [ ] `src/hooks/useBugExecution.ts` exists
- [ ] `src/components/bug-report/BugExecutionPanel.tsx` exists
- [ ] `src/components/bug-report/ExecutionOutput.tsx` exists
- [ ] `src/app/workspace/[workspace]/[plane]/bug-execution/page.tsx` exists
- [ ] `src/lib/api/bug-execution.ts` exists

### Checks
- [ ] `npm run build` passes
- [ ] `npx tsc --noEmit` passes

### Mentu
- [ ] Commitment claimed with `mentu claim`
- [ ] **RESULT document created**
- [ ] **RESULT captured as evidence**
- [ ] Commitment submitted with `mentu submit`

### Functionality
- [ ] Bug execution page renders at `/workspace/[ws]/execution/bug-execution`
- [ ] "Execute" button appears on bug report detail
- [ ] Clicking execute creates commitment and bridge command
- [ ] Logs stream in real-time during execution
- [ ] Status badges update correctly

---

## Completion Phase (REQUIRED)

**BEFORE calling `mentu submit`, you MUST create a RESULT document:**

### Step 1: Create RESULT Document

```bash
# Read the template structure
cat /Users/rashid/Desktop/Workspaces/mentu-ai/docs/templates/TEMPLATE-Result.md

# Create: docs/RESULT-AutonomousBugExecution-v1.0.md
```

### Step 2: Capture RESULT as Evidence

```bash
mentu capture "Created RESULT-AutonomousBugExecution: UI layer for autonomous bug execution" \
  --kind result-document \
  --path docs/RESULT-AutonomousBugExecution-v1.0.md \
  --refs cmt_XXXXXXXX \
  --author-type executor
```

### Step 3: Update RESULT Front Matter

```yaml
mentu:
  commitment: cmt_XXXXXXXX
  evidence: mem_YYYYYYYY
  status: in_review
```

### Step 4: Submit with Evidence

```bash
mentu submit cmt_XXXXXXXX \
  --summary "Implemented autonomous bug execution UI: execution plane page, inline execution panel, real-time log streaming" \
  --include-files
```

---

*Autonomous bug execution UI: trigger, monitor, and manage bug fixes from the dashboard.*
