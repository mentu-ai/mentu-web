import { NextRequest, NextResponse } from 'next/server';

const PROXY_URL = process.env.MENTU_API_URL || 'https://mentu-proxy.affihub.workers.dev';
const PROXY_TOKEN = process.env.MENTU_PROXY_TOKEN;

/**
 * V3.1 Window Placement API
 * Proxies to mentu-proxy/schedule/place for auto-scheduling commitments.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      commitment_id,
      earliest_start_at,
      due_at,
      duration_estimate,
      execution_window,
    } = body;

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

    const response = await fetch(`${PROXY_URL}/schedule/place`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Proxy-Token': PROXY_TOKEN,
      },
      body: JSON.stringify({
        commitment_id,
        earliest_start_at: earliest_start_at || new Date().toISOString(),
        due_at,
        duration_estimate: duration_estimate || 60,
        execution_window,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Placement failed:', errorText);
      return NextResponse.json(
        { error: 'Placement failed', details: errorText },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Placement error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
