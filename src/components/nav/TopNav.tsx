'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PlaneTabs } from './PlaneTabs';
import { WorkspaceSelector } from './WorkspaceSelector';
import { ProjectSettingsModal } from '@/components/modals/ProjectSettingsModal';

interface TopNavProps {
  user?: {
    name?: string;
    email?: string;
  };
}

export function TopNav({ user }: TopNavProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const params = useParams();
  const workspace = params.workspace as string;

  return (
    <>
      <nav className="bg-white border-b border-zinc-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 h-14">
          {/* Left: Logo + Workspace Selector */}
          <div className="flex items-center gap-3">
            <Link
              href={`/workspace/${workspace}/execution`}
              className="flex items-center gap-2 hover:opacity-80"
            >
              <div className="w-7 h-7 bg-zinc-900 rounded-md" />
              <span className="font-semibold text-zinc-900">mentu</span>
            </Link>
            <span className="text-zinc-300">·</span>
            <WorkspaceSelector onSettingsClick={() => setSettingsOpen(true)} />
          </div>

          {/* Center: Plane Tabs */}
          <PlaneTabs />

          {/* Right: User */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm text-zinc-600">
              {user?.name || user?.email || 'User'}
            </span>
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
