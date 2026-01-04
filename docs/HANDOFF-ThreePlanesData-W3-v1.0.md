---
# ============================================================
# CANONICAL YAML FRONT MATTER
# ============================================================
id: HANDOFF-ThreePlanesData-W3-v1.0
path: docs/HANDOFF-ThreePlanesData-W3-v1.0.md
type: handoff
intent: execute

# VERSIONING
version: "1.0"
created: 2026-01-04
last_updated: 2026-01-04

# TIER
tier: T3

# AUTHOR TYPE
author_type: executor

# RELATIONSHIPS
parent: PRD-ThreePlanesData-W3-v1.0
children:
  - PROMPT-ThreePlanesData-W3-v1.0

# MENTU INTEGRATION
mentu:
  commitment: cmt_3d389548
  status: pending

# VALIDATION
validation:
  required: true
  tier: T2
---

# HANDOFF: ThreePlanesData-W3 v1.0

## For the Coding Agent

Connect three-plane views to Supabase data sources, replacing mock data with real queries while maintaining graceful fallbacks.

**Read the full PRD**: `docs/PRD-ThreePlanesData-W3-v1.0.md`

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
  "name": "ThreePlanesData-W3",
  "tier": "T3",
  "required_files": [
    "src/hooks/useGenesis.ts",
    "src/hooks/useActors.ts",
    "src/hooks/useIntegrations.ts",
    "src/hooks/useAgents.ts",
    "src/hooks/useExecutionStats.ts",
    "src/lib/supabase/types/actors.ts"
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
  "max_iterations": 75
}
```

---

## Key Documents

Read these before implementation:

1. `docs/PRD-ThreePlanesData-W3-v1.0.md` - Full specification
2. `src/hooks/useBridgeMachines.ts` - **Reference pattern** for Supabase queries
3. `src/hooks/useCommitments.ts` - **Reference pattern** for computed state
4. `src/lib/data/mockData.ts` - Mock data to fall back to

---

## Build Order

### Stage 1: Actor Types

Create type definitions for the actor_mappings table.

**File**: `src/lib/supabase/types/actors.ts`

```typescript
// Database row from actor_mappings table
export interface ActorMappingRow {
  id: string;
  external_id: string;
  mentu_id: string;
  platform: string;
  workspace_id: string;
  created_at: string;
}

// UI-friendly actor representation
export interface Actor {
  id: string;
  name: string;
  type: 'human' | 'agent';
  role: string;
  email?: string;
  trust?: 'trusted' | 'authorized' | 'untrusted';
}

// Transform database row to UI actor
export function transformActorMapping(row: ActorMappingRow): Actor {
  const isAgent = row.mentu_id.startsWith('agent:');
  return {
    id: row.id,
    name: row.mentu_id,
    type: isAgent ? 'agent' : 'human',
    role: isAgent ? 'executor' : 'owner',
    email: isAgent ? undefined : row.external_id,
    trust: isAgent ? 'authorized' : undefined,
  };
}
```

**Verification**:
```bash
npx tsc --noEmit
```

---

### Stage 2: useActors Hook

Fetch actor_mappings from Supabase with fallback to mock data.

**File**: `src/hooks/useActors.ts`

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { mockActors } from '@/lib/data/mockData';
import type { ActorMappingRow, Actor } from '@/lib/supabase/types/actors';
import { transformActorMapping } from '@/lib/supabase/types/actors';

export interface UseActorsReturn {
  actors: Actor[];
  humans: Actor[];
  agents: Actor[];
  isLoading: boolean;
  error: Error | null;
  isMockData: boolean;
  refetch: () => void;
}

export function useActors(workspaceId: string | undefined): UseActorsReturn {
  const supabase = createClient();

  const query = useQuery({
    queryKey: ['actors', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return { actors: [], isMockData: true };

      const { data, error } = await supabase
        .from('actor_mappings')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[useActors] Supabase error, falling back to mock:', error.message);
        return { actors: mockActors, isMockData: true };
      }

      if (!data || data.length === 0) {
        console.log('[useActors] No actors in database, using mock data');
        return { actors: mockActors, isMockData: true };
      }

      const actors = (data as ActorMappingRow[]).map(transformActorMapping);
      return { actors, isMockData: false };
    },
    enabled: !!workspaceId,
  });

  const actors = query.data?.actors ?? mockActors;
  const isMockData = query.data?.isMockData ?? true;

  return {
    actors,
    humans: actors.filter(a => a.type === 'human'),
    agents: actors.filter(a => a.type === 'agent'),
    isLoading: query.isLoading,
    error: query.error as Error | null,
    isMockData,
    refetch: query.refetch,
  };
}
```

