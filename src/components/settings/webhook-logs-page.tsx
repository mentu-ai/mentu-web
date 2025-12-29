'use client';

import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { Header } from '@/components/layout/header';
import { useWebhookLogs } from '@/hooks/useWebhookLogs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { relativeTime, absoluteTime } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, Webhook, CheckCircle, XCircle, Clock } from 'lucide-react';

interface WebhookLogsPageProps {
  workspaceName: string;
  workspaceId: string;
  user: User;
}

export function WebhookLogsPage({
  workspaceName,
  workspaceId,
  user,
}: WebhookLogsPageProps) {
  const { data: logs, isLoading } = useWebhookLogs(workspaceId);

  return (
    <div className="flex flex-col h-full">
      <Header user={user} />

      <div className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
        <Link
          href={`/workspace/${workspaceName}/settings`}
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>

        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <Webhook className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Webhook Logs</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Debug webhook activity
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-zinc-500">Loading...</div>
        ) : !logs || logs.length === 0 ? (
          <div className="py-8 text-center text-zinc-500">
            No webhook logs yet
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => {
              const StatusIcon = log.result === 'success'
                ? CheckCircle
                : log.result === 'error'
                ? XCircle
                : Clock;
              const statusColor = log.result === 'success'
                ? 'text-green-600'
                : log.result === 'error'
                ? 'text-red-600'
                : 'text-yellow-600';

              return (
                <div
                  key={log.id}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <StatusIcon className={`h-5 w-5 ${statusColor}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{log.source}</Badge>
                          <span className="text-sm font-medium">
                            {log.event_type}
                            {log.event_action && `:${log.event_action}`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Tooltip>
                      <TooltipTrigger>
                        <span className="text-xs text-zinc-400">
                          {relativeTime(log.received_at)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {absoluteTime(log.received_at)}
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {log.error_message && (
                    <div className="mb-3 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {log.error_message}
                      </p>
                    </div>
                  )}

                  <details className="text-sm">
                    <summary className="cursor-pointer text-zinc-500 hover:text-zinc-700">
                      View payload
                    </summary>
                    <ScrollArea className="h-48 mt-2">
                      <pre className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-md text-xs overflow-auto">
                        {JSON.stringify(log.payload, null, 2)}
                      </pre>
                    </ScrollArea>
                  </details>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
