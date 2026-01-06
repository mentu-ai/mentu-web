'use client';

import { useRef, useCallback, useEffect, ReactNode } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/contexts/SidebarContext';

interface ResizableSidebarProps {
  children: ReactNode;
  className?: string;
}

export function ResizableSidebar({ children, className }: ResizableSidebarProps) {
  const { sidebar, toggle, setWidth } = useSidebar();
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = sidebar.width;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  }, [sidebar.width]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const deltaX = sidebar.position === 'left'
        ? e.clientX - startXRef.current
        : startXRef.current - e.clientX;
      const newWidth = startWidthRef.current + deltaX;
      setWidth(newWidth);
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
  }, [sidebar.position, setWidth]);

  // Collapsed state - just show toggle button
  if (!sidebar.isOpen) {
    return (
      <div
        className={cn(
          'flex-shrink-0 flex flex-col isolate',
          'bg-white dark:bg-zinc-900',
          sidebar.position === 'left'
            ? 'border-r border-zinc-200 dark:border-zinc-800'
            : 'border-l border-zinc-200 dark:border-zinc-800',
          className
        )}
        style={{ width: 40 }}
      >
        <button
          onClick={toggle}
          className="p-2 m-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
          title="Open sidebar"
        >
          <PanelLeftOpen className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex-shrink-0 flex isolate',
        sidebar.position === 'left' ? 'flex-row' : 'flex-row-reverse',
        className
      )}
      style={{ width: sidebar.width }}
    >
      {/* Sidebar content */}
      <div
        className={cn(
          'flex-1 flex flex-col overflow-hidden',
          'bg-white dark:bg-zinc-900',
          sidebar.position === 'left'
            ? 'border-r border-zinc-200 dark:border-zinc-800'
            : 'border-l border-zinc-200 dark:border-zinc-800'
        )}
      >
        {/* Header with collapse button */}
        <div className="flex items-center justify-between px-2 py-1 border-b border-zinc-200 dark:border-zinc-800">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
            Explorer
          </span>
          <button
            onClick={toggle}
            className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
            title="Close sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className={cn(
          'w-1 cursor-ew-resize flex-shrink-0',
          'hover:bg-blue-500/50 transition-colors',
          'bg-transparent hover:bg-blue-500/30'
        )}
      />
    </div>
  );
}
