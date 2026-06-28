// Lab / Pop — controller. Answer bubbles rise from the bottom; tap the correct
// one before it floats off the top. Wrong tap or a missed correct answer = -1 life.
(function () {
  'use strict';
  const L = window.LabPopLogic;
  const TOTAL_Q = 10;
  const MAX_LIVES = 3;
  const RISE_MS = 7000;          // time for a bubble to cross the field

  let subject = 'math', difficulty = 'easy';
  let pool = [], used = new Set();
  let qi = 0, score = 0, lives = MAX_LIVES, correctCount = 0, served = 0;
  let curQ = null, locked = false, raf = null, bubbles = [], startT = 0;

  const $ = id => document.getElementById(id);
  const ss = id => { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); $(id).classList.add('active'); };

  function wireSel() {
    document.querySelectorAll('.selector-options').forEach(g => g.addEventListener('click', e => {
      const b = e.target.closest('.sel-btn'); if (!b) return;
      g.querySelectorAll('.sel-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      if (g.dataset.group === 'subject') subject = b.dataset.value; else difficulty = b.dataset.value;
    }));
  }

  async function fetchQ() {
    const p = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
    const g = p.grade || 2;
    try {
      const r = await fetch(`/api/questions?subject=${subject}&difficulty=${difficulty}&limit=${TOTAL_Q + 10}&grade=${g}`);
      pool = r.ok ? await r.json() : [];
    } catch (e) { pool = []; }
    if (!Array.isArray(pool)) pool = [];
    pool = L.shuffle(pool);
  }
  function nextQ() {
    const q = pool.find(x => x && !used.has(x.id));
    if (q) { used.add(q.id); return q; }
    return fallback();
  }
  function fallback() {
    const a = 1 + Math.floor(Math.random() * 9), b = 1 + Math.floor(Math.random() * 9);
    const c = a + b; const opts = new Set([c]);
    while (opts.size < 4) { const w = c + (Math.floor(Math.random() * 7) - 3); if (w > 0) opts.add(w); }
    const arr = [...opts].sort(() => Math.random() - 0.5);
    return { id: 'f' + Date.now() + Math.random(), question_text: `${a} + ${b} = ?`, option_a: String(arr[0]), option_b: String(arr[1]), option_c: String(arr[2]), option_d: String(arr[3]), correct_answer: 'abcd'[arr.indexOf(c)] };
  }

  async function start() {
    qi = 0; score = 0; lives = MAX_LIVES; correctCount = 0; served = 0; used = new Set();
    ss('game-screen');
    $('pop-question').textContent = '⏳ Đang tải...';
    $('pop-field').innerHTML = '';
    await fetchQ();
    renderHud();
    nextRound();
  }

  function renderHud() {
    $('round-text').textContent = `${Math.min(served + 1, TOTAL_Q)}/${TOTAL_Q}`;
    $('score-text').textContent = score;
    $('lives-text').textContent = '❤️'.repeat(Math.max(0, lives)) || '0';
    $('lives-text').textContent = lives;
  }

  function nextRound() {
    if (served >= TOTAL_Q || lives <= 0) { finish(); return; }
    served++;
    curQ = nextQ();
    locked = false;
    const subj = curQ.subject || subject;
    $('pop-question').textContent = (subj === 'vietnamese' ? '📖 ' : subj === 'english' ? '🔤 ' : '🔢 ') + curQ.question_text;
    $('pop-feedback').textContent = '';
    buildBubbles();
    renderHud();
    startRise();
  }

  const COLORS = ['#ff7a59', '#4a90e2', '#34c77b', '#f4b73e', '#a259e6', '#ec5f93'];
  function buildBubbles() {
    const field = $('pop-field');
    field.innerHTML = '';
    bubbles = [];
    const choices = L.buildChoices(curQ);
    const n = choices.length;
    const slotW = 100 / n;
    choices.forEach((ch, i) => {
      const el = document.createElement('button');
      el.className = 'bubble';
      el.textContent = ch.text;
      el.style.background = COLORS[i % COLORS.length];
      // horizontal lane with a little random offset + staggered delay
      const lane = slotW * i + slotW / 2;
      el.style.left = `calc(${lane}% - 36px)`;
      el.style.setProperty('--delay', (Math.random() * 1.2) + 's');
      el.style.setProperty('--sway', (Math.random() * 16 - 8) + 'px');
      el.addEventListener('click', () => tap(ch, el));
      field.appendChild(el);
      bubbles.push({ el, correct: ch.correct });
    });
  }

  function startRise() {
    startT = Date.now();
    const fill = $('timer-fill');
    cancelAnimationFrame(raf);
    const tick = () => {
      const elapsed = Date.now() - startT;
      const pct = Math.max(0, 1 - elapsed / RISE_MS);
      if (fill) fill.style.width = (pct * 100) + '%';
      if (elapsed >= RISE_MS) { if (!locked) missRound(); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  function tap(ch, el) {
    if (locked) return;
    if (ch.correct) {
      locked = true; cancelAnimationFrame(raf);
      el.classList.add('pop'); burst(el);
      score += 10; correctCount++;
      if (window.HocVuiSound) window.HocVuiSound.play('correct');
      if (window.HocVuiMascot) window.HocVuiMascot.cheer();
      feedback('✅ Trúng rồi!', 'good');
      renderHud();
      setTimeout(nextRound, 650);
    } else {
      el.classList.add('wrong-pop');
      lives--;
      if (window.HocVuiSound) window.HocVuiSound.play('wrong');
      if (window.HocVuiMascot) window.HocVuiMascot.encourage();
      feedback('❌ Sai rồi, bắn lại!', 'bad');
      setTimeout(() => el.classList.remove('wrong-pop'), 400);
      renderHud();
      if (lives <= 0) { locked = true; cancelAnimationFrame(raf); setTimeout(finish, 600); }
    }
  }

  function missRound() {
    locked = true;
    lives--;
    if (window.HocVuiSound) window.HocVuiSound.play('wrong');
    feedback('⏰ Hết giờ! Đáp án bay mất rồi.', 'bad');
    renderHud();
    setTimeout(() => { if (lives <= 0) finish(); else nextRound(); }, 800);
  }

  function feedback(t, k) { const fb = $('pop-feedback'); fb.textContent = t; fb.className = 'pop-feedback ' + k; }

  function burst(el) {
    const stage = $('pop-stage');
    const r = el.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    const cx = r.left - sr.left + r.width / 2, cy = r.top - sr.top + r.height / 2;
    for (let i = 0; i < 10; i++) {
      const p = document.createElement('span');
      p.className = 'burst';
      p.style.left = cx + 'px'; p.style.top = cy + 'px';
      p.style.setProperty('--tx', (Math.random() * 120 - 60) + 'px');
      p.style.setProperty('--ty', (Math.random() * 120 - 60) + 'px');
      stage.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
  }

  function finish() {
    cancelAnimationFrame(raf);
    const stars = L.starsFor(served, correctCount);
    $('result-emoji').textContent = lives > 0 ? '🏆' : '🎯';
    $('result-title').textContent = lives > 0 ? 'Thiện Xạ!' : 'Hết Mạng!';
    $('result-stars').innerHTML = [1, 2, 3].map(i => `<span class="star ${i <= stars ? 'on' : ''}">⭐</span>`).join('');
    $('result-detail').innerHTML = `🎯 Bắn trúng: ${correctCount}/${served}<br>✅ Điểm: ${score}<br>❤️ Mạng còn: ${Math.max(0, lives)}/${MAX_LIVES}`;
    ss('result-screen');
    saveSession(stars);
    if (window.HocVuiSound) window.HocVuiSound.play(stars >= 2 ? 'win' : 'lose');
    if (window.HocVuiCollection) window.HocVuiCollection.reward(stars);
    if (typeof window.checkAndShowPrompt === 'function') { try { window.checkAndShowPrompt(); } catch (e) {} }
  }

  async function saveSession(stars) {
    try {
      const p = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
      if (!p.id) return;
      await fetch('/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        player_id: p.id, subject, difficulty,
        score: correctCount, total_questions: served, correct_answers: correctCount,
        stars_earned: stars, combo_max: 0, mode: 'lab-pop',
        accuracy: served > 0 ? Math.round(correctCount / served * 100) : 0,
      }) });
    } catch (e) {}
  }

  function init() {
    if (!window.LabPopLogic) { setTimeout(init, 30); return; }
    wireSel();
    $('btn-start').addEventListener('click', start);
    $('btn-replay').addEventListener('click', start);
    const gm = $('guide-modal');
    $('btn-guide').addEventListener('click', () => gm.style.display = 'flex');
    $('btn-guide-close').addEventListener('click', () => gm.style.display = 'none');
    gm.addEventListener('click', e => { if (e.target === gm) gm.style.display = 'none'; });
    $('btn-exit').addEventListener('click', () => $('exit-modal').style.display = 'flex');
    const em = $('exit-modal');
    $('btn-exit-cancel').addEventListener('click', () => em.style.display = 'none');
    $('btn-exit-confirm').addEventListener('click', () => { cancelAnimationFrame(raf); window.location.href = '/lab/'; });
    em.addEventListener('click', e => { if (e.target === em) em.style.display = 'none'; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
