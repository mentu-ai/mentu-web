---
# ============================================================
# CANONICAL YAML FRONT MATTER
# ============================================================
id: PRD-AutonomousBugExecution-v1.0
path: docs/PRD-AutonomousBugExecution-v1.0.md
type: prd
intent: reference

version: "1.0"
created: 2026-01-12
last_updated: 2026-01-12

tier: T3

children:
  - HANDOFF-AutonomousBugExecution-v1.0
dependencies:
  - RESULT-BugExecutionLoop-v1.0
  - HANDOFF-BugReportsInterface-v2.0

mentu:
  commitment: cmt_bcfb7d21
  status: pending
---

# PRD: AutonomousBugExecution v1.0

## Mission

Enable autonomous bug fixing for workspace-configured sources (starting with WarrantyOS). Bug reports received through the bug reporter SDK automatically create commitments, spawn agents in the correct repository, execute the /craft workflow, and close with evidence—all without human intervention when configured for autonomous mode.

---

## Problem Statement

### Current State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CURRENT FLOW (Manual)                                                       │
│                                                                              │
│  Bug Report → operations table (kind: bug_report)                           │
│       ↓                                                                      │
│  [MANUAL] User views in dashboard                                           │
│       ↓                                                                      │
│  [MANUAL] User creates commitment                                           │
│       ↓                                                                      │
│  [MANUAL] User spawns agent                                                 │
│       ↓                                                                      │
│  Agent works without context of original bug                                │
│       ↓                                                                      │
│  [MANUAL] User closes commitment                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Problems:**
1. Bug reports sit idle in "inbox" status until manually processed
2. No automatic routing to the correct repository/workspace
3. Agents lack rich context (screenshot, console logs, behavior trace)
4. No /craft integration for proper PRD→HANDOFF→RESULT flow
5. No agent chaining—each step requires manual intervention
6. No UI for monitoring execution or triggering manual fixes

### Desired State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  AUTONOMOUS FLOW                                                             │
│                                                                              │
│  Bug Report (WarrantyOS) → tickets table                                    │
│       ↓                                                                      │
│  Source Router: warrantyos → workspace settings                             │
│       ↓                                                                      │
│  IF autonomous mode:                                                         │
│    Auto-Create Commitment (tags: ["bug", "auto"])                           │
│       ↓                                                                      │
│    Insert bridge_command with:                                              │
│      • working_directory: /path/to/warrantyos                               │
│      • prompt: /craft BugFix-{ticket_id} + rich context                     │
│      • commitment_id: cmt_xxx                                               │
│       ↓                                                                      │
│    Bug Executor (beacon-parity):                                            │
│      1. Claims command → creates worktree                                   │
│      2. Runs /craft with bug context → PRD → HANDOFF                        │
│      3. Spawns executor agent from PROMPT                                    │
│      4. Executor creates RESULT                                              │
│      5. Captures evidence → Closes commitment                               │
│                                                                              │
│  ELSE (human_in_loop mode):                                                  │
│    Dashboard shows bug in "inbox"                                           │
│    User clicks "Execute" button                                              │
│    Same flow triggers with approval                                          │
│                                                                              │
│  UI Components:                                                              │
│    • Execution Plane Page: Full dashboard with queue, logs, history         │
│    • Bug Report Detail: Inline "Execute" action with live output            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Completion Contract

**First action**: Update `.claude/completion.json`:

```json
{
  "version": "2.0",
  "name": "AutonomousBugExecution-v1.0",
  "tier": "T3",
  "required_files": [
    "src/hooks/useSpawnLogs.ts",
    "src/hooks/useBugExecution.ts",
    "src/components/bug-report/BugExecutionPanel.tsx",
    "src/components/bug-report/ExecutionOutput.tsx",
    "src/components/bug-report/bug-report-detail.tsx",
    "src/app/workspace/[workspace]/[plane]/bug-execution/page.tsx",
    "src/lib/api/bug-execution.ts"
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
  "max_iterations": 150
}
```

---

## Core Concepts

### Source Mapping

A configuration that maps external bug report sources (e.g., "warrantyos") to:
- Target workspace ID
- Working directory (Mac and VPS paths)
- Target machine for execution
- Approval mode (autonomous vs human_in_loop)

