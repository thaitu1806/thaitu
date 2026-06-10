// === V4 - ONLINE DUEL (Firebase Realtime Database) ===

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAtaJOMc6E1Oq3QVXLX0b7ZXZwBSEnu_w8",
  authDomain: "hocvui-online.firebaseapp.com",
  databaseURL: "https://hocvui-online-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "hocvui-online",
  storageBucket: "hocvui-online.firebasestorage.app",
  messagingSenderId: "934232141607",
  appId: "1:934232141607:web:0d112c31184595936fc302",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Auto-fill name from profile + verify with server
(async function() {
  const profile = localStorage.getItem('hocvui_profile');
  if (!profile) {
    window.location.href = '/';
    return;
  }
  const p = JSON.parse(profile);
  try {
    const res = await fetch(`/api/players?id=${p.id}`);
    const data = await res.json();
    if (!data || data.error || !data.id) {
      localStorage.removeItem('hocvui_profile');
      window.location.href = '/';
      return;
    }
    localStorage.setItem('hocvui_profile', JSON.stringify({ id: data.id, name: data.name }));
    document.getElementById('my-name').value = data.name;
    document.getElementById('my-name').style.display = 'none';
    document.getElementById('my-name-label').style.display = 'block';
    document.getElementById('my-name-label').textContent = `Chào ${data.name}! ⚡`;
  } catch {
    // Network error - trust local
    document.getElementById('my-name').value = p.name;
    document.getElementById('my-name').style.display = 'none';
    document.getElementById('my-name-label').style.display = 'block';
    document.getElementById('my-name-label').textContent = `Chào ${p.name}! ⚡`;
  }
})();

// State
let myRole = null; // 'host' or 'guest'
let myName = '';
let roomCode = '';
let roomRef = null;
let timerInterval = null;
let currentRound = -1;
let resultShown = false;
let answeredThisRound = false;

// === UI HELPERS ===
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function getSettings() {
  return {
    mode: document.getElementById('rs-mode')?.value || 'duel',
    subject: document.getElementById('rs-subject')?.value || 'mix',
    difficulty: document.getElementById('rs-difficulty')?.value || 'medium',
    rounds: parseInt(document.getElementById('rs-rounds')?.value || '10'),
    speed: document.getElementById('rs-speed')?.value || 'normal',
    trackLength: parseInt(document.getElementById('rs-track')?.value || '12'),
  };
}

// === CREATE ROOM ===
document.getElementById('btn-create').addEventListener('click', async () => {
  myName = document.getElementById('my-name').value.trim();
  if (!myName) {
    const profile = localStorage.getItem('hocvui_profile');
    if (profile) myName = JSON.parse(profile).name;
  }
  if (!myName) myName = 'Player';
  myRole = 'host';
  showScreen('create-screen');
  document.getElementById('rp-host').querySelector('.rp-name').textContent = myName;

  roomCode = generateCode();
  document.getElementById('room-code').textContent = roomCode;

  // Create room in Firebase
  roomRef = db.ref('rooms/' + roomCode);
  await roomRef.set({
    host: myName,
    guest: null,
    settings: getSettings(),
    state: 'waiting',
    currentRound: -1,
    hostScore: 0,
    guestScore: 0,
    hostCorrect: 0,
    guestCorrect: 0,
    createdAt: Date.now(),
  });

  // Listen for changes
  listenRoom();
});

// === JOIN ROOM ===
document.getElementById('btn-join').addEventListener('click', () => {
  myName = document.getElementById('my-name').value.trim();
  if (!myName) {
    const profile = localStorage.getItem('hocvui_profile');
    if (profile) myName = JSON.parse(profile).name;
  }
  if (!myName) myName = 'Player';
  showScreen('join-screen');
});

document.getElementById('btn-join-go').addEventListener('click', async () => {
  const code = document.getElementById('join-code').value.trim().toUpperCase();
  if (code.length !== 4) {
    document.getElementById('join-status').textContent = 'Mã phòng phải 4 ký tự!';
    return;
  }

  roomCode = code;
  roomRef = db.ref('rooms/' + roomCode);

  // Check if room exists
  const snapshot = await roomRef.once('value');
  const room = snapshot.val();
  if (!room) {
    document.getElementById('join-status').textContent = 'Phòng không tồn tại!';
    return;
  }
  if (room.guest) {
    document.getElementById('join-status').textContent = 'Phòng đã đầy!';
    return;
  }

  myRole = 'guest';
  await roomRef.update({ guest: myName });

  showScreen('wait-screen');
  document.getElementById('wait-msg').textContent = `Đã vào phòng ${code}! Chờ ${room.host} bắt đầu...`;

  listenRoom();
});

