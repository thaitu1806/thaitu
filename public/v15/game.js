// V15 Vườn Thú Kỳ Diệu - Magic Zoo
// Build your zoo, earn coins from quizzes, collect animals!

const ANIMALS = [
  // Common (cost 30-60)
  { id: 'chicken', emoji: '🐔', name: 'Gà', tier: 'common', cost: 30 },
  { id: 'pig', emoji: '🐷', name: 'Heo', tier: 'common', cost: 35 },
  { id: 'cow', emoji: '🐮', name: 'Bò', tier: 'common', cost: 40 },
  { id: 'sheep', emoji: '🐑', name: 'Cừu', tier: 'common', cost: 40 },
  { id: 'rabbit', emoji: '🐰', name: 'Thỏ', tier: 'common', cost: 35 },
  { id: 'duck', emoji: '🦆', name: 'Vịt', tier: 'common', cost: 30 },
  { id: 'horse', emoji: '🐴', name: 'Ngựa', tier: 'common', cost: 55 },
  // Rare (cost 80-120)
  { id: 'fox', emoji: '🦊', name: 'Cáo', tier: 'rare', cost: 80 },
  { id: 'panda', emoji: '🐼', name: 'Gấu Trúc', tier: 'rare', cost: 100 },
  { id: 'parrot', emoji: '🦜', name: 'Vẹt', tier: 'rare', cost: 90 },
  { id: 'dolphin', emoji: '🐬', name: 'Cá Heo', tier: 'rare', cost: 110 },
  { id: 'penguin', emoji: '🐧', name: 'Chim Cánh Cụt', tier: 'rare', cost: 100 },
  { id: 'monkey', emoji: '🐵', name: 'Khỉ', tier: 'rare', cost: 85 },
  // Epic (cost 150-250)
  { id: 'lion', emoji: '🦁', name: 'Sư Tử', tier: 'epic', cost: 160 },
  { id: 'elephant', emoji: '🐘', name: 'Voi', tier: 'epic', cost: 200 },
  { id: 'giraffe', emoji: '🦒', name: 'Hươu Cao Cổ', tier: 'epic', cost: 180 },
  { id: 'whale', emoji: '🐋', name: 'Cá Voi', tier: 'epic', cost: 220 },
  { id: 'tiger', emoji: '🐯', name: 'Hổ', tier: 'epic', cost: 240 },
  // Legend (cost 350+)
  { id: 'unicorn', emoji: '🦄', name: 'Kỳ Lân', tier: 'legend', cost: 350 },
  { id: 'dragon', emoji: '🐲', name: 'Rồng', tier: 'legend', cost: 450 },
  { id: 'phoenix', emoji: '🦅', name: 'Phượng Hoàng', tier: 'legend', cost: 400 },
];

const TIER_INFO = {
  common: { label: '🟢 Thường', color: '#22c55e' },
  rare: { label: '🔵 Hiếm', color: '#3b82f6' },
  epic: { label: '🟣 Siêu hiếm', color: '#a855f7' },
  legend: { label: '🟡 Huyền thoại', color: '#eab308' },
};

const ZOO_SLOTS = 20;
const QUIZ_TOTAL = 10;
const QUIZ_TIME = 10;
const COINS_PER_CORRECT = 8;
const DAILY_BONUS_PER_ANIMAL = 3;

// Real-world rewards - unlocked by milestones
const REWARDS = [
  { id: 'r1', animals: 5, icon: '🍦', name: 'Một cây kem', desc: 'Sưu tập 5 con vật!' },
  { id: 'r2', animals: 10, icon: '🎨', name: 'Bộ bút màu', desc: 'Sưu tập 10 con vật!' },
  { id: 'r3', animals: 15, icon: '📚', name: 'Truyện tranh', desc: 'Sưu tập 15 con vật!' },
  { id: 'r4', animals: 20, icon: '🎁', name: 'Quà bất ngờ!', desc: 'Hoàn thành vườn thú!' },
];

