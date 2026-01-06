---
# ============================================================
# CANONICAL YAML FRONT MATTER
# ============================================================
id: HANDOFF-AgentService-v1.0
path: docs/HANDOFF-AgentService-v1.0.md
type: handoff
intent: execute

version: "1.0"
created: 2026-01-05
last_updated: 2026-01-05

tier: T3
author_type: executor

parent: PRD-AgentService-v1.0
children:
  - PROMPT-AgentService-v1.0

mentu:
  commitment: cmt_18cbf947
  status: pending

validation:
  required: true
  tier: T2
---

# HANDOFF: AgentService v1.0

## For the Coding Agent

Build a WebSocket-based agent service that connects mentu-web's AgentChatPanel to Claude, with streaming responses and tool execution.

**Read the full PRD**: `docs/PRD-AgentService-v1.0.md`

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

## Mentu Protocol

### Operations

```bash
cd /Users/rashid/Desktop/Workspaces/mentu-web

# Check your actor identity (auto-resolved from manifest)
cat .mentu/manifest.yaml | grep actor

# Claim commitment (actor auto-resolved)
mentu claim cmt_XXXXXXXX --author-type executor

# Capture progress (actor auto-resolved, role declared)
mentu capture "{Progress}" --kind execution-progress --author-type executor
```

Save the commitment ID. You will close it with evidence.

---

## Environment Variables

The service requires these environment variables (set in `.env` or systemd service):

```bash
# Claude API
ANTHROPIC_API_KEY=sk-ant-...

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...  # Service role key for server-side

# Server
PORT=8080
NODE_ENV=production
```

---

## Files to Create

### 1. Package Configuration

**File**: `agent-service/package.json`

```json
{
  "name": "agent-service",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.32.0",
    "@supabase/supabase-js": "^2.47.0",
    "ws": "^8.18.0",
    "dotenv": "^16.4.0",
    "uuid": "^11.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/ws": "^8.5.0",
    "@types/uuid": "^10.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0"
  }
}
```

---

### 2. TypeScript Configuration

**File**: `agent-service/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

### 3. Entry Point

**File**: `agent-service/src/index.ts`

```typescript
import 'dotenv/config';
import { createServer } from 'http';
import { createWebSocketServer } from './websocket/server.js';

const PORT = parseInt(process.env.PORT || '8080', 10);

