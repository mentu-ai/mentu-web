---
# ============================================================
# CANONICAL YAML FRONT MATTER
# ============================================================
id: RESULT-AutonomousBugExecution-v1.0
path: docs/RESULT-AutonomousBugExecution-v1.0.md
type: result
intent: reference

version: "1.0"
created: 2026-01-12
last_updated: 2026-01-12

actor: agent:claude-executor

parent: HANDOFF-AutonomousBugExecution-v1.0

mentu:
  commitment: cmt_bcfb7d21
  evidence: mem_6f12a2db
  status: in_review
---

# RESULT: AutonomousBugExecution v1.0

**Completed:** 2026-01-12

---

## Summary

Implemented the UI layer for autonomous bug execution in mentu-web, enabling users to trigger, monitor, and manage bug fix executions directly from the dashboard. The implementation includes a dedicated execution plane page with queue/history views, an inline execution panel on bug report details, and real-time log streaming using Supabase subscriptions. This completes the mentu-web portion of the autonomous bug execution flow, allowing the system to close the loop from bug report to fix with visual monitoring.

---

## Activation

The bug execution UI is available in the dashboard:

1. **Execution Plane Page**: Navigate to `/workspace/{ws}/execution/bug-execution`
2. **Inline Execution**: View any bug report detail and use the "Execute Fix" button in the Bug Execution panel

```bash
# Start the dev server
npm run dev

# Navigate to bug execution page
# http://localhost:3000/workspace/inline-substitute/execution/bug-execution

# Or view a bug report with execution panel
# http://localhost:3000/workspace/inline-substitute/execution/bug-reports/{bugId}
```

---

## How It Works

```
Bug Report Detail                    Execution Flow
─────────────────                    ──────────────
┌─────────────────┐
│  Bug Report     │
│  ├─ Title       │
│  ├─ Description │     User clicks
│  ├─ Screenshot  │    "Execute Fix"
│  └─ Console     │─────────────────────┐
│                 │                      │
│  ┌────────────┐ │                      ▼
│  │ Execution  │ │           ┌──────────────────┐
│  │ Panel      │ │           │ triggerBugExecution()
│  │            │ │           ├──────────────────┤
│  │ [Execute]  │ │           │ 1. Fetch ticket  │
│  │            │ │           │ 2. Get workspace │
│  │ ┌────────┐ │ │           │    settings      │
│  │ │ Logs   │ │ │           │ 3. Create        │
│  │ │ Stream │ │◄│───────────│    commitment    │
│  │ └────────┘ │ │   Live    │ 4. Build /craft  │
│  └────────────┘ │   Logs    │    prompt        │
└─────────────────┘           │ 5. Insert bridge │
                              │    command       │
                              └──────────────────┘
                                       │
                                       ▼
                              ┌──────────────────┐
                              │ Bridge Daemon    │
                              │ (beacon-xxx)     │
                              │                  │
                              │ Claims command   │
                              │ Runs /craft      │
                              │ Creates fix      │
                              │ Closes commit    │
                              └──────────────────┘
```

---

## Files Created

### src/hooks/useSpawnLogs.ts

Real-time subscription hook for spawn_logs. Connects to Supabase realtime channel filtered by command_id, auto-scrolls on new logs, and maintains connection state indicator.

### src/hooks/useBugExecution.ts

Hook for triggering and monitoring bug execution lifecycle. Manages active command state, polls for status updates when running, and provides trigger/cancel mutations.

### src/lib/api/bug-execution.ts

API helpers for bug execution operations. Includes triggerBugExecution (creates commitment + bridge command with /craft prompt), cancelBugExecution (cancels running command), and retryBugExecution (retries failed execution).

### src/components/bug-report/ExecutionOutput.tsx

Terminal-like output viewer component. Displays real-time logs from spawn_logs with color-coded stdout/stderr, connection status indicator, and auto-scroll behavior.

### src/components/bug-report/BugExecutionPanel.tsx

