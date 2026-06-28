// Lab / Match — controller. Tap a left card then a right card to connect them.
// Correct matches lock in with a drawn link line; wrong matches shake.
(function () {
  'use strict';
  const L = window.LabMatchLogic;
  const ROUNDS = 5;       // rounds per game
  const PAIRS = 4;        // pairs per round

  let subject = 'math', difficulty = 'easy';
  let pool = [], offset = 0;
  let round = 0, score = 0, streak = 0, maxStreak = 0, mistakes = 0, totalPairs = 0, solvedTotal = 0;
  let cur = null;          // { pairs, columns }
  let selLeft = null;      // selected left {el, pairId}
  let solved = new Set();
  let busy = false;

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
      const r = await fetch(`/api/questions?subject=${subject}&difficulty=${difficulty}&limit=${ROUNDS * PAIRS + 20}&grade=${g}`);
      pool = r.ok ? await r.json() : [];
    } catch (e) { pool = []; }
    if (!Array.isArray(pool)) pool = [];
    pool = L.shuffle(pool);
    if (pool.length < PAIRS) pool = pool.concat(makeFallback(PAIRS * ROUNDS));
  }
  function makeFallback(n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = 1 + Math.floor(Math.random() * 9), b = 1 + Math.floor(Math.random() * 9);
      out.push({ id: 'f' + i + '_' + Date.now(), question_text: `${a} + ${b} = ?`, option_a: String(a + b), option_b: '0', option_c: '0', option_d: '0', correct_answer: 'a' });
    }
    return out;
  }

  async function start() {
    round = 0; score = 0; streak = 0; maxStreak = 0; mistakes = 0; totalPairs = 0; solvedTotal = 0; offset = 0;
    ss('game-screen');
    $('col-left').innerHTML = '<p style="opacity:.6">⏳ Đang tải...</p>';
    $('col-right').innerHTML = '';
    await fetchQ();
    nextRound();
  }

  function nextRound() {
    if (round >= ROUNDS) { finish(); return; }
    round++;
    const built = L.buildRound(pool, PAIRS, offset);
    offset = built.nextOffset;
    if (built.pairs.length === 0) { finish(); return; }
    cur = { pairs: built.pairs, columns: L.makeColumns(built.pairs) };
    totalPairs += built.pairs.length;
    solved = new Set();
    selLeft = null;
    renderBoard();
    renderHud();
  }

  function renderHud() {
    $('round-text').textContent = `${round}/${ROUNDS}`;
    $('score-text').textContent = score;
    $('streak-text').textContent = streak;
  }

  function renderBoard() {
    const left = $('col-left'), right = $('col-right');
    left.innerHTML = ''; right.innerHTML = '';
    clearLines();
    cur.columns.left.forEach(item => left.appendChild(makeCard(item, 'left')));
    cur.columns.right.forEach(item => right.appendChild(makeCard(item, 'right')));
    $('match-feedback').textContent = '';
  }

  function makeCard(item, side) {
    const el = document.createElement('button');
    el.className = 'match-card ' + side;
    el.dataset.pair = item.pairId;
    el.dataset.side = side;
    el.textContent = item.text;
    el.addEventListener('click', () => onCard(el, side, item.pairId));
    return el;
  }

  function onCard(el, side, pairId) {
    if (busy || el.classList.contains('done')) return;
    if (side === 'left') {
      document.querySelectorAll('.match-card.left.sel').forEach(x => x.classList.remove('sel'));
      if (selLeft && selLeft.el === el) { selLeft = null; return; } // toggle off
      selLeft = { el, pairId };
      el.classList.add('sel');
      if (window.HocVuiSound) window.HocVuiSound.play('click');
      return;
    }
    // right side tapped
    if (!selLeft) { // allow tapping right first does nothing; hint
      el.classList.add('nudge'); setTimeout(() => el.classList.remove('nudge'), 300);
      return;
    }
    const ok = L.isMatch(selLeft.pairId, pairId);
    if (ok) {
      busy = true;
      const leftEl = selLeft.el;
      leftEl.classList.remove('sel');
      leftEl.classList.add('done'); el.classList.add('done');
      drawLine(leftEl, el);
      solved.add(pairId); solvedTotal++;
      score += 10; streak++; if (streak > maxStreak) maxStreak = streak;
      if (streak > 0 && streak % 3 === 0 && window.HocVuiSound) window.HocVuiSound.play('combo');
      else if (window.HocVuiSound) window.HocVuiSound.play('correct');
      if (window.HocVuiMascot) window.HocVuiMascot.cheer();
      feedback('✅ Đúng rồi!', 'good');
      selLeft = null;
      renderHud();
      setTimeout(() => {
        busy = false;
        if (solved.size >= cur.pairs.length) {
          fadeRound(() => nextRound());
        }
      }, 420);
    } else {
      mistakes++; streak = 0;
      el.classList.add('wrong'); selLeft.el.classList.add('wrong');
      if (window.HocVuiSound) window.HocVuiSound.play('wrong');
      if (window.HocVuiMascot) window.HocVuiMascot.encourage();
      feedback('❌ Chưa đúng, thử lại nhé!', 'bad');
      const lEl = selLeft.el;
      setTimeout(() => { el.classList.remove('wrong'); lEl.classList.remove('wrong', 'sel'); }, 500);
      selLeft = null;
      renderHud();
    }
  }

  function feedback(txt, kind) {
    const fb = $('match-feedback');
    fb.textContent = txt;
    fb.className = 'match-feedback ' + kind;
  }

  function fadeRound(cb) {
    const board = document.querySelector('.match-board');
    board.classList.add('round-clear');
    setTimeout(() => { board.classList.remove('round-clear'); cb(); }, 500);
  }

  // ── Connector lines (SVG) ──
  function clearLines() { const svg = $('link-layer'); if (svg) svg.innerHTML = ''; }
  function drawLine(a, b) {
    const svg = $('link-layer');
    if (!svg) return;
    const stage = svg.getBoundingClientRect();
    const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    const x1 = ra.right - stage.left, y1 = ra.top + ra.height / 2 - stage.top;
    const x2 = rb.left - stage.left, y2 = rb.top + rb.height / 2 - stage.top;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const mx = (x1 + x2) / 2;
    line.setAttribute('d', `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`);
    line.setAttribute('class', 'link-path');
    svg.appendChild(line);
  }

  function finish() {
    const stars = L.starsFor(totalPairs, mistakes);
    $('result-emoji').textContent = stars >= 3 ? '🏆' : '🔗';
    $('result-title').textContent = stars >= 3 ? 'Xuất Sắc!' : 'Hoàn Thành!';
    $('result-stars').innerHTML = [1, 2, 3].map(i => `<span class="star ${i <= stars ? 'on' : ''}">⭐</span>`).join('');
    $('result-detail').innerHTML = `🔗 Đã nối: ${solvedTotal} cặp<br>✅ Điểm: ${score}<br>❌ Nối sai: ${mistakes} lần<br>⭐ Chuỗi cao nhất: ${maxStreak}`;
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
      const total = totalPairs;
      const correct = Math.max(0, totalPairs - mistakes);
      await fetch('/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        player_id: p.id, subject, difficulty,
        score: solvedTotal, total_questions: total, correct_answers: correct,
        stars_earned: stars, combo_max: maxStreak, mode: 'lab-match',
        accuracy: total > 0 ? Math.round(correct / total * 100) : 0,
      }) });
    } catch (e) {}
  }

  function init() {
    if (!window.LabMatchLogic) { setTimeout(init, 30); return; }
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
    $('btn-exit-confirm').addEventListener('click', () => { window.location.href = '/lab/'; });
    em.addEventListener('click', e => { if (e.target === em) em.style.display = 'none'; });
    window.addEventListener('resize', () => { if ($('game-screen').classList.contains('active')) { clearLines(); redrawSolved(); } });
  }
  function redrawSolved() {
    // redraw lines for already-solved pairs after resize
    document.querySelectorAll('.match-card.left.done').forEach(lEl => {
      const pid = lEl.dataset.pair;
      const rEl = document.querySelector(`.match-card.right.done[data-pair="${pid}"]`);
      if (rEl) drawLine(lEl, rEl);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
