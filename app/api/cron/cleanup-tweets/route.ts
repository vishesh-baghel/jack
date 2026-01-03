/**
 * API Route: Background Cron Job for Cleaning Up Old Tweets
 * GET /api/cron/cleanup-tweets
 * Runs daily at 3 AM UTC (configured in vercel.json)
 * Deletes tweets older than 7 days to minimize database costs
 */

import { NextRequest, NextResponse } from 'next/server';
import { deleteOldTweets } from '@/lib/db/creator-tweets';

export const maxDuration = 60; // 60 seconds timeout
export const dynamic = 'force-dynamic';

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
    console.log('[CRON] Starting tweet cleanup job');
    const startTime = Date.now();

    // Delete tweets older than 7 days
    const deletedCount = await deleteOldTweets(7);

    const duration = Date.now() - startTime;

    console.log(
      `[CRON] Tweet cleanup completed in ${duration}ms. Deleted ${deletedCount} tweets.`
    );

    return NextResponse.json({
      success: true,
      deletedCount,
      durationMs: duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[CRON] Tweet cleanup job failed:', error);

    // Return error but with 200 status to prevent Vercel from retrying
    // Critical errors should be monitored via Vercel logs/alerting
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 200 } // Return 200 to prevent retries
    );
  }
}