### Bridge Command Integration

When a bug is ready for execution, a `bridge_command` is inserted with:
- `prompt`: The /craft command with full bug context
- `working_directory`: Path to the target repository
- `commitment_id`: Link to the Mentu commitment
- `with_worktree`: true for isolated execution

### Agent Chaining

The execution flow spawns multiple agents:
1. **Architect Agent**: Creates PRD from bug context
2. **Auditor Agent**: Validates PRD and creates HANDOFF
3. **Executor Agent**: Implements the fix
4. **Validator Agent**: Runs tests and captures evidence

### Execution Plane

A dedicated UI plane for monitoring and controlling bug execution:
- Queue of pending bugs
- Real-time execution logs (spawn_logs)
- Execution history with outcomes
- Manual trigger capability

---

## Specification

### Types

```typescript
// Workspace settings extension
interface BugReportSettings {
  approval_mode: 'autonomous' | 'human_in_loop';
  sources: Record<string, SourceConfig>;
  default_machine_id?: string;
}

interface SourceConfig {
  working_directory: string;          // Mac path
  vps_directory?: string;             // VPS path (synced via SyncThing)
  target_machine_id?: string;         // beacon-xxx or vps-mentu-01
  craft_template?: string;            // Optional custom craft template
  timeout_seconds?: number;           // Default: 3600
  max_retries?: number;               // Default: 1
}

// Bug Execution State
interface BugExecution {
  id: string;
  ticket_id: string;
  commitment_id: string;
  command_id: string;
  status: 'pending' | 'crafting' | 'executing' | 'validating' | 'completed' | 'failed';
  started_at?: string;
  completed_at?: string;
  logs: SpawnLog[];
  artifacts: ExecutionArtifact[];
}

interface ExecutionArtifact {
  type: 'prd' | 'handoff' | 'prompt' | 'result' | 'pr';
  path: string;
  created_at: string;
}

// Spawn Logs for real-time output
interface SpawnLog {
  id: string;
  command_id: string;
  stream: 'stdout' | 'stderr';
  message: string;
  ts: string;
}
```

### Operations

| Operation | Input | Output | Description |
|-----------|-------|--------|-------------|
| `triggerExecution` | `ticket_id, workspace_id` | `command_id` | Create commitment + bridge command |
| `getExecutionStatus` | `command_id` | `BugExecution` | Poll execution state |
| `subscribeToLogs` | `command_id` | `Stream<SpawnLog>` | Real-time log subscription |
| `cancelExecution` | `command_id` | `void` | Cancel running execution |
| `retryExecution` | `ticket_id` | `command_id` | Retry failed execution |

### State Machine

```
                           ┌──────────────┐
                           │   pending    │
                           └──────┬───────┘
                                  │ trigger
                           ┌──────▼───────┐
                      ┌────│   crafting   │────┐
                      │    └──────┬───────┘    │
                      │           │ craft done │
                      │    ┌──────▼───────┐    │
                      │    │  executing   │    │ fail
                      │    └──────┬───────┘    │
                      │           │ exec done  │
                      │    ┌──────▼───────┐    │
                      │    │  validating  │────┘
                      │    └──────┬───────┘
                      │           │ tests pass
                 fail │    ┌──────▼───────┐
                      └────│  completed   │
                           └──────────────┘
                                  │
                           ┌──────▼───────┐
                           │    failed    │
                           └──────────────┘
```

| State | Meaning | Valid Transitions |
|-------|---------|-------------------|
| `pending` | Bug received, awaiting execution | → `crafting`, `failed` |
| `crafting` | /craft running, creating PRD/HANDOFF | → `executing`, `failed` |
| `executing` | Executor agent implementing fix | → `validating`, `failed` |
| `validating` | Tests running, evidence capture | → `completed`, `failed` |
| `completed` | Fix merged, commitment closed | (terminal) |
| `failed` | Execution failed at any stage | → `pending` (retry) |

### Validation Rules

