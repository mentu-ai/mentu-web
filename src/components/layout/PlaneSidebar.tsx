'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { planeConfig } from '@/lib/navigation/planeConfig';
import { cn } from '@/lib/utils';
import {
  ChevronRight,
  ChevronDown,
  User,
  LogOut,
  FolderOpen,
  Wrench,
  BookOpen,
  LayoutList,
  Folder,
  File,
  Settings,
  Plus,
  Check,
  Loader2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useWorkspaces } from '@/hooks/useWorkspace';

interface PlaneSidebarProps {
  user?: {
    name?: string;
    email?: string;
  };
}

// Section configuration with Windows-style icons
const sectionConfig = {
  execution: {
    label: 'Execution',
    icon: LayoutList,
    description: 'Tasks & commitments',
  },
  files: {
    label: 'Files',
    icon: FolderOpen,
    description: 'Workspace files',
  },
  capability: {
    label: 'Capability',
    icon: Wrench,
    description: 'Tools & agents',
  },
  context: {
    label: 'Context',
    icon: BookOpen,
    description: 'Knowledge & identity',
  },
};

// Section order
const sectionOrder = ['execution', 'files', 'capability', 'context'] as const;

// Mock file structure - will be replaced with real synced directory
const mockFileTree = [
  {
    name: '.mentu',
    type: 'folder' as const,
    children: [
      { name: 'manifest.yaml', type: 'file' as const },
      { name: 'config.yaml', type: 'file' as const },
    ],
  },
  {
    name: 'src',
    type: 'folder' as const,
    children: [
      { name: 'index.ts', type: 'file' as const },
      { name: 'cli.ts', type: 'file' as const },
    ],
  },
  { name: 'package.json', type: 'file' as const },
  { name: 'README.md', type: 'file' as const },
];

