'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface IDELayoutProps {
  children: ReactNode;
  className?: string;
}

/**
 * IDE-style layout container
 * Provides the main structure: navbar, panels (left/main/right), and bottom panel
 */
export function IDELayout({ children, className }: IDELayoutProps) {
  return (
    <div className={cn('h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950', className)}>
      {children}
    </div>
  );
}

interface IDEBodyProps {
  children: ReactNode;
  className?: string;
}

/**
 * The main body area below the navbar
 * Contains left panel, editor area, and right panel
 */
export function IDEBody({ children, className }: IDEBodyProps) {
  return (
    <div className={cn('flex-1 flex overflow-hidden', className)}>
      {children}
    </div>
  );
}

interface IDEPanelProps {
  children: ReactNode;
  className?: string;
  position: 'left' | 'right';
  width?: number;
  minWidth?: number;
  maxWidth?: number;
}

/**
 * Side panel (left or right)
 * Fixed width panel for navigation, file explorer, etc.
 */
export function IDEPanel({
  children,
  className,
  position,
  width = 192, // 12rem = 192px
}: IDEPanelProps) {
  return (
    <aside
      className={cn(
        'flex-shrink-0 flex flex-col overflow-hidden',
        'bg-white dark:bg-zinc-900',
        position === 'left'
          ? 'border-r border-zinc-200 dark:border-zinc-800'
          : 'border-l border-zinc-200 dark:border-zinc-800',
        className
      )}
      style={{ width }}
    >
      {children}
    </aside>
  );
}

interface IDEMainProps {
  children: ReactNode;
  className?: string;
}

/**
 * Main editor/content area
 * Fills remaining space between left and right panels
 * Contains editor and bottom panel (terminal)
 */
export function IDEMain({ children, className }: IDEMainProps) {
  return (
    <div className={cn('flex-1 flex flex-col min-w-0 overflow-hidden', className)}>
      {children}
    </div>
  );
}

interface IDEEditorProps {
  children: ReactNode;
  className?: string;
}

/**
 * Editor content area
 * Scrollable area for main content
 */
export function IDEEditor({ children, className }: IDEEditorProps) {
  return (
    <main className={cn('flex-1 overflow-auto', className)}>
      {children}
    </main>
  );
}

interface IDEBottomPanelProps {
  children: ReactNode;
  className?: string;
  height: number;
  onHeightChange?: (height: number) => void;
  minHeight?: number;
  maxHeight?: number;
}

/**
 * Bottom panel (terminal, output, problems)
 * Resizable panel at the bottom of the editor area
 */
export function IDEBottomPanel({
  children,
  className,
  height,
}: IDEBottomPanelProps) {
  return (
    <div
      className={cn(
        'flex-shrink-0 flex flex-col overflow-hidden',
        'bg-zinc-900 border-t border-zinc-700',
        className
      )}
      style={{ height }}
    >
      {children}
    </div>
  );
}
