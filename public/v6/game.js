// V6 — Đua Xe Trí Tuệ (Brain Racing)
// You race a rival car (Bot or 2nd player turn) down an animated track. Correct
// answers advance your car; a 3-combo charges Nitro for an extra boost. Banana
// peels on the track can slip you back. First to the finish line wins.
(function () {
  'use strict';

  const TRACK = 15;          // cells to finish
  const TIMER_SECONDS = 16;
  const MAX_Q = 40;

  let userData = { totalWins: 0, totalRaces: 0 };
  function loadData() { try { const r = localStorage.getItem('v6_racing'); if (r) Object.assign(userData, JSON.parse(r)); } catch (e) {} }
  function saveData() { try { localStorage.setItem('v6_racing', JSON.stringify(userData)); } catch (e) {} }

  let cache = [], used = new Set();
  let curQ = null, combo = 0, maxCombo = 0, nitro = 0;
  let mode = 'bot', subject = 'mix', difficulty = 'easy';
  let p1 = 0, p2 = 0, served = 0, correct = 0, wrong = 0, outcome = null;
  let turn = 1;              // whose question it is (duo mode alternates)
  let qStart = 0, tH = null, locked = false, fbId = -1;
  let bananas = new Set();

  const $ = id => document.getElementById(id);
  const ss = id => { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); $(id).classList.add('active'); };

  function renderStart() { $('total-wins').textContent = userData.totalWins; $('total-races').textContent = userData.totalRaces; }
  function wireSel() {
    document.querySelectorAll('.selector-options').forEach(g => g.addEventListener('click', e => {
      const b = e.target.closest('.sel-btn'); if (!b) return;
      g.querySelectorAll('.sel-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      const grp = g.dataset.group;
      if (grp === 'mode') mode = b.dataset.value;
      else if (grp === 'subject') subject = b.dataset.value;
      else difficulty = b.dataset.value;
    }));
  }

  async function fetchQ() {
    const p = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
    const g = p.grade ?? 2;
    try {
      if (subject === 'mix') {
        const subs = ['math', 'vietnamese', 'english'];
        const r = await Promise.all(subs.map(s => fetch(`/api/questions?subject=${s}&difficulty=${difficulty}&limit=14&grade=${g}`).then(x => x.ok ? x.json() : []).catch(() => [])));
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

  function buildTrack() {
    // place 3 random banana peels (not at start/finish)
    bananas = new Set();
    while (bananas.size < 3) { const b = 3 + Math.floor(Math.random() * (TRACK - 4)); bananas.add(b); }
    const deco = $('track-deco');
    deco.innerHTML = '';
    bananas.forEach(b => {
      const el = document.createElement('span');
      el.className = 'banana'; el.textContent = '🍌';
      el.style.left = (b / TRACK * 100) + '%';
      deco.appendChild(el);
    });
    placeCars();
  }
  function placeCars() {
    $('racer-1').style.left = (p1 / TRACK * 100) + '%';
    $('racer-2').style.left = (p2 / TRACK * 100) + '%';
  }

  async function startRun() {
    cache = []; used.clear(); combo = 0; maxCombo = 0; nitro = 0; fbId = -1;
    p1 = 0; p2 = 0; served = 0; correct = 0; wrong = 0; outcome = null; turn = 1;
    ss('game-screen');
    buildTrack(); renderHud();
    $('q-text').textContent = '⏳ Đang tải...'; $('q-options').innerHTML = ''; $('feedback').style.display = 'none';
    await fetchQ();
    showNextQ();
  }

  function renderHud() {
    $('lap-text').textContent = `${p1}/${TRACK}`;
    $('nitro-text').textContent = nitro;
    $('progress-text').textContent = served;
    $('nitro-text').parentElement.classList.toggle('charged', nitro >= 3);
  }

  function isFinished() { return outcome !== null || p1 >= TRACK || p2 >= TRACK || served >= MAX_Q; }

  function showNextQ() {
    if (p1 >= TRACK) outcome = 'won';
    else if (p2 >= TRACK) outcome = 'lost';
    if (outcome || served >= MAX_Q) { finish(); return; }
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

  function moveRival() {
    // Rival car moves on each question regardless, at a difficulty-scaled pace.
    const chance = difficulty === 'hard' ? 0.85 : difficulty === 'medium' ? 0.65 : 0.5;
    if (Math.random() < chance) { p2 = Math.min(TRACK, p2 + 1); }
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
    const fb = $('feedback'); fb.style.display = 'block';
    if (ok) {
      correct++; combo++; if (combo > maxCombo) maxCombo = combo;
      let move = 1;
      nitro = combo % 3 === 0 ? Math.min(9, nitro + 1) : nitro;
      const usedNitro = combo > 0 && combo % 3 === 0;
      if (usedNitro) { move = 2; revNitro(); }
      p1 = Math.min(TRACK, p1 + move);
      // banana check
      if (bananas.has(p1)) { p1 = Math.max(0, p1 - 1); bananaSlip(); fb.className = 'feedback bad'; fb.textContent = '🍌 Trượt vỏ chuối! Lùi 1 ô.'; }
      else if (usedNitro) { fb.className = 'feedback bonus'; fb.textContent = '🔥 NITRO! Vọt 2 ô!'; }
      else { fb.className = 'feedback good'; fb.textContent = '✅ Đúng! Tăng tốc!'; }
      $('racer-1').classList.add('boost'); setTimeout(() => $('racer-1').classList.remove('boost'), 450);
    } else {
      wrong++; combo = 0;
      fb.className = 'feedback bad'; fb.textContent = '❌ Sai! Xe đứng yên.';
    }
    moveRival();
    placeCars(); renderHud();
    logAns(sel, ck, ok, Date.now() - qStart);
    setTimeout(() => { if (isFinished()) finish(); else showNextQ(); }, 1100);
  }

  function handleTimeout() {
    if (locked) return; locked = true;
    wrong++; combo = 0;
    moveRival(); placeCars(); renderHud();
    const fb = $('feedback'); fb.style.display = 'block'; fb.className = 'feedback bad'; fb.textContent = '⏰ Hết giờ! Đối thủ vượt lên.';
    setTimeout(() => { if (isFinished()) finish(); else showNextQ(); }, 1100);
  }

  function revNitro() { const f = $('racer-1').querySelector('.nitro-flame'); f.classList.add('on'); setTimeout(() => f.classList.remove('on'), 600); }
  function bananaSlip() { $('racer-1').classList.add('slip'); setTimeout(() => $('racer-1').classList.remove('slip'), 500); }

  function finish() {
    clearInterval(tH);
    if (!outcome) outcome = p1 >= TRACK ? 'won' : (p2 >= TRACK ? 'lost' : (p1 >= p2 ? 'won' : 'lost'));
    const total = correct + wrong;
    const acc = total > 0 ? Math.round((correct / total) * 100) : 0;
    let stars = 0;
    if (outcome === 'won') stars = acc >= 85 ? 3 : acc >= 60 ? 2 : 1;
    else if (p1 >= TRACK - 3) stars = 1;
    userData.totalRaces += 1; if (outcome === 'won') userData.totalWins += 1;
    saveData();
    saveSession({ stars, acc, total });

    if (outcome === 'won') spawnConfetti($('race-stage'), 36);
    if (window.HocVuiSound) window.HocVuiSound.play(outcome === 'won' ? 'win' : 'lose');
    if (window.HocVuiCollection) window.HocVuiCollection.reward(stars);
    setTimeout(() => {
      $('result-emoji').textContent = outcome === 'won' ? '🏆' : '🏁';
      $('result-title').textContent = outcome === 'won' ? '🏆 Về Đích Đầu Tiên!' : '🏁 Về Đích Sau!';
      $('result-stars').innerHTML = [1, 2, 3].map(i => `<span class="star ${i <= stars ? 'on' : ''}">⭐</span>`).join('');
      $('result-detail').innerHTML = `🏎️ Bạn: ${p1}/${TRACK}<br>🚗 Đối thủ: ${p2}/${TRACK}<br>✅ Đúng: ${correct}/${total} (${acc}%)<br>✨ Combo cao nhất: ${maxCombo}`;
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
        score: p1, total_questions: total, correct_answers: correct,
        stars_earned: stars, combo_max: maxCombo, mode: 'v6', accuracy: acc,
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
    window.addEventListener('resize', () => { if ($('game-screen').classList.contains('active')) placeCars(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