const httpServer = createServer((req, res) => {
  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'agent-service' }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = createWebSocketServer(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Agent service listening on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/agent`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  wss.close(() => {
    httpServer.close(() => {
      process.exit(0);
    });
  });
});
```

---

### 4. WebSocket Server

**File**: `agent-service/src/websocket/server.ts`

```typescript
import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { handleConnection } from './handlers.js';

export function createWebSocketServer(httpServer: HTTPServer): WebSocketServer {
  const wss = new WebSocketServer({
    server: httpServer,
    path: '/agent',
  });

  wss.on('connection', (ws: WebSocket, req) => {
    console.log(`New WebSocket connection from ${req.socket.remoteAddress}`);
    handleConnection(ws);
  });

  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
  });

  return wss;
}
```

---

### 5. WebSocket Handlers

**File**: `agent-service/src/websocket/handlers.ts`

```typescript
import { WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { processUserMessage } from '../claude/streaming.js';
import { getOrCreateConversation } from '../db/conversations.js';
import { saveMessage } from '../db/messages.js';
import type { WSMessage, WSUserMessage } from './types.js';

export function handleConnection(ws: WebSocket): void {
  let conversationId: string | null = null;

  ws.on('message', async (data) => {
    try {
      const message: WSMessage = JSON.parse(data.toString());

      switch (message.type) {
        case 'user_message': {
          const userMsg = message as WSUserMessage;

          // Get or create conversation
          if (!conversationId) {
            conversationId = userMsg.conversation_id || uuidv4();
            await getOrCreateConversation(conversationId);
          }

          // Save user message
          await saveMessage({
            id: uuidv4(),
            conversation_id: conversationId,
            role: 'user',
            content: userMsg.data.content,
          });

          // Process with Claude and stream response
          await processUserMessage(ws, conversationId, userMsg.data.content);
          break;
        }

        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendError(ws, conversationId || 'unknown', 'Failed to process message');
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
}

function sendError(ws: WebSocket, conversationId: string, message: string): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'error',
      conversation_id: conversationId,
      data: { message },
    }));
  }
}
```

**File**: `agent-service/src/websocket/types.ts`

```typescript
// Types must match frontend exactly
export type MessageRole = 'user' | 'assistant' | 'tool_use' | 'tool_result' | 'system';

export type WSMessageType =
  | 'user_message'
  | 'assistant_chunk'
  | 'tool_use'
  | 'tool_result'
  | 'error'
  | 'done';

export interface WSMessage {
  type: WSMessageType;
  conversation_id: string;
  data: unknown;
}

export interface WSUserMessage {
  type: 'user_message';
  conversation_id: string;
  data: { content: string };
}

export interface WSAssistantChunk {
  type: 'assistant_chunk';
  conversation_id: string;
  data: { delta: string; message_id?: string };
}

export interface WSToolUse {
  type: 'tool_use';
  conversation_id: string;
  data: {
    tool_call_id: string;
    tool: string;
    input: Record<string, unknown>;
  };
}

export interface WSToolResult {
  type: 'tool_result';
  conversation_id: string;
  data: {
    tool_call_id: string;
    output: string;
    is_error?: boolean;
  };
}

export interface WSDone {
  type: 'done';
  conversation_id: string;
  data: { message_id: string };
}

export interface WSError {
  type: 'error';
  conversation_id: string;
  data: { message: string; code?: string };
}
```

---

### 6. Claude Client

**File**: `agent-service/src/claude/client.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { getTools } from '../tools/registry.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const MODEL = 'claude-sonnet-4-20250514';

export async function createMessageStream(
  conversationHistory: Anthropic.MessageParam[]
) {
  const tools = getTools();

  return anthropic.messages.stream({
    model: MODEL,
    max_tokens: 8192,
    system: `You are a helpful AI assistant integrated into the Mentu dashboard. You help users with:
- Understanding their commitments and memories
- Managing their workspace
- Answering questions about the Mentu system
- General coding and productivity assistance

You have access to tools that can interact with the Mentu CLI and workspace files.
Be concise but helpful. When using tools, explain what you're doing.`,
    messages: conversationHistory,
    tools: tools.length > 0 ? tools : undefined,
  });
}

