'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { BridgeCommand, BridgeResult } from '@/lib/mentu/types';

export function useBridgeCommands(workspaceId: string | undefined) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['bridge-commands', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from('bridge_commands')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as BridgeCommand[];
    },
    enabled: !!workspaceId,
  });
}

export function useBridgeCommand(commandId: string | undefined) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['bridge-command', commandId],
    queryFn: async () => {
      if (!commandId) return null;

      const { data, error } = await supabase
        .from('bridge_commands')
        .select('*')
        .eq('id', commandId)
        .single();

      if (error) throw error;
      return data as BridgeCommand;
    },
    enabled: !!commandId,
  });
}

export function useBridgeResult(commandId: string | undefined) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['bridge-result', commandId],
    queryFn: async () => {
      if (!commandId) return null;

      const { data, error } = await supabase
        .from('bridge_results')
        .select('*')
        .eq('command_id', commandId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data as BridgeResult | null;
    },
    enabled: !!commandId,
  });
}