Execution control panel component. Shows current execution status, provides Execute/Cancel/Retry buttons, displays command metadata, and embeds ExecutionOutput for log streaming.

### src/app/workspace/[workspace]/[plane]/bug-execution/page.tsx

Dedicated execution plane page. Shows stats (running/pending/completed/failed counts), active executions with live panels, and execution history with status badges.

---

## Files Modified

| File | Change |
|------|--------|
| `src/components/bug-report/bug-report-detail.tsx` | Added BugExecutionPanel integration with workspaceId prop |
| `src/components/bug-report/index.ts` | Added exports for BugExecutionPanel and ExecutionOutput |
| `src/app/workspace/[workspace]/[plane]/bug-reports/[bugId]/page.tsx` | Pass workspaceId to BugReportDetail component |
| `src/lib/supabase/types.ts` | Added spawn_logs and tickets table types |
| `.claude/completion.json` | Updated to AutonomousBugExecution contract |

---

## Test Results

| Test | Command | Result |
|------|---------|--------|
| TypeScript Compilation | `tsc --noEmit` | Pass (pre-existing test file errors only) |
| Build | `npm run build` | Pass |
| Route Generation | Build output | `/workspace/[workspace]/[plane]/bug-execution` created |

---

## Design Decisions

### 1. Type Assertion Pattern for Supabase Queries

**Rationale:** The generated Supabase types were incomplete and causing `never` type errors on operations and bridge_commands tables. Rather than regenerating types (which requires database access), used type assertions (`as "workspaces"` and `as Record<string, unknown>`) to bypass strict typing while maintaining runtime correctness. This follows the existing pattern in useWorkflowInstance.ts.

### 2. Polling + Realtime Hybrid for Status

**Rationale:** Used Supabase realtime subscriptions for log streaming (where latency matters) but polling (2s interval) for command status updates. This avoids subscription complexity for status while providing instant log updates. The polling automatically stops when command reaches terminal state.

### 3. Inline Execution Panel on Bug Detail

**Rationale:** Rather than navigating away to execute a bug fix, the panel is embedded directly in the bug report detail page. This provides full bug context while monitoring execution, matching the human_in_loop workflow where users approve then watch execution.

---

## Mentu Ledger Entry

```
Commitment: cmt_bcfb7d21
Status: in_review
Evidence: pending
Actor: agent:claude-executor
Body: "Implement AutonomousBugExecution-v1.0: UI layer for autonomous bug execution"
```

---

## Usage Examples

### Example 1: Execute Bug Fix from Detail Page

Navigate to a bug report and click the Execute Fix button.

```bash
# Open dev server
npm run dev

# Navigate to bug report
open http://localhost:3000/workspace/inline-substitute/execution/bug-reports/{bugId}

# Click "Execute Fix" in the Bug Execution panel
# Watch logs stream in real-time
```

The panel shows: status badge, command metadata, and live log output.

### Example 2: Monitor All Executions

View the execution plane page for a dashboard view of all bug executions.

```bash
# Navigate to execution plane
open http://localhost:3000/workspace/inline-substitute/execution/bug-execution
```

Shows: running count, pending count, completed count, failed count, active execution panels, and execution history.

---

## Constraints and Limitations

- **Requires workspace source mapping**: Bug source must be configured in workspace settings before execution
- **Single machine targeting**: Each source maps to one target machine (beacon-xxx or vps-mentu-01)
- **No retry history**: Retries create new commands rather than tracking retry chain
- **Type workarounds**: Uses type assertions due to incomplete Supabase generated types

---

## Future Considerations

1. **Execution Analytics**: Track success rates, average execution time, common failure modes
2. **Parallel Execution**: Support multiple simultaneous bug executions per workspace
3. **Approval Workflow**: Add approval gate before autonomous execution for human_in_loop mode
4. **Cross-Repo Support**: Extend source mapping to support multiple target repositories

---

*Autonomous bug execution UI: trigger, monitor, and manage bug fixes from report to resolution.*
