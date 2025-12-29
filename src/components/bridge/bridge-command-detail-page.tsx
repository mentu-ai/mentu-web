'use client';

import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { Header } from '@/components/layout/header';
import { useBridgeCommand, useBridgeResult } from '@/hooks/useBridgeCommands';
import { useRealtimeBridge } from '@/hooks/useRealtime';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { relativeTime, absoluteTime } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, Terminal, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface BridgeCommandDetailPageProps {
  workspaceName: string;
  workspaceId: string;
  commandId: string;
  user: User;
}

export function BridgeCommandDetailPage({
  workspaceName,
  workspaceId,
  commandId,
  user,
}: BridgeCommandDetailPageProps) {
  const { data: command, isLoading: commandLoading } = useBridgeCommand(commandId);
  const { data: result } = useBridgeResult(commandId);
  useRealtimeBridge(workspaceId);

  if (commandLoading) {
    return (
      <div className="flex flex-col h-full">
        <Header user={user} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-zinc-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!command) {
    return (
      <div className="flex flex-col h-full">
        <Header user={user} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-zinc-500">Command not found</p>
        </div>
      </div>
    );
  }

  const statusIcon = {
    pending: Clock,
    claimed: Clock,
    running: Loader2,
    completed: CheckCircle,
    failed: XCircle,
    timeout: XCircle,
    cancelled: XCircle,
  }[command.status] || Clock;

  const StatusIcon = statusIcon;
  const isRunning = command.status === 'running';

  return (
    <div className="flex flex-col h-full">
      <Header user={user} />

      <div className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
        {/* Back link */}
        <Link
          href={`/workspace/${workspaceName}/bridge`}
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Bridge
        </Link>

        {/* Command Header */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
          <div className="flex items-start gap-4 mb-4">
            <StatusIcon
              className={`h-6 w-6 ${
                command.status === 'completed'
                  ? 'text-green-600'
                  : command.status === 'failed' || command.status === 'timeout'
                  ? 'text-red-600'
                  : 'text-blue-600'
              } ${isRunning ? 'animate-spin' : ''}`}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={command.status as 'pending' | 'claimed' | 'running' | 'completed' | 'failed'}>{command.status}</Badge>
                <span className="text-sm text-zinc-500">{command.agent}</span>
              </div>
              <p className="text-xs text-zinc-500 font-mono mb-2">{command.id}</p>
            </div>
          </div>

          {/* Prompt */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-zinc-500 mb-2">Prompt</h3>
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4">
              <pre className="text-sm whitespace-pre-wrap">{command.prompt}</pre>
            </div>
          </div>

          {/* Working Directory */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-zinc-500 mb-2">Working Directory</h3>
            <code className="text-sm font-mono">{command.working_directory}</code>
          </div>

          {/* Timeline */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-zinc-500">Created</span>
              <Tooltip>
                <TooltipTrigger>
                  <p className="font-medium">{relativeTime(command.created_at)}</p>
                </TooltipTrigger>
                <TooltipContent>{absoluteTime(command.created_at)}</TooltipContent>
              </Tooltip>
            </div>
            {command.claimed_at && (
              <div>
                <span className="text-zinc-500">Claimed</span>
                <Tooltip>
                  <TooltipTrigger>
                    <p className="font-medium">{relativeTime(command.claimed_at)}</p>
                  </TooltipTrigger>
                  <TooltipContent>{absoluteTime(command.claimed_at)}</TooltipContent>
                </Tooltip>
              </div>
            )}
            {command.started_at && (
              <div>
                <span className="text-zinc-500">Started</span>
                <Tooltip>
                  <TooltipTrigger>
                    <p className="font-medium">{relativeTime(command.started_at)}</p>
                  </TooltipTrigger>
                  <TooltipContent>{absoluteTime(command.started_at)}</TooltipContent>
                </Tooltip>
              </div>
            )}
            {command.completed_at && (
              <div>
                <span className="text-zinc-500">Completed</span>
                <Tooltip>
                  <TooltipTrigger>
                    <p className="font-medium">{relativeTime(command.completed_at)}</p>
                  </TooltipTrigger>
                  <TooltipContent>{absoluteTime(command.completed_at)}</TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        </div>

        {/* Output */}
        {result && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Output
              </h2>
              {result.exit_code !== null && (
                <Badge variant={result.exit_code === 0 ? 'completed' : 'failed'}>
                  Exit code: {result.exit_code}
                </Badge>
              )}
            </div>

            <Tabs defaultValue="stdout">
              <TabsList>
                <TabsTrigger value="stdout">stdout</TabsTrigger>
                <TabsTrigger value="stderr">stderr</TabsTrigger>
              </TabsList>

              <TabsContent value="stdout">
                <ScrollArea className="h-96 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                  <pre className="p-4 text-sm font-mono whitespace-pre-wrap">
                    {result.stdout || '(no output)'}
                  </pre>
                </ScrollArea>
                {result.stdout_truncated && (
                  <p className="text-xs text-yellow-600 mt-2">
                    Output was truncated
                  </p>
                )}
              </TabsContent>

              <TabsContent value="stderr">
                <ScrollArea className="h-96 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                  <pre className="p-4 text-sm font-mono whitespace-pre-wrap text-red-600">
                    {result.stderr || '(no errors)'}
                  </pre>
                </ScrollArea>
                {result.stderr_truncated && (
                  <p className="text-xs text-yellow-600 mt-2">
                    Error output was truncated
                  </p>
                )}
              </TabsContent>
            </Tabs>

            {result.error_message && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {result.error_message}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
