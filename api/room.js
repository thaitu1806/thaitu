// V4 Online Duel - Polling-based (Vercel compatible)
// Uses in-memory store (resets on cold start - for demo purposes)
// For production, use Redis/Turso for room state

const rooms = globalThis.__rooms || (globalThis.__rooms = new Map());

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do { code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join(''); } while (rooms.has(code));
  return code;
}

export default async function handler(req, res) {
  const { action, code, player } = req.method === 'GET' ? req.query : { ...req.query, ...req.body };

  switch (action) {
    case 'create': {
      const roomCode = generateCode();
      rooms.set(roomCode, {
        host: player, guest: null, settings: req.body.settings || { subject: 'mix', difficulty: 'medium', rounds: 10, speed: 'normal' },
        state: 'waiting', questions: [], currentRound: -1, roundStart: 0,
        hostAnswer: null, guestAnswer: null, hostScore: 0, guestScore: 0,
        hostCorrect: 0, guestCorrect: 0, lastUpdate: Date.now(),
      });
      return res.json({ code: roomCode });
    }

    case 'join': {
      const room = rooms.get(code);
      if (!room) return res.status(404).json({ error: 'Phòng không tồn tại' });
      if (room.guest) return res.status(400).json({ error: 'Phòng đã đầy' });
      room.guest = player;
      room.lastUpdate = Date.now();
      return res.json({ ok: true, host: room.host, settings: room.settings });
    }

    case 'poll': {
      const room = rooms.get(code);
      if (!room) return res.status(404).json({ error: 'Phòng không tồn tại' });
      return res.json({
        state: room.state, host: room.host, guest: room.guest, settings: room.settings,
        currentRound: room.currentRound, totalRounds: room.questions.length,
        question: room.currentRound >= 0 && room.currentRound < room.questions.length ? (() => { const q = room.questions[room.currentRound]; return { question_text: q.question_text, option_a: q.option_a, option_b: q.option_b, option_c: q.option_c, option_d: q.option_d, subject: q.subject }; })() : null,
        hostScore: room.hostScore, guestScore: room.guestScore,
        hostAnswered: !!room.hostAnswer, guestAnswered: !!room.guestAnswer,
        roundResult: room.roundResult || null, matchResult: room.matchResult || null,
        lastUpdate: room.lastUpdate,
      });
    }

    case 'start': {
      const room = rooms.get(code);
      if (!room || !room.guest) return res.status(400).json({ error: 'Chưa đủ người' });
      // Fetch questions from DB
      const { getDb } = await import('./db.js');
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
      } catch { room.questions = []; }
      room.state = 'playing';
      room.currentRound = 0;
      room.roundStart = Date.now();
      room.hostAnswer = null; room.guestAnswer = null;
      room.roundResult = null; room.matchResult = null;
      room.lastUpdate = Date.now();
      return res.json({ ok: true });
    }

    case 'answer': {
      const room = rooms.get(code);
      if (!room || room.state !== 'playing') return res.status(400).json({ error: 'Invalid' });
      const isHost = req.body.role === 'host';
      if (isHost) room.hostAnswer = { answer: req.body.answer, time: Date.now() - room.roundStart };
      else room.guestAnswer = { answer: req.body.answer, time: Date.now() - room.roundStart };

      // If both answered, resolve
      if (room.hostAnswer && room.guestAnswer) resolveRound(room);
      room.lastUpdate = Date.now();
      return res.json({ ok: true });
    }

    case 'timeout': {
      const room = rooms.get(code);
      if (!room || room.state !== 'playing') return res.json({ ok: true });
      if (!room.roundResult) resolveRound(room);
      room.lastUpdate = Date.now();
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

  // Next round after marking
  setTimeout(() => {
    room.currentRound++;
    room.hostAnswer = null; room.guestAnswer = null; room.roundResult = null;
    room.roundStart = Date.now();
    if (room.currentRound >= room.questions.length) {
      room.state = 'finished';
      room.matchResult = { winner: room.hostScore > room.guestScore ? 'host' : room.guestScore > room.hostScore ? 'guest' : 'tie', hostScore: room.hostScore, guestScore: room.guestScore, hostCorrect: room.hostCorrect, guestCorrect: room.guestCorrect };
    }
    room.lastUpdate = Date.now();
  }, 2000);
}
