---
# ============================================================
# CANONICAL YAML FRONT MATTER
# ============================================================
id: HANDOFF-MentuKanban-Phase1B-v1.0
path: docs/HANDOFF-MentuKanban-Phase1B-v1.0.md
type: handoff
intent: execute

# VERSIONING
version: "1.0"
created: 2026-01-03
last_updated: 2026-01-03

# TIER
tier: T2

# AUTHOR TYPE
author_type: executor

# RELATIONSHIPS
parent: AUDIT-MentuKanban-v1.0
children:
  - PROMPT-MentuKanban-Phase1B-v1.0

# MENTU INTEGRATION
mentu:
  commitment: pending
  status: pending

# VALIDATION
validation:
  required: true
  tier: T2
---

# HANDOFF: Mentu Kanban Phase 1B - Visual Enhancements

## For the Coding Agent

Enhance the Kanban board with visual polish: 5th column, running indicator, emoji log icons, and per-file revert in diff viewer.

**Read the audit**: `docs/AUDIT-MentuKanban-v1.0.md`

---

## Current State (Visual Reference)

What exists now (from production screenshots):

### Kanban Board (`/workspace/mentu-ai/commitments`)
```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Kanban                                              🔍 Search...            │
│  50 commitments                                                              │
├──────────────────┬─────────────────┬─────────────────┬──────────────────────│
│  To Do        5  │  In Progress  1 │  In Review      │  (Done not visible)  │
├──────────────────┼─────────────────┼─────────────────┼──────────────────────│
│ ┌──────────────┐ │ ┌─────────────┐ │                 │                      │
│ │Test spawn... │ │ │Deliver auto-│ │  No commitments │                      │
│ │      1 day   │ │ │trigger...   │ │                 │                      │
│ └──────────────┘ │ │ ○ agent:cla.│ │                 │                      │
│ ┌──────────────┐ │ │      2 days │ │                 │                      │
│ │Run CI for... │ │ └─────────────┘ │                 │                      │
│ │      2 days  │ │                 │                 │                      │
│ └──────────────┘ │                 │                 │                      │
└──────────────────┴─────────────────┴─────────────────┴──────────────────────┘
```

**Cards currently show**: Title (commitment body), timestamp
**Cards MISSING**: Running indicator, overflow menu, source description

### Side Panel (when card clicked)
```
┌─────────────────────────────────────────────────────┐
│  [claimed] cmt_4b9d8c93                         ✕   │
├─────────────────────────────────────────────────────┤
│  Deliver auto-trigger for signal triage             │
│  ↗ Source: mem_d2848c6a                             │
├─────────────────────────────────────────────────────┤
│  CREATED          OWNER                             │
│  ○ 2 days ago     👤 agent:claude-auto-triage       │
│                                                     │
│  WORKTREE PATH                                      │
│  📁 /worktrees/cmt_4b9d8c93              [📋]      │
│                                                     │
│  BRANCH           BASE                              │
│  ↗ cmt_4b9d8c93   ↙ main                           │
├─────────────────────────────────────────────────────┤
│  [▶ Spawn Agent] [🖥 Dev Server] [↗ Create PR]      │
├─────────────────────────────────────────────────────┤
│  [Timeline]  [Logs]  [Changes]                      │
├─────────────────────────────────────────────────────┤
│  ● Created  by agent:claude-auto-triage             │
│  │  2 days ago                                      │
│  │  Deliver auto-trigger for signal triage          │
│  ○ Claimed  by agent:claude-auto-triage             │
│     2 days ago                                      │
└─────────────────────────────────────────────────────┘
```

**Panel currently has**: Good metadata layout, action buttons, tabs
**Panel MISSING**: Edit/Delete buttons (defer), Chat input (defer)

