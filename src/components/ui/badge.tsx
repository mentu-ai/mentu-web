import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-zinc-900 text-zinc-50 shadow hover:bg-zinc-900/80 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/80',
        secondary:
          'border-transparent bg-zinc-100 text-zinc-900 hover:bg-zinc-100/80 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-800/80',
        destructive:
          'border-transparent bg-red-500 text-zinc-50 shadow hover:bg-red-500/80 dark:bg-red-900 dark:text-zinc-50 dark:hover:bg-red-900/80',
        outline: 'text-zinc-950 dark:text-zinc-50',
        // Mentu-specific state badges
        open: 'border-transparent bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300',
        claimed: 'border-transparent bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
        in_review: 'border-transparent bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
        closed: 'border-transparent bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
        reopened: 'border-transparent bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
        stale: 'border-transparent bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
        // Bridge status badges
        online: 'border-transparent bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
        busy: 'border-transparent bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
        offline: 'border-transparent bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300',
        pending: 'border-transparent bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
        running: 'border-transparent bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
        completed: 'border-transparent bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
        failed: 'border-transparent bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
