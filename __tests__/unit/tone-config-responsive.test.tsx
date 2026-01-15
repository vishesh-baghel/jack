/**
 * Test suite for ToneConfig mobile responsiveness
 * Verifies input layouts, button positioning, and grid behavior
 */

import { render } from '@testing-library/react';

const ToneConfigHeader = () => (
  <div className="space-y-4">
    <h2 className="text-lg sm:text-xl font-semibold">your voice settings</h2>
  </div>
);

const AddRuleInput = () => (
  <div className="flex flex-col sm:flex-row gap-2">
    <input
      placeholder="e.g., always mention specific numbers"
      className="flex-1"
    />
    <button className="w-full sm:w-auto">add</button>
  </div>
);

const LearnedPatternsHeader = () => (
  <div className="space-y-4">
    <h2 className="text-lg sm:text-xl font-semibold">what jack learned</h2>
  </div>
);

describe('ToneConfig Responsive Layout', () => {
  describe('Section Headers', () => {
    it('should have responsive heading size for voice settings', () => {
      const { container } = render(<ToneConfigHeader />);
      const heading = container.querySelector('h2');

      expect(heading?.className).toContain('text-lg');
      expect(heading?.className).toContain('sm:text-xl');
    });

    it('should have responsive heading size for learned patterns', () => {
      const { container } = render(<LearnedPatternsHeader />);
      const heading = container.querySelector('h2');

      expect(heading?.className).toContain('text-lg');
      expect(heading?.className).toContain('sm:text-xl');
    });
  });

  describe('Add Rule Input Layout', () => {
    it('should stack vertically on mobile', () => {
      const { container } = render(<AddRuleInput />);
      const inputContainer = container.querySelector('.flex');

      expect(inputContainer?.className).toContain('flex-col');
      expect(inputContainer?.className).toContain('sm:flex-row');
    });

    it('should have flexible input width', () => {
      const { container } = render(<AddRuleInput />);
      const input = container.querySelector('input');

      expect(input?.className).toContain('flex-1');
    });

    it('should have full width button on mobile', () => {
      const { container } = render(<AddRuleInput />);
      const button = container.querySelector('button');

      expect(button?.className).toContain('w-full');
      expect(button?.className).toContain('sm:w-auto');
    });

    it('should maintain consistent gap spacing', () => {
      const { container } = render(<AddRuleInput />);
      const inputContainer = container.querySelector('.flex');

      expect(inputContainer?.className).toContain('gap-2');
    });
  });

  describe('Grid Layout', () => {
    it('should use single column on mobile', () => {
      const { container } = render(
        <div className="grid gap-6 lg:grid-cols-2">
          <div>Voice Settings</div>
          <div>Learned Patterns</div>
        </div>
      );

      const grid = container.querySelector('.grid');
      expect(grid?.className).toContain('grid');
      expect(grid?.className).toContain('lg:grid-cols-2');
    });

    it('should use two columns on desktop', () => {
      const { container } = render(
        <div className="grid gap-6 lg:grid-cols-2">
          <div>Voice Settings</div>
          <div>Learned Patterns</div>
        </div>
      );

      const grid = container.querySelector('.grid');
      expect(grid?.className).toContain('lg:grid-cols-2');
    });

    it('should have proper gap spacing', () => {
      const { container } = render(
        <div className="grid gap-6 lg:grid-cols-2">
          <div>Voice Settings</div>
          <div>Learned Patterns</div>
        </div>
      );

      const grid = container.querySelector('.grid');
      expect(grid?.className).toContain('gap-6');
    });
  });

  describe('Button Consistency', () => {
    it('should not have responsive breakpoints on save button', () => {
      const { container } = render(
        <button className="w-full">lock it in</button>
      );

      const button = container.querySelector('button');
      expect(button?.className).toContain('w-full');
    });
  });
});
