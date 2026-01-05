'use client';

import { useRef, useCallback, useEffect } from 'react';
import { X, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTerminal } from '@/contexts/TerminalContext';
import { CloudTerminal } from './CloudTerminal';

const MIN_HEIGHT = 150;
const MAX_HEIGHT = 600;

export function ResizableTerminalPanel() {
  const { isOpen, height, close, setHeight } = useTerminal();
  const panelRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

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
      ref={panelRef}
      className={cn(
        'flex-shrink-0',
        'bg-zinc-900 border-t border-zinc-700',
        'flex flex-col'
      )}
      style={{ height }}
    >
      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className={cn(
          'h-1 cursor-ns-resize',
          'hover:bg-blue-500/50 transition-colors',
          'bg-zinc-700'
        )}
      />

      {/* Terminal header - VS Code style */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-800 border-b border-zinc-700">
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
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => setHeight(MAX_HEIGHT)}
            className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Maximize"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={close}
            className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <CloudTerminal className="h-full" />
      </div>
    </div>
  );
}
