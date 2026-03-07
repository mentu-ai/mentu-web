# Plan: Panorama View + Sequence Artifacts

## Critical Discovery

Migration 009 already created `workflows`, `workflow_instances`, and `workflow_audit_log` tables in Supabase. Ralph-seq runs map directly to this existing schema:

| Ralph-Seq Concept | Existing Supabase Table | Field |
|---|---|---|
| Sequence definition (`.ralph/sequences/ane-deep-recon.json`) | `workflows` | `definition` (JSONB) |
| A running sequence (`ralph-seq ane-deep-recon`) | `workflow_instances` | `state`, `step_states` (JSONB) |
| Step start/end/fail events | `workflow_audit_log` | `event_type`, `event_data` |
| Commitments created inside steps | `commitments` | `workflow_instance_id`, `workflow_step_id` |

We don't need new tables for sequences. We need:
1. One new table for **step log streaming** (like `spawn_logs` but for workflow steps)
2. A **workspace registry** table (so panorama can query all workspaces)
3. mentu-web pages to render this data
4. A proxy endpoint to register sequences from ralph-seq

---

## Architecture: Data Flow

```
ralph-seq ane-deep-recon
    |
    |-- [sequence start] POST /workflow/run (already exists in mentu-proxy)
    |       -> workflow_instances row created
    |       -> state: "running", step_states: { steps with pending status }
    |
    |-- [step N start] POST /workflow/webhook/{instance_id}
    |       -> workflow_audit_log: event_type=step_activated
    |       -> workflow_instances.step_states updated
    |
    |-- [step N stdout] POST /workflow/log (NEW)
    |       -> workflow_step_logs row (streaming)
    |
    |-- [step N end] POST /workflow/webhook/{instance_id}
    |       -> workflow_audit_log: event_type=step_completed|step_failed
    |       -> workflow_instances.step_states updated
    |
    |-- [mentu capture inside step]
    |       -> operations table (existing)
    |       -> operation.payload.meta.workflow_instance_id = instance_id
    |       -> operation.payload.meta.workflow_step_id = step_label
    |
    |-- [mentu commit inside step]
    |       -> operations table (existing)
    |       -> commitment gets workflow_instance_id + workflow_step_id (existing columns)
    |
    |-- [sequence end]
    |       -> workflow_instances.state = completed|failed
    |       -> workflow_audit_log: event_type=sequence_completed
    |
    v
Supabase Realtime
    |
    v
mentu-web
    |-- /panorama (NEW) -> cross-workspace overview
    |-- /workspace/[ws]/sequences (NEW) -> per-workspace sequence list
    |-- /workspace/[ws]/sequences/[id] (NEW) -> sequence detail + live feed
```

---

## Phase 1: Schema Changes (This Plan)

### 1A. New Table: `workflow_step_logs`

Streams step output from ralph-seq to the dashboard. Mirrors `spawn_logs` pattern.

```sql
-- migration 010_workflow_step_logs.sql
CREATE TABLE IF NOT EXISTS workflow_step_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,           -- ralph step label e.g. "tokengen-recon"
  stream TEXT NOT NULL DEFAULT 'stdout',  -- stdout | stderr | meta
  message TEXT NOT NULL,
  ts TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_wsl_instance ON workflow_step_logs(instance_id, step_id, ts);
CREATE INDEX idx_wsl_workspace ON workflow_step_logs(workspace_id, ts DESC);

ALTER TABLE workflow_step_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_members_read_step_logs" ON workflow_step_logs
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );
```

### 1B. New Table: `workspace_registry`

Central registry for panorama view. Replaces file-based `registry.jsonl`.

```sql
-- migration 011_workspace_registry.sql
CREATE TABLE IF NOT EXISTS workspace_registry (
  workspace_id UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  path TEXT,                        -- local filesystem path (informational)
  stack TEXT,                       -- swift | rust | node | python | go | unknown
  build_cmd TEXT,
  repo_url TEXT,                    -- github URL if published
  actor TEXT,                       -- default mentu actor
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMPTZ     -- updated by trigger on operations insert
);

CREATE INDEX idx_wr_last_activity ON workspace_registry(last_activity_at DESC NULLS LAST);

ALTER TABLE workspace_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_read_registry" ON workspace_registry
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_insert_registry" ON workspace_registry
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_update_registry" ON workspace_registry
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Auto-update last_activity_at when operations are inserted
CREATE OR REPLACE FUNCTION update_registry_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE workspace_registry
  SET last_activity_at = NEW.ts
  WHERE workspace_id = NEW.workspace_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_registry_activity
  AFTER INSERT ON operations
  FOR EACH ROW
  EXECUTE FUNCTION update_registry_activity();
```