**Verification**:
```bash
npx tsc --noEmit
```

---

### Stage 3: useIntegrations Hook

Fetch bridge machine status for the Integrations view.

**File**: `src/hooks/useIntegrations.ts`

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { mockIntegrations } from '@/lib/data/mockData';
import type { BridgeMachine } from '@/lib/mentu/types';

export interface PluginIntegration {
  active: boolean;
  version: string;
  hooks: number;
}

export interface RemoteAccess {
  connected: boolean;
  machine: string;
  lastSeen: string;
}

export interface MCPServer {
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  tools: number;
}

export interface UseIntegrationsReturn {
  plugin: PluginIntegration;
  remoteAccess: RemoteAccess | null;
  mcps: MCPServer[];
  isLoading: boolean;
  isMockData: boolean;
  refetch: () => void;
}

export function useIntegrations(workspaceId: string | undefined): UseIntegrationsReturn {
  const supabase = createClient();

  const query = useQuery({
    queryKey: ['integrations', workspaceId],
    queryFn: async () => {
      if (!workspaceId) {
        return { ...mockIntegrations, isMockData: true };
      }

      // Fetch bridge machines for remote access status
      const { data: machines, error } = await supabase
        .from('bridge_machines')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('last_seen', { ascending: false })
        .limit(1);

      if (error) {
        console.warn('[useIntegrations] Supabase error:', error.message);
        return { ...mockIntegrations, isMockData: true };
      }

      const activeMachine = machines?.[0] as BridgeMachine | undefined;
      const isConnected = activeMachine
        ? new Date(activeMachine.last_seen).getTime() > Date.now() - 5 * 60 * 1000
        : false;

      return {
        plugin: mockIntegrations.plugin, // Plugin status from mock (no table yet)
        remoteAccess: activeMachine ? {
          connected: isConnected,
          machine: activeMachine.machine_id,
          lastSeen: formatTimeAgo(activeMachine.last_seen),
        } : null,
        mcps: mockIntegrations.mcps, // MCPs from mock (no table yet)
        isMockData: !activeMachine,
      };
    },
    enabled: !!workspaceId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return {
    plugin: query.data?.plugin ?? mockIntegrations.plugin,
    remoteAccess: query.data?.remoteAccess ?? mockIntegrations.remoteAccess,
    mcps: query.data?.mcps ?? mockIntegrations.mcps,
    isLoading: query.isLoading,
    isMockData: query.data?.isMockData ?? true,
    refetch: query.refetch,
  };
}

function formatTimeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}
```

**Verification**:
```bash
npx tsc --noEmit
```

---

### Stage 4: useAgents Hook

Derive agent status from bridge_commands.

**File**: `src/hooks/useAgents.ts`

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { mockAgents } from '@/lib/data/mockData';
import type { BridgeCommand } from '@/lib/mentu/types';

export interface Agent {
  id: string;
  name: string;
  type: 'orchestrator' | 'autonomous' | 'validator';
  trust: 'trusted' | 'authorized';
  active: boolean;
  workingOn?: string;
  desc: string;
}

export interface UseAgentsReturn {
  agents: Agent[];
  running: Agent[];
  defined: Agent[];
  isLoading: boolean;
  isMockData: boolean;
  refetch: () => void;
}

export function useAgents(workspaceId: string | undefined): UseAgentsReturn {
  const supabase = createClient();

  const query = useQuery({
    queryKey: ['agents', workspaceId],
    queryFn: async () => {
      if (!workspaceId) {
        return { agents: mockAgents, isMockData: true };
      }

      // Fetch running commands that are agent-spawned
      const { data: commands, error } = await supabase
        .from('bridge_commands')
        .select('*')
        .eq('workspace_id', workspaceId)
        .in('status', ['pending', 'running'])
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[useAgents] Supabase error:', error.message);
        return { agents: mockAgents, isMockData: true };
      }

      if (!commands || commands.length === 0) {
        return { agents: mockAgents, isMockData: true };
      }

      // Transform commands to agents
      const runningAgents: Agent[] = (commands as BridgeCommand[])
        .filter(cmd => cmd.status === 'running')
        .map(cmd => ({
          id: cmd.id,
          name: `agent:${cmd.command_type || 'spawn'}`,
          type: 'autonomous' as const,
          trust: 'authorized' as const,
          active: true,
          workingOn: cmd.commitment_id || undefined,
          desc: cmd.prompt?.substring(0, 100) || 'Executing command',
        }));

      // Merge with defined agents from mock
      const definedAgents = mockAgents.filter(a => !a.active);
      const agents = [...runningAgents, ...definedAgents];

      return { agents, isMockData: runningAgents.length === 0 };
    },
    enabled: !!workspaceId,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const agents = query.data?.agents ?? mockAgents;

  return {
    agents,
    running: agents.filter(a => a.active),
    defined: agents.filter(a => !a.active),
    isLoading: query.isLoading,
    isMockData: query.data?.isMockData ?? true,
    refetch: query.refetch,
  };
}
```

**Verification**:
```bash
npx tsc --noEmit
```

---

### Stage 5: useExecutionStats Hook

Aggregate stats for ExecutionOverview.

**File**: `src/hooks/useExecutionStats.ts`

```typescript
'use client';

import { useMemo } from 'react';
import { useCommitments } from './useCommitments';
import { useMemories } from './useMemories';
import { useOperations } from './useOperations';
import { mockStats, mockActivity } from '@/lib/data/mockData';
import type { ActivityItem } from '@/lib/data/mockData';

export interface ExecutionStats {
  open: number;
  inProgress: number;
  memories: number;
  operations: number;
}

export interface UseExecutionStatsReturn {
  stats: ExecutionStats;
  activity: ActivityItem[];
  isLoading: boolean;
  isMockData: boolean;
}

export function useExecutionStats(workspaceId: string | undefined): UseExecutionStatsReturn {
  const { commitments, isLoading: commitmentsLoading } = useCommitments(workspaceId);
  const { memories, isLoading: memoriesLoading } = useMemories(workspaceId);
  const { data: operations, isLoading: operationsLoading } = useOperations(workspaceId);

  const isLoading = commitmentsLoading || memoriesLoading || operationsLoading;

  const stats = useMemo<ExecutionStats>(() => {
    if (!commitments || !memories || !operations) {
      return mockStats;
    }

    return {
      open: commitments.filter(c => c.state === 'open').length,
      inProgress: commitments.filter(c => c.state === 'claimed' || c.state === 'in_review').length,
      memories: memories.length,
      operations: operations.length,
    };
  }, [commitments, memories, operations]);

  const activity = useMemo<ActivityItem[]>(() => {
    if (!operations || operations.length === 0) {
      return mockActivity;
    }

    return operations.slice(0, 6).map(op => ({
      op: op.type as ActivityItem['op'],
      actor: op.actor,
      target: op.commitment_id || op.memory_id || op.id,
      time: formatTimeAgo(op.timestamp),
    }));
  }, [operations]);

  const isMockData = !operations || operations.length === 0;

  return {
    stats,
    activity,
    isLoading,
    isMockData,
  };
}

function formatTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}
```

**Verification**:
```bash
npx tsc --noEmit
```

---

### Stage 6: useGenesis Hook

Fetch workspace metadata for Genesis view.

**File**: `src/hooks/useGenesis.ts`

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { mockGenesis, type Genesis } from '@/lib/data/mockData';

export interface UseGenesisReturn {
  genesis: Genesis;
  isLoading: boolean;
  error: Error | null;
  isMockData: boolean;
  refetch: () => void;
}

export function useGenesis(workspaceId: string | undefined): UseGenesisReturn {
  const supabase = createClient();

  const query = useQuery({
    queryKey: ['genesis', workspaceId],
    queryFn: async () => {
      if (!workspaceId) {
        return { genesis: mockGenesis, isMockData: true };
      }

      // Try to fetch workspace metadata
      const { data: workspace, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single();

      if (error || !workspace) {
        console.log('[useGenesis] No workspace found, using mock');
        return { genesis: mockGenesis, isMockData: true };
      }

      // Construct genesis from workspace metadata
      const genesis: Genesis = {
        workspace: workspace.name || workspaceId,
        owner: workspace.owner || mockGenesis.owner,
        version: '1.0',
        created: workspace.created_at?.split('T')[0] || mockGenesis.created,
        principles: mockGenesis.principles, // No principles table yet
        trustGradient: mockGenesis.trustGradient, // No trust table yet
      };

      return { genesis, isMockData: false };
    },
    enabled: !!workspaceId,
  });

  return {
    genesis: query.data?.genesis ?? mockGenesis,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    isMockData: query.data?.isMockData ?? true,
    refetch: query.refetch,
  };
}
```

**Verification**:
```bash
npx tsc --noEmit
```

---

### Stage 7: Update Views to Use Hooks

Update each view component to import and use the new hooks.

**Updates Required**:

1. **GenesisView.tsx**: Import `useGenesis`, replace `mockGenesis`
2. **ActorsView.tsx**: Import `useActors`, replace `mockActors`
3. **IntegrationsView.tsx**: Import `useIntegrations`, replace `mockIntegrations`
4. **AgentsView.tsx**: Import `useAgents`, replace `mockAgents`
5. **ExecutionOverview.tsx**: Import `useExecutionStats`, replace `mockStats`/`mockActivity`

**Pattern for each view**:

```typescript
// Before
import { mockActors } from '@/lib/data/mockData';
const actors = mockActors;

// After
import { useActors } from '@/hooks/useActors';
import { useParams } from 'next/navigation';

export function ActorsView() {
  const params = useParams();
  const workspaceId = params.workspace as string;
  const { actors, humans, agents, isLoading, isMockData } = useActors(workspaceId);

  if (isLoading) {
    return <div className="animate-pulse">Loading actors...</div>;
  }

  // ... rest of component
  // Add isMockData indicator if needed
}
```

**Verification**:
```bash
npm run build
```

---

### Stage 8: Add Loading States

Add loading skeletons to views.

**Pattern**:

```typescript
if (isLoading) {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-zinc-200 rounded animate-pulse" />
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-zinc-100 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
```

---

## Verification Checklist

### Files
- [ ] `src/hooks/useGenesis.ts` exists
- [ ] `src/hooks/useActors.ts` exists
- [ ] `src/hooks/useIntegrations.ts` exists
- [ ] `src/hooks/useAgents.ts` exists
- [ ] `src/hooks/useExecutionStats.ts` exists
- [ ] `src/lib/supabase/types/actors.ts` exists

### Checks
- [ ] `npm run build` passes
- [ ] `npx tsc --noEmit` passes

### Functionality
- [ ] Views render with loading state
- [ ] Views show data (real or mock fallback)
- [ ] Console shows `[useX] using mock data` when falling back
- [ ] No console errors on empty tables

---

## Completion Phase (REQUIRED)

### Step 1: Create RESULT Document

```bash
cat docs/templates/TEMPLATE-Result.md
# Create: docs/RESULT-ThreePlanesData-W3-v1.0.md
```

### Step 2: Capture RESULT as Evidence

```bash
mentu capture "Created RESULT-ThreePlanesData-W3: Connected views to Supabase" \
  --kind result-document \
  --path docs/RESULT-ThreePlanesData-W3-v1.0.md \
  --author-type executor
```

### Step 3: Update RESULT Front Matter

```yaml
mentu:
  commitment: cmt_XXXXXXXX
  evidence: mem_YYYYYYYY
  status: in_review
```

### Step 4: Submit

```bash
mentu submit cmt_XXXXXXXX \
  --summary "W3: Connected plane views to Supabase data sources with graceful fallbacks" \
  --include-files
```

---

*W3 makes the dashboard live. Views now show real workspace state.*
