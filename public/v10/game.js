// V10 — Đào Vàng Dò Mìn (Treasure-Dig Minesweeper)
// Tap a covered cell to open a quiz; answer correctly to safely dig it, revealing
// the adjacent-mine count, a gem 💎 or coin 💰. Wrong answers cost a life. Toggle
// flag mode to mark suspected mines. Clear all safe cells to win.
(function () {
  'use strict';

  const TIMER_SECONDS = 20;
  const MAX_LIVES = 3;

  let userData = { totalGems: 0, totalWins: 0 };
  function loadData() { try { const r = localStorage.getItem('v10_dig'); if (r) Object.assign(userData, JSON.parse(r)); } catch (e) {} }
  function saveData() { try { localStorage.setItem('v10_dig', JSON.stringify(userData)); } catch (e) {} }

  let cache = [], used = new Set();
  let curQ = null, fbId = -1;
  let size = 5, subject = 'mix', difficulty = 'easy';
  let board = [], lives = MAX_LIVES, gems = 0, dug = 0, safeTotal = 0, outcome = null;
  let served = 0, correct = 0, wrong = 0, maxCombo = 0, combo = 0;
  let flagMode = false, activeCell = null, qStart = 0, tH = null, locked = false;

  const $ = id => document.getElementById(id);
  const ss = id => { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); $(id).classList.add('active'); };

  function renderStart() { $('total-gems').textContent = userData.totalGems; $('total-wins').textContent = userData.totalWins; }
  function wireSel() {
    document.querySelectorAll('.selector-options').forEach(g => g.addEventListener('click', e => {
      const b = e.target.closest('.sel-btn'); if (!b) return;
      g.querySelectorAll('.sel-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      const grp = g.dataset.group;
      if (grp === 'size') size = parseInt(b.dataset.value);
      else if (grp === 'subject') subject = b.dataset.value;
      else difficulty = b.dataset.value;
    }));
  }

  async function fetchQ() {
    const p = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
    const g = p.grade || 2;
    const need = size * size + 10;
    try {
      if (subject === 'mix') {
        const subs = ['math', 'vietnamese', 'english'];
        const per = Math.ceil(need / 3);
        const r = await Promise.all(subs.map(s => fetch(`/api/questions?subject=${s}&difficulty=${difficulty}&limit=${per}&grade=${g}`).then(x => x.ok ? x.json() : []).catch(() => [])));
        cache = r.flat();
      } else {
        const r = await fetch(`/api/questions?subject=${subject}&difficulty=${difficulty}&limit=${need}&grade=${g}`);
        cache = r.ok ? await r.json() : [];
      }
    } catch (e) { cache = []; }
    if (!Array.isArray(cache)) cache = [];
    for (let i = cache.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cache[i], cache[j]] = [cache[j], cache[i]]; }
  }
  function nextQ() { const q = cache.find(x => x && !used.has(x.id)); if (q) { used.add(q.id); return q; } return mkFallback(); }
  function mkFallback() {
    const a = 1 + Math.floor(Math.random() * 20), b = 1 + Math.floor(Math.random() * 20);
    const c = a + b, d = new Set();
    while (d.size < 3) { const off = [-3, -2, -1, 1, 2, 3][Math.floor(Math.random() * 6)]; const w = c + off; if (w > 0 && w !== c) d.add(w); }
    const nums = [c, ...d].sort(() => Math.random() - 0.5);
    fbId--;
    return { id: fbId, question_text: `${a} + ${b} = ?`, option_a: String(nums[0]), option_b: String(nums[1]), option_c: String(nums[2]), option_d: String(nums[3]), correct_answer: 'abcd'[nums.indexOf(c)] };
  }

  // ── Board generation ────────────────────────────────────────────────────────
  function buildBoard() {
    const total = size * size;
    const mineCount = difficulty === 'hard' ? Math.round(total * 0.25) : difficulty === 'medium' ? Math.round(total * 0.18) : Math.round(total * 0.12);
    const gemCount = Math.max(2, Math.round(total * 0.12));
    board = [];
    for (let i = 0; i < total; i++) board.push({ mine: false, gem: false, count: 0, dug: false, flag: false });
    // place mines
    let placed = 0;
    while (placed < mineCount) { const i = Math.floor(Math.random() * total); if (!board[i].mine) { board[i].mine = true; placed++; } }
    // place gems on non-mine cells
    let gp = 0;
    while (gp < gemCount) { const i = Math.floor(Math.random() * total); if (!board[i].mine && !board[i].gem) { board[i].gem = true; gp++; } }
    // counts
    for (let i = 0; i < total; i++) {
      if (board[i].mine) continue;
      board[i].count = neighbors(i).filter(n => board[n].mine).length;
    }
    safeTotal = total - mineCount;
    renderBoard();
  }
  function neighbors(i) {
    const r = Math.floor(i / size), c = i % size, out = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) out.push(nr * size + nc);
    }
    return out;
  }

  const NUM_COLORS = ['', '#1976d2', '#388e3c', '#d32f2f', '#7b1fa2', '#ef6c00', '#0097a7', '#5d4037', '#455a64'];
  function renderBoard() {
    const grid = $('grid');
    grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    grid.innerHTML = '';
    board.forEach((cell, i) => {
      const el = document.createElement('button');
      el.className = 'cell';
      el.dataset.idx = String(i);
      if (cell.dug) {
        el.classList.add('dug');
        if (cell.gem) { el.textContent = '💎'; el.classList.add('gem'); }
        else if (cell.count > 0) { el.textContent = cell.count; el.style.color = NUM_COLORS[cell.count]; }
        else { el.textContent = ''; }
      } else if (cell.flag) {
        el.textContent = '🚩'; el.classList.add('flagged');
      } else {
        el.textContent = '';
      }
      el.addEventListener('click', () => onCell(i));
      grid.appendChild(el);
    });
  }

  function renderHud() {
    $('lives-text').textContent = lives;
    $('gems-text').textContent = gems;
    $('dug-text').textContent = `${dug}/${safeTotal}`;
  }

  async function startRun() {
    cache = []; used.clear(); fbId = -1; combo = 0; maxCombo = 0;
    lives = MAX_LIVES; gems = 0; dug = 0; outcome = null; served = 0; correct = 0; wrong = 0; flagMode = false;
    $('flag-toggle').classList.remove('on');
    ss('game-screen');
    buildBoard(); renderHud();
    await fetchQ();
  }

  function onCell(i) {
    if (outcome || locked) return;
    const cell = board[i];
    if (cell.dug) return;
    if (flagMode) { cell.flag = !cell.flag; renderBoard(); return; }
    if (cell.flag) return; // can't dig a flagged cell until unflagged
    activeCell = i;
    openQuestion();
  }

  function openQuestion() {
    curQ = nextQ(); served++; locked = false; qStart = Date.now();
    const subj = curQ.subject || subject;
    $('q-badge').textContent = subj === 'vietnamese' ? '📖' : subj === 'english' ? '🔤' : '🔢';
    $('q-text').textContent = curQ.question_text;
    $('feedback').style.display = 'none';
    const opts = $('q-options'); opts.innerHTML = '';
    if (window.HocVuiQuiz && window.HocVuiQuiz.render) {
      window.HocVuiQuiz.render({ questionEl: $('q-text'), optionsEl: opts, question: curQ, onResult: (ok) => handleAns(ok) });
    } else {
      ['a','b','c','d'].forEach(k => { const t = curQ[`option_${k}`]; if (t == null) return; const btn = document.createElement('button'); btn.className = 'option-btn'; btn.dataset.key = k; btn.textContent = t; btn.addEventListener('click', () => handleAns(k)); opts.appendChild(btn); });
    }
    $('q-popup').style.display = 'flex';
    startTimer();
  }
  function closeQuestion() { $('q-popup').style.display = 'none'; clearInterval(tH); }

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
    const ok = (typeof sel === 'boolean') ? sel : (String(sel).toLowerCase() === ck);
    if (typeof sel !== 'boolean') {
      document.querySelectorAll('#q-options .option-btn').forEach(b => {
      b.classList.add('disabled');
      if (b.dataset.key === ck) b.classList.add('correct');
      else if (b.dataset.key === sel && !ok) b.classList.add('wrong');
    });
    }
    logAns(sel, ck, ok, Date.now() - qStart);
    const fb = $('feedback'); fb.style.display = 'block';
    const cell = board[activeCell];
    if (ok) {
      correct++; combo++; if (combo > maxCombo) maxCombo = combo;
      if (cell.mine) {
        // answered right but the cell was a mine → defused safely, still dig it
        cell.dug = true; lives = Math.min(MAX_LIVES, lives); // no penalty: skill defused it
        fb.className = 'feedback bonus'; fb.textContent = '🧨 Gỡ mìn an toàn nhờ trả lời đúng!';
      } else {
        cell.dug = true; dug++;
        if (cell.gem) { gems += 5; fb.className = 'feedback bonus'; fb.textContent = '💎 Tìm thấy kim cương! +5 báu vật'; }
        else { gems += 1; fb.className = 'feedback good'; fb.textContent = '✅ Đào an toàn! +1 báu vật'; }
        // auto-flood reveal of adjacent empty cells (count 0)
        if (cell.count === 0 && !cell.gem) floodReveal(activeCell);
      }
    } else {
      wrong++; combo = 0;
      lives--;
      fb.className = 'feedback bad'; fb.textContent = lives > 0 ? '❌ Sai! Mất 1 mạng.' : '❌ Sai! Hết mạng rồi!';
    }
    renderBoard(); renderHud();
    setTimeout(() => {
      closeQuestion();
      checkEnd();
    }, 1000);
  }

  function handleTimeout() {
    if (locked) return; locked = true;
    wrong++; combo = 0; lives--;
    const fb = $('feedback'); fb.style.display = 'block'; fb.className = 'feedback bad'; fb.textContent = '⏰ Hết giờ! Mất 1 mạng.';
    renderHud();
    setTimeout(() => { closeQuestion(); checkEnd(); }, 1000);
  }

  function floodReveal(start) {
    const queue = [start];
    const seen = new Set([start]);
    while (queue.length) {
      const i = queue.shift();
      neighbors(i).forEach(n => {
        if (seen.has(n)) return; seen.add(n);
        const c = board[n];
        if (c.dug || c.mine || c.flag) return;
        c.dug = true; dug++;
        if (c.gem) gems += 5; else gems += 1;
        if (c.count === 0 && !c.gem) queue.push(n);
      });
    }
  }

  function checkEnd() {
    if (lives <= 0) { outcome = 'dead'; finish(); return; }
    if (dug >= safeTotal) { outcome = 'won'; finish(); return; }
  }

  function finish() {
    clearInterval(tH);
    // reveal all mines
    board.forEach(c => { if (c.mine) c.dug = true; });
    renderBoard();
    const total = correct + wrong;
    const acc = total > 0 ? Math.round((correct / total) * 100) : 0;
    let stars = 0;
    if (outcome === 'won') stars = lives === MAX_LIVES ? 3 : lives >= 1 ? 2 : 1;
    else if (dug >= safeTotal * 0.6) stars = 1;
    userData.totalGems += gems;
    if (outcome === 'won') userData.totalWins += 1;
    saveData();
    saveSession({ stars, acc, total });

    if (outcome === 'won') spawnConfetti($('mine-stage'), 40);
    if (window.HocVuiSound) window.HocVuiSound.play(outcome === 'won' ? 'win' : 'lose');
    if (window.HocVuiCollection) window.HocVuiCollection.reward(stars);
    setTimeout(() => {
      $('result-emoji').textContent = outcome === 'won' ? '💎' : '💣';
      $('result-title').textContent = outcome === 'won' ? '💎 Dọn Sạch Mỏ Vàng!' : '💣 Hết Mạng Rồi!';
      $('result-stars').innerHTML = [1, 2, 3].map(i => `<span class="star ${i <= stars ? 'on' : ''}">⭐</span>`).join('');
      $('result-detail').innerHTML = `⛏️ Đã đào: ${dug}/${safeTotal}<br>💎 Báu vật: ${gems}<br>❤️ Mạng còn: ${Math.max(0, lives)}/${MAX_LIVES}<br>✅ Đúng: ${correct}/${total} (${acc}%)`;
      ss('result-screen');
      if (typeof window.checkAndShowPrompt === 'function') { try { window.checkAndShowPrompt(); } catch (e) {} }
    }, outcome === 'won' ? 1100 : 400);
  }

  async function saveSession({ stars, acc, total }) {
    try {
      const p = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
      if (!p.id) return;
      await fetch('/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        player_id: p.id, subject: subject === 'mix' ? 'math' : subject, difficulty,
        score: gems, total_questions: total, correct_answers: correct,
        stars_earned: stars, combo_max: maxCombo, mode: 'v10', accuracy: acc,
      }) });
    } catch (e) {}
  }
  function logAns(sel, ck, ok, ms) {
    if (!curQ || curQ.id < 0) return;
    try {
      const p = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
      if (!p.id) return;
      fetch('/api/answers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        player_id: p.id, question_id: curQ.id, selected_answer: sel, correct_answer: ck, is_correct: ok, time_spent_ms: ms, difficulty,
      }) }).catch(() => {});
    } catch (e) {}
  }

  function spawnConfetti(parent, count) {
    if (!parent) return;
    const colors = ['#ffd54f', '#ff7043', '#81c784', '#64b5f6', '#ba68c8', '#fff'];
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span'); p.className = 'pfx pfx-confetti';
      p.style.setProperty('--x', Math.random() * 100 + '%'); p.style.setProperty('--delay', (Math.random() * 0.6) + 's');
      p.style.setProperty('--rot', Math.floor(Math.random() * 360) + 'deg'); p.style.background = colors[i % colors.length];
      parent.appendChild(p); p.addEventListener('animationend', () => p.remove(), { once: true });
    }
  }
  function speakQ() {
    if (!curQ) return;
    if (window.HocVuiTTS && window.HocVuiTTS.speak) { window.HocVuiTTS.speak(curQ.question_text); return; }
    try { const u = new SpeechSynthesisUtterance(curQ.question_text); u.lang = 'vi-VN'; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {}
  }

  function init() {
    loadData(); renderStart(); wireSel();
    $('btn-start').addEventListener('click', startRun);
    $('btn-replay').addEventListener('click', startRun);
    // TTS speaker button is auto-injected by shared /tts.js — no custom button needed.
    $('flag-toggle').addEventListener('click', () => { flagMode = !flagMode; $('flag-toggle').classList.toggle('on', flagMode); });
    const guideModal = $('guide-modal');
    $('btn-guide').addEventListener('click', () => { guideModal.style.display = 'flex'; });
    $('btn-guide-close').addEventListener('click', () => { guideModal.style.display = 'none'; });
    guideModal.addEventListener('click', e => { if (e.target === guideModal) guideModal.style.display = 'none'; });
    $('btn-exit').addEventListener('click', () => { $('exit-modal').style.display = 'flex'; });
    const exitModal = $('exit-modal');
    $('btn-exit-cancel').addEventListener('click', () => { exitModal.style.display = 'none'; });
    $('btn-exit-confirm').addEventListener('click', () => { exitModal.style.display = 'none'; clearInterval(tH); window.location.reload(); });
    exitModal.addEventListener('click', e => { if (e.target === exitModal) exitModal.style.display = 'none'; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
