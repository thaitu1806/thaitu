// V14 Giải Cứu Hành Tinh - Planet Rescue
// Boss battles, map progression, rescue citizens!

const ZONES = [
  { id: 'forest', name: 'Rừng Xanh', icon: '🌲', bg: 'linear-gradient(180deg,#1a4a2e,#0d2818)', boss: '🦠', bossName: 'Virus Rêu', citizens: ['🐰','🐿️','🦊'], bossHP: 3 },
  { id: 'desert', name: 'Sa Mạc Nóng', icon: '🏜️', bg: 'linear-gradient(180deg,#8b5e3c,#4a2c17)', boss: '🔥', bossName: 'Virus Lửa', citizens: ['🐪','🦎','🦅'], bossHP: 3 },
  { id: 'snow', name: 'Vùng Tuyết', icon: '❄️', bg: 'linear-gradient(180deg,#4a6fa5,#2a3f6f)', boss: '💀', bossName: 'Virus Băng', citizens: ['🐧','🐻‍❄️','🦌'], bossHP: 4 },
  { id: 'cave', name: 'Hang Động', icon: '⛰️', bg: 'linear-gradient(180deg,#3d2b1f,#1a1008)', boss: '🕷️', bossName: 'Virus Bóng Tối', citizens: ['🦇','🐉','🦉'], bossHP: 4 },
  { id: 'castle', name: 'Lâu Đài Cuối', icon: '👾', bg: 'linear-gradient(180deg,#2d0a4e,#0f0020)', boss: '👾', bossName: 'Boss Cuối Cùng', citizens: ['🐱','🐶','🐼'], bossHP: 5 },
];

const STORIES = [
  'Hành tinh đang gặp nguy! Virus Ngu Dốt đang tấn công khắp nơi...',
  '🌲 Rừng Xanh đã an toàn! Nhưng Sa Mạc vẫn nguy hiểm...',
  '🏜️ Sa Mạc đã được giải phóng! Phía trước là Vùng Tuyết lạnh giá...',
  '❄️ Vùng Tuyết ấm lại rồi! Hang Động tối tăm đang chờ...',
  '⛰️ Hang Động sáng trở lại! Chỉ còn Lâu Đài Boss Cuối...',
  '🎉 HÀNH TINH ĐÃ ĐƯỢC CỨU! Con giỏi quá!'
];

const QUESTIONS_PER_ZONE = 5;
const QUESTION_TIME = 12;

// ===== STATE =====
const S = {
  config: { subject: 'math', difficulty: 'easy' },
  currentZone: 0, questionInZone: 0, isBoss: false,
  bossHP: 0, bossMaxHP: 0, bossCombo: 0,
  shield: 0, combo: 0, score: 0,
  correct: 0, incorrect: 0, rescued: [],
  questions: [], qIndex: 0,
  zonesCleared: [], gameOver: false,
  questionTimer: null, questionTimeLeft: 0,
};

function getPlayerId() { try { return JSON.parse(localStorage.getItem('hocvui_profile'))?.id; } catch { return null; } }
function getPlayerGrade() { try { return JSON.parse(localStorage.getItem('hocvui_profile'))?.grade || 2; } catch { return 2; } }
function getTotalRescued() { try { return JSON.parse(localStorage.getItem('v14_rescued') || '[]').length; } catch { return 0; } }
function saveRescued(arr) { localStorage.setItem('v14_rescued', JSON.stringify(arr)); }
function getAllRescued() { try { return JSON.parse(localStorage.getItem('v14_rescued') || '[]'); } catch { return []; } }

// ===== SCREENS =====
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ===== SETUP =====
document.getElementById('total-rescued').textContent = getTotalRescued();

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

// ===== START GAME =====
async function startGame() {
  Object.assign(S, { currentZone: 0, questionInZone: 0, isBoss: false, bossHP: 0, bossMaxHP: 0, bossCombo: 0, shield: 0, combo: 0, score: 0, correct: 0, incorrect: 0, rescued: [], qIndex: 0, zonesCleared: [], gameOver: false });
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
  if (!S.questions.length) {
    S.questions = [{ question_text: 'Không tải được câu hỏi', option_a: 'OK', option_b: '-', option_c: '-', option_d: '-', correct_answer: 'a' }];
  }
}

