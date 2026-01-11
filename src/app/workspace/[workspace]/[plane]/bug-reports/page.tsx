"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Bug, Inbox, Play, Eye, CheckCircle, XCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BugReportCard } from "@/components/bug-report/bug-report-card";
import { useBugReports, type BugStatus } from "@/hooks/useBugReports";
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

  const { data: workspace } = useWorkspace(workspaceSlug);
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
      <div>
        <div className="flex items-center gap-3">
          <Bug className="h-6 w-6" />
          <h1 className="text-2xl font-semibold">Bug Reports</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Filtered view of commitments sourced from bug report memories
        </p>
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
