'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronDown, Settings, Plus, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MOCK_WORKSPACES } from '@/hooks/useWorkspaceNavigator';

interface WorkspaceSelectorProps {
  onSettingsClick: () => void;
}

export function WorkspaceSelector({ onSettingsClick }: WorkspaceSelectorProps) {
  const [open, setOpen] = useState(false);
  const params = useParams();
  const router = useRouter();
  const currentWorkspaceId = params.workspace as string;

  const handleSelectWorkspace = (workspaceId: string) => {
    setOpen(false);
    router.push(`/workspace/${workspaceId}`);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md"
      >
        {currentWorkspaceId}
        <ChevronDown className="w-4 h-4 opacity-50" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg z-50">
            <div className="p-2">
              <div className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-3 py-2">
                Workspaces
              </div>
              {MOCK_WORKSPACES.map(ws => {
                const isCurrent = ws.id === currentWorkspaceId;
                return (
                  <button
                    key={ws.id}
                    onClick={() => handleSelectWorkspace(ws.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-zinc-50 dark:hover:bg-zinc-800',
                      isCurrent && 'bg-zinc-50 dark:bg-zinc-800'
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
                      <Folder className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{ws.name}</div>
                      <div className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
                        {ws.description}
                      </div>
                    </div>
                    {isCurrent && <span className="w-2 h-2 bg-green-500 rounded-full" />}
                  </button>
                );
              })}
            </div>
            <div className="border-t border-zinc-100 dark:border-zinc-800 p-2">
              <button
                onClick={() => { setOpen(false); onSettingsClick(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg"
              >
                <Settings className="w-4 h-4" />
                Project Settings
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg">
                <Plus className="w-4 h-4" />
                Add Project
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
