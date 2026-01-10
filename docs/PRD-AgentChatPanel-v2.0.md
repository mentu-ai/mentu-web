---
# ============================================================
# CANONICAL YAML FRONT MATTER
# ============================================================
# All fields are machine-fetchable and deterministic.
# No narrative or prose is allowed in this block.
# Agents MUST upsert this metadata on execution or edit.
# ============================================================

# IDENTITY
id: PRD-AgentChatPanel-v2.0
path: docs/PRD-AgentChatPanel-v2.0.md
type: prd
intent: reference

# VERSIONING
version: "1.0"
created: 2026-01-06
last_updated: 2026-01-06

# TIER
tier: T3

# RELATIONSHIPS
children:
  - HANDOFF-AgentChatPanel-v2.0
dependencies:
  - INTENT-AgentChatPanel-v2.0
  - PRD-AgentChatPanel-v1.0

# MENTU INTEGRATION
mentu:
  commitment: cmt_a69de8b6
  status: pending
---

# PRD: AgentChatPanel v2.0

## Mission

Transform the Agent Chat from a generic conversational assistant into the **Intent Architect**—a specialized agent that helps humans articulate what should exist, producing commitments that agents can execute accountably. The Intent Architect understands Mentu deeply, has reach into workspaces and ledgers, and guides humans through fractal prompting to crystallize scattered thoughts into trackable work.

---

## Problem Statement

### Current State

```
┌─────────────────────────────────────────────────────────────────┐
│  Agent Chat v1.0 - Generic Assistant                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Human: "I want to add authentication"                          │
│                                                                  │
│  Agent: "I can help with that! What kind of authentication      │
│          are you thinking about?"                                │
│                                                                  │
│  [No context about existing patterns]                           │
│  [No understanding of Mentu operations]                         │
│  [No ability to create commitments]                             │
│  [No awareness of workspace constraints]                        │
│  [Generic responses, not domain-native]                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

The current Agent Chat:
- Has only 3 tools: `mentu_capture`, `mentu_status`, `mentu_list`
- Cannot read files, search codebases, or understand existing patterns
- Uses a generic system prompt with no Mentu domain knowledge
- Cannot query the ledger for historical context
- Cannot read workspace configuration (genesis, manifest, CLAUDE.md)
- Has no memory of past intents or what worked before
- Hardcodes paths and defaults workspace to 'default'

### Desired State

```
┌─────────────────────────────────────────────────────────────────┐
│  Intent Architect v2.0 - Mentu Native                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Human: "I want to add authentication"                          │
│                                                                  │
│  [Agent gathers context...]                                     │
│  - Reads workspace manifest and constraints                     │
│  - Queries ledger for past auth-related work                    │
│  - Scans codebase for existing auth patterns                    │
│  - Checks genesis for permission constraints                    │
│                                                                  │
│  Agent: "I found your existing session middleware in            │
│          src/lib/auth. You have 3 past commits related to       │
│          authentication, the most recent added Supabase Auth.   │
│          Your genesis allows OAuth providers. What kind of      │
│          authentication do you want to add on top of this?      │
│          [OAuth provider / Magic links / API keys]"             │
│                                                                  │
│  [Collaborative refinement...]                                  │
│                                                                  │
│  Agent: "Ready to formalize. Creating commitment:               │
│          'Add GitHub OAuth as secondary auth provider'          │
│          Evidence criteria: OAuth flow works, tests pass        │
│          Captured as mem_xxx, committed as cmt_yyy"             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Completion Contract

**First action**: Update `.claude/completion.json`:

```json
{
  "version": "2.0",
  "name": "AgentChatPanel-v2.0",
  "tier": "T3",
  "required_files": [
    "agent-service/src/system/prompt.ts",
    "agent-service/src/tools/registry.ts",
    "agent-service/src/tools/filesystem-tools.ts",
    "agent-service/src/tools/supabase-tools.ts",
    "agent-service/src/context/loader.ts",
    "agent-service/src/context/workspace.ts",
    "src/components/agent-chat/ContextIndicator.tsx"
  ],
  "checks": {
    "tsc": true,
    "build": true,
    "test": false
  },
  "mentu": {
    "enabled": true,
    "actor": "agent:claude-executor",
    "commitments": {
      "mode": "dynamic",
      "min_count": 1,
      "require_closed": true,
      "require_evidence": true
    }
  },
  "max_iterations": 100
}
```