// === START MATCH ===
document.getElementById('btn-start-match').addEventListener('click', async () => {
  const settings = getSettings();

  // Fetch questions from API
  let questions = [];
  const questionLimit = settings.mode === 'race' ? Math.max(30, settings.trackLength * 3) : settings.rounds;
  try {
    const { subject, difficulty } = settings;
    if (subject === 'mix') {
      const half = Math.ceil(questionLimit / 2);
      const [mRes, vRes] = await Promise.all([
        fetch(`/api/questions?subject=math&difficulty=${difficulty}&limit=${half}`).then(r => r.json()),
        fetch(`/api/questions?subject=vietnamese&difficulty=${difficulty}&limit=${questionLimit - half}`).then(r => r.json()),
      ]);
      questions = [...mRes, ...vRes].sort(() => Math.random() - 0.5);
    } else {
      const res = await fetch(`/api/questions?subject=${subject}&difficulty=${difficulty}&limit=${questionLimit}`);
      questions = await res.json();
    }
  } catch (e) {
    questions = generateFallback(questionLimit);
  }

  if (questions.length === 0) questions = generateFallback(questionLimit);

  // Strip correct answers from being easily visible, but keep for scoring
  const questionsData = questions.map(q => ({
    question_text: q.question_text,
    option_a: q.option_a,
    option_b: q.option_b,
    option_c: q.option_c,
    option_d: q.option_d,
    correct_answer: q.correct_answer,
    subject: q.subject || 'math',
  }));

  await roomRef.update({
    settings,
    questions: questionsData,
    state: 'playing',
    currentRound: settings.mode === 'race' ? -1 : 0,
    roundStart: Date.now(),
    hostAnswer: null,
    guestAnswer: null,
    roundResult: null,
    hostScore: 0,
    guestScore: 0,
    hostCorrect: 0,
    guestCorrect: 0,
    hostPosition: 0,
    guestPosition: 0,
  });

  // If race mode, mark started for host (will be handled by handleUpdate listener)
  if (settings.mode === 'race') {
    raceState.started = true;
    const snapshot = await roomRef.once('value');
    startRaceMode(snapshot.val());
  }
});

// === LISTEN FOR REALTIME UPDATES ===
function listenRoom() {
  roomRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (!data) return;
    handleUpdate(data);

    // Host: auto-resolve when both answers are in (duel mode only)
    if (myRole === 'host' && data.state === 'playing' && !data.roundResult && data.settings?.mode !== 'race') {
      if (data.hostAnswer && data.guestAnswer) {
        resolveRound(data);
      }
    }
  });

  // Cleanup room when disconnected (host only)
  if (myRole === 'host') {
    roomRef.onDisconnect().remove();
  }
}

function handleUpdate(data) {
  // Guest joined (host view)
  if (myRole === 'host' && data.guest && data.state === 'waiting') {
    document.getElementById('rp-guest').querySelector('.rp-name').textContent = data.guest;
    document.getElementById('rp-guest').classList.remove('rp-waiting');
    document.getElementById('rp-guest').classList.add('rp-ready');
    document.getElementById('btn-start-match').classList.remove('hidden');
  }

  // Race mode updates
  if (data.settings?.mode === 'race' && data.state === 'playing') {
    // Start race mode when first detecting playing state
    if (!raceState.started) {
      raceState.started = true;
      startRaceMode(data);
    }
    handleRaceUpdate(data);
    return;
  }
  if (data.settings?.mode === 'race' && data.state === 'finished' && data.matchResult) {
    handleRaceUpdate(data);
    return;
  }

  // Match playing (duel mode)
  if (data.state === 'playing' && data.questions && data.currentRound >= 0) {
    const q = data.questions[data.currentRound];
    if (!q) return;

    // New round detected
    if (data.currentRound !== currentRound) {
      currentRound = data.currentRound;
      resultShown = false;
      answeredThisRound = false;
      showBattle(data);
      showRound(data, q);
    }

    // Opponent answered
    if (!resultShown && !data.roundResult) {
      if (myRole === 'host' && data.guestAnswer) {
        document.getElementById('ob-status').textContent = '⚡ Đối thủ đã trả lời!';
      }
      if (myRole === 'guest' && data.hostAnswer) {
        document.getElementById('ob-status').textContent = '⚡ Đối thủ đã trả lời!';
      }
    }

    // Round result
    if (data.roundResult && !resultShown) {
      resultShown = true;
      showRoundResult(data);
    }
  }

  // Match finished
  if (data.state === 'finished' && data.matchResult) {
    showMatchEnd(data);
  }
}

