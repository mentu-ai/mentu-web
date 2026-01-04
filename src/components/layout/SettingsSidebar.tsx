'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ArrowLeft, Settings, Users, Github, Webhook } from 'lucide-react';

interface SettingsSidebarProps {
  workspaceName: string;
}

const settingsNav = [
  { id: 'general', label: 'General', href: '', icon: Settings },
  { id: 'actors', label: 'Actors', href: '/actors', icon: Users },
  { id: 'github', label: 'GitHub', href: '/github', icon: Github },
  { id: 'webhooks', label: 'Webhooks', href: '/webhooks', icon: Webhook },
];

export function SettingsSidebar({ workspaceName }: SettingsSidebarProps) {
  const pathname = usePathname();
  const basePath = `/workspace/${workspaceName}/settings`;

  return (
    <aside className="w-56 bg-white border-r border-zinc-200 min-h-[calc(100vh-3.5rem)] p-4">
      <Link
        href={`/workspace/${workspaceName}/execution`}
        className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Workspace
      </Link>

      <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
        Settings
      </h2>

      <nav className="space-y-1">
        {settingsNav.map((item) => {
          const href = `${basePath}${item.href}`;
          const isActive = pathname === href || (item.href === '' && pathname === basePath);

          return (
            <Link
              key={item.id}
              href={href}
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg transition-colors',
                isActive
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