### 1C. Seed Registry from Existing Data

One-time migration to populate `workspace_registry` from known workspaces:

```sql
-- migration 012_seed_registry.sql
INSERT INTO workspace_registry (workspace_id, name, stack, build_cmd, path, registered_at)
VALUES
  ('213b71c4-0f7a-437b-8da3-87381666bc5a', 'mentu-runtime', 'swift', 'swift build', '/Users/rashid/Desktop/mentu-runtime', '2026-02-14T22:56:00Z'),
  ('356c2a2f-c7ec-4488-8e0a-0315b1abc660', 'mentu-ane', 'swift', 'swift build', '/Users/rashid/Desktop/mentu-ane', '2026-03-02T22:05:00Z'),
  ('2cf1a0a4-5c94-45dc-8740-ab5aefbaae8b', 'mentu-interceptor', 'rust', 'cargo build', '/Users/rashid/Desktop/mentu-interceptor', '2026-03-02T22:05:00Z'),
  ('dc407753-2cca-4bc2-bf24-59d369e4a5e9', 'crawlio-agent', 'node', 'npm run build', '/Users/rashid/Desktop/crawlio-agent', '2026-02-18T21:55:00Z'),
  ('7972d36d-e0f0-4e8b-94f9-377c3315aa33', 'Crawlio-app', 'node', 'npm run build', '/Users/rashid/Desktop/Crawlio-app', '2026-02-17T14:20:00Z'),
  ('15325373-7959-429c-9ba1-0023560e1714', 'metamcp', 'unknown', 'echo no build', '/Users/rashid/Desktop/metamcp', '2026-02-25T21:30:00Z'),
  ('3314d347-ac52-4458-a7ad-0534acf4a51a', 'ghidra-reconstructed', 'unknown', 'echo no build', '/Users/rashid/Desktop/ghidra-reconstructed', '2026-02-17T19:15:00Z'),
  ('c397ff69-776d-4051-a2b3-61d657ce0bfb', 'Subtrace', 'unknown', 'echo build ok', '/Users/rashid/Desktop/Subtrace', '2026-02-17T19:15:00Z')
ON CONFLICT (workspace_id) DO NOTHING;
```

---

## Phase 1: mentu-proxy Changes (This Plan)

### 1D. New Endpoint: `POST /workflow/log`

Accepts streaming log chunks from ralph-seq steps.

```
POST /workflow/log
X-Proxy-Token: <token>
Content-Type: application/json

{
  "instance_id": "uuid",
  "workspace_id": "uuid",
  "step_id": "tokengen-recon",
  "stream": "stdout",
  "message": "Decompiling _e5rt_program_library_create..."
}
```

Handler: Insert into `workflow_step_logs` via Supabase REST.

### 1E. New Endpoint: `GET /panorama`

Returns cross-workspace summary for the panorama dashboard.

```
GET /panorama
X-Proxy-Token: <token>

Response:
{
  "workspaces": [
    {
      "workspace_id": "356c2a2f-...",
      "name": "mentu-ane",
      "stack": "swift",
      "last_activity_at": "2026-03-06T14:22:00Z",
      "stats": {
        "open_commitments": 3,
        "claimed_commitments": 1,
        "in_review_commitments": 0,
        "closed_this_week": 5,
        "total_memories": 42
      },
      "active_sequences": [
        {
          "instance_id": "uuid",
          "name": "ane-deep-recon",
          "state": "running",
          "total_steps": 6,
          "completed_steps": 3,
          "current_step": "e5rt-recon",
          "started_at": "2026-03-06T10:00:00Z"
        }
      ]
    }
  ]
}
```

Handler: Joins `workspace_registry`, `workflow_instances` (WHERE state='running'), and aggregates `operations` for stats.

### 1F. New Endpoint: `GET /panorama/registry`

Returns full workspace registry for the panorama sidebar.

```
GET /panorama/registry
X-Proxy-Token: <token>

Response: { "workspaces": [...workspace_registry rows...] }
```

---

## Phase 1: mentu-web Changes (This Plan)

### 1G. New Page: `/panorama`

Cross-workspace overview. The new home for authenticated users.

**Route**: `src/app/panorama/page.tsx`

**Components**:

```
PanoramaPage
  |-- PanoramaHeader (title, last refresh, workspace count)
  |-- ActiveSequencesPanel (live running sequences across all workspaces)
  |     |-- SequenceCard (per sequence: name, repo, progress bar, step list)
  |           |-- StepIndicator (icon: pending/running/passed/failed + label + duration)
  |-- WorkspaceGrid (all workspaces as cards)
  |     |-- WorkspaceCard (name, stack badge, stats summary, last activity)
  |-- CrossWorkspaceActivityFeed (recent operations across all workspaces, interleaved)
```