export { anthropic };
```

---

### 7. Stream Processing

**File**: `agent-service/src/claude/streaming.ts`

```typescript
import { WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import type Anthropic from '@anthropic-ai/sdk';
import { createMessageStream } from './client.js';
import { executeTool } from '../tools/registry.js';
import { getConversationMessages, saveMessage } from '../db/messages.js';
import type { WSAssistantChunk, WSToolUse, WSToolResult, WSDone } from '../websocket/types.js';

export async function processUserMessage(
  ws: WebSocket,
  conversationId: string,
  content: string
): Promise<void> {
  // Load conversation history
  const history = await getConversationMessages(conversationId);

  // Convert to Anthropic format
  const messages: Anthropic.MessageParam[] = history.map((msg) => {
    if (msg.role === 'tool_use') {
      return {
        role: 'assistant' as const,
        content: [{
          type: 'tool_use' as const,
          id: msg.id,
          name: msg.tool_name || 'unknown',
          input: msg.tool_input || {},
        }],
      };
    }
    if (msg.role === 'tool_result') {
      return {
        role: 'user' as const,
        content: [{
          type: 'tool_result' as const,
          tool_use_id: msg.id.replace('result_', ''),
          content: msg.content,
        }],
      };
    }
    return {
      role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content,
    };
  });

  // Add current user message
  messages.push({ role: 'user', content });

  // Process with Claude
  await streamClaudeResponse(ws, conversationId, messages);
}

async function streamClaudeResponse(
  ws: WebSocket,
  conversationId: string,
  messages: Anthropic.MessageParam[]
): Promise<void> {
  const messageId = uuidv4();
  let fullContent = '';
  let toolUseBlocks: Array<{ id: string; name: string; input: Record<string, unknown> }> = [];

  try {
    const stream = await createMessageStream(messages);

    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          const chunk = event.delta.text;
          fullContent += chunk;

          // Send chunk to client
          sendToClient<WSAssistantChunk>(ws, {
            type: 'assistant_chunk',
            conversation_id: conversationId,
            data: { delta: chunk, message_id: messageId },
          });
        } else if (event.delta.type === 'input_json_delta') {
          // Tool input streaming - we'll handle on content_block_stop
        }
      } else if (event.type === 'content_block_start') {
        if (event.content_block.type === 'tool_use') {
          toolUseBlocks.push({
            id: event.content_block.id,
            name: event.content_block.name,
            input: {},
          });
        }
      } else if (event.type === 'content_block_stop') {
        // Tool use block complete
      } else if (event.type === 'message_delta') {
        if (event.delta.stop_reason === 'tool_use') {
          // Handle tool uses
          const finalMessage = await stream.finalMessage();

          for (const block of finalMessage.content) {
            if (block.type === 'tool_use') {
              // Notify client of tool use
              sendToClient<WSToolUse>(ws, {
                type: 'tool_use',
                conversation_id: conversationId,
                data: {
                  tool_call_id: block.id,
                  tool: block.name,
                  input: block.input as Record<string, unknown>,
                },
              });

              // Save tool use to DB
              await saveMessage({
                id: block.id,
                conversation_id: conversationId,
                role: 'tool_use',
                content: '',
                tool_name: block.name,
                tool_input: block.input as Record<string, unknown>,
              });

              // Execute tool
              const result = await executeTool(block.name, block.input as Record<string, unknown>);

              // Notify client of result
              sendToClient<WSToolResult>(ws, {
                type: 'tool_result',
                conversation_id: conversationId,
                data: {
                  tool_call_id: block.id,
                  output: result.output,
                  is_error: result.is_error,
                },
              });

              // Save tool result to DB
              await saveMessage({
                id: `result_${block.id}`,
                conversation_id: conversationId,
                role: 'tool_result',
                content: result.output,
              });
            }
          }

          // Continue conversation with tool results
          const updatedHistory = await getConversationMessages(conversationId);
          const updatedMessages: Anthropic.MessageParam[] = updatedHistory.map((msg) => {
            if (msg.role === 'tool_use') {
              return {
                role: 'assistant' as const,
                content: [{
                  type: 'tool_use' as const,
                  id: msg.id,
                  name: msg.tool_name || 'unknown',
                  input: msg.tool_input || {},
                }],
              };
            }
            if (msg.role === 'tool_result') {
              return {
                role: 'user' as const,
                content: [{
                  type: 'tool_result' as const,
                  tool_use_id: msg.id.replace('result_', ''),
                  content: msg.content,
                }],
              };
            }
            return {
              role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
              content: msg.content,
            };
          });

          // Recursive call to continue processing
          await streamClaudeResponse(ws, conversationId, updatedMessages);
          return;
        }
      }
    }

    // Save assistant message
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
    console.error('Error streaming Claude response:', error);
    sendToClient(ws, {
      type: 'error',
      conversation_id: conversationId,
      data: { message: 'Failed to get response from Claude' },
    });
  }
}

function sendToClient<T extends { type: string }>(ws: WebSocket, message: T): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}
```

---

### 8. Tool Registry

**File**: `agent-service/src/tools/registry.ts`

```typescript
import type Anthropic from '@anthropic-ai/sdk';
import { mentuCapture, mentuStatus, mentuList } from './mentu-tools.js';

export interface ToolResult {
  output: string;
  is_error?: boolean;
}

type ToolHandler = (input: Record<string, unknown>) => Promise<ToolResult>;

const toolHandlers: Map<string, ToolHandler> = new Map();

// Register built-in tools
toolHandlers.set('mentu_capture', mentuCapture);
toolHandlers.set('mentu_status', mentuStatus);
toolHandlers.set('mentu_list', mentuList);

