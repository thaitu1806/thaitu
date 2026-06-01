// === V4 - ONLINE DUEL CLIENT ===
let ws = null;
let myRole = null; // 'host' or 'guest'
let myName = '';
let roomCode = '';
let timerInterval = null;
let roundActive = false;

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function connectWS() {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${protocol}//${location.host}`);
  ws.onmessage = (e) => handleServerMsg(JSON.parse(e.data));
  ws.onclose = () => { setTimeout(() => { if (roundActive) alert('Mất kết nối!'); }, 1000); };
  return new Promise(resolve => { ws.onopen = resolve; });
}

// === HOME ===
document.getElementById('btn-create').addEventListener('click', async () => {
  myName = document.getElementById('my-name').value.trim() || 'Player';
  await connectWS();
  ws.send(JSON.stringify({ type: 'create', name: myName, settings: getSettings() }));
});

document.getElementById('btn-join').addEventListener('click', () => {
  myName = document.getElementById('my-name').value.trim() || 'Player';
  showScreen('join-screen');
});

document.getElementById('btn-join-go').addEventListener('click', async () => {
  const code = document.getElementById('join-code').value.trim().toUpperCase();
  if (code.length !== 4) { document.getElementById('join-status').textContent = 'Mã phòng phải 4 ký tự!'; return; }
  await connectWS();
  ws.send(JSON.stringify({ type: 'join', code, name: myName }));
});

// Enter key support
document.getElementById('join-code').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') document.getElementById('btn-join-go').click();
});
document.getElementById('my-name').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') document.getElementById('btn-create').click();
});

document.getElementById('btn-back-create').addEventListener('click', () => { ws?.close(); showScreen('home-screen'); });
document.getElementById('btn-back-join').addEventListener('click', () => showScreen('home-screen'));
document.getElementById('btn-home').addEventListener('click', () => { ws?.close(); showScreen('home-screen'); });
document.getElementById('btn-rematch').addEventListener('click', () => { ws.send(JSON.stringify({ type: 'rematch' })); });

function getSettings() {
  return {
    subject: document.getElementById('rs-subject')?.value || 'mix',
    difficulty: document.getElementById('rs-difficulty')?.value || 'medium',
    rounds: parseInt(document.getElementById('rs-rounds')?.value || '10'),
    speed: document.getElementById('rs-speed')?.value || 'normal',
  };
}

// === START MATCH (host only) ===
document.getElementById('btn-start-match').addEventListener('click', () => {
  const settings = getSettings();
  ws.send(JSON.stringify({ type: 'update_settings', settings }));
  ws.send(JSON.stringify({ type: 'start' }));
});

// Settings change -> notify
['rs-subject', 'rs-difficulty', 'rs-rounds', 'rs-speed'].forEach(id => {
  document.getElementById(id)?.addEventListener('change', () => {
    if (myRole === 'host' && ws) {
      ws.send(JSON.stringify({ type: 'update_settings', settings: getSettings() }));
    }
  });
});

// === HANDLE SERVER MESSAGES ===
function handleServerMsg(msg) {
  switch (msg.type) {
    case 'created':
      myRole = 'host';
      roomCode = msg.code;
      document.getElementById('room-code').textContent = msg.code;
      document.getElementById('rp-host').querySelector('.rp-name').textContent = msg.name;
      showScreen('create-screen');
      break;

    case 'joined':
      myRole = 'guest';
      roomCode = msg.code;
      showScreen('wait-screen');
      document.getElementById('wait-msg').textContent = `Đã vào phòng ${msg.code}! Chờ ${msg.hostName} bắt đầu...`;
      break;

    case 'guest_joined':
      document.getElementById('rp-guest').querySelector('.rp-name').textContent = msg.guestName;
      document.getElementById('rp-guest').classList.remove('rp-waiting');
      document.getElementById('rp-guest').classList.add('rp-ready');
      document.getElementById('btn-start-match').classList.remove('hidden');
      break;

    case 'match_start':
      document.getElementById('ob-p1-name').textContent = msg.hostName;
      document.getElementById('ob-p2-name').textContent = msg.guestName;
      document.getElementById('ob-p1-score').textContent = '0';
      document.getElementById('ob-p2-score').textContent = '0';
      showScreen('battle-screen');
      document.getElementById('ob-status').textContent = '⚔️ Trận đấu bắt đầu!';
      break;

    case 'round':
      showRound(msg);
      break;

    case 'opponent_answered':
      document.getElementById('ob-status').textContent = '⚡ Đối thủ đã trả lời!';
      break;

    case 'round_result':
      showRoundResult(msg);
      break;

    case 'match_end':
      showMatchEnd(msg);
      break;

    case 'opponent_left':
      roundActive = false;
      clearInterval(timerInterval);
      alert('Đối thủ đã rời phòng!');
      showScreen('home-screen');
      break;

    case 'rematch_ready':
      document.getElementById('ob-p1-score').textContent = '0';
      document.getElementById('ob-p2-score').textContent = '0';
      showScreen('battle-screen');
      document.getElementById('ob-status').textContent = '🔄 Đấu lại!';
      break;

    case 'error':
      document.getElementById('join-status').textContent = msg.message;
      break;
  }
}

