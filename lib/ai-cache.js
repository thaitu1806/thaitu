/**
 * lib/ai-cache.js — Response Cache
 * In-memory cache with TTL for AI responses.
 * Avoids redundant API calls for identical prompts.
 */

const DEFAULT_TTL_MS = 3600000; // 1 hour

// key: promptHash → { response, expiresAt }
const cache = new Map();

/**
 * Generate a simple hash string from prompt content.
 * Uses a fast, non-cryptographic hash (djb2 variant).
 * @param {string} content - The prompt string to hash
 * @returns {string} A hex-like hash string
 */
export function hashPrompt(content) {
  if (!content || typeof content !== 'string') {
    return '0';
  }
  let hash = 5381;
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) + hash + content.charCodeAt(i)) | 0;
  }
  // Convert to unsigned 32-bit and then to hex string
  return (hash >>> 0).toString(16);
}

/**
 * Get a cached response by prompt hash.
 * Returns null if not found or expired.
 * @param {string} promptHash - The hash of the prompt
 * @returns {string|null} Cached response or null
 */
export function getCached(promptHash) {
  const entry = cache.get(promptHash);
  if (!entry) {
    return null;
  }
  if (Date.now() > entry.expiresAt) {
    cache.delete(promptHash);
    return null;
  }
  return entry.response;
}

/**
 * Store a response in cache with TTL.
 * @param {string} promptHash - The hash of the prompt
 * @param {string} response - The AI response to cache
 * @param {number} [ttlMs=3600000] - Time-to-live in milliseconds (default: 1 hour)
 */
export function setCache(promptHash, response, ttlMs = DEFAULT_TTL_MS) {
  cache.set(promptHash, {
    response,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Remove all expired entries from the cache.
 * Call periodically to free memory.
 */
export function clearExpired() {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now > entry.expiresAt) {
      cache.delete(key);
    }
  }
}

/**
 * Get current cache size (for testing/monitoring).
 * @returns {number} Number of entries in cache
 */
export function cacheSize() {
  return cache.size;
}

/**
 * Clear all cache entries (for testing).
 */
export function clearAll() {
  cache.clear();
}