// === BATTLE UI ===
function showBattle(data) {
  document.getElementById('ob-p1-name').textContent = data.host;
  document.getElementById('ob-p2-name').textContent = data.guest;
  showScreen('battle-screen');
}

function showRound(data, q) {
  document.getElementById('ob-round').textContent = `${data.currentRound + 1}/${data.questions.length}`;
  document.getElementById('ob-badge').textContent = q.subject === 'math' ? '🔢 Toán' : '📖 TV';
  document.getElementById('ob-text').textContent = q.question_text;
  document.getElementById('ob-status').textContent = '';
  document.getElementById('ob-p1-score').textContent = data.hostScore || 0;
  document.getElementById('ob-p2-score').textContent = data.guestScore || 0;

  const btns = document.querySelectorAll('.ob-btn');
  const opts = [q.option_a, q.option_b, q.option_c, q.option_d];
  btns.forEach((btn, i) => {
    btn.textContent = `${'ABCD'[i]}. ${opts[i]}`;
    btn.className = 'ob-btn';
    btn.disabled = false;
    btn.blur();
  });

  startClientTimer(data.settings?.speed || 'normal');
}

function startClientTimer(speed) {
  let timeLeft = 100;
  const fill = document.getElementById('ob-timer-fill');
  fill.style.width = '100%';
  fill.className = 'ob-timer-fill';
  clearInterval(timerInterval);

  const ms = speed === 'slow' ? 300 : speed === 'fast' ? 120 : 200;
  timerInterval = setInterval(() => {
    timeLeft -= 1;
    fill.style.width = timeLeft + '%';
    if (timeLeft <= 20) fill.className = 'ob-timer-fill danger';
    else if (timeLeft <= 50) fill.className = 'ob-timer-fill warn';
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      if (!answeredThisRound) {
        answeredThisRound = true;
        document.querySelectorAll('.ob-btn').forEach(b => b.disabled = true);
        // Send timeout answer
        const key = myRole === 'host' ? 'hostAnswer' : 'guestAnswer';
        roomRef.update({ [key]: { answer: null, time: 99999 } });
      }
    }
  }, ms);
}

// === ANSWER ===
document.getElementById('ob-options').addEventListener('click', (e) => {
  const btn = e.target.closest('.ob-btn');
  if (!btn || btn.disabled || answeredThisRound) return;

  answeredThisRound = true;
  document.querySelectorAll('.ob-btn').forEach(b => b.disabled = true);
  btn.classList.add('selected');
  document.getElementById('ob-status').textContent = '✅ Đã trả lời! Chờ đối thủ...';

  const key = myRole === 'host' ? 'hostAnswer' : 'guestAnswer';
  roomRef.update({ [key]: { answer: btn.dataset.opt, time: Date.now() } });
});

// Host resolves the round when both answers are detected
async function resolveRound(data) {
  // Double-check to avoid duplicate resolves
  const snapshot = await roomRef.once('value');
  const latest = snapshot.val();
  if (!latest || latest.roundResult || !latest.hostAnswer || !latest.guestAnswer) return;

  const q = latest.questions[latest.currentRound];
  const correct = q.correct_answer;
  const hOk = latest.hostAnswer.answer === correct;
  const gOk = latest.guestAnswer.answer === correct;

  let hp = 0, gp = 0;
  if (hOk) { hp = 10; if (!gOk || latest.hostAnswer.time < latest.guestAnswer.time) hp += 5; }
  if (gOk) { gp = 10; if (!hOk || latest.guestAnswer.time < latest.hostAnswer.time) gp += 5; }

  const hostScore = (latest.hostScore || 0) + hp;
  const guestScore = (latest.guestScore || 0) + gp;
  const hostCorrect = (latest.hostCorrect || 0) + (hOk ? 1 : 0);
  const guestCorrect = (latest.guestCorrect || 0) + (gOk ? 1 : 0);

  await roomRef.update({
    roundResult: { correct_answer: correct, hostCorrect: hOk, guestCorrect: gOk },
    hostScore,
    guestScore,
    hostCorrect,
    guestCorrect,
  });

  // Advance to next round after 3s
  setTimeout(() => advanceRound(latest), 3000);
}

