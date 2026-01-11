"use client";

import { formatDistanceToNow } from "date-fns";
import { Bug, Check, X, Terminal, MousePointer, Globe, Monitor, AlertCircle, AlertTriangle, Info, Camera } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { WorkflowProgressExpanded } from "./workflow-progress";
import { ScreenshotViewer } from "./screenshot-viewer";
import { cn } from "@/lib/utils";
import type { BugReport, ConsoleLog } from "@/hooks/useBugReports";
import type { WorkflowInstance } from "@/hooks/useWorkflowInstance";

interface BugReportDetailProps {
  bug: BugReport;
  workflowInstance?: WorkflowInstance | null;
  onApprove?: () => void;
  onReject?: () => void;
}

function ConsoleLogItem({ log }: { log: ConsoleLog }) {
  const levelConfig = {
    error: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30" },
    warn: { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-950/30" },
    log: { icon: Terminal, color: "text-zinc-500", bg: "bg-zinc-50 dark:bg-zinc-900" },
    info: { icon: Info, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
    debug: { icon: Terminal, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/30" },
  };

  const config = levelConfig[log.level] || levelConfig.log;
  const Icon = config.icon;

  return (
    <div className={cn("flex items-start gap-2 p-2 rounded text-xs font-mono", config.bg)}>
      <Icon className={cn("h-3.5 w-3.5 mt-0.5 flex-shrink-0", config.color)} />
      <div className="flex-1 min-w-0">
        <span className={cn("font-medium", config.color)}>[{log.level.toUpperCase()}]</span>
        <span className="ml-2 text-zinc-700 dark:text-zinc-300 break-all">{log.message}</span>
        {log.source && (
          <span className="ml-2 text-zinc-400">({log.source})</span>
        )}
      </div>
    </div>
  );
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

      {/* Screenshot */}
      {bug.screenshot_url && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Screenshot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScreenshotViewer screenshot_url={bug.screenshot_url} alt={`Screenshot of ${bug.title}`} />
          </CardContent>
        </Card>
      )}

      {/* Environment */}
      {bug.environment && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Environment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              {bug.environment.page_url && (
                <div>
                  <span className="text-muted-foreground">Page:</span>
                  <div className="font-mono text-xs truncate">{bug.environment.page_url}</div>
                </div>
              )}
              {bug.environment.browser && (
                <div>
                  <span className="text-muted-foreground">Browser:</span>
                  <div>{bug.environment.browser} {bug.environment.browser_version}</div>
                </div>
              )}
              {bug.environment.os && (
                <div>
                  <span className="text-muted-foreground">OS:</span>
                  <div>{bug.environment.os} {bug.environment.os_version}</div>
                </div>
              )}
              {bug.environment.viewport && (
                <div>
                  <span className="text-muted-foreground">Viewport:</span>
                  <div>{bug.environment.viewport}</div>
                </div>
              )}
              {bug.environment.screen_resolution && (
                <div>
                  <span className="text-muted-foreground">Screen:</span>
                  <div>{bug.environment.screen_resolution}</div>
                </div>
              )}
              {bug.environment.timezone && (
                <div>
                  <span className="text-muted-foreground">Timezone:</span>
                  <div>{bug.environment.timezone}</div>
                </div>
              )}
            </div>
            {bug.environment.user_agent && (
              <div className="mt-3 pt-3 border-t">
                <span className="text-muted-foreground text-sm">User Agent:</span>
                <div className="font-mono text-xs text-muted-foreground break-all mt-1">
                  {bug.environment.user_agent}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Console Logs */}
      {bug.console_logs && bug.console_logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              Console Logs
              <Badge variant="secondary" className="ml-2">
                {bug.console_logs.length}
              </Badge>
              {bug.console_logs.filter(l => l.level === 'error').length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {bug.console_logs.filter(l => l.level === 'error').length} errors
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {bug.console_logs.map((log, idx) => (
                <ConsoleLogItem key={idx} log={log} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Behavior Trace */}
      {bug.behavior_trace && bug.behavior_trace.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MousePointer className="h-4 w-4" />
              Behavior Trace
              <Badge variant="secondary" className="ml-2">
                {bug.behavior_trace.length} events
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {bug.behavior_trace.map((event, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs p-2 bg-muted rounded">
                  <Badge variant="outline" className="text-[10px]">{event.type}</Badge>
                  {event.target && (
                    <span className="font-mono text-muted-foreground truncate">{event.target}</span>
                  )}
                  <span className="text-muted-foreground ml-auto">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Element */}
      {bug.selected_element && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Selected Element
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {bug.selected_element.tagName && (
                <div>
                  <span className="text-muted-foreground">Tag:</span>
                  <code className="ml-2 bg-muted px-1.5 py-0.5 rounded">{bug.selected_element.tagName}</code>
                </div>
              )}
              {bug.selected_element.id && (
                <div>
                  <span className="text-muted-foreground">ID:</span>
                  <code className="ml-2 bg-muted px-1.5 py-0.5 rounded">#{bug.selected_element.id}</code>
                </div>
              )}
              {bug.selected_element.className && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Class:</span>
                  <code className="ml-2 bg-muted px-1.5 py-0.5 rounded text-xs">{bug.selected_element.className}</code>
                </div>
              )}
              {bug.selected_element.selector && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Selector:</span>
                  <code className="ml-2 bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{bug.selected_element.selector}</code>
                </div>
              )}
              {bug.selected_element.text && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Text:</span>
                  <div className="mt-1 text-sm bg-muted p-2 rounded">{bug.selected_element.text}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
