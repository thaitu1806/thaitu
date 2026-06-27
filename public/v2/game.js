// V2 — Phiêu Lưu Kho Báu (Treasure Map Adventure)
// Self-contained controller. The hero hops along an animated jungle/sea trail
// toward the treasure chest. Correct answers advance the hero; mistakes let a
// storm cloud creep closer. Reach the chest before 5 storm hits to win.
(function () {
  'use strict';

  const STORAGE_KEY = 'v2_adventure';
  const STEPS = 12;          // tiles from start to treasure
  const MAX_DANGER = 5;      // storm hits allowed
  const MAX_Q = 20;          // safety cap on questions served
  const TIMER_SECONDS = 18;

  let userData = { totalWins: 0, totalTreasure: 0 };
  function loadData() { try { const r = localStorage.getItem(STORAGE_KEY); if (r) Object.assign(userData, JSON.parse(r)); } catch (e) {} }
  function saveData() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(userData)); } catch (e) {} }

  let cache = [], used = new Set();
  let curQ = null, combo = 0, maxCombo = 0;
  let subject = 'mix', difficulty = 'easy';
  let pos = 0, danger = 0, served = 0, correct = 0, wrong = 0, outcome = null;
  let qStart = 0, tH = null, locked = false, fbId = -1;

  const $ = id => document.getElementById(id);
  const ss = id => { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); $(id).classList.add('active'); };

  function renderStart() {
    $('total-wins').textContent = userData.totalWins;
    $('total-treasure').textContent = userData.totalTreasure;
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

  // ── Question fetching ─────────────────────────────────────────────────────
  async function fetchQ() {
    const p = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
    const g = p.grade || 2;
    try {
      if (subject === 'mix') {
        const subs = ['math', 'vietnamese', 'english'];
        const per = Math.ceil(MAX_Q / 3);
        const r = await Promise.all(subs.map(s => fetch(`/api/questions?subject=${s}&difficulty=${difficulty}&limit=${per}&grade=${g}`).then(x => x.ok ? x.json() : []).catch(() => [])));
        cache = r.flat();
      } else {
        const r = await fetch(`/api/questions?subject=${subject}&difficulty=${difficulty}&limit=${MAX_Q}&grade=${g}`);
        cache = r.ok ? await r.json() : [];
      }
    } catch (e) { cache = []; }
    if (!Array.isArray(cache)) cache = [];
    for (let i = cache.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cache[i], cache[j]] = [cache[j], cache[i]]; }
  }

  function nextQ() {
    const q = cache.find(x => x && !used.has(x.id));
    if (q) { used.add(q.id); return q; }
    return mkFallback();
  }

  function mkFallback() {
    const a = 1 + Math.floor(Math.random() * 20), b = 1 + Math.floor(Math.random() * 20);
    const c = a + b, d = new Set();
    while (d.size < 3) { const off = [-3, -2, -1, 1, 2, 3][Math.floor(Math.random() * 6)]; const w = c + off; if (w > 0 && w !== c) d.add(w); }
    const nums = [c, ...d].sort(() => Math.random() - 0.5);
    fbId--;
    return { id: fbId, question_text: `${a} + ${b} = ?`, option_a: String(nums[0]), option_b: String(nums[1]), option_c: String(nums[2]), option_d: String(nums[3]), correct_answer: 'abcd'[nums.indexOf(c)] };
  }

  // ── Trail building ────────────────────────────────────────────────────────
  let heroEl = null;
  function buildTrail() {
    const trail = $('trail');
    trail.innerHTML = '';
    for (let i = 0; i <= STEPS; i++) {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.dataset.idx = String(i);
      if (i === 0) tile.classList.add('tile-start');
      if (i === STEPS) { tile.classList.add('tile-goal'); tile.innerHTML = '<span class="goal-chest">🏴‍☠️</span>'; }
      else if (i % 4 === 0 && i !== 0) tile.classList.add('tile-marker');
      trail.appendChild(tile);
    }
    // hero token
    heroEl = document.createElement('div');
    heroEl.className = 'hero-token';
    heroEl.innerHTML = '<span class="hero-face">🧭</span><span class="hero-shadow"></span>';
    trail.appendChild(heroEl);
    positionHero(false);
  }

  function positionHero(animate) {
    const trail = $('trail');
    const tile = trail.querySelector(`.tile[data-idx="${pos}"]`);
    if (!tile || !heroEl) return;
    const x = tile.offsetLeft + tile.offsetWidth / 2 - heroEl.offsetWidth / 2;
    const y = tile.offsetTop - heroEl.offsetHeight + 14;
    if (!animate) heroEl.style.transition = 'none';
    else heroEl.style.transition = '';
    heroEl.style.left = x + 'px';
    heroEl.style.top = y + 'px';
    if (!animate) { void heroEl.offsetWidth; heroEl.style.transition = ''; }
  }

  function hopHero(times) {
    heroEl.classList.add('hopping');
    setTimeout(() => heroEl.classList.remove('hopping'), 450 + times * 60);
  }

  // ── HUD / storm ───────────────────────────────────────────────────────────
  function renderHud() {
    $('step-text').textContent = `${pos}/${STEPS}`;
    $('danger-text').textContent = `${danger}/${MAX_DANGER}`;
    $('progress-text').textContent = `${served}/${MAX_Q}`;
  }
  function renderStorm() {
    const storm = $('storm');
    storm.dataset.danger = String(danger);
  }

  // ── Game flow ───────────────────────────────────────────────────────────────
  async function startRun() {
    cache = []; used.clear(); combo = 0; maxCombo = 0; fbId = -1;
    pos = 0; danger = 0; served = 0; correct = 0; wrong = 0; outcome = null;
    ss('game-screen');
    buildTrail(); renderHud(); renderStorm();
    $('q-text').textContent = '⏳ Đang tải...';
    $('q-options').innerHTML = '';
    $('feedback').style.display = 'none';
    await fetchQ();
    setTimeout(() => positionHero(false), 30);
    showNextQ();
  }

  function isFinished() {
    return outcome !== null || pos >= STEPS || danger >= MAX_DANGER || served >= MAX_Q;
  }

  function showNextQ() {
    if (pos >= STEPS) { outcome = 'won'; }
    if (danger >= MAX_DANGER) { outcome = 'storm'; }
    if (outcome || served >= MAX_Q) { finish(); return; }

    curQ = nextQ();
    served++;
    locked = false;
    qStart = Date.now();
    const subj = curQ.subject || subject;
    $('q-badge').textContent = subj === 'vietnamese' ? '📖' : subj === 'english' ? '🔤' : '🔢';
    $('q-text').textContent = curQ.question_text;
    $('feedback').style.display = 'none';
    const opts = $('q-options');
    opts.innerHTML = '';
    ['a', 'b', 'c', 'd'].forEach(k => {
      const t = curQ[`option_${k}`];
      if (t == null) return;
      const btn = document.createElement('button');
      btn.className = 'option-btn'; btn.dataset.key = k; btn.textContent = t;
      btn.addEventListener('click', () => handleAns(k));
      opts.appendChild(btn);
    });
    renderHud();
    startTimer();
  }

  function startTimer() {
    clearInterval(tH);
    const total = TIMER_SECONDS * 1000;
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
    const ok = sel.toLowerCase() === ck;
    document.querySelectorAll('.option-btn').forEach(b => {
      b.classList.add('disabled');
      if (b.dataset.key === ck) b.classList.add('correct');
      else if (b.dataset.key === sel && !ok) b.classList.add('wrong');
    });
    const fb = $('feedback'); fb.style.display = 'block';
    if (ok) {
      correct++;
      combo++; if (combo > maxCombo) maxCombo = combo;
      let advance = 1;
      if (combo > 0 && combo % 3 === 0) advance = 2;   // combo bonus hop
      const before = pos;
      pos = Math.min(STEPS, pos + advance);
      hopHero(advance);
      positionHero(true);
      const hopped = pos - before;
      if (advance >= 2) { fb.className = 'feedback bonus'; fb.textContent = `✨ Combo! Nhảy ${hopped} chặng!`; }
      else { fb.className = 'feedback good'; fb.textContent = '✅ Đúng! Tiến 1 chặng.'; }
      spawnParticles(heroEl, 'sparkle', 8);
    } else {
      wrong++; combo = 0;
      danger++;
      renderStorm();
      flashStorm();
      fb.className = 'feedback bad'; fb.textContent = '❌ Sai! Cơn bão tiến gần hơn.';
    }
    logAns(sel, ck, ok, Date.now() - qStart);
    renderHud();
    setTimeout(() => { if (isFinished()) finish(); else showNextQ(); }, 1100);
  }

  function handleTimeout() {
    if (locked) return;
    locked = true;
    wrong++; combo = 0; danger++;
    renderStorm(); flashStorm();
    const fb = $('feedback'); fb.style.display = 'block';
    fb.className = 'feedback bad'; fb.textContent = '⏰ Hết giờ! Cơn bão tiến gần hơn.';
    renderHud();
    setTimeout(() => { if (isFinished()) finish(); else showNextQ(); }, 1100);
  }

  function flashStorm() {
    const storm = $('storm');
    storm.classList.add('flash');
    setTimeout(() => storm.classList.remove('flash'), 500);
  }

  function finish() {
    clearInterval(tH);
    if (!outcome) outcome = pos >= STEPS ? 'won' : (danger >= MAX_DANGER ? 'storm' : 'end');
    const total = correct + wrong;
    const acc = total > 0 ? Math.round((correct / total) * 100) : 0;
    let stars = 0;
    if (outcome === 'won') stars = danger === 0 ? 3 : (danger <= 2 ? 2 : 1);
    else if (pos >= STEPS - 3) stars = 1;
    if (outcome === 'won') { userData.totalWins += 1; userData.totalTreasure += 1; }
    saveData();
    saveSession({ stars, acc, total });

    const stage = $('adventure-stage');
    let delay = 0;
    if (outcome === 'won') { spawnConfetti(stage, 36); delay = 1100; if (window.HocVuiSound) window.HocVuiSound.play('win'); }
    else if (outcome === 'storm') { $('storm').classList.add('is-bursting'); delay = 1200; if (window.HocVuiSound) window.HocVuiSound.play('lose'); }
    if (window.HocVuiCollection) window.HocVuiCollection.reward(stars);

    setTimeout(() => {
      let title = '🗺️ Kết Thúc', emoji = '🗺️';
      if (outcome === 'won') { title = '🏴‍☠️ Tìm Thấy Kho Báu!'; emoji = '💎'; }
      else if (outcome === 'storm') { title = '⛈️ Bão Đã Ập Tới!'; emoji = '⛈️'; }
      $('result-title').textContent = title;
      $('result-emoji').textContent = emoji;
      const stars = (outcome === 'won') ? (danger === 0 ? 3 : danger <= 2 ? 2 : 1) : (pos >= STEPS - 3 ? 1 : 0);
      $('result-stars').innerHTML = [1, 2, 3].map(i => `<span class="star ${i <= stars ? 'on' : ''}">⭐</span>`).join('');
      $('result-detail').innerHTML = `
        🧭 Chặng đi: ${pos}/${STEPS}<br>
        ⛈️ Nguy hiểm: ${danger}/${MAX_DANGER}<br>
        ✅ Đúng: ${correct}/${total} (${acc}%)<br>
        ✨ Combo cao nhất: ${maxCombo}
      `;
      ss('result-screen');
      $('storm').classList.remove('is-bursting');
      if (typeof window.checkAndShowPrompt === 'function') { try { window.checkAndShowPrompt(); } catch (e) {} }
    }, delay);
  }

  async function saveSession({ stars, acc, total }) {
    try {
      const p = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
      if (!p.id) return;
      await fetch('/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        player_id: p.id, subject: subject === 'mix' ? 'math' : subject, difficulty,
        score: pos, total_questions: total, correct_answers: correct,
        stars_earned: stars, combo_max: maxCombo, mode: 'v2', accuracy: acc,
      }) });
    } catch (e) {}
  }

  function logAns(sel, ck, ok, ms) {
    if (!curQ || curQ.id < 0) return;
    try {
      const p = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
      if (!p.id) return;
      fetch('/api/answers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        player_id: p.id, question_id: curQ.id, selected_answer: sel, correct_answer: ck,
        is_correct: ok, time_spent_ms: ms, difficulty,
      }) }).catch(() => {});
    } catch (e) {}
  }

  // ── Particles ───────────────────────────────────────────────────────────────
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
    const colors = ['#ffd54f', '#ff7043', '#81c784', '#64b5f6', '#ba68c8', '#fff'];
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

  // ── TTS ─────────────────────────────────────────────────────────────────────
  function speakQ() {
    if (!curQ) return;
    if (window.HocVuiTTS && window.HocVuiTTS.speak) { window.HocVuiTTS.speak(curQ.question_text); return; }
    try { const u = new SpeechSynthesisUtterance(curQ.question_text); u.lang = 'vi-VN'; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {}
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    loadData(); renderStart(); wireSel();
    $('btn-start').addEventListener('click', startRun);
    $('btn-replay').addEventListener('click', startRun);
    // TTS speaker button is auto-injected by shared /tts.js — no custom button needed.
    const guideModal = $('guide-modal');
    $('btn-guide').addEventListener('click', () => { guideModal.style.display = 'flex'; });
    $('btn-guide-close').addEventListener('click', () => { guideModal.style.display = 'none'; });
    guideModal.addEventListener('click', e => { if (e.target === guideModal) guideModal.style.display = 'none'; });
    $('btn-exit').addEventListener('click', () => { $('exit-modal').style.display = 'flex'; });
    const exitModal = $('exit-modal');
    $('btn-exit-cancel').addEventListener('click', () => { exitModal.style.display = 'none'; });
    $('btn-exit-confirm').addEventListener('click', () => { exitModal.style.display = 'none'; clearInterval(tH); window.location.reload(); });
    exitModal.addEventListener('click', e => { if (e.target === exitModal) exitModal.style.display = 'none'; });
    window.addEventListener('resize', () => { if ($('game-screen').classList.contains('active')) positionHero(false); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