async function advanceRound(data) {
  const nextRound = (data.currentRound || 0) + 1;
  const totalRounds = data.questions.length;

  if (nextRound >= totalRounds) {
    // Match finished
    const snapshot = await roomRef.once('value');
    const final = snapshot.val();
    const hs = final.hostScore || 0;
    const gs = final.guestScore || 0;
    await roomRef.update({
      state: 'finished',
      matchResult: {
        winner: hs > gs ? 'host' : gs > hs ? 'guest' : 'tie',
        hostScore: hs, guestScore: gs,
        hostCorrect: final.hostCorrect || 0, guestCorrect: final.guestCorrect || 0,
      },
    });
  } else {
    await roomRef.update({
      currentRound: nextRound,
      hostAnswer: null,
      guestAnswer: null,
      roundResult: null,
      roundStart: Date.now(),
    });
  }
}

// === ROUND RESULT ===
function showRoundResult(data) {
  clearInterval(timerInterval);
  const r = data.roundResult;

  document.querySelectorAll('.ob-btn').forEach(btn => {
    btn.disabled = true;
    if (btn.dataset.opt === r.correct_answer) btn.classList.add('correct');
  });

  document.getElementById('ob-p1-score').textContent = data.hostScore || 0;
  document.getElementById('ob-p2-score').textContent = data.guestScore || 0;

  const myCorrect = myRole === 'host' ? r.hostCorrect : r.guestCorrect;
  document.getElementById('ob-status').textContent = myCorrect ? '✅ Đúng rồi!' : '❌ Sai rồi!';
  playSound(myCorrect ? 'correct' : 'wrong');
}

// === MATCH END ===
function showMatchEnd(data) {
  clearInterval(timerInterval);
  if (roomRef) roomRef.off(); // Stop listening

  const m = data.matchResult;
  const iWon = (myRole === 'host' && m.winner === 'host') || (myRole === 'guest' && m.winner === 'guest');
  const tie = m.winner === 'tie';

  document.getElementById('res-icon').textContent = tie ? '🤝' : iWon ? '🏆🎉' : '😢';
  document.getElementById('res-title').textContent = tie ? 'Hòa!' : iWon ? 'Bạn thắng!' : 'Bạn thua!';
  document.getElementById('res-p1-name').textContent = data.host;
  document.getElementById('res-p2-name').textContent = data.guest;
  document.getElementById('res-p1-score').textContent = m.hostScore;
  document.getElementById('res-p2-score').textContent = m.guestScore;
  document.getElementById('res-detail').textContent = `Đúng: ${m.hostCorrect} vs ${m.guestCorrect}`;

  playSound(iWon || tie ? 'win' : 'lose');
  showScreen('result-screen');
}

// === REMATCH & NAVIGATION ===
document.getElementById('btn-rematch').addEventListener('click', () => {
  currentRound = -1;
  resultShown = false;
  answeredThisRound = false;
  raceState.started = false;
  raceState.finished = false;
  raceState.myPosition = 0;
  raceState.opponentPosition = 0;
  raceState.myIndex = 0;
  if (myRole === 'host') {
    showScreen('create-screen');
    listenRoom();
  } else {
    showScreen('wait-screen');
    document.getElementById('wait-msg').textContent = 'Chờ host bắt đầu lại...';
    listenRoom();
  }
});

document.getElementById('btn-home').addEventListener('click', () => {
  if (roomRef) { roomRef.off(); }
  showScreen('home-screen');
});

document.getElementById('btn-back-create').addEventListener('click', () => {
  if (roomRef) { roomRef.remove(); roomRef.off(); }
  showScreen('home-screen');
});

document.getElementById('btn-back-join').addEventListener('click', () => showScreen('home-screen'));

document.getElementById('join-code').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') document.getElementById('btn-join-go').click();
});
document.getElementById('my-name').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') document.getElementById('btn-create').click();
});

// === FALLBACK QUESTIONS ===
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
      option_a: String(opts[0]), option_b: String(opts[1]),
      option_c: String(opts[2]), option_d: String(opts[3]),
      correct_answer: ['a', 'b', 'c', 'd'][correctIdx],
      subject: 'math',
    });
  }
  return questions;
}

