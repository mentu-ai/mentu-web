# Bridge Instruction: Kanban Lifecycle Test

**Purpose**: Test the full Mentu lifecycle via bridge, creating visible lineage in the Kanban interface.

---

## Spawn Command

```bash
# From mentu-ai directory
cd /Users/rashid/Desktop/Workspaces/mentu-ai

# Spawn via CLI (creates pending bridge command)
mentu spawn --prompt "$(cat /Users/rashid/Desktop/Workspaces/mentu-web/docs/INSTRUCTION-KanbanLifecycleTest-v1.0.md)" --directory /Users/rashid/Desktop/Workspaces/mentu-ai
```

Or via HTTP:

```bash
curl -X POST "https://mentu-proxy.affihub.workers.dev/bridge/commands" \
  -H "X-Proxy-Token: 3845bc1f19efbd470fab59baf1b690091c1dee37634054a975314b9b7cf1bdc8" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "workspace_id": "9584ae30-14f5-448a-9ff1-5a6f5caf6312",
    "prompt": "Execute the Kanban Lifecycle Test instruction at /Users/rashid/Desktop/Workspaces/mentu-web/docs/INSTRUCTION-KanbanLifecycleTest-v1.0.md",
    "working_directory": "/Users/rashid/Desktop/Workspaces/mentu-ai",
    "agent": "claude"
  }'
```

---

## Agent Instructions

You are an agent executing via mentu-bridge. Your mission is to demonstrate the full Mentu lifecycle with visible lineage in the Kanban interface.

### Step 1: Capture a Memory

Create a memory that will serve as the source for a commitment:

```bash
mentu capture "Test observation: Validating Kanban lifecycle via bridge execution. This memory will become the source for a test commitment." --kind observation --json
```

**Save the output memory ID** (format: `mem_XXXXXXXX`). You'll need it for Step 2.

### Step 2: Create a Commitment from the Memory

Create a commitment linked to the memory you just captured:

```bash
mentu commit "Validate Kanban board displays lifecycle transitions correctly" --source mem_XXXXXXXX --tags test,kanban,lifecycle --json
```

**Save the output commitment ID** (format: `cmt_XXXXXXXX`). You'll need it for Step 3.

### Step 3: Claim the Commitment

Take ownership of the commitment (this moves it to "In Progress" column):

```bash
mentu claim cmt_XXXXXXXX --json
```

At this point, the Kanban board should show:
- The commitment in the **In Progress** column
- The card should show your actor identity as owner

### Step 4: Do Some Work

Perform a simple task to create evidence of work:

```bash
# Create a test file as "work"
echo "# Kanban Lifecycle Test" > /tmp/kanban-lifecycle-test-$(date +%s).md
echo "Executed at: $(date)" >> /tmp/kanban-lifecycle-test-*.md
echo "Agent: bridge-executor" >> /tmp/kanban-lifecycle-test-*.md
echo "Purpose: Demonstrate full Mentu lifecycle" >> /tmp/kanban-lifecycle-test-*.md
```

### Step 5: Capture Evidence

Create an evidence memory documenting the work done:

```bash
mentu capture "Test completed successfully. Created test file demonstrating bridge execution. Lifecycle validated: capture -> commit -> claim -> work -> evidence -> submit." --kind evidence --refs cmt_XXXXXXXX --json
```

**Save the evidence memory ID** (format: `mem_YYYYYYYY`).

### Step 6: Submit for Review

Submit the commitment for review (moves to "In Review" column):

```bash
mentu submit cmt_XXXXXXXX --summary "Kanban lifecycle test complete. Created memory, linked commitment, performed work, captured evidence. Ready for human review on Kanban board." --evidence mem_YYYYYYYY --include-files --json
```

### Step 7: Verify and Report

Check the final status:

```bash
mentu show cmt_XXXXXXXX --json
```

Report the following to confirm success:
1. Memory ID created (source)
2. Commitment ID created
3. Evidence ID created
4. Final state should be `in_review`

---

## Expected Kanban Board State

After execution, the Kanban board at `/workspace/mentu-ai/kanban` should show:

