/**
 * Test suite for pagination and date range filter layout
 * Verifies that pagination stays on left, date range on right at all screen sizes
 */

import { render, screen } from '@testing-library/react';
import { Pagination } from '@/components/pagination';
import { DateRangeFilter } from '@/components/date-range-filter';

describe('Pagination and DateRangeFilter Layout', () => {
  it('should render pagination component on the left side', () => {
    const { container } = render(
      <div className="flex items-center justify-between gap-2">
        <Pagination
          currentPage={1}
          totalPages={5}
          onPrevPage={() => {}}
          onNextPage={() => {}}
          hasPrevPage={false}
          hasNextPage={true}
        />
        <DateRangeFilter
          value="all"
          onChange={() => {}}
          customStartDate=""
          customEndDate=""
        />
      </div>
    );

    const flexContainer = container.querySelector('.flex.justify-between');
    expect(flexContainer).toBeTruthy();

    // Pagination should be first child (left side)
    const children = flexContainer?.children;
    expect(children?.[0]).toContainHTML('1/5'); // Pagination content
  });

  it('should render date range filter on the right side', () => {
    const { container } = render(
      <div className="flex items-center justify-between gap-2">
        <Pagination
          currentPage={1}
          totalPages={5}
          onPrevPage={() => {}}
          onNextPage={() => {}}
          hasPrevPage={false}
          hasNextPage={true}
        />
        <DateRangeFilter
          value="last_24h"
          onChange={() => {}}
          customStartDate=""
          customEndDate=""
        />
      </div>
    );

    const flexContainer = container.querySelector('.flex.justify-between');
    const children = flexContainer?.children;

    // DateRangeFilter should be second child (right side)
    expect(children?.[1]).toContainHTML('Past 24 hr'); // Date range button content
  });

  it('should use justify-between class for proper spacing', () => {
    const { container } = render(
      <div className="flex items-center justify-between gap-2">
        <Pagination
          currentPage={1}
          totalPages={5}
          onPrevPage={() => {}}
          onNextPage={() => {}}
          hasPrevPage={false}
          hasNextPage={true}
        />
        <DateRangeFilter
          value="last_7d"
          onChange={() => {}}
          customStartDate=""
          customEndDate=""
        />
      </div>
    );

    const flexContainer = container.querySelector('.flex');
    expect(flexContainer?.className).toContain('justify-between');
  });

  it('should not have justify-end class that would break mobile layout', () => {
    const { container } = render(
      <div className="flex items-center justify-between gap-2">
        <Pagination
          currentPage={1}
          totalPages={5}
          onPrevPage={() => {}}
          onNextPage={() => {}}
          hasPrevPage={false}
          hasNextPage={true}
        />
        <DateRangeFilter
          value="last_30d"
          onChange={() => {}}
          customStartDate=""
          customEndDate=""
        />
      </div>
    );

    const flexContainer = container.querySelector('.flex');
    expect(flexContainer?.className).not.toContain('justify-end');
  });

  it('date range button should not take full width on mobile', () => {
    render(
      <DateRangeFilter
        value="last_24h"
        onChange={() => {}}
        customStartDate=""
        customEndDate=""
      />
    );

    const button = screen.getByRole('button', { name: /past 24 hr/i });
    expect(button.className).not.toContain('w-full');
    expect(button.className).toContain('min-w-[120px]');
  });

  it('date range button should have fixed minimum width', () => {
    render(
      <DateRangeFilter
        value="last_week"
        onChange={() => {}}
        customStartDate=""
        customEndDate=""
      />
    );

    const button = screen.getByRole('button');
    expect(button.className).toContain('min-w-[120px]');
  });

  it('should maintain layout with different pagination states', () => {
    const { rerender, container } = render(
      <div className="flex items-center justify-between gap-2">
        <Pagination
          currentPage={1}
          totalPages={10}
          onPrevPage={() => {}}
          onNextPage={() => {}}
          hasPrevPage={false}
          hasNextPage={true}
        />
        <DateRangeFilter
          value="last_7d"
          onChange={() => {}}
          customStartDate=""
          customEndDate=""
        />
      </div>
    );

    let flexContainer = container.querySelector('.flex.justify-between');
    let children = flexContainer?.children;
    expect(children).toHaveLength(2);

    // Re-render with different page
    rerender(
      <div className="flex items-center justify-between gap-2">
        <Pagination
          currentPage={5}
          totalPages={10}
          onPrevPage={() => {}}
          onNextPage={() => {}}
          hasPrevPage={true}
          hasNextPage={true}
        />
        <DateRangeFilter
          value="last_30d"
          onChange={() => {}}
          customStartDate=""
          customEndDate=""
        />
      </div>
    );

    flexContainer = container.querySelector('.flex.justify-between');
    children = flexContainer?.children;
    expect(children).toHaveLength(2);
    expect(children?.[0]).toContainHTML('5/10');
  });

  it('should always render pagination even with only 1 page', () => {
    const { container } = render(
      <div className="flex items-center justify-between gap-2">
        <Pagination
          currentPage={1}
          totalPages={1}
          onPrevPage={() => {}}
          onNextPage={() => {}}
          hasPrevPage={false}
          hasNextPage={false}
        />
        <DateRangeFilter
          value="last_7d"
          onChange={() => {}}
          customStartDate=""
          customEndDate=""
        />
      </div>
    );

    const flexContainer = container.querySelector('.flex.justify-between');
    const children = flexContainer?.children;

    // Should still have 2 children even with 1 page
    expect(children).toHaveLength(2);
    // Pagination should show 1/1
    expect(children?.[0]).toContainHTML('1/1');
    // Both buttons should be disabled
    const buttons = children?.[0]?.querySelectorAll('button');
    expect(buttons?.[0]).toBeDisabled();
    expect(buttons?.[1]).toBeDisabled();
  });

  it('should maintain date range filter on right even with no pagination needed', () => {
    const { container } = render(
      <div className="flex items-center justify-between gap-2">
        <Pagination
          currentPage={1}
          totalPages={1}
          onPrevPage={() => {}}
          onNextPage={() => {}}
          hasPrevPage={false}
          hasNextPage={false}
        />
        <DateRangeFilter
          value="last_24h"
          onChange={() => {}}
          customStartDate=""
          customEndDate=""
        />
      </div>
    );

    const flexContainer = container.querySelector('.flex.justify-between');
    const children = flexContainer?.children;

    // DateRangeFilter should still be second child (right side)
    expect(children).toHaveLength(2);
    expect(children?.[1]).toContainHTML('Past 24 hr');
  });
});
