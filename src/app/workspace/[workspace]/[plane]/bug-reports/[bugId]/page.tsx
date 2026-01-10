"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BugReportDetail } from "@/components/bug-report/bug-report-detail";
import { useBugReports } from "@/hooks/useBugReports";
import { useWorkflowInstanceByCommitment } from "@/hooks/useWorkflowInstance";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "@/hooks/use-toast";

export default function BugReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspace as string;
  const bugId = params.bugId as string;

  const { data: workspace } = useWorkspace(workspaceSlug);
  const { bugReports, isLoading } = useBugReports(workspace?.id || "");
  const bug = bugReports.find(b => b.id === bugId);

  const { data: workflowInstance } = useWorkflowInstanceByCommitment(bug?.commitment_id);

  const handleApprove = async () => {
    // TODO: Implement approval via API
    toast({
      title: "Workflow approved",
      description: "The bug fix has been approved for execution.",
    });
  };

  const handleReject = async () => {
    // TODO: Implement rejection via API
    toast({
      title: "Workflow rejected",
      description: "The bug fix has been rejected.",
      variant: "destructive",
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!bug) {
    return (
      <div className="p-6">
        <div className="text-red-500">Bug report not found</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Bug Reports
      </Button>

      <BugReportDetail
        bug={bug}
        workflowInstance={workflowInstance}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}
