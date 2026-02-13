---
# ============================================================
# CANONICAL YAML FRONT MATTER
# ============================================================

# IDENTITY
id: PRD-ConversationHistory-v1.0
path: docs/PRD-ConversationHistory-v1.0.md
type: prd
intent: reference

# VERSIONING
version: "1.0"
created: 2026-01-11
last_updated: 2026-01-11

# TIER
tier: T2

# RELATIONSHIPS
children:
  - HANDOFF-ConversationHistory-v1.0
dependencies:
  - PRD-AgentService-v1.0

# MENTU INTEGRATION
mentu:
  commitment: cmt_dcbd0359
  status: pending
---

# PRD: ConversationHistory v1.0

## Mission

Enable multi-turn conversations in the agent.mentu.ai chat by passing conversation history to Claude, allowing the assistant to maintain context across messages within a session.

---

## Problem Statement

### Current State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CURRENT: Stateless Messages                                                │
│                                                                             │
│  User: "What files are in src/?"         → Claude reads, responds          │
│  User: "Tell me more about the first"    → Claude: "What first file?"      │
│                                                                             │
│  Each message is processed in isolation.                                    │
│  Database stores all messages but they are never sent back to Claude.      │
│                                                                             │
│  streaming.ts:22                                                            │
│  ─────────────────────────────────────────────────────────────────────      │
│  const agentStream = createAgentQuery(content);  // ← No history!          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

Users cannot have multi-turn conversations. Each message loses context from the previous exchange.

### Desired State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DESIRED: Context-Aware Conversations                                      │
│                                                                             │
│  User: "What files are in src/?"         → Claude reads, responds          │
│  User: "Tell me more about the first"    → Claude: "The first file is..."  │
│                                                                             │
│  History flows:                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│  1. User sends message                                                      │
│  2. Backend fetches conversation history from Supabase                      │
│  3. History + new message sent to Claude                                    │
│  4. Claude responds with full context                                       │
│  5. Response saved to Supabase                                              │
│                                                                             │
│  streaming.ts (new)                                                         │
│  ─────────────────────────────────────────────────────────────────────      │
│  const history = await getConversationMessages(conversationId);             │
│  const agentStream = createAgentQuery(content, { history });                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Completion Contract

**First action**: Update `.claude/completion.json`:

```json
{
  "version": "2.0",
  "name": "ConversationHistory",
  "tier": "T2",
  "required_files": [
    "agent-service/src/claude/history.ts",
    "agent-service/src/claude/client.ts",
    "agent-service/src/claude/streaming.ts"
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
  "max_iterations": 50
}
```

---

## Core Concepts

### Conversation History

An ordered list of previous messages in a conversation, including user messages, assistant responses, tool uses, and tool results. This provides context for Claude to understand the ongoing dialogue.

### Message Role Mapping

The Agent SDK expects messages in a specific format. Our database stores messages with roles that must be mapped appropriately for the SDK.

### Context Window Management

Claude has a limited context window. Very long conversations may need truncation to fit within limits while preserving the most recent and relevant context.

---

## Specification

### Types

```typescript
// New file: agent-service/src/claude/history.ts

import type { AgentMessage } from '../db/messages.js';

/**
 * Message format for Claude Agent SDK
 * Maps from our database format to SDK format
 */
export interface SDKMessage {
  role: 'user' | 'assistant';
  content: string | ContentBlock[];
}

export interface ContentBlock {
  type: 'text' | 'tool_use' | 'tool_result';
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  content?: string;
}

/**
 * History options for query
 */
export interface HistoryOptions {
  maxMessages?: number;      // Limit number of messages (default: 50)
  maxTokensEstimate?: number; // Rough token limit (default: 50000)
}
```

### Operations

| Operation | Input | Output | Description |
|-----------|-------|--------|-------------|
| `getConversationHistory` | `conversationId, options` | `SDKMessage[]` | Fetch and format history for SDK |
| `formatMessageForSDK` | `AgentMessage` | `SDKMessage` | Convert single DB message to SDK format |
| `truncateHistory` | `SDKMessage[], options` | `SDKMessage[]` | Trim history to fit context limits |

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MESSAGE PROCESSING FLOW                                                    │
│                                                                             │
│  WebSocket                                                                  │
│      │                                                                      │
│      ▼                                                                      │
│  handlers.ts                                                                │
│      │ processUserMessage(ws, conversationId, content)                      │
│      ▼                                                                      │
│  streaming.ts                                                               │
│      │ 1. getConversationHistory(conversationId)                            │
│      │ 2. createAgentQuery(content, { history })                            │
│      │ 3. Stream responses                                                  │
│      │ 4. saveMessage() for each response                                   │
│      ▼                                                                      │
│  Supabase                                                                   │
│      agent_messages table                                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Validation Rules

- History MUST be fetched before creating agent query
- Tool use and tool result messages MUST be paired correctly
- Messages MUST be ordered chronologically (ascending)
- System messages MUST NOT be included in history (system prompt is separate)

---

## Implementation

### Deliverables

| File | Purpose |
|------|---------|
| `agent-service/src/claude/history.ts` | History fetching and formatting utilities |
| `agent-service/src/claude/client.ts` | Update to accept history in options |
| `agent-service/src/claude/streaming.ts` | Update to fetch and pass history |

### Build Order

1. **History Module**: Create `history.ts` with formatting and truncation logic
2. **Client Update**: Modify `createAgentQuery` to accept and pass history
3. **Streaming Update**: Fetch history before query, pass to client
4. **Verification**: Test multi-turn conversation flow

### Integration Points

| System | Integration | Notes |
|--------|-------------|-------|
| Supabase | `agent_messages` table | Existing - use `getConversationMessages` |
| Claude Agent SDK | `query()` options | May need investigation on history format |
| WebSocket | No changes | Transparent to clients |

---

## Constraints

- MUST NOT break existing single-message functionality
- MUST NOT increase latency significantly (< 500ms overhead)
- MUST NOT exceed Claude's context window (truncate if needed)
- MUST maintain role: user/assistant pairing for tool calls
- MUST NOT include system messages in history (handled separately)

---

## Success Criteria

### Functional

- [ ] Multi-turn conversations work (Claude remembers previous messages)
- [ ] Tool use/result pairs are correctly formatted in history
- [ ] Long conversations are truncated without breaking
- [ ] First message in conversation still works (empty history)

### Quality

- [ ] All files compile without errors (`tsc --noEmit`)
- [ ] Build passes (`npm run build`)
- [ ] No runtime errors with empty history
- [ ] No runtime errors with long history

### Integration

- [ ] Works with existing WebSocket protocol
- [ ] Works with existing database schema
- [ ] No changes required to frontend

---

## Verification Commands

```bash
# Verify build
cd /Users/rashid/Desktop/Workspaces/mentu-web/agent-service
npm run build

# Verify TypeScript
npx tsc --noEmit

# Test manually via WebSocket
# Send message 1: "What is 2+2?"
# Send message 2: "What was my previous question?"
# Claude should remember message 1
```

---

## References

- `PRD-AgentService-v1.0.md`: Original agent service specification
- `RESULT-AgentService-v1.0.md`: Current implementation details
- `agent-service/src/db/messages.ts`: Existing message storage
- `agent-service/src/claude/client.ts`: Current query implementation

---

*Multi-turn conversations through history injection - making agent.mentu.ai actually conversational.*
