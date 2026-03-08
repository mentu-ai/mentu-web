"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { WorkflowInstance } from "./useWorkflowInstance";

export function useWorkflowInstances(workspaceId: string | undefined) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["workflow-instances", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from("workflow_instances")
        .select("*, workflows!inner(name, workspace_id)")
        .eq("workflows.workspace_id", workspaceId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch scheduled_start_at from parent commitments
      const parentIds = (data || [])
        .map((r: Record<string, unknown>) => r.parent_commitment_id)
        .filter((id): id is string => !!id);

      const scheduleMap = new Map<string, string>();
      if (parentIds.length > 0) {
        const { data: cmts } = await supabase
          .from('commitments')
          .select('id, scheduled_start_at')
          .in('id', parentIds)
          .not('scheduled_start_at', 'is', null);
        for (const c of (cmts || []) as { id: string; scheduled_start_at: string }[]) {
          scheduleMap.set(c.id, c.scheduled_start_at);
        }
      }

      return (data || []).map((row: Record<string, unknown>) => ({
        ...row,
        workflow_name: (row.workflows as { name: string } | null)?.name ?? "Unknown",
        scheduled_start_at: row.parent_commitment_id
          ? scheduleMap.get(row.parent_commitment_id as string)
          : undefined,
      })) as (WorkflowInstance & { workflow_name: string; scheduled_start_at?: string })[];
    },
    enabled: !!workspaceId,
  });
}
