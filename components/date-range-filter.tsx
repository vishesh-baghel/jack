/**
 * Date Range Filter Component
 * Reusable filter for selecting date ranges
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type DateRangeOption = '24h' | '7d' | '15d' | '30d' | 'custom';

interface DateRangeFilterProps {
  value: DateRangeOption;
  onChange: (option: DateRangeOption, startDate?: Date, endDate?: Date) => void;
  customStartDate?: Date;
  customEndDate?: Date;
}

const OPTIONS: { value: DateRangeOption; label: string }[] = [
  { value: '24h', label: 'Past 24 hr' },
  { value: '7d', label: 'Past 7 days' },
  { value: '15d', label: 'Past 15 days' },
  { value: '30d', label: 'Past month' },
  { value: 'custom', label: 'Custom range' },
];

export function DateRangeFilter({ 
  value, 
  onChange, 
  customStartDate, 
  customEndDate 
}: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomInputs, setShowCustomInputs] = useState(false);
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCustomInputs(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDisplayLabel = (): string => {
    if (value === 'custom' && customStartDate && customEndDate) {
      const start = customStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const end = customEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${start} - ${end}`;
    }
    return OPTIONS.find(opt => opt.value === value)?.label || 'Past 24 hr';
  };

  const handleOptionSelect = (option: DateRangeOption) => {
    if (option === 'custom') {
      setShowCustomInputs(true);
      // Use existing custom dates if available, otherwise default to past 7 days
      if (customStartDate && customEndDate) {
        setTempStartDate(formatDateForInput(customStartDate));
        setTempEndDate(formatDateForInput(customEndDate));
      } else {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 7);
        setTempStartDate(formatDateForInput(start));
        setTempEndDate(formatDateForInput(end));
      }
    } else {
      onChange(option);
      setIsOpen(false);
      setShowCustomInputs(false);
    }
  };

  const handleApplyCustomRange = () => {
    if (tempStartDate && tempEndDate) {
      const start = new Date(tempStartDate);
      const end = new Date(tempEndDate);
      end.setHours(23, 59, 59, 999); // Include the entire end day
      onChange('custom', start, end);
      setIsOpen(false);
      setShowCustomInputs(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="min-w-[120px] justify-between gap-2 text-xs sm:text-sm whitespace-nowrap"
      >
        <span className="truncate">{getDisplayLabel()}</span>
        <svg
          className={`h-4 w-4 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 w-[min(240px,calc(100vw-2rem))] bg-background border rounded-md shadow-lg">
          {!showCustomInputs ? (
            <div className="py-1">
              {OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleOptionSelect(option.value)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-muted cursor-pointer transition-colors ${
                    value === option.value ? 'bg-muted/50 font-medium' : ''
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-2.5 space-y-2.5">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Start date</label>
                <Input
                  type="date"
                  value={tempStartDate}
                  onChange={(e) => setTempStartDate(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">End date</label>
                <Input
                  type="date"
                  value={tempEndDate}
                  onChange={(e) => setTempEndDate(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCustomInputs(false)}
                  className="flex-1"
                >
                  back
                </Button>
                <Button
                  size="sm"
                  onClick={handleApplyCustomRange}
                  disabled={!tempStartDate || !tempEndDate}
                  className="flex-1"
                >
                  apply
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Helper function to get the start date based on the selected option
 */
export function getDateRangeStart(option: DateRangeOption, customStartDate?: Date): Date {
  if (option === 'custom' && customStartDate) {
    return customStartDate;
  }

  const now = new Date();
  const start = new Date();

  switch (option) {
    case '24h':
      start.setHours(now.getHours() - 24);
      break;
    case '7d':
      start.setDate(now.getDate() - 7);
      break;
    case '15d':
      start.setDate(now.getDate() - 15);
      break;
    case '30d':
      start.setDate(now.getDate() - 30);
      break;
    default:
      start.setDate(now.getDate() - 7);
  }

  // For 24h, keep precise time; for day ranges, reset to midnight
  if (option !== '24h') {
    start.setHours(0, 0, 0, 0);
  }
  return start;
}

/**
 * Helper function to get the end date based on the selected option
 */
export function getDateRangeEnd(option: DateRangeOption, customEndDate?: Date): Date {
  if (option === 'custom' && customEndDate) {
    return customEndDate;
  }
  
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return end;
}