---

## Core Concepts

### Intent Architect

The singular identity of the Agent Chat. Its purpose is to help humans articulate what should exist that does not exist yet. It does not implement, review code, debug failures, or manage infrastructure. It takes scattered thoughts and crystallizes them into commitments.

### Mentu Operations

The twelve ledger operations the agent must understand natively:

| Operation | Purpose | When Used |
|-----------|---------|-----------|
| `capture` | Create memories | Recording observations, intents, evidence |
| `commit` | Create obligations | Formalizing intent into trackable work |
| `claim` | Take ownership | Agent accepts responsibility for commitment |
| `close` | Provide evidence | Proving work was done |
| `submit` | Request review | Signaling readiness for approval |
| `approve` | Accept work | Validating closure evidence |
| `reopen` | Resume work | When more work is needed |
| `retarget` | Change ownership | Reassigning to different actor |
| `annotate` | Add context | Attaching notes without state change |
| `escalate` | Flag blockers | Signaling need for intervention |
| `archive` | Close without evidence | Abandoning without completion |
| `unarchive` | Restore archived | Resuming abandoned work |

### Dual Triad

The governance model the agent understands:

| Role | Domain | Responsibility |
|------|--------|----------------|
| **Architect** | Intent | Envisions what should exist |
| **Auditor** | Safety | Validates and scopes feasibility |
| **Executor** | Technical | Implements without reinterpreting |

The Intent Architect is the Architect's tool. What it produces will be audited, then executed.

### Fractal Prompting

The decomposition pattern for large intents. When a human describes something that would take weeks, the agent helps find natural fracture lines—what can be done first, what the smallest meaningful piece is, what dependencies exist.

---

## Specification

### Types

```typescript
// Enhanced message with intent artifacts
interface IntentMessage extends ChatMessage {
  artifacts?: {
    memory_id?: string;      // If a memory was captured
    commitment_id?: string;  // If a commitment was created
    context_gathered?: ContextSummary;
  };
}

// Context gathered before engagement
interface ContextSummary {
  workspace: WorkspaceInfo;
  recent_commits: CommitmentSummary[];
  related_memories: MemorySummary[];
  codebase_patterns: PatternMatch[];
  constraints: ConstraintInfo;
}

// Workspace configuration
interface WorkspaceInfo {
  id: string;
  name: string;
  path: string;
  genesis: GenesisConstraints | null;
  manifest: ManifestInfo | null;
  claude_md: string | null;
}

// Tool categories
type ToolCategory =
  | 'mentu'      // Existing: capture, status, list
  | 'filesystem' // New: read, glob, grep, search
  | 'supabase'   // New: query ledger, memories, commitments
  | 'context'    // New: workspace config, genesis, about-me
  | 'commit';    // New: create commitment from intent
```

### Operations

| Operation | Input | Output | Description |
|-----------|-------|--------|-------------|
| `gather_context` | `workspace_id` | `ContextSummary` | Loads workspace config, recent history |
| `search_code` | `pattern, glob?` | `PatternMatch[]` | Finds patterns in codebase |
| `read_file` | `path` | `string` | Reads file content |
| `query_ledger` | `filters` | `Operation[]` | Queries operation history |
| `list_commitments` | `filters` | `Commitment[]` | Lists commitments with state |
| `list_memories` | `filters` | `Memory[]` | Lists memories by kind/date |
| `capture_intent` | `body, kind` | `mem_id` | Captures intent memory |
| `create_commitment` | `body, source?` | `cmt_id` | Creates commitment from intent |
| `spawn_execution` | `cmt_id, prompt` | `command_id` | Queues work via bridge |

### State Machine

