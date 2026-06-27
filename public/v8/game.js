// V8 — Xếp Tháp Thăng Bằng (Balance Tower)
// Answer a question correctly to earn a block, which then swings on a crane.
// Tap "THẢ KHỐI" to drop it; the closer to center, the more stable the tower
// and the higher the score. Too many off-center drops tip the tower over.
(function () {
  'use strict';

  const GOAL = 15;            // floors to win
  const TIMER_SECONDS = 18;
  const MAX_Q = 20;
  const TIP_LIMIT = 100;      // accumulated lean before collapse

  let userData = { bestTower: 0, totalPerfect: 0 };
  function loadData() { try { const r = localStorage.getItem('v8_tower'); if (r) Object.assign(userData, JSON.parse(r)); } catch (e) {} }
  function saveData() { try { localStorage.setItem('v8_tower', JSON.stringify(userData)); } catch (e) {} }

  let cache = [], used = new Set();
  let curQ = null, combo = 0, maxCombo = 0;
  let subject = 'mix', difficulty = 'easy';
  let floors = 0, lean = 0, served = 0, correct = 0, wrong = 0, perfects = 0, outcome = null;
  let qStart = 0, tH = null, locked = false, fbId = -1;
  let swinging = false, swingRAF = null, swingDir = 1, swingPos = 0;

  const $ = id => document.getElementById(id);
  const ss = id => { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); $(id).classList.add('active'); };

  function renderStart() { $('best-tower').textContent = userData.bestTower; $('total-perfect').textContent = userData.totalPerfect; }
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
        const r = await Promise.all(subs.map(s => fetch(`/api/questions?subject=${s}&difficulty=${difficulty}&limit=7&grade=${g}`).then(x => x.ok ? x.json() : []).catch(() => [])));
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

  const BLOCK_COLORS = ['#ff8f6b', '#ffc24a', '#7ed957', '#4aa3e0', '#b07ce0', '#ff6f91'];

  async function startRun() {
    cache = []; used.clear(); combo = 0; maxCombo = 0; fbId = -1;
    floors = 0; lean = 0; served = 0; correct = 0; wrong = 0; perfects = 0; outcome = null;
    ss('game-screen');
    $('tower').innerHTML = ''; $('tower').style.transform = 'rotate(0deg)';
    renderHud();
    $('q-text').textContent = '⏳ Đang tải...'; $('q-options').innerHTML = ''; $('feedback').style.display = 'none';
    await fetchQ();
    showNextQ();
  }

  function renderHud() {
    $('floor-text').textContent = floors;
    const absLean = Math.abs(lean);
    $('balance-text').textContent = absLean < 30 ? 'Vững' : absLean < 65 ? 'Hơi nghiêng' : 'Nguy hiểm!';
    $('progress-text').textContent = `${served}/${MAX_Q}`;
  }

  function isFinished() { return outcome !== null || floors >= GOAL || Math.abs(lean) >= TIP_LIMIT || served >= MAX_Q; }

  function showNextQ() {
    if (floors >= GOAL) outcome = 'won';
    else if (Math.abs(lean) >= TIP_LIMIT) outcome = 'collapse';
    if (outcome || served >= MAX_Q) { finish(); return; }
    curQ = nextQ(); served++; locked = false; qStart = Date.now();
    const subj = curQ.subject || subject;
    $('q-badge').textContent = subj === 'vietnamese' ? '📖' : subj === 'english' ? '🔤' : '🔢';
    $('q-text').textContent = curQ.question_text;
    $('feedback').style.display = 'none';
    $('btn-drop').style.display = 'none';
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
    logAns(sel, ck, ok, Date.now() - qStart);
    const fb = $('feedback'); fb.style.display = 'block';
    if (ok) {
      correct++; combo++; if (combo > maxCombo) maxCombo = combo;
      fb.className = 'feedback good'; fb.textContent = '✅ Đúng! Căn thời điểm thả khối.';
      startSwing();
    } else {
      wrong++; combo = 0;
      fb.className = 'feedback bad'; fb.textContent = '❌ Sai! Mất lượt khối này.';
      setTimeout(() => { if (isFinished()) finish(); else showNextQ(); }, 1100);
    }
  }

  function handleTimeout() {
    if (locked) return; locked = true;
    wrong++; combo = 0;
    const fb = $('feedback'); fb.style.display = 'block'; fb.className = 'feedback bad'; fb.textContent = '⏰ Hết giờ! Mất lượt khối.';
    setTimeout(() => { if (isFinished()) finish(); else showNextQ(); }, 1100);
  }

  // ── Crane swing + drop ──────────────────────────────────────────────────────
  function startSwing() {
    const block = $('swing-block');
    block.style.background = BLOCK_COLORS[floors % BLOCK_COLORS.length];
    block.style.display = 'block';
    $('btn-drop').style.display = 'block';
    swinging = true; swingPos = 0; swingDir = 1;
    const speed = difficulty === 'hard' ? 2.4 : difficulty === 'medium' ? 1.8 : 1.3;
    function frame() {
      if (!swinging) return;
      swingPos += swingDir * speed;
      if (swingPos > 100) { swingPos = 100; swingDir = -1; }
      else if (swingPos < -100) { swingPos = -100; swingDir = 1; }
      block.style.transform = `translateX(${swingPos}%)`;
      $('crane').style.transform = `translateX(${swingPos * 0.4}%)`;
      swingRAF = requestAnimationFrame(frame);
    }
    swingRAF = requestAnimationFrame(frame);
  }

  function dropBlock() {
    if (!swinging) return;
    swinging = false;
    cancelAnimationFrame(swingRAF);
    $('btn-drop').style.display = 'none';
    const offset = swingPos;               // -100..100, 0 = perfect
    const absOff = Math.abs(offset);
    const block = $('swing-block');
    block.style.display = 'none';

    // add a floor block to the tower at the landed offset
    floors++;
    const b = document.createElement('div');
    b.className = 'block';
    b.style.background = BLOCK_COLORS[(floors - 1) % BLOCK_COLORS.length];
    b.style.setProperty('--off', (offset * 0.32) + 'px');
    $('tower').insertBefore(b, $('tower').firstChild);
    // grow lean according to how off-center the drop was (perfect reduces lean)
    if (absOff < 12) { perfects++; lean *= 0.7; popPerfect(); }
    else { lean += (offset / 100) * 26; }
    $('tower').style.transform = `rotate(${lean * 0.12}deg)`;

    const fb = $('feedback'); fb.style.display = 'block';
    if (absOff < 12) { fb.className = 'feedback bonus'; fb.textContent = '🎯 HOÀN HẢO! Tháp vững thêm!'; }
    else if (absOff < 45) { fb.className = 'feedback good'; fb.textContent = '🏗️ Khá tốt! Xây thêm 1 tầng.'; }
    else { fb.className = 'feedback bad'; fb.textContent = '⚠️ Lệch nhiều! Tháp nghiêng.'; }

    if (floors > userData.bestTower) userData.bestTower = floors;
    renderHud();
    setTimeout(() => { if (isFinished()) finish(); else showNextQ(); }, 1000);
  }

  function popPerfect() { const t = $('tower'); t.classList.add('perfect-flash'); setTimeout(() => t.classList.remove('perfect-flash'), 400); }

  function finish() {
    clearInterval(tH); swinging = false; cancelAnimationFrame(swingRAF);
    if (!outcome) outcome = floors >= GOAL ? 'won' : (Math.abs(lean) >= TIP_LIMIT ? 'collapse' : 'end');
    const total = correct + wrong;
    const acc = total > 0 ? Math.round((correct / total) * 100) : 0;
    let stars = 0;
    if (outcome === 'won') stars = perfects >= 8 ? 3 : perfects >= 4 ? 2 : 1;
    else if (floors >= GOAL - 4) stars = 1;
    userData.totalPerfect += perfects;
    saveData();
    saveSession({ stars, acc, total });

    if (outcome === 'collapse') $('tower').classList.add('collapsing');
    else if (outcome === 'won') spawnConfetti($('tower-stage'), 40);
    if (window.HocVuiSound) window.HocVuiSound.play(outcome === 'won' ? 'win' : 'lose');

    setTimeout(() => {
      $('result-emoji').textContent = outcome === 'won' ? '🏰' : outcome === 'collapse' ? '🧱' : '🏗️';
      $('result-title').textContent = outcome === 'won' ? '🏰 Lâu Đài Hoàn Thành!' : outcome === 'collapse' ? '🧱 Tháp Sụp Đổ!' : '🏗️ Kết Thúc';
      $('result-stars').innerHTML = [1, 2, 3].map(i => `<span class="star ${i <= stars ? 'on' : ''}">⭐</span>`).join('');
      $('result-detail').innerHTML = `🏰 Số tầng: ${floors}<br>🎯 Thả hoàn hảo: ${perfects}<br>✅ Đúng: ${correct}/${total} (${acc}%)<br>✨ Combo cao nhất: ${maxCombo}`;
      ss('result-screen');
      $('tower').classList.remove('collapsing');
      if (typeof window.checkAndShowPrompt === 'function') { try { window.checkAndShowPrompt(); } catch (e) {} }
    }, outcome === 'end' ? 200 : 1200);
  }

  async function saveSession({ stars, acc, total }) {
    try {
      const p = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
      if (!p.id) return;
      await fetch('/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        player_id: p.id, subject: subject === 'mix' ? 'math' : subject, difficulty,
        score: floors, total_questions: total, correct_answers: correct,
        stars_earned: stars, combo_max: maxCombo, mode: 'v8', accuracy: acc,
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
    $('btn-drop').addEventListener('click', dropBlock);
    const guideModal = $('guide-modal');
    $('btn-guide').addEventListener('click', () => { guideModal.style.display = 'flex'; });
    $('btn-guide-close').addEventListener('click', () => { guideModal.style.display = 'none'; });
    guideModal.addEventListener('click', e => { if (e.target === guideModal) guideModal.style.display = 'none'; });
    $('btn-exit').addEventListener('click', () => { $('exit-modal').style.display = 'flex'; });
    const exitModal = $('exit-modal');
    $('btn-exit-cancel').addEventListener('click', () => { exitModal.style.display = 'none'; });
    $('btn-exit-confirm').addEventListener('click', () => { exitModal.style.display = 'none'; clearInterval(tH); swinging = false; cancelAnimationFrame(swingRAF); window.location.reload(); });
    exitModal.addEventListener('click', e => { if (e.target === exitModal) exitModal.style.display = 'none'; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
