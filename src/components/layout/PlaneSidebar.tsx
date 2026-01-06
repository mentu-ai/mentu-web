'use client';

import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { planeConfig, Plane, isValidPlane } from '@/lib/navigation/planeConfig';
import { cn } from '@/lib/utils';
import { User, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface PlaneSidebarProps {
  user?: {
    name?: string;
    email?: string;
  };
}

export function PlaneSidebar({ user }: PlaneSidebarProps) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const workspace = params.workspace as string;
  const currentPlane = params.plane as string;

  const activePlane: Plane = isValidPlane(currentPlane) ? currentPlane : 'execution';
  const config = planeConfig[activePlane];
  const basePath = `/workspace/${workspace}/${activePlane}`;

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-900">
      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 p-3">
        {config.views.map((view) => {
          const href = `${basePath}${view.href}`;
          const isActive = pathname === href || (view.href === '' && pathname === basePath);

          return (
            <Link
              key={view.id}
              href={href}
              prefetch={false}
              className={cn(
                'block w-full px-3 py-2 text-sm text-left rounded-lg transition-colors',
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
    </div>
  );
}
