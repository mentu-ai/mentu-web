---
# ============================================================
# CANONICAL YAML FRONT MATTER
# ============================================================
id: HANDOFF-AgentChatPanel-v1.0
path: docs/HANDOFF-AgentChatPanel-v1.0.md
type: handoff
intent: execute

version: "1.0"
created: 2026-01-05
last_updated: 2026-01-05

tier: T3
author_type: executor

parent: PRD-AgentChatPanel-v1.0
children:
  - PROMPT-AgentChatPanel-v1.0

mentu:
  commitment: cmt_0c93945f
  status: pending

validation:
  required: true
  tier: T2
---

# HANDOFF: AgentChatPanel v1.0

## For the Coding Agent

Build a chat-based agent interface in the right side panel of mentu-web that connects via WebSocket to a VPS agent service.

**Read the full PRD**: `docs/PRD-AgentChatPanel-v1.0.md`

**CRITICAL CONSTRAINT**: DO NOT modify any CloudTerminal or TerminalContext files. They must remain exactly as they are.

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

## Files to Create

### 1. Type Definitions

**File**: `src/lib/agent/types.ts`

```typescript
// Chat message types
export type MessageRole = 'user' | 'assistant' | 'tool_use' | 'tool_result' | 'system';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  tool_output?: string;
  timestamp: string;
  streaming?: boolean;
}

export interface Conversation {
  id: string;
  workspace_id: string;
  title: string;
  commitment_id?: string;
  created_at: string;
  updated_at: string;
}

// WebSocket message types
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

// Connection state
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
```

---

### 2. Agent Chat Context

**File**: `src/contexts/AgentChatContext.tsx`

```typescript
'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { ChatMessage, Conversation, ConnectionStatus } from '@/lib/agent/types';

interface AgentChatContextValue {
  // Panel state
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;

  // Connection state
  status: ConnectionStatus;
  setStatus: (status: ConnectionStatus) => void;

  // Conversation state
  conversation: Conversation | null;
  setConversation: (conv: Conversation | null) => void;

  // Messages
  messages: ChatMessage[];
  setMessages: (msgs: ChatMessage[]) => void;
  addMessage: (msg: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;

  // Streaming state
  isStreaming: boolean;
  setIsStreaming: (streaming: boolean) => void;
}

const AgentChatContext = createContext<AgentChatContextValue | null>(null);

export function AgentChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const toggle = useCallback(() => setIsOpen(prev => !prev), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const updateMessage = useCallback((id: string, updates: Partial<ChatMessage>) => {
    setMessages(prev => prev.map(msg =>
      msg.id === id ? { ...msg, ...updates } : msg
    ));
  }, []);

  return (
    <AgentChatContext.Provider value={{
      isOpen,
      toggle,
      open,
      close,
      status,
      setStatus,
      conversation,
      setConversation,
      messages,
      setMessages,
      addMessage,
      updateMessage,
      isStreaming,
      setIsStreaming,
    }}>
      {children}
    </AgentChatContext.Provider>
  );
}

export function useAgentChatContext() {
  const context = useContext(AgentChatContext);
  if (!context) {
    throw new Error('useAgentChatContext must be used within AgentChatProvider');
  }
  return context;
}
```

---

### 3. WebSocket Hook

**File**: `src/hooks/useAgentChat.ts`

