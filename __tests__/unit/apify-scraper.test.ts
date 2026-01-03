/**
 * Apify Twitter Scraper Adapter Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApifyTwitterScraper } from '@/lib/scrapers/apify-scraper';
import type { ScrapedTweet } from '@/lib/scrapers/types';

// Mock the ApifyClient
vi.mock('apify-client', () => {
  return {
    ApifyClient: vi.fn().mockImplementation(() => ({
      actor: vi.fn().mockReturnValue({
        call: vi.fn(),
      }),
      dataset: vi.fn().mockReturnValue({
        listItems: vi.fn(),
      }),
    })),
  };
});

describe('ApifyTwitterScraper', () => {
  let scraper: ApifyTwitterScraper;
  let mockClient: any;

  beforeEach(() => {
    scraper = new ApifyTwitterScraper('test-api-key');
    mockClient = (scraper as any).client;
  });

  describe('scrapeTweets', () => {
    it('should normalize handle without @ prefix', async () => {
      const mockRun = { defaultDatasetId: 'dataset-123' };
      mockClient.actor().call.mockResolvedValue(mockRun);
      mockClient.dataset().listItems.mockResolvedValue({ items: [] });

      await scraper.scrapeTweets({ handle: '@testuser', maxItems: 10 });

      expect(mockClient.actor).toHaveBeenCalledWith('apidojo/tweet-scraper');
      expect(mockClient.actor().call).toHaveBeenCalledWith(
        expect.objectContaining({
          twitterHandles: ['testuser'], // Without @
        })
      );
    });

    it('should handle already normalized handle', async () => {
      const mockRun = { defaultDatasetId: 'dataset-123' };
      mockClient.actor().call.mockResolvedValue(mockRun);
      mockClient.dataset().listItems.mockResolvedValue({ items: [] });

      await scraper.scrapeTweets({ handle: 'testuser', maxItems: 10 });

      expect(mockClient.actor().call).toHaveBeenCalledWith(
        expect.objectContaining({
          twitterHandles: ['testuser'],
        })
      );
    });

    it('should return tweets in standard format', async () => {
      const mockRun = { defaultDatasetId: 'dataset-123' };
      const mockTweets = [
        {
          id: '123456',
          text: 'Test tweet content',
          createdAt: '2024-01-01T12:00:00Z',
          author: { userName: 'testuser', id: 'user789' },
          likes: 100,
          retweets: 50,
          replies: 25,
          views: 1000,
        },
      ];

      mockClient.actor().call.mockResolvedValue(mockRun);
      mockClient.dataset().listItems.mockResolvedValue({ items: mockTweets });

      const result = await scraper.scrapeTweets({ handle: 'testuser', maxItems: 10 });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        tweetId: '123456',
        content: 'Test tweet content',
        authorHandle: '@testuser',
        metrics: {
          likes: 100,
          retweets: 50,
          replies: 25,
          views: 1000,
        },
      });
      expect(result[0].publishedAt).toBeInstanceOf(Date);
    });

    it('should handle different field naming conventions', async () => {
      const mockRun = { defaultDatasetId: 'dataset-123' };
      const mockTweets = [
        {
          id_str: '789',
          full_text: 'Alternative format tweet',
          created_at: '2024-01-02T12:00:00Z',
          author: { userName: 'altuser' },
          favorite_count: 200,
          retweet_count: 100,
          reply_count: 50,
          viewCount: 2000,
        },
      ];

      mockClient.actor().call.mockResolvedValue(mockRun);
      mockClient.dataset().listItems.mockResolvedValue({ items: mockTweets });

      const result = await scraper.scrapeTweets({ handle: 'altuser', maxItems: 10 });

      expect(result[0]).toMatchObject({
        tweetId: '789',
        content: 'Alternative format tweet',
        metrics: {
          likes: 200,
          retweets: 100,
          replies: 50,
          views: 2000,
        },
      });
    });

    it('should pass date range to Apify', async () => {
      const mockRun = { defaultDatasetId: 'dataset-123' };
      mockClient.actor().call.mockResolvedValue(mockRun);
      mockClient.dataset().listItems.mockResolvedValue({ items: [] });

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await scraper.scrapeTweets({
        handle: 'testuser',
        maxItems: 10,
        startDate,
        endDate,
      });

      expect(mockClient.actor().call).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        })
      );
    });

    it('should use maxItems parameter', async () => {
      const mockRun = { defaultDatasetId: 'dataset-123' };
      mockClient.actor().call.mockResolvedValue(mockRun);
      mockClient.dataset().listItems.mockResolvedValue({ items: [] });

      await scraper.scrapeTweets({ handle: 'testuser', maxItems: 25 });

      expect(mockClient.actor().call).toHaveBeenCalledWith(
        expect.objectContaining({
          maxItems: 25,
        })
      );
    });
  });

  describe('validateHandle', () => {
    it('should reject invalid handle format', async () => {
      const result = await scraper.validateHandle('invalid handle!');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid Twitter handle format');
    });

    it('should reject handles with spaces', async () => {
      const result = await scraper.validateHandle('user name');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid Twitter handle format');
    });

    it('should validate existing handles', async () => {
      const mockRun = { defaultDatasetId: 'dataset-123' };
      const mockTweets = [
        {
          id: '123',
          text: 'Test',
          createdAt: '2024-01-01',
          author: { id: 'user123', userName: 'validuser' },
        },
      ];

      mockClient.actor().call.mockResolvedValue(mockRun);
      mockClient.dataset().listItems.mockResolvedValue({ items: mockTweets });

      const result = await scraper.validateHandle('@validuser');

      expect(result.valid).toBe(true);
      expect(result.userId).toBe('user123');
    });

    it('should handle accounts with no tweets', async () => {
      const mockRun = { defaultDatasetId: 'dataset-123' };
      mockClient.actor().call.mockResolvedValue(mockRun);
      mockClient.dataset().listItems.mockResolvedValue({ items: [] });

      const result = await scraper.validateHandle('notweets');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Twitter account not found or has no tweets');
    });

    it('should handle API errors gracefully', async () => {
      mockClient.actor().call.mockRejectedValue(new Error('API Error'));

      const result = await scraper.validateHandle('erroruser');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unable to validate Twitter handle');
    });
  });

  describe('getProviderName', () => {
    it('should return provider name', () => {
      expect(scraper.getProviderName()).toBe('Apify');
    });
  });
});
