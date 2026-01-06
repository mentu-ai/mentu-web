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

interface TerminalTab {
  id: string;
  name: string;
}

export function TerminalPanel() {
  const { isOpen, height, toggle, close, setHeight } = useTerminal();
  const { isOpen: rightPanelOpen, width: rightPanelWidth } = useRightPanel();
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);
  const [contentHeight, setContentHeight] = useState(height - TAB_BAR_HEIGHT);

  // Multi-terminal state
  const [tabs, setTabs] = useState<TerminalTab[]>([
    { id: 'terminal-1', name: 'Terminal' }
  ]);
  const [activeTabId, setActiveTabId] = useState('terminal-1');
  const tabCounterRef = useRef(1);

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

  const addNewTerminal = useCallback(() => {
    tabCounterRef.current += 1;
    const newTab: TerminalTab = {
      id: `terminal-${tabCounterRef.current}`,
      name: 'Terminal'
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, []);

  const closeTab = useCallback((tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId);

      // If we're closing the active tab, switch to another one
      if (tabId === activeTabId && newTabs.length > 0) {
        const closedIndex = prev.findIndex(t => t.id === tabId);
        const newActiveIndex = Math.min(closedIndex, newTabs.length - 1);
        setActiveTabId(newTabs[newActiveIndex].id);
      }

      // If no tabs left, close the panel
      if (newTabs.length === 0) {
        close();
        // Reset to default tab for next open
        tabCounterRef.current = 1;
        return [{ id: 'terminal-1', name: 'Terminal' }];
      }

      return newTabs;
    });
  }, [activeTabId, close]);

  const marginRight = rightPanelOpen ? rightPanelWidth : 0;

  return (
    <>
      {/* Collapsed status bar - shown when terminal is closed */}
      <div
        className={cn(
          'flex-shrink-0 w-full min-w-0 max-w-full h-7 flex items-center justify-between px-4 overflow-hidden',
          'bg-zinc-800 border-t border-zinc-700',
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
          'bg-zinc-900 border-t border-zinc-700'
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
        <div className="h-9 flex items-stretch bg-zinc-800 flex-shrink-0">
          {/* Tabs area */}
          <div className="flex-1 flex items-stretch overflow-x-auto scrollbar-none">
            {tabs.map((tab, index) => (
              <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-3 min-w-0 border-r border-zinc-700 cursor-pointer select-none',
                  activeTabId === tab.id
                    ? 'bg-zinc-900 text-zinc-200'
                    : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-750'
                )}
              >
                <span className="text-xs font-medium text-zinc-500">{index + 1}</span>
                <Terminal className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-sm truncate">{tab.name}</span>
                <button
                  onClick={(e) => closeTab(tab.id, e)}
                  className="ml-1 p-0.5 rounded hover:bg-zinc-600 text-zinc-500 hover:text-zinc-300 transition-colors"
                  title="Close Terminal"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* Add new terminal button */}
            <button
              onClick={addNewTerminal}
              className="flex items-center justify-center px-3 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 transition-colors"
              title="New Terminal"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-1 px-2 border-l border-zinc-700">
            <button
              className="p-1.5 rounded hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Terminal Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Terminal content - render all terminals, show only active */}
        <div
          style={{ height: isOpen ? contentHeight : 400 }}
          className="overflow-hidden bg-zinc-900 relative"
        >
          {tabs.map(tab => (
            <div
              key={tab.id}
              className="absolute inset-0"
              style={{
                visibility: activeTabId === tab.id ? 'visible' : 'hidden',
                zIndex: activeTabId === tab.id ? 1 : 0,
              }}
            >
              <CloudTerminal
                className="w-full h-full"
                sessionKey={tab.id}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
