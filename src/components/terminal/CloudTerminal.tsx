'use client';

import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface CloudTerminalProps {
  className?: string;
  autoStartAgent?: boolean;
}

// The command to auto-start Claude agent
const AGENT_COMMAND = 'claude --dangerously-skip-permissions "Read CLAUDE.md for instructions, you are an agent inside Mentu Web Platform."';

export function CloudTerminal({ className, autoStartAgent = true }: CloudTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'agent_starting' | 'agent_ready' | 'disconnected'>('connecting');

  // State for output filtering
  const outputBufferRef = useRef<string>('');
  const agentStartedRef = useRef(false);
  const commandSentRef = useRef(false);
  const shellReadyRef = useRef(false);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#18181b', // zinc-900
        foreground: '#e4e4e7', // zinc-200
        cursor: '#e4e4e7',
        selectionBackground: '#3f3f46', // zinc-700
      },
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    fitAddonRef.current = fitAddon;
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);

    terminalInstanceRef.current = term;

    // Fit after a short delay to ensure container has dimensions
    const fitTerminal = () => {
      if (fitAddon && terminalRef.current) {
        try {
          fitAddon.fit();
        } catch {
          // Ignore fit errors during initialization
        }
      }
    };

    // Initial fit with delay
    setTimeout(fitTerminal, 100);

    // Connect WebSocket
    const wsUrl = process.env.NEXT_PUBLIC_TERMINAL_URL || 'wss://api.mentu.ai/terminal';
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
      // Look for common shell prompt patterns
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
      // Look for Claude's output signature
      const agentPatterns = [
        /claude/i,
        /╭|╰|│/, // Claude's box-drawing characters
        /thinking/i,
        /I'll|I will|Let me/i, // Common Claude response starts
      ];

      return agentPatterns.some(pattern => pattern.test(data));
    };

    socket.onopen = () => {
      setStatus('connected');

      if (autoStartAgent) {
        term.write('\x1b[90mConnecting to cloud terminal...\x1b[0m\r\n');
      } else {
        term.write('Connected to cloud terminal\r\n');
      }

      fitTerminal();

      // Send initial resize
      socket.send(JSON.stringify({
        type: 'resize',
        cols: term.cols,
        rows: term.rows,
      }));
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
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
              // Small delay to ensure shell is fully ready
              setTimeout(sendAgentCommand, 100);
              return; // Don't write the prompt
            }

            // If command sent but agent not started, filter output
            if (commandSentRef.current && !agentStartedRef.current) {
              // Check if agent has started
              if (checkAgentStarted(data)) {
                agentStartedRef.current = true;
                setStatus('agent_ready');
                // Clear and show clean output
                term.clear();
                term.write('\x1b[2J\x1b[H');
              }

              // Filter out the command echo and early shell output
              // Don't write anything until agent starts
              if (!agentStartedRef.current) {
                return;
              }
            }
          }

          // Normal output - write to terminal
          term.write(data);
        }
      } catch {
        term.write(event.data);
      }
    };

    socket.onclose = () => {
      setStatus('disconnected');
      term.write('\r\n\x1b[31mDisconnected from server\x1b[0m\r\n');
    };

    socket.onerror = () => {
      setStatus('disconnected');
      term.write('\r\n\x1b[31mConnection error\x1b[0m\r\n');
    };

    wsRef.current = socket;

    // Terminal input → WebSocket
    term.onData((data) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'input', data }));
      }
    });

    // Handle resize with debounce
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        fitTerminal();
        if (socket.readyState === WebSocket.OPEN) {
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
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      socket.close();
      term.dispose();
    };
  }, [autoStartAgent]);

  // Status display text
  const getStatusDisplay = () => {
    switch (status) {
      case 'connecting': return 'connecting';
      case 'connected': return 'connected';
      case 'agent_starting': return 'starting agent';
      case 'agent_ready': return 'agent ready';
      case 'disconnected': return 'disconnected';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connecting':
      case 'agent_starting':
        return 'bg-yellow-900/50 text-yellow-400';
      case 'connected':
      case 'agent_ready':
        return 'bg-green-900/50 text-green-400';
      case 'disconnected':
        return 'bg-red-900/50 text-red-400';
    }
  };

  return (
    <div ref={containerRef} className={`${className} flex flex-col bg-zinc-900 overflow-hidden`}>
      {/* Terminal area */}
      <div ref={terminalRef} className="flex-1 min-h-0 min-w-0 overflow-hidden" />
      {/* Status bar */}
      <div className="h-5 flex-shrink-0 flex items-center justify-end px-2 bg-zinc-800/50 border-t border-zinc-800">
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${getStatusColor()}`}>
          {getStatusDisplay()}
        </span>
      </div>
    </div>
  );
}