// === BATTLE UI ===
function showRound(msg) {
  roundActive = true;
  const q = msg.question;

  document.getElementById('ob-round').textContent = `${msg.round}/${msg.total}`;
  document.getElementById('ob-badge').textContent = q.subject === 'math' ? '🔢 Toán' : '📖 TV';
  document.getElementById('ob-text').textContent = q.question_text;
  document.getElementById('ob-status').textContent = '';

  const btns = document.querySelectorAll('.ob-btn');
  const opts = [q.option_a, q.option_b, q.option_c, q.option_d];
  btns.forEach((btn, i) => {
    btn.textContent = `${'ABCD'[i]}. ${opts[i]}`;
    btn.className = 'ob-btn';
    btn.disabled = false;
  });

  startClientTimer();
}

function startClientTimer() {
  let timeLeft = 100;
  const fill = document.getElementById('ob-timer-fill');
  fill.style.width = '100%';
  fill.className = 'ob-timer-fill';

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft -= 0.5;
    fill.style.width = timeLeft + '%';
    if (timeLeft <= 20) fill.className = 'ob-timer-fill danger';
    else if (timeLeft <= 50) fill.className = 'ob-timer-fill warn';
    if (timeLeft <= 0) { clearInterval(timerInterval); roundActive = false; }
  }, 100); // Visual only, server controls actual timeout
}

// Answer buttons
document.getElementById('ob-options').addEventListener('click', (e) => {
  const btn = e.target.closest('.ob-btn');
  if (!btn || !roundActive || btn.disabled) return;

  roundActive = false;
  document.querySelectorAll('.ob-btn').forEach(b => b.disabled = true);
  btn.classList.add('selected');

  ws.send(JSON.stringify({ type: 'answer', answer: btn.dataset.opt }));
  document.getElementById('ob-status').textContent = '✅ Đã trả lời! Chờ đối thủ...';
});

function showRoundResult(msg) {
  roundActive = false;
  clearInterval(timerInterval);

  const myData = myRole === 'host' ? msg.host : msg.guest;
  const oppData = myRole === 'host' ? msg.guest : msg.host;

  // Highlight correct/wrong
  document.querySelectorAll('.ob-btn').forEach(btn => {
    if (btn.dataset.opt === msg.correct_answer) btn.classList.add('correct');
    if (btn.dataset.opt === myData.answer && !myData.correct) btn.classList.add('wrong');
  });

  // Update scores
  document.getElementById('ob-p1-score').textContent = msg.host.score;
  document.getElementById('ob-p2-score').textContent = msg.guest.score;

  // Status
  let status = '';
  if (myData.correct && oppData.correct) {
    status = myData.time < oppData.time ? '⚡ Đúng + Nhanh hơn! +15' : '✅ Đúng! +10';
  } else if (myData.correct) {
    status = '✅ Đúng! +15';
  } else if (myData.answer) {
    status = '❌ Sai!';
  } else {
    status = '⏰ Hết giờ!';
  }
  document.getElementById('ob-status').textContent = status;

  // Sound
  playSound(myData.correct ? 'correct' : 'wrong');
}

function showMatchEnd(msg) {
  clearInterval(timerInterval);
  roundActive = false;

  const iWon = (myRole === 'host' && msg.winner === 'host') || (myRole === 'guest' && msg.winner === 'guest');
  const tie = msg.winner === 'tie';

  document.getElementById('res-icon').textContent = tie ? '🤝' : iWon ? '🏆🎉' : '😢';
  document.getElementById('res-title').textContent = tie ? 'Hòa!' : iWon ? 'Bạn thắng!' : 'Bạn thua!';
  document.getElementById('res-p1-name').textContent = msg.host.name;
  document.getElementById('res-p2-name').textContent = msg.guest.name;
  document.getElementById('res-p1-score').textContent = msg.host.score;
  document.getElementById('res-p2-score').textContent = msg.guest.score;
  document.getElementById('res-detail').textContent = `Đúng: ${msg.host.correct} vs ${msg.guest.correct} / ${msg.totalRounds} câu`;

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
