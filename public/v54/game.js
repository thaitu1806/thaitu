// V54 — Phù Thủy Thuốc (controller)
(function () {
  'use strict';
  const STORAGE_KEY = 'v54_witch';
  const QL = 26;
  let userData = { totalPotions: 0, totalLegendary: 0 };
  function loadData() { try { const r = localStorage.getItem(STORAGE_KEY); if (r) Object.assign(userData, JSON.parse(r)); } catch(e){} }
  function saveData() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(userData)); } catch(e){} }

  let state = null, cache = [], used = new Set();
  let curQ = null, combo = 0, maxCombo = 0;
  let subject = 'mix', difficulty = 'easy';
  let qStart = 0, tH = null, locked = false, fbId = -1;
  let witchChar = null;          // main witch stage character
  let potionRefs = [];           // [{ slot, char }] per brewed potion
  const WITCH_POOL = ['witch', 'witch-cat', 'witch-owl'];
  const $ = id => document.getElementById(id);
  const ss = id => { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); $(id).classList.add('active'); };

  function renderStart() {
    $('total-potions').textContent = userData.totalPotions;
    $('total-legendary').textContent = userData.totalLegendary;
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
    const p = window.V54Logic.pickNextQuestion({ cache, usedIds: used });
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
    state = window.V54Logic.initState({ startedAt: Date.now() });
    cache = []; used.clear(); combo = 0; maxCombo = 0; fbId = -1;
    ss('game-screen'); buildWitch(); renderHud(); renderCauldron(); renderPotions();
    $('q-text').textContent = '⏳ Đang tải...';
    $('q-options').innerHTML = '';
    $('feedback').style.display = 'none';
    await fetchQ();
    showNextQ();
  }

  // Build the main witch stage character (random from pool). Called once per run.
  function buildWitch() {
    const host = $('witch-char');
    if (!host) return;
    host.innerHTML = '';
    witchChar = null;
    const C = window.HocVuiCharacters;
    const id = WITCH_POOL[Math.floor(Math.random() * WITCH_POOL.length)];
    if (C && C.hasSpecies(id)) {
      witchChar = C.createCharacter(id, host, { state: 'idle' });
    } else {
      host.textContent = '🧙';
    }
  }

  function renderHud() {
    $('potions-text').textContent = `${state.potions.length}/${state.potionsGoal}`;
    $('streak-text').textContent = state.streak;
    $('progress-text').textContent = `${state.questionsServed}/${state.maxQuestions}`;
  }

  function renderCauldron() {
    const c = $('cauldron-content');
    c.innerHTML = '';
    if (state.cauldron.color) {
      const emoji = window.V54Logic.INGREDIENT_EMOJIS[state.cauldron.color];
      for (let i = 0; i < state.cauldron.count; i++) {
        const el = document.createElement('span');
        el.className = 'ingredient';
        el.textContent = emoji;
        c.appendChild(el);
      }
    }
    $('cauldron-info').textContent = state.cauldron.count ? `${state.cauldron.count}/${window.V54Logic.INGREDIENTS_PER_POTION} nguyên liệu` : 'Vạc rỗng';
  }

  function renderPotions() {
    const row = $('potion-row');
    row.innerHTML = '';
    potionRefs = [];
    const C = window.HocVuiCharacters;
    state.potions.forEach(p => {
      const slot = document.createElement('span');
      slot.className = 'potion' + (p.legendary ? ' legendary' : '');
      row.appendChild(slot);
      const id = p.legendary ? 'potion-legendary' : 'potion-' + p.color;
      let char = null;
      if (C && C.hasSpecies(id)) {
        char = C.createCharacter(id, slot, { state: 'idle' });
      } else {
        slot.textContent = p.legendary ? window.V54Logic.LEGENDARY_EMOJI : window.V54Logic.POTION_EMOJI;
      }
      potionRefs.push({ slot, char });
    });
  }

  function showNextQ() {
    if (window.V54Logic.isFinished(state)) { finish(); return; }
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
    const total = window.V54Logic.TIMER_SECONDS * 1000;
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
    const prevPot = state.potions.length;
    if (ok) {
      state = window.V54Logic.applyCorrect(state);
      combo++; if (combo > maxCombo) maxCombo = combo;
    } else {
      state = window.V54Logic.applyWrongOrTimeout(state);
      combo = 0;
    }
    logAns(sel, ck, ok, Date.now() - qStart);
    const fb = $('feedback');
    fb.style.display = 'block';
    if (state.potions.length > prevPot) {
      const last = state.potions[state.potions.length - 1];
      fb.className = 'feedback bonus';
      fb.textContent = last.legendary ? '⚗️ Thuốc huyền thoại!' : '🧪 Một bình thuốc!';
    } else if (ok) {
      fb.className = 'feedback good';
      fb.textContent = '✅ Thêm nguyên liệu!';
    } else {
      fb.className = 'feedback bad';
      fb.textContent = '❌ Sai! Vạc nổ tung.';
    }
    renderHud(); renderCauldron(); renderPotions();
    if (ok) spawnParticles($('cauldron-content'), 'bubble', 6);
    else cauldronPoof();
    // Celebrate a freshly-brewed potion: witch + potion bounce + burst.
    if (state.potions.length > prevPot) {
      const last = state.potions[state.potions.length - 1];
      if (witchChar) {
        witchChar.setState('happy');
        setTimeout(() => { if (witchChar) witchChar.setState('idle'); }, 700);
      }
      const ref = potionRefs[potionRefs.length - 1];
      if (ref) {
        if (ref.char) {
          ref.char.setState('happy');
          setTimeout(() => { if (ref.char) ref.char.setState('idle'); }, 700);
        }
        spawnParticles(ref.slot, last && last.legendary ? 'gold' : 'sparkle', last && last.legendary ? 14 : 9);
      }
      spawnParticles($('cauldron-content'), last && last.legendary ? 'gold' : 'sparkle', last && last.legendary ? 12 : 8);
    }
    setTimeout(() => { if (window.V54Logic.isFinished(state)) finish(); else showNextQ(); }, 1100);
  }

  function handleTimeout() {
    if (locked) return;
    locked = true;
    state = window.V54Logic.applyWrongOrTimeout(state);
    combo = 0;
    const fb = $('feedback'); fb.style.display = 'block';
    fb.className = 'feedback bad'; fb.textContent = '⏰ Hết giờ! Vạc nổ tung.';
    cauldronPoof();
    renderHud(); renderCauldron();
    setTimeout(() => { if (window.V54Logic.isFinished(state)) finish(); else showNextQ(); }, 1100);
  }

  // Witch reels back + smoke poof when the cauldron blows on a wrong answer.
  function cauldronPoof() {
    const stage = $('brew-stage');
    if (stage) { stage.classList.remove('blow'); void stage.offsetWidth; stage.classList.add('blow'); }
    if (witchChar) {
      witchChar.setState('scared');
      setTimeout(() => { if (witchChar) witchChar.setState('idle'); }, 700);
    }
    spawnParticles($('cauldron-content'), 'smoke', 8);
  }

  function finish() {
    clearInterval(tH);
    const total = state.correct + state.wrong;
    const acc = total > 0 ? Math.round((state.correct / total) * 100) : 0;
    userData.totalPotions += state.potions.length;
    userData.totalLegendary += state.potions.filter(p => p.legendary).length;
    saveData();
    let stars = 0;
    if (state.outcome === 'won') stars = 3;
    else if (state.potions.length >= 3) stars = 2;
    else if (state.potions.length >= 1) stars = 1;
    saveSession({ stars, acc, total });
    // Confetti celebration on a win.
    if (state.outcome === 'won') {
      if (witchChar) witchChar.setState('happy');
      spawnConfetti($('app'), 44);
    }
    const badges = state.potions.map(p => p.legendary ? window.V54Logic.LEGENDARY_EMOJI : window.V54Logic.POTION_EMOJI).join(' ') || '🧙';
    $('result-badges').textContent = badges;
    $('result-title').textContent = state.outcome === 'won' ? '🧙‍♀️ Bậc Thầy Phù Thủy!' : '🧙 Kết Buổi Pha Chế';
    $('result-emoji').textContent = state.outcome === 'won' ? '🧙‍♀️' : '🧙';
    $('result-detail').innerHTML = `
      🧪 Thuốc: ${state.potions.length}/${state.potionsGoal}<br>
      ⚗️ Huyền thoại: ${state.potions.filter(p => p.legendary).length}<br>
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
        score: state.potions.length, total_questions: total, correct_answers: state.correct,
        stars_earned: stars, combo_max: maxCombo, mode: 'v54', accuracy: acc,
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
    if (!window.V54Logic) { setTimeout(init, 30); return; }
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
    potionRefs.forEach(r => { if (r.char) try { r.char.destroy(); } catch(e){} });
    potionRefs = [];
    if (witchChar) { try { witchChar.destroy(); } catch(e){} witchChar = null; }
    window.location.reload();
  }

  // Particle helpers ────────────────────────────────────────────────────────
  function spawnParticles(parent, kind, count) {
    if (!parent) return;
    const gold = ['#fff59d', '#ffd54f', '#ffb300', '#ff8f00', '#fff'];
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'pfx pfx-' + kind;
      if (kind === 'gold') p.style.background = gold[i % gold.length];
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
    const colors = ['#ce93d8', '#ab47bc', '#ffca28', '#f8bbd0', '#ad1457', '#fff'];
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
