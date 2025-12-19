/**
 * Creator database queries
 */

import { prisma } from './client';

/**
 * Add a creator to track
 */
export async function addCreator(userId: string, xHandle: string) {
  return prisma.creator.upsert({
    where: {
      userId_xHandle: {
        userId,
        xHandle,
      },
    },
    update: {
      isActive: true,
    },
    create: {
      userId,
      xHandle,
      isActive: true,
    },
  });
}

/**
 * Get active creators for a user
 */
export async function getActiveCreators(userId: string) {
  return prisma.creator.findMany({
    where: {
      userId,
      isActive: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Toggle creator active status
 */
export async function toggleCreatorStatus(creatorId: string) {
  const creator = await prisma.creator.findUnique({
    where: { id: creatorId },
  });

  if (!creator) {
    throw new Error('Creator not found');
  }

  return prisma.creator.update({
    where: { id: creatorId },
    data: {
      isActive: !creator.isActive,
    },
  });
}

/**
 * Remove a creator
 */
export async function removeCreator(creatorId: string) {
  return prisma.creator.delete({
    where: { id: creatorId },
  });
}
