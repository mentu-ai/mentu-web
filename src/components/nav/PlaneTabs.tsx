'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { planeConfig, planes, Plane, isValidPlane } from '@/lib/navigation/planeConfig';
import { cn } from '@/lib/utils';

export function PlaneTabs() {
  const params = useParams();
  const workspace = params.workspace as string;
  const currentPlane = params.plane as string;

  const activePlane: Plane = isValidPlane(currentPlane) ? currentPlane : 'execution';

  return (
    <div className="flex items-center gap-1">
      {planes.map((plane) => (
        <Link
          key={plane}
          href={`/workspace/${workspace}/${plane}`}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
            activePlane === plane
              ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          )}
        >
          {planeConfig[plane].label}
        </Link>
      ))}
    </div>
  );
}
