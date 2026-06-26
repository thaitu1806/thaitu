// V45 — Lập Trình Robot Mini (controller)
(function () {
  'use strict';

  const STORAGE_KEY = 'v45_robot';
  const QUESTION_LIMIT = 20;

  const CMD_ICONS = {
    forward: { icon: '⬆️', label: 'tiến' },
    left:    { icon: '↩️', label: 'trái' },
    right:   { icon: '↪️', label: 'phải' },
    jump:    { icon: '⏫', label: 'nhảy' },
  };

  let userData = { bestLevel: 1, totalRuns: 0 };

  function loadUserData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      userData.bestLevel = Number(parsed.bestLevel) || 1;
      userData.totalRuns = Number(parsed.totalRuns) || 0;
    } catch (e) {}
  }

  function saveUserData() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(userData)); } catch (e) {}
  }

  let state = null;
  let cache = [];
  const usedIds = new Set();
  let currentQuestion = null;
  let comboStreak = 0;
  let maxCombo = 0;
  let levelToPlay = 1;
  let subject = 'mix';
  let difficulty = 'easy';
  let questionStartedAt = 0;
  let timerHandle = null;
  let answerLocked = false;
  let fallbackQuestionId = -1;
  const TIMER_SECONDS = 20;

  // ─── Robot sprite ──────────────────────────────────────────────────────
  let robotChar = null;        // mounted robot sprite (or null → emoji fallback)
  let robotStateTimer = null;  // settle-back-to-idle timer
  let chosenBotId = null;      // species picked once per level (stable across re-renders)
  const ROBOT_POOL = ['bot-emerald', 'bot-cyan', 'bot-lime', 'bot-amber', 'bot-violet', 'bot-mint'];

  function pickRobotId() {
    chosenBotId = ROBOT_POOL[Math.floor(Math.random() * ROBOT_POOL.length)];
  }

  // Reflect game state onto the robot sprite. Transient states (happy/scared)
  // play briefly then settle back to idle.
  function setRobotState(next, holdMs) {
    if (!robotChar) return;
    clearTimeout(robotStateTimer);
    robotChar.setState(next);
    if (holdMs) {
      robotStateTimer = setTimeout(() => {
        if (robotChar) robotChar.setState('idle');
      }, holdMs);
    }
  }

  // Element to anchor robot particle bursts (the robot cell, or the grid board).
  function robotHost() {
    return (robotChar && robotChar.root && robotChar.root.parentNode) || $('grid-board');
  }

  // ─── Particle helpers ────────────────────────────────────────────────────
  function spawnParticles(parent, kind, count) {
    if (!parent) return;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'pfx pfx-' + kind;
      p.style.setProperty('--tx', (Math.random() * 70 - 35) + 'px');
      p.style.setProperty('--ty', -(Math.random() * 38 + 22) + 'px');
      p.style.setProperty('--delay', (Math.random() * 0.15) + 's');
      parent.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
  }

  function spawnConfetti(parent, count) {
    if (!parent) return;
    const colors = ['#00ff88', '#3df0ff', '#ffd700', '#9d7bff', '#d4ff3d', '#fff'];
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'pfx pfx-confetti';
      p.style.setProperty('--x', Math.random() * 100 + '%');
      p.style.setProperty('--delay', (Math.random() * 0.6) + 's');
      p.style.setProperty('--rot', Math.floor(Math.random() * 360) + 'deg');
      p.style.background = colors[i % colors.length];
      parent.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
  }

  const $ = (id) => document.getElementById(id);
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    $(id).classList.add('active');
  }

  function renderStart() {
    $('best-level').textContent = userData.bestLevel;
    $('total-runs').textContent = userData.totalRuns;
    levelToPlay = userData.bestLevel;
  }

  function wireSelectors() {
    document.querySelectorAll('.selector-options').forEach((group) => {
      group.addEventListener('click', (e) => {
        const btn = e.target.closest('.sel-btn');
        if (!btn) return;
        group.querySelectorAll('.sel-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        if (group.dataset.group === 'subject') subject = btn.dataset.value;
        else if (group.dataset.group === 'difficulty') difficulty = btn.dataset.value;
      });
    });
  }

  async function fetchQuestions() {
    const profile = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
    const grade = profile.grade || 2;
    try {
      if (subject === 'mix') {
        const subs = ['math', 'vietnamese', 'english'];
        const perSub = Math.ceil(QUESTION_LIMIT / subs.length);
        const results = await Promise.all(
          subs.map((s) =>
            fetch(`/api/questions?subject=${s}&difficulty=${difficulty}&limit=${perSub}&grade=${grade}`)
              .then((r) => (r.ok ? r.json() : []))
              .catch(() => []),
          ),
        );
        cache = results.flat();
      } else {
        const res = await fetch(
          `/api/questions?subject=${subject}&difficulty=${difficulty}&limit=${QUESTION_LIMIT}&grade=${grade}`,
        );
        cache = res.ok ? await res.json() : [];
      }
    } catch (e) { cache = []; }
    if (!Array.isArray(cache)) cache = [];
    for (let i = cache.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cache[i], cache[j]] = [cache[j], cache[i]];
    }
  }

  function nextQuestion() {
    const picked = window.V45Logic.pickNextQuestion({ cache, usedIds });
    if (picked) {
      usedIds.add(picked.id);
      return picked;
    }
    return makeFallbackQuestion();
  }

  function makeFallbackQuestion() {
    const a = 1 + Math.floor(Math.random() * 20);
    const b = 1 + Math.floor(Math.random() * 20);
    const correct = a + b;
    const distractors = new Set();
    while (distractors.size < 3) {
      const off = [-3, -2, -1, 1, 2, 3, 4, -4][Math.floor(Math.random() * 8)];
      const w = correct + off;
      if (w > 0 && w !== correct) distractors.add(w);
    }
    const numbers = [correct, ...distractors].sort(() => Math.random() - 0.5);
    const correctKey = 'abcd'[numbers.indexOf(correct)];
    fallbackQuestionId -= 1;
    return {
      id: fallbackQuestionId,
      question_text: `${a} + ${b} = ?`,
      option_a: String(numbers[0]),
      option_b: String(numbers[1]),
      option_c: String(numbers[2]),
      option_d: String(numbers[3]),
      correct_answer: correctKey,
    };
  }

  async function startLevel() {
    state = window.V45Logic.initState({ level: levelToPlay, startedAt: Date.now() });
    cache = [];
    usedIds.clear();
    comboStreak = 0;
    maxCombo = 0;
    fallbackQuestionId = -1;

    pickRobotId();

    showScreen('game-screen');
    renderHud();
    renderGrid();
    renderPool();
    renderProgram();

    $('q-text').textContent = '⏳ Đang tải câu hỏi…';
    $('q-options').innerHTML = '';
    $('feedback').style.display = 'none';

    await fetchQuestions();
    showNextQuestion();
  }

  function renderHud() {
    $('level-text').textContent = state.level;
    $('progress-text').textContent = `${state.questionsServed}/${state.maxQuestions}`;
  }

  function renderGrid() {
    const board = $('grid-board');
    board.innerHTML = '';
    robotChar = null;
    clearTimeout(robotStateTimer);
    const obsSet = new Set(state.obstacles.map((o) => `${o.row},${o.col}`));
    const C = window.HocVuiCharacters;
    for (let r = 0; r < state.grid.rows; r++) {
      for (let c = 0; c < state.grid.cols; c++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        if (obsSet.has(`${r},${c}`)) {
          cell.classList.add('obstacle');
          cell.textContent = '🧱';
        } else if (r === state.goal.row && c === state.goal.col) {
          cell.classList.add('goal');
          cell.textContent = '🏁';
        }
        if (r === state.robot.row && c === state.robot.col) {
          cell.classList.add('robot', `face-${state.robot.facing}`);
          // Mount the animated robot sprite. The ::after emoji stays as fallback
          // and is hidden via CSS when an .hv-char is present in the cell.
          if (C && chosenBotId && C.hasSpecies(chosenBotId)) {
            robotChar = C.createCharacter(chosenBotId, cell, { state: 'idle' });
          }
        }
        board.appendChild(cell);
      }
    }
  }

  function renderPool() {
    const pool = $('pool-row');
    pool.innerHTML = '';
    state.pool.forEach((cmd, i) => {
      const chip = document.createElement('button');
      chip.className = 'cmd-chip';
      const info = CMD_ICONS[cmd] || { icon: '?', label: cmd };
      chip.textContent = `${info.icon} ${info.label}`;
      chip.addEventListener('click', () => {
        state = window.V45Logic.appendCommand(state, i);
        renderPool();
        renderProgram();
      });
      pool.appendChild(chip);
    });
  }

  function renderProgram() {
    const program = $('program-row');
    program.innerHTML = '';
    state.program.forEach((cmd) => {
      const chip = document.createElement('span');
      chip.className = 'cmd-chip';
      const info = CMD_ICONS[cmd] || { icon: '?', label: cmd };
      chip.textContent = `${info.icon} ${info.label}`;
      program.appendChild(chip);
    });
  }

  function showNextQuestion() {
    if (window.V45Logic.isFinished(state)) {
      finishLevel();
      return;
    }
    currentQuestion = nextQuestion();
    answerLocked = false;
    questionStartedAt = Date.now();

    $('q-text').textContent = currentQuestion.question_text;
    $('feedback').style.display = 'none';

    const optionsEl = $('q-options');
    optionsEl.innerHTML = '';
    ['a', 'b', 'c', 'd'].forEach((key) => {
      const text = currentQuestion[`option_${key}`];
      if (text == null) return;
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.dataset.key = key;
      btn.textContent = text;
      btn.addEventListener('click', () => handleAnswer(key));
      optionsEl.appendChild(btn);
    });
    startTimer();
  }

  function startTimer() {
    clearInterval(timerHandle);
    const totalMs = TIMER_SECONDS * 1000;
    timerHandle = setInterval(() => {
      const elapsed = Date.now() - questionStartedAt;
      const remaining = Math.max(0, totalMs - elapsed);
      if (remaining <= 0) {
        clearInterval(timerHandle);
        handleTimeout();
      }
    }, 100);
  }

  function handleAnswer(selectedKey) {
    if (answerLocked) return;
    answerLocked = true;
    clearInterval(timerHandle);

    const correctKey = (currentQuestion.correct_answer || '').toLowerCase();
    const isCorrect = selectedKey === correctKey;

    document.querySelectorAll('.option-btn').forEach((btn) => {
      btn.classList.add('disabled');
      if (btn.dataset.key === correctKey) btn.classList.add('correct');
      else if (btn.dataset.key === selectedKey && !isCorrect) btn.classList.add('wrong');
    });

    if (isCorrect) {
      state = window.V45Logic.applyCorrect(state);
      comboStreak += 1;
      if (comboStreak > maxCombo) maxCombo = comboStreak;
      const last = state.pool[state.pool.length - 1];
      const info = CMD_ICONS[last] || { icon: '?', label: last };
      showFeedback('good', `✅ Đúng! Mở khóa lệnh ${info.icon} ${info.label}`);
      setRobotState('happy', 800);
      spawnParticles(robotHost(), 'spark', 8);
    } else {
      state = window.V45Logic.applyWrongOrTimeout(state);
      comboStreak = 0;
      showFeedback('bad', '❌ Sai mất! Thử câu sau.');
      setRobotState('scared', 700);
    }

    logAnswer(selectedKey, correctKey, isCorrect, Date.now() - questionStartedAt);
    renderHud();
    renderPool();
    setTimeout(advanceAfterFeedback, 1100);
  }

  function handleTimeout() {
    if (answerLocked) return;
    answerLocked = true;
    document.querySelectorAll('.option-btn').forEach((btn) => {
      btn.classList.add('disabled');
      if (btn.dataset.key === (currentQuestion.correct_answer || '').toLowerCase()) {
        btn.classList.add('correct');
      }
    });
    state = window.V45Logic.applyWrongOrTimeout(state);
    comboStreak = 0;
    showFeedback('bad', '⏰ Hết giờ!');
    setRobotState('scared', 700);
    renderHud();
    setTimeout(advanceAfterFeedback, 1100);
  }

  function showFeedback(cls, text) {
    const fb = $('feedback');
    fb.style.display = 'block';
    fb.className = `feedback ${cls}`;
    fb.textContent = text;
  }

  function advanceAfterFeedback() {
    if (window.V45Logic.isFinished(state)) finishLevel();
    else showNextQuestion();
  }

  function runProgram() {
    if (!state.program.length) return;
    const after = window.V45Logic.executeProgram(state);
    state = after;
    renderGrid();
    renderPool();
    renderProgram();
    if (state.outcome === 'won') {
      setRobotState('happy', 0);
      spawnParticles(robotHost(), 'spark', 12);
      finishLevel();
    }
  }

  function clearProgram() {
    state = window.V45Logic.clearProgram(state);
    renderPool();
    renderProgram();
  }

  function finishLevel() {
    clearInterval(timerHandle);
    clearTimeout(robotStateTimer);
    const total = state.correct + state.wrong;
    const accuracy = total > 0 ? Math.round((state.correct / total) * 100) : 0;
    const stars =
      state.outcome === 'won' && state.wrong === 0 ? 3 :
      state.outcome === 'won' ? 2 :
      state.correct >= 5 ? 1 : 0;

    if (state.outcome === 'won' && state.level >= userData.bestLevel) {
      userData.bestLevel = Math.min(window.V45Logic.LEVELS.length, state.level + 1);
    }
    userData.totalRuns += 1;
    saveUserData();

    saveSession({ stars, accuracy, total });

    const detail = `
      🎯 Cấp: ${state.level}/${window.V45Logic.LEVELS.length}<br>
      ✅ Đúng: ${state.correct}/${total} (${accuracy}%)<br>
      💾 Lệnh đã mở: ${state.correct}<br>
      ⭐ Sao: ${stars}/3
    `;
    if (state.outcome === 'won') {
      $('victory-detail').innerHTML = detail;
      spawnConfetti($('victory-screen'), 44);
      const nextBtn = $('btn-next-level');
      if (state.level >= window.V45Logic.LEVELS.length) {
        nextBtn.style.display = 'none';
      } else {
        nextBtn.style.display = '';
      }
      showScreen('victory-screen');
    } else {
      $('tryagain-detail').innerHTML = detail;
      showScreen('tryagain-screen');
    }

    if (typeof window.checkAndShowPrompt === 'function') {
      try { window.checkAndShowPrompt(); } catch (e) {}
    }
  }

  async function saveSession({ stars, accuracy, total }) {
    try {
      const profile = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
      if (!profile.id) return;
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: profile.id,
          subject: subject === 'mix' ? 'math' : subject,
          difficulty,
          score: state.level,
          total_questions: total,
          correct_answers: state.correct,
          stars_earned: stars,
          combo_max: maxCombo,
          mode: 'v45',
          accuracy,
        }),
      });
    } catch (e) {}
  }

  function logAnswer(selected, correct, isCorrect, ms) {
    if (!currentQuestion || currentQuestion.id < 0) return;
    try {
      const profile = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
      if (!profile.id) return;
      fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: profile.id,
          question_id: currentQuestion.id,
          selected_answer: selected,
          correct_answer: correct,
          is_correct: isCorrect,
          time_spent_ms: ms,
          difficulty,
        }),
      }).catch(() => {});
    } catch (e) {}
  }

  function init() {
    if (!window.V45Logic) {
      setTimeout(init, 30);
      return;
    }
    loadUserData();
    renderStart();
    wireSelectors();
    $('btn-start').addEventListener('click', startLevel);
    $('btn-run').addEventListener('click', runProgram);
    $('btn-clear').addEventListener('click', clearProgram);
    $('btn-next-level').addEventListener('click', () => {
      levelToPlay = Math.min(window.V45Logic.LEVELS.length, state.level + 1);
      startLevel();
    });
    $('btn-replay-win').addEventListener('click', () => {
      levelToPlay = state.level;
      startLevel();
    });
    $('btn-replay-try').addEventListener('click', () => {
      levelToPlay = state.level;
      startLevel();
    });

    // Guide modal (available before entering the game).
    const guideModal = $('guide-modal');
    $('btn-guide').addEventListener('click', () => { guideModal.style.display = 'flex'; });
    $('btn-guide-close').addEventListener('click', () => { guideModal.style.display = 'none'; });
    guideModal.addEventListener('click', (e) => { if (e.target === guideModal) guideModal.style.display = 'none'; });

    // Exit button inside the game — confirm before leaving.
    const exitModal = $('exit-modal');
    $('btn-exit').addEventListener('click', () => { exitModal.style.display = 'flex'; });
    $('btn-exit-cancel').addEventListener('click', () => { exitModal.style.display = 'none'; });
    $('btn-exit-confirm').addEventListener('click', doExit);
    exitModal.addEventListener('click', (e) => { if (e.target === exitModal) exitModal.style.display = 'none'; });
  }

  function doExit() {
    $('exit-modal').style.display = 'none';
    clearInterval(timerHandle);
    clearTimeout(robotStateTimer);
    window.location.reload();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
