// V42 — Khinh Khí Cầu Bay Cao (controller)
// Uses pure logic from game-logic.js (exposed as window.V42Logic).
(function () {
  'use strict';

  const STORAGE_KEY = 'v42_balloon';
  const QUESTION_LIMIT = 20;

  let userData = { bestAltitude: 0, totalRuns: 0, badges: [] };

  function loadUserData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      userData.bestAltitude = Number(parsed.bestAltitude) || 0;
      userData.totalRuns = Number(parsed.totalRuns) || 0;
      userData.badges = Array.isArray(parsed.badges) ? parsed.badges : [];
    } catch (e) {}
  }

  function saveUserData() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(userData)); } catch (e) {}
  }

  // ─── Run state ───────────────────────────────────────────────────────
  let state = null;
  let cache = [];
  const usedIds = new Set();
  let currentQuestion = null;
  let comboStreak = 0;
  let maxCombo = 0;
  let subject = 'mix';
  let difficulty = 'easy';
  let questionStartedAt = 0;
  let timerHandle = null;
  let answerLocked = false;
  let fallbackQuestionId = -1;
  let balloonChar = null;       // animated balloon sprite (or null when fallback)
  let stateResetHandle = null;  // pending idle-reset timer for the sprite

  const BALLOON_POOL = [
    'balloon-sunrise', 'balloon-ocean', 'balloon-forest',
    'balloon-berry', 'balloon-candy', 'balloon-sunny',
  ];

  const $ = (id) => document.getElementById(id);
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    $(id).classList.add('active');
  }

  // ─── Start screen ───────────────────────────────────────────────────
  function badgeRowText(ids) {
    const B = window.V42Logic.BADGES;
    if (!ids.length) return 'Chưa có huy hiệu';
    return B.filter((b) => ids.includes(b.id)).map((b) => b.icon + ' ' + b.label).join('  ');
  }

  function renderStart() {
    $('best-altitude').textContent = userData.bestAltitude;
    $('total-runs').textContent = userData.totalRuns;
    $('hero-badges').textContent = badgeRowText(userData.badges);
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
    const layer = $('cloud-layer');
    if (!layer) return;
    layer.innerHTML = '';
    const cloud = ['☁️', '🌥️', '⛅'];
    for (let i = 0; i < 6; i++) {
      const s = document.createElement('span');
      s.textContent = cloud[i % cloud.length];
      s.style.top = 8 + Math.random() * 50 + '%';
      s.style.left = -10 + 'vw';
      s.style.animationDelay = (i * 3) + 's';
      s.style.animationDuration = (24 + Math.random() * 12) + 's';
      layer.appendChild(s);
    }
  }

  // ─── Questions ──────────────────────────────────────────────────────
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
    for (let i = cache.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cache[i], cache[j]] = [cache[j], cache[i]];
    }
  }

  function nextQuestion() {
    const picked = window.V42Logic.pickNextQuestion({ cache, usedIds });
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

  // ─── Run flow ───────────────────────────────────────────────────────
  async function startRun() {
    state = window.V42Logic.initState({ startedAt: Date.now() });
    cache = [];
    usedIds.clear();
    comboStreak = 0;
    maxCombo = 0;
    fallbackQuestionId = -1;

    renderHud();
    showScreen('game-screen');
    spawnClouds();
    buildBalloon();

    $('q-text').textContent = '⏳ Đang tải câu hỏi…';
    $('q-options').innerHTML = '';
    $('feedback').style.display = 'none';

    await fetchQuestions();
    showNextStation();
  }

  function renderHud() {
    $('altitude-text').textContent = state.altitude;
    $('badges-text').textContent = state.badges.length
      ? window.V42Logic.BADGES.filter((b) => state.badges.includes(b.id)).map((b) => b.icon).join('')
      : '-';
    $('question-text').textContent = `${state.questionsServed}/${state.maxQuestions}`;

    const pct = (state.altitude / state.maxAltitude) * 100;
    $('meter-fill').style.height = pct + '%';
    $('balloon').style.bottom = pct + '%';

    // Drive an ambient climb intensity (0..4) on the meter, like V49's data-groove.
    const meter = $('altitude-meter');
    if (meter) meter.dataset.climb = String(Math.min(4, Math.floor(pct / 25)));
  }

  // Mount the animated balloon sprite (random from pool). Called once per run.
  function buildBalloon() {
    const host = $('balloon');
    if (!host) return;
    host.innerHTML = '';
    balloonChar = null;
    if (stateResetHandle) { clearTimeout(stateResetHandle); stateResetHandle = null; }
    const C = window.HocVuiCharacters;
    const id = BALLOON_POOL[Math.floor(Math.random() * BALLOON_POOL.length)];
    if (C && C.hasSpecies(id)) {
      balloonChar = C.createCharacter(id, host, { state: 'idle' });
    } else {
      host.textContent = '🎈'; // emoji fallback retained
    }
  }

  // Briefly flip the balloon to a transient state, then settle back to idle.
  function pulseBalloonState(next, ms) {
    if (!balloonChar) return;
    if (stateResetHandle) { clearTimeout(stateResetHandle); stateResetHandle = null; }
    balloonChar.setState(next);
    stateResetHandle = setTimeout(() => {
      if (balloonChar) balloonChar.setState('idle');
      stateResetHandle = null;
    }, ms);
  }

  function showNextStation() {
    if (window.V42Logic.isFinished(state)) {
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
    const totalMs = window.V42Logic.TIMER_SECONDS * 1000;
    const fillEl = $('timer-fill');
    fillEl.classList.remove('warning');
    fillEl.style.width = '100%';
    timerHandle = setInterval(() => {
      const elapsed = Date.now() - questionStartedAt;
      const remaining = Math.max(0, totalMs - elapsed);
      const pct = (remaining / totalMs) * 100;
      fillEl.style.width = pct + '%';
      if (remaining <= totalMs / 3) fillEl.classList.add('warning');
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
    const totalMs = window.V42Logic.TIMER_SECONDS * 1000;
    const msRemaining = Math.max(0, totalMs - (Date.now() - questionStartedAt));

    document.querySelectorAll('.option-btn').forEach((btn) => {
      btn.classList.add('disabled');
      if (btn.dataset.key === correctKey) btn.classList.add('correct');
      else if (btn.dataset.key === selectedKey && !isCorrect) btn.classList.add('wrong');
    });

    const prevAlt = state.altitude;
    if (isCorrect) {
      state = window.V42Logic.applyCorrect(state, { msRemaining });
      comboStreak += 1;
      if (comboStreak > maxCombo) maxCombo = comboStreak;
      const earned = window.V42Logic.newBadgesEarned(prevAlt, state.altitude);
      // Happy rise-bounce on a gain; emphasize when a badge is freshly earned.
      pulseBalloonState('happy', earned.length ? 900 : 600);
      const host = $('balloon');
      spawnParticles(host, 'sparkle', earned.length ? 16 : 8);
      if (earned.length) spawnParticles(host, 'star', 10);
      showFeedback(true, msRemaining, earned);
    } else {
      state = window.V42Logic.applyWrongOrTimeout(state);
      comboStreak = 0;
      pulseBalloonState('scared', 700); // wobble/deflate on a wrong answer
      showFeedback(false, msRemaining, []);
    }

    logAnswer(selectedKey, correctKey, isCorrect, Date.now() - questionStartedAt);
    renderHud();
    setTimeout(advanceAfterFeedback, 1300);
  }

  function handleTimeout() {
    if (answerLocked) return;
    answerLocked = true;
    state = window.V42Logic.applyWrongOrTimeout(state);
    comboStreak = 0;
    pulseBalloonState('scared', 700); // wobble/deflate on timeout

    document.querySelectorAll('.option-btn').forEach((btn) => {
      btn.classList.add('disabled');
      if (btn.dataset.key === (currentQuestion.correct_answer || '').toLowerCase()) {
        btn.classList.add('correct');
      }
    });

    const fb = $('feedback');
    fb.style.display = 'block';
    fb.className = 'feedback bad';
    fb.textContent = '⏰ Hết giờ! Khí cầu rơi 5 m.';
    renderHud();
    setTimeout(advanceAfterFeedback, 1300);
  }

  function showFeedback(isCorrect, msRemaining, earnedBadges) {
    const fb = $('feedback');
    fb.style.display = 'block';
    if (earnedBadges.length) {
      const B = window.V42Logic.BADGES;
      const label = B.filter((b) => earnedBadges.includes(b.id)).map((b) => b.icon + ' ' + b.label).join(' · ');
      fb.className = 'feedback badge';
      fb.textContent = `🎖️ Huy hiệu mới: ${label}`;
      return;
    }
    if (isCorrect) {
      const bonus = window.V42Logic.computeBonus(msRemaining);
      const total = 10 + bonus;
      fb.className = 'feedback good';
      fb.textContent = `✅ Đúng rồi! +${total} m bay cao`;
    } else {
      fb.className = 'feedback bad';
      fb.textContent = '❌ Sai mất! Khí cầu rơi 5 m.';
    }
  }

  function advanceAfterFeedback() {
    if (window.V42Logic.isFinished(state)) finishRun();
    else showNextStation();
  }

  // ─── End of run ─────────────────────────────────────────────────────
  function finishRun() {
    clearInterval(timerHandle);
    if (stateResetHandle) { clearTimeout(stateResetHandle); stateResetHandle = null; }
    const total = state.correct + state.wrong;
    const accuracy = total > 0 ? Math.round((state.correct / total) * 100) : 0;

    if (state.altitude > userData.bestAltitude) userData.bestAltitude = state.altitude;
    userData.totalRuns += 1;
    const allBadges = new Set([...(userData.badges || []), ...state.badges]);
    userData.badges = window.V42Logic.BADGES.filter((b) => allBadges.has(b.id)).map((b) => b.id);
    saveUserData();

    saveSession({ accuracy, total });

    const badgeIcons = window.V42Logic.BADGES.filter((b) => state.badges.includes(b.id)).map((b) => b.icon).join('  ') || 'Chưa có huy hiệu lần này';

    if (state.outcome === 'won') {
      if (balloonChar) balloonChar.setState('happy');
      spawnConfetti($('game-screen'), 40);
      $('victory-badges').textContent = badgeIcons;
      $('victory-detail').innerHTML = renderDetail({ accuracy, total });
      showScreen('victory-screen');
    } else {
      $('tryagain-badges').textContent = badgeIcons;
      $('tryagain-detail').innerHTML = renderDetail({ accuracy, total });
      showScreen('tryagain-screen');
    }

    if (typeof window.checkAndShowPrompt === 'function') {
      try { window.checkAndShowPrompt(); } catch (e) {}
    }
  }

  function renderDetail({ accuracy, total }) {
    return `
      📈 Độ cao: ${state.altitude}/${state.maxAltitude} m<br>
      ✅ Đúng: ${state.correct}/${total} (${accuracy}%)<br>
      🏷️ Huy hiệu lần này: ${state.badges.length}/3<br>
      🔥 Combo dài nhất: ${maxCombo}
    `;
  }

  // ─── API ────────────────────────────────────────────────────────────
  async function saveSession({ accuracy, total }) {
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
          score: state.altitude,
          total_questions: total,
          correct_answers: state.correct,
          stars_earned: state.badges.length,
          combo_max: maxCombo,
          mode: 'v42',
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

  // ─── Init ───────────────────────────────────────────────────────────
  function init() {
    if (!window.V42Logic) {
      setTimeout(init, 30);
      return;
    }
    loadUserData();
    renderStart();
    wireSelectors();

    $('btn-start').addEventListener('click', startRun);
    $('btn-replay-win').addEventListener('click', startRun);
    $('btn-replay-try').addEventListener('click', startRun);

    // Guide modal (available before entering the game).
    const guideModal = $('guide-modal');
    $('btn-guide').addEventListener('click', () => { guideModal.style.display = 'flex'; });
    $('btn-guide-close').addEventListener('click', () => { guideModal.style.display = 'none'; });
    guideModal.addEventListener('click', (e) => { if (e.target === guideModal) guideModal.style.display = 'none'; });

    // Exit button inside the game — confirm before leaving (no window.confirm).
    const exitModal = $('exit-modal');
    $('btn-exit').addEventListener('click', () => { exitModal.style.display = 'flex'; });
    $('btn-exit-cancel').addEventListener('click', () => { exitModal.style.display = 'none'; });
    $('btn-exit-confirm').addEventListener('click', doExit);
    exitModal.addEventListener('click', (e) => { if (e.target === exitModal) exitModal.style.display = 'none'; });
  }

  function doExit() {
    $('exit-modal').style.display = 'none';
    clearInterval(timerHandle);
    if (stateResetHandle) { clearTimeout(stateResetHandle); stateResetHandle = null; }
    window.location.reload();
  }

  // ─── Particle helpers ───────────────────────────────────────────────
  function spawnParticles(parent, kind, count) {
    if (!parent) return;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'pfx pfx-' + kind;
      if (kind === 'star') p.textContent = '✦';
      const tx = (Math.random() * 80 - 40);
      const ty = -(Math.random() * 40 + 20);
      p.style.setProperty('--tx', tx + 'px');
      p.style.setProperty('--ty', ty + 'px');
      p.style.setProperty('--delay', (Math.random() * 0.15) + 's');
      parent.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
  }

  function spawnConfetti(parent, count) {
    if (!parent) return;
    const colors = ['#ff7e5f', '#feb47b', '#ffd700', '#29b6f6', '#66bb6a', '#ab47bc', '#fff'];
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
