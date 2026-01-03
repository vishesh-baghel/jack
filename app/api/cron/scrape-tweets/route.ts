/**
 * API Route: Background Cron Job for Scraping Creator Tweets
 * GET /api/cron/scrape-tweets
 * Runs daily at 2 AM UTC (configured in vercel.json)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { scrapeTwitterUser } from '@/lib/apify/twitter-scraper';
import { storeCreatorTweets, getCreatorsNeedingScraping } from '@/lib/db/creator-tweets';
import { calculateScaledTweetCounts } from '@/lib/utils/tweet-scaling';

export async function GET(request: NextRequest) {
  // Verify CRON_SECRET authorization
  const authHeader = request.headers.get('authorization');
  const expectedAuth = process.env.CRON_SECRET
    ? `Bearer ${process.env.CRON_SECRET}`
    : null;

  if (!expectedAuth || authHeader !== expectedAuth) {
    return NextResponse.json(
      { error: 'Unauthorized. Invalid cron secret.' },
      { status: 401 }
    );
  }

  try {
    // Get all non-guest users with their daily tweet limits
    const users = await prisma.user.findMany({
      where: { isGuest: false },
      select: { id: true, email: true, dailyTweetLimit: true },
    });

    let totalScraped = 0;
    const errors: Array<{ creator: string; error: string }> = [];
    const summary: Record<string, number> = {};

    console.log(`[CRON] Starting tweet scraping job for ${users.length} users`);

    for (const user of users) {
      try {
        // Get creators needing scraping (>24 hours stale)
        const creators = await getCreatorsNeedingScraping(user.id, 24);

        if (creators.length === 0) {
          continue;
        }

        const dailyLimit = user.dailyTweetLimit || 50;

        // Calculate scaled tweet counts based on daily limit
        const scaledConfigs = calculateScaledTweetCounts(
          creators.map(c => ({
            creatorId: c.id,
            xHandle: c.xHandle,
            requestedCount: c.tweetCount,
            isActive: c.isActive,
          })),
          dailyLimit
        );

        summary[user.email || user.id] = 0;

        for (const config of scaledConfigs) {
          const creator = creators.find(c => c.id === config.creatorId)!;

          try {
            console.log(
              `[SCRAPER] Scraping ${config.xHandle} (${config.actualCount} tweets${
                config.wasScaled ? ' - scaled' : ''
              }) for user ${user.email}`
            );

            const tweets = await scrapeTwitterUser(creator.xHandle, config.actualCount);
            await storeCreatorTweets(creator.id, tweets);

            totalScraped += tweets.length;
            summary[user.email || user.id] += tweets.length;

            console.log(`[SCRAPER] Successfully scraped ${tweets.length} tweets for ${creator.xHandle}`);

            // Rate limiting: 2-second delay between creators
            await new Promise(resolve => setTimeout(resolve, 2000));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            errors.push({
              creator: creator.xHandle,
              error: errorMessage,
            });
            console.error(`[SCRAPER] Failed to scrape ${creator.xHandle}:`, errorMessage);
          }
        }
      } catch (error) {
        console.error(`Error processing user ${user.email}:`, error);
      }
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      users: users.length,
      totalScraped,
      summary,
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log('[CRON] Tweet scraping job completed:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[CRON] Tweet scraping job failed:', error);

    return NextResponse.json(
      {
        error: 'Cron job failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
