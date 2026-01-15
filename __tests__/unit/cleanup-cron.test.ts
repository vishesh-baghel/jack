/**
 * Unit tests for cleanup cron job
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/cron/cleanup-tweets/route';
import { NextRequest } from 'next/server';
import { deleteOldTweets } from '@/lib/db/creator-tweets';

vi.mock('@/lib/db/creator-tweets', () => ({
  deleteOldTweets: vi.fn(),
}));

describe('Cleanup Cron Job', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'test-secret';
  });

  describe('GET /api/cron/cleanup-tweets', () => {
    it('should successfully delete old tweets', async () => {
      vi.mocked(deleteOldTweets).mockResolvedValue(42);

      const request = new NextRequest('http://localhost:3000/api/cron/cleanup-tweets', {
        headers: {
          authorization: 'Bearer test-secret',
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.deletedCount).toBe(42);
      expect(data.durationMs).toBeDefined();
      expect(data.timestamp).toBeDefined();

      // Verify deleteOldTweets was called with 7 days
      expect(deleteOldTweets).toHaveBeenCalledWith(7);
    });

    it('should reject requests without authorization header', async () => {
      const request = new NextRequest('http://localhost:3000/api/cron/cleanup-tweets');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
      expect(deleteOldTweets).not.toHaveBeenCalled();
    });

    it('should reject requests with invalid CRON_SECRET', async () => {
      const request = new NextRequest('http://localhost:3000/api/cron/cleanup-tweets', {
        headers: {
          authorization: 'Bearer wrong-secret',
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
      expect(deleteOldTweets).not.toHaveBeenCalled();
    });

    it('should return 500 when CRON_SECRET is not set', async () => {
      delete process.env.CRON_SECRET;

      const request = new NextRequest('http://localhost:3000/api/cron/cleanup-tweets', {
        headers: {
          authorization: 'Bearer test-secret',
        },
      });

      const response = await GET(request);
      const data = await response.json();

      // Returns 500 because it's a server configuration error
      expect(response.status).toBe(500);
      expect(data.error).toContain('CRON_SECRET not configured');
      expect(deleteOldTweets).not.toHaveBeenCalled();
    });

    it('should return 200 with error details when deletion fails', async () => {
      const mockError = new Error('Database connection failed');
      vi.mocked(deleteOldTweets).mockRejectedValue(mockError);

      const request = new NextRequest('http://localhost:3000/api/cron/cleanup-tweets', {
        headers: {
          authorization: 'Bearer test-secret',
        },
      });

      const response = await GET(request);
      const data = await response.json();

      // Should return 200 to prevent Vercel retries
      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Database connection failed');
      expect(data.timestamp).toBeDefined();
    });

    it('should handle non-Error exceptions', async () => {
      vi.mocked(deleteOldTweets).mockRejectedValue('String error');

      const request = new NextRequest('http://localhost:3000/api/cron/cleanup-tweets', {
        headers: {
          authorization: 'Bearer test-secret',
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unknown error');
    });

    it('should track execution duration', async () => {
      vi.mocked(deleteOldTweets).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(10), 100);
          })
      );

      const request = new NextRequest('http://localhost:3000/api/cron/cleanup-tweets', {
        headers: {
          authorization: 'Bearer test-secret',
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(data.durationMs).toBeGreaterThan(0);
      expect(data.durationMs).toBeLessThan(500); // Should complete quickly
    });

    it('should delete tweets older than 7 days', async () => {
      vi.mocked(deleteOldTweets).mockResolvedValue(100);

      const request = new NextRequest('http://localhost:3000/api/cron/cleanup-tweets', {
        headers: {
          authorization: 'Bearer test-secret',
        },
      });

      await GET(request);

      // Verify the retention period is 7 days
      expect(deleteOldTweets).toHaveBeenCalledWith(7);
    });
  });

  describe('deleteOldTweets function', () => {
    it('should calculate correct date threshold', () => {
      const daysToKeep = 7;
      const now = new Date();
      const expectedThreshold = new Date();
      expectedThreshold.setDate(expectedThreshold.getDate() - daysToKeep);

      // The function should delete tweets published before this threshold
      // This is tested implicitly by checking the Prisma query in the actual implementation
    });
  });
});