// ===== MAP =====
function showMap() {
  showScreen('map-screen');
  document.getElementById('map-rescued').textContent = S.rescued.length;
  const container = document.getElementById('map-zones');
  container.innerHTML = ZONES.map((z, i) => {
    const cleared = S.zonesCleared.includes(i);
    const unlocked = i === 0 || S.zonesCleared.includes(i - 1);
    const status = cleared ? '✅ Đã giải phóng' : unlocked ? '⚔️ Sẵn sàng chiến đấu!' : '🔒 Chưa mở';
    const cls = cleared ? 'cleared' : unlocked ? 'unlocked' : 'locked';
    return `<div class="map-zone ${cls}" data-zone="${i}">
      <div class="zone-icon">${z.icon}</div>
      <div class="zone-info"><div class="zone-name">${z.name}</div><div class="zone-status">${status}</div></div>
      <div class="zone-badge">${cleared ? '⭐' : unlocked ? '▶️' : '🔒'}</div>
    </div>`;
  }).join('');
  document.getElementById('map-story').textContent = STORIES[S.zonesCleared.length] || '';
}

document.getElementById('map-zones').addEventListener('click', e => {
  const zone = e.target.closest('.map-zone');
  if (!zone || zone.classList.contains('locked')) return;
  const idx = parseInt(zone.dataset.zone);
  if (S.zonesCleared.includes(idx)) return; // already cleared
  S.currentZone = idx;
  S.questionInZone = 0;
  S.isBoss = false;
  startZoneBattle();
});

// ===== BATTLE =====
function startZoneBattle() {
  showScreen('battle-screen');
  const zone = ZONES[S.currentZone];
  const bg = document.getElementById('battle-bg');
  bg.style.background = zone.bg;
  bg.querySelectorAll('.battle-particle').forEach(p => p.remove());
  spawnBattleParticles();
  document.getElementById('hud-zone').textContent = `${zone.icon} ${zone.name}`;
  updateBattleHUD();
  showBattleEnemy(false);
  nextBattleQuestion();
}

function showBattleEnemy(isBoss) {
  const zone = ZONES[S.currentZone];
  const enemyEl = document.getElementById('enemy');
  const labelEl = document.getElementById('enemy-label');
  const hpFill = document.getElementById('enemy-hp-fill');

  if (isBoss) {
    enemyEl.textContent = zone.boss;
    enemyEl.style.fontSize = '4.5rem';
    labelEl.textContent = zone.bossName;
    S.bossMaxHP = zone.bossHP;
    S.bossHP = zone.bossHP;
    S.bossCombo = 0;
    hpFill.style.width = '100%';
    document.querySelector('.enemy-hp-bar').style.display = '';
  } else {
    enemyEl.textContent = '🦠';
    enemyEl.style.fontSize = '3.5rem';
    labelEl.textContent = `Virus ${S.questionInZone + 1}/${QUESTIONS_PER_ZONE}`;
    document.querySelector('.enemy-hp-bar').style.display = 'none';
  }
}

function updateBattleHUD() {
  document.getElementById('hud-progress').textContent = S.isBoss ? `BOSS` : `${S.questionInZone + 1}/${QUESTIONS_PER_ZONE}`;
  document.getElementById('hud-shield').textContent = S.shield > 0 ? '🛡️'.repeat(S.shield) : '';
}

function nextBattleQuestion() {
  if (S.qIndex >= S.questions.length) { S.qIndex = 0; S.questions.sort(() => Math.random() - 0.5); }
  const q = S.questions[S.qIndex];
  document.getElementById('bq-text').textContent = q.question_text;
  const btns = document.querySelectorAll('.bq-btn');
  ['a','b','c','d'].forEach((o,i) => { btns[i].textContent = q[`option_${o}`]; btns[i].className = 'bq-btn'; btns[i].disabled = false; });
  document.getElementById('bq-status').textContent = '';
  document.getElementById('bq-status').className = 'bq-status';
  startQuestionTimer();
}

