// V17 Phi Hành Gia Nhí - Little Astronaut
// Explore the solar system, collect planet samples!

const PLANETS = [
  { id: 'mercury', name: 'Sao Thủy', emoji: '⚫', bg: 'linear-gradient(180deg,#2a2a2a,#1a1a1a)', sample: 'ite', fact: 'Sao Thủy gần Mặt Trời nhất, nóng 430°C ban ngày!' },
  { id: 'venus', name: 'Sao Kim', emoji: '🟡', bg: 'linear-gradient(180deg,#8b6914,#4a3608)', sample: '💨', fact: 'Sao Kim quay ngược! Mặt Trời mọc ở phía Tây.' },
  { id: 'mars', name: 'Sao Hỏa', emoji: '🔴', bg: 'linear-gradient(180deg,#8b2500,#4a1400)', sample: 'ite', fact: 'Sao Hỏa có núi lửa cao nhất hệ Mặt Trời: 21km!' },
  { id: 'jupiter', name: 'Sao Mộc', emoji: '🟠', bg: 'linear-gradient(180deg,#8b5e00,#4a3200)', sample: '🌀', fact: 'Sao Mộc to gấp 1300 lần Trái Đất!' },
  { id: 'saturn', name: 'Sao Thổ', emoji: '🪐', bg: 'linear-gradient(180deg,#6b5b00,#3a3000)', sample: '💍', fact: 'Vành đai Sao Thổ rộng 280.000km nhưng mỏng chỉ 10m!' },
  { id: 'uranus', name: 'Sao Thiên Vương', emoji: '🔵', bg: 'linear-gradient(180deg,#1a5f7a,#0a2f3d)', sample: '❄️', fact: 'Sao Thiên Vương nằm nghiêng 98°, quay như con lăn!' },
  { id: 'neptune', name: 'Sao Hải Vương', emoji: '🔷', bg: 'linear-gradient(180deg,#0a2f6b,#051535)', sample: '🌊', fact: 'Gió trên Sao Hải Vương nhanh nhất: 2100 km/h!' },
  { id: 'pluto', name: 'Sao Diêm Vương', emoji: '⚪', bg: 'linear-gradient(180deg,#3a3a4a,#1a1a2a)', sample: '💎', fact: 'Sao Diêm Vương nhỏ hơn cả Mặt Trăng của Trái Đất!' },
];

const QUESTIONS_PER_PLANET = 5;
const FUEL_MAX = 100;
const FUEL_PER_CORRECT = 0; // no gain
const FUEL_PER_WRONG = 15; // lose on wrong
const QUESTION_TIME = 12;

// ===== STATE =====
const S = {
  config: { subject: 'math', difficulty: 'easy' },
  currentPlanet: 0, questionInPlanet: 0,
  fuel: FUEL_MAX, wrongsThisPlanet: 0,
  planetsCleared: [], samples: [],
  questions: [], qIndex: 0, correct: 0, incorrect: 0,
  timer: null, timeLeft: 0, gameOver: false,
};

function getProgress() { try { return JSON.parse(localStorage.getItem('v17_progress') || '{}'); } catch { return {}; } }
function saveProgressData(data) { localStorage.setItem('v17_progress', JSON.stringify(data)); }
function getPlayerId() { try { return JSON.parse(localStorage.getItem('hocvui_profile'))?.id; } catch { return null; } }
function getPlayerGrade() { try { return JSON.parse(localStorage.getItem('hocvui_profile'))?.grade || 2; } catch { return 2; } }

// ===== SCREENS =====
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ===== SETUP =====
const prog = getProgress();
document.getElementById('planets-explored').textContent = prog.explored || 0;

document.getElementById('subject-group').addEventListener('click', e => {
  const btn = e.target.closest('.btn-option'); if (!btn) return;
  document.querySelectorAll('#subject-group .btn-option').forEach(b => b.classList.remove('active'));
  btn.classList.add('active'); S.config.subject = btn.dataset.subject;
});
document.getElementById('difficulty-group').addEventListener('click', e => {
  const btn = e.target.closest('.btn-option'); if (!btn) return;
  document.querySelectorAll('#difficulty-group .btn-option').forEach(b => b.classList.remove('active'));
  btn.classList.add('active'); S.config.difficulty = btn.dataset.difficulty;
});
document.getElementById('btn-start').addEventListener('click', startGame);

