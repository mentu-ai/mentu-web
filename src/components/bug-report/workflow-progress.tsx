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
