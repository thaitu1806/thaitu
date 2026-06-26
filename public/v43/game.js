// V43 — Pizzeria Của Bé (controller)
(function () {
  'use strict';

  const STORAGE_KEY = 'v43_pizzeria';
  const QUESTION_LIMIT = 24;

  let userData = { totalEarnings: 0, totalShifts: 0 };

  function loadUserData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      userData.totalEarnings = Number(parsed.totalEarnings) || 0;
      userData.totalShifts = Number(parsed.totalShifts) || 0;
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
  let customerStartedAt = 0;
  let timerHandle = null;
  let answerLocked = false;
  let fallbackQuestionId = -1;
  let custChar = null;            // mounted customer sprite (or null → emoji fallback)
  let custStateTimer = null;      // settle-back-to-idle timer
  const CUST_POOL = ['cust-kid', 'cust-girl', 'cust-grandpa', 'cust-cat', 'cust-bear', 'cust-bunny'];

  const $ = (id) => document.getElementById(id);
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    $(id).classList.add('active');
  }

  function renderStart() {
    $('total-earnings').textContent = userData.totalEarnings;
    $('total-shifts').textContent = userData.totalShifts;
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

  // ─── Customer sprite ─────────────────────────────────────────────────────
  // Mount a random animated customer into #customer-char. Falls back to an emoji
  // when the sprite registry / species is unavailable.
  function buildCustomer() {
    const host = $('customer-char');
    if (!host) return;
    host.innerHTML = '';
    custChar = null;
    clearTimeout(custStateTimer);
    const C = window.HocVuiCharacters;
    const id = CUST_POOL[Math.floor(Math.random() * CUST_POOL.length)];
    if (C && C.hasSpecies(id)) {
      custChar = C.createCharacter(id, host, { state: 'idle' });
    } else {
      host.textContent = '🧑';
    }
  }

  // Play a transient state (happy/scared) then settle back to idle.
  function setCustomerState(next, holdMs) {
    if (!custChar) return;
    clearTimeout(custStateTimer);
    custChar.setState(next);
    if (holdMs) {
      custStateTimer = setTimeout(() => {
        if (custChar) custChar.setState('idle');
      }, holdMs);
    }
  }

  // ─── Questions ─────────────────────────────────────────────────────
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
    const picked = window.V43Logic.pickNextQuestion({ cache, usedIds });
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

  // ─── Run flow ──────────────────────────────────────────────────────
  async function startShift() {
    const pizzas = window.V43Logic.rollPizzas();
    state = window.V43Logic.initState({ pizzas, startedAt: Date.now() });
    cache = [];
    usedIds.clear();
    comboStreak = 0;
    maxCombo = 0;
    fallbackQuestionId = -1;

    showScreen('game-screen');
    renderQueue();
    buildCustomer();
    renderCurrentCustomer();

    $('q-text').textContent = '⏳ Đang tải câu hỏi…';
    $('q-options').innerHTML = '';
    $('feedback').style.display = 'none';

    await fetchQuestions();
    showNextQuestion();
  }

  function renderQueue() {
    const queue = $('customer-queue');
    queue.innerHTML = '';
    for (let i = 0; i < state.totalCustomers; i++) {
      const slot = document.createElement('div');
      slot.className = 'queue-slot';
      slot.textContent = '🧑';
      if (i < state.customerIndex) {
        slot.classList.add(i < state.servedCount ? 'served' : 'lost');
      } else if (i === state.customerIndex) {
        slot.classList.add('current');
      }
      queue.appendChild(slot);
    }
  }

  function renderCurrentCustomer() {
    if (window.V43Logic.isFinished(state)) return;
    const pizza = state.pizzas[state.customerIndex];
    $('customer-text').textContent = `${state.customerIndex + 1}/${state.totalCustomers}`;
    $('earnings-text').textContent = state.earnings;
    $('pizza-name').textContent = pizza.name;
    $('pizza-price').textContent = pizza.price;
    $('bubble-text').textContent = `Cho cháu ${pizza.name} nhé!`;

    const row = $('topping-row');
    row.innerHTML = '';
    for (let i = 0; i < state.toppingsServed; i++) {
      const t = document.createElement('span');
      t.className = 'topping-icon';
      t.textContent = pizza.toppingEmojis[i % pizza.toppingEmojis.length];
      row.appendChild(t);
    }
    customerStartedAt = Date.now();
  }

  function showNextQuestion() {
    if (window.V43Logic.isFinished(state)) {
      finishShift();
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
    const totalMs = state.patienceSeconds * 1000;
    const fillEl = $('timer-fill');
    fillEl.classList.remove('warning');
    timerHandle = setInterval(() => {
      const elapsed = Date.now() - customerStartedAt;
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

    const correctKey = (currentQuestion.correct_answer || '').toLowerCase();
    const isCorrect = selectedKey === correctKey;
    const patienceMs = state.patienceSeconds * 1000;
    const msRemaining = Math.max(0, patienceMs - (Date.now() - customerStartedAt));

    document.querySelectorAll('.option-btn').forEach((btn) => {
      btn.classList.add('disabled');
      if (btn.dataset.key === correctKey) btn.classList.add('correct');
      else if (btn.dataset.key === selectedKey && !isCorrect) btn.classList.add('wrong');
    });

    const prevCustomer = state.customerIndex;
    const prevEarnings = state.earnings;
    if (isCorrect) {
      state = window.V43Logic.applyCorrect(state, { msRemaining, patienceMs });
      comboStreak += 1;
      if (comboStreak > maxCombo) maxCombo = comboStreak;
    } else {
      state = window.V43Logic.applyWrongOrTimeout(state, { kind: 'wrong' });
      comboStreak = 0;
    }

    logAnswer(selectedKey, correctKey, isCorrect, Date.now() - questionStartedAt);
    const justServed = state.customerIndex > prevCustomer;
    showFeedback(isCorrect, justServed, state.earnings - prevEarnings);
    renderQueue();
    if (justServed) {
      clearInterval(timerHandle);
      // Customer cheers, gets a coin + sparkle burst, then a new customer walks up.
      setCustomerState('happy', 0);
      spawnParticles($('customer-char'), 'coin', 9);
      spawnParticles($('customer-char'), 'sparkle', 6);
      renderCurrentCustomer();
      setTimeout(buildCustomer, 850);
    } else if (isCorrect) {
      // Topping added but pizza not done yet — quick topping sparkle.
      spawnParticles($('customer-char'), 'topping', 7);
      renderToppings();
    } else {
      // Wrong answer — customer gets impatient.
      setCustomerState('scared', 700);
      renderToppings();
    }

    $('earnings-text').textContent = state.earnings;
    setTimeout(advanceAfterFeedback, 1300);
  }

  function renderToppings() {
    if (window.V43Logic.isFinished(state)) return;
    const pizza = state.pizzas[state.customerIndex];
    const row = $('topping-row');
    row.innerHTML = '';
    for (let i = 0; i < state.toppingsServed; i++) {
      const t = document.createElement('span');
      t.className = 'topping-icon';
      t.textContent = pizza.toppingEmojis[i % pizza.toppingEmojis.length];
      row.appendChild(t);
    }
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
    state = window.V43Logic.applyWrongOrTimeout(state, { kind: 'timeout' });
    comboStreak = 0;
    const fb = $('feedback');
    fb.style.display = 'block';
    fb.className = 'feedback bad';
    fb.textContent = '⏰ Khách bỏ đi!';
    setCustomerState('scared', 0);
    renderQueue();
    setTimeout(() => {
      renderCurrentCustomer();
      buildCustomer();
      advanceAfterFeedback();
    }, 1300);
  }

  function showFeedback(isCorrect, justServed, reward) {
    const fb = $('feedback');
    fb.style.display = 'block';
    if (justServed) {
      fb.className = 'feedback tip';
      fb.textContent = `🍕 Giao xong! +${reward}k`;
    } else if (isCorrect) {
      fb.className = 'feedback good';
      fb.textContent = '✅ Đúng! Thêm 1 topping.';
    } else {
      fb.className = 'feedback bad';
      fb.textContent = '❌ Sai mất! Thử lại.';
    }
  }

  function advanceAfterFeedback() {
    if (window.V43Logic.isFinished(state)) finishShift();
    else showNextQuestion();
  }

  function finishShift() {
    clearInterval(timerHandle);
    clearTimeout(custStateTimer);
    const total = state.correct + state.wrong;
    const accuracy = total > 0 ? Math.round((state.correct / total) * 100) : 0;
    const stars =
      state.servedCount >= 5 ? 3 : state.servedCount >= 3 ? 2 : state.servedCount >= 1 ? 1 : 0;

    userData.totalEarnings += state.earnings;
    userData.totalShifts += 1;
    saveUserData();

    saveSession({ stars, accuracy, total });

    $('result-detail').innerHTML = `
      💰 Lợi nhuận ca: ${state.earnings}k<br>
      🍕 Khách đã phục vụ: ${state.servedCount}/${state.totalCustomers}<br>
      ✅ Câu đúng: ${state.correct}/${total} (${accuracy}%)<br>
      ⭐ Sao: ${stars}/3
    `;
    $('result-title').textContent =
      state.servedCount === state.totalCustomers ? '🎉 Hoàn Hảo!' : '🍕 Kết Ca!';
    showScreen('result-screen');

    // Celebrate a productive shift with confetti.
    if (state.servedCount >= 3) spawnConfetti($('result-screen'), 44);

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
          score: state.earnings,
          total_questions: total,
          correct_answers: state.correct,
          stars_earned: stars,
          combo_max: maxCombo,
          mode: 'v43',
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
    const colors = ['#f39c12', '#ffd700', '#e8623a', '#4caf50', '#d6336c', '#fff'];
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

  function init() {
    if (!window.V43Logic) {
      setTimeout(init, 30);
      return;
    }
    loadUserData();
    renderStart();
    wireSelectors();
    $('btn-start').addEventListener('click', startShift);
    $('btn-replay').addEventListener('click', startShift);

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
    clearTimeout(custStateTimer);
    window.location.reload();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