| Column | Expected |
|--------|----------|
| To Do | (no change) |
| In Progress | (commitment moved out) |
| **In Review** | New commitment visible here |
| Done | (no change) |
| Cancelled | (no change) |

The commitment card should display:
- Title: "Validate Kanban board displays lifecycle transitions correctly"
- Tags: test, kanban, lifecycle
- Owner: agent identity
- Timeline: capture -> claim -> submit events

The side panel should show:
- Source memory link
- Evidence in timeline
- Submit summary

---

## Lineage Chain

```
mem_XXXXXXXX (observation)
     ↓
     └── Source for commitment
           ↓
cmt_YYYYYYYY (commitment)
     ↓
     ├── Claimed by agent
     ├── Work performed
     └── Submitted with evidence
           ↓
mem_ZZZZZZZZ (evidence)
     ↓
     └── Linked to commitment
```

This creates a complete audit trail visible in the Kanban interface.

---

## Troubleshooting

| Issue | Check |
|-------|-------|
| Memory not created | `mentu list memories --limit 5` |
| Commitment not in Kanban | `mentu status` or refresh browser |
| Submit failed | Ensure evidence ID is valid |
| Agent identity wrong | Check `mentu config get actor` |

---

## Success Criteria

1. All commands execute without error
2. Commitment appears in "In Review" column on Kanban
3. Clicking the card shows timeline with all events
4. Source memory and evidence memory are linked
5. Summary appears in the panel

---

## Human Review (Kanban Interface)

Once the commitment is in "In Review", the human can:

1. **Open the Kanban board**: `/workspace/mentu-ai/kanban`
2. **Click the commitment card** in the "In Review" column
3. **Review the details**:
   - Read the summary
   - Check the timeline
   - View the changes (if any files were modified)
   - See the linked evidence
4. **Click the green "Approve" button** to move it to "Done"

The Approve button appears only for commitments in the `in_review` state.

After approval:
- Commitment moves to **Done** column
- State changes to `closed`
- Approval is recorded in the timeline

---

## Full Lifecycle Visualization

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            MENTU LIFECYCLE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   [Agent via Bridge]                    [Human via Kanban]                   │
│         │                                      │                             │
│         ▼                                      │                             │
│   ┌───────────┐                                │                             │
│   │  capture  │ ← Creates memory               │                             │
│   └─────┬─────┘                                │                             │
│         ▼                                      │                             │
│   ┌───────────┐                                │                             │
│   │  commit   │ ← Creates commitment           │                             │
│   └─────┬─────┘     (To Do column)             │                             │
│         ▼                                      │                             │
│   ┌───────────┐                                │                             │
│   │   claim   │ ← Takes ownership              │                             │
│   └─────┬─────┘     (In Progress column)       │                             │
│         ▼                                      │                             │
│   ┌───────────┐                                │                             │
│   │   work    │ ← Performs task                │                             │
│   └─────┬─────┘                                │                             │
│         ▼                                      │                             │
│   ┌───────────┐                                │                             │
│   │ evidence  │ ← Captures proof               │                             │
│   └─────┬─────┘                                │                             │
│         ▼                                      │                             │
│   ┌───────────┐                                │                             │
│   │  submit   │ ← Requests review              │                             │
│   └─────┬─────┘     (In Review column)         │                             │
│         │                                      │                             │
│         └──────────────────────────────────────┼─────────────────────┐       │
│                                                ▼                     │       │
│                                          ┌───────────┐               │       │
│                                          │  review   │ ← Human sees  │       │
│                                          └─────┬─────┘   in Kanban   │       │
│                                                ▼                     │       │
│                                          ┌───────────┐               │       │
│                                          │  approve  │ ← Green btn   │       │
│                                          └─────┬─────┘               │       │
│                                                ▼                     │       │
│                                          ┌───────────┐               │       │
│                                          │   DONE    │ ← Closed!     │       │
│                                          └───────────┘               │       │
│                                                                      │       │
└──────────────────────────────────────────────────────────────────────┴───────┘
```

This completes the full human-agent collaboration loop.
