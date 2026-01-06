---
# ============================================================
# CANONICAL YAML FRONT MATTER
# ============================================================
id: PRD-AgentService-v1.0
path: docs/PRD-AgentService-v1.0.md
type: prd
intent: reference

version: "1.0"
created: 2026-01-05
last_updated: 2026-01-05

tier: T3

children:
  - HANDOFF-AgentService-v1.0
dependencies:
  - HANDOFF-AgentChatPanel-v1.0

mentu:
  commitment: cmt_18cbf947
  status: pending
---

# PRD: AgentService v1.0

## Mission

Build a WebSocket-based agent service on the VPS that connects the mentu-web chat panel to Claude, enabling real-time streaming conversations with tool execution capabilities. This service is the "brain" that powers the AgentChatPanel frontend.

---

## Problem Statement

### Current State

```
┌─────────────────────────────────────────────────────────────┐
│  mentu-web (Frontend)                                       │
│  ┌──────────────────────┐                                   │
│  │  AgentChatPanel      │                                   │
│  │  - WebSocket hook    │ ──────> wss://api.mentu.ai/agent  │
│  │  - Message display   │         (DOES NOT EXIST)          │
│  │  - Tool call UI      │                                   │
│  └──────────────────────┘                                   │
└─────────────────────────────────────────────────────────────┘
```

The AgentChatPanel frontend is built and deployed, but it has nothing to connect to. Users see "disconnected" status and cannot interact with an agent.

### Desired State

```
┌─────────────────────────────────────────────────────────────┐
│  mentu-web (Frontend)          VPS (Backend)                │
│  ┌──────────────────────┐     ┌──────────────────────────┐  │
│  │  AgentChatPanel      │     │  agent-service           │  │
│  │  - WebSocket hook    │◄───►│  - WebSocket server      │  │
│  │  - Message display   │     │  - Claude API client     │  │
│  │  - Tool call UI      │     │  - Tool execution        │  │
│  │  - Streaming cursor  │     │  - Supabase persistence  │  │
│  └──────────────────────┘     └──────────────────────────┘  │
│                                        │                    │
│                               ┌────────▼────────┐           │
│                               │    Supabase     │           │
│                               │  - conversations│           │
│                               │  - messages     │           │
│                               └─────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

Users can chat with Claude in real-time, see streaming responses, and observe tool executions as they happen.

---

## Completion Contract

**First action**: Update `.claude/completion.json`:

```json
{
  "version": "2.0",
  "name": "AgentService",
  "tier": "T3",
  "required_files": [
    "agent-service/src/index.ts",
    "agent-service/src/websocket/server.ts",
    "agent-service/src/websocket/handlers.ts",
    "agent-service/src/claude/client.ts",
    "agent-service/src/claude/streaming.ts",
    "agent-service/src/tools/registry.ts",
    "agent-service/src/tools/mentu-tools.ts",
    "agent-service/src/db/supabase.ts",
    "agent-service/src/db/conversations.ts",
    "agent-service/src/db/messages.ts",
    "agent-service/package.json",
    "agent-service/tsconfig.json"
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
  "max_iterations": 100
}
```

---

## Core Concepts

### WebSocket Protocol

The frontend and backend communicate via a bidirectional WebSocket connection. Messages are JSON-encoded with a `type` discriminator.

### Streaming Responses

Claude API responses are streamed token-by-token to the frontend, enabling real-time display of the assistant's thinking.

### Tool Execution Loop

When Claude wants to use a tool, the service executes it locally and feeds the result back to Claude, continuing until the response is complete.

### Conversation Persistence

All messages are persisted to Supabase, allowing conversation history to be restored and enabling future features like search and analytics.

---

## Specification

### Types

```typescript
// WebSocket message types (must match frontend)
type WSMessageType =
  | 'user_message'
  | 'assistant_chunk'
  | 'tool_use'
  | 'tool_result'
  | 'error'
  | 'done';

interface WSMessage {
  type: WSMessageType;
  conversation_id: string;
  data: unknown;
}

// Database schema
interface Conversation {
  id: string;
  workspace_id: string;
  title: string;
  commitment_id?: string;
  created_at: string;
  updated_at: string;
}

interface AgentMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'tool_use' | 'tool_result' | 'system';
  content: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  tool_output?: string;
  created_at: string;
}
```

### Operations

| Operation | Input | Output | Description |
|-----------|-------|--------|-------------|
| `connect` | WebSocket upgrade | Connection established | Client connects to agent |
| `user_message` | `{ content: string }` | Stream of chunks | User sends message |
| `assistant_chunk` | - | `{ delta: string }` | Streaming response token |
| `tool_use` | - | `{ tool, input }` | Agent wants to use tool |
| `tool_result` | - | `{ output }` | Tool execution result |
| `done` | - | `{ message_id }` | Response complete |
| `error` | - | `{ message, code }` | Error occurred |

### Message Flow

```
Client                          Server                          Claude API
──────                          ──────                          ──────────
  │ WS Connect                    │                               │
  ├──────────────────────────────►│                               │
  │                               │                               │
  │ user_message                  │                               │
  ├──────────────────────────────►│                               │
  │                               │ messages.create()             │
  │                               ├──────────────────────────────►│
  │                               │                               │
  │                               │◄── stream: content_block_delta
  │◄── assistant_chunk ───────────┤                               │
  │                               │                               │
  │                               │◄── stream: tool_use           │
  │◄── tool_use ──────────────────┤                               │
  │                               │                               │
  │                               │ execute tool locally          │
  │                               │                               │
  │◄── tool_result ───────────────┤                               │
  │                               │                               │
  │                               │ messages.create(tool_result)  │
  │                               ├──────────────────────────────►│
  │                               │                               │
  │                               │◄── stream continues...        │
  │◄── assistant_chunk ───────────┤                               │
  │                               │                               │
  │                               │◄── message_stop               │
  │◄── done ──────────────────────┤                               │
