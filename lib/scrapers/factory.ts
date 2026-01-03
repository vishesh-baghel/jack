/**
 * Twitter Scraper Factory
 * Provides easy switching between different scraping providers
 */

import type { TwitterScraper } from './types';
import { ApifyTwitterScraper } from './apify-scraper';
import { TwitterAPIScraper } from './twitterapi-scraper';

export type ScraperProvider = 'apify' | 'twitterapi' | 'rapidapi' | 'custom';

export class TwitterScraperFactory {
  private static instance: TwitterScraper | null = null;

  static getScraper(provider: ScraperProvider = 'apify'): TwitterScraper {
    // Singleton pattern - reuse instance
    if (this.instance) {
      return this.instance;
    }

    switch (provider) {
      case 'apify':
        if (!process.env.APIFY_API_KEY) {
          throw new Error('APIFY_API_KEY environment variable is not set');
        }
        this.instance = new ApifyTwitterScraper(process.env.APIFY_API_KEY);
        return this.instance;

      case 'twitterapi':
        if (!process.env.TWITTERAPI_IO_KEY) {
          throw new Error('TWITTERAPI_IO_KEY environment variable is not set');
        }
        this.instance = new TwitterAPIScraper(process.env.TWITTERAPI_IO_KEY);
        return this.instance;

      // Future providers can be added here
      // case 'rapidapi':
      //   return new RapidAPITwitterScraper(process.env.RAPIDAPI_KEY);

      default:
        throw new Error(`Unsupported scraper provider: ${provider}`);
    }
  }

  static resetInstance(): void {
    this.instance = null;
  }
}