// ===== PERSISTENCE =====
function loadZoo() {
  try { return JSON.parse(localStorage.getItem('v15_zoo')) || { coins: 30, animals: [], lastDaily: null }; }
  catch { return { coins: 30, animals: [], lastDaily: null }; }
}
function saveZoo(data) { localStorage.setItem('v15_zoo', JSON.stringify(data)); }
function getPlayerId() { try { return JSON.parse(localStorage.getItem('hocvui_profile'))?.id; } catch { return null; } }
function getPlayerGrade() { try { return JSON.parse(localStorage.getItem('hocvui_profile'))?.grade || 2; } catch { return 2; } }

let zoo = loadZoo();

// ===== DAILY BONUS =====
function checkDailyBonus() {
  const today = new Date().toISOString().split('T')[0];
  if (zoo.lastDaily !== today && zoo.animals.length > 0) {
    const bonus = zoo.animals.length * DAILY_BONUS_PER_ANIMAL;
    zoo.coins += bonus;
    zoo.lastDaily = today;
    saveZoo(zoo);
    return bonus;
  }
  return 0;
}

// ===== SCREENS =====
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ===== ZOO SCREEN =====
function renderZoo() {
  const bonus = checkDailyBonus();
  document.getElementById('coin-display').textContent = zoo.coins;

  const grid = document.getElementById('zoo-grid');
  let html = '';
  for (let i = 0; i < ZOO_SLOTS; i++) {
    const animalId = zoo.animals[i];
    if (animalId) {
      const animal = ANIMALS.find(a => a.id === animalId);
      const tierDot = TIER_INFO[animal.tier].label.charAt(0);
      html += `<div class="zoo-cell has-animal" data-slot="${i}">
        <span class="cell-animal">${animal.emoji}</span>
        <span class="tier-badge">${tierDot}</span>
        <span class="cell-label">${animal.name}</span>
      </div>`;
    } else {
      html += `<div class="zoo-cell empty" data-slot="${i}"><span class="cell-plus">+</span></div>`;
    }
  }
  grid.innerHTML = html;

  // Info text
  const info = document.getElementById('zoo-info');
  if (bonus > 0) {
    info.textContent = `🎁 Bonus hôm nay: +${bonus} xu từ ${zoo.animals.length} con vật!`;
    info.style.color = '#ffd700';
    setTimeout(() => { info.style.color = ''; }, 3000);
  } else {
    info.textContent = `🐾 ${zoo.animals.length}/${ZOO_SLOTS} con vật | Chơi quiz để kiếm xu!`;
  }
}

// ===== SHOP =====
let shopFilter = 'all';

function renderShop() {
  document.getElementById('shop-coin-display').textContent = zoo.coins;
  const list = document.getElementById('shop-list');
  const filtered = shopFilter === 'all' ? ANIMALS : ANIMALS.filter(a => a.tier === shopFilter);

  list.innerHTML = filtered.map(a => {
    const owned = zoo.animals.includes(a.id);
    const canAfford = zoo.coins >= a.cost;
    return `<div class="shop-item ${owned ? 'owned' : ''}" data-id="${a.id}" data-cost="${a.cost}">
      <div class="si-emoji">${a.emoji}</div>
      <div class="si-name">${a.name}</div>
      <div class="si-tier" style="color:${TIER_INFO[a.tier].color}">${TIER_INFO[a.tier].label}</div>
      <div class="si-price">${owned ? '✓ Đã có' : `💰 ${a.cost}`}</div>
    </div>`;
  }).join('');
}

document.getElementById('btn-shop').addEventListener('click', () => { showScreen('shop-screen'); renderShop(); });
document.getElementById('btn-shop-back').addEventListener('click', () => { showScreen('zoo-screen'); renderZoo(); });
document.getElementById('btn-rewards').addEventListener('click', () => { showScreen('rewards-screen'); renderRewards(); });
document.getElementById('btn-rewards-back').addEventListener('click', () => { showScreen('zoo-screen'); renderZoo(); });

document.getElementById('shop-tabs').addEventListener('click', e => {
  const tab = e.target.closest('.shop-tab');
  if (!tab) return;
  document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  shopFilter = tab.dataset.tier;
  renderShop();
});