export function PlaneSidebar({ user }: PlaneSidebarProps) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const workspace = params.workspace as string;
  const currentPlane = params.plane as string;

  // Track which sections are expanded
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    execution: currentPlane === 'execution',
    files: false,
    capability: currentPlane === 'capability',
    context: currentPlane === 'context',
  });

  // Workspace selector state
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const { data: workspaces, isLoading: workspacesLoading } = useWorkspaces();

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleSelectWorkspace = (workspaceName: string) => {
    setWorkspaceOpen(false);
    router.push(`/workspace/${workspaceName}/execution/kanban`);
  };

  const currentWorkspace = workspaces?.find(ws => ws.name === workspace);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-900">
      {/* Main sections */}
      <div className="flex-1 overflow-auto">
        {sectionOrder.map((sectionKey) => {
          const section = sectionConfig[sectionKey];
          const isExpanded = expandedSections[sectionKey];
          const Icon = section.icon;
          const isPlane = sectionKey !== 'files';
          const isCurrentPlane = isPlane && currentPlane === sectionKey;

          return (
            <div key={sectionKey} className="border-b border-zinc-200 dark:border-zinc-800">
              {/* Section header */}
              <button
                onClick={() => toggleSection(sectionKey)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-xs font-medium uppercase tracking-wider',
                  'hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors',
                  isCurrentPlane
                    ? 'text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800'
                    : 'text-zinc-600 dark:text-zinc-400'
                )}
              >
                <ChevronRight
                  className={cn(
                    'w-3 h-3 transition-transform flex-shrink-0',
                    isExpanded && 'rotate-90'
                  )}
                />
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">{section.label}</span>
              </button>

              {/* Section content */}
              {isExpanded && (
                <div className="pb-2">
                  {sectionKey === 'files' ? (
                    <FileTree items={mockFileTree} depth={0} />
                  ) : (
                    <nav>
                      {planeConfig[sectionKey as 'execution' | 'capability' | 'context'].views.map((view) => {
                        const basePath = `/workspace/${workspace}/${sectionKey}`;
                        const href = `${basePath}${view.href}`;
                        const isActive = pathname === href || (view.href === '' && pathname === basePath);

                        return (
                          <Link
                            key={view.id}
                            href={href}
                            prefetch={false}
                            className={cn(
                              'block w-full pl-9 pr-3 py-1.5 text-sm transition-colors',
                              isActive
                                ? 'bg-blue-600 text-white'
                                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                            )}
                          >
                            {view.label}
                          </Link>
                        );
                      })}
                    </nav>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom section - Workspace & Account */}
      <div className="flex-shrink-0 border-t border-zinc-200 dark:border-zinc-800">
        {/* Workspace selector - relative container for dropdown overlay */}
        <div className="relative p-2">
          {/* Dropdown overlay - positioned above the button */}
          {workspaceOpen && (
            <>
              {/* Backdrop to close on click outside */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setWorkspaceOpen(false)}
              />
              <div className="absolute bottom-full left-2 right-2 mb-1 z-50 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                {workspacesLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                  </div>
                ) : workspaces && workspaces.length > 0 ? (
                  <div className="max-h-48 overflow-auto py-1">
                    {workspaces.map(ws => {
                      const isCurrent = ws.name === workspace;
                      return (
                        <button
                          key={ws.id}
                          onClick={() => handleSelectWorkspace(ws.name)}
                          className={cn(
                            'w-full flex items-center gap-2 px-3 py-2 text-sm text-left',
                            'hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors',
                            isCurrent && 'bg-blue-50 dark:bg-blue-900/20'
                          )}
                        >
                          <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                            {ws.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="flex-1 truncate text-zinc-700 dark:text-zinc-300">{ws.display_name || ws.name}</span>
                          {isCurrent && <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-zinc-500">No workspaces</div>
                )}
                <div className="border-t border-zinc-200 dark:border-zinc-700 p-1">
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded transition-colors">
                    <Settings className="w-4 h-4" />
                    Workspace Settings
                  </button>
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded transition-colors">
                    <Plus className="w-4 h-4" />
                    New Workspace
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Workspace button - stays in place */}
          <button
            onClick={() => setWorkspaceOpen(!workspaceOpen)}
            className={cn(
              'w-full flex items-center gap-3 p-2 rounded-lg transition-colors',
              'hover:bg-zinc-100 dark:hover:bg-zinc-800',
              workspaceOpen && 'bg-zinc-100 dark:bg-zinc-800'
            )}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
              {workspace.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                {currentWorkspace?.display_name || workspace}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                {workspace}
              </div>
            </div>
            <ChevronDown className={cn(
              'w-4 h-4 text-zinc-400 transition-transform',
              workspaceOpen && 'rotate-180'
            )} />
          </button>
        </div>

        {/* User account */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 p-2">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                {user?.name || 'User'}
              </div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                {user?.email || ''}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// File tree component
interface FileTreeItem {
  name: string;
  type: 'file' | 'folder';
  children?: FileTreeItem[];
}

function FileTree({ items, depth }: { items: FileTreeItem[]; depth: number }) {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const toggleFolder = (name: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  return (
    <>
      {items.map((item) => (
        <div key={item.name}>
          {item.type === 'folder' ? (
            <>
              <button
                onClick={() => toggleFolder(item.name)}
                className={cn(
                  'w-full flex items-center gap-1.5 py-1 text-sm text-zinc-600 dark:text-zinc-400',
                  'hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors'
                )}
                style={{ paddingLeft: `${depth * 12 + 28}px` }}
              >
                <ChevronRight
                  className={cn(
                    'w-3 h-3 transition-transform flex-shrink-0',
                    expandedFolders[item.name] && 'rotate-90'
                  )}
                />
                <Folder className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </button>
              {expandedFolders[item.name] && item.children && (
                <FileTree items={item.children} depth={depth + 1} />
              )}
            </>
          ) : (
            <div
              className={cn(
                'flex items-center gap-1.5 py-1 text-sm text-zinc-500 dark:text-zinc-400',
                'hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors'
              )}
              style={{ paddingLeft: `${depth * 12 + 40}px` }}
            >
              <File className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
              <span className="truncate">{item.name}</span>
            </div>
          )}
        </div>
      ))}
    </>
  );
}
