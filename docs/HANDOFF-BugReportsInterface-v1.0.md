---
# ============================================================
# CANONICAL YAML FRONT MATTER
# ============================================================
id: HANDOFF-BugReportsInterface-v1.0
path: docs/HANDOFF-BugReportsInterface-v1.0.md
type: handoff
intent: execute
version: "1.0"
created: 2026-01-10
last_updated: 2026-01-10

tier: T3
author_type: executor

parent: PRD-BugReportsInterface-v1.0
children:
  - PROMPT-BugReportsInterface-v1.0

mentu:
  commitment: cmt_0d00595f
  status: claimed

validation:
  required: true
  tier: T3
---

# HANDOFF: Bug Reports Interface v1.0

## For the Coding Agent

Build the Bug Reports visualization interface for the Execution plane with list view, detail view, workflow progress visualization, and approval actions.

**Read the full PRD**: `docs/PRD-BugReportsInterface-v1.0.md`

---

## Your Identity

You are operating as **executor** (from this HANDOFF's `author_type` field).

Your actor identity comes from the repository manifest (`.mentu/manifest.yaml`).

| Dimension | Source | Value |
|-----------|--------|-------|
| **Actor** | Repository manifest | (auto-resolved) |
| **Author Type** | This HANDOFF | executor |
| **Context** | Working directory | mentu-web |

**Your domain**: technical

**The Rule**:
- Failure in YOUR domain -> Own it. Fix it. Don't explain.
- Failure in ANOTHER domain -> You drifted. Re-read this HANDOFF.

**Quick reference**: `mentu stance executor` or `mentu stance executor --failure technical`

---

## Completion Contract

**First action**: Update `.claude/completion.json`:

```json
{
  "version": "2.0",
  "name": "BugReportsInterface-v1.0",
  "tier": "T3",
  "required_files": [
    "src/app/workspace/[workspace]/[plane]/bug-reports/page.tsx",
    "src/app/workspace/[workspace]/[plane]/bug-reports/[bugId]/page.tsx",
    "src/components/bug-report/bug-report-card.tsx",
    "src/components/bug-report/bug-report-detail.tsx",
    "src/components/bug-report/workflow-progress.tsx",
    "src/hooks/useBugReports.ts",
    "src/hooks/useWorkflowInstance.ts"
  ],
  "checks": {
    "tsc": true,
    "build": true,
    "test": false
  },
  "mentu": {
    "enabled": true,
    "commitments": {
      "mode": "dynamic",
      "min_count": 1,
      "require_closed": true,
      "require_evidence": true
    }
  },
  "max_iterations": 100
}
```

---

## Mentu Protocol

### Identity Resolution

```
+-----------------------------------------------------------------------+
|  ACTOR (WHO)              AUTHOR TYPE (ROLE)          CONTEXT (WHERE)  |
|  -------------            ------------------          ---------------  |
|  From manifest            From this HANDOFF           From working dir |
|  .mentu/manifest.yaml     author_type: executor       mentu-web        |
|                                                                        |
|  Actor is auto-resolved. Author type declares your role. Context.      |
+-----------------------------------------------------------------------+
```

### Operations

```bash
cd /Users/rashid/Desktop/Workspaces/mentu-web

# Check your actor identity (auto-resolved from manifest)
cat .mentu/manifest.yaml | grep actor

# Claim commitment if not already claimed
mentu claim cmt_0d00595f --author-type executor

# Capture progress
mentu capture "{Progress}" --kind execution-progress --author-type executor
```

Save the commitment ID: **cmt_0d00595f**

---

## Key Files to Reference

Before building, read these existing patterns:

| File | Purpose |
|------|---------|
| `src/lib/navigation/planeConfig.ts` | Where to add Bug Reports nav item |
| `src/app/workspace/[workspace]/[plane]/commitments/page.tsx` | Pattern for list view with tabs |
| `src/app/workspace/[workspace]/[plane]/memories/page.tsx` | Alternative list pattern |
| `src/components/commitment/commitment-card.tsx` | Card component pattern |
| `src/components/commitment/commitment-timeline.tsx` | Timeline/progress visualization |
| `src/hooks/useOperations.ts` | Base data fetching pattern |
| `src/hooks/useCommitments.ts` | Derived hook pattern |
| `src/hooks/useRealtimeOperations.ts` | Real-time subscription pattern |

---

## Build Order

### Stage 1: Navigation Config

Add Bug Reports to the Execution plane navigation.

**File**: `src/lib/navigation/planeConfig.ts`

Find the Execution plane config and add Bug Reports:

```typescript
// In the execution plane items array, add:
{
  name: "Bug Reports",
  href: "/bug-reports",
  icon: Bug, // from lucide-react
  description: "Bug investigation workflow progress"
}
```

**Verification**:
```bash
grep -r "Bug Reports" src/lib/navigation/
```

---

### Stage 2: Data Hooks

Create hooks for fetching bug reports and workflow instances.

**File**: `src/hooks/useBugReports.ts`

```typescript
"use client";

import { useOperations } from "./useOperations";
import { useMemo } from "react";

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
  return "in_progress";
}

export function useBugReports(workspaceId: string) {
  const { data: operations, isLoading, error } = useOperations(workspaceId);

  const bugReports = useMemo(() => {
    if (!operations) return [];

    // Filter for bug_report memories
    const bugMemories = operations.filter(
      op => op.kind === "bug_report" || op.payload?.kind === "bug_report"
    );

    // Find linked commitments and workflows
    return bugMemories.map(mem => {
      const payload = mem.payload || {};

      // Find commitment that references this memory
      const commitment = operations.find(
        op => op.kind === "commit" && op.payload?.source === mem.id
      );

      // TODO: Query workflow_instances table for workflow data
      // For now, return without workflow data

      const status = deriveBugStatus(
        commitment?.state,
        undefined, // workflow_state
        undefined  // current_step
      );

      return {
        id: mem.id,
        title: payload.title || extractTitle(payload.body || ""),
        description: payload.body || payload.description || "",
        severity: payload.severity || "medium",
        source: payload.source || "Unknown",
        created_at: mem.timestamp,
        commitment_id: commitment?.id,
        commitment_state: commitment?.state,
        status
      } as BugReport;
    });
  }, [operations]);

  const bugsByStatus = useMemo(() => {
    return {
      inbox: bugReports.filter(b => b.status === "inbox"),
      in_progress: bugReports.filter(b => b.status === "in_progress"),
      review: bugReports.filter(b => b.status === "review"),
      resolved: bugReports.filter(b => b.status === "resolved"),
      failed: bugReports.filter(b => b.status === "failed")
    };
  }, [bugReports]);

  return {
    bugReports,
    bugsByStatus,
    isLoading,
    error
  };
}
```

**File**: `src/hooks/useWorkflowInstance.ts`

```typescript
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
```

**Verification**:
```bash
tsc --noEmit src/hooks/useBugReports.ts src/hooks/useWorkflowInstance.ts
```

---

### Stage 3: Workflow Progress Component

Visualize the 7-step Dual Triad workflow.

**File**: `src/components/bug-report/workflow-progress.tsx`

```typescript
"use client";

import { cn } from "@/lib/utils";
import { Check, Circle, Loader2, X, AlertTriangle } from "lucide-react";

interface WorkflowStep {
  id: string;
  label: string;
  state: "pending" | "running" | "completed" | "failed" | "skipped";
}

const WORKFLOW_STEPS: { id: string; label: string }[] = [
  { id: "architect", label: "Architect" },
  { id: "auditor", label: "Auditor" },
  { id: "auditor_gate", label: "Gate" },
  { id: "approval_gate", label: "Approval" },
  { id: "executor", label: "Executor" },
  { id: "validate", label: "Validate" },
  { id: "complete", label: "Complete" }
];

interface WorkflowProgressProps {
  stepStates?: Record<string, { state: string }>;
  currentStep?: string;
  className?: string;
}

export function WorkflowProgress({
  stepStates = {},
  currentStep,
  className
}: WorkflowProgressProps) {
  const steps: WorkflowStep[] = WORKFLOW_STEPS.map(step => ({
    ...step,
    state: (stepStates[step.id]?.state as WorkflowStep["state"]) ||
           (currentStep === step.id ? "running" : "pending")
  }));

  return (
    <div className={cn("flex items-center gap-1 text-xs", className)}>
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <StepIcon step={step} />
          {index < steps.length - 1 && (
            <div
              className={cn(
                "w-4 h-0.5 mx-0.5",
                step.state === "completed" ? "bg-green-500" : "bg-muted"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function StepIcon({ step }: { step: WorkflowStep }) {
  const iconClass = "h-4 w-4";

  switch (step.state) {
    case "completed":
      return (
        <div className="flex items-center gap-0.5" title={`${step.label}: Complete`}>
          <Check className={cn(iconClass, "text-green-500")} />
        </div>
      );
    case "running":
      return (
        <div className="flex items-center gap-0.5" title={`${step.label}: Running`}>
          <Loader2 className={cn(iconClass, "text-blue-500 animate-spin")} />
        </div>
      );
    case "failed":
      return (
        <div className="flex items-center gap-0.5" title={`${step.label}: Failed`}>
          <X className={cn(iconClass, "text-red-500")} />
        </div>
      );
    case "skipped":
      return (
        <div className="flex items-center gap-0.5" title={`${step.label}: Skipped`}>
          <AlertTriangle className={cn(iconClass, "text-yellow-500")} />
        </div>
      );
    default:
      return (
        <div className="flex items-center gap-0.5" title={`${step.label}: Pending`}>
          <Circle className={cn(iconClass, "text-muted-foreground")} />
        </div>
      );
  }
}

// Expanded version with labels
export function WorkflowProgressExpanded({
  stepStates = {},
  currentStep,
  className
}: WorkflowProgressProps) {
  const steps: WorkflowStep[] = WORKFLOW_STEPS.map(step => ({
    ...step,
    state: (stepStates[step.id]?.state as WorkflowStep["state"]) ||
           (currentStep === step.id ? "running" : "pending")
  }));

  return (
    <div className={cn("space-y-2", className)}>
      {steps.map((step, index) => (
        <div
          key={step.id}
          className={cn(
            "flex items-center gap-3 p-2 rounded-md",
            step.state === "running" && "bg-blue-50 dark:bg-blue-950",
            step.state === "failed" && "bg-red-50 dark:bg-red-950"
          )}
        >
          <div className="flex-shrink-0">
            <StepIcon step={step} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm">{step.label}</div>
            <div className="text-xs text-muted-foreground capitalize">
              {step.state}
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {index + 1}/{steps.length}
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Verification**:
```bash
tsc --noEmit src/components/bug-report/workflow-progress.tsx
```

---

### Stage 4: Bug Report Card Component

Card component for list view.

**File**: `src/components/bug-report/bug-report-card.tsx`

```typescript
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
                <span>•</span>
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
                      <span>•</span>
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
```

**Verification**:
```bash
tsc --noEmit src/components/bug-report/bug-report-card.tsx
```

---

### Stage 5: Bug Report Detail Component

Full detail view with step outputs.

**File**: `src/components/bug-report/bug-report-detail.tsx`

```typescript
"use client";

import { formatDistanceToNow } from "date-fns";
import { Bug, ExternalLink, Check, X } from "lucide-react";
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
            <span>•</span>
            <span>Source: {bug.source}</span>
            <span>•</span>
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
              .filter(([_, step]) => step.output)
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
```

**Verification**:
```bash
tsc --noEmit src/components/bug-report/bug-report-detail.tsx
```

---

### Stage 6: List View Page

Main page with status tabs.

**File**: `src/app/workspace/[workspace]/[plane]/bug-reports/page.tsx`

```typescript
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Bug, Inbox, Play, Eye, CheckCircle, XCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BugReportCard } from "@/components/bug-report/bug-report-card";
import { useBugReports, BugStatus } from "@/hooks/useBugReports";
import { useWorkspace } from "@/hooks/useWorkspace";

