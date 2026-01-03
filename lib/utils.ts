/**
 * Utility functions for UI components
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date to relative time
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * Get engagement color (consistent color for all levels)
 */
export function getEngagementColor(level: 'low' | 'medium' | 'high'): string {
  return 'bg-muted text-foreground';
}

/**
 * Get pillar color (consistent color for all pillars)
 */
export function getPillarColor(pillar: string): string {
  return 'bg-muted text-foreground';
}

/**
 * Format label by converting snake_case and kebab-case to normal text
 */
export function formatLabel(text: string): string {
  return text.replace(/[_-]/g, ' ');
}
