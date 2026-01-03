/**
 * Integration tests for Ideas Dashboard pagination
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IdeasDashboard } from '@/components/ideas-dashboard';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock auth client
vi.mock('@/lib/auth-client', () => ({
  getUserSession: () => ({ isGuest: false }),
}));

// Helper to create mock ideas
function createMockIdeas(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `idea-${i}`,
    title: `Idea ${i}`,
    description: `Description for idea ${i}`,
    rationale: `Rationale for idea ${i}`,
    contentPillar: 'lessons_learned' as const,
    suggestedFormat: 'thread' as const,
    estimatedEngagement: 'medium' as const,
    status: 'suggested' as const,
    createdAt: new Date(Date.now() - i * 1000 * 60 * 60), // Stagger by hours
    outlines: [],
  }));
}

describe('Ideas Dashboard - Pagination Integration', () => {
  beforeEach(() => {
    // Mock fetch for idea generation
    global.fetch = vi.fn();
  });

  describe('Basic Pagination Display', () => {
    it('should show pagination controls when more than 9 ideas', () => {
      const ideas = createMockIdeas(15);

      render(<IdeasDashboard userId="user-1" initialIdeas={ideas} />);

      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
      expect(screen.getByLabelText('Previous page')).toBeInTheDocument();
      expect(screen.getByLabelText('Next page')).toBeInTheDocument();
    });

    it('should not show pagination controls when 9 or fewer ideas', () => {
      const ideas = createMockIdeas(9);

      render(<IdeasDashboard userId="user-1" initialIdeas={ideas} />);

      expect(screen.queryByText(/Page \d+ of \d+/)).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Previous page')).not.toBeInTheDocument();
    });

    it('should display exactly 9 ideas on first page', () => {
      const ideas = createMockIdeas(25);

      render(<IdeasDashboard userId="user-1" initialIdeas={ideas} />);

      const cards = screen.getAllByRole('heading', { level: 3 }); // Card titles
      expect(cards).toHaveLength(9);
      expect(cards[0]).toHaveTextContent('Idea 0');
      expect(cards[8]).toHaveTextContent('Idea 8');
    });

    it('should calculate correct total pages', () => {
      const ideas = createMockIdeas(25);

      render(<IdeasDashboard userId="user-1" initialIdeas={ideas} />);

      // 25 ideas / 9 per page = 3 pages
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });
  });

  describe('Page Navigation', () => {
    it('should navigate to next page when next button is clicked', async () => {
      const user = userEvent.setup();
      const ideas = createMockIdeas(20);

      render(<IdeasDashboard userId="user-1" initialIdeas={ideas} />);

      // Initially on page 1
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Idea 0' })).toBeInTheDocument();

      // Click next
      await user.click(screen.getByLabelText('Next page'));

      // Should be on page 2
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Idea 9' })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Idea 0' })).not.toBeInTheDocument();
    });

    it('should navigate to previous page when prev button is clicked', async () => {
      const user = userEvent.setup();
      const ideas = createMockIdeas(20);

      render(<IdeasDashboard userId="user-1" initialIdeas={ideas} />);

      // Go to page 2
      await user.click(screen.getByLabelText('Next page'));
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();

      // Click previous
      await user.click(screen.getByLabelText('Previous page'));

      // Should be back on page 1
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Idea 0' })).toBeInTheDocument();
    });

    it('should disable previous button on first page', () => {
      const ideas = createMockIdeas(20);

      render(<IdeasDashboard userId="user-1" initialIdeas={ideas} />);

      const prevButton = screen.getByLabelText('Previous page');
      expect(prevButton).toBeDisabled();
    });

    it('should disable next button on last page', async () => {
      const user = userEvent.setup();
      const ideas = createMockIdeas(20);

      render(<IdeasDashboard userId="user-1" initialIdeas={ideas} />);

      // Navigate to last page (page 3)
      await user.click(screen.getByLabelText('Next page'));
      await user.click(screen.getByLabelText('Next page'));

      expect(screen.getByText('Page 3 of 3')).toBeInTheDocument();
      expect(screen.getByLabelText('Next page')).toBeDisabled();
    });

    it('should show correct items on last page with partial items', async () => {
      const user = userEvent.setup();
      const ideas = createMockIdeas(20);

      render(<IdeasDashboard userId="user-1" initialIdeas={ideas} />);

      // Navigate to last page
      await user.click(screen.getByLabelText('Next page'));
      await user.click(screen.getByLabelText('Next page'));

      // Last page should have 2 items (20 - 9 - 9 = 2)
      const cards = screen.getAllByRole('heading', { level: 3 });
      expect(cards).toHaveLength(2);
      expect(cards[0]).toHaveTextContent('Idea 18');
      expect(cards[1]).toHaveTextContent('Idea 19');
    });
  });

  describe('Pagination Reset on Status Change', () => {
    it('should reset to page 1 when changing status tab', async () => {
      const user = userEvent.setup();
      const ideas = [
        ...createMockIdeas(15).map((idea, i) => ({
          ...idea,
          status: 'suggested' as const,
        })),
        ...createMockIdeas(10).map((idea, i) => ({
          ...idea,
          id: `accepted-${i}`,
          status: 'accepted' as const,
        })),
      ];

      render(<IdeasDashboard userId="user-1" initialIdeas={ideas} />);

      // Navigate to page 2 in "suggested" status
      await user.click(screen.getByLabelText('Next page'));
      expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();

      // Switch to "accepted" status
      await user.click(screen.getByRole('button', { name: 'accepted' }));

      // Should reset to page 1
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    });

    it('should maintain correct pagination after status filter', async () => {
      const user = userEvent.setup();
      const ideas = [
        ...createMockIdeas(20).map((idea) => ({
          ...idea,
          status: 'suggested' as const,
        })),
        ...createMockIdeas(5).map((idea, i) => ({
          ...idea,
          id: `rejected-${i}`,
          title: `Rejected Idea ${i}`,
          status: 'rejected' as const,
        })),
      ];

      render(<IdeasDashboard userId="user-1" initialIdeas={ideas} />);

      // Initially showing "suggested" - should have 3 pages
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();

      // Switch to "rejected" - should have 1 page (5 items)
      await user.click(screen.getByRole('button', { name: 'rejected' }));

      expect(screen.queryByText(/Page \d+ of \d+/)).not.toBeInTheDocument();
      const cards = screen.getAllByRole('heading', { level: 3 });
      expect(cards).toHaveLength(5);
    });
  });

  describe('Pagination Reset on Date Range Change', () => {
    it('should reset to page 1 when changing date range', async () => {
      const user = userEvent.setup();
      const now = Date.now();
      // Create 20 ideas, all within last 7 days to ensure they still show after filter change
      const ideas = Array.from({ length: 20 }, (_, i) => ({
        ...createMockIdeas(1)[0],
        id: `idea-${i}`,
        title: `Idea ${i}`,
        createdAt: new Date(now - i * 1000 * 60 * 60), // Stagger by HOURS, not days
      }));

      render(<IdeasDashboard userId="user-1" initialIdeas={ideas} />);

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

  describe('Pagination with Filtering', () => {
    it('should paginate filtered results correctly', async () => {
      const user = userEvent.setup();
      const ideas = [
        ...Array.from({ length: 15 }, (_, i) => ({
          ...createMockIdeas(1)[0],
          id: `suggested-${i}`,
          title: `Suggested ${i}`,
          status: 'suggested' as const,
        })),
        ...Array.from({ length: 15 }, (_, i) => ({
          ...createMockIdeas(1)[0],
          id: `accepted-${i}`,
          title: `Accepted ${i}`,
          status: 'accepted' as const,
        })),
      ];

      render(<IdeasDashboard userId="user-1" initialIdeas={ideas} />);

      // "suggested" filter - 15 items = 2 pages
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();

      // Switch to "accepted" - also 15 items = 2 pages
      await user.click(screen.getByRole('button', { name: 'accepted' }));
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();

      const cards = screen.getAllByRole('heading', { level: 3 });
      expect(cards).toHaveLength(9);
      expect(cards[0]).toHaveTextContent('Accepted');
    });

    it('should handle case where filter results in no pagination needed', async () => {
      const user = userEvent.setup();
      const ideas = [
        ...createMockIdeas(20).map((idea) => ({
          ...idea,
          status: 'suggested' as const,
        })),
        ...createMockIdeas(3).map((idea, i) => ({
          ...idea,
          id: `used-${i}`,
          status: 'used' as const,
        })),
      ];

      render(<IdeasDashboard userId="user-1" initialIdeas={ideas} />);

      // "suggested" should have pagination
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();

      // Switch to "used" - only 3 items, no pagination
      await user.click(screen.getByRole('button', { name: 'used' }));

      expect(screen.queryByText(/Page \d+ of \d+/)).not.toBeInTheDocument();
    });
  });

  describe('Pagination Position', () => {
    it('should render pagination to the left of date range filter', () => {
      const ideas = createMockIdeas(15);

      render(<IdeasDashboard userId="user-1" initialIdeas={ideas} />);

      // Find the container with both elements
      const controlsContainer = screen.getByText('Page 1 of 2').closest('div');
      const dateRangeButton = screen.getByRole('button', { name: /Past \d+ days?/i });

      // Both should be in the same parent container
      expect(controlsContainer?.parentElement).toContainElement(dateRangeButton);
    });
  });

  describe('Edge Cases', () => {
    it('should handle exactly 9 items (1 page)', () => {
      const ideas = createMockIdeas(9);

      render(<IdeasDashboard userId="user-1" initialIdeas={ideas} />);

      expect(screen.queryByText(/Page \d+ of \d+/)).not.toBeInTheDocument();
      const cards = screen.getAllByRole('heading', { level: 3 });
      expect(cards).toHaveLength(9);
    });

    it('should handle exactly 18 items (2 pages)', () => {
      const ideas = createMockIdeas(18);

      render(<IdeasDashboard userId="user-1" initialIdeas={ideas} />);

      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    });

    it('should handle 1 item', () => {
      const ideas = createMockIdeas(1);

      render(<IdeasDashboard userId="user-1" initialIdeas={ideas} />);

      expect(screen.queryByText(/Page \d+ of \d+/)).not.toBeInTheDocument();
      const cards = screen.getAllByRole('heading', { level: 3 });
      expect(cards).toHaveLength(1);
    });

    it('should handle 0 items gracefully', () => {
      render(<IdeasDashboard userId="user-1" initialIdeas={[]} />);

      expect(screen.queryByText(/Page \d+ of \d+/)).not.toBeInTheDocument();
      expect(screen.getByText(/no suggested ideas yet/i)).toBeInTheDocument();
    });

    it('should handle large number of items', () => {
      const ideas = createMockIdeas(100);

      render(<IdeasDashboard userId="user-1" initialIdeas={ideas} />);

      // 100 / 9 = 12 pages
      expect(screen.getByText('Page 1 of 12')).toBeInTheDocument();
    });
  });

  describe('Pagination State Persistence', () => {
    it('should maintain page when ideas list updates without filter change', async () => {
      const user = userEvent.setup();
      const ideas = createMockIdeas(20);

      const { rerender } = render(
        <IdeasDashboard userId="user-1" initialIdeas={ideas} />
      );

      // Navigate to page 2
      await user.click(screen.getByLabelText('Next page'));
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();

      // Rerender with same ideas (simulating re-fetch)
      rerender(<IdeasDashboard userId="user-1" initialIdeas={ideas} />);

      // Should still be on page 2
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
    });
  });
});
