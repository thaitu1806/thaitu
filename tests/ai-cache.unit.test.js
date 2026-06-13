/**
 * Unit tests for lib/ai-cache.js
 * Tests cache operations, TTL behavior, hash generation, and expiration cleanup.
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  hashPrompt,
  getCached,
  setCache,
  clearExpired,
  cacheSize,
  clearAll,
} from '../lib/ai-cache.js';

describe('hashPrompt', () => {
  test('returns consistent hash for same input', () => {
    const hash1 = hashPrompt('Hello world');
    const hash2 = hashPrompt('Hello world');
    expect(hash1).toBe(hash2);
  });

  test('returns different hashes for different inputs', () => {
    const hash1 = hashPrompt('Hello world');
    const hash2 = hashPrompt('Hello World');
    expect(hash1).not.toBe(hash2);
  });

  test('returns "0" for empty string', () => {
    expect(hashPrompt('')).toBe('0');
  });

  test('returns "0" for null input', () => {
    expect(hashPrompt(null)).toBe('0');
  });

  test('returns "0" for undefined input', () => {
    expect(hashPrompt(undefined)).toBe('0');
  });

  test('returns "0" for non-string input', () => {
    expect(hashPrompt(123)).toBe('0');
  });

  test('handles Unicode characters (Vietnamese)', () => {
    const hash = hashPrompt('Xin chào thế giới! Bạn khỏe không?');
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
    expect(hash).not.toBe('0');
  });

  test('handles long strings', () => {
    const longStr = 'a'.repeat(10000);
    const hash = hashPrompt(longStr);
    expect(typeof hash).toBe('string');
    expect(hash).not.toBe('0');
  });

  test('returns a hex string', () => {
    const hash = hashPrompt('test prompt');
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });
});

describe('getCached / setCache', () => {
  beforeEach(() => {
    clearAll();
  });

  test('returns null for non-existent key', () => {
    expect(getCached('nonexistent')).toBeNull();
  });

  test('returns cached response after setCache', () => {
    setCache('abc123', 'cached response');
    expect(getCached('abc123')).toBe('cached response');
  });

  test('stores and retrieves multiple entries', () => {
    setCache('key1', 'response1');
    setCache('key2', 'response2');
    expect(getCached('key1')).toBe('response1');
    expect(getCached('key2')).toBe('response2');
  });

  test('overwrites existing entry with same key', () => {
    setCache('key1', 'original');
    setCache('key1', 'updated');
    expect(getCached('key1')).toBe('updated');
  });

  test('uses default TTL of 1 hour', () => {
    vi.useFakeTimers();
    try {
      setCache('key1', 'response');

      // Still valid after 59 minutes
      vi.advanceTimersByTime(59 * 60 * 1000);
      expect(getCached('key1')).toBe('response');

      // Expired after 61 minutes
      vi.advanceTimersByTime(2 * 60 * 1000);
      expect(getCached('key1')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  test('respects custom TTL', () => {
    vi.useFakeTimers();
    try {
      setCache('key1', 'short-lived', 5000); // 5 second TTL

      // Still valid at 4 seconds
      vi.advanceTimersByTime(4000);
      expect(getCached('key1')).toBe('short-lived');

      // Expired after 6 seconds
      vi.advanceTimersByTime(2000);
      expect(getCached('key1')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  test('expired entry is deleted on access', () => {
    vi.useFakeTimers();
    try {
      setCache('key1', 'response', 1000);
      expect(cacheSize()).toBe(1);

      vi.advanceTimersByTime(2000);
      getCached('key1'); // triggers deletion
      expect(cacheSize()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('clearExpired', () => {
  beforeEach(() => {
    clearAll();
  });

  test('removes only expired entries', () => {
    vi.useFakeTimers();
    try {
      setCache('short', 'response1', 1000);  // 1s TTL
      setCache('long', 'response2', 60000);  // 60s TTL

      vi.advanceTimersByTime(2000); // 2 seconds later

      clearExpired();

      expect(getCached('short')).toBeNull();
      expect(getCached('long')).toBe('response2');
      expect(cacheSize()).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  test('handles empty cache', () => {
    expect(() => clearExpired()).not.toThrow();
    expect(cacheSize()).toBe(0);
  });

  test('removes all entries when all expired', () => {
    vi.useFakeTimers();
    try {
      setCache('a', 'r1', 1000);
      setCache('b', 'r2', 2000);
      setCache('c', 'r3', 3000);

      vi.advanceTimersByTime(4000);
      clearExpired();

      expect(cacheSize()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('cacheSize', () => {
  beforeEach(() => {
    clearAll();
  });

  test('returns 0 for empty cache', () => {
    expect(cacheSize()).toBe(0);
  });

  test('returns correct count', () => {
    setCache('a', 'r1');
    setCache('b', 'r2');
    expect(cacheSize()).toBe(2);
  });
});

describe('clearAll', () => {
  test('removes all entries', () => {
    setCache('a', 'r1');
    setCache('b', 'r2');
    clearAll();
    expect(cacheSize()).toBe(0);
    expect(getCached('a')).toBeNull();
  });
});
