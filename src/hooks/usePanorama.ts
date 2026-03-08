"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { PanoramaWorkspace, PanoramaSequence, OperationRow } from "@/lib/mentu/types";
import type { WorkflowInstance } from "./useWorkflowInstance";
import { computeStats, computeCommitments } from "@/lib/mentu/state";

/**
 * Core panorama hook. Builds workspace overview from existing tables:
 * - workspaces + workspace_members (what user has access to)
 * - operations (commitment stats per workspace)
 * - workflow_instances + workflows (active sequences)
 *
 * Does NOT depend on workspace_registry (may not exist yet).
 */
export function usePanorama() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["panorama"],
    queryFn: async () => {
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 2. Get user's workspace memberships
      const { data: memberships, error: memErr } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", user.id);

      if (memErr) throw memErr;
      const wsIds = (memberships || []).map((m: { workspace_id: string }) => m.workspace_id);
      if (wsIds.length === 0) return { workspaces: [], activeSequences: [] };

      // 3. Fetch workspaces, operations, and running instances in parallel
      const [workspacesResult, opsResult, instancesResult] = await Promise.all([
        supabase
          .from("workspaces")
          .select("id, name, display_name")
          .in("id", wsIds)
          .order("name"),
        supabase
          .from("operations")
          .select("*")
          .in("workspace_id", wsIds),
        supabase
          .from("workflow_instances")
          .select("*, workflows(name, workspace_id)")
          .in("state", ["pending", "running", "active"]),
      ]);

      if (workspacesResult.error) throw workspacesResult.error;

      const workspaces = (workspacesResult.data || []) as { id: string; name: string; display_name: string | null }[];
      const allOps = (opsResult.data || []) as OperationRow[];
      const instances = (instancesResult.data || []) as (WorkflowInstance & {
        name?: string;
        workflows: { name: string; workspace_id: string } | null;
      })[];

      // 4. Fetch scheduled_start_at from parent commitments
      const parentCommitmentIds = instances
        .map(i => i.parent_commitment_id)
        .filter((id): id is string => !!id);

      let commitmentSchedules = new Map<string, string>();
      if (parentCommitmentIds.length > 0) {
        const { data: cmts } = await supabase
          .from('commitments')
          .select('id, scheduled_start_at')
          .in('id', parentCommitmentIds)
          .not('scheduled_start_at', 'is', null);
        for (const c of (cmts || []) as { id: string; scheduled_start_at: string }[]) {
          commitmentSchedules.set(c.id, c.scheduled_start_at);
        }
      }

      // 5. Group operations by workspace and compute stats
      const opsByWorkspace = new Map<string, OperationRow[]>();
      for (const op of allOps) {
        if (!opsByWorkspace.has(op.workspace_id)) {
          opsByWorkspace.set(op.workspace_id, []);
        }
        opsByWorkspace.get(op.workspace_id)!.push(op);
      }

      // 5. Group instances by workspace
      const instancesByWorkspace = new Map<string, PanoramaSequence[]>();
      const allActiveSequences: (PanoramaSequence & { workspace_name: string })[] = [];

      for (const inst of instances) {
        const wsId = inst.workflows?.workspace_id;
        if (!wsId) continue;

        const steps = inst.step_states || {};
        const stepKeys = Object.keys(steps);

        const seq: PanoramaSequence = {
          instance_id: inst.id,
          name: inst.workflows?.name ?? inst.name ?? "Unnamed",
          state: inst.state,
          total_steps: stepKeys.length,
          completed_steps: stepKeys.filter(k => steps[k].state === "completed").length,
          current_step: inst.current_step,
          started_at: inst.created_at,
          scheduled_start_at: inst.parent_commitment_id
            ? commitmentSchedules.get(inst.parent_commitment_id)
            : undefined,
        };

        if (!instancesByWorkspace.has(wsId)) {
          instancesByWorkspace.set(wsId, []);
        }
        instancesByWorkspace.get(wsId)!.push(seq);

        const wsName = workspaces.find(w => w.id === wsId)?.name || "Unknown";
        allActiveSequences.push({ ...seq, workspace_name: wsName });
      }

      // 6. Build panorama workspace list with real stats
      const panoramaWorkspaces: PanoramaWorkspace[] = workspaces.map((ws) => {
        const wsOps = opsByWorkspace.get(ws.id) || [];
        const stats = wsOps.length > 0 ? computeStats(wsOps) : null;
        const commitments = wsOps.length > 0 ? computeCommitments(wsOps) : [];
        const inReviewCount = commitments.filter(c => c.state === "in_review").length;

        // Find last operation timestamp for this workspace
        const lastOp = wsOps.length > 0
          ? wsOps.reduce((latest, op) => op.ts > latest.ts ? op : latest)
          : null;

        return {
          workspace_id: ws.id,
          name: ws.display_name || ws.name,
          stats: {
            open: stats?.openCount ?? 0,
            claimed: stats?.claimedCount ?? 0,
            in_review: inReviewCount,
            closed_this_week: stats?.closedThisWeek ?? 0,
            memories: stats?.totalMemories ?? 0,
          },
          active_sequences: instancesByWorkspace.get(ws.id) || [],
          last_activity_at: lastOp?.ts,
        };
      });

      return {
        workspaces: panoramaWorkspaces,
        activeSequences: allActiveSequences,
      };
    },
    refetchInterval: 60000, // 60s — not 30s
    staleTime: 30000,
  });
}