// ===== START =====
async function startGame() {
  Object.assign(S, { currentPlanet: 0, questionInPlanet: 0, fuel: FUEL_MAX, wrongsThisPlanet: 0, planetsCleared: [], samples: [], qIndex: 0, correct: 0, incorrect: 0, gameOver: false });
  await fetchQuestions();
  showMap();
}

async function fetchQuestions() {
  const grade = getPlayerGrade();
  let subject = S.config.subject;
  if (subject === 'mix') subject = ['math','vietnamese','english'][Math.floor(Math.random()*3)];
  try {
    const res = await fetch(`/api/questions?subject=${subject}&difficulty=${S.config.difficulty}&limit=50&grade=${grade}`);
    const data = await res.json();
    S.questions = (Array.isArray(data) ? data : data.questions || []).sort(() => Math.random() - 0.5);
  } catch { S.questions = []; }
  if (!S.questions.length) S.questions = [{ question_text: 'Lỗi tải', option_a: 'OK', option_b: '-', option_c: '-', option_d: '-', correct_answer: 'a' }];
}

// ===== MAP =====
function showMap() {
  showScreen('map-screen');
  document.getElementById('map-fuel-display').textContent = S.fuel + '%';
  const path = document.getElementById('planet-path');
  path.innerHTML = PLANETS.map((p, i) => {
    const cleared = S.planetsCleared.includes(i);
    const current = i === S.currentPlanet && !cleared;
    const unlocked = i === 0 || S.planetsCleared.includes(i - 1);
    const cls = cleared ? 'cleared' : current ? 'current' : unlocked ? 'unlocked' : 'locked';
    const status = cleared ? '✅ Đã khám phá' : current ? '▶️ Tiếp theo' : unlocked ? '🔓 Sẵn sàng' : '🔒';
    return `<div class="planet-row ${cls}" data-idx="${i}">
      <div class="pr-emoji">${p.emoji}</div>
      <div class="pr-info"><div class="pr-name">${p.name}</div><div class="pr-status">${status}</div></div>
      <div class="pr-badge">${cleared ? '⭐' : current ? '🚀' : ''}</div>
    </div>`;
  }).join('');

  // Show fact
  const fact = PLANETS[S.currentPlanet]?.fact || '';
  document.getElementById('map-fact').textContent = `💡 ${fact}`;
}

document.getElementById('planet-path').addEventListener('click', e => {
  const row = e.target.closest('.planet-row');
  if (!row || row.classList.contains('locked') || row.classList.contains('cleared')) return;
  const idx = parseInt(row.dataset.idx);
  S.currentPlanet = idx;
  flyToPlanet(idx);
});

// ===== FLY TRANSITION =====
function flyToPlanet(idx) {
  const planet = PLANETS[idx];
  document.getElementById('fly-text').textContent = `Bay đến ${planet.name}...`;
  showScreen('fly-screen');
  setTimeout(() => startPlanetQuiz(idx), 1800);
}

// ===== PLANET QUIZ =====
function startPlanetQuiz(idx) {
  S.questionInPlanet = 0;
  S.wrongsThisPlanet = 0;
  const planet = PLANETS[idx];

  showScreen('planet-screen');
  document.getElementById('planet-bg').style.background = planet.bg;
  document.getElementById('ph-planet').textContent = `${planet.emoji} ${planet.name}`;
  document.getElementById('planet-emoji').textContent = planet.emoji;
  document.getElementById('planet-sample').textContent = '';
  updatePlanetHUD();
  showPlanetQuestion();
}

function updatePlanetHUD() {
  document.getElementById('ph-fuel').textContent = S.fuel;
  document.getElementById('ph-progress').textContent = `${S.questionInPlanet}/${QUESTIONS_PER_PLANET}`;
}

