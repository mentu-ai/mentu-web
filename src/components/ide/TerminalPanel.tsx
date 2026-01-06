'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { X, Plus, Settings, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTerminal } from '@/contexts/TerminalContext';
import { useRightPanel } from '@/contexts/RightPanelContext';
import { CloudTerminal } from '../terminal/CloudTerminal';

const MIN_HEIGHT = 150;
const MAX_HEIGHT = 600;
const TAB_BAR_HEIGHT = 36;

export function TerminalPanel() {
  const { isOpen, height, toggle, close, setHeight } = useTerminal();
  const { isOpen: rightPanelOpen, width: rightPanelWidth } = useRightPanel();
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);
  const [contentHeight, setContentHeight] = useState(height - TAB_BAR_HEIGHT);
  const [activeTab] = useState(1);

  // Update content height when panel height changes
  useEffect(() => {
    setContentHeight(Math.max(0, height - TAB_BAR_HEIGHT));
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

  const marginRight = rightPanelOpen ? rightPanelWidth : 0;

  return (
    <>
      {/* Collapsed status bar - shown when terminal is closed */}
      <div
        className={cn(
          'flex-shrink-0 w-full min-w-0 max-w-full h-7 flex items-center justify-between px-4 overflow-hidden',
          'bg-[#1e2128] border-t border-[#2d313a]',
          isOpen && 'hidden'
        )}
        style={{
          marginLeft: 0,
          marginRight,
          contain: 'layout style',
        }}
      >
        <button
          onClick={toggle}
          className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          title="Open Terminal"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Terminal</span>
        </button>
        <div className="flex items-center gap-3 text-[10px] text-zinc-500">
          <span>Cloud Session</span>
        </div>
      </div>

      {/* Full terminal panel - always rendered, visibility controlled */}
      <div
        ref={containerRef}
        className={cn(
          'flex-shrink-0 w-full min-w-0 max-w-full flex flex-col overflow-hidden',
          'bg-[#1a1d23] border-t border-[#2d313a]'
        )}
        style={{
          height: isOpen ? height : 1,
          marginLeft: 0,
          marginRight: isOpen ? marginRight : 0,
          contain: 'layout style',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          position: isOpen ? 'relative' : 'absolute',
          left: isOpen ? 'auto' : '-9999px',
        }}
        aria-hidden={!isOpen}
      >
        {/* Resize handle */}
        <div
          onMouseDown={handleMouseDown}
          className={cn(
            'h-[3px] cursor-ns-resize flex-shrink-0',
            'hover:bg-blue-500/50 transition-colors',
            'bg-transparent'
          )}
        />

        {/* Tab bar */}
        <div className="h-9 flex items-stretch bg-[#1e2128] flex-shrink-0">
          {/* Tabs area */}
          <div className="flex-1 flex items-stretch overflow-x-auto">
            {/* Tab 1 - Active */}
            <div
              className={cn(
                'flex items-center gap-2 px-3 min-w-0 border-r border-[#2d313a] cursor-pointer',
                activeTab === 1
                  ? 'bg-[#1a1d23] text-zinc-200'
                  : 'bg-[#1e2128] text-zinc-500 hover:text-zinc-300'
              )}
            >
              <span className="text-xs font-medium text-zinc-500">{activeTab}</span>
              <Terminal className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-sm truncate">Terminal</span>
              <button
                onClick={close}
                className="ml-1 p-0.5 rounded hover:bg-zinc-700/50 text-zinc-500 hover:text-zinc-300 transition-colors"
                title="Close Terminal"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Add new terminal button */}
            <button
              className="flex items-center justify-center px-3 text-zinc-500 hover:text-zinc-300 hover:bg-[#252830] transition-colors"
              title="New Terminal"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-1 px-2 border-l border-[#2d313a]">
            <button
              className="p-1.5 rounded hover:bg-[#252830] text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Terminal Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Terminal content - SINGLE instance, always mounted */}
        <div
          style={{ height: isOpen ? contentHeight : 400 }}
          className="overflow-hidden bg-[#1a1d23]"
        >
          <CloudTerminal className="w-full h-full" />
        </div>
      </div>
    </>
  );
}
