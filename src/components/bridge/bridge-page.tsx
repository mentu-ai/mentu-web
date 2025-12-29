'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { Header } from '@/components/layout/header';
import { useBridgeCommands } from '@/hooks/useBridgeCommands';
import { useBridgeMachines } from '@/hooks/useBridgeMachines';
import { useRealtimeBridge } from '@/hooks/useRealtime';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { relativeTime, absoluteTime } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Terminal, Server, Clock, Play, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { BridgeCommand } from '@/lib/mentu/types';

interface BridgePageProps {
  workspaceName: string;
  workspaceId: string;
  user: User;
}

const statusIcons: Record<string, typeof Clock> = {
  pending: Clock,
  claimed: Clock,
  running: Loader2,
  completed: CheckCircle,
  failed: XCircle,
  timeout: XCircle,
  cancelled: XCircle,
};

const statusColors: Record<string, string> = {
  pending: 'text-yellow-600',
  claimed: 'text-blue-600',
  running: 'text-blue-600',
  completed: 'text-green-600',
  failed: 'text-red-600',
  timeout: 'text-red-600',
  cancelled: 'text-zinc-600',
};

export function BridgePage({
  workspaceName,
  workspaceId,
  user,
}: BridgePageProps) {
  const [filter, setFilter] = useState<BridgeCommand['status'] | 'all'>('all');

  const { data: commands, isLoading: commandsLoading } = useBridgeCommands(workspaceId);
  const { data: machines, isLoading: machinesLoading } = useBridgeMachines(workspaceId);
  useRealtimeBridge(workspaceId);

  const filteredCommands = filter === 'all'
    ? commands
    : commands?.filter((c) => c.status === filter);

  return (
    <div className="flex flex-col h-full">
      <Header user={user} />

      <div className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Terminal className="h-6 w-6" />
            Terminal Bridge
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Monitor remote command execution
          </p>
        </div>

        {/* Machines Status */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Server className="h-4 w-4" />
            Machines
          </h2>
          {machinesLoading ? (
            <p className="text-sm text-zinc-500">Loading...</p>
          ) : !machines || machines.length === 0 ? (
            <p className="text-sm text-zinc-500">No machines registered</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {machines.map((machine) => (
                <div
                  key={machine.id}
                  className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{machine.name}</span>
                    <Badge variant={machine.status}>{machine.status}</Badge>
                  </div>
                  <p className="text-xs text-zinc-500 font-mono">{machine.id}</p>
                  {machine.hostname && (
                    <p className="text-sm text-zinc-500">{machine.hostname}</p>
                  )}
                  {machine.last_seen_at && (
                    <Tooltip>
                      <TooltipTrigger>
                        <p className="text-xs text-zinc-400 mt-2">
                          Last seen {relativeTime(machine.last_seen_at)}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent>
                        {absoluteTime(machine.last_seen_at)}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Commands */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Play className="h-4 w-4" />
            Commands
          </h2>

          <Tabs
            value={filter}
            onValueChange={(v) => setFilter(v as typeof filter)}
            className="mb-4"
          >
            <TabsList className="flex-wrap">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="running">Running</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="failed">Failed</TabsTrigger>
            </TabsList>
          </Tabs>

          {commandsLoading ? (
            <p className="text-sm text-zinc-500">Loading...</p>
          ) : !filteredCommands || filteredCommands.length === 0 ? (
            <p className="text-sm text-zinc-500 py-4 text-center">
              No commands found
            </p>
          ) : (
            <div className="space-y-2">
              {filteredCommands.map((command) => {
                const StatusIcon = statusIcons[command.status] || Clock;
                const statusColor = statusColors[command.status] || 'text-zinc-600';

                return (
                  <Link
                    key={command.id}
                    href={`/workspace/${workspaceName}/bridge/${command.id}`}
                    className="block"
                  >
                    <div className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <StatusIcon
                            className={`h-5 w-5 mt-0.5 ${statusColor} ${
                              command.status === 'running' ? 'animate-spin' : ''
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={command.status as 'pending' | 'claimed' | 'running' | 'completed' | 'failed'}>{command.status}</Badge>
                              <span className="text-sm text-zinc-500">{command.agent}</span>
                            </div>
                            <p className="text-sm line-clamp-2">{command.prompt}</p>
                            <p className="text-xs text-zinc-400 mt-1 font-mono">
                              {command.working_directory}
                            </p>
                          </div>
                        </div>
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="text-xs text-zinc-400 shrink-0">
                              {relativeTime(command.created_at)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {absoluteTime(command.created_at)}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
