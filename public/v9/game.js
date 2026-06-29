// V9 — Phá Đảo Boss (Turn-based Boss Battle)
// A turn-based RPG: each correct answer makes the hero attack the boss; a 3-combo
// charges a super move (triple damage). Wrong answers let the boss counterattack.
// Defeat all 3 bosses (each tougher) without losing all your HP to win.
(function () {
  'use strict';

  const TIMER_SECONDS = 18;
  const MAX_Q = 40;
  const HERO_HP = 100;
  const BOSSES = [
    { name: 'Yêu Tinh', emoji: '👹', hp: 60, dmg: 10 },
    { name: 'Rồng Lửa', emoji: '🐲', hp: 90, dmg: 14 },
    { name: 'Quỷ Vương', emoji: '👺', hp: 120, dmg: 18 },
  ];

  let userData = { totalBoss: 0, totalWins: 0 };
  function loadData() { try { const r = localStorage.getItem('v9_boss'); if (r) Object.assign(userData, JSON.parse(r)); } catch (e) {} }
  function saveData() { try { localStorage.setItem('v9_boss', JSON.stringify(userData)); } catch (e) {} }

  let cache = [], used = new Set();
  let curQ = null, combo = 0, maxCombo = 0, charge = 0;
  let subject = 'mix', difficulty = 'easy';
  let bossIdx = 0, bossHp = 0, heroHp = HERO_HP, served = 0, correct = 0, wrong = 0, bossesDown = 0, outcome = null;
  let qStart = 0, tH = null, locked = false, fbId = -1;

  const $ = id => document.getElementById(id);
  const ss = id => { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); $(id).classList.add('active'); };

  function renderStart() { $('total-boss').textContent = userData.totalBoss; $('total-wins').textContent = userData.totalWins; }
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

  const HERO_DMG = 20;       // base hero damage per correct answer

  async function startRun() {
    cache = []; used.clear(); combo = 0; maxCombo = 0; charge = 0; fbId = -1;
    bossIdx = 0; heroHp = HERO_HP; served = 0; correct = 0; wrong = 0; bossesDown = 0; outcome = null;
    spawnBoss(0);
    ss('game-screen');
    renderHud(); renderBars();
    $('q-text').textContent = '⏳ Đang tải...'; $('q-options').innerHTML = ''; $('feedback').style.display = 'none';
    await fetchQ();
    showNextQ();
  }

  function spawnBoss(i) {
    bossIdx = i; bossHp = BOSSES[i].hp;
    $('boss-sprite').textContent = BOSSES[i].emoji;
    $('boss-sprite').classList.remove('boss-defeated');
    $('boss').classList.add('boss-enter');
    setTimeout(() => $('boss').classList.remove('boss-enter'), 600);
  }

  function renderHud() {
    $('boss-num').textContent = `${bossIdx + 1}/3`;
    $('charge-text').textContent = `${charge}/3`;
    $('progress-text').textContent = served;
    $('charge-text').parentElement.classList.toggle('charged', charge >= 3);
  }
  function renderBars() {
    const bMax = BOSSES[bossIdx].hp;
    $('boss-hp-fill').style.width = Math.max(0, bossHp / bMax * 100) + '%';
    $('boss-hp-label').textContent = `${BOSSES[bossIdx].name} ❤️${Math.max(0, bossHp)}`;
    $('hero-hp-fill').style.width = Math.max(0, heroHp / HERO_HP * 100) + '%';
    $('hero-hp-label').textContent = `🦸 ❤️${Math.max(0, heroHp)}`;
  }

  function isFinished() { return outcome !== null || heroHp <= 0 || (bossesDown >= BOSSES.length) || served >= MAX_Q; }

  function showNextQ() {
    if (heroHp <= 0) outcome = 'lost';
    else if (bossesDown >= BOSSES.length) outcome = 'won';
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
    logAns(sel, ck, ok, Date.now() - qStart);
    const fb = $('feedback'); fb.style.display = 'block';
    if (ok) {
      correct++; combo++; if (combo > maxCombo) maxCombo = combo;
      let dmg = HERO_DMG;
      let isSuper = false;
      if (combo > 0 && combo % 3 === 0) { dmg = HERO_DMG * 3; isSuper = true; charge = 0; }
      else { charge = combo % 3; }
      bossHp -= dmg;
      heroAttack(isSuper, dmg);
      if (isSuper) { fb.className = 'feedback bonus'; fb.textContent = `⚡ ĐẠI CHIÊU! -${dmg} máu boss!`; }
      else { fb.className = 'feedback good'; fb.textContent = `✅ Trúng đòn! -${dmg} máu boss.`; }
      if (bossHp <= 0) {
        bossesDown++; userData.totalBoss += 1;
        defeatBoss();
        renderBars();
        if (bossesDown >= BOSSES.length) { renderHud(); setTimeout(finish, 1300); return; }
        setTimeout(() => { spawnBoss(bossIdx + 1); renderHud(); renderBars(); }, 900);
        setTimeout(() => { if (isFinished()) finish(); else showNextQ(); }, 1500);
        renderHud();
        return;
      }
    } else {
      wrong++; combo = 0; charge = 0;
      const dmg = BOSSES[bossIdx].dmg;
      heroHp -= dmg;
      bossAttack(dmg);
      fb.className = 'feedback bad'; fb.textContent = `❌ Sai! Boss phản đòn -${dmg} máu.`;
    }
    renderHud(); renderBars();
    setTimeout(() => { if (isFinished()) finish(); else showNextQ(); }, 1100);
  }

  function handleTimeout() {
    if (locked) return; locked = true;
    wrong++; combo = 0; charge = 0;
    const dmg = BOSSES[bossIdx].dmg;
    heroHp -= dmg; bossAttack(dmg);
    const fb = $('feedback'); fb.style.display = 'block'; fb.className = 'feedback bad'; fb.textContent = `⏰ Hết giờ! Boss đánh -${dmg} máu.`;
    renderHud(); renderBars();
    setTimeout(() => { if (isFinished()) finish(); else showNextQ(); }, 1100);
  }

  // ── FX ──────────────────────────────────────────────────────────────────────
  function heroAttack(isSuper, dmg) {
    $('hero-sprite').classList.add('lunge'); setTimeout(() => $('hero-sprite').classList.remove('lunge'), 450);
    $('boss-sprite').classList.add('hit'); setTimeout(() => $('boss-sprite').classList.remove('hit'), 450);
    slash(isSuper);
    floatDmg($('boss'), '-' + dmg, isSuper ? '#ffcf3a' : '#fff');
  }
  function bossAttack(dmg) {
    $('boss-sprite').classList.add('lunge-back'); setTimeout(() => $('boss-sprite').classList.remove('lunge-back'), 450);
    $('hero-sprite').classList.add('hit'); setTimeout(() => $('hero-sprite').classList.remove('hit'), 450);
    $('battle-stage').classList.add('shake'); setTimeout(() => $('battle-stage').classList.remove('shake'), 350);
    floatDmg($('hero'), '-' + dmg, '#ff6b6b');
  }
  function defeatBoss() {
    $('boss-sprite').classList.add('boss-defeated');
    spawnBurst($('fx-layer'), 16);
  }
  function slash(isSuper) {
    const s = document.createElement('div');
    s.className = 'slash' + (isSuper ? ' slash-super' : '');
    $('fx-layer').appendChild(s);
    s.addEventListener('animationend', () => s.remove(), { once: true });
  }
  function floatDmg(target, txt, color) {
    const el = document.createElement('span');
    el.className = 'dmg-float'; el.textContent = txt; el.style.color = color;
    const r = target.getBoundingClientRect();
    const sr = $('battle-stage').getBoundingClientRect();
    el.style.left = (r.left - sr.left + r.width / 2) + 'px';
    el.style.top = (r.top - sr.top + 10) + 'px';
    $('fx-layer').appendChild(el);
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }
  function spawnBurst(parent, count) {
    if (!parent) return;
    const r = $('boss').getBoundingClientRect();
    const sr = $('battle-stage').getBoundingClientRect();
    const cx = r.left - sr.left + r.width / 2, cy = r.top - sr.top + r.height / 2;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span'); p.className = 'pfx pfx-burst';
      p.style.left = cx + 'px'; p.style.top = cy + 'px';
      p.style.setProperty('--tx', (Math.random() * 160 - 80) + 'px');
      p.style.setProperty('--ty', (Math.random() * 160 - 80) + 'px');
      parent.appendChild(p); p.addEventListener('animationend', () => p.remove(), { once: true });
    }
  }

  function finish() {
    clearInterval(tH);
    if (!outcome) outcome = bossesDown >= BOSSES.length ? 'won' : (heroHp <= 0 ? 'lost' : 'end');
    const total = correct + wrong;
    const acc = total > 0 ? Math.round((correct / total) * 100) : 0;
    let stars = 0;
    if (outcome === 'won') stars = heroHp >= 70 ? 3 : heroHp >= 30 ? 2 : 1;
    else if (bossesDown >= 2) stars = 1;
    if (outcome === 'won') userData.totalWins += 1;
    saveData();
    saveSession({ stars, acc, total });

    if (outcome === 'won') spawnConfetti($('battle-stage'), 40);
    if (window.HocVuiSound) window.HocVuiSound.play(outcome === 'won' ? 'win' : 'lose');
    if (window.HocVuiCollection) window.HocVuiCollection.reward(stars);
    setTimeout(() => {
      $('result-emoji').textContent = outcome === 'won' ? '👑' : outcome === 'lost' ? '💀' : '⚔️';
      $('result-title').textContent = outcome === 'won' ? '👑 Phá Đảo Thành Công!' : outcome === 'lost' ? '💀 Anh Hùng Gục Ngã!' : '⚔️ Kết Thúc';
      $('result-stars').innerHTML = [1, 2, 3].map(i => `<span class="star ${i <= stars ? 'on' : ''}">⭐</span>`).join('');
      $('result-detail').innerHTML = `👹 Boss đã hạ: ${bossesDown}/3<br>❤️ Máu còn: ${Math.max(0, heroHp)}/${HERO_HP}<br>✅ Đúng: ${correct}/${total} (${acc}%)<br>✨ Combo cao nhất: ${maxCombo}`;
      ss('result-screen');
      if (typeof window.checkAndShowPrompt === 'function') { try { window.checkAndShowPrompt(); } catch (e) {} }
    }, outcome === 'won' ? 1200 : 200);
  }

  async function saveSession({ stars, acc, total }) {
    try {
      const p = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
      if (!p.id) return;
      await fetch('/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        player_id: p.id, subject: subject === 'mix' ? 'math' : subject, difficulty,
        score: bossesDown, total_questions: total, correct_answers: correct,
        stars_earned: stars, combo_max: maxCombo, mode: 'v9', accuracy: acc,
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
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