document.getElementById('shop-list').addEventListener('click', e => {
  const item = e.target.closest('.shop-item');
  if (!item || item.classList.contains('owned')) return;
  const id = item.dataset.id;
  const cost = parseInt(item.dataset.cost);
  const animal = ANIMALS.find(a => a.id === id);

  if (zoo.coins < cost) {
    alert(`Cần ${cost} xu! Chơi quiz để kiếm thêm nhé! 💰`);
    return;
  }
  if (zoo.animals.length >= ZOO_SLOTS) {
    alert('Vườn thú đã đầy! (20/20)');
    return;
  }

  // Buy!
  zoo.coins -= cost;
  zoo.animals.push(id);
  saveZoo(zoo);
  renderShop();
  document.getElementById('shop-coin-display').textContent = zoo.coins;

  // Check reward milestones
  const claimed = getClaimedRewards();
  const newReward = REWARDS.find(r => zoo.animals.length >= r.animals && !claimed.includes(r.id));
  if (newReward) {
    setTimeout(() => alert(`🎁 Mốc mới! Sưu tập ${newReward.animals} con → nhận "${newReward.name}"!\nVào 🎁 Phần Thưởng để nhận nhé!`), 300);
  }
});

// ===== REWARDS =====
function getClaimedRewards() {
  try { return JSON.parse(localStorage.getItem('v15_rewards_claimed') || '[]'); } catch { return []; }
}
function saveClaimedRewards(arr) { localStorage.setItem('v15_rewards_claimed', JSON.stringify(arr)); }

function renderRewards() {
  const claimed = getClaimedRewards();
  const animalCount = zoo.animals.length;
  const list = document.getElementById('rewards-list');

  list.innerHTML = REWARDS.map(r => {
    const isClaimed = claimed.includes(r.id);
    const isUnlocked = animalCount >= r.animals;
    const cls = isClaimed ? 'claimed' : isUnlocked ? 'unlocked' : '';
    const progressText = isClaimed ? '✅ Đã nhận!' : `${animalCount}/${r.animals} con vật`;

    let badge = '🔒';
    if (isClaimed) badge = '🏆';
    else if (isUnlocked) badge = '';

    return `<div class="reward-card ${cls}">
      <div class="reward-icon">${r.icon}</div>
      <div class="reward-info">
        <div class="reward-name">${r.name}</div>
        <div class="reward-desc">${r.desc}</div>
        <div class="reward-progress">${progressText}</div>
      </div>
      ${isClaimed ? '<div class="reward-badge">🏆</div>' : isUnlocked ? `<button class="reward-claim-btn" data-reward="${r.id}">🎉 Nhận!</button>` : `<div class="reward-badge">${badge}</div>`}
    </div>`;
  }).join('');
}

document.addEventListener('click', e => {
  const btn = e.target.closest('.reward-claim-btn');
  if (!btn) return;
  const rewardId = btn.dataset.reward;
  const claimed = getClaimedRewards();
  if (!claimed.includes(rewardId)) {
    claimed.push(rewardId);
    saveClaimedRewards(claimed);
    const reward = REWARDS.find(r => r.id === rewardId);
    alert(`🎉 Chúc mừng! Con đã đạt mốc "${reward.name}"!\n\n📸 Cho ba mẹ xem màn hình này để nhận quà thật nhé!`);
    renderRewards();
  }
});

// ===== QUIZ =====
const Q = { questions: [], qIndex: 0, current: 0, combo: 0, maxCombo: 0, earned: 0, correct: 0, incorrect: 0, timer: null, timeLeft: 0 };

document.getElementById('btn-play').addEventListener('click', startQuiz);

async function startQuiz() {
  Object.assign(Q, { qIndex: 0, current: 0, combo: 0, maxCombo: 0, earned: 0, correct: 0, incorrect: 0 });
  showScreen('quiz-screen');
  await fetchQuestions();
  showQuizQuestion();
}

