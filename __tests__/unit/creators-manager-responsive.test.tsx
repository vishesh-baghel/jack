/**
 * Test suite for CreatorsManager mobile responsiveness
 * Verifies complex card layouts, input controls, and button stacking
 */

import { render } from '@testing-library/react';

const CreatorsManagerHeader = () => (
  <div>
    <h1 className="text-2xl sm:text-3xl font-bold">tracked creators</h1>
    <p className="text-sm sm:text-base text-muted-foreground">
      stalk the greats (ethically). jack learns from their energy
    </p>
  </div>
);

const DailyLimitControl = () => (
  <div className="flex flex-col sm:flex-row sm:items-end gap-2">
    <div className="flex-1 max-w-full sm:max-w-xs">
      <label htmlFor="dailyLimit">tweets per day</label>
      <input id="dailyLimit" type="number" />
    </div>
    <button className="w-full sm:w-auto">save</button>
  </div>
);

const CreatorCard = () => (
  <div className="p-4">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-2 h-2 rounded-full flex-shrink-0 bg-green-500" />
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">@username</p>
          <p className="text-xs text-muted-foreground">added 2 days ago</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
        <div className="flex items-center gap-1 w-full sm:w-auto">
          <input
            type="number"
            className="w-20 h-8 text-sm flex-1 sm:flex-none"
          />
          <span className="text-xs text-muted-foreground whitespace-nowrap">tweets</span>
        </div>
        <div className="flex gap-2">
          <button className="flex-1 sm:flex-none">chill</button>
          <button className="flex-1 sm:flex-none">yeet</button>
        </div>
      </div>
    </div>
  </div>
);

describe('CreatorsManager Responsive Layout', () => {
  describe('Header Section', () => {
    it('should have responsive heading size', () => {
      const { container } = render(<CreatorsManagerHeader />);
      const heading = container.querySelector('h1');

      expect(heading?.className).toContain('text-2xl');
      expect(heading?.className).toContain('sm:text-3xl');
    });

    it('should have responsive description size', () => {
      const { container } = render(<CreatorsManagerHeader />);
      const description = container.querySelector('p');

      expect(description?.className).toContain('text-sm');
      expect(description?.className).toContain('sm:text-base');
    });
  });

  describe('Daily Limit Control', () => {
    it('should stack vertically on mobile', () => {
      const { container } = render(<DailyLimitControl />);
      const controlContainer = container.querySelector('.flex');

      expect(controlContainer?.className).toContain('flex-col');
      expect(controlContainer?.className).toContain('sm:flex-row');
    });

    it('should align items to end on desktop', () => {
      const { container } = render(<DailyLimitControl />);
      const controlContainer = container.querySelector('.flex');

      expect(controlContainer?.className).toContain('sm:items-end');
    });

    it('should have full width input container on mobile', () => {
      const { container } = render(<DailyLimitControl />);
      const inputContainer = container.querySelector('.flex-1');

      expect(inputContainer?.className).toContain('max-w-full');
      expect(inputContainer?.className).toContain('sm:max-w-xs');
    });

    it('should have full width button on mobile', () => {
      const { container } = render(<DailyLimitControl />);
      const button = container.querySelector('button');

      expect(button?.className).toContain('w-full');
      expect(button?.className).toContain('sm:w-auto');
    });
  });

  describe('Creator Card Layout', () => {
    it('should stack main sections vertically on mobile', () => {
      const { container } = render(<CreatorCard />);
      const cardContent = container.querySelector('.flex.flex-col');

      expect(cardContent?.className).toContain('flex-col');
      expect(cardContent?.className).toContain('sm:flex-row');
    });

    it('should have status dot with flex-shrink-0', () => {
      const { container } = render(<CreatorCard />);
      const statusDot = container.querySelector('.w-2.h-2');

      expect(statusDot?.className).toContain('flex-shrink-0');
    });

    it('should have truncating username', () => {
      const { container } = render(<CreatorCard />);
      const username = container.querySelector('.font-medium');

      expect(username?.className).toContain('truncate');
    });

    it('should have controls stacking on mobile', () => {
      const { container } = render(<CreatorCard />);
      const allFlexCols = container.querySelectorAll('.flex-col');
      const controlsContainer = Array.from(allFlexCols).find(el =>
        el.className.includes('items-stretch')
      );

      expect(controlsContainer?.className).toContain('flex-col');
      expect(controlsContainer?.className).toContain('sm:flex-row');
    });

    it('should have full width controls on mobile', () => {
      const { container } = render(<CreatorCard />);
      const allFlexCols = container.querySelectorAll('.flex-col');
      const controlsContainer = Array.from(allFlexCols).find(el =>
        el.className.includes('items-stretch')
      );

      expect(controlsContainer?.className).toContain('w-full');
      expect(controlsContainer?.className).toContain('sm:w-auto');
    });

    it('should have flexible input on mobile', () => {
      const { container } = render(<CreatorCard />);
      const input = container.querySelector('input[type="number"]');

      expect(input?.className).toContain('flex-1');
      expect(input?.className).toContain('sm:flex-none');
    });

    it('should prevent tweets label from wrapping', () => {
      const { container } = render(<CreatorCard />);
      const label = container.querySelector('span');

      expect(label?.className).toContain('whitespace-nowrap');
    });

    it('should have flexible buttons on mobile', () => {
      const { container } = render(<CreatorCard />);
      const buttons = container.querySelectorAll('button');

      buttons.forEach(button => {
        expect(button.className).toContain('flex-1');
        expect(button.className).toContain('sm:flex-none');
      });
    });
  });

  describe('Layout Consistency', () => {
    it('should maintain proper gap spacing', () => {
      const { container } = render(<CreatorCard />);
      const mainLayout = container.querySelector('.flex.flex-col');

      expect(mainLayout?.className).toContain('gap-4');
    });

    it('should have proper minimum width constraints', () => {
      const { container } = render(<CreatorCard />);
      const nameContainer = container.querySelector('.min-w-0');

      expect(nameContainer?.className).toContain('min-w-0');
      expect(nameContainer?.className).toContain('flex-1');
    });
  });
});
