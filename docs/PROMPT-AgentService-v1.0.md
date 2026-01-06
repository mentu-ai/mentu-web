---
# ============================================================
# CANONICAL YAML FRONT MATTER
# ============================================================
id: PROMPT-AgentService-v1.0
path: docs/PROMPT-AgentService-v1.0.md
type: prompt
intent: execute

version: "1.0"
created: 2026-01-05
last_updated: 2026-01-05

tier: T3
actor: (from manifest)

parent: HANDOFF-AgentService-v1.0

mentu:
  commitment: cmt_18cbf947
  status: pending
---

# Executable Prompt: AgentService v1.0

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

The Rule: Failure in YOUR domain → own and fix. Failure elsewhere → you drifted.

# MISSION
Build a WebSocket-based agent service that connects mentu-web's AgentChatPanel to Claude with streaming responses and tool execution.

# CONTRACT
Done when:
- completion.json checks pass (tsc, build)
- All 13 required files created in agent-service/
- WebSocket accepts connections on /agent
- Claude responses stream correctly
- Messages persist to Supabase
- Commitment submitted with evidence

# PROTOCOL
1. Read .mentu/manifest.yaml to discover your actor identity
2. Read docs/HANDOFF-AgentService-v1.0.md (complete instructions, includes author_type)
3. Update .claude/completion.json with provided contract
4. Check commitment status - if already claimed, proceed. If not:
   mentu claim cmt_XXX
5. Add commitment ID to completion.json mentu.commitments.ids
6. Follow Build Order in HANDOFF (create all files)
7. Run database migration for agent_conversations and agent_messages tables
8. Capture evidence:
   mentu capture 'Progress' --kind execution-progress
9. On completion: mentu submit cmt_XXX --summary 'AgentService backend complete' --include-files

# IDENTITY MODEL
- Actor: auto-resolved from .mentu/manifest.yaml (WHO)
- Author Type: from HANDOFF's author_type field (ROLE)
- Context: added to operations via meta.context (WHERE)

# CONSTRAINTS
- DO NOT modify mentu-web frontend code
- DO NOT expose Claude API key to clients
- MUST use exact WebSocket message types from frontend
- MUST persist all messages before processing
- MUST handle tool execution loop correctly

# RECOVERY
- If tsc fails: fix type errors before proceeding
- If build fails: check imports and exports (ESM)
- If mentu commands fail: verify .mentu/ exists
- If Supabase fails: check environment variables

# CONTEXT
Read: docs/HANDOFF-AgentService-v1.0.md (build instructions)
Reference: docs/PRD-AgentService-v1.0.md (full specification)
Reference: src/lib/agent/types.ts (frontend types to match)

# EVIDENCE
Final message must include:
- All files created/modified
- Build status (npm run build)
- Service startup test
- Commitment ID submitted
"
```

---

### Option B: With Mentu Enforcer (WRAPPER SCRIPT)

Use this when you NEED stop-time commitment enforcement:

```bash
~/claude-code-app/run-claude.sh \
  --dangerously-skip-permissions \
  --max-turns 100 \
  --mentu-enforcer \
  "Read .mentu/manifest.yaml for your actor, then read docs/HANDOFF-AgentService-v1.0.md and execute."
```

> **IMPORTANT**: `--mentu-enforcer` is a CUSTOM FLAG that ONLY works with the wrapper script.

---

## Minimal Prompts

### Without Enforcer (native claude):

```bash
claude \
  --dangerously-skip-permissions \
  --max-turns 100 \
  "Read .mentu/manifest.yaml for your actor identity, then read docs/HANDOFF-AgentService-v1.0.md and execute as the HANDOFF's author_type."
```

### With Enforcer (wrapper script):

```bash
~/claude-code-app/run-claude.sh \
  --dangerously-skip-permissions \
  --max-turns 100 \
  --mentu-enforcer \
  "Read .mentu/manifest.yaml for your actor identity, then read docs/HANDOFF-AgentService-v1.0.md and execute as the HANDOFF's author_type."
```

---

## What This Prompt Delivers

| Deliverable | Description |
|-------------|-------------|
| `agent-service/` | Complete Node.js WebSocket service |
| WebSocket Server | Accepts connections on `/agent` endpoint |
| Claude Integration | Streaming responses with tool use |
| Tool Registry | `mentu_capture`, `mentu_status`, `mentu_list` |
| Database Layer | Conversations and messages in Supabase |
| Systemd Config | Ready for VPS deployment |

---

## Expected Duration

- **Turns**: 50-80
- **Complexity**: T3 (Multi-part service)
- **Commitments**: 1

---

## Verification After Completion

```bash
# Verify deliverables exist
ls -la agent-service/src/

# Verify build passes
cd agent-service && npm install && npm run build

# Start service locally
cd agent-service && npm run dev

# Test WebSocket (in another terminal)
wscat -c ws://localhost:8080/agent

# Verify commitment closed
mentu show cmt_XXX
```

---

*This prompt launches the agent that builds the backend service powering real-time AI chat in mentu-web.*
