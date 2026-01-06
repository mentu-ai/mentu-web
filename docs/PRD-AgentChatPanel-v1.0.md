---
# ============================================================
# CANONICAL YAML FRONT MATTER
# ============================================================
id: PRD-AgentChatPanel-v1.0
path: docs/PRD-AgentChatPanel-v1.0.md
type: prd
intent: reference

version: "1.0"
created: 2026-01-05
last_updated: 2026-01-05

tier: T3

children:
  - HANDOFF-AgentChatPanel-v1.0
dependencies:
  - RESULT-CloudTerminal-Phase1-v1.0

mentu:
  commitment: cmt_0c93945f
  status: pending
---

# PRD: AgentChatPanel v1.0

## Mission

Deliver a chat-based agent interface in mentu-web's right side panel that connects to a custom agent service on the VPS, enabling users to converse with an AI agent that has full filesystem access to `/home/mentu/Workspaces`. The agent streams responses in real-time and executes tools (read, write, bash, mentu commands) with configurable hooks and guardrails.

---

## Problem Statement

### Current State

```
┌─────────────────────────────────────────────────────────────────┐
│  mentu-web                                                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────────────┐    ┌─────────────────────────────────┐  │
│  │   Main Content     │    │   CommitmentPanel (Right)       │  │
│  │   (Kanban, etc)    │    │   - Shows commitment details    │  │
│  │                    │    │   - Timeline, logs, changes     │  │
│  └────────────────────┘    └─────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │   CloudTerminal (Bottom) - Raw VPS shell access            │ │
│  │   ✅ WORKING - DO NOT MODIFY                               │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

Users can access the VPS via CloudTerminal (raw shell) or spawn fire-and-forget agents via bridge commands. There is no conversational agent interface - no way to have a back-and-forth dialogue with an AI that can execute actions on the VPS.

### Desired State

```
┌─────────────────────────────────────────────────────────────────┐
│  mentu-web                                                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────────────┐    ┌─────────────────────────────────┐  │
│  │   Main Content     │    │   AgentChatPanel (Right)        │  │
│  │   (Kanban, etc)    │    │  ┌───────────────────────────┐  │  │
│  │                    │    │  │ Messages (streaming)      │  │  │
│  │                    │    │  │ User: "Fix the auth bug"  │  │  │
│  │                    │    │  │ Agent: "Looking at..."    │  │  │
│  │                    │    │  │ Tool: read_file(auth.ts)  │  │  │
│  │                    │    │  └───────────────────────────┘  │  │
│  │                    │    │  ┌───────────────────────────┐  │  │
│  │                    │    │  │ [Type message...]    [▶]  │  │  │
│  │                    │    │  └───────────────────────────┘  │  │
│  └────────────────────┘    └─────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │   CloudTerminal (Bottom) - Raw VPS shell access            │ │
│  │   ✅ UNCHANGED - Separate from chat panel                  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

                              │
                              │ WebSocket (streaming)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  VPS Agent Service (port 3003)                                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────┐   ┌──────────────┐   ┌─────────────────────────┐ │
