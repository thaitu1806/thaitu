// V52 — Lễ Hội Trung Thu (controller)
(function () {
  'use strict';
  const STORAGE_KEY = 'v52_moon';
  const QL = 26;
  const MOON_PHASES = ['🌑', '🌒', '🌓', '🌔', '🌕'];
  let userData = { totalLanterns: 0, totalFireworks: 0 };
  function loadData() { try { const r = localStorage.getItem(STORAGE_KEY); if (r) Object.assign(userData, JSON.parse(r)); } catch(e){} }
  function saveData() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(userData)); } catch(e){} }

  let state = null, cache = [], used = new Set();
  let curQ = null, combo = 0, maxCombo = 0;
  let subject = 'mix', difficulty = 'easy';
  let qStart = 0, tH = null, locked = false, fbId = -1;
  let lanternRefs = [];         // [{ slot, char }] per slot (char only when lit)
  let moonChar = null;          // smiling moon sprite for #moon
  const $ = id => document.getElementById(id);
  const ss = id => { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); $(id).classList.add('active'); };

  function renderStart() {
    $('total-lanterns').textContent = userData.totalLanterns;
    $('total-fireworks').textContent = userData.totalFireworks;
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
    const p = window.V52Logic.pickNextQuestion({ cache, usedIds: used });
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
    state = window.V52Logic.initState({ startedAt: Date.now() });
    cache = []; used.clear(); combo = 0; maxCombo = 0; fbId = -1;
    moonChar = null;
    ss('game-screen'); renderHud(); renderLanterns(); renderMoon(); renderFireworks();
    $('q-text').textContent = '⏳ Đang tải...';
    $('q-options').innerHTML = '';
    $('feedback').style.display = 'none';
    await fetchQ();
    showNextQ();
  }

  function renderHud() {
    $('lanterns-text').textContent = `${state.litCount}/${state.slots.length}`;
    $('streak-text').textContent = state.streak;
    $('progress-text').textContent = `${state.questionsServed}/${state.maxQuestions}`;
  }

  function renderMoon() {
    const full = state.litCount >= state.slots.length;
    const host = $('moon');
    const C = window.HocVuiCharacters;
    if (full && C && C.hasSpecies('moon')) {
      // Full moon — swap the waxing emoji for the smiling moon sprite.
      if (!moonChar) {
        host.textContent = '';
        moonChar = C.createCharacter('moon', host, { state: 'idle' });
      }
      moonChar.setState('happy');
      setTimeout(() => { if (moonChar) moonChar.setState('idle'); }, 700);
      return;
    }
    if (moonChar) { moonChar.destroy(); moonChar = null; }
    const idx = Math.min(MOON_PHASES.length - 1, Math.floor((state.litCount / state.slots.length) * (MOON_PHASES.length - 1) + 0.0001));
    host.textContent = MOON_PHASES[idx];
  }

  function renderFireworks() {
    const row = $('firework-row');
    row.innerHTML = '';
    state.fireworks.forEach(f => {
      const el = document.createElement('span');
      el.className = 'firework';
      el.textContent = f;
      row.appendChild(el);
    });
  }

  function renderLanterns() {
    const row = $('lantern-row');
    row.innerHTML = '';
    lanternRefs = [];
    const C = window.HocVuiCharacters;
    state.slots.forEach(slot => {
      const el = document.createElement('div');
      el.className = 'lantern-slot' + (slot.lit ? ` lit ${slot.color}` : '');
      let char = null;
      if (slot.lit) {
        const id = 'lantern-' + slot.color;
        if (C && C.hasSpecies(id)) {
          char = C.createCharacter(id, el, { state: 'idle' });
        } else {
          el.textContent = '🏮';   // emoji fallback for a lit lantern
        }
      } else {
        el.textContent = '⬜';      // dim placeholder for an unlit slot
      }
      row.appendChild(el);
      lanternRefs.push({ slot: el, char });
    });
  }

  function showNextQ() {
    if (window.V52Logic.isFinished(state)) { finish(); return; }
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
    const total = window.V52Logic.TIMER_SECONDS * 1000;
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
    const prevFw = state.fireworks.length;
    const prevLit = state.litCount;
    if (ok) {
      state = window.V52Logic.applyCorrect(state);
      combo++; if (combo > maxCombo) maxCombo = combo;
    } else {
      state = window.V52Logic.applyWrongOrTimeout(state);
      combo = 0;
    }
    logAns(sel, ck, ok, Date.now() - qStart);
    const fb = $('feedback');
    fb.style.display = 'block';
    const gotFirework = state.fireworks.length > prevFw;
    if (gotFirework) {
      fb.className = 'feedback bonus';
      fb.textContent = '🎆 Pháo bông rực rỡ!';
    } else if (ok) {
      fb.className = 'feedback good';
      fb.textContent = '✅ Thắp đèn lồng!';
    } else {
      fb.className = 'feedback bad';
      fb.textContent = '❌ Sai! Streak reset.';
    }
    renderHud(); renderLanterns(); renderMoon(); renderFireworks();
    // Celebrate a freshly-lit lantern: bright happy bob + spark/glow burst.
    if (state.litCount > prevLit) {
      const ref = lanternRefs[state.litCount - 1];
      if (ref) {
        if (ref.char) {
          ref.char.setState('happy');
          setTimeout(() => { if (ref.char) ref.char.setState('idle'); }, 600);
        }
        spawnParticles(ref.slot, 'spark', 8);
        spawnParticles(ref.slot, 'glow', 3);
      }
    }
    // Firework burst over the moon stage when a firework spawns.
    if (gotFirework) spawnFireworkBurst($('firework-row'));
    setTimeout(() => { if (window.V52Logic.isFinished(state)) finish(); else showNextQ(); }, 1100);
  }

  function handleTimeout() {
    if (locked) return;
    locked = true;
    state = window.V52Logic.applyWrongOrTimeout(state);
    combo = 0;
    const fb = $('feedback'); fb.style.display = 'block';
    fb.className = 'feedback bad'; fb.textContent = '⏰ Hết giờ! Streak reset.';
    renderHud();
    setTimeout(() => { if (window.V52Logic.isFinished(state)) finish(); else showNextQ(); }, 1100);
  }

  function finish() {
    clearInterval(tH);
    const total = state.correct + state.wrong;
    const acc = total > 0 ? Math.round((state.correct / total) * 100) : 0;
    userData.totalLanterns += state.litCount;
    userData.totalFireworks += state.fireworks.length;
    saveData();
    let stars = 0;
    if (state.outcome === 'won') stars = state.litCount >= state.slots.length ? 3 : 2;
    else if (state.litCount >= 3) stars = 1;
    saveSession({ stars, acc, total });
    // Climax: confetti over the moon stage when the night is won (full moon brightest).
    const stage = document.querySelector('.moon-stage');
    if (state.outcome === 'won') spawnConfetti(stage, 40);
    const badges = state.fireworks.join(' ') + ' ' + '🏮'.repeat(Math.min(state.litCount, 5));
    $('result-badges').textContent = badges.trim() || '🌑';
    $('result-title').textContent = state.outcome === 'won' ? '🌕 Đêm Trăng Rằm!' : '🏮 Kết Lễ Hội';
    $('result-emoji').textContent = state.outcome === 'won' ? '🌕' : '🏮';
    $('result-detail').innerHTML = `
      🏮 Đèn lồng: ${state.litCount}/${state.slots.length}<br>
      🎆 Pháo bông: ${state.fireworks.length}<br>
      ✅ Đúng: ${state.correct}/${total} (${acc}%)<br>
      ⭐ Sao: ${stars}/3
    `;
    ss('result-screen');
    if (typeof window.checkAndShowPrompt === 'function') { try { window.checkAndShowPrompt(); } catch(e){} }
  }

  async function saveSession({ stars, acc, total }) {
    try {
      const p = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
      if (!p.id) return;
      await fetch('/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        player_id: p.id, subject: subject === 'mix' ? 'math' : subject, difficulty,
        score: state.litCount, total_questions: total, correct_answers: state.correct,
        stars_earned: stars, combo_max: maxCombo, mode: 'v52', accuracy: acc,
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
    if (!window.V52Logic) { setTimeout(init, 30); return; }
    loadData(); renderStart(); wireSel();
    $('btn-start').addEventListener('click', startRun);
    $('btn-replay').addEventListener('click', startRun);
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

  function confirmExit() {
    $('exit-modal').style.display = 'flex';
  }

  function doExit() {
    $('exit-modal').style.display = 'none';
    clearInterval(tH);
    window.location.reload();
  }

  // Particle helpers ────────────────────────────────────────────────────────
  // spark = gold/festive star burst; glow = soft colored halo puff.
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

  // A burst of sparks radiating from the firework row when a firework spawns.
  function spawnFireworkBurst(parent) {
    if (!parent) return;
    const colors = ['#ff5252', '#ff9800', '#ffeb3b', '#f48fb1', '#4fc3f7', '#fff'];
    for (let i = 0; i < 18; i++) {
      const p = document.createElement('span');
      p.className = 'pfx pfx-firework';
      const ang = (Math.PI * 2 * i) / 18 + Math.random() * 0.3;
      const dist = 30 + Math.random() * 26;
      p.style.setProperty('--tx', Math.cos(ang) * dist + 'px');
      p.style.setProperty('--ty', Math.sin(ang) * dist + 'px');
      p.style.setProperty('--delay', (Math.random() * 0.1) + 's');
      p.style.background = colors[i % colors.length];
      parent.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
  }

  function spawnConfetti(parent, count) {
    if (!parent) return;
    const colors = ['#ff5252', '#ff9800', '#ffeb3b', '#f48fb1', '#4fc3f7', '#fff8e1'];
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
