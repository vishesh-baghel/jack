/**
 * User database queries
 */

import { prisma } from './client';
import { GUEST_USER_EMAIL } from '@/lib/auth-client';

/**
 * Get or create user by email
 */
export async function getOrCreateUser(email: string, name?: string) {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name,
    },
  });
}

/**
 * Get user with all relations (projects, creators, tone config, etc.)
 */
export async function getUserWithRelations(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      projects: true,
      creators: {
        where: { isActive: true },
      },
      toneConfig: true,
    },
  });
}

/**
 * Get the owner user (the main account)
 */
export async function getOwnerUser() {
  return prisma.user.findFirst({
    where: { isOwner: true },
    select: {
      id: true,
      email: true,
      name: true,
      allowVisitorMode: true,
    },
  });
}

/**
 * Get the guest user account
 */
export async function getGuestUser() {
  return prisma.user.findUnique({
    where: { email: GUEST_USER_EMAIL },
    select: {
      id: true,
      email: true,
      name: true,
      isGuest: true,
    },
  });
}

/**
 * Create guest user account
 */
export async function createGuestUser() {
  return prisma.user.create({
    data: {
      email: GUEST_USER_EMAIL,
      name: 'Guest User',
      isGuest: true,
    },
  });
}

/**
 * Delete guest user account
 */
export async function deleteGuestUser() {
  return prisma.user.delete({
    where: { email: GUEST_USER_EMAIL },
  });
}

/**
 * Toggle visitor mode for owner
 * When enabled: Creates guest account if doesn't exist
 * When disabled: Deletes guest account if exists
 */
export async function toggleVisitorMode(userId: string, enabled: boolean) {
  // Update owner's allowVisitorMode setting
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { allowVisitorMode: enabled },
  });

  if (enabled) {
    // Create guest user if it doesn't exist
    const existingGuest = await getGuestUser();
    if (!existingGuest) {
      await createGuestUser();
    }
  } else {
    // Delete guest user if it exists
    const existingGuest = await getGuestUser();
    if (existingGuest) {
      await deleteGuestUser();
    }
  }

  return updatedUser;
}

/**
 * Check if visitor mode is currently enabled
 */
export async function isVisitorModeEnabled(): Promise<boolean> {
  const owner = await getOwnerUser();
  return owner?.allowVisitorMode ?? false;
}
