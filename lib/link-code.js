/**
 * Link Code Generation Module
 * Functions for generating, validating, and ensuring uniqueness of
 * 6-character parent-linking codes.
 */

/** Character set: uppercase letters (no I, O) + digits (no 0, 1) = 30 chars */
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Regex matching valid link codes: exactly 6 chars from CHARSET */
const LINK_CODE_REGEX = /^[A-HJ-NP-Z2-9]{6}$/;

/**
 * Generate a random 6-character link code from the allowed charset.
 * @returns {string} A 6-character code
 */
export function generateLinkCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return code;
}

/**
 * Generate a unique link code by checking for collisions in the database.
 * Retries up to 10 times before throwing an error.
 * @param {object} db - Database client with db.execute({ sql, args }) interface
 * @returns {Promise<string>} A unique 6-character code
 * @throws {Error} If unable to generate a unique code after 10 attempts
 */
export async function generateUniqueLinkCode(db) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateLinkCode();
    const existing = await db.execute({
      sql: 'SELECT id FROM players WHERE link_code = ?',
      args: [code]
    });
    if (existing.rows.length === 0) return code;
  }
  throw new Error('Failed to generate unique link code after 10 attempts');
}

/**
 * Validate that a string matches the expected link code format.
 * Valid codes are exactly 6 characters from the allowed charset
 * (uppercase A-Z excluding I and O, digits 2-9).
 * @param {string} code - The code to validate
 * @returns {boolean} True if valid format, false otherwise
 */
export function validateLinkCodeFormat(code) {
  if (typeof code !== 'string') return false;
  return LINK_CODE_REGEX.test(code);
}
