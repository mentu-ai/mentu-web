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

      return (data || []).map((row: Record<string, unknown>) => ({
        ...row,
        workflow_name: (row.workflows as { name: string } | null)?.name ?? "Unknown",
      })) as (WorkflowInstance & { workflow_name: string })[];
    },
    enabled: !!workspaceId,
  });
}
