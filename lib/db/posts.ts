/**
 * Post database queries
 */

import { prisma } from './client';

/**
 * Create a post from a draft
 */
export async function createPost(
  userId: string,
  draftId: string,
  content: string,
  contentType: string,
  contentPillar: string
) {
  return prisma.post.create({
    data: {
      userId,
      draftId,
      content,
      contentType,
      contentPillar,
      isMarkedGood: false,
    },
  });
}

/**
 * Mark a post as "good" for learning
 */
export async function markPostAsGood(postId: string) {
  return prisma.post.update({
    where: { id: postId },
    data: {
      isMarkedGood: true,
      markedGoodAt: new Date(),
    },
  });
}

/**
 * Get good posts for learning (used by agent)
 */
export async function getGoodPostsForLearning(userId: string, limit = 10) {
  return prisma.post.findMany({
    where: {
      userId,
      isMarkedGood: true,
    },
    orderBy: {
      markedGoodAt: 'desc',
    },
    take: limit,
    select: {
      content: true,
      contentPillar: true,
      contentType: true,
      markedGoodAt: true,
    },
  });
}

/**
 * Get all posts for a user
 */
export async function getUserPosts(userId: string) {
  return prisma.post.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      draft: {
        include: {
          outline: {
            include: {
              contentIdea: true,
            },
          },
        },
      },
    },
  });
}
