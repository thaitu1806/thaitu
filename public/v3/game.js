// === V3 - DUEL MODE (2 Players) ===
const D = {
  p1: { name: 'Plant', score: 0, correct: 0, faster: 0, answered: false, answer: null, time: 0 },
  p2: { name: 'Zombie', score: 0, correct: 0, faster: 0, answered: false, answer: null, time: 0 },
  settings: { subject: 'mix', difficulty: 'medium', rounds: 10, speed: 'normal' },
  questions: [],
  currentRound: 0,
  timer: null,
  timeLeft: 100,
  roundActive: false,
  roundStart: 0,
};

// Auto-fill player 1 name from profile
(function() {
  const profile = localStorage.getItem('hocvui_profile');
  if (profile) {
    const p = JSON.parse(profile);
    document.getElementById('p1-name').value = p.name;
  }
})();

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// === LOBBY ===
document.getElementById('btn-start-duel').addEventListener('click', async () => {
  const p1 = document.getElementById('p1-name').value.trim() || 'Plant';
  const p2 = document.getElementById('p2-name').value.trim() || 'Zombie';

  D.p1 = { name: p1, score: 0, correct: 0, faster: 0, answered: false, answer: null, time: 0 };
  D.p2 = { name: p2, score: 0, correct: 0, faster: 0, answered: false, answer: null, time: 0 };
  D.settings.subject = document.getElementById('set-subject').value;
  D.settings.difficulty = document.getElementById('set-difficulty').value;
  D.settings.rounds = parseInt(document.getElementById('set-rounds').value);
  D.settings.speed = document.getElementById('set-speed').value;
  D.currentRound = 0;

  // Update UI names
  document.getElementById('az-p1-name').textContent = p1;
  document.getElementById('az-p2-name').textContent = p2;

  await fetchQuestions();
  showScreen('battle-screen');
  startRound();
});

async function fetchQuestions() {
  const { subject, difficulty, rounds } = D.settings;
  try {
    if (subject === 'mix') {
      const half = Math.ceil(rounds / 2);
      const [m, v] = await Promise.all([
        fetch(`/api/questions?subject=math&difficulty=${difficulty}&limit=${half}`).then(r => r.json()),
        fetch(`/api/questions?subject=vietnamese&difficulty=${difficulty}&limit=${rounds - half}`).then(r => r.json()),
      ]);
      D.questions = shuffle([...m, ...v]);
    } else {
      const res = await fetch(`/api/questions?subject=${subject}&difficulty=${difficulty}&limit=${rounds}`);
      D.questions = await res.json();
    }
  } catch {
    D.questions = generateFallback(rounds);
  }
  if (D.questions.length < rounds) {
    D.questions = [...D.questions, ...generateFallback(rounds - D.questions.length)];
  }
}

// === ROUND LOGIC ===
function startRound() {
  if (D.currentRound >= D.questions.length) { endDuel(); return; }

  const q = D.questions[D.currentRound];
  D.p1.answered = false; D.p1.answer = null; D.p1.time = 0;
  D.p2.answered = false; D.p2.answer = null; D.p2.time = 0;
  D.roundActive = true;
  D.roundStart = Date.now();

  // Update round display
  document.getElementById('round-display').textContent = `${D.currentRound + 1}/${D.questions.length}`;

  // Question
  const badge = document.getElementById('dq-badge');
  badge.textContent = q.subject === 'math' ? '🔢 Toán' : '📖 Tiếng Việt';

  // Set question in both player zones
  document.getElementById('p1-question').textContent = q.question_text;
  document.getElementById('p2-question').textContent = q.question_text;

  // Options for both players
  const opts = [q.option_a, q.option_b, q.option_c, q.option_d];
  ['p1', 'p2'].forEach(p => {
    const btns = document.querySelectorAll(`#${p}-buttons .ans-btn`);
    btns.forEach((btn, i) => {
      btn.textContent = `${'ABCD'[i]}. ${opts[i]}`;
      btn.className = `ans-btn ${p}-btn`;
      btn.disabled = false;
      btn.style.borderColor = '';
      btn.style.background = '';
    });
  });

  // Clear status
  document.getElementById('p1-status').textContent = '';
  document.getElementById('p2-status').textContent = '';

  // Timer
  startTimer();
}

