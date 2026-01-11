"use client";

import { useOperations } from "./useOperations";
import { useMemo } from "react";
import type { OperationRow, CapturePayload } from "@/lib/mentu/types";

export type BugSeverity = "critical" | "high" | "medium" | "low";
export type BugStatus = "inbox" | "in_progress" | "review" | "resolved" | "failed";

export interface BugReport {
  id: string;
  title: string;
  description: string;
  severity: BugSeverity;
  source: string;
  created_at: string;
  commitment_id?: string;
  commitment_state?: string;
  workflow_instance_id?: string;
  workflow_state?: string;
  current_step?: string;
  status: BugStatus;
}

function extractTitle(body: string): string {
  // Extract first line or first 100 chars as title
  const firstLine = body.split('\n')[0];
  return firstLine.length > 100 ? firstLine.substring(0, 100) + '...' : firstLine;
}

function deriveBugStatus(
  commitmentState?: string,
  workflowState?: string,
  currentStep?: string
): BugStatus {
  if (!commitmentState) return "inbox";
  if (workflowState === "failed") return "failed";
  if (commitmentState === "closed") return "resolved";
  if (currentStep === "approval_gate") return "review";
  if (commitmentState === "in_review") return "review";
  return "in_progress";
}

export function useBugReports(workspaceId: string) {
  const { data: operations, isLoading, error } = useOperations(workspaceId);

  const bugReports = useMemo(() => {
    if (!operations) return [];

    // Filter for bug memories (capture operations with kind bug or bug_report)
    const bugMemories = operations.filter(
      (op: OperationRow) => {
        if (op.op !== "capture") return false;
        const payload = op.payload as CapturePayload;
        return payload?.kind === "bug_report" || payload?.kind === "bug";
      }
    );

    // Find linked commitments and workflows
    return bugMemories.map((mem: OperationRow) => {
      const payload = mem.payload as CapturePayload;

      // Find commitment that references this memory
      const commitment = operations.find(
        (op: OperationRow) => {
          if (op.op !== "commit") return false;
          const commitPayload = op.payload as { source?: string };
          return commitPayload?.source === mem.id;
        }
      );

      // Get commitment state from latest operation on this commitment
      let commitmentState: string | undefined;
      if (commitment) {
        // Find the latest state-changing operation for this commitment
        const commitmentOps = operations.filter(
          (op: OperationRow) =>
            ["claim", "release", "close", "submit", "approve", "reopen"].includes(op.op) &&
            (op.payload as { commitment?: string })?.commitment === commitment.id
        );

        if (commitmentOps.length > 0) {
          const latestOp = commitmentOps[commitmentOps.length - 1];
          switch (latestOp.op) {
            case "close": commitmentState = "closed"; break;
            case "claim": commitmentState = "claimed"; break;
            case "submit": commitmentState = "in_review"; break;
            case "approve": commitmentState = "closed"; break;
            case "release": commitmentState = "open"; break;
            case "reopen": commitmentState = "reopened"; break;
            default: commitmentState = "open";
          }
        } else {
          commitmentState = "open";
        }
      }

      const status = deriveBugStatus(
        commitmentState,
        undefined, // workflow_state - would need workflow_instances table query
        undefined  // current_step - would need workflow_instances table query
      );

      return {
        id: mem.id,
        title: (payload.meta?.title as string) || extractTitle(payload.body || ""),
        description: payload.body || "",
        severity: ((payload.meta?.severity as BugSeverity) || "medium"),
        source: (payload.meta?.source as string) || "Unknown",
        created_at: mem.ts,
        commitment_id: commitment?.id,
        commitment_state: commitmentState,
        status
      } as BugReport;
    });
  }, [operations]);

  const bugsByStatus = useMemo(() => {
    return {
      inbox: bugReports.filter((b: BugReport) => b.status === "inbox"),
      in_progress: bugReports.filter((b: BugReport) => b.status === "in_progress"),
      review: bugReports.filter((b: BugReport) => b.status === "review"),
      resolved: bugReports.filter((b: BugReport) => b.status === "resolved"),
      failed: bugReports.filter((b: BugReport) => b.status === "failed")
    };
  }, [bugReports]);

  return {
    bugReports,
    bugsByStatus,
    isLoading,
    error
  };
}
