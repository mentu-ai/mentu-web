'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { OperationRow } from '@/lib/mentu/types';

export function useRealtimeOperations(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase
      .channel(`operations-${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'operations',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          const newOp = payload.new as OperationRow;

          // Add to local cache - must match useOperations query key
          queryClient.setQueryData<OperationRow[]>(
            ['operations', workspaceId, 'v2'],
            (old) => {
              if (!old) return [newOp];
              if (old.some((op) => op.id === newOp.id)) return old;
              return [...old, newOp];
            }
          );

          // Invalidate related queries
          queryClient.invalidateQueries({
            queryKey: ['operations', workspaceId, 'recent'],
          });

          // Show toast notification
          const opDescriptions: Record<string, string> = {
            capture: 'Memory captured',
            commit: 'Commitment created',
            claim: 'Commitment claimed',
            release: 'Commitment released',
            close: 'Commitment closed',
            annotate: 'Record annotated',
          };

          toast({
            title: opDescriptions[newOp.op] || 'Operation added',
            description: `by ${newOp.actor}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient, supabase]);
}

export function useRealtimeBridge(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    if (!workspaceId) return;

    // Subscribe to bridge_commands changes
    const commandsChannel = supabase
      .channel(`bridge-commands-${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bridge_commands',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ['bridge-commands', workspaceId],
          });
        }
      )
      .subscribe();

    // Subscribe to bridge_machines changes
    const machinesChannel = supabase
      .channel(`bridge-machines-${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bridge_machines',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ['bridge-machines', workspaceId],
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(commandsChannel);
      supabase.removeChannel(machinesChannel);
    };
  }, [workspaceId, queryClient, supabase]);
}