// ===== QUESTION TIMER =====
function startQuestionTimer() {
  stopQuestionTimer();
  S.questionTimeLeft = QUESTION_TIME;
  updateTimerBar();
  S.questionTimer = setInterval(() => {
    S.questionTimeLeft -= 0.1;
    updateTimerBar();
    if (S.questionTimeLeft <= 0) { stopQuestionTimer(); handleTimeout(); }
  }, 100);
}
function stopQuestionTimer() { if (S.questionTimer) { clearInterval(S.questionTimer); S.questionTimer = null; } }
function updateTimerBar() {
  const fill = document.getElementById('bq-timer-fill');
  if (!fill) return;
  const pct = Math.max(0, (S.questionTimeLeft / QUESTION_TIME) * 100);
  fill.style.width = pct + '%';
  fill.classList.toggle('urgent', S.questionTimeLeft <= 3);
}

function handleTimeout() {
  const q = S.questions[S.qIndex];
  document.querySelectorAll('.bq-btn').forEach(b => { b.disabled = true; b.classList.add('disabled'); });
  const correctBtn = document.querySelector(`.bq-btn[data-opt="${q.correct_answer}"]`);
  if (correctBtn) correctBtn.classList.add('correct');
  document.getElementById('bq-status').textContent = '⏱️ Hết giờ!';
  document.getElementById('bq-status').className = 'bq-status bad';
  handleWrongAnswer(q);
}

// ===== ANSWER HANDLING =====
document.getElementById('bq-answers').addEventListener('click', e => {
  const btn = e.target.closest('.bq-btn');
  if (!btn || btn.disabled || S.gameOver) return;
  stopQuestionTimer();

  const selected = btn.dataset.opt;
  const q = S.questions[S.qIndex];
  const correct = q.correct_answer;
  const isCorrect = selected.toLowerCase() === correct.toLowerCase();

  document.querySelectorAll('.bq-btn').forEach(b => { b.disabled = true; b.classList.add('disabled'); });

  if (isCorrect) {
    btn.classList.add('correct');
    handleCorrectAnswer(q);
  } else {
    btn.classList.add('wrong');
    const correctBtn = document.querySelector(`.bq-btn[data-opt="${correct}"]`);
    if (correctBtn) correctBtn.classList.add('correct');
    handleWrongAnswer(q);
  }
  logAnswer(q, selected, correct, isCorrect);
});

function handleCorrectAnswer(q) {
  S.correct++; S.combo++;
  S.score += 10;
  const st = document.getElementById('bq-status');

  // Quick answer bonus
  const quick = S.questionTimeLeft > (QUESTION_TIME - 5);

  // Hero attack animation
  const hero = document.getElementById('hero');
  hero.classList.add('attack');
  setTimeout(() => hero.classList.remove('attack'), 500);

  // Show effect
  showHeroEffect(quick ? '💥x2' : '💫');

  if (S.isBoss) {
    const dmg = quick ? 2 : 1;
    S.bossHP = Math.max(0, S.bossHP - dmg);
    S.bossCombo++;
    document.getElementById('enemy-hp-fill').style.width = (S.bossHP / S.bossMaxHP * 100) + '%';

    const enemy = document.getElementById('enemy');
    enemy.classList.remove('hit');
    void enemy.offsetHeight;
    enemy.classList.add('hit');
    setTimeout(() => enemy.classList.remove('hit'), 500);

    // Damage number
    showDamageNumber(quick ? '-2 💥' : '-1', quick ? 'crit' : '');
    screenShake();

    st.textContent = quick ? '💥 Critical! -2HP!' : '✅ Trúng! -1HP!';
    st.className = 'bq-status good';

    if (S.bossHP <= 0) {
      enemy.classList.add('defeated');
      victoryFlash();
      setTimeout(() => { enemy.classList.remove('defeated'); bossDefeated(); }, 1200);
      return;
    }
  } else {
    st.textContent = S.combo >= 3 ? `✅ Combo x${S.combo}! 🛡️+1` : '✅ Đúng rồi!';
    st.className = 'bq-status good';
    showDamageNumber('✓', '');
    // Combo shield
    if (S.combo >= 3 && S.combo % 3 === 0) { S.shield = Math.min(S.shield + 1, 3); }
  }

  updateBattleHUD();
  setTimeout(() => advanceBattle(), 1000);
}

