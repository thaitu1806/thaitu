import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock db module
const mockExecute = vi.fn();
vi.mock('../api/db.js', () => ({
  getDb: () => ({ execute: mockExecute }),
}));

// Mock quest-generator
vi.mock('../lib/quest-generator.js', () => ({
  generateDailyQuests: (playerId, dateStr) => [
    { type: 'play_any', description: 'Chơi 3 lượt bất kỳ', target_value: 3, diamond_reward: 8 },
    { type: 'combo_streak', description: 'Đạt combo 5 trong 1 ván', target_value: 5, diamond_reward: 15 },
    { type: 'accuracy', description: 'Chơi 2 lượt đạt 80% đúng', target_value: 2, diamond_reward: 15 },
  ],
  getVietnamDateStr: () => '2024-06-15',
}));

const { default: handler } = await import('../api/quests.js');

function createReq(method, body = {}, params = {}, query = {}) {
  return { method, body, params, query };
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

describe('api/quests.js - GET (fetch quests)', () => {
  beforeEach(() => {
    mockExecute.mockReset();
  });

  it('returns 400 if no player id provided', async () => {
    const req = createReq('GET', {}, {}, {});
    const res = createRes();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Thiếu thông tin bắt buộc');
  });

  it('returns 404 if player not found', async () => {
    mockExecute.mockResolvedValueOnce({ rows: [] }); // player not found

    const req = createReq('GET', {}, { id: '99' }, {});
    const res = createRes();
    await handler(req, res);
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Không tìm thấy người chơi');
  });

  it('returns existing quests if they already exist for today', async () => {
    const existingQuests = [
      { id: 1, player_id: 1, quest_type: 'play_any', quest_description: 'Chơi 3 lượt bất kỳ', target_value: 3, current_value: 1, diamond_reward: 8, is_completed: 0, quest_date: '2024-06-15' },
    ];

    mockExecute
      .mockResolvedValueOnce({ rows: [{ id: 1, total_diamonds: 100, lifetime_diamonds: 200 }] }) // player exists
      .mockResolvedValueOnce({ rows: existingQuests }); // quests exist

    const req = createReq('GET', {}, { id: '1' }, {});
    const res = createRes();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.quests).toEqual(existingQuests);
  });

  it('generates and inserts quests if none exist for today', async () => {
    const insertedQuests = [
      { id: 10, player_id: 1, quest_type: 'play_any', quest_description: 'Chơi 3 lượt bất kỳ', target_value: 3, current_value: 0, diamond_reward: 8, is_completed: 0, quest_date: '2024-06-15' },
      { id: 11, player_id: 1, quest_type: 'combo_streak', quest_description: 'Đạt combo 5 trong 1 ván', target_value: 5, current_value: 0, diamond_reward: 15, is_completed: 0, quest_date: '2024-06-15' },
      { id: 12, player_id: 1, quest_type: 'accuracy', quest_description: 'Chơi 2 lượt đạt 80% đúng', target_value: 2, current_value: 0, diamond_reward: 15, is_completed: 0, quest_date: '2024-06-15' },
    ];

    mockExecute
      .mockResolvedValueOnce({ rows: [{ id: 1, total_diamonds: 50, lifetime_diamonds: 100 }] }) // player exists
      .mockResolvedValueOnce({ rows: [] }) // no quests for today
      .mockResolvedValueOnce({}) // INSERT quest 1
      .mockResolvedValueOnce({}) // INSERT quest 2
      .mockResolvedValueOnce({}) // INSERT quest 3
      .mockResolvedValueOnce({ rows: insertedQuests }); // re-fetch

    const req = createReq('GET', {}, { id: '1' }, {});
    const res = createRes();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.quests).toHaveLength(3);
    // Verify insert calls were made
    expect(mockExecute).toHaveBeenCalledTimes(6);
  });

  it('supports player id from query param', async () => {
    const existingQuests = [
      { id: 1, player_id: 5, quest_type: 'play_any', quest_description: 'Chơi 3 lượt bất kỳ', target_value: 3, current_value: 0, diamond_reward: 8, is_completed: 0, quest_date: '2024-06-15' },
    ];

    mockExecute
      .mockResolvedValueOnce({ rows: [{ id: 5, total_diamonds: 50, lifetime_diamonds: 100 }] }) // player exists
      .mockResolvedValueOnce({ rows: existingQuests }); // quests exist

    const req = createReq('GET', {}, {}, { id: '5' });
    const res = createRes();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.quests).toHaveLength(1);
  });
});

