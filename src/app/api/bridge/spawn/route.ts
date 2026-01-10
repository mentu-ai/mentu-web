import { NextRequest, NextResponse } from 'next/server';

const PROXY_URL = process.env.MENTU_API_URL || 'https://mentu-proxy.affihub.workers.dev';
const PROXY_TOKEN = process.env.MENTU_PROXY_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspace_id, commitment_id, prompt, with_worktree } = body;

    if (!workspace_id) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      );
    }

    if (!PROXY_TOKEN) {
      return NextResponse.json(
        { error: 'MENTU_PROXY_TOKEN not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(`${PROXY_URL}/bridge/spawn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Proxy-Token': PROXY_TOKEN,
      },
      body: JSON.stringify({
        workspace_id,
        commitment_id,
        prompt,
        with_worktree: with_worktree ?? true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Spawn failed:', errorText);
      return NextResponse.json(
        { error: 'Failed to spawn agent', details: errorText },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Spawn error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
