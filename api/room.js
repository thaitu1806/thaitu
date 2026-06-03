// V4 Online Duel - Polling-based (Vercel compatible)
// Uses Turso DB for room state persistence across serverless instances

import { getDb } from './db.js';

// In-memory cache with short TTL for performance
const roomCache = new Map();
const CACHE_TTL = 500; // 500ms cache

async function ensureRoomTable() {
  const db = getDb();
  await db.execute({
    sql: `CREATE TABLE IF NOT EXISTS rooms (
      code TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    args: [],
  });
}

let tableReady = false;
async function init() {
  if (!tableReady) {
    await ensureRoomTable();
    tableReady = true;
  }
}

async function getRoom(code) {
  // Check cache first
  const cached = roomCache.get(code);
  if (cached && Date.now() - cached.time < CACHE_TTL) return cached.room;

  const db = getDb();
  const result = await db.execute({ sql: `SELECT data FROM rooms WHERE code = ?`, args: [code] });
  if (result.rows.length === 0) return null;
  const room = JSON.parse(result.rows[0].data);
  roomCache.set(code, { room, time: Date.now() });
  return room;
}

async function saveRoom(code, room) {
  const db = getDb();
  room.lastUpdate = Date.now();
  await db.execute({
    sql: `INSERT OR REPLACE INTO rooms (code, data, updated_at) VALUES (?, ?, ?)`,
    args: [code, JSON.stringify(room), Date.now()],
  });
  roomCache.set(code, { room, time: Date.now() });
}

async function deleteRoom(code) {
  const db = getDb();
  await db.execute({ sql: `DELETE FROM rooms WHERE code = ?`, args: [code] });
  roomCache.delete(code);
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default async function handler(req, res) {
  try {
    await init();
  } catch (e) {
    return res.status(500).json({ error: 'DB init failed: ' + e.message });
  }

  const action = req.query?.action || req.body?.action;
  const code = req.query?.code || req.body?.code;
  const player = req.body?.player || req.query?.player;

  // GET requests for polling
  if (req.method === 'GET' && action === 'poll') {
    const room = await getRoom(code);
    if (!room) return res.status(404).json({ error: 'Phòng không tồn tại' });

    // Auto-advance round if ready
    const advanced = checkAdvanceRound(room);
    if (advanced) await saveRoom(code, room);

    return res.json({
      state: room.state, host: room.host, guest: room.guest, settings: room.settings,
      currentRound: room.currentRound, totalRounds: room.questions.length,
      question: room.currentRound >= 0 && room.currentRound < room.questions.length
        ? (() => { const q = room.questions[room.currentRound]; return { question_text: q.question_text, option_a: q.option_a, option_b: q.option_b, option_c: q.option_c, option_d: q.option_d, subject: q.subject }; })()
        : null,
      hostScore: room.hostScore, guestScore: room.guestScore,
      hostAnswered: !!room.hostAnswer, guestAnswered: !!room.guestAnswer,
      roundResult: room.roundResult || null, matchResult: room.matchResult || null,
      lastUpdate: room.lastUpdate,
    });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  switch (action) {
    case 'create': {
      const roomCode = generateCode();
      const room = {
        host: player, guest: null,
        settings: req.body.settings || { subject: 'mix', difficulty: 'medium', rounds: 10, speed: 'normal' },
        state: 'waiting', questions: [], currentRound: -1, roundStart: 0,
        hostAnswer: null, guestAnswer: null, hostScore: 0, guestScore: 0,
        hostCorrect: 0, guestCorrect: 0, lastUpdate: Date.now(),
        roundResult: null, matchResult: null, nextRoundAt: null,
      };
      await saveRoom(roomCode, room);
      return res.json({ code: roomCode });
    }

    case 'join': {
      const room = await getRoom(code);
      if (!room) return res.status(404).json({ error: 'Phòng không tồn tại' });
      if (room.guest) return res.status(400).json({ error: 'Phòng đã đầy' });
      room.guest = player;
      await saveRoom(code, room);
      return res.json({ ok: true, host: room.host, settings: room.settings });
    }

    case 'start': {
      const room = await getRoom(code);
      if (!room || !room.guest) return res.status(400).json({ error: 'Chưa đủ người' });

      // Update settings if provided
      if (req.body.settings) {
        room.settings = { ...room.settings, ...req.body.settings };
      }

      // Fetch questions from DB
      const db = getDb();
      const { subject, difficulty, rounds } = room.settings;
      try {
        if (subject === 'mix') {
          const half = Math.ceil(rounds / 2);
          const m = await db.execute({ sql: `SELECT * FROM questions WHERE subject='math' AND difficulty=? ORDER BY RANDOM() LIMIT ?`, args: [difficulty, half] });
          const v = await db.execute({ sql: `SELECT * FROM questions WHERE subject='vietnamese' AND difficulty=? ORDER BY RANDOM() LIMIT ?`, args: [difficulty, rounds - half] });
          room.questions = [...m.rows, ...v.rows].sort(() => Math.random() - 0.5);
        } else {
          const r = await db.execute({ sql: `SELECT * FROM questions WHERE subject=? AND difficulty=? ORDER BY RANDOM() LIMIT ?`, args: [subject, difficulty, parseInt(rounds)] });
          room.questions = r.rows;
        }
      } catch {
        room.questions = generateFallback(parseInt(rounds) || 10);
      }

      if (room.questions.length === 0) room.questions = generateFallback(10);
      room.state = 'playing';
      room.currentRound = 0;
      room.roundStart = Date.now();
      room.hostAnswer = null; room.guestAnswer = null;
      room.roundResult = null; room.matchResult = null;
      room.nextRoundAt = null;
      room.hostScore = 0; room.guestScore = 0;
      room.hostCorrect = 0; room.guestCorrect = 0;
      await saveRoom(code, room);
      return res.json({ ok: true });
    }

    case 'answer': {
      const room = await getRoom(code);
      if (!room || room.state !== 'playing') return res.status(400).json({ error: 'Invalid' });
      const isHost = req.body.role === 'host';
      if (isHost) room.hostAnswer = { answer: req.body.answer, time: Date.now() - room.roundStart };
      else room.guestAnswer = { answer: req.body.answer, time: Date.now() - room.roundStart };

      // If both answered, resolve round
      if (room.hostAnswer && room.guestAnswer) resolveRound(room);
      await saveRoom(code, room);
      return res.json({ ok: true });
    }

    case 'timeout': {
      const room = await getRoom(code);
      if (!room || room.state !== 'playing') return res.json({ ok: true });
      if (!room.roundResult) resolveRound(room);
      await saveRoom(code, room);
      return res.json({ ok: true });
    }

    default:
      return res.status(400).json({ error: 'Unknown action' });
  }
}

function resolveRound(room) {
  const q = room.questions[room.currentRound];
  const correct = q.correct_answer;
  const hOk = room.hostAnswer?.answer === correct;
  const gOk = room.guestAnswer?.answer === correct;
  let hp = 0, gp = 0;
  if (hOk) { room.hostCorrect++; hp = 10; if (!gOk || room.hostAnswer.time < room.guestAnswer?.time) hp += 5; }
  if (gOk) { room.guestCorrect++; gp = 10; if (!hOk || room.guestAnswer.time < room.hostAnswer?.time) gp += 5; }
  room.hostScore += hp; room.guestScore += gp;

  room.roundResult = { correct_answer: correct, hostCorrect: hOk, guestCorrect: gOk, hostPoints: hp, guestPoints: gp };
  room.nextRoundAt = Date.now() + 3000; // 3s to show result before advancing
}

// Called by poll - advance round if enough time has passed
function checkAdvanceRound(room) {
  if (room.roundResult && room.nextRoundAt && Date.now() >= room.nextRoundAt) {
    room.currentRound++;
    room.hostAnswer = null; room.guestAnswer = null; room.roundResult = null;
    room.roundStart = Date.now();
    room.nextRoundAt = null;
    if (room.currentRound >= room.questions.length) {
      room.state = 'finished';
      room.matchResult = {
        winner: room.hostScore > room.guestScore ? 'host' : room.guestScore > room.hostScore ? 'guest' : 'tie',
        hostScore: room.hostScore, guestScore: room.guestScore,
        hostCorrect: room.hostCorrect, guestCorrect: room.guestCorrect,
      };
    }
    return true;
  }
  return false;
}

function generateFallback(count) {
  const questions = [];
  for (let i = 0; i < count; i++) {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    const sum = a + b;
    const opts = [sum, sum + 1, sum - 1, sum + 2].sort(() => Math.random() - 0.5);
    const correctIdx = opts.indexOf(sum);
    questions.push({
      question_text: `${a} + ${b} = ?`,
      option_a: String(opts[0]),
      option_b: String(opts[1]),
      option_c: String(opts[2]),
      option_d: String(opts[3]),
      correct_answer: ['a', 'b', 'c', 'd'][correctIdx],
      subject: 'math',
    });
  }
  return questions;
}