function handleWrongAnswer(q) {
  S.incorrect++; S.combo = 0;
  const st = document.getElementById('bq-status');

  if (S.shield > 0) {
    S.shield--;
    st.textContent = '🛡️ Shield hấp thụ! An toàn!';
    st.className = 'bq-status';
    showHeroEffect('🛡️');
    showDamageNumber('🛡️ Block!', '');
  } else if (S.isBoss) {
    S.bossHP = Math.min(S.bossMaxHP, S.bossHP + 1);
    S.bossCombo = 0;
    document.getElementById('enemy-hp-fill').style.width = (S.bossHP / S.bossMaxHP * 100) + '%';
    const enemy = document.getElementById('enemy');
    enemy.classList.remove('heal');
    void enemy.offsetHeight;
    enemy.classList.add('heal');
    setTimeout(() => enemy.classList.remove('heal'), 600);
    showDamageNumber('+1 HP', 'heal');
    screenShake();
    st.textContent = '❌ Sai! Boss hồi +1HP!';
    st.className = 'bq-status bad';
  } else {
    st.textContent = '❌ Sai rồi! Cố lên!';
    st.className = 'bq-status bad';
    screenShake();
  }

  updateBattleHUD();
  setTimeout(() => advanceBattle(), 1000);
}

function showHeroEffect(text) {
  const el = document.getElementById('hero-effect');
  el.textContent = text;
  el.classList.remove('show');
  void el.offsetHeight;
  el.classList.add('show');
}

// Spawn floating particles in battle background
function spawnBattleParticles() {
  const bg = document.getElementById('battle-bg');
  if (!bg) return;
  for (let i = 0; i < 12; i++) {
    const p = document.createElement('div');
    p.className = 'battle-particle';
    const size = 3 + Math.random() * 8;
    const zone = ZONES[S.currentZone];
    const colors = ['rgba(255,255,255,0.15)', 'rgba(124,58,237,0.2)', 'rgba(255,200,0,0.1)'];
    Object.assign(p.style, {
      width: size + 'px', height: size + 'px',
      left: Math.random() * 100 + '%',
      background: colors[Math.floor(Math.random() * colors.length)],
      animationDuration: (6 + Math.random() * 8) + 's',
      animationDelay: Math.random() * 5 + 's'
    });
    bg.appendChild(p);
  }
}