```typescript
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAgentChatContext } from '@/contexts/AgentChatContext';
import type {
  WSMessage,
  WSAssistantChunk,
  WSToolUse,
  WSToolResult,
  WSDone,
  WSError,
  ChatMessage
} from '@/lib/agent/types';

const AGENT_WS_URL = process.env.NEXT_PUBLIC_AGENT_WS_URL || 'wss://api.mentu.ai/agent';
const RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;

export function useAgentChat() {
  const {
    status,
    setStatus,
    conversation,
    addMessage,
    updateMessage,
    setIsStreaming,
  } = useAgentChatContext();

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const currentMessageIdRef = useRef<string | null>(null);
  const currentContentRef = useRef('');

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus('connecting');

    const ws = new WebSocket(AGENT_WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('connected');
      reconnectAttempts.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);
        handleMessage(msg);
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    ws.onclose = () => {
      setStatus('disconnected');
      wsRef.current = null;

      // Exponential backoff reconnect
      const delay = Math.min(
        RECONNECT_DELAY * Math.pow(2, reconnectAttempts.current),
        MAX_RECONNECT_DELAY
      );
      reconnectAttempts.current++;
      setTimeout(connect, delay);
    };

    ws.onerror = () => {
      setStatus('error');
    };
  }, [setStatus]);

  const handleMessage = useCallback((msg: WSMessage) => {
    switch (msg.type) {
      case 'assistant_chunk': {
        const chunk = msg as WSAssistantChunk;
        setIsStreaming(true);

        if (!currentMessageIdRef.current) {
          // Start new assistant message
          const newId = chunk.data.message_id || `msg_${Date.now()}`;
          currentMessageIdRef.current = newId;
          currentContentRef.current = chunk.data.delta;

          addMessage({
            id: newId,
            conversation_id: msg.conversation_id,
            role: 'assistant',
            content: chunk.data.delta,
            timestamp: new Date().toISOString(),
            streaming: true,
          });
        } else {
          // Append to existing message
          currentContentRef.current += chunk.data.delta;
          updateMessage(currentMessageIdRef.current, {
            content: currentContentRef.current,
          });
        }
        break;
      }

      case 'tool_use': {
        const toolUse = msg as WSToolUse;
        addMessage({
          id: toolUse.data.tool_call_id,
          conversation_id: msg.conversation_id,
          role: 'tool_use',
          content: '',
          tool_name: toolUse.data.tool,
          tool_input: toolUse.data.input,
          timestamp: new Date().toISOString(),
        });
        break;
      }

      case 'tool_result': {
        const toolResult = msg as WSToolResult;
        addMessage({
          id: `result_${toolResult.data.tool_call_id}`,
          conversation_id: msg.conversation_id,
          role: 'tool_result',
          content: toolResult.data.output,
          timestamp: new Date().toISOString(),
        });
        break;
      }

      case 'done': {
        const done = msg as WSDone;
        setIsStreaming(false);
        if (currentMessageIdRef.current) {
          updateMessage(currentMessageIdRef.current, { streaming: false });
        }
        currentMessageIdRef.current = null;
        currentContentRef.current = '';
        break;
      }

      case 'error': {
        const error = msg as WSError;
        setIsStreaming(false);
        addMessage({
          id: `error_${Date.now()}`,
          conversation_id: msg.conversation_id,
          role: 'system',
          content: `Error: ${error.data.message}`,
          timestamp: new Date().toISOString(),
        });
        currentMessageIdRef.current = null;
        currentContentRef.current = '';
        break;
      }
    }
  }, [addMessage, updateMessage, setIsStreaming]);

  const sendMessage = useCallback((content: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    if (!conversation) {
      console.error('No active conversation');
      return;
    }

    // Add user message to UI immediately
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      conversation_id: conversation.id,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMsg);

    // Send to server
    wsRef.current.send(JSON.stringify({
      type: 'user_message',
      conversation_id: conversation.id,
      data: { content },
    }));
  }, [conversation, addMessage]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // Auto-connect when conversation is set
  useEffect(() => {
    if (conversation && status === 'disconnected') {
      connect();
    }

    return () => {
      // Don't disconnect on unmount - let it reconnect
    };
  }, [conversation, status, connect]);

  return {
    status,
    connect,
    disconnect,
    sendMessage,
  };
}
```

---

### 4. Agent Chat Panel

**File**: `src/components/agent-chat/AgentChatPanel.tsx`

