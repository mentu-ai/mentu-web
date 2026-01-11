---
# ============================================================
# CANONICAL YAML FRONT MATTER
# ============================================================
id: PRD-BugReportsInterface-v1.0
path: docs/PRD-BugReportsInterface-v1.0.md
type: prd
intent: reference
version: "1.0"
created: 2026-01-10
last_updated: 2026-01-10

tier: T3

children:
  - HANDOFF-BugReportsInterface-v1.0
dependencies:
  - INTENT-BugReportsInterface-v1.0
  - AUDIT-BugReportsInterface-v1.0

# Backend references (in mentu-ai)
backend:
  workflow_yaml: /Users/rashid/Desktop/Workspaces/mentu-ai/.mentu/workflows/bug-investigation-dual-triad-v2.1.yaml
  result_doc: /Users/rashid/Desktop/Workspaces/mentu-ai/docs/RESULT-BugInvestigationWorkflow-v2.1.md
  handoff_doc: /Users/rashid/Desktop/Workspaces/mentu-ai/docs/HANDOFF-BugInvestigationWorkflow-v2.1.md

mentu:
  commitment: cmt_0d00595f
  status: claimed
---

# PRD: Bug Reports Interface v1.0

## Mission

Build a Bug Reports visualization interface in the Execution plane that displays bug investigation workflow progress, enables approval gates, and provides observability into the Dual Triad (Architect -> Auditor -> Executor) pipeline. Users will see bugs flowing through stages with real-time status updates and can intervene at decision gates.

---

## Problem Statement

### Current State

```
Bug Webhook → Memory Created → Commitment Created → Workflow Triggered
                                                           ↓
                                              [INVISIBLE TO USERS]
                                                           ↓
                                              Architect → Auditor → Executor
                                                           ↓
                                              PR Created → Commitment Closed
```

The Bug Investigation Workflow v2.1 is implemented and running in mentu-ai. However:

1. **No oversight**: Users cannot see what bugs are being processed
2. **No intervention**: Approval gates exist but there's no UI to approve/reject
3. **No debugging**: When workflows fail, there's no way to see step outputs
4. **No analytics**: No view into bug processing throughput

### Desired State

