/**
 * Unit tests for TwitterAPI.io scraper
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TwitterAPIScraper } from '@/lib/scrapers/twitterapi-scraper';

describe('TwitterAPIScraper', () => {
  let scraper: TwitterAPIScraper;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    scraper = new TwitterAPIScraper(mockApiKey);
    vi.clearAllMocks();
  });

  describe('validateHandle', () => {
    it('should validate a valid Twitter handle', async () => {
      const mockResponse = {
        data: {
          id: '44196397',
          name: 'Elon Musk',
          userName: 'elonmusk',
          createdAt: '2009-06-02T20:12:29.000Z',
          isBlueVerified: true,
          protected: false,
        },
        status: 'success',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await scraper.validateHandle('elonmusk');

      expect(result.valid).toBe(true);
      expect(result.userId).toBe('44196397');
      expect(result.error).toBeUndefined();
    });

    it('should normalize handles with @ prefix', async () => {
      const mockResponse = {
        data: {
          id: '745273',
          name: 'Naval',
          userName: 'naval',
          createdAt: '2007-02-05T06:18:42.000Z',
          isBlueVerified: true,
          protected: false,
        },
        status: 'success',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await scraper.validateHandle('@naval');

      expect(result.valid).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('userName=naval'),
        expect.any(Object)
      );
    });

    it('should reject invalid handle format', async () => {
      const result = await scraper.validateHandle('invalid handle!');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid Twitter handle format');
    });

    it('should handle 400 error (user not found)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => 'User not found',
      } as Response);

      const result = await scraper.validateHandle('nonexistentuser');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Twitter account not found.');
    });

    it('should handle API errors gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server error',
      } as Response);

      const result = await scraper.validateHandle('testuser');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unable to validate');
    });

    it('should handle status error response', async () => {
      const mockResponse = {
        data: null,
        status: 'error',
        msg: 'Account suspended',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await scraper.validateHandle('suspendeduser');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Account suspended');
    });
  });

  describe('scrapeTweets', () => {
    it('should scrape tweets successfully', async () => {
      const mockResponse = {
        tweets: [
          {
            id: '1234567890',
            text: 'Test tweet 1',
            createdAt: 'Wed Jan 01 12:00:00 +0000 2026',
            retweetCount: 10,
            replyCount: 5,
            likeCount: 100,
            quoteCount: 2,
            viewCount: 1000,
          },
          {
            id: '1234567891',
            text: 'Test tweet 2',
            createdAt: 'Wed Jan 01 11:00:00 +0000 2026',
            retweetCount: 20,
            replyCount: 10,
            likeCount: 200,
            quoteCount: 5,
            viewCount: 2000,
          },
        ],
        has_next_page: false,
        next_cursor: null,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await scraper.scrapeTweets({
        handle: 'testuser',
        maxItems: 10,
      });

      expect(result).toHaveLength(2);
      expect(result[0].tweetId).toBe('1234567890');
      expect(result[0].content).toBe('Test tweet 1');
      expect(result[0].authorHandle).toBe('@testuser');
      expect(result[0].metrics.likes).toBe(100);
      expect(result[0].metrics.retweets).toBe(10);
      expect(result[0].metrics.replies).toBe(5);
      expect(result[0].metrics.views).toBe(1000);
    });

    it('should respect maxItems limit', async () => {
      const mockTweets = Array.from({ length: 20 }, (_, i) => ({
        id: `tweet-${i}`,
        text: `Tweet ${i}`,
        createdAt: 'Wed Jan 01 12:00:00 +0000 2026',
        retweetCount: 10,
        replyCount: 5,
        likeCount: 100,
        viewCount: 1000,
      }));

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          tweets: mockTweets,
          has_next_page: true,
          next_cursor: 'cursor123',
        }),
      } as Response);

      const result = await scraper.scrapeTweets({
        handle: 'testuser',
        maxItems: 10,
      });

      expect(result).toHaveLength(10);
    });

    it('should handle pagination', async () => {
      let callCount = 0;
      global.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              tweets: Array.from({ length: 20 }, (_, i) => ({
                id: `tweet-page1-${i}`,
                text: `Tweet ${i}`,
                createdAt: 'Wed Jan 01 12:00:00 +0000 2026',
                retweetCount: 10,
                replyCount: 5,
                likeCount: 100,
                viewCount: 1000,
              })),
              has_next_page: true,
              next_cursor: 'cursor123',
            }),
          } as Response);
        } else {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              tweets: Array.from({ length: 10 }, (_, i) => ({
                id: `tweet-page2-${i}`,
                text: `Tweet ${i + 20}`,
                createdAt: 'Wed Jan 01 11:00:00 +0000 2026',
                retweetCount: 10,
                replyCount: 5,
                likeCount: 100,
                viewCount: 1000,
              })),
              has_next_page: false,
              next_cursor: null,
            }),
          } as Response);
        }
      });

      const result = await scraper.scrapeTweets({
        handle: 'testuser',
        maxItems: 25,
      });

      expect(result).toHaveLength(25);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle empty response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          tweets: [],
          has_next_page: false,
          next_cursor: null,
        }),
      } as Response);

      const result = await scraper.scrapeTweets({
        handle: 'testuser',
        maxItems: 10,
      });

      expect(result).toHaveLength(0);
    });

    it('should handle API errors gracefully without throwing', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server error',
      } as Response);

      const result = await scraper.scrapeTweets({
        handle: 'testuser',
        maxItems: 10,
      });

      // Should return empty array, not throw
      expect(result).toHaveLength(0);
    });

    it('should use custom date range when provided', async () => {
      const startDate = new Date('2025-12-01');
      const endDate = new Date('2025-12-31');

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          tweets: [],
          has_next_page: false,
          next_cursor: null,
        }),
      } as Response);

      await scraper.scrapeTweets({
        handle: 'testuser',
        maxItems: 10,
        startDate,
        endDate,
      });

      // Check the URL contains the encoded date parameters
      const fetchCalls = vi.mocked(fetch).mock.calls;
      expect(fetchCalls.length).toBeGreaterThan(0);

      const url = fetchCalls[0][0] as string;
      const decodedUrl = decodeURIComponent(url);

      expect(decodedUrl).toContain('since:2025-12-01');
      expect(decodedUrl).toContain('until:2025-12-31');
    });
  });

  describe('getProviderName', () => {
    it('should return correct provider name', () => {
      expect(scraper.getProviderName()).toBe('TwitterAPI.io');
    });
  });
});