async function fetchQuestions() {
  const grade = getPlayerGrade();
  const subjects = ['math','vietnamese','english'];
  const subject = subjects[Math.floor(Math.random() * subjects.length)];
  try {
    const res = await fetch(`/api/questions?subject=${subject}&difficulty=easy&limit=${QUIZ_TOTAL + 5}&grade=${grade}`);
    const data = await res.json();
    Q.questions = (Array.isArray(data) ? data : data.questions || []).sort(() => Math.random() - 0.5).slice(0, QUIZ_TOTAL);
  } catch { Q.questions = []; }
  if (!Q.questions.length) {
    Q.questions = [{ question_text: 'Không tải được câu hỏi', option_a: 'OK', option_b: '-', option_c: '-', option_d: '-', correct_answer: 'a' }];
  }
}

function showQuizQuestion() {
  if (Q.current >= QUIZ_TOTAL || Q.current >= Q.questions.length) { endQuiz(); return; }
  const q = Q.questions[Q.current];
  document.getElementById('quiz-question').textContent = q.question_text;
  document.getElementById('quiz-progress').textContent = `${Q.current + 1}/${QUIZ_TOTAL}`;
  document.getElementById('quiz-earned').textContent = Q.earned;
  document.getElementById('quiz-combo').textContent = Q.combo >= 2 ? `🔥x${Q.combo}` : '';
  const btns = document.querySelectorAll('.qa-btn');
  ['a','b','c','d'].forEach((o,i) => { btns[i].textContent = q[`option_${o}`]; btns[i].className = 'qa-btn'; btns[i].disabled = false; });
  document.getElementById('quiz-status').textContent = '';
  startTimer();
}

function startTimer() {
  stopTimer();
  Q.timeLeft = QUIZ_TIME;
  updateTimer();
  Q.timer = setInterval(() => {
    Q.timeLeft -= 0.1;
    updateTimer();
    if (Q.timeLeft <= 0) { stopTimer(); quizTimeout(); }
  }, 100);
}
function stopTimer() { if (Q.timer) { clearInterval(Q.timer); Q.timer = null; } }
function updateTimer() {
  const fill = document.getElementById('quiz-timer-fill');
  if (!fill) return;
  const pct = Math.max(0, (Q.timeLeft / QUIZ_TIME) * 100);
  fill.style.width = pct + '%';
  fill.classList.toggle('urgent', Q.timeLeft <= 3);
}

function quizTimeout() {
  const q = Q.questions[Q.current];
  document.querySelectorAll('.qa-btn').forEach(b => { b.disabled = true; b.classList.add('disabled'); });
  const cb = document.querySelector(`.qa-btn[data-opt="${q.correct_answer}"]`);
  if (cb) cb.classList.add('correct');
  Q.incorrect++; Q.combo = 0;
  document.getElementById('quiz-status').textContent = '⏱️ Hết giờ!';
  document.getElementById('quiz-combo').textContent = '';
  setTimeout(() => { Q.current++; showQuizQuestion(); }, 1000);
}

document.getElementById('quiz-answers').addEventListener('click', e => {
  const btn = e.target.closest('.qa-btn');
  if (!btn || btn.disabled) return;
  stopTimer();

  const q = Q.questions[Q.current];
  const selected = btn.dataset.opt;
  const correct = q.correct_answer;
  const isCorrect = selected.toLowerCase() === correct.toLowerCase();

  document.querySelectorAll('.qa-btn').forEach(b => { b.disabled = true; b.classList.add('disabled'); });

  if (isCorrect) {
    btn.classList.add('correct');
    Q.correct++; Q.combo++;
    if (Q.combo > Q.maxCombo) Q.maxCombo = Q.combo;
    const bonus = Q.combo >= 5 ? 3 : Q.combo >= 3 ? 2 : 1;
    const coins = COINS_PER_CORRECT * bonus;
    Q.earned += coins;
    document.getElementById('quiz-status').textContent = `✅ +${coins} xu!` + (Q.combo >= 3 ? ` 🔥x${Q.combo}` : '');
  } else {
    btn.classList.add('wrong');
    const cb = document.querySelector(`.qa-btn[data-opt="${correct}"]`);
    if (cb) cb.classList.add('correct');
    Q.incorrect++; Q.combo = 0;
    document.getElementById('quiz-status').textContent = '❌ Sai rồi!';
  }

  document.getElementById('quiz-earned').textContent = Q.earned;
  document.getElementById('quiz-combo').textContent = Q.combo >= 2 ? `🔥x${Q.combo}` : '';

  // Log answer
  logAnswer(q, selected, correct, isCorrect);
  setTimeout(() => { Q.current++; showQuizQuestion(); }, 1000);
});