export function getTools(): Anthropic.Tool[] {
  return [
    {
      name: 'mentu_capture',
      description: 'Create a Mentu memory/observation. Use this to record important findings, progress, or evidence.',
      input_schema: {
        type: 'object' as const,
        properties: {
          body: {
            type: 'string',
            description: 'The content of the memory to capture',
          },
          kind: {
            type: 'string',
            description: 'Type of observation (e.g., evidence, progress, bug_report)',
            default: 'observation',
          },
        },
        required: ['body'],
      },
    },
    {
      name: 'mentu_status',
      description: 'Get the status of commitments in the workspace',
      input_schema: {
        type: 'object' as const,
        properties: {
          commitment_id: {
            type: 'string',
            description: 'Optional specific commitment ID to check',
          },
        },
      },
    },
    {
      name: 'mentu_list',
      description: 'List commitments or memories',
      input_schema: {
        type: 'object' as const,
        properties: {
          type: {
            type: 'string',
            enum: ['commitments', 'memories'],
            description: 'What to list',
          },
          state: {
            type: 'string',
            description: 'Filter by state (for commitments: open, claimed, in_review, closed)',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of items to return',
            default: 10,
          },
        },
        required: ['type'],
      },
    },
  ];
}

export async function executeTool(
  name: string,
  input: Record<string, unknown>
): Promise<ToolResult> {
  const handler = toolHandlers.get(name);

  if (!handler) {
    return {
      output: `Unknown tool: ${name}`,
      is_error: true,
    };
  }

  try {
    return await handler(input);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      output: `Tool execution failed: ${message}`,
      is_error: true,
    };
  }
}
```

---

### 9. Mentu Tools

**File**: `agent-service/src/tools/mentu-tools.ts`

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import type { ToolResult } from './registry.js';

const execAsync = promisify(exec);

const MENTU_PATH = '/Users/rashid/Desktop/Workspaces/mentu-ai';

async function runMentuCommand(cmd: string): Promise<ToolResult> {
  try {
    const { stdout, stderr } = await execAsync(cmd, {
      cwd: MENTU_PATH,
      timeout: 30000,
    });

    return {
      output: stdout || stderr || 'Command completed successfully',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      output: `Command failed: ${message}`,
      is_error: true,
    };
  }
}

export async function mentuCapture(input: Record<string, unknown>): Promise<ToolResult> {
  const body = input.body as string;
  const kind = (input.kind as string) || 'observation';

  const cmd = `mentu capture "${body.replace(/"/g, '\\"')}" --kind ${kind}`;
  return runMentuCommand(cmd);
}

export async function mentuStatus(input: Record<string, unknown>): Promise<ToolResult> {
  const commitmentId = input.commitment_id as string | undefined;

  const cmd = commitmentId
    ? `mentu show ${commitmentId}`
    : `mentu status`;

  return runMentuCommand(cmd);
}

export async function mentuList(input: Record<string, unknown>): Promise<ToolResult> {
  const type = input.type as 'commitments' | 'memories';
  const state = input.state as string | undefined;
  const limit = (input.limit as number) || 10;

  let cmd = `mentu list ${type} --limit ${limit}`;
  if (state) {
    cmd += ` --state ${state}`;
  }

  return runMentuCommand(cmd);
}
```

---

### 10. Supabase Client

**File**: `agent-service/src/db/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
```

---

### 11. Conversations Database

**File**: `agent-service/src/db/conversations.ts`

```typescript
import { supabase } from './supabase.js';

export interface Conversation {
  id: string;
  workspace_id: string;
  title: string;
  commitment_id?: string;
  created_at: string;
  updated_at: string;
}

