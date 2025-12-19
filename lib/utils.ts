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
 * Get engagement color based on level
 */
export function getEngagementColor(level: 'low' | 'medium' | 'high'): string {
  switch (level) {
    case 'low':
      return 'text-gray-500';
    case 'medium':
      return 'text-yellow-600';
    case 'high':
      return 'text-green-600';
    default:
      return 'text-gray-500';
  }
}

/**
 * Get pillar color
 */
export function getPillarColor(pillar: string): string {
  const colors: Record<string, string> = {
    engineering: 'bg-blue-100 text-blue-800',
    career: 'bg-purple-100 text-purple-800',
    learning: 'bg-green-100 text-green-800',
    productivity: 'bg-orange-100 text-orange-800',
    side_projects: 'bg-pink-100 text-pink-800',
    lessons_learned: 'bg-indigo-100 text-indigo-800',
    helpful_content: 'bg-teal-100 text-teal-800',
    build_progress: 'bg-cyan-100 text-cyan-800',
  };
  
  return colors[pillar] || 'bg-gray-100 text-gray-800';
}
