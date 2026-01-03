/**
 * Unit tests for balanced tweet sampling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllCreatorTweets } from '@/lib/db/creator-tweets';
import { prisma } from '@/lib/db/client';

vi.mock('@/lib/db/client', () => ({
  prisma: {
    creator: {
      findMany: vi.fn(),
    },
    creatorTweet: {
      findMany: vi.fn(),
    },
  },
}));

describe('Balanced Tweet Sampling', () => {
  const userId = 'test-user-id';
  const mockCreators = [
    { id: 'creator-1', xHandle: '@elonmusk' },
    { id: 'creator-2', xHandle: '@naval' },
    { id: 'creator-3', xHandle: '@paulg' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllCreatorTweets', () => {
    it('should fetch tweets evenly across all creators', async () => {
      // Mock creators query
      vi.mocked(prisma.creator.findMany).mockResolvedValue(mockCreators as any);

      // Mock tweet queries - 17 tweets per creator (50 / 3 = 17 each)
      const mockTweetsCreator1 = Array.from({ length: 17 }, (_, i) => ({
        id: `tweet-elon-${i}`,
        creatorId: 'creator-1',
        tweetId: `elon-${i}`,
        content: `Elon tweet ${i}`,
        authorHandle: '@elonmusk',
        publishedAt: new Date('2026-01-01'),
        metrics: { likes: 100 },
        creator: { xHandle: '@elonmusk' },
      }));

      const mockTweetsCreator2 = Array.from({ length: 17 }, (_, i) => ({
        id: `tweet-naval-${i}`,
        creatorId: 'creator-2',
        tweetId: `naval-${i}`,
        content: `Naval tweet ${i}`,
        authorHandle: '@naval',
        publishedAt: new Date('2026-01-01'),
        metrics: { likes: 100 },
        creator: { xHandle: '@naval' },
      }));

      const mockTweetsCreator3 = Array.from({ length: 17 }, (_, i) => ({
        id: `tweet-paulg-${i}`,
        creatorId: 'creator-3',
        tweetId: `paulg-${i}`,
        content: `Paul Graham tweet ${i}`,
        authorHandle: '@paulg',
        publishedAt: new Date('2026-01-01'),
        metrics: { likes: 100 },
        creator: { xHandle: '@paulg' },
      }));

      vi.mocked(prisma.creatorTweet.findMany)
        .mockResolvedValueOnce(mockTweetsCreator1 as any)
        .mockResolvedValueOnce(mockTweetsCreator2 as any)
        .mockResolvedValueOnce(mockTweetsCreator3 as any);

      const result = await getAllCreatorTweets(userId, { limit: 50, daysBack: 30 });

      // Should fetch from all creators
      expect(prisma.creator.findMany).toHaveBeenCalledWith({
        where: { userId, isActive: true },
        select: { id: true, xHandle: true },
      });

      // Should fetch tweets from each creator separately
      expect(prisma.creatorTweet.findMany).toHaveBeenCalledTimes(3);

      // Should return up to 50 tweets
      expect(result.length).toBeLessThanOrEqual(50);

      // Should have tweets from all creators
      const elonTweets = result.filter((t) => t.authorHandle === '@elonmusk');
      const navalTweets = result.filter((t) => t.authorHandle === '@naval');
      const paulgTweets = result.filter((t) => t.authorHandle === '@paulg');

      expect(elonTweets.length).toBeGreaterThan(0);
      expect(navalTweets.length).toBeGreaterThan(0);
      expect(paulgTweets.length).toBeGreaterThan(0);
    });

    it('should handle uneven tweet distribution', async () => {
      vi.mocked(prisma.creator.findMany).mockResolvedValue(mockCreators as any);

      // Creator 1 has many tweets, Creator 2 has few, Creator 3 has none
      const mockTweetsCreator1 = Array.from({ length: 17 }, (_, i) => ({
        id: `tweet-elon-${i}`,
        creatorId: 'creator-1',
        tweetId: `elon-${i}`,
        content: `Elon tweet ${i}`,
        authorHandle: '@elonmusk',
        publishedAt: new Date('2026-01-01'),
        metrics: { likes: 100 },
        creator: { xHandle: '@elonmusk' },
      }));

      const mockTweetsCreator2 = Array.from({ length: 5 }, (_, i) => ({
        id: `tweet-naval-${i}`,
        creatorId: 'creator-2',
        tweetId: `naval-${i}`,
        content: `Naval tweet ${i}`,
        authorHandle: '@naval',
        publishedAt: new Date('2026-01-01'),
        metrics: { likes: 100 },
        creator: { xHandle: '@naval' },
      }));

      const mockTweetsCreator3: any[] = [];

      vi.mocked(prisma.creatorTweet.findMany)
        .mockResolvedValueOnce(mockTweetsCreator1 as any)
        .mockResolvedValueOnce(mockTweetsCreator2 as any)
        .mockResolvedValueOnce(mockTweetsCreator3 as any);

      const result = await getAllCreatorTweets(userId, { limit: 50, daysBack: 30 });

      // Should still return tweets (22 total from Elon and Naval)
      expect(result.length).toBe(22);

      // Should have tweets from creators that have them
      const elonTweets = result.filter((t) => t.authorHandle === '@elonmusk');
      const navalTweets = result.filter((t) => t.authorHandle === '@naval');
      const paulgTweets = result.filter((t) => t.authorHandle === '@paulg');

      expect(elonTweets.length).toBe(17);
      expect(navalTweets.length).toBe(5);
      expect(paulgTweets.length).toBe(0);
    });

    it('should return empty array when no creators exist', async () => {
      vi.mocked(prisma.creator.findMany).mockResolvedValue([]);

      const result = await getAllCreatorTweets(userId, { limit: 50, daysBack: 30 });

      expect(result).toEqual([]);
      expect(prisma.creatorTweet.findMany).not.toHaveBeenCalled();
    });

    it('should return empty array when no tweets exist', async () => {
      vi.mocked(prisma.creator.findMany).mockResolvedValue(mockCreators as any);

      vi.mocked(prisma.creatorTweet.findMany)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await getAllCreatorTweets(userId, { limit: 50, daysBack: 30 });

      expect(result).toEqual([]);
    });

    it('should respect the limit parameter', async () => {
      vi.mocked(prisma.creator.findMany).mockResolvedValue([mockCreators[0]] as any);

      const mockTweets = Array.from({ length: 50 }, (_, i) => ({
        id: `tweet-${i}`,
        creatorId: 'creator-1',
        tweetId: `tweet-${i}`,
        content: `Tweet ${i}`,
        authorHandle: '@elonmusk',
        publishedAt: new Date('2026-01-01'),
        metrics: { likes: 100 },
        creator: { xHandle: '@elonmusk' },
      }));

      vi.mocked(prisma.creatorTweet.findMany).mockResolvedValue(mockTweets as any);

      const result = await getAllCreatorTweets(userId, { limit: 20, daysBack: 30 });

      expect(result.length).toBeLessThanOrEqual(20);
    });

    it('should fetch tweets within the specified date range', async () => {
      vi.mocked(prisma.creator.findMany).mockResolvedValue([mockCreators[0]] as any);
      vi.mocked(prisma.creatorTweet.findMany).mockResolvedValue([]);

      const daysBack = 7;
      await getAllCreatorTweets(userId, { limit: 50, daysBack });

      const expectedDateThreshold = new Date();
      expectedDateThreshold.setDate(expectedDateThreshold.getDate() - daysBack);

      expect(prisma.creatorTweet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            publishedAt: expect.objectContaining({
              gte: expect.any(Date),
            }),
          }),
        })
      );
    });

    it('should shuffle tweets to mix creators', async () => {
      vi.mocked(prisma.creator.findMany).mockResolvedValue(mockCreators as any);

      const mockTweetsCreator1 = Array.from({ length: 10 }, (_, i) => ({
        id: `tweet-elon-${i}`,
        creatorId: 'creator-1',
        tweetId: `elon-${i}`,
        content: `Elon tweet ${i}`,
        authorHandle: '@elonmusk',
        publishedAt: new Date('2026-01-01'),
        metrics: { likes: 100 },
        creator: { xHandle: '@elonmusk' },
      }));

      const mockTweetsCreator2 = Array.from({ length: 10 }, (_, i) => ({
        id: `tweet-naval-${i}`,
        creatorId: 'creator-2',
        tweetId: `naval-${i}`,
        content: `Naval tweet ${i}`,
        authorHandle: '@naval',
        publishedAt: new Date('2026-01-01'),
        metrics: { likes: 100 },
        creator: { xHandle: '@naval' },
      }));

      const mockTweetsCreator3 = Array.from({ length: 10 }, (_, i) => ({
        id: `tweet-paulg-${i}`,
        creatorId: 'creator-3',
        tweetId: `paulg-${i}`,
        content: `Paul Graham tweet ${i}`,
        authorHandle: '@paulg',
        publishedAt: new Date('2026-01-01'),
        metrics: { likes: 100 },
        creator: { xHandle: '@paulg' },
      }));

      vi.mocked(prisma.creatorTweet.findMany)
        .mockResolvedValueOnce(mockTweetsCreator1 as any)
        .mockResolvedValueOnce(mockTweetsCreator2 as any)
        .mockResolvedValueOnce(mockTweetsCreator3 as any);

      const result = await getAllCreatorTweets(userId, { limit: 30, daysBack: 30 });

      // Verify tweets are mixed (not all from one creator in sequence)
      // Check that the first 10 tweets aren't all from the same creator
      const firstTenAuthors = result.slice(0, 10).map((t) => t.authorHandle);
      const uniqueAuthors = new Set(firstTenAuthors);

      // Due to shuffling, we should have multiple creators in the first 10
      expect(uniqueAuthors.size).toBeGreaterThan(1);
    });

    it('should calculate correct tweets per creator', async () => {
      // Test with 50 limit and 3 creators = 17 per creator
      vi.mocked(prisma.creator.findMany).mockResolvedValue(mockCreators as any);
      vi.mocked(prisma.creatorTweet.findMany).mockResolvedValue([]);

      await getAllCreatorTweets(userId, { limit: 50, daysBack: 30 });

      // Should request 17 tweets per creator (50 / 3 rounded up)
      expect(prisma.creatorTweet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 17,
        })
      );
    });
  });
});