```typescript
'use client';

import { useRef, useEffect } from 'react';
import { X, MessageSquare, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAgentChatContext } from '@/contexts/AgentChatContext';
import { useAgentChat } from '@/hooks/useAgentChat';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';

export function AgentChatPanel() {
  const { isOpen, close, status, isStreaming } = useAgentChatContext();
  const { sendMessage } = useAgentChat();
  const panelRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className={cn(
        'fixed right-0 top-11 bottom-0 w-full md:w-[420px]',
        'bg-white dark:bg-zinc-900',
        'border-l border-zinc-200 dark:border-zinc-700',
        'shadow-xl z-30',
        'flex flex-col',
        'transform transition-transform duration-200 ease-out',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-zinc-500" />
          <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
            Agent Chat
          </span>
          {isStreaming && (
            <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Connection status indicator */}
          <span className={cn(
            'text-[10px] px-1.5 py-0.5 rounded',
            status === 'connected' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            status === 'connecting' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
            status === 'disconnected' && 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
            status === 'error' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
          )}>
            {status}
          </span>

          <button
            onClick={close}
            className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ChatMessages />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-200 dark:border-zinc-700">
        <ChatInput onSend={sendMessage} disabled={status !== 'connected' || isStreaming} />
      </div>
    </div>
  );
}
```

---

### 5. Chat Messages Component

**File**: `src/components/agent-chat/ChatMessages.tsx`

```typescript
'use client';

import { useRef, useEffect } from 'react';
import { useAgentChatContext } from '@/contexts/AgentChatContext';
import { ChatMessage } from './ChatMessage';

export function ChatMessages() {
  const { messages, isStreaming } = useAgentChatContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (shouldAutoScroll.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  // Detect if user has scrolled up
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    shouldAutoScroll.current = scrollHeight - scrollTop - clientHeight < 100;
  };

  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center text-zinc-400 dark:text-zinc-500">
          <p className="text-sm">No messages yet</p>
          <p className="text-xs mt-1">Start a conversation with the agent</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto p-4 space-y-4"
    >
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}

      {isStreaming && (
        <div className="flex items-center gap-2 text-zinc-400 text-sm">
          <span className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        </div>
      )}
    </div>
  );
}
```

---

### 6. Chat Message Component

**File**: `src/components/agent-chat/ChatMessage.tsx`

```typescript
'use client';

import { cn } from '@/lib/utils';
import type { ChatMessage as ChatMessageType } from '@/lib/agent/types';
import { ToolCallDisplay } from './ToolCallDisplay';
import { User, Bot, Terminal, AlertCircle } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const { role, content, tool_name, tool_input, tool_output, streaming } = message;

  // Tool use/result messages
  if (role === 'tool_use' || role === 'tool_result') {
    return (
      <ToolCallDisplay
        toolName={tool_name || 'unknown'}
        input={tool_input}
        output={role === 'tool_result' ? content : undefined}
        isResult={role === 'tool_result'}
      />
    );
  }

  // System/error messages
  if (role === 'system') {
    return (
      <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p className="text-sm">{content}</p>
      </div>
    );
  }

  const isUser = role === 'user';

  return (
    <div className={cn(
      'flex gap-3',
      isUser ? 'flex-row-reverse' : 'flex-row'
    )}>
      {/* Avatar */}
      <div className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
        isUser
          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
      )}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Message bubble */}
      <div className={cn(
        'max-w-[80%] rounded-lg px-3 py-2',
        isUser
          ? 'bg-blue-500 text-white'
          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
      )}>
        <p className="text-sm whitespace-pre-wrap break-words">
          {content}
          {streaming && (
            <span className="inline-block w-1.5 h-4 ml-0.5 bg-current animate-pulse" />
          )}
        </p>
      </div>
    </div>
  );
}
```

---

### 7. Tool Call Display

**File**: `src/components/agent-chat/ToolCallDisplay.tsx`

