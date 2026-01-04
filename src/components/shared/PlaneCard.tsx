'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface PlaneCardProps {
  title: string;
  description: string;
  stat?: string;
  href: string;
  className?: string;
}

export function PlaneCard({ title, description, stat, href, className }: PlaneCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'block bg-white rounded-xl border border-zinc-200 p-6 text-left hover:border-zinc-300 transition-colors',
        className
      )}
    >
      <div className="text-lg font-semibold text-zinc-900 mb-2">{title}</div>
      <p className="text-sm text-zinc-500 mb-4">{description}</p>
      {stat && <div className="text-xs text-zinc-400">{stat}</div>}
    </Link>
  );
}
