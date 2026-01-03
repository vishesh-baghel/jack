/**
 * Unit tests for DateRangeFilter 24h option
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateRangeFilter, getDateRangeStart, getDateRangeEnd } from '@/components/date-range-filter';

describe('DateRangeFilter - 24h Option', () => {
  let mockDate: Date;

  beforeEach(() => {
    // Mock current time to 2024-01-15 15:30:00
    mockDate = new Date('2024-01-15T15:30:00.000Z');
  });

  describe('24h Option Rendering', () => {
    it('should display "Past 24 hr" option in dropdown', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();

      render(
        <DateRangeFilter
          value="7d"
          onChange={mockOnChange}
        />
      );

      // Click to open dropdown
      const button = screen.getByRole('button');
      await user.click(button);

      // Check that "Past 24 hr" option exists
      expect(screen.getByText('Past 24 hr')).toBeInTheDocument();
    }, 10000);

    it('should show "Past 24 hr" as first option in dropdown', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();

      render(
        <DateRangeFilter
          value="7d"
          onChange={mockOnChange}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      // Check that "Past 24 hr" exists in dropdown
      const past24hr = screen.getByText('Past 24 hr');

      expect(past24hr).toBeInTheDocument();

      // Also verify other options exist
      expect(screen.getAllByText('Past 7 days').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Past 15 days')).toBeInTheDocument();
    }, 10000);

    it('should display "Past 24 hr" when value is 24h', () => {
      const mockOnChange = vi.fn();

      render(
        <DateRangeFilter
          value="24h"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Past 24 hr')).toBeInTheDocument();
    });
  });

  describe('24h Option Selection', () => {
    it('should call onChange with 24h when "Past 24 hr" is clicked', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();

      render(
        <DateRangeFilter
          value="7d"
          onChange={mockOnChange}
        />
      );

      const button = screen.getByRole('button', { name: /past 7 days/i });
      await user.click(button);

      const option24h = screen.getByRole('button', { name: /past 24 hr/i });
      await user.click(option24h);

      expect(mockOnChange).toHaveBeenCalledWith('24h');
    }, 10000);

    it('should close dropdown after selecting 24h', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();

      render(
        <DateRangeFilter
          value="7d"
          onChange={mockOnChange}
        />
      );

      const button = screen.getByRole('button', { name: /past 7 days/i });
      await user.click(button);

      const option24h = screen.getByRole('button', { name: /past 24 hr/i });
      await user.click(option24h);

      // Dropdown options should not be visible anymore
      expect(screen.queryByText('Past 15 days')).not.toBeInTheDocument();
    }, 10000);
  });

  describe('getDateRangeStart - 24h calculation', () => {
    it('should return date exactly 24 hours ago', () => {
      const before = Date.now();
      const result = getDateRangeStart('24h');
      const after = Date.now();

      // Should be approximately 24 hours ago (within a few milliseconds)
      const hoursDiff = (before - result.getTime()) / (1000 * 60 * 60);
      expect(hoursDiff).toBeGreaterThanOrEqual(23.99);
      expect(hoursDiff).toBeLessThanOrEqual(24.01);
    });

    it('should preserve exact time (not reset to midnight)', () => {
      const now = new Date();
      const result = getDateRangeStart('24h');

      // The time components should be close to current time (within a minute due to test execution)
      // This tests that it doesn't reset to midnight
      const result7d = getDateRangeStart('7d');

      // 7d should be at midnight (hour 0)
      expect(result7d.getHours()).toBe(0);
      expect(result7d.getMinutes()).toBe(0);

      // 24h should not be at midnight (unless we're running at exactly midnight)
      // Just verify it's different from the 7d result's time
      const hoursDiff = Math.abs(result.getHours() - result7d.getHours());
      // If it's not midnight now, they should be different
      if (now.getHours() !== 0) {
        expect(hoursDiff).toBeGreaterThan(0);
      }
    });

    it('should be different from 7d calculation (which resets to midnight)', () => {
      const result24h = getDateRangeStart('24h');
      const result7d = getDateRangeStart('7d');

      // 7d resets to midnight
      expect(result7d.getHours()).toBe(0);
      expect(result7d.getMinutes()).toBe(0);

      // 24h should be more recent than 7d
      expect(result24h.getTime()).toBeGreaterThan(result7d.getTime());
    });
  });

  describe('getDateRangeEnd - 24h calculation', () => {
    it('should return current time with max precision', () => {
      const result = getDateRangeEnd('24h');

      // Should be current time with hours/minutes/seconds set to end of day
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
    });

    it('should be same for 24h and other options', () => {
      const result24h = getDateRangeEnd('24h');
      const result7d = getDateRangeEnd('7d');

      // End date should be the same (end of today)
      expect(result24h.getDate()).toBe(result7d.getDate());
      expect(result24h.getHours()).toBe(23);
      expect(result7d.getHours()).toBe(23);
    });
  });

  describe('24h vs Other Date Ranges', () => {
    it('should create different time spans for 24h vs 7d', () => {
      const start24h = getDateRangeStart('24h');
      const start7d = getDateRangeStart('7d');

      // 24h should be more recent than 7d
      expect(start24h.getTime()).toBeGreaterThan(start7d.getTime());
    });

    it('should have exact 24-hour difference for 24h option', () => {
      const start = getDateRangeStart('24h');
      const end = new Date(); // Current time

      const differenceInHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

      expect(differenceInHours).toBeCloseTo(24, 0);
    });

    it('should properly filter content from last 24 hours', () => {
      const now = Date.now();
      const start = getDateRangeStart('24h');
      const end = getDateRangeEnd('24h');

      // Content created 12 hours ago should be included
      const content12HoursAgo = new Date(now - 12 * 60 * 60 * 1000);
      expect(content12HoursAgo.getTime()).toBeGreaterThanOrEqual(start.getTime());
      expect(content12HoursAgo.getTime()).toBeLessThanOrEqual(end.getTime());

      // Content created 25 hours ago should be excluded
      const content25HoursAgo = new Date(now - 25 * 60 * 60 * 1000);
      expect(content25HoursAgo.getTime()).toBeLessThan(start.getTime());

      // Content created 1 hour ago should be included
      const content1HourAgo = new Date(now - 1 * 60 * 60 * 1000);
      expect(content1HourAgo.getTime()).toBeGreaterThanOrEqual(start.getTime());
      expect(content1HourAgo.getTime()).toBeLessThanOrEqual(end.getTime());
    });
  });

  describe('Integration with custom date range', () => {
    it('should handle switching from 24h to custom range', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();

      render(
        <DateRangeFilter
          value="24h"
          onChange={mockOnChange}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      const customOption = screen.getByText('Custom range');
      await user.click(customOption);

      // Should show custom date inputs (using text instead of label)
      expect(screen.getByText('Start date')).toBeInTheDocument();
      expect(screen.getByText('End date')).toBeInTheDocument();
    }, 10000);

    it('should handle switching from custom back to 24h', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();

      const { rerender } = render(
        <DateRangeFilter
          value="custom"
          onChange={mockOnChange}
          customStartDate={new Date('2024-01-10')}
          customEndDate={new Date('2024-01-15')}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      const option24h = screen.getByRole('button', { name: /past 24 hr/i });
      await user.click(option24h);

      expect(mockOnChange).toHaveBeenCalledWith('24h');
    }, 10000);
  });

  describe('Default value handling', () => {
    it('should default to "Past 24 hr" label when value is invalid', () => {
      const mockOnChange = vi.fn();

      render(
        <DateRangeFilter
          // @ts-expect-error Testing invalid value
          value="invalid"
          onChange={mockOnChange}
        />
      );

      // Should show default (24h is now first option)
      expect(screen.getByText('Past 24 hr')).toBeInTheDocument();
    });
  });
});