// === AUDIO ===
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;
function playSound(type) {
  try {
    if (!audioCtx) audioCtx = new AudioCtx();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    switch (type) {
      case 'correct':
        osc.frequency.setValueAtTime(523, audioCtx.currentTime);
        osc.frequency.setValueAtTime(784, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start(); osc.stop(audioCtx.currentTime + 0.3); break;
      case 'wrong':
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.type = 'sawtooth';
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start(); osc.stop(audioCtx.currentTime + 0.2); break;
      case 'win':
        [523, 659, 784, 1047].forEach((f, i) => {
          const o = audioCtx.createOscillator(), g = audioCtx.createGain();
          o.connect(g); g.connect(audioCtx.destination);
          o.frequency.setValueAtTime(f, audioCtx.currentTime + i * 0.12);
          g.gain.setValueAtTime(0.2, audioCtx.currentTime + i * 0.12);
          g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.12 + 0.25);
          o.start(audioCtx.currentTime + i * 0.12); o.stop(audioCtx.currentTime + i * 0.12 + 0.25);
        }); break;
      case 'lose':
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.setValueAtTime(150, audioCtx.currentTime + 0.3);
        osc.type = 'sawtooth';
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.start(); osc.stop(audioCtx.currentTime + 0.5); break;
    }
  } catch {}
}

// === MODE TOGGLE ===
document.getElementById('rs-mode')?.addEventListener('change', (e) => {
  const isRace = e.target.value === 'race';
  document.getElementById('rs-speed-row').style.display = isRace ? 'none' : '';
  document.getElementById('rs-track-row').style.display = isRace ? '' : 'none';
});

// === RACE MODE ===
let raceState = {
  questions: [],
  myQuestionOrder: [],
  myIndex: 0,
  trackLength: 12,
  myPosition: 0,
  opponentPosition: 0,
  timerInterval: null,
  answered: false,
  finished: false,
  started: false,
};

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function startRaceMode(data) {
  raceState.questions = data.questions;
  raceState.trackLength = data.settings.trackLength || 12;
  raceState.myPosition = 0;
  raceState.opponentPosition = 0;
  raceState.myIndex = 0;
  raceState.finished = false;

  // Each player gets the same questions but shuffled differently
  // Use a deterministic seed based on role so both see different orders
  raceState.myQuestionOrder = shuffleArray(data.questions);

  // Update track UI
  document.getElementById('race-p1-name').textContent = `🌻 ${data.host}`;
  document.getElementById('race-p2-name').textContent = `🧟 ${data.guest}`;
  document.getElementById('race-track-len').textContent = raceState.trackLength;
  document.getElementById('race-track-len2').textContent = raceState.trackLength;
  document.getElementById('race-pos-host').textContent = '0';
  document.getElementById('race-pos-guest').textContent = '0';
  updateRaceCars();

  showScreen('race-screen');
  showNextRaceQuestion();
}

function updateRaceCars() {
  const hostPos = myRole === 'host' ? raceState.myPosition : raceState.opponentPosition;
  const guestPos = myRole === 'guest' ? raceState.myPosition : raceState.opponentPosition;
  const pct = (pos) => Math.min((pos / raceState.trackLength) * 85, 85);

  document.getElementById('race-car-host').style.left = pct(hostPos) + '%';
  document.getElementById('race-car-guest').style.left = pct(guestPos) + '%';
  document.getElementById('race-pos-host').textContent = hostPos;
  document.getElementById('race-pos-guest').textContent = guestPos;
}

function showNextRaceQuestion() {
  if (raceState.finished) return;

  // Get next question from my shuffled list (wrap around if needed)
  if (raceState.myIndex >= raceState.myQuestionOrder.length) {
    raceState.myQuestionOrder = shuffleArray(raceState.questions);
    raceState.myIndex = 0;
  }

  const q = raceState.myQuestionOrder[raceState.myIndex];
  raceState.answered = false;

  document.getElementById('race-q-text').textContent = q.question_text;
  const btns = document.querySelectorAll('.race-btn');
  const opts = [q.option_a, q.option_b, q.option_c, q.option_d];
  btns.forEach((btn, i) => {
    btn.textContent = `${'ABCD'[i]}. ${opts[i]}`;
    btn.className = 'race-btn';
    btn.disabled = false;
  });
  document.getElementById('race-feedback').textContent = '';

  // Start 15s timer
  startRaceTimer();
}

