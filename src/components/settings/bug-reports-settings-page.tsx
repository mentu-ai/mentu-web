'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Bug, Bot, User, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BugReportsSettingsPageProps {
  workspaceName: string;
  workspaceId: string;
}

type ApprovalMode = 'autonomous' | 'human_in_loop';

interface WorkspaceSettings {
  bug_reports?: {
    approval_mode?: ApprovalMode;
  };
}

export function BugReportsSettingsPage({
  workspaceName: _workspaceName,
  workspaceId,
}: BugReportsSettingsPageProps) {
  void _workspaceName;

  const supabase = createClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['workspace-settings', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('settings')
        .eq('id', workspaceId)
        .single();

      if (error) throw error;
      const workspaceData = data as { settings: WorkspaceSettings | null } | null;
      return (workspaceData?.settings || {}) as WorkspaceSettings;
    },
  });

  const approvalMode: ApprovalMode = settings?.bug_reports?.approval_mode || 'human_in_loop';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bug Reports</h1>
        <p className="text-sm text-zinc-500">
          Configure how bug reports are processed and approved
        </p>
      </div>

      {isLoading ? (
        <div className="text-zinc-500">Loading settings...</div>
      ) : (
        <div className="space-y-6">
          {/* Approval Mode Section */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Bug className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="font-semibold">Approval Mode</h2>
                <p className="text-sm text-zinc-500">
                  How bug fixes are approved before execution
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Human-in-the-Loop Option */}
              <div
                className={cn(
                  'flex items-start gap-4 p-4 rounded-lg border-2 transition-colors',
                  approvalMode === 'human_in_loop'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                    : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50'
                )}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div
                    className={cn(
                      'h-5 w-5 rounded-full border-2 flex items-center justify-center',
                      approvalMode === 'human_in_loop'
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-zinc-300 dark:border-zinc-600'
                    )}
                  >
                    {approvalMode === 'human_in_loop' && (
                      <div className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium">Human-in-the-Loop</span>
                    {approvalMode === 'human_in_loop' && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    Bug fixes require explicit human approval before the executor proceeds.
                    You&apos;ll receive notifications when a fix is ready for review.
                  </p>
                </div>
              </div>

              {/* Autonomous Option */}
              <div
                className={cn(
                  'flex items-start gap-4 p-4 rounded-lg border-2 transition-colors',
                  approvalMode === 'autonomous'
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                    : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50'
                )}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div
                    className={cn(
                      'h-5 w-5 rounded-full border-2 flex items-center justify-center',
                      approvalMode === 'autonomous'
                        ? 'border-green-500 bg-green-500'
                        : 'border-zinc-300 dark:border-zinc-600'
                    )}
                  >
                    {approvalMode === 'autonomous' && (
                      <div className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="font-medium">Autonomous</span>
                    {approvalMode === 'autonomous' && (
                      <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    Bug fixes are automatically approved after the auditor validates them.
                    The executor proceeds without waiting for human review.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="flex items-start gap-3 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
            <Info className="h-5 w-5 text-zinc-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Configuration Note
              </p>
              <p>
                This setting is currently read-only and displays the configuration from your
                workspace workflow settings. To change the approval mode, update the
                <code className="mx-1 px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">
                  bug_reports.approval_mode
                </code>
                field in your workspace settings.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
