// V3 — Kéo Co Trí Tuệ (Tug of War Duel)
// Local 2-player (or vs Bot). Both players see the same question on opposite
// ends of the screen (player 2's panel is flipped 180deg). Whoever answers
// correctly first pulls the rope flag toward their side. First past the line wins.
(function () {
  'use strict';

  const WIN_PULL = 5;        // net pulls needed to win
  const TIMER_SECONDS = 14;

  let cache = [], used = new Set();
  let curQ = null;
  let mode = 'duo', subject = 'mix', difficulty = 'easy';
  let pull = 0;              // negative = player1 winning, positive = player2
  let round = 0, score1 = 0, score2 = 0;
  let tH = null, qStart = 0, lock1 = false, lock2 = false, roundDone = false, fbId = -1;
  let botTimer = null;

  const $ = id => document.getElementById(id);
  const ss = id => { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); $(id).classList.add('active'); };

  function wireSel() {
    document.querySelectorAll('.selector-options').forEach(g => g.addEventListener('click', e => {
      const b = e.target.closest('.sel-btn'); if (!b) return;
      g.querySelectorAll('.sel-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      const grp = g.dataset.group;
      if (grp === 'mode') mode = b.dataset.value;
      else if (grp === 'subject') subject = b.dataset.value;
      else difficulty = b.dataset.value;
      $('panel-2').classList.toggle('is-bot', mode === 'bot');
    }));
  }

  async function fetchQ() {
    const p = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
    const g = p.grade ?? 2;
    try {
      if (subject === 'mix') {
        const subs = ['math', 'vietnamese', 'english'];
        const r = await Promise.all(subs.map(s => fetch(`/api/questions?subject=${s}&difficulty=${difficulty}&limit=8&grade=${g}`).then(x => x.ok ? x.json() : []).catch(() => [])));
        cache = r.flat();
      } else {
        const r = await fetch(`/api/questions?subject=${subject}&difficulty=${difficulty}&limit=24&grade=${g}`);
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

  async function startRun() {
    cache = []; used.clear(); pull = 0; round = 0; score1 = 0; score2 = 0; fbId = -1;
    ss('game-screen');
    renderRope(); renderScore();
    $('q-text-1').textContent = '⏳ Đang tải...';
    $('q-text-2').textContent = '⏳ Đang tải...';
    await fetchQ();
    nextRound();
  }

  function nextRound() {
    if (Math.abs(pull) >= WIN_PULL) { finish(); return; }
    round++;
    curQ = nextQ();
    lock1 = false; lock2 = false; roundDone = false;
    qStart = Date.now();
    $('round-text').textContent = 'Câu ' + round;
    renderPanel(1); renderPanel(2);
    startTimer();
    if (mode === 'bot') scheduleBot();
  }

  function renderPanel(pl) {
    const txt = $('q-text-' + pl);
    const opts = $('q-options-' + pl);
    txt.textContent = curQ.question_text;
    opts.innerHTML = '';
    ['a', 'b', 'c', 'd'].forEach(k => {
      const t = curQ[`option_${k}`];
      if (t == null) return;
      const btn = document.createElement('button');
      btn.className = 'option-btn'; btn.dataset.key = k; btn.textContent = t;
      btn.addEventListener('click', () => handleAns(pl, k));
      opts.appendChild(btn);
    });
  }

  function startTimer() {
    clearInterval(tH);
    const total = TIMER_SECONDS * 1000;
    tH = setInterval(() => {
      const rem = Math.max(0, total - (Date.now() - qStart));
      if (rem <= 0) { clearInterval(tH); if (!roundDone) { roundDone = true; setTimeout(nextRound, 700); } }
    }, 120);
  }

  function scheduleBot() {
    clearTimeout(botTimer);
    // Bot answers after a randomized delay; harder difficulty = faster & more accurate.
    const base = difficulty === 'hard' ? 1800 : difficulty === 'medium' ? 2600 : 3400;
    const delay = base + Math.random() * 2200;
    const accuracy = difficulty === 'hard' ? 0.85 : difficulty === 'medium' ? 0.7 : 0.55;
    botTimer = setTimeout(() => {
      if (roundDone || lock2) return;
      const ck = (curQ.correct_answer || '').toLowerCase();
      const pick = Math.random() < accuracy ? ck : ['a', 'b', 'c', 'd'].filter(k => k !== ck)[Math.floor(Math.random() * 3)];
      handleAns(2, pick);
    }, delay);
  }

  function handleAns(pl, sel) {
    const lockVar = pl === 1 ? lock1 : lock2;
    if (lockVar || roundDone) return;
    if (pl === 1) lock1 = true; else lock2 = true;

    const ck = (curQ.correct_answer || '').toLowerCase();
    const ok = sel.toLowerCase() === ck;
    const opts = $('q-options-' + pl);
    opts.querySelectorAll('.option-btn').forEach(b => {
      if (b.dataset.key === sel) b.classList.add(ok ? 'correct' : 'wrong');
      if (ok && b.dataset.key === ck) b.classList.add('correct');
      b.classList.add('disabled');
    });

    if (ok) {
      // First correct answer wins the round and pulls the rope.
      roundDone = true;
      clearInterval(tH); clearTimeout(botTimer);
      if (pl === 1) { pull -= 1; score1++; } else { pull += 1; score2++; }
      renderRope(); renderScore();
      pulse(pl);
      const other = pl === 1 ? 2 : 1;
      $('q-options-' + other).querySelectorAll('.option-btn').forEach(b => {
        if (b.dataset.key === ck) b.classList.add('correct');
        b.classList.add('disabled');
      });
      setTimeout(() => { if (Math.abs(pull) >= WIN_PULL) finish(); else nextRound(); }, 1000);
    } else {
      // Wrong answer locks that player for this round; the other can still win.
      if (lock1 && lock2) {
        roundDone = true; clearInterval(tH); clearTimeout(botTimer);
        setTimeout(nextRound, 900);
      }
    }
  }

  function renderRope() {
    const rope = $('rope');
    const pct = (pull / WIN_PULL) * 32; // up to 32% shift each way
    rope.style.transform = `translateX(${pct}%)`;
    const flag = $('flag');
    flag.textContent = pull < 0 ? '🚩' : pull > 0 ? '🏴' : '🚩';
  }
  function renderScore() {
    $('score-1').textContent = score1;
    $('score-2').textContent = score2;
  }
  function pulse(pl) {
    const panel = $('panel-' + pl);
    panel.classList.add('won-round');
    setTimeout(() => panel.classList.remove('won-round'), 600);
    const rope = $('rope');
    rope.classList.add('yank-' + (pl === 1 ? 'l' : 'r'));
    setTimeout(() => rope.classList.remove('yank-l', 'yank-r'), 400);
  }

  function finish() {
    clearInterval(tH); clearTimeout(botTimer);
    const p1won = pull < 0;
    const winnerName = p1won ? '🧒 Bạn 1' : (mode === 'bot' ? '🤖 Máy' : '👧 Bạn 2');
    $('result-emoji').textContent = '🏆';
    $('result-title').textContent = winnerName + ' Thắng!';
    $('result-detail').innerHTML = `
      🧒 Bạn 1: ${score1} câu đúng<br>
      ${mode === 'bot' ? '🤖 Máy' : '👧 Bạn 2'}: ${score2} câu đúng<br>
      💪 Đã chơi: ${round} câu
    `;
    ss('result-screen');
    spawnConfetti($('result-screen'), 40);
    if (window.HocVuiSound) window.HocVuiSound.play(p1won ? 'win' : 'lose');
    if (window.HocVuiCollection) window.HocVuiCollection.reward(p1won ? 2 : 1);
    if (typeof window.checkAndShowPrompt === 'function') { try { window.checkAndShowPrompt(); } catch (e) {} }
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

  function init() {
    wireSel();
    $('btn-start').addEventListener('click', startRun);
    $('btn-replay').addEventListener('click', startRun);
    const guideModal = $('guide-modal');
    $('btn-guide').addEventListener('click', () => { guideModal.style.display = 'flex'; });
    $('btn-guide-close').addEventListener('click', () => { guideModal.style.display = 'none'; });
    guideModal.addEventListener('click', e => { if (e.target === guideModal) guideModal.style.display = 'none'; });
    $('btn-exit').addEventListener('click', () => { $('exit-modal').style.display = 'flex'; });
    const exitModal = $('exit-modal');
    $('btn-exit-cancel').addEventListener('click', () => { exitModal.style.display = 'none'; });
    $('btn-exit-confirm').addEventListener('click', () => { exitModal.style.display = 'none'; clearInterval(tH); clearTimeout(botTimer); window.location.reload(); });
    exitModal.addEventListener('click', e => { if (e.target === exitModal) exitModal.style.display = 'none'; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
