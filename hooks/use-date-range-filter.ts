/**
 * Hook for managing date range filter state with localStorage persistence
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { DateRangeOption, getDateRangeStart, getDateRangeEnd } from '@/components/date-range-filter';

const STORAGE_KEY = 'jack-date-range-filter';

interface StoredDateRange {
  range: DateRangeOption;
  customStart?: string;
  customEnd?: string;
}

interface UseDateRangeFilterReturn {
  dateRange: DateRangeOption;
  customStartDate: Date | undefined;
  customEndDate: Date | undefined;
  handleDateRangeChange: (option: DateRangeOption, startDate?: Date, endDate?: Date) => void;
  getStartDate: () => Date;
  getEndDate: () => Date;
}

const getStoredValue = (): StoredDateRange => {
  if (typeof window === 'undefined') {
    return { range: '7d' };
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return { range: '7d' };
};

export function useDateRangeFilter(): UseDateRangeFilterReturn {
  const [dateRange, setDateRange] = useState<DateRangeOption>('7d');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = getStoredValue();
    setDateRange(stored.range);
    if (stored.customStart) {
      setCustomStartDate(new Date(stored.customStart));
    }
    if (stored.customEnd) {
      setCustomEndDate(new Date(stored.customEnd));
    }
    setIsHydrated(true);
  }, []);

  const handleDateRangeChange = useCallback((
    option: DateRangeOption, 
    startDate?: Date, 
    endDate?: Date
  ) => {
    setDateRange(option);
    
    const toStore: StoredDateRange = { range: option };
    
    if (option === 'custom' && startDate && endDate) {
      setCustomStartDate(startDate);
      setCustomEndDate(endDate);
      toStore.customStart = startDate.toISOString().split('T')[0];
      toStore.customEnd = endDate.toISOString().split('T')[0];
    } else {
      setCustomStartDate(undefined);
      setCustomEndDate(undefined);
    }

    // Persist to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  }, []);

  const getStartDate = useCallback(() => {
    return getDateRangeStart(dateRange, customStartDate);
  }, [dateRange, customStartDate]);

  const getEndDate = useCallback(() => {
    return getDateRangeEnd(dateRange, customEndDate);
  }, [dateRange, customEndDate]);

  // Return default values until hydrated to avoid hydration mismatch
  if (!isHydrated) {
    return {
      dateRange: '7d',
      customStartDate: undefined,
      customEndDate: undefined,
      handleDateRangeChange,
      getStartDate: () => getDateRangeStart('7d', undefined),
      getEndDate: () => getDateRangeEnd('7d', undefined),
    };
  }

  return {
    dateRange,
    customStartDate,
    customEndDate,
    handleDateRangeChange,
    getStartDate,
    getEndDate,
  };
}
