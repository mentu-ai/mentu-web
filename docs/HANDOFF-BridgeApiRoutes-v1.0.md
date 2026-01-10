---
id: HANDOFF-BridgeApiRoutes-v1.0
path: docs/HANDOFF-BridgeApiRoutes-v1.0.md
type: handoff
intent: execute
version: "1.0"
created: 2026-01-05
last_updated: 2026-01-05
tier: T2
author_type: executor
parent: PRD-BridgeApiRoutes-v1.0
children:
  - PROMPT-BridgeApiRoutes-v1.0
mentu:
  commitment: cmt_4dd68c78
  status: pending
validation:
  required: true
  tier: T2
---

# HANDOFF: BridgeApiRoutes v1.0

## For the Coding Agent

Implement 5 API route handlers that proxy bridge operations to mentu-proxy, following the exact pattern of `/api/ops/approve`.

**Read the full PRD**: `docs/PRD-BridgeApiRoutes-v1.0.md`

---

## Your Identity

You are operating as **executor** (from this HANDOFF's `author_type` field).

Your actor identity comes from the repository manifest (`.mentu/manifest.yaml`).

| Dimension | Source | Value |
|-----------|--------|-------|
| **Actor** | Repository manifest | (auto-resolved) |
| **Author Type** | This HANDOFF | executor |
| **Context** | Working directory | mentu-web |

**Your domain**: technical

**The Rule**:
- Failure in YOUR domain → Own it. Fix it. Don't explain.
- Failure in ANOTHER domain → You drifted. Re-read this HANDOFF.

---

## Completion Contract

**First action**: Update `.claude/completion.json`:

```json
{
  "version": "2.0",
  "name": "BridgeApiRoutes",
  "tier": "T2",
  "required_files": [
    "src/app/api/bridge/spawn/route.ts",
    "src/app/api/bridge/stop/route.ts",
    "src/app/api/bridge/dev-server/route.ts",
    "src/app/api/bridge/create-pr/route.ts",
    "src/app/api/bridge/merge/route.ts"
  ],
  "checks": {
    "tsc": true,
    "build": true,
    "test": false
  },
  "mentu": {
    "enabled": true,
    "commitments": {
      "mode": "dynamic",
      "min_count": 1,
      "require_closed": true,
      "require_evidence": true
    }
  },
  "max_iterations": 50
}
```

---

## Mentu Protocol

### Operations

```bash
cd /Users/rashid/Desktop/Workspaces/mentu-web

# Check your actor identity (auto-resolved from manifest)
cat .mentu/manifest.yaml | grep actor

# Claim commitment
mentu claim cmt_4dd68c78

# Capture progress
mentu capture "{Progress}" --kind execution-progress
```

Save the commitment ID. You will close it with evidence.

---

## Audit Context

This implementation was validated by audit before execution.

**Intent Source**: INTENT-BridgeApiRoutes-v1.0
**Audit Reference**: AUDIT-BridgeApiRoutes-v1.0
**Audit Verdict**: APPROVE
**Auditor**: agent:claude-auditor
**Checkpoint**: d47bb9394ceabff074643978a1ecbe67a3d19c72

### Audit Conditions
- Follow existing `/api/ops/approve` pattern exactly
- All routes must verify `MENTU_PROXY_TOKEN` is configured
- Error handling must match existing pattern
- No CloudTerminal/WebSocket work (out of scope)

---

## Pattern Reference

**Copy this pattern from**: `src/app/api/ops/approve/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

const PROXY_URL = process.env.MENTU_API_URL || 'https://mentu-proxy.affihub.workers.dev';
const PROXY_TOKEN = process.env.MENTU_PROXY_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Validate required fields
    if (!body.required_field) {
      return NextResponse.json(
        { error: 'required_field is required' },
        { status: 400 }
      );
    }

    // 2. Check token configuration
    if (!PROXY_TOKEN) {
      return NextResponse.json(
        { error: 'MENTU_PROXY_TOKEN not configured' },
        { status: 500 }
      );
    }

    // 3. Proxy to mentu-proxy
    const response = await fetch(`${PROXY_URL}/bridge/{action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Proxy-Token': PROXY_TOKEN,
      },
      body: JSON.stringify(body),
    });

    // 4. Handle errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error('{Action} failed:', errorText);
      return NextResponse.json(
        { error: 'Failed to {action}', details: errorText },
        { status: response.status }
      );
    }

    // 5. Return success
    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('{Action} error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Build Order

### Stage 1: Spawn Route

Create the spawn agent route - the most critical operation.

**File**: `src/app/api/bridge/spawn/route.ts`

```typescript
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
```

**Verification**:
```bash
npx tsc --noEmit src/app/api/bridge/spawn/route.ts
```

---

### Stage 2: Stop Route

Create the stop agent route.

**File**: `src/app/api/bridge/stop/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

const PROXY_URL = process.env.MENTU_API_URL || 'https://mentu-proxy.affihub.workers.dev';
const PROXY_TOKEN = process.env.MENTU_PROXY_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspace_id, commitment_id, command_id } = body;

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

    const response = await fetch(`${PROXY_URL}/bridge/stop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Proxy-Token': PROXY_TOKEN,
      },
      body: JSON.stringify({
        workspace_id,
        commitment_id,
        command_id,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Stop failed:', errorText);
      return NextResponse.json(
        { error: 'Failed to stop agent', details: errorText },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Stop error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Verification**:
```bash
npx tsc --noEmit src/app/api/bridge/stop/route.ts
```

---

### Stage 3: Dev Server Route

Create the dev server start/stop route.

**File**: `src/app/api/bridge/dev-server/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

const PROXY_URL = process.env.MENTU_API_URL || 'https://mentu-proxy.affihub.workers.dev';
const PROXY_TOKEN = process.env.MENTU_PROXY_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspace_id, commitment_id, action } = body;

    if (!workspace_id) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      );
    }

    if (!action || !['start', 'stop'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "start" or "stop"' },
        { status: 400 }
      );
    }

    if (!PROXY_TOKEN) {
      return NextResponse.json(
        { error: 'MENTU_PROXY_TOKEN not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(`${PROXY_URL}/bridge/dev-server`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Proxy-Token': PROXY_TOKEN,
      },
      body: JSON.stringify({
        workspace_id,
        commitment_id,
        action,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Dev server failed:', errorText);
      return NextResponse.json(
        { error: `Failed to ${action} dev server`, details: errorText },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Dev server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Verification**:
```bash
npx tsc --noEmit src/app/api/bridge/dev-server/route.ts
```

---

### Stage 4: Create PR Route

Create the GitHub PR creation route.

**File**: `src/app/api/bridge/create-pr/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

const PROXY_URL = process.env.MENTU_API_URL || 'https://mentu-proxy.affihub.workers.dev';
const PROXY_TOKEN = process.env.MENTU_PROXY_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspace_id, commitment_id, title, description, base_branch } = body;

    if (!workspace_id) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      );
    }

    if (!commitment_id) {
      return NextResponse.json(
        { error: 'commitment_id is required' },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { error: 'title is required' },
        { status: 400 }
      );
    }

    if (!PROXY_TOKEN) {
      return NextResponse.json(
        { error: 'MENTU_PROXY_TOKEN not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(`${PROXY_URL}/bridge/create-pr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Proxy-Token': PROXY_TOKEN,
      },
      body: JSON.stringify({
        workspace_id,
        commitment_id,
        title,
        description: description || '',
        base_branch: base_branch || 'main',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Create PR failed:', errorText);
      return NextResponse.json(
        { error: 'Failed to create PR', details: errorText },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Create PR error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Verification**:
```bash
npx tsc --noEmit src/app/api/bridge/create-pr/route.ts
```

---

### Stage 5: Merge Route

Create the merge worktree route.

**File**: `src/app/api/bridge/merge/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

const PROXY_URL = process.env.MENTU_API_URL || 'https://mentu-proxy.affihub.workers.dev';
const PROXY_TOKEN = process.env.MENTU_PROXY_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspace_id, commitment_id } = body;

    if (!workspace_id) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      );
    }

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

    const response = await fetch(`${PROXY_URL}/bridge/merge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Proxy-Token': PROXY_TOKEN,
      },
      body: JSON.stringify({
        workspace_id,
        commitment_id,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Merge failed:', errorText);
      return NextResponse.json(
        { error: 'Failed to merge', details: errorText },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Merge error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Verification**:
```bash
npx tsc --noEmit src/app/api/bridge/merge/route.ts
```

---

## Final Verification

```bash
# Run full type check
npx tsc --noEmit

# Run build
npm run build

# Verify all routes exist
ls -la src/app/api/bridge/*/route.ts
```

---

## Completion Phase (REQUIRED)

**BEFORE calling `mentu submit`, you MUST create a RESULT document:**

### Step 1: Create RESULT Document

Read the template and create the RESULT document:

```bash
# Read the template structure
cat /Users/rashid/Desktop/Workspaces/mentu-ai/docs/templates/TEMPLATE-Result.md

# Create: docs/RESULT-BridgeApiRoutes-v1.0.md
```

### Step 2: Capture RESULT as Evidence

```bash
mentu capture "Created RESULT-BridgeApiRoutes: 5 bridge API routes implemented" \
  --kind result-document \
  --path docs/RESULT-BridgeApiRoutes-v1.0.md \
  --refs cmt_4dd68c78
```

### Step 3: Update RESULT Front Matter

Update the YAML front matter with the evidence ID.

### Step 4: Submit with Evidence

```bash
mentu submit cmt_4dd68c78 \
  --summary "Implemented 5 bridge API routes following proxy pattern" \
  --include-files
```

---

## Verification Checklist

### Files
- [ ] `src/app/api/bridge/spawn/route.ts` exists
- [ ] `src/app/api/bridge/stop/route.ts` exists
- [ ] `src/app/api/bridge/dev-server/route.ts` exists
- [ ] `src/app/api/bridge/create-pr/route.ts` exists
- [ ] `src/app/api/bridge/merge/route.ts` exists

### Checks
- [ ] `npm run build` passes
- [ ] `npx tsc --noEmit` passes

### Mentu
- [ ] Commitment claimed with `mentu claim`
- [ ] **RESULT document created** (`docs/RESULT-BridgeApiRoutes-v1.0.md`)
- [ ] **RESULT captured as evidence** with `mentu capture`
- [ ] Commitment submitted with `mentu submit`

### Functionality
- [ ] All routes follow the `/api/ops/approve` pattern
- [ ] All routes validate required fields
- [ ] All routes check for PROXY_TOKEN
- [ ] All routes handle errors correctly

---

*Complete the bridge API routes - make the Kanban buttons work.*