**Data Fetching**:
```typescript
// New hook: usePanorama()
// Calls GET /panorama via mentu-proxy
// Refreshes every 30 seconds
// Supabase realtime on workflow_instances for live sequence updates
```

**Navigation**: Add "Panorama" to root layout as primary nav item. Clicking a workspace card navigates to `/workspace/[name]`.

### 1H. New Page: `/workspace/[workspace]/sequences`

Per-workspace sequence list.

**Route**: `src/app/workspace/[workspace]/sequences/page.tsx`

**Components**:

```
SequencesPage
  |-- SequencesList
        |-- SequenceRow (name, state, steps progress, started_at, duration)
```

**Data**: Query `workflow_instances` WHERE `workspace_id` = current workspace, ordered by `created_at DESC`.

### 1I. New Page: `/workspace/[workspace]/sequences/[id]`

Sequence detail with live step feed.

**Route**: `src/app/workspace/[workspace]/sequences/[id]/page.tsx`

**Components**:

```
SequenceDetailPage
  |-- SequenceHeader (name, state badge, progress bar, total duration)
  |-- StepTimeline (vertical timeline of all steps)
  |     |-- StepCard (each step)
  |           |-- StepStatusIcon (pending | running-animated | passed | failed | skipped)
  |           |-- StepLabel + duration
  |           |-- StepLogViewer (collapsible, live-streaming for active step)
  |                 |-- LogLine (stdout: default, stderr: red, meta: blue)
  |-- LinkedCommitments (read-only list of commitments created during this sequence)
  |     |-- CommitmentMiniCard (id, body, state badge, click -> commitment detail)
  |-- LinkedMemories (memories captured during this sequence)
  |     |-- MemoryMiniCard (id, body, kind, click -> memory detail)
```

**Live Streaming**:
```typescript
// Supabase realtime subscription on workflow_step_logs
// Filter: instance_id = current sequence
// Append new log lines to active step's StepLogViewer
// Also subscribe to workflow_audit_log for step state changes
```

### 1J. New Component: `CommitmentKanban`

Read-only kanban board for commitments. Used in both panorama and per-workspace views.

**Component**: `src/components/commitment/commitment-kanban.tsx`

**Columns** (read-only, no drag-and-drop):

| Column | Filter | Color |
|--------|--------|-------|
| Open | `state === 'open'` | Gray |
| Claimed | `state === 'claimed'` | Blue |
| In Review | `state === 'in_review'` | Amber |
| Closed | `state === 'closed'` | Green |

**Card contents**: commitment ID (truncated), body (first line), owner actor, age, workspace badge (in panorama mode), sequence badge (if linked to workflow_instance).

**Props**:
```typescript
interface CommitmentKanbanProps {
  commitments: Commitment[];
  mode: 'workspace' | 'panorama';  // panorama shows workspace badges
  onCardClick?: (commitmentId: string) => void;  // navigate to detail
}
```

**Used in**:
- `/workspace/[ws]/commitments` — replace or add as tab alongside existing list view
- `/panorama` — aggregated across all workspaces

### 1K. Sidebar Update

Add "Sequences" nav item to workspace sidebar between "Commitments" and "Bridge".

Add "Panorama" to root-level navigation (visible when not inside a workspace).

### 1L. New Hooks

```typescript
// src/hooks/useWorkflowInstances.ts
useWorkflowInstances(workspaceId: string)
  -> query workflow_instances WHERE workspace_id, ordered by created_at DESC

useWorkflowInstance(instanceId: string)
  -> single instance with step_states

useWorkflowStepLogs(instanceId: string, stepId?: string)
  -> query workflow_step_logs, realtime subscription

useRealtimeWorkflows(workspaceId: string)
  -> subscribe to workflow_instances + workflow_audit_log changes

// src/hooks/usePanorama.ts
usePanorama()
  -> GET /panorama via proxy, 30s refresh
  -> realtime subscriptions across all workspaces for workflow_instances

useWorkspaceRegistry()
  -> query workspace_registry table
```

---

## Phase 1: Implementation Order

