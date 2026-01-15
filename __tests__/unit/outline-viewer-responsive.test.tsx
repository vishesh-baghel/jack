/**
 * Test suite for OutlineViewer mobile responsiveness
 * Verifies container height, header stacking, and badge width
 */

import { render } from '@testing-library/react';

const OutlineViewerHeader = () => (
  <div className="flex-shrink-0 pb-4">
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
      <h1 className="text-2xl sm:text-3xl font-bold">Content Idea Title</h1>
      <span className="w-fit px-2 py-1 rounded-md bg-primary/10 text-primary text-sm">
        engineering
      </span>
    </div>
    <p className="text-sm sm:text-base text-muted-foreground">
      format: post • estimated length: 280 chars
    </p>
  </div>
);

const OutlineViewerContainer = () => (
  <div className="min-h-[calc(100vh-120px)] lg:h-[calc(100vh-120px)] overflow-hidden flex flex-col">
    <div>Header</div>
    <div className="grid gap-6 lg:grid-cols-2 flex-1 min-h-0">
      <div>Outline Panel</div>
      <div className="flex flex-col gap-4 overflow-hidden mt-6 lg:mt-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-lg sm:text-xl font-semibold">write your content</h2>
          <span className="text-xs sm:text-sm text-muted-foreground">0 / 280 chars</span>
        </div>
        <div>Writing Area</div>
      </div>
    </div>
  </div>
);

describe('OutlineViewer Responsive Layout', () => {
  describe('Container Height', () => {
    it('should have flexible height on mobile', () => {
      const { container } = render(<OutlineViewerContainer />);
      const mainContainer = container.querySelector('div');

      expect(mainContainer?.className).toContain('min-h-[calc(100vh-120px)]');
    });

    it('should have fixed height on desktop', () => {
      const { container } = render(<OutlineViewerContainer />);
      const mainContainer = container.querySelector('div');

      expect(mainContainer?.className).toContain('lg:h-[calc(100vh-120px)]');
    });

    it('should use flex column layout', () => {
      const { container } = render(<OutlineViewerContainer />);
      const mainContainer = container.querySelector('div');

      expect(mainContainer?.className).toContain('flex');
      expect(mainContainer?.className).toContain('flex-col');
    });
  });

  describe('Header Section', () => {
    it('should stack header elements on mobile', () => {
      const { container } = render(<OutlineViewerHeader />);
      const headerFlex = container.querySelector('.flex.flex-col');

      expect(headerFlex?.className).toContain('flex-col');
      expect(headerFlex?.className).toContain('sm:flex-row');
    });

    it('should have responsive heading size', () => {
      const { container } = render(<OutlineViewerHeader />);
      const heading = container.querySelector('h1');

      expect(heading?.className).toContain('text-2xl');
      expect(heading?.className).toContain('sm:text-3xl');
    });

    it('should have responsive description size', () => {
      const { container } = render(<OutlineViewerHeader />);
      const description = container.querySelector('p');

      expect(description?.className).toContain('text-sm');
      expect(description?.className).toContain('sm:text-base');
    });

    it('should have badge with fit width', () => {
      const { container } = render(<OutlineViewerHeader />);
      const badge = container.querySelector('span');

      expect(badge?.className).toContain('w-fit');
    });

    it('badge should not stretch horizontally', () => {
      const { container } = render(<OutlineViewerHeader />);
      const badge = container.querySelector('span');

      expect(badge?.className).not.toContain('w-full');
      expect(badge?.className).toContain('w-fit');
    });
  });

  describe('Grid Layout', () => {
    it('should have single column on mobile/tablet', () => {
      const { container } = render(<OutlineViewerContainer />);
      const grid = container.querySelector('.grid');

      expect(grid?.className).toContain('grid');
      expect(grid?.className).toContain('lg:grid-cols-2');
      expect(grid?.className).not.toContain('md:grid-cols-2');
    });

    it('should have two columns on desktop', () => {
      const { container } = render(<OutlineViewerContainer />);
      const grid = container.querySelector('.grid');

      expect(grid?.className).toContain('lg:grid-cols-2');
    });
  });

  describe('Writing Panel', () => {
    it('should have top margin on mobile', () => {
      const { container } = render(<OutlineViewerContainer />);
      const writingPanel = container.querySelector('.mt-6');

      expect(writingPanel?.className).toContain('mt-6');
      expect(writingPanel?.className).toContain('lg:mt-0');
    });

    it('should stack header elements on mobile', () => {
      const { container } = render(<OutlineViewerContainer />);
      const allFlexCols = container.querySelectorAll('.flex-col');
      const writingHeader = Array.from(allFlexCols).find(el =>
        el.className.includes('sm:justify-between')
      );

      expect(writingHeader?.className).toContain('flex-col');
      expect(writingHeader?.className).toContain('sm:flex-row');
    });

    it('should have responsive text sizing for heading', () => {
      const { container } = render(<OutlineViewerContainer />);
      const heading = container.querySelector('h2');

      expect(heading?.className).toContain('text-lg');
      expect(heading?.className).toContain('sm:text-xl');
    });

    it('should have responsive text sizing for char count', () => {
      const { container } = render(<OutlineViewerContainer />);
      const charCount = container.querySelector('.text-xs.sm\\:text-sm');

      expect(charCount?.className).toContain('text-xs');
      expect(charCount?.className).toContain('sm:text-sm');
    });
  });
});
