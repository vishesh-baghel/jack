/**
 * Outline database queries
 */

import { prisma } from './client';
import type { ContentOutline } from '@/lib/mastra/schemas';
import type { Prisma } from '@prisma/client';

/**
 * Create an outline for a content idea
 */
export async function createOutline(
  contentIdeaId: string,
  outline: ContentOutline,
  fallbackFormat?: string
) {
  return prisma.outline.create({
    data: {
      contentIdeaId,
      format: outline.format || fallbackFormat || 'post',
      sections: outline.sections as Prisma.InputJsonValue,
      estimatedLength: outline.estimatedLength,
      toneReminders: outline.toneReminders as Prisma.InputJsonValue,
    },
  });
}

/**
 * Get outline by ID with related content idea
 */
export async function getOutlineById(outlineId: string) {
  return prisma.outline.findUnique({
    where: { id: outlineId },
    include: {
      contentIdea: true,
      drafts: true,
    },
  });
}

/**
 * Get outlines for a content idea
 */
export async function getOutlinesForIdea(contentIdeaId: string) {
  return prisma.outline.findMany({
    where: { contentIdeaId },
    orderBy: { createdAt: 'desc' },
  });
}
