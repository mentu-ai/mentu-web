"use client";

import { formatDistanceToNow } from "date-fns";
import { Bug, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { WorkflowProgressExpanded } from "./workflow-progress";
import type { BugReport } from "@/hooks/useBugReports";
import type { WorkflowInstance } from "@/hooks/useWorkflowInstance";

interface BugReportDetailProps {
  bug: BugReport;
  workflowInstance?: WorkflowInstance | null;
  onApprove?: () => void;
  onReject?: () => void;
}

export function BugReportDetail({
  bug,
  workflowInstance,
  onApprove,
  onReject
}: BugReportDetailProps) {
  const isAtApprovalGate = bug.current_step === "approval_gate" ||
                            bug.status === "review";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Bug className="h-5 w-5" />
            <h1 className="text-xl font-semibold">{bug.title}</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{bug.severity}</Badge>
            <span>-</span>
            <span>Source: {bug.source}</span>
            <span>-</span>
            <span>{formatDistanceToNow(new Date(bug.created_at), { addSuffix: true })}</span>
          </div>
        </div>

        <Badge
          variant={
            bug.status === "resolved" ? "default" :
            bug.status === "failed" ? "destructive" :
            bug.status === "review" ? "secondary" :
            "outline"
          }
        >
          {bug.status.replace("_", " ")}
        </Badge>
      </div>

      {/* Approval Actions */}
      {isAtApprovalGate && onApprove && onReject && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Approval Required</h3>
                <p className="text-sm text-muted-foreground">
                  This bug fix is waiting for approval to proceed to execution.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReject}
                  className="text-red-600"
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  onClick={onApprove}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-md">
              {bug.description}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Progress */}
      {workflowInstance && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workflow Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <WorkflowProgressExpanded
              stepStates={workflowInstance.step_states}
              currentStep={workflowInstance.current_step}
            />
          </CardContent>
        </Card>
      )}

      {/* Step Outputs */}
      {workflowInstance?.step_states && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Step Outputs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(workflowInstance.step_states)
              .filter(([, step]) => step.output)
              .map(([stepId, step]) => (
                <div key={stepId}>
                  <h4 className="font-medium text-sm mb-2 capitalize">{stepId}</h4>
                  <pre className="whitespace-pre-wrap text-xs bg-muted p-3 rounded-md overflow-auto max-h-48">
                    {typeof step.output === "string"
                      ? step.output
                      : JSON.stringify(step.output, null, 2)}
                  </pre>
                  <Separator className="mt-4" />
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">References</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {bug.commitment_id && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Commitment:</span>
                <code className="bg-muted px-2 py-0.5 rounded">{bug.commitment_id}</code>
              </div>
            )}
            {bug.workflow_instance_id && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Workflow Instance:</span>
                <code className="bg-muted px-2 py-0.5 rounded">{bug.workflow_instance_id}</code>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Memory ID:</span>
              <code className="bg-muted px-2 py-0.5 rounded">{bug.id}</code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
