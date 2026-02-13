'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { BridgeResult } from '@/lib/mentu/types';

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'system' | 'agent' | 'tool' | 'todo' | 'error' | 'task' | 'file';
  content: string;
  metadata?: Record<string, unknown>;
}

/**
 * Parse bridge command output into structured log entries.
 */
function parseOutput(output: string | null): LogEntry[] {
  if (!output) return [];

  const lines = output.split('\n');
  const entries: LogEntry[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Detect line type based on content patterns
    let type: LogEntry['type'] = 'agent';

    if (line.startsWith('[ERROR]') || line.toLowerCase().includes('error:')) {
      type = 'error';
    } else if (line.startsWith('[SYSTEM]') || line.includes('initialized') || line.includes('Starting')) {
      type = 'system';
    } else if (line.startsWith('[TOOL]') || line.includes('Using tool') || line.match(/^\s*\[.*\]/)) {
      type = 'tool';
    } else if (line.includes('TODO') || line.includes('[ ]') || line.includes('[x]') || line.includes('[X]')) {
      type = 'todo';
    } else if (line.includes('[TASK]') || line.includes('Task:') || line.match(/^(Running|Executing|Starting task)/i)) {
      type = 'task';
    } else if (line.match(/\.(ts|tsx|js|jsx|json|md|css|html|py)[\s:$]/) || line.includes('File:') || line.match(/^(Reading|Writing|Editing|Created|Modified)/i)) {
      type = 'file';
    }

    entries.push({
      id: `log-${i}`,
      timestamp: new Date().toISOString(),
      type,
      content: line,
    });
  }

  return entries;
}

/**
 * Hook to subscribe to bridge command logs in real-time.
 */
export function useBridgeLogs(commandId: string | undefined) {
  const supabase = createClient();
  const [isStreaming, setIsStreaming] = useState(false);

  // Fetch initial result
  const { data: result, isLoading, refetch } = useQuery({
    queryKey: ['bridge-result', commandId],
    queryFn: async () => {
      if (!commandId) return null;

      const { data, error } = await supabase
        .from('bridge_results')
        .select('*')
        .eq('command_id', commandId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as BridgeResult | null;
    },
    enabled: !!commandId,
    refetchInterval: 3000, // Poll every 3 seconds while streaming
  });

  // Set up realtime subscription
  useEffect(() => {
    if (!commandId) return;

    setIsStreaming(true);

    const channel = supabase
      .channel(`bridge-result:${commandId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bridge_results',
          filter: `command_id=eq.${commandId}`,
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      setIsStreaming(false);
      supabase.removeChannel(channel);
    };
  }, [commandId, supabase, refetch]);

  // Parse logs from result
  const logs = parseOutput(result?.stdout ?? null);
  const errorLogs = parseOutput(result?.stderr ?? null);

  // Combine stdout and stderr
  const allLogs = [
    ...logs,
    ...errorLogs.map((e) => ({ ...e, type: 'error' as const })),
  ];

  return {
    logs: allLogs,
    isLoading,
    isStreaming: isStreaming && result?.status !== 'success' && result?.status !== 'failed',
    result,
  };
}

/**
 * Hook to get logs for a commitment (finds the most recent bridge command).
 */
export function useCommitmentLogs(commitmentId: string | undefined, workspaceId: string | undefined) {
  const supabase = createClient();

  // Find the most recent bridge command for this commitment
  const { data: command } = useQuery<{ id: string } | null>({
    queryKey: ['bridge-command-for-commitment', commitmentId],
    queryFn: async () => {
      if (!commitmentId || !workspaceId) return null;

      const { data, error } = await supabase
        .from('bridge_commands')
        .select('*')
        .eq('commitment_id', commitmentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as { id: string } | null;
    },
    enabled: !!commitmentId && !!workspaceId,
  });

  // Get logs for that command
  const logsResult = useBridgeLogs(command?.id);

  return {
    ...logsResult,
    command,
  };
}
