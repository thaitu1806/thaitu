// WebSocket server for V4 Online Duel + V11 Tỉ Phú Trí Tuệ Online
import { WebSocketServer } from 'ws';
import { getDb } from './db/database.js';

const rooms = new Map(); // roomCode -> { host, guest, settings, questions, state }
const v11rooms = new Map(); // roomCode -> v11 game room

export function setupWebSocket(server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data);
        if (msg.type && msg.type.startsWith('v11_')) {
          handleV11Message(ws, msg);
        } else {
          handleMessage(ws, msg);
        }
      } catch (e) {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message' }));
      }
    });

    ws.on('close', () => {
      handleDisconnect(ws);
      handleV11Disconnect(ws);
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

// ===== V11 TỈ PHÚ TRÍ TUỆ ONLINE =====

const V11_BOARD_SIZE = 34;
const V11_BOARD = [
  { id: 0, type: 'start', name: 'Xuất phát', price: 0, rent: 0 },
  { id: 1, type: 'land', name: 'Hà Nội', price: 300, rent: 60 },
  { id: 2, type: 'quiz', name: 'Câu hỏi', price: 0, rent: 0 },
  { id: 3, type: 'land', name: 'Hải Phòng', price: 200, rent: 40 },
  { id: 4, type: 'land', name: 'Ninh Bình', price: 220, rent: 44 },
  { id: 5, type: 'lucky', name: 'Hộp quà', price: 0, rent: 0 },
  { id: 6, type: 'land', name: 'Huế', price: 250, rent: 50 },
  { id: 7, type: 'land', name: 'Đà Nẵng', price: 280, rent: 55 },
  { id: 8, type: 'tax', name: 'Thuế', price: 0, rent: 100 },
  { id: 9, type: 'land', name: 'Nha Trang', price: 260, rent: 50 },
  { id: 10, type: 'land', name: 'Quy Nhơn', price: 230, rent: 46 },
  { id: 11, type: 'quiz', name: 'Câu hỏi', price: 0, rent: 0 },
  { id: 12, type: 'land', name: 'Đà Lạt', price: 270, rent: 55 },
  { id: 13, type: 'land', name: 'Buôn Ma Thuột', price: 200, rent: 40 },
  { id: 14, type: 'lucky', name: 'Hộp quà', price: 0, rent: 0 },
  { id: 15, type: 'land', name: 'TP.HCM', price: 350, rent: 70 },
  { id: 16, type: 'land', name: 'Vũng Tàu', price: 230, rent: 45 },
  { id: 17, type: 'tax', name: 'Thuế', price: 0, rent: 150 },
  { id: 18, type: 'land', name: 'Cần Thơ', price: 220, rent: 45 },
  { id: 19, type: 'land', name: 'Phú Quốc', price: 300, rent: 60 },
  { id: 20, type: 'quiz', name: 'Câu hỏi', price: 0, rent: 0 },
  { id: 21, type: 'land', name: 'Cà Mau', price: 180, rent: 36 },
  { id: 22, type: 'land', name: 'Rạch Giá', price: 190, rent: 38 },
  { id: 23, type: 'lucky', name: 'Hộp quà', price: 0, rent: 0 },
  { id: 24, type: 'land', name: 'Long An', price: 200, rent: 40 },
  { id: 25, type: 'land', name: 'Hạ Long', price: 290, rent: 55 },
  { id: 26, type: 'land', name: 'Sapa', price: 240, rent: 48 },
  { id: 27, type: 'land', name: 'Hội An', price: 280, rent: 55 },
  { id: 28, type: 'tax', name: 'Thuế', price: 0, rent: 120 },
  { id: 29, type: 'land', name: 'Mũi Né', price: 250, rent: 50 },
  { id: 30, type: 'land', name: 'Tây Ninh', price: 210, rent: 42 },
  { id: 31, type: 'quiz', name: 'Câu hỏi', price: 0, rent: 0 },
  { id: 32, type: 'land', name: 'Bắc Ninh', price: 230, rent: 46 },
  { id: 33, type: 'land', name: 'Thanh Hoá', price: 220, rent: 44 },
];

const V11_LUCKY_EVENTS = [
  { text: '🎉 Trúng xổ số! +200 coin', amount: 200, type: 'gain' },
  { text: '💸 Phạt vi phạm! -100 coin', amount: -100, type: 'lose' },
  { text: '🎁 Quà sinh nhật! +150 coin', amount: 150, type: 'gain' },
  { text: '🏠 Nhận thừa kế! +1 đất miễn phí', amount: 0, type: 'free_land' },
  { text: '⚡ Sét đánh! Mất 1 đất', amount: 0, type: 'lose_land' },
];

function generateV11RoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (v11rooms.has(code) || rooms.has(code));
  return code;
}

function v11send(ws, msg) {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg));
}