```typescript
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Terminal, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolCallDisplayProps {
  toolName: string;
  input?: Record<string, unknown>;
  output?: string;
  isResult?: boolean;
}

export function ToolCallDisplay({ toolName, input, output, isResult }: ToolCallDisplayProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 text-left',
          'bg-zinc-50 dark:bg-zinc-800/50',
          'hover:bg-zinc-100 dark:hover:bg-zinc-800',
          'transition-colors'
        )}
      >
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
        )}

        <Terminal className="w-3.5 h-3.5 text-zinc-500" />

        <span className="text-xs font-mono text-zinc-600 dark:text-zinc-300">
          {toolName}
        </span>

        {isResult && (
          <CheckCircle className="w-3.5 h-3.5 text-green-500 ml-auto" />
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-zinc-200 dark:border-zinc-700">
          {input && (
            <div className="p-3 border-b border-zinc-200 dark:border-zinc-700">
              <p className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1">Input</p>
              <pre className="text-xs font-mono text-zinc-600 dark:text-zinc-300 overflow-x-auto">
                {JSON.stringify(input, null, 2)}
              </pre>
            </div>
          )}

          {output && (
            <div className="p-3">
              <p className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1">Output</p>
              <pre className="text-xs font-mono text-zinc-600 dark:text-zinc-300 overflow-x-auto whitespace-pre-wrap">
                {output.length > 500 ? `${output.slice(0, 500)}...` : output}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

### 8. Chat Input Component

**File**: `src/components/agent-chat/ChatInput.tsx`

```typescript
'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  const handleSubmit = () => {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-3">
      <div className={cn(
        'flex items-end gap-2 p-2 rounded-lg',
        'bg-zinc-50 dark:bg-zinc-800',
        'border border-zinc-200 dark:border-zinc-700',
        'focus-within:border-blue-500 dark:focus-within:border-blue-500',
        'transition-colors'
      )}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Connecting...' : 'Type a message...'}
          disabled={disabled}
          rows={1}
          className={cn(
            'flex-1 resize-none bg-transparent',
            'text-sm text-zinc-900 dark:text-zinc-100',
            'placeholder-zinc-400 dark:placeholder-zinc-500',
            'outline-none',
            'disabled:opacity-50'
          )}
        />

        <button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          className={cn(
            'p-1.5 rounded-md',
            'bg-blue-500 text-white',
            'hover:bg-blue-600',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors'
          )}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      <p className="text-[10px] text-zinc-400 mt-1.5 text-center">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}
```

---

### 9. Barrel Export

**File**: `src/components/agent-chat/index.ts`

```typescript
export { AgentChatPanel } from './AgentChatPanel';
export { ChatMessages } from './ChatMessages';
export { ChatMessage } from './ChatMessage';
export { ChatInput } from './ChatInput';
export { ToolCallDisplay } from './ToolCallDisplay';
```

---

### 10. Messages Hook (Supabase persistence)

**File**: `src/hooks/useAgentMessages.ts`

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { ChatMessage } from '@/lib/agent/types';

export function useAgentMessages(conversationId: string | undefined) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['agent-messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from('agent_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Map database rows to ChatMessage type
      return (data || []).map(row => ({
        id: row.id,
        conversation_id: row.conversation_id,
        role: row.role as ChatMessage['role'],
        content: row.content,
        tool_name: row.tool_name,
        tool_input: row.tool_input,
        tool_output: row.tool_output,
        timestamp: row.created_at,
      })) as ChatMessage[];
    },
    enabled: !!conversationId,
  });
}
```

---

## Integration Steps

### Step 1: Add Provider to Layout

**File**: `src/app/workspace/[workspace]/[plane]/layout.tsx`

Add `AgentChatProvider` alongside existing providers:

```typescript
import { AgentChatProvider } from '@/contexts/AgentChatContext';

// In the return statement, wrap with AgentChatProvider:
<TerminalProvider>
  <SidebarProvider>
    <RightPanelProvider>
      <AgentChatProvider>  {/* ADD THIS */}
        <IDELayout>
          {/* ... existing content ... */}
        </IDELayout>
      </AgentChatProvider>  {/* ADD THIS */}
    </RightPanelProvider>
  </SidebarProvider>
</TerminalProvider>
```

### Step 2: Add Chat Panel to Layout