```
Bug Webhook → Memory Created → Commitment Created → Workflow Triggered
                                                           ↓
                                              [VISIBLE IN DASHBOARD]
                                                           ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  Bug Reports                                                            │
├─────────────────────────────────────────────────────────────────────────┤
│  [Inbox] [In Progress] [Review] [Resolved] [Failed]                     │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ Login fails with 500                                    HIGH       │ │
│  │ Source: WarrantyOS  •  10 min ago                                  │ │
│  │ ┌────────────────────────────────────────────────────────────────┐ │ │
│  │ │ Architect ✓ → Auditor ✓ → [Executor ●] → Validate → Deploy     │ │ │
│  │ └────────────────────────────────────────────────────────────────┘ │ │
│  │ Commitment: cmt_lr5i63iq  •  Workflow: running                     │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

Users can see, understand, and intervene in the bug investigation process.

---

## Completion Contract

**First action**: Update `.claude/completion.json`:

```json
{
  "version": "2.0",
  "name": "BugReportsInterface-v1.0",
  "tier": "T3",
  "required_files": [
    "src/app/workspace/[workspace]/[plane]/bug-reports/page.tsx",
    "src/app/workspace/[workspace]/[plane]/bug-reports/[bugId]/page.tsx",
    "src/components/bug-report/bug-report-card.tsx",
    "src/components/bug-report/bug-report-detail.tsx",
    "src/components/bug-report/workflow-progress.tsx",
    "src/hooks/useBugReports.ts",
    "src/hooks/useWorkflowInstance.ts",
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
  "max_iterations": 100
}
```

---

## Core Concepts

### Bug Report (Derived Entity)

A Bug Report is **NOT** a separate record. It's a computed view combining:
- A Memory with `kind: "bug_report"`
- Its linked Commitment (via `source` field)
- Its linked Workflow Instance (via `parameters.commitment_id`)

```typescript
// Bug Report is derived, not stored
const bugReport = {
  // From memory
  id: memory.id,
  title: extractTitle(memory.payload.body),
  severity: memory.payload.severity,
  source: memory.payload.source,
  created_at: memory.timestamp,

  // From linked commitment
  commitment_id: commitment.id,
  commitment_state: commitment.state,

  // From workflow instance
  workflow_instance_id: instance.id,
  workflow_state: instance.state,
  current_step: instance.current_step,
  step_states: instance.step_states
};
```

### Workflow Progress

The Dual Triad workflow has these steps:
1. `architect` - Analyzes bug, proposes strategy
2. `auditor` - Validates strategy against codebase
3. `auditor_gate` - Branch: approved → executor, rejected → architect
4. `approval_gate` - Gate: autonomous or manual approval
5. `executor` - Implements the fix
6. `validate` - Runs npm build/test
7. `complete` - Closes commitment with evidence

### Status Derivation

| Memory State | Commitment State | Workflow State | UI Status |
|--------------|------------------|----------------|-----------|
| captured | - | - | **inbox** |
| committed | open/claimed | pending/running | **in_progress** |
| committed | claimed | at `approval_gate` | **review** |
| committed | closed | completed | **resolved** |
| committed | * | failed | **failed** |

---

## Specification

### Types

```typescript
// Severity levels from webhook
type BugSeverity = "critical" | "high" | "medium" | "low";

// UI status (derived)
type BugStatus = "inbox" | "in_progress" | "review" | "resolved" | "failed";

// Workflow step states
type StepState = "pending" | "running" | "completed" | "failed" | "skipped";

interface BugReport {
  // From memory (kind: "bug_report")
  id: string;                    // mem_xxx
  title: string;                 // Extracted from payload.body
  description: string;           // Extracted from payload.body
  severity: BugSeverity;
  source: string;                // "WarrantyOS", "Internal", etc.
  created_at: string;

  // Linked commitment (from operations where source = this memory)
  commitment_id?: string;        // cmt_xxx
  commitment_state?: string;     // open, claimed, in_review, closed

  // Linked workflow (from workflow_instances)
  workflow_instance_id?: string;
  workflow_state?: string;       // pending, running, completed, failed
  current_step?: string;         // architect, auditor, executor, etc.
  step_states?: Record<string, StepState>;

  // Derived status
  status: BugStatus;
}

interface WorkflowStep {
  id: string;
  type: "commitment" | "gate" | "branch" | "validation" | "terminal";
  state: StepState;
  output?: unknown;
  started_at?: string;
  completed_at?: string;
  error?: string;
}

interface WorkflowInstance {
  id: string;
  workflow_id: string;
  state: "pending" | "running" | "completed" | "failed" | "cancelled";
  parameters: Record<string, unknown>;
  step_states: Record<string, WorkflowStep>;
  current_step: string;
  created_at: string;
  updated_at: string;
}
```

### Operations

| Operation | Input | Output | Description |
|-----------|-------|--------|-------------|
| `listBugReports` | `{ status?: BugStatus, limit?: number }` | `BugReport[]` | List bugs with optional status filter |
| `getBugReport` | `{ id: string }` | `BugReport` | Get full bug detail with step outputs |
| `getWorkflowInstance` | `{ id: string }` | `WorkflowInstance` | Get workflow progress |
| `approveWorkflow` | `{ instance_id: string }` | `void` | Approve at approval gate |
| `rejectWorkflow` | `{ instance_id: string, reason: string }` | `void` | Reject at approval gate |

### Data Queries

**Bug Reports (from operations table)**:
```sql
SELECT
  o.id,
  o.payload,
  o.timestamp,
  c.id as commitment_id,
  c.state as commitment_state,
  wi.id as workflow_instance_id,
  wi.state as workflow_state,
  wi.step_states,
  wi.current_step
FROM operations o
LEFT JOIN operations c ON c.payload->>'source' = o.id AND c.kind = 'commit'
LEFT JOIN workflow_instances wi ON wi.parameters->>'commitment_id' = c.id
WHERE o.kind = 'bug_report'
  AND o.workspace_id = :workspace_id
ORDER BY o.timestamp DESC
```

**Note**: This is a complex join. In practice, use `useOperations` hook filtered by `kind: "bug_report"` and enrich with workflow data.

---

## Implementation

### Deliverables

| File | Purpose |
|------|---------|
| `src/lib/navigation/planeConfig.ts` | Add Bug Reports to Execution plane |
| `src/app/workspace/[workspace]/[plane]/bug-reports/page.tsx` | List view with status tabs |
| `src/app/workspace/[workspace]/[plane]/bug-reports/[bugId]/page.tsx` | Detail view |
| `src/components/bug-report/bug-report-card.tsx` | Card component for list |
| `src/components/bug-report/bug-report-detail.tsx` | Full detail component |
| `src/components/bug-report/workflow-progress.tsx` | Step visualization |
| `src/hooks/useBugReports.ts` | Data fetching hook |
| `src/hooks/useWorkflowInstance.ts` | Workflow instance hook |

### Build Order

1. **Navigation**: Add Bug Reports to Execution plane config
2. **Hooks**: Create data fetching hooks (useBugReports, useWorkflowInstance)
3. **Components**: Build UI components (card, detail, workflow progress)
4. **Routes**: Create page routes with tabs and detail view
5. **Integration**: Wire up real-time subscriptions

### Integration Points

| System | Integration | Notes |
|--------|-------------|-------|
| `useOperations` | Extend for bug_report kind | Filter by kind, enrich with workflow |
| `useRealtimeOperations` | Subscribe to bug updates | Real-time status changes |
| Navigation | planeConfig.ts | Add to Execution plane |
| workflow_instances table | Supabase query | May need API endpoint |

---

## Constraints

- **No new database tables**: Derive from operations + workflow_instances
- **Follow existing patterns**: Use CommitmentsListPage, useCommitments as templates
- **Execution plane**: Lives alongside Kanban, Commitments, Memories
- **Read-mostly**: Only approve/reject actions write
- **Mobile responsive**: All views work on mobile

---

## Success Criteria

### Functional

- [ ] Bug Reports appears in Execution plane navigation
- [ ] List view shows bugs with status tabs (Inbox, In Progress, Review, Resolved, Failed)
- [ ] Each bug card shows title, severity, source, workflow progress
- [ ] Detail view shows full bug description and step outputs
- [ ] Workflow progress visualization shows all 7 steps with states
- [ ] Review tab shows bugs waiting at approval gate
- [ ] Approve/Reject buttons work for bugs in Review status

### Quality

- [ ] All files compile without errors (`tsc --noEmit`)
- [ ] Build passes (`npm run build`)
- [ ] Components follow existing patterns (CommitmentCard, CommitmentTimeline)
- [ ] Responsive design matches dashboard style

### Integration

- [ ] Real-time updates work (bug status changes without refresh)
- [ ] Navigation integrates with existing plane structure
- [ ] Data fetching follows useOperations pattern

---

## Verification Commands

```bash
# Verify build
npm run build

# Verify TypeScript
tsc --noEmit

# Verify navigation config
grep -r "bug-reports" src/lib/navigation/

# Verify components exist
ls -la src/components/bug-report/

# Verify routes exist
ls -la src/app/workspace/\[workspace\]/\[plane\]/bug-reports/
```

---

## References

- `INTENT-BugReportsInterface-v1.0`: Strategic intent from Architect
- `AUDIT-BugReportsInterface-v1.0`: Audit approval and conditions
- `mentu-ai/docs/RESULT-BugInvestigationWorkflow-v2.1.md`: Backend implementation
- `mentu-ai/.mentu/workflows/bug-investigation-dual-triad-v2.1.yaml`: Workflow definition
- `src/app/workspace/[workspace]/[plane]/commitments/page.tsx`: Pattern for list views
- `src/components/commitment/commitment-timeline.tsx`: Pattern for visualization

---

*This PRD delivers visibility into the autonomous bug investigation pipeline, making it observable and controllable.*
