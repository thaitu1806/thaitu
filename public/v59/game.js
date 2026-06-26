// V59 — Đua Xe Đạp (controller)
(function () {
  'use strict';
  const STORAGE_KEY = 'v59_bike';
  const QL = 28;
  let userData = { totalWins: 0, totalKm: 0 };
  function loadData() { try { const r = localStorage.getItem(STORAGE_KEY); if (r) Object.assign(userData, JSON.parse(r)); } catch(e){} }
  function saveData() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(userData)); } catch(e){} }

  let state = null, cache = [], used = new Set();
  let curQ = null, combo = 0, maxCombo = 0;
  let subject = 'mix', difficulty = 'easy';
  let qStart = 0, tH = null, locked = false, fbId = -1;
  let riderChar = null;         // mounted cyclist sprite
  let restTired = false;        // keep scared (tired) as resting state when stamina is low
  const CYCLIST_POOL = ['cyc-red', 'cyc-blue', 'cyc-green', 'cyc-yellow', 'cyc-purple', 'cyc-pink'];
  const $ = id => document.getElementById(id);
  const ss = id => { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); $(id).classList.add('active'); };

  function renderStart() { $('total-wins').textContent = userData.totalWins; $('total-km').textContent = userData.totalKm; }
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
  function nextQ() { const p = window.V59Logic.pickNextQuestion({ cache, usedIds: used }); if (p) { used.add(p.id); return p; } return mkFallback(); }
  function mkFallback() {
    const a = 1 + Math.floor(Math.random() * 20), b = 1 + Math.floor(Math.random() * 20), c = a + b;
    const d = new Set(); while (d.size < 3) { const off = [-3, -2, -1, 1, 2, 3][Math.floor(Math.random() * 6)]; const w = c + off; if (w > 0 && w !== c) d.add(w); }
    const nums = [c, ...d].sort(() => Math.random() - 0.5); fbId--;
    return { id: fbId, question_text: `${a} + ${b} = ?`, option_a: String(nums[0]), option_b: String(nums[1]), option_c: String(nums[2]), option_d: String(nums[3]), correct_answer: 'abcd'[nums.indexOf(c)] };
  }
  async function startRun() {
    state = window.V59Logic.initState({ startedAt: Date.now() });
    cache = []; used.clear(); combo = 0; maxCombo = 0; fbId = -1;
    ss('game-screen'); mountRider(); renderHud(); renderTrack(); renderStamina(); renderGear();
    $('q-text').textContent = '⏳ Đang tải...'; $('q-options').innerHTML = ''; $('feedback').style.display = 'none';
    await fetchQ(); showNextQ();
  }
  // Mount a random cyclist sprite into #rider. Called once per run.
  function mountRider() {
    const host = $('rider');
    if (!host) return;
    host.innerHTML = '';
    riderChar = null;
    restTired = false;
    const C = window.HocVuiCharacters;
    const id = CYCLIST_POOL[Math.floor(Math.random() * CYCLIST_POOL.length)];
    if (C && C.hasSpecies(id)) {
      riderChar = C.createCharacter(id, host, { state: 'idle' });
    } else {
      host.textContent = '🚴'; // emoji fallback
    }
  }
  // Sync the cyclist to its resting state (idle, or tired/scared when stamina is low).
  function syncRider() {
    if (!riderChar) return;
    riderChar.setState(restTired ? 'scared' : 'idle');
  }
  function renderHud() {
    $('distance-text').textContent = `${state.distance}/${state.finishLine}m`;
    $('stamina-text').textContent = `${state.stamina}/${state.maxStamina}`;
    $('progress-text').textContent = `${state.questionsServed}/${state.maxQuestions}`;
    // Tired resting state when stamina runs low.
    restTired = state.stamina <= 1;
    syncRider();
  }
  function renderTrack() {
    const pct = (state.distance / state.finishLine) * 88;
    $('rider').style.left = pct + '%';
  }
  function renderStamina() {
    const row = $('stamina-row'); row.innerHTML = '';
    for (let i = 0; i < state.maxStamina; i++) {
      const p = document.createElement('span'); p.className = 'stamina-pip' + (i < state.stamina ? ' on' : ''); p.textContent = '💪'; row.appendChild(p);
    }
  }
  function renderGear() {
    const speed = window.V59Logic.getSpeed(state.streak, state.stamina);
    let label = `Tốc độ: ${speed}m/lượt`;
    if (state.stamina === 0) label += ' (kiệt sức)';
    else if (state.streak >= window.V59Logic.FAST_STREAK) label += ' 🚀 (siêu tốc!)';
    else if (state.streak >= window.V59Logic.MID_STREAK) label += ' ⚡ (đang nhanh)';
    $('gear-info').textContent = label;
  }
  function showNextQ() {
    if (window.V59Logic.isFinished(state)) { finish(); return; }
    curQ = nextQ(); locked = false; qStart = Date.now();
    $('q-text').textContent = curQ.question_text; $('feedback').style.display = 'none';
    const opts = $('q-options'); opts.innerHTML = '';
    ['a','b','c','d'].forEach(k => { const t = curQ[`option_${k}`]; if (t == null) return; const btn = document.createElement('button'); btn.className = 'option-btn'; btn.dataset.key = k; btn.textContent = t; btn.addEventListener('click', () => handleAns(k)); opts.appendChild(btn); });
    startTimer();
  }
  function startTimer() {
    clearInterval(tH); const total = window.V59Logic.TIMER_SECONDS * 1000;
    const fill = $('timer-fill'); fill.classList.remove('warning');
    tH = setInterval(() => { const rem = Math.max(0, total - (Date.now() - qStart)); fill.style.width = (rem / total) * 100 + '%'; if (rem <= total / 3) fill.classList.add('warning'); if (rem <= 0) { clearInterval(tH); handleTimeout(); } }, 100);
  }
  function handleAns(sel) {
    if (locked) return; locked = true; clearInterval(tH);
    const ck = (curQ.correct_answer || '').toLowerCase(); const ok = sel === ck;
    document.querySelectorAll('.option-btn').forEach(b => { b.classList.add('disabled'); if (b.dataset.key === ck) b.classList.add('correct'); else if (b.dataset.key === sel && !ok) b.classList.add('wrong'); });
    const prev = state.distance;
    if (ok) { state = window.V59Logic.applyCorrect(state); combo++; if (combo > maxCombo) maxCombo = combo; }
    else { state = window.V59Logic.applyWrongOrTimeout(state); combo = 0; }
    logAns(sel, ck, ok, Date.now() - qStart);
    const fb = $('feedback'); fb.style.display = 'block';
    if (ok) {
      const adv = state.distance - prev; fb.className = 'feedback good'; fb.textContent = `✅ Đạp thêm ${adv}m!`;
      // Speed burst: lean forward, faster pedalling, dust/speed-line trail.
      if (riderChar) { riderChar.setState('happy'); setTimeout(syncRider, 650); }
      spawnParticles($('rider'), 'dust', 9);
    } else {
      fb.className = 'feedback bad'; fb.textContent = '❌ Sai! Mất sức.';
      // Tired puff + brief wobble.
      if (riderChar) { riderChar.setState('scared'); setTimeout(syncRider, 650); }
      spawnParticles($('rider'), 'puff', 6);
    }
    renderHud(); renderTrack(); renderStamina(); renderGear();
    setTimeout(() => { if (window.V59Logic.isFinished(state)) finish(); else showNextQ(); }, 1100);
  }
  function handleTimeout() {
    if (locked) return; locked = true;
    state = window.V59Logic.applyWrongOrTimeout(state); combo = 0;
    const fb = $('feedback'); fb.style.display = 'block'; fb.className = 'feedback bad'; fb.textContent = '⏰ Hết giờ! Mất sức.';
    if (riderChar) { riderChar.setState('scared'); setTimeout(syncRider, 650); }
    spawnParticles($('rider'), 'puff', 6);
    renderHud(); renderStamina(); renderGear();
    setTimeout(() => { if (window.V59Logic.isFinished(state)) finish(); else showNextQ(); }, 1100);
  }
  function finish() {
    clearInterval(tH); const total = state.correct + state.wrong; const acc = total > 0 ? Math.round((state.correct / total) * 100) : 0;
    userData.totalKm += state.distance; if (state.outcome === 'won') userData.totalWins += 1; saveData();
    let stars = 0; if (state.outcome === 'won') stars = state.stamina >= 3 ? 3 : 2; else if (state.distance >= 60) stars = 1;
    saveSession({ stars, acc, total });
    $('result-badges').textContent = state.outcome === 'won' ? '🏁🚴🏆' : `🚴 ${state.distance}m`;
    $('result-title').textContent = state.outcome === 'won' ? '🏆 Cán Đích!' : '🚴 Kết Cuộc Đua';
    $('result-emoji').textContent = state.outcome === 'won' ? '🏆' : '🚴';
    $('result-detail').innerHTML = `📏 Quãng đường: ${state.distance}/${state.finishLine}m<br>💪 Sức: ${state.stamina}/${state.maxStamina}<br>✅ Đúng: ${state.correct}/${total} (${acc}%)<br>⭐ Sao: ${stars}/3`;
    if (state.outcome === 'won') { if (riderChar) riderChar.setState('happy'); spawnConfetti($('app'), 40); }
    ss('result-screen'); if (typeof window.checkAndShowPrompt === 'function') { try { window.checkAndShowPrompt(); } catch(e){} }
  }
  async function saveSession({ stars, acc, total }) {
    try { const p = JSON.parse(localStorage.getItem('hocvui_profile') || '{}'); if (!p.id) return;
      await fetch('/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ player_id: p.id, subject: subject === 'mix' ? 'math' : subject, difficulty, score: state.distance, total_questions: total, correct_answers: state.correct, stars_earned: stars, combo_max: maxCombo, mode: 'v59', accuracy: acc })}); } catch(e){}
  }
  function logAns(sel, ck, ok, ms) {
    if (!curQ || curQ.id < 0) return;
    try { const p = JSON.parse(localStorage.getItem('hocvui_profile') || '{}'); if (!p.id) return;
      fetch('/api/answers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ player_id: p.id, question_id: curQ.id, selected_answer: sel, correct_answer: ck, is_correct: ok, time_spent_ms: ms, difficulty })}).catch(() => {}); } catch(e){}
  }
  function init() {
    if (!window.V59Logic) { setTimeout(init, 30); return; }
    loadData(); renderStart(); wireSel();
    $('btn-start').addEventListener('click', startRun); $('btn-replay').addEventListener('click', startRun);
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
    clearInterval(tH);
    window.location.reload();
  }

  // Particle helpers ──────────────────────────────────────────────────────
  function spawnParticles(parent, kind, count) {
    if (!parent) return;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'pfx pfx-' + kind;
      const tx = (Math.random() * 80 - 40);
      const ty = -(Math.random() * 30 + 10);
      p.style.setProperty('--tx', tx + 'px');
      p.style.setProperty('--ty', ty + 'px');
      p.style.setProperty('--delay', (Math.random() * 0.15) + 's');
      parent.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
  }
  function spawnConfetti(parent, count) {
    if (!parent) return;
    const colors = ['#ef6c00', '#fbc02d', '#e64a19', '#2e7d32', '#1565c0', '#fff'];
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
