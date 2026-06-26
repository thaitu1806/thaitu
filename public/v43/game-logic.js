// V43 — Pure game logic for "Pizzeria Của Bé".
// All functions pure; no DOM, no fetch, no mutation.
// Tests under tests/v43-game-logic.*.test.js.

export const TOTAL_CUSTOMERS = 6;
export const TOPPINGS_REQUIRED = 3;
export const PATIENCE_SECONDS = 30;

// Tip tiers sorted by descending fraction threshold; first match wins.
export const TIP_TIERS = [
  { thresholdFraction: 2 / 3, rate: 0.30 },
  { thresholdFraction: 1 / 3, rate: 0.15 },
  { thresholdFraction: 0,     rate: 0    },
];

export const PIZZA_MENU = [
  { name: 'Margherita', emoji: '🍕', price: 30, toppingEmojis: ['🧀', '🍅', '🌿'] },
  { name: 'Pepperoni',  emoji: '🍕', price: 35, toppingEmojis: ['🥓', '🧀', '🌶️'] },
  { name: 'Hải sản',     emoji: '🍕', price: 40, toppingEmojis: ['🦐', '🦀', '🐙'] },
  { name: 'Bò bít tết', emoji: '🍕', price: 38, toppingEmojis: ['🥩', '🧅', '🧄'] },
  { name: 'Nấm rơm',    emoji: '🍕', price: 32, toppingEmojis: ['🍄', '🧀', '🌿'] },
  { name: 'Phô mai 4 vị', emoji: '🍕', price: 42, toppingEmojis: ['🧀', '🧈', '🥛'] },
  { name: 'Dứa Hawaii', emoji: '🍕', price: 28, toppingEmojis: ['🍍', '🥓', '🧀'] },
  { name: 'Rau củ',     emoji: '🍕', price: 26, toppingEmojis: ['🥦', '🌽', '🫑'] },
];

/**
 * Roll a sequence of pizzas for a shift. Deterministic given the rng.
 * @param {() => number} rng [0, 1) source. Defaults to Math.random.
 */
export function rollPizzas(rng = Math.random) {
  const pizzas = [];
  for (let i = 0; i < TOTAL_CUSTOMERS; i++) {
    const idx = Math.floor(rng() * PIZZA_MENU.length);
    pizzas.push({ ...PIZZA_MENU[idx], toppingsRequired: TOPPINGS_REQUIRED });
  }
  return pizzas;
}

/**
 * @param {{ pizzas: ReturnType<typeof rollPizzas>, startedAt?: number }} opts
 */
export function initState(opts = {}) {
  const pizzas = Array.isArray(opts.pizzas) && opts.pizzas.length > 0
    ? opts.pizzas
    : rollPizzas();
  return {
    totalCustomers: TOTAL_CUSTOMERS,
    customerIndex: 0,
    toppingsRequired: TOPPINGS_REQUIRED,
    toppingsServed: 0,
    patienceSeconds: PATIENCE_SECONDS,
    pizzas,
    earnings: 0,
    servedCount: 0,
    correct: 0,
    wrong: 0,
    outcome: 'open',
    startedAt: opts.startedAt ?? Date.now(),
  };
}

/**
 * Compute the tip rate for a given remaining patience.
 * @param {number} msRemaining
 * @param {number} patienceMs
 */
export function tipRate(msRemaining, patienceMs = PATIENCE_SECONDS * 1000) {
  if (!Number.isFinite(msRemaining) || msRemaining < 0) msRemaining = 0;
  if (patienceMs <= 0) return 0;
  const frac = msRemaining / patienceMs;
  for (const tier of TIP_TIERS) {
    if (frac > tier.thresholdFraction) return tier.rate;
  }
  return 0;
}

/**
 * Apply a correct-answer event. Adds 1 topping; if the pizza completes, advance and award.
 * @param {object} state
 * @param {{ msRemaining?: number, patienceMs?: number }} [opts]
 */
export function applyCorrect(state, opts = {}) {
  if (state.outcome !== 'open') return state;

  const patienceMs = opts.patienceMs ?? state.patienceSeconds * 1000;
  const msRemaining = clamp(opts.msRemaining ?? 0, 0, patienceMs);

  const nextToppings = state.toppingsServed + 1;
  const pizza = state.pizzas[state.customerIndex];

  if (nextToppings < state.toppingsRequired) {
    // Pizza not yet complete.
    return finalize({
      ...state,
      toppingsServed: nextToppings,
      correct: state.correct + 1,
    });
  }

  // Pizza complete — compute tip, advance customer.
  const rate = tipRate(msRemaining, patienceMs);
  const reward = Math.round(pizza.price * (1 + rate));
  return finalize({
    ...state,
    toppingsServed: 0,
    customerIndex: state.customerIndex + 1,
    correct: state.correct + 1,
    earnings: state.earnings + reward,
    servedCount: state.servedCount + 1,
  });
}

/**
 * @param {object} state
 * @param {{ kind?: 'wrong' | 'timeout' }} [opts]
 */
export function applyWrongOrTimeout(state, opts = {}) {
  if (state.outcome !== 'open') return state;
  const kind = opts.kind ?? 'wrong';
  if (kind === 'timeout') {
    // Customer walks away — advance without earnings, no topping awarded.
    return finalize({
      ...state,
      toppingsServed: 0,
      customerIndex: state.customerIndex + 1,
      wrong: state.wrong + 1,
    });
  }
  return finalize({
    ...state,
    wrong: state.wrong + 1,
  });
}

export function isFinished(state) {
  return state.outcome === 'closed';
}

/**
 * @param {{ cache: Array<{id:number|string}>, usedIds: Set<number|string>|Iterable<number|string> }} params
 */
export function pickNextQuestion({ cache, usedIds }) {
  if (!Array.isArray(cache) || cache.length === 0) return null;
  const used = usedIds instanceof Set ? usedIds : new Set(usedIds || []);
  for (const q of cache) {
    if (!q || q.id == null) continue;
    if (!used.has(q.id)) return q;
  }
  return null;
}

// ─── helpers ────────────────────────────────────────────────────────────────

function clamp(n, min, max) {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function finalize(state) {
  if (state.customerIndex >= state.totalCustomers) {
    return { ...state, outcome: 'closed' };
  }
  return state;
}

// Browser global (consumed by game.js).
if (typeof window !== 'undefined') {
  window.V43Logic = {
    TOTAL_CUSTOMERS,
    TOPPINGS_REQUIRED,
    PATIENCE_SECONDS,
    TIP_TIERS,
    PIZZA_MENU,
    rollPizzas,
    initState,
    applyCorrect,
    applyWrongOrTimeout,
    isFinished,
    tipRate,
    pickNextQuestion,
  };
}
