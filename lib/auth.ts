/**
 * Server-side authentication utilities
 * Only import this in server components and API routes
 */

import { cache } from 'react';
import { cookies } from 'next/headers';

// Re-export client constants for convenience in server code
export { GUEST_USER_EMAIL } from './auth-client';

/**
 * Get current user ID from cookies (server-side)
 * Note: In Next.js 15+, this must be async
 * Wrapped with React.cache() for per-request deduplication
 */
export const getCurrentUserId = cache(async (): Promise<string> => {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) {
    // Return a placeholder that will trigger client-side redirect
    return '';
  }

  return userId;
});

/**
 * Check if current user is a guest (server-side)
 * Wrapped with React.cache() for per-request deduplication
 */
export const isGuestUser = cache(async (): Promise<boolean> => {
  const cookieStore = await cookies();
  return cookieStore.get('isGuest')?.value === 'true';
});

/**
 * Get the user ID to use for data queries
 * Guests see the demo user's content, regular users see their own
 * Wrapped with React.cache() for per-request deduplication
 */
export const getDataUserId = cache(async (): Promise<string> => {
  const cookieStore = await cookies();
  const isGuest = cookieStore.get('isGuest')?.value === 'true';
  const demoUserId = cookieStore.get('demoUserId')?.value;
  const userId = cookieStore.get('userId')?.value;

  if (isGuest && demoUserId) {
    return demoUserId;
  }

  return userId || '';
});

/**
 * Get current user ID (async version for server components)
 */
export async function getCurrentUserIdAsync(): Promise<string> {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  
  if (!userId) {
    return '';
  }
  
  return userId;
}

/**
 * Check if a write operation should be blocked (for guest users)
 * Returns an error response if guest, null if allowed
 */
export async function blockGuestWrite(): Promise<Response | null> {
  const isGuest = await isGuestUser();
  if (isGuest) {
    return new Response(
      JSON.stringify({ error: 'Write operations are not allowed in guest mode' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
  return null;
}