describe('api/quests.js - POST (quest check)', () => {
  beforeEach(() => {
    mockExecute.mockReset();
  });

  it('increments play_any quest on any completed session', async () => {
    mockExecute
      .mockResolvedValueOnce({ rows: [{ id: 1, total_diamonds: 50, lifetime_diamonds: 100 }] }) // player
      .mockResolvedValueOnce({ rows: [
        { id: 10, quest_type: 'play_any', quest_description: 'Chơi 3 lượt bất kỳ', target_value: 3, current_value: 1, diamond_reward: 8, is_completed: 0 },
      ]}) // incomplete quests
      .mockResolvedValueOnce({}) // UPDATE quest
      .mockResolvedValueOnce({ rows: [{ total: 3, completed: 1 }] }); // all quests check (not all done)

    const req = createReq('POST', { mode: 'classic', combo_max: 2, accuracy: 75 }, { id: '1' }, {});
    const res = createRes();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.updated).toHaveLength(1);
    expect(res.body.updated[0].current_value).toBe(2);
    expect(res.body.updated[0].is_completed).toBe(0);
    expect(res.body.diamonds_awarded).toBe(0);
  });

  it('completes quest and awards diamonds when target reached', async () => {
    mockExecute
      .mockResolvedValueOnce({ rows: [{ id: 1, total_diamonds: 50, lifetime_diamonds: 100 }] }) // player
      .mockResolvedValueOnce({ rows: [
        { id: 10, quest_type: 'play_any', quest_description: 'Chơi 3 lượt bất kỳ', target_value: 3, current_value: 2, diamond_reward: 8, is_completed: 0 },
      ]}) // incomplete quests
      .mockResolvedValueOnce({}) // UPDATE quest (mark completed)
      .mockResolvedValueOnce({}) // INSERT diamond_transactions
      .mockResolvedValueOnce({}) // UPDATE players diamonds
      .mockResolvedValueOnce({ rows: [{ total: 3, completed: 2 }] }); // not all quests done

    const req = createReq('POST', { mode: 'classic' }, { id: '1' }, {});
    const res = createRes();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.updated[0].is_completed).toBe(1);
    expect(res.body.diamonds_awarded).toBe(8);
    expect(res.body.all_quests_bonus).toBe(0);
  });

  it('awards all-quests bonus (15 diamonds) when all quests completed', async () => {
    mockExecute
      .mockResolvedValueOnce({ rows: [{ id: 1, total_diamonds: 50, lifetime_diamonds: 100 }] }) // player
      .mockResolvedValueOnce({ rows: [
        { id: 10, quest_type: 'play_any', quest_description: 'Chơi 3 lượt bất kỳ', target_value: 3, current_value: 2, diamond_reward: 8, is_completed: 0 },
      ]}) // last incomplete quest
      .mockResolvedValueOnce({}) // UPDATE quest (mark completed)
      .mockResolvedValueOnce({}) // INSERT diamond_transactions (quest)
      .mockResolvedValueOnce({}) // UPDATE players diamonds (quest)
      .mockResolvedValueOnce({ rows: [{ total: 3, completed: 3 }] }) // all quests done!
      .mockResolvedValueOnce({ rows: [] }) // no existing bonus
      .mockResolvedValueOnce({}) // INSERT diamond_transactions (bonus)
      .mockResolvedValueOnce({}); // UPDATE players diamonds (bonus)

    const req = createReq('POST', { mode: 'classic' }, { id: '1' }, {});
    const res = createRes();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.diamonds_awarded).toBe(23); // 8 + 15
    expect(res.body.all_quests_bonus).toBe(15);
  });

  it('does not award all-quests bonus twice in same day', async () => {
    mockExecute
      .mockResolvedValueOnce({ rows: [{ id: 1, total_diamonds: 50, lifetime_diamonds: 100 }] }) // player
      .mockResolvedValueOnce({ rows: [] }) // no incomplete quests
      .mockResolvedValueOnce({ rows: [{ total: 3, completed: 3 }] }) // all quests done
      .mockResolvedValueOnce({ rows: [{ id: 99 }] }); // bonus already exists

    const req = createReq('POST', { mode: 'classic' }, { id: '1' }, {});
    const res = createRes();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.diamonds_awarded).toBe(0);
    expect(res.body.all_quests_bonus).toBe(0);
  });

  it('increments accuracy quest when accuracy >= 80', async () => {
    mockExecute
      .mockResolvedValueOnce({ rows: [{ id: 1, total_diamonds: 50, lifetime_diamonds: 100 }] }) // player
      .mockResolvedValueOnce({ rows: [
        { id: 11, quest_type: 'accuracy', quest_description: 'Chơi 2 lượt đạt 80% đúng', target_value: 2, current_value: 0, diamond_reward: 15, is_completed: 0 },
      ]})
      .mockResolvedValueOnce({}) // UPDATE quest
      .mockResolvedValueOnce({ rows: [{ total: 3, completed: 1 }] }); // not all done

    const req = createReq('POST', { mode: 'classic', accuracy: 85 }, { id: '1' }, {});
    const res = createRes();
    await handler(req, res);

    expect(res.body.updated[0].current_value).toBe(1);
  });

  it('does not increment accuracy quest when accuracy < 80', async () => {
    mockExecute
      .mockResolvedValueOnce({ rows: [{ id: 1, total_diamonds: 50, lifetime_diamonds: 100 }] }) // player
      .mockResolvedValueOnce({ rows: [
        { id: 11, quest_type: 'accuracy', quest_description: 'Chơi 2 lượt đạt 80% đúng', target_value: 2, current_value: 0, diamond_reward: 15, is_completed: 0 },
      ]})
      .mockResolvedValueOnce({ rows: [{ total: 3, completed: 0 }] }); // not all done

    const req = createReq('POST', { mode: 'classic', accuracy: 60 }, { id: '1' }, {});
    const res = createRes();
    await handler(req, res);

    expect(res.body.updated).toHaveLength(0);
  });

  it('updates combo_streak quest when combo_max meets target', async () => {
    mockExecute
      .mockResolvedValueOnce({ rows: [{ id: 1, total_diamonds: 50, lifetime_diamonds: 100 }] }) // player
      .mockResolvedValueOnce({ rows: [
        { id: 12, quest_type: 'combo_streak', quest_description: 'Đạt combo 5 trong 1 ván', target_value: 5, current_value: 0, diamond_reward: 15, is_completed: 0 },
      ]})
      .mockResolvedValueOnce({}) // UPDATE quest
      .mockResolvedValueOnce({}) // INSERT diamond_transactions (quest completed)
      .mockResolvedValueOnce({}) // UPDATE players diamonds
      .mockResolvedValueOnce({ rows: [{ total: 3, completed: 2 }] }); // not all done

    const req = createReq('POST', { mode: 'classic', combo_max: 7 }, { id: '1' }, {});
    const res = createRes();
    await handler(req, res);

    expect(res.body.updated[0].current_value).toBe(7);
    expect(res.body.updated[0].is_completed).toBe(1);
    expect(res.body.diamonds_awarded).toBe(15);
  });

  it('increments learn_lesson quest when is_learn_session is true', async () => {
    mockExecute
      .mockResolvedValueOnce({ rows: [{ id: 1, total_diamonds: 50, lifetime_diamonds: 100 }] }) // player
      .mockResolvedValueOnce({ rows: [
        { id: 13, quest_type: 'learn_lesson', quest_description: 'Học 1 bài mới', target_value: 1, current_value: 0, diamond_reward: 10, is_completed: 0 },
      ]})
      .mockResolvedValueOnce({}) // UPDATE quest
      .mockResolvedValueOnce({}) // INSERT diamond_transactions
      .mockResolvedValueOnce({}) // UPDATE players
      .mockResolvedValueOnce({ rows: [{ total: 3, completed: 2 }] }); // not all done

    const req = createReq('POST', { is_learn_session: true }, { id: '1' }, {});
    const res = createRes();
    await handler(req, res);

    expect(res.body.updated[0].current_value).toBe(1);
    expect(res.body.updated[0].is_completed).toBe(1);
    expect(res.body.diamonds_awarded).toBe(10);
  });

  it('increments play_mode quest when mode matches description', async () => {
    mockExecute
      .mockResolvedValueOnce({ rows: [{ id: 1, total_diamonds: 50, lifetime_diamonds: 100 }] }) // player
      .mockResolvedValueOnce({ rows: [
        { id: 14, quest_type: 'play_mode', quest_description: 'Chơi 2 lượt classic', target_value: 2, current_value: 0, diamond_reward: 12, is_completed: 0 },
      ]})
      .mockResolvedValueOnce({}) // UPDATE quest
      .mockResolvedValueOnce({ rows: [{ total: 3, completed: 1 }] }); // not all done

    const req = createReq('POST', { mode: 'classic', combo_max: 2, accuracy: 50 }, { id: '1' }, {});
    const res = createRes();
    await handler(req, res);

    expect(res.body.updated[0].current_value).toBe(1);
  });

  it('does not increment play_mode quest when mode does not match', async () => {
    mockExecute
      .mockResolvedValueOnce({ rows: [{ id: 1, total_diamonds: 50, lifetime_diamonds: 100 }] }) // player
      .mockResolvedValueOnce({ rows: [
        { id: 14, quest_type: 'play_mode', quest_description: 'Chơi 2 lượt adventure', target_value: 2, current_value: 0, diamond_reward: 12, is_completed: 0 },
      ]})
      .mockResolvedValueOnce({ rows: [{ total: 3, completed: 0 }] }); // not all done

    const req = createReq('POST', { mode: 'classic', combo_max: 2, accuracy: 50 }, { id: '1' }, {});
    const res = createRes();
    await handler(req, res);

    expect(res.body.updated).toHaveLength(0);
  });
});
