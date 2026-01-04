---
# ============================================================
# CANONICAL YAML FRONT MATTER
# ============================================================
id: HANDOFF-ThreePlanesNavigation-W1-v1.0
path: docs/HANDOFF-ThreePlanesNavigation-W1-v1.0.md
type: handoff
intent: execute

# VERSIONING
version: "1.0"
created: 2026-01-03
last_updated: 2026-01-03

# TIER
tier: T3

# AUTHOR TYPE
author_type: executor

# RELATIONSHIPS
parent: PRD-ThreePlanesNavigation-W1-v1.0
children:
  - PROMPT-ThreePlanesNavigation-W1-v1.0

# MENTU INTEGRATION
mentu:
  commitment: pending
  status: pending

# VALIDATION
validation:
  required: true
  tier: T2
---

# HANDOFF: ThreePlanesNavigation-W1 v1.0

## For the Coding Agent

Build the three-plane navigation shell for mentu-web: TopNav with plane tabs, WorkspaceSelector dropdown, plane-aware Sidebar, and routing infrastructure.

**Read the full PRD**: `docs/PRD-ThreePlanesNavigation-W1-v1.0.md`

---

## Your Identity

You are operating as **executor** (from this HANDOFF's `author_type` field).

Your actor identity comes from the repository manifest (`.mentu/manifest.yaml`).

| Dimension | Source | Value |
|-----------|--------|-------|
| **Actor** | Repository manifest | user:dashboard |
| **Author Type** | This HANDOFF | executor |
| **Context** | Working directory | mentu-web |

**Your domain**: technical

**The Rule**:
- Failure in YOUR domain → Own it. Fix it. Don't explain.
- Failure in ANOTHER domain → You drifted. Re-read this HANDOFF.

---

## Audit Context

This implementation was validated by audit before execution.

**Intent Source**: INTENT-ThreePlanesNavigation-v1.0
**Audit Reference**: AUDIT-ThreePlanesNavigation-v1.0
**Audit Verdict**: MODIFY (decompose into 4 workstreams)
**Auditor**: agent:claude-auditor
**Checkpoint**: 3eb9ec05116b5833cf2d2e28117ab4ae41ebdb74

### Audit Conditions
1. Use `zinc-*` color palette (NOT `slate-*` from prototype)
2. Follow existing component patterns (shadcn, React Query)
3. Preserve existing routes as redirects during transition
4. Read-only Phase 1 - no mutations

---

## Completion Contract

**First action**: Update `.claude/completion.json`:

```json
{
  "version": "2.0",
  "name": "ThreePlanesNavigation-W1",
  "tier": "T3",
  "required_files": [
    "src/components/nav/TopNav.tsx",
    "src/components/nav/WorkspaceSelector.tsx",
    "src/components/nav/PlaneTabs.tsx",
    "src/components/modals/ProjectSettingsModal.tsx",
    "src/components/layout/PlaneSidebar.tsx",
    "src/components/shared/PlaneCard.tsx",
    "src/components/planes/context/ContextOverview.tsx",
    "src/components/planes/capability/CapabilityOverview.tsx",
    "src/components/planes/execution/ExecutionOverview.tsx",
    "src/app/workspace/[workspace]/[plane]/layout.tsx",
    "src/app/workspace/[workspace]/[plane]/page.tsx",
    "src/lib/navigation/planeConfig.ts"
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

## Mentu Protocol

### Identity Resolution

```
┌───────────────────────────────────────────────────────────────────────────┐
│  ACTOR (WHO)              AUTHOR TYPE (ROLE)          CONTEXT (WHERE)     │
│  ─────────────            ──────────────────          ───────────────     │
│  From manifest            From this HANDOFF           From working dir    │
│  user:dashboard           author_type: executor       mentu-web           │
│                                                                           │
│  Actor is auto-resolved. Author type declares your role. Context tracks. │
└───────────────────────────────────────────────────────────────────────────┘
```

### Operations

```bash
cd /Users/rashid/Desktop/Workspaces/mentu-web

# Claim commitment (actor auto-resolved)
mentu claim cmt_XXXXXXXX --author-type executor

# Capture progress (actor auto-resolved)
mentu capture "Stage N complete: description" --kind execution-progress --author-type executor
```

Save the commitment ID. You will close it with evidence.

---

## Design Reference

**CRITICAL**: Read the prototype before building:

```bash
cat docs/mentu-dashboard-v6.jsx
```

This 328-line React component shows:
- Exact TopNav layout with workspace selector
- Plane tabs styling and behavior
- Sidebar structure per plane
- Project settings modal design
- All mock data structures

**Adaptation required**: Prototype uses `slate-*` colors. Convert to `zinc-*`.

---

## Build Order

### Stage 1: Types & Configuration

Create the plane configuration with TypeScript types.

**File**: `src/lib/navigation/planeConfig.ts`

```typescript
export type Plane = 'context' | 'capability' | 'execution';

export interface PlaneView {
  id: string;
  label: string;
  href: string;
  icon?: string;
}

export interface PlaneConfig {
  label: string;
  description: string;
  views: PlaneView[];
}

export const planeConfig: Record<Plane, PlaneConfig> = {
  context: {
    label: 'Context',
    description: 'Identity, knowledge, and who can do what',
    views: [
      { id: 'overview', label: 'Overview', href: '' },
      { id: 'genesis', label: 'Genesis', href: '/genesis' },
      { id: 'knowledge', label: 'Knowledge', href: '/knowledge' },
      { id: 'actors', label: 'Actors', href: '/actors' },
      { id: 'skills', label: 'Skills', href: '/skills' },
    ]
  },
  capability: {
    label: 'Capability',
    description: 'Tools, agents, and automation',
    views: [
      { id: 'overview', label: 'Overview', href: '' },
      { id: 'integrations', label: 'Integrations', href: '/integrations' },
      { id: 'agents', label: 'Agents', href: '/agents' },
      { id: 'automation', label: 'Automation', href: '/automation' },
      { id: 'bridge', label: 'Bridge', href: '/bridge' },
    ]
  },
  execution: {
    label: 'Execution',
    description: 'Your commitment ledger',
    views: [
      { id: 'overview', label: 'Overview', href: '' },
      { id: 'kanban', label: 'Kanban', href: '/kanban' },
      { id: 'commitments', label: 'Commitments', href: '/commitments' },
      { id: 'memories', label: 'Memories', href: '/memories' },
      { id: 'ledger', label: 'Ledger', href: '/ledger' },
    ]
  }
  // NOTE: Bridge moved to Capability plane
};

export const planes: Plane[] = ['context', 'capability', 'execution'];

export function isValidPlane(value: string): value is Plane {
  return planes.includes(value as Plane);
}
```

**Verification**:
```bash
npx tsc --noEmit
```

---

### Stage 2: PlaneTabs Component

Build the plane tabs for the top navigation.

**File**: `src/components/nav/PlaneTabs.tsx`

```typescript
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { planeConfig, planes, Plane, isValidPlane } from '@/lib/navigation/planeConfig';
import { cn } from '@/lib/utils';

export function PlaneTabs() {
  const params = useParams();
  const workspace = params.workspace as string;
  const currentPlane = params.plane as string;

  const activePlane: Plane = isValidPlane(currentPlane) ? currentPlane : 'execution';

  return (
    <div className="flex items-center gap-1">
      {planes.map((plane) => (
        <Link
          key={plane}
          href={`/workspace/${workspace}/${plane}`}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
            activePlane === plane
              ? 'bg-zinc-100 text-zinc-900'
              : 'text-zinc-500 hover:text-zinc-900'
          )}
        >
          {planeConfig[plane].label}
        </Link>
      ))}
    </div>
  );
}
```

**Verification**:
```bash
npx tsc --noEmit
```

---

### Stage 3: WorkspaceSelector Component

Build the workspace dropdown with project settings link.

**File**: `src/components/nav/WorkspaceSelector.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { ChevronDown, Settings, Plus, Folder, Github } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Workspace {
  id: string;
  name: string;
  type: 'local' | 'github';
  path?: string;
  repo?: string;
  synced: boolean;
  current: boolean;
}

