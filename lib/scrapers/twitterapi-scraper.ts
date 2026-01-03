/**
 * TwitterAPI.io Scraper Adapter
 * Cost-effective alternative to Apify
 * Pricing: $0.00015 per tweet returned, $0.00012 per empty call
 */

import type { TwitterScraper, TwitterScraperConfig, ScrapedTweet } from './types';

interface TwitterAPIResponse {
  tweets: Array<{
    id: string;
    text: string;
    createdAt: string;
    retweetCount: number;
    replyCount: number;
    likeCount: number;
    quoteCount?: number;
    viewCount?: number;
  }>;
  has_next_page: boolean;
  next_cursor?: string;
}

interface UserAboutResponse {
  data: {
    id: string;
    name: string;
    userName: string;
    createdAt: string;
    isBlueVerified: boolean;
    protected: boolean;
  };
  status: 'success' | 'error';
  msg?: string;
}

export class TwitterAPIScraper implements TwitterScraper {
  private apiKey: string;
  private baseUrl = 'https://api.twitterapi.io/twitter/tweet/advanced_search';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async scrapeTweets(config: TwitterScraperConfig): Promise<ScrapedTweet[]> {
    const { handle, maxItems, startDate, endDate } = config;
    const normalizedHandle = handle.startsWith('@') ? handle.substring(1) : handle;

    // Default to 24-hour window if not specified
    const since = startDate || new Date(Date.now() - 24 * 60 * 60 * 1000);
    const until = endDate || new Date();

    const query = this.buildQuery(normalizedHandle, since, until);
    const tweets: ScrapedTweet[] = [];
    let cursor: string | undefined;
    let hasMore = true;

    console.log(`[TWITTERAPI.IO] Scraping tweets for ${handle} from ${since.toISOString()} to ${until.toISOString()}`);

    while (hasMore && tweets.length < maxItems) {
      try {
        const response = await this.makeRequest(query, cursor);

        if (!response.tweets || response.tweets.length === 0) {
          console.log(`[TWITTERAPI.IO] No tweets found for ${handle}`);
          break;
        }

        const scrapedTweets = response.tweets.map((tweet) =>
          this.mapToScrapedTweet(tweet, normalizedHandle)
        );

        // Add tweets but respect maxItems limit
        const remainingSlots = maxItems - tweets.length;
        tweets.push(...scrapedTweets.slice(0, remainingSlots));

        // Check pagination
        hasMore = response.has_next_page && tweets.length < maxItems;
        cursor = response.next_cursor;

        console.log(
          `[TWITTERAPI.IO] Fetched ${scrapedTweets.length} tweets for ${handle}, total: ${tweets.length}/${maxItems}`
        );

        // Stop if we've collected enough tweets
        if (tweets.length >= maxItems) {
          console.log(`[TWITTERAPI.IO] Reached maxItems limit (${maxItems}), stopping pagination`);
          break;
        }
      } catch (error) {
        console.error(`[TWITTERAPI.IO] Error scraping tweets for ${handle}:`, error);
        // Log error but don't throw - return what we have so far
        break;
      }
    }

    console.log(`[TWITTERAPI.IO] Successfully scraped ${tweets.length} tweets for ${handle}`);
    return tweets;
  }

  async validateHandle(handle: string): Promise<{
    valid: boolean;
    userId?: string;
    error?: string;
  }> {
    const normalizedHandle = handle.startsWith('@') ? handle.substring(1) : handle;

    // Basic format validation
    if (!/^[\w]+$/.test(normalizedHandle)) {
      return {
        valid: false,
        error: 'Invalid Twitter handle format. Use only letters, numbers, and underscores.',
      };
    }

    try {
      console.log(`[TWITTERAPI.IO] Validating handle: ${normalizedHandle}`);

      // Use user_about endpoint for validation
      const url = `https://api.twitterapi.io/twitter/user_about?userName=${normalizedHandle}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[TWITTERAPI.IO] Validation failed with status ${response.status}: ${errorText}`);

        // 400 usually means user not found
        if (response.status === 400) {
          return {
            valid: false,
            error: 'Twitter account not found.',
          };
        }

        throw new Error(
          `TwitterAPI.io validation request failed: ${response.status} ${response.statusText}`
        );
      }

      const data: UserAboutResponse = await response.json();

      console.log(`[TWITTERAPI.IO] Validation response:`, {
        status: data.status,
        hasData: !!data.data,
        userId: data.data?.id,
      });

      if (data.status !== 'success' || !data.data || !data.data.id) {
        return {
          valid: false,
          error: data.msg || 'Twitter account not found.',
        };
      }

      const userId = data.data.id;

      console.log(`[TWITTERAPI.IO] Handle ${normalizedHandle} validated successfully. User ID: ${userId}`);

      return {
        valid: true,
        userId,
      };
    } catch (error) {
      console.error(`[TWITTERAPI.IO] Error validating handle ${handle}:`, error);

      // Log more details about the error
      if (error instanceof Error) {
        console.error(`[TWITTERAPI.IO] Error message: ${error.message}`);
      }

      return {
        valid: false,
        error: 'Unable to validate Twitter handle. Please try again later.',
      };
    }
  }

  getProviderName(): string {
    return 'TwitterAPI.io';
  }

  /**
   * Build advanced search query with time window
   * Format: from:handle since:YYYY-MM-DD_HH:MM:SS_UTC until:YYYY-MM-DD_HH:MM:SS_UTC
   */
  private buildQuery(handle: string, since: Date, until: Date): string {
    const sinceStr = this.formatDateForQuery(since);
    const untilStr = this.formatDateForQuery(until);
    return `from:${handle} since:${sinceStr} until:${untilStr}`;
  }

  /**
   * Format date to TwitterAPI.io format: YYYY-MM-DD_HH:MM:SS_UTC
   */
  private formatDateForQuery(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}_${hours}:${minutes}:${seconds}_UTC`;
  }

  /**
   * Make API request to TwitterAPI.io
   */
  private async makeRequest(query: string, cursor?: string): Promise<TwitterAPIResponse> {
    const params = new URLSearchParams({
      query,
      queryType: 'Latest',
    });

    if (cursor) {
      params.append('cursor', cursor);
    }

    const url = `${this.baseUrl}?${params.toString()}`;

    console.log(`[TWITTERAPI.IO] Making request to: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[TWITTERAPI.IO] Request failed with status ${response.status}: ${errorText}`);
      throw new Error(
        `TwitterAPI.io request failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = await response.json();

    console.log(`[TWITTERAPI.IO] Response data:`, {
      hasTweets: !!data.tweets,
      tweetCount: data.tweets?.length || 0,
      hasNextPage: data.has_next_page,
      nextCursor: data.next_cursor?.substring(0, 20) || 'none',
    });

    return data;
  }

  /**
   * Map TwitterAPI.io tweet format to ScrapedTweet
   */
  private mapToScrapedTweet(tweet: TwitterAPIResponse['tweets'][0], handle: string): ScrapedTweet {
    return {
      tweetId: tweet.id,
      content: tweet.text,
      authorHandle: `@${handle}`,
      publishedAt: new Date(tweet.createdAt),
      metrics: {
        likes: tweet.likeCount || 0,
        retweets: tweet.retweetCount || 0,
        replies: tweet.replyCount || 0,
        views: tweet.viewCount,
      },
    };
  }
}
