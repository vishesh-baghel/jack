/**
 * Hook for managing pagination state
 * Automatically resets to page 1 when dependencies change (filters, etc.)
 */

'use client';

import { useState, useEffect, useMemo } from 'react';

interface UsePaginationProps<T> {
  items: T[];
  itemsPerPage?: number;
  resetDependencies?: unknown[];
}

interface UsePaginationReturn<T> {
  currentPage: number;
  totalPages: number;
  paginatedItems: T[];
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export function usePagination<T>({
  items,
  itemsPerPage = 9,
  resetDependencies = [],
}: UsePaginationProps<T>): UsePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

  // Reset to page 1 when dependencies change (filters, status tabs, etc.)
  useEffect(() => {
    setCurrentPage(1);
  }, resetDependencies); // eslint-disable-line react-hooks/exhaustive-deps

  // Ensure current page is valid when items change
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [currentPage, totalPages]);

  // Get paginated items
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, itemsPerPage]);

  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    nextPage,
    prevPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
}
