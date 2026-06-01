// WebSocket server for V4 Online Duel
import { WebSocketServer } from 'ws';
import { getDb } from './db/database.js';

const rooms = new Map(); // roomCode -> { host, guest, settings, questions, state }

export function setupWebSocket(server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data);
        handleMessage(ws, msg);
      } catch (e) {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message' }));
      }
    });

    ws.on('close', () => {
      handleDisconnect(ws);
    });
  });

  // Heartbeat
  setInterval(() => {
    wss.clients.forEach(ws => {
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  return wss;
}

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (rooms.has(code));
  return code;
}

function send(ws, msg) {
  if (ws.readyState === 1) ws.send(JSON.stringify(msg));
}

async function handleMessage(ws, msg) {
  switch (msg.type) {
    case 'create': {
      const code = generateRoomCode();
      rooms.set(code, {
        host: { ws, name: msg.name, score: 0, correct: 0, answered: false, answer: null, time: 0 },
        guest: null,
        settings: msg.settings || { subject: 'mix', difficulty: 'medium', rounds: 10, speed: 'normal' },
        questions: [],
        state: 'waiting', // waiting, playing, finished
        currentRound: 0,
        timer: null,
        roundStart: 0,
      });
      ws.roomCode = code;
      ws.role = 'host';
      send(ws, { type: 'created', code, name: msg.name });
      break;
    }

    case 'join': {
      const code = msg.code.toUpperCase();
      const room = rooms.get(code);
      if (!room) { send(ws, { type: 'error', message: 'Phòng không tồn tại!' }); return; }
      if (room.guest) { send(ws, { type: 'error', message: 'Phòng đã đầy!' }); return; }
      if (room.state !== 'waiting') { send(ws, { type: 'error', message: 'Trận đấu đã bắt đầu!' }); return; }

      room.guest = { ws, name: msg.name, score: 0, correct: 0, answered: false, answer: null, time: 0 };
      ws.roomCode = code;
      ws.role = 'guest';

      send(ws, { type: 'joined', code, hostName: room.host.name, settings: room.settings });
      send(room.host.ws, { type: 'guest_joined', guestName: msg.name });
      break;
    }

    case 'update_settings': {
      const room = rooms.get(ws.roomCode);
      if (!room || ws.role !== 'host') return;
      room.settings = msg.settings;
      if (room.guest) send(room.guest.ws, { type: 'settings_updated', settings: msg.settings });
      break;
    }

    case 'start': {
      const room = rooms.get(ws.roomCode);
      if (!room || ws.role !== 'host' || !room.guest) return;
      await startMatch(ws.roomCode);
      break;
    }

    case 'answer': {
      const room = rooms.get(ws.roomCode);
      if (!room || room.state !== 'playing') return;
      const player = ws.role === 'host' ? room.host : room.guest;
      if (player.answered) return;

      player.answered = true;
      player.answer = msg.answer;
      player.time = Date.now() - room.roundStart;

      // Notify opponent that this player answered
      const opponent = ws.role === 'host' ? room.guest : room.host;
      send(opponent.ws, { type: 'opponent_answered' });

      // If both answered, resolve
      if (room.host.answered && room.guest.answered) {
        clearTimeout(room.timer);
        resolveRound(ws.roomCode);
      }
      break;
    }

    case 'rematch': {
      const room = rooms.get(ws.roomCode);
      if (!room) return;
      room.host.score = 0; room.host.correct = 0;
      if (room.guest) { room.guest.score = 0; room.guest.correct = 0; }
      room.currentRound = 0;
      room.state = 'waiting';
      send(room.host.ws, { type: 'rematch_ready' });
      if (room.guest) send(room.guest.ws, { type: 'rematch_ready' });
      break;
    }
  }
}

async function startMatch(code) {
  const room = rooms.get(code);
  if (!room) return;

  // Fetch questions
  const { subject, difficulty, rounds } = room.settings;
  const db = getDb();
  try {
    if (subject === 'mix') {
      const half = Math.ceil(rounds / 2);
      const math = await db.execute({ sql: `SELECT * FROM questions WHERE subject = 'math' AND difficulty = ? ORDER BY RANDOM() LIMIT ?`, args: [difficulty, half] });
      const viet = await db.execute({ sql: `SELECT * FROM questions WHERE subject = 'vietnamese' AND difficulty = ? ORDER BY RANDOM() LIMIT ?`, args: [difficulty, rounds - half] });
      room.questions = shuffle([...math.rows, ...viet.rows]);
    } else {
      const result = await db.execute({ sql: `SELECT * FROM questions WHERE subject = ? AND difficulty = ? ORDER BY RANDOM() LIMIT ?`, args: [subject, difficulty, parseInt(rounds)] });
      room.questions = result.rows;
    }
  } catch {
    room.questions = generateFallback(rounds);
  }

  room.state = 'playing';
  room.currentRound = 0;

  // Notify both players
  const startMsg = { type: 'match_start', hostName: room.host.name, guestName: room.guest.name, totalRounds: room.questions.length, settings: room.settings };
  send(room.host.ws, startMsg);
  send(room.guest.ws, startMsg);

  // Start first round after short delay
  setTimeout(() => sendRound(code), 1500);
}

function sendRound(code) {
  const room = rooms.get(code);
  if (!room || room.currentRound >= room.questions.length) { endMatch(code); return; }

  const q = room.questions[room.currentRound];
  room.host.answered = false; room.host.answer = null; room.host.time = 0;
  room.guest.answered = false; room.guest.answer = null; room.guest.time = 0;
  room.roundStart = Date.now();

  const roundMsg = {
    type: 'round',
    round: room.currentRound + 1,
    total: room.questions.length,
    question: { question_text: q.question_text, option_a: q.option_a, option_b: q.option_b, option_c: q.option_c, option_d: q.option_d, subject: q.subject },
  };
  send(room.host.ws, roundMsg);
  send(room.guest.ws, roundMsg);

  // Timer
  const speed = room.settings.speed === 'slow' ? 30000 : room.settings.speed === 'fast' ? 12000 : 20000;
  room.timer = setTimeout(() => resolveRound(code), speed);
}

function resolveRound(code) {
  const room = rooms.get(code);
  if (!room) return;

  const q = room.questions[room.currentRound];
  const correct = q.correct_answer;

  const hostCorrect = room.host.answer === correct;
  const guestCorrect = room.guest.answer === correct;

  let hostPoints = 0, guestPoints = 0;
  if (hostCorrect) { room.host.correct++; hostPoints = 10; if (!guestCorrect || room.host.time < room.guest.time) hostPoints += 5; }
  if (guestCorrect) { room.guest.correct++; guestPoints = 10; if (!hostCorrect || room.guest.time < room.host.time) guestPoints += 5; }

  room.host.score += hostPoints;
  room.guest.score += guestPoints;

  const resultMsg = {
    type: 'round_result',
    correct_answer: correct,
    host: { answer: room.host.answer, correct: hostCorrect, points: hostPoints, score: room.host.score, time: room.host.time },
    guest: { answer: room.guest.answer, correct: guestCorrect, points: guestPoints, score: room.guest.score, time: room.guest.time },
  };
  send(room.host.ws, resultMsg);
  send(room.guest.ws, resultMsg);

  room.currentRound++;

  // Next round after delay
  setTimeout(() => {
    if (room.currentRound >= room.questions.length) endMatch(code);
    else sendRound(code);
  }, 2500);
}

function endMatch(code) {
  const room = rooms.get(code);
  if (!room) return;
  room.state = 'finished';

  const winner = room.host.score > room.guest.score ? 'host' : room.guest.score > room.host.score ? 'guest' : 'tie';
  const endMsg = {
    type: 'match_end',
    winner,
    host: { name: room.host.name, score: room.host.score, correct: room.host.correct },
    guest: { name: room.guest.name, score: room.guest.score, correct: room.guest.correct },
    totalRounds: room.questions.length,
  };
  send(room.host.ws, endMsg);
  send(room.guest.ws, endMsg);
}

function handleDisconnect(ws) {
  const code = ws.roomCode;
  if (!code) return;
  const room = rooms.get(code);
  if (!room) return;

  const opponent = ws.role === 'host' ? room.guest : room.host;
  if (opponent && opponent.ws.readyState === 1) {
    send(opponent.ws, { type: 'opponent_left' });
  }

  clearTimeout(room.timer);
  rooms.delete(code);
}

function shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

function generateFallback(count) {
  const qs = [];
  for (let i = 0; i < count; i++) {
    const a = Math.floor(Math.random() * 20) + 3, b = Math.floor(Math.random() * 15) + 1;
    const answer = a + b;
    const opts = [answer, answer + 1, answer - 1, answer + 2].sort(() => Math.random() - 0.5);
    qs.push({ question_text: `${a} + ${b} = ?`, option_a: String(opts[0]), option_b: String(opts[1]), option_c: String(opts[2]), option_d: String(opts[3]), correct_answer: ['a','b','c','d'][opts.indexOf(answer)], subject: 'math' });
  }
  return qs;
}
