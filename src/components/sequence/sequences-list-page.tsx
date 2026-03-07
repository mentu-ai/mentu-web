'use client';

import Link from 'next/link';
import { useWorkflowInstances } from '@/hooks/useWorkflowInstances';
import { relativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface SequencesListPageProps {
  workspaceName: string;
  workspaceId: string;
}

function getDuration(createdAt: string, updatedAt: string): string {
  const start = new Date(createdAt).getTime();
  const end = new Date(updatedAt).getTime();
  const seconds = Math.round((end - start) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  return `${hours}h`;
}

export function SequencesListPage({ workspaceName, workspaceId }: SequencesListPageProps) {
  const { data: instances, isLoading } = useWorkflowInstances(workspaceId);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Sequences</h1>

      {isLoading && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>
      )}

      {!isLoading && (!instances || instances.length === 0) && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-8">
          No sequences yet
        </p>
      )}

      {instances && instances.length > 0 && (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Name</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">State</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Progress</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Started</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Duration</th>
              </tr>
            </thead>
            <tbody>
              {instances.map((inst) => {
                const steps = inst.step_states ? Object.keys(inst.step_states) : [];
                const completed = steps.filter(
                  (k) => inst.step_states[k].state === 'completed'
                ).length;

                return (
                  <tr
                    key={inst.id}
                    className="border-b border-zinc-200 dark:border-zinc-800 last:border-b-0 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/workspace/${workspaceName}/sequences/${inst.id}`}
                        className="font-medium hover:underline"
                      >
                        {inst.workflow_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          inst.state === 'completed' ? 'completed' :
                          inst.state === 'failed' ? 'failed' :
                          inst.state === 'running' ? 'running' :
                          inst.state === 'cancelled' ? 'cancelled' :
                          'pending'
                        }
                      >
                        {inst.state}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              inst.state === 'failed' ? 'bg-red-500' :
                              inst.state === 'completed' ? 'bg-green-500' :
                              'bg-blue-500'
                            )}
                            style={{ width: steps.length > 0 ? `${(completed / steps.length) * 100}%` : '0%' }}
                          />
                        </div>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          {completed}/{steps.length}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                      {relativeTime(inst.created_at)}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                      {getDuration(inst.created_at, inst.updated_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
