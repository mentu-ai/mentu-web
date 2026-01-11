---
# ============================================================
# CANONICAL YAML FRONT MATTER
# ============================================================
id: PROMPT-BugReportsInterface-v1.0
path: docs/PROMPT-BugReportsInterface-v1.0.md
type: prompt
intent: execute
version: "1.0"
created: 2026-01-10
last_updated: 2026-01-10

tier: T3
actor: (from manifest)

parent: HANDOFF-BugReportsInterface-v1.0

mentu:
  commitment: cmt_0d00595f
  status: claimed
---

# Executable Prompt: Bug Reports Interface v1.0

## Launch Commands

### Option A: Native Claude (NO mentu-enforcer)

Use this when you do NOT need stop-time commitment enforcement:

```bash
claude \
  --dangerously-skip-permissions \
  --max-turns 100 \
  "
# IDENTITY
Your actor identity comes from the repository manifest (.mentu/manifest.yaml).
Your role (author_type) comes from the HANDOFF document you are executing.

Read .mentu/manifest.yaml to discover your actor.
Read the HANDOFF to discover your author_type (executor/auditor/architect).

# COGNITIVE STANCE
Your domain depends on your author_type:
- executor: TECHNICAL domain. Fix technical failures, defer on intent/safety.
- auditor: SAFETY domain. Fix safety failures, defer on technical/intent.
- architect: INTENT domain. Fix intent failures, defer on technical/safety.

The Rule: Failure in YOUR domain → own and fix. Failure elsewhere → you drifted.

# MISSION
Build the Bug Reports visualization interface for mentu-web Execution plane.

# CONTRACT
Done when:
- completion.json checks pass (tsc, build)
- All 8 required files created
- Bug Reports appears in navigation
- List view works with status tabs
- Detail view shows workflow progress
- Commitment submitted with evidence

# PROTOCOL
1. Read .mentu/manifest.yaml to discover your actor identity
2. Read /Users/rashid/Desktop/Workspaces/mentu-web/docs/HANDOFF-BugReportsInterface-v1.0.md
3. Update .claude/completion.json with provided contract
4. Claim commitment cmt_0d00595f if not already claimed
5. Follow Build Order (8 stages)
6. Run tsc --noEmit and npm run build
7. Create RESULT document
8. Submit: mentu submit cmt_0d00595f --summary 'Bug Reports Interface complete'

# CONSTRAINTS
- DO NOT create new database tables
- DO NOT modify existing components (add new ones)
- FOLLOW existing patterns from CommitmentsListPage, useCommitments
- USE the exact file paths specified in HANDOFF

# RECOVERY
- If tsc fails: fix type errors before proceeding
- If build fails: check imports and shadcn/ui components
- If validation fails: check stance (mentu stance executor --failure technical), fix

# CONTEXT
Read: /Users/rashid/Desktop/Workspaces/mentu-web/docs/HANDOFF-BugReportsInterface-v1.0.md
Reference: /Users/rashid/Desktop/Workspaces/mentu-web/docs/PRD-BugReportsInterface-v1.0.md
Reference: /Users/rashid/Desktop/Workspaces/mentu-ai/docs/RESULT-BugInvestigationWorkflow-v2.1.md

# EVIDENCE
Final message must include:
- All files created
- Build status (npm run build)
- TypeScript status (tsc --noEmit)
- Commitment ID submitted
"
```

---

### Option B: With Mentu Enforcer (WRAPPER SCRIPT)

Use this when you NEED stop-time commitment enforcement (agent cannot stop until commitments are closed):

```bash
~/claude-code-app/run-claude.sh \
  --dangerously-skip-permissions \
  --max-turns 100 \
  --mentu-enforcer \
  "Read .mentu/manifest.yaml for your actor, then read /Users/rashid/Desktop/Workspaces/mentu-web/docs/HANDOFF-BugReportsInterface-v1.0.md and execute."
```

> **IMPORTANT**: `--mentu-enforcer` is a CUSTOM FLAG that ONLY works with the wrapper script.
> The native `claude` command does NOT recognize this flag and will error.

---

## Minimal Prompts

### Without Enforcer (native claude):

```bash
cd /Users/rashid/Desktop/Workspaces/mentu-web && claude \
  --dangerously-skip-permissions \
  --max-turns 100 \
  "Read .mentu/manifest.yaml for your actor identity, then read docs/HANDOFF-BugReportsInterface-v1.0.md and execute as the HANDOFF's author_type."
```

### With Enforcer (wrapper script):

```bash
cd /Users/rashid/Desktop/Workspaces/mentu-web && ~/claude-code-app/run-claude.sh \
  --dangerously-skip-permissions \
  --max-turns 100 \
  --mentu-enforcer \
  "Read .mentu/manifest.yaml for your actor identity, then read docs/HANDOFF-BugReportsInterface-v1.0.md and execute as the HANDOFF's author_type."
```

---

## What This Prompt Delivers

| Deliverable | Description |
|-------------|-------------|
| Navigation update | Bug Reports added to Execution plane |
| List view page | Status tabs (Inbox, In Progress, Review, Resolved, Failed) |
| Detail view page | Full bug info with workflow progress |
| BugReportCard | Card component for list view |
| BugReportDetail | Detail component with approval actions |
| WorkflowProgress | 7-step visualization component |
| useBugReports hook | Data fetching and status derivation |
| useWorkflowInstance hook | Workflow instance queries |

---

## Expected Duration

- **Turns**: 50-100
- **Complexity**: T3 (Multi-part, cross-cutting)
- **Commitments**: 1 (cmt_0d00595f)

---

## Verification After Completion

```bash
# Verify deliverables exist
ls -la src/components/bug-report/
ls -la src/app/workspace/\[workspace\]/\[plane\]/bug-reports/
ls -la src/hooks/useBugReports.ts src/hooks/useWorkflowInstance.ts

# Verify build passes
npm run build

# Verify TypeScript
tsc --noEmit

# Verify navigation
grep -r "Bug Reports" src/lib/navigation/

# Verify commitment
mentu show cmt_0d00595f
```

---

## Backend Context

The Bug Investigation Workflow v2.1 is implemented in mentu-ai:

- **Workflow YAML**: `/Users/rashid/Desktop/Workspaces/mentu-ai/.mentu/workflows/bug-investigation-dual-triad-v2.1.yaml`
- **Supabase Version**: 3 (active)
- **Workflow ID**: `f6501b66-112c-48bc-91ea-b2fd61a867bf`

### Workflow Steps

```
architect → auditor → auditor_gate → approval_gate → executor → validate → complete
```

The UI should visualize these 7 steps with their states (pending, running, completed, failed).

---

*Build the interface that brings visibility to autonomous bug fixing.*