const STATUS_TABS: { value: BugStatus; label: string; icon: React.ElementType }[] = [
  { value: "inbox", label: "Inbox", icon: Inbox },
  { value: "in_progress", label: "In Progress", icon: Play },
  { value: "review", label: "Review", icon: Eye },
  { value: "resolved", label: "Resolved", icon: CheckCircle },
  { value: "failed", label: "Failed", icon: XCircle }
];

export default function BugReportsPage() {
  const params = useParams();
  const workspaceSlug = params.workspace as string;
  const plane = params.plane as string;
  const [activeTab, setActiveTab] = useState<BugStatus>("inbox");

  const { workspace } = useWorkspace(workspaceSlug);
  const { bugsByStatus, isLoading, error } = useBugReports(workspace?.id || "");

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-500">Error loading bug reports: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Bug className="h-6 w-6" />
        <h1 className="text-2xl font-semibold">Bug Reports</h1>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as BugStatus)}>
        <TabsList>
          {STATUS_TABS.map(tab => {
            const count = bugsByStatus[tab.value]?.length || 0;
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                <Icon className="h-4 w-4" />
                {tab.label}
                {count > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-muted rounded-full">
                    {count}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {STATUS_TABS.map(tab => (
          <TabsContent key={tab.value} value={tab.value} className="mt-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading...
              </div>
            ) : bugsByStatus[tab.value]?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No bugs in {tab.label.toLowerCase()}
              </div>
            ) : (
              <div className="space-y-3">
                {bugsByStatus[tab.value]?.map(bug => (
                  <BugReportCard
                    key={bug.id}
                    bug={bug}
                    workspaceSlug={workspaceSlug}
                    plane={plane}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
```

**Verification**:
```bash
tsc --noEmit src/app/workspace/\[workspace\]/\[plane\]/bug-reports/page.tsx
```

---

### Stage 7: Detail View Page

Detail page for single bug.

**File**: `src/app/workspace/[workspace]/[plane]/bug-reports/[bugId]/page.tsx`

```typescript
"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BugReportDetail } from "@/components/bug-report/bug-report-detail";
import { useBugReports } from "@/hooks/useBugReports";
import { useWorkflowInstanceByCommitment } from "@/hooks/useWorkflowInstance";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";

export default function BugReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspace as string;
  const plane = params.plane as string;
  const bugId = params.bugId as string;

  const { workspace } = useWorkspace(workspaceSlug);
  const { bugReports, isLoading } = useBugReports(workspace?.id || "");
  const bug = bugReports.find(b => b.id === bugId);

  const { data: workflowInstance } = useWorkflowInstanceByCommitment(bug?.commitment_id);

  const handleApprove = async () => {
    // TODO: Implement approval via API
    toast.success("Workflow approved");
  };

  const handleReject = async () => {
    // TODO: Implement rejection via API
    toast.error("Workflow rejected");
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
```

**Verification**:
```bash
tsc --noEmit src/app/workspace/\[workspace\]/\[plane\]/bug-reports/\[bugId\]/page.tsx
```

---

### Stage 8: Export Index

Create component export.

**File**: `src/components/bug-report/index.ts`

```typescript
export { BugReportCard } from "./bug-report-card";
export { BugReportDetail } from "./bug-report-detail";
export { WorkflowProgress, WorkflowProgressExpanded } from "./workflow-progress";
```

**Verification**:
```bash
tsc --noEmit
npm run build
```

---

## Visual Verification

> This section applies - Bug Reports Interface is a UI feature.

### Capture Points

| Name | URL | Selector | Description |
|------|-----|----------|-------------|
| `list-view` | `http://localhost:3000/workspace/{slug}/execution/bug-reports` | - | List view with tabs |
| `detail-view` | `http://localhost:3000/workspace/{slug}/execution/bug-reports/{bugId}` | - | Detail view with workflow |
| `approval-banner` | `http://localhost:3000/workspace/{slug}/execution/bug-reports/{bugId}` | `.border-yellow-500` | Approval banner when in review |

### Evidence Path

```
docs/evidence/bug-reports-interface/screenshots/
```

### Bridge Spawn (Optional)

If dev server is running persistently, spawn screenshot capture via bridge after build completes.

---

## Before Submitting

Before running `mentu submit`, spawn validators:

1. Use Task tool with `subagent_type="Technical Validator"`
2. Use Task tool with `subagent_type="Intent Validator"`
3. Use Task tool with `subagent_type="Safety Validator"`

All must return verdict: PASS before submitting.

---

## Completion Phase (REQUIRED)

**BEFORE calling `mentu submit`, you MUST create a RESULT document:**

### Step 1: Create RESULT Document

Read the template and create the RESULT document:

```bash
# Read the template structure
cat /Users/rashid/Desktop/Workspaces/mentu-ai/docs/templates/TEMPLATE-Result.md

# Create: docs/RESULT-BugReportsInterface-v1.0.md
```

The RESULT document MUST include:
- Valid YAML front matter with all required fields
- Summary of what was built
- Files created and modified
- Test results (tsc, tests, build)
- Design decisions with rationale

### Step 2: Capture RESULT as Evidence

```bash
mentu capture "Created RESULT-BugReportsInterface-v1.0: Bug Reports Interface implementation complete" \
  --kind result-document \
  --path docs/RESULT-BugReportsInterface-v1.0.md \
  --refs cmt_0d00595f \
  --author-type executor
```

### Step 3: Update RESULT Front Matter

Update the YAML front matter with the evidence ID:

```yaml
mentu:
  commitment: cmt_0d00595f
  evidence: mem_YYYYYYYY  # The ID from Step 2
  status: in_review
```

### Step 4: Submit with Evidence

```bash
mentu submit cmt_0d00595f \
  --summary "Implemented Bug Reports Interface: list view with status tabs, detail view with workflow progress, approval actions" \
  --include-files
```

**The RESULT document IS the closure proof. Do not submit without it.**

---

## Verification Checklist

### Files
- [ ] `src/lib/navigation/planeConfig.ts` updated
- [ ] `src/app/workspace/[workspace]/[plane]/bug-reports/page.tsx` exists
- [ ] `src/app/workspace/[workspace]/[plane]/bug-reports/[bugId]/page.tsx` exists
- [ ] `src/components/bug-report/bug-report-card.tsx` exists
- [ ] `src/components/bug-report/bug-report-detail.tsx` exists
- [ ] `src/components/bug-report/workflow-progress.tsx` exists
- [ ] `src/hooks/useBugReports.ts` exists
- [ ] `src/hooks/useWorkflowInstance.ts` exists

### Checks
- [ ] `npm run build` passes
- [ ] `tsc --noEmit` passes

### Mentu
- [ ] Commitment claimed with `mentu claim`
- [ ] Validators passed (technical, intent, safety)
- [ ] **RESULT document created** (`docs/RESULT-BugReportsInterface-v1.0.md`)
- [ ] **RESULT captured as evidence** with `mentu capture`
- [ ] **RESULT front matter updated** with evidence ID
- [ ] Commitment submitted with `mentu submit`

### Functionality
- [ ] Bug Reports appears in Execution plane navigation
- [ ] List view shows bugs with status tabs
- [ ] Cards display severity, source, workflow progress
- [ ] Detail view shows full description and step outputs
- [ ] Approval banner shows for bugs in review state

---

*Build the interface that makes autonomous bug fixing observable and controllable.*
