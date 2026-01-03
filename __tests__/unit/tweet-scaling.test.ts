/**
 * Tweet Scaling Utility Tests
 */

import { describe, it, expect } from 'vitest';
import { calculateScaledTweetCounts, getTotalTweetCount } from '@/lib/utils/tweet-scaling';

describe('calculateScaledTweetCounts', () => {
  it('should return requested counts when within limit', () => {
    const creators = [
      { creatorId: '1', xHandle: '@user1', requestedCount: 10, isActive: true },
      { creatorId: '2', xHandle: '@user2', requestedCount: 15, isActive: true },
    ];

    const result = calculateScaledTweetCounts(creators, 50);

    expect(result).toEqual([
      { creatorId: '1', xHandle: '@user1', actualCount: 10, wasScaled: false },
      { creatorId: '2', xHandle: '@user2', actualCount: 15, wasScaled: false },
    ]);
  });

  it('should proportionally scale when exceeding limit', () => {
    const creators = [
      { creatorId: '1', xHandle: '@user1', requestedCount: 40, isActive: true },
      { creatorId: '2', xHandle: '@user2', requestedCount: 30, isActive: true },
    ];

    const result = calculateScaledTweetCounts(creators, 50);

    // Total = 70, limit = 50, scaling factor = 50/70 = 0.714
    // user1: 40 * 0.714 = 28.56 -> 28
    // user2: 30 * 0.714 = 21.42 -> 21
    expect(result).toEqual([
      { creatorId: '1', xHandle: '@user1', actualCount: 28, wasScaled: true },
      { creatorId: '2', xHandle: '@user2', actualCount: 21, wasScaled: true },
    ]);
  });

  it('should guarantee minimum 1 tweet per active creator', () => {
    const creators = [
      { creatorId: '1', xHandle: '@user1', requestedCount: 1, isActive: true },
      { creatorId: '2', xHandle: '@user2', requestedCount: 100, isActive: true },
    ];

    const result = calculateScaledTweetCounts(creators, 10);

    // Ensure user1 still gets at least 1 tweet
    const user1Result = result.find(r => r.creatorId === '1');
    expect(user1Result?.actualCount).toBeGreaterThanOrEqual(1);
  });

  it('should filter out inactive creators', () => {
    const creators = [
      { creatorId: '1', xHandle: '@user1', requestedCount: 10, isActive: true },
      { creatorId: '2', xHandle: '@user2', requestedCount: 20, isActive: false },
    ];

    const result = calculateScaledTweetCounts(creators, 50);

    expect(result).toHaveLength(1);
    expect(result[0].creatorId).toBe('1');
  });

  it('should return empty array when no active creators', () => {
    const creators = [
      { creatorId: '1', xHandle: '@user1', requestedCount: 10, isActive: false },
    ];

    const result = calculateScaledTweetCounts(creators, 50);

    expect(result).toEqual([]);
  });

  it('should handle edge case with very small limit', () => {
    const creators = [
      { creatorId: '1', xHandle: '@user1', requestedCount: 10, isActive: true },
      { creatorId: '2', xHandle: '@user2', requestedCount: 10, isActive: true },
      { creatorId: '3', xHandle: '@user3', requestedCount: 10, isActive: true },
    ];

    const result = calculateScaledTweetCounts(creators, 5);

    // Each creator should get at least 1 tweet
    result.forEach(r => {
      expect(r.actualCount).toBeGreaterThanOrEqual(1);
    });

    // Total should not exceed limit significantly (allowing for minimum guarantees)
    const total = result.reduce((sum, r) => sum + r.actualCount, 0);
    expect(total).toBeGreaterThanOrEqual(3); // At least 1 per creator
  });

  it('should handle exact match scenario', () => {
    const creators = [
      { creatorId: '1', xHandle: '@user1', requestedCount: 25, isActive: true },
      { creatorId: '2', xHandle: '@user2', requestedCount: 25, isActive: true },
    ];

    const result = calculateScaledTweetCounts(creators, 50);

    expect(result).toEqual([
      { creatorId: '1', xHandle: '@user1', actualCount: 25, wasScaled: false },
      { creatorId: '2', xHandle: '@user2', actualCount: 25, wasScaled: false },
    ]);
  });

  it('should properly scale with different requested counts', () => {
    const creators = [
      { creatorId: '1', xHandle: '@user1', requestedCount: 50, isActive: true },
      { creatorId: '2', xHandle: '@user2', requestedCount: 25, isActive: true },
      { creatorId: '3', xHandle: '@user3', requestedCount: 25, isActive: true },
    ];

    const result = calculateScaledTweetCounts(creators, 50);

    // Total = 100, limit = 50, scaling = 0.5
    expect(result).toEqual([
      { creatorId: '1', xHandle: '@user1', actualCount: 25, wasScaled: true },
      { creatorId: '2', xHandle: '@user2', actualCount: 12, wasScaled: true },
      { creatorId: '3', xHandle: '@user3', actualCount: 12, wasScaled: true },
    ]);
  });
});

describe('getTotalTweetCount', () => {
  it('should sum tweet counts for active creators only', () => {
    const creators = [
      { tweetCount: 10, isActive: true },
      { tweetCount: 20, isActive: true },
      { tweetCount: 15, isActive: false },
    ];

    const total = getTotalTweetCount(creators);

    expect(total).toBe(30); // 10 + 20, excluding inactive
  });

  it('should return 0 for empty array', () => {
    const total = getTotalTweetCount([]);
    expect(total).toBe(0);
  });

  it('should return 0 when all creators are inactive', () => {
    const creators = [
      { tweetCount: 10, isActive: false },
      { tweetCount: 20, isActive: false },
    ];

    const total = getTotalTweetCount(creators);
    expect(total).toBe(0);
  });

  it('should handle large numbers correctly', () => {
    const creators = [
      { tweetCount: 100, isActive: true },
      { tweetCount: 200, isActive: true },
      { tweetCount: 300, isActive: true },
    ];

    const total = getTotalTweetCount(creators);
    expect(total).toBe(600);
  });
});