// Floating damage/heal number
function showDamageNumber(text, type) {
  const arena = document.querySelector('.battle-arena');
  if (!arena) return;
  const el = document.createElement('div');
  el.className = 'damage-number ' + (type || '');
  el.textContent = text;
  arena.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

// Screen shake effect
function screenShake() {
  const screen = document.getElementById('battle-screen');
  if (!screen) return;
  screen.classList.remove('screen-shake');
  void screen.offsetHeight;
  screen.classList.add('screen-shake');
  setTimeout(() => screen.classList.remove('screen-shake'), 400);
}

// Victory flash
function victoryFlash() {
  const screen = document.getElementById('battle-screen');
  if (!screen) return;
  const flash = document.createElement('div');
  flash.className = 'victory-flash';
  screen.appendChild(flash);
  setTimeout(() => flash.remove(), 600);
}

// ===== BATTLE FLOW =====
function advanceBattle() {
  S.qIndex++;
  if (S.isBoss) {
    // Boss still alive, next question
    nextBattleQuestion();
  } else {
    S.questionInZone++;
    if (S.questionInZone >= QUESTIONS_PER_ZONE) {
      // Time for boss!
      triggerBoss();
    } else {
      document.getElementById('enemy-label').textContent = `Virus ${S.questionInZone + 1}/${QUESTIONS_PER_ZONE}`;
      updateBattleHUD();
      nextBattleQuestion();
    }
  }
}

function triggerBoss() {
  S.isBoss = true;
  showScreen('boss-screen');
  const zone = ZONES[S.currentZone];
  document.getElementById('boss-bg').style.background = zone.bg;
  document.getElementById('boss-emoji').textContent = zone.boss;
  document.getElementById('boss-name').textContent = zone.bossName + ' xuất hiện!';

  // After intro, go to battle
  setTimeout(() => {
    showScreen('battle-screen');
    showBattleEnemy(true);
    updateBattleHUD();
    nextBattleQuestion();
  }, 2000);
}

function bossDefeated() {
  // Rescue citizens!
  const zone = ZONES[S.currentZone];
  zone.citizens.forEach(c => { if (!S.rescued.includes(c)) S.rescued.push(c); });
  S.zonesCleared.push(S.currentZone);
  S.isBoss = false;

  // Check if all zones cleared
  if (S.zonesCleared.length >= ZONES.length) {
    endGame(true);
  } else {
    // Back to map
    setTimeout(() => showMap(), 500);
  }
}

// ===== END GAME =====
function endGame(won) {
  S.gameOver = true;
  stopQuestionTimer();

  // Save rescued
  const all = getAllRescued();
  S.rescued.forEach(c => { if (!all.includes(c)) all.push(c); });
  saveRescued(all);
  saveSession();

  const stars = S.zonesCleared.length >= 5 ? 3 : S.zonesCleared.length >= 3 ? 2 : S.zonesCleared.length >= 1 ? 1 : 0;
  const title = won ? '🎉 HÀNH TINH ĐÃ ĐƯỢC CỨU!' : `⚔️ Đã giải phóng ${S.zonesCleared.length}/5 vùng!`;

  document.getElementById('result-container').innerHTML = `
    <div class="result-title">${title}</div>
    <div class="result-rescued">${S.rescued.join(' ') || '—'}</div>
    <div class="result-stats">
      <div class="result-stat"><span>✅ Câu đúng</span><strong>${S.correct}</strong></div>
      <div class="result-stat"><span>❌ Câu sai</span><strong>${S.incorrect}</strong></div>
      <div class="result-stat"><span>🗺️ Vùng đất</span><strong>${S.zonesCleared.length}/5</strong></div>
      <div class="result-stat"><span>🐰 Cư dân cứu</span><strong>${S.rescued.length}</strong></div>
      <div class="result-stat"><span>⭐ Sao</span><strong>${'⭐'.repeat(stars) || '—'}</strong></div>
      <div class="result-stat"><span>🐚 Tổng đã cứu</span><strong>${all.length}/15</strong></div>
    </div>
    <div class="result-btns">
      <button class="result-btn primary" onclick="location.reload()">🔄 Chơi lại</button>
      <button class="result-btn secondary" onclick="location.href='/'">🏠 Trang chủ</button>
    </div>`;
  showScreen('result-screen');
  if (window.checkAndShowPrompt && getPlayerId()) window.checkAndShowPrompt(getPlayerId());
}

// ===== SESSION =====
async function saveSession() {
  const playerId = getPlayerId(); if (!playerId) return;
  const stars = S.zonesCleared.length >= 5 ? 3 : S.zonesCleared.length >= 3 ? 2 : 1;
  try { await fetch('/api/sessions', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ player_id: playerId, subject: S.config.subject === 'mix' ? 'math' : S.config.subject, difficulty: S.config.difficulty, score: S.score, total_questions: S.correct + S.incorrect, correct_answers: S.correct, stars_earned: stars, combo_max: S.combo }) }); } catch {}
}

async function logAnswer(q, selected, correct, isCorrect) {
  const playerId = getPlayerId(); if (!playerId) return;
  try { await fetch('/api/answers', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ session_id: 0, player_id: playerId, question_id: q.id||0, selected_answer: selected, correct_answer: correct, is_correct: isCorrect?1:0, time_spent_ms: Math.round((QUESTION_TIME - S.questionTimeLeft)*1000), difficulty: S.config.difficulty, combo_streak: S.combo }) }); } catch {}
}

