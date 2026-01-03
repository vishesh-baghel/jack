/**
 * API Route: Manual Scrape Creator Tweets
 * POST /api/creators/[id]/scrape
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { scrapeTwitterUser } from '@/lib/apify/twitter-scraper';
import { storeCreatorTweets } from '@/lib/db/creator-tweets';
import { blockGuestWrite } from '@/lib/auth';
import { calculateScaledTweetCounts } from '@/lib/utils/tweet-scaling';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Block guest write operations
  const guestBlock = await blockGuestWrite();
  if (guestBlock) return guestBlock;

  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Creator ID is required' },
        { status: 400 }
      );
    }

    // Get creator with user
    const creator = await prisma.creator.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            dailyTweetLimit: true,
          },
        },
      },
    });

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    // Get all active creators for this user to calculate scaling
    const allCreators = await prisma.creator.findMany({
      where: {
        userId: creator.userId,
        isActive: true,
      },
      select: {
        id: true,
        xHandle: true,
        tweetCount: true,
        isActive: true,
      },
    });

    const dailyLimit = creator.user.dailyTweetLimit || 50;

    // Calculate scaled tweet counts
    const scaledConfigs = calculateScaledTweetCounts(
      allCreators.map(c => ({
        creatorId: c.id,
        xHandle: c.xHandle,
        requestedCount: c.tweetCount,
        isActive: c.isActive,
      })),
      dailyLimit
    );

    // Find the scaled config for this creator
    const scaledConfig = scaledConfigs.find(c => c.creatorId === id);
    const actualCount = scaledConfig?.actualCount || creator.tweetCount;

    console.log(
      `[MANUAL SCRAPE] Scraping ${creator.xHandle} (${actualCount} tweets${
        scaledConfig?.wasScaled ? ' - scaled' : ''
      })`
    );

    // Scrape tweets with scaled count
    const tweets = await scrapeTwitterUser(creator.xHandle, actualCount);

    // Store in database
    await storeCreatorTweets(id, tweets);

    return NextResponse.json({
      success: true,
      count: tweets.length,
      creator: creator.xHandle,
      requestedCount: creator.tweetCount,
      actualCount,
      wasScaled: scaledConfig?.wasScaled || false,
    });
  } catch (error) {
    console.error('Error scraping creator tweets:', error);

    return NextResponse.json(
      {
        error: 'Failed to scrape creator tweets',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
