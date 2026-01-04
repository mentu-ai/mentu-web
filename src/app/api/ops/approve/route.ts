import { NextRequest, NextResponse } from 'next/server';

const PROXY_URL = process.env.MENTU_API_URL || 'https://mentu-proxy.affihub.workers.dev';
const PROXY_TOKEN = process.env.MENTU_PROXY_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { commitment_id, comment } = body;

    if (!commitment_id) {
      return NextResponse.json(
        { error: 'commitment_id is required' },
        { status: 400 }
      );
    }

    if (!PROXY_TOKEN) {
      return NextResponse.json(
        { error: 'MENTU_PROXY_TOKEN not configured' },
        { status: 500 }
      );
    }

    // Call the mentu-proxy ops endpoint
    const response = await fetch(`${PROXY_URL}/ops`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Proxy-Token': PROXY_TOKEN,
      },
      body: JSON.stringify({
        op: 'approve',
        actor: 'user:dashboard',
        payload: {
          commitment: commitment_id,
          comment: comment || 'Approved via Kanban dashboard',
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Approve failed:', errorText);
      return NextResponse.json(
        { error: 'Failed to approve commitment', details: errorText },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Approve error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
