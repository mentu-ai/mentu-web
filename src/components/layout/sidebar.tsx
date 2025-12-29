'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Target,
  Brain,
  ScrollText,
  Terminal,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface SidebarProps {
  workspaceName: string;
}

const navItems = [
  { name: 'Dashboard', href: '', icon: LayoutDashboard },
  { name: 'Commitments', href: '/commitments', icon: Target },
  { name: 'Memories', href: '/memories', icon: Brain },
  { name: 'Ledger', href: '/ledger', icon: ScrollText },
  { name: 'Bridge', href: '/bridge', icon: Terminal },
];

const settingsItems = [
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ workspaceName }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const basePath = `/workspace/${workspaceName}`;

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 transition-all duration-300',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      <div className="flex h-14 items-center border-b border-zinc-200 dark:border-zinc-800 px-4">
        {!collapsed && (
          <Link href={basePath} className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-zinc-900 dark:bg-zinc-100" />
            <span className="font-semibold truncate">{workspaceName}</span>
          </Link>
        )}
        {collapsed && (
          <div className="h-6 w-6 rounded bg-zinc-900 dark:bg-zinc-100 mx-auto" />
        )}
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const href = `${basePath}${item.href}`;
          const isActive =
            pathname === href ||
            (item.href !== '' && pathname.startsWith(href));

          return (
            <Link
              key={item.name}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                  : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <Separator />

      <div className="p-2 space-y-1">
        {settingsItems.map((item) => {
          const href = `${basePath}${item.href}`;
          const isActive = pathname.startsWith(href);

          return (
            <Link
              key={item.name}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                  : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </div>

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