function handleV11Message(ws, msg) {
  switch (msg.type) {
    case 'v11_create': {
      const code = generateV11RoomCode();
      v11rooms.set(code, {
        host: { ws, name: msg.name },
        guest: null,
        settings: msg.settings || { subject: 'mix', difficulty: 'easy', maxRounds: 20 },
        state: 'waiting',
        game: null,
      });
      ws.v11room = code;
      ws.v11role = 'host';
      v11send(ws, { type: 'v11_created', code });
      break;
    }

    case 'v11_join': {
      const code = msg.code.toUpperCase();
      const room = v11rooms.get(code);
      if (!room) { v11send(ws, { type: 'error', message: 'Phòng không tồn tại!' }); return; }
      if (room.guest) { v11send(ws, { type: 'error', message: 'Phòng đã đầy!' }); return; }
      if (room.state !== 'waiting') { v11send(ws, { type: 'error', message: 'Trận đã bắt đầu!' }); return; }

      room.guest = { ws, name: msg.name };
      ws.v11room = code;
      ws.v11role = 'guest';

      v11send(ws, { type: 'v11_joined', code, hostName: room.host.name });
      v11send(room.host.ws, { type: 'v11_guest_joined', guestName: msg.name });
      break;
    }

    case 'v11_start': {
      const room = v11rooms.get(ws.v11room);
      if (!room || ws.v11role !== 'host' || !room.guest) return;
      v11StartGame(ws.v11room);
      break;
    }

    case 'v11_roll_dice': {
      const room = v11rooms.get(ws.v11room);
      if (!room || room.state !== 'playing') return;
      const game = room.game;
      const expectedIdx = game.currentPlayerIdx;
      const expectedRole = expectedIdx === 0 ? 'host' : 'guest';
      if (ws.v11role !== expectedRole) return;
      v11RollDice(ws.v11room);
      break;
    }

    case 'v11_answer': {
      const room = v11rooms.get(ws.v11room);
      if (!room || room.state !== 'playing') return;
      const game = room.game;
      if (!game.waitingForAnswer) return;
      const expectedRole = game.currentPlayerIdx === 0 ? 'host' : 'guest';
      if (ws.v11role !== expectedRole) return;
      v11HandleAnswer(ws.v11room, msg.answer);
      break;
    }

    case 'v11_buy': {
      const room = v11rooms.get(ws.v11room);
      if (!room || room.state !== 'playing') return;
      const game = room.game;
      if (!game.waitingForBuy) return;
      const expectedRole = game.currentPlayerIdx === 0 ? 'host' : 'guest';
      if (ws.v11role !== expectedRole) return;
      v11HandleBuy(ws.v11room, msg.buy);
      break;
    }

    case 'v11_event_ack': {
      const room = v11rooms.get(ws.v11room);
      if (!room || room.state !== 'playing') return;
      const game = room.game;
      if (game.waitingForEventAck) {
        game.waitingForEventAck = false;
        v11EndTurn(ws.v11room);
      }
      break;
    }

    case 'v11_leave': {
      handleV11Disconnect(ws);
      break;
    }
  }
}

async function v11StartGame(code) {
  const room = v11rooms.get(code);
  if (!room) return;

  // Fetch questions
  const { subject, difficulty, maxRounds } = room.settings;
  let questions = [];
  try {
    const db = getDb();
    if (subject === 'mix') {
      const math = await db.execute({ sql: `SELECT * FROM questions WHERE subject = 'math' AND difficulty = ? ORDER BY RANDOM() LIMIT 25`, args: [difficulty] });
      const viet = await db.execute({ sql: `SELECT * FROM questions WHERE subject = 'vietnamese' AND difficulty = ? ORDER BY RANDOM() LIMIT 25`, args: [difficulty] });
      questions = shuffle([...math.rows, ...viet.rows]);
    } else {
      const result = await db.execute({ sql: `SELECT * FROM questions WHERE subject = ? AND difficulty = ? ORDER BY RANDOM() LIMIT 50`, args: [subject, difficulty] });
      questions = result.rows;
    }
  } catch(e) {}

  if (questions.length < 10) {
    questions = generateFallback(50);
  }

  // Init game state
  room.state = 'playing';
  room.game = {
    players: [
      { name: room.host.name, money: 1500, position: 0, properties: [], bankrupt: false },
      { name: room.guest.name, money: 1500, position: 0, properties: [], bankrupt: false },
    ],
    board: V11_BOARD.map(c => ({ ...c, owner: null })),
    currentPlayerIdx: 0,
    round: 1,
    maxRounds: maxRounds || 20,
    questions,
    questionIdx: 0,
    waitingForAnswer: false,
    waitingForBuy: false,
    waitingForEventAck: false,
    currentQuestion: null,
    currentContext: null,
  };

  const startMsg = {
    type: 'v11_game_start',
    hostName: room.host.name,
    guestName: room.guest.name,
    maxRounds: room.game.maxRounds,
    settings: room.settings,
  };
  v11send(room.host.ws, startMsg);
  v11send(room.guest.ws, startMsg);

  // Start first turn after delay
  setTimeout(() => v11SendTurn(code), 1500);
}

