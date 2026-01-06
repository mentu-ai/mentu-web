'use client';

import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface CloudTerminalProps {
  className?: string;
}

export function CloudTerminal({ className }: CloudTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

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

    socket.onopen = () => {
      setStatus('connected');
      term.write('Connected to cloud terminal\r\n');
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
          term.write(msg.data);
        }
      } catch {
        term.write(event.data);
      }
    };

    socket.onclose = () => {
      setStatus('disconnected');
      term.write('\r\nDisconnected from server\r\n');
    };

    socket.onerror = () => {
      setStatus('disconnected');
      term.write('\r\nConnection error\r\n');
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
  }, []);

  return (
    <div ref={containerRef} className={`${className} flex flex-col bg-zinc-900`}>
      {/* Terminal area */}
      <div ref={terminalRef} className="flex-1 min-h-0 overflow-hidden" />
      {/* Status bar */}
      <div className="h-5 flex-shrink-0 flex items-center justify-end px-2 bg-zinc-800/50 border-t border-zinc-800">
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
          status === 'connected' ? 'bg-green-900/50 text-green-400' :
          status === 'connecting' ? 'bg-yellow-900/50 text-yellow-400' :
          'bg-red-900/50 text-red-400'
        }`}>
          {status}
        </span>
      </div>
    </div>
  );
}
