'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { TemporalTimeline } from './temporal-timeline';
import type { Commitment } from '@/lib/mentu/types';
import { Loader2 } from 'lucide-react';

interface TimelinePageProps {
  workspaceName: string;
  workspaceId: string;
}

export function TimelinePage({ workspaceId }: TimelinePageProps) {
  const supabase = createClient();

  // Define the database row shape
  interface CommitmentRow {
    id: string;
    body: string;
    source: string;
    state: string;
    owner: string | null;
    evidence: string | null;
    closed_by: string | null;
    actor: string;
    ts: string;
    tags: string[] | null;
    meta: Record<string, unknown> | null;
    scheduled_start_at: string | null;
    duration_estimate: number | null;
    actual_start_at: string | null;
    actual_end_at: string | null;
    template_id: string | null;
    priority: number | null;
  }

  const { data: commitments = [], isLoading } = useQuery({
    queryKey: ['timeline-commitments', workspaceId],
    queryFn: async (): Promise<Commitment[]> => {
      // Fetch commitments with scheduled times from the new commitments table
      const { data, error } = await supabase
        .from('commitments')
        .select('*')
        .eq('workspace_id', workspaceId)
        .not('scheduled_start_at', 'is', null)
        .order('scheduled_start_at', { ascending: true });

      if (error) {
        console.error('Failed to fetch timeline commitments:', error);
        return [];
      }

      return ((data || []) as CommitmentRow[]).map(row => ({
        id: row.id,
        body: row.body,
        source: row.source,
        state: row.state as Commitment['state'],
        owner: row.owner,
        evidence: row.evidence,
        closed_by: row.closed_by,
        actor: row.actor,
        ts: row.ts,
        tags: row.tags || [],
        meta: row.meta || {},
        annotations: [],
        scheduled_start_at: row.scheduled_start_at ?? undefined,
        duration_estimate: row.duration_estimate ?? undefined,
        actual_start_at: row.actual_start_at ?? undefined,
        actual_end_at: row.actual_end_at ?? undefined,
        template_id: row.template_id ?? undefined,
        priority: row.priority ?? undefined,
      }));
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">Timeline</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Visualize scheduled commitments across time. Plan vs actual execution.
        </p>
      </div>
      <TemporalTimeline commitments={commitments} />
    </div>
  );
}
