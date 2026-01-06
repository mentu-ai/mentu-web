'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface CloudTerminalProps {
  className?: string;
  autoStartAgent?: boolean;
  sessionKey?: string; // Optional key to identify the session (e.g., workspace ID)
}

// The command to auto-start Claude agent
const AGENT_COMMAND = 'claude --dangerously-skip-permissions';

// Connection settings
const HEARTBEAT_INTERVAL = 30000; // Send heartbeat every 30 seconds
const RECONNECT_DELAY = 2000; // Wait 2 seconds before reconnecting
const MAX_RECONNECT_ATTEMPTS = 10;
const SESSION_STORAGE_KEY = 'mentu_terminal_session';

// Terminal theme - lighter grey zinc colors
const TERMINAL_THEME = {
  background: '#27272a', // zinc-800 - visible grey
  foreground: '#fafafa', // zinc-50
  cursor: '#fafafa',
  cursorAccent: '#27272a',
  selectionBackground: '#52525b', // zinc-600
  black: '#18181b', // zinc-900
  red: '#ef4444', // red-500
  green: '#22c55e', // green-500
  yellow: '#eab308', // yellow-500
  blue: '#3b82f6', // blue-500
  magenta: '#a855f7', // purple-500
  cyan: '#06b6d4', // cyan-500
  white: '#fafafa', // zinc-50
  brightBlack: '#a1a1aa', // zinc-400
  brightRed: '#f87171', // red-400
  brightGreen: '#4ade80', // green-400
  brightYellow: '#facc15', // yellow-400
  brightBlue: '#60a5fa', // blue-400
  brightMagenta: '#c084fc', // purple-400
  brightCyan: '#22d3ee', // cyan-400
  brightWhite: '#ffffff', // white
};

// Generate or retrieve session ID for persistent sessions
function getOrCreateSessionId(sessionKey?: string): string {
  const storageKey = sessionKey ? `${SESSION_STORAGE_KEY}_${sessionKey}` : SESSION_STORAGE_KEY;

  if (typeof window === 'undefined') {
    return crypto.randomUUID();
  }

  let sessionId = localStorage.getItem(storageKey);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(storageKey, sessionId);
  }
  return sessionId;
}

