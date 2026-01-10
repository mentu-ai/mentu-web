"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Bug, AlertCircle, AlertTriangle, Info, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WorkflowProgress } from "./workflow-progress";
import type { BugReport } from "@/hooks/useBugReports";

interface BugReportCardProps {
  bug: BugReport;
  workspaceSlug: string;
  plane: string;
}

const severityConfig = {
  critical: {
    icon: AlertCircle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
    border: "border-l-red-500"
  },
  high: {
    icon: AlertTriangle,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-100 dark:bg-orange-900/30",
    border: "border-l-orange-500"
  },
  medium: {
    icon: Info,
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    border: "border-l-yellow-500"
  },
  low: {
    icon: Clock,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    border: "border-l-blue-500"
  }
};

export function BugReportCard({ bug, workspaceSlug, plane }: BugReportCardProps) {
  const severity = severityConfig[bug.severity] || severityConfig.medium;
  const SeverityIcon = severity.icon;

  return (
    <Link href={`/workspace/${workspaceSlug}/${plane}/bug-reports/${bug.id}`}>
      <Card
        className={cn(
          "hover:shadow-md transition-shadow cursor-pointer border-l-4",
          severity.border
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Bug className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium text-sm truncate">{bug.title}</h3>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <span>Source: {bug.source}</span>
                <span>-</span>
                <span>{formatDistanceToNow(new Date(bug.created_at), { addSuffix: true })}</span>
              </div>

              {bug.commitment_id && (
                <WorkflowProgress
                  currentStep={bug.current_step}
                  className="mt-2"
                />
              )}

              {bug.commitment_id && (
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <span>Commitment: {bug.commitment_id}</span>
                  {bug.workflow_state && (
                    <>
                      <span>-</span>
                      <span>Workflow: {bug.workflow_state}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <Badge
              variant="secondary"
              className={cn(
                "flex-shrink-0 uppercase text-[10px]",
                severity.bg,
                severity.color
              )}
            >
              <SeverityIcon className="h-3 w-3 mr-1" />
              {bug.severity}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
