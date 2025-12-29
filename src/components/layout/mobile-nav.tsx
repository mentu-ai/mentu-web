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
} from 'lucide-react';

interface MobileNavProps {
  workspaceName: string;
}

const navItems = [
  { name: 'Home', href: '', icon: LayoutDashboard },
  { name: 'Commits', href: '/commitments', icon: Target },
  { name: 'Memory', href: '/memories', icon: Brain },
  { name: 'Ledger', href: '/ledger', icon: ScrollText },
  { name: 'Bridge', href: '/bridge', icon: Terminal },
];

export function MobileNav({ workspaceName }: MobileNavProps) {
  const pathname = usePathname();
  const basePath = `/workspace/${workspaceName}`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 md:hidden">
      <div className="flex items-center justify-around">
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
                'flex flex-col items-center gap-1 px-3 py-2 text-xs',
                isActive
                  ? 'text-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-500 dark:text-zinc-400'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
