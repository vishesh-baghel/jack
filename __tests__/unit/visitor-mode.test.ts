/**
 * Unit tests for Visitor Mode functionality
 * Tests database helpers, API routes, and component behavior
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Prisma client
vi.mock('@/lib/db/client', () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock auth utilities
vi.mock('@/lib/auth', () => ({
  getCurrentUserId: vi.fn(),
  blockGuestWrite: vi.fn(),
}));

// Mock constants
vi.mock('@/lib/auth-client', () => ({
  GUEST_USER_EMAIL: 'guest@localhost',
}));

describe('Visitor Mode - Database Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOwnerUser', () => {
    it('should return owner user with allowVisitorMode field', async () => {
      const { prisma } = await import('@/lib/db/client');
      const { getOwnerUser } = await import('@/lib/db/users');

      const mockOwner = {
        id: 'owner-1',
        email: 'owner@example.com',
        name: 'Owner',
        allowVisitorMode: true,
      };

      vi.mocked(prisma.user.findFirst).mockResolvedValue(mockOwner as never);

      const result = await getOwnerUser();

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { isOwner: true },
        select: {
          id: true,
          email: true,
          name: true,
          allowVisitorMode: true,
        },
      });
      expect(result).toEqual(mockOwner);
    });

    it('should return null if no owner exists', async () => {
      const { prisma } = await import('@/lib/db/client');
      const { getOwnerUser } = await import('@/lib/db/users');

      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      const result = await getOwnerUser();

      expect(result).toBeNull();
    });
  });

  describe('getGuestUser', () => {
    it('should return guest user by email', async () => {
      const { prisma } = await import('@/lib/db/client');
      const { getGuestUser } = await import('@/lib/db/users');

      const mockGuest = {
        id: 'guest-1',
        email: 'guest@localhost',
        name: 'Guest User',
        isGuest: true,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockGuest as never);

      const result = await getGuestUser();

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'guest@localhost' },
        select: {
          id: true,
          email: true,
          name: true,
          isGuest: true,
        },
      });
      expect(result).toEqual(mockGuest);
    });

    it('should return null if guest user does not exist', async () => {
      const { prisma } = await import('@/lib/db/client');
      const { getGuestUser } = await import('@/lib/db/users');

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await getGuestUser();

      expect(result).toBeNull();
    });
  });

  describe('createGuestUser', () => {
    it('should create guest user with correct data', async () => {
      const { prisma } = await import('@/lib/db/client');
      const { createGuestUser } = await import('@/lib/db/users');

      const mockGuest = {
        id: 'guest-1',
        email: 'guest@localhost',
        name: 'Guest User',
        isGuest: true,
      };

      vi.mocked(prisma.user.create).mockResolvedValue(mockGuest as never);

      const result = await createGuestUser();

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'guest@localhost',
          name: 'Guest User',
          isGuest: true,
        },
      });
      expect(result).toEqual(mockGuest);
    });
  });

  describe('deleteGuestUser', () => {
    it('should delete guest user by email', async () => {
      const { prisma } = await import('@/lib/db/client');
      const { deleteGuestUser } = await import('@/lib/db/users');

      const mockGuest = {
        id: 'guest-1',
        email: 'guest@localhost',
      };

      vi.mocked(prisma.user.delete).mockResolvedValue(mockGuest as never);

      const result = await deleteGuestUser();

      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { email: 'guest@localhost' },
      });
      expect(result).toEqual(mockGuest);
    });
  });

  describe('toggleVisitorMode', () => {
    it('should enable visitor mode and create guest user', async () => {
      const { prisma } = await import('@/lib/db/client');
      const { toggleVisitorMode } = await import('@/lib/db/users');

      const mockUpdatedOwner = {
        id: 'owner-1',
        allowVisitorMode: true,
      };

      // Mock update call
      vi.mocked(prisma.user.update).mockResolvedValue(mockUpdatedOwner as never);
      // Mock guest check (doesn't exist)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      // Mock create guest
      const mockGuest = { id: 'guest-1', email: 'guest@localhost' };
      vi.mocked(prisma.user.create).mockResolvedValue(mockGuest as never);

      const result = await toggleVisitorMode('owner-1', true);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'owner-1' },
        data: { allowVisitorMode: true },
      });
      expect(prisma.user.create).toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedOwner);
    });

    it('should disable visitor mode and delete guest user', async () => {
      const { prisma } = await import('@/lib/db/client');
      const { toggleVisitorMode } = await import('@/lib/db/users');

      const mockUpdatedOwner = {
        id: 'owner-1',
        allowVisitorMode: false,
      };

      // Mock update call
      vi.mocked(prisma.user.update).mockResolvedValue(mockUpdatedOwner as never);
      // Mock guest check (exists)
      const mockGuest = { id: 'guest-1', email: 'guest@localhost' };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockGuest as never);
      // Mock delete guest
      vi.mocked(prisma.user.delete).mockResolvedValue(mockGuest as never);

      const result = await toggleVisitorMode('owner-1', false);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'owner-1' },
        data: { allowVisitorMode: false },
      });
      expect(prisma.user.delete).toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedOwner);
    });

    it('should not create guest user if already exists when enabling', async () => {
      const { prisma } = await import('@/lib/db/client');
      const { toggleVisitorMode } = await import('@/lib/db/users');

      const mockUpdatedOwner = { id: 'owner-1', allowVisitorMode: true };
      const mockGuest = { id: 'guest-1', email: 'guest@localhost' };

      vi.mocked(prisma.user.update).mockResolvedValue(mockUpdatedOwner as never);
      // Guest already exists
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockGuest as never);

      await toggleVisitorMode('owner-1', true);

      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should not delete guest user if not exists when disabling', async () => {
      const { prisma } = await import('@/lib/db/client');
      const { toggleVisitorMode } = await import('@/lib/db/users');

      const mockUpdatedOwner = { id: 'owner-1', allowVisitorMode: false };

      vi.mocked(prisma.user.update).mockResolvedValue(mockUpdatedOwner as never);
      // Guest doesn't exist
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await toggleVisitorMode('owner-1', false);

      expect(prisma.user.delete).not.toHaveBeenCalled();
    });
  });

  describe('isVisitorModeEnabled', () => {
    it('should return true when owner allows visitor mode', async () => {
      const { prisma } = await import('@/lib/db/client');
      const { isVisitorModeEnabled } = await import('@/lib/db/users');

      const mockOwner = {
        id: 'owner-1',
        allowVisitorMode: true,
      };

      vi.mocked(prisma.user.findFirst).mockResolvedValue(mockOwner as never);

      const result = await isVisitorModeEnabled();

      expect(result).toBe(true);
    });

    it('should return false when owner disallows visitor mode', async () => {
      const { prisma } = await import('@/lib/db/client');
      const { isVisitorModeEnabled } = await import('@/lib/db/users');

      const mockOwner = {
        id: 'owner-1',
        allowVisitorMode: false,
      };

      vi.mocked(prisma.user.findFirst).mockResolvedValue(mockOwner as never);

      const result = await isVisitorModeEnabled();

      expect(result).toBe(false);
    });

    it('should return false when no owner exists', async () => {
      const { prisma } = await import('@/lib/db/client');
      const { isVisitorModeEnabled } = await import('@/lib/db/users');

      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      const result = await isVisitorModeEnabled();

      expect(result).toBe(false);
    });
  });
});

describe('Visitor Mode - API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to create mock NextRequest
  const createMockRequest = (options: {
    method?: string;
    body?: object;
    url?: string;
  } = {}) => {
    const { method = 'GET', body, url = 'http://localhost:3000/api/settings/visitor-mode' } = options;

    return {
      method,
      url,
      json: vi.fn().mockResolvedValue(body || {}),
    } as unknown as NextRequest;
  };

  describe('GET /api/settings/visitor-mode', () => {
    it('should return visitor mode status', async () => {
      const { prisma } = await import('@/lib/db/client');

      const mockOwner = {
        id: 'owner-1',
        allowVisitorMode: true,
      };

      vi.mocked(prisma.user.findFirst).mockResolvedValue(mockOwner as never);

      const { GET } = await import('@/app/api/settings/visitor-mode/route');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.enabled).toBe(true);
    });

    it('should return false when visitor mode is disabled', async () => {
      const { prisma } = await import('@/lib/db/client');

      const mockOwner = {
        id: 'owner-1',
        allowVisitorMode: false,
      };

      vi.mocked(prisma.user.findFirst).mockResolvedValue(mockOwner as never);

      const { GET } = await import('@/app/api/settings/visitor-mode/route');
      const response = await GET();
      const data = await response.json();

      expect(data.enabled).toBe(false);
    });
  });

  describe('PATCH /api/settings/visitor-mode', () => {
    it('should toggle visitor mode when user is owner', async () => {
      const { getCurrentUserId, blockGuestWrite } = await import('@/lib/auth');
      const { prisma } = await import('@/lib/db/client');

      vi.mocked(blockGuestWrite).mockResolvedValue(null);
      vi.mocked(getCurrentUserId).mockResolvedValue('owner-1');

      const mockOwner = { id: 'owner-1', isOwner: true };
      const mockUpdatedOwner = { id: 'owner-1', allowVisitorMode: true };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockOwner as never);
      vi.mocked(prisma.user.update).mockResolvedValue(mockUpdatedOwner as never);
      vi.mocked(prisma.user.create).mockResolvedValue({ id: 'guest-1' } as never);

      const { PATCH } = await import('@/app/api/settings/visitor-mode/route');
      const request = createMockRequest({
        method: 'PATCH',
        body: { enabled: true },
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.enabled).toBe(true);
    });

    it('should reject when user is not owner', async () => {
      const { getCurrentUserId, blockGuestWrite } = await import('@/lib/auth');
      const { prisma } = await import('@/lib/db/client');

      vi.mocked(blockGuestWrite).mockResolvedValue(null);
      vi.mocked(getCurrentUserId).mockResolvedValue('user-1');

      const mockUser = { id: 'user-1', isOwner: false };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never);

      const { PATCH } = await import('@/app/api/settings/visitor-mode/route');
      const request = createMockRequest({
        method: 'PATCH',
        body: { enabled: true },
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('owner');
    });

    it('should reject when user is not authenticated', async () => {
      const { getCurrentUserId, blockGuestWrite } = await import('@/lib/auth');

      vi.mocked(blockGuestWrite).mockResolvedValue(null);
      vi.mocked(getCurrentUserId).mockResolvedValue(null);

      const { PATCH } = await import('@/app/api/settings/visitor-mode/route');
      const request = createMockRequest({
        method: 'PATCH',
        body: { enabled: true },
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
    });

    it('should block guest users from toggling', async () => {
      const { blockGuestWrite } = await import('@/lib/auth');

      const mockGuestBlock = new Response(
        JSON.stringify({ error: 'Write operations are not allowed in guest mode' }),
        { status: 403 }
      );

      vi.mocked(blockGuestWrite).mockResolvedValue(mockGuestBlock);

      const { PATCH } = await import('@/app/api/settings/visitor-mode/route');
      const request = createMockRequest({
        method: 'PATCH',
        body: { enabled: true },
      });

      const response = await PATCH(request);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/auth/guest', () => {
    it('should allow guest login when visitor mode is enabled', async () => {
      const { prisma } = await import('@/lib/db/client');

      const mockOwner = {
        id: 'owner-1',
        allowVisitorMode: true,
      };

      const mockGuest = {
        id: 'guest-1',
        email: 'guest@localhost',
        name: 'Guest User',
        isGuest: true,
      };

      vi.mocked(prisma.user.findFirst).mockResolvedValue(mockOwner as never);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockGuest as never);

      const { POST } = await import('@/app/api/auth/guest/route');
      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.isGuest).toBe(true);
      expect(data.demoUserId).toBe('owner-1');
    });

    it('should reject guest login when visitor mode is disabled', async () => {
      const { prisma } = await import('@/lib/db/client');

      const mockOwner = {
        id: 'owner-1',
        allowVisitorMode: false,
      };

      vi.mocked(prisma.user.findFirst).mockResolvedValue(mockOwner as never);

      const { POST } = await import('@/app/api/auth/guest/route');
      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('disabled');
    });

    it('should return 503 when no owner exists', async () => {
      const { prisma } = await import('@/lib/db/client');

      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      const { POST } = await import('@/app/api/auth/guest/route');
      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toContain('not configured');
    });

    it('should create guest user if not exists when visitor mode is enabled', async () => {
      const { prisma } = await import('@/lib/db/client');

      const mockOwner = {
        id: 'owner-1',
        allowVisitorMode: true,
      };

      const mockNewGuest = {
        id: 'guest-1',
        email: 'guest@localhost',
        name: 'Guest User',
        isGuest: true,
      };

      vi.mocked(prisma.user.findFirst).mockResolvedValue(mockOwner as never);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null); // Guest doesn't exist
      vi.mocked(prisma.user.create).mockResolvedValue(mockNewGuest as never);

      const { POST } = await import('@/app/api/auth/guest/route');
      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(prisma.user.create).toHaveBeenCalled();
      expect(data.user.id).toBe('guest-1');
    });
  });
});
