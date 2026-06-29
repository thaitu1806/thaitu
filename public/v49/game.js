// V49 — DJ Nhí (controller)
(function () {
  'use strict';
  const STORAGE_KEY = 'v49_dj';
  const QL = 28;
  let userData = { totalTracks: 0, perfectTracks: 0 };
  function loadData() { try { const r = localStorage.getItem(STORAGE_KEY); if (r) Object.assign(userData, JSON.parse(r)); } catch(e){} }
  function saveData() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(userData)); } catch(e){} }

  let state = null, cache = [], used = new Set();
  let curQ = null, combo = 0, maxCombo = 0;
  let subject = 'mix', difficulty = 'easy';
  let qStart = 0, tH = null, locked = false, fbId = -1;
  let djChar = null;            // main DJ stage character
  let trackRefs = [];           // [{ slot, char }] per built track
  const DJ_POOL = ['dj-classic', 'dj-cool', 'dj-star', 'dj-funky', 'dj-neon', 'dj-retro'];
  const $ = id => document.getElementById(id);
  const ss = id => { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); $(id).classList.add('active'); };

  function renderStart() {
    $('total-tracks').textContent = userData.totalTracks;
    $('perfect-tracks').textContent = userData.perfectTracks;
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
    const p = window.V49Logic.pickNextQuestion({ cache, usedIds: used });
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
    state = window.V49Logic.initState({ startedAt: Date.now() });
    cache = []; used.clear(); combo = 0; maxCombo = 0; fbId = -1;
    ss('game-screen'); buildDJ(); renderHud(); renderTracks(); renderBeats(); renderGroove(); syncStage();
    $('q-text').textContent = '⏳ Đang tải...';
    $('q-options').innerHTML = '';
    $('feedback').style.display = 'none';
    await fetchQ();
    showNextQ();
  }

  // Build the main DJ stage character (random from pool). Called once per run.
  function buildDJ() {
    const host = $('dj-char');
    if (!host) return;
    host.innerHTML = '';
    djChar = null;
    const C = window.HocVuiCharacters;
    const id = DJ_POOL[Math.floor(Math.random() * DJ_POOL.length)];
    if (C && C.hasSpecies(id)) {
      djChar = C.createCharacter(id, host, { state: 'idle' });
    } else {
      host.textContent = '🎧';
    }
  }

  // Sync stage intensity + DJ state to current groove level.
  function syncStage() {
    const stage = $('dj-stage');
    if (stage) stage.dataset.groove = String(state.groove);
    if (djChar) {
      if (state.groove >= window.V49Logic.GROOVE_THRESHOLD) djChar.setState('groove');
      else djChar.setState('idle');
    }
  }

  // Brief beat pulse + floating notes when a beat lands.
  function pulseBeat() {
    const stage = $('dj-stage');
    if (!stage) return;
    stage.classList.remove('beat-hit');
    void stage.offsetWidth;
    stage.classList.add('beat-hit');
    spawnNotes($('dj-char'), 4);
  }

  function renderHud() {
    $('tracks-text').textContent = `${state.tracks.length}/${state.tracksGoal}`;
    $('groove-text').textContent = `${state.groove}/${window.V49Logic.GROOVE_MAX}`;
    $('progress-text').textContent = `${state.questionsServed}/${state.maxQuestions}`;
  }

  function renderBeats() {
    const pct = (state.currentBeats / state.beatsPerTrack) * 100;
    $('beat-fill').style.width = pct + '%';
  }

  function renderGroove() {
    const row = $('groove-row');
    row.innerHTML = '<span>🔥 Groove:</span>';
    for (let i = 0; i < window.V49Logic.GROOVE_MAX; i++) {
      const p = document.createElement('span');
      p.className = 'groove-pip' + (i < state.groove ? ' on' : '');
      row.appendChild(p);
    }
  }

  function renderTracks() {
    const row = $('track-row');
    row.innerHTML = '';
    trackRefs = [];
    const C = window.HocVuiCharacters;
    state.tracks.forEach(t => {
      const slot = document.createElement('span');
      slot.className = 'track' + (t.perfect ? ' perfect' : '');
      slot.title = t.name + (t.perfect ? ' (Perfect)' : '');
      row.appendChild(slot);
      let char = null;
      if (C && C.hasSpecies(t.id)) {
        char = C.createCharacter(t.id, slot, { state: 'idle' });
      } else {
        slot.textContent = t.emoji;
      }
      trackRefs.push({ slot, char });
    });
  }

  function showNextQ() {
    if (window.V49Logic.isFinished(state)) { finish(); return; }
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
    const total = window.V49Logic.TIMER_SECONDS * 1000;
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
    const prevTracks = state.tracks.length;
    if (ok) {
      state = window.V49Logic.applyCorrect(state);
      combo++; if (combo > maxCombo) maxCombo = combo;
    } else {
      state = window.V49Logic.applyWrongOrTimeout(state);
      combo = 0;
    }
    logAns(sel, ck, ok, Date.now() - qStart);
    const fb = $('feedback');
    fb.style.display = 'block';
    if (state.tracks.length > prevTracks) {
      const last = state.tracks[state.tracks.length - 1];
      fb.className = 'feedback bonus';
      fb.textContent = last.perfect ? `✨ Track ${last.name} hoàn hảo!` : `🎶 Track ${last.name} hoàn thành!`;
    } else if (ok) {
      fb.className = 'feedback good';
      fb.textContent = '✅ Đúng nhịp!';
    } else {
      fb.className = 'feedback bad';
      fb.textContent = '❌ Lệch nhịp, groove giảm.';
    }
    renderHud(); renderTracks(); renderBeats(); renderGroove(); syncStage();
    if (ok) pulseBeat();
    // Celebrate a freshly-completed track: happy bounce + sparkles on its sprite.
    if (state.tracks.length > prevTracks) {
      const ref = trackRefs[state.tracks.length - 1];
      if (ref) {
        if (ref.char) {
          ref.char.setState('happy');
          setTimeout(() => { if (ref.char) ref.char.setState('idle'); }, 600);
        }
        spawnParticles(ref.slot, 'sparkle', 8);
      }
    }
    setTimeout(() => { if (window.V49Logic.isFinished(state)) finish(); else showNextQ(); }, 1100);
  }

  function handleTimeout() {
    if (locked) return;
    locked = true;
    state = window.V49Logic.applyWrongOrTimeout(state);
    combo = 0;
    const fb = $('feedback'); fb.style.display = 'block';
    fb.className = 'feedback bad'; fb.textContent = '⏰ Hết giờ! Groove giảm.';
    renderHud(); renderGroove(); syncStage();
    setTimeout(() => { if (window.V49Logic.isFinished(state)) finish(); else showNextQ(); }, 1100);
  }

  function finish() {
    clearInterval(tH);
    const total = state.correct + state.wrong;
    const acc = total > 0 ? Math.round((state.correct / total) * 100) : 0;
    userData.totalTracks += state.tracks.length;
    userData.perfectTracks += state.tracks.filter(t => t.perfect).length;
    saveData();
    let stars = 0;
    if (state.outcome === 'won') stars = 3;
    else if (state.tracks.length >= 3) stars = 2;
    else if (state.tracks.length >= 1) stars = 1;
    saveSession({ stars, acc, total });

    // Climax: "drop" flash + confetti on a win.
    const stage = $('dj-stage');
    let delay = 0;
    if (state.outcome === 'won') {
      if (stage) stage.classList.add('is-drop');
      if (djChar) djChar.setState('happy');
      spawnConfetti(stage, 40);
      delay = 1300;
    }

    setTimeout(() => {
      const badges = state.tracks.map(t => t.emoji).join(' ') || '🎧';
      $('result-badges').textContent = badges;
      $('result-title').textContent = state.outcome === 'won' ? '🏆 DJ Tài Năng!' : '🎧 Kết Set';
      $('result-emoji').textContent = state.outcome === 'won' ? '🏆' : '🎧';
      $('result-detail').innerHTML = `
        🎶 Track: ${state.tracks.length}/${state.tracksGoal}<br>
        ✨ Perfect: ${state.tracks.filter(t => t.perfect).length}<br>
        ✅ Đúng: ${state.correct}/${total} (${acc}%)<br>
        ⭐ Sao: ${stars}/3
      `;
      ss('result-screen');
      if (stage) stage.classList.remove('is-drop');
      if (typeof window.checkAndShowPrompt === 'function') { try { window.checkAndShowPrompt(); } catch(e){} }
    }, delay);
  }

  async function saveSession({ stars, acc, total }) {
    try {
      const p = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
      if (!p.id) return;
      await fetch('/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        player_id: p.id, subject: subject === 'mix' ? 'math' : subject, difficulty,
        score: state.tracks.length, total_questions: total, correct_answers: state.correct,
        stars_earned: stars, combo_max: maxCombo, mode: 'v49', accuracy: acc,
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
    if (!window.V49Logic) { setTimeout(init, 30); return; }
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
  function spawnNotes(parent, count) {
    if (!parent) return;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'pfx pfx-note';
      p.textContent = i % 2 ? '♪' : '♫';
      p.style.setProperty('--tx', (Math.random() * 70 - 35) + 'px');
      p.style.setProperty('--ty', -(Math.random() * 36 + 24) + 'px');
      p.style.setProperty('--delay', (Math.random() * 0.15) + 's');
      parent.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
  }

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

  function spawnConfetti(parent, count) {
    if (!parent) return;
    const colors = ['#00e5ff', '#e040fb', '#ffeb3b', '#b388ff', '#00bcd4', '#fff'];
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
