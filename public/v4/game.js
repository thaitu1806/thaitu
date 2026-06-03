// === V4 - ONLINE DUEL (Polling-based for Vercel) ===
let myRole = null;
let myName = '';
let roomCode = '';
let pollInterval = null;
let lastUpdate = 0;
let roundActive = false;
let timerInterval = null;
let currentRound = -1;

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

async function apiCall(action, body = {}) {
  const res = await fetch('/api/room', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, code: roomCode, ...body }),
  });
  return res.json();
}

// === HOME ===
document.getElementById('btn-create').addEventListener('click', async () => {
  myName = document.getElementById('my-name').value.trim() || 'Player';
  myRole = 'host';
  // Show create screen first so settings elements are available
  showScreen('create-screen');
  document.getElementById('rp-host').querySelector('.rp-name').textContent = myName;
  const settings = getSettings();
  const data = await apiCall('create', { player: myName, settings });
  roomCode = data.code;
  document.getElementById('room-code').textContent = roomCode;
  startPolling();
});

document.getElementById('btn-join').addEventListener('click', () => {
  myName = document.getElementById('my-name').value.trim() || 'Player';
  showScreen('join-screen');
});

document.getElementById('btn-join-go').addEventListener('click', async () => {
  const code = document.getElementById('join-code').value.trim().toUpperCase();
  if (code.length !== 4) { document.getElementById('join-status').textContent = 'Mã phòng phải 4 ký tự!'; return; }
  roomCode = code;
  myRole = 'guest';
  const data = await apiCall('join', { player: myName });
  if (data.error) { document.getElementById('join-status').textContent = data.error; return; }
  showScreen('wait-screen');
  document.getElementById('wait-msg').textContent = `Đã vào phòng ${code}! Chờ ${data.host} bắt đầu...`;
  startPolling();
});

document.getElementById('join-code').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') document.getElementById('btn-join-go').click();
});
document.getElementById('my-name').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') document.getElementById('btn-create').click();
});

document.getElementById('btn-back-create').addEventListener('click', () => { stopPolling(); showScreen('home-screen'); });
document.getElementById('btn-back-join').addEventListener('click', () => showScreen('home-screen'));
document.getElementById('btn-home').addEventListener('click', () => { stopPolling(); showScreen('home-screen'); });
document.getElementById('btn-rematch').addEventListener('click', async () => {
  await apiCall('start');
  currentRound = -1;
});

document.getElementById('btn-start-match').addEventListener('click', async () => {
  // Send latest settings when starting the match
  const settings = getSettings();
  await apiCall('start', { settings });
});

function getSettings() {
  return {
    subject: document.getElementById('rs-subject')?.value || 'mix',
    difficulty: document.getElementById('rs-difficulty')?.value || 'medium',
    rounds: parseInt(document.getElementById('rs-rounds')?.value || '10'),
    speed: document.getElementById('rs-speed')?.value || 'normal',
  };
}

// === POLLING ===
function startPolling() {
  stopPolling();
  pollInterval = setInterval(pollRoom, 1000);
}

function stopPolling() {
  clearInterval(pollInterval);
  pollInterval = null;
}

async function pollRoom() {
  try {
    const res = await fetch(`/api/room?action=poll&code=${roomCode}`);
    const data = await res.json();
    if (data.error) { stopPolling(); return; }
    handlePollData(data);
  } catch {}
}

function handlePollData(data) {
  // Guest joined (host view)
  if (myRole === 'host' && data.guest && data.state === 'waiting') {
    document.getElementById('rp-guest').querySelector('.rp-name').textContent = data.guest;
    document.getElementById('rp-guest').classList.remove('rp-waiting');
    document.getElementById('rp-guest').classList.add('rp-ready');
    document.getElementById('btn-start-match').classList.remove('hidden');
  }

  // Match started
  if (data.state === 'playing' && data.question) {
    if (data.currentRound !== currentRound) {
      currentRound = data.currentRound;
      roundActive = true;
      showBattle(data);
      showRound(data);
    }
    // Opponent answered
    if (myRole === 'host' && data.guestAnswered && roundActive) {
      document.getElementById('ob-status').textContent = '⚡ Đối thủ đã trả lời!';
    }
    if (myRole === 'guest' && data.hostAnswered && roundActive) {
      document.getElementById('ob-status').textContent = '⚡ Đối thủ đã trả lời!';
    }
    // Round result
    if (data.roundResult && roundActive) {
      roundActive = false;
      showRoundResult(data);
    }
  }

  // Match finished
  if (data.state === 'finished' && data.matchResult) {
    stopPolling();
    showMatchEnd(data);
  }
}

// === BATTLE UI ===
function showBattle(data) {
  document.getElementById('ob-p1-name').textContent = data.host;
  document.getElementById('ob-p2-name').textContent = data.guest;
  showScreen('battle-screen');
}

function showRound(data) {
  const q = data.question;
  document.getElementById('ob-round').textContent = `${data.currentRound + 1}/${data.totalRounds}`;
  document.getElementById('ob-badge').textContent = q.subject === 'math' ? '🔢 Toán' : '📖 TV';
  document.getElementById('ob-text').textContent = q.question_text;
  document.getElementById('ob-status').textContent = '';
  document.getElementById('ob-p1-score').textContent = data.hostScore;
  document.getElementById('ob-p2-score').textContent = data.guestScore;

  const btns = document.querySelectorAll('.ob-btn');
  const opts = [q.option_a, q.option_b, q.option_c, q.option_d];
  btns.forEach((btn, i) => {
    btn.textContent = `${'ABCD'[i]}. ${opts[i]}`;
    btn.className = 'ob-btn';
    btn.disabled = false;
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
      roundActive = false;
      apiCall('timeout');
    }
  }, ms);
}

// Answer
document.getElementById('ob-options').addEventListener('click', async (e) => {
  const btn = e.target.closest('.ob-btn');
  if (!btn || !roundActive || btn.disabled) return;
  roundActive = false;
  document.querySelectorAll('.ob-btn').forEach(b => b.disabled = true);
  btn.classList.add('selected');
  document.getElementById('ob-status').textContent = '✅ Đã trả lời! Chờ đối thủ...';
  await apiCall('answer', { role: myRole, answer: btn.dataset.opt });
});

function showRoundResult(data) {
  clearInterval(timerInterval);
  const r = data.roundResult;

  document.querySelectorAll('.ob-btn').forEach(btn => {
    if (btn.dataset.opt === r.correct_answer) btn.classList.add('correct');
  });

  document.getElementById('ob-p1-score').textContent = data.hostScore;
  document.getElementById('ob-p2-score').textContent = data.guestScore;

  const myCorrect = myRole === 'host' ? r.hostCorrect : r.guestCorrect;
  document.getElementById('ob-status').textContent = myCorrect ? '✅ Đúng!' : '❌ Sai!';
  playSound(myCorrect ? 'correct' : 'wrong');
}

function showMatchEnd(data) {
  clearInterval(timerInterval);
  stopPolling();
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
