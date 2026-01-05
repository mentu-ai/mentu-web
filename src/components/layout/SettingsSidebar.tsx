'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ArrowLeft, Settings, Users, Github, Webhook, User, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface SettingsSidebarProps {
  workspaceName: string;
  user?: {
    name?: string;
    email?: string;
  };
}

const settingsNav = [
  { id: 'general', label: 'General', href: '', icon: Settings },
  { id: 'actors', label: 'Actors', href: '/actors', icon: Users },
  { id: 'github', label: 'GitHub', href: '/github', icon: Github },
  { id: 'webhooks', label: 'Webhooks', href: '/webhooks', icon: Webhook },
];

export function SettingsSidebar({ workspaceName, user }: SettingsSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const basePath = `/workspace/${workspaceName}/settings`;

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside className="w-56 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 min-h-[calc(100vh-3.5rem)] flex flex-col">
      <div className="flex-1 p-4">
        <Link
          href={`/workspace/${workspaceName}/execution`}
          className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-6 transition-colors"
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
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User account section at bottom */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 p-3">
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
    </aside>
  );
}