function v11SendTurn(code) {
  const room = v11rooms.get(code);
  if (!room || room.state !== 'playing') return;
  const game = room.game;

  // Skip bankrupt
  if (game.players[game.currentPlayerIdx].bankrupt) {
    v11NextPlayer(code);
    return;
  }

  const turnMsg = { type: 'v11_turn', currentPlayerIdx: game.currentPlayerIdx, round: game.round };
  v11send(room.host.ws, turnMsg);
  v11send(room.guest.ws, turnMsg);
}

function v11RollDice(code) {
  const room = v11rooms.get(code);
  if (!room) return;
  const game = room.game;

  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  const steps = die1 + die2;

  const player = game.players[game.currentPlayerIdx];
  const oldPos = player.position;
  const newPos = (oldPos + steps) % V11_BOARD_SIZE;
  const passedStart = newPos < oldPos || (oldPos + steps >= V11_BOARD_SIZE);

  if (passedStart) player.money += 200;
  player.position = newPos;

  const diceMsg = {
    type: 'v11_dice_result',
    die1, die2,
    playerIdx: game.currentPlayerIdx,
    newPosition: newPos,
    passedStart,
    moneyAfterMove: player.money,
  };
  v11send(room.host.ws, diceMsg);
  v11send(room.guest.ws, diceMsg);

  // Handle landing after animation delay
  setTimeout(() => v11HandleLanding(code), 2000);
}

function v11HandleLanding(code) {
  const room = v11rooms.get(code);
  if (!room) return;
  const game = room.game;
  const player = game.players[game.currentPlayerIdx];
  const cell = game.board[player.position];

  switch (cell.type) {
    case 'start':
      v11BroadcastState(code, `${player.name} ở Xuất phát!`);
      v11EndTurn(code);
      break;
    case 'land':
      v11HandleLand(code, player, cell);
      break;
    case 'quiz':
      v11SendQuestion(code, 'quiz');
      break;
    case 'lucky':
      v11HandleLucky(code, player);
      break;
    case 'tax':
      v11HandleTax(code, player, cell);
      break;
    default:
      v11EndTurn(code);
  }
}

function v11HandleLand(code, player, cell) {
  const room = v11rooms.get(code);
  const game = room.game;

  if (cell.owner === null) {
    // Ask question to potentially buy for free
    v11SendQuestion(code, 'land');
  } else if (cell.owner === game.currentPlayerIdx) {
    v11BroadcastState(code, `Đất của ${player.name}. Nghỉ ngơi~`);
    v11EndTurn(code);
  } else {
    // Pay rent
    const owner = game.players[cell.owner];
    const propCount = owner.properties.length;
    const rent = propCount >= 3 ? cell.rent * 2 : cell.rent;
    player.money -= rent;
    owner.money += rent;

    v11BroadcastState(code, `${player.name} trả ${rent}🪙 thuê cho ${owner.name}`);

    if (player.money <= 0) {
      v11HandleBankrupt(code, game.currentPlayerIdx);
    } else {
      v11EndTurn(code);
    }
  }
}

function v11SendQuestion(code, context) {
  const room = v11rooms.get(code);
  const game = room.game;

  if (game.questionIdx >= game.questions.length) {
    game.questions = shuffle([...game.questions]);
    game.questionIdx = 0;
  }
  const q = game.questions[game.questionIdx++];
  game.currentQuestion = q;
  game.currentContext = context;
  game.waitingForAnswer = true;

  const cell = game.board[game.players[game.currentPlayerIdx].position];
  const questionMsg = {
    type: 'v11_question',
    question: { question_text: q.question_text, option_a: q.option_a, option_b: q.option_b, option_c: q.option_c, option_d: q.option_d },
    context,
    cellName: cell.name,
    cellPrice: cell.price,
    playerIdx: game.currentPlayerIdx,
  };
  v11send(room.host.ws, questionMsg);
  v11send(room.guest.ws, questionMsg);
}