function endQuiz() {
  stopTimer();
  zoo.coins += Q.earned;
  saveZoo(zoo);
  saveSession();

  // Check if any new animal unlocked by combo
  let unlocked = [];
  if (Q.maxCombo >= 10) {
    const epics = ANIMALS.filter(a => a.tier === 'epic' && !zoo.animals.includes(a.id));
    if (epics.length) { const a = epics[Math.floor(Math.random() * epics.length)]; unlocked.push(a); zoo.animals.push(a.id); saveZoo(zoo); }
  } else if (Q.maxCombo >= 5) {
    const rares = ANIMALS.filter(a => a.tier === 'rare' && !zoo.animals.includes(a.id));
    if (rares.length) { const a = rares[Math.floor(Math.random() * rares.length)]; unlocked.push(a); zoo.animals.push(a.id); saveZoo(zoo); }
  }

  const stars = Q.correct >= 9 ? 3 : Q.correct >= 7 ? 2 : Q.correct >= 4 ? 1 : 0;

  document.getElementById('qr-container').innerHTML = `
    <div class="qr-title">📝 Kết quả Quiz!</div>
    <div class="qr-coins">+${Q.earned} 💰</div>
    <div class="qr-stats">
      <div class="qr-stat"><span>✅ Đúng</span><strong>${Q.correct}/${QUIZ_TOTAL}</strong></div>
      <div class="qr-stat"><span>🔥 Combo cao nhất</span><strong>x${Q.maxCombo}</strong></div>
      <div class="qr-stat"><span>⭐ Sao</span><strong>${'⭐'.repeat(stars) || '—'}</strong></div>
      <div class="qr-stat"><span>💰 Tổng xu</span><strong>${zoo.coins}</strong></div>
    </div>
    ${unlocked.length ? `<div class="qr-unlock"><div class="qr-unlock-title">🎉 Mở khóa thú mới!</div><div class="qr-unlock-animals">${unlocked.map(a => a.emoji).join(' ')}</div></div>` : ''}
    <div class="qr-btns">
      <button class="qr-btn primary" onclick="showScreen('zoo-screen');renderZoo();">🦁 Về Vườn Thú</button>
      <button class="qr-btn secondary" onclick="startQuiz()">🔄 Chơi tiếp</button>
    </div>`;
  showScreen('quiz-result-screen');

  if (window.checkAndShowPrompt && getPlayerId()) window.checkAndShowPrompt(getPlayerId());
}

// ===== SESSION =====
async function saveSession() {
  const playerId = getPlayerId(); if (!playerId) return;
  const stars = Q.correct >= 9 ? 3 : Q.correct >= 7 ? 2 : 1;
  try { await fetch('/api/sessions', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ player_id: playerId, subject: 'math', difficulty: 'easy', score: Q.earned, total_questions: QUIZ_TOTAL, correct_answers: Q.correct, stars_earned: stars, combo_max: Q.maxCombo }) }); } catch {}
}

async function logAnswer(q, selected, correct, isCorrect) {
  const playerId = getPlayerId(); if (!playerId) return;
  try { await fetch('/api/answers', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ session_id: 0, player_id: playerId, question_id: q.id||0, selected_answer: selected, correct_answer: correct, is_correct: isCorrect?1:0, time_spent_ms: Math.round((QUIZ_TIME-Q.timeLeft)*1000), difficulty: 'easy', combo_streak: Q.combo }) }); } catch {}
}

