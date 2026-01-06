'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { X, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTerminal } from '@/contexts/TerminalContext';
import { CloudTerminal } from '../terminal/CloudTerminal';

const MIN_HEIGHT = 150;
const MAX_HEIGHT = 600;
const HEADER_HEIGHT = 33; // Height of resize handle + header

export function TerminalPanel() {
  const { isOpen, height, close, setHeight } = useTerminal();
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);
  const [contentHeight, setContentHeight] = useState(height - HEADER_HEIGHT);

  // Update content height when panel height changes
  useEffect(() => {
    setContentHeight(Math.max(0, height - HEADER_HEIGHT));
  }, [height]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    startYRef.current = e.clientY;
    startHeightRef.current = height;
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
  }, [height]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const deltaY = startYRef.current - e.clientY;
      const newHeight = startHeightRef.current + deltaY;
      setHeight(Math.min(Math.max(newHeight, MIN_HEIGHT), MAX_HEIGHT));
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [setHeight]);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="flex-shrink-0 flex flex-col bg-zinc-900 border-t border-zinc-700"
      style={{ height }}
    >
      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className={cn(
          'h-1 cursor-ns-resize flex-shrink-0',
          'hover:bg-blue-500/50 transition-colors',
          'bg-zinc-700'
        )}
      />

      {/* Terminal header */}
      <div className="h-8 flex items-center justify-between px-3 bg-zinc-800 border-b border-zinc-700 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-300 uppercase tracking-wide">Terminal</span>
          <span className="text-xs text-zinc-500">Cloud Session</span>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setHeight(MIN_HEIGHT)}
            className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Minimize"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setHeight(MAX_HEIGHT)}
            className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Maximize"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={close}
            className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal content with explicit pixel height */}
      <div style={{ height: contentHeight }} className="overflow-hidden">
        <CloudTerminal className="w-full h-full" />
      </div>
    </div>
  );
}
