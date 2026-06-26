// V55 — Sân Bóng Trí Tuệ (controller)
(function () {
  'use strict';
  const STORAGE_KEY = 'v55_soccer';
  const QL = 26;
  let userData = { totalGoals: 0, totalWins: 0 };
  function loadData() { try { const r = localStorage.getItem(STORAGE_KEY); if (r) Object.assign(userData, JSON.parse(r)); } catch(e){} }
  function saveData() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(userData)); } catch(e){} }

  let state = null, cache = [], used = new Set();
  let curQ = null, combo = 0, maxCombo = 0;
  let subject = 'mix', difficulty = 'easy';
  let qStart = 0, tH = null, locked = false, fbId = -1;
  let strikerChar = null, keeperChar = null;   // animated sprites
  const STRIKER_POOL = ['striker', 'striker-2', 'striker-3', 'striker-4'];
  const $ = id => document.getElementById(id);
  const ss = id => { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); $(id).classList.add('active'); };

  function renderStart() {
    $('total-goals').textContent = userData.totalGoals;
    $('total-wins').textContent = userData.totalWins;
  }
  function wireSel() {
    document.querySelectorAll('.selector-options').forEach(g => g.addEventListener('click', e => {
      const b = e.target.closest('.sel-btn'); if (!b) return;
      g.querySelectorAll('.sel-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      if (g.dataset.group === 'subject') subject = b.dataset.value;
      else difficulty = b.dataset.value;
    }));
  }

  async function fetchQ() {
    const p = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
    const g = p.grade || 2;
    try {
      if (subject === 'mix') {
        const subs = ['math', 'vietnamese', 'english'];
        const per = Math.ceil(QL / 3);
        const r = await Promise.all(subs.map(s => fetch(`/api/questions?subject=${s}&difficulty=${difficulty}&limit=${per}&grade=${g}`).then(x => x.ok ? x.json() : []).catch(() => [])));
        cache = r.flat();
      } else {
        const r = await fetch(`/api/questions?subject=${subject}&difficulty=${difficulty}&limit=${QL}&grade=${g}`);
        cache = r.ok ? await r.json() : [];
      }
    } catch(e) { cache = []; }
    if (!Array.isArray(cache)) cache = [];
    for (let i = cache.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cache[i], cache[j]] = [cache[j], cache[i]]; }
  }
  function nextQ() {
    const p = window.V55Logic.pickNextQuestion({ cache, usedIds: used });
    if (p) { used.add(p.id); return p; }
    return mkFallback();
  }
  function mkFallback() {
    const a = 1 + Math.floor(Math.random() * 20), b = 1 + Math.floor(Math.random() * 20);
    const c = a + b;
    const d = new Set();
    while (d.size < 3) { const off = [-3, -2, -1, 1, 2, 3][Math.floor(Math.random() * 6)]; const w = c + off; if (w > 0 && w !== c) d.add(w); }
    const nums = [c, ...d].sort(() => Math.random() - 0.5);
    fbId--;
    return { id: fbId, question_text: `${a} + ${b} = ?`, option_a: String(nums[0]), option_b: String(nums[1]), option_c: String(nums[2]), option_d: String(nums[3]), correct_answer: 'abcd'[nums.indexOf(c)] };
  }

  async function startRun() {
    state = window.V55Logic.initState({ startedAt: Date.now() });
    cache = []; used.clear(); combo = 0; maxCombo = 0; fbId = -1;
    ss('game-screen'); buildChars(); renderHud(); renderScoreboard(); renderRate(); syncChars('idle');
    $('q-text').textContent = '⏳ Đang tải...';
    $('q-options').innerHTML = '';
    $('feedback').style.display = 'none';
    if ($('ball-reaction')) $('ball-reaction').textContent = '⚽';
    await fetchQ();
    showNextQ();
  }

  // Mount a random striker + the keeper once per run (emoji fallback retained).
  function buildChars() {
    const C = window.HocVuiCharacters;
    const sHost = $('striker-char');
    if (sHost) {
      sHost.innerHTML = '';
      strikerChar = null;
      const id = STRIKER_POOL[Math.floor(Math.random() * STRIKER_POOL.length)];
      if (C && C.hasSpecies(id)) strikerChar = C.createCharacter(id, sHost, { state: 'idle' });
      else sHost.textContent = '⚽';
    }
    const kHost = $('keeper-char');
    if (kHost) {
      kHost.innerHTML = '';
      keeperChar = null;
      if (C && C.hasSpecies('keeper')) keeperChar = C.createCharacter('keeper', kHost, { state: 'idle' });
      else kHost.textContent = '😈';
    }
  }

  // Drive striker (and keeper) animation state.
  // s: 'idle' | 'happy' (you scored) | 'scared' (opponent scored)
  function syncChars(s) {
    if (strikerChar) strikerChar.setState(s);
    if (keeperChar) {
      // Keeper celebrates when it concedes against you and slumps when you score.
      if (s === 'scared') keeperChar.setState('happy');
      else if (s === 'happy') keeperChar.setState('scared');
      else keeperChar.setState('idle');
    }
  }

  function renderHud() {
    $('goals-text').textContent = `${state.myGoals}/${window.V55Logic.GOALS_TO_WIN}`;
    $('streak-text').textContent = state.streak;
    $('progress-text').textContent = `${state.questionsServed}/${state.maxQuestions}`;
  }

  function renderScoreboard() {
    $('my-score').textContent = state.myGoals;
    $('opp-score').textContent = state.oppGoals;
  }

  function renderRate() {
    const rate = window.V55Logic.getShotRate(state.streak);
    const pct = Math.round(rate * 100);
    $('shot-rate-text').textContent = `Tỷ lệ sút: ${pct}%`;
    $('shot-rate-fill').style.width = pct + '%';
    if (state.streak >= window.V55Logic.BOOST_STREAK) {
      $('streak-info').textContent = `🔥 Combo ${state.streak} — Siêu sao!`;
    } else if (state.streak >= window.V55Logic.MID_STREAK) {
      $('streak-info').textContent = `⚡ Combo ${state.streak} — Đang nóng!`;
    } else if (state.streak > 0) {
      $('streak-info').textContent = `Combo ${state.streak}`;
    } else {
      $('streak-info').textContent = 'Chưa có combo';
    }
  }

  function showNextQ() {
    if (window.V55Logic.isFinished(state)) { finish(); return; }
    curQ = nextQ();
    locked = false;
    qStart = Date.now();
    $('q-text').textContent = curQ.question_text;
    $('feedback').style.display = 'none';
    const opts = $('q-options');
    opts.innerHTML = '';
    ['a','b','c','d'].forEach(k => {
      const t = curQ[`option_${k}`];
      if (t == null) return;
      const btn = document.createElement('button');
      btn.className = 'option-btn'; btn.dataset.key = k; btn.textContent = t;
      btn.addEventListener('click', () => handleAns(k));
      opts.appendChild(btn);
    });
    startTimer();
  }

  function startTimer() {
    clearInterval(tH);
    const total = window.V55Logic.TIMER_SECONDS * 1000;
    const fill = $('timer-fill'); fill.classList.remove('warning');
    tH = setInterval(() => {
      const rem = Math.max(0, total - (Date.now() - qStart));
      fill.style.width = (rem / total) * 100 + '%';
      if (rem <= total / 3) fill.classList.add('warning');
      if (rem <= 0) { clearInterval(tH); handleTimeout(); }
    }, 100);
  }

  function handleAns(sel) {
    if (locked) return;
    locked = true; clearInterval(tH);
    const ck = (curQ.correct_answer || '').toLowerCase();
    const ok = sel === ck;
    document.querySelectorAll('.option-btn').forEach(b => {
      b.classList.add('disabled');
      if (b.dataset.key === ck) b.classList.add('correct');
      else if (b.dataset.key === sel && !ok) b.classList.add('wrong');
    });
    const prevMy = state.myGoals, prevOpp = state.oppGoals;
    if (ok) {
      state = window.V55Logic.applyCorrect(state);
      combo++; if (combo > maxCombo) maxCombo = combo;
    } else {
      state = window.V55Logic.applyWrongOrTimeout(state);
      combo = 0;
    }
    logAns(sel, ck, ok, Date.now() - qStart);
    const fb = $('feedback');
    fb.style.display = 'block';
    const react = $('ball-reaction');
    const ballHost = $('striker-char') || $('ball-area');
    if (state.myGoals > prevMy) {
      fb.className = 'feedback bonus';
      fb.textContent = `⚽🥅 GOAL! ${state.myGoals}-${state.oppGoals}`;
      if (react) react.innerHTML = '<span class="floating">⚽🥅</span>';
      syncChars('happy');
      spawnParticles(ballHost, 'kick', 10);
      spawnBall(ballHost);
      setTimeout(() => syncChars('idle'), 900);
    } else if (ok) {
      fb.className = 'feedback good';
      fb.textContent = '✅ Đúng nhưng cú sút ra ngoài!';
      if (react) react.textContent = '⚽😅';
      syncChars('happy');
      spawnParticles(ballHost, 'sparkle', 5);
      setTimeout(() => syncChars('idle'), 700);
    } else if (state.oppGoals > prevOpp) {
      fb.className = 'feedback bad';
      fb.textContent = `❌ Đối thủ ghi bàn! ${state.myGoals}-${state.oppGoals}`;
      if (react) react.textContent = '😈⚽';
      syncChars('scared');
      spawnParticles(ballHost, 'puff', 8);
      setTimeout(() => syncChars('idle'), 900);
    } else {
      fb.className = 'feedback bad';
      fb.textContent = '❌ Sai, đối thủ sút trượt.';
      if (react) react.textContent = '⚽💨';
      syncChars('scared');
      setTimeout(() => syncChars('idle'), 700);
    }
    renderHud(); renderScoreboard(); renderRate();
    setTimeout(() => { if (window.V55Logic.isFinished(state)) finish(); else showNextQ(); }, 1100);
  }

  function handleTimeout() {
    if (locked) return;
    locked = true;
    const prevOpp = state.oppGoals;
    state = window.V55Logic.applyWrongOrTimeout(state);
    combo = 0;
    const fb = $('feedback'); fb.style.display = 'block';
    fb.className = 'feedback bad';
    fb.textContent = state.oppGoals > prevOpp ? '⏰ Hết giờ! Đối thủ ghi bàn.' : '⏰ Hết giờ!';
    const react = $('ball-reaction'); if (react) react.textContent = '⏰⚽';
    syncChars('scared');
    if (state.oppGoals > prevOpp) spawnParticles($('striker-char') || $('ball-area'), 'puff', 8);
    setTimeout(() => syncChars('idle'), 900);
    renderHud(); renderScoreboard(); renderRate();
    setTimeout(() => { if (window.V55Logic.isFinished(state)) finish(); else showNextQ(); }, 1100);
  }

  function finish() {
    clearInterval(tH);
    const total = state.correct + state.wrong;
    const acc = total > 0 ? Math.round((state.correct / total) * 100) : 0;
    userData.totalGoals += state.myGoals;
    if (state.outcome === 'won') userData.totalWins += 1;
    saveData();
    let stars = 0;
    if (state.outcome === 'won') stars = state.oppGoals === 0 ? 3 : 2;
    else if (state.myGoals >= 2) stars = 1;
    saveSession({ stars, acc, total });

    // Climax: striker cheers + confetti on a win.
    let delay = 0;
    if (state.outcome === 'won') {
      syncChars('happy');
      spawnConfetti(document.querySelector('.field-stage') || $('ball-area'), 40);
      delay = 1100;
    } else if (state.outcome === 'lost') {
      syncChars('scared');
    }

    setTimeout(() => {
      $('result-badges').textContent = `${state.myGoals} - ${state.oppGoals}`;
      let title = '⚽ Kết Trận';
      if (state.outcome === 'won') title = '🏆 Chiến Thắng Rực Rỡ!';
      else if (state.outcome === 'lost') title = '😅 Thua Cuộc';
      $('result-title').textContent = title;
      $('result-emoji').textContent = state.outcome === 'won' ? '🏆' : state.outcome === 'lost' ? '😅' : '⚽';
      $('result-detail').innerHTML = `
        🥅 Tỷ số: ${state.myGoals} - ${state.oppGoals}<br>
        🎯 Sút: ${state.myGoals}/${state.shots}<br>
        ✅ Đúng: ${state.correct}/${total} (${acc}%)<br>
        ⭐ Sao: ${stars}/3
      `;
      ss('result-screen');
      if (typeof window.checkAndShowPrompt === 'function') { try { window.checkAndShowPrompt(); } catch(e){} }
    }, delay);
  }

  async function saveSession({ stars, acc, total }) {
    try {
      const p = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
      if (!p.id) return;
      await fetch('/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        player_id: p.id, subject: subject === 'mix' ? 'math' : subject, difficulty,
        score: state.myGoals, total_questions: total, correct_answers: state.correct,
        stars_earned: stars, combo_max: maxCombo, mode: 'v55', accuracy: acc,
      })});
    } catch(e){}
  }
  function logAns(sel, ck, ok, ms) {
    if (!curQ || curQ.id < 0) return;
    try {
      const p = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
      if (!p.id) return;
      fetch('/api/answers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        player_id: p.id, question_id: curQ.id, selected_answer: sel, correct_answer: ck,
        is_correct: ok, time_spent_ms: ms, difficulty,
      })}).catch(() => {});
    } catch(e){}
  }

  function init() {
    if (!window.V55Logic) { setTimeout(init, 30); return; }
    loadData(); renderStart(); wireSel();
    $('btn-start').addEventListener('click', startRun);
    $('btn-replay').addEventListener('click', startRun);
    // Guide modal (available before entering the game).
    const guideModal = $('guide-modal');
    $('btn-guide').addEventListener('click', () => { guideModal.style.display = 'flex'; });
    $('btn-guide-close').addEventListener('click', () => { guideModal.style.display = 'none'; });
    guideModal.addEventListener('click', (e) => { if (e.target === guideModal) guideModal.style.display = 'none'; });
    // Exit button inside the game — confirm before leaving (no window.confirm).
    $('btn-exit').addEventListener('click', confirmExit);
    const exitModal = $('exit-modal');
    $('btn-exit-cancel').addEventListener('click', () => { exitModal.style.display = 'none'; });
    $('btn-exit-confirm').addEventListener('click', doExit);
    exitModal.addEventListener('click', (e) => { if (e.target === exitModal) exitModal.style.display = 'none'; });
  }

  function confirmExit() {
    $('exit-modal').style.display = 'flex';
  }

  function doExit() {
    $('exit-modal').style.display = 'none';
    clearInterval(tH);
    window.location.reload();
  }

  // Particle helpers (recolored from v41/v49 for the green pitch palette) ──────
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

  // A single ⚽ that arcs toward the goal when you score.
  function spawnBall(parent) {
    if (!parent) return;
    const p = document.createElement('span');
    p.className = 'pfx pfx-ball';
    p.textContent = '⚽';
    p.style.setProperty('--tx', (Math.random() * 30 + 20) + 'px');
    p.style.setProperty('--ty', -(Math.random() * 20 + 30) + 'px');
    parent.appendChild(p);
    p.addEventListener('animationend', () => p.remove(), { once: true });
  }

  function spawnConfetti(parent, count) {
    if (!parent) return;
    const colors = ['#ffeb3b', '#4caf50', '#fff', '#43a047', '#aed581', '#ffd54f'];
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
