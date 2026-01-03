/**
 * Creator Tweets database queries
 */

import { prisma } from './client';
import type { TweetData } from '@/lib/apify/twitter-scraper';

/**
 * Store creator tweets in database
 * Uses upsert to avoid duplicates (based on unique tweetId)
 */
export async function storeCreatorTweets(creatorId: string, tweets: TweetData[]) {
  if (tweets.length === 0) {
    return;
  }

  // Store tweets using upsert to prevent duplicates
  const promises = tweets.map((tweet) =>
    prisma.creatorTweet.upsert({
      where: { tweetId: tweet.tweetId },
      update: {
        content: tweet.content,
        metrics: tweet.metrics,
        scrapedAt: new Date(),
      },
      create: {
        creatorId,
        tweetId: tweet.tweetId,
        content: tweet.content,
        authorHandle: tweet.authorHandle,
        publishedAt: tweet.publishedAt,
        metrics: tweet.metrics,
      },
    })
  );

  await Promise.all(promises);

  // Update creator's lastScrapedAt timestamp
  await prisma.creator.update({
    where: { id: creatorId },
    data: { lastScrapedAt: new Date() },
  });
}

/**
 * Get all creator tweets for a user (from all active creators)
 * BALANCED: Fetches tweets evenly across all creators to ensure diverse content
 */
export async function getAllCreatorTweets(
  userId: string,
  options?: {
    limit?: number;
    daysBack?: number;
  }
) {
  const { limit = 50, daysBack = 30 } = options || {};

  // Calculate date threshold
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - daysBack);

  console.log(`[DB] Fetching balanced tweets from all creators (limit: ${limit}, daysBack: ${daysBack})`);

  // First, get all active creators for this user
  const creators = await prisma.creator.findMany({
    where: {
      userId,
      isActive: true,
    },
    select: {
      id: true,
      xHandle: true,
    },
  });

  if (creators.length === 0) {
    console.log(`[DB] No active creators found for user ${userId}`);
    return [];
  }

  console.log(`[DB] Found ${creators.length} active creators: ${creators.map(c => c.xHandle).join(', ')}`);

  // Calculate tweets per creator (distribute evenly)
  const tweetsPerCreator = Math.ceil(limit / creators.length);
  console.log(`[DB] Fetching ${tweetsPerCreator} tweets per creator`);

  // Fetch tweets from each creator
  const tweetPromises = creators.map(creator =>
    prisma.creatorTweet.findMany({
      where: {
        creatorId: creator.id,
        publishedAt: {
          gte: dateThreshold,
        },
      },
      include: {
        creator: {
          select: {
            xHandle: true,
          },
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: tweetsPerCreator,
    })
  );

  const tweetArrays = await Promise.all(tweetPromises);

  // Flatten and interleave tweets from different creators
  const allTweets = tweetArrays.flat();

  console.log(`[DB] Fetched total of ${allTweets.length} tweets from ${creators.length} creators`);

  // Log distribution
  const distribution = creators.map(creator => {
    const count = allTweets.filter(t => t.creatorId === creator.id).length;
    return `${creator.xHandle}: ${count}`;
  }).join(', ');
  console.log(`[DB] Tweet distribution: ${distribution}`);

  // Shuffle to mix creators (optional but helps with diversity)
  const shuffled = allTweets.sort(() => Math.random() - 0.5);

  // Return up to the limit
  return shuffled.slice(0, limit);
}

/**
 * Get creators that need scraping (stale or never scraped)
 */
export async function getCreatorsNeedingScraping(
  userId: string,
  hoursStale = 24
) {
  const staleThreshold = new Date();
  staleThreshold.setHours(staleThreshold.getHours() - hoursStale);

  return prisma.creator.findMany({
    where: {
      userId,
      isActive: true,
      OR: [
        { lastScrapedAt: null },
        { lastScrapedAt: { lt: staleThreshold } },
      ],
    },
    select: {
      id: true,
      xHandle: true,
      isActive: true,
      tweetCount: true,
      lastScrapedAt: true,
    },
    orderBy: {
      lastScrapedAt: 'asc',
    },
  });
}

/**
 * Get tweets for a specific creator
 */
export async function getCreatorTweets(
  creatorId: string,
  options?: {
    limit?: number;
    daysBack?: number;
  }
) {
  const { limit = 50, daysBack = 30 } = options || {};

  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - daysBack);

  return prisma.creatorTweet.findMany({
    where: {
      creatorId,
      publishedAt: {
        gte: dateThreshold,
      },
    },
    orderBy: {
      publishedAt: 'desc',
    },
    take: limit,
  });
}

/**
 * Delete old tweets (cleanup function for data retention)
 * Default: Keep tweets for 7 days to minimize database costs
 */
export async function deleteOldTweets(daysToKeep = 7) {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - daysToKeep);

  console.log(`[CLEANUP] Deleting tweets published before ${threshold.toISOString()}`);

  const result = await prisma.creatorTweet.deleteMany({
    where: {
      publishedAt: {
        lt: threshold,
      },
    },
  });

  console.log(`[CLEANUP] Deleted ${result.count} old tweets`);

  return result.count;
}
