/**
 * Feature: progressive-parent-linking, Property 12: Link status response includes parent info when linked
 *
 * For any player with link_status = `linked`, the GET `/api/players/:id/link-status` endpoint
 * should return a non-empty `parents` array containing the display_name of each linked parent.
 * For any unlinked/prompted player, the `parents` array should be empty.
 *
 * Validates: Requirements 7.2
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// Mock the db module before importing the handlers
vi.mock('../api/db.js', () => ({
  getDb: vi.fn()
}));

import handler from '../api/link.js';
import parentHandler, { rateLimitMap } from '../api/parent.js';
import { getDb } from '../api/db.js';

/**
 * Helper: create a mock request object
 */
function createMockReq({ method = 'GET', query = {}, body = {} } = {}) {
  return { method, query, body };
}

/**
 * Helper: create a mock response object that captures the response
 */
function createMockRes() {
  const res = {
    _statusCode: 200,
    _json: null,
    status(code) {
      res._statusCode = code;
      return res;
    },
    json(data) {
      res._json = data;
      return res;
    }
  };
  return res;
}

const VALID_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// Arbitrary for valid link codes
const validCodeArb = fc.array(
  fc.constantFrom(...VALID_CHARSET.split('')),
  { minLength: 6, maxLength: 6 }
).map(chars => chars.join(''));

// Arbitrary for parent display names (non-empty Vietnamese-style names)
const nameChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz ĐđÀàÁáẠạĂăẮắẶặÂâẤấẬậÈèÉéẸẹÊêẾếỆệÌìÍíỊịÒòÓóỌọÔôỐốỘộƠơỚớỢợÙùÚúỤụƯưỨứỰựỲỳÝýỴỵ';
const displayNameArb = fc.array(
  fc.constantFrom(...nameChars.split('')),
  { minLength: 2, maxLength: 20 }
).map(chars => chars.join(''));

// Arbitrary for player IDs
const playerIdArb = fc.integer({ min: 1, max: 10000 });

// Arbitrary for session count
const sessionCountArb = fc.integer({ min: 0, max: 500 });

// Arbitrary for streak
const streakArb = fc.integer({ min: 0, max: 100 });

