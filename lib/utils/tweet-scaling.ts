/**
 * Tweet Scaling Utility
 * Implements proportional scaling algorithm for dynamic tweet scraping
 */

export interface CreatorTweetConfig {
  creatorId: string;
  xHandle: string;
  requestedCount: number;
  isActive: boolean;
}

export interface ScaledTweetConfig {
  creatorId: string;
  xHandle: string;
  actualCount: number;
  wasScaled: boolean;
}

/**
 * Calculate scaled tweet counts based on daily limit
 * Applies proportional scaling when total requested exceeds limit
 * Guarantees minimum 1 tweet per active creator
 *
 * @param creators List of creators with requested tweet counts
 * @param dailyLimit Global daily tweet limit
 * @returns Scaled configuration for each creator
 */
export function calculateScaledTweetCounts(
  creators: CreatorTweetConfig[],
  dailyLimit: number
): ScaledTweetConfig[] {
  const activeCreators = creators.filter((c) => c.isActive);

  if (activeCreators.length === 0) {
    return [];
  }

  const totalRequested = activeCreators.reduce(
    (sum, c) => sum + c.requestedCount,
    0
  );

  // No scaling needed - within budget
  if (totalRequested <= dailyLimit) {
    return activeCreators.map((c) => ({
      creatorId: c.creatorId,
      xHandle: c.xHandle,
      actualCount: c.requestedCount,
      wasScaled: false,
    }));
  }

  // Apply proportional scaling
  const scalingFactor = dailyLimit / totalRequested;

  return activeCreators.map((c) => ({
    creatorId: c.creatorId,
    xHandle: c.xHandle,
    // Guarantee minimum 1 tweet per creator
    actualCount: Math.max(1, Math.floor(c.requestedCount * scalingFactor)),
    wasScaled: true,
  }));
}

/**
 * Get total tweet count across all active creators
 *
 * @param creators List of creators
 * @returns Total requested tweets
 */
export function getTotalTweetCount(
  creators: { tweetCount: number; isActive: boolean }[]
): number {
  return creators
    .filter((c) => c.isActive)
    .reduce((sum, c) => sum + c.tweetCount, 0);
}
