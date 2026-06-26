// Property-based tests for V43 (Pizzeria) pure logic.
// Validates P1–P7 from requirements.md
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  TOTAL_CUSTOMERS,
  TOPPINGS_REQUIRED,
  PATIENCE_SECONDS,
  PIZZA_MENU,
  initState,
  applyCorrect,
  applyWrongOrTimeout,
  isFinished,
  tipRate,
} from '../public/v43/game-logic.js';

const PATIENCE_MS = PATIENCE_SECONDS * 1000;

function fixedPizzas(price = 30) {
  return Array.from({ length: TOTAL_CUSTOMERS }, () => ({
    ...PIZZA_MENU[0],
    price,
    toppingsRequired: TOPPINGS_REQUIRED,
  }));
}

const eventArb = fc.oneof(
  fc.record({ kind: fc.constant('correct'), ms: fc.integer({ min: 0, max: PATIENCE_MS }) }),
  fc.record({ kind: fc.constant('wrong') }),
  fc.record({ kind: fc.constant('timeout') }),
);

function runEvents(events, pizzas = fixedPizzas()) {
  let s = initState({ pizzas, startedAt: 0 });
  const trace = [s];
  for (const ev of events) {
    if (isFinished(s)) break;
    if (ev.kind === 'correct') s = applyCorrect(s, { msRemaining: ev.ms });
    else if (ev.kind === 'wrong') s = applyWrongOrTimeout(s, { kind: 'wrong' });
    else s = applyWrongOrTimeout(s, { kind: 'timeout' });
    trace.push(s);
  }
  return { final: s, trace };
}

describe('V43 P1 — topping accumulation', () => {
  it('correct adds exactly 1 topping when below cap', () => {
    fc.assert(
      fc.property(eventArb, () => {
        let s = initState({ pizzas: fixedPizzas(), startedAt: 0 });
        s = applyCorrect(s, { msRemaining: PATIENCE_MS });
        expect(s.toppingsServed).toBe(1);
      }),
    );
  });

  it('wrong leaves toppings unchanged', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: TOPPINGS_REQUIRED - 1 }), (current) => {
        const base = initState({ pizzas: fixedPizzas(), startedAt: 0 });
        const s = { ...base, toppingsServed: current };
        const n = applyWrongOrTimeout(s, { kind: 'wrong' });
        expect(n.toppingsServed).toBe(current);
      }),
    );
  });
});

describe('V43 P2 — pizza completion advances and resets', () => {
  it('reaching TOPPINGS_REQUIRED via correct events advances customer and resets toppings', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: PATIENCE_MS }), (ms) => {
        let s = initState({ pizzas: fixedPizzas(), startedAt: 0 });
        for (let k = 0; k < TOPPINGS_REQUIRED; k++) {
          s = applyCorrect(s, { msRemaining: ms });
        }
        expect(s.customerIndex).toBe(1);
        expect(s.toppingsServed).toBe(0);
      }),
    );
  });
});

describe('V43 P3 — tip rate mapping', () => {
  it('tipRate ∈ {0, 0.15, 0.30}', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: PATIENCE_MS }), (ms) => {
        const rate = tipRate(ms, PATIENCE_MS);
        expect([0, 0.15, 0.30]).toContain(rate);
      }),
    );
  });
});

describe('V43 P4 — shift terminates when all customers handled', () => {
  it('outcome closed iff customerIndex === totalCustomers', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: TOTAL_CUSTOMERS * TOPPINGS_REQUIRED + 5 }), (events) => {
        const { final } = runEvents(events);
        expect(final.outcome === 'closed').toBe(final.customerIndex === TOTAL_CUSTOMERS);
      }),
    );
  });
});

describe('V43 P5 — earnings bound', () => {
  it('total earnings never exceed Σ price × 1.30 for served pizzas', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 40 }), (events) => {
        const pizzas = fixedPizzas();
        const { final } = runEvents(events, pizzas);
        const maxFromServed = pizzas
          .slice(0, final.servedCount)
          .reduce((acc, p) => acc + Math.round(p.price * 1.30), 0);
        expect(final.earnings).toBeLessThanOrEqual(maxFromServed);
      }),
    );
  });
});

describe('V43 P6 — earnings monotonicity', () => {
  it('earnings never decreases across a run', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 40 }), (events) => {
        const { trace } = runEvents(events);
        for (let i = 1; i < trace.length; i++) {
          expect(trace[i].earnings).toBeGreaterThanOrEqual(trace[i - 1].earnings);
        }
      }),
    );
  });
});

describe('V43 P7 — session payload validity', () => {
  it('totalAnswered ≥ correct ≥ 0 for any run', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 40 }), (events) => {
        const { final } = runEvents(events);
        const totalAnswered = final.correct + final.wrong;
        expect(totalAnswered).toBeGreaterThanOrEqual(final.correct);
        expect(final.correct).toBeGreaterThanOrEqual(0);
        expect(final.earnings).toBeGreaterThanOrEqual(0);
      }),
    );
  });
});