describe('Property 12: Link status response includes parent info when linked', () => {
  /**
   * **Validates: Requirements 7.2**
   *
   * Property: For any linked player, the GET link-status endpoint returns a non-empty
   * parents array containing the display_name of each linked parent.
   */
  it('linked players always have a non-empty parents array with correct display_names', async () => {
    await fc.assert(
      fc.asyncProperty(
        playerIdArb,
        validCodeArb,
        sessionCountArb,
        streakArb,
        // Generate 1 to 5 parents (many-to-many: a player can have multiple parents)
        fc.array(
          fc.record({
            id: fc.integer({ min: 1, max: 10000 }),
            display_name: displayNameArb
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (playerId, linkCode, sessionCount, streak, parents) => {
          const mockDb = {
            execute: async ({ sql, args }) => {
              // Player lookup query
              if (sql.includes('link_code') && sql.includes('link_status') && sql.includes('players')) {
                return {
                  rows: [{
                    link_code: linkCode,
                    link_status: 'linked',
                    last_prompt_date: null,
                    current_streak: streak
                  }]
                };
              }
              // Session count query
              if (sql.includes('COUNT') && sql.includes('game_sessions')) {
                return {
                  rows: [{ session_count: sessionCount }]
                };
              }
              // Parents query (JOIN parent_children with parents)
              if (sql.includes('parents') && sql.includes('parent_children')) {
                return {
                  rows: parents.map(p => ({ id: p.id, display_name: p.display_name }))
                };
              }
              return { rows: [] };
            }
          };

          getDb.mockReturnValue(mockDb);

          const req = createMockReq({ method: 'GET', query: { id: String(playerId) } });
          const res = createMockRes();

          await handler(req, res);

          // Should return 200 OK
          expect(res._statusCode).toBe(200);
          expect(res._json).not.toBeNull();

          // Status should be 'linked'
          expect(res._json.status).toBe('linked');

          // Parents array should be non-empty
          expect(res._json.parents).toBeInstanceOf(Array);
          expect(res._json.parents.length).toBeGreaterThan(0);
          expect(res._json.parents.length).toBe(parents.length);

          // Each parent should have the correct display_name
          for (let i = 0; i < parents.length; i++) {
            expect(res._json.parents[i].display_name).toBe(parents[i].display_name);
            expect(res._json.parents[i].id).toBe(parents[i].id);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 7.2**
   *
   * Property: For any unlinked player, the GET link-status endpoint returns
   * an empty parents array.
   */
  it('unlinked players always have an empty parents array', async () => {
    await fc.assert(
      fc.asyncProperty(
        playerIdArb,
        validCodeArb,
        sessionCountArb,
        streakArb,
        async (playerId, linkCode, sessionCount, streak) => {
          const mockDb = {
            execute: async ({ sql }) => {
              if (sql.includes('link_code') && sql.includes('link_status') && sql.includes('players')) {
                return {
                  rows: [{
                    link_code: linkCode,
                    link_status: 'unlinked',
                    last_prompt_date: null,
                    current_streak: streak
                  }]
                };
              }
              if (sql.includes('COUNT') && sql.includes('game_sessions')) {
                return {
                  rows: [{ session_count: sessionCount }]
                };
              }
              // Parents query should NOT be called for unlinked players
              if (sql.includes('parents') && sql.includes('parent_children')) {
                throw new Error('Parents query should not be called for unlinked player');
              }
              return { rows: [] };
            }
          };

          getDb.mockReturnValue(mockDb);

          const req = createMockReq({ method: 'GET', query: { id: String(playerId) } });
          const res = createMockRes();

          await handler(req, res);

          expect(res._statusCode).toBe(200);
          expect(res._json).not.toBeNull();
          expect(res._json.status).toBe('unlinked');
          expect(res._json.parents).toBeInstanceOf(Array);
          expect(res._json.parents.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 7.2**
   *
   * Property: For any prompted player, the GET link-status endpoint returns
   * an empty parents array.
   */
  it('prompted players always have an empty parents array', async () => {
    await fc.assert(
      fc.asyncProperty(
        playerIdArb,
        validCodeArb,
        sessionCountArb,
        streakArb,
        fc.option(
          fc.tuple(
            fc.integer({ min: 2020, max: 2030 }),
            fc.integer({ min: 1, max: 12 }),
            fc.integer({ min: 1, max: 28 })
          ).map(([y, m, d]) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`),
          { nil: null }
        ),
        async (playerId, linkCode, sessionCount, streak, lastPromptDate) => {
          const mockDb = {
            execute: async ({ sql }) => {
              if (sql.includes('link_code') && sql.includes('link_status') && sql.includes('players')) {
                return {
                  rows: [{
                    link_code: linkCode,
                    link_status: 'prompted',
                    last_prompt_date: lastPromptDate,
                    current_streak: streak
                  }]
                };
              }
              if (sql.includes('COUNT') && sql.includes('game_sessions')) {
                return {
                  rows: [{ session_count: sessionCount }]
                };
              }
              // Parents query should NOT be called for prompted players
              if (sql.includes('parents') && sql.includes('parent_children')) {
                throw new Error('Parents query should not be called for prompted player');
              }
              return { rows: [] };
            }
          };

          getDb.mockReturnValue(mockDb);

          const req = createMockReq({ method: 'GET', query: { id: String(playerId) } });
          const res = createMockRes();

          await handler(req, res);

          expect(res._statusCode).toBe(200);
          expect(res._json).not.toBeNull();
          expect(res._json.status).toBe('prompted');
          expect(res._json.parents).toBeInstanceOf(Array);
          expect(res._json.parents.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Feature: progressive-parent-linking, Property 2: Link code round-trip
 *
 * For any player with a generated link_code, when an authenticated parent uses that code
 * via `link-by-code`, the system should create a parent_children record linking that parent
 * to that specific player, and the player's link_status should become `linked`.
 *
 * Validates: Requirements 2.3, 6.1
 */

const VALID_CHARSET_P2 = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// Arbitrary for valid link codes (Property 2)
const validCodeArbP2 = fc.array(
  fc.constantFrom(...VALID_CHARSET_P2.split('')),
  { minLength: 6, maxLength: 6 }
).map(chars => chars.join(''));

// Arbitrary for parent IDs
const parentIdArb = fc.integer({ min: 1, max: 10000 });

// Arbitrary for player data
const playerDataArb = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  name: fc.stringMatching(/^[A-Za-z\s]{2,20}$/)
});

/**
 * Helper: create a mock request for parent handler
 */
function createParentMockReq({ method = 'POST', query = {}, body = {}, headers = {}, socket = {} } = {}) {
  return { method, query, body, headers, socket };
}

/**
 * Helper: create a mock response that captures status and json
 */
function createParentMockRes() {
  const res = {
    _statusCode: 200,
    _json: null,
    status(code) {
      res._statusCode = code;
      return res;
    },
    json(data) {
      res._json = data;
      return res;
    }
  };
  return res;
}

describe('Property 2: Link code round-trip', () => {
  beforeEach(() => {
    // Clear rate limit map before each test to avoid interference
    rateLimitMap.clear();
  });

  /**
   * **Validates: Requirements 2.3, 6.1**
   *
   * Property: For any player with a valid link_code, when an authenticated parent
   * uses that code via link-by-code, a parent_children record is created and
   * the player's link_status becomes 'linked'.
   */
  it('authenticated parent linking with valid code creates parent_children record and sets link_status to linked', async () => {
    await fc.assert(
      fc.asyncProperty(
        parentIdArb,
        playerDataArb,
        validCodeArbP2,
        async (parentId, playerData, linkCode) => {
          // Clear rate limit for each iteration to prevent cross-iteration interference
          rateLimitMap.clear();

          // Track DB operations
          const insertedRecords = [];
          const batchCalls = [];

          const mockDb = {
            execute: async ({ sql, args }) => {
              // Parent existence check
              if (sql.includes('SELECT id FROM parents WHERE id')) {
                return { rows: [{ id: parentId }] };
              }
              // Player lookup by link_code
              if (sql.includes('SELECT id, name FROM players WHERE link_code')) {
                return { rows: [{ id: playerData.id, name: playerData.name }] };
              }
              // Duplicate check - no existing link
              if (sql.includes('SELECT id FROM parent_children WHERE parent_id')) {
                return { rows: [] };
              }
              return { rows: [] };
            },
            batch: async (statements) => {
              batchCalls.push(statements);
              // Record what was inserted/updated
              for (const stmt of statements) {
                insertedRecords.push(stmt);
              }
              return statements.map(() => ({ rows: [] }));
            }
          };

          getDb.mockReturnValue(mockDb);

          const req = createParentMockReq({
            method: 'POST',
            query: { action: 'link-by-code' },
            body: { parent_id: parentId, link_code: linkCode },
            headers: { 'x-forwarded-for': `192.168.1.${parentId % 255}` },
            socket: { remoteAddress: '127.0.0.1' }
          });
          const res = createParentMockRes();

          await parentHandler(req, res);

          // Should return 200 with ok: true
          expect(res._statusCode).toBe(200);
          expect(res._json).not.toBeNull();
          expect(res._json.ok).toBe(true);
          expect(res._json.player).toBeDefined();
          expect(res._json.player.id).toBe(playerData.id);
          expect(res._json.player.name).toBe(playerData.name);

          // Should have called db.batch exactly once
          expect(batchCalls.length).toBe(1);

          // Batch should contain INSERT parent_children + UPDATE link_status
          const batch = batchCalls[0];
          expect(batch.length).toBe(2);

          // First statement: INSERT parent_children
          const insertStmt = batch[0];
          expect(insertStmt.sql).toContain('INSERT INTO parent_children');
          expect(insertStmt.args).toContain(parentId);
          expect(insertStmt.args).toContain(playerData.id);

          // Second statement: UPDATE link_status = 'linked'
          const updateStmt = batch[1];
          expect(updateStmt.sql).toContain('UPDATE players SET link_status');
          expect(updateStmt.sql).toContain('linked');
          expect(updateStmt.args).toContain(playerData.id);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 2.3, 6.1**
   *
   * Property: The round-trip links specifically the player who owns the code,
   * not any other player. The parent_children record references the correct player_id.
   */
  it('link-by-code always targets the specific player who owns the link_code', async () => {
    await fc.assert(
      fc.asyncProperty(
        parentIdArb,
        // Generate two distinct players to ensure correct one is linked
        fc.integer({ min: 1, max: 5000 }),
        fc.integer({ min: 5001, max: 10000 }),
        validCodeArbP2,
        async (parentId, targetPlayerId, otherPlayerId, linkCode) => {
          const batchCalls = [];

          const mockDb = {
            execute: async ({ sql, args }) => {
              if (sql.includes('SELECT id FROM parents WHERE id')) {
                return { rows: [{ id: parentId }] };
              }
              if (sql.includes('SELECT id, name FROM players WHERE link_code')) {
                // Only the target player owns this code
                return { rows: [{ id: targetPlayerId, name: 'TargetPlayer' }] };
              }
              if (sql.includes('SELECT id FROM parent_children WHERE parent_id')) {
                return { rows: [] };
              }
              return { rows: [] };
            },
            batch: async (statements) => {
              batchCalls.push(statements);
              return statements.map(() => ({ rows: [] }));
            }
          };

          getDb.mockReturnValue(mockDb);

          const req = createParentMockReq({
            method: 'POST',
            query: { action: 'link-by-code' },
            body: { parent_id: parentId, link_code: linkCode },
            headers: { 'x-forwarded-for': `${Math.random().toString(36).slice(2)}.${parentId}.${targetPlayerId}.${Date.now()}` },
            socket: { remoteAddress: '127.0.0.1' }
          });
          const res = createParentMockRes();

          await parentHandler(req, res);

          expect(res._statusCode).toBe(200);
          expect(res._json.ok).toBe(true);

          // Verify the batch targets the correct player
          const batch = batchCalls[0];
          const insertArgs = batch[0].args;
          const updateArgs = batch[1].args;

          // INSERT should reference targetPlayerId, NOT otherPlayerId
          expect(insertArgs).toContain(targetPlayerId);
          expect(insertArgs).not.toContain(otherPlayerId);

          // UPDATE should reference targetPlayerId
          expect(updateArgs).toContain(targetPlayerId);
          expect(updateArgs).not.toContain(otherPlayerId);
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Feature: progressive-parent-linking, Property 13: Authentication required for linking
 *
 * For any link-by-code request that does not include a valid `parent_id` (missing, null,
 * or referencing a non-existent parent), the system should reject with an error and not
 * modify any player's link_status.
 *
 * Validates: Requirements 9.1
 */

describe('Property 13: Authentication required for linking', () => {
  beforeEach(() => {
    rateLimitMap.clear();
  });

  /**
   * **Validates: Requirements 9.1**
   *
   * Property: Missing parent_id → 400 error, no DB modification
   */
  it('missing parent_id results in 400 error and no DB modification', async () => {
    await fc.assert(
      fc.asyncProperty(
        validCodeArb,
        async (linkCode) => {
          // Track whether any DB write operation was called
          let dbWriteCalled = false;

          const mockDb = {
            execute: async ({ sql }) => {
              if (sql.includes('INSERT') || sql.includes('UPDATE')) {
                dbWriteCalled = true;
              }
              return { rows: [] };
            },
            batch: async () => {
              dbWriteCalled = true;
              return [];
            }
          };

          getDb.mockReturnValue(mockDb);

          // Request with no parent_id in body (missing)
          const req = createParentMockReq({
            method: 'POST',
            query: { action: 'link-by-code' },
            body: { link_code: linkCode },
            headers: { 'x-forwarded-for': '192.168.1.100' },
            socket: { remoteAddress: '127.0.0.1' }
          });
          const res = createParentMockRes();

          await parentHandler(req, res);

          // Should return 400 error
          expect(res._statusCode).toBe(400);
          expect(res._json).not.toBeNull();
          expect(res._json.error).toBeDefined();

          // No DB modification should have occurred
          expect(dbWriteCalled).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 9.1**
   *
   * Property: Null parent_id → 400 error, no DB modification
   */
  it('null parent_id results in 400 error and no DB modification', async () => {
    await fc.assert(
      fc.asyncProperty(
        validCodeArb,
        async (linkCode) => {
          let dbWriteCalled = false;

          const mockDb = {
            execute: async ({ sql }) => {
              if (sql.includes('INSERT') || sql.includes('UPDATE')) {
                dbWriteCalled = true;
              }
              return { rows: [] };
            },
            batch: async () => {
              dbWriteCalled = true;
              return [];
            }
          };

          getDb.mockReturnValue(mockDb);

          // Request with null parent_id
          const req = createParentMockReq({
            method: 'POST',
            query: { action: 'link-by-code' },
            body: { parent_id: null, link_code: linkCode },
            headers: { 'x-forwarded-for': '192.168.2.100' },
            socket: { remoteAddress: '127.0.0.1' }
          });
          const res = createParentMockRes();

          await parentHandler(req, res);

          // Should return 400 error
          expect(res._statusCode).toBe(400);
          expect(res._json).not.toBeNull();
          expect(res._json.error).toBeDefined();

          // No DB modification should have occurred
          expect(dbWriteCalled).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 9.1**
   *
   * Property: Non-existent parent_id → 401 error, no DB modification
   */
  it('non-existent parent_id results in 401 error and no DB modification', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 99999 }),
        validCodeArb,
        async (fakeParentId, linkCode) => {
          let dbWriteCalled = false;

          const mockDb = {
            execute: async ({ sql }) => {
              // Parent existence check — always return empty (non-existent)
              if (sql.includes('SELECT id FROM parents WHERE id')) {
                return { rows: [] };
              }
              if (sql.includes('INSERT') || sql.includes('UPDATE')) {
                dbWriteCalled = true;
              }
              return { rows: [] };
            },
            batch: async () => {
              dbWriteCalled = true;
              return [];
            }
          };

          getDb.mockReturnValue(mockDb);

          // Request with a parent_id that doesn't exist in the DB
          const req = createParentMockReq({
            method: 'POST',
            query: { action: 'link-by-code' },
            body: { parent_id: fakeParentId, link_code: linkCode },
            headers: { 'x-forwarded-for': `10.0.${fakeParentId % 255}.${(fakeParentId >> 8) % 255}` },
            socket: { remoteAddress: '127.0.0.1' }
          });
          const res = createParentMockRes();

          await parentHandler(req, res);

          // Should return 401 error (authentication failure)
          expect(res._statusCode).toBe(401);
          expect(res._json).not.toBeNull();
          expect(res._json.error).toBeDefined();

          // No DB modification should have occurred
          expect(dbWriteCalled).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Feature: progressive-parent-linking, Property 8: Many-to-many linking
 *
 * For any parent P and set of N distinct players (each with unique link_codes),
 * P should be able to link to all N players successfully.
 * For any player and set of M distinct parents, all M parents should be able to
 * link to that player using the same link_code.
 * The parent_children table should contain exactly the expected N (or M) records.
 *
 * Validates: Requirements 6.3, 6.4
 */

describe('Property 8: Many-to-many linking', () => {
  // Global counter for unique IP generation — ensures no collision with other tests
  let ipCounter = 200000;

  beforeEach(() => {
    rateLimitMap.clear();
  });

  /**
   * **Validates: Requirements 6.3**
   *
   * Property: For any parent P and set of N distinct players (each with unique link_codes),
   * P should be able to link to all N players successfully. The parent_children table should
   * contain exactly N records for that parent.
   */
  it('one parent can link to N distinct players successfully', async () => {
    await fc.assert(
      fc.asyncProperty(
        // A single parent
        fc.integer({ min: 1, max: 10000 }),
        // N distinct players (2 to 6), each with a unique link code
        fc.array(
          fc.record({
            id: fc.integer({ min: 1, max: 100000 }),
            name: fc.stringMatching(/^[A-Za-z]{2,10}$/),
            linkCode: fc.array(
              fc.constantFrom(...VALID_CHARSET.split('')),
              { minLength: 6, maxLength: 6 }
            ).map(chars => chars.join(''))
          }),
          { minLength: 2, maxLength: 6 }
        ).filter(players => {
          // Ensure distinct player IDs and distinct link codes
          const ids = new Set(players.map(p => p.id));
          const codes = new Set(players.map(p => p.linkCode));
          return ids.size === players.length && codes.size === players.length;
        }),
        async (parentId, players) => {
          // Clear rate limit before each property iteration
          rateLimitMap.clear();

          // Track all parent_children records created in this iteration
          const createdRecords = [];

          // Link each player one by one
          for (let i = 0; i < players.length; i++) {
            ipCounter++;
            const player = players[i];

            // Create a fresh mock DB for each handler call
            const mockDb = {
              execute: async ({ sql, args }) => {
                if (sql.includes('SELECT id FROM parents WHERE id')) {
                  return { rows: [{ id: parentId }] };
                }
                if (sql.includes('SELECT id, name FROM players WHERE link_code')) {
                  const code = args[0];
                  const p = players.find(pl => pl.linkCode === code);
                  if (p) return { rows: [{ id: p.id, name: p.name }] };
                  return { rows: [] };
                }
                if (sql.includes('SELECT id FROM parent_children WHERE parent_id') && sql.includes('player_id')) {
                  const pId = args[0];
                  const plId = args[1];
                  const exists = createdRecords.some(r => r.parent_id === pId && r.player_id === plId);
                  return { rows: exists ? [{ id: 1 }] : [] };
                }
                return { rows: [] };
              },
              batch: async (statements) => {
                const insertStmt = statements.find(s => s.sql.includes('INSERT INTO parent_children'));
                if (insertStmt) {
                  createdRecords.push({
                    parent_id: insertStmt.args[0],
                    player_id: insertStmt.args[1]
                  });
                }
                return statements.map(() => ({ rows: [] }));
              }
            };

            // Set mock immediately before calling the handler
            getDb.mockReturnValue(mockDb);

            const req = createParentMockReq({
              method: 'POST',
              query: { action: 'link-by-code' },
              body: { parent_id: parentId, link_code: player.linkCode },
              headers: { 'x-forwarded-for': `p8a-${ipCounter}` },
              socket: { remoteAddress: '127.0.0.1' }
            });
            const res = createParentMockRes();

            await parentHandler(req, res);

            // Each link should succeed
            expect(res._statusCode).toBe(200);
            expect(res._json.ok).toBe(true);
            expect(res._json.player.id).toBe(player.id);
            expect(res._json.player.name).toBe(player.name);
          }

          // Verify: parent_children table should have exactly N records
          expect(createdRecords.length).toBe(players.length);

          // All records should reference the same parent
          for (const record of createdRecords) {
            expect(record.parent_id).toBe(parentId);
          }

          // All records should reference distinct players
          const linkedPlayerIds = new Set(createdRecords.map(r => r.player_id));
          expect(linkedPlayerIds.size).toBe(players.length);

          // Each player should be in the records
          for (const player of players) {
            expect(linkedPlayerIds.has(player.id)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 6.4**
   *
   * Property: For any player and set of M distinct parents, all M parents should be
   * able to link to that player using the same link_code. The parent_children table
   * should contain exactly M records for that player.
   */
  it('M distinct parents can all link to the same player using the same link_code', async () => {
    await fc.assert(
      fc.asyncProperty(
        // A single player with a link code
        fc.record({
          id: fc.integer({ min: 1, max: 10000 }),
          name: fc.stringMatching(/^[A-Za-z]{2,10}$/),
          linkCode: fc.array(
            fc.constantFrom(...VALID_CHARSET.split('')),
            { minLength: 6, maxLength: 6 }
          ).map(chars => chars.join(''))
        }),
        // M distinct parents (2 to 6)
        fc.array(
          fc.integer({ min: 1, max: 100000 }),
          { minLength: 2, maxLength: 6 }
        ).filter(ids => new Set(ids).size === ids.length),
        async (player, parentIds) => {
          // Clear rate limit before each property iteration
          rateLimitMap.clear();

          // Track all parent_children records created in this iteration
          const createdRecords = [];

          // Each parent links to the same player using the same code
          for (let i = 0; i < parentIds.length; i++) {
            ipCounter++;
            const parentId = parentIds[i];

            // Create a fresh mock DB for each handler call
            const mockDb = {
              execute: async ({ sql, args }) => {
                if (sql.includes('SELECT id FROM parents WHERE id')) {
                  const pId = args[0];
                  if (parentIds.includes(pId)) {
                    return { rows: [{ id: pId }] };
                  }
                  return { rows: [] };
                }
                if (sql.includes('SELECT id, name FROM players WHERE link_code')) {
                  const code = args[0];
                  if (code === player.linkCode) {
                    return { rows: [{ id: player.id, name: player.name }] };
                  }
                  return { rows: [] };
                }
                if (sql.includes('SELECT id FROM parent_children WHERE parent_id') && sql.includes('player_id')) {
                  const pId = args[0];
                  const plId = args[1];
                  const exists = createdRecords.some(r => r.parent_id === pId && r.player_id === plId);
                  return { rows: exists ? [{ id: 1 }] : [] };
                }
                return { rows: [] };
              },
              batch: async (statements) => {
                const insertStmt = statements.find(s => s.sql.includes('INSERT INTO parent_children'));
                if (insertStmt) {
                  createdRecords.push({
                    parent_id: insertStmt.args[0],
                    player_id: insertStmt.args[1]
                  });
                }
                return statements.map(() => ({ rows: [] }));
              }
            };

            // Set mock immediately before calling the handler
            getDb.mockReturnValue(mockDb);

            const req = createParentMockReq({
              method: 'POST',
              query: { action: 'link-by-code' },
              body: { parent_id: parentId, link_code: player.linkCode },
              headers: { 'x-forwarded-for': `p8b-${ipCounter}` },
              socket: { remoteAddress: '127.0.0.1' }
            });
            const res = createParentMockRes();

            await parentHandler(req, res);

            // Each link should succeed
            expect(res._statusCode).toBe(200);
            expect(res._json.ok).toBe(true);
            expect(res._json.player.id).toBe(player.id);
            expect(res._json.player.name).toBe(player.name);
          }

          // Verify: parent_children table should have exactly M records
          expect(createdRecords.length).toBe(parentIds.length);

          // All records should reference the same player
          for (const record of createdRecords) {
            expect(record.player_id).toBe(player.id);
          }

          // All records should reference distinct parents
          const linkedParentIds = new Set(createdRecords.map(r => r.parent_id));
          expect(linkedParentIds.size).toBe(parentIds.length);

          // Each parent should be in the records
          for (const parentId of parentIds) {
            expect(linkedParentIds.has(parentId)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
