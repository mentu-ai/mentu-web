"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { WorkflowStepLog } from "@/lib/mentu/types";

interface UseWorkflowStepLogsOptions {
  instanceId: string;
  stepId?: string;
  enabled?: boolean;
  maxLines?: number;
}

export function useWorkflowStepLogs({
  instanceId,
  stepId,
  enabled = true,
  maxLines = 1000,
}: UseWorkflowStepLogsOptions) {
  const [logs, setLogs] = useState<WorkflowStepLog[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  const fetchInitialLogs = useCallback(async () => {
    if (!instanceId) return;

    let query = supabase
      .from("workflow_step_logs")
      .select("*")
      .eq("instance_id", instanceId)
      .order("ts", { ascending: true })
      .limit(maxLines);

    if (stepId) {
      query = query.eq("step_id", stepId);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError(new Error(fetchError.message));
      return;
    }

    setLogs((data || []) as WorkflowStepLog[]);
  }, [instanceId, stepId, maxLines, supabase]);

  useEffect(() => {
    if (!enabled || !instanceId) return;

    fetchInitialLogs();

    const channel = supabase
      .channel(`workflow_step_logs_${instanceId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "workflow_step_logs",
          filter: `instance_id=eq.${instanceId}`,
        },
        (payload) => {
          const newLog = payload.new as WorkflowStepLog;
          if (stepId && newLog.step_id !== stepId) return;
          setLogs((prev) => {
            const updated = [...prev, newLog];
            return updated.slice(-maxLines);
          });
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
        if (status === "CHANNEL_ERROR") {
          setError(new Error("Failed to subscribe to workflow step logs"));
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [instanceId, stepId, enabled, fetchInitialLogs, maxLines, supabase]);

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
