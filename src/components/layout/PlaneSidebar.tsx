'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { planeConfig, planes } from '@/lib/navigation/planeConfig';
import { cn } from '@/lib/utils';
import { ChevronRight, User, LogOut, FolderTree, Folder, File } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface PlaneSidebarProps {
  user?: {
    name?: string;
    email?: string;
  };
}

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
    [currentPlane]: true, // Current plane expanded by default
    files: false,
  });

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

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-900">
      {/* Plane sections */}
      <div className="flex-1 overflow-auto">
        {planes.map((plane) => {
          const config = planeConfig[plane];
          const isExpanded = expandedSections[plane];
          const basePath = `/workspace/${workspace}/${plane}`;

          return (
            <div key={plane} className="border-b border-zinc-200 dark:border-zinc-800">
              {/* Section header */}
              <button
                onClick={() => toggleSection(plane)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider',
                  'hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors',
                  currentPlane === plane
                    ? 'text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800'
                    : 'text-zinc-500 dark:text-zinc-400'
                )}
              >
                <ChevronRight
                  className={cn(
                    'w-3 h-3 transition-transform',
                    isExpanded && 'rotate-90'
                  )}
                />
                {config.label}
              </button>

              {/* Section items */}
              {isExpanded && (
                <nav className="pb-2">
                  {config.views.map((view) => {
                    const href = `${basePath}${view.href}`;
                    const isActive = pathname === href || (view.href === '' && pathname === basePath);

                    return (
                      <Link
                        key={view.id}
                        href={href}
                        prefetch={false}
                        className={cn(
                          'block w-full pl-8 pr-3 py-1.5 text-sm transition-colors',
                          isActive
                            ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
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
          );
        })}

        {/* Files section */}
        <div className="border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => toggleSection('files')}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider',
              'hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors',
              'text-zinc-500 dark:text-zinc-400'
            )}
          >
            <ChevronRight
              className={cn(
                'w-3 h-3 transition-transform',
                expandedSections.files && 'rotate-90'
              )}
            />
            <FolderTree className="w-3 h-3" />
            Files
          </button>

          {expandedSections.files && (
            <div className="pb-2 text-sm">
              <FileTree items={mockFileTree} depth={0} />
            </div>
          )}
        </div>
      </div>

      {/* User account section at bottom */}
      <div className="flex-shrink-0 border-t border-zinc-200 dark:border-zinc-800 p-3">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
            <User className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
              {user?.name || 'User'}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {user?.email || ''}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 mt-1 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
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
                  'w-full flex items-center gap-1.5 py-1 text-zinc-600 dark:text-zinc-400',
                  'hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors'
                )}
                style={{ paddingLeft: `${depth * 12 + 24}px` }}
              >
                <ChevronRight
                  className={cn(
                    'w-3 h-3 transition-transform',
                    expandedFolders[item.name] && 'rotate-90'
                  )}
                />
                <Folder className="w-3.5 h-3.5 text-zinc-400" />
                <span className="truncate">{item.name}</span>
              </button>
              {expandedFolders[item.name] && item.children && (
                <FileTree items={item.children} depth={depth + 1} />
              )}
            </>
          ) : (
            <div
              className={cn(
                'flex items-center gap-1.5 py-1 text-zinc-500 dark:text-zinc-400',
                'hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors'
              )}
              style={{ paddingLeft: `${depth * 12 + 36}px` }}
            >
              <File className="w-3.5 h-3.5 text-zinc-400" />
              <span className="truncate">{item.name}</span>
            </div>
          )}
        </div>
      ))}
    </>
  );
}
