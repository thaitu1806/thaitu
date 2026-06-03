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

// Auto-fill name from profile
(function() {
  const profile = localStorage.getItem('hocvui_profile');
  if (profile) {
    const p = JSON.parse(profile);
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
    subject: document.getElementById('rs-subject')?.value || 'mix',
    difficulty: document.getElementById('rs-difficulty')?.value || 'medium',
    rounds: parseInt(document.getElementById('rs-rounds')?.value || '10'),
    speed: document.getElementById('rs-speed')?.value || 'normal',
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
  try {
    const { subject, difficulty, rounds } = settings;
    if (subject === 'mix') {
      const half = Math.ceil(rounds / 2);
      const [mRes, vRes] = await Promise.all([
        fetch(`/api/questions?subject=math&difficulty=${difficulty}&limit=${half}`).then(r => r.json()),
        fetch(`/api/questions?subject=vietnamese&difficulty=${difficulty}&limit=${rounds - half}`).then(r => r.json()),
      ]);
      questions = [...mRes, ...vRes].sort(() => Math.random() - 0.5);
    } else {
      const res = await fetch(`/api/questions?subject=${subject}&difficulty=${difficulty}&limit=${rounds}`);
      questions = await res.json();
    }
  } catch (e) {
    questions = generateFallback(settings.rounds || 10);
  }

  if (questions.length === 0) questions = generateFallback(10);

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
    currentRound: 0,
    roundStart: Date.now(),
    hostAnswer: null,
    guestAnswer: null,
    roundResult: null,
    hostScore: 0,
    guestScore: 0,
    hostCorrect: 0,
    guestCorrect: 0,
  });
});

// === LISTEN FOR REALTIME UPDATES ===
function listenRoom() {
  roomRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (!data) return;
    handleUpdate(data);

    // Host: auto-resolve when both answers are in
    if (myRole === 'host' && data.state === 'playing' && !data.roundResult) {
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

  // Match playing
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
