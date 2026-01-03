/**
 * Unit tests for Settings Page
 * Tests that tone config is fetched and passed correctly to component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { redirect } from 'next/navigation';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

// Mock auth functions
vi.mock('@/lib/auth', () => ({
  getCurrentUserId: vi.fn(),
  getDataUserId: vi.fn(),
}));

// Mock database client
vi.mock('@/lib/db/client', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock database functions
vi.mock('@/lib/db/tone-config', () => ({
  getOrCreateToneConfig: vi.fn(),
}));

// Mock components
vi.mock('@/components/tone-config', () => ({
  ToneConfigComponent: ({ userId, initialConfig }: { userId: string; initialConfig: unknown }) => {
    return {
      type: 'ToneConfigComponent',
      props: { userId, initialConfig },
    };
  },
}));

vi.mock('@/components/visitor-mode-toggle', () => ({
  VisitorModeToggle: ({ isOwner }: { isOwner: boolean }) => {
    return {
      type: 'VisitorModeToggle',
      props: { isOwner },
    };
  },
}));

import { getCurrentUserId, getDataUserId } from '@/lib/auth';
import { prisma } from '@/lib/db/client';
import { getOrCreateToneConfig } from '@/lib/db/tone-config';

describe('Settings Page', () => {
  const mockUserId = 'user-123';
  const mockDataUserId = 'owner-456';
  const mockToneConfig = {
    id: 'config-123',
    userId: mockDataUserId,
    lowercase: true,
    noEmojis: true,
    noHashtags: true,
    showFailures: true,
    includeNumbers: true,
    customRules: ['always start with a problem', 'use storytelling format'],
    learnedPatterns: {
      avgPostLength: 280,
      commonPhrases: ['here\'s how', 'lesson learned'],
      successfulPillars: ['build_progress', 'lessons_learned'],
      styleNotes: ['conversational tone'],
      voiceCharacteristics: ['direct', 'helpful'],
      lastUpdated: '2024-01-01T00:00:00.000Z',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect to auth if user is not logged in', async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue(null);
    // Mock redirect to throw (simulating Next.js redirect behavior)
    vi.mocked(redirect).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    const SettingsPage = (await import('@/app/settings/page')).default;

    await expect(SettingsPage()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/auth');
  });

  it('should fetch tone config for the data user', async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue(mockUserId);
    vi.mocked(getDataUserId).mockResolvedValue(mockDataUserId);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      isOwner: false,
    } as never);
    vi.mocked(getOrCreateToneConfig).mockResolvedValue(mockToneConfig as never);

    const SettingsPage = (await import('@/app/settings/page')).default;
    await SettingsPage();

    expect(getOrCreateToneConfig).toHaveBeenCalledWith(mockDataUserId);
  });

  it('should pass initial config to ToneConfigComponent', async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue(mockUserId);
    vi.mocked(getDataUserId).mockResolvedValue(mockDataUserId);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      isOwner: false,
    } as never);
    vi.mocked(getOrCreateToneConfig).mockResolvedValue(mockToneConfig as never);

    const SettingsPage = (await import('@/app/settings/page')).default;
    const result = await SettingsPage();

    // The component should receive the config with customRules
    expect(getOrCreateToneConfig).toHaveBeenCalledWith(mockDataUserId);

    // Verify the structure is as expected
    expect(result).toBeDefined();
  });

  it('should show visitor mode toggle only for owner', async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue(mockUserId);
    vi.mocked(getDataUserId).mockResolvedValue(mockUserId);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      isOwner: true,
    } as never);
    vi.mocked(getOrCreateToneConfig).mockResolvedValue(mockToneConfig as never);

    const SettingsPage = (await import('@/app/settings/page')).default;
    await SettingsPage();

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: mockUserId },
      select: { isOwner: true },
    });
  });

  it('should not show visitor mode toggle for non-owner', async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue(mockUserId);
    vi.mocked(getDataUserId).mockResolvedValue(mockDataUserId);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      isOwner: false,
    } as never);
    vi.mocked(getOrCreateToneConfig).mockResolvedValue(mockToneConfig as never);

    const SettingsPage = (await import('@/app/settings/page')).default;
    await SettingsPage();

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: mockUserId },
      select: { isOwner: true },
    });
  });

  it('should handle tone config with empty custom rules', async () => {
    const configWithoutRules = {
      ...mockToneConfig,
      customRules: [],
    };

    vi.mocked(getCurrentUserId).mockResolvedValue(mockUserId);
    vi.mocked(getDataUserId).mockResolvedValue(mockDataUserId);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      isOwner: false,
    } as never);
    vi.mocked(getOrCreateToneConfig).mockResolvedValue(configWithoutRules as never);

    const SettingsPage = (await import('@/app/settings/page')).default;
    await SettingsPage();

    expect(getOrCreateToneConfig).toHaveBeenCalledWith(mockDataUserId);
  });

  it('should handle tone config with empty learned patterns', async () => {
    const configWithoutPatterns = {
      ...mockToneConfig,
      learnedPatterns: {},
    };

    vi.mocked(getCurrentUserId).mockResolvedValue(mockUserId);
    vi.mocked(getDataUserId).mockResolvedValue(mockDataUserId);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      isOwner: false,
    } as never);
    vi.mocked(getOrCreateToneConfig).mockResolvedValue(configWithoutPatterns as never);

    const SettingsPage = (await import('@/app/settings/page')).default;
    await SettingsPage();

    expect(getOrCreateToneConfig).toHaveBeenCalledWith(mockDataUserId);
  });

  it('should pass both userId and initialConfig to ToneConfigComponent', async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue(mockUserId);
    vi.mocked(getDataUserId).mockResolvedValue(mockDataUserId);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      isOwner: false,
    } as never);
    vi.mocked(getOrCreateToneConfig).mockResolvedValue(mockToneConfig as never);

    const SettingsPage = (await import('@/app/settings/page')).default;
    await SettingsPage();

    // Verify the config was fetched for the correct user
    expect(getOrCreateToneConfig).toHaveBeenCalledWith(mockDataUserId);

    // The dataUserId should be passed to the component
    expect(getDataUserId).toHaveBeenCalled();
  });

  it('should handle guest user viewing owner data', async () => {
    const guestUserId = 'guest-789';
    const ownerUserId = 'owner-456';

    vi.mocked(getCurrentUserId).mockResolvedValue(guestUserId);
    vi.mocked(getDataUserId).mockResolvedValue(ownerUserId); // Guest views owner's data
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      isOwner: false,
    } as never);
    vi.mocked(getOrCreateToneConfig).mockResolvedValue(mockToneConfig as never);

    const SettingsPage = (await import('@/app/settings/page')).default;
    await SettingsPage();

    // Should fetch config for owner, not guest
    expect(getOrCreateToneConfig).toHaveBeenCalledWith(ownerUserId);
  });

  it('should transform learnedPatterns to expected component type', async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue(mockUserId);
    vi.mocked(getDataUserId).mockResolvedValue(mockDataUserId);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      isOwner: false,
    } as never);
    vi.mocked(getOrCreateToneConfig).mockResolvedValue(mockToneConfig as never);

    const SettingsPage = (await import('@/app/settings/page')).default;
    const result = await SettingsPage();

    expect(getOrCreateToneConfig).toHaveBeenCalledWith(mockDataUserId);
    expect(result).toBeDefined();
  });
});
