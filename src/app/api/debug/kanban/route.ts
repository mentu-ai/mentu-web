import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with service role for debugging
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET() {
  const workspaceId = '9584ae30-14f5-448a-9ff1-5a6f5caf6312'; // mentu-ai

  // Use anon key if service key not available
  const supabase = createClient(
    supabaseUrl,
    supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    // Fetch operations
    const { data: ops, error: opsError, count } = await supabase
      .from('operations')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .order('synced_at', { ascending: true })
      .limit(10000);

    if (opsError) {
      return NextResponse.json({ error: 'Failed to fetch operations', details: opsError }, { status: 500 });
    }

    // Count by operation type
    const opCounts: Record<string, number> = {};
    (ops || []).forEach((op: { op: string }) => {
      opCounts[op.op] = (opCounts[op.op] || 0) + 1;
    });

    // Find commit operations and compute states
    const commitOps = (ops || []).filter((op: { op: string }) => op.op === 'commit');
    const stateCounts: Record<string, number> = { open: 0, claimed: 0, in_review: 0, closed: 0 };
    const inReviewCommitments: Array<{ id: string; body: string }> = [];

    for (const commitOp of commitOps) {
      // Compute state for this commitment
      let state = 'open';
      for (const op of ops || []) {
        const payload = op.payload as Record<string, unknown>;
        if (op.op === 'claim' && payload.commitment === commitOp.id) state = 'claimed';
        if (op.op === 'release' && payload.commitment === commitOp.id) state = 'open';
        if (op.op === 'submit' && payload.commitment === commitOp.id) state = 'in_review';
        if (op.op === 'approve' && payload.commitment === commitOp.id) state = 'closed';
        if (op.op === 'close' && payload.commitment === commitOp.id) state = 'closed';
      }
      stateCounts[state] = (stateCounts[state] || 0) + 1;

      if (state === 'in_review') {
        const body = (commitOp.payload as Record<string, unknown>).body as string;
        inReviewCommitments.push({ id: commitOp.id, body: body?.substring(0, 80) || '' });
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      workspace_id: workspaceId,
      total_operations: count,
      fetched_operations: ops?.length,
      operation_breakdown: opCounts,
      commitment_counts: {
        total: commitOps.length,
        by_state: stateCounts,
      },
      in_review_commitments: inReviewCommitments,
      debug_info: {
        supabase_url: supabaseUrl,
        has_service_key: !!supabaseServiceKey,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error', details: String(error) }, { status: 500 });
  }
}