function startTimer() {
  D.timeLeft = 100;
  const fill = document.getElementById('dq-timer-fill');
  fill.style.width = '100%';
  fill.className = 'dq-timer-fill';

  clearInterval(D.timer);
  const speed = D.settings.speed === 'slow' ? 300 : D.settings.speed === 'fast' ? 120 : 200;

  D.timer = setInterval(() => {
    D.timeLeft -= 1;
    fill.style.width = D.timeLeft + '%';
    if (D.timeLeft <= 20) fill.className = 'dq-timer-fill danger';
    else if (D.timeLeft <= 50) fill.className = 'dq-timer-fill warn';

    if (D.timeLeft <= 0) {
      clearInterval(D.timer);
      D.roundActive = false;
      resolveRound();
    }
  }, speed);
}

// === ANSWER HANDLING ===
document.getElementById('p1-buttons').addEventListener('click', (e) => {
  const btn = e.target.closest('.ans-btn');
  if (!btn || !D.roundActive || D.p1.answered) return;
  handleAnswer('p1', btn.dataset.opt, btn);
});

document.getElementById('p2-buttons').addEventListener('click', (e) => {
  const btn = e.target.closest('.ans-btn');
  if (!btn || !D.roundActive || D.p2.answered) return;
  handleAnswer('p2', btn.dataset.opt, btn);
});

function handleAnswer(player, opt, btn) {
  const p = D[player];
  p.answered = true;
  p.answer = opt;
  p.time = Date.now() - D.roundStart;

  // Lock this player's buttons
  document.querySelectorAll(`#${player}-buttons .ans-btn`).forEach(b => b.disabled = true);

  // Show waiting status
  document.getElementById(`${player}-status`).textContent = '✅ Đã trả lời!';

  // Highlight selected with class
  btn.classList.add('selected');

  // If both answered, resolve immediately
  if (D.p1.answered && D.p2.answered) {
    clearInterval(D.timer);
    D.roundActive = false;
    setTimeout(resolveRound, 300);
  }
}

function resolveRound() {
  const q = D.questions[D.currentRound];
  const correct = q.correct_answer;

  const p1Correct = D.p1.answer === correct;
  const p2Correct = D.p2.answer === correct;

  // Show correct/wrong on buttons
  ['p1', 'p2'].forEach(p => {
    const btns = document.querySelectorAll(`#${p}-buttons .ans-btn`);
    btns.forEach(btn => {
      btn.disabled = true;
      if (btn.dataset.opt === correct) btn.classList.add('correct');
      if (btn.dataset.opt === D[p].answer && D[p].answer !== correct) btn.classList.add('wrong');
    });
  });

  // Score calculation
  let p1Points = 0, p2Points = 0;

  if (p1Correct) {
    D.p1.correct++;
    p1Points = 10;
    // Speed bonus if faster
    if (!p2Correct || D.p1.time < D.p2.time) { p1Points += 5; D.p1.faster++; }
  }
  if (p2Correct) {
    D.p2.correct++;
    p2Points = 10;
    if (!p1Correct || D.p2.time < D.p1.time) { p2Points += 5; D.p2.faster++; }
  }

  D.p1.score += p1Points;
  D.p2.score += p2Points;

  // Update scoreboard
  updateScoreboard();

  // Status messages
  const s1 = document.getElementById('p1-status');
  const s2 = document.getElementById('p2-status');

  if (p1Correct && p2Correct) {
    const faster = D.p1.time < D.p2.time ? 'p1' : 'p2';
    s1.textContent = faster === 'p1' ? '⚡ Đúng + Nhanh hơn!' : '✅ Đúng!';
    s2.textContent = faster === 'p2' ? '⚡ Đúng + Nhanh hơn!' : '✅ Đúng!';
  } else {
    s1.textContent = p1Correct ? '✅ Đúng!' : (D.p1.answered ? '❌ Sai!' : '⏰ Hết giờ!');
    s2.textContent = p2Correct ? '✅ Đúng!' : (D.p2.answered ? '❌ Sai!' : '⏰ Hết giờ!');
  }

  // Sound
  if (p1Correct || p2Correct) playSound('correct');
  else playSound('wrong');

  // Next round after delay
  D.currentRound++;
  setTimeout(() => {
    if (D.currentRound >= D.questions.length) endDuel();
    else startRound();
  }, 2000);
}

function updateScoreboard() {
  const s1 = document.getElementById('sb-p1-score');
  const s2 = document.getElementById('sb-p2-score');
  s1.textContent = D.p1.score;
  s2.textContent = D.p2.score;
  s1.classList.add('score-flash');
  s2.classList.add('score-flash');
  setTimeout(() => { s1.classList.remove('score-flash'); s2.classList.remove('score-flash'); }, 300);
}

