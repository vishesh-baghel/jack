/**
 * Auth API Route Tests
 * Tests signup and login functionality with feature flag behavior
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import bcrypt from 'bcrypt';

// Mock prisma
vi.mock('@/lib/db/client', () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    toneConfig: {
      create: vi.fn(),
    },
  },
}));

// Mock rate limit
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockReturnValue({ allowed: true, remaining: 4, resetIn: 60 }),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
  getRandomRateLimitMessage: vi.fn().mockReturnValue('slow down'),
}));

import { prisma } from '@/lib/db/client';

// Helper to create mock NextRequest
const createMockRequest = (options: {
  method?: string;
  body?: object;
} = {}) => {
  const { method = 'GET', body } = options;

  return {
    method,
    json: vi.fn().mockResolvedValue(body || {}),
    headers: new Headers(),
  } as unknown as NextRequest;
};

describe('Signup API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  describe('GET /api/auth/signup - Check signup status', () => {
    it('should return signupAllowed=true when no owner exists', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      const { GET } = await import('@/app/api/auth/signup/route');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.signupAllowed).toBe(true);
    });

    it('should return signupAllowed=false when owner exists', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: 'owner-123' } as never);

      const { GET } = await import('@/app/api/auth/signup/route');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.signupAllowed).toBe(false);
    });

    it('should return signupAllowed=true when ALLOW_SIGNUP=true', async () => {
      vi.stubEnv('ALLOW_SIGNUP', 'true');
      vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: 'owner-123' } as never);

      // Re-import to pick up env change
      vi.resetModules();
      const { GET } = await import('@/app/api/auth/signup/route');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.signupAllowed).toBe(true);
    });

    it('should return signupAllowed=false when ALLOW_SIGNUP=false', async () => {
      vi.stubEnv('ALLOW_SIGNUP', 'false');
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      vi.resetModules();
      const { GET } = await import('@/app/api/auth/signup/route');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.signupAllowed).toBe(false);
    });
  });

  describe('POST /api/auth/signup - Create owner account', () => {
    it('should create owner account successfully', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: 'new-owner-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
      } as never);
      vi.mocked(prisma.toneConfig.create).mockResolvedValue({} as never);

      const { POST } = await import('@/app/api/auth/signup/route');
      const request = createMockRequest({
        method: 'POST',
        body: {
          email: 'test@example.com',
          name: 'Test User',
          passphrase: 'securepassphrase123',
          confirmPassphrase: 'securepassphrase123',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.user.email).toBe('test@example.com');
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'test@example.com',
            name: 'Test User',
            isOwner: true,
            isGuest: false,
          }),
        })
      );
      // Verify passphrase is hashed (starts with $2)
      const createCall = vi.mocked(prisma.user.create).mock.calls[0][0];
      expect(createCall.data.passphrase).toMatch(/^\$2[aby]\$/);
    });

    it('should create owner account without name', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: 'new-owner-123',
        email: 'test@example.com',
        name: null,
        createdAt: new Date(),
      } as never);
      vi.mocked(prisma.toneConfig.create).mockResolvedValue({} as never);

      const { POST } = await import('@/app/api/auth/signup/route');
      const request = createMockRequest({
        method: 'POST',
        body: {
          email: 'test@example.com',
          passphrase: 'securepassphrase123',
          confirmPassphrase: 'securepassphrase123',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });

    it('should return 403 when signup is disabled via env', async () => {
      vi.stubEnv('ALLOW_SIGNUP', 'false');

      vi.resetModules();
      const { POST } = await import('@/app/api/auth/signup/route');
      const request = createMockRequest({
        method: 'POST',
        body: {
          email: 'test@example.com',
          passphrase: 'securepassphrase123',
          confirmPassphrase: 'securepassphrase123',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('signup is disabled');
    });

    it('should return 403 when owner already exists (signup not allowed)', async () => {
      // When owner exists and ALLOW_SIGNUP is not explicitly 'true', signup is blocked at isSignupAllowed check
      vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: 'existing-owner' } as never);

      const { POST } = await import('@/app/api/auth/signup/route');
      const request = createMockRequest({
        method: 'POST',
        body: {
          email: 'test@example.com',
          passphrase: 'securepassphrase123',
          confirmPassphrase: 'securepassphrase123',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('signup is disabled');
    });

    it('should return 409 when email already registered', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'existing-user' } as never);

      const { POST } = await import('@/app/api/auth/signup/route');
      const request = createMockRequest({
        method: 'POST',
        body: {
          email: 'existing@example.com',
          passphrase: 'securepassphrase123',
          confirmPassphrase: 'securepassphrase123',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toContain('email is already registered');
    });

    it('should return 400 when passphrases do not match', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      const { POST } = await import('@/app/api/auth/signup/route');
      const request = createMockRequest({
        method: 'POST',
        body: {
          email: 'test@example.com',
          passphrase: 'securepassphrase123',
          confirmPassphrase: 'differentpassphrase',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('passphrases do not match');
    });

    it('should return 400 when passphrase is too short', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      const { POST } = await import('@/app/api/auth/signup/route');
      const request = createMockRequest({
        method: 'POST',
        body: {
          email: 'test@example.com',
          passphrase: 'short',
          confirmPassphrase: 'short',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('at least 8 characters');
    });

    it('should return 400 when email is invalid', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      const { POST } = await import('@/app/api/auth/signup/route');
      const request = createMockRequest({
        method: 'POST',
        body: {
          email: 'invalid-email',
          passphrase: 'securepassphrase123',
          confirmPassphrase: 'securepassphrase123',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('valid email');
    });

    it('should create default tone config for new owner', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: 'new-owner-123',
        email: 'test@example.com',
        name: null,
        createdAt: new Date(),
      } as never);
      vi.mocked(prisma.toneConfig.create).mockResolvedValue({} as never);

      const { POST } = await import('@/app/api/auth/signup/route');
      const request = createMockRequest({
        method: 'POST',
        body: {
          email: 'test@example.com',
          passphrase: 'securepassphrase123',
          confirmPassphrase: 'securepassphrase123',
        },
      });

      await POST(request);

      expect(prisma.toneConfig.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'new-owner-123',
            lowercase: true,
            noEmojis: true,
            noHashtags: true,
            showFailures: true,
            includeNumbers: true,
          }),
        })
      );
    });
  });
});

describe('Login API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/login - Authenticate owner', () => {
    it('should login successfully with correct bcrypt-hashed passphrase', async () => {
      const hashedPassphrase = await bcrypt.hash('correctpassphrase', 12);
      vi.mocked(prisma.user.findFirst).mockResolvedValue({
        id: 'owner-123',
        email: 'owner@example.com',
        name: 'Owner',
        passphrase: hashedPassphrase,
        createdAt: new Date(),
      } as never);

      const { POST } = await import('@/app/api/auth/login/route');
      const request = createMockRequest({
        method: 'POST',
        body: { passphrase: 'correctpassphrase' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.id).toBe('owner-123');
      expect(data.user.email).toBe('owner@example.com');
    });

    it('should login successfully with plain text passphrase (legacy)', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue({
        id: 'owner-123',
        email: 'owner@example.com',
        name: 'Owner',
        passphrase: 'plainpassphrase',
        createdAt: new Date(),
      } as never);

      const { POST } = await import('@/app/api/auth/login/route');
      const request = createMockRequest({
        method: 'POST',
        body: { passphrase: 'plainpassphrase' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 401 with incorrect passphrase', async () => {
      const hashedPassphrase = await bcrypt.hash('correctpassphrase', 12);
      vi.mocked(prisma.user.findFirst).mockResolvedValue({
        id: 'owner-123',
        email: 'owner@example.com',
        name: 'Owner',
        passphrase: hashedPassphrase,
        createdAt: new Date(),
      } as never);

      const { POST } = await import('@/app/api/auth/login/route');
      const request = createMockRequest({
        method: 'POST',
        body: { passphrase: 'wrongpassphrase' },
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should return 401 when no owner exists', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      const { POST } = await import('@/app/api/auth/login/route');
      const request = createMockRequest({
        method: 'POST',
        body: { passphrase: 'anypassphrase' },
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should return 400 when passphrase is missing', async () => {
      const { POST } = await import('@/app/api/auth/login/route');
      const request = createMockRequest({
        method: 'POST',
        body: {},
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('passphrase is required');
    });
  });
});

describe('Auth Route Smoke Tests', () => {
  it('signup route should export GET and POST', async () => {
    const signupRoute = await import('@/app/api/auth/signup/route');
    expect(signupRoute.GET).toBeDefined();
    expect(signupRoute.POST).toBeDefined();
  });

  it('login route should export POST', async () => {
    const loginRoute = await import('@/app/api/auth/login/route');
    expect(loginRoute.POST).toBeDefined();
  });
});
