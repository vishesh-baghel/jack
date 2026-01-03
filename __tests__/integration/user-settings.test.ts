/**
 * User Settings API Endpoint Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH } from '@/app/api/users/[id]/settings/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  blockGuestWrite: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/db/client', () => ({
  prisma: {
    user: {
      update: vi.fn(),
    },
  },
}));

import { blockGuestWrite } from '@/lib/auth';
import { prisma } from '@/lib/db/client';

describe('PATCH /api/users/[id]/settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update user daily tweet limit', async () => {
    const mockUser = {
      id: 'user-123',
      dailyTweetLimit: 100,
    };

    vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

    const request = new NextRequest('http://localhost/api/users/user-123/settings', {
      method: 'PATCH',
      body: JSON.stringify({ dailyTweetLimit: 100 }),
    });

    const params = Promise.resolve({ id: 'user-123' });
    const response = await PATCH(request, { params });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.user.dailyTweetLimit).toBe(100);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      data: { dailyTweetLimit: 100 },
      select: {
        id: true,
        dailyTweetLimit: true,
      },
    });
  });

  it('should reject daily limit below minimum', async () => {
    const request = new NextRequest('http://localhost/api/users/user-123/settings', {
      method: 'PATCH',
      body: JSON.stringify({ dailyTweetLimit: 0 }), // Invalid: min is 1
    });

    const params = Promise.resolve({ id: 'user-123' });
    const response = await PATCH(request, { params });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Invalid request data');
  });

  it('should reject daily limit above maximum', async () => {
    const request = new NextRequest('http://localhost/api/users/user-123/settings', {
      method: 'PATCH',
      body: JSON.stringify({ dailyTweetLimit: 1001 }), // Invalid: max is 1000
    });

    const params = Promise.resolve({ id: 'user-123' });
    const response = await PATCH(request, { params });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Invalid request data');
  });

  it('should reject non-integer daily limit', async () => {
    const request = new NextRequest('http://localhost/api/users/user-123/settings', {
      method: 'PATCH',
      body: JSON.stringify({ dailyTweetLimit: 50.5 }), // Invalid: must be integer
    });

    const params = Promise.resolve({ id: 'user-123' });
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

    const request = new NextRequest('http://localhost/api/users/user-123/settings', {
      method: 'PATCH',
      body: JSON.stringify({ dailyTweetLimit: 100 }),
    });

    const params = Promise.resolve({ id: 'user-123' });
    const response = await PATCH(request, { params });

    expect(response.status).toBe(403);
  });

  it('should handle database errors', async () => {
    vi.mocked(prisma.user.update).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/users/user-123/settings', {
      method: 'PATCH',
      body: JSON.stringify({ dailyTweetLimit: 100 }),
    });

    const params = Promise.resolve({ id: 'user-123' });
    const response = await PATCH(request, { params });

    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.error).toBe('Failed to update user settings');
  });

  it('should accept valid daily limit at boundaries', async () => {
    const mockUser = {
      id: 'user-123',
      dailyTweetLimit: 1,
    };

    vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

    // Test minimum value
    let request = new NextRequest('http://localhost/api/users/user-123/settings', {
      method: 'PATCH',
      body: JSON.stringify({ dailyTweetLimit: 1 }),
    });

    let params = Promise.resolve({ id: 'user-123' });
    let response = await PATCH(request, { params });

    expect(response.status).toBe(200);

    // Test maximum value
    mockUser.dailyTweetLimit = 1000;
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

    request = new NextRequest('http://localhost/api/users/user-123/settings', {
      method: 'PATCH',
      body: JSON.stringify({ dailyTweetLimit: 1000 }),
    });

    params = Promise.resolve({ id: 'user-123' });
    response = await PATCH(request, { params });

    expect(response.status).toBe(200);
  });

  it('should only return id and dailyTweetLimit in response', async () => {
    const mockUser = {
      id: 'user-123',
      dailyTweetLimit: 75,
    };

    vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

    const request = new NextRequest('http://localhost/api/users/user-123/settings', {
      method: 'PATCH',
      body: JSON.stringify({ dailyTweetLimit: 75 }),
    });

    const params = Promise.resolve({ id: 'user-123' });
    const response = await PATCH(request, { params });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.user).toEqual({
      id: 'user-123',
      dailyTweetLimit: 75,
    });
  });
});
