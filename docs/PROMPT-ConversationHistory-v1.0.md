---
# ============================================================
# CANONICAL YAML FRONT MATTER
# ============================================================

# IDENTITY
id: PROMPT-ConversationHistory-v1.0
path: docs/PROMPT-ConversationHistory-v1.0.md
type: prompt
intent: execute

# VERSIONING
version: "1.0"
created: 2026-01-11
last_updated: 2026-01-11

# TIER
tier: T2

# ACTOR
actor: (from manifest)

# RELATIONSHIPS
parent: HANDOFF-ConversationHistory-v1.0

# MENTU INTEGRATION
mentu:
  commitment: cmt_dcbd0359
  status: pending
---

# Executable Prompt: ConversationHistory v1.0

## Launch Commands

### Option A: Native Claude (NO mentu-enforcer)

Use this when you do NOT need stop-time commitment enforcement:

```bash
claude \
  --dangerously-skip-permissions \
  --max-turns 50 \
  "
# IDENTITY
Your actor identity comes from the repository manifest (.mentu/manifest.yaml).
Your role (author_type) comes from the HANDOFF document you are executing.

Read .mentu/manifest.yaml to discover your actor.
Read the HANDOFF to discover your author_type (executor).

# COGNITIVE STANCE
Your domain is TECHNICAL (executor role).
- Technical failures → own and fix
- Other failures → you drifted, re-read HANDOFF

# MISSION
Add conversation history to the agent service so Claude maintains context across messages.

# CONTRACT
Done when:
- history.ts created with formatting/truncation logic
- client.ts updated to accept history option
- streaming.ts fetches and passes history
- npm run build passes
- Commitment submitted with evidence

# PROTOCOL
1. Read .mentu/manifest.yaml to discover your actor identity
2. Read docs/HANDOFF-ConversationHistory-v1.0.md (complete instructions)
3. Follow Build Order (4 stages)
4. Capture evidence: mentu capture 'Progress' --kind execution-progress --author-type executor
5. Create RESULT document
6. Submit: mentu submit cmt_dcbd0359 --summary 'Implemented conversation history' --include-files

# CONSTRAINTS
- DO NOT modify the WebSocket protocol
- DO NOT change the database schema
- DO NOT break existing single-message functionality
- DO NOT exceed context limits (truncate history)

# RECOVERY
- If tsc fails: fix type errors before proceeding
- If build fails: check imports and exports
- If history empty: that's fine, first message has no history

# CONTEXT
Read: docs/HANDOFF-ConversationHistory-v1.0.md (build instructions)
Reference: docs/PRD-ConversationHistory-v1.0.md (full specification)
Reference: agent-service/src/db/messages.ts (existing DB layer)

# EVIDENCE
Final message must include:
- All files created/modified
- Build status (npm run build)
- Commitment ID submitted
"
```

---

### Option B: With Mentu Enforcer (WRAPPER SCRIPT)

Use this when you NEED stop-time commitment enforcement:

```bash
~/claude-code-app/run-claude.sh \
  --dangerously-skip-permissions \
  --max-turns 50 \
  --mentu-enforcer \
  "Read .mentu/manifest.yaml for your actor, then read docs/HANDOFF-ConversationHistory-v1.0.md and execute."
```

> **IMPORTANT**: `--mentu-enforcer` is a CUSTOM FLAG that ONLY works with the wrapper script.
> The native `claude` command does NOT recognize this flag and will error.

---

## Minimal Prompts

### Without Enforcer (native claude):

```bash
claude \
  --dangerously-skip-permissions \
  --max-turns 50 \
  "Read .mentu/manifest.yaml for your actor identity, then read docs/HANDOFF-ConversationHistory-v1.0.md and execute as executor."
```

### With Enforcer (wrapper script):

```bash
~/claude-code-app/run-claude.sh \
  --dangerously-skip-permissions \
  --max-turns 50 \
  --mentu-enforcer \
  "Read .mentu/manifest.yaml for your actor identity, then read docs/HANDOFF-ConversationHistory-v1.0.md and execute as executor."
```

---

## What This Prompt Delivers

| Deliverable | Description |
|-------------|-------------|
| `agent-service/src/claude/history.ts` | History formatting and truncation utilities |
| `agent-service/src/claude/client.ts` | Updated to accept history in options |
| `agent-service/src/claude/streaming.ts` | Updated to fetch and pass history |

---

## Expected Duration

- **Turns**: 15-30
- **Complexity**: T2 (Feature)
- **Commitments**: 1

---

## Verification After Completion

```bash
# Verify deliverables exist
ls -la /Users/rashid/Desktop/Workspaces/mentu-web/agent-service/src/claude/

# Verify build passes
cd /Users/rashid/Desktop/Workspaces/mentu-web/agent-service
npm run build

# Verify TypeScript
npx tsc --noEmit

# Verify commitment closed
mentu show cmt_dcbd0359
```

---

*Multi-turn conversations through history injection.*
