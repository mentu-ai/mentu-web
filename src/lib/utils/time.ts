import { formatDistanceToNow, format } from 'date-fns';

export function relativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function absoluteTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MMM d, yyyy h:mm a');
}

export function isWithinDays(date: string | Date, days: number): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - days);
  return d >= threshold;
}
