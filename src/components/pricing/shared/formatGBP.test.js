import { describe, it, expect } from 'vitest';
import formatGBP from './formatGBP.js';

/**
 * Test suite for formatGBP utility function
 * Based on Cornerstone pattern
 */
describe('formatGBP', () => {
  it('should format positive integers correctly', () => {
    expect(formatGBP(1000)).toBe('£1,000');
    expect(formatGBP(42750)).toBe('£42,750');
    expect(formatGBP(1000000)).toBe('£1,000,000');
  });

  it('should format zero correctly', () => {
    expect(formatGBP(0)).toBe('£0');
  });

  it('should format decimals with specified decimal places', () => {
    expect(formatGBP(1000.567, 2)).toBe('£1,000.57');
    expect(formatGBP(42750.123, 1)).toBe('£42,750.1');
  });

  it('should default to 0 decimal places', () => {
    expect(formatGBP(1000.999)).toBe('£1,001');
    expect(formatGBP(42750.5)).toBe('£42,751');
  });

  it('should handle negative numbers', () => {
    expect(formatGBP(-1000)).toBe('-£1,000');
    expect(formatGBP(-42750)).toBe('-£42,750');
  });

  it('should handle Infinity and NaN gracefully', () => {
    expect(formatGBP(Infinity)).toBe('£0');
    expect(formatGBP(-Infinity)).toBe('£0');
    expect(formatGBP(NaN)).toBe('£0');
  });

  it('should use en-GB locale formatting', () => {
    // en-GB uses comma as thousand separator, period as decimal
    expect(formatGBP(1234567.89, 2)).toBe('£1,234,567.89');
  });
});
