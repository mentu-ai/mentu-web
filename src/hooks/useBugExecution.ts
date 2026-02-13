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
    refetchInterval: (query) => {
      const data = query.state.data;
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