interface WorkspaceSelectorProps {
  onSettingsClick: () => void;
}

export function WorkspaceSelector({ onSettingsClick }: WorkspaceSelectorProps) {
  const [open, setOpen] = useState(false);
  const params = useParams();
  const workspaceId = params.workspace as string;

  // TODO: Replace with useWorkspaces() hook in W2
  const workspaces: Workspace[] = [
    { id: workspaceId, name: workspaceId, type: 'local', path: `/Users/rashid/Desktop/Workspaces/${workspaceId}`, synced: true, current: true },
  ];

  const currentWorkspace = workspaces.find(w => w.current) || workspaces[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1 text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md"
      >
        {currentWorkspace?.name}
        <ChevronDown className="w-4 h-4 opacity-50" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-zinc-200 rounded-xl shadow-lg z-50">
            <div className="p-2">
              <div className="text-xs text-zinc-400 uppercase tracking-wider px-3 py-2">
                Workspaces
              </div>
              {workspaces.map(ws => (
                <button
                  key={ws.id}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-zinc-50',
                    ws.current && 'bg-zinc-50'
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    ws.type === 'github' ? 'bg-zinc-900 text-white' : 'bg-zinc-100'
                  )}>
                    {ws.type === 'github' ? <Github className="w-4 h-4" /> : <Folder className="w-4 h-4 text-zinc-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-zinc-900">{ws.name}</div>
                    <div className="text-xs text-zinc-400 truncate">
                      {ws.type === 'github' ? ws.repo : ws.path}
                    </div>
                  </div>
                  {ws.current && <span className="w-2 h-2 bg-green-500 rounded-full" />}
                </button>
              ))}
            </div>
            <div className="border-t border-zinc-100 p-2">
              <button
                onClick={() => { setOpen(false); onSettingsClick(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 rounded-lg"
              >
                <Settings className="w-4 h-4" />
                Project Settings
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-zinc-50 rounded-lg">
                <Plus className="w-4 h-4" />
                Add Project
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

**Verification**:
```bash
npx tsc --noEmit
```

---

### Stage 4: ProjectSettingsModal Component

Build the project settings modal.

**File**: `src/components/modals/ProjectSettingsModal.tsx`

```typescript
'use client';

import { X, Folder } from 'lucide-react';
import { useParams } from 'next/navigation';

interface ProjectSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function ProjectSettingsModal({ open, onClose }: ProjectSettingsModalProps) {
  const params = useParams();
  const workspaceId = params.workspace as string;

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-zinc-200">
          <h2 className="text-lg font-semibold text-zinc-900">Project Settings</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Project */}
          <div>
            <h3 className="text-sm font-medium text-zinc-500 mb-3">CURRENT PROJECT</h3>
            <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-xl">
              <div className="w-12 h-12 bg-zinc-100 rounded-lg flex items-center justify-center">
                <Folder className="w-6 h-6 text-zinc-500" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-zinc-900">{workspaceId}</div>
                <div className="text-xs text-zinc-500 font-mono">
                  /Users/rashid/Desktop/Workspaces/{workspaceId}
                </div>
              </div>
              <span className="flex items-center gap-1 text-xs text-green-600">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                Synced
              </span>
            </div>
          </div>

          {/* Sync Settings */}
          <div>
            <h3 className="text-sm font-medium text-zinc-500 mb-3">SYNC</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-zinc-900">Auto-sync</div>
                  <div className="text-xs text-zinc-500">Sync changes automatically</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-9 h-5 bg-zinc-200 peer-checked:bg-zinc-900 rounded-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-zinc-900">Cloud backup</div>
                  <div className="text-xs text-zinc-500">Sync to Mentu Cloud</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-9 h-5 bg-zinc-200 peer-checked:bg-zinc-900 rounded-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                </label>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div>
            <h3 className="text-sm font-medium text-red-600 mb-3">DANGER ZONE</h3>
            <div className="p-4 border border-red-200 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-zinc-900">Disconnect project</div>
                <div className="text-xs text-zinc-500">Remove from Mentu (keeps local files)</div>
              </div>
              <button className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">
                Disconnect
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-zinc-200 bg-zinc-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Verification**:
```bash
npx tsc --noEmit
```

---

### Stage 5: TopNav Component

Build the main top navigation bar.

**File**: `src/components/nav/TopNav.tsx`

```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PlaneTabs } from './PlaneTabs';
import { WorkspaceSelector } from './WorkspaceSelector';
import { ProjectSettingsModal } from '@/components/modals/ProjectSettingsModal';

interface TopNavProps {
  user?: {
    name?: string;
    email?: string;
  };
}

export function TopNav({ user }: TopNavProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const params = useParams();
  const workspace = params.workspace as string;

  return (
    <>
      <nav className="bg-white border-b border-zinc-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 h-14">
          {/* Left: Logo + Workspace Selector */}
          <div className="flex items-center gap-3">
            <Link
              href={`/workspace/${workspace}/execution`}
              className="flex items-center gap-2 hover:opacity-80"
            >
              <div className="w-7 h-7 bg-zinc-900 rounded-md" />
              <span className="font-semibold text-zinc-900">mentu</span>
            </Link>
            <span className="text-zinc-300">·</span>
            <WorkspaceSelector onSettingsClick={() => setSettingsOpen(true)} />
          </div>

          {/* Center: Plane Tabs */}
          <PlaneTabs />

          {/* Right: User */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm text-zinc-600">
              {user?.name || user?.email || 'User'}
            </span>
          </div>
        </div>
      </nav>

      <ProjectSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}
```

**Verification**:
```bash
npx tsc --noEmit
```

---

### Stage 6: PlaneSidebar Component

Build the plane-aware sidebar.

**File**: `src/components/layout/PlaneSidebar.tsx`

```typescript
'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { planeConfig, Plane, isValidPlane } from '@/lib/navigation/planeConfig';
import { cn } from '@/lib/utils';

export function PlaneSidebar() {
  const params = useParams();
  const pathname = usePathname();
  const workspace = params.workspace as string;
  const currentPlane = params.plane as string;

  const activePlane: Plane = isValidPlane(currentPlane) ? currentPlane : 'execution';
  const config = planeConfig[activePlane];
  const basePath = `/workspace/${workspace}/${activePlane}`;

  return (
    <aside className="w-48 bg-white border-r border-zinc-200 min-h-[calc(100vh-3.5rem)] p-3">
      <nav className="space-y-0.5">
        {config.views.map((view) => {
          const href = `${basePath}${view.href}`;
          const isActive = pathname === href || (view.href === '' && pathname === basePath);

          return (
            <Link
              key={view.id}
              href={href}
              className={cn(
                'block w-full px-3 py-2 text-sm text-left rounded-lg transition-colors',
                isActive
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100'
              )}
            >
              {view.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

**Verification**:
```bash
npx tsc --noEmit
```

---

### Stage 7: PlaneCard Component

Build the reusable card component for overview pages.

**File**: `src/components/shared/PlaneCard.tsx`

```typescript
'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface PlaneCardProps {
  title: string;
  description: string;
  stat?: string;
  href: string;
  className?: string;
}

export function PlaneCard({ title, description, stat, href, className }: PlaneCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'block bg-white rounded-xl border border-zinc-200 p-6 text-left hover:border-zinc-300 transition-colors',
        className
      )}
    >
      <div className="text-lg font-semibold text-zinc-900 mb-2">{title}</div>
      <p className="text-sm text-zinc-500 mb-4">{description}</p>
      {stat && <div className="text-xs text-zinc-400">{stat}</div>}
    </Link>
  );
}
```

**Verification**:
```bash
npx tsc --noEmit
```

---

### Stage 8: Overview Components

Create placeholder overview components for each plane.

**File**: `src/components/planes/context/ContextOverview.tsx`

```typescript
'use client';

import { useParams } from 'next/navigation';
import { PlaneCard } from '@/components/shared/PlaneCard';

export function ContextOverview() {
  const params = useParams();
  const workspace = params.workspace as string;
  const basePath = `/workspace/${workspace}/context`;

  const cards = [
    { id: 'genesis', title: 'Genesis', description: 'Constitutional principles and trust gradient', stat: 'Identity', href: `${basePath}/genesis` },
    { id: 'knowledge', title: 'Knowledge', description: 'Documents, specs, and guides', stat: 'Reference', href: `${basePath}/knowledge` },
    { id: 'actors', title: 'Actors', description: 'Humans and agents with permissions', stat: 'Permissions', href: `${basePath}/actors` },
    { id: 'skills', title: 'Skills', description: 'Reusable knowledge + actor directives', stat: 'Capabilities', href: `${basePath}/skills` },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Context</h1>
        <p className="text-zinc-500">Identity, knowledge, and who can do what</p>
      </div>
      <div className="grid grid-cols-2 gap-6">
        {cards.map(card => (
          <PlaneCard key={card.id} {...card} />
        ))}
      </div>
    </div>
  );
}
```

**File**: `src/components/planes/capability/CapabilityOverview.tsx`

```typescript
'use client';

import { useParams } from 'next/navigation';
import { PlaneCard } from '@/components/shared/PlaneCard';

export function CapabilityOverview() {
  const params = useParams();
  const workspace = params.workspace as string;
  const basePath = `/workspace/${workspace}/capability`;

  const cards = [
    { id: 'integrations', title: 'Integrations', description: 'Plugin, remote access, MCPs', stat: 'Connections', href: `${basePath}/integrations` },
    { id: 'agents', title: 'Agents', description: 'AI workers and automation', stat: 'Workers', href: `${basePath}/agents` },
    { id: 'automation', title: 'Automation', description: 'Hooks and schedules', stat: 'Triggers', href: `${basePath}/automation` },
    { id: 'bridge', title: 'Bridge', description: 'Remote execution and commands', stat: 'Commands', href: `${basePath}/bridge` },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Capability</h1>
        <p className="text-zinc-500">Tools, agents, and automation</p>
      </div>
      <div className="grid grid-cols-2 gap-6">
        {cards.map(card => (
          <PlaneCard key={card.id} {...card} />
        ))}
      </div>
    </div>
  );
}
```

**File**: `src/components/planes/execution/ExecutionOverview.tsx`

```typescript
'use client';

import { useParams } from 'next/navigation';
import { PlaneCard } from '@/components/shared/PlaneCard';

export function ExecutionOverview() {
  const params = useParams();
  const workspace = params.workspace as string;
  const basePath = `/workspace/${workspace}/execution`;

  // TODO: Wire up real stats from useOperations() in W2
  const stats = [
    { label: 'Open', value: '0', color: 'text-zinc-900' },
    { label: 'In Progress', value: '0', color: 'text-emerald-600' },
    { label: 'Memories', value: '0', color: 'text-zinc-900' },
    { label: 'Operations', value: '0', color: 'text-zinc-900' },
  ];

  const cards = [
    { id: 'kanban', title: 'Kanban', description: 'Visual workflow board', href: `${basePath}/kanban` },
    { id: 'commitments', title: 'Commitments', description: 'All work items', href: `${basePath}/commitments` },
    { id: 'memories', title: 'Memories', description: 'Evidence and captures', href: `${basePath}/memories` },
    { id: 'ledger', title: 'Ledger', description: 'Full operation history', href: `${basePath}/ledger` },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Execution</h1>
        <p className="text-zinc-500">Your commitment ledger</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-zinc-200 p-4">
            <div className={`text-2xl font-semibold ${stat.color}`}>{stat.value}</div>
            <div className="text-sm text-zinc-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-4">
        {cards.map(card => (
          <PlaneCard key={card.id} {...card} />
        ))}
      </div>
    </div>
  );
}
```

**Verification**:
```bash
npx tsc --noEmit
```

---

### Stage 9: Plane Layout and Routing

Create the plane-scoped layout and routing.

**File**: `src/app/workspace/[workspace]/[plane]/layout.tsx`

```typescript
import { redirect } from 'next/navigation';
import { isValidPlane } from '@/lib/navigation/planeConfig';
import { TopNav } from '@/components/nav/TopNav';
import { PlaneSidebar } from '@/components/layout/PlaneSidebar';
import { createClient } from '@/lib/supabase/server';

interface PlaneLayoutProps {
  children: React.ReactNode;
  params: Promise<{ workspace: string; plane: string }>;
}

export default async function PlaneLayout({ children, params }: PlaneLayoutProps) {
  const { workspace, plane } = await params;

  // Validate plane
  if (!isValidPlane(plane)) {
    redirect(`/workspace/${workspace}/execution`);
  }

  // Get user for TopNav
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-zinc-50">
      <TopNav user={user ? { email: user.email } : undefined} />
      <div className="flex">
        <PlaneSidebar />
        <main className="flex-1 p-8 max-w-5xl">
          {children}
        </main>
      </div>
    </div>
  );
}
```

**File**: `src/app/workspace/[workspace]/[plane]/page.tsx`

```typescript
import { notFound } from 'next/navigation';
import { isValidPlane, Plane } from '@/lib/navigation/planeConfig';
import { ContextOverview } from '@/components/planes/context/ContextOverview';
import { CapabilityOverview } from '@/components/planes/capability/CapabilityOverview';
import { ExecutionOverview } from '@/components/planes/execution/ExecutionOverview';

interface PlanePageProps {
  params: Promise<{ workspace: string; plane: string }>;
}

const overviewComponents: Record<Plane, React.ComponentType> = {
  context: ContextOverview,
  capability: CapabilityOverview,
  execution: ExecutionOverview,
};

export default async function PlanePage({ params }: PlanePageProps) {
  const { plane } = await params;

  if (!isValidPlane(plane)) {
    notFound();
  }

  const OverviewComponent = overviewComponents[plane];
  return <OverviewComponent />;
}
```

**Verification**:
```bash
npx tsc --noEmit
```

---

### Stage 10: Update Root Workspace Redirect

Update the workspace root to redirect to execution.

**File**: Update `src/app/workspace/[workspace]/page.tsx`

Add redirect to execution at the top:

```typescript
import { redirect } from 'next/navigation';

interface WorkspacePageProps {
  params: Promise<{ workspace: string }>;
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { workspace } = await params;
  redirect(`/workspace/${workspace}/execution`);
}
```

**Verification**:
```bash
npm run build
```

---

### Stage 11: Create Execution View Stubs

Create placeholder pages for existing execution views under the new route structure.

For each: `/kanban`, `/commitments`, `/memories`, `/ledger`

**File**: `src/app/workspace/[workspace]/[plane]/kanban/page.tsx`

```typescript
import { KanbanPage } from '@/components/kanban/KanbanPage';

export default function KanbanRoute() {
  return <KanbanPage />;
}
```

Repeat pattern for commitments, memories, ledger (importing existing components).

**Verification**:
```bash
npm run build
npm run dev
# Navigate to http://localhost:3000/workspace/mentu-ai/execution/kanban
```

---

## Visual Verification

### Capture Points

| Name | URL | Description |
|------|-----|-------------|
| `topnav-planes` | `http://localhost:3000/workspace/mentu-ai/execution` | TopNav with all three plane tabs visible |
| `workspace-selector` | (same URL, click selector) | Workspace dropdown open |
| `project-settings` | (click Project Settings) | Modal open |
| `context-overview` | `http://localhost:3000/workspace/mentu-ai/context` | Context plane overview |
| `capability-overview` | `http://localhost:3000/workspace/mentu-ai/capability` | Capability plane overview |
| `execution-overview` | `http://localhost:3000/workspace/mentu-ai/execution` | Execution plane overview |
| `sidebar-context` | `/context` | Sidebar showing context views |
| `sidebar-execution` | `/execution` | Sidebar showing execution views |

### Evidence Path

```
docs/evidence/ThreePlanesNavigation-W1/screenshots/
```

---

## Before Submitting

Before running `mentu submit`, verify:

1. All 12 required files exist
2. `npm run build` passes
3. `npx tsc --noEmit` passes
4. Navigation between planes works
5. Sidebar updates per plane
6. Workspace selector opens and shows settings link
7. Project settings modal opens

---

## Completion Phase (REQUIRED)

### Step 1: Create RESULT Document

```bash
# Read template
cat /Users/rashid/Desktop/Workspaces/mentu-ai/docs/templates/TEMPLATE-Result.md

# Create: docs/RESULT-ThreePlanesNavigation-W1-v1.0.md
```

### Step 2: Capture RESULT as Evidence

```bash
mentu capture "Created RESULT-ThreePlanesNavigation-W1: Navigation shell complete with TopNav, plane tabs, workspace selector, and plane-aware sidebar" \
  --kind result-document \
  --path docs/RESULT-ThreePlanesNavigation-W1-v1.0.md \
  --refs cmt_XXXXXXXX \
  --author-type executor
```

### Step 3: Update RESULT Front Matter

```yaml
mentu:
  commitment: cmt_XXXXXXXX
  evidence: mem_YYYYYYYY  # ← The ID from Step 2
  status: in_review
```

### Step 4: Submit with Evidence

```bash
mentu submit cmt_XXXXXXXX \
  --summary "W1 Navigation Shell complete: TopNav, PlaneTabs, WorkspaceSelector, PlaneSidebar, 3 overview pages, plane routing" \
  --include-files
```

---

## Verification Checklist

### Files
- [ ] `src/lib/navigation/planeConfig.ts` exists
- [ ] `src/components/nav/TopNav.tsx` exists
- [ ] `src/components/nav/PlaneTabs.tsx` exists
- [ ] `src/components/nav/WorkspaceSelector.tsx` exists
- [ ] `src/components/modals/ProjectSettingsModal.tsx` exists
- [ ] `src/components/layout/PlaneSidebar.tsx` exists
- [ ] `src/components/shared/PlaneCard.tsx` exists
- [ ] `src/components/planes/context/ContextOverview.tsx` exists
- [ ] `src/components/planes/capability/CapabilityOverview.tsx` exists
- [ ] `src/components/planes/execution/ExecutionOverview.tsx` exists
- [ ] `src/app/workspace/[workspace]/[plane]/layout.tsx` exists
- [ ] `src/app/workspace/[workspace]/[plane]/page.tsx` exists

### Checks
- [ ] `npm run build` passes
- [ ] `npx tsc --noEmit` passes
- [ ] No console errors in browser

### Mentu
- [ ] Commitment claimed with `mentu claim`
- [ ] **RESULT document created**
- [ ] **RESULT captured as evidence**
- [ ] Commitment submitted with `mentu submit`

### Functionality
- [ ] Can click between Context, Capability, Execution tabs
- [ ] Sidebar changes based on active plane
- [ ] Workspace selector opens and shows dropdown
- [ ] Project settings modal opens from selector
- [ ] Clicking logo returns to Execution overview
- [ ] Old routes still work (redirect to new structure)

---

*W1 is the foundation. Build it solid.*
