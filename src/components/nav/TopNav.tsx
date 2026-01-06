'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { Terminal, Search, ChevronRight } from 'lucide-react';
import { useTerminal } from '@/contexts/TerminalContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function TopNav() {
  const params = useParams();
  const pathname = usePathname();
  const workspace = params.workspace as string;
  const plane = params.plane as string;
  const { isOpen: terminalOpen, toggle: toggleTerminal } = useTerminal();

  // Extract current view from pathname
  const pathParts = pathname?.split('/').filter(Boolean) || [];
  const currentView = pathParts.length > 3 ? pathParts[3] : null;

  // Capitalize first letter helper
  const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

  return (
    <nav className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 h-11">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <Link
            href={workspace ? `/workspace/${workspace}/execution/kanban` : '/'}
            className="flex items-center gap-2 hover:opacity-80"
          >
            <div className="w-6 h-6 bg-zinc-900 dark:bg-zinc-100 rounded-md" />
            <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">mentu</span>
          </Link>
        </div>

        {/* Center: Breadcrumb */}
        {workspace && plane && (
          <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="text-zinc-400 dark:text-zinc-500">{workspace}</span>
            <ChevronRight className="w-3 h-3 text-zinc-300 dark:text-zinc-600" />
            <span className="text-zinc-600 dark:text-zinc-300">{capitalize(plane)}</span>
            {currentView && (
              <>
                <ChevronRight className="w-3 h-3 text-zinc-300 dark:text-zinc-600" />
                <span className="text-zinc-900 dark:text-zinc-100 font-medium">{capitalize(currentView)}</span>
              </>
            )}
          </div>
        )}

        {/* Right: Utility buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            title="Search"
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTerminal}
            className={cn(
              'h-8 w-8 relative text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100',
              terminalOpen && 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
            )}
            title="Toggle Terminal"
          >
            <Terminal className="h-4 w-4" />
            {terminalOpen && (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-green-500" />
            )}
          </Button>
        </div>
      </div>
    </nav>
  );
}
