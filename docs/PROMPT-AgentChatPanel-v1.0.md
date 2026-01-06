---
# ============================================================
# CANONICAL YAML FRONT MATTER
# ============================================================
id: PROMPT-AgentChatPanel-v1.0
path: docs/PROMPT-AgentChatPanel-v1.0.md
type: prompt
intent: execute

version: "1.0"
created: 2026-01-05
last_updated: 2026-01-05

tier: T3
actor: (from manifest)

parent: HANDOFF-AgentChatPanel-v1.0

mentu:
  commitment: cmt_0c93945f
  status: pending
---

# Executable Prompt: AgentChatPanel v1.0

## Launch Commands

### Option A: Native Claude (NO mentu-enforcer)

Use this when you do NOT need stop-time commitment enforcement:

```bash
cd /Users/rashid/Desktop/Workspaces/mentu-web

claude \
  --dangerously-skip-permissions \
  --max-turns 100 \
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
Build a chat-based agent interface in the right side panel of mentu-web that connects via WebSocket to a VPS agent service.

# CRITICAL CONSTRAINT
DO NOT modify any CloudTerminal or TerminalContext files. They MUST remain exactly as they are.

Verify before submitting:
- git diff src/components/terminal/ → should be empty
- git diff src/contexts/TerminalContext.tsx → should be empty

# CONTRACT
Done when:
- All 10 required files exist (see completion.json)
- npm run build succeeds
- npx tsc --noEmit passes
- CloudTerminal files are UNCHANGED
- Commitment submitted with evidence

# PROTOCOL
1. Read .mentu/manifest.yaml for your actor identity
2. Read docs/HANDOFF-AgentChatPanel-v1.0.md (complete instructions)
3. Update .claude/completion.json with provided contract
4. Claim commitment: mentu claim cmt_0c93945f --author-type executor
5. Create files in order specified in HANDOFF
6. Verify CloudTerminal unchanged: git diff src/components/terminal/
7. Run: npm run build
8. Run: npx tsc --noEmit
9. Create RESULT document: docs/RESULT-AgentChatPanel-v1.0.md
10. Capture evidence: mentu capture 'RESULT-AgentChatPanel created' --kind result-document
11. Submit: mentu submit cmt_0c93945f --summary 'AgentChatPanel UI components' --include-files

# CONSTRAINTS
- DO NOT modify src/components/terminal/*
- DO NOT modify src/contexts/TerminalContext.tsx
- DO NOT modify src/components/ide/TerminalPanel.tsx
- DO NOT create database migrations (frontend only)
- DO NOT implement the backend agent-service

# RECOVERY
- If tsc fails: fix type errors before proceeding
- If build fails: check imports match shadcn/ui patterns
- If CloudTerminal modified: git checkout those files immediately

# CONTEXT
Read: docs/HANDOFF-AgentChatPanel-v1.0.md (build instructions with code)
Reference: docs/PRD-AgentChatPanel-v1.0.md (full specification)
Reference: src/components/kanban/CommitmentPanel.tsx (panel pattern)
Reference: src/contexts/TerminalContext.tsx (context pattern - DO NOT MODIFY)

# EVIDENCE
Final message must include:
- All files created
- Build status (npm run build)
- TypeScript status (npx tsc --noEmit)
- Confirmation CloudTerminal unchanged
- Commitment ID submitted
"
```

---

### Option B: With Mentu Enforcer (WRAPPER SCRIPT)

Use this when you NEED stop-time commitment enforcement:

```bash
cd /Users/rashid/Desktop/Workspaces/mentu-web

~/claude-code-app/run-claude.sh \
  --dangerously-skip-permissions \
  --max-turns 100 \
  --mentu-enforcer \
  "Read .mentu/manifest.yaml for your actor, then read docs/HANDOFF-AgentChatPanel-v1.0.md and execute. CRITICAL: Do NOT modify CloudTerminal or TerminalContext files."
```

> **IMPORTANT**: `--mentu-enforcer` is a CUSTOM FLAG that ONLY works with the wrapper script.
> The native `claude` command does NOT recognize this flag and will error.

---

## Minimal Prompts

### Without Enforcer (native claude):

```bash
cd /Users/rashid/Desktop/Workspaces/mentu-web

claude \
  --dangerously-skip-permissions \
  --max-turns 100 \
  "Read docs/HANDOFF-AgentChatPanel-v1.0.md and execute. DO NOT modify any CloudTerminal files."
```

### With Enforcer (wrapper script):

```bash
cd /Users/rashid/Desktop/Workspaces/mentu-web

~/claude-code-app/run-claude.sh \
  --dangerously-skip-permissions \
  --max-turns 100 \
  --mentu-enforcer \
  "Read docs/HANDOFF-AgentChatPanel-v1.0.md and execute. DO NOT modify any CloudTerminal files."
```

---

## What This Prompt Delivers

| Deliverable | Description |
|-------------|-------------|
| `src/lib/agent/types.ts` | Type definitions for chat messages, WebSocket protocol |
| `src/contexts/AgentChatContext.tsx` | React context for chat state management |
| `src/hooks/useAgentChat.ts` | WebSocket connection with auto-reconnect |
| `src/hooks/useAgentMessages.ts` | Supabase persistence hook |
| `src/components/agent-chat/AgentChatPanel.tsx` | Main slide-in panel |
| `src/components/agent-chat/ChatMessages.tsx` | Message list with auto-scroll |
| `src/components/agent-chat/ChatMessage.tsx` | Individual message rendering |
| `src/components/agent-chat/ChatInput.tsx` | Input with Enter-to-send |
| `src/components/agent-chat/ToolCallDisplay.tsx` | Collapsible tool call viewer |
| `src/components/agent-chat/index.ts` | Barrel exports |

---

## Expected Duration

- **Turns**: 40-60
- **Complexity**: T3 (Multi-part feature)
- **Commitments**: 1

---

## Verification After Completion

```bash
cd /Users/rashid/Desktop/Workspaces/mentu-web

# Verify deliverables exist
ls -la src/components/agent-chat/
ls -la src/contexts/AgentChatContext.tsx
ls -la src/hooks/useAgentChat.ts
ls -la src/lib/agent/types.ts

# Verify build passes
npm run build

# Verify TypeScript
npx tsc --noEmit

# Verify CloudTerminal UNCHANGED
git diff src/components/terminal/
git diff src/contexts/TerminalContext.tsx
git diff src/components/ide/TerminalPanel.tsx

# Verify commitment state
mentu show cmt_0c93945f
```

---

## What This Does NOT Include

This prompt delivers **frontend UI only**. It does NOT include:

1. **VPS Agent Service** - The backend WebSocket server that calls Claude API
2. **Database Migrations** - Schema for agent_conversations and agent_messages tables
3. **Hooks Configuration** - The guardrails/hooks system (config.yaml)
4. **Caddy Configuration** - Routing for the agent service endpoint

These are separate deliverables tracked by separate commitments.

---

*This prompt builds the chat interface. The agent will connect to `NEXT_PUBLIC_AGENT_WS_URL` which must be configured separately.*
