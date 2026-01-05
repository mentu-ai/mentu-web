'use client';

import { useRef, useCallback, useEffect } from 'react';
import { X, Minus, Maximize2 } from 'lucide-react';
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
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-zinc-900 border-t border-zinc-700',
        'flex flex-col',
        'motion-safe:animate-in motion-safe:slide-in-from-bottom motion-safe:duration-200'
      )}
      style={{ height }}
    >
      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className={cn(
          'absolute -top-1 left-0 right-0 h-2 cursor-ns-resize',
          'hover:bg-blue-500/30 transition-colors',
          'flex items-center justify-center'
        )}
      >
        <div className="w-16 h-1 rounded-full bg-zinc-600 hover:bg-zinc-500" />
      </div>

      {/* Terminal header */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-sm font-medium text-zinc-300">Terminal</span>
          <span className="text-xs text-zinc-500">Cloud Session</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setHeight(MIN_HEIGHT)}
            className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Minimize"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setHeight(MAX_HEIGHT)}
            className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Maximize"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={close}
            className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal content */}
      <div className="flex-1 overflow-hidden">
        <CloudTerminal className="h-full" />
      </div>
    </div>
  );
}
