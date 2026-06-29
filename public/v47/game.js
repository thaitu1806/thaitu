// V47 — Phòng Thí Nghiệm Slime (controller)
(function () {
  'use strict';
  const STORAGE_KEY = 'v47_slime';
  const QL = 24;
  let userData = { totalSlimes: 0, rareCount: 0 };
  function loadData() { try { const r = localStorage.getItem(STORAGE_KEY); if (r) Object.assign(userData, JSON.parse(r)); } catch(e){} }
  function saveData() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(userData)); } catch(e){} }

  let state = null, cache = [], used = new Set();
  let curQ = null, combo = 0, maxCombo = 0;
  let subject = 'mix', difficulty = 'easy';
  let qStart = 0, tH = null, locked = false, fbId = -1;
  let slimeRefs = [];           // [{ cell, char }] per crafted slime
  const $ = id => document.getElementById(id);
  const ss = id => { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); $(id).classList.add('active'); };

  function renderStart() {
    $('total-slimes').textContent = userData.totalSlimes;
    $('rare-count').textContent = userData.rareCount;
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
    const p = window.V47Logic.pickNextQuestion({ cache, usedIds: used });
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
    state = window.V47Logic.initState({ startedAt: Date.now() });
    cache = []; used.clear(); combo = 0; maxCombo = 0; fbId = -1;
    ss('game-screen'); renderHud(); renderJar(); renderSlimes();
    $('q-text').textContent = '⏳ Đang tải...';
    $('q-options').innerHTML = '';
    $('feedback').style.display = 'none';
    await fetchQ();
    showNextQ();
  }

  function renderHud() {
    $('slimes-text').textContent = `${state.slimesCrafted}/${state.maxSlimes}`;
    $('progress-text').textContent = `${state.questionsServed}/${state.maxQuestions}`;
  }

  function renderJar() {
    const jar = $('jar-content');
    jar.innerHTML = '';
    if (state.jarColor) {
      const emoji = window.V47Logic.COLOR_EMOJIS[state.jarColor];
      for (let i = 0; i < state.jarDrops; i++) {
        const d = document.createElement('span');
        d.className = 'drop';
        d.textContent = emoji;
        jar.appendChild(d);
      }
    }
    $('jar-info').textContent = state.jarDrops ? `${state.jarDrops}/${window.V47Logic.CRAFT_DROPS} giọt` : 'Bình rỗng';
  }

  function renderSlimes() {
    const row = $('slime-row');
    row.innerHTML = '';
    slimeRefs = [];
    const C = window.HocVuiCharacters;
    state.slimes.forEach(s => {
      const cell = document.createElement('span');
      cell.className = 'slime' + (s.rare ? ' rare' : '');
      row.appendChild(cell);
      const id = s.rare ? 'slime-rare' : 'slime-' + s.color;
      let char = null;
      if (C && C.hasSpecies(id)) {
        char = C.createCharacter(id, cell, { state: 'idle' });
      } else {
        cell.textContent = s.rare ? '✨' : window.V47Logic.COLOR_EMOJIS[s.color];
      }
      slimeRefs.push({ cell, char });
    });
  }

  function showNextQ() {
    if (window.V47Logic.isFinished(state)) { finish(); return; }
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
    const total = window.V47Logic.TIMER_SECONDS * 1000;
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
    const prevCraft = state.slimesCrafted;
    if (ok) {
      state = window.V47Logic.applyCorrect(state);
      combo++; if (combo > maxCombo) maxCombo = combo;
    } else {
      state = window.V47Logic.applyWrongOrTimeout(state);
      combo = 0;
    }
    logAns(sel, ck, ok, Date.now() - qStart);
    const fb = $('feedback');
    fb.style.display = 'block';
    if (state.slimesCrafted > prevCraft) {
      const last = state.slimes[state.slimes.length - 1];
      fb.className = 'feedback craft';
      fb.textContent = last.rare ? '✨ Slime hiếm xuất hiện!' : `🟢 Tạo slime ${last.color}!`;
    } else if (ok) {
      fb.className = 'feedback good';
      fb.textContent = '✅ Đúng! Thêm 1 giọt.';
    } else {
      fb.className = 'feedback bad';
      fb.textContent = '❌ Sai! Bình bị tràn, reset.';
    }
    renderHud(); renderJar(); renderSlimes();
    // Sparkle burst on each correct drop.
    if (ok) spawnParticles($('jar-content'), 'drop', 6);
    // Celebrate a freshly-crafted slime: happy bounce + burst on its sprite.
    if (state.slimesCrafted > prevCraft) {
      const last = state.slimes[state.slimes.length - 1];
      const ref = slimeRefs[slimeRefs.length - 1];
      if (ref) {
        if (ref.char) {
          ref.char.setState('happy');
          setTimeout(() => { if (ref.char) ref.char.setState('idle'); }, 700);
        }
        spawnParticles(ref.cell, last && last.rare ? 'rainbow' : 'sparkle', last && last.rare ? 14 : 9);
      }
    }
    setTimeout(() => { if (window.V47Logic.isFinished(state)) finish(); else showNextQ(); }, 1100);
  }

  function handleTimeout() {
    if (locked) return;
    locked = true;
    state = window.V47Logic.applyWrongOrTimeout(state);
    combo = 0;
    const fb = $('feedback'); fb.style.display = 'block';
    fb.className = 'feedback bad'; fb.textContent = '⏰ Hết giờ! Bình bị reset.';
    renderHud(); renderJar();
    setTimeout(() => { if (window.V47Logic.isFinished(state)) finish(); else showNextQ(); }, 1100);
  }

  function finish() {
    clearInterval(tH);
    const total = state.correct + state.wrong;
    const acc = total > 0 ? Math.round((state.correct / total) * 100) : 0;
    userData.totalSlimes += state.slimesCrafted;
    userData.rareCount += state.slimes.filter(s => s.rare).length;
    saveData();
    const stars = state.slimesCrafted >= 5 ? 3 : state.slimesCrafted >= 3 ? 2 : state.slimesCrafted >= 1 ? 1 : 0;
    saveSession({ stars, acc, total });
    // Confetti celebration on a strong finish.
    if (state.slimesCrafted >= 5) spawnConfetti($('app'), 40);
    const badges = state.slimes.map(s => s.rare ? '✨' : window.V47Logic.COLOR_EMOJIS[s.color]).join('  ') || '🧪';
    $('result-badges').textContent = badges;
    $('result-title').textContent = state.slimesCrafted >= 5 ? '🧪 Pháp Sư Slime!' : '🧪 Kết Thí Nghiệm';
    $('result-detail').innerHTML = `
      🧪 Slime tạo: ${state.slimesCrafted}/${state.maxSlimes}<br>
      ✨ Hiếm: ${state.slimes.filter(s => s.rare).length}<br>
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
        score: state.slimesCrafted, total_questions: total, correct_answers: state.correct,
        stars_earned: stars, combo_max: maxCombo, mode: 'v47', accuracy: acc,
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
    if (!window.V47Logic) { setTimeout(init, 30); return; }
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
    slimeRefs.forEach(r => { if (r.char) try { r.char.destroy(); } catch(e){} });
    slimeRefs = [];
    window.location.reload();
  }

  // Particle helpers ────────────────────────────────────────────────────────
  function spawnParticles(parent, kind, count) {
    if (!parent) return;
    const rainbow = ['#ff6f91', '#ffd54f', '#69f0ae', '#40c4ff', '#b388ff'];
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'pfx pfx-' + kind;
      if (kind === 'rainbow') p.style.background = rainbow[i % rainbow.length];
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
    const colors = ['#ef5350', '#42a5f5', '#66bb6a', '#ffca28', '#ab47bc', '#fff'];
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
