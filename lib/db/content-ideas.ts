/**
 * Content Idea database queries
 */

import { prisma } from './client';
import type { ContentIdea } from '@/lib/mastra/schemas';

/**
 * Create a new content idea
 */
export async function createContentIdea(
  userId: string,
  idea: ContentIdea
) {
  return prisma.contentIdea.create({
    data: {
      userId,
      title: idea.title,
      description: idea.description,
      rationale: idea.rationale,
      contentPillar: idea.contentPillar,
      suggestedFormat: idea.suggestedFormat,
      estimatedEngagement: idea.estimatedEngagement,
      status: 'suggested',
    },
  });
}

/**
 * Get ideas by status for a user
 */
export async function getIdeasByStatus(
  userId: string,
  status: 'suggested' | 'accepted' | 'rejected' | 'used'
) {
  return prisma.contentIdea.findMany({
    where: {
      userId,
      status,
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      outlines: true,
    },
  });
}

/**
 * Update idea status
 */
export async function updateIdeaStatus(
  ideaId: string,
  status: 'suggested' | 'accepted' | 'rejected' | 'used'
) {
  return prisma.contentIdea.update({
    where: { id: ideaId },
    data: { status },
  });
}

/**
 * Get recent ideas for context (last 10)
 */
export async function getRecentIdeas(userId: string) {
  return prisma.contentIdea.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
}

/**
 * Get all ideas for a user
 */
export async function getAllIdeas(userId: string) {
  return prisma.contentIdea.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      outlines: true,
    },
  });
}
