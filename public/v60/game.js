// V60 — Cổ Tích Việt Nam (controller)
(function () {
  'use strict';
  const STORAGE_KEY = 'v60_tales';
  const QL = 28;
  let userData = { totalStories: 0, totalMorals: 0 };
  function loadData() { try { const r = localStorage.getItem(STORAGE_KEY); if (r) Object.assign(userData, JSON.parse(r)); } catch(e){} }
  function saveData() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(userData)); } catch(e){} }

  let state = null, cache = [], used = new Set();
  let curQ = null, combo = 0, maxCombo = 0;
  let subject = 'mix', difficulty = 'easy';
  let qStart = 0, tH = null, locked = false, fbId = -1;
  let storyRefs = [];           // [{ slot, char }] per finished story
  const $ = id => document.getElementById(id);
  const ss = id => { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); $(id).classList.add('active'); };

  function renderStart() { $('total-stories').textContent = userData.totalStories; $('total-morals').textContent = userData.totalMorals; }
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
  function nextQ() { const p = window.V60Logic.pickNextQuestion({ cache, usedIds: used }); if (p) { used.add(p.id); return p; } return mkFallback(); }
  function mkFallback() {
    const a = 1 + Math.floor(Math.random() * 20), b = 1 + Math.floor(Math.random() * 20), c = a + b;
    const d = new Set(); while (d.size < 3) { const off = [-3, -2, -1, 1, 2, 3][Math.floor(Math.random() * 6)]; const w = c + off; if (w > 0 && w !== c) d.add(w); }
    const nums = [c, ...d].sort(() => Math.random() - 0.5); fbId--;
    return { id: fbId, question_text: `${a} + ${b} = ?`, option_a: String(nums[0]), option_b: String(nums[1]), option_c: String(nums[2]), option_d: String(nums[3]), correct_answer: 'abcd'[nums.indexOf(c)] };
  }
  async function startRun() {
    state = window.V60Logic.initState({ startedAt: Date.now() });
    cache = []; used.clear(); combo = 0; maxCombo = 0; fbId = -1;
    ss('game-screen'); renderHud(); renderChapters(); renderStories(); renderMorals();
    $('q-text').textContent = '⏳ Đang tải...'; $('q-options').innerHTML = ''; $('feedback').style.display = 'none';
    await fetchQ(); showNextQ();
  }
  function renderHud() {
    $('stories-text').textContent = `${state.storiesDone.length}/${state.storiesGoal}`;
    $('chapters-text').textContent = `${state.chapters}/${state.chaptersPerStory}`;
    $('progress-text').textContent = `${state.questionsServed}/${state.maxQuestions}`;
  }
  function renderChapters() {
    const row = $('chapter-row'); row.innerHTML = '';
    for (let i = 0; i < state.chaptersPerStory; i++) {
      const p = document.createElement('div'); p.className = 'chapter-page' + (i < state.chapters ? ' opened' : '');
      p.textContent = i < state.chapters ? '📖' : '📜';
      row.appendChild(p);
    }
  }
  function renderStories() {
    const row = $('stories-row'); row.innerHTML = '';
    storyRefs = [];
    const C = window.HocVuiCharacters;
    state.storiesDone.forEach(s => {
      const el = document.createElement('span'); el.className = 'story-card';
      el.title = s.name;
      const sprite = document.createElement('span'); sprite.className = 'story-sprite';
      el.appendChild(sprite);
      let char = null;
      if (C && C.hasSpecies(s.id)) {
        char = C.createCharacter(s.id, sprite, { state: 'idle' });
      } else {
        sprite.textContent = s.emoji;
      }
      const label = document.createElement('span'); label.className = 'story-name'; label.textContent = s.name;
      el.appendChild(label);
      row.appendChild(el);
      storyRefs.push({ slot: el, char });
    });
  }
  function renderMorals() {
    const row = $('morals-row'); row.innerHTML = '';
    state.morals.forEach(m => { const el = document.createElement('span'); el.className = 'moral'; el.textContent = `“${m.text}”`; row.appendChild(el); });
  }
  function showNextQ() {
    if (window.V60Logic.isFinished(state)) { finish(); return; }
    curQ = nextQ(); locked = false; qStart = Date.now();
    $('q-text').textContent = curQ.question_text; $('feedback').style.display = 'none';
    const opts = $('q-options'); opts.innerHTML = '';
    ['a','b','c','d'].forEach(k => { const t = curQ[`option_${k}`]; if (t == null) return; const btn = document.createElement('button'); btn.className = 'option-btn'; btn.dataset.key = k; btn.textContent = t; btn.addEventListener('click', () => handleAns(k)); opts.appendChild(btn); });
    startTimer();
  }
  function startTimer() {
    clearInterval(tH); const total = window.V60Logic.TIMER_SECONDS * 1000;
    const fill = $('timer-fill'); fill.classList.remove('warning');
    tH = setInterval(() => { const rem = Math.max(0, total - (Date.now() - qStart)); fill.style.width = (rem / total) * 100 + '%'; if (rem <= total / 3) fill.classList.add('warning'); if (rem <= 0) { clearInterval(tH); handleTimeout(); } }, 100);
  }
  function handleAns(sel) {
    if (locked) return; locked = true; clearInterval(tH);
    const ck = (curQ.correct_answer || '').toLowerCase(); const ok = sel === ck;
    document.querySelectorAll('.option-btn').forEach(b => { b.classList.add('disabled'); if (b.dataset.key === ck) b.classList.add('correct'); else if (b.dataset.key === sel && !ok) b.classList.add('wrong'); });
    const prevS = state.storiesDone.length; const prevM = state.morals.length; const prevCh = state.chapters;
    if (ok) { state = window.V60Logic.applyCorrect(state); combo++; if (combo > maxCombo) maxCombo = combo; }
    else { state = window.V60Logic.applyWrongOrTimeout(state); combo = 0; }
    logAns(sel, ck, ok, Date.now() - qStart);
    const fb = $('feedback'); fb.style.display = 'block';
    const newStory = state.storiesDone.length > prevS;
    const newMoral = state.morals.length > prevM;
    if (newStory) { const last = state.storiesDone[state.storiesDone.length - 1]; fb.className = 'feedback bonus'; fb.textContent = `📖 Đọc xong "${last.name}"!`; }
    else if (newMoral) { fb.className = 'feedback bonus'; fb.textContent = `✨ Bài học mới: ${state.morals[state.morals.length - 1].text}`; }
    else if (ok) { fb.className = 'feedback good'; fb.textContent = '✅ Lật trang!'; }
    else { fb.className = 'feedback bad'; fb.textContent = '❌ Sai! Lùi 1 trang.'; }
    renderHud(); renderChapters(); renderStories(); renderMorals();
    // Page-turn sparkle when a chapter is freshly opened (but no story completed this turn).
    if (ok && !newStory && state.chapters > prevCh) {
      const pages = $('chapter-row').children;
      const turned = pages[state.chapters - 1];
      if (turned) spawnParticles(turned, 'page', 6);
    }
    // Bigger burst + happy bounce on a freshly-finished story.
    if (newStory) {
      const ref = storyRefs[state.storiesDone.length - 1];
      if (ref) {
        if (ref.char) { ref.char.setState('happy'); setTimeout(() => { if (ref.char) ref.char.setState('idle'); }, 700); }
        spawnParticles(ref.slot, 'story', 14);
      }
    }
    // Moral sparkle when a new moral is collected.
    if (newMoral) {
      const mrow = $('morals-row');
      const last = mrow.lastElementChild;
      if (last) spawnParticles(last, 'moral', 8);
    }
    setTimeout(() => { if (window.V60Logic.isFinished(state)) finish(); else showNextQ(); }, 1100);
  }
  function handleTimeout() {
    if (locked) return; locked = true;
    state = window.V60Logic.applyWrongOrTimeout(state); combo = 0;
    const fb = $('feedback'); fb.style.display = 'block'; fb.className = 'feedback bad'; fb.textContent = '⏰ Hết giờ!';
    renderHud(); renderChapters();
    setTimeout(() => { if (window.V60Logic.isFinished(state)) finish(); else showNextQ(); }, 1100);
  }
  function finish() {
    clearInterval(tH); const total = state.correct + state.wrong; const acc = total > 0 ? Math.round((state.correct / total) * 100) : 0;
    userData.totalStories += state.storiesDone.length; userData.totalMorals += state.morals.length; saveData();
    let stars = 0; if (state.outcome === 'won') stars = 3; else if (state.storiesDone.length >= 2) stars = 2; else if (state.storiesDone.length >= 1) stars = 1;
    saveSession({ stars, acc, total });

    // Climax: confetti burst on a win (all stories finished).
    let delay = 0;
    if (state.outcome === 'won') { spawnConfetti($('book-stage'), 40); delay = 1300; }

    setTimeout(() => {
      const badges = state.storiesDone.map(s => s.emoji).join(' ') || '📜';
      $('result-badges').textContent = badges;
      $('result-title').textContent = state.outcome === 'won' ? '📚 Bậc Thầy Cổ Tích!' : '📜 Kết Buổi Đọc';
      $('result-emoji').textContent = state.outcome === 'won' ? '📚' : '📜';
      $('result-detail').innerHTML = `📖 Truyện: ${state.storiesDone.length}/${state.storiesGoal}<br>✨ Bài học: ${state.morals.length}<br>✅ Đúng: ${state.correct}/${total} (${acc}%)<br>⭐ Sao: ${stars}/3`;
      ss('result-screen'); if (typeof window.checkAndShowPrompt === 'function') { try { window.checkAndShowPrompt(); } catch(e){} }
    }, delay);
  }
  async function saveSession({ stars, acc, total }) {
    try { const p = JSON.parse(localStorage.getItem('hocvui_profile') || '{}'); if (!p.id) return;
      await fetch('/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ player_id: p.id, subject: subject === 'mix' ? 'math' : subject, difficulty, score: state.storiesDone.length, total_questions: total, correct_answers: state.correct, stars_earned: stars, combo_max: maxCombo, mode: 'v60', accuracy: acc })}); } catch(e){}
  }
  function logAns(sel, ck, ok, ms) {
    if (!curQ || curQ.id < 0) return;
    try { const p = JSON.parse(localStorage.getItem('hocvui_profile') || '{}'); if (!p.id) return;
      fetch('/api/answers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ player_id: p.id, question_id: curQ.id, selected_answer: sel, correct_answer: ck, is_correct: ok, time_spent_ms: ms, difficulty })}).catch(() => {}); } catch(e){}
  }
  function init() {
    if (!window.V60Logic) { setTimeout(init, 30); return; }
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
  function doExit() { $('exit-modal').style.display = 'none'; clearInterval(tH); window.location.reload(); }

  // Particle helpers ────────────────────────────────────────────────────────
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
    const colors = ['#ffeb3b', '#d4a574', '#8b6914', '#66bb6a', '#e57373', '#fff8e1'];
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
