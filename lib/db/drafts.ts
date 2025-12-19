/**
 * Draft database queries
 */

import { prisma } from './client';

/**
 * Get all drafts for a user (through outlines and content ideas)
 */
export async function getDraftsForUser(userId: string) {
  return prisma.draft.findMany({
    where: {
      outline: {
        contentIdea: {
          userId,
        },
      },
    },
    include: {
      outline: {
        include: {
          contentIdea: true,
        },
      },
      post: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Get draft by ID
 */
export async function getDraftById(draftId: string) {
  return prisma.draft.findUnique({
    where: { id: draftId },
    include: {
      outline: {
        include: {
          contentIdea: true,
        },
      },
      post: true,
    },
  });
}

/**
 * Update draft content
 */
export async function updateDraft(draftId: string, content: string) {
  return prisma.draft.update({
    where: { id: draftId },
    data: { content },
  });
}

/**
 * Delete draft
 */
export async function deleteDraft(draftId: string) {
  return prisma.draft.delete({
    where: { id: draftId },
  });
}

/**
 * Mark draft as posted to X
 */
export async function markDraftAsPosted(draftId: string) {
  return prisma.draft.update({
    where: { id: draftId },
    data: {
      isPosted: true,
      postedAt: new Date(),
    },
  });
}
