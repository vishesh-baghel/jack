/**
 * Unit tests for Tone Config API Routes
 * Tests GET and PATCH endpoints with custom rules persistence
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock auth functions
vi.mock('@/lib/auth', () => ({
  getCurrentUserId: vi.fn(),
  blockGuestWrite: vi.fn(),
  getDataUserId: vi.fn(),
  isGuestUser: vi.fn(),
}));

// Mock database functions
vi.mock('@/lib/db/tone-config', () => ({
  getOrCreateToneConfig: vi.fn(),
  updateTonePreferences: vi.fn(),
  updateCustomRules: vi.fn(),
}));

import { blockGuestWrite } from '@/lib/auth';
import { getOrCreateToneConfig, updateTonePreferences, updateCustomRules } from '@/lib/db/tone-config';

// Helper to create mock NextRequest
const createMockRequest = (options: {
  method?: string;
  body?: object;
  searchParams?: Record<string, string>;
  url?: string;
} = {}) => {
  const { method = 'GET', body, searchParams = {}, url = 'http://localhost:3000/api/tone-config' } = options;

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

describe('Tone Config API Routes', () => {
  const mockUserId = 'user-123';
  const mockToneConfig = {
    id: 'config-123',
    userId: mockUserId,
    lowercase: true,
    noEmojis: true,
    noHashtags: true,
    showFailures: true,
    includeNumbers: true,
    customRules: ['always start with a problem', 'use storytelling'],
    learnedPatterns: {
      avgPostLength: 280,
      commonPhrases: ['here\'s how'],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(blockGuestWrite).mockResolvedValue(null);
  });

  describe('GET /api/tone-config', () => {
    it('should return tone config for valid userId', async () => {
      vi.mocked(getOrCreateToneConfig).mockResolvedValue(mockToneConfig as never);

      const { GET } = await import('@/app/api/tone-config/route');
      const request = createMockRequest({
        searchParams: { userId: mockUserId },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.config.id).toBe(mockToneConfig.id);
      expect(data.config.userId).toBe(mockToneConfig.userId);
      expect(data.config.customRules).toEqual(mockToneConfig.customRules);
      expect(getOrCreateToneConfig).toHaveBeenCalledWith(mockUserId);
    });

    it('should return 400 if userId is missing', async () => {
      const { GET } = await import('@/app/api/tone-config/route');
      const request = createMockRequest();

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('userId is required');
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(getOrCreateToneConfig).mockRejectedValue(new Error('Database error'));

      const { GET } = await import('@/app/api/tone-config/route');
      const request = createMockRequest({
        searchParams: { userId: mockUserId },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch tone config');
    });

    it('should fetch config with empty customRules if none exist', async () => {
      const configWithoutRules = {
        ...mockToneConfig,
        customRules: [],
      };
      vi.mocked(getOrCreateToneConfig).mockResolvedValue(configWithoutRules as never);

      const { GET } = await import('@/app/api/tone-config/route');
      const request = createMockRequest({
        searchParams: { userId: mockUserId },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.config.customRules).toEqual([]);
    });
  });

  describe('PATCH /api/tone-config', () => {
    it('should update custom rules successfully', async () => {
      const newRules = ['new rule 1', 'new rule 2', 'new rule 3'];
      const updatedConfig = {
        ...mockToneConfig,
        customRules: newRules,
      };

      vi.mocked(updateCustomRules).mockResolvedValue(updatedConfig as never);

      const { PATCH } = await import('@/app/api/tone-config/route');
      const request = createMockRequest({
        method: 'PATCH',
        body: {
          userId: mockUserId,
          customRules: newRules,
        },
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.config.customRules).toEqual(newRules);
      expect(updateCustomRules).toHaveBeenCalledWith(mockUserId, newRules);
    });

    it('should update preferences successfully', async () => {
      const newPreferences = {
        lowercase: false,
        noEmojis: false,
      };
      const updatedConfig = {
        ...mockToneConfig,
        ...newPreferences,
      };

      vi.mocked(updateTonePreferences).mockResolvedValue(updatedConfig as never);

      const { PATCH } = await import('@/app/api/tone-config/route');
      const request = createMockRequest({
        method: 'PATCH',
        body: {
          userId: mockUserId,
          preferences: newPreferences,
        },
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.config.lowercase).toBe(false);
      expect(data.config.noEmojis).toBe(false);
      expect(updateTonePreferences).toHaveBeenCalledWith(mockUserId, newPreferences);
    });

    it('should update both preferences and custom rules', async () => {
      const newPreferences = { lowercase: false };
      const newRules = ['updated rule'];

      vi.mocked(updateTonePreferences).mockResolvedValue({
        ...mockToneConfig,
        lowercase: false,
      } as never);
      vi.mocked(updateCustomRules).mockResolvedValue({
        ...mockToneConfig,
        lowercase: false,
        customRules: newRules,
      } as never);

      const { PATCH } = await import('@/app/api/tone-config/route');
      const request = createMockRequest({
        method: 'PATCH',
        body: {
          userId: mockUserId,
          preferences: newPreferences,
          customRules: newRules,
        },
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(updateTonePreferences).toHaveBeenCalledWith(mockUserId, newPreferences);
      expect(updateCustomRules).toHaveBeenCalledWith(mockUserId, newRules);
    });

    it('should allow empty custom rules array', async () => {
      const emptyRules: string[] = [];
      const updatedConfig = {
        ...mockToneConfig,
        customRules: emptyRules,
      };

      vi.mocked(updateCustomRules).mockResolvedValue(updatedConfig as never);

      const { PATCH } = await import('@/app/api/tone-config/route');
      const request = createMockRequest({
        method: 'PATCH',
        body: {
          userId: mockUserId,
          customRules: emptyRules,
        },
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.config.customRules).toEqual([]);
      expect(updateCustomRules).toHaveBeenCalledWith(mockUserId, emptyRules);
    });

    it('should block guest write operations', async () => {
      const guestBlockResponse = {
        status: 403,
        json: async () => ({ error: 'Guests cannot modify data' }),
      };
      vi.mocked(blockGuestWrite).mockResolvedValue(guestBlockResponse as never);

      const { PATCH } = await import('@/app/api/tone-config/route');
      const request = createMockRequest({
        method: 'PATCH',
        body: {
          userId: mockUserId,
          customRules: ['new rule'],
        },
      });

      const response = await PATCH(request);

      expect(response).toBe(guestBlockResponse);
      expect(updateCustomRules).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid request body', async () => {
      const { PATCH } = await import('@/app/api/tone-config/route');
      const request = createMockRequest({
        method: 'PATCH',
        body: {
          // Missing userId
          customRules: ['new rule'],
        },
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request');
    });

    it('should handle database errors during update', async () => {
      vi.mocked(updateCustomRules).mockRejectedValue(new Error('Database error'));

      const { PATCH } = await import('@/app/api/tone-config/route');
      const request = createMockRequest({
        method: 'PATCH',
        body: {
          userId: mockUserId,
          customRules: ['new rule'],
        },
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update tone config');
    });

    it('should get current config if neither preferences nor custom rules are provided', async () => {
      vi.mocked(getOrCreateToneConfig).mockResolvedValue(mockToneConfig as never);

      const { PATCH } = await import('@/app/api/tone-config/route');
      const request = createMockRequest({
        method: 'PATCH',
        body: {
          userId: mockUserId,
        },
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.config.userId).toBe(mockUserId);
      expect(data.config.customRules).toEqual(mockToneConfig.customRules);
      expect(getOrCreateToneConfig).toHaveBeenCalledWith(mockUserId);
    });

    it('should persist custom rules correctly on multiple updates', async () => {
      // First update
      const firstRules = ['rule 1', 'rule 2'];
      vi.mocked(updateCustomRules).mockResolvedValueOnce({
        ...mockToneConfig,
        customRules: firstRules,
      } as never);

      const { PATCH } = await import('@/app/api/tone-config/route');
      const request1 = createMockRequest({
        method: 'PATCH',
        body: {
          userId: mockUserId,
          customRules: firstRules,
        },
      });

      await PATCH(request1);

      // Second update
      const secondRules = ['rule 1', 'rule 2', 'rule 3'];
      vi.mocked(updateCustomRules).mockResolvedValueOnce({
        ...mockToneConfig,
        customRules: secondRules,
      } as never);

      const request2 = createMockRequest({
        method: 'PATCH',
        body: {
          userId: mockUserId,
          customRules: secondRules,
        },
      });

      const response2 = await PATCH(request2);
      const data2 = await response2.json();

      expect(data2.config.customRules).toEqual(secondRules);
      expect(updateCustomRules).toHaveBeenCalledTimes(2);
    });
  });
});