```

### Tool Registry

Initial tools to implement:

| Tool | Description |
|------|-------------|
| `mentu_capture` | Create a Mentu memory |
| `mentu_status` | Get commitment status |
| `mentu_list` | List commitments/memories |
| `read_file` | Read file contents from workspace |
| `search_code` | Search codebase with ripgrep |

---

## Implementation

### Deliverables

| File | Purpose |
|------|---------|
| `agent-service/src/index.ts` | Entry point, server startup |
| `agent-service/src/websocket/server.ts` | WebSocket server setup |
| `agent-service/src/websocket/handlers.ts` | Message handlers |
| `agent-service/src/claude/client.ts` | Anthropic SDK wrapper |
| `agent-service/src/claude/streaming.ts` | Stream processing |
| `agent-service/src/tools/registry.ts` | Tool registration |
| `agent-service/src/tools/mentu-tools.ts` | Mentu CLI wrappers |
| `agent-service/src/db/supabase.ts` | Supabase client |
| `agent-service/src/db/conversations.ts` | Conversation CRUD |
| `agent-service/src/db/messages.ts` | Message CRUD |
| `agent-service/package.json` | Dependencies |
| `agent-service/tsconfig.json` | TypeScript config |

### Build Order

1. **Project Setup**: Initialize TypeScript project with dependencies
2. **Supabase Layer**: Database client and conversation/message models
3. **WebSocket Server**: HTTP upgrade and connection management
4. **Claude Integration**: API client with streaming support
5. **Tool System**: Registry and initial tool implementations
6. **Message Handlers**: Wire everything together

### Integration Points

| System | Integration | Notes |
|--------|-------------|-------|
| mentu-web | WebSocket client | Types must match exactly |
| Supabase | Database | Shared with mentu-web |
| Claude API | Streaming | Anthropic SDK |
| Mentu CLI | Tool execution | Subprocess calls |

---

## Constraints

- MUST use the exact WebSocket message types from AgentChatPanel
- MUST persist all messages to Supabase before/after processing
- MUST handle reconnection gracefully (resume conversation)
- MUST NOT expose Claude API key to frontend
- MUST run on VPS alongside mentu-bridge

---

## Success Criteria

### Functional

- [ ] WebSocket connects from mentu-web AgentChatPanel
- [ ] User messages are received and processed
- [ ] Claude responses stream in real-time
- [ ] Tool calls are executed and results displayed
- [ ] Conversations persist across reconnections

### Quality

- [ ] TypeScript compiles without errors
- [ ] Service starts without crashing
- [ ] Handles malformed messages gracefully
- [ ] Logs errors with context

### Integration

- [ ] Works with deployed mentu-web
- [ ] Supabase tables created and accessible
- [ ] Systemd service configured for VPS

---

## Verification Commands

```bash
# Verify build
cd agent-service && npm run build

# Verify TypeScript
cd agent-service && npx tsc --noEmit

# Start service locally
cd agent-service && npm run dev

# Test WebSocket connection
wscat -c ws://localhost:8080/agent

# Verify Supabase tables
mentu execute_sql "SELECT * FROM agent_conversations LIMIT 1"
```

---

## References

- `HANDOFF-AgentChatPanel-v1.0`: Frontend WebSocket types
- `claude-code/registry/modules/mentu-cli.yaml`: Mentu CLI commands for tools
- Anthropic SDK: https://docs.anthropic.com/en/api/streaming

---

*This PRD delivers the backend brain that powers conversational AI in the Mentu dashboard.*
