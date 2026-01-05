'use client';

import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface CloudTerminalProps {
  className?: string;
}

export function CloudTerminal({ className }: CloudTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, monospace',
      theme: {
        background: '#1a1a1a',
        foreground: '#f0f0f0',
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    terminalInstanceRef.current = term;

    // Connect WebSocket
    const wsUrl = process.env.NEXT_PUBLIC_TERMINAL_URL || 'wss://api.mentu.ai/terminal';
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      setStatus('connected');
      term.write('Connected to cloud terminal\r\n');

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

    // Handle resize
    const handleResize = () => {
      fitAddon.fit();
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'resize',
          cols: term.cols,
          rows: term.rows,
        }));
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      socket.close();
      term.dispose();
    };
  }, []);

  return (
    <div className={className}>
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-900 border-b border-zinc-700">
        <span className="text-sm text-zinc-400">Cloud Terminal</span>
        <span className={`text-xs px-2 py-0.5 rounded ${
          status === 'connected' ? 'bg-green-900 text-green-300' :
          status === 'connecting' ? 'bg-yellow-900 text-yellow-300' :
          'bg-red-900 text-red-300'
        }`}>
          {status}
        </span>
      </div>
      <div ref={terminalRef} className="h-[400px]" />
    </div>
  );
}
