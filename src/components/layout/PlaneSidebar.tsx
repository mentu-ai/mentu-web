'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { planeConfig, Plane, isValidPlane } from '@/lib/navigation/planeConfig';
import { cn } from '@/lib/utils';

export function PlaneSidebar() {
  const params = useParams();
  const pathname = usePathname();
  const workspace = params.workspace as string;
  const currentPlane = params.plane as string;

  const activePlane: Plane = isValidPlane(currentPlane) ? currentPlane : 'execution';
  const config = planeConfig[activePlane];
  const basePath = `/workspace/${workspace}/${activePlane}`;

  return (
    <aside className="w-48 bg-white border-r border-zinc-200 min-h-[calc(100vh-3.5rem)] p-3">
      <nav className="space-y-0.5">
        {config.views.map((view) => {
          const href = `${basePath}${view.href}`;
          const isActive = pathname === href || (view.href === '' && pathname === basePath);

          return (
            <Link
              key={view.id}
              href={href}
              className={cn(
                'block w-full px-3 py-2 text-sm text-left rounded-lg transition-colors',
                isActive
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100'
              )}
            >
              {view.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