function showPlanetQuestion() {
  if (S.gameOver) return;
  if (S.qIndex >= S.questions.length) { S.qIndex = 0; S.questions.sort(() => Math.random() - 0.5); }
  const q = S.questions[S.qIndex];
  document.getElementById('pq-text').textContent = q.question_text;
  const btns = document.querySelectorAll('.pq-btn');
  ['a','b','c','d'].forEach((o,i) => { btns[i].textContent = q[`option_${o}`]; btns[i].className = 'pq-btn'; btns[i].disabled = false; });
  document.getElementById('pq-status').textContent = '';
  document.getElementById('pq-status').className = 'pq-status';
  startTimer();
}

// ===== TIMER =====
function startTimer() {
  stopTimer();
  S.timeLeft = QUESTION_TIME;
  updateTimerBar();
  S.timer = setInterval(() => {
    S.timeLeft -= 0.1;
    updateTimerBar();
    if (S.timeLeft <= 0) { stopTimer(); handleTimeout(); }
  }, 100);
}
function stopTimer() { if (S.timer) { clearInterval(S.timer); S.timer = null; } }
function updateTimerBar() {
  const fill = document.getElementById('pq-timer-fill');
  if (!fill) return;
  const pct = Math.max(0, (S.timeLeft / QUESTION_TIME) * 100);
  fill.style.width = pct + '%';
  fill.classList.toggle('urgent', S.timeLeft <= 3);
}

function handleTimeout() {
  const q = S.questions[S.qIndex];
  document.querySelectorAll('.pq-btn').forEach(b => { b.disabled = true; b.classList.add('disabled'); });
  document.querySelector(`.pq-btn[data-opt="${q.correct_answer}"]`)?.classList.add('correct');
  handleWrong(q);
}

// ===== ANSWERS =====
document.getElementById('pq-answers').addEventListener('click', e => {
  const btn = e.target.closest('.pq-btn');
  if (!btn || btn.disabled || S.gameOver) return;
  stopTimer();
  const q = S.questions[S.qIndex];
  const selected = btn.dataset.opt;
  const correct = q.correct_answer;
  const isCorrect = selected.toLowerCase() === correct.toLowerCase();

  document.querySelectorAll('.pq-btn').forEach(b => { b.disabled = true; b.classList.add('disabled'); });
  if (isCorrect) { btn.classList.add('correct'); handleCorrect(q); }
  else { btn.classList.add('wrong'); document.querySelector(`.pq-btn[data-opt="${correct}"]`)?.classList.add('correct'); handleWrong(q); }
  logAnswer(q, selected, correct, isCorrect);
});

function handleCorrect(q) {
  S.correct++;
  S.questionInPlanet++;
  document.getElementById('pq-status').textContent = '✅ Tuyệt vời!';
  document.getElementById('pq-status').className = 'pq-status good';
  updatePlanetHUD();

  S.qIndex++;
  setTimeout(() => {
    if (S.questionInPlanet >= QUESTIONS_PER_PLANET) { planetComplete(); }
    else { showPlanetQuestion(); }
  }, 800);
}

function handleWrong(q) {
  S.incorrect++;
  S.wrongsThisPlanet++;
  S.fuel = Math.max(0, S.fuel - FUEL_PER_WRONG);
  document.getElementById('pq-status').textContent = `❌ Sai! -${FUEL_PER_WRONG}% nhiên liệu`;
  document.getElementById('pq-status').className = 'pq-status bad';
  updatePlanetHUD();

  S.qIndex++;
  setTimeout(() => {
    if (S.fuel <= 0) { endGame('fuel'); }
    else if (S.wrongsThisPlanet >= 3) { endGame('crash'); }
    else { showPlanetQuestion(); }
  }, 800);
}

// ===== PLANET COMPLETE =====
function planetComplete() {
  S.planetsCleared.push(S.currentPlanet);
  const planet = PLANETS[S.currentPlanet];

  // Perfect landing = collect sample
  if (S.wrongsThisPlanet === 0) {
    S.samples.push(planet.sample);
    const sampleEl = document.getElementById('planet-sample');
    sampleEl.textContent = `${planet.sample} Mẫu vật thu thập!`;
    sampleEl.classList.add('found');
    setTimeout(() => sampleEl.classList.remove('found'), 1000);
  }

  // Check if all planets done
  if (S.planetsCleared.length >= PLANETS.length) {
    setTimeout(() => endGame('win'), 1200);
  } else {
    S.currentPlanet++;
    setTimeout(() => showMap(), 1200);
  }
}