│  │   Hooks   │   │  Claude API  │   │    Tool Executor        │ │
│  │ (guards)  │──▶│  (streaming) │──▶│  read_file, write_file  │ │
│  │           │   │              │   │  bash, glob, grep       │ │
│  │pre_message│   │ @anthropic/  │   │  mentu capture/commit   │ │
│  │post_msg   │   │    sdk       │   │                         │ │
│  └───────────┘   └──────────────┘   └─────────────────────────┘ │
│                                                                  │
│  Working Directory: /home/mentu/Workspaces                       │
└─────────────────────────────────────────────────────────────────┘
```

Users can chat with an AI agent in a polished UI. The agent streams responses, executes tools on the VPS filesystem, and respects configurable guardrails.

---

## Completion Contract

**First action**: Update `.claude/completion.json`:

```json
{
  "version": "2.0",
  "name": "AgentChatPanel",
  "tier": "T3",
  "required_files": [
    "src/components/agent-chat/AgentChatPanel.tsx",
    "src/components/agent-chat/ChatMessages.tsx",
    "src/components/agent-chat/ChatMessage.tsx",
    "src/components/agent-chat/ChatInput.tsx",
    "src/components/agent-chat/ToolCallDisplay.tsx",
    "src/components/agent-chat/index.ts",
    "src/contexts/AgentChatContext.tsx",
    "src/hooks/useAgentChat.ts",
    "src/hooks/useAgentMessages.ts",
    "src/lib/agent/types.ts"
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

### Agent Chat Panel

A slide-in right panel (separate from CommitmentPanel) that provides a chat interface for conversing with an AI agent. Messages stream in real-time via WebSocket.

### Tool Execution

The agent can execute tools on the VPS filesystem:
- `read_file` - Read file contents
- `write_file` - Write/create files
- `edit_file` - Edit existing files
- `bash` - Execute shell commands
- `glob` - Find files by pattern
- `grep` - Search file contents
- `mentu_capture` - Capture observations to ledger
- `mentu_commit` - Create commitments

### Hooks System

Configurable hooks that run at key points:
- `pre_message` - Before sending user message to Claude (content filtering, rate limiting)
- `post_message` - After receiving Claude response (logging, mentu capture)
- `tool_filter` - Before executing a tool (allow/deny based on rules)

### Message Types

| Type | Description |
|------|-------------|
| `user` | User's input message |
| `assistant` | Agent's text response |
| `tool_use` | Agent requesting tool execution |
| `tool_result` | Result of tool execution |
| `system` | System messages (errors, status) |

---

## Specification

### Types

```typescript
// Message types
interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'tool_use' | 'tool_result' | 'system';
  content: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  tool_output?: string;
  timestamp: string;
  streaming?: boolean;
}

interface Conversation {
  id: string;
  workspace_id: string;
  title: string;
  commitment_id?: string;
  created_at: string;
  updated_at: string;
}

// WebSocket protocol
interface WSMessage {
  type: 'user_message' | 'assistant_chunk' | 'tool_use' | 'tool_result' | 'error' | 'done';
  conversation_id: string;
  data: unknown;
}

// Hook configuration
interface HooksConfig {
  pre_message?: PreMessageHook[];
  post_message?: PostMessageHook[];
  tool_filter?: ToolFilterHook[];
}

interface PreMessageHook {
  type: 'content_filter' | 'rate_limit';
  config: Record<string, unknown>;
}

interface ToolFilterHook {
  allowed_tools: string[];
  blocked_patterns?: Record<string, string[]>;
  allowed_directories?: string[];
}
```

### Operations

| Operation | Input | Output | Description |
|-----------|-------|--------|-------------|
| `connect` | `conversation_id?` | WebSocket | Establish WebSocket connection |
| `send_message` | `content: string` | `void` | Send user message via WebSocket |
| `create_conversation` | `workspace_id, title?` | `Conversation` | Create new conversation |
| `list_conversations` | `workspace_id` | `Conversation[]` | List workspace conversations |

### WebSocket Protocol

```
Client → Server:
  { type: "user_message", conversation_id: "...", data: { content: "..." } }

Server → Client (streaming):
  { type: "assistant_chunk", conversation_id: "...", data: { delta: "Looking" } }
  { type: "assistant_chunk", conversation_id: "...", data: { delta: " at" } }
  { type: "tool_use", conversation_id: "...", data: { tool: "read_file", input: {...} } }
  { type: "tool_result", conversation_id: "...", data: { output: "..." } }
  { type: "assistant_chunk", conversation_id: "...", data: { delta: "Found the issue" } }
  { type: "done", conversation_id: "...", data: { message_id: "..." } }
```

### Validation Rules

- Messages MUST have non-empty content
- Tool executions MUST be within allowed directories
- Blocked patterns MUST be checked before tool execution
- Rate limits MUST be enforced per conversation
- WebSocket MUST reconnect on disconnect with exponential backoff

---

## Implementation

### Deliverables

| File | Purpose |
|------|---------|
| `src/components/agent-chat/AgentChatPanel.tsx` | Main panel container with slide-in animation |
| `src/components/agent-chat/ChatMessages.tsx` | Scrollable message list with auto-scroll |
| `src/components/agent-chat/ChatMessage.tsx` | Individual message rendering by role |
| `src/components/agent-chat/ChatInput.tsx` | Input box with send button |
| `src/components/agent-chat/ToolCallDisplay.tsx` | Collapsible tool call display |
| `src/components/agent-chat/index.ts` | Barrel exports |
| `src/contexts/AgentChatContext.tsx` | Chat state management |
| `src/hooks/useAgentChat.ts` | WebSocket connection management |
| `src/hooks/useAgentMessages.ts` | Message history from Supabase |
| `src/lib/agent/types.ts` | Type definitions |

### Build Order

1. **Phase 1: Types & Context**: Define types and create AgentChatContext
2. **Phase 2: WebSocket Hook**: Implement useAgentChat with reconnection logic
3. **Phase 3: UI Components**: Build panel, messages, input components
4. **Phase 4: Integration**: Wire into layout, add toggle to TopNav
5. **Phase 5: Polish**: Add streaming indicators, error states, tool display

### Integration Points

| System | Integration | Notes |
|--------|-------------|-------|
| `RightPanelContext` | Coexist with CommitmentPanel | May need panel switching logic |
| `TerminalContext` | Independent | Chat panel does NOT affect terminal |
| `TopNav` | Add chat toggle button | Separate from terminal toggle |
| `Layout` | Add AgentChatProvider | Wrap alongside existing providers |

---

## Constraints

- **DO NOT modify CloudTerminal**: The existing CloudTerminal component and TerminalContext MUST remain unchanged
- **DO NOT modify terminal-server**: The VPS terminal-server on port 3002 is separate
- **Panel Independence**: AgentChatPanel must not interfere with CommitmentPanel
- **Backwards Compatibility**: All existing functionality must continue working
- **Security**: Tool execution must respect allowed_directories and blocked_patterns

---

## Success Criteria

### Functional

- [ ] Chat panel opens/closes via toggle button in TopNav
- [ ] User can type and send messages
- [ ] Agent responses stream in real-time (character by character)
- [ ] Tool calls display with collapsible input/output
- [ ] Messages persist across page reloads (via Supabase)
- [ ] WebSocket reconnects automatically on disconnect

### Quality

- [ ] All files compile without TypeScript errors
- [ ] `npm run build` succeeds
- [ ] No console errors during normal operation
- [ ] Panel animations are smooth (60fps)

### Integration

- [ ] CloudTerminal continues to work unchanged
- [ ] CommitmentPanel continues to work unchanged
- [ ] Both panels can be open simultaneously (side by side or switching)
- [ ] TopNav shows separate toggles for terminal and chat

---

## Verification Commands

```bash
# Verify build
npm run build

# Verify TypeScript
npx tsc --noEmit

# Verify files exist
ls -la src/components/agent-chat/
ls -la src/contexts/AgentChatContext.tsx
ls -la src/hooks/useAgentChat.ts

# Verify CloudTerminal unchanged
git diff src/components/terminal/
git diff src/contexts/TerminalContext.tsx
```

---

## References

- `RESULT-CloudTerminal-Phase1-v1.0`: Existing terminal infrastructure (DO NOT MODIFY)
- `mentu-web/src/components/kanban/CommitmentPanel.tsx`: Reference for panel pattern
- `mentu-web/src/components/kanban/BridgeLogsViewer.tsx`: Reference for message rendering
- `mentu-web/src/contexts/TerminalContext.tsx`: Reference for context pattern

---

*This PRD delivers a conversational AI interface that bridges the gap between raw terminal access and fire-and-forget bridge commands, giving users real-time interaction with an agent that can work on their codebase.*
