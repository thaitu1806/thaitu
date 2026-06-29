(function() {
  'use strict';

  // ===== CONSTANTS =====
  const FLOORS = 5;
  const FIRES_PER_FLOOR = 3;
  const MAX_FIRES = 20;
  const TIMER_SECONDS = 10;
  const TOTAL_INITIAL_FIRES = FLOORS * FIRES_PER_FLOOR; // 15

  // ===== STATE =====
  const S = {
    config: { subject: 'math', difficulty: 'easy' },
    floors: [], // array of { fires: number, rescued: boolean }
    totalFires: 0,
    rescued: 0,
    questions: [],
    qIndex: 0,
    correct: 0,
    incorrect: 0,
    combo: 0,
    comboMax: 0,
    gameOver: false,
    timer: null,
    timeLeft: TIMER_SECONDS,
    currentFloor: 1, // floor being targeted (1-5)
    answers: []
  };

  // ===== HELPERS =====
  function getProfile() {
    try { return JSON.parse(localStorage.getItem('hocvui_profile')); } catch { return null; }
  }
  function getPlayerId() { return getProfile()?.id || null; }
  function getPlayerGrade() { return getProfile()?.grade ?? 2; }

  // ===== SCREENS =====
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  // ===== SETUP =====
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

  // ===== GAME START =====
  async function startGame() {
    // Reset state
    S.floors = [];
    for (let i = 0; i < FLOORS; i++) {
      S.floors.push({ fires: FIRES_PER_FLOOR, rescued: false });
    }
    S.totalFires = TOTAL_INITIAL_FIRES;
    S.rescued = 0;
    S.qIndex = 0;
    S.correct = 0;
    S.incorrect = 0;
    S.combo = 0;
    S.comboMax = 0;
    S.gameOver = false;
    S.currentFloor = 1;
    S.answers = [];

    showScreen('game-screen');
    renderBuilding();
    updateHUD();
    await fetchQuestions();
    showQuestion();
  }

  async function fetchQuestions() {
    const grade = getPlayerGrade();
    let subject = S.config.subject;
    if (subject === 'mix') subject = ['math', 'vietnamese', 'english'][Math.floor(Math.random() * 3)];
    try {
      const res = await fetch(`/api/questions?subject=${subject}&difficulty=${S.config.difficulty}&limit=30&grade=${grade}`);
      const data = await res.json();
      S.questions = (Array.isArray(data) ? data : data.questions || []).sort(() => Math.random() - 0.5);
    } catch { S.questions = []; }
    if (!S.questions.length) {
      S.questions = [{ question_text: 'Không tải được câu hỏi', option_a: 'Thử lại', option_b: '-', option_c: '-', option_d: '-', correct_answer: 'a', id: 0 }];
    }
  }

  // ===== BUILDING RENDER =====
  function renderBuilding() {
    for (let f = 1; f <= FLOORS; f++) {
      renderFloorFires(f);
      renderFloorPerson(f);
    }
    updateBuildingShake();
    highlightCurrentFloor();
  }

  function renderFloorFires(floorNum) {
    const floorData = S.floors[floorNum - 1];
    const container = document.getElementById(`fires-${floorNum}`);
    container.innerHTML = '';
    for (let i = 0; i < floorData.fires; i++) {
      const span = document.createElement('span');
      span.className = 'fire-emoji';
      span.textContent = '🔥';
      container.appendChild(span);
    }
  }

  function renderFloorPerson(floorNum) {
    const floorData = S.floors[floorNum - 1];
    const personEl = document.getElementById(`person-${floorNum}`);
    const floorEl = personEl.closest('.floor');

    if (floorData.rescued) {
      personEl.textContent = '✅';
      floorEl.classList.add('cleared');
    } else if (floorData.fires === 0) {
      // About to be rescued
      personEl.textContent = '👤';
      floorEl.classList.remove('cleared');
    } else {
      personEl.textContent = '👤';
      floorEl.classList.remove('cleared');
    }
  }

  function highlightCurrentFloor() {
    document.querySelectorAll('.floor').forEach(el => el.style.outline = 'none');
    // Find current target floor (first non-rescued with fires, or first non-rescued)
    const targetFloor = findTargetFloor();
    if (targetFloor > 0) {
      S.currentFloor = targetFloor;
      const floorEl = document.querySelector(`.floor[data-floor="${targetFloor}"]`);
      if (floorEl) floorEl.style.outline = '2px solid #ffeb3b';
    }
  }

  function findTargetFloor() {
    // Prioritize floors with fires, bottom to top
    for (let f = 1; f <= FLOORS; f++) {
      if (S.floors[f - 1].fires > 0 && !S.floors[f - 1].rescued) return f;
    }
    return 0;
  }

  function updateBuildingShake() {
    const building = document.getElementById('building');
    building.classList.remove('shake-1', 'shake-2', 'shake-3', 'collapsed');

    if (S.totalFires >= 17) {
      building.classList.add('shake-3');
    } else if (S.totalFires >= 13) {
      building.classList.add('shake-2');
    } else if (S.totalFires >= 8) {
      building.classList.add('shake-1');
    }
  }

  // ===== HUD =====
  function updateHUD() {
    document.getElementById('fire-count').textContent = S.totalFires;
    document.getElementById('rescued-count').textContent = S.rescued;
  }

  // ===== TIMER =====
  function startTimer() {
    stopTimer();
    S.timeLeft = TIMER_SECONDS;
    updateTimerDisplay();
    S.timer = setInterval(() => {
      S.timeLeft -= 0.1;
      updateTimerDisplay();
      if (S.timeLeft <= 0) {
        stopTimer();
        handleTimeout();
      }
    }, 100);
  }

  function stopTimer() {
    if (S.timer) { clearInterval(S.timer); S.timer = null; }
  }

  function updateTimerDisplay() {
    const timerEl = document.getElementById('timer-text');
    const displayEl = document.querySelector('.timer-display');
    const secs = Math.max(0, Math.ceil(S.timeLeft));
    timerEl.textContent = secs;
    if (S.timeLeft <= 3) {
      displayEl.classList.add('urgent');
    } else {
      displayEl.classList.remove('urgent');
    }
  }

  // ===== QUESTION =====
  function showQuestion() {
    if (S.gameOver) return;
    if (S.qIndex >= S.questions.length) {
      S.qIndex = 0;
      S.questions.sort(() => Math.random() - 0.5);
    }

    const q = S.questions[S.qIndex];
    document.getElementById('question-text').textContent = q.question_text;
    const btns = document.querySelectorAll('#answer-grid .ans-btn');
    ['a', 'b', 'c', 'd'].forEach((opt, i) => {
      btns[i].textContent = q[`option_${opt}`];
      btns[i].className = 'ans-btn';
      btns[i].disabled = false;
    });

    startTimer();
  }

  // ===== ANSWER HANDLING =====
  document.getElementById('answer-grid').addEventListener('click', e => {
    const btn = e.target.closest('.ans-btn');
    if (!btn || btn.disabled || S.gameOver) return;

    const selected = btn.dataset.opt;
    const q = S.questions[S.qIndex];
    const correct = q.correct_answer;
    const isCorrect = selected.toLowerCase() === correct.toLowerCase();

    stopTimer();
    document.querySelectorAll('#answer-grid .ans-btn').forEach(b => { b.disabled = true; });

    if (isCorrect) {
      btn.classList.add('correct');
      handleCorrect();
    } else {
      btn.classList.add('wrong');
      document.querySelector(`#answer-grid .ans-btn[data-opt="${correct}"]`).classList.add('correct');
      handleWrong();
    }

    logAnswer(q, selected, correct, isCorrect);

    setTimeout(() => {
      if (!S.gameOver) {
        S.qIndex++;
        showQuestion();
      }
    }, 1200);
  });

  function handleTimeout() {
    const q = S.questions[S.qIndex];
    const correct = q.correct_answer;
    document.querySelectorAll('#answer-grid .ans-btn').forEach(b => { b.disabled = true; });
    document.querySelector(`#answer-grid .ans-btn[data-opt="${correct}"]`).classList.add('correct');

    // Timeout = fire spreads
    S.combo = 0;
    spreadFire();

    logAnswer(q, '', correct, false);

    setTimeout(() => {
      if (!S.gameOver) {
        S.qIndex++;
        showQuestion();
      }
    }, 1200);
  }

  function handleCorrect() {
    S.correct++;
    S.combo++;
    if (S.combo > S.comboMax) S.comboMax = S.combo;

    // Extinguish 1 fire from current target floor
    extinguishFire();

    // Spray animation
    const firefighter = document.getElementById('firefighter');
    firefighter.classList.add('spray');
    setTimeout(() => firefighter.classList.remove('spray'), 500);

    // Water spray effect on building
    showSprayEffect();
  }

  function handleWrong() {
    S.incorrect++;
    S.combo = 0;

    // Fire spreads
    spreadFire();

    // Fire spread effect
    showFireSpreadEffect();
  }

  function extinguishFire() {
    const targetFloor = findTargetFloor();
    if (targetFloor === 0) return; // All clear

    const floorData = S.floors[targetFloor - 1];
    if (floorData.fires > 0) {
      floorData.fires--;
      S.totalFires--;
      renderFloorFires(targetFloor);

      // Check if floor is cleared
      if (floorData.fires === 0 && !floorData.rescued) {
        rescuePerson(targetFloor);
      }
    }

    updateHUD();
    updateBuildingShake();
    highlightCurrentFloor();
    checkWin();
  }

  function spreadFire() {
    // Add 1 fire to a random non-rescued floor
    const availableFloors = [];
    for (let f = 0; f < FLOORS; f++) {
      if (!S.floors[f].rescued) availableFloors.push(f);
    }
    if (availableFloors.length === 0) return;

    const targetIdx = availableFloors[Math.floor(Math.random() * availableFloors.length)];
    S.floors[targetIdx].fires++;
    S.totalFires++;

    renderFloorFires(targetIdx + 1);
    updateHUD();
    updateBuildingShake();

    // Check collapse
    if (S.totalFires >= MAX_FIRES) {
      endGame('collapse');
    }
  }

  function rescuePerson(floorNum) {
    const floorData = S.floors[floorNum - 1];
    floorData.rescued = true;
    S.rescued++;

    const personEl = document.getElementById(`person-${floorNum}`);
    personEl.classList.add('rescued');
    setTimeout(() => {
      personEl.textContent = '✅';
      personEl.classList.remove('rescued');
      personEl.closest('.floor').classList.add('cleared');
    }, 600);

    updateHUD();
  }

  function showSprayEffect() {
    const building = document.getElementById('building');
    const spray = document.createElement('div');
    spray.className = 'water-spray';
    spray.textContent = '💦';
    building.appendChild(spray);
    setTimeout(() => spray.remove(), 700);
  }

  function showFireSpreadEffect() {
    const building = document.getElementById('building');
    const effect = document.createElement('div');
    effect.className = 'fire-spread';
    effect.textContent = '🔥';
    building.appendChild(effect);
    setTimeout(() => effect.remove(), 600);
  }

  // ===== WIN / LOSE =====
  function checkWin() {
    // Win when all 5 people rescued
    if (S.rescued >= FLOORS) {
      endGame('win');
    }
  }

  function endGame(reason) {
    if (S.gameOver) return;
    S.gameOver = true;
    stopTimer();

    if (reason === 'collapse') {
      const building = document.getElementById('building');
      building.classList.remove('shake-1', 'shake-2', 'shake-3');
      building.classList.add('collapsed');
      setTimeout(() => showResults(reason), 1200);
    } else {
      setTimeout(() => showResults(reason), 600);
    }

    saveSession(reason);
  }

  function showResults(reason) {
    const isWin = reason === 'win';
    const hero = isWin ? '🦸' : '🏚️';
    const title = isWin ? 'Cứu hỏa thành công!' : 'Tòa nhà sụp đổ!';
    const subtitle = isWin
      ? `Bạn đã cứu được tất cả ${FLOORS} người!`
      : `Cứu được ${S.rescued}/${FLOORS} người trước khi tòa nhà sụp.`;

    const stars = isWin ? 3 : S.rescued >= 3 ? 2 : S.rescued >= 1 ? 1 : 0;
    const total = S.correct + S.incorrect;

    document.getElementById('result-container').innerHTML = `
      <div class="result-hero">${hero}</div>
      <h2 class="result-title">${title}</h2>
      <p class="result-subtitle">${subtitle}</p>
      <div class="result-stats">
        <div class="result-stat"><span>👨‍👩‍👧‍👦 Cứu được</span><strong>${S.rescued}/${FLOORS}</strong></div>
        <div class="result-stat"><span>✅ Trả lời đúng</span><strong>${S.correct}/${total}</strong></div>
        <div class="result-stat"><span>🔥 Combo max</span><strong>${S.comboMax}</strong></div>
        <div class="result-stat"><span>⭐ Sao</span><strong>${'⭐'.repeat(stars) || '0'}</strong></div>
      </div>
      <div class="result-btns">
        <button class="result-btn primary" onclick="window._v21PlayAgain()">🚒 Chơi lại</button>
        <button class="result-btn secondary" onclick="window.location.href='/'">🏠 Trang chủ</button>
      </div>
    `;

    showScreen('result-screen');

    if (typeof window.checkAndShowPrompt === 'function') {
      const pid = getPlayerId();
      if (pid) window.checkAndShowPrompt(pid);
    }
  }

  window._v21PlayAgain = function() {
    showScreen('setup-screen');
  };

  // ===== SESSION & ANSWER LOGGING =====
  async function saveSession(reason) {
    const playerId = getPlayerId();
    if (!playerId) return;
    const stars = reason === 'win' ? 3 : S.rescued >= 3 ? 2 : S.rescued >= 1 ? 1 : 0;
    const total = S.correct + S.incorrect;
    try {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: playerId,
          subject: S.config.subject === 'mix' ? 'math' : S.config.subject,
          difficulty: S.config.difficulty,
          score: S.correct * 10 + S.rescued * 20,
          total_questions: total,
          correct_answers: S.correct,
          stars_earned: stars,
          combo_max: S.comboMax,
          mode: 'v21-firefighter'
        })
      });
    } catch { /* ignore */ }
  }

  async function logAnswer(q, selected, correct, isCorrect) {
    const playerId = getPlayerId();
    if (!playerId) return;
    try {
      await fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 0,
          player_id: playerId,
          question_id: q.id || 0,
          selected_answer: selected,
          correct_answer: correct,
          is_correct: isCorrect ? 1 : 0,
          time_spent_ms: Math.round((TIMER_SECONDS - S.timeLeft) * 1000),
          difficulty: S.config.difficulty,
          combo_streak: S.combo
        })
      });
    } catch { /* ignore */ }
  }

  // ===== INIT =====
  function init() {
    // Nothing special on init, setup screen is shown by default
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// ===== CHARACTER SYSTEM INTEGRATION (presentation only, additive) =====
// V21's game logic lives inside the IIFE above and is intentionally left
// untouched. This block upgrades the static emoji to animated sprites and
// wires the guide/exit modals purely through the DOM, so no game logic is
// rewritten.
(function () {
  'use strict';

  const C = window.HocVuiCharacters;
  let ffChar = null;

  // --- Particle helper (sparkle / confetti) ---
  function spawnParticles(parent, kind, count) {
    if (!parent) return;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'pfx pfx-' + kind;
      p.style.setProperty('--tx', (Math.random() * 80 - 40) + 'px');
      p.style.setProperty('--ty', -(Math.random() * 50 + 25) + 'px');
      p.style.setProperty('--delay', (Math.random() * 0.18) + 's');
      if (kind === 'confetti') {
        const colors = ['#ffd23f', '#ff6b35', '#4fc3f7', '#81c784', '#fff'];
        p.style.background = colors[i % colors.length];
        p.style.setProperty('--rot', (Math.random() * 360) + 'deg');
      }
      parent.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
  }
  window.__v21_spawnParticles = spawnParticles;

  // --- Mount the firefighter sprite in place of the 🧑‍🚒 emoji ---
  function mountFirefighter() {
    const host = document.getElementById('firefighter');
    if (!host) return;
    host.innerHTML = '';
    ffChar = null;
    if (C && C.hasSpecies('firefighter')) {
      ffChar = C.createCharacter('firefighter', host, { state: 'idle', size: 60 });
    } else {
      host.textContent = '🧑‍🚒';
    }
  }

  // --- Upgrade each fire 🔥 emoji to the animated flame sprite ---
  function upgradeFlame(span) {
    if (!span || span.dataset.ffUpgraded) return;
    if (!(C && C.hasSpecies('flame'))) return; // keep emoji fallback
    span.dataset.ffUpgraded = '1';
    span.textContent = '';
    C.createCharacter('flame', span, { state: 'idle', size: 18 });
  }

  function upgradeAllFlames(root) {
    (root || document).querySelectorAll('.fire-emoji').forEach(upgradeFlame);
  }

  // --- Observe floors so freshly-rendered fires become sprites ---
  function watchFires() {
    for (let f = 1; f <= 5; f++) {
      const container = document.getElementById('fires-' + f);
      if (!container) continue;
      upgradeAllFlames(container);
      const mo = new MutationObserver(() => upgradeAllFlames(container));
      mo.observe(container, { childList: true });
    }
  }

  // --- Sync firefighter to "happy" when it sprays water on a correct answer ---
  function watchFirefighter() {
    const host = document.getElementById('firefighter');
    if (!host) return;
    const mo = new MutationObserver(muts => {
      for (const m of muts) {
        if (m.attributeName === 'class' && host.classList.contains('spray')) {
          if (ffChar) {
            ffChar.setState('happy');
            setTimeout(() => { if (ffChar) ffChar.setState('idle'); }, 600);
          }
          spawnParticles(host, 'sparkle', 8);
        }
      }
    });
    mo.observe(host, { attributes: true, attributeFilter: ['class'] });
  }

  // --- Confetti burst when the result screen shows a win ---
  function watchResult() {
    const result = document.getElementById('result-screen');
    if (!result) return;
    const mo = new MutationObserver(() => {
      if (!result.classList.contains('active')) return;
      const container = document.getElementById('result-container');
      if (container && /🦸/.test(container.textContent || '')) {
        spawnParticles(result, 'confetti', 28);
      }
    });
    mo.observe(result, { attributes: true, attributeFilter: ['class'] });
  }

  // --- Guide + exit modals ---
  function wireModals() {
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
        // V21's timer lives in the game closure (S.timer) and isn't directly
        // reachable here. Since we navigate away immediately, defensively clear
        // any pending intervals so no loop keeps running during the transition.
        try {
          const highest = setInterval(() => {}, 100000);
          for (let i = 0; i <= highest; i++) clearInterval(i);
        } catch (e) {}
        window.location.reload();
      });
      exit.addEventListener('click', e => { if (e.target === exit) exit.style.display = 'none'; });
    }
  }

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    mountFirefighter();
    watchFires();
    watchFirefighter();
    watchResult();
    wireModals();
  });
})();