```
Step 1: Supabase migrations (010, 011, 012)
        - workflow_step_logs table
        - workspace_registry table
        - Seed registry data
        Run: cd mentu-ai && supabase db push

Step 2: mentu-proxy endpoints
        - POST /workflow/log handler
        - GET /panorama handler
        - GET /panorama/registry handler
        Deploy: cd mentu-proxy && wrangler deploy

Step 3: mentu-web data layer
        - useWorkflowInstances hook
        - useWorkflowStepLogs hook (with realtime)
        - usePanorama hook
        - useWorkspaceRegistry hook
        - CommitmentKanban component

Step 4: mentu-web panorama page
        - /panorama route
        - PanoramaPage, ActiveSequencesPanel, WorkspaceGrid
        - CrossWorkspaceActivityFeed

Step 5: mentu-web sequence pages
        - /workspace/[ws]/sequences route
        - /workspace/[ws]/sequences/[id] route
        - StepTimeline, StepLogViewer, LinkedCommitments
        - Sidebar navigation update

Step 6: Verification
        - Manually insert a test workflow_instance + step_logs
        - Verify panorama renders across workspaces
        - Verify sequence detail shows step timeline
        - Verify realtime updates work
        - Verify kanban renders commitment states
```

---

## Phase 2: Ralph-Seq Instrumentation (NEXT — documented only)

Changes to `~/.ralph/ralph-seq.zsh` (~30 lines of additions):

### On sequence start (after lock acquired, before first step):

```bash
# Register workflow definition if not exists
WORKFLOW_ID=$(mentu workflow register \
  --name "$seq_name" \
  --workspace "$MENTU_WORKSPACE_ID" \
  --definition "$(cat .ralph/sequences/${seq_name}.json)" 2>/dev/null | grep -o 'wf_[a-z0-9]*')

# Start workflow instance
INSTANCE_ID=$(mentu workflow run \
  --workflow "$WORKFLOW_ID" \
  --workspace "$MENTU_WORKSPACE_ID" 2>/dev/null | grep -o '[0-9a-f-]\{36\}')

export RALPH_WORKFLOW_INSTANCE_ID="$INSTANCE_ID"
```

### Before each step:

```bash
# Notify step activation
curl -s -X POST "$MENTU_PROXY/workflow/webhook/$INSTANCE_ID" \
  -H "X-Proxy-Token: $MENTU_API_TOKEN" \
  -d "{\"event\":\"step_activated\",\"step_id\":\"$step_label\"}"
```

### During step execution (tee stdout):

```bash
# Pipe ralph output to both log file and Supabase
(cd "$step_dir" && ralph-${auth} --no-tui "${step_args[@]}") 2>&1 | while IFS= read -r line; do
  echo "$line" >> "$log_file"
  # Batch and send to proxy every 5 lines or 2 seconds
  curl -s -X POST "$MENTU_PROXY/workflow/log" \
    -H "X-Proxy-Token: $MENTU_API_TOKEN" \
    -d "{\"instance_id\":\"$INSTANCE_ID\",\"workspace_id\":\"$MENTU_WORKSPACE_ID\",\"step_id\":\"$step_label\",\"stream\":\"stdout\",\"message\":$(echo "$line" | jq -Rs .)}"
done
```

### After each step:

```bash
# Notify step completion/failure
curl -s -X POST "$MENTU_PROXY/workflow/webhook/$INSTANCE_ID" \
  -H "X-Proxy-Token: $MENTU_API_TOKEN" \
  -d "{\"event\":\"step_completed\",\"step_id\":\"$step_label\",\"exit_code\":$exit_code,\"duration\":$duration}"
```

### On sequence end:

```bash
# Finalize workflow instance
curl -s -X POST "$MENTU_PROXY/workflow/webhook/$INSTANCE_ID" \
  -H "X-Proxy-Token: $MENTU_API_TOKEN" \
  -d "{\"event\":\"sequence_completed\",\"ok_count\":$ok_count,\"warn_count\":$warn_count}"
```

### Mentu context for agents inside steps:

Export `RALPH_WORKFLOW_INSTANCE_ID` and `RALPH_WORKFLOW_STEP_ID` so that when agents call `mentu capture` or `mentu commit` inside a step, the CLI can automatically attach `workflow_instance_id` and `workflow_step_id` to the operation payload.

This requires a small change to `mentu-ai/src/commands/capture.ts` and `mentu-ai/src/commands/commit.ts`:
```typescript
// If RALPH_WORKFLOW_INSTANCE_ID is set, add to payload.meta
if (process.env.RALPH_WORKFLOW_INSTANCE_ID) {
  payload.meta = {
    ...payload.meta,
    workflow_instance_id: process.env.RALPH_WORKFLOW_INSTANCE_ID,
    workflow_step_id: process.env.RALPH_WORKFLOW_STEP_ID,
  };
}
```

---

## Phase 3: Workspace Factory Update (FUTURE — documented only)