// ===== END =====
function endGame(reason) {
  S.gameOver = true;
  stopTimer();

  // Save progress
  const p = getProgress();
  p.explored = Math.max(p.explored || 0, S.planetsCleared.length);
  p.samples = [...new Set([...(p.samples || []), ...S.samples])];
  saveProgressData(p);
  saveSession();

  const title = reason === 'win' ? '🎉 Khám phá toàn bộ Hệ Mặt Trời!' : reason === 'fuel' ? '⛽ Hết nhiên liệu!' : '💥 Va chạm! (3 sai trên 1 hành tinh)';
  const stars = S.planetsCleared.length >= 8 ? 3 : S.planetsCleared.length >= 5 ? 2 : S.planetsCleared.length >= 2 ? 1 : 0;

  document.getElementById('result-container').innerHTML = `
    <div class="result-title">${title}</div>
    <div class="result-planets">${S.planetsCleared.map(i => PLANETS[i].emoji).join(' ') || '—'}</div>
    <div class="result-stats">
      <div class="result-stat"><span>🪐 Hành tinh</span><strong>${S.planetsCleared.length}/8</strong></div>
      <div class="result-stat"><span>✅ Câu đúng</span><strong>${S.correct}</strong></div>
      <div class="result-stat"><span>❌ Câu sai</span><strong>${S.incorrect}</strong></div>
      <div class="result-stat"><span>⛽ Nhiên liệu còn</span><strong>${S.fuel}%</strong></div>
      <div class="result-stat"><span>⭐ Sao</span><strong>${'⭐'.repeat(stars) || '—'}</strong></div>
    </div>
    ${S.samples.length ? `<div class="result-samples"><div class="result-samples-title">Mẫu vật thu thập (perfect landing):</div><div class="result-samples-list">${S.samples.join(' ')}</div></div>` : ''}
    <div class="result-btns">
      <button class="result-btn primary" onclick="location.reload()">🔄 Bay lại</button>
      <button class="result-btn secondary" onclick="location.href='/'">🏠 Trang chủ</button>
    </div>`;
  showScreen('result-screen');
  if (window.checkAndShowPrompt && getPlayerId()) window.checkAndShowPrompt(getPlayerId());
}

// ===== SESSION =====
async function saveSession() {
  const playerId = getPlayerId(); if (!playerId) return;
  const stars = S.planetsCleared.length >= 8 ? 3 : S.planetsCleared.length >= 5 ? 2 : 1;
  try { await fetch('/api/sessions', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ player_id: playerId, subject: S.config.subject === 'mix' ? 'math' : S.config.subject, difficulty: S.config.difficulty, score: S.planetsCleared.length * 10, total_questions: S.correct + S.incorrect, correct_answers: S.correct, stars_earned: stars, combo_max: 0 }) }); } catch {}
}
async function logAnswer(q, selected, correct, isCorrect) {
  const playerId = getPlayerId(); if (!playerId) return;
  try { await fetch('/api/answers', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ session_id: 0, player_id: playerId, question_id: q.id||0, selected_answer: selected, correct_answer: correct, is_correct: isCorrect?1:0, time_spent_ms: Math.round((QUESTION_TIME-S.timeLeft)*1000), difficulty: S.config.difficulty, combo_streak: 0 }) }); } catch {}
}