function v11HandleAnswer(code, answer) {
  const room = v11rooms.get(code);
  const game = room.game;
  game.waitingForAnswer = false;

  const q = game.currentQuestion;
  const correct = q.correct_answer.toUpperCase() === answer.toUpperCase();
  const player = game.players[game.currentPlayerIdx];
  const cell = game.board[player.position];

  if (game.currentContext === 'quiz') {
    if (correct) player.money += 100;

    const resultMsg = {
      type: 'v11_answer_result',
      correct,
      correctAnswer: q.correct_answer.toUpperCase(),
      playerIdx: game.currentPlayerIdx,
      context: 'quiz',
      bought: false,
    };
    v11send(room.host.ws, resultMsg);
    v11send(room.guest.ws, resultMsg);

    setTimeout(() => {
      v11BroadcastState(code);
      v11EndTurn(code);
    }, 1500);
  } else if (game.currentContext === 'land') {
    if (correct) {
      // Buy for free
      cell.owner = game.currentPlayerIdx;
      player.properties.push(cell.id);

      const resultMsg = {
        type: 'v11_answer_result',
        correct: true,
        correctAnswer: q.correct_answer.toUpperCase(),
        playerIdx: game.currentPlayerIdx,
        context: 'land',
        bought: true,
        cellName: cell.name,
      };
      v11send(room.host.ws, resultMsg);
      v11send(room.guest.ws, resultMsg);

      setTimeout(() => {
        v11BroadcastState(code, `${player.name} mua ${cell.name} miễn phí!`);
        v11EndTurn(code);
      }, 1500);
    } else {
      // Wrong - offer to buy with money
      const canBuy = player.money >= cell.price;

      const resultMsg = {
        type: 'v11_answer_result',
        correct: false,
        correctAnswer: q.correct_answer.toUpperCase(),
        playerIdx: game.currentPlayerIdx,
        context: 'land',
        bought: false,
        cellName: cell.name,
        cellPrice: cell.price,
        canBuy,
      };
      v11send(room.host.ws, resultMsg);
      v11send(room.guest.ws, resultMsg);

      if (canBuy) {
        game.waitingForBuy = true;
      } else {
        setTimeout(() => {
          v11BroadcastState(code, `${player.name} bỏ qua ${cell.name}`);
          v11EndTurn(code);
        }, 1500);
      }
    }
  }
}

function v11HandleBuy(code, buy) {
  const room = v11rooms.get(code);
  const game = room.game;
  game.waitingForBuy = false;

  const player = game.players[game.currentPlayerIdx];
  const cell = game.board[player.position];

  if (buy && player.money >= cell.price) {
    player.money -= cell.price;
    cell.owner = game.currentPlayerIdx;
    player.properties.push(cell.id);
    v11BroadcastState(code, `${player.name} mua ${cell.name}!`);
  } else {
    v11BroadcastState(code, `${player.name} bỏ qua ${cell.name}`);
  }

  v11EndTurn(code);
}

function v11HandleLucky(code, player) {
  const room = v11rooms.get(code);
  const game = room.game;
  const event = V11_LUCKY_EVENTS[Math.floor(Math.random() * V11_LUCKY_EVENTS.length)];
  let message = event.text;

  if (event.type === 'gain') {
    player.money += event.amount;
  } else if (event.type === 'lose') {
    player.money += event.amount;
  } else if (event.type === 'free_land') {
    const unowned = game.board.filter(c => c.type === 'land' && c.owner === null);
    if (unowned.length > 0) {
      const land = unowned[Math.floor(Math.random() * unowned.length)];
      land.owner = game.currentPlayerIdx;
      player.properties.push(land.id);
      message += ` → ${land.name}`;
    } else {
      message = '🎁 Không còn đất trống! +100🪙';
      player.money += 100;
    }
  } else if (event.type === 'lose_land') {
    if (player.properties.length > 0) {
      const propId = player.properties[Math.floor(Math.random() * player.properties.length)];
      player.properties = player.properties.filter(id => id !== propId);
      const cell = game.board.find(c => c.id === propId);
      if (cell) { cell.owner = null; message += ` → Mất ${cell.name}`; }
    } else {
      message = '⚡ Không có đất để mất! An toàn~';
    }
  }

  game.waitingForEventAck = true;

  const stateMsg = v11BuildStateMsg(code, message);
  stateMsg.eventPopup = { title: '🎁 Hộp quà!', text: message, sfx: 'lucky' };
  stateMsg.eventPlayerIdx = game.currentPlayerIdx;
  v11send(room.host.ws, stateMsg);
  v11send(room.guest.ws, stateMsg);

  // Auto-ack after timeout (in case player doesn't click)
  setTimeout(() => {
    if (game.waitingForEventAck) {
      game.waitingForEventAck = false;
      if (player.money <= 0) {
        v11HandleBankrupt(code, game.currentPlayerIdx);
      } else {
        v11EndTurn(code);
      }
    }
  }, 5000);
}

