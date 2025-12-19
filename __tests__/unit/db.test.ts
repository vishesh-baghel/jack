/**
 * Unit tests for database utilities
 * Following Vitest + TypeScript best practices:
 * - Mock Prisma client to avoid DB dependency
 * - Test actual behavior, not just existence
 * - Test edge cases and error handling
 * - Use proper TypeScript types
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma client at module level
vi.mock('@/lib/db/client', () => ({
  prisma: {
    user: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
    contentIdea: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    outline: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    post: {
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    toneConfig: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    creator: {
      upsert: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('User Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOrCreateUser', () => {
    it('should create new user if not exists', async () => {
      const { prisma } = await import('@/lib/db/client');
      const { getOrCreateUser } = await import('@/lib/db/users');

      const mockUser = { id: '1', email: 'test@example.com', name: 'Test User', createdAt: new Date() };
      vi.mocked(prisma.user.upsert).mockResolvedValue(mockUser);

      const result = await getOrCreateUser('test@example.com', 'Test User');

      expect(prisma.user.upsert).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        update: {},
        create: { email: 'test@example.com', name: 'Test User' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should handle user creation without name', async () => {
      const { prisma } = await import('@/lib/db/client');
      const { getOrCreateUser } = await import('@/lib/db/users');

      const mockUser = { id: '1', email: 'test@example.com', name: null, createdAt: new Date() };
      vi.mocked(prisma.user.upsert).mockResolvedValue(mockUser);

      await getOrCreateUser('test@example.com');

      expect(prisma.user.upsert).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        update: {},
        create: { email: 'test@example.com', name: undefined },
      });
    });
  });

  describe('getUserWithRelations', () => {
    it('should fetch user with projects, creators, and tone config', async () => {
      const { prisma } = await import('@/lib/db/client');
      const { getUserWithRelations } = await import('@/lib/db/users');

      const mockUser = {
        id: '1',
        email: 'test@example.com',
        projects: [{ id: 'p1', name: 'Project 1' }],
        creators: [{ id: 'c1', xHandle: '@creator1', isActive: true }],
        toneConfig: { id: 't1', lowercase: true },
      };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const result = await getUserWithRelations('1');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
          projects: true,
          creators: { where: { isActive: true } },
          toneConfig: true,
        },
      });
      expect(result).toEqual(mockUser);
    });
  });
});

describe('Content Idea Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createContentIdea', () => {
    it('should create content idea with correct data', async () => {
      const { prisma } = await import('@/lib/db/client');
      const { createContentIdea } = await import('@/lib/db/content-ideas');

      const mockIdea = {
        title: 'Test Idea',
        description: 'Test description',
        rationale: 'Test rationale',
        contentPillar: 'engineering',
        suggestedFormat: 'thread',
        estimatedEngagement: 'medium',
      };

      const mockCreated = { id: 'i1', ...mockIdea, status: 'suggested' as const, userId: 'u1', createdAt: new Date(), updatedAt: new Date() };
      vi.mocked(prisma.contentIdea.create).mockResolvedValue(mockCreated);

      const result = await createContentIdea('u1', mockIdea);

      expect(prisma.contentIdea.create).toHaveBeenCalledWith({
        data: {
          userId: 'u1',
          ...mockIdea,
          status: 'suggested',
        },
      });
      expect(result.status).toBe('suggested');
    });
  });

  describe('getIdeasByStatus', () => {
    it('should filter ideas by status and order by date', async () => {
      const { prisma } = await import('@/lib/db/client');
      const { getIdeasByStatus } = await import('@/lib/db/content-ideas');

      const mockIdeas = [
        { id: 'i1', title: 'Idea 1', status: 'accepted' },
        { id: 'i2', title: 'Idea 2', status: 'accepted' },
      ];
      vi.mocked(prisma.contentIdea.findMany).mockResolvedValue(mockIdeas);

      const result = await getIdeasByStatus('u1', 'accepted');

      expect(prisma.contentIdea.findMany).toHaveBeenCalledWith({
        where: { userId: 'u1', status: 'accepted' },
        orderBy: { createdAt: 'desc' },
        include: { outlines: true },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('updateIdeaStatus', () => {
    it('should update idea status', async () => {
      const { prisma } = await import('@/lib/db/client');
      const { updateIdeaStatus } = await import('@/lib/db/content-ideas');

      const mockUpdated = { id: 'i1', status: 'accepted' as const, title: '', description: '', rationale: '', contentPillar: '', suggestedFormat: '', estimatedEngagement: '', userId: '', createdAt: new Date(), updatedAt: new Date() };
      vi.mocked(prisma.contentIdea.update).mockResolvedValue(mockUpdated);

      const result = await updateIdeaStatus('i1', 'accepted');

      expect(prisma.contentIdea.update).toHaveBeenCalledWith({
        where: { id: 'i1' },
        data: { status: 'accepted' },
      });
      expect(result.status).toBe('accepted');
    });
  });
});

describe('Post Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('markPostAsGood', () => {
    it('should mark post as good with timestamp', async () => {
      const { prisma } = await import('@/lib/db/client');
      const { markPostAsGood } = await import('@/lib/db/posts');

      const mockPost = { id: 'p1', isMarkedGood: true, markedGoodAt: new Date(), userId: '', draftId: null, content: '', contentType: '', contentPillar: '', createdAt: new Date(), updatedAt: new Date() };
      vi.mocked(prisma.post.update).mockResolvedValue(mockPost);

      const result = await markPostAsGood('p1');

      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: {
          isMarkedGood: true,
          markedGoodAt: expect.any(Date),
        },
      });
      expect(result.isMarkedGood).toBe(true);
      expect(result.markedGoodAt).toBeInstanceOf(Date);
    });
  });

  describe('getGoodPostsForLearning', () => {
    it('should return only good posts with limit', async () => {
      const { prisma } = await import('@/lib/db/client');
      const { getGoodPostsForLearning } = await import('@/lib/db/posts');

      const mockPosts = [
        { content: 'Post 1', contentPillar: 'engineering', isMarkedGood: true },
        { content: 'Post 2', contentPillar: 'career', isMarkedGood: true },
      ];
      vi.mocked(prisma.post.findMany).mockResolvedValue(mockPosts);

      const result = await getGoodPostsForLearning('u1', 5);

      expect(prisma.post.findMany).toHaveBeenCalledWith({
        where: { userId: 'u1', isMarkedGood: true },
        orderBy: { markedGoodAt: 'desc' },
        take: 5,
        select: {
          content: true,
          contentPillar: true,
          contentType: true,
          markedGoodAt: true,
        },
      });
      expect(result).toHaveLength(2);
    });

    it('should use default limit of 10', async () => {
      const { prisma } = await import('@/lib/db/client');
      const { getGoodPostsForLearning } = await import('@/lib/db/posts');

      vi.mocked(prisma.post.findMany).mockResolvedValue([]);

      await getGoodPostsForLearning('u1');

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 })
      );
    });
  });
});

describe('Tone Config Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOrCreateToneConfig', () => {
    it('should return existing config if found', async () => {
      const { prisma } = await import('@/lib/db/client');
      const { getOrCreateToneConfig } = await import('@/lib/db/tone-config');

      const mockConfig = { id: 't1', userId: 'u1', lowercase: true, noEmojis: true, noHashtags: true, showFailures: true, includeNumbers: true, learnedPatterns: {}, createdAt: new Date(), updatedAt: new Date() };
      vi.mocked(prisma.toneConfig.findUnique).mockResolvedValue(mockConfig);

      const result = await getOrCreateToneConfig('u1');

      expect(prisma.toneConfig.findUnique).toHaveBeenCalledWith({
        where: { userId: 'u1' },
      });
      expect(prisma.toneConfig.create).not.toHaveBeenCalled();
      expect(result).toEqual(mockConfig);
    });

    it('should create config with defaults if not found', async () => {
      const { prisma } = await import('@/lib/db/client');
      const { getOrCreateToneConfig } = await import('@/lib/db/tone-config');

      vi.mocked(prisma.toneConfig.findUnique).mockResolvedValue(null);
      const mockCreated = {
        id: 't1',
        userId: 'u1',
        lowercase: true,
        noEmojis: true,
        noHashtags: true,
        showFailures: true,
        includeNumbers: true,
        learnedPatterns: {},
      };
      vi.mocked(prisma.toneConfig.create).mockResolvedValue(mockCreated);

      const result = await getOrCreateToneConfig('u1');

      expect(prisma.toneConfig.create).toHaveBeenCalledWith({
        data: {
          userId: 'u1',
          lowercase: true,
          noEmojis: true,
          noHashtags: true,
          showFailures: true,
          includeNumbers: true,
          learnedPatterns: {},
        },
      });
      expect(result.lowercase).toBe(true);
    });
  });

  describe('updateLearnedPatterns', () => {
    it('should update learned patterns', async () => {
      const { prisma } = await import('@/lib/db/client');
      const { updateLearnedPatterns } = await import('@/lib/db/tone-config');

      const patterns = {
        avgPostLength: 180,
        commonPhrases: ['spent X hours'],
        showFailures: true,
        includeNumbers: true,
        successfulPillars: ['engineering'],
      };
      const mockUpdated = { id: 't1', learnedPatterns: patterns, userId: 'u1', lowercase: true, noEmojis: true, noHashtags: true, showFailures: true, includeNumbers: true, createdAt: new Date(), updatedAt: new Date() };
      vi.mocked(prisma.toneConfig.update).mockResolvedValue(mockUpdated);

      await updateLearnedPatterns('u1', patterns);

      expect(prisma.toneConfig.update).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        data: { learnedPatterns: patterns },
      });
    });
  });
});

describe('Creator Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('toggleCreatorStatus', () => {
    it('should toggle active to inactive', async () => {
      const { prisma } = await import('@/lib/db/client');
      const { toggleCreatorStatus } = await import('@/lib/db/creators');

      const mockCreator = { id: 'c1', isActive: true, userId: 'u1', xHandle: '@test', createdAt: new Date(), updatedAt: new Date() };
      vi.mocked(prisma.creator.findUnique).mockResolvedValue(mockCreator);
      vi.mocked(prisma.creator.update).mockResolvedValue({ ...mockCreator, isActive: false });

      const result = await toggleCreatorStatus('c1');

      expect(prisma.creator.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { isActive: false },
      });
      expect(result.isActive).toBe(false);
    });

    it('should throw error if creator not found', async () => {
      const { prisma } = await import('@/lib/db/client');
      const { toggleCreatorStatus } = await import('@/lib/db/creators');

      vi.mocked(prisma.creator.findUnique).mockResolvedValue(null);

      await expect(toggleCreatorStatus('invalid')).rejects.toThrow('Creator not found');
    });
  });
});
