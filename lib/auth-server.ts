/**
 * Server-side auth utilities
 * Used by server components to check auth status
 */

import { prisma } from '@/lib/db/client';

/**
 * Check if signup is allowed
 * Returns true if:
 * 1. ALLOW_SIGNUP env var is explicitly 'true', OR
 * 2. No owner exists in the database (fresh deployment)
 */
export async function isSignupAllowed(): Promise<boolean> {
  const envAllowSignup = process.env.ALLOW_SIGNUP;
  
  if (envAllowSignup === 'false') {
    return false;
  }
  
  if (envAllowSignup === 'true') {
    return true;
  }
  
  const ownerExists = await prisma.user.findFirst({
    where: { isOwner: true },
    select: { id: true },
  });
  
  return !ownerExists;
}
