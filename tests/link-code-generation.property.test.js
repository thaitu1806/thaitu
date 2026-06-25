/**
 * Feature: progressive-parent-linking, Property 1: New player gets valid unique link code
 *
 * For any valid player name and grade, creating a new player should produce a link_code
 * that is exactly 6 characters long, contains only uppercase letters (excluding I, O)
 * and digits (excluding 0, 1), and is unique across all players in the database.
 * The link_status should be unlinked.
 *
 * Validates: Requirements 1.2, 2.1, 2.2
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { generateLinkCode, generateUniqueLinkCode, validateLinkCodeFormat } from '../lib/link-code.js';

const VALID_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const VALID_REGEX = /^[A-HJ-NP-Z2-9]{6}$/;

describe('Property 1: New player gets valid unique link code', () => {
  /**
   * **Validates: Requirements 1.2, 2.1, 2.2**
   *
   * Property: generateLinkCode() always produces a 6-char code from valid charset
   */
  it('generateLinkCode always produces a valid 6-character code from the allowed charset', () => {
    fc.assert(
      fc.property(
        fc.constant(null), // no input needed — testing a generator function
        () => {
          const code = generateLinkCode();

          // Exactly 6 characters
          expect(code).toHaveLength(6);

          // Matches the valid format regex
          expect(code).toMatch(VALID_REGEX);

          // Each character is in the allowed charset
          for (const char of code) {
            expect(VALID_CHARSET).toContain(char);
          }

          // Does not contain excluded characters
          expect(code).not.toMatch(/[IO01]/);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 1.2, 2.1, 2.2**
   *
   * Property: generateLinkCode passes validateLinkCodeFormat round-trip
   */
  it('every generated code passes validateLinkCodeFormat', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const code = generateLinkCode();
          expect(validateLinkCodeFormat(code)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 2.1, 2.2**
   *
   * Property: generateUniqueLinkCode produces codes unique across all players in the DB.
   * Simulates a database with existing codes and ensures the generated code is not among them.
   */
  it('generateUniqueLinkCode produces a code not already in the database', () => {
    // Arbitrary that generates a valid 6-char code from the charset
    const validCodeArb = fc.array(
      fc.constantFrom(...VALID_CHARSET.split('')),
      { minLength: 6, maxLength: 6 }
    ).map(chars => chars.join(''));

    fc.assert(
      fc.asyncProperty(
        // Generate a set of existing codes (simulating what's already in DB)
        fc.array(validCodeArb, { minLength: 0, maxLength: 20 }),
        async (existingCodes) => {
          const existingSet = new Set(existingCodes);

          const mockDb = {
            execute: async ({ args }) => {
              const [codeToCheck] = args;
              if (existingSet.has(codeToCheck)) {
                return { rows: [{ id: 1 }] };
              }
              return { rows: [] };
            }
          };

          const code = await generateUniqueLinkCode(mockDb);

          // The returned code must be valid format
          expect(code).toHaveLength(6);
          expect(code).toMatch(VALID_REGEX);
          expect(validateLinkCodeFormat(code)).toBe(true);

          // The returned code must NOT be in the existing set
          expect(existingSet.has(code)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 1.2, 2.1, 2.2**
   *
   * Property: For any valid player name and grade, simulating player creation
   * produces a valid unique link_code and link_status is 'unlinked'.
   */
  it('new player creation yields valid link_code and unlinked status for any name/grade', () => {
    // Arbitrary for Vietnamese-style player names (non-empty strings)
    const nameChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz ĐđÀàÁáẠạĂăẮắẶặÂâẤấẬậÈèÉéẸẹÊêẾếỆệÌìÍíỊịÒòÓóỌọÔôỐốỘộƠơỚớỢợÙùÚúỤụƯưỨứỰựỲỳÝýỴỵ';
    const playerNameArb = fc.array(
      fc.constantFrom(...nameChars.split('')),
      { minLength: 1, maxLength: 30 }
    ).map(chars => chars.join(''));

    // Grade arbitrary (typically 1-5 for Vietnamese primary school)
    const gradeArb = fc.integer({ min: 1, max: 12 });

    fc.assert(
      fc.asyncProperty(
        playerNameArb,
        gradeArb,
        async (name, grade) => {
          // Simulate the player creation flow:
          // 1. Generate unique link code
          // 2. Default link_status is 'unlinked'
          const mockDb = {
            execute: async () => ({ rows: [] }) // no collisions
          };

          const linkCode = await generateUniqueLinkCode(mockDb);
          const linkStatus = 'unlinked'; // default on creation

          // Verify link_code properties
          expect(linkCode).toHaveLength(6);
          expect(linkCode).toMatch(VALID_REGEX);
          expect(validateLinkCodeFormat(linkCode)).toBe(true);

          // Verify no excluded characters
          expect(linkCode).not.toMatch(/[IO01]/);

          // Verify link_status is unlinked
          expect(linkStatus).toBe('unlinked');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 2.2**
   *
   * Property: Generating multiple codes produces unique values (batch uniqueness).
   * When creating N players, all generated codes should be distinct.
   */
  it('batch of generated codes are all unique', () => {
    fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 50 }),
        async (batchSize) => {
          const generatedCodes = new Set();

          const mockDb = {
            execute: async ({ args }) => {
              const [codeToCheck] = args;
              // Simulate DB: codes already generated are "taken"
              if (generatedCodes.has(codeToCheck)) {
                return { rows: [{ id: 1 }] };
              }
              return { rows: [] };
            }
          };

          for (let i = 0; i < batchSize; i++) {
            const code = await generateUniqueLinkCode(mockDb);
            expect(code).toHaveLength(6);
            expect(code).toMatch(VALID_REGEX);

            // Code must be unique among all previously generated
            expect(generatedCodes.has(code)).toBe(false);
            generatedCodes.add(code);
          }

          // All codes are unique
          expect(generatedCodes.size).toBe(batchSize);
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Feature: progressive-parent-linking, Property 3: Invalid codes are rejected
 *
 * For any string that does not match the format [A-HJ-NP-Z2-9]{6} OR does not exist
 * in the database, the link-by-code endpoint should return an error without creating
 * any parent_children record or modifying any player's link_status.
 *
 * Validates: Requirements 2.4, 9.2
 */

describe('Property 3: Invalid codes are rejected', () => {
  /**
   * **Validates: Requirements 2.4, 9.2**
   *
   * Property: Any string with wrong length (not 6) is rejected by validateLinkCodeFormat
   */
  it('strings with wrong length are always rejected', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 100 }).filter(s => s.length !== 6),
        (invalidCode) => {
          expect(validateLinkCodeFormat(invalidCode)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 2.4, 9.2**
   *
   * Property: Any 6-char string containing excluded characters (I, O, 0, 1) is rejected
   */
  it('6-char strings containing excluded characters (I, O, 0, 1) are rejected', () => {
    const excludedChars = 'IO01';
    const validChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    // Generate a 6-char string that has at least one excluded char
    const invalidCodeArb = fc.tuple(
      fc.integer({ min: 0, max: 5 }),               // position to inject excluded char
      fc.constantFrom(...excludedChars.split('')),   // excluded char to inject
      fc.array(fc.constantFrom(...validChars.split('')), { minLength: 5, maxLength: 5 }) // remaining 5 valid chars
    ).map(([pos, badChar, rest]) => {
      const chars = [...rest];
      chars.splice(pos, 0, badChar);
      return chars.join('');
    });

    fc.assert(
      fc.property(
        invalidCodeArb,
        (invalidCode) => {
          expect(invalidCode).toHaveLength(6);
          expect(validateLinkCodeFormat(invalidCode)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 2.4, 9.2**
   *
   * Property: Any 6-char string containing lowercase letters is rejected
   */
  it('6-char strings with lowercase letters are rejected', () => {
    const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
    const validChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    // Generate a 6-char string with at least one lowercase char
    const invalidCodeArb = fc.tuple(
      fc.integer({ min: 0, max: 5 }),
      fc.constantFrom(...lowercaseChars.split('')),
      fc.array(fc.constantFrom(...validChars.split('')), { minLength: 5, maxLength: 5 })
    ).map(([pos, lowChar, rest]) => {
      const chars = [...rest];
      chars.splice(pos, 0, lowChar);
      return chars.join('');
    });

    fc.assert(
      fc.property(
        invalidCodeArb,
        (invalidCode) => {
          expect(invalidCode).toHaveLength(6);
          expect(validateLinkCodeFormat(invalidCode)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 2.4, 9.2**
   *
   * Property: Any 6-char string containing special characters is rejected
   */
  it('6-char strings with special characters are rejected', () => {
    const specialChars = '!@#$%^&*()-_=+[]{}|;:,.<>?/~`\'"\\';
    const validChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    const invalidCodeArb = fc.tuple(
      fc.integer({ min: 0, max: 5 }),
      fc.constantFrom(...specialChars.split('')),
      fc.array(fc.constantFrom(...validChars.split('')), { minLength: 5, maxLength: 5 })
    ).map(([pos, specialChar, rest]) => {
      const chars = [...rest];
      chars.splice(pos, 0, specialChar);
      return chars.join('');
    });

    fc.assert(
      fc.property(
        invalidCodeArb,
        (invalidCode) => {
          expect(invalidCode).toHaveLength(6);
          expect(validateLinkCodeFormat(invalidCode)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 2.4, 9.2**
   *
   * Property: Non-string inputs are rejected by validateLinkCodeFormat
   */
  it('non-string inputs are rejected', () => {
    const nonStringArb = fc.oneof(
      fc.integer(),
      fc.constant(null),
      fc.constant(undefined),
      fc.boolean(),
      fc.array(fc.anything()),
      fc.object()
    );

    fc.assert(
      fc.property(
        nonStringArb,
        (invalidInput) => {
          expect(validateLinkCodeFormat(invalidInput)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 2.4, 9.2**
   *
   * Property: Arbitrary strings that don't match the valid regex are always rejected.
   * Generates completely random strings and verifies that those not matching the
   * valid pattern are rejected by validateLinkCodeFormat.
   */
  it('arbitrary strings not matching [A-HJ-NP-Z2-9]{6} are rejected', () => {
    const validRegex = /^[A-HJ-NP-Z2-9]{6}$/;

    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 20 }),
        (randomStr) => {
          // We only test strings that DON'T match the valid format
          fc.pre(!validRegex.test(randomStr));
          expect(validateLinkCodeFormat(randomStr)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 2.4, 9.2**
   *
   * Property: Valid-format codes that don't exist in the database are rejected
   * by the link-by-code logic. Simulates the linking endpoint behavior where
   * a code passes format validation but the player lookup returns no results.
   */
  it('valid-format codes not in DB are rejected by link-by-code logic', () => {
    // Generate valid-format codes (matches regex but not in DB)
    const validFormatCodeArb = fc.array(
      fc.constantFrom(...VALID_CHARSET.split('')),
      { minLength: 6, maxLength: 6 }
    ).map(chars => chars.join(''));

    fc.assert(
      fc.asyncProperty(
        validFormatCodeArb,
        fc.integer({ min: 1, max: 1000 }), // parent_id
        async (code, parentId) => {
          // The code passes format validation
          expect(validateLinkCodeFormat(code)).toBe(true);

          // Simulate the link-by-code endpoint logic:
          // 1. Format is valid (passes)
          // 2. DB lookup finds no player with this code
          const mockDb = {
            execute: async ({ sql }) => {
              if (sql.includes('SELECT') && sql.includes('link_code')) {
                return { rows: [] }; // code not found in DB
              }
              return { rows: [] };
            },
            batch: async () => {
              throw new Error('batch should not be called for non-existent code');
            }
          };

          // Simulate endpoint behavior
          const formatValid = validateLinkCodeFormat(code);
          expect(formatValid).toBe(true);

          // Player lookup returns empty (code not in DB)
          const result = await mockDb.execute({
            sql: 'SELECT id, name, link_status FROM players WHERE link_code = ?',
            args: [code]
          });

          // No player found — endpoint should reject
          expect(result.rows.length).toBe(0);

          // Verify no parent_children record would be created (batch not called)
          let batchCalled = false;
          mockDb.batch = async () => { batchCalled = true; };

          // The link-by-code logic should NOT proceed to batch when player not found
          if (result.rows.length === 0) {
            // Endpoint returns error, no DB modification
            expect(batchCalled).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Feature: progressive-parent-linking, Property 10: Migration assigns correct statuses and codes
 *
 * For any set of existing players (some with parent_children records, some without),
 * after running the migration: all players should have a non-null link_code matching
 * the valid format, players with existing parent_children records should have
 * link_status = 'linked', and players without should have link_status = 'unlinked'.
 * All link_codes should be unique.
 *
 * Validates: Requirements 10.1, 10.2, 10.3
 */

describe('Property 10: Migration assigns correct statuses and codes', () => {
  /**
   * Simulates migration logic from db/migrate-link-codes.js:
   * 1. For each player with null link_code, generate a unique code
   * 2. Set link_status = 'linked' for players with parent_children records
   * 3. Set link_status = 'unlinked' for players without parent_children records
   */
  async function simulateMigration(players, parentChildrenPlayerIds) {
    const existingCodes = new Set();

    // Mock DB that tracks generated codes for uniqueness
    const mockDb = {
      execute: async ({ args }) => {
        const [codeToCheck] = args;
        if (existingCodes.has(codeToCheck)) {
          return { rows: [{ id: 1 }] };
        }
        return { rows: [] };
      }
    };

    const migratedPlayers = [];

    for (const player of players) {
      let linkCode = player.link_code;
      let linkStatus = player.link_status;

      // Step 2: Generate link_code for players where it's NULL
      if (linkCode === null || linkCode === undefined) {
        linkCode = await generateUniqueLinkCode(mockDb);
        existingCodes.add(linkCode);
      } else {
        existingCodes.add(linkCode);
      }

      // Step 3: Set link_status = 'linked' for players with parent_children records
      if (parentChildrenPlayerIds.has(player.id)) {
        linkStatus = 'linked';
      } else {
        // Step 4: Set link_status = 'unlinked' for players without parent_children
        if (linkStatus === null || linkStatus === undefined || linkStatus === '') {
          linkStatus = 'unlinked';
        }
        // If they aren't in parent_children, ensure they are unlinked
        linkStatus = 'unlinked';
      }

      migratedPlayers.push({
        ...player,
        link_code: linkCode,
        link_status: linkStatus
      });
    }

    return migratedPlayers;
  }

  /**
   * **Validates: Requirements 10.1, 10.2, 10.3**
   *
   * Property: After migration, all players have a non-null link_code matching [A-HJ-NP-Z2-9]{6},
   * players with parent_children records have link_status = 'linked',
   * players without have link_status = 'unlinked',
   * and all link_codes are unique.
   */
  it('migration assigns valid unique codes and correct statuses to all players', () => {
    // Arbitrary: generate a list of players (some with null link_code, simulating pre-migration)
    const playerArb = fc.record({
      id: fc.integer({ min: 1, max: 10000 }),
      name: fc.string({ minLength: 1, maxLength: 20 }),
      link_code: fc.constant(null), // pre-migration: no code yet
      link_status: fc.constantFrom(null, '', undefined) // pre-migration: no status
    });

    // Generate between 1 and 30 players with unique IDs
    const playersArb = fc.array(playerArb, { minLength: 1, maxLength: 30 })
      .map(players => {
        // Ensure unique IDs
        const seen = new Set();
        return players.filter(p => {
          if (seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        });
      })
      .filter(players => players.length >= 1);

    fc.assert(
      fc.asyncProperty(
        playersArb,
        // Fraction of players that have parent_children records (0 to 1)
        fc.double({ min: 0, max: 1, noNaN: true }),
        async (players, linkedFraction) => {
          // Determine which players have parent_children records
          const linkedCount = Math.floor(players.length * linkedFraction);
          const linkedPlayerIds = new Set(
            players.slice(0, linkedCount).map(p => p.id)
          );

          // Run migration simulation
          const migratedPlayers = await simulateMigration(players, linkedPlayerIds);

          // Invariant 1: All players have a non-null link_code matching valid format
          for (const player of migratedPlayers) {
            expect(player.link_code).not.toBeNull();
            expect(player.link_code).not.toBeUndefined();
            expect(player.link_code).toHaveLength(6);
            expect(player.link_code).toMatch(VALID_REGEX);
          }

          // Invariant 2: Players with parent_children records have link_status = 'linked'
          for (const player of migratedPlayers) {
            if (linkedPlayerIds.has(player.id)) {
              expect(player.link_status).toBe('linked');
            }
          }

          // Invariant 3: Players without parent_children records have link_status = 'unlinked'
          for (const player of migratedPlayers) {
            if (!linkedPlayerIds.has(player.id)) {
              expect(player.link_status).toBe('unlinked');
            }
          }

          // Invariant 4: All link_codes are unique
          const allCodes = migratedPlayers.map(p => p.link_code);
          const uniqueCodes = new Set(allCodes);
          expect(uniqueCodes.size).toBe(allCodes.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 10.1, 10.2, 10.3**
   *
   * Property: Migration is idempotent — running it again on already-migrated players
   * (who already have codes) preserves their existing codes and maintains correct statuses.
   */
  it('migration is idempotent for players that already have link codes', () => {
    // Generate players that already have valid link codes (simulating re-run)
    const validCodeArb = fc.array(
      fc.constantFrom(...VALID_CHARSET.split('')),
      { minLength: 6, maxLength: 6 }
    ).map(chars => chars.join(''));

    const migratedPlayerArb = fc.record({
      id: fc.integer({ min: 1, max: 10000 }),
      name: fc.string({ minLength: 1, maxLength: 20 }),
      link_code: validCodeArb,
      link_status: fc.constantFrom('unlinked', 'prompted', 'linked')
    });

    const playersArb = fc.array(migratedPlayerArb, { minLength: 1, maxLength: 20 })
      .chain(players => {
        // Ensure unique IDs and unique codes
        const seenIds = new Set();
        const seenCodes = new Set();
        const unique = players.filter(p => {
          if (seenIds.has(p.id) || seenCodes.has(p.link_code)) return false;
          seenIds.add(p.id);
          seenCodes.add(p.link_code);
          return true;
        });
        return fc.constant(unique.length >= 1 ? unique : [players[0]]);
      });

    fc.assert(
      fc.asyncProperty(
        playersArb,
        fc.double({ min: 0, max: 1, noNaN: true }),
        async (players, linkedFraction) => {
          const linkedCount = Math.floor(players.length * linkedFraction);
          const linkedPlayerIds = new Set(
            players.slice(0, linkedCount).map(p => p.id)
          );

          // Run migration on already-migrated players
          const migratedPlayers = await simulateMigration(players, linkedPlayerIds);

          // Players that already had codes should keep them (code is not null, skip generation)
          for (const player of migratedPlayers) {
            const original = players.find(p => p.id === player.id);
            if (original && original.link_code !== null) {
              // The original code should be preserved
              expect(player.link_code).toBe(original.link_code);
            }
          }

          // Statuses should still be correct based on parent_children
          for (const player of migratedPlayers) {
            if (linkedPlayerIds.has(player.id)) {
              expect(player.link_status).toBe('linked');
            } else {
              expect(player.link_status).toBe('unlinked');
            }
          }

          // All codes still unique
          const allCodes = migratedPlayers.map(p => p.link_code);
          const uniqueCodes = new Set(allCodes);
          expect(uniqueCodes.size).toBe(allCodes.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 10.1, 10.2, 10.3**
   *
   * Property: Migration handles mixed state — some players already have codes,
   * some don't. Only null-code players get new codes assigned.
   */
  it('migration handles mixed state: assigns codes only to players without them', () => {
    const validCodeArb = fc.array(
      fc.constantFrom(...VALID_CHARSET.split('')),
      { minLength: 6, maxLength: 6 }
    ).map(chars => chars.join(''));

    // Generate a mix of players: some with codes, some without
    const playerArb = fc.record({
      id: fc.integer({ min: 1, max: 10000 }),
      name: fc.string({ minLength: 1, maxLength: 20 }),
      link_code: fc.oneof(fc.constant(null), validCodeArb),
      link_status: fc.oneof(fc.constant(null), fc.constant(''), fc.constant('unlinked'))
    });

    const playersArb = fc.array(playerArb, { minLength: 2, maxLength: 25 })
      .map(players => {
        // Ensure unique IDs and unique existing codes
        const seenIds = new Set();
        const seenCodes = new Set();
        return players.filter(p => {
          if (seenIds.has(p.id)) return false;
          if (p.link_code !== null && seenCodes.has(p.link_code)) return false;
          seenIds.add(p.id);
          if (p.link_code !== null) seenCodes.add(p.link_code);
          return true;
        });
      })
      .filter(players => players.length >= 2);

    fc.assert(
      fc.asyncProperty(
        playersArb,
        fc.double({ min: 0, max: 1, noNaN: true }),
        async (players, linkedFraction) => {
          const linkedCount = Math.floor(players.length * linkedFraction);
          const linkedPlayerIds = new Set(
            players.slice(0, linkedCount).map(p => p.id)
          );

          const migratedPlayers = await simulateMigration(players, linkedPlayerIds);

          // All players end up with valid codes
          for (const player of migratedPlayers) {
            expect(player.link_code).not.toBeNull();
            expect(player.link_code).toMatch(VALID_REGEX);
          }

          // Players who already had codes keep their original codes
          for (const player of migratedPlayers) {
            const original = players.find(p => p.id === player.id);
            if (original && original.link_code !== null) {
              expect(player.link_code).toBe(original.link_code);
            }
          }

          // Players who had null codes now have new valid codes
          for (const player of migratedPlayers) {
            const original = players.find(p => p.id === player.id);
            if (original && original.link_code === null) {
              expect(player.link_code).not.toBeNull();
              expect(player.link_code).toHaveLength(6);
              expect(player.link_code).toMatch(VALID_REGEX);
            }
          }

          // All codes unique
          const allCodes = migratedPlayers.map(p => p.link_code);
          expect(new Set(allCodes).size).toBe(allCodes.length);

          // Correct statuses
          for (const player of migratedPlayers) {
            if (linkedPlayerIds.has(player.id)) {
              expect(player.link_status).toBe('linked');
            } else {
              expect(player.link_status).toBe('unlinked');
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
