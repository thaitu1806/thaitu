import { describe, it, expect } from 'vitest';
import { generateLinkCode, generateUniqueLinkCode, validateLinkCodeFormat } from '../lib/link-code.js';

const VALID_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

describe('generateLinkCode', () => {
  it('returns a 6-character string', () => {
    const code = generateLinkCode();
    expect(code).toHaveLength(6);
  });

  it('only contains characters from the allowed charset', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateLinkCode();
      for (const char of code) {
        expect(VALID_CHARSET).toContain(char);
      }
    }
  });

  it('does not contain confusing characters I, O, 0, 1', () => {
    for (let i = 0; i < 100; i++) {
      const code = generateLinkCode();
      expect(code).not.toMatch(/[IO01]/);
    }
  });
});

describe('generateUniqueLinkCode', () => {
  it('returns a valid code when no collision exists', async () => {
    const mockDb = {
      execute: async () => ({ rows: [] })
    };
    const code = await generateUniqueLinkCode(mockDb);
    expect(code).toHaveLength(6);
    expect(validateLinkCodeFormat(code)).toBe(true);
  });

  it('retries on collision and eventually succeeds', async () => {
    let callCount = 0;
    const mockDb = {
      execute: async () => {
        callCount++;
        // First 3 calls collide, 4th succeeds
        if (callCount <= 3) return { rows: [{ id: 1 }] };
        return { rows: [] };
      }
    };
    const code = await generateUniqueLinkCode(mockDb);
    expect(code).toHaveLength(6);
    expect(callCount).toBe(4);
  });

  it('throws after 10 failed attempts', async () => {
    const mockDb = {
      execute: async () => ({ rows: [{ id: 1 }] })
    };
    await expect(generateUniqueLinkCode(mockDb)).rejects.toThrow(
      'Failed to generate unique link code after 10 attempts'
    );
  });
});

describe('validateLinkCodeFormat', () => {
  it('returns true for valid 6-char codes', () => {
    expect(validateLinkCodeFormat('ABC234')).toBe(true);
    expect(validateLinkCodeFormat('HJKLMN')).toBe(true);
    expect(validateLinkCodeFormat('999999')).toBe(true);
    expect(validateLinkCodeFormat('ZZZZZZ')).toBe(true);
  });

  it('returns false for codes with excluded chars I, O, 0, 1', () => {
    expect(validateLinkCodeFormat('ABCDI0')).toBe(false); // contains I and 0
    expect(validateLinkCodeFormat('O12345')).toBe(false); // contains O and 1
    expect(validateLinkCodeFormat('1ABCDE')).toBe(false); // contains 1
    expect(validateLinkCodeFormat('0ABCDE')).toBe(false); // contains 0
  });

  it('returns false for wrong length', () => {
    expect(validateLinkCodeFormat('ABC23')).toBe(false);   // 5 chars
    expect(validateLinkCodeFormat('ABC2345')).toBe(false); // 7 chars
    expect(validateLinkCodeFormat('')).toBe(false);
  });

  it('returns false for lowercase', () => {
    expect(validateLinkCodeFormat('abc234')).toBe(false);
    expect(validateLinkCodeFormat('Abc234')).toBe(false);
  });

  it('returns false for non-string inputs', () => {
    expect(validateLinkCodeFormat(null)).toBe(false);
    expect(validateLinkCodeFormat(undefined)).toBe(false);
    expect(validateLinkCodeFormat(123456)).toBe(false);
    expect(validateLinkCodeFormat({})).toBe(false);
  });

  it('returns false for codes with special characters', () => {
    expect(validateLinkCodeFormat('ABC-23')).toBe(false);
    expect(validateLinkCodeFormat('ABC 23')).toBe(false);
  });
});