// === END DUEL ===
function endDuel() {
  clearInterval(D.timer);

  const winner = D.p1.score > D.p2.score ? 'p1' : D.p2.score > D.p1.score ? 'p2' : 'tie';

  let icon, title;
  if (winner === 'p1') { icon = '🌻🏆'; title = `${D.p1.name} thắng!`; }
  else if (winner === 'p2') { icon = '🧟🏆'; title = `${D.p2.name} thắng!`; }
  else { icon = '🤝'; title = 'Hòa!'; }

  document.getElementById('result-winner-icon').textContent = icon;
  document.getElementById('result-title').textContent = title;

  document.getElementById('rd-p1-name').textContent = D.p1.name;
  document.getElementById('rd-p2-name').textContent = D.p2.name;
  document.getElementById('rd-p1-correct').textContent = D.p1.correct;
  document.getElementById('rd-p2-correct').textContent = D.p2.correct;
  document.getElementById('rd-p1-faster').textContent = D.p1.faster;
  document.getElementById('rd-p2-faster').textContent = D.p2.faster;
  document.getElementById('rd-p1-score').textContent = D.p1.score;
  document.getElementById('rd-p2-score').textContent = D.p2.score;

  playSound(winner === 'tie' ? 'correct' : 'win');
  // Celebration overlay
  if (winner !== 'tie') {
    const name = winner === 'p1' ? D.p1.name : D.p2.name;
    showCelebration(`🏆 ${name} thắng!`);
  }
  showScreen('result-screen');
}

// Navigation
document.getElementById('btn-rematch').addEventListener('click', async () => {
  D.currentRound = 0;
  D.p1.score = 0; D.p1.correct = 0; D.p1.faster = 0;
  D.p2.score = 0; D.p2.correct = 0; D.p2.faster = 0;
  await fetchQuestions();
  updateScoreboard();
  showScreen('battle-screen');
  startRound();
});
document.getElementById('btn-lobby').addEventListener('click', () => showScreen('lobby-screen'));

// === KEYBOARD SUPPORT ===
// P1: keys 1,2,3,4 | P2: keys 7,8,9,0
document.addEventListener('keydown', (e) => {
  if (!D.roundActive) return;

  const p1Keys = { '1': 'a', '2': 'b', '3': 'c', '4': 'd' };
  const p2Keys = { '7': 'a', '8': 'b', '9': 'c', '0': 'd' };

  if (p1Keys[e.key] && !D.p1.answered) {
    const opt = p1Keys[e.key];
    const btn = document.querySelector(`#p1-buttons [data-opt="${opt}"]`);
    if (btn) handleAnswer('p1', opt, btn);
  }
  if (p2Keys[e.key] && !D.p2.answered) {
    const opt = p2Keys[e.key];
    const btn = document.querySelector(`#p2-buttons [data-opt="${opt}"]`);
    if (btn) handleAnswer('p2', opt, btn);
  }
});

// === UTILITIES ===
function shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

function generateFallback(count) {
  const qs = [];
  for (let i = 0; i < count; i++) {
    const a = Math.floor(Math.random() * 20) + 3;
    const b = Math.floor(Math.random() * 15) + 1;
    const answer = a + b;
    const opts = [answer, answer + 1, answer - 1, answer + 2].sort(() => Math.random() - 0.5);
    const correct = ['a', 'b', 'c', 'd'][opts.indexOf(answer)];
    qs.push({ question_text: `${a} + ${b} = ?`, option_a: String(opts[0]), option_b: String(opts[1]), option_c: String(opts[2]), option_d: String(opts[3]), correct_answer: correct, subject: 'math' });
  }
  return qs;
}

// === AUDIO ===
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function showCelebration(text) {
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;pointer-events:none;animation:celebFade 2.5s forwards;';
  el.innerHTML = `<div style="text-align:center"><div style="font-size:3rem;animation:celebBounce 0.6s infinite alternate">🎉🎊👏✨🌟</div><div style="font-size:1.8rem;font-weight:900;color:#FFD700;text-shadow:2px 2px 8px rgba(0,0,0,0.5);margin-top:10px">${text}</div></div>`;
  if (!document.getElementById('celeb-style')) {
    const s = document.createElement('style'); s.id = 'celeb-style';
    s.textContent = '@keyframes celebFade{0%{opacity:0}10%{opacity:1}80%{opacity:1}100%{opacity:0}}@keyframes celebBounce{from{transform:scale(1) rotate(-3deg)}to{transform:scale(1.2) rotate(3deg)}}';
    document.head.appendChild(s);
  }
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

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
    }
  } catch {}
}