### Terminal Bridge (`/workspace/mentu-ai/bridge`)
```
┌─────────────────────────────────────────────────────┐
│  Terminal Bridge                                    │
│  Monitor remote command execution                   │
├─────────────────────────────────────────────────────┤
│  Machines                                           │
│  ┌─────────────────────┐ ┌─────────────────────┐   │
│  │ Mentu VPS (Vultr)   │ │ MacBook Pro         │   │
│  │ vps-mentu-01  [busy]│ │ macbook-rashid [on] │   │
│  │ Last seen <1min     │ │ Last seen <1min     │   │
│  └─────────────────────┘ └─────────────────────┘   │
├─────────────────────────────────────────────────────┤
│  Commands                                           │
│  [All] [Pending] [Running] [Completed] [Failed]     │
│  ┌─────────────────────────────────────────────┐   │
│  │ ✓ completed  bash         4 days ago        │   │
│  │   open -a "Google Chrome" https://netflix.. │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

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
- Failure in YOUR domain -> Own it. Fix it. Don't explain.
- Failure in ANOTHER domain -> You drifted. Re-read this HANDOFF.

---

## Completion Contract

**First action**: Update `.claude/completion.json`:

```json
{
  "version": "2.0",
  "name": "Kanban Phase 1B",
  "tier": "T2",
  "required_files": [
    "src/components/kanban/KanbanColumn.tsx",
    "src/components/kanban/CommitmentCard.tsx",
    "src/components/kanban/BridgeLogsViewer.tsx",
    "src/components/diff/DiffViewer.tsx",
    "src/hooks/useKanbanCommitments.ts"
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

## Scope

### In Scope (DO)

1. **Add 5th column (Cancelled)** - Add to column config and type
2. **Add running indicator to cards** - Spinner when agent is active
3. **Add emoji icons to logs** - Replace Lucide icons with emoji
4. **Add per-file revert button in DiffViewer** - Delete button per file

### Out of Scope (DON'T)

- Chat input (requires new API endpoints)
- Pause/Resume agent (requires new API endpoints)
- Edit/Delete buttons in panel header (requires mutation API)
- Card overflow menu (nice-to-have, defer)

---

## Build Order

### Stage 1: Add Cancelled Column

**Purpose**: Add 5th column to match PRD vision.

**File**: `src/hooks/useKanbanCommitments.ts`

Find the KanbanColumn type and add 'cancelled':

```typescript
export type KanbanColumn = 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled';
```

Update the mapStateToColumn function to handle the cancelled state:

```typescript
function mapStateToColumn(state: string): KanbanColumn {
  switch (state) {
    case 'open':
      return 'todo';
    case 'claimed':
    case 'reopened':
      return 'in_progress';
    case 'in_review':
      return 'in_review';
    case 'closed':
      return 'done';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'todo';
  }
}
```

Update the KanbanColumns type to include cancelled:

```typescript
export type KanbanColumns = Record<KanbanColumn, Commitment[]>;
```

Update the initial state in the hook:

```typescript
const emptyColumns: KanbanColumns = {
  todo: [],
  in_progress: [],
  in_review: [],
  done: [],
  cancelled: [],
};
```

**File**: `src/components/kanban/KanbanColumn.tsx`

Add the cancelled column config:

```typescript
const columnConfig: Record<KanbanColumnType, ColumnConfig> = {
  todo: {
    title: 'To Do',
    color: 'text-zinc-600 dark:text-zinc-400',
    bgColor: 'bg-zinc-100 dark:bg-zinc-800',
  },
  in_progress: {
    title: 'In Progress',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
  },
  in_review: {
    title: 'In Review',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
  },
  done: {
    title: 'Done',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
  },
  cancelled: {
    title: 'Cancelled',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
  },
};
```

**File**: `src/components/kanban/KanbanBoard.tsx`

Update the column order:

```typescript
const COLUMN_ORDER: KanbanColumnType[] = ['todo', 'in_progress', 'in_review', 'done', 'cancelled'];
```

**Verification**:
```bash
npm run type-check
```

---

### Stage 2: Add Running Indicator to Cards

**Purpose**: Show spinner on cards when an agent is running.

**File**: `src/components/kanban/CommitmentCard.tsx`

Add props for running status:

```typescript
interface CommitmentCardProps {
  commitment: Commitment;
  onClick: () => void;
  isSelected?: boolean;
  isRunning?: boolean;  // NEW
}
```

Add spinner display:

```typescript
import { TreeDeciduous, GitPullRequest, User, Loader2 } from 'lucide-react';

export function CommitmentCard({ commitment, onClick, isSelected, isRunning }: CommitmentCardProps) {
  // ... existing code ...

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left bg-white dark:bg-zinc-900 border rounded-lg p-3 transition-all',
        'hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-sm',
        isSelected
          ? 'border-blue-500 dark:border-blue-400 ring-1 ring-blue-500 dark:ring-blue-400'
          : 'border-zinc-200 dark:border-zinc-800',
        isRunning && 'border-blue-300 dark:border-blue-600'  // Subtle blue border when running
      )}
    >
      {/* Running indicator */}
      {isRunning && (
        <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 mb-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Agent running...</span>
        </div>
      )}

      {/* Title - rest of existing code */}
      <p className="font-medium text-sm line-clamp-2 mb-2">
        {commitment.body}
      </p>

      {/* ... rest of existing JSX ... */}
    </button>
  );
}
```

**File**: `src/components/kanban/KanbanColumn.tsx`

Pass running status to cards:

```typescript
interface KanbanColumnProps {
  column: KanbanColumnType;
  commitments: Commitment[];
  selectedId: string | null;
  onCardClick: (id: string) => void;
  runningCommitmentIds?: string[];  // NEW
}

export function KanbanColumn({
  column,
  commitments,
  selectedId,
  onCardClick,
  runningCommitmentIds = [],
}: KanbanColumnProps) {
  // ... existing code ...

  // In the map:
  commitments.map((commitment) => (
    <CommitmentCard
      key={commitment.id}
      commitment={commitment}
      isSelected={selectedId === commitment.id}
      isRunning={runningCommitmentIds.includes(commitment.id)}  // NEW
      onClick={() => onCardClick(commitment.id)}
    />
  ))
}
```

**File**: `src/components/kanban/KanbanBoard.tsx`

Pass running commitment IDs to columns:

```typescript
interface KanbanBoardProps {
  columns: KanbanColumns;
  selectedId: string | null;
  onCardClick: (id: string) => void;
  runningCommitmentIds?: string[];  // NEW
}

export function KanbanBoard({ columns, selectedId, onCardClick, runningCommitmentIds = [] }: KanbanBoardProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMN_ORDER.map((column) => (
        <KanbanColumn
          key={column}
          column={column}
          commitments={columns[column]}
          selectedId={selectedId}
          onCardClick={onCardClick}
          runningCommitmentIds={runningCommitmentIds}  // NEW
        />
      ))}
    </div>
  );
}
```

**File**: `src/components/kanban/KanbanPage.tsx`

Compute running commitment IDs from bridge commands:

```typescript
// Inside the component, after useBridgeCommands hook:
const runningCommitmentIds = useMemo(() => {
  if (!bridgeCommands) return [];
  return bridgeCommands
    .filter(cmd => cmd.status === 'running' || cmd.status === 'pending')
    .filter(cmd => cmd.commitment_id)
    .map(cmd => cmd.commitment_id as string);
}, [bridgeCommands]);

// Pass to KanbanBoard:
<KanbanBoard
  columns={columns}
  selectedId={selectedCommitmentId}
  onCardClick={handleCardClick}
  runningCommitmentIds={runningCommitmentIds}
/>
```

**Verification**:
```bash
npm run type-check
```

---

### Stage 3: Add Emoji Icons to Logs

**Purpose**: Replace Lucide icons with emoji per PRD vision.

**File**: `src/components/kanban/BridgeLogsViewer.tsx`

Update the log type definition and icon function:

```typescript
interface LogLineProps {
  log: {
    id: string;
    type: 'system' | 'agent' | 'tool' | 'todo' | 'error' | 'task' | 'file';
    content: string;
  };
}

function LogLine({ log }: LogLineProps) {
  const getEmoji = () => {
    switch (log.type) {
      case 'task':
        return '🚀';
      case 'system':
        return '⚙️';
      case 'agent':
        return '💬';
      case 'todo':
        return '📋';
      case 'tool':
        return '🔧';
      case 'file':
        return '📄';
      case 'error':
        return '❌';
      default:
        return '💬';
    }
  };

  const getColor = () => {
    switch (log.type) {
      case 'system':
        return 'text-zinc-400';
      case 'task':
        return 'text-blue-300';
      case 'tool':
        return 'text-yellow-300';
      case 'error':
        return 'text-red-300';
      case 'todo':
        return 'text-purple-300';
      case 'file':
        return 'text-green-300';
      case 'agent':
      default:
        return 'text-zinc-300';
    }
  };

  return (
    <div className={cn('flex gap-2 py-0.5', getColor())}>
      <span className="flex-shrink-0">{getEmoji()}</span>
      <span className="whitespace-pre-wrap break-all">{log.content}</span>
    </div>
  );
}
```

Remove unused Lucide imports:

```typescript
// Remove these imports:
// import { Bot, Wrench, AlertCircle, CheckSquare, Square } from 'lucide-react';

// Keep only these:
import { Copy, Check, ArrowDownToLine, Pause, Terminal } from 'lucide-react';
```

**Verification**:
```bash
npm run type-check
```

---

### Stage 4: Add Per-File Revert Button in DiffViewer

**Purpose**: Allow reverting individual file changes.

**File**: `src/components/diff/DiffViewer.tsx`

Add revert functionality to FileDiff component:

```typescript
import { Trash2 } from 'lucide-react';  // Add to imports

interface FileDiffProps {
  file: DiffFile;
  defaultExpanded?: boolean;
  onRevert?: (path: string) => void;  // NEW
}

function FileDiff({
  file,
  defaultExpanded = true,
  onRevert,
}: FileDiffProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [isReverting, setIsReverting] = useState(false);

  const handleRevert = async (e: React.MouseEvent) => {
    e.stopPropagation();  // Don't toggle expand
    if (!onRevert) return;

    setIsReverting(true);
    try {
      await onRevert(file.path);
    } finally {
      setIsReverting(false);
    }
  };

  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden mb-3">
      {/* File header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
      >
        {/* ... existing icon and path content ... */}

        {/* Add revert button before the change stats */}
        {onRevert && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRevert}
            disabled={isReverting}
            className="h-6 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
            title="Revert this file"
          >
            <Trash2 className={cn('h-3 w-3', isReverting && 'animate-pulse')} />
          </Button>
        )}

        <div className="flex items-center gap-2 text-xs ml-2">
          {/* ... existing stats ... */}
        </div>
      </button>

      {/* ... rest of component ... */}
    </div>
  );
}
```

Update DiffViewer props and pass revert handler:

```typescript
export interface DiffViewerProps {
  commitmentId: string;
  defaultExpanded?: boolean;
  pollingInterval?: number | false;
  className?: string;
  onRevertFile?: (path: string) => Promise<void>;  // NEW
}

export function DiffViewer({
  commitmentId,
  defaultExpanded = true,
  pollingInterval = 5000,
  className,
  onRevertFile,
}: DiffViewerProps) {
  // ... existing hooks ...

  const handleRevert = async (path: string) => {
    if (onRevertFile) {
      await onRevertFile(path);
      // Refetch after revert
      refetch();
    }
  };

  // ... existing render logic ...

  return (
    <div className={cn('diff-viewer', className)}>
      <DiffHeader /* ... */ />

      <div className="space-y-0">
        {diff.files.map((file) => (
          <FileDiff
            key={file.path}
            file={file}
            defaultExpanded={defaultExpanded && diff.files.length <= 5}
            onRevert={onRevertFile ? handleRevert : undefined}
          />
        ))}
      </div>

      {/* ... base commit display ... */}
    </div>
  );
}
```

**File**: `src/components/kanban/CommitmentPanel.tsx`

Add revert handler (stub for now - requires API):

```typescript
// In CommitmentPanel component:
const handleRevertFile = async (path: string) => {
  // TODO: Implement via API
  console.log('Revert file:', path, 'in commitment:', commitment?.id);
  // For now, this is a no-op - will need API endpoint
};

// Pass to DiffViewer:
<DiffViewer
  commitmentId={commitment.id}
  pollingInterval={activeTab === 'changes' ? 5000 : false}
  onRevertFile={handleRevertFile}
/>
```

**Verification**:
```bash
npm run type-check
npm run build
```

---

## Before Submitting

Before running `mentu submit`, verify:

1. **Type check passes**: `npm run type-check`
2. **Build succeeds**: `npm run build`
3. **Manual test**: Run `npm run dev` and verify:
   - 5 columns display (including Cancelled)
   - Cards show spinner when agent is running (if you have running commands)
   - Logs show emoji icons
   - Diff viewer shows revert button on each file

---

## Verification Checklist

### Files
- [ ] `src/hooks/useKanbanCommitments.ts` - has cancelled column type
- [ ] `src/components/kanban/KanbanBoard.tsx` - has 5 column order
- [ ] `src/components/kanban/KanbanColumn.tsx` - has cancelled config
- [ ] `src/components/kanban/CommitmentCard.tsx` - has isRunning prop
- [ ] `src/components/kanban/BridgeLogsViewer.tsx` - has emoji icons
- [ ] `src/components/diff/DiffViewer.tsx` - has onRevertFile prop

### Checks
- [ ] `npm run build` passes
- [ ] `npm run type-check` passes

### Functionality
- [ ] 5 columns render (To Do, In Progress, In Review, Done, Cancelled)
- [ ] Cards show "Agent running..." with spinner when active
- [ ] Logs display emoji icons (🚀 ⚙️ 💬 📋 🔧 📄 ❌)
- [ ] Diff viewer shows revert button on each file header

---

*Phase 1B completes the visual polish. Phase 2 will add chat input and pause/resume once API endpoints are available.*
