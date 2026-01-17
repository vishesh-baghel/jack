/**
 * Pattern Learning Service
 * Triggers automatic pattern analysis when posts are marked as good
 */

import { analyzeGoodPosts } from '@/lib/mastra/pattern-analyzer';
import { getGoodPostsForLearning } from './posts';
import { prisma } from './client';
import type { Prisma } from '.prisma/client-jack';

/**
 * Trigger pattern learning for a user
 * Analyzes their good posts and updates learned patterns
 */
export async function triggerPatternLearning(userId: string) {
  try {
    console.log(`[PATTERN LEARNING] Starting analysis for user ${userId}`);

    // Get recent good posts
    const goodPosts = await getGoodPostsForLearning(userId, 20);

    if (goodPosts.length < 3) {
      console.log(`[PATTERN LEARNING] Insufficient data - need 3 posts, found ${goodPosts.length}`);
      return null;
    }

    console.log(`[PATTERN LEARNING] Analyzing ${goodPosts.length} good posts`);

    // Analyze patterns using LLM
    const patterns = await analyzeGoodPosts(goodPosts);

    // Get existing tone config
    const toneConfig = await prisma.toneConfig.findUnique({
      where: { userId },
    });

    if (!toneConfig) {
      console.log(`[PATTERN LEARNING] Creating new tone config for user ${userId}`);
      // Create tone config if it doesn't exist
      await prisma.toneConfig.create({
        data: {
          userId,
          learnedPatterns: {},
        },
      });
    }

    const existingPatterns = (toneConfig?.learnedPatterns as Record<string, unknown>) || {};

    // Merge patterns (new patterns override old ones)
    const updatedPatterns: Prisma.InputJsonValue = {
      ...existingPatterns,
      ...patterns,
      lastUpdated: new Date().toISOString(),
      totalGoodPosts: goodPosts.length,
    };

    // Save to database
    await prisma.toneConfig.update({
      where: { userId },
      data: {
        learnedPatterns: updatedPatterns,
      },
    });

    console.log(`[PATTERN LEARNING] Analysis complete - patterns updated for user ${userId}`);

    return updatedPatterns;
  } catch (error) {
    console.error(`[PATTERN LEARNING] Error for user ${userId}:`, error);
    // Don't throw - graceful degradation (background operation)
    return null;
  }
}
