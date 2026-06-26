// V46 — Tiệm Cây Cảnh (controller)
(function () {
  'use strict';
  const STORAGE_KEY = 'v46_bonsai';
  const QUESTION_LIMIT = 28;

  let userData = { totalBonsai: 0, species: [] };
  function loadUserData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      userData.totalBonsai = Number(parsed.totalBonsai) || 0;
      userData.species = Array.isArray(parsed.species) ? parsed.species : [];
    } catch (e) {}
  }
  function saveUserData() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(userData)); } catch(e){} }

  let state = null, cache = [], usedIds = new Set();
  let currentQuestion = null, comboStreak = 0, maxCombo = 0;
  let subject = 'mix', difficulty = 'easy';
  let questionStartedAt = 0, timerHandle = null, answerLocked = false, fallbackQuestionId = -1;
  let potRefs = [];  // [{ el, char }] per pot index

  const $ = (id) => document.getElementById(id);
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    $(id).classList.add('active');
  }

  function renderStart() {
    $('total-bonsai').textContent = userData.totalBonsai;
    $('total-species').textContent = userData.species.length;
  }
  function wireSelectors() {
    document.querySelectorAll('.selector-options').forEach(g => {
      g.addEventListener('click', e => {
        const btn = e.target.closest('.sel-btn');
        if (!btn) return;
        g.querySelectorAll('.sel-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (g.dataset.group === 'subject') subject = btn.dataset.value;
        else difficulty = btn.dataset.value;
      });
    });
  }

  async function fetchQuestions() {
    const profile = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
    const grade = profile.grade || 2;
    try {
      if (subject === 'mix') {
        const subs = ['math', 'vietnamese', 'english'];
        const per = Math.ceil(QUESTION_LIMIT / subs.length);
        const r = await Promise.all(subs.map(s =>
          fetch(`/api/questions?subject=${s}&difficulty=${difficulty}&limit=${per}&grade=${grade}`)
            .then(x => x.ok ? x.json() : []).catch(() => [])
        ));
        cache = r.flat();
      } else {
        const res = await fetch(`/api/questions?subject=${subject}&difficulty=${difficulty}&limit=${QUESTION_LIMIT}&grade=${grade}`);
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
    const p = window.V46Logic.pickNextQuestion({ cache, usedIds });
    if (p) { usedIds.add(p.id); return p; }
    return makeFallback();
  }
  function makeFallback() {
    const a = 1 + Math.floor(Math.random() * 20), b = 1 + Math.floor(Math.random() * 20);
    const correct = a + b;
    const distractors = new Set();
    while (distractors.size < 3) {
      const off = [-3, -2, -1, 1, 2, 3][Math.floor(Math.random() * 6)];
      const w = correct + off;
      if (w > 0 && w !== correct) distractors.add(w);
    }
    const nums = [correct, ...distractors].sort(() => Math.random() - 0.5);
    const correctKey = 'abcd'[nums.indexOf(correct)];
    fallbackQuestionId--;
    return {
      id: fallbackQuestionId,
      question_text: `${a} + ${b} = ?`,
      option_a: String(nums[0]), option_b: String(nums[1]),
      option_c: String(nums[2]), option_d: String(nums[3]),
      correct_answer: correctKey,
    };
  }

  async function startRun() {
    state = window.V46Logic.initState({ startedAt: Date.now() });
    cache = []; usedIds.clear(); comboStreak = 0; maxCombo = 0; fallbackQuestionId = -1;
    showScreen('game-screen');
    renderHud(); buildPots(); syncPots();
    $('q-text').textContent = '⏳ Đang tải câu hỏi…';
    $('q-options').innerHTML = '';
    $('feedback').style.display = 'none';
    await fetchQuestions();
    showNextQuestion();
  }

  function renderHud() {
    $('collected-text').textContent = state.collectedCount;
    $('progress-text').textContent = `${state.questionsServed}/${state.maxQuestions}`;
  }
  // Build the pot row once per run. Mounts a plant sprite into each pot,
  // falling back to the stage emoji if the sprite registry is unavailable.
  function buildPots() {
    const row = $('pot-row');
    row.innerHTML = '';
    potRefs = [];
    const C = window.HocVuiCharacters;
    state.pots.forEach((pot, i) => {
      const el = document.createElement('div');
      el.className = 'pot';
      el.dataset.stage = String(pot.stage);
      el.title = pot.species.name;
      let char = null;
      if (C && C.hasSpecies(pot.species.id)) {
        char = C.createCharacter(pot.species.id, el, { state: 'idle' });
      } else {
        // Emoji fallback path.
        const span = document.createElement('span');
        span.className = 'pot-emoji';
        el.appendChild(span);
      }
      el.addEventListener('click', () => {
        state = window.V46Logic.selectPot(state, i);
        syncPots();
      });
      row.appendChild(el);
      potRefs.push({ el, char });
    });
  }

  // Sync stage / selected / full classes + data-stage + sprite state.
  // happyIdx (optional) flags a pot that just grew → brief happy bloom.
  function syncPots(happyIdx) {
    const MAX = window.V46Logic.MAX_STAGE;
    const stageEmojis = window.V46Logic.STAGE_EMOJIS;
    state.pots.forEach((pot, i) => {
      const ref = potRefs[i];
      if (!ref) return;
      const el = ref.el;
      const isFull = pot.stage === MAX;
      el.dataset.stage = String(pot.stage);
      el.classList.toggle('selected', i === state.selectedPotIndex && !isFull);
      el.classList.toggle('full', isFull);
      if (ref.char) {
        if (isFull || i === happyIdx) ref.char.setState('happy');
        else ref.char.setState('idle');
      } else {
        // Emoji fallback rendering.
        const span = el.querySelector('.pot-emoji');
        if (span) {
          if (isFull) span.textContent = pot.species.emoji;
          else if (pot.stage === 0) span.textContent = '🌱';
          else span.textContent = stageEmojis[pot.stage];
        }
      }
    });
  }

  // Settle a freshly-grown pot back to idle after the happy bounce
  // (a fully-grown pot keeps its happy/glow state).
  function settlePots() {
    const MAX = window.V46Logic.MAX_STAGE;
    state.pots.forEach((pot, i) => {
      const ref = potRefs[i];
      if (ref && ref.char && pot.stage !== MAX) ref.char.setState('idle');
    });
  }

  function showNextQuestion() {
    if (window.V46Logic.isFinished(state)) { finishRun(); return; }
    currentQuestion = nextQuestion();
    answerLocked = false;
    questionStartedAt = Date.now();
    $('q-text').textContent = currentQuestion.question_text;
    $('feedback').style.display = 'none';
    const opts = $('q-options');
    opts.innerHTML = '';
    ['a','b','c','d'].forEach(k => {
      const t = currentQuestion[`option_${k}`];
      if (t == null) return;
      const btn = document.createElement('button');
      btn.className = 'option-btn'; btn.dataset.key = k; btn.textContent = t;
      btn.addEventListener('click', () => handleAnswer(k));
      opts.appendChild(btn);
    });
    startTimer();
  }

  function startTimer() {
    clearInterval(timerHandle);
    const totalMs = window.V46Logic.TIMER_SECONDS * 1000;
    const fill = $('timer-fill');
    fill.classList.remove('warning');
    timerHandle = setInterval(() => {
      const remaining = Math.max(0, totalMs - (Date.now() - questionStartedAt));
      fill.style.width = (remaining / totalMs) * 100 + '%';
      if (remaining <= totalMs / 3) fill.classList.add('warning');
      if (remaining <= 0) { clearInterval(timerHandle); handleTimeout(); }
    }, 100);
  }

  function handleAnswer(selected) {
    if (answerLocked) return;
    answerLocked = true; clearInterval(timerHandle);
    const correctKey = (currentQuestion.correct_answer || '').toLowerCase();
    const isCorrect = selected === correctKey;
    document.querySelectorAll('.option-btn').forEach(b => {
      b.classList.add('disabled');
      if (b.dataset.key === correctKey) b.classList.add('correct');
      else if (b.dataset.key === selected && !isCorrect) b.classList.add('wrong');
    });
    const prevStages = state.pots.map(p => p.stage);
    const prevCollected = state.collectedCount;
    if (isCorrect) {
      state = window.V46Logic.applyCorrect(state);
      comboStreak++; if (comboStreak > maxCombo) maxCombo = comboStreak;
    } else {
      state = window.V46Logic.applyWrongOrTimeout(state);
      comboStreak = 0;
    }
    logAnswer(selected, correctKey, isCorrect, Date.now() - questionStartedAt);
    // Find which pot grew this turn.
    let grownIdx = -1;
    for (let i = 0; i < state.pots.length; i++) {
      if (state.pots[i].stage > prevStages[i]) { grownIdx = i; break; }
    }
    const fb = $('feedback');
    fb.style.display = 'block';
    fb.className = isCorrect ? 'feedback good' : 'feedback bad';
    fb.textContent = isCorrect ? '✅ Đúng! Cây lớn lên 🌱→🌿' : '❌ Sai mất! Cây chưa lớn.';
    renderHud(); syncPots(grownIdx);
    // Particles on the pot that grew; bigger burst if it just became bonsai.
    if (grownIdx >= 0 && potRefs[grownIdx]) {
      const justFull = state.collectedCount > prevCollected;
      spawnParticles(potRefs[grownIdx].el, justFull ? 'bloom' : 'leaf', justFull ? 14 : 8);
    } else if (!isCorrect) {
      droopSelected();
    }
    setTimeout(() => { settlePots(); }, 600);
    setTimeout(() => {
      if (window.V46Logic.isFinished(state)) finishRun();
      else showNextQuestion();
    }, 1100);
  }

  function handleTimeout() {
    if (answerLocked) return;
    answerLocked = true;
    state = window.V46Logic.applyWrongOrTimeout(state);
    comboStreak = 0;
    const fb = $('feedback');
    fb.style.display = 'block';
    fb.className = 'feedback bad';
    fb.textContent = '⏰ Hết giờ!';
    renderHud();
    droopSelected();
    setTimeout(() => {
      if (window.V46Logic.isFinished(state)) finishRun();
      else showNextQuestion();
    }, 1100);
  }

  // Brief wilt/droop on the selected pot's sprite after a wrong/timeout.
  function droopSelected() {
    const ref = potRefs[state.selectedPotIndex];
    if (!ref || !ref.char) return;
    const MAX = window.V46Logic.MAX_STAGE;
    if (state.pots[state.selectedPotIndex].stage >= MAX) return;
    ref.char.setState('scared');
    setTimeout(() => {
      if (ref.char && state.pots[state.selectedPotIndex] &&
          state.pots[state.selectedPotIndex].stage < MAX) {
        ref.char.setState('idle');
      }
    }, 700);
  }

  function finishRun() {
    clearInterval(timerHandle);
    if (state.outcome === 'won') spawnConfetti($('pot-row'), 36);
    const total = state.correct + state.wrong;
    const accuracy = total > 0 ? Math.round((state.correct / total) * 100) : 0;
    userData.totalBonsai += state.collectedCount;
    const earned = state.pots.filter(p => p.stage === window.V46Logic.MAX_STAGE).map(p => p.species.id);
    userData.species = Array.from(new Set([...userData.species, ...earned]));
    saveUserData();
    const stars = state.outcome === 'won' && state.wrong === 0 ? 3 : state.outcome === 'won' ? 2 : state.collectedCount >= 3 ? 1 : 0;
    saveSession({ stars, accuracy, total });
    const badgeIcons = state.pots.filter(p => p.stage === window.V46Logic.MAX_STAGE).map(p => p.species.emoji).join('  ') || '🌱';
    $('result-badges').textContent = badgeIcons;
    $('result-title').textContent = state.outcome === 'won' ? '🎉 Mở Hàng Đẹp!' : '🌱 Tạm Đóng Tiệm';
    $('result-detail').innerHTML = `
      🌳 Bonsai: ${state.collectedCount}/${state.totalPots}<br>
      ✅ Đúng: ${state.correct}/${total} (${accuracy}%)<br>
      ⭐ Sao: ${stars}/3<br>
      🔥 Combo dài nhất: ${maxCombo}
    `;
    showScreen('result-screen');
    if (typeof window.checkAndShowPrompt === 'function') { try { window.checkAndShowPrompt(); } catch(e){} }
  }

  async function saveSession({ stars, accuracy, total }) {
    try {
      const profile = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
      if (!profile.id) return;
      await fetch('/api/sessions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: profile.id, subject: subject === 'mix' ? 'math' : subject, difficulty,
          score: state.collectedCount, total_questions: total,
          correct_answers: state.correct, stars_earned: stars,
          combo_max: maxCombo, mode: 'v46', accuracy,
        }),
      });
    } catch(e){}
  }

  function logAnswer(selected, correct, isCorrect, ms) {
    if (!currentQuestion || currentQuestion.id < 0) return;
    try {
      const profile = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
      if (!profile.id) return;
      fetch('/api/answers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: profile.id, question_id: currentQuestion.id,
          selected_answer: selected, correct_answer: correct,
          is_correct: isCorrect, time_spent_ms: ms, difficulty,
        }),
      }).catch(() => {});
    } catch(e){}
  }

  function init() {
    if (!window.V46Logic) { setTimeout(init, 30); return; }
    loadUserData(); renderStart(); wireSelectors();
    $('btn-start').addEventListener('click', startRun);
    $('btn-replay').addEventListener('click', startRun);
    // Guide modal (available from the start screen).
    const guideModal = $('guide-modal');
    $('btn-guide').addEventListener('click', () => { guideModal.style.display = 'flex'; });
    $('btn-guide-close').addEventListener('click', () => { guideModal.style.display = 'none'; });
    guideModal.addEventListener('click', (e) => { if (e.target === guideModal) guideModal.style.display = 'none'; });
    // Exit button inside the game — styled confirm modal (no window.confirm).
    $('btn-exit').addEventListener('click', () => { $('exit-modal').style.display = 'flex'; });
    const exitModal = $('exit-modal');
    $('btn-exit-cancel').addEventListener('click', () => { exitModal.style.display = 'none'; });
    $('btn-exit-confirm').addEventListener('click', doExit);
    exitModal.addEventListener('click', (e) => { if (e.target === exitModal) exitModal.style.display = 'none'; });
  }

  function doExit() {
    $('exit-modal').style.display = 'none';
    clearInterval(timerHandle);
    window.location.reload();
  }

  // Particle helpers ────────────────────────────────────────────────────────
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
    const colors = ['#ffd54f', '#66bb6a', '#81c784', '#ec407a', '#ff8a65', '#fff'];
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

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
