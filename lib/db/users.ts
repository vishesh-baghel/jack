/**
 * User database queries
 */

import { prisma } from './client';

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
