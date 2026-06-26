// V44 — Vũ Trụ Cá Mập (controller)
(function () {
  'use strict';

  const STORAGE_KEY = 'v44_shark';
  const QUESTION_LIMIT = 25;

  let userData = { bestDistance: 0, totalRuns: 0, wins: 0 };

  function loadUserData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      userData.bestDistance = Number(parsed.bestDistance) || 0;
      userData.totalRuns = Number(parsed.totalRuns) || 0;
      userData.wins = Number(parsed.wins) || 0;
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
  let subject = 'mix';
  let difficulty = 'easy';
  let questionStartedAt = 0;
  let timerHandle = null;
  let answerLocked = false;
  let fallbackQuestionId = -1;
  let racerChar = null;       // mounted shark sprite
  let bossChar = null;        // mounted boss (kraken) sprite
  let restScared = false;     // keep scared as resting state in boss danger zone

  const SHARK_POOL = ['shark-blue', 'shark-cyan', 'shark-violet', 'hammerhead', 'orca', 'whale', 'sub'];

  const $ = (id) => document.getElementById(id);
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    $(id).classList.add('active');
  }

  function renderStart() {
    $('best-distance').textContent = userData.bestDistance;
    $('total-runs').textContent = userData.totalRuns;
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
    const picked = window.V44Logic.pickNextQuestion({ cache, usedIds });
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

  async function startRun() {
    state = window.V44Logic.initState({ startedAt: Date.now() });
    cache = [];
    usedIds.clear();
    comboStreak = 0;
    maxCombo = 0;
    fallbackQuestionId = -1;

    showScreen('game-screen');
    mountCharacters();
    renderHud();

    $('q-text').textContent = '⏳ Đang tải câu hỏi…';
    $('q-options').innerHTML = '';
    $('feedback').style.display = 'none';

    await fetchQuestions();
    showNextQuestion();
  }

  // Mount the shark racer (random from pool) + boss creature. Called once per run.
  function mountCharacters() {
    const C = window.HocVuiCharacters;
    restScared = false;

    const racerHost = $('racer');
    racerHost.innerHTML = '';
    racerChar = null;
    const id = SHARK_POOL[Math.floor(Math.random() * SHARK_POOL.length)];
    if (C && C.hasSpecies(id)) {
      racerChar = C.createCharacter(id, racerHost, { state: 'idle' });
    } else {
      racerHost.textContent = '🚀'; // emoji fallback
    }

    const bossHost = $('boss-creature');
    bossHost.innerHTML = '';
    bossChar = null;
    if (C && C.hasSpecies('kraken')) {
      bossChar = C.createCharacter('kraken', bossHost, { state: 'idle' });
    } else {
      bossHost.textContent = '🦑'; // emoji fallback (boss)
    }
  }

  function renderHud() {
    $('distance-text').textContent = state.distance;
    const phase = window.V44Logic.getPhase(state.distance, state.bossAttempts, state.maxBossAttempts);
    const badge = $('phase-badge');
    if (phase === 'boss') {
      badge.classList.add('boss');
      badge.textContent = '🦑 TRÙM';
    } else {
      badge.classList.remove('boss');
      badge.textContent = '🚀 ĐUA';
    }
    $('racer').style.left = state.distance + '%';

    // Boss creature appears as we approach + escalates with bossAttempts.
    const track = $('track');
    const bossEl = $('boss-creature');
    track.dataset.boss = String(state.bossAttempts);
    if (state.distance >= 60) bossEl.classList.add('active');
    else bossEl.classList.remove('active');

    // In boss danger zone, the shark rests in a scared/tense state.
    restScared = phase === 'boss';
    syncRacer();
  }

  // Sync the shark sprite to the resting state (idle, or scared in boss zone).
  function syncRacer() {
    if (!racerChar) return;
    racerChar.setState(restScared ? 'scared' : 'idle');
  }

  function showNextQuestion() {
    if (window.V44Logic.isFinished(state)) {
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
    const phase = window.V44Logic.getPhase(state.distance, state.bossAttempts, state.maxBossAttempts);
    const totalMs = window.V44Logic.timerSecondsFor(phase) * 1000;
    const fillEl = $('timer-fill');
    fillEl.classList.remove('warning');
    timerHandle = setInterval(() => {
      const elapsed = Date.now() - questionStartedAt;
      const remaining = Math.max(0, totalMs - elapsed);
      const pct = (remaining / totalMs) * 100;
      fillEl.style.width = pct + '%';
      $('timer-text').textContent = Math.ceil(remaining / 1000);
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
    const phaseBefore = window.V44Logic.getPhase(state.distance, state.bossAttempts, state.maxBossAttempts);

    document.querySelectorAll('.option-btn').forEach((btn) => {
      btn.classList.add('disabled');
      if (btn.dataset.key === correctKey) btn.classList.add('correct');
      else if (btn.dataset.key === selectedKey && !isCorrect) btn.classList.add('wrong');
    });

    if (isCorrect) {
      state = window.V44Logic.applyCorrect(state);
      comboStreak += 1;
      if (comboStreak > maxCombo) maxCombo = comboStreak;
      // Shark dashes forward + bubble/sparkle burst.
      if (racerChar) {
        racerChar.setState('happy');
        setTimeout(syncRacer, 600);
      }
      spawnParticles($('racer'), 'bubble', 8);
      if (phaseBefore === 'boss') spawnParticles($('boss-creature'), 'impact', 7);
    } else {
      state = window.V44Logic.applyWrongOrTimeout(state);
      comboStreak = 0;
      if (racerChar) {
        racerChar.setState('scared');
        setTimeout(syncRacer, 600);
      }
    }

    logAnswer(selectedKey, correctKey, isCorrect, Date.now() - questionStartedAt);
    showFeedback(isCorrect, phaseBefore);
    renderHud();
    setTimeout(advanceAfterFeedback, 1200);
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
    const phase = window.V44Logic.getPhase(state.distance, state.bossAttempts, state.maxBossAttempts);
    state = window.V44Logic.applyWrongOrTimeout(state);
    comboStreak = 0;
    if (racerChar) {
      racerChar.setState('scared');
      setTimeout(syncRacer, 600);
    }
    const fb = $('feedback');
    fb.style.display = 'block';
    fb.className = 'feedback bad';
    fb.textContent = phase === 'boss' ? '⏰ Hết giờ! Trùm đuổi kịp!' : '⏰ Hết giờ! Tàu bị chậm!';
    renderHud();
    setTimeout(advanceAfterFeedback, 1300);
  }

  function showFeedback(isCorrect, phaseBefore) {
    const fb = $('feedback');
    fb.style.display = 'block';
    if (isCorrect) {
      const gain = phaseBefore === 'boss' ? window.V44Logic.BOSS_GAIN : window.V44Logic.RACE_GAIN;
      fb.className = phaseBefore === 'boss' ? 'feedback boss' : 'feedback good';
      fb.textContent = `✅ Đúng! +${gain} bay nhanh`;
    } else {
      const penalty = phaseBefore === 'boss' ? window.V44Logic.BOSS_PENALTY : window.V44Logic.RACE_PENALTY;
      fb.className = 'feedback bad';
      fb.textContent = `❌ Sai mất! −${penalty} chậm lại`;
    }
  }

  function advanceAfterFeedback() {
    if (window.V44Logic.isFinished(state)) finishRun();
    else showNextQuestion();
  }

  function finishRun() {
    clearInterval(timerHandle);
    const total = state.correct + state.wrong;
    const accuracy = total > 0 ? Math.round((state.correct / total) * 100) : 0;

    if (state.distance > userData.bestDistance) userData.bestDistance = state.distance;
    userData.totalRuns += 1;
    if (state.outcome === 'won') userData.wins += 1;
    saveUserData();

    const stars =
      state.outcome === 'won' && state.wrong === 0 ? 3 :
      state.outcome === 'won' ? 2 :
      state.distance >= window.V44Logic.BOSS_THRESHOLD ? 1 : 0;

    saveSession({ stars, accuracy, total });

    const detail = `
      📏 Khoảng cách: ${state.distance}/${window.V44Logic.GOAL_DISTANCE}<br>
      ✅ Đúng: ${state.correct}/${total} (${accuracy}%)<br>
      🦈 Lần đấu boss: ${state.bossAttempts}/${window.V44Logic.MAX_BOSS_ATTEMPTS}<br>
      ⭐ Sao: ${stars}/3
    `;
    if (state.outcome === 'won') {
      $('victory-detail').innerHTML = detail;
      spawnConfetti($('app'), 36);
      showScreen('victory-screen');
    } else {
      $('defeat-detail').innerHTML = detail;
      showScreen('defeat-screen');
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
          score: state.distance,
          total_questions: total,
          correct_answers: state.correct,
          stars_earned: stars,
          combo_max: maxCombo,
          mode: 'v44',
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
    if (!window.V44Logic) {
      setTimeout(init, 30);
      return;
    }
    loadUserData();
    renderStart();
    wireSelectors();
    $('btn-start').addEventListener('click', startRun);
    $('btn-replay-win').addEventListener('click', startRun);
    $('btn-replay-lose').addEventListener('click', startRun);

    // Guide modal (available on the start screen).
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
    window.location.reload();
  }

  // Particle helpers ──────────────────────────────────────────────────────
  function spawnParticles(parent, kind, count) {
    if (!parent) return;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'pfx pfx-' + kind;
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
    const colors = ['#00d4ff', '#6a4bff', '#ffeb3b', '#ff3366', '#7a5cff', '#fff'];
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
