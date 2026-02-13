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
                : "-"}
            </div>
            <div>
              <span className="font-medium">Directory:</span>{" "}
              {command.working_directory.split("/").slice(-2).join("/")}
            </div>
            <div>
              <span className="font-medium">Exit Code:</span>{" "}
              {command.exit_code ?? "-"}
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