export function CloudTerminal({ className, autoStartAgent = true, sessionKey }: CloudTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'agent_starting' | 'agent_ready' | 'reconnecting' | 'disconnected'>('connecting');

  // Session ID for persistent sessions
  const sessionIdRef = useRef<string>(getOrCreateSessionId(sessionKey));

  // State for output filtering
  const outputBufferRef = useRef<string>('');
  const agentStartedRef = useRef(false);
  const commandSentRef = useRef(false);
  const shellReadyRef = useRef(false);

  // Track if this is a session resume (don't auto-start agent again)
  const isResumingSessionRef = useRef(false);

  // Connection management
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isIntentionalCloseRef = useRef(false);
  const isConnectedRef = useRef(false);

  // Cleanup function for intervals
  const clearHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Start heartbeat to keep connection alive
  const startHeartbeat = useCallback((socket: WebSocket) => {
    clearHeartbeat();
    heartbeatIntervalRef.current = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'ping' }));
      }
    }, HEARTBEAT_INTERVAL);
  }, [clearHeartbeat]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    const term = terminalInstanceRef.current;
    if (!term) return;

    clearReconnectTimeout();

    // Build WebSocket URL with session ID for persistence
    const baseUrl = process.env.NEXT_PUBLIC_TERMINAL_URL || 'wss://api.mentu.ai/terminal';
    const wsUrl = `${baseUrl}?session=${sessionIdRef.current}`;
    const socket = new WebSocket(wsUrl);

    // Function to send the agent command
    const sendAgentCommand = () => {
      if (!autoStartAgent || commandSentRef.current) return;

      commandSentRef.current = true;
      setStatus('agent_starting');

      // Clear terminal and show starting message
      term.clear();
      term.write('\x1b[2J\x1b[H'); // Clear screen and move cursor to top
      term.write('\x1b[36m● Starting Mentu Agent...\x1b[0m\r\n\r\n');

      // Send the command (with leading space to hide from bash history)
      socket.send(JSON.stringify({
        type: 'input',
        data: ` ${AGENT_COMMAND}\r`
      }));
    };

    // Function to check if output indicates shell is ready
    const checkShellReady = (data: string) => {
      const promptPatterns = [
        /\$\s*$/, // bash prompt ending with $
        />\s*$/, // prompt ending with >
        /mentu.*:\s*$/, // our custom prompt
        /~.*\$/, // home directory prompt
      ];
      return promptPatterns.some(pattern => pattern.test(data));
    };

    // Function to check if Claude agent has started
    const checkAgentStarted = (data: string) => {
      const agentPatterns = [
        /claude/i,
        /╭|╰|│/, // Claude's box-drawing characters
        /thinking/i,
        /I'll|I will|Let me/i, // Common Claude response starts
      ];
      return agentPatterns.some(pattern => pattern.test(data));
    };

    socket.onopen = () => {
      isConnectedRef.current = true;
      reconnectAttemptsRef.current = 0;
      setStatus('connected');

      // Check if we're resuming an existing session
      const isResuming = isResumingSessionRef.current || agentStartedRef.current;

      if (isResuming) {
        // Resuming session - don't show connection message or restart agent
        setStatus(agentStartedRef.current ? 'agent_ready' : 'connected');
      } else if (autoStartAgent && !agentStartedRef.current) {
        term.write('\x1b[90mConnecting to cloud terminal...\x1b[0m\r\n');
      } else if (!autoStartAgent) {
        term.write('Connected to cloud terminal\r\n');
      }

      // Fit terminal
      if (fitAddonRef.current && terminalRef.current) {
        try {
          fitAddonRef.current.fit();
        } catch {
          // Ignore fit errors
        }
      }

      // Send initial resize
      socket.send(JSON.stringify({
        type: 'resize',
        cols: term.cols,
        rows: term.rows,
      }));

      // Request session history if resuming
      if (isResuming) {
        socket.send(JSON.stringify({
          type: 'resume',
          sessionId: sessionIdRef.current,
        }));
      }

      // Mark that we've connected at least once (future reconnects are resumes)
      isResumingSessionRef.current = true;

      // Start heartbeat
      startHeartbeat(socket);
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        // Handle pong responses (keep-alive acknowledgment)
        if (msg.type === 'pong') {
          return;
        }

        // Handle session history (sent when resuming)
        if (msg.type === 'history') {
          if (msg.data) {
            term.write(msg.data);
          }
          // Mark agent as started if history indicates it was running
          if (msg.agentRunning) {
            agentStartedRef.current = true;
            commandSentRef.current = true;
            shellReadyRef.current = true;
            setStatus('agent_ready');
          }
          return;
        }

        // Handle session info (tells us if this is a new or existing session)
        if (msg.type === 'session') {
          if (msg.isNew === false) {
            // Existing session - mark as resuming
            isResumingSessionRef.current = true;
          }
          return;
        }

        if (msg.type === 'output') {
          const data = msg.data;

          // Buffer output to detect patterns
          outputBufferRef.current += data;

          // Keep buffer from growing too large
          if (outputBufferRef.current.length > 2000) {
            outputBufferRef.current = outputBufferRef.current.slice(-1000);
          }

          if (autoStartAgent) {
            // Check if shell is ready and we haven't sent command yet
            if (!shellReadyRef.current && checkShellReady(outputBufferRef.current)) {
              shellReadyRef.current = true;
              setTimeout(sendAgentCommand, 100);
              return;
            }

            // If command sent but agent not started, filter output
            if (commandSentRef.current && !agentStartedRef.current) {
              if (checkAgentStarted(data)) {
                agentStartedRef.current = true;
                setStatus('agent_ready');
                term.clear();
                term.write('\x1b[2J\x1b[H');
              }

              if (!agentStartedRef.current) {
                return;
              }
            }
          }

          term.write(data);
        }
      } catch {
        term.write(event.data);
      }
    };

    socket.onclose = () => {
      isConnectedRef.current = false;
      clearHeartbeat();

      // Don't reconnect if this was an intentional close
      if (isIntentionalCloseRef.current) {
        setStatus('disconnected');
        return;
      }

      // Attempt to reconnect
      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        setStatus('reconnecting');
        term.write('\r\n\x1b[33m● Connection lost. Reconnecting...\x1b[0m\r\n');

        reconnectAttemptsRef.current++;
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, RECONNECT_DELAY * Math.min(reconnectAttemptsRef.current, 5)); // Exponential backoff capped at 5x
      } else {
        setStatus('disconnected');
        term.write('\r\n\x1b[31m● Disconnected. Max reconnection attempts reached.\x1b[0m\r\n');
      }
    };

    socket.onerror = () => {
      // Error handling is done in onclose
    };

    wsRef.current = socket;

    // Terminal input → WebSocket
    const dataHandler = term.onData((data) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'input', data }));
      }
    });

    return () => {
      dataHandler.dispose();
    };
  }, [autoStartAgent, clearHeartbeat, clearReconnectTimeout, startHeartbeat]);

  // Handle visibility change (tab switching, minimizing)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Page became visible - check connection and reconnect if needed
        const socket = wsRef.current;
        if (!socket || socket.readyState !== WebSocket.OPEN) {
          if (!isIntentionalCloseRef.current && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
            connect();
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connect]);

  // Handle beforeunload - keep connection alive until page actually closes
  useEffect(() => {
    const handleBeforeUnload = () => {
      isIntentionalCloseRef.current = true;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Effect to update theme on existing terminal (handles hot reload and theme changes)
  useEffect(() => {
    const term = terminalInstanceRef.current;
    if (term) {
      term.options.theme = TERMINAL_THEME;
    }
  });

  // Main effect for terminal initialization
  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: TERMINAL_THEME,
      allowProposedApi: true,
    });

    // Force apply theme (ensures it takes effect)
    term.options.theme = TERMINAL_THEME;

    const fitAddon = new FitAddon();
    fitAddonRef.current = fitAddon;
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);

    terminalInstanceRef.current = term;

    // Fit after a short delay
    const fitTerminal = () => {
      if (fitAddon && terminalRef.current) {
        try {
          fitAddon.fit();
        } catch {
          // Ignore fit errors
        }
      }
    };

    setTimeout(fitTerminal, 100);

    // Connect to WebSocket
    connect();

    // Handle resize with debounce
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        fitTerminal();
        const socket = wsRef.current;
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: 'resize',
            cols: term.cols,
            rows: term.rows,
          }));
        }
      }, 50);
    };

    window.addEventListener('resize', handleResize);

    // Watch container for size changes
    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      isIntentionalCloseRef.current = true;
      clearTimeout(resizeTimeout);
      clearHeartbeat();
      clearReconnectTimeout();
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();

      const socket = wsRef.current;
      if (socket) {
        socket.close();
      }

      term.dispose();
    };
  }, [connect, clearHeartbeat, clearReconnectTimeout]);

  // Status display
  const getStatusDisplay = () => {
    switch (status) {
      case 'connecting': return 'connecting';
      case 'connected': return 'connected';
      case 'agent_starting': return 'starting agent';
      case 'agent_ready': return 'agent ready';
      case 'reconnecting': return 'reconnecting';
      case 'disconnected': return 'disconnected';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connecting':
      case 'agent_starting':
      case 'reconnecting':
        return 'bg-yellow-900/50 text-yellow-400';
      case 'connected':
      case 'agent_ready':
        return 'bg-green-900/50 text-green-400';
      case 'disconnected':
        return 'bg-red-900/50 text-red-400';
    }
  };

  return (
    <div ref={containerRef} className={`${className} flex flex-col bg-zinc-800 overflow-hidden`}>
      {/* Terminal area */}
      <div ref={terminalRef} className="flex-1 min-h-0 min-w-0 overflow-hidden" />
      {/* Status bar */}
      <div className="h-5 flex-shrink-0 flex items-center justify-end px-2 bg-zinc-700 border-t border-zinc-600">
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${getStatusColor()}`}>
          {getStatusDisplay()}
        </span>
      </div>
    </div>
  );
}