function startRaceTimer() {
  clearInterval(raceState.timerInterval);
  const fill = document.getElementById('race-timer-fill');
  fill.style.width = '100%';
  fill.className = 'race-timer-fill';

  let timeLeft = 100;
  raceState.timerInterval = setInterval(() => {
    timeLeft -= 0.67; // ~15 seconds (100 / 0.67 / 10 ≈ 15s at 100ms interval)
    fill.style.width = Math.max(0, timeLeft) + '%';
    if (timeLeft <= 20) fill.className = 'race-timer-fill danger';
    else if (timeLeft <= 50) fill.className = 'race-timer-fill warn';

    if (timeLeft <= 0) {
      clearInterval(raceState.timerInterval);
      if (!raceState.answered) {
        raceState.answered = true;
        document.querySelectorAll('.race-btn').forEach(b => b.disabled = true);
        document.getElementById('race-feedback').textContent = '⏰ Hết giờ!';
        const q = raceState.myQuestionOrder[raceState.myIndex];
        // Highlight correct
        const correctBtn = document.querySelector(`.race-btn[data-opt="${q.correct_answer}"]`);
        if (correctBtn) correctBtn.classList.add('correct');
        // Move to next question after delay
        raceState.myIndex++;
        setTimeout(() => showNextRaceQuestion(), 1200);
      }
    }
  }, 100);
}

// Handle race answer clicks
document.getElementById('race-options')?.addEventListener('click', (e) => {
  const btn = e.target.closest('.race-btn');
  if (!btn || btn.disabled || raceState.answered || raceState.finished) return;

  raceState.answered = true;
  clearInterval(raceState.timerInterval);
  document.querySelectorAll('.race-btn').forEach(b => b.disabled = true);

  const q = raceState.myQuestionOrder[raceState.myIndex];
  const isCorrect = btn.dataset.opt === q.correct_answer;

  btn.classList.add(isCorrect ? 'correct' : 'wrong');
  if (!isCorrect) {
    const correctBtn = document.querySelector(`.race-btn[data-opt="${q.correct_answer}"]`);
    if (correctBtn) correctBtn.classList.add('correct');
  }

  if (isCorrect) {
    raceState.myPosition++;
    document.getElementById('race-feedback').textContent = '✅ Đúng! Tiến lên!';
    playSound('correct');

    // Update Firebase with my new position
    const posKey = myRole === 'host' ? 'hostPosition' : 'guestPosition';
    roomRef.update({ [posKey]: raceState.myPosition });

    updateRaceCars();

    // Check if I won
    if (raceState.myPosition >= raceState.trackLength) {
      raceState.finished = true;
      document.getElementById('race-feedback').textContent = '🏆 Bạn về đích!';
      if (myRole === 'host') {
        roomRef.update({
          state: 'finished',
          matchResult: {
            winner: 'host',
            hostScore: raceState.myPosition,
            guestScore: raceState.opponentPosition,
            hostCorrect: raceState.myPosition,
            guestCorrect: raceState.opponentPosition,
          },
        });
      }
      return;
    }
  } else {
    document.getElementById('race-feedback').textContent = '❌ Sai rồi!';
    playSound('wrong');
  }

  raceState.myIndex++;
  // Load next question after short delay
  setTimeout(() => showNextRaceQuestion(), 800);
});

// Listen for opponent position updates in race mode
function handleRaceUpdate(data) {
  if (!data || data.settings?.mode !== 'race') return;

  const opponentPosKey = myRole === 'host' ? 'guestPosition' : 'hostPosition';
  const newOpPos = data[opponentPosKey] || 0;

  if (newOpPos !== raceState.opponentPosition) {
    raceState.opponentPosition = newOpPos;
    updateRaceCars();
  }

  // Check if opponent won
  if (newOpPos >= raceState.trackLength && !raceState.finished) {
    raceState.finished = true;
    clearInterval(raceState.timerInterval);
    document.querySelectorAll('.race-btn').forEach(b => b.disabled = true);
    document.getElementById('race-feedback').textContent = '😢 Đối thủ về đích trước!';

    if (myRole === 'guest') {
      roomRef.update({
        state: 'finished',
        matchResult: {
          winner: 'guest',
          hostScore: raceState.opponentPosition,
          guestScore: raceState.myPosition,
          hostCorrect: raceState.opponentPosition,
          guestCorrect: raceState.myPosition,
        },
      });
    }
  }

  // Match finished (via either player)
  if (data.state === 'finished' && data.matchResult) {
    raceState.finished = true;
    clearInterval(raceState.timerInterval);
    setTimeout(() => showMatchEnd(data), 1500);
  }
}
