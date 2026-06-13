import { describe, it, expect, vi, beforeEach } from 'vitest';

// We test the diamond logic by mocking the database and calling the handler directly
// This validates the integration between calculateDiamonds and the answer endpoint

// Mock db module
const mockExecute = vi.fn();
vi.mock('../api/db.js', () => ({
  getDb: () => ({ execute: mockExecute }),
}));

// Import handler after mocking
const { default: handler } = await import('../api/answers.js');

function createReq(body) {
  return { method: 'POST', body };
}

function createRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) { res.statusCode = code; return res; },
    json(data) { res.body = data; return res; },
  };
  return res;
}

describe('api/answers.js - diamond award on correct answer', () => {
  beforeEach(() => {
    mockExecute.mockReset();
  });

  it('awards diamonds for a correct easy answer with no combo', async () => {
    // Setup mock responses
    mockExecute
      .mockResolvedValueOnce({}) // INSERT answer_logs
      .mockResolvedValueOnce({ rows: [{ lifetime_diamonds: 50 }] }) // SELECT lifetime_diamonds
      .mockResolvedValueOnce({}) // INSERT diamond_transactions
      .mockResolvedValueOnce({}) // UPDATE players
      .mockResolvedValueOnce({ rows: [{ total_diamonds: 51 }] }); // SELECT total_diamonds

    const req = createReq({
      session_id: 1, player_id: 1, question_id: 10,
      selected_answer: 'a', correct_answer: 'a',
      is_correct: true, time_spent_ms: 2000,
      difficulty: 'easy', combo_streak: 0,
    });
    const res = createRes();

    await handler(req, res);

    expect(res.body.ok).toBe(true);
    expect(res.body.diamonds_earned).toBe(1); // easy = 1, no combo
    expect(res.body.new_total).toBe(51);
  });

  it('awards doubled diamonds for combo streak 3-6', async () => {
    mockExecute
      .mockResolvedValueOnce({}) // INSERT answer_logs
      .mockResolvedValueOnce({ rows: [{ lifetime_diamonds: 50 }] }) // SELECT lifetime_diamonds
      .mockResolvedValueOnce({}) // INSERT diamond_transactions
      .mockResolvedValueOnce({}) // UPDATE players
      .mockResolvedValueOnce({ rows: [{ total_diamonds: 56 }] }); // SELECT total_diamonds

    const req = createReq({
      session_id: 1, player_id: 1, question_id: 10,
      selected_answer: 'b', correct_answer: 'b',
      is_correct: true, time_spent_ms: 1500,
      difficulty: 'medium', combo_streak: 4,
    });
    const res = createRes();

    await handler(req, res);

    expect(res.body.ok).toBe(true);
    expect(res.body.diamonds_earned).toBe(6); // medium=3 * 2 = 6
  });

  it('awards tripled diamonds for combo streak >= 7', async () => {
    mockExecute
      .mockResolvedValueOnce({}) // INSERT answer_logs
      .mockResolvedValueOnce({ rows: [{ lifetime_diamonds: 50 }] }) // SELECT lifetime_diamonds
      .mockResolvedValueOnce({}) // INSERT diamond_transactions
      .mockResolvedValueOnce({}) // UPDATE players
      .mockResolvedValueOnce({ rows: [{ total_diamonds: 65 }] }); // SELECT total_diamonds

    const req = createReq({
      session_id: 1, player_id: 1, question_id: 10,
      selected_answer: 'c', correct_answer: 'c',
      is_correct: true, time_spent_ms: 3000,
      difficulty: 'hard', combo_streak: 8,
    });
    const res = createRes();

    await handler(req, res);

    expect(res.body.ok).toBe(true);
    expect(res.body.diamonds_earned).toBe(15); // hard=5 * 3 = 15
  });

  it('awards level-up bonus when crossing a level threshold', async () => {
    // Player at 98 lifetime diamonds (bronze), earns 3 (medium, no combo) → 101 = silver
    mockExecute
      .mockResolvedValueOnce({}) // INSERT answer_logs
      .mockResolvedValueOnce({ rows: [{ lifetime_diamonds: 98 }] }) // SELECT lifetime_diamonds
      .mockResolvedValueOnce({}) // INSERT diamond_transactions (answer)
      .mockResolvedValueOnce({}) // UPDATE players (answer diamonds)
      .mockResolvedValueOnce({}) // INSERT diamond_transactions (level_up)
      .mockResolvedValueOnce({}) // UPDATE players (level_up bonus)
      .mockResolvedValueOnce({ rows: [{ total_diamonds: 121 }] }); // SELECT total_diamonds

    const req = createReq({
      session_id: 1, player_id: 1, question_id: 10,
      selected_answer: 'a', correct_answer: 'a',
      is_correct: true, time_spent_ms: 2000,
      difficulty: 'medium', combo_streak: 0,
    });
    const res = createRes();

    await handler(req, res);

    expect(res.body.ok).toBe(true);
    expect(res.body.diamonds_earned).toBe(23); // 3 (medium) + 20 (level-up bonus)
    // Verify level-up transaction was inserted
    const levelUpCall = mockExecute.mock.calls[4]; // 5th call is level-up transaction
    expect(levelUpCall[0].sql).toContain('diamond_transactions');
    expect(levelUpCall[0].sql).toContain('level_up');
    expect(levelUpCall[0].args).toContain(20); // LEVEL_UP_BONUS amount
  });

  it('returns diamonds_earned=0 for wrong answers', async () => {
    mockExecute.mockResolvedValueOnce({}); // INSERT answer_logs

    const req = createReq({
      session_id: 1, player_id: 1, question_id: 10,
      selected_answer: 'b', correct_answer: 'a',
      is_correct: false, time_spent_ms: 2000,
      difficulty: 'hard', combo_streak: 5,
    });
    const res = createRes();

    await handler(req, res);

    expect(res.body.ok).toBe(true);
    expect(res.body.diamonds_earned).toBe(0);
    // Should only have 1 db call (the answer log), no diamond logic
    expect(mockExecute).toHaveBeenCalledTimes(1);
  });

  it('still logs answer when no difficulty provided (existing behavior)', async () => {
    mockExecute.mockResolvedValueOnce({}); // INSERT answer_logs

    const req = createReq({
      session_id: 1, player_id: 1, question_id: 10,
      selected_answer: 'a', correct_answer: 'a',
      is_correct: true, time_spent_ms: 2000,
    });
    const res = createRes();

    await handler(req, res);

    expect(res.body.ok).toBe(true);
    expect(res.body.diamonds_earned).toBe(0);
    // Only the answer_logs insert should happen
    expect(mockExecute).toHaveBeenCalledTimes(1);
  });

  it('skips when missing required data', async () => {
    const req = createReq({ session_id: 1 }); // no player_id, no question_id
    const res = createRes();

    await handler(req, res);

    expect(res.body.ok).toBe(true);
    expect(res.body.skipped).toBe(true);
    expect(mockExecute).not.toHaveBeenCalled();
  });
});
