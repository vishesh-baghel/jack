/**
 * Integration tests for Visitor Mode end-to-end flow
 * Tests the complete visitor mode workflow from enabling to guest access
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

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

describe('Visitor Mode - Integration Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should complete full enable flow: owner enables -> guest account created -> guest can login', async () => {
    const { prisma } = await import('@/lib/db/client');
    const { getCurrentUserId, blockGuestWrite } = await import('@/lib/auth');

    // Step 1: Owner enables visitor mode in settings
    vi.mocked(blockGuestWrite).mockResolvedValue(null);
    vi.mocked(getCurrentUserId).mockResolvedValue('owner-1');

    const mockOwner = { id: 'owner-1', isOwner: true };
    const mockUpdatedOwner = { id: 'owner-1', allowVisitorMode: true };
    const mockGuest = {
      id: 'guest-1',
      email: 'guest@localhost',
      name: 'Guest User',
      isGuest: true,
    };

    // Mock: Check user is owner
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockOwner as never);
    // Mock: Update owner's allowVisitorMode
    vi.mocked(prisma.user.update).mockResolvedValue(mockUpdatedOwner as never);
    // Mock: Guest doesn't exist, so create it
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null as never);
    vi.mocked(prisma.user.create).mockResolvedValue(mockGuest as never);

    const { PATCH: toggleVisitorMode } = await import('@/app/api/settings/visitor-mode/route');
    const toggleRequest = {
      method: 'PATCH',
      json: vi.fn().mockResolvedValue({ enabled: true }),
    } as never;

    const toggleResponse = await toggleVisitorMode(toggleRequest);
    const toggleData = await toggleResponse.json();

    expect(toggleResponse.status).toBe(200);
    expect(toggleData.success).toBe(true);
    expect(toggleData.enabled).toBe(true);

    // Verify guest account was created
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'guest@localhost',
        name: 'Guest User',
        isGuest: true,
      },
    });

    // Step 2: Guest tries to login
    const mockOwnerForGuest = {
      id: 'owner-1',
      allowVisitorMode: true,
    };

    vi.mocked(prisma.user.findFirst).mockResolvedValue(mockOwnerForGuest as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockGuest as never);

    const { POST: guestLogin } = await import('@/app/api/auth/guest/route');
    const guestResponse = await guestLogin();
    const guestData = await guestResponse.json();

    expect(guestResponse.status).toBe(200);
    expect(guestData.user.isGuest).toBe(true);
    expect(guestData.demoUserId).toBe('owner-1');
  });

  it('should complete full disable flow: owner disables -> guest account deleted -> guest cannot login', async () => {
    const { prisma } = await import('@/lib/db/client');
    const { getCurrentUserId, blockGuestWrite } = await import('@/lib/auth');

    // Step 1: Owner disables visitor mode
    vi.mocked(blockGuestWrite).mockResolvedValue(null);
    vi.mocked(getCurrentUserId).mockResolvedValue('owner-1');

    const mockOwner = { id: 'owner-1', isOwner: true };
    const mockUpdatedOwner = { id: 'owner-1', allowVisitorMode: false };
    const mockGuest = {
      id: 'guest-1',
      email: 'guest@localhost',
      isGuest: true,
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockOwner as never);
    vi.mocked(prisma.user.update).mockResolvedValue(mockUpdatedOwner as never);
    // Mock: Guest exists, so delete it
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockGuest as never);
    vi.mocked(prisma.user.delete).mockResolvedValue(mockGuest as never);

    const { PATCH: toggleVisitorMode } = await import('@/app/api/settings/visitor-mode/route');
    const toggleRequest = {
      method: 'PATCH',
      json: vi.fn().mockResolvedValue({ enabled: false }),
    } as never;

    const toggleResponse = await toggleVisitorMode(toggleRequest);
    const toggleData = await toggleResponse.json();

    expect(toggleResponse.status).toBe(200);
    expect(toggleData.success).toBe(true);
    expect(toggleData.enabled).toBe(false);

    // Verify guest account was deleted
    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { email: 'guest@localhost' },
    });

    // Step 2: Guest tries to login (should fail)
    const mockOwnerForGuest = {
      id: 'owner-1',
      allowVisitorMode: false,
    };

    vi.mocked(prisma.user.findFirst).mockResolvedValue(mockOwnerForGuest as never);

    const { POST: guestLogin } = await import('@/app/api/auth/guest/route');
    const guestResponse = await guestLogin();
    const guestData = await guestResponse.json();

    expect(guestResponse.status).toBe(403);
    expect(guestData.error).toContain('disabled');
  });

  it('should handle re-enabling after disabling', async () => {
    const { prisma } = await import('@/lib/db/client');
    const { getCurrentUserId, blockGuestWrite } = await import('@/lib/auth');
    const { toggleVisitorMode } = await import('@/lib/db/users');

    vi.mocked(blockGuestWrite).mockResolvedValue(null);
    vi.mocked(getCurrentUserId).mockResolvedValue('owner-1');

    const mockOwner = { id: 'owner-1', isOwner: true };

    // First enable
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockOwner as never);
    vi.mocked(prisma.user.update).mockResolvedValue({ id: 'owner-1', allowVisitorMode: true } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null as never); // Guest doesn't exist
    vi.mocked(prisma.user.create).mockResolvedValue({ id: 'guest-1' } as never);

    await toggleVisitorMode('owner-1', true);

    expect(prisma.user.create).toHaveBeenCalled();

    // Then disable
    vi.mocked(prisma.user.update).mockResolvedValue({ id: 'owner-1', allowVisitorMode: false } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: 'guest-1' } as never); // Guest exists
    vi.mocked(prisma.user.delete).mockResolvedValue({ id: 'guest-1' } as never);

    await toggleVisitorMode('owner-1', false);

    expect(prisma.user.delete).toHaveBeenCalled();

    // Re-enable
    vi.mocked(prisma.user.update).mockResolvedValue({ id: 'owner-1', allowVisitorMode: true } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null as never); // Guest was deleted
    vi.mocked(prisma.user.create).mockResolvedValue({ id: 'guest-2' } as never);

    await toggleVisitorMode('owner-1', true);

    // Should create guest account again
    expect(prisma.user.create).toHaveBeenCalledTimes(2);
  });

  it('should prevent non-owner from toggling visitor mode', async () => {
    const { prisma } = await import('@/lib/db/client');
    const { getCurrentUserId, blockGuestWrite } = await import('@/lib/auth');

    vi.mocked(blockGuestWrite).mockResolvedValue(null);
    vi.mocked(getCurrentUserId).mockResolvedValue('user-1');

    const mockRegularUser = { id: 'user-1', isOwner: false };
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockRegularUser as never);

    const { PATCH: toggleVisitorMode } = await import('@/app/api/settings/visitor-mode/route');
    const request = {
      method: 'PATCH',
      json: vi.fn().mockResolvedValue({ enabled: true }),
    } as never;

    const response = await toggleVisitorMode(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('owner');
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('should prevent guest from toggling visitor mode', async () => {
    const { blockGuestWrite } = await import('@/lib/auth');

    const mockGuestBlock = new Response(
      JSON.stringify({ error: 'Write operations are not allowed in guest mode' }),
      { status: 403 }
    );

    vi.mocked(blockGuestWrite).mockResolvedValue(mockGuestBlock);

    const { PATCH: toggleVisitorMode } = await import('@/app/api/settings/visitor-mode/route');
    const request = {
      method: 'PATCH',
      json: vi.fn().mockResolvedValue({ enabled: true }),
    } as never;

    const response = await toggleVisitorMode(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('guest mode');
  });

  it('should handle idempotent enable operations', async () => {
    const { prisma } = await import('@/lib/db/client');
    const { toggleVisitorMode } = await import('@/lib/db/users');

    // Enable when already enabled with guest user existing
    const mockUpdatedOwner = { id: 'owner-1', allowVisitorMode: true };
    const mockGuest = { id: 'guest-1', email: 'guest@localhost' };

    vi.mocked(prisma.user.update).mockResolvedValue(mockUpdatedOwner as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockGuest as never); // Guest already exists

    await toggleVisitorMode('owner-1', true);

    // Should not create duplicate guest
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('should handle idempotent disable operations', async () => {
    const { prisma } = await import('@/lib/db/client');
    const { toggleVisitorMode } = await import('@/lib/db/users');

    // Disable when already disabled with no guest user
    const mockUpdatedOwner = { id: 'owner-1', allowVisitorMode: false };

    vi.mocked(prisma.user.update).mockResolvedValue(mockUpdatedOwner as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null); // Guest doesn't exist

    await toggleVisitorMode('owner-1', false);

    // Should not try to delete non-existent guest
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  it('should use owner ID as demo user ID for guest sessions', async () => {
    const { prisma } = await import('@/lib/db/client');

    const mockOwner = {
      id: 'owner-123',
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

    const { POST: guestLogin } = await import('@/app/api/auth/guest/route');
    const response = await guestLogin();
    const data = await response.json();

    expect(data.demoUserId).toBe('owner-123');
    expect(data.user.id).toBe('guest-1');
  });

  it('should create guest on-the-fly if visitor mode enabled but guest missing', async () => {
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

    const { POST: guestLogin } = await import('@/app/api/auth/guest/route');
    const response = await guestLogin();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'guest@localhost',
        name: 'Guest User',
        isGuest: true,
      },
    });
    expect(data.user.id).toBe('guest-1');
  });
});
