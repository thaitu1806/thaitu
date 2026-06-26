// V41 — Phiêu Lưu Cùng Mario (controller)
// Uses pure logic from game-logic.js (exposed as window.V41Logic) and wires it
// to the DOM, timer, and API calls.
(function () {
  'use strict';

  const STORAGE_KEY = 'v41_mario';
  const QUESTION_LIMIT = 32;

  // ─── Persisted player data ───────────────────────────────────────────────
  let userData = { bestWorld: 1, totalCoins: 0, runsCompleted: 0 };

  function loadUserData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      userData.bestWorld = Number(parsed.bestWorld) || 1;
      userData.totalCoins = Number(parsed.totalCoins) || 0;
      userData.runsCompleted = Number(parsed.runsCompleted) || 0;
    } catch (e) {}
  }

  function saveUserData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    } catch (e) {}
  }

  // ─── Run state ───────────────────────────────────────────────────────────
  let state = null;            // game state from V41Logic.initState
  let cache = [];              // fetched question pool
  const usedIds = new Set();   // question IDs already shown this run
  let currentQuestion = null;  // active question being answered
  let comboStreak = 0;
  let maxCombo = 0;
  let subject = 'mix';
  let difficulty = 'easy';
  let questionStartedAt = 0;
  let timerHandle = null;
  let answerLocked = false;
  let fallbackQuestionId = -1;
  let heroChar = null;             // mounted hero sprite (or null → emoji fallback)
  let heroStateTimer = null;       // settle-back-to-idle timer
  const HERO_POOL = ['hero-red', 'hero-green', 'hero-blue', 'hero-yellow', 'hero-purple', 'hero-orange'];

  // ─── DOM helpers ────────────────────────────────────────────────────────
  const $ = (id) => document.getElementById(id);
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    $(id).classList.add('active');
  }

  // ─── Start screen ───────────────────────────────────────────────────────
  function renderStart() {
    $('best-world').textContent = userData.bestWorld;
    $('total-coins').textContent = userData.totalCoins;
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

  function spawnClouds() {
    const layer = $('layer-clouds');
    if (!layer) return;
    layer.innerHTML = '';
    const emojis = ['☁️', '🌥️', '⛅'];
    let html = '';
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < 5; i++) {
        const offset = pass * 50 + i * 10;
        const top = 5 + Math.random() * 30;
        html += `<span style="position:absolute;left:${offset}%;top:${top}%;">${
          emojis[i % emojis.length]
        }</span>`;
      }
    }
    layer.innerHTML = html;
  }

  // ─── Hero sprite ─────────────────────────────────────────────────────────
  // Mount a random animated hero into #hero-char. Falls back to an emoji if the
  // sprite registry / species is unavailable.
  function buildHero() {
    const host = $('hero-char');
    if (!host) return;
    host.innerHTML = '';
    heroChar = null;
    clearTimeout(heroStateTimer);
    const C = window.HocVuiCharacters;
    const id = HERO_POOL[Math.floor(Math.random() * HERO_POOL.length)];
    if (C && C.hasSpecies(id)) {
      heroChar = C.createCharacter(id, host, { state: 'idle' });
    } else {
      host.textContent = '🦸';
    }
  }

  // Reflect game state onto the hero sprite. `transient` states (happy/scared)
  // play briefly then settle back to the resting state (idle, or scared while
  // lives are low).
  function restingState() {
    return state && state.lives <= 1 && state.outcome === 'playing' ? 'scared' : 'idle';
  }

  function setHeroState(next, holdMs) {
    if (!heroChar) return;
    clearTimeout(heroStateTimer);
    heroChar.setState(next);
    if (holdMs) {
      heroStateTimer = setTimeout(() => {
        if (heroChar) heroChar.setState(restingState());
      }, holdMs);
    }
  }

  // ─── Question fetching ─────────────────────────────────────────────────
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
    } catch (e) {
      cache = [];
    }

    if (!Array.isArray(cache)) cache = [];

    // Shuffle so retries see different questions
    for (let i = cache.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cache[i], cache[j]] = [cache[j], cache[i]];
    }
  }

  function nextQuestion() {
    const picked = window.V41Logic.pickNextQuestion({ cache, usedIds });
    if (picked) {
      usedIds.add(picked.id);
      return picked;
    }
    return makeFallbackQuestion();
  }

  function makeFallbackQuestion() {
    // Simple addition fallback when cache is exhausted or empty.
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

  // ─── Run flow ──────────────────────────────────────────────────────────
  async function startRun() {
    state = window.V41Logic.initState({ startedAt: Date.now() });
    cache = [];
    usedIds.clear();
    comboStreak = 0;
    maxCombo = 0;
    fallbackQuestionId = -1;

    renderHud();
    showScreen('game-screen');
    spawnClouds();
    buildHero();

    // Show a quick loading hint
    $('q-text').textContent = '⏳ Đang tải câu hỏi…';
    $('q-options').innerHTML = '';
    $('feedback').style.display = 'none';

    await fetchQuestions();
    showNextStation();
  }

  function renderHud() {
    $('lives-text').textContent = state.lives;
    $('station-text').textContent = `${state.currentStation}/${state.totalStations}`;
    $('coins-text').textContent = state.coins;

    const pct = (state.currentStation / state.totalStations) * 100;
    $('progress-fill').style.width = pct + '%';
    $('hero-marker').style.left = pct + '%';
  }

  function showNextStation() {
    if (window.V41Logic.isFinished(state)) {
      finishRun();
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
    const totalMs = window.V41Logic.TIMER_SECONDS * 1000;
    const fillEl = $('timer-fill');
    fillEl.classList.remove('warning');
    fillEl.style.width = '100%';
    timerHandle = setInterval(() => {
      const elapsed = Date.now() - questionStartedAt;
      const remaining = Math.max(0, totalMs - elapsed);
      const pct = (remaining / totalMs) * 100;
      fillEl.style.width = pct + '%';
      if (remaining <= 3500) fillEl.classList.add('warning');
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
    const msRemaining = Math.max(
      0,
      window.V41Logic.TIMER_SECONDS * 1000 - (Date.now() - questionStartedAt),
    );
    const prevStation = state.currentStation;

    // Highlight
    document.querySelectorAll('.option-btn').forEach((btn) => {
      btn.classList.add('disabled');
      if (btn.dataset.key === correctKey) btn.classList.add('correct');
      else if (btn.dataset.key === selectedKey && !isCorrect) btn.classList.add('wrong');
    });

    if (isCorrect) {
      state = window.V41Logic.applyCorrect(state, { msRemaining });
      comboStreak += 1;
      if (comboStreak > maxCombo) maxCombo = comboStreak;
      const marker = $('hero-marker');
      marker.classList.add('jumping');
      setTimeout(() => marker.classList.remove('jumping'), 600);
      setHeroState('happy', 700);
      spawnParticles($('hero-char'), 'coin', 6);
      // Station cleared → extra sparkle burst.
      if (state.currentStation > prevStation) spawnParticles($('hero-char'), 'sparkle', 6);
      showFeedback(true, msRemaining);
    } else {
      state = window.V41Logic.applyWrongOrTimeout(state);
      comboStreak = 0;
      setHeroState('scared', state.lives <= 1 ? 0 : 900);
      showFeedback(false, msRemaining);
    }

    logAnswer(selectedKey, correctKey, isCorrect, Date.now() - questionStartedAt);
    renderHud();
    setTimeout(advanceAfterFeedback, 1200);
  }

  function handleTimeout() {
    if (answerLocked) return;
    answerLocked = true;
    state = window.V41Logic.applyWrongOrTimeout(state);
    comboStreak = 0;

    document.querySelectorAll('.option-btn').forEach((btn) => {
      btn.classList.add('disabled');
      if (btn.dataset.key === (currentQuestion.correct_answer || '').toLowerCase()) {
        btn.classList.add('correct');
      }
    });

    const fb = $('feedback');
    fb.style.display = 'block';
    fb.className = 'feedback bad';
    fb.textContent = '⏰ Hết giờ! Mất 1 mạng!';
    setHeroState('scared', state.lives <= 1 ? 0 : 900);
    renderHud();
    setTimeout(advanceAfterFeedback, 1300);
  }

  function showFeedback(isCorrect, msRemaining) {
    const fb = $('feedback');
    fb.style.display = 'block';
    if (isCorrect) {
      const fast = msRemaining > (window.V41Logic.TIMER_SECONDS * 1000) / 2;
      fb.className = 'feedback good';
      fb.textContent = fast ? '✨ Xuất sắc! +2 xu' : '✅ Đúng rồi! +1 xu';
    } else {
      fb.className = 'feedback bad';
      fb.textContent = '❌ Sai mất! Mất 1 mạng.';
    }
  }

  function advanceAfterFeedback() {
    if (window.V41Logic.isFinished(state)) {
      finishRun();
    } else {
      showNextStation();
    }
  }

  // ─── End of run ────────────────────────────────────────────────────────
  function finishRun() {
    clearInterval(timerHandle);
    clearTimeout(heroStateTimer);
    const total = state.correct + state.wrong;
    const livesLost = window.V41Logic.STARTING_LIVES - state.lives;
    const stars = window.V41Logic.computeStars({
      correct: state.correct,
      total: Math.max(1, total),
      livesLost,
    });
    const accuracy = total > 0 ? Math.round((state.correct / total) * 100) : 0;

    userData.totalCoins += state.coins;
    userData.runsCompleted += 1;
    if (state.outcome === 'won' && userData.bestWorld === 1) {
      // Future-proof for multi-world support; for now keep at 1.
      userData.bestWorld = 1;
    }
    saveUserData();

    saveSession({ stars, accuracy, total });

    if (state.outcome === 'won') {
      setHeroState('happy', 0);
      spawnConfetti($('game-screen'), 40);
      $('star-row').textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
      $('victory-detail').innerHTML = renderDetail({ stars, accuracy, total });
      showScreen('victory-screen');
    } else {
      $('gameover-detail').innerHTML = renderDetail({ stars, accuracy, total });
      showScreen('gameover-screen');
    }

    if (typeof window.checkAndShowPrompt === 'function') {
      try { window.checkAndShowPrompt(); } catch (e) {}
    }
  }

  function renderDetail({ stars, accuracy, total }) {
    return `
      ✅ Đúng: ${state.correct}/${total} (${accuracy}%)<br>
      ❤️ Mạng còn: ${state.lives}/${window.V41Logic.STARTING_LIVES}<br>
      💰 Xu kiếm: ${state.coins}<br>
      🏆 Sao: ${stars}/3
    `;
  }

  // ─── API ───────────────────────────────────────────────────────────────
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
          score: state.coins,
          total_questions: total,
          correct_answers: state.correct,
          stars_earned: stars,
          combo_max: maxCombo,
          mode: 'v41',
          accuracy,
        }),
      });
    } catch (e) {}
  }

  function logAnswer(selected, correct, isCorrect, ms) {
    if (!currentQuestion || currentQuestion.id < 0) return; // skip fallback rows
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

  // ─── Particle helpers ────────────────────────────────────────────────────
  function spawnParticles(parent, kind, count) {
    if (!parent) return;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'pfx pfx-' + kind;
      if (kind === 'coin') p.textContent = '●';
      p.style.setProperty('--tx', (Math.random() * 70 - 35) + 'px');
      p.style.setProperty('--ty', -(Math.random() * 38 + 22) + 'px');
      p.style.setProperty('--delay', (Math.random() * 0.15) + 's');
      parent.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
  }

  function spawnConfetti(parent, count) {
    if (!parent) return;
    const colors = ['#e23030', '#ffd700', '#2a64c8', '#2e9e44', '#ef7d1a', '#fff'];
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

  // ─── Init ──────────────────────────────────────────────────────────────
  function init() {
    if (!window.V41Logic) {
      // game-logic.js (type=module) is deferred. Retry on next tick.
      setTimeout(init, 30);
      return;
    }
    loadUserData();
    renderStart();
    wireSelectors();
    spawnClouds();

    $('btn-start').addEventListener('click', startRun);
    $('btn-replay-win').addEventListener('click', startRun);
    $('btn-replay-lose').addEventListener('click', startRun);

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
    clearTimeout(heroStateTimer);
    window.location.reload();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
