/**
 * Apify Twitter Scraper Adapter
 * Implements the TwitterScraper interface using Apify's tweet-scraper actor
 */

import { ApifyClient } from 'apify-client';
import type { TwitterScraper, TwitterScraperConfig, ScrapedTweet } from './types';

export class ApifyTwitterScraper implements TwitterScraper {
  private client: ApifyClient;

  constructor(apiKey: string) {
    this.client = new ApifyClient({ token: apiKey });
  }

  async scrapeTweets(config: TwitterScraperConfig): Promise<ScrapedTweet[]> {
    const { handle, maxItems, startDate, endDate } = config;
    const normalizedHandle = handle.startsWith('@') ? handle.substring(1) : handle;

    const run = await this.client.actor('apidojo/tweet-scraper').call({
      twitterHandles: [normalizedHandle],
      maxItems,
      sort: 'Latest',
      startDate: startDate?.toISOString().split('T')[0],
      endDate: endDate?.toISOString().split('T')[0],
    });

    const { items } = await this.client.dataset(run.defaultDatasetId).listItems();

    return (items as any[]).map((item: any) => ({
      tweetId: item.id || item.tweetId || String(item.id_str),
      content: item.text || item.full_text || '',
      authorHandle: `@${item.author?.userName || normalizedHandle}`,
      publishedAt: new Date(item.createdAt || item.created_at || Date.now()),
      metrics: {
        likes: item.likes || item.favorite_count || 0,
        retweets: item.retweets || item.retweet_count || 0,
        replies: item.replies || item.reply_count || 0,
        views: item.views || item.viewCount || undefined,
      },
    }));
  }

  async validateHandle(handle: string): Promise<{
    valid: boolean;
    userId?: string;
    error?: string;
  }> {
    const normalizedHandle = handle.startsWith('@') ? handle.substring(1) : handle;

    if (!/^[\w]+$/.test(normalizedHandle)) {
      return {
        valid: false,
        error: 'Invalid Twitter handle format. Use only letters, numbers, and underscores.',
      };
    }

    try {
      const run = await this.client.actor('apidojo/tweet-scraper').call({
        twitterHandles: [normalizedHandle],
        maxItems: 1,
      });

      const { items } = await this.client.dataset(run.defaultDatasetId).listItems();

      if (items.length === 0) {
        return {
          valid: false,
          error: 'Twitter account not found or has no tweets.',
        };
      }

      const firstItem = items[0] as any;
      const userId = firstItem?.author?.id || firstItem?.author?.id_str;

      return {
        valid: true,
        userId: userId ? String(userId) : undefined,
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Unable to validate Twitter handle. The account may be private, suspended, or temporarily unavailable.',
      };
    }
  }

  getProviderName(): string {
    return 'Apify';
  }
}