In the same layout file, add `AgentChatPanel` component:

```typescript
import { AgentChatPanel } from '@/components/agent-chat';

// Inside IDELayout, after IDEMain:
<IDEMain>
  <IDEEditor className="...">{children}</IDEEditor>
  <TerminalPanel />
</IDEMain>
<AgentChatPanel />  {/* ADD THIS - outside IDEMain for fixed positioning */}
```

### Step 3: Add Toggle to TopNav

**File**: `src/components/nav/TopNav.tsx`

Add chat toggle button next to terminal toggle:

```typescript
import { useAgentChatContext } from '@/contexts/AgentChatContext';
import { MessageSquare } from 'lucide-react';

// Inside TopNav component:
const { isOpen: chatOpen, toggle: toggleChat } = useAgentChatContext();

// In the right buttons section, add:
<Button
  variant="ghost"
  size="icon"
  onClick={toggleChat}
  className={cn(
    'h-8 w-8 relative text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100',
    chatOpen && 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
  )}
  title="Toggle Agent Chat"
>
  <MessageSquare className="h-4 w-4" />
  {chatOpen && (
    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500" />
  )}
</Button>
```

---

## Verification Checklist

### Files
- [ ] `src/lib/agent/types.ts` exists
- [ ] `src/contexts/AgentChatContext.tsx` exists
- [ ] `src/hooks/useAgentChat.ts` exists
- [ ] `src/hooks/useAgentMessages.ts` exists
- [ ] `src/components/agent-chat/AgentChatPanel.tsx` exists
- [ ] `src/components/agent-chat/ChatMessages.tsx` exists
- [ ] `src/components/agent-chat/ChatMessage.tsx` exists
- [ ] `src/components/agent-chat/ChatInput.tsx` exists
- [ ] `src/components/agent-chat/ToolCallDisplay.tsx` exists
- [ ] `src/components/agent-chat/index.ts` exists

### Checks
- [ ] `npm run build` passes
- [ ] `npx tsc --noEmit` passes

### CloudTerminal Unchanged
- [ ] `git diff src/components/terminal/` shows NO changes
- [ ] `git diff src/contexts/TerminalContext.tsx` shows NO changes
- [ ] `git diff src/components/ide/TerminalPanel.tsx` shows NO changes

### Mentu
- [ ] Commitment claimed with `mentu claim`
- [ ] **RESULT document created** (`docs/RESULT-AgentChatPanel-v1.0.md`)
- [ ] **RESULT captured as evidence** with `mentu capture`
- [ ] Commitment submitted with `mentu submit`

### Functionality
- [ ] Chat panel opens/closes via toggle
- [ ] Panel does NOT interfere with terminal panel
- [ ] TypeScript compiles without errors

---

## Completion Phase (REQUIRED)

**BEFORE calling `mentu submit`, you MUST create a RESULT document:**

### Step 1: Create RESULT Document

```bash
# Create: docs/RESULT-AgentChatPanel-v1.0.md
```

The RESULT document MUST include:
- Valid YAML front matter with all required fields
- Summary of what was built
- Files created and modified
- Test results (tsc, build)
- Verification that CloudTerminal is unchanged

### Step 2: Capture RESULT as Evidence

```bash
mentu capture "Created RESULT-AgentChatPanel: Chat UI components for agent interaction" \
  --kind result-document \
  --path docs/RESULT-AgentChatPanel-v1.0.md \
  --refs cmt_XXXXXXXX \
  --author-type executor
```

### Step 3: Update RESULT Front Matter

```yaml
mentu:
  commitment: cmt_XXXXXXXX
  evidence: mem_YYYYYYYY
  status: in_review
```

### Step 4: Submit with Evidence

```bash
mentu submit cmt_XXXXXXXX \
  --summary "AgentChatPanel: Chat UI with WebSocket hook, message components, context provider" \
  --include-files
```

---

*This HANDOFF delivers the frontend chat interface. The VPS agent-service (backend) is a separate deliverable.*
