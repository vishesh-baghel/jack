/**
 * Generic Twitter Scraper Interface
 * Allows easy switching between different scraping providers (Apify, RapidAPI, custom, etc.)
 */

export interface TweetMetrics {
  likes: number;
  retweets: number;
  replies: number;
  views?: number;
  [key: string]: number | undefined; // Index signature for Prisma JSON compatibility
}

export interface ScrapedTweet {
  tweetId: string;
  content: string;
  authorHandle: string;
  publishedAt: Date;
  metrics: TweetMetrics;
}

export interface TwitterScraperConfig {
  handle: string;
  maxItems: number;
  startDate?: Date;
  endDate?: Date;
}

export interface TwitterScraper {
  /**
   * Scrape tweets from a Twitter user
   */
  scrapeTweets(config: TwitterScraperConfig): Promise<ScrapedTweet[]>;

  /**
   * Validate if a Twitter handle exists and is accessible
   */
  validateHandle(handle: string): Promise<{
    valid: boolean;
    userId?: string;
    error?: string;
  }>;

  /**
   * Get the name of the scraper provider
   */
  getProviderName(): string;
}
