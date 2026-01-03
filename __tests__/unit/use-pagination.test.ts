/**
 * Unit tests for usePagination hook
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '@/hooks/use-pagination';

describe('usePagination', () => {
  describe('Basic Pagination', () => {
    it('should paginate items correctly with default itemsPerPage (9)', () => {
      const items = Array.from({ length: 25 }, (_, i) => ({ id: i }));
      const { result } = renderHook(() => usePagination({ items }));

      expect(result.current.currentPage).toBe(1);
      expect(result.current.totalPages).toBe(3); // 25 items / 9 per page = 3 pages
      expect(result.current.paginatedItems).toHaveLength(9);
      expect(result.current.paginatedItems[0]).toEqual({ id: 0 });
      expect(result.current.paginatedItems[8]).toEqual({ id: 8 });
    });

    it('should paginate with custom itemsPerPage', () => {
      const items = Array.from({ length: 25 }, (_, i) => ({ id: i }));
      const { result } = renderHook(() =>
        usePagination({ items, itemsPerPage: 5 })
      );

      expect(result.current.totalPages).toBe(5); // 25 / 5 = 5 pages
      expect(result.current.paginatedItems).toHaveLength(5);
    });

    it('should handle exact multiple of itemsPerPage', () => {
      const items = Array.from({ length: 18 }, (_, i) => ({ id: i }));
      const { result } = renderHook(() => usePagination({ items }));

      expect(result.current.totalPages).toBe(2); // 18 / 9 = 2 pages exactly
    });

    it('should handle empty items array', () => {
      const { result } = renderHook(() => usePagination({ items: [] }));

      expect(result.current.currentPage).toBe(1);
      expect(result.current.totalPages).toBe(1); // Always at least 1 page
      expect(result.current.paginatedItems).toHaveLength(0);
      expect(result.current.hasNextPage).toBe(false);
      expect(result.current.hasPrevPage).toBe(false);
    });

    it('should handle single item', () => {
      const items = [{ id: 1 }];
      const { result } = renderHook(() => usePagination({ items }));

      expect(result.current.totalPages).toBe(1);
      expect(result.current.paginatedItems).toHaveLength(1);
      expect(result.current.paginatedItems[0]).toEqual({ id: 1 });
    });

    it('should handle items less than itemsPerPage', () => {
      const items = Array.from({ length: 5 }, (_, i) => ({ id: i }));
      const { result } = renderHook(() => usePagination({ items }));

      expect(result.current.totalPages).toBe(1);
      expect(result.current.paginatedItems).toHaveLength(5);
    });
  });

  describe('Navigation', () => {
    it('should navigate to next page', () => {
      const items = Array.from({ length: 25 }, (_, i) => ({ id: i }));
      const { result } = renderHook(() => usePagination({ items }));

      expect(result.current.currentPage).toBe(1);
      expect(result.current.hasNextPage).toBe(true);

      act(() => {
        result.current.nextPage();
      });

      expect(result.current.currentPage).toBe(2);
      expect(result.current.paginatedItems[0]).toEqual({ id: 9 });
      expect(result.current.paginatedItems[8]).toEqual({ id: 17 });
    });

    it('should navigate to previous page', () => {
      const items = Array.from({ length: 25 }, (_, i) => ({ id: i }));
      const { result } = renderHook(() => usePagination({ items }));

      // Go to page 2 first
      act(() => {
        result.current.nextPage();
      });

      expect(result.current.currentPage).toBe(2);
      expect(result.current.hasPrevPage).toBe(true);

      // Go back to page 1
      act(() => {
        result.current.prevPage();
      });

      expect(result.current.currentPage).toBe(1);
      expect(result.current.paginatedItems[0]).toEqual({ id: 0 });
    });

    it('should navigate to specific page with goToPage', () => {
      const items = Array.from({ length: 25 }, (_, i) => ({ id: i }));
      const { result } = renderHook(() => usePagination({ items }));

      act(() => {
        result.current.goToPage(3);
      });

      expect(result.current.currentPage).toBe(3);
      expect(result.current.paginatedItems[0]).toEqual({ id: 18 });
    });

    it('should not go beyond last page with nextPage', () => {
      const items = Array.from({ length: 10 }, (_, i) => ({ id: i }));
      const { result } = renderHook(() => usePagination({ items }));

      // We have 2 pages (10 items / 9 per page = 2)
      act(() => {
        result.current.nextPage(); // Go to page 2
      });

      expect(result.current.currentPage).toBe(2);
      expect(result.current.hasNextPage).toBe(false);

      act(() => {
        result.current.nextPage(); // Try to go to page 3 (should stay at 2)
      });

      expect(result.current.currentPage).toBe(2);
    });

    it('should not go below page 1 with prevPage', () => {
      const items = Array.from({ length: 25 }, (_, i) => ({ id: i }));
      const { result } = renderHook(() => usePagination({ items }));

      expect(result.current.currentPage).toBe(1);
      expect(result.current.hasPrevPage).toBe(false);

      act(() => {
        result.current.prevPage(); // Try to go to page 0 (should stay at 1)
      });

      expect(result.current.currentPage).toBe(1);
    });

    it('should clamp goToPage to valid range', () => {
      const items = Array.from({ length: 25 }, (_, i) => ({ id: i }));
      const { result } = renderHook(() => usePagination({ items }));

      // Try to go to page 10 (we only have 3 pages)
      act(() => {
        result.current.goToPage(10);
      });

      expect(result.current.currentPage).toBe(3); // Should clamp to max page

      // Try to go to page 0
      act(() => {
        result.current.goToPage(0);
      });

      expect(result.current.currentPage).toBe(1); // Should clamp to min page

      // Try negative page
      act(() => {
        result.current.goToPage(-5);
      });

      expect(result.current.currentPage).toBe(1);
    });
  });

  describe('hasNextPage and hasPrevPage flags', () => {
    it('should have correct flags on first page', () => {
      const items = Array.from({ length: 25 }, (_, i) => ({ id: i }));
      const { result } = renderHook(() => usePagination({ items }));

      expect(result.current.hasPrevPage).toBe(false);
      expect(result.current.hasNextPage).toBe(true);
    });

    it('should have correct flags on middle page', () => {
      const items = Array.from({ length: 25 }, (_, i) => ({ id: i }));
      const { result } = renderHook(() => usePagination({ items }));

      act(() => {
        result.current.goToPage(2);
      });

      expect(result.current.hasPrevPage).toBe(true);
      expect(result.current.hasNextPage).toBe(true);
    });

    it('should have correct flags on last page', () => {
      const items = Array.from({ length: 25 }, (_, i) => ({ id: i }));
      const { result } = renderHook(() => usePagination({ items }));

      act(() => {
        result.current.goToPage(3);
      });

      expect(result.current.hasPrevPage).toBe(true);
      expect(result.current.hasNextPage).toBe(false);
    });

    it('should have both flags false when only one page', () => {
      const items = Array.from({ length: 5 }, (_, i) => ({ id: i }));
      const { result } = renderHook(() => usePagination({ items }));

      expect(result.current.hasPrevPage).toBe(false);
      expect(result.current.hasNextPage).toBe(false);
    });
  });

  describe('Last page with partial items', () => {
    it('should show remaining items on last page', () => {
      const items = Array.from({ length: 25 }, (_, i) => ({ id: i }));
      const { result } = renderHook(() => usePagination({ items }));

      act(() => {
        result.current.goToPage(3); // Last page
      });

      expect(result.current.paginatedItems).toHaveLength(7); // 25 - (9 * 2) = 7 items
      expect(result.current.paginatedItems[0]).toEqual({ id: 18 });
      expect(result.current.paginatedItems[6]).toEqual({ id: 24 });
    });
  });

  describe('Reset on dependency change', () => {
    it('should reset to page 1 when resetDependencies change', () => {
      const items = Array.from({ length: 25 }, (_, i) => ({ id: i }));
      let dependency = 'status1';

      const { result, rerender } = renderHook(
        ({ dep }) => usePagination({
          items,
          resetDependencies: [dep]
        }),
        { initialProps: { dep: dependency } }
      );

      // Navigate to page 2
      act(() => {
        result.current.goToPage(2);
      });

      expect(result.current.currentPage).toBe(2);

      // Change dependency
      dependency = 'status2';
      rerender({ dep: dependency });

      // Should reset to page 1
      expect(result.current.currentPage).toBe(1);
    });

    it('should reset when multiple dependencies change', () => {
      const items = Array.from({ length: 25 }, (_, i) => ({ id: i }));
      let status = 'suggested';
      let dateRange = '7d';

      const { result, rerender } = renderHook(
        ({ s, d }) => usePagination({
          items,
          resetDependencies: [s, d]
        }),
        { initialProps: { s: status, d: dateRange } }
      );

      act(() => {
        result.current.goToPage(3);
      });

      expect(result.current.currentPage).toBe(3);

      // Change one dependency
      status = 'accepted';
      rerender({ s: status, d: dateRange });

      expect(result.current.currentPage).toBe(1);

      // Navigate again
      act(() => {
        result.current.goToPage(2);
      });

      // Change the other dependency
      dateRange = '15d';
      rerender({ s: status, d: dateRange });

      expect(result.current.currentPage).toBe(1);
    });

    it('should not reset when dependencies stay the same', () => {
      const items = Array.from({ length: 25 }, (_, i) => ({ id: i }));
      const dependency = 'status1';

      const { result, rerender } = renderHook(
        ({ dep }) => usePagination({
          items,
          resetDependencies: [dep]
        }),
        { initialProps: { dep: dependency } }
      );

      act(() => {
        result.current.goToPage(2);
      });

      expect(result.current.currentPage).toBe(2);

      // Rerender with same dependency
      rerender({ dep: dependency });

      // Should stay on page 2
      expect(result.current.currentPage).toBe(2);
    });
  });

  describe('Auto-adjust current page when items change', () => {
    it('should adjust current page if it exceeds new totalPages', () => {
      let items = Array.from({ length: 25 }, (_, i) => ({ id: i }));

      const { result, rerender } = renderHook(
        ({ itemsArray }) => usePagination({ items: itemsArray }),
        { initialProps: { itemsArray: items } }
      );

      // Go to page 3 (last page)
      act(() => {
        result.current.goToPage(3);
      });

      expect(result.current.currentPage).toBe(3);

      // Reduce items to only 10 (which gives us 2 pages)
      items = Array.from({ length: 10 }, (_, i) => ({ id: i }));
      rerender({ itemsArray: items });

      // Should auto-adjust to page 2 (the new last page)
      expect(result.current.currentPage).toBe(2);
      expect(result.current.totalPages).toBe(2);
    });

    it('should stay on current page if still valid after items change', () => {
      let items = Array.from({ length: 25 }, (_, i) => ({ id: i }));

      const { result, rerender } = renderHook(
        ({ itemsArray }) => usePagination({ items: itemsArray }),
        { initialProps: { itemsArray: items } }
      );

      act(() => {
        result.current.goToPage(2);
      });

      expect(result.current.currentPage).toBe(2);

      // Reduce items but still have 3 pages
      items = Array.from({ length: 20 }, (_, i) => ({ id: i }));
      rerender({ itemsArray: items });

      // Should stay on page 2
      expect(result.current.currentPage).toBe(2);
      expect(result.current.totalPages).toBe(3); // 20 / 9 = 3 pages
    });
  });

  describe('Type safety with generic items', () => {
    it('should work with different item types', () => {
      interface User {
        name: string;
        age: number;
      }

      const users: User[] = [
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 },
        { name: 'Charlie', age: 35 },
      ];

      const { result } = renderHook(() => usePagination({ items: users }));

      expect(result.current.paginatedItems).toHaveLength(3);
      expect(result.current.paginatedItems[0]).toEqual({ name: 'Alice', age: 25 });
    });
  });
});
