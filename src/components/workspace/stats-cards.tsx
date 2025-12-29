import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatsCardsProps {
  icon: LucideIcon;
  label: string;
  value: number;
  variant?: 'open' | 'claimed' | 'closed' | 'secondary';
}

const variantStyles = {
  open: 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700',
  claimed: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
  closed: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
  secondary: 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800',
};

const iconStyles = {
  open: 'text-zinc-600 dark:text-zinc-400',
  claimed: 'text-blue-600 dark:text-blue-400',
  closed: 'text-green-600 dark:text-green-400',
  secondary: 'text-zinc-600 dark:text-zinc-400',
};

export function StatsCards({ icon: Icon, label, value, variant = 'secondary' }: StatsCardsProps) {
  return (
    <div className={cn('rounded-lg border p-4', variantStyles[variant])}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn('h-4 w-4', iconStyles[variant])} />
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
