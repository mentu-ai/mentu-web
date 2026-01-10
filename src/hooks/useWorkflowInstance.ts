"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface WorkflowStep {
  id: string;
  type: string;
  state: "pending" | "running" | "completed" | "failed" | "skipped";
  output?: unknown;
  started_at?: string;
  completed_at?: string;
  error?: string;
}

export interface WorkflowInstance {
  id: string;
  workflow_id: string;
  state: "pending" | "running" | "completed" | "failed" | "cancelled";
  parameters: Record<string, unknown>;
  step_states: Record<string, WorkflowStep>;
  current_step: string;
  created_at: string;
  updated_at: string;
}

export function useWorkflowInstance(instanceId: string | undefined) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["workflow-instance", instanceId],
    queryFn: async () => {
      if (!instanceId) return null;

      const { data, error } = await supabase
        .from("workflow_instances")
        .select("*")
        .eq("id", instanceId)
        .single();

      if (error) throw error;
      return data as WorkflowInstance;
    },
    enabled: !!instanceId
  });
}

export function useWorkflowInstanceByCommitment(commitmentId: string | undefined) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["workflow-instance-by-commitment", commitmentId],
    queryFn: async () => {
      if (!commitmentId) return null;

      const { data, error } = await supabase
        .from("workflow_instances")
        .select("*")
        .filter("parameters->commitment_id", "eq", commitmentId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows
      return data as WorkflowInstance | null;
    },
    enabled: !!commitmentId
  });
}
