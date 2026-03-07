'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import {
  Layers,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PanoramaSidebarProps {
  workspaces: { id: string; name: string; display_name: string | null }[];
  userEmail: string;
}

export function PanoramaSidebar({ workspaces, userEmail }: PanoramaSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 transition-all duration-300',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo / Brand */}
      <div className="flex h-14 items-center border-b border-zinc-200 dark:border-zinc-800 px-4">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="h-5 w-5 rounded-sm bg-amber-500/90 shrink-0" />
            <span className="font-semibold text-sm tracking-wide">MENTU</span>
          </div>
        )}
        {collapsed && (
          <div className="h-5 w-5 rounded-sm bg-amber-500/90 mx-auto" />
        )}
      </div>

      {/* Panorama nav */}
      <nav className="flex-1 p-2 space-y-1 overflow-auto">
        <Link
          href="/panorama"
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            pathname === '/panorama'
              ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
              : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100'
          )}
        >
          <Layers className="h-4 w-4 shrink-0" />
          {!collapsed && <span>All Workspaces</span>}
        </Link>

        {!collapsed && workspaces.length > 0 && (
          <>
            <div className="px-3 pt-4 pb-1">
              <span className="text-[10px] font-medium tracking-wider text-zinc-400 dark:text-zinc-600 uppercase">
                Projects
              </span>
            </div>
            {workspaces.map((ws) => (
              <Link
                key={ws.id}
                href={`/workspace/${ws.name}`}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
              >
                <FolderOpen className="h-4 w-4 shrink-0" />
                <span className="truncate">{ws.display_name || ws.name}</span>
              </Link>
            ))}
          </>
        )}

        {collapsed && workspaces.length > 0 && (
          <>
            <Separator className="my-2" />
            {workspaces.map((ws) => (
              <Link
                key={ws.id}
                href={`/workspace/${ws.name}`}
                className="flex items-center justify-center rounded-md px-3 py-2 text-sm transition-colors text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                title={ws.display_name || ws.name}
              >
                <FolderOpen className="h-4 w-4 shrink-0" />
              </Link>
            ))}
          </>
        )}
      </nav>

      <Separator />

      {/* User menu */}
      <div className="p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm w-full transition-colors',
                'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100'
              )}
            >
              <User className="h-4 w-4 shrink-0" />
              {!collapsed && (
                <span className="truncate text-xs">{userEmail}</span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top">
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Collapse toggle */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </aside>
  );
}
