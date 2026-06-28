// Lab / Swipe — controller. Drag the card left (SAI) or right (ĐÚNG), or tap the
// buttons. Pure logic decides correctness; UI handles drag + animations.
(function () {
  'use strict';
  const L = window.LabSwipeLogic;
  const TOTAL = 12;

  let subject = 'math', difficulty = 'easy';
  let pool = [], used = new Set();
  let served = 0, score = 0, streak = 0, maxStreak = 0, correctCount = 0;
  let card = null, cardEl = null, locked = false;
  let dragging = false, startX = 0, curX = 0;

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
      const r = await fetch(`/api/questions?subject=${subject}&difficulty=${difficulty}&limit=${TOTAL + 12}&grade=${g}`);
      pool = r.ok ? await r.json() : [];
    } catch (e) { pool = []; }
    if (!Array.isArray(pool)) pool = [];
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  }
  function nextQ() {
    const q = pool.find(x => x && !used.has(x.id));
    if (q) { used.add(q.id); return q; }
    const a = 1 + Math.floor(Math.random() * 9), b = 1 + Math.floor(Math.random() * 9);
    return { id: 'f' + Date.now() + Math.random(), question_text: `${a} + ${b} = ?`, option_a: String(a + b), option_b: String(a + b + 1), option_c: String(a + b - 1), option_d: String(a + b + 2), correct_answer: 'a' };
  }

  async function start() {
    served = 0; score = 0; streak = 0; maxStreak = 0; correctCount = 0; used = new Set();
    ss('game-screen');
    $('card-deck').innerHTML = '<div class="loading">⏳ Đang tải...</div>';
    await fetchQ();
    renderHud();
    nextCard();
  }

  function renderHud() {
    $('round-text').textContent = `${Math.min(served + 1, TOTAL)}/${TOTAL}`;
    $('score-text').textContent = score;
    $('streak-text').textContent = streak;
  }

  function nextCard() {
    if (served >= TOTAL) { finish(); return; }
    served++;
    const q = nextQ();
    card = L.buildCard(q);
    locked = false; curX = 0;
    const deck = $('card-deck');
    deck.innerHTML = '';
    cardEl = document.createElement('div');
    cardEl.className = 'swipe-card';
    cardEl.innerHTML = `<div class="sc-q">${escapeHtml(card.statement)}</div><div class="sc-hint">Đúng hay Sai?</div>
      <div class="sc-stamp sc-yes">ĐÚNG</div><div class="sc-stamp sc-no">SAI</div>`;
    deck.appendChild(cardEl);
    attachDrag(cardEl);
    $('swipe-feedback').textContent = '';
    renderHud();
  }

  function escapeHtml(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  function attachDrag(el) {
    const down = (x) => { if (locked) return; dragging = true; startX = x; el.style.transition = 'none'; };
    const move = (x) => {
      if (!dragging) return;
      curX = x - startX;
      const rot = curX / 18;
      el.style.transform = `translateX(${curX}px) rotate(${rot}deg)`;
      el.classList.toggle('tilt-yes', curX > 40);
      el.classList.toggle('tilt-no', curX < -40);
    };
    const up = () => {
      if (!dragging) return; dragging = false;
      el.style.transition = '';
      if (curX > 90) commit(true);
      else if (curX < -90) commit(false);
      else { el.style.transform = ''; el.classList.remove('tilt-yes', 'tilt-no'); }
    };
    el.addEventListener('pointerdown', e => { el.setPointerCapture(e.pointerId); down(e.clientX); });
    el.addEventListener('pointermove', e => move(e.clientX));
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  }

  function commit(answeredTrue) {
    if (locked || !card) return;
    locked = true;
    const ok = L.judge(card, answeredTrue);
    // fly the card off-screen in the chosen direction
    const dir = answeredTrue ? 1 : -1;
    cardEl.style.transform = `translateX(${dir * 140}%) rotate(${dir * 22}deg)`;
    cardEl.style.opacity = '0';
    if (ok) {
      score += 10; streak++; if (streak > maxStreak) maxStreak = streak; correctCount++;
      if (streak > 0 && streak % 3 === 0 && window.HocVuiSound) window.HocVuiSound.play('combo');
      else if (window.HocVuiSound) window.HocVuiSound.play('correct');
      if (window.HocVuiMascot) window.HocVuiMascot.cheer();
      feedback('✅ Chính xác!', 'good');
    } else {
      streak = 0;
      if (window.HocVuiSound) window.HocVuiSound.play('wrong');
      if (window.HocVuiMascot) window.HocVuiMascot.encourage();
      feedback(`❌ Sai rồi! Câu này ${card.isTrue ? 'ĐÚNG' : 'SAI'}.`, 'bad');
    }
    renderHud();
    setTimeout(nextCard, ok ? 520 : 950);
  }

  function feedback(t, k) { const fb = $('swipe-feedback'); fb.textContent = t; fb.className = 'swipe-feedback ' + k; }

  function finish() {
    const stars = L.starsFor(served, correctCount);
    $('result-emoji').textContent = stars >= 3 ? '🏆' : '👆';
    $('result-title').textContent = stars >= 3 ? 'Siêu Phản Xạ!' : 'Hoàn Thành!';
    $('result-stars').innerHTML = [1, 2, 3].map(i => `<span class="star ${i <= stars ? 'on' : ''}">⭐</span>`).join('');
    $('result-detail').innerHTML = `👆 Trả lời đúng: ${correctCount}/${served}<br>✅ Điểm: ${score}<br>⭐ Chuỗi cao nhất: ${maxStreak}`;
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
        stars_earned: stars, combo_max: maxStreak, mode: 'lab-swipe',
        accuracy: served > 0 ? Math.round(correctCount / served * 100) : 0,
      }) });
    } catch (e) {}
  }

  function init() {
    if (!window.LabSwipeLogic) { setTimeout(init, 30); return; }
    wireSel();
    $('btn-start').addEventListener('click', start);
    $('btn-replay').addEventListener('click', start);
    $('btn-yes').addEventListener('click', () => commit(true));
    $('btn-no').addEventListener('click', () => commit(false));
    const gm = $('guide-modal');
    $('btn-guide').addEventListener('click', () => gm.style.display = 'flex');
    $('btn-guide-close').addEventListener('click', () => gm.style.display = 'none');
    gm.addEventListener('click', e => { if (e.target === gm) gm.style.display = 'none'; });
    $('btn-exit').addEventListener('click', () => $('exit-modal').style.display = 'flex');
    const em = $('exit-modal');
    $('btn-exit-cancel').addEventListener('click', () => em.style.display = 'none');
    $('btn-exit-confirm').addEventListener('click', () => { window.location.href = '/lab/'; });
    em.addEventListener('click', e => { if (e.target === em) em.style.display = 'none'; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
