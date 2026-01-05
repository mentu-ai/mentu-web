'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Terminal } from 'lucide-react';
import { PlaneTabs } from './PlaneTabs';
import { WorkspaceSelector } from './WorkspaceSelector';
import { ProjectSettingsModal } from '@/components/modals/ProjectSettingsModal';
import { useTerminal } from '@/contexts/TerminalContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function TopNav() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const params = useParams();
  const workspace = params.workspace as string;
  const { isOpen: terminalOpen, toggle: toggleTerminal } = useTerminal();

  return (
    <>
      <nav className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 h-14">
          {/* Left: Logo + Workspace Selector */}
          <div className="flex items-center gap-3">
            <Link
              href={`/workspace/${workspace}/execution`}
              className="flex items-center gap-2 hover:opacity-80"
            >
              <div className="w-7 h-7 bg-zinc-900 dark:bg-zinc-100 rounded-md" />
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">mentu</span>
            </Link>
            <span className="text-zinc-300 dark:text-zinc-600">·</span>
            <WorkspaceSelector onSettingsClick={() => setSettingsOpen(true)} />
          </div>

          {/* Center: Plane Tabs */}
          <PlaneTabs />

          {/* Right: Terminal button */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTerminal}
              className={cn(
                'relative',
                terminalOpen && 'bg-zinc-100 dark:bg-zinc-800'
              )}
              title="Toggle Terminal"
            >
              <Terminal className="h-5 w-5" />
              {terminalOpen && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-green-500" />
              )}
            </Button>
          </div>
        </div>
      </nav>

      <ProjectSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}
