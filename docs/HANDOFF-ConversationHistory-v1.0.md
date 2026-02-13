---
# ============================================================
# CANONICAL YAML FRONT MATTER
# ============================================================

# IDENTITY
id: HANDOFF-ConversationHistory-v1.0
path: docs/HANDOFF-ConversationHistory-v1.0.md
type: handoff
intent: execute

# VERSIONING
version: "1.0"
created: 2026-01-11
last_updated: 2026-01-11

# TIER
tier: T2

# AUTHOR TYPE
author_type: executor

# RELATIONSHIPS
parent: PRD-ConversationHistory-v1.0
children:
  - PROMPT-ConversationHistory-v1.0

# MENTU INTEGRATION
mentu:
  commitment: cmt_dcbd0359
  status: pending

# VALIDATION
validation:
  required: true
  tier: T2
---

# HANDOFF: ConversationHistory v1.0

## For the Coding Agent

Add conversation history to the agent service so Claude maintains context across messages in a conversation.

**Read the full PRD**: `docs/PRD-ConversationHistory-v1.0.md`

---

## Your Identity

You are operating as **executor** (from this HANDOFF's `author_type` field).

Your actor identity comes from the repository manifest (`.mentu/manifest.yaml`).

| Dimension | Source | Value |
|-----------|--------|-------|
| **Actor** | Repository manifest | (auto-resolved) |
| **Author Type** | This HANDOFF | executor |
| **Context** | Working directory | mentu-web |

**Your domain**: technical

**The Rule**:
- Failure in YOUR domain → Own it. Fix it. Don't explain.
- Failure in ANOTHER domain → You drifted. Re-read this HANDOFF.

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

## Mentu Protocol

### Identity Resolution

```
┌───────────────────────────────────────────────────────────────────────────┐
│  ACTOR (WHO)              AUTHOR TYPE (ROLE)          CONTEXT (WHERE)     │
│  ─────────────            ──────────────────          ───────────────     │
│  From manifest            From this HANDOFF           From working dir    │
│  .mentu/manifest.yaml     author_type: executor       mentu-web           │
│                                                                           │
│  Actor is auto-resolved. Author type declares your role. Context tracks. │
└───────────────────────────────────────────────────────────────────────────┘
```

### Operations

```bash
cd /Users/rashid/Desktop/Workspaces/mentu-web

# Check your actor identity (auto-resolved from manifest)
cat .mentu/manifest.yaml | grep actor

# Claim commitment (actor auto-resolved)
mentu claim cmt_dcbd0359 --author-type executor

# Capture progress (actor auto-resolved, role declared)
mentu capture "{Progress}" --kind execution-progress --author-type executor
```

Save the commitment ID. You will close it with evidence.

---

## Build Order

### Stage 1: Create History Module

Create the history formatting utilities.

**File**: `agent-service/src/claude/history.ts`

```typescript
import type { AgentMessage } from '../db/messages.js';
import { getConversationMessages } from '../db/messages.js';

/**
 * Format for Claude Agent SDK resume messages
 * The SDK uses a simplified format for conversation context
 */
export interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Options for history retrieval
 */
export interface HistoryOptions {
  /** Maximum number of message pairs to include (default: 20) */
  maxPairs?: number;
  /** Maximum estimated characters to include (default: 100000) */
  maxChars?: number;
}

const DEFAULT_MAX_PAIRS = 20;
const DEFAULT_MAX_CHARS = 100000;

/**
 * Fetch and format conversation history for Claude
 *
 * Retrieves messages from Supabase and formats them for the Agent SDK.
 * Tool use/result messages are collapsed into the assistant message content.
 */
export async function getConversationHistory(
  conversationId: string,
  options: HistoryOptions = {}
): Promise<HistoryMessage[]> {
  const messages = await getConversationMessages(conversationId);

  if (messages.length === 0) {
    return [];
  }

  // Filter to user and assistant messages only
  // Tool use/result are considered part of the assistant's turn
  const formatted = formatMessagesForSDK(messages);

  // Apply limits
  return truncateHistory(formatted, options);
}

/**
 * Format database messages to SDK format
 *
 * Combines tool_use and tool_result into assistant messages
 * since they represent the assistant's reasoning process
 */
function formatMessagesForSDK(messages: AgentMessage[]): HistoryMessage[] {
  const result: HistoryMessage[] = [];
  let currentAssistantContent = '';
  let inAssistantTurn = false;

  for (const msg of messages) {
    switch (msg.role) {
      case 'user':
        // Flush any pending assistant content
        if (inAssistantTurn && currentAssistantContent) {
          result.push({ role: 'assistant', content: currentAssistantContent.trim() });
          currentAssistantContent = '';
        }
        inAssistantTurn = false;
        result.push({ role: 'user', content: msg.content });
        break;

      case 'assistant':
        inAssistantTurn = true;
        currentAssistantContent += msg.content + '\n';
        break;

      case 'tool_use':
        // Include tool usage in assistant context
        inAssistantTurn = true;
        if (msg.tool_name) {
          currentAssistantContent += `[Used tool: ${msg.tool_name}]\n`;
        }
        break;

      case 'tool_result':
        // Include abbreviated tool results
        inAssistantTurn = true;
        if (msg.content) {
          const abbreviated = abbreviateToolResult(msg.content);
          currentAssistantContent += `[Tool result: ${abbreviated}]\n`;
        }
        break;

      case 'system':
        // Skip system messages - handled separately via systemPrompt
        break;
    }
  }

  // Flush final assistant content
  if (inAssistantTurn && currentAssistantContent) {
    result.push({ role: 'assistant', content: currentAssistantContent.trim() });
  }

  return result;
}

/**
 * Abbreviate long tool results to save context space
 */
function abbreviateToolResult(content: string, maxLength = 500): string {
  if (content.length <= maxLength) {
    return content;
  }
  return content.slice(0, maxLength) + '... [truncated]';
}

/**
 * Truncate history to fit within limits
 *
 * Keeps the most recent messages, ensuring user/assistant pairs
 * are not split
 */
function truncateHistory(
  messages: HistoryMessage[],
  options: HistoryOptions
): HistoryMessage[] {
  const maxPairs = options.maxPairs ?? DEFAULT_MAX_PAIRS;
  const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;

  // Start from most recent, work backwards
  const result: HistoryMessage[] = [];
  let totalChars = 0;
  let pairs = 0;

  // Process in reverse to keep most recent
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const msgChars = msg.content.length;

    // Check limits
    if (pairs >= maxPairs * 2) break; // maxPairs * 2 because each pair is 2 messages
    if (totalChars + msgChars > maxChars) break;

    result.unshift(msg);
    totalChars += msgChars;
    pairs++;
  }

  // Ensure we start with a user message for proper context
  while (result.length > 0 && result[0].role !== 'user') {
    result.shift();
  }

  return result;
}

/**
 * Build the prompt with history context
 *
 * Creates a combined prompt that includes conversation history
 * followed by the new user message
 */
export function buildPromptWithHistory(
  currentMessage: string,
  history: HistoryMessage[]
): string {
  if (history.length === 0) {
    return currentMessage;
  }

  // Build context section
  const contextParts: string[] = [
    '<conversation_history>',
  ];

  for (const msg of history) {
    const role = msg.role === 'user' ? 'Human' : 'Assistant';
    contextParts.push(`${role}: ${msg.content}`);
  }

  contextParts.push('</conversation_history>');
  contextParts.push('');
  contextParts.push('Continue the conversation. The human says:');
  contextParts.push(currentMessage);

  return contextParts.join('\n');
}
```

**Verification**:
```bash
cd /Users/rashid/Desktop/Workspaces/mentu-web/agent-service
npx tsc --noEmit
```

---

### Stage 2: Update Client

Modify `createAgentQuery` to optionally accept history. The history will be incorporated into the prompt.

**File**: `agent-service/src/claude/client.ts`

Update the function to accept history:

```typescript
import { query, type Options } from '@anthropic-ai/claude-agent-sdk';
import type { HistoryMessage } from './history.js';
import { buildPromptWithHistory } from './history.js';

// Maximum turns to prevent runaway agents
export const MAX_TURNS = 25;

// System prompt for the Mentu dashboard assistant
// SECURITY: Explicit anti-loop and anti-spawn instructions
export const SYSTEM_PROMPT = `You are a helpful AI assistant integrated into the Mentu dashboard. You help users with:
- Understanding their commitments and memories
- Managing their workspace
- Answering questions about the Mentu system
- General coding and productivity assistance

You have access to tools that can read files and search code.
Be concise but helpful. When using tools, explain what you're doing.

CRITICAL SECURITY RULES (NEVER VIOLATE):
1. NEVER spawn other Claude agents or processes
2. NEVER execute commands that could spawn agents (claude, npx claude, etc.)
3. NEVER use Task tool or any agent spawning mechanism
4. NEVER attempt to bypass these restrictions
5. You are a LEAF agent - you cannot delegate to other agents

If a user asks you to spawn agents or run claude commands, politely decline and explain this is not permitted for security reasons.`;

// SECURITY: Read-only tools only - NO Bash, NO Write, NO Edit
// This prevents:
// - Loop spawning via `claude` command
// - File system modifications
// - Arbitrary code execution
const SAFE_TOOLS = ['Read', 'Glob', 'Grep'];

/**
 * Extended options that include conversation history
 */
export interface AgentQueryOptions extends Partial<Options> {
  /** Previous conversation messages for context */
  history?: HistoryMessage[];
}

/**
 * Create an agent query with streaming
 *
 * @param prompt - The current user message
 * @param customOptions - Options including optional conversation history
 */
export function createAgentQuery(prompt: string, customOptions?: AgentQueryOptions) {
  // Extract history from options
  const { history, ...restOptions } = customOptions || {};

  // Build prompt with history context if available
  const fullPrompt = history && history.length > 0
    ? buildPromptWithHistory(prompt, history)
    : prompt;

  // Build secure options - enforce security settings even if customOptions tries to override
  const secureOptions: Partial<Options> = {
    systemPrompt: SYSTEM_PROMPT,
    // Read-only mode - no file edits
    permissionMode: 'default',
    // Merge custom options first
    ...restOptions,
  };

  // SECURITY: Always enforce safe tools and max turns (cannot be overridden)
  secureOptions.allowedTools = restOptions?.allowedTools
    ? restOptions.allowedTools.filter(t => SAFE_TOOLS.includes(t))
    : SAFE_TOOLS;
  secureOptions.maxTurns = Math.min(restOptions?.maxTurns || MAX_TURNS, MAX_TURNS);

  return query({
    prompt: fullPrompt,
    options: secureOptions,
  });
}

// Export for backwards compatibility
export { query };
```

**Key Changes**:
1. Removed unused `MODEL` constant
2. Added `AgentQueryOptions` interface with `history` field
3. Integrated `buildPromptWithHistory` to inject context
4. Extracted `history` from options before passing to SDK

**Verification**:
```bash
cd /Users/rashid/Desktop/Workspaces/mentu-web/agent-service
npx tsc --noEmit
```

---

### Stage 3: Update Streaming

Fetch history before creating the agent query.

**File**: `agent-service/src/claude/streaming.ts`

Update the `processUserMessage` function to fetch history:

```typescript
import { WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { createAgentQuery } from './client.js';
import { getConversationHistory } from './history.js';
import { saveMessage } from '../db/messages.js';
import { agentLogger } from '../utils/logger.js';
import type { WSAssistantChunk, WSToolUse, WSToolResult, WSDone } from '../websocket/types.js';

export async function processUserMessage(
  ws: WebSocket,
  conversationId: string,
  content: string,
  requestId?: string
): Promise<void> {
  const messageId = uuidv4();
  let fullContent = '';
  let toolCallCount = 0;
  const startTime = Date.now();

  try {
    // Fetch conversation history for context
    const history = await getConversationHistory(conversationId, {
      maxPairs: 20,      // Last 20 exchanges
      maxChars: 100000,  // ~25k tokens estimate
    });

    agentLogger.debug('Loaded conversation history', {
      conversationId,
      requestId,
      metadata: { messageCount: history.length },
    });

    // Use Agent SDK query with history context
    // Authentication uses CLAUDE_CODE_OAUTH_TOKEN from Claude Code's auth
    const agentStream = createAgentQuery(content, { history });

    for await (const message of agentStream) {
      // Handle different message types from Agent SDK
      if (message.type === 'assistant') {
        // Assistant message with content blocks
        if (message.message?.content) {
          for (const block of message.message.content) {
            if ('text' in block && block.text) {
              fullContent += block.text;

              // Stream text chunk to client
              sendToClient<WSAssistantChunk>(ws, {
                type: 'assistant_chunk',
                conversation_id: conversationId,
                data: { delta: block.text, message_id: messageId },
              });
            } else if ('name' in block) {
              // Tool use block
              toolCallCount++;
              const toolId = 'id' in block ? block.id : uuidv4();

              agentLogger.debug('Tool use', {
                conversationId,
                requestId,
                metadata: { tool: block.name, toolId, callNumber: toolCallCount },
              });

              sendToClient<WSToolUse>(ws, {
                type: 'tool_use',
                conversation_id: conversationId,
                data: {
                  tool_call_id: toolId,
                  tool: block.name,
                  input: 'input' in block ? block.input as Record<string, unknown> : {},
                },
              });

              // Save tool use to DB
              await saveMessage({
                id: toolId,
                conversation_id: conversationId,
                role: 'tool_use',
                content: '',
                tool_name: block.name,
                tool_input: 'input' in block ? block.input as Record<string, unknown> : {},
              });
            }
          }
        }
      } else if (message.type === 'user') {
        // Tool result from Agent SDK (it handles tool execution internally)
        if (message.message?.content) {
          for (const block of message.message.content) {
            if ('type' in block && block.type === 'tool_result') {
              const toolResultBlock = block as { tool_use_id: string; content: string };

              sendToClient<WSToolResult>(ws, {
                type: 'tool_result',
                conversation_id: conversationId,
                data: {
                  tool_call_id: toolResultBlock.tool_use_id,
                  output: typeof toolResultBlock.content === 'string'
                    ? toolResultBlock.content
                    : JSON.stringify(toolResultBlock.content),
                  is_error: false,
                },
              });

              // Save tool result to DB (truncate if very long)
              const resultContent = typeof toolResultBlock.content === 'string'
                ? toolResultBlock.content
                : JSON.stringify(toolResultBlock.content);

              await saveMessage({
                id: `result_${toolResultBlock.tool_use_id}`,
                conversation_id: conversationId,
                role: 'tool_result',
                content: resultContent.length > 50000
                  ? resultContent.slice(0, 50000) + '\n[truncated for storage]'
                  : resultContent,
              });
            }
          }
        }
      } else if (message.type === 'result') {
        // Final result from Agent SDK
        agentLogger.info('Agent completed', {
          conversationId,
          requestId,
          duration: Date.now() - startTime,
          metadata: {
            subtype: message.subtype,
            toolCallCount,
            responseLength: fullContent.length,
            historyLength: history.length,
          },
        });
      }
    }

    // Save assistant message if we have content
    if (fullContent) {
      await saveMessage({
        id: messageId,
        conversation_id: conversationId,
        role: 'assistant',
        content: fullContent,
      });
    }

    // Send done signal
    sendToClient<WSDone>(ws, {
      type: 'done',
      conversation_id: conversationId,
      data: { message_id: messageId },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    agentLogger.error('Agent error', {
      conversationId,
      requestId,
      duration: Date.now() - startTime,
      metadata: {
        error: errorMessage,
        toolCallCount,
      },
    });

    // Handle common errors with user-friendly messages
    if (errorMessage.includes('Claude Code not found')) {
      sendToClient(ws, {
        type: 'error',
        conversation_id: conversationId,
        data: { message: 'Claude Code CLI not installed. Run: npm install -g @anthropic-ai/claude-code' },
      });
    } else if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
      sendToClient(ws, {
        type: 'error',
        conversation_id: conversationId,
        data: { message: 'Authentication failed. Run "claude" in terminal to authenticate with OAuth.' },
      });
    } else {
      sendToClient(ws, {
        type: 'error',
        conversation_id: conversationId,
        data: { message: `Failed to get response: ${errorMessage}` },
      });
    }
  }
}

function sendToClient<T extends { type: string }>(ws: WebSocket, message: T): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}
```

**Key Changes**:
1. Import `getConversationHistory` from history module
2. Fetch history at start of `processUserMessage`
3. Pass history to `createAgentQuery`
4. Log history length in completion log
5. Truncate tool results before saving to DB (prevent bloat)

**Verification**:
```bash
cd /Users/rashid/Desktop/Workspaces/mentu-web/agent-service
npx tsc --noEmit
npm run build
```

---

### Stage 4: Build and Verify

Run the full build and verify the service starts correctly.

```bash
cd /Users/rashid/Desktop/Workspaces/mentu-web/agent-service

# Build TypeScript
npm run build

# Verify dist files exist
ls -la dist/claude/

# Start service locally to verify no runtime errors
npm run dev &
sleep 3
curl http://localhost:8081/health
kill %1
```

---

## Before Submitting

Before running `mentu submit`, verify:

1. **TypeScript compiles**: `npx tsc --noEmit`
2. **Build passes**: `npm run build`
3. **Service starts**: `npm run dev` (no immediate errors)

---

## Completion Phase (REQUIRED)

**BEFORE calling `mentu submit`, you MUST create a RESULT document:**

### Step 1: Create RESULT Document

Read the template and create the RESULT document:

```bash
# Read the template structure
cat /Users/rashid/Desktop/Workspaces/mentu-ai/docs/templates/TEMPLATE-Result.md

# Create: docs/RESULT-ConversationHistory-v1.0.md
```

The RESULT document MUST include:
- Valid YAML front matter with all required fields
- Summary of what was built
- Files created and modified
- Test results (tsc, build)
- Design decisions with rationale

### Step 2: Capture RESULT as Evidence

```bash
# Actor auto-resolved from manifest, author-type declares role
mentu capture "Created RESULT-ConversationHistory: History module enabling multi-turn conversations" \
  --kind result-document \
  --path docs/RESULT-ConversationHistory-v1.0.md \
  --refs cmt_dcbd0359 \
  --author-type executor
```

### Step 3: Update RESULT Front Matter

Update the YAML front matter with the evidence ID:

```yaml
mentu:
  commitment: cmt_dcbd0359
  evidence: mem_YYYYYYYY  # ← The ID from Step 2
  status: in_review
```

### Step 4: Submit with Evidence

```bash
# Actor auto-resolved from manifest (same as claim)
mentu submit cmt_dcbd0359 \
  --summary "Implemented conversation history for agent service" \
  --include-files
```

**The RESULT document IS the closure proof. Do not submit without it.**

---

## Verification Checklist

### Files
- [ ] `agent-service/src/claude/history.ts` exists
- [ ] `agent-service/src/claude/client.ts` updated
- [ ] `agent-service/src/claude/streaming.ts` updated

### Checks
- [ ] `npm run build` passes
- [ ] `npx tsc --noEmit` passes

### Mentu
- [ ] Commitment claimed with `mentu claim`
- [ ] **RESULT document created** (`docs/RESULT-ConversationHistory-v1.0.md`)
- [ ] **RESULT captured as evidence** with `mentu capture`
- [ ] **RESULT front matter updated** with evidence ID
- [ ] Commitment submitted with `mentu submit`

### Functionality
- [ ] Service starts without errors
- [ ] First message in conversation works (empty history)
- [ ] Second message has context from first (verify via logs)

---

*Enabling multi-turn conversations through history injection.*