// ===== CHARACTER SYSTEM INTEGRATION (presentation only) =====
(function () {
  'use strict';
  let heroChar = null;
  let enemyChar = null;

  function mountHero() {
    const host = document.getElementById('hero');
    if (!host) return;
    host.innerHTML = '';
    heroChar = null;
    const C = window.HocVuiCharacters;
    if (C && C.hasSpecies('rescuer_hero')) {
      heroChar = C.createCharacter('rescuer_hero', host, { state: 'idle', size: 92 });
    } else {
      host.textContent = '🚀';
    }
  }

  function mountEnemy() {
    const host = document.getElementById('enemy');
    if (!host) return;
    host.innerHTML = '';
    enemyChar = null;
    const C = window.HocVuiCharacters;
    if (C && C.hasSpecies('rescuer_germ')) {
      enemyChar = C.createCharacter('rescuer_germ', host, { state: 'idle', size: 84 });
    } else {
      host.textContent = '🦠';
    }
  }

  // Particle helper — sparkle/confetti burst around an element.
  function spawnParticles(parent, kind, count) {
    if (!parent) return;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'pfx pfx-' + kind;
      p.style.setProperty('--tx', (Math.random() * 80 - 40) + 'px');
      p.style.setProperty('--ty', -(Math.random() * 50 + 25) + 'px');
      p.style.setProperty('--delay', (Math.random() * 0.2) + 's');
      if (kind === 'confetti') {
        const colors = ['#7c3aed', '#22d3ee', '#fbbf24', '#4ade80', '#f472b6'];
        p.style.background = colors[Math.floor(Math.random() * colors.length)];
      }
      parent.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
  }
  window.__v14_spawnParticles = spawnParticles;

  // Wrap startZoneBattle to mount the hero astronaut on every battle start.
  if (typeof startZoneBattle === 'function') {
    const origStart = startZoneBattle;
    startZoneBattle = function () {
      const r = origStart.apply(this, arguments);
      mountHero();
      return r;
    };
  }

  // Wrap showBattleEnemy to mount the alien sprite for regular virus rounds.
  // Boss rounds keep their zone-specific emoji (set by the original function).
  if (typeof showBattleEnemy === 'function') {
    const origEnemy = showBattleEnemy;
    showBattleEnemy = function (isBoss) {
      const r = origEnemy.apply(this, arguments);
      if (!isBoss) mountEnemy();
      else { enemyChar = null; } // emoji boss; original set textContent
      return r;
    };
  }

  // Wrap handleCorrectAnswer to celebrate on the hero sprite.
  if (typeof handleCorrectAnswer === 'function') {
    const origCorrect = handleCorrectAnswer;
    handleCorrectAnswer = function () {
      const r = origCorrect.apply(this, arguments);
      if (heroChar) {
        heroChar.setState('happy');
        setTimeout(() => { if (heroChar) heroChar.setState('idle'); }, 650);
      }
      const host = document.getElementById('hero');
      if (host) spawnParticles(host, 'sparkle', 7);
      return r;
    };
  }

  // Wrap bossDefeated to throw confetti when citizens are rescued.
  if (typeof bossDefeated === 'function') {
    const origBoss = bossDefeated;
    bossDefeated = function () {
      if (heroChar) {
        heroChar.setState('happy');
        setTimeout(() => { if (heroChar) heroChar.setState('idle'); }, 800);
      }
      const host = document.getElementById('hero');
      if (host) spawnParticles(host, 'confetti', 16);
      return origBoss.apply(this, arguments);
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
      $('btn-guide-close').addEventListener('click', () => { guide.style.display = 'none'; });
      guide.addEventListener('click', e => { if (e.target === guide) guide.style.display = 'none'; });
    }
    const exit = $('exit-modal');
    const exitBtn = $('btn-exit');
    if (exit && exitBtn) {
      exitBtn.addEventListener('click', () => { exit.style.display = 'flex'; });
      $('btn-exit-cancel').addEventListener('click', () => { exit.style.display = 'none'; });
      $('btn-exit-confirm').addEventListener('click', () => {
        exit.style.display = 'none';
        // Stop timers/loops before leaving.
        try { stopQuestionTimer(); } catch (e) {}
        S.gameOver = true;
        window.location.reload();
      });
      exit.addEventListener('click', e => { if (e.target === exit) exit.style.display = 'none'; });
    }
  });
})();
