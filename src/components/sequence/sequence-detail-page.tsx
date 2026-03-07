'use client';

import { useWorkflowInstance } from '@/hooks/useWorkflowInstance';
import { relativeTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StepTimeline } from './step-timeline';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface SequenceDetailPageProps {
  workspaceName: string;
  workspaceId: string;
  instanceId: string;
}

export function SequenceDetailPage({ workspaceName, instanceId }: SequenceDetailPageProps) {
  const { data: instance, isLoading } = useWorkflowInstance(instanceId);

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (!instance) {
    return (
      <div className="p-6">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Sequence not found</p>
      </div>
    );
  }

  const stepStates = instance.step_states || {};
  const stepKeys = Object.keys(stepStates);
  const completedSteps = stepKeys.filter((k) => stepStates[k].state === 'completed').length;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <Link
          href={`/workspace/${workspaceName}/sequences`}
          className="flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Sequences
        </Link>

        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{instance.workflow_id}</h1>
          <Badge
            variant={
              instance.state === 'completed' ? 'completed' :
              instance.state === 'failed' ? 'failed' :
              instance.state === 'running' ? 'running' :
              'pending'
            }
          >
            {instance.state}
          </Badge>
        </div>

        <div className="flex items-center gap-4 mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          <span>Started {relativeTime(instance.created_at)}</span>
          <span>{completedSteps}/{stepKeys.length} steps</span>
          {instance.current_step && (
            <span>Current: {instance.current_step}</span>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Step Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <StepTimeline instanceId={instanceId} stepStates={stepStates} />
        </CardContent>
      </Card>

      {instance.parameters && Object.keys(instance.parameters).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs font-mono bg-zinc-50 dark:bg-zinc-900 p-3 rounded overflow-auto">
              {JSON.stringify(instance.parameters, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
