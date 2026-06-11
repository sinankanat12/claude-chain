import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { parseResetTime } from '../src/parser.js';

describe('parseResetTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Fix "now" to 2026-06-11 10:00:00 UTC
    vi.setSystemTime(new Date('2026-06-11T10:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('format-d: parses unix timestamp (seconds)', () => {
    // 12:30 UTC = now + 2.5h
    const ts = Math.floor(new Date('2026-06-11T12:30:00.000Z').getTime() / 1000);
    const result = parseResetTime(`reset_at: ${ts}`);
    expect(result.source).toBe('format-d');
    expect(result.resetTime).not.toBeNull();
    // waitMs = 2.5h + 5min buffer = 9300000ms
    expect(result.waitMs).toBe(9_300_000);
  });

  it('format-d: parses unix timestamp (milliseconds)', () => {
    const ts = new Date('2026-06-11T12:30:00.000Z').getTime();
    const result = parseResetTime(`reset_at: ${ts}`);
    expect(result.source).toBe('format-d');
    expect(result.waitMs).toBe(9_300_000);
  });

  it('format-c: parses "resets in 4 hours 23 minutes"', () => {
    const result = parseResetTime('Usage limit reached, resets in 4 hours 23 minutes');
    expect(result.source).toBe('format-c');
    // waitMs = (4*60+23)*60*1000 + 300000 = 16080000
    expect(result.waitMs).toBe(16_080_000);
    expect(result.resetTime).not.toBeNull();
  });

  it('format-c: parses "resets in 23 minutes" (no hours)', () => {
    const result = parseResetTime('resets in 23 minutes');
    expect(result.source).toBe('format-c');
    // waitMs = 23*60*1000 + 300000 = 1680000
    expect(result.waitMs).toBe(1_680_000);
  });

  it('format-c: parses "resets in 2 hours" (no minutes)', () => {
    const result = parseResetTime('resets in 2 hours');
    expect(result.source).toBe('format-c');
    // waitMs = 2*3600*1000 + 300000 = 7500000
    expect(result.waitMs).toBe(7_500_000);
  });

  it('default: returns 5h when nothing matches', () => {
    const result = parseResetTime('some random output that has no time info');
    expect(result.source).toBe('default');
    expect(result.resetTime).toBeNull();
    expect(result.waitMs).toBe(18_000_000); // 5 * 60 * 60 * 1000
  });

  it('default: empty string returns 5h', () => {
    const result = parseResetTime('');
    expect(result.source).toBe('default');
    expect(result.waitMs).toBe(18_000_000);
  });
});
