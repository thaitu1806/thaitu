// V7 — Leo Vách Đá (Rock Climbing)
// Climb a procedurally drawn cliff by answering questions. Each correct answer
// grabs the next hold and pulls the climber up; a 3-combo gives an extra grab.
// Wrong/timeout costs a stamina point. Reach the summit flag to win.
(function () {
  'use strict';

  const HEIGHT = 12;          // holds to the summit
  const MAX_STAMINA = 3;
  const TIMER_SECONDS = 18;
  const MAX_Q = 30;

  let userData = { totalWins: 0, bestHeight: 0 };
  function loadData() { try { const r = localStorage.getItem('v7_climb'); if (r) Object.assign(userData, JSON.parse(r)); } catch (e) {} }
  function saveData() { try { localStorage.setItem('v7_climb', JSON.stringify(userData)); } catch (e) {} }

  let cache = [], used = new Set();
  let curQ = null, combo = 0, maxCombo = 0;
  let subject = 'mix', difficulty = 'easy';
  let height = 0, stamina = MAX_STAMINA, served = 0, correct = 0, wrong = 0, outcome = null;
  let qStart = 0, tH = null, locked = false, fbId = -1;

  const $ = id => document.getElementById(id);
  const ss = id => { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); $(id).classList.add('active'); };

  function renderStart() { $('total-wins').textContent = userData.totalWins; $('best-height').textContent = userData.bestHeight; }
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
        const r = await Promise.all(subs.map(s => fetch(`/api/questions?subject=${s}&difficulty=${difficulty}&limit=10&grade=${g}`).then(x => x.ok ? x.json() : []).catch(() => [])));
        cache = r.flat();
      } else {
        const r = await fetch(`/api/questions?subject=${subject}&difficulty=${difficulty}&limit=${MAX_Q}&grade=${g}`);
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

  function buildHolds() {
    const holds = $('holds');
    holds.innerHTML = '';
    for (let i = 0; i <= HEIGHT; i++) {
      const h = document.createElement('span');
      h.className = 'hold';
      h.dataset.idx = String(i);
      // zig-zag the holds left/right for a natural climbing route
      h.style.bottom = (i / HEIGHT * 86 + 6) + '%';
      h.style.left = (i % 2 === 0 ? 34 : 56) + '%';
      holds.appendChild(h);
    }
    positionClimber(false);
  }
  function positionClimber(animate) {
    const climber = $('climber');
    const bg = $('cliff-bg');
    const bottomPct = height / HEIGHT * 86 + 4;
    if (!animate) climber.style.transition = 'none'; else climber.style.transition = '';
    climber.style.bottom = bottomPct + '%';
    climber.style.left = (height % 2 === 0 ? 30 : 52) + '%';
    if (!animate) { void climber.offsetWidth; climber.style.transition = ''; }
    // pan the cliff background so the climber stays roughly centered when high
    const pan = Math.max(0, (height - 5) / HEIGHT) * 36;
    bg.style.transform = `translateY(${pan}%)`;
    $('altitude-badge').textContent = (height * 25) + ' m';
  }

  function renderHud() {
    $('height-text').textContent = `${height}/${HEIGHT}`;
    $('stamina-text').textContent = stamina;
    $('progress-text').textContent = served;
  }

  async function startRun() {
    cache = []; used.clear(); combo = 0; maxCombo = 0; fbId = -1;
    height = 0; stamina = MAX_STAMINA; served = 0; correct = 0; wrong = 0; outcome = null;
    ss('game-screen');
    buildHolds(); renderHud();
    $('q-text').textContent = '⏳ Đang tải...'; $('q-options').innerHTML = ''; $('feedback').style.display = 'none';
    await fetchQ();
    setTimeout(() => positionClimber(false), 30);
    showNextQ();
  }

  function isFinished() { return outcome !== null || height >= HEIGHT || stamina <= 0 || served >= MAX_Q; }

  function showNextQ() {
    if (height >= HEIGHT) outcome = 'won';
    else if (stamina <= 0) outcome = 'fell';
    if (outcome || served >= MAX_Q) { finish(); return; }
    curQ = nextQ(); served++; locked = false; qStart = Date.now();
    const subj = curQ.subject || subject;
    $('q-badge').textContent = subj === 'vietnamese' ? '📖' : subj === 'english' ? '🔤' : '🔢';
    $('q-text').textContent = curQ.question_text;
    $('feedback').style.display = 'none';
    const opts = $('q-options'); opts.innerHTML = '';
    ['a', 'b', 'c', 'd'].forEach(k => {
      const t = curQ[`option_${k}`]; if (t == null) return;
      const btn = document.createElement('button'); btn.className = 'option-btn'; btn.dataset.key = k; btn.textContent = t;
      btn.addEventListener('click', () => handleAns(k));
      opts.appendChild(btn);
    });
    renderHud(); startTimer();
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
      correct++; combo++; if (combo > maxCombo) maxCombo = combo;
      let up = 1;
      if (combo > 0 && combo % 3 === 0) up = 2;
      height = Math.min(HEIGHT, height + up);
      grabAnimate();
      positionClimber(true);
      if (up >= 2) { fb.className = 'feedback bonus'; fb.textContent = '✨ Combo! Leo vọt 2 nấc!'; }
      else { fb.className = 'feedback good'; fb.textContent = '✅ Bám chắc! Leo lên 1 nấc.'; }
    } else {
      wrong++; combo = 0; stamina--;
      slipAnimate();
      fb.className = 'feedback bad'; fb.textContent = stamina > 0 ? '❌ Trượt tay! Mất 1 sức.' : '❌ Hết sức rồi!';
    }
    if (height > userData.bestHeight) userData.bestHeight = height;
    renderHud();
    logAns(sel, ck, ok, Date.now() - qStart);
    setTimeout(() => { if (isFinished()) finish(); else showNextQ(); }, 1100);
  }

  function handleTimeout() {
    if (locked) return; locked = true;
    wrong++; combo = 0; stamina--;
    slipAnimate(); renderHud();
    const fb = $('feedback'); fb.style.display = 'block'; fb.className = 'feedback bad'; fb.textContent = '⏰ Hết giờ! Mất 1 sức.';
    setTimeout(() => { if (isFinished()) finish(); else showNextQ(); }, 1100);
  }

  function grabAnimate() { const c = $('climber'); c.classList.add('grab'); setTimeout(() => c.classList.remove('grab'), 450); }
  function slipAnimate() { const c = $('climber'); c.classList.add('slip'); setTimeout(() => c.classList.remove('slip'), 500); }

  function finish() {
    clearInterval(tH);
    if (!outcome) outcome = height >= HEIGHT ? 'won' : (stamina <= 0 ? 'fell' : 'end');
    const total = correct + wrong;
    const acc = total > 0 ? Math.round((correct / total) * 100) : 0;
    let stars = 0;
    if (outcome === 'won') stars = stamina === MAX_STAMINA ? 3 : (stamina >= 1 ? 2 : 1);
    else if (height >= HEIGHT - 3) stars = 1;
    if (outcome === 'won') userData.totalWins += 1;
    saveData();
    saveSession({ stars, acc, total });

    if (outcome === 'won') { $('climber').classList.add('cheer'); spawnConfetti($('cliff-stage'), 36); }
    if (window.HocVuiSound) window.HocVuiSound.play(outcome === 'won' ? 'win' : 'lose');
    if (window.HocVuiCollection) window.HocVuiCollection.reward(stars);
    setTimeout(() => {
      $('result-emoji').textContent = outcome === 'won' ? '🏔️' : outcome === 'fell' ? '😵' : '🧗';
      $('result-title').textContent = outcome === 'won' ? '🏔️ Chinh Phục Đỉnh Núi!' : outcome === 'fell' ? '😵 Trượt Chân Rồi!' : '🧗 Kết Thúc';
      $('result-stars').innerHTML = [1, 2, 3].map(i => `<span class="star ${i <= stars ? 'on' : ''}">⭐</span>`).join('');
      $('result-detail').innerHTML = `🧗 Độ cao: ${height}/${HEIGHT} (${height * 25}m)<br>💪 Sức còn: ${Math.max(0, stamina)}/${MAX_STAMINA}<br>✅ Đúng: ${correct}/${total} (${acc}%)<br>✨ Combo cao nhất: ${maxCombo}`;
      ss('result-screen');
      if (typeof window.checkAndShowPrompt === 'function') { try { window.checkAndShowPrompt(); } catch (e) {} }
    }, outcome === 'won' ? 1100 : 200);
  }

  async function saveSession({ stars, acc, total }) {
    try {
      const p = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
      if (!p.id) return;
      await fetch('/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        player_id: p.id, subject: subject === 'mix' ? 'math' : subject, difficulty,
        score: height, total_questions: total, correct_answers: correct,
        stars_earned: stars, combo_max: maxCombo, mode: 'v7', accuracy: acc,
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
    const guideModal = $('guide-modal');
    $('btn-guide').addEventListener('click', () => { guideModal.style.display = 'flex'; });
    $('btn-guide-close').addEventListener('click', () => { guideModal.style.display = 'none'; });
    guideModal.addEventListener('click', e => { if (e.target === guideModal) guideModal.style.display = 'none'; });
    $('btn-exit').addEventListener('click', () => { $('exit-modal').style.display = 'flex'; });
    const exitModal = $('exit-modal');
    $('btn-exit-cancel').addEventListener('click', () => { exitModal.style.display = 'none'; });
    $('btn-exit-confirm').addEventListener('click', () => { exitModal.style.display = 'none'; clearInterval(tH); window.location.reload(); });
    exitModal.addEventListener('click', e => { if (e.target === exitModal) exitModal.style.display = 'none'; });
    window.addEventListener('resize', () => { if ($('game-screen').classList.contains('active')) positionClimber(false); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