// ===== CHARACTER SYSTEM INTEGRATION (presentation only) =====
(function () {
  'use strict';
  let astroChar = null;
  let shipChar = null;

  // Mount the chibi astronaut next to the planet quiz (emoji fallback).
  function mountAstronaut() {
    const host = document.getElementById('planet-astronaut');
    if (!host) return;
    host.innerHTML = '';
    astroChar = null;
    const C = window.HocVuiCharacters;
    if (C && C.hasSpecies('astronaut')) {
      astroChar = C.createCharacter('astronaut', host, { state: 'idle' });
    } else {
      host.textContent = '🧑‍🚀';
    }
  }

  // Mount the rocket sprite on the fly transition screen (emoji fallback).
  function mountShip() {
    const host = document.getElementById('fly-ship');
    if (!host) return;
    host.innerHTML = '';
    shipChar = null;
    const C = window.HocVuiCharacters;
    if (C && C.hasSpecies('rocket')) {
      shipChar = C.createCharacter('rocket', host, { state: 'happy' });
    } else {
      host.textContent = '🚀';
    }
  }

  // Particle helper — sparkle / confetti burst around a host element.
  function spawnParticles(parent, kind, count) {
    if (!parent) return;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'pfx pfx-' + kind;
      p.style.setProperty('--tx', (Math.random() * 80 - 40) + 'px');
      p.style.setProperty('--ty', -(Math.random() * 50 + 20) + 'px');
      p.style.setProperty('--delay', (Math.random() * 0.18) + 's');
      if (kind === 'confetti') {
        const hues = ['#fbbf24', '#6366f1', '#22c55e', '#f0a04b', '#a5b4fc', '#ef4444'];
        p.style.background = hues[i % hues.length];
      }
      parent.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
  }
  function spawnConfetti(parent, count) { spawnParticles(parent, 'confetti', count || 16); }
  window.__v17_spawnParticles = spawnParticles;
  window.__v17_spawnConfetti = spawnConfetti;

  // Wrap flyToPlanet to mount the rocket sprite during the transition.
  if (typeof flyToPlanet === 'function') {
    const orig = flyToPlanet;
    flyToPlanet = function () {
      const r = orig.apply(this, arguments);
      mountShip();
      return r;
    };
  }

  // Wrap startPlanetQuiz to mount the astronaut sprite on the planet screen.
  if (typeof startPlanetQuiz === 'function') {
    const orig = startPlanetQuiz;
    startPlanetQuiz = function () {
      const r = orig.apply(this, arguments);
      mountAstronaut();
      return r;
    };
  }

  // Wrap handleCorrect to play the astronaut's happy bounce + sparkles.
  if (typeof handleCorrect === 'function') {
    const orig = handleCorrect;
    handleCorrect = function () {
      const r = orig.apply(this, arguments);
      if (astroChar) {
        astroChar.setState('happy');
        setTimeout(() => { if (astroChar) astroChar.setState('idle'); }, 700);
      }
      const host = document.getElementById('planet-astronaut');
      if (host) spawnParticles(host, 'sparkle', 8);
      return r;
    };
  }

  // Wrap planetComplete to celebrate a cleared planet with confetti.
  if (typeof planetComplete === 'function') {
    const orig = planetComplete;
    planetComplete = function () {
      const r = orig.apply(this, arguments);
      if (astroChar) {
        astroChar.setState('happy');
        setTimeout(() => { if (astroChar) astroChar.setState('idle'); }, 700);
      }
      const host = document.getElementById('planet-astronaut');
      if (host) spawnConfetti(host, 18);
      return r;
    };
  }

  // Modals (guide + exit) ---------------------------------------------------
  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }
  ready(function () {
    const $ = id => document.getElementById(id);
    const guide = $('guide-modal');
    const guideBtn = $('btn-guide');
    if (guide && guideBtn) {
      guideBtn.addEventListener('click', () => { guide.style.display = 'flex'; });
      const close = $('btn-guide-close');
      if (close) close.addEventListener('click', () => { guide.style.display = 'none'; });
      guide.addEventListener('click', e => { if (e.target === guide) guide.style.display = 'none'; });
    }
    const exit = $('exit-modal');
    const exitBtn = $('btn-exit');
    if (exit && exitBtn) {
      exitBtn.addEventListener('click', () => { exit.style.display = 'flex'; });
      const cancel = $('btn-exit-cancel');
      if (cancel) cancel.addEventListener('click', () => { exit.style.display = 'none'; });
      const confirm = $('btn-exit-confirm');
      if (confirm) confirm.addEventListener('click', () => {
        exit.style.display = 'none';
        // Stop timers/loops before leaving.
        try { stopTimer(); } catch (e) {}
        try { S.gameOver = true; } catch (e) {}
        window.location.reload();
      });
      exit.addEventListener('click', e => { if (e.target === exit) exit.style.display = 'none'; });
    }
  });
})();
