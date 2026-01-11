import { supabase } from '../db/supabase.js';

export interface AuthenticatedUser {
  id: string;
  email?: string;
}

/**
 * Verify a Supabase JWT token and return the user
 * @param token - The JWT token from the Authorization header
 * @returns The authenticated user or null if invalid
 */
export async function verifyToken(token: string): Promise<AuthenticatedUser | null> {
  if (!token) {
    return null;
  }

  // Remove "Bearer " prefix if present
  const jwt = token.startsWith('Bearer ') ? token.slice(7) : token;

  try {
    // Verify the JWT with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(jwt);

    if (error || !user) {
      console.log('[Auth] Token verification failed:', error?.message || 'No user');
      return null;
    }

    return {
      id: user.id,
      email: user.email,
    };
  } catch (error) {
    console.error('[Auth] Token verification error:', error);
    return null;
  }
}

/**
 * Extract token from WebSocket URL query string
 * Expected format: ws://host/agent?token=xxx
 */
export function extractTokenFromUrl(url: string | undefined): string | null {
  if (!url) return null;

  try {
    // Parse the URL - handle both full URLs and paths
    const urlObj = new URL(url, 'http://localhost');
    return urlObj.searchParams.get('token');
  } catch {
    return null;
  }
}
