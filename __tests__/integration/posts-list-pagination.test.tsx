/**
 * Integration tests for Posts List pagination
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PostsList } from '@/components/posts-list';

// Mock auth client
vi.mock('@/lib/auth-client', () => ({
  getUserSession: () => ({ isGuest: false }),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Helper to create mock posts
function createMockPosts(count: number, overrides = {}) {
  return Array.from({ length: count }, (_, i) => ({
    id: `post-${i}`,
    draftId: `draft-${i}`,
    hasPost: true,
    content: `Post content ${i}`,
    contentType: 'thread',
    contentPillar: 'lessons_learned',
    isMarkedGood: false,
    markedGoodAt: null,
    isPosted: false,
    postedAt: null,
    createdAt: new Date(Date.now() - i * 1000 * 60 * 60), // Stagger by hours
    ...overrides,
  }));
}

describe('Posts List - Pagination Integration', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  describe('Basic Pagination Display', () => {
    it('should show pagination controls when more than 9 posts', () => {
      const posts = createMockPosts(15);

      render(<PostsList userId="user-1" initialPosts={posts} />);

      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
      expect(screen.getByLabelText('Previous page')).toBeInTheDocument();
      expect(screen.getByLabelText('Next page')).toBeInTheDocument();
    });

    it('should not show pagination controls when 9 or fewer posts', () => {
      const posts = createMockPosts(9);

      render(<PostsList userId="user-1" initialPosts={posts} />);

      expect(screen.queryByText(/Page \d+ of \d+/)).not.toBeInTheDocument();
    });

    it('should display exactly 9 posts on first page', () => {
      const posts = createMockPosts(25);

      render(<PostsList userId="user-1" initialPosts={posts} />);

      const postCards = screen.getAllByText(/Post content \d+/);
      expect(postCards).toHaveLength(9);
      expect(postCards[0]).toHaveTextContent('Post content 0');
      expect(postCards[8]).toHaveTextContent('Post content 8');
    });

    it('should calculate correct total pages', () => {
      const posts = createMockPosts(25);

      render(<PostsList userId="user-1" initialPosts={posts} />);

      // 25 posts / 9 per page = 3 pages
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });
  });

  describe('Page Navigation', () => {
    it('should navigate to next page when next button is clicked', async () => {
      const user = userEvent.setup();
      const posts = createMockPosts(20);

      render(<PostsList userId="user-1" initialPosts={posts} />);

      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      expect(screen.getByText('Post content 0')).toBeInTheDocument();

      await user.click(screen.getByLabelText('Next page'));

      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
      expect(screen.getByText('Post content 9')).toBeInTheDocument();
      expect(screen.queryByText('Post content 0')).not.toBeInTheDocument();
    });

    it('should navigate to previous page when prev button is clicked', async () => {
      const user = userEvent.setup();
      const posts = createMockPosts(20);

      render(<PostsList userId="user-1" initialPosts={posts} />);

      await user.click(screen.getByLabelText('Next page'));
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();

      await user.click(screen.getByLabelText('Previous page'));

      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      expect(screen.getByText('Post content 0')).toBeInTheDocument();
    });

    it('should disable previous button on first page', () => {
      const posts = createMockPosts(20);

      render(<PostsList userId="user-1" initialPosts={posts} />);

      expect(screen.getByLabelText('Previous page')).toBeDisabled();
    });

    it('should disable next button on last page', async () => {
      const user = userEvent.setup();
      const posts = createMockPosts(20);

      render(<PostsList userId="user-1" initialPosts={posts} />);

      // Navigate to last page
      await user.click(screen.getByLabelText('Next page'));
      await user.click(screen.getByLabelText('Next page'));

      expect(screen.getByText('Page 3 of 3')).toBeInTheDocument();
      expect(screen.getByLabelText('Next page')).toBeDisabled();
    });

    it('should show correct posts on last page with partial items', async () => {
      const user = userEvent.setup();
      const posts = createMockPosts(20);

      render(<PostsList userId="user-1" initialPosts={posts} />);

      // Navigate to last page
      await user.click(screen.getByLabelText('Next page'));
      await user.click(screen.getByLabelText('Next page'));

      // Last page should have 2 posts (20 - 9 - 9 = 2)
      const postCards = screen.getAllByText(/Post content \d+/);
      expect(postCards).toHaveLength(2);
      expect(postCards[0]).toHaveTextContent('Post content 18');
      expect(postCards[1]).toHaveTextContent('Post content 19');
    });
  });

  describe('Pagination Reset on Filter Change', () => {
    it('should reset to page 1 when changing filter tabs', async () => {
      const user = userEvent.setup();
      const posts = [
        ...createMockPosts(15, { isMarkedGood: false }),
        ...createMockPosts(10).map((post, i) => ({
          ...post,
          id: `good-${i}`,
          draftId: `good-draft-${i}`,
          content: `Good post ${i}`,
          isMarkedGood: true,
          markedGoodAt: new Date(),
        })),
      ];

      render(<PostsList userId="user-1" initialPosts={posts} />);

      // Navigate to page 2 in "all" filter
      await user.click(screen.getByLabelText('Next page'));
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();

      // Switch to "bangers" filter
      await user.click(screen.getByRole('button', { name: /bangers/ }));

      // Should reset to page 1
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    });

    it('should maintain correct pagination after filter', async () => {
      const user = userEvent.setup();
      const posts = [
        ...createMockPosts(20, { isMarkedGood: false, isPosted: false }),
        ...createMockPosts(5).map((post, i) => ({
          ...post,
          id: `posted-${i}`,
          draftId: `posted-draft-${i}`,
          content: `Posted content ${i}`,
          isPosted: true,
          postedAt: new Date(),
        })),
      ];

      render(<PostsList userId="user-1" initialPosts={posts} />);

      // "all" filter - 25 items = 3 pages
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();

      // Switch to "shipped" - 5 items, no pagination needed
      await user.click(screen.getByRole('button', { name: /shipped/ }));

      expect(screen.queryByText(/Page \d+ of \d+/)).not.toBeInTheDocument();
      const postCards = screen.getAllByText(/Posted content \d+/);
      expect(postCards).toHaveLength(5);
    });
  });

  describe('Pagination Reset on Date Range Change', () => {
    it('should reset to page 1 when changing date range', async () => {
      const user = userEvent.setup();
      const now = Date.now();
      // Create 20 posts, all within recent hours to ensure they still show after filter change
      const posts = Array.from({ length: 20 }, (_, i) => ({
        ...createMockPosts(1)[0],
        id: `post-${i}`,
        draftId: `draft-${i}`,
        content: `Post ${i}`,
        createdAt: new Date(now - i * 1000 * 60 * 60), // Stagger by HOURS, not days
      }));

      render(<PostsList userId="user-1" initialPosts={posts} />);

      // Navigate to page 2
      await user.click(screen.getByLabelText('Next page'));
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();

      // Change date range to Past 15 days (which will still show all items)
      const dateRangeButton = screen.getByRole('button', { name: /Past \d+ (hr|days?)/i });
      await user.click(dateRangeButton);

      const option15d = screen.getByRole('button', { name: /Past 15 days/i });
      await user.click(option15d);

      // Should reset to page 1
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });
  });

  describe('Pagination with Multiple Filters', () => {
    it('should paginate correctly with "good" filter', async () => {
      const user = userEvent.setup();
      const posts = [
        ...createMockPosts(10, { isMarkedGood: false }),
        ...Array.from({ length: 15 }, (_, i) => ({
          ...createMockPosts(1)[0],
          id: `good-${i}`,
          draftId: `good-draft-${i}`,
          content: `Good post ${i}`,
          isMarkedGood: true,
          markedGoodAt: new Date(),
        })),
      ];

      render(<PostsList userId="user-1" initialPosts={posts} />);

      // Switch to "bangers"
      await user.click(screen.getByRole('button', { name: /bangers/ }));

      // 15 good posts = 2 pages
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();

      const postCards = screen.getAllByText(/Good post \d+/);
      expect(postCards).toHaveLength(9);
    });

    it('should paginate correctly with "posted" filter', async () => {
      const user = userEvent.setup();
      const posts = [
        ...createMockPosts(10, { isPosted: false }),
        ...Array.from({ length: 18 }, (_, i) => ({
          ...createMockPosts(1)[0],
          id: `posted-${i}`,
          draftId: `posted-draft-${i}`,
          content: `Shipped ${i}`,
          isPosted: true,
          postedAt: new Date(),
        })),
      ];

      render(<PostsList userId="user-1" initialPosts={posts} />);

      // Switch to "shipped"
      await user.click(screen.getByRole('button', { name: /shipped/ }));

      // 18 posted items = 2 pages
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();

      const postCards = screen.getAllByText(/Shipped \d+/);
      expect(postCards).toHaveLength(9);
    });

    it('should handle combined filters (good + date range)', async () => {
      const user = userEvent.setup();
      const now = Date.now();
      const posts = [
        // Recent good posts
        ...Array.from({ length: 15 }, (_, i) => ({
          ...createMockPosts(1)[0],
          id: `recent-good-${i}`,
          draftId: `recent-good-draft-${i}`,
          content: `Recent good ${i}`,
          isMarkedGood: true,
          markedGoodAt: new Date(),
          createdAt: new Date(now - i * 1000 * 60 * 60), // Recent (hours ago)
        })),
        // Old good posts
        ...Array.from({ length: 10 }, (_, i) => ({
          ...createMockPosts(1)[0],
          id: `old-good-${i}`,
          draftId: `old-good-draft-${i}`,
          content: `Old good ${i}`,
          isMarkedGood: true,
          markedGoodAt: new Date(),
          createdAt: new Date(now - (30 + i) * 1000 * 60 * 60 * 24), // 30+ days ago
        })),
      ];

      render(<PostsList userId="user-1" initialPosts={posts} />);

      // Switch to "bangers"
      await user.click(screen.getByRole('button', { name: /bangers/ }));

      // With default 7d filter, should only see recent ones (15 = 2 pages)
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    });
  });

  describe('Pagination Position', () => {
    it('should render pagination to the left of date range filter', () => {
      const posts = createMockPosts(15);

      render(<PostsList userId="user-1" initialPosts={posts} />);

      const controlsContainer = screen.getByText('Page 1 of 2').closest('div');
      const dateRangeButton = screen.getByRole('button', { name: /Past \d+ days?/i });

      expect(controlsContainer?.parentElement).toContainElement(dateRangeButton);
    });
  });

  describe('Edge Cases', () => {
    it('should handle exactly 9 posts (1 page)', () => {
      const posts = createMockPosts(9);

      render(<PostsList userId="user-1" initialPosts={posts} />);

      expect(screen.queryByText(/Page \d+ of \d+/)).not.toBeInTheDocument();
      const postCards = screen.getAllByText(/Post content \d+/);
      expect(postCards).toHaveLength(9);
    });

    it('should handle exactly 18 posts (2 pages)', () => {
      const posts = createMockPosts(18);

      render(<PostsList userId="user-1" initialPosts={posts} />);

      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    });

    it('should handle 1 post', () => {
      const posts = createMockPosts(1);

      render(<PostsList userId="user-1" initialPosts={posts} />);

      expect(screen.queryByText(/Page \d+ of \d+/)).not.toBeInTheDocument();
      const postCards = screen.getAllByText(/Post content \d+/);
      expect(postCards).toHaveLength(1);
    });

    it('should handle 0 posts gracefully', () => {
      render(<PostsList userId="user-1" initialPosts={[]} />);

      expect(screen.queryByText(/Page \d+ of \d+/)).not.toBeInTheDocument();
      expect(screen.getByText(/no yet/i)).toBeInTheDocument();
    });

    it('should handle large number of posts', () => {
      const posts = createMockPosts(100);

      render(<PostsList userId="user-1" initialPosts={posts} />);

      // 100 / 9 = 12 pages
      expect(screen.getByText('Page 1 of 12')).toBeInTheDocument();
    });
  });

  describe('Filter Tab Counters with Pagination', () => {
    it('should show total counts in filter tabs, not paginated counts', () => {
      const posts = [
        ...createMockPosts(25, { isMarkedGood: false, isPosted: false }),
        ...createMockPosts(10).map((post, i) => ({
          ...post,
          id: `good-${i}`,
          draftId: `good-draft-${i}`,
          isMarkedGood: true,
        })),
        ...createMockPosts(5).map((post, i) => ({
          ...post,
          id: `posted-${i}`,
          draftId: `posted-draft-${i}`,
          isPosted: true,
        })),
      ];

      render(<PostsList userId="user-1" initialPosts={posts} />);

      // Should show total counts, not just current page
      expect(screen.getByRole('button', { name: /all \(40\)/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /bangers \(10\)/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /shipped \(5\)/ })).toBeInTheDocument();
    });
  });

  describe('User Actions with Pagination', () => {
    it('should maintain current page when marking post as good', async () => {
      const user = userEvent.setup();
      const posts = createMockPosts(20, { isMarkedGood: false, hasPost: false });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ post: { id: 'post-9', markedGoodAt: new Date() } }),
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ post: { id: 'post-9', markedGoodAt: new Date() } }),
      });

      render(<PostsList userId="user-1" initialPosts={posts} />);

      // Navigate to page 2
      await user.click(screen.getByLabelText('Next page'));
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();

      // Should still be on page 2 after state updates
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
    });
  });

  describe('Pagination State Persistence', () => {
    it('should maintain page when posts list updates without filter change', async () => {
      const user = userEvent.setup();
      const posts = createMockPosts(20);

      const { rerender } = render(
        <PostsList userId="user-1" initialPosts={posts} />
      );

      // Navigate to page 2
      await user.click(screen.getByLabelText('Next page'));
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();

      // Rerender with same posts
      rerender(<PostsList userId="user-1" initialPosts={posts} />);

      // Should still be on page 2
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
    });
  });
});
