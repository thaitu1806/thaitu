// V57 — Tiệm May Áo Dài (controller)
(function () {
  'use strict';
  const STORAGE_KEY = 'v57_tailor';
  const QL = 28;
  let userData = { totalGarments: 0, totalGold: 0 };
  function loadData() { try { const r = localStorage.getItem(STORAGE_KEY); if (r) Object.assign(userData, JSON.parse(r)); } catch(e){} }
  function saveData() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(userData)); } catch(e){} }

  let state = null, cache = [], used = new Set();
  let curQ = null, combo = 0, maxCombo = 0;
  let subject = 'mix', difficulty = 'easy';
  let qStart = 0, tH = null, locked = false, fbId = -1;
  let garmentRefs = [];         // [{ slot, char }] per finished garment
  const $ = id => document.getElementById(id);
  const ss = id => { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); $(id).classList.add('active'); };

  function renderStart() { $('total-garments').textContent = userData.totalGarments; $('total-gold').textContent = userData.totalGold; }
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
      if (subject === 'mix') {
        const subs = ['math', 'vietnamese', 'english']; const per = Math.ceil(QL / 3);
        const r = await Promise.all(subs.map(s => fetch(`/api/questions?subject=${s}&difficulty=${difficulty}&limit=${per}&grade=${g}`).then(x => x.ok ? x.json() : []).catch(() => [])));
        cache = r.flat();
      } else { const r = await fetch(`/api/questions?subject=${subject}&difficulty=${difficulty}&limit=${QL}&grade=${g}`); cache = r.ok ? await r.json() : []; }
    } catch(e) { cache = []; }
    if (!Array.isArray(cache)) cache = [];
    for (let i = cache.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cache[i], cache[j]] = [cache[j], cache[i]]; }
  }
  function nextQ() { const p = window.V57Logic.pickNextQuestion({ cache, usedIds: used }); if (p) { used.add(p.id); return p; } return mkFallback(); }
  function mkFallback() {
    const a = 1 + Math.floor(Math.random() * 20), b = 1 + Math.floor(Math.random() * 20), c = a + b;
    const d = new Set(); while (d.size < 3) { const off = [-3, -2, -1, 1, 2, 3][Math.floor(Math.random() * 6)]; const w = c + off; if (w > 0 && w !== c) d.add(w); }
    const nums = [c, ...d].sort(() => Math.random() - 0.5); fbId--;
    return { id: fbId, question_text: `${a} + ${b} = ?`, option_a: String(nums[0]), option_b: String(nums[1]), option_c: String(nums[2]), option_d: String(nums[3]), correct_answer: 'abcd'[nums.indexOf(c)] };
  }
  async function startRun() {
    state = window.V57Logic.initState({ startedAt: Date.now() });
    cache = []; used.clear(); combo = 0; maxCombo = 0; fbId = -1;
    ss('game-screen'); renderHud(); renderLoom(); renderGarments();
    $('q-text').textContent = '⏳ Đang tải...'; $('q-options').innerHTML = ''; $('feedback').style.display = 'none';
    await fetchQ(); showNextQ();
  }
  function renderHud() {
    $('garments-text').textContent = `${state.garments.length}/${state.garmentsGoal}`;
    $('panels-text').textContent = `${state.panels}/${state.panelsPerGarment}`;
    $('progress-text').textContent = `${state.questionsServed}/${state.maxQuestions}`;
  }
  function renderLoom() {
    document.querySelectorAll('#loom .panel').forEach((p, i) => {
      if (i < state.panels) { p.classList.add('stitched'); p.textContent = '🧵'; }
      else { p.classList.remove('stitched'); p.textContent = '⬜'; }
    });
  }
  function renderGarments() {
    const row = $('garments-row'); row.innerHTML = '';
    garmentRefs = [];
    const C = window.HocVuiCharacters;
    state.garments.forEach(g => {
      const el = document.createElement('span');
      el.className = 'garment' + (g.gold ? ' gold' : '');
      el.title = g.name + (g.gold ? ' (Vàng quý)' : '');
      row.appendChild(el);
      let char = null;
      if (C && C.hasSpecies(g.id)) {
        char = C.createCharacter(g.id, el, { state: 'idle' });
      } else {
        el.textContent = g.emoji;   // emoji fallback
      }
      garmentRefs.push({ slot: el, char });
    });
  }
  function showNextQ() {
    if (window.V57Logic.isFinished(state)) { finish(); return; }
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
    clearInterval(tH); const total = window.V57Logic.TIMER_SECONDS * 1000;
    const fill = $('timer-fill'); fill.classList.remove('warning');
    tH = setInterval(() => { const rem = Math.max(0, total - (Date.now() - qStart)); fill.style.width = (rem / total) * 100 + '%'; if (rem <= total / 3) fill.classList.add('warning'); if (rem <= 0) { clearInterval(tH); handleTimeout(); } }, 100);
  }
  function handleAns(sel) {
    if (locked) return; locked = true; clearInterval(tH);
    const ck = (curQ.correct_answer || '').toLowerCase(); const ok = (typeof sel === 'boolean') ? sel : (String(sel).toLowerCase() === ck);
    if (typeof sel !== 'boolean') {
      document.querySelectorAll('.option-btn').forEach(b => { b.classList.add('disabled'); if (b.dataset.key === ck) b.classList.add('correct'); else if (b.dataset.key === sel && !ok) b.classList.add('wrong'); });
    }
    const prev = state.garments.length;
    if (ok) { state = window.V57Logic.applyCorrect(state); combo++; if (combo > maxCombo) maxCombo = combo; }
    else { state = window.V57Logic.applyWrongOrTimeout(state); combo = 0; }
    logAns(sel, ck, ok, Date.now() - qStart);
    const fb = $('feedback'); fb.style.display = 'block';
    if (state.garments.length > prev) { const last = state.garments[state.garments.length - 1]; fb.className = 'feedback bonus'; fb.textContent = last.gold ? `✨ Áo dài vàng — ${last.name}!` : `👘 Hoàn thành áo ${last.name}!`; }
    else if (ok) { fb.className = 'feedback good'; fb.textContent = '✅ Khâu thêm 1 mảnh!'; }
    else { fb.className = 'feedback bad'; fb.textContent = '❌ Sai! Tháo mảnh đang khâu.'; }
    renderHud(); renderLoom(); renderGarments();
    // Thread/sparkle burst on a freshly stitched panel (no garment completed yet).
    if (ok && state.garments.length === prev) {
      const stitched = document.querySelectorAll('#loom .panel.stitched');
      const lit = stitched[stitched.length - 1];
      spawnParticles(lit || $('loom'), 'thread', 6);
    }
    // Celebrate a freshly-finished garment: happy twirl + bigger burst.
    if (state.garments.length > prev) {
      const last = state.garments[state.garments.length - 1];
      const ref = garmentRefs[state.garments.length - 1];
      if (ref) {
        if (ref.char) {
          ref.char.setState('happy');
          setTimeout(() => { if (ref.char) ref.char.setState('idle'); }, 700);
        }
        spawnParticles(ref.slot, last.gold ? 'goldburst' : 'sparkle', last.gold ? 14 : 10);
      }
    }
    setTimeout(() => { if (window.V57Logic.isFinished(state)) finish(); else showNextQ(); }, 1100);
  }
  function handleTimeout() {
    if (locked) return; locked = true;
    state = window.V57Logic.applyWrongOrTimeout(state); combo = 0;
    const fb = $('feedback'); fb.style.display = 'block'; fb.className = 'feedback bad'; fb.textContent = '⏰ Hết giờ!';
    renderHud(); renderLoom();
    setTimeout(() => { if (window.V57Logic.isFinished(state)) finish(); else showNextQ(); }, 1100);
  }
  function finish() {
    clearInterval(tH); const total = state.correct + state.wrong; const acc = total > 0 ? Math.round((state.correct / total) * 100) : 0;
    userData.totalGarments += state.garments.length; userData.totalGold += state.garments.filter(g => g.gold).length; saveData();
    let stars = 0; if (state.outcome === 'won') stars = 3; else if (state.garments.length >= 3) stars = 2; else if (state.garments.length >= 1) stars = 1;
    saveSession({ stars, acc, total });
    if (state.outcome === 'won') { garmentRefs.forEach(r => { if (r.char) r.char.setState('happy'); }); spawnConfetti($('shop-stage') || document.body, 44); }
    const badges = state.garments.map(g => g.emoji).join(' ') || '👘';
    $('result-badges').textContent = badges;
    $('result-title').textContent = state.outcome === 'won' ? '👘 Nhà May Bậc Thầy!' : '👘 Kết Buổi May';
    $('result-emoji').textContent = state.outcome === 'won' ? '👘' : '🧵';
    $('result-detail').innerHTML = `👘 Áo dài: ${state.garments.length}/${state.garmentsGoal}<br>✨ Vàng: ${state.garments.filter(g => g.gold).length}<br>✅ Đúng: ${state.correct}/${total} (${acc}%)<br>⭐ Sao: ${stars}/3`;
    ss('result-screen'); if (typeof window.checkAndShowPrompt === 'function') { try { window.checkAndShowPrompt(); } catch(e){} }
  }
  async function saveSession({ stars, acc, total }) {
    try { const p = JSON.parse(localStorage.getItem('hocvui_profile') || '{}'); if (!p.id) return;
      await fetch('/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ player_id: p.id, subject: subject === 'mix' ? 'math' : subject, difficulty, score: state.garments.length, total_questions: total, correct_answers: state.correct, stars_earned: stars, combo_max: maxCombo, mode: 'v57', accuracy: acc })}); } catch(e){}
  }
  function logAns(sel, ck, ok, ms) {
    if (!curQ || curQ.id < 0) return;
    try { const p = JSON.parse(localStorage.getItem('hocvui_profile') || '{}'); if (!p.id) return;
      fetch('/api/answers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ player_id: p.id, question_id: curQ.id, selected_answer: sel, correct_answer: ck, is_correct: ok, time_spent_ms: ms, difficulty })}).catch(() => {}); } catch(e){}
  }
  function init() {
    if (!window.V57Logic) { setTimeout(init, 30); return; }
    loadData(); renderStart(); wireSel();
    $('btn-start').addEventListener('click', startRun); $('btn-replay').addEventListener('click', startRun);
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

  function confirmExit() { $('exit-modal').style.display = 'flex'; }
  function doExit() { $('exit-modal').style.display = 'none'; clearInterval(tH); window.location.reload(); }

  // Particle helpers (recolored from v47/v49) ───────────────────────────────
  function spawnParticles(parent, kind, count) {
    if (!parent) return;
    const golds = ['#ffd54f', '#ffb300', '#fff8e1', '#ffca28'];
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'pfx pfx-' + kind;
      p.style.setProperty('--tx', (Math.random() * 80 - 40) + 'px');
      p.style.setProperty('--ty', -(Math.random() * 40 + 20) + 'px');
      p.style.setProperty('--delay', (Math.random() * 0.15) + 's');
      if (kind === 'goldburst') p.style.background = golds[i % golds.length];
      parent.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
  }

  function spawnConfetti(parent, count) {
    if (!parent) return;
    const colors = ['#d32f2f', '#ffd54f', '#ec407a', '#29b6f6', '#fff', '#ffb300'];
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
