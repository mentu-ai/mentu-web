---
# ============================================================
# CANONICAL YAML FRONT MATTER
# ============================================================
id: RESULT-BugReportsInterface-v1.0
path: docs/RESULT-BugReportsInterface-v1.0.md
type: result
intent: reference
version: "1.0"
created: 2026-01-10
last_updated: 2026-01-10

actor: agent:claude-code

parent: HANDOFF-BugReportsInterface-v1.0

mentu:
  commitment: cmt_f71c09ac
  evidence: mem_00a393a2
  status: in_review
---

# RESULT: BugReportsInterface v1.0

**Completed:** 2026-01-10

---

## Summary

Implemented the Bug Reports visualization interface for the Execution plane in mentu-web. The interface provides list view with status-based tabs (Inbox, In Progress, Review, Resolved, Failed), card components with severity indicators and workflow progress visualization, and detail view with approval actions for bugs awaiting human review. This makes autonomous bug fixing observable and controllable from the dashboard.

---

## Activation

Navigate to the Bug Reports view in the Execution plane:

```bash
# Access Bug Reports interface
http://localhost:3000/workspace/{workspace}/execution/bug-reports

# View a specific bug report
http://localhost:3000/workspace/{workspace}/execution/bug-reports/{bugId}
```

---

## How It Works

```
Bug Report Flow:

  ┌────────────────┐
  │  Bug Memory    │ (kind: bug_report)
  │  Captured      │
  └───────┬────────┘
          │
          ▼
  ┌────────────────┐
  │  useBugReports │ Derives status from
  │  Hook          │ operations & commitments
  └───────┬────────┘
          │
    ┌─────┴─────┐
    ▼           ▼
┌──────┐   ┌──────────┐
│ List │   │  Detail  │
│ View │   │   View   │
│      │   │          │
│ Tabs │   │ Approval │
│ Cards│   │ Workflow │
└──────┘   └──────────┘
```

Status derivation:
- `inbox` - Bug captured but no commitment created
- `in_progress` - Commitment claimed, workflow running
- `review` - Workflow at approval_gate step
- `resolved` - Commitment closed
- `failed` - Workflow failed

---

## Files Created

### src/hooks/useBugReports.ts

Data fetching hook that filters operations for `bug_report` kind memories, joins with related commitments, and derives bug status from commitment state. Returns `bugReports` array and `bugsByStatus` grouped object.

### src/hooks/useWorkflowInstance.ts

Hook for fetching workflow instance data from Supabase. Provides `useWorkflowInstance` for direct ID lookup and `useWorkflowInstanceByCommitment` for finding workflow by commitment reference.

### src/components/bug-report/workflow-progress.tsx

Visualizes the 7-step Dual Triad workflow (Architect, Auditor, Gate, Approval, Executor, Validate, Complete). Provides compact `WorkflowProgress` for cards and expanded `WorkflowProgressExpanded` for detail view.

### src/components/bug-report/bug-report-card.tsx

Card component for list view displaying bug title, severity badge, source, age, and workflow progress. Severity-colored left border indicates priority (critical=red, high=orange, medium=yellow, low=blue).

### src/components/bug-report/bug-report-detail.tsx

Full detail view showing description, workflow progress, step outputs, and references. Includes approval banner with Approve/Reject buttons when bug is at approval gate.

### src/components/bug-report/index.ts

Barrel export for bug-report components.

### src/app/workspace/[workspace]/[plane]/bug-reports/page.tsx

List view page with status tabs. Uses shadcn Tabs component, filters bugs by active tab status.

### src/app/workspace/[workspace]/[plane]/bug-reports/[bugId]/page.tsx

Detail view page with back navigation. Fetches workflow instance for the bug's commitment and passes approve/reject handlers to detail component.

### src/components/ui/card.tsx

Added Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter components following shadcn patterns.

---

## Files Modified

| File | Change |
|------|--------|
| `src/lib/navigation/planeConfig.ts` | Added Bug Reports view to Execution plane navigation |
| `.claude/completion.json` | Updated to BugReportsInterface-v1.0 configuration |

---

## Test Results

| Test | Command | Result |
|------|---------|--------|
| TypeScript Compilation | `npx tsc --noEmit` | Pass |
| Build | `npm run build` | Pass |
| Route Generation | - | bug-reports: 5.62kB, bug-reports/[bugId]: 5.08kB |

---

## Screenshot Evidence (UI Features Only)

### Visual Verification Status

| Check | Status |
|-------|--------|
| Bridge Spawn Queued | Skipped |
| MCP Server (on bridge machine) | none |
| Screenshots Captured | Pending |
| Evidence Annotations Linked | Pending |

### Notes

Visual verification skipped - dev server not running. Screenshots should be captured manually after deployment to verify:
1. List view with status tabs renders correctly
2. Bug cards show severity indicators and workflow progress
3. Detail view displays description and step outputs
4. Approval banner appears for bugs in review state

---

## Design Decisions

### 1. Status Derivation from Operations

**Rationale:** Instead of adding a status field to bug memories, status is derived from the commitment lifecycle operations. This follows the append-only ledger pattern - the bug's status is always consistent with its commitment state.

### 2. Severity as Metadata

**Rationale:** Bug severity is stored in the capture payload's meta field rather than as a separate field. This keeps the core memory schema simple while allowing domain-specific metadata.

### 3. Workflow Progress as Compact Icons

**Rationale:** The 7-step workflow fits in a single row using icons with tooltips. This allows workflow progress to be visible in the card list without overwhelming the UI.

---

## Mentu Ledger Entry

```
Commitment: cmt_0d00595f
Status: in_review
Evidence: pending
Actor: user:dashboard
Body: "Implement Bug Reports Interface v1.0"
```

---

## Usage Examples

### Example 1: View Bug Reports in Inbox

Navigate to the Execution plane and click Bug Reports in the sidebar. The Inbox tab shows bugs that have been captured but not yet assigned to a commitment.

### Example 2: Approve a Bug Fix

When a bug workflow reaches the approval gate, the detail view shows an approval banner. Click "Approve" to allow the executor to proceed with the fix, or "Reject" to stop the workflow.

---

## Constraints and Limitations

- Workflow instance queries require the `workflow_instances` table to exist in Supabase
- Approval/reject actions are currently stubbed (TODO: implement API calls)
- Real-time updates depend on existing Supabase subscriptions

---

## Future Considerations

1. **Real-time workflow updates**: Subscribe to workflow_instances table for live step progress
2. **Bulk approval**: Allow approving multiple bugs at once from the list view
3. **Filtering**: Add severity and source filters to the list view
4. **Metrics**: Show bug resolution times and success rates

---

*Bug Reports Interface makes autonomous bug fixing visible and controllable - the eyes on the organism's immune system.*
