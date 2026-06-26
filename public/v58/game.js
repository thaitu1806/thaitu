// V58 — Hành Trình Lúa Gạo (controller)
(function () {
  'use strict';
  const STORAGE_KEY = 'v58_rice';
  const QL = 28;
  const FARMER_POOL = ['farmer', 'farmer-2'];
  let userData = { totalBushels: 0, totalWins: 0 };
  function loadData() { try { const r = localStorage.getItem(STORAGE_KEY); if (r) Object.assign(userData, JSON.parse(r)); } catch(e){} }
  function saveData() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(userData)); } catch(e){} }

  let state = null, cache = [], used = new Set();
  let curQ = null, combo = 0, maxCombo = 0;
  let subject = 'mix', difficulty = 'easy';
  let qStart = 0, tH = null, locked = false, fbId = -1;
  let farmerChar = null;   // farmer tending the paddy (persists per run)
  let riceChar = null;     // growing rice plant in the current stage circle
  const $ = id => document.getElementById(id);
  const ss = id => { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); $(id).classList.add('active'); };

  function renderStart() { $('total-bushels').textContent = userData.totalBushels; $('total-wins').textContent = userData.totalWins; }
  function wireSel() {
    document.querySelectorAll('.selector-options').forEach(g => g.addEventListener('click', e => {
      const b = e.target.closest('.sel-btn'); if (!b) return;
      g.querySelectorAll('.sel-btn').forEach(x => x.classList.remove('active')); b.classList.add('active');
      if (g.dataset.group === 'subject') subject = b.dataset.value; else difficulty = b.dataset.value;
    }));
  }
  async function fetchQ() {
    const p = JSON.parse(localStorage.getItem('hocvui_profile') || '{}'); const g = p.grade || 2;
    try {
      if (subject === 'mix') { const subs = ['math', 'vietnamese', 'english']; const per = Math.ceil(QL / 3);
        const r = await Promise.all(subs.map(s => fetch(`/api/questions?subject=${s}&difficulty=${difficulty}&limit=${per}&grade=${g}`).then(x => x.ok ? x.json() : []).catch(() => [])));
        cache = r.flat();
      } else { const r = await fetch(`/api/questions?subject=${subject}&difficulty=${difficulty}&limit=${QL}&grade=${g}`); cache = r.ok ? await r.json() : []; }
    } catch(e) { cache = []; }
    if (!Array.isArray(cache)) cache = [];
    for (let i = cache.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cache[i], cache[j]] = [cache[j], cache[i]]; }
  }
  function nextQ() { const p = window.V58Logic.pickNextQuestion({ cache, usedIds: used }); if (p) { used.add(p.id); return p; } return mkFallback(); }
  function mkFallback() {
    const a = 1 + Math.floor(Math.random() * 20), b = 1 + Math.floor(Math.random() * 20), c = a + b;
    const d = new Set(); while (d.size < 3) { const off = [-3, -2, -1, 1, 2, 3][Math.floor(Math.random() * 6)]; const w = c + off; if (w > 0 && w !== c) d.add(w); }
    const nums = [c, ...d].sort(() => Math.random() - 0.5); fbId--;
    return { id: fbId, question_text: `${a} + ${b} = ?`, option_a: String(nums[0]), option_b: String(nums[1]), option_c: String(nums[2]), option_d: String(nums[3]), correct_answer: 'abcd'[nums.indexOf(c)] };
  }
  async function startRun() {
    state = window.V58Logic.initState({ startedAt: Date.now() });
    cache = []; used.clear(); combo = 0; maxCombo = 0; fbId = -1;
    ss('game-screen'); buildFarmer(); renderHud(); renderLadder(); renderBushels();
    $('q-text').textContent = '⏳ Đang tải...'; $('q-options').innerHTML = ''; $('feedback').style.display = 'none';
    await fetchQ(); showNextQ();
  }
  function renderHud() {
    $('cycles-text').textContent = `${state.cycles}/${state.cyclesGoal}`;
    $('streak-text').textContent = state.streak;
    $('progress-text').textContent = `${state.questionsServed}/${state.maxQuestions}`;
  }
  // Mount the farmer character once per run (random from pool). Emoji fallback.
  function buildFarmer() {
    const host = $('farmer-char'); if (!host) return;
    host.innerHTML = ''; farmerChar = null;
    const C = window.HocVuiCharacters;
    const id = FARMER_POOL[Math.floor(Math.random() * FARMER_POOL.length)];
    if (C && C.hasSpecies(id)) { farmerChar = C.createCharacter(id, host, { state: 'idle' }); }
    else { host.textContent = '🌾'; }
  }
  // Rebuild the stage ladder each turn. Mounts a growing rice sprite into the
  // current stage circle, scaled via data-stage; done/future circles keep emoji.
  function renderLadder() {
    const lad = $('stage-ladder'); lad.innerHTML = ''; riceChar = null;
    const C = window.HocVuiCharacters;
    const stages = window.V58Logic.STAGES; const names = window.V58Logic.STAGE_NAMES;
    stages.forEach((emoji, i) => {
      const step = document.createElement('div'); step.className = 'stage-step';
      const c = document.createElement('div');
      const isCurrent = i === state.stage;
      c.className = 'stage-circle' + (i < state.stage ? ' done' : '') + (isCurrent ? ' current' : '');
      if (isCurrent && C && C.hasSpecies('rice')) {
        c.dataset.stage = String(state.stage);
        riceChar = C.createCharacter('rice', c, { state: 'idle' });
      } else {
        c.textContent = emoji;
      }
      step.appendChild(c);
      const lbl = document.createElement('div'); lbl.className = 'stage-label'; lbl.textContent = names[i]; step.appendChild(lbl);
      lad.appendChild(step);
      if (i < stages.length - 1) { const arr = document.createElement('span'); arr.className = 'stage-arrow'; arr.textContent = '→'; lad.appendChild(arr); }
    });
  }
  function renderBushels() {
    const row = $('bushels-row'); row.innerHTML = '';
    const C = window.HocVuiCharacters;
    const hasSack = C && C.hasSpecies('bushel');
    const normal = state.bushels - state.bonusCycles * 2;
    for (let i = 0; i < state.bonusCycles; i++) {
      const b = document.createElement('span'); b.className = 'bushel-slot bonus';
      if (hasSack) { C.createCharacter('bushel', b, { state: 'idle' }); const tag = document.createElement('span'); tag.className = 'bonus-tag'; tag.textContent = '+2'; b.appendChild(tag); }
      else { b.textContent = '🍚🍚'; }
      row.appendChild(b);
    }
    for (let i = 0; i < normal && i < 20; i++) {
      const b = document.createElement('span'); b.className = 'bushel-slot';
      if (hasSack) { C.createCharacter('bushel', b, { state: 'idle' }); }
      else { b.textContent = '🍚'; }
      row.appendChild(b);
    }
  }
  function showNextQ() {
    if (window.V58Logic.isFinished(state)) { finish(); return; }
    curQ = nextQ(); locked = false; qStart = Date.now();
    $('q-text').textContent = curQ.question_text; $('feedback').style.display = 'none';
    const opts = $('q-options'); opts.innerHTML = '';
    ['a','b','c','d'].forEach(k => { const t = curQ[`option_${k}`]; if (t == null) return; const btn = document.createElement('button'); btn.className = 'option-btn'; btn.dataset.key = k; btn.textContent = t; btn.addEventListener('click', () => handleAns(k)); opts.appendChild(btn); });
    startTimer();
  }
  function startTimer() {
    clearInterval(tH); const total = window.V58Logic.TIMER_SECONDS * 1000;
    const fill = $('timer-fill'); fill.classList.remove('warning');
    tH = setInterval(() => { const rem = Math.max(0, total - (Date.now() - qStart)); fill.style.width = (rem / total) * 100 + '%'; if (rem <= total / 3) fill.classList.add('warning'); if (rem <= 0) { clearInterval(tH); handleTimeout(); } }, 100);
  }
  function handleAns(sel) {
    if (locked) return; locked = true; clearInterval(tH);
    const ck = (curQ.correct_answer || '').toLowerCase(); const ok = sel === ck;
    document.querySelectorAll('.option-btn').forEach(b => { b.classList.add('disabled'); if (b.dataset.key === ck) b.classList.add('correct'); else if (b.dataset.key === sel && !ok) b.classList.add('wrong'); });
    const prev = state.cycles;
    if (ok) { state = window.V58Logic.applyCorrect(state); combo++; if (combo > maxCombo) maxCombo = combo; }
    else { state = window.V58Logic.applyWrongOrTimeout(state); combo = 0; }
    logAns(sel, ck, ok, Date.now() - qStart);
    const harvested = state.cycles > prev;
    const bonus = harvested && (state.bushels - (state.bonusCycles * 2) < state.cycles);
    const fb = $('feedback'); fb.style.display = 'block';
    if (harvested) { fb.className = 'feedback bonus'; fb.textContent = bonus ? '🌾 Thu hoạch bội thu! +2 lúa' : '🌾 Thu hoạch vụ mùa!'; }
    else if (ok) { fb.className = 'feedback good'; fb.textContent = '✅ Lúa lớn lên!'; }
    else { fb.className = 'feedback bad'; fb.textContent = '❌ Sai! Sâu phá hại.'; }
    renderHud(); renderLadder(); renderBushels();
    const ladder = $('stage-ladder');
    if (harvested) {
      // Cycle complete: farmer cheers + golden grain burst.
      if (farmerChar) { farmerChar.setState('happy'); setTimeout(() => { if (farmerChar) farmerChar.setState('idle'); }, 700); }
      if (riceChar) { riceChar.setState('happy'); setTimeout(() => { if (riceChar) riceChar.setState('idle'); }, 700); }
      spawnParticles(ladder, 'grain', bonus ? 18 : 12);
    } else if (ok) {
      // Stage advanced: leaf/grain sparkle on the plant.
      if (riceChar) { riceChar.setState('happy'); setTimeout(() => { if (riceChar) riceChar.setState('idle'); }, 600); }
      const cur = ladder.querySelector('.stage-circle.current');
      spawnParticles(cur || ladder, 'leaf', 8);
    } else {
      // Wrong: pest droops the plant + worried farmer.
      if (riceChar) { riceChar.setState('scared'); setTimeout(() => { if (riceChar) riceChar.setState('idle'); }, 700); }
      if (farmerChar) { farmerChar.setState('scared'); setTimeout(() => { if (farmerChar) farmerChar.setState('idle'); }, 700); }
    }
    setTimeout(() => { if (window.V58Logic.isFinished(state)) finish(); else showNextQ(); }, 1100);
  }
  function handleTimeout() {
    if (locked) return; locked = true;
    state = window.V58Logic.applyWrongOrTimeout(state); combo = 0;
    const fb = $('feedback'); fb.style.display = 'block'; fb.className = 'feedback bad'; fb.textContent = '⏰ Hết giờ!';
    renderHud(); renderLadder();
    if (riceChar) { riceChar.setState('scared'); setTimeout(() => { if (riceChar) riceChar.setState('idle'); }, 700); }
    if (farmerChar) { farmerChar.setState('scared'); setTimeout(() => { if (farmerChar) farmerChar.setState('idle'); }, 700); }
    setTimeout(() => { if (window.V58Logic.isFinished(state)) finish(); else showNextQ(); }, 1100);
  }
  function finish() {
    clearInterval(tH); const total = state.correct + state.wrong; const acc = total > 0 ? Math.round((state.correct / total) * 100) : 0;
    userData.totalBushels += state.bushels; if (state.outcome === 'won') userData.totalWins += 1; saveData();
    let stars = 0; if (state.outcome === 'won') stars = 3; else if (state.cycles >= 3) stars = 2; else if (state.cycles >= 1) stars = 1;
    saveSession({ stars, acc, total });
    if (state.outcome === 'won') { if (farmerChar) farmerChar.setState('happy'); spawnConfetti($('farm-stage'), 40); }
    $('result-badges').textContent = '🍚'.repeat(Math.min(state.bushels, 10)) || '🌾';
    $('result-title').textContent = state.outcome === 'won' ? '🌾 Vụ Mùa Bội Thu!' : '🌾 Kết Vụ Mùa';
    $('result-emoji').textContent = state.outcome === 'won' ? '🌾' : '🌱';
    $('result-detail').innerHTML = `🌾 Vụ mùa: ${state.cycles}/${state.cyclesGoal}<br>🍚 Lúa thu: ${state.bushels}<br>✨ Bội thu: ${state.bonusCycles}<br>✅ Đúng: ${state.correct}/${total} (${acc}%)<br>⭐ Sao: ${stars}/3`;
    ss('result-screen'); if (typeof window.checkAndShowPrompt === 'function') { try { window.checkAndShowPrompt(); } catch(e){} }
  }
  async function saveSession({ stars, acc, total }) {
    try { const p = JSON.parse(localStorage.getItem('hocvui_profile') || '{}'); if (!p.id) return;
      await fetch('/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ player_id: p.id, subject: subject === 'mix' ? 'math' : subject, difficulty, score: state.bushels, total_questions: total, correct_answers: state.correct, stars_earned: stars, combo_max: maxCombo, mode: 'v58', accuracy: acc })}); } catch(e){}
  }
  function logAns(sel, ck, ok, ms) {
    if (!curQ || curQ.id < 0) return;
    try { const p = JSON.parse(localStorage.getItem('hocvui_profile') || '{}'); if (!p.id) return;
      fetch('/api/answers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ player_id: p.id, question_id: curQ.id, selected_answer: sel, correct_answer: ck, is_correct: ok, time_spent_ms: ms, difficulty })}).catch(() => {}); } catch(e){}
  }
  function init() {
    if (!window.V58Logic) { setTimeout(init, 30); return; }
    loadData(); renderStart(); wireSel();
    $('btn-start').addEventListener('click', startRun); $('btn-replay').addEventListener('click', startRun);
    // Guide modal (available from the start screen).
    const guideModal = $('guide-modal');
    $('btn-guide').addEventListener('click', () => { guideModal.style.display = 'flex'; });
    $('btn-guide-close').addEventListener('click', () => { guideModal.style.display = 'none'; });
    guideModal.addEventListener('click', e => { if (e.target === guideModal) guideModal.style.display = 'none'; });
    // Exit button inside the game — styled confirm modal (no window.confirm).
    const exitModal = $('exit-modal');
    $('btn-exit').addEventListener('click', () => { exitModal.style.display = 'flex'; });
    $('btn-exit-cancel').addEventListener('click', () => { exitModal.style.display = 'none'; });
    $('btn-exit-confirm').addEventListener('click', doExit);
    exitModal.addEventListener('click', e => { if (e.target === exitModal) exitModal.style.display = 'none'; });
  }
  function doExit() {
    $('exit-modal').style.display = 'none';
    clearInterval(tH);
    window.location.reload();
  }
  // Particle helpers ──────────────────────────────────────────────────────
  function spawnParticles(parent, kind, count) {
    if (!parent) return;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'pfx pfx-' + kind;
      p.style.setProperty('--tx', (Math.random() * 80 - 40) + 'px');
      p.style.setProperty('--ty', -(Math.random() * 40 + 20) + 'px');
      p.style.setProperty('--delay', (Math.random() * 0.15) + 's');
      parent.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
  }
  function spawnConfetti(parent, count) {
    if (!parent) return;
    const colors = ['#ffd54f', '#cddc39', '#8bc34a', '#689f38', '#ffca28', '#fff'];
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
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
