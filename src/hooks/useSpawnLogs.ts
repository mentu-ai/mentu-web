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