export async function getOrCreateConversation(id: string): Promise<Conversation> {
  // Try to get existing conversation
  const { data: existing } = await supabase
    .from('agent_conversations')
    .select('*')
    .eq('id', id)
    .single();

  if (existing) {
    return existing as Conversation;
  }

  // Create new conversation
  const { data, error } = await supabase
    .from('agent_conversations')
    .insert({
      id,
      workspace_id: 'default', // TODO: Get from context
      title: 'New Conversation',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create conversation: ${error.message}`);
  }

  return data as Conversation;
}

export async function updateConversationTitle(
  id: string,
  title: string
): Promise<void> {
  await supabase
    .from('agent_conversations')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', id);
}
```

---

### 12. Messages Database

**File**: `agent-service/src/db/messages.ts`

```typescript
import { supabase } from './supabase.js';

export interface AgentMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'tool_use' | 'tool_result' | 'system';
  content: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  tool_output?: string;
  created_at?: string;
}

export async function saveMessage(message: Omit<AgentMessage, 'created_at'>): Promise<void> {
  const { error } = await supabase
    .from('agent_messages')
    .insert({
      ...message,
      created_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Failed to save message:', error);
    throw new Error(`Failed to save message: ${error.message}`);
  }
}

export async function getConversationMessages(
  conversationId: string
): Promise<AgentMessage[]> {
  const { data, error } = await supabase
    .from('agent_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to get messages:', error);
    return [];
  }

  return (data || []) as AgentMessage[];
}
```

---

## Database Migration

Create these tables in Supabase:

```sql
-- Run this migration before starting the service
CREATE TABLE IF NOT EXISTS agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL DEFAULT 'default',
  title TEXT NOT NULL DEFAULT 'New Conversation',
  commitment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_messages (
  id TEXT PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES agent_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'tool_use', 'tool_result', 'system')),
  content TEXT NOT NULL DEFAULT '',
  tool_name TEXT,
  tool_input JSONB,
  tool_output TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_messages_conversation ON agent_messages(conversation_id);
CREATE INDEX idx_agent_messages_created_at ON agent_messages(created_at);

-- Enable RLS
ALTER TABLE agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access" ON agent_conversations FOR ALL USING (true);
CREATE POLICY "Service role full access" ON agent_messages FOR ALL USING (true);
```

---

## Systemd Service (VPS Deployment)

**File**: `/etc/systemd/system/agent-service.service`

```ini
[Unit]
Description=Mentu Agent Service
After=network.target

[Service]
Type=simple
User=mentu
WorkingDirectory=/home/mentu/Workspaces/mentu-web/agent-service
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=/home/mentu/.env

[Install]
WantedBy=multi-user.target
```

---

## Verification Checklist

### Files
- [ ] `agent-service/package.json` exists
- [ ] `agent-service/tsconfig.json` exists
- [ ] `agent-service/src/index.ts` exists
- [ ] `agent-service/src/websocket/server.ts` exists
- [ ] `agent-service/src/websocket/handlers.ts` exists
- [ ] `agent-service/src/websocket/types.ts` exists
- [ ] `agent-service/src/claude/client.ts` exists
- [ ] `agent-service/src/claude/streaming.ts` exists
- [ ] `agent-service/src/tools/registry.ts` exists
- [ ] `agent-service/src/tools/mentu-tools.ts` exists
- [ ] `agent-service/src/db/supabase.ts` exists
- [ ] `agent-service/src/db/conversations.ts` exists
- [ ] `agent-service/src/db/messages.ts` exists

### Checks
- [ ] `cd agent-service && npm install` succeeds
- [ ] `cd agent-service && npx tsc --noEmit` passes
- [ ] `cd agent-service && npm run build` succeeds
- [ ] Database migration applied

### Mentu
- [ ] Commitment claimed with `mentu claim`
- [ ] **RESULT document created** (`docs/RESULT-AgentService-v1.0.md`)
- [ ] **RESULT captured as evidence** with `mentu capture`
- [ ] Commitment submitted with `mentu submit`

### Functionality
- [ ] Service starts without errors
- [ ] WebSocket accepts connections
- [ ] Messages are persisted to Supabase
- [ ] Claude responses stream correctly

---

## Completion Phase (REQUIRED)

**BEFORE calling `mentu submit`, you MUST create a RESULT document:**

### Step 1: Create RESULT Document

```bash
# Create: docs/RESULT-AgentService-v1.0.md
```

The RESULT document MUST include:
- Valid YAML front matter with all required fields
- Summary of what was built
- Files created and modified
- Test results (tsc, build)

### Step 2: Capture RESULT as Evidence

```bash
mentu capture "Created RESULT-AgentService: WebSocket agent backend with Claude streaming and tool execution" \
  --kind result-document \
  --path docs/RESULT-AgentService-v1.0.md \
  --refs cmt_XXXXXXXX
```

### Step 3: Update RESULT Front Matter

```yaml
mentu:
  commitment: cmt_XXXXXXXX
  evidence: mem_YYYYYYYY  # ← Update with actual evidence ID from Step 2
  status: in_review
```

### Step 4: Submit with Evidence

```bash
mentu submit cmt_XXXXXXXX \
  --summary "AgentService: WebSocket backend with Claude streaming, tool execution, Supabase persistence" \
  --include-files
```

---

*This HANDOFF delivers the backend service that powers the AgentChatPanel frontend.*
