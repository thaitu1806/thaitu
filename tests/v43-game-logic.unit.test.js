// Unit tests for V43 (Pizzeria) pure logic.
import { describe, it, expect } from 'vitest';
import {
  TOTAL_CUSTOMERS,
  TOPPINGS_REQUIRED,
  PATIENCE_SECONDS,
  PIZZA_MENU,
  rollPizzas,
  initState,
  applyCorrect,
  applyWrongOrTimeout,
  isFinished,
  tipRate,
} from '../public/v43/game-logic.js';

const PATIENCE_MS = PATIENCE_SECONDS * 1000;

function fixedPizzas() {
  return Array.from({ length: TOTAL_CUSTOMERS }, () => ({
    ...PIZZA_MENU[0],
    toppingsRequired: TOPPINGS_REQUIRED,
  }));
}

describe('rollPizzas', () => {
  it('produces TOTAL_CUSTOMERS entries', () => {
    expect(rollPizzas(() => 0).length).toBe(TOTAL_CUSTOMERS);
  });

  it('uses the menu pool', () => {
    const pizzas = rollPizzas(() => 0);
    expect(pizzas[0].name).toBe(PIZZA_MENU[0].name);
  });

  it('is deterministic for a given rng', () => {
    let seed = 0;
    const rng = () => {
      seed = (seed + 0.13) % 1;
      return seed;
    };
    const a = rollPizzas(rng);
    seed = 0;
    const b = rollPizzas(rng);
    expect(a).toEqual(b);
  });
});

describe('tipRate', () => {
  it('30% when frac > 2/3', () => {
    expect(tipRate(PATIENCE_MS, PATIENCE_MS)).toBe(0.30);
  });

  it('15% when 1/3 < frac ≤ 2/3', () => {
    expect(tipRate(PATIENCE_MS / 2, PATIENCE_MS)).toBe(0.15);
  });

  it('0% when frac ≤ 1/3', () => {
    expect(tipRate(PATIENCE_MS / 4, PATIENCE_MS)).toBe(0);
  });

  it('clamps negative ms to 0% tier', () => {
    expect(tipRate(-1000, PATIENCE_MS)).toBe(0);
  });

  it('returns 0 if patienceMs <= 0', () => {
    expect(tipRate(5, 0)).toBe(0);
  });
});

describe('initState', () => {
  it('uses provided pizzas array', () => {
    const pizzas = fixedPizzas();
    const s = initState({ pizzas, startedAt: 0 });
    expect(s.pizzas).toEqual(pizzas);
    expect(s.customerIndex).toBe(0);
    expect(s.earnings).toBe(0);
    expect(s.outcome).toBe('open');
  });

  it('rolls pizzas when none given', () => {
    const s = initState({ startedAt: 0 });
    expect(s.pizzas).toHaveLength(TOTAL_CUSTOMERS);
  });
});

describe('applyCorrect — topping accumulation', () => {
  it('increments toppings under cap', () => {
    let s = initState({ pizzas: fixedPizzas(), startedAt: 0 });
    s = applyCorrect(s, { msRemaining: PATIENCE_MS });
    expect(s.toppingsServed).toBe(1);
    expect(s.customerIndex).toBe(0);
    expect(s.earnings).toBe(0);
  });

  it('completes pizza and adds price+tip at full topping count', () => {
    const pizzas = fixedPizzas();
    let s = initState({ pizzas, startedAt: 0 });
    s = applyCorrect(s, { msRemaining: PATIENCE_MS });
    s = applyCorrect(s, { msRemaining: PATIENCE_MS });
    s = applyCorrect(s, { msRemaining: PATIENCE_MS }); // 3rd → complete with 30% tip
    expect(s.customerIndex).toBe(1);
    expect(s.toppingsServed).toBe(0);
    expect(s.servedCount).toBe(1);
    expect(s.earnings).toBe(Math.round(pizzas[0].price * 1.3));
  });

  it('15% tip when patience between 1/3 and 2/3', () => {
    const pizzas = fixedPizzas();
    let s = initState({ pizzas, startedAt: 0 });
    s = applyCorrect(s);
    s = applyCorrect(s);
    s = applyCorrect(s, { msRemaining: PATIENCE_MS / 2 });
    expect(s.earnings).toBe(Math.round(pizzas[0].price * 1.15));
  });

  it('0% tip when patience exhausted', () => {
    const pizzas = fixedPizzas();
    let s = initState({ pizzas, startedAt: 0 });
    s = applyCorrect(s);
    s = applyCorrect(s);
    s = applyCorrect(s, { msRemaining: 1 });
    expect(s.earnings).toBe(pizzas[0].price);
  });

  it('does nothing once outcome is closed', () => {
    const closed = { ...initState({ pizzas: fixedPizzas(), startedAt: 0 }), outcome: 'closed' };
    expect(applyCorrect(closed)).toEqual(closed);
  });
});

describe('applyWrongOrTimeout', () => {
  it('wrong leaves toppings unchanged and customer the same', () => {
    let s = initState({ pizzas: fixedPizzas(), startedAt: 0 });
    s = applyCorrect(s);
    s = applyWrongOrTimeout(s, { kind: 'wrong' });
    expect(s.toppingsServed).toBe(1);
    expect(s.customerIndex).toBe(0);
    expect(s.wrong).toBe(1);
  });

  it('timeout advances customer without earnings', () => {
    let s = initState({ pizzas: fixedPizzas(), startedAt: 0 });
    s = applyCorrect(s);
    s = applyWrongOrTimeout(s, { kind: 'timeout' });
    expect(s.customerIndex).toBe(1);
    expect(s.toppingsServed).toBe(0);
    expect(s.servedCount).toBe(0);
    expect(s.earnings).toBe(0);
  });

  it('finishes shift when last customer times out', () => {
    let s = initState({ pizzas: fixedPizzas(), startedAt: 0 });
    for (let i = 0; i < TOTAL_CUSTOMERS; i++) {
      s = applyWrongOrTimeout(s, { kind: 'timeout' });
    }
    expect(s.outcome).toBe('closed');
  });
});

describe('isFinished', () => {
  it('false when shift open', () => {
    expect(isFinished(initState({ pizzas: fixedPizzas(), startedAt: 0 }))).toBe(false);
  });

  it('true when closed', () => {
    expect(isFinished({ outcome: 'closed' })).toBe(true);
  });
});

describe('full shift', () => {
  it('serving all 6 with max tip yields predictable earnings', () => {
    const pizzas = fixedPizzas();
    let s = initState({ pizzas, startedAt: 0 });
    for (let c = 0; c < TOTAL_CUSTOMERS; c++) {
      s = applyCorrect(s, { msRemaining: PATIENCE_MS });
      s = applyCorrect(s, { msRemaining: PATIENCE_MS });
      s = applyCorrect(s, { msRemaining: PATIENCE_MS });
    }
    expect(s.outcome).toBe('closed');
    expect(s.servedCount).toBe(TOTAL_CUSTOMERS);
    expect(s.earnings).toBe(Math.round(pizzas[0].price * 1.3) * TOTAL_CUSTOMERS);
  });
});
