/**
 * Tone config database queries
 */

import { prisma } from './client';
import type { Prisma } from '.prisma/client-jack';
import type { LearnedPatterns } from '@/lib/mastra/schemas';

/**
 * Get or create tone config for a user
 */
export async function getOrCreateToneConfig(userId: string) {
  const existing = await prisma.toneConfig.findUnique({
    where: { userId },
  });

  if (existing) {
    return existing;
  }

  return prisma.toneConfig.create({
    data: {
      userId,
      lowercase: true,
      noEmojis: true,
      noHashtags: true,
      showFailures: true,
      includeNumbers: true,
      learnedPatterns: {},
    },
  });
}

/**
 * Update learned patterns from good posts
 */
export async function updateLearnedPatterns(
  userId: string,
  patterns: LearnedPatterns
) {
  return prisma.toneConfig.update({
    where: { userId },
    data: {
      learnedPatterns: patterns as Prisma.InputJsonValue,
    },
  });
}

/**
 * Update tone preferences
 */
export async function updateTonePreferences(
  userId: string,
  preferences: {
    lowercase?: boolean;
    noEmojis?: boolean;
    noHashtags?: boolean;
    showFailures?: boolean;
    includeNumbers?: boolean;
  }
) {
  return prisma.toneConfig.update({
    where: { userId },
    data: preferences,
  });
}

/**
 * Update custom voice rules
 */
export async function updateCustomRules(userId: string, rules: string[]) {
  return prisma.toneConfig.update({
    where: { userId },
    data: { customRules: rules },
  });
}
