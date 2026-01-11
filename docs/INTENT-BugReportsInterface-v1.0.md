---
# ============================================================
# CANONICAL YAML FRONT MATTER
# ============================================================
id: INTENT-BugReportsInterface-v1.0
path: docs/INTENT-BugReportsInterface-v1.0.md
type: intent
intent: reference
version: "1.0"
created: 2026-01-10
last_updated: 2026-01-10

architect:
  actor: agent:claude-architect
  session: mentu-ai-workflow-v2.1
  context: conversation

tier_hint: T3

mentu:
  commitment: pending
  status: awaiting_audit

# Backend references
backend:
  workflow_yaml: /Users/rashid/Desktop/Workspaces/mentu-ai/.mentu/workflows/bug-investigation-dual-triad-v2.1.yaml
  result_doc: /Users/rashid/Desktop/Workspaces/mentu-ai/docs/RESULT-BugInvestigationWorkflow-v2.1.md
  handoff_doc: /Users/rashid/Desktop/Workspaces/mentu-ai/docs/HANDOFF-BugInvestigationWorkflow-v2.1.md
---

# Strategic Intent: Bug Reports Interface

> **Mode**: Architect
>
> You lack local filesystem access. Produce strategic intent only.
> State what and why. Do not specify file paths, schemas, or code.
> A local Leading Agent will audit and implement.

---

## What

Build a Bug Reports visualization interface in the Execution plane that displays bug investigation workflow progress, enables approval gates, and provides observability into the Dual Triad (Architect → Auditor → Executor) pipeline.

The interface should show bugs flowing through workflow stages with real-time status updates, allow users to approve/reject at decision gates, and display step outputs for debugging and oversight.

---

## Why

The Bug Investigation Workflow v2.1 has been implemented in mentu-ai and registered in Supabase. It orchestrates autonomous bug fixes through a structured pipeline (Architect → Auditor → Approval Gate → Executor → Validation → Close). However, there is currently **no visibility** into this process:

1. **No oversight**: Users cannot see what bugs are being processed or at what stage
2. **No intervention**: Approval gates exist but there's no UI to approve/reject
3. **No debugging**: When workflows fail, there's no way to see step outputs
4. **No analytics**: No view into bug processing throughput or failure rates

This interface makes the autonomous bug investigation pipeline **observable and controllable**.

---

## Constraints

- **No new database tables**: Bug reports are derived from existing `operations` table (memories with `kind: "bug_report"`) joined with `workflow_instances`
- **Follow existing patterns**: Use the same component patterns as Commitments, Memories, and Kanban views
- **Execution plane**: Bug Reports belongs in the Execution plane alongside Kanban, Commitments, Memories, Ledger
- **Read-mostly**: Dashboard displays state; approval actions are the only write operations
- **Real-time**: Must use Supabase subscriptions for live workflow progress updates
- **Mobile responsive**: All views must work on mobile (consistent with existing dashboard)

---

## Expected Outcome

**Users can:**
1. See a list of bug reports with status tabs (Inbox, In Progress, Review, Resolved, Failed)
2. View workflow progress visualization showing which step is active (Architect ✓ → Auditor ✓ → [Executor ●] → Validate → Deploy)
3. Click into a bug to see full detail including step outputs from Architect, Auditor, Executor
4. Approve or reject bugs waiting at the approval gate
5. Access workflow execution logs with filtering
6. Configure workflow settings (approval mode, confidence thresholds, model selection)

**Verification:**
- Trigger a bug via webhook → see it appear in Inbox
- Watch it progress through stages in real-time
- Intervene at approval gate (if in MANUAL mode)
- See it close with PR evidence when complete

---

## Open Questions

- Is there an existing workflow visualization component to reuse or should this be built from scratch?
- What's the pattern for action buttons in the dashboard (approve/reject)? The dashboard is described as "read-only" but approval actions are required.
- Should step outputs be collapsible or in separate tabs?
- How should failed workflows be displayed? With retry options?