- Source MUST be configured in workspace settings before autonomous execution
- Working directory MUST exist and be a git repository
- Bridge daemon MUST be online for target machine
- Commitment MUST be created before bridge command insertion
- All /craft documents MUST be captured as evidence

---

## Implementation

### Deliverables

| File | Purpose |
|------|---------|
| `src/hooks/useSpawnLogs.ts` | Real-time subscription to spawn_logs for live output |
| `src/hooks/useBugExecution.ts` | Trigger, monitor, and manage bug executions |
| `src/components/bug-report/BugExecutionPanel.tsx` | Configure and trigger execution |
| `src/components/bug-report/ExecutionOutput.tsx` | Terminal-like output viewer (wraps xterm) |
| `src/components/bug-report/bug-report-detail.tsx` | Add inline "Execute" action |
| `src/app/workspace/[workspace]/[plane]/bug-execution/page.tsx` | Execution plane page |
| `src/lib/api/bug-execution.ts` | API helpers for triggering execution |

### Cross-Repo Changes (mentu-proxy)

| File | Purpose |
|------|---------|
| `src/handlers/auto-commit-bug.ts` | Auto-create commitment on bug receipt |
| `src/handlers/spawn-bug-execution.ts` | Create bridge command with /craft prompt |

### Build Order

1. **Database**: Extend workspace settings schema with source mappings
2. **Hook: useSpawnLogs**: Real-time log subscription
3. **Hook: useBugExecution**: Execution trigger and monitoring
4. **Component: ExecutionOutput**: Terminal output viewer
5. **Component: BugExecutionPanel**: Execution controls
6. **Page: bug-execution**: Execution plane page
7. **Integration**: Add "Execute" button to bug report detail
8. **Cross-Repo: mentu-proxy**: Auto-commitment handler

### Integration Points

| System | Integration | Notes |
|--------|-------------|-------|
| `mentu-bridge` | Executes bridge_commands | Already has beacon-parity features |
| `mentu-proxy` | Routes bug reports, creates commands | Needs new handlers |
| `tickets` table | Source for bug reports | Already exists |
| `spawn_logs` table | Real-time output | Already exists |
| `commitments` table | Tracks work | Already exists |
| `xterm.js` | Terminal output | Already in CloudTerminal |

---

## Constraints

- **No CloudTerminal modification**: CloudTerminal files MUST NOT be modified
- **Backwards compatibility**: Existing bug report flow must continue working
- **Source isolation**: Each source executes in its own worktree
- **Stateless execution**: No execution state in mentu-web—query bridge_commands
- **Real-time first**: Logs stream in real-time, no polling for output

---

## Success Criteria

### Functional

- [ ] Bug from WarrantyOS triggers autonomous execution when approval_mode is 'autonomous'
- [ ] Execution creates PRD, HANDOFF, PROMPT, RESULT documents
- [ ] Commitment is closed with evidence upon successful execution
- [ ] Failed executions can be retried from the UI
- [ ] Execution logs stream in real-time to the UI

### Quality

- [ ] All files compile without TypeScript errors
- [ ] Build passes (`npm run build`)
- [ ] No regressions in existing bug report display

### Integration

- [ ] Works with existing beacon-parity bug executor
- [ ] Source mapping persists in workspace settings
- [ ] Real-time subscription uses existing Supabase patterns

### UI/UX

- [ ] Execution plane shows queue, active executions, history
- [ ] Bug report detail has "Execute" button when in human_in_loop mode
- [ ] Terminal output is readable and scrollable
- [ ] Execution status indicators are clear

---

## Verification Commands

```bash
# Verify build
npm run build

# Verify TypeScript
npx tsc --noEmit

# Verify new routes
curl http://localhost:3000/workspace/{id}/execution/bug-execution

# Verify Mentu state
mentu list commitments --state open
```

---

## References

- `RESULT-BugExecutionLoop-v1.0`: Beacon-parity features in mentu-bridge
- `HANDOFF-BugReportsInterface-v2.0`: Bug report display with diagnostics
- `mentu-bridge/docs/PRD-BugExecutionLoop-v1.0.md`: Original bug execution spec
- `workspaces.settings`: Database schema for configuration

---

*Autonomous bug execution: from report to resolution with zero human intervention.*