function v11HandleTax(code, player, cell) {
  const room = v11rooms.get(code);
  const game = room.game;
  player.money -= cell.rent;

  v11BroadcastState(code, `${player.name} nộp thuế -${cell.rent}🪙`);

  if (player.money <= 0) {
    v11HandleBankrupt(code, game.currentPlayerIdx);
  } else {
    v11EndTurn(code);
  }
}

function v11HandleBankrupt(code, playerIdx) {
  const room = v11rooms.get(code);
  const game = room.game;
  const player = game.players[playerIdx];

  player.bankrupt = true;
  player.money = 0;
  player.properties.forEach(propId => {
    const cell = game.board.find(c => c.id === propId);
    if (cell) cell.owner = null;
  });
  player.properties = [];

  v11BroadcastState(code, `💀 ${player.name} phá sản!`);

  const activePlayers = game.players.filter(p => !p.bankrupt);
  if (activePlayers.length <= 1) {
    setTimeout(() => v11EndGame(code), 1000);
  } else {
    v11EndTurn(code);
  }
}

function v11EndTurn(code) {
  const room = v11rooms.get(code);
  if (!room || room.state !== 'playing') return;
  const game = room.game;

  const activePlayers = game.players.filter(p => !p.bankrupt);
  if (activePlayers.length <= 1) {
    setTimeout(() => v11EndGame(code), 800);
    return;
  }

  setTimeout(() => v11NextPlayer(code), 1200);
}

function v11NextPlayer(code) {
  const room = v11rooms.get(code);
  if (!room || room.state !== 'playing') return;
  const game = room.game;

  let nextIdx = (game.currentPlayerIdx + 1) % game.players.length;

  if (nextIdx === 0) {
    game.round++;
    if (game.round > game.maxRounds) {
      v11EndGame(code);
      return;
    }
  }

  // Skip bankrupt
  let tries = 0;
  while (game.players[nextIdx].bankrupt && tries < game.players.length) {
    nextIdx = (nextIdx + 1) % game.players.length;
    if (nextIdx === 0) {
      game.round++;
      if (game.round > game.maxRounds) { v11EndGame(code); return; }
    }
    tries++;
  }

  game.currentPlayerIdx = nextIdx;
  v11BroadcastState(code);
  v11SendTurn(code);
}

function v11EndGame(code) {
  const room = v11rooms.get(code);
  if (!room) return;
  room.state = 'finished';
  const game = room.game;

  const ranked = [...game.players].sort((a, b) => {
    if (a.bankrupt && !b.bankrupt) return 1;
    if (!a.bankrupt && b.bankrupt) return -1;
    return b.money - a.money;
  });

  const endMsg = { type: 'v11_game_over', rankings: ranked };
  v11send(room.host.ws, endMsg);
  v11send(room.guest.ws, endMsg);
}

function v11BroadcastState(code, actionText) {
  const room = v11rooms.get(code);
  if (!room) return;
  const msg = v11BuildStateMsg(code, actionText);
  v11send(room.host.ws, msg);
  v11send(room.guest.ws, msg);
}

function v11BuildStateMsg(code, actionText) {
  const room = v11rooms.get(code);
  const game = room.game;
  return {
    type: 'v11_state_update',
    players: game.players.map(p => ({ money: p.money, position: p.position, properties: p.properties, bankrupt: p.bankrupt })),
    board: game.board.map(c => ({ owner: c.owner })),
    round: game.round,
    actionText: actionText || '',
  };
}

function handleV11Disconnect(ws) {
  const code = ws.v11room;
  if (!code) return;
  const room = v11rooms.get(code);
  if (!room) return;

  const opponent = ws.v11role === 'host' ? room.guest : room.host;
  if (opponent && opponent.ws && opponent.ws.readyState === 1) {
    v11send(opponent.ws, { type: 'v11_opponent_left' });
  }

  v11rooms.delete(code);
  ws.v11room = null;
}
