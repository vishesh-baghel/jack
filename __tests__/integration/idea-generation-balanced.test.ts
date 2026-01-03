/**
 * Integration tests for idea generation with balanced tweet sampling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildIdeaContext } from '@/lib/mastra/context';

// Mock the database functions
vi.mock('@/lib/db/creator-tweets', () => ({
  getAllCreatorTweets: vi.fn(),
}));

import { getAllCreatorTweets } from '@/lib/db/creator-tweets';

describe('Idea Generation with Balanced Tweets - Integration', () => {
  const mockUser = {
    id: 'user-1',
    projects: [],
    creators: [
      { id: 'creator-1', xHandle: '@elonmusk', isActive: true },
      { id: 'creator-2', xHandle: '@naval', isActive: true },
      { id: 'creator-3', xHandle: '@paulg', isActive: true },
    ],
    toneConfig: {
      lowercase: true,
      noEmojis: true,
      noHashtags: true,
      showFailures: true,
      includeNumbers: true,
      customRules: [],
      learnedPatterns: {},
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buildIdeaContext with balanced tweets', () => {
    it('should include tweets from all creators in context', async () => {
      // Mock balanced tweet sampling
      const mockBalancedTweets = [
        {
          id: 'tweet-1',
          creatorId: 'creator-1',
          content: 'Building AI at scale requires patience and iteration',
          authorHandle: '@elonmusk',
          publishedAt: new Date('2026-01-01'),
          metrics: { likes: 1000, retweets: 100, replies: 50, views: 10000 },
          creator: { xHandle: '@elonmusk' },
        },
        {
          id: 'tweet-2',
          creatorId: 'creator-2',
          content: 'Leverage is the key to building wealth in the modern economy',
          authorHandle: '@naval',
          publishedAt: new Date('2026-01-01'),
          metrics: { likes: 5000, retweets: 500, replies: 100, views: 50000 },
          creator: { xHandle: '@naval' },
        },
        {
          id: 'tweet-3',
          creatorId: 'creator-3',
          content: 'The best way to predict the future is to invent it',
          authorHandle: '@paulg',
          publishedAt: new Date('2026-01-01'),
          metrics: { likes: 2000, retweets: 200, replies: 75, views: 20000 },
          creator: { xHandle: '@paulg' },
        },
      ];

      vi.mocked(getAllCreatorTweets).mockResolvedValue(mockBalancedTweets as any);

      const context = await buildIdeaContext(mockUser as any, [], []);

      expect(context.creatorTweets).toHaveLength(3);

      // Verify all creators are represented
      const authors = context.creatorTweets.map((t) => t.author);
      expect(authors).toContain('@elonmusk');
      expect(authors).toContain('@naval');
      expect(authors).toContain('@paulg');

      // Verify tweet content is preserved
      expect(context.creatorTweets[0].content).toContain('AI at scale');
      expect(context.creatorTweets[1].content).toContain('Leverage');
      expect(context.creatorTweets[2].content).toContain('predict the future');

      // Verify metrics are included
      expect(context.creatorTweets[0].metrics).toBeDefined();
      expect(context.creatorTweets[1].metrics).toBeDefined();
      expect(context.creatorTweets[2].metrics).toBeDefined();
    });

    it('should handle case with no tweets from some creators', async () => {
      // Only tweets from 2 out of 3 creators
      const mockPartialTweets = [
        {
          id: 'tweet-1',
          creatorId: 'creator-1',
          content: 'Elon tweet',
          authorHandle: '@elonmusk',
          publishedAt: new Date('2026-01-01'),
          metrics: { likes: 1000, retweets: 100, replies: 50, views: 10000 },
          creator: { xHandle: '@elonmusk' },
        },
        {
          id: 'tweet-2',
          creatorId: 'creator-2',
          content: 'Naval tweet',
          authorHandle: '@naval',
          publishedAt: new Date('2026-01-01'),
          metrics: { likes: 5000, retweets: 500, replies: 100, views: 50000 },
          creator: { xHandle: '@naval' },
        },
      ];

      vi.mocked(getAllCreatorTweets).mockResolvedValue(mockPartialTweets as any);

      const context = await buildIdeaContext(mockUser as any, [], []);

      expect(context.creatorTweets).toHaveLength(2);

      const authors = context.creatorTweets.map((t) => t.author);
      expect(authors).toContain('@elonmusk');
      expect(authors).toContain('@naval');
      expect(authors).not.toContain('@paulg');
    });

    it('should handle empty tweets gracefully', async () => {
      vi.mocked(getAllCreatorTweets).mockResolvedValue([]);

      const context = await buildIdeaContext(mockUser as any, [], []);

      expect(context.creatorTweets).toEqual([]);
    });

    it('should limit tweets to 50 by default', async () => {
      const largeTweetSet = Array.from({ length: 100 }, (_, i) => ({
        id: `tweet-${i}`,
        creatorId: `creator-${i % 3}`,
        content: `Tweet ${i}`,
        authorHandle: `@creator${i % 3}`,
        publishedAt: new Date('2026-01-01'),
        metrics: { likes: 100, retweets: 10, replies: 5, views: 1000 },
        creator: { xHandle: `@creator${i % 3}` },
      }));

      vi.mocked(getAllCreatorTweets).mockResolvedValue(largeTweetSet as any);

      await buildIdeaContext(mockUser as any, [], []);

      // Verify getAllCreatorTweets was called with limit: 50
      expect(getAllCreatorTweets).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          limit: 50,
          daysBack: 30,
        })
      );
    });

    it('should map tweets to correct format for agent', async () => {
      const mockTweets = [
        {
          id: 'tweet-1',
          creatorId: 'creator-1',
          content: 'Test tweet content',
          authorHandle: '@testuser',
          publishedAt: new Date('2026-01-01T12:00:00Z'),
          metrics: {
            likes: 100,
            retweets: 10,
            replies: 5,
            views: 1000,
          },
          creator: { xHandle: '@testuser' },
        },
      ];

      vi.mocked(getAllCreatorTweets).mockResolvedValue(mockTweets as any);

      const context = await buildIdeaContext(mockUser as any, [], []);

      expect(context.creatorTweets[0]).toEqual({
        content: 'Test tweet content',
        author: '@testuser',
        publishedAt: '2026-01-01T12:00:00.000Z',
        metrics: {
          likes: 100,
          retweets: 10,
          replies: 5,
          views: 1000,
        },
      });
    });
  });

  describe('Idea diversity with balanced tweets', () => {
    it('should provide diverse creator content for idea generation', async () => {
      const mockDiverseTweets = [
        {
          id: 'tweet-1',
          content: 'AI engineering topic',
          authorHandle: '@elonmusk',
          publishedAt: new Date('2026-01-01'),
          metrics: {},
          creator: { xHandle: '@elonmusk' },
        },
        {
          id: 'tweet-2',
          content: 'Career and leverage topic',
          authorHandle: '@naval',
          publishedAt: new Date('2026-01-01'),
          metrics: {},
          creator: { xHandle: '@naval' },
        },
        {
          id: 'tweet-3',
          content: 'Startup building topic',
          authorHandle: '@paulg',
          publishedAt: new Date('2026-01-01'),
          metrics: {},
          creator: { xHandle: '@paulg' },
        },
      ];

      vi.mocked(getAllCreatorTweets).mockResolvedValue(mockDiverseTweets as any);

      const context = await buildIdeaContext(mockUser as any, [], []);

      // Verify we have content from different topic areas
      const contents = context.creatorTweets.map((t) => t.content);
      expect(contents.some((c) => c.includes('AI engineering'))).toBe(true);
      expect(contents.some((c) => c.includes('Career and leverage'))).toBe(true);
      expect(contents.some((c) => c.includes('Startup building'))).toBe(true);
    });
  });
});