// ===== INIT =====
renderZoo();

// ===== CHARACTER SYSTEM INTEGRATION (presentation only) =====
// Mounts animated chibi sprites over the zoo-grid animal cells for the species
// that have a registered sprite (lion / elephant / monkey / panda). Every other
// animal keeps its original emoji. The collection logic in game.js is untouched —
// this only swaps how matching cells are *drawn*.
(function () {
  'use strict';

  const SPRITE_IDS = ['lion', 'elephant', 'monkey', 'panda'];
  const mounted = [];
  let prevAnimalCount = (function () {
    try { return (JSON.parse(localStorage.getItem('v15_zoo')) || {}).animals?.length || 0; } catch { return 0; }
  })();

  function clearMounted() {
    while (mounted.length) {
      const c = mounted.pop();
      try { c.destroy(); } catch (e) {}
    }
  }

  // After renderZoo() paints the grid, upgrade matching cells to live sprites.
  function decorateZoo() {
    const C = window.HocVuiCharacters;
    if (!C) return;
    clearMounted();
    document.querySelectorAll('#zoo-grid .zoo-cell.has-animal').forEach(cell => {
      const span = cell.querySelector('.cell-animal');
      if (!span) return;
      const slot = parseInt(cell.dataset.slot, 10);
      const id = (typeof zoo !== 'undefined' && zoo.animals) ? zoo.animals[slot] : null;
      if (!id || SPRITE_IDS.indexOf(id) === -1 || !C.hasSpecies(id)) return;
      span.textContent = '';
      span.classList.add('cell-sprite-host');
      const char = C.createCharacter(id, span, { state: 'idle' });
      mounted.push(char);
    });
  }

  // Wrap renderZoo non-invasively: run the original, then decorate + celebrate.
  if (typeof renderZoo === 'function') {
    const origRender = renderZoo;
    renderZoo = function () {
      const r = origRender.apply(this, arguments);
      decorateZoo();
      // If the collection just grew, give the newest sprite a happy bounce + confetti.
      const count = (typeof zoo !== 'undefined' && zoo.animals) ? zoo.animals.length : 0;
      if (count > prevAnimalCount && mounted.length) {
        const last = mounted[mounted.length - 1];
        try {
          last.setState('happy');
          spawnParticles(last.root, 'confetti', 10);
          setTimeout(() => { try { last.setState('idle'); } catch (e) {} }, 700);
        } catch (e) {}
      }
      prevAnimalCount = count;
      return r;
    };
    // Initial paint already ran at load (renderZoo() at end of game.js), so
    // decorate the current grid once now.
    decorateZoo();
  }

  // Particle helper — sparkle / confetti bursts around a host element.
  function spawnParticles(parent, kind, count) {
    if (!parent) return;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'pfx pfx-' + kind;
      p.style.setProperty('--tx', (Math.random() * 80 - 40) + 'px');
      p.style.setProperty('--ty', -(Math.random() * 50 + 20) + 'px');
      p.style.setProperty('--delay', (Math.random() * 0.2) + 's');
      parent.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
  }
  window.__v15_spawnParticles = spawnParticles;

  // Sparkle burst on a correct quiz answer (listener runs after the game.js one).
  const answers = document.getElementById('quiz-answers');
  if (answers) {
    answers.addEventListener('click', e => {
      const btn = e.target.closest('.qa-btn');
      if (!btn) return;
      // game.js marks the chosen/correct button; sparkle when it ends up correct.
      setTimeout(() => {
        if (btn.classList.contains('correct')) {
          spawnParticles(btn, 'sparkle', 8);
        }
      }, 0);
    });
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
        // Stop the quiz timer before leaving.
        try { if (typeof stopTimer === 'function') stopTimer(); } catch (e) {}
        try { if (typeof Q !== 'undefined' && Q.timer) { clearInterval(Q.timer); Q.timer = null; } } catch (e) {}
        window.location.reload();
      });
      exit.addEventListener('click', e => { if (e.target === exit) exit.style.display = 'none'; });
    }
  });
})();
