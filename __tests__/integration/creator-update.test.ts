/**
 * Creator Update API Endpoint Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH } from '@/app/api/creators/[id]/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  blockGuestWrite: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/db/client', () => ({
  prisma: {
    creator: {
      update: vi.fn(),
    },
  },
}));

import { blockGuestWrite } from '@/lib/auth';
import { prisma } from '@/lib/db/client';

describe('PATCH /api/creators/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update creator tweet count', async () => {
    const mockCreator = {
      id: 'creator-123',
      tweetCount: 25,
      xHandle: '@testuser',
      isActive: true,
    };

    vi.mocked(prisma.creator.update).mockResolvedValue(mockCreator as any);

    const request = new NextRequest('http://localhost/api/creators/creator-123', {
      method: 'PATCH',
      body: JSON.stringify({ tweetCount: 25 }),
    });

    const params = Promise.resolve({ id: 'creator-123' });
    const response = await PATCH(request, { params });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.creator.tweetCount).toBe(25);
    expect(prisma.creator.update).toHaveBeenCalledWith({
      where: { id: 'creator-123' },
      data: { tweetCount: 25 },
    });
  });

  it('should reject tweet count below minimum', async () => {
    const request = new NextRequest('http://localhost/api/creators/creator-123', {
      method: 'PATCH',
      body: JSON.stringify({ tweetCount: 0 }), // Invalid: min is 1
    });

    const params = Promise.resolve({ id: 'creator-123' });
    const response = await PATCH(request, { params });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Invalid request data');
  });

  it('should reject tweet count above maximum', async () => {
    const request = new NextRequest('http://localhost/api/creators/creator-123', {
      method: 'PATCH',
      body: JSON.stringify({ tweetCount: 101 }), // Invalid: max is 100
    });

    const params = Promise.resolve({ id: 'creator-123' });
    const response = await PATCH(request, { params });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Invalid request data');
  });

  it('should reject non-integer tweet count', async () => {
    const request = new NextRequest('http://localhost/api/creators/creator-123', {
      method: 'PATCH',
      body: JSON.stringify({ tweetCount: 10.5 }), // Invalid: must be integer
    });

    const params = Promise.resolve({ id: 'creator-123' });
    const response = await PATCH(request, { params });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Invalid request data');
  });

  it('should block guest users', async () => {
    vi.mocked(blockGuestWrite).mockResolvedValueOnce({
      json: () => Promise.resolve({ error: 'Unauthorized' }),
      status: 403,
    } as any);

    const request = new NextRequest('http://localhost/api/creators/creator-123', {
      method: 'PATCH',
      body: JSON.stringify({ tweetCount: 25 }),
    });

    const params = Promise.resolve({ id: 'creator-123' });
    const response = await PATCH(request, { params });

    expect(response.status).toBe(403);
  });

  it('should handle database errors', async () => {
    vi.mocked(prisma.creator.update).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/creators/creator-123', {
      method: 'PATCH',
      body: JSON.stringify({ tweetCount: 25 }),
    });

    const params = Promise.resolve({ id: 'creator-123' });
    const response = await PATCH(request, { params });

    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.error).toBe('Failed to update creator');
  });

  it('should accept valid tweet count at boundaries', async () => {
    const mockCreator = {
      id: 'creator-123',
      tweetCount: 1,
      xHandle: '@testuser',
    };

    vi.mocked(prisma.creator.update).mockResolvedValue(mockCreator as any);

    // Test minimum value
    let request = new NextRequest('http://localhost/api/creators/creator-123', {
      method: 'PATCH',
      body: JSON.stringify({ tweetCount: 1 }),
    });

    let params = Promise.resolve({ id: 'creator-123' });
    let response = await PATCH(request, { params });

    expect(response.status).toBe(200);

    // Test maximum value
    mockCreator.tweetCount = 100;
    vi.mocked(prisma.creator.update).mockResolvedValue(mockCreator as any);

    request = new NextRequest('http://localhost/api/creators/creator-123', {
      method: 'PATCH',
      body: JSON.stringify({ tweetCount: 100 }),
    });

    params = Promise.resolve({ id: 'creator-123' });
    response = await PATCH(request, { params });

    expect(response.status).toBe(200);
  });
});