Changes to `/Users/rashid/Desktop/mentu-workspace-factory/`:

### 3A. Registry sync to Supabase

Update `/create-workspace` command Phase 11 to also INSERT into `workspace_registry` table:

```bash
# After appending to registry.jsonl (existing)
# Also register in Supabase
curl -s -X POST "$MENTU_PROXY/panorama/registry" \
  -H "X-Proxy-Token: $MENTU_API_TOKEN" \
  -d "{\"workspace_id\":\"$WORKSPACE_ID\",\"name\":\"$NAME\",\"stack\":\"$STACK\",\"build_cmd\":\"$BUILD_CMD\",\"path\":\"$TARGET_DIR\"}"
```

### 3B. Ralph-seq template update

Update `templates/skills/ralph-seq/` to include workflow registration in the generated ralph-work.sh:

```bash
# In ralph-work.sh template:
# Export workflow env vars so mentu CLI auto-attaches them
export RALPH_WORKFLOW_INSTANCE_ID
export RALPH_WORKFLOW_STEP_ID
```

### 3C. Sequence definition includes workspace_id

Update sequence JSON schema to include workspace_id for cross-workspace correlation:

```json
{
  "name": "ane-deep-recon",
  "workspace_id": "356c2a2f-c7ec-4488-8e0a-0315b1abc660",
  "steps": [...]
}
```

---

## Phase 4: Ralph-Seq Skill Update (FUTURE — documented only)

Changes to `/Users/rashid/Desktop/crawlio-agent/.claude/skills/ralph-seq/`:

Update skill documentation and templates so that `/ralph-seq <name>` command generates sequence JSONs that include `workspace_id` and are workflow-registration-aware.

Update SKILL.md reference to document:
- The workflow registration flow
- How step logs stream to the dashboard
- How to verify sequence visibility in mentu-web

---

## Design Decisions

### Why reuse `workflows` tables (not new `sequences` tables)?

Migration 009 already created the exact schema needed. `workflow_instances.step_states` is JSONB that can hold per-step status, duration, exit_code. `workflow_audit_log` captures step lifecycle events. Commitments already have `workflow_instance_id` and `workflow_step_id` foreign keys. Creating parallel tables would be redundant.

### Why `workspace_registry` in Supabase (not just `registry.jsonl`)?

The panorama view needs to query across workspaces from the browser. `registry.jsonl` is a local file on the Mac. Supabase gives us: queryable from mentu-web, realtime subscriptions, RLS, and the activity trigger.

### Why read-only kanban (no drag-and-drop)?

User requirement: "I don't need my kanban to be editable by me, everything should work through the CLI or API." This simplifies implementation significantly — no mutation endpoints, no optimistic updates, no conflict resolution. The kanban is a projection of ledger state, nothing more.

### Why stream logs through mentu-proxy (not direct Supabase insert)?

Ralph-seq runs locally on Mac. It authenticates with `MENTU_API_TOKEN` (proxy token), not Supabase service role key. All writes go through mentu-proxy, which validates the token and forwards to Supabase. This is the established pattern (same as `spawn_logs`, `bridge_commands`).

### Why batch log lines?

Ralph agents produce high-throughput stdout. Inserting every line individually would hit Supabase rate limits. The Phase 2 implementation should batch lines (5 lines or 2-second window) into single inserts. The `workflow_step_logs` table stores individual lines for rendering, but they arrive in batches.

---

## Verification Checklist

After Phase 1 implementation:

- [ ] `workflow_step_logs` table exists with RLS
- [ ] `workspace_registry` table exists with seed data (8 workspaces)
- [ ] `POST /workflow/log` inserts log rows
- [ ] `GET /panorama` returns aggregated workspace data
- [ ] `/panorama` page renders workspace grid with stats
- [ ] `/panorama` shows active sequences panel (empty until Phase 2)
- [ ] `/workspace/[ws]/sequences` lists workflow instances
- [ ] `/workspace/[ws]/sequences/[id]` shows step timeline
- [ ] Sequence detail page subscribes to realtime step logs
- [ ] CommitmentKanban renders correctly in both modes
- [ ] Sidebar shows "Sequences" nav item
- [ ] Manually inserted test data renders correctly everywhere

After Phase 2 (ralph-seq instrumentation):

- [ ] Running `ralph-seq` creates workflow instance in Supabase
- [ ] Step progress appears live in sequence detail page
- [ ] Step logs stream to dashboard
- [ ] Commitments created inside steps link to workflow instance
- [ ] Circuit breaker halts show in sequence detail
- [ ] Panorama shows live sequences across repos
