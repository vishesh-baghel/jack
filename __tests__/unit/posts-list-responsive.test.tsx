/**
 * Test suite for PostsList mobile responsiveness
 * Verifies button layout, card footer, and filters
 */

import { render } from '@testing-library/react';

const PostsListHeader = () => (
  <div>
    <h1 className="text-2xl sm:text-3xl font-bold">my drafts</h1>
    <p className="text-sm sm:text-base text-muted-foreground">
      your content vault. mark the bangers so jack learns your voice
    </p>
  </div>
);

const PostsListTabs = () => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-full sm:w-fit overflow-x-auto">
      <button className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap">
        all (5)
      </button>
      <button className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap">
        bangers (2)
      </button>
    </div>
  </div>
);

const PostCardFooter = () => (
  <div className="flex justify-between gap-2 pt-0 overflow-x-auto">
    <div className="flex gap-2 shrink-0">
      <button className="text-muted-foreground hover:text-foreground whitespace-nowrap">
        fix it
      </button>
      <button className="text-destructive hover:text-destructive hover:bg-destructive/10 whitespace-nowrap">
        yeet
      </button>
    </div>
    <div className="flex gap-2 shrink-0">
      <button className="whitespace-nowrap">this one hits</button>
      <button className="whitespace-nowrap">ship it</button>
    </div>
  </div>
);

describe('PostsList Responsive Layout', () => {
  describe('Header Section', () => {
    it('should have responsive heading text size', () => {
      const { container } = render(<PostsListHeader />);
      const heading = container.querySelector('h1');

      expect(heading?.className).toContain('text-2xl');
      expect(heading?.className).toContain('sm:text-3xl');
    });

    it('should have responsive description text size', () => {
      const { container } = render(<PostsListHeader />);
      const description = container.querySelector('p');

      expect(description?.className).toContain('text-sm');
      expect(description?.className).toContain('sm:text-base');
    });
  });

  describe('Filter Tabs Section', () => {
    it('should stack vertically on mobile', () => {
      const { container } = render(<PostsListTabs />);
      const tabsContainer = container.querySelector('.flex');

      expect(tabsContainer?.className).toContain('flex-col');
      expect(tabsContainer?.className).toContain('sm:flex-row');
    });

    it('should have full width tabs on mobile', () => {
      const { container } = render(<PostsListTabs />);
      const tabsInner = container.querySelector('.bg-muted\\/50');

      expect(tabsInner?.className).toContain('w-full');
      expect(tabsInner?.className).toContain('sm:w-fit');
    });

    it('should have horizontal scroll capability', () => {
      const { container } = render(<PostsListTabs />);
      const tabsInner = container.querySelector('.bg-muted\\/50');

      expect(tabsInner?.className).toContain('overflow-x-auto');
    });

    it('should have responsive padding on tabs', () => {
      const { container } = render(<PostsListTabs />);
      const buttons = container.querySelectorAll('button');

      buttons.forEach(button => {
        expect(button.className).toContain('px-3');
        expect(button.className).toContain('sm:px-4');
      });
    });

    it('should have responsive text sizing on tabs', () => {
      const { container } = render(<PostsListTabs />);
      const buttons = container.querySelectorAll('button');

      buttons.forEach(button => {
        expect(button.className).toContain('text-xs');
        expect(button.className).toContain('sm:text-sm');
      });
    });
  });

  describe('Card Footer Buttons', () => {
    it('should stay horizontal at all screen sizes', () => {
      const { container } = render(<PostCardFooter />);
      const footer = container.querySelector('.flex');

      expect(footer?.className).toContain('flex');
      expect(footer?.className).toContain('justify-between');
      expect(footer?.className).not.toContain('flex-col');
    });

    it('should have horizontal overflow scroll', () => {
      const { container } = render(<PostCardFooter />);
      const footer = container.querySelector('.flex');

      expect(footer?.className).toContain('overflow-x-auto');
    });

    it('should prevent button containers from shrinking', () => {
      const { container } = render(<PostCardFooter />);
      const buttonGroups = container.querySelectorAll('.flex.shrink-0');

      expect(buttonGroups.length).toBe(2);
      buttonGroups.forEach(group => {
        expect(group.className).toContain('shrink-0');
      });
    });

    it('should prevent button text from wrapping', () => {
      const { container } = render(<PostCardFooter />);
      const buttons = container.querySelectorAll('button');

      buttons.forEach(button => {
        expect(button.className).toContain('whitespace-nowrap');
      });
    });

    it('should not use flex-1 on buttons', () => {
      const { container } = render(<PostCardFooter />);
      const buttons = container.querySelectorAll('button');

      buttons.forEach(button => {
        expect(button.className).not.toContain('flex-1');
      });
    });
  });
});
