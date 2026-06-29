// V53 — Đặc Vụ Mèo (controller)
(function () {
  'use strict';
  const STORAGE_KEY = 'v53_spy';
  const QL = 26;
  let userData = { totalWins: 0, totalIntel: 0 };
  function loadData() { try { const r = localStorage.getItem(STORAGE_KEY); if (r) Object.assign(userData, JSON.parse(r)); } catch(e){} }
  function saveData() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(userData)); } catch(e){} }

  let state = null, cache = [], used = new Set();
  let curQ = null, combo = 0, maxCombo = 0;
  let subject = 'mix', difficulty = 'easy';
  let qStart = 0, tH = null, locked = false, fbId = -1;
  let spyChar = null;            // mounted agent sprite (or null → emoji fallback)
  let spyStateTimer = null;      // settle-back-to-idle timer
  let spyId = null;              // chosen species for this run
  const SPY_POOL = ['spy-shadow', 'spy-detective', 'spy-ninja', 'spy-agent', 'spy-tux', 'spy-golden'];
  const $ = id => document.getElementById(id);
  const ss = id => { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); $(id).classList.add('active'); };

  function renderStart() {
    $('total-wins').textContent = userData.totalWins;
    $('total-intel').textContent = userData.totalIntel;
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
    const g = p.grade ?? 2;
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
    const p = window.V53Logic.pickNextQuestion({ cache, usedIds: used });
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
    state = window.V53Logic.initState({ startedAt: Date.now() });
    cache = []; used.clear(); combo = 0; maxCombo = 0; fbId = -1;
    pickSpy();
    ss('game-screen'); renderHud(); renderTower(); renderAlarms(); renderIntel();
    $('q-text').textContent = '⏳ Đang tải...';
    $('q-options').innerHTML = '';
    $('feedback').style.display = 'none';
    await fetchQ();
    showNextQ();
  }

  // Pick a random agent species once per run.
  function pickSpy() {
    spyChar = null;
    clearTimeout(spyStateTimer);
    const C = window.HocVuiCharacters;
    const id = SPY_POOL[Math.floor(Math.random() * SPY_POOL.length)];
    spyId = (C && C.hasSpecies(id)) ? id : null;
  }

  // Mount the agent sprite into the current floor row (re-created each render so
  // it "climbs" with the spy). Falls back to an emoji when sprites are missing.
  function mountSpy(host) {
    if (!host) return;
    host.innerHTML = '';
    spyChar = null;
    const C = window.HocVuiCharacters;
    if (spyId && C && C.hasSpecies(spyId)) {
      spyChar = C.createCharacter(spyId, host, { state: 'idle' });
    } else {
      host.textContent = '🐱';
    }
  }

  // Reflect game state onto the agent sprite. Transient states (happy/scared)
  // play briefly then settle back to idle.
  function setSpyState(next, holdMs) {
    if (!spyChar) return;
    clearTimeout(spyStateTimer);
    spyChar.setState(next);
    if (holdMs) {
      spyStateTimer = setTimeout(() => { if (spyChar) spyChar.setState('idle'); }, holdMs);
    }
  }

  function renderHud() {
    $('floor-text').textContent = `${state.floor}/${state.floors}`;
    $('alarm-text').textContent = `${state.alarms}/${state.maxAlarms}`;
    $('progress-text').textContent = `${state.questionsServed}/${state.maxQuestions}`;
  }

  function renderTower() {
    const tw = $('tower');
    tw.innerHTML = '';
    // The agent stands on the current floor (floor 1 at the start / ground).
    const agentFloor = Math.min(state.floors, Math.max(1, state.floor));
    for (let i = 1; i <= state.floors; i++) {
      const f = document.createElement('div');
      f.className = 'floor';
      if (i < state.floor) f.classList.add('cleared');
      else if (i === state.floor) f.classList.add('current');
      const label = document.createElement('span');
      label.className = 'floor-label';
      label.textContent = `Tầng ${i} ${i === state.floors ? '🎯' : i < state.floor ? '✓' : ''}`;
      f.appendChild(label);
      if (i === agentFloor) {
        f.classList.add('has-agent');
        const host = document.createElement('div');
        host.className = 'floor-agent';
        f.appendChild(host);
        mountSpy(host);
      }
      tw.appendChild(f);
    }
  }

  function renderAlarms() {
    const row = $('alarm-row');
    row.innerHTML = '';
    for (let i = 0; i < state.maxAlarms; i++) {
      const a = document.createElement('span');
      a.className = 'alarm-pip' + (i < state.alarms ? ' on' : '');
      a.textContent = '🚨';
      row.appendChild(a);
    }
  }

  function renderIntel() {
    const row = $('intel-row');
    row.innerHTML = '';
    state.intel.forEach(i => {
      const el = document.createElement('span');
      el.className = 'intel';
      el.textContent = i;
      row.appendChild(el);
    });
  }

  function showNextQ() {
    if (window.V53Logic.isFinished(state)) { finish(); return; }
    curQ = nextQ();
    locked = false;
    qStart = Date.now();
    $('q-text').textContent = curQ.question_text;
    $('feedback').style.display = 'none';
    const opts = $('q-options');
    opts.innerHTML = '';
    if (window.HocVuiQuiz && window.HocVuiQuiz.render) {
      window.HocVuiQuiz.render({ questionEl: $('q-text'), optionsEl: opts, question: curQ, onResult: (ok) => handleAns(ok) });
    } else {
      ['a','b','c','d'].forEach(k => { const t = curQ[`option_${k}`]; if (t == null) return; const btn = document.createElement('button'); btn.className = 'option-btn'; btn.dataset.key = k; btn.textContent = t; btn.addEventListener('click', () => handleAns(k)); opts.appendChild(btn); });
    }
    startTimer();
  }

  function startTimer() {
    clearInterval(tH);
    const total = window.V53Logic.TIMER_SECONDS * 1000;
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
    const ok = (typeof sel === 'boolean') ? sel : (String(sel).toLowerCase() === ck);
    if (typeof sel !== 'boolean') {
      document.querySelectorAll('.option-btn').forEach(b => {
      b.classList.add('disabled');
      if (b.dataset.key === ck) b.classList.add('correct');
      else if (b.dataset.key === sel && !ok) b.classList.add('wrong');
    });
    }
    const prevIntel = state.intel.length;
    const prevFloor = state.floor;
    if (ok) {
      state = window.V53Logic.applyCorrect(state);
      combo++; if (combo > maxCombo) maxCombo = combo;
    } else {
      state = window.V53Logic.applyWrongOrTimeout(state);
      combo = 0;
    }
    logAns(sel, ck, ok, Date.now() - qStart);
    const fb = $('feedback');
    fb.style.display = 'block';
    const gotIntel = state.intel.length > prevIntel;
    if (gotIntel) {
      const last = state.intel[state.intel.length - 1];
      fb.className = 'feedback bonus';
      fb.textContent = `${last} Lấy được tài liệu mật!`;
    } else if (ok) {
      fb.className = 'feedback good';
      fb.textContent = '✅ Lén qua tầng!';
    } else {
      fb.className = 'feedback bad';
      fb.textContent = '🚨 Bị phát hiện! Báo động kêu.';
    }
    renderHud(); renderTower(); renderAlarms(); renderIntel();
    // Animate the freshly-mounted agent + spawn particles on its floor.
    const host = document.querySelector('.floor-agent');
    if (ok) {
      setSpyState('happy', 700);
      if (state.floor > prevFloor) spawnParticles(host, 'sparkle', 7);
      if (gotIntel) spawnParticles(host, 'intel', 6);
    } else {
      setSpyState('scared', 900);
      spawnParticles(host, 'alarm', 5);
    }
    setTimeout(() => { if (window.V53Logic.isFinished(state)) finish(); else showNextQ(); }, 1100);
  }

  function handleTimeout() {
    if (locked) return;
    locked = true;
    state = window.V53Logic.applyWrongOrTimeout(state);
    combo = 0;
    const fb = $('feedback'); fb.style.display = 'block';
    fb.className = 'feedback bad'; fb.textContent = '⏰ Hết giờ! Báo động kêu.';
    renderHud(); renderTower(); renderAlarms();
    setSpyState('scared', 900);
    spawnParticles(document.querySelector('.floor-agent'), 'alarm', 5);
    setTimeout(() => { if (window.V53Logic.isFinished(state)) finish(); else showNextQ(); }, 1100);
  }

  function finish() {
    clearInterval(tH);
    clearTimeout(spyStateTimer);
    const total = state.correct + state.wrong;
    const acc = total > 0 ? Math.round((state.correct / total) * 100) : 0;
    userData.totalIntel += state.intel.length;
    if (state.outcome === 'won') userData.totalWins += 1;
    saveData();
    let stars = 0;
    if (state.outcome === 'won') stars = 3;
    else if (state.floor >= 6) stars = 2;
    else if (state.floor >= 3) stars = 1;
    saveSession({ stars, acc, total });

    // Win climax: agent celebrates + confetti rains over the tower.
    let delay = 0;
    if (state.outcome === 'won') {
      setSpyState('happy', 0);
      spawnConfetti($('game-screen'), 42);
      delay = 1200;
    }

    setTimeout(() => {
      const badges = state.intel.join(' ') || '🐱';
      $('result-badges').textContent = badges;
      let title = '🐱 Kết Nhiệm Vụ';
      if (state.outcome === 'won') title = '🎯 Đặc Vụ Xuất Sắc!';
      else if (state.outcome === 'caught') title = '🚨 Bị Bắt Rồi!';
      $('result-title').textContent = title;
      $('result-emoji').textContent = state.outcome === 'won' ? '🎯' : state.outcome === 'caught' ? '🚨' : '🐱';
      $('result-detail').innerHTML = `
        🏢 Tầng: ${state.floor}/${state.floors}<br>
        📁 Tài liệu: ${state.intel.length}<br>
        🚨 Báo động: ${state.alarms}/${state.maxAlarms}<br>
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
        score: state.floor, total_questions: total, correct_answers: state.correct,
        stars_earned: stars, combo_max: maxCombo, mode: 'v53', accuracy: acc,
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

  // Particle helpers ──────────────────────────────────────────────────────
  function spawnParticles(parent, kind, count) {
    if (!parent) return;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'pfx pfx-' + kind;
      if (kind === 'intel') p.textContent = '📁';
      else if (kind === 'alarm') p.textContent = '❗';
      p.style.setProperty('--tx', (Math.random() * 70 - 35) + 'px');
      p.style.setProperty('--ty', -(Math.random() * 38 + 22) + 'px');
      p.style.setProperty('--delay', (Math.random() * 0.15) + 's');
      parent.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
  }

  function spawnConfetti(parent, count) {
    if (!parent) return;
    const colors = ['#e94560', '#f5d27a', '#4caf50', '#00bcd4', '#c2185b', '#fff'];
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
    if (!window.V53Logic) { setTimeout(init, 30); return; }
    loadData(); renderStart(); wireSel();
    $('btn-start').addEventListener('click', startRun);
    $('btn-replay').addEventListener('click', startRun);
    // Guide modal (available before entering the game).
    const guideModal = $('guide-modal');
    $('btn-guide').addEventListener('click', () => { guideModal.style.display = 'flex'; });
    $('btn-guide-close').addEventListener('click', () => { guideModal.style.display = 'none'; });
    guideModal.addEventListener('click', e => { if (e.target === guideModal) guideModal.style.display = 'none'; });
    // Exit button inside the game — confirm before leaving.
    const exitModal = $('exit-modal');
    $('btn-exit').addEventListener('click', () => { exitModal.style.display = 'flex'; });
    $('btn-exit-cancel').addEventListener('click', () => { exitModal.style.display = 'none'; });
    $('btn-exit-confirm').addEventListener('click', doExit);
    exitModal.addEventListener('click', e => { if (e.target === exitModal) exitModal.style.display = 'none'; });
  }

  function doExit() {
    $('exit-modal').style.display = 'none';
    clearInterval(tH);
    clearTimeout(spyStateTimer);
    window.location.reload();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