```
┌──────────────────────────────────────────────────────────────────┐
│  Intent Articulation Flow                                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  [GREETING] ──────────────────────────────────────────────────►  │
│       │                                                           │
│       ▼                                                           │
│  [CONTEXT_GATHERING] ─── gathers workspace, history, patterns     │
│       │                                                           │
│       ▼                                                           │
│  [ENGAGEMENT] ─────────── collaborative refinement                │
│       │                   asks clarifying questions               │
│       │                   proposes structure                      │
│       │                   surfaces conflicts                      │
│       │                                                           │
│       ▼                                                           │
│  [DECOMPOSITION] ─────── fractal prompting (if needed)           │
│       │                   breaks into coherent pieces             │
│       │                   identifies dependencies                 │
│       │                                                           │
│       ▼                                                           │
│  [FORMALIZATION] ─────── offers to capture and commit            │
│       │                   creates memory                          │
│       │                   creates commitment                      │
│       │                                                           │
│       ▼                                                           │
│  [HANDOFF] ───────────── confirms what was created               │
│                           offers to spawn execution               │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Validation Rules

- Agent MUST NOT write code or implement features
- Agent MUST NOT review pull requests or diffs
- Agent MUST NOT debug runtime errors
- Agent MUST gather context before engaging with new topics
- Agent MUST ask for confirmation before creating commitments
- Agent MUST only access workspaces the user has configured
- Agent MUST respect genesis constraints when formulating intents
- Agent MUST link captured memories to created commitments

---

## Implementation

### Deliverables

| File | Purpose |
|------|---------|
| `agent-service/src/system/prompt.ts` | Comprehensive Intent Architect system prompt with Mentu knowledge |
| `agent-service/src/tools/registry.ts` | Extended tool registry with all categories |
| `agent-service/src/tools/filesystem-tools.ts` | Read, glob, grep, search tools |
| `agent-service/src/tools/supabase-tools.ts` | Direct Supabase queries for ledger |
| `agent-service/src/context/loader.ts` | Context gathering orchestration |
| `agent-service/src/context/workspace.ts` | Workspace configuration reader |
| `src/components/agent-chat/ContextIndicator.tsx` | UI for showing gathered context |

### Build Order

1. **System Prompt Evolution**: Establish Intent Architect identity with full Mentu knowledge
2. **Tool Expansion**: Add filesystem, supabase, and context tools
3. **Context Loading**: Implement workspace configuration reader
4. **Integration**: Wire new tools into streaming handler
5. **Frontend Enhancement**: Add context indicator to chat panel

### Integration Points

| System | Integration | Notes |
|--------|-------------|-------|
| `mentu-ai` | CLI execution | Existing pattern, extend for commit creation |
| `Supabase` | Direct queries | New connection for ledger access |
| `Filesystem` | Scoped reads | Limited to configured workspace paths |
| `mentu-bridge` | Spawn execution | Existing pattern via proxy |

---

## Constraints

- MUST NOT allow arbitrary filesystem access—only configured workspace paths
- MUST NOT modify files—read-only for codebase exploration
- MUST NOT execute arbitrary shell commands—only scoped mentu CLI
- MUST NOT bypass genesis constraints when formulating intents
- MUST maintain backwards compatibility with existing conversations
- MUST NOT require changes to existing database schema

---

## Success Criteria

### Functional

- [ ] Agent identifies as "Intent Architect" in self-description
- [ ] Agent gathers context before engaging with new topics
- [ ] Agent can read files from configured workspaces
- [ ] Agent can search codebase for patterns
- [ ] Agent can query ledger for historical commitments
- [ ] Agent can query memories by kind and date range
- [ ] Agent can create commitments with proper sourcing
- [ ] Agent refuses to implement, review, or debug
- [ ] Agent follows fractal prompting for large intents

### Quality

- [ ] All files compile without TypeScript errors
- [ ] Agent service builds and runs successfully
- [ ] System prompt is < 8000 tokens (fits in context)
- [ ] Tool definitions have complete input schemas
- [ ] Error messages are helpful and actionable

### Integration

- [ ] Existing conversations continue to work
- [ ] New tools integrate with streaming handler
- [ ] Context indicator shows in chat panel
- [ ] Workspace configuration persists across sessions

---

## Verification Commands

```bash
# Verify build
cd agent-service && npm run build

# Verify frontend build
npm run build

# Verify TypeScript
npm run type-check

# Start agent service and test context gathering
cd agent-service && npm start

# Verify Mentu operations work
mentu list commitments --state open
mentu list memories --kind intent --limit 5

# Test intent articulation flow
# (Manual test with chat panel)
```

---

## References

- `INTENT-AgentChatPanel-v2.0.md`: Original vision document
- `PRD-AgentChatPanel-v1.0.md`: Current implementation spec
- `mentu-ai/docs/Mentu-Primer.md`: Mentu concepts and operations
- `claude-code/registry/modules/mentu-cli.yaml`: CLI command reference

---

*The Intent Architect transforms the Agent Chat from a generic assistant into the essential tool for intent articulation—a native speaker of Mentu that helps humans crystallize scattered thoughts into accountable commitments.*
