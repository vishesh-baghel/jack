/**
 * Comprehensive API Route Tests
 * Tests all API routes with edge cases and smoke tests
 * 
 * Coverage:
 * - Drafts: PATCH, DELETE, POST (post to X)
 * - Posts: GET, POST, PATCH (mark good)
 * - Ideas: GET, PATCH
 * - Creators: GET, POST, PATCH (toggle)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock all database functions
vi.mock('@/lib/db/drafts', () => ({
  getDraftById: vi.fn(),
  updateDraft: vi.fn(),
  deleteDraft: vi.fn(),
  markDraftAsPosted: vi.fn(),
  getDraftsForUser: vi.fn(),
  createDraft: vi.fn(),
}));

vi.mock('@/lib/db/posts', () => ({
  getUserPosts: vi.fn(),
  createPost: vi.fn(),
  markPostAsGood: vi.fn(),
}));

vi.mock('@/lib/db/content-ideas', () => ({
  getIdeasByStatus: vi.fn(),
  getAllIdeas: vi.fn(),
  updateIdeaStatus: vi.fn(),
}));

vi.mock('@/lib/db/creators', () => ({
  getActiveCreators: vi.fn(),
  addCreator: vi.fn(),
  toggleCreatorStatus: vi.fn(),
}));

// Import mocked functions
import { getDraftById, updateDraft, deleteDraft, markDraftAsPosted } from '@/lib/db/drafts';
import { getUserPosts, createPost, markPostAsGood } from '@/lib/db/posts';
import { updateIdeaStatus } from '@/lib/db/content-ideas';
import { getActiveCreators, addCreator, toggleCreatorStatus } from '@/lib/db/creators';

// Helper to create mock NextRequest
const createMockRequest = (options: {
  method?: string;
  body?: object;
  searchParams?: Record<string, string>;
  url?: string;
} = {}) => {
  const { method = 'GET', body, searchParams = {}, url = 'http://localhost:3000/api/test' } = options;
  
  const urlObj = new URL(url);
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value);
  });

  return {
    method,
    url: urlObj.toString(),
    json: vi.fn().mockResolvedValue(body || {}),
  } as unknown as NextRequest;
};

// Helper to create mock params
const createMockParams = (id: string) => Promise.resolve({ id });

describe('Draft API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PATCH /api/drafts/[id] - Update Draft', () => {
    it('should update draft content successfully', async () => {
      const mockDraft = {
        id: 'draft-123',
        content: 'Original content',
        isPosted: false,
      };
      const updatedDraft = { ...mockDraft, content: 'Updated content' };

      vi.mocked(getDraftById).mockResolvedValue(mockDraft as never);
      vi.mocked(updateDraft).mockResolvedValue(updatedDraft as never);

      const { PATCH } = await import('@/app/api/drafts/[id]/route');
      const request = createMockRequest({
        method: 'PATCH',
        body: { content: 'Updated content' },
      });

      const response = await PATCH(request, { params: createMockParams('draft-123') });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.draft.content).toBe('Updated content');
      expect(getDraftById).toHaveBeenCalledWith('draft-123');
      expect(updateDraft).toHaveBeenCalledWith('draft-123', 'Updated content');
    });

    it('should return 400 if draft ID is missing', async () => {
      const { PATCH } = await import('@/app/api/drafts/[id]/route');
      const request = createMockRequest({
        method: 'PATCH',
        body: { content: 'Updated content' },
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: '' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Draft ID is required');
    });

    it('should return 400 if content is missing', async () => {
      const { PATCH } = await import('@/app/api/drafts/[id]/route');
      const request = createMockRequest({
        method: 'PATCH',
        body: {},
      });

      const response = await PATCH(request, { params: createMockParams('draft-123') });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Content is required and must be a string');
    });

    it('should return 400 if content is not a string', async () => {
      const { PATCH } = await import('@/app/api/drafts/[id]/route');
      const request = createMockRequest({
        method: 'PATCH',
        body: { content: 123 },
      });

      const response = await PATCH(request, { params: createMockParams('draft-123') });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Content is required and must be a string');
    });

    it('should return 404 if draft not found', async () => {
      vi.mocked(getDraftById).mockResolvedValue(null as never);

      const { PATCH } = await import('@/app/api/drafts/[id]/route');
      const request = createMockRequest({
        method: 'PATCH',
        body: { content: 'Updated content' },
      });

      const response = await PATCH(request, { params: createMockParams('nonexistent') });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Draft not found');
    });

    it('should return 500 on database error', async () => {
      vi.mocked(getDraftById).mockRejectedValue(new Error('Database error'));

      const { PATCH } = await import('@/app/api/drafts/[id]/route');
      const request = createMockRequest({
        method: 'PATCH',
        body: { content: 'Updated content' },
      });

      const response = await PATCH(request, { params: createMockParams('draft-123') });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update draft');
    });
  });

  describe('DELETE /api/drafts/[id] - Delete Draft', () => {
    it('should delete draft successfully', async () => {
      const mockDraft = { id: 'draft-123', content: 'Content' };
      vi.mocked(getDraftById).mockResolvedValue(mockDraft as never);
      vi.mocked(deleteDraft).mockResolvedValue(undefined as never);

      const { DELETE } = await import('@/app/api/drafts/[id]/route');
      const request = createMockRequest({ method: 'DELETE' });

      const response = await DELETE(request, { params: createMockParams('draft-123') });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(deleteDraft).toHaveBeenCalledWith('draft-123');
    });

    it('should return 400 if draft ID is missing', async () => {
      const { DELETE } = await import('@/app/api/drafts/[id]/route');
      const request = createMockRequest({ method: 'DELETE' });

      const response = await DELETE(request, { params: Promise.resolve({ id: '' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Draft ID is required');
    });

    it('should return 404 if draft not found', async () => {
      vi.mocked(getDraftById).mockResolvedValue(null as never);

      const { DELETE } = await import('@/app/api/drafts/[id]/route');
      const request = createMockRequest({ method: 'DELETE' });

      const response = await DELETE(request, { params: createMockParams('nonexistent') });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Draft not found');
    });

    it('should return 500 on database error', async () => {
      vi.mocked(getDraftById).mockRejectedValue(new Error('Database error'));

      const { DELETE } = await import('@/app/api/drafts/[id]/route');
      const request = createMockRequest({ method: 'DELETE' });

      const response = await DELETE(request, { params: createMockParams('draft-123') });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to delete draft');
    });
  });

  describe('POST /api/drafts/[id]/post - Post to X', () => {
    it('should mark draft as posted successfully', async () => {
      const mockDraft = { id: 'draft-123', content: 'Content', isPosted: false };
      const postedDraft = { ...mockDraft, isPosted: true, postedAt: new Date() };

      vi.mocked(getDraftById).mockResolvedValue(mockDraft as never);
      vi.mocked(markDraftAsPosted).mockResolvedValue(postedDraft as never);

      const { POST } = await import('@/app/api/drafts/[id]/post/route');
      const request = createMockRequest({ method: 'POST' });

      const response = await POST(request, { params: createMockParams('draft-123') });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.draft.isPosted).toBe(true);
      expect(markDraftAsPosted).toHaveBeenCalledWith('draft-123');
    });

    it('should return 400 if draft ID is missing', async () => {
      const { POST } = await import('@/app/api/drafts/[id]/post/route');
      const request = createMockRequest({ method: 'POST' });

      const response = await POST(request, { params: Promise.resolve({ id: '' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Draft ID is required');
    });

    it('should return 404 if draft not found', async () => {
      vi.mocked(getDraftById).mockResolvedValue(null as never);

      const { POST } = await import('@/app/api/drafts/[id]/post/route');
      const request = createMockRequest({ method: 'POST' });

      const response = await POST(request, { params: createMockParams('nonexistent') });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Draft not found');
    });

    it('should return 400 if draft already posted', async () => {
      const mockDraft = { id: 'draft-123', content: 'Content', isPosted: true };
      vi.mocked(getDraftById).mockResolvedValue(mockDraft as never);

      const { POST } = await import('@/app/api/drafts/[id]/post/route');
      const request = createMockRequest({ method: 'POST' });

      const response = await POST(request, { params: createMockParams('draft-123') });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Draft has already been posted');
    });

    it('should return 500 on database error', async () => {
      vi.mocked(getDraftById).mockRejectedValue(new Error('Database error'));

      const { POST } = await import('@/app/api/drafts/[id]/post/route');
      const request = createMockRequest({ method: 'POST' });

      const response = await POST(request, { params: createMockParams('draft-123') });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to post draft');
    });
  });
});

describe('Posts API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/posts - Get Posts', () => {
    it('should return posts for user', async () => {
      const mockPosts = [
        { id: 'post-1', content: 'Post 1', isMarkedGood: false },
        { id: 'post-2', content: 'Post 2', isMarkedGood: true },
      ];
      vi.mocked(getUserPosts).mockResolvedValue(mockPosts as never);

      const { GET } = await import('@/app/api/posts/route');
      const request = createMockRequest({
        searchParams: { userId: 'user-123' },
        url: 'http://localhost:3000/api/posts',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.posts).toHaveLength(2);
      expect(data.count).toBe(2);
      expect(getUserPosts).toHaveBeenCalledWith('user-123');
    });

    it('should return 400 if userId is missing', async () => {
      const { GET } = await import('@/app/api/posts/route');
      const request = createMockRequest({
        url: 'http://localhost:3000/api/posts',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('userId is required');
    });

    it('should return empty array if no posts', async () => {
      vi.mocked(getUserPosts).mockResolvedValue([] as never);

      const { GET } = await import('@/app/api/posts/route');
      const request = createMockRequest({
        searchParams: { userId: 'user-123' },
        url: 'http://localhost:3000/api/posts',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.posts).toHaveLength(0);
      expect(data.count).toBe(0);
    });

    it('should return 500 on database error', async () => {
      vi.mocked(getUserPosts).mockRejectedValue(new Error('Database error'));

      const { GET } = await import('@/app/api/posts/route');
      const request = createMockRequest({
        searchParams: { userId: 'user-123' },
        url: 'http://localhost:3000/api/posts',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch posts');
    });
  });

  describe('POST /api/posts - Create Post', () => {
    it('should create post successfully', async () => {
      const mockPost = {
        id: 'post-123',
        userId: 'user-123',
        draftId: 'draft-123',
        content: 'Post content',
        contentType: 'thread',
        contentPillar: 'lessons_learned',
      };
      vi.mocked(createPost).mockResolvedValue(mockPost as never);

      const { POST } = await import('@/app/api/posts/route');
      const request = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          draftId: 'draft-123',
          content: 'Post content',
          contentType: 'thread',
          contentPillar: 'lessons_learned',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.post.id).toBe('post-123');
      expect(createPost).toHaveBeenCalledWith(
        'user-123',
        'draft-123',
        'Post content',
        'thread',
        'lessons_learned'
      );
    });

    it('should return 400 if required fields are missing', async () => {
      const { POST } = await import('@/app/api/posts/route');
      const request = createMockRequest({
        method: 'POST',
        body: { userId: 'user-123' }, // Missing other fields
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required fields');
    });

    it('should return 409 if post already exists for draft', async () => {
      const error = new Error('Unique constraint failed');
      vi.mocked(createPost).mockRejectedValue(error);

      const { POST } = await import('@/app/api/posts/route');
      const request = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          draftId: 'draft-123',
          content: 'Post content',
          contentType: 'thread',
          contentPillar: 'lessons_learned',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe('A post already exists for this draft');
    });

    it('should return 500 on other database errors', async () => {
      vi.mocked(createPost).mockRejectedValue(new Error('Database error'));

      const { POST } = await import('@/app/api/posts/route');
      const request = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          draftId: 'draft-123',
          content: 'Post content',
          contentType: 'thread',
          contentPillar: 'lessons_learned',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create post');
    });
  });

  describe('PATCH /api/posts/[id]/mark-good - Mark Post as Good', () => {
    it('should mark post as good successfully', async () => {
      const mockPost = {
        id: 'post-123',
        isMarkedGood: true,
        markedGoodAt: new Date(),
      };
      vi.mocked(markPostAsGood).mockResolvedValue(mockPost as never);

      const { PATCH } = await import('@/app/api/posts/[id]/mark-good/route');
      const request = createMockRequest({ method: 'PATCH' });

      const response = await PATCH(request, { params: createMockParams('post-123') });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.post.isMarkedGood).toBe(true);
      expect(markPostAsGood).toHaveBeenCalledWith('post-123');
    });

    it('should return 400 if post ID is missing', async () => {
      const { PATCH } = await import('@/app/api/posts/[id]/mark-good/route');
      const request = createMockRequest({ method: 'PATCH' });

      const response = await PATCH(request, { params: Promise.resolve({ id: '' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Post ID is required');
    });

    it('should return 404 if post not found (P2025 error)', async () => {
      const error = new Error('Record not found') as Error & { code: string };
      error.code = 'P2025';
      vi.mocked(markPostAsGood).mockRejectedValue(error);

      const { PATCH } = await import('@/app/api/posts/[id]/mark-good/route');
      const request = createMockRequest({ method: 'PATCH' });

      const response = await PATCH(request, { params: createMockParams('nonexistent') });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('Post not found');
    });

    it('should return 500 on other database errors', async () => {
      vi.mocked(markPostAsGood).mockRejectedValue(new Error('Database error'));

      const { PATCH } = await import('@/app/api/posts/[id]/mark-good/route');
      const request = createMockRequest({ method: 'PATCH' });

      const response = await PATCH(request, { params: createMockParams('post-123') });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to mark post as good');
    });
  });
});

describe('Ideas API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PATCH /api/ideas/[id] - Update Idea Status', () => {
    it('should update idea status successfully', async () => {
      const mockIdea = {
        id: 'idea-123',
        status: 'accepted',
      };
      vi.mocked(updateIdeaStatus).mockResolvedValue(mockIdea as never);

      const { PATCH } = await import('@/app/api/ideas/[id]/route');
      const request = createMockRequest({
        method: 'PATCH',
        body: { status: 'accepted' },
      });

      const response = await PATCH(request, { params: createMockParams('idea-123') });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.idea.status).toBe('accepted');
      expect(updateIdeaStatus).toHaveBeenCalledWith('idea-123', 'accepted');
    });

    it('should accept rejected status', async () => {
      const mockIdea = {
        id: 'idea-123',
        status: 'rejected',
      };
      vi.mocked(updateIdeaStatus).mockResolvedValue(mockIdea as never);

      const { PATCH } = await import('@/app/api/ideas/[id]/route');
      const request = createMockRequest({
        method: 'PATCH',
        body: { status: 'rejected' },
      });

      const response = await PATCH(request, { params: createMockParams('idea-123') });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.idea.status).toBe('rejected');
    });

    it('should accept used status', async () => {
      const mockIdea = {
        id: 'idea-123',
        status: 'used',
      };
      vi.mocked(updateIdeaStatus).mockResolvedValue(mockIdea as never);

      const { PATCH } = await import('@/app/api/ideas/[id]/route');
      const request = createMockRequest({
        method: 'PATCH',
        body: { status: 'used' },
      });

      const response = await PATCH(request, { params: createMockParams('idea-123') });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.idea.status).toBe('used');
    });

    it('should return 400 if status is missing (Zod validation)', async () => {
      const { PATCH } = await import('@/app/api/ideas/[id]/route');
      const request = createMockRequest({
        method: 'PATCH',
        body: {},
      });

      const response = await PATCH(request, { params: createMockParams('idea-123') });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request');
    });

    it('should return 400 if status is invalid (Zod validation)', async () => {
      const { PATCH } = await import('@/app/api/ideas/[id]/route');
      const request = createMockRequest({
        method: 'PATCH',
        body: { status: 'invalid_status' },
      });

      const response = await PATCH(request, { params: createMockParams('idea-123') });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request');
    });

    it('should return 500 on database error', async () => {
      vi.mocked(updateIdeaStatus).mockRejectedValue(new Error('Database error'));

      const { PATCH } = await import('@/app/api/ideas/[id]/route');
      const request = createMockRequest({
        method: 'PATCH',
        body: { status: 'accepted' },
      });

      const response = await PATCH(request, { params: createMockParams('idea-123') });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update idea');
    });
  });
});

describe('Creators API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/creators - Get Creators', () => {
    it('should return creators for user', async () => {
      const mockCreators = [
        { id: 'creator-1', xHandle: '@test1', isActive: true },
        { id: 'creator-2', xHandle: '@test2', isActive: true },
      ];
      vi.mocked(getActiveCreators).mockResolvedValue(mockCreators as never);

      const { GET } = await import('@/app/api/creators/route');
      const request = createMockRequest({
        searchParams: { userId: 'user-123' },
        url: 'http://localhost:3000/api/creators',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.creators).toHaveLength(2);
      expect(getActiveCreators).toHaveBeenCalledWith('user-123');
    });

    it('should return 400 if userId is missing', async () => {
      const { GET } = await import('@/app/api/creators/route');
      const request = createMockRequest({
        url: 'http://localhost:3000/api/creators',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('userId is required');
    });

    it('should return empty array if no creators', async () => {
      vi.mocked(getActiveCreators).mockResolvedValue([] as never);

      const { GET } = await import('@/app/api/creators/route');
      const request = createMockRequest({
        searchParams: { userId: 'user-123' },
        url: 'http://localhost:3000/api/creators',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.creators).toHaveLength(0);
      expect(data.count).toBe(0);
    });

    it('should return 500 on database error', async () => {
      vi.mocked(getActiveCreators).mockRejectedValue(new Error('Database error'));

      const { GET } = await import('@/app/api/creators/route');
      const request = createMockRequest({
        searchParams: { userId: 'user-123' },
        url: 'http://localhost:3000/api/creators',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch creators');
    });
  });

  describe('POST /api/creators - Add Creator', () => {
    it('should add creator successfully', async () => {
      const mockCreator = {
        id: 'creator-123',
        xHandle: '@newcreator',
        isActive: true,
      };
      vi.mocked(addCreator).mockResolvedValue(mockCreator as never);

      const { POST } = await import('@/app/api/creators/route');
      const request = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          xHandle: '@newcreator',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.creator.xHandle).toBe('@newcreator');
      expect(addCreator).toHaveBeenCalledWith('user-123', '@newcreator');
    });

    it('should normalize handle without @ prefix', async () => {
      const mockCreator = {
        id: 'creator-123',
        xHandle: '@newcreator',
        isActive: true,
      };
      vi.mocked(addCreator).mockResolvedValue(mockCreator as never);

      const { POST } = await import('@/app/api/creators/route');
      const request = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          xHandle: 'newcreator', // Without @
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(addCreator).toHaveBeenCalledWith('user-123', '@newcreator');
    });

    it('should return 400 if required fields are missing', async () => {
      const { POST } = await import('@/app/api/creators/route');
      const request = createMockRequest({
        method: 'POST',
        body: { userId: 'user-123' }, // Missing xHandle
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request');
    });

    it('should return 400 for invalid handle format', async () => {
      const { POST } = await import('@/app/api/creators/route');
      const request = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          xHandle: 'invalid handle with spaces',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request');
    });

    it('should return 500 on database error', async () => {
      vi.mocked(addCreator).mockRejectedValue(new Error('Database error'));

      const { POST } = await import('@/app/api/creators/route');
      const request = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          xHandle: '@newcreator',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to add creator');
    });
  });

  describe('PATCH /api/creators/[id]/toggle - Toggle Creator Active', () => {
    it('should toggle creator active status', async () => {
      const mockCreator = {
        id: 'creator-123',
        xHandle: '@test',
        isActive: false, // Toggled from true to false
      };
      vi.mocked(toggleCreatorStatus).mockResolvedValue(mockCreator as never);

      const { PATCH } = await import('@/app/api/creators/[id]/toggle/route');
      const request = createMockRequest({ method: 'PATCH' });

      const response = await PATCH(request, { params: createMockParams('creator-123') });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.creator.isActive).toBe(false);
      expect(toggleCreatorStatus).toHaveBeenCalledWith('creator-123');
    });

    it('should return 404 if creator not found', async () => {
      vi.mocked(toggleCreatorStatus).mockRejectedValue(new Error('Creator not found'));

      const { PATCH } = await import('@/app/api/creators/[id]/toggle/route');
      const request = createMockRequest({ method: 'PATCH' });

      const response = await PATCH(request, { params: createMockParams('nonexistent') });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Creator not found');
    });

    it('should return 500 on other database errors', async () => {
      vi.mocked(toggleCreatorStatus).mockRejectedValue(new Error('Database error'));

      const { PATCH } = await import('@/app/api/creators/[id]/toggle/route');
      const request = createMockRequest({ method: 'PATCH' });

      const response = await PATCH(request, { params: createMockParams('creator-123') });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to toggle creator');
    });
  });
});

describe('API Route Smoke Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('all draft routes should be defined', async () => {
    const draftRoute = await import('@/app/api/drafts/[id]/route');
    const postRoute = await import('@/app/api/drafts/[id]/post/route');

    expect(draftRoute.PATCH).toBeDefined();
    expect(draftRoute.DELETE).toBeDefined();
    expect(postRoute.POST).toBeDefined();
  });

  it('all post routes should be defined', async () => {
    const postsRoute = await import('@/app/api/posts/route');
    const markGoodRoute = await import('@/app/api/posts/[id]/mark-good/route');

    expect(postsRoute.GET).toBeDefined();
    expect(postsRoute.POST).toBeDefined();
    expect(markGoodRoute.PATCH).toBeDefined();
  });

  it('all idea routes should be defined', async () => {
    const ideasRoute = await import('@/app/api/ideas/route');
    const ideaRoute = await import('@/app/api/ideas/[id]/route');
    const generateRoute = await import('@/app/api/ideas/generate/route');

    expect(ideasRoute.GET).toBeDefined();
    expect(ideaRoute.PATCH).toBeDefined();
    expect(generateRoute.POST).toBeDefined();
  });

  it('all creator routes should be defined', async () => {
    const creatorsRoute = await import('@/app/api/creators/route');
    const toggleRoute = await import('@/app/api/creators/[id]/toggle/route');

    expect(creatorsRoute.GET).toBeDefined();
    expect(creatorsRoute.POST).toBeDefined();
    expect(toggleRoute.PATCH).toBeDefined();
  });

  it('auth routes should be defined', async () => {
    const loginRoute = await import('@/app/api/auth/login/route');
    const signupRoute = await import('@/app/api/auth/signup/route');

    expect(loginRoute.POST).toBeDefined();
    expect(signupRoute.POST).toBeDefined();
  });

  it('tone config routes should be defined', async () => {
    const toneRoute = await import('@/app/api/tone-config/route');

    expect(toneRoute.GET).toBeDefined();
    expect(toneRoute.PATCH).toBeDefined();
  });

  it('outline generate route should be defined', async () => {
    const outlineRoute = await import('@/app/api/outlines/generate/route');

    expect(outlineRoute.POST).toBeDefined();
  });
});
