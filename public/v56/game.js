// V56 — Người Tuyết Cứu Bắc Cực (controller)
(function () {
  'use strict';
  const STORAGE_KEY = 'v56_snow';
  const QL = 28;
  let userData = { totalSnowmen: 0, totalWins: 0 };
  function loadData() { try { const r = localStorage.getItem(STORAGE_KEY); if (r) Object.assign(userData, JSON.parse(r)); } catch(e){} }
  function saveData() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(userData)); } catch(e){} }

  let state = null, cache = [], used = new Set();
  let curQ = null, combo = 0, maxCombo = 0;
  let subject = 'mix', difficulty = 'easy';
  let qStart = 0, tH = null, locked = false, fbId = -1;
  let buildChar = null;          // growing snowman/pile in the build area
  let snowmanRefs = [];          // [{ cell, char }] per completed snowman
  // Map V56 accessory emoji → registered sprite id.
  const ACC_SPECIES = { '🧣': 'snowman-scarf', '🎩': 'snowman-hat', '🥕': 'snowman-carrot', '🧤': 'snowman-gloves', '👒': 'snowman-bonnet' };
  const $ = id => document.getElementById(id);
  const ss = id => { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); $(id).classList.add('active'); };

  function renderStart() { $('total-snowmen').textContent = userData.totalSnowmen; $('total-wins').textContent = userData.totalWins; }
  function wireSel() {
    document.querySelectorAll('.selector-options').forEach(g => g.addEventListener('click', e => {
      const b = e.target.closest('.sel-btn'); if (!b) return;
      g.querySelectorAll('.sel-btn').forEach(x => x.classList.remove('active')); b.classList.add('active');
      if (g.dataset.group === 'subject') subject = b.dataset.value; else difficulty = b.dataset.value;
    }));
  }

  async function fetchQ() {
    const p = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
    const g = p.grade ?? 2;
    try {
      if (subject === 'mix') {
        const subs = ['math', 'vietnamese', 'english']; const per = Math.ceil(QL / 3);
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
  function nextQ() { const p = window.V56Logic.pickNextQuestion({ cache, usedIds: used }); if (p) { used.add(p.id); return p; } return mkFallback(); }
  function mkFallback() {
    const a = 1 + Math.floor(Math.random() * 20), b = 1 + Math.floor(Math.random() * 20), c = a + b;
    const d = new Set(); while (d.size < 3) { const off = [-3, -2, -1, 1, 2, 3][Math.floor(Math.random() * 6)]; const w = c + off; if (w > 0 && w !== c) d.add(w); }
    const nums = [c, ...d].sort(() => Math.random() - 0.5); fbId--;
    return { id: fbId, question_text: `${a} + ${b} = ?`, option_a: String(nums[0]), option_b: String(nums[1]), option_c: String(nums[2]), option_d: String(nums[3]), correct_answer: 'abcd'[nums.indexOf(c)] };
  }

  async function startRun() {
    state = window.V56Logic.initState({ startedAt: Date.now() });
    cache = []; used.clear(); combo = 0; maxCombo = 0; fbId = -1;
    ss('game-screen'); renderHud(); renderBuild(); renderSnowmen();
    $('q-text').textContent = '⏳ Đang tải...'; $('q-options').innerHTML = ''; $('feedback').style.display = 'none';
    await fetchQ(); showNextQ();
  }
  function renderHud() {
    $('snowmen-text').textContent = `${state.snowmen.length}/${state.snowmenGoal}`;
    $('pieces-text').textContent = `${state.currentPieces}/${state.piecesPerSnowman}`;
    $('progress-text').textContent = `${state.questionsServed}/${state.maxQuestions}`;
  }
  function renderBuild() {
    const parts = ['⬜','⬜','⬜'];
    if (state.currentPieces >= 1) parts[0] = '❄️';
    if (state.currentPieces >= 2) parts[1] = '☃️';
    $('current-build').textContent = parts.join(' ');
    // Mount/refresh a growing snowman that reflects currentPieces (0 = pile, 1-2 = stacking).
    const host = $('build-char');
    if (!host) return;
    host.innerHTML = '';
    buildChar = null;
    host.dataset.pieces = String(state.currentPieces);
    const C = window.HocVuiCharacters;
    const speciesId = state.currentPieces <= 0 ? 'snow-pile' : 'snowman';
    if (C && C.hasSpecies(speciesId)) {
      buildChar = C.createCharacter(speciesId, host, { state: 'idle' });
    }
  }
  function renderSnowmen() {
    const row = $('snowmen-row'); row.innerHTML = '';
    snowmanRefs = [];
    const C = window.HocVuiCharacters;
    state.snowmen.forEach(sn => {
      const el = document.createElement('span'); el.className = 'snowman-card';
      row.appendChild(el);
      const id = ACC_SPECIES[sn.accessory] || 'snowman';
      let char = null;
      if (C && C.hasSpecies(id)) {
        char = C.createCharacter(id, el, { state: 'idle' });
      } else {
        el.textContent = `⛄${sn.accessory}`;
      }
      snowmanRefs.push({ cell: el, char });
    });
  }
  function showNextQ() {
    if (window.V56Logic.isFinished(state)) { finish(); return; }
    curQ = nextQ(); locked = false; qStart = Date.now();
    $('q-text').textContent = curQ.question_text; $('feedback').style.display = 'none';
    const opts = $('q-options'); opts.innerHTML = '';
    if (window.HocVuiQuiz && window.HocVuiQuiz.render) {
      window.HocVuiQuiz.render({ questionEl: $('q-text'), optionsEl: opts, question: curQ, onResult: (ok) => handleAns(ok) });
    } else {
      ['a','b','c','d'].forEach(k => { const t = curQ[`option_${k}`]; if (t == null) return; const btn = document.createElement('button'); btn.className = 'option-btn'; btn.dataset.key = k; btn.textContent = t; btn.addEventListener('click', () => handleAns(k)); opts.appendChild(btn); });
    }
    startTimer();
  }
  function startTimer() {
    clearInterval(tH); const total = window.V56Logic.TIMER_SECONDS * 1000;
    const fill = $('timer-fill'); fill.classList.remove('warning');
    tH = setInterval(() => { const rem = Math.max(0, total - (Date.now() - qStart)); fill.style.width = (rem / total) * 100 + '%'; if (rem <= total / 3) fill.classList.add('warning'); if (rem <= 0) { clearInterval(tH); handleTimeout(); } }, 100);
  }
  function handleAns(sel) {
    if (locked) return; locked = true; clearInterval(tH);
    const ck = (curQ.correct_answer || '').toLowerCase(); const ok = (typeof sel === 'boolean') ? sel : (String(sel).toLowerCase() === ck);
    if (typeof sel !== 'boolean') {
      document.querySelectorAll('.option-btn').forEach(b => { b.classList.add('disabled'); if (b.dataset.key === ck) b.classList.add('correct'); else if (b.dataset.key === sel && !ok) b.classList.add('wrong'); });
    }
    const prev = state.snowmen.length;
    if (ok) { state = window.V56Logic.applyCorrect(state); combo++; if (combo > maxCombo) maxCombo = combo; }
    else { state = window.V56Logic.applyWrongOrTimeout(state); combo = 0; }
    logAns(sel, ck, ok, Date.now() - qStart);
    const fb = $('feedback'); fb.style.display = 'block';
    if (state.snowmen.length > prev) { fb.className = 'feedback bonus'; fb.textContent = `⛄ Người tuyết hoàn thành!`; }
    else if (ok) { fb.className = 'feedback good'; fb.textContent = '✅ Thêm 1 viên!'; }
    else { fb.className = 'feedback bad'; fb.textContent = '☀️ Bị nắng làm tan 1 viên!'; }
    renderHud(); renderBuild(); renderSnowmen();
    // Snowflake/sparkle burst on a correct piece.
    if (ok) spawnParticles($('build-char'), 'flake', 6);
    // Bigger burst + happy bounce when a snowman completes.
    if (state.snowmen.length > prev) {
      const ref = snowmanRefs[snowmanRefs.length - 1];
      if (ref) {
        if (ref.char) { ref.char.setState('happy'); setTimeout(() => { if (ref.char) ref.char.setState('idle'); }, 700); }
        spawnParticles(ref.cell, 'flake', 12);
        spawnParticles(ref.cell, 'sparkle', 8);
      }
    } else if (!ok) {
      // Melt drip on a wrong answer (sun melts a piece).
      spawnParticles($('build-char'), 'drip', 6);
    }
    setTimeout(() => { if (window.V56Logic.isFinished(state)) finish(); else showNextQ(); }, 1100);
  }
  function handleTimeout() {
    if (locked) return; locked = true;
    state = window.V56Logic.applyWrongOrTimeout(state); combo = 0;
    const fb = $('feedback'); fb.style.display = 'block'; fb.className = 'feedback bad'; fb.textContent = '⏰ Hết giờ!';
    renderHud(); renderBuild();
    spawnParticles($('build-char'), 'drip', 6);
    setTimeout(() => { if (window.V56Logic.isFinished(state)) finish(); else showNextQ(); }, 1100);
  }
  function finish() {
    clearInterval(tH); const total = state.correct + state.wrong; const acc = total > 0 ? Math.round((state.correct / total) * 100) : 0;
    userData.totalSnowmen += state.snowmen.length; if (state.outcome === 'won') userData.totalWins += 1; saveData();
    let stars = 0; if (state.outcome === 'won') stars = 3; else if (state.snowmen.length >= 5) stars = 2; else if (state.snowmen.length >= 2) stars = 1;
    saveSession({ stars, acc, total });
    if (state.outcome === 'won') spawnConfetti($('app'), 44);
    const badges = state.snowmen.map(s => `⛄${s.accessory}`).join(' ') || '⛄';
    $('result-badges').textContent = badges;
    $('result-title').textContent = state.outcome === 'won' ? '❄️ Cứu Bắc Cực Thành Công!' : '⛄ Kết Buổi Xây';
    $('result-emoji').textContent = state.outcome === 'won' ? '❄️' : '⛄';
    $('result-detail').innerHTML = `⛄ Người tuyết: ${state.snowmen.length}/${state.snowmenGoal}<br>✅ Đúng: ${state.correct}/${total} (${acc}%)<br>⭐ Sao: ${stars}/3`;
    ss('result-screen'); if (typeof window.checkAndShowPrompt === 'function') { try { window.checkAndShowPrompt(); } catch(e){} }
  }
  async function saveSession({ stars, acc, total }) {
    try { const p = JSON.parse(localStorage.getItem('hocvui_profile') || '{}'); if (!p.id) return;
      await fetch('/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ player_id: p.id, subject: subject === 'mix' ? 'math' : subject, difficulty, score: state.snowmen.length, total_questions: total, correct_answers: state.correct, stars_earned: stars, combo_max: maxCombo, mode: 'v56', accuracy: acc })}); } catch(e){}
  }
  function logAns(sel, ck, ok, ms) {
    if (!curQ || curQ.id < 0) return;
    try { const p = JSON.parse(localStorage.getItem('hocvui_profile') || '{}'); if (!p.id) return;
      fetch('/api/answers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ player_id: p.id, question_id: curQ.id, selected_answer: sel, correct_answer: ck, is_correct: ok, time_spent_ms: ms, difficulty })}).catch(() => {}); } catch(e){}
  }
  function init() {
    if (!window.V56Logic) { setTimeout(init, 30); return; }
    loadData(); renderStart(); wireSel();
    $('btn-start').addEventListener('click', startRun); $('btn-replay').addEventListener('click', startRun);
    // Guide modal (available before entering the game).
    const guideModal = $('guide-modal');
    $('btn-guide').addEventListener('click', () => { guideModal.style.display = 'flex'; });
    $('btn-guide-close').addEventListener('click', () => { guideModal.style.display = 'none'; });
    guideModal.addEventListener('click', (e) => { if (e.target === guideModal) guideModal.style.display = 'none'; });
    // Exit button inside the game — confirm before leaving.
    $('btn-exit').addEventListener('click', confirmExit);
    const exitModal = $('exit-modal');
    $('btn-exit-cancel').addEventListener('click', () => { exitModal.style.display = 'none'; });
    $('btn-exit-confirm').addEventListener('click', doExit);
    exitModal.addEventListener('click', (e) => { if (e.target === exitModal) exitModal.style.display = 'none'; });
  }

  function confirmExit() { $('exit-modal').style.display = 'flex'; }
  function doExit() {
    $('exit-modal').style.display = 'none';
    clearInterval(tH);
    snowmanRefs.forEach(r => { if (r.char) try { r.char.destroy(); } catch(e){} });
    snowmanRefs = [];
    window.location.reload();
  }

  // Particle helpers (recolored from v47/v49 for the icy palette) ────────────
  function spawnParticles(parent, kind, count) {
    if (!parent) return;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'pfx pfx-' + kind;
      if (kind === 'flake') p.textContent = i % 2 ? '❄' : '✦';
      const tx = (Math.random() * 80 - 40);
      const ty = kind === 'drip' ? (Math.random() * 30 + 16) : -(Math.random() * 40 + 20);
      p.style.setProperty('--tx', tx + 'px');
      p.style.setProperty('--ty', ty + 'px');
      p.style.setProperty('--delay', (Math.random() * 0.15) + 's');
      parent.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
  }

  function spawnConfetti(parent, count) {
    if (!parent) return;
    const colors = ['#1976d2', '#42a5f5', '#90caf9', '#e3f2fd', '#0d47a1', '#fff'];
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