---

## Context

### Backend Implementation (Complete)

The backend workflow is implemented and registered:

| Component | Location |
|-----------|----------|
| **Workflow YAML** | `mentu-ai/.mentu/workflows/bug-investigation-dual-triad-v2.1.yaml` |
| **Supabase Version** | 3 (active) |
| **Workflow ID** | `f6501b66-112c-48bc-91ea-b2fd61a867bf` |
| **Test Instance** | `2d9b035d-1e9a-4cce-927b-16f923da2278` |

### Workflow Steps

```
architect → auditor → auditor_gate → approval_gate → executor → validate → complete
```

### Data Model (Derived, No New Tables)

```typescript
interface BugReport {
  // From memory (kind: "bug_report")
  id: string;                    // mem_xxx
  title: string;                 // Extracted from payload.body
  description: string;           // Extracted from payload.body
  severity: "critical" | "high" | "medium" | "low";
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
  status: "inbox" | "in_progress" | "review" | "resolved" | "failed";
}
```

### Existing API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/bug-webhook` | POST | Creates bug memory + commitment + triggers workflow |
| `/workflow/status/:id` | GET | Returns workflow instance state |
| `/workflow/approve` | POST | Approve/reject at gate (needs implementation) |

### Integration Points

- **Navigation**: Add "Bug Reports" to Execution plane in `planeConfig.ts`
- **Kanban**: Show bug indicator on commitment cards (red left border + bug icon)
- **Settings**: Add workflow configuration options

---

## Routing Hints

```yaml
priority: normal

tags:
  - execution-plane
  - workflow-visualization
  - bug-investigation
  - dual-triad

target_repo: mentu-web

ci_integration:
  github_actions: false
  auto_pr: false
```

---

## For the Leading Agent

When you receive this INTENT document:

1. **Establish checkpoint** (git + Mentu)
2. **Audit** using `/craft--architect` protocol
3. **Capture evidence** of your audit findings
4. **Decide**: APPROVE / REJECT / REQUEST_CLARIFICATION
5. **If approved**: Execute `/craft BugReportsInterface-v1.0` to create full chain

### Key Files to Reference

| File | Purpose |
|------|---------|
| `src/lib/navigation/planeConfig.ts` | Add Bug Reports to Execution plane |
| `src/app/workspace/[workspace]/[plane]/commitments/page.tsx` | Pattern for list view |
| `src/app/workspace/[workspace]/[plane]/kanban/page.tsx` | Pattern for status-based views |
| `src/components/commitment/commitment-card.tsx` | Pattern for card components |
| `src/hooks/useCommitments.ts` | Pattern for data fetching hooks |

### Backend Documentation

Read these in mentu-ai for full context:

- `docs/HANDOFF-BugInvestigationWorkflow-v2.1.md` - Full workflow specification
- `docs/RESULT-BugInvestigationWorkflow-v2.1.md` - Implementation status and findings
- `.mentu/workflows/bug-investigation-dual-triad-v2.1.yaml` - Workflow definition

---

## Visual Reference

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  mentu-web: Bug Reports                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Inbox     │  │  In Progress │  │   Review    │  │   Resolved  │        │
│  │  (3 bugs)   │  │   (2 bugs)   │  │  (1 bug)    │  │  (47 bugs)  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ Bug: Login fails with 500                                    HIGH    │   │
│  │    Source: WarrantyOS  •  10 min ago                                 │   │
│  │    ┌────────────────────────────────────────────────────────────┐    │   │
│  │    │ Architect ✓ → Auditor ✓ → [Executor ●] → Validate → Deploy │    │   │
│  │    └────────────────────────────────────────────────────────────┘    │   │
│  │    Commitment: cmt_lr5i63iq  •  Workflow: running                    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

*This intent was created by an Architect agent without local filesystem access. It represents strategic direction, not implementation specification.*
