---
# ============================================================
# CANONICAL YAML FRONT MATTER
# ============================================================
# All fields are machine-fetchable and deterministic.
# No narrative or prose is allowed in this block.
# Agents MUST upsert this metadata on execution or edit.
# ============================================================

# IDENTITY
id: PROMPT-AgentChatPanel-v2.0
path: docs/PROMPT-AgentChatPanel-v2.0.md
type: prompt
intent: execute

# VERSIONING
version: "1.0"
created: 2026-01-06
last_updated: 2026-01-06

# TIER
tier: T3

# ACTOR
actor: (from manifest)

# RELATIONSHIPS
parent: HANDOFF-AgentChatPanel-v2.0

# MENTU INTEGRATION
mentu:
  commitment: cmt_a69de8b6
  status: pending
---

# Executable Prompt: AgentChatPanel v2.0

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
Read the HANDOFF to discover your author_type (executor).

# COGNITIVE STANCE
Your domain: TECHNICAL
- executor: TECHNICAL domain. Fix technical failures, defer on intent/safety.

The Rule: Failure in YOUR domain → own and fix. Failure elsewhere → you drifted.

# MISSION
Transform the Agent Chat into the Intent Architect with deep Mentu knowledge, expanded tools, and workspace awareness.

# CONTRACT
Done when:
- completion.json checks pass (tsc, build)
- 7 new/modified files created per HANDOFF specification
- System prompt establishes Intent Architect identity
- Filesystem tools enable codebase exploration
- Supabase tools enable ledger querying
- Context loader gathers workspace configuration
- Frontend indicator shows context status
- Commitment submitted with evidence

# PROTOCOL
1. Read .mentu/manifest.yaml to discover your actor identity
2. Read docs/HANDOFF-AgentChatPanel-v2.0.md (complete instructions)
3. Update .claude/completion.json with provided contract
4. Check commitment status - if already claimed, proceed. If not:
   mentu claim cmt_a69de8b6 --author-type executor
5. Add commitment ID to completion.json mentu.commitments.ids
6. Follow Build Order in HANDOFF (7 stages):
   - Stage 1: System Prompt Evolution
   - Stage 2: Filesystem Tools
   - Stage 3: Supabase Tools
   - Stage 4: Context Loader
   - Stage 5: Registry Integration
   - Stage 6: Claude Client Update
   - Stage 7: Frontend Context Indicator
7. Capture evidence:
   mentu capture 'Progress' --kind execution-progress --author-type executor
8. On completion:
   - Create RESULT document
   - Capture RESULT as evidence
   - mentu submit cmt_a69de8b6 --summary 'Implemented Intent Architect' --include-files

# IDENTITY MODEL
- Actor: auto-resolved from .mentu/manifest.yaml (WHO)
- Author Type: executor (ROLE)
- Context: mentu-web (WHERE)

# CONSTRAINTS
- DO NOT create new files outside the specified paths
- DO NOT allow filesystem access outside allowed workspaces
- DO NOT skip validation before submit
- DO NOT implement filesystem write operations
- DO NOT hardcode paths (use environment variables)

# RECOVERY
- If tsc fails: fix type errors before proceeding
- If build fails: check imports and exports
- If mentu commands fail: verify .mentu/ exists
- If validation fails: check stance (mentu stance executor --failure technical), fix, don't argue
- If js-yaml not found: npm install js-yaml @types/js-yaml

# CONTEXT
Read: docs/HANDOFF-AgentChatPanel-v2.0.md (build instructions)
Reference: docs/PRD-AgentChatPanel-v2.0.md (full specification)
Reference: docs/INTENT-AgentChatPanel-v2.0.md (original vision)

# EVIDENCE
Final message must include:
- All files created/modified
- Build status (npm run build)
- TypeScript status (npm run type-check)
- Agent service build status
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
  "Read .mentu/manifest.yaml for your actor, then read docs/HANDOFF-AgentChatPanel-v2.0.md and execute."
```

> **IMPORTANT**: `--mentu-enforcer` is a CUSTOM FLAG that ONLY works with the wrapper script.
> The native `claude` command does NOT recognize this flag and will error.

---

## Minimal Prompts

### Without Enforcer (native claude):

```bash
claude \
  --dangerously-skip-permissions \
  --max-turns 100 \
  "Read .mentu/manifest.yaml for your actor identity, then read docs/HANDOFF-AgentChatPanel-v2.0.md and execute as executor."
```

### With Enforcer (wrapper script):

```bash
~/claude-code-app/run-claude.sh \
  --dangerously-skip-permissions \
  --max-turns 100 \
  --mentu-enforcer \
  "Read .mentu/manifest.yaml for your actor identity, then read docs/HANDOFF-AgentChatPanel-v2.0.md and execute as executor."
```

---

## What This Prompt Delivers

| Deliverable | Description |
|-------------|-------------|
| `agent-service/src/system/prompt.ts` | Intent Architect system prompt with Mentu knowledge |
| `agent-service/src/tools/filesystem-tools.ts` | Read, glob, grep, list tools with workspace scoping |
| `agent-service/src/tools/supabase-tools.ts` | Query operations, commitments, memories directly |
| `agent-service/src/context/workspace.ts` | Workspace configuration reader |
| `agent-service/src/context/loader.ts` | Context gathering orchestration |
| `agent-service/src/tools/registry.ts` | Updated with all tool categories |
| `src/components/agent-chat/ContextIndicator.tsx` | Visual indicator for context status |

---

## Expected Duration

- **Turns**: 30-60
- **Complexity**: T3 (Multi-part, 7 stages)
- **Commitments**: 1

---

## Verification After Completion

```bash
# Verify agent service files exist
ls -la agent-service/src/system/prompt.ts
ls -la agent-service/src/tools/filesystem-tools.ts
ls -la agent-service/src/tools/supabase-tools.ts
ls -la agent-service/src/context/

# Verify frontend file exists
ls -la src/components/agent-chat/ContextIndicator.tsx

# Verify agent service builds
cd agent-service && npm run build

# Verify frontend builds
npm run build

# Verify TypeScript
npm run type-check

# Verify commitment submitted
mentu show cmt_a69de8b6
```

---

*This prompt launches an executor agent to implement the Intent Architect transformation as specified in the HANDOFF.*
