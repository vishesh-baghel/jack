/**
 * Twitter Scraper Wrapper
 * Provides backward-compatible interface using the generic scraper system
 */

import { TwitterScraperFactory } from '@/lib/scrapers/factory';
import type { ScrapedTweet } from '@/lib/scrapers/types';

// Backward compatibility export
export type TweetData = ScrapedTweet;

/**
 * Scrape recent tweets from a Twitter user
 * @param handle Twitter handle (with or without @)
 * @param maxItems Optional maximum number of tweets to fetch (default: 50)
 * @returns Array of tweet data
 */
export async function scrapeTwitterUser(
  handle: string,
  maxItems?: number
): Promise<TweetData[]> {
  const scraper = TwitterScraperFactory.getScraper('twitterapi');

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  console.log(`[${scraper.getProviderName().toUpperCase()}] Scraping tweets for ${handle}`);

  const tweets = await scraper.scrapeTweets({
    handle,
    maxItems: maxItems || 50,
    startDate,
    endDate,
  });

  console.log(
    `[${scraper.getProviderName().toUpperCase()}] Successfully fetched ${tweets.length} tweets for ${handle}`
  );

  return tweets;
}

/**
 * Validate a Twitter handle exists and is accessible
 * @param handle Twitter handle (with or without @)
 * @returns Validation result with userId if valid
 */
export async function validateTwitterHandle(handle: string): Promise<{
  valid: boolean;
  userId?: string;
  error?: string;
}> {
  const scraper = TwitterScraperFactory.getScraper('twitterapi');
  return scraper.validateHandle(handle);
}
