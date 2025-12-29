import type { User } from '@supabase/supabase-js';

/**
 * Get Mentu actor identity from Supabase user
 */
export function getActor(user: User | null): string {
  if (!user) return 'anonymous';

  // Use GitHub username if available
  if (user.user_metadata?.user_name) {
    return user.user_metadata.user_name;
  }

  // Fall back to email prefix
  if (user.email) {
    return user.email.split('@')[0];
  }

  // Last resort: user ID
  return user.id;
}

/**
 * Generate a random ID with prefix
 */
export function generateId(prefix: 'mem' | 'cmt' | 'op'): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let suffix = '';
  for (let i = 0; i < 8; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${prefix}_${suffix}`;
}
