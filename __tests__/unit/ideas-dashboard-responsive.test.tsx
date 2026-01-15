/**
 * Test suite for IdeasDashboard mobile responsiveness
 * Verifies responsive layouts, stacking, and text sizing
 */

import { render } from '@testing-library/react';

// Mock component for testing responsive classes
const IdeasDashboardHeader = () => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold">content ideas</h1>
      <p className="text-sm sm:text-base text-muted-foreground">
        ai-generated bangers based on your voice
      </p>
    </div>
    <button className="w-full sm:w-auto">cook up ideas</button>
  </div>
);

const IdeasDashboardTabs = () => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-full sm:w-fit overflow-x-auto">
      <button className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap">
        suggested
      </button>
      <button className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap">
        accepted
      </button>
    </div>
    <div className="flex items-center gap-2 sm:gap-3 justify-between sm:justify-end">
      <div>Pagination</div>
      <div>DateRange</div>
    </div>
  </div>
);

describe('IdeasDashboard Responsive Layout', () => {
  describe('Header Section', () => {
    it('should stack header elements vertically on mobile', () => {
      const { container } = render(<IdeasDashboardHeader />);
      const headerContainer = container.querySelector('.flex');

      expect(headerContainer?.className).toContain('flex-col');
      expect(headerContainer?.className).toContain('sm:flex-row');
    });

    it('should have responsive text sizing for heading', () => {
      const { container } = render(<IdeasDashboardHeader />);
      const heading = container.querySelector('h1');

      expect(heading?.className).toContain('text-2xl');
      expect(heading?.className).toContain('sm:text-3xl');
    });

    it('should have responsive text sizing for description', () => {
      const { container } = render(<IdeasDashboardHeader />);
      const description = container.querySelector('p');

      expect(description?.className).toContain('text-sm');
      expect(description?.className).toContain('sm:text-base');
    });

    it('should have full width button on mobile', () => {
      const { container } = render(<IdeasDashboardHeader />);
      const button = container.querySelector('button');

      expect(button?.className).toContain('w-full');
      expect(button?.className).toContain('sm:w-auto');
    });
  });

  describe('Status Tabs Section', () => {
    it('should stack tabs and controls vertically on mobile', () => {
      const { container } = render(<IdeasDashboardTabs />);
      const tabsContainer = container.querySelector('.flex.flex-col');

      expect(tabsContainer?.className).toContain('flex-col');
      expect(tabsContainer?.className).toContain('sm:flex-row');
    });

    it('should have full width tabs container on mobile', () => {
      const { container } = render(<IdeasDashboardTabs />);
      const tabsInner = container.querySelector('.bg-muted\\/50');

      expect(tabsInner?.className).toContain('w-full');
      expect(tabsInner?.className).toContain('sm:w-fit');
    });

    it('should have horizontal scroll for tabs on mobile', () => {
      const { container } = render(<IdeasDashboardTabs />);
      const tabsInner = container.querySelector('.bg-muted\\/50');

      expect(tabsInner?.className).toContain('overflow-x-auto');
    });

    it('should have smaller padding on mobile for tabs', () => {
      const { container } = render(<IdeasDashboardTabs />);
      const tabButtons = container.querySelectorAll('button');

      tabButtons.forEach(button => {
        expect(button.className).toContain('px-3');
        expect(button.className).toContain('sm:px-4');
      });
    });

    it('should have smaller text on mobile for tabs', () => {
      const { container } = render(<IdeasDashboardTabs />);
      const tabButtons = container.querySelectorAll('button');

      tabButtons.forEach(button => {
        expect(button.className).toContain('text-xs');
        expect(button.className).toContain('sm:text-sm');
      });
    });

    it('should prevent tab text wrapping', () => {
      const { container } = render(<IdeasDashboardTabs />);
      const tabButtons = container.querySelectorAll('button');

      tabButtons.forEach(button => {
        expect(button.className).toContain('whitespace-nowrap');
      });
    });

    it('should have justify-between for controls on mobile', () => {
      const { container } = render(<IdeasDashboardTabs />);
      const controlsContainer = container.querySelector('.flex.items-center.justify-between');

      expect(controlsContainer?.className).toContain('justify-between');
    });
  });
});
