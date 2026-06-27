// === Học Vui — Engagement Hub ===
// Client-side habit loop, no backend required. Provides:
//   1) Daily login reward (a chest the child opens once per day; 7-day streak)
//   2) "Today's goal" progress (answer N correct today) with a floating widget
//   3) Lifetime correct-answer counter that drives the mascot's pet evolution
// All state is per-profile in localStorage. Other modules (mascot, collection)
// read window.HocVuiProgress for shared numbers.
(function () {
  'use strict';
  if (typeof window === 'undefined' || window.HocVuiProgress) return;

  function pid() { try { return (JSON.parse(localStorage.getItem('hocvui_profile') || '{}').id) || 'guest'; } catch (e) { return 'guest'; } }
  function key(name) { return 'hv_' + name + '_' + pid(); }
  function load(name, def) { try { const v = localStorage.getItem(key(name)); return v == null ? def : JSON.parse(v); } catch (e) { return def; } }
  function save(name, val) { try { localStorage.setItem(key(name), JSON.stringify(val)); } catch (e) {} }
  function today() { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }

  const DAILY_GOAL = 10; // correct answers per day to "win the day"

  // --- shared progress state ---
  const Progress = {
    lifetimeCorrect: load('lifeCorrect', 0),
    addCorrect() {
      this.lifetimeCorrect++;
      save('lifeCorrect', this.lifetimeCorrect);
      // today's goal
      let g = load('goal', { date: today(), n: 0, done: false });
      if (g.date !== today()) g = { date: today(), n: 0, done: false };
      g.n++;
      if (!g.done && g.n >= DAILY_GOAL) { g.done = true; save('goal', g); onGoalDone(); }
      else save('goal', g);
      updateGoalWidget();
      // let the mascot know (may trigger evolution)
      if (window.HocVuiMascot && window.HocVuiMascot.refreshStage) window.HocVuiMascot.refreshStage();
    },
    goalToday() { let g = load('goal', { date: today(), n: 0, done: false }); if (g.date !== today()) g = { date: today(), n: 0, done: false }; return { ...g, target: DAILY_GOAL }; },
    petStage() {
      const c = this.lifetimeCorrect;
      if (c >= 500) return 4;
      if (c >= 200) return 3;
      if (c >= 60) return 2;
      if (c >= 15) return 1;
      return 0;
    },
  };
  window.HocVuiProgress = Progress;

  function isGamePage() {
    const p = location.pathname;
    if (/\/v\d+\//.test(p)) return true;
    return /\/(game|learn|exam)\.html$/.test(p) || /\/(game|learn|exam)$/.test(p);
  }
  function isHome() {
    const p = location.pathname;
    return p === '/' || /\/(home|index)\.html$/.test(p) || /\/home$/.test(p);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Count correct answers by observing the same feedback classes used elsewhere.
  const seen = new WeakSet();
  function reactTo(el) {
    if (!(el instanceof HTMLElement) || seen.has(el)) return;
    const cls = el.className || '';
    if (/\bcorrect\b/.test(cls) && /option|opt|to-btn|answer|choice|btn/.test(cls)) {
      seen.add(el); Progress.addCorrect();
    }
  }
  const mo = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === 'attributes' && m.target) reactTo(m.target);
      if (m.type === 'childList') m.addedNodes.forEach((n) => {
        if (n.nodeType !== 1) return; reactTo(n);
        n.querySelectorAll && n.querySelectorAll('.correct,.wrong').forEach(reactTo);
      });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Styles
  function injectStyles() {
    if (document.getElementById('hv-eng-style')) return;
    const s = document.createElement('style');
    s.id = 'hv-eng-style';
    s.textContent = `
    .hv-eng-overlay { position: fixed; inset: 0; z-index: 2147483500; display: none; align-items: center; justify-content: center;
      background: rgba(20,10,40,0.6); backdrop-filter: blur(4px); font-family: 'Nunito', system-ui, sans-serif; }
    .hv-eng-overlay.show { display: flex; animation: hvEngFade .25s ease; }
    @keyframes hvEngFade { from { opacity: 0; } to { opacity: 1; } }
    .hv-eng-card { background: linear-gradient(180deg,#fff,#fff4e6); border-radius: 26px; padding: 26px 24px; width: min(92%,340px);
      text-align: center; box-shadow: 0 24px 60px rgba(0,0,0,0.4); animation: hvEngPop .4s cubic-bezier(.34,1.56,.64,1) both; }
    @keyframes hvEngPop { 0% { opacity:0; transform: scale(0.6) translateY(20px);} 100% { opacity:1; transform: scale(1) translateY(0);} }
    .hv-eng-title { font-size: 1.3rem; font-weight: 900; color: #d2691e; }
    .hv-eng-sub { font-size: 0.9rem; color: #8a7a5a; font-weight: 700; margin-top: 2px; }
    .hv-chests { display: flex; justify-content: center; gap: 14px; margin: 18px 0 8px; }
    .hv-chest { font-size: 3.2rem; cursor: pointer; transition: transform .15s; filter: drop-shadow(0 5px 6px rgba(0,0,0,0.2)); }
    .hv-chest:active { transform: scale(0.9); }
    .hv-chest.shake { animation: hvChestShake 0.7s ease-in-out infinite; }
    @keyframes hvChestShake { 0%,100% { transform: rotate(-4deg);} 50% { transform: rotate(4deg) translateY(-4px);} }
    .hv-eng-days { display: flex; justify-content: center; gap: 5px; margin: 12px 0; flex-wrap: wrap; }
    .hv-day { width: 30px; height: 38px; border-radius: 9px; background: #f0e6d2; display: flex; flex-direction: column; align-items: center; justify-content: center;
      font-size: 0.62rem; font-weight: 800; color: #a89060; }
    .hv-day .d-ic { font-size: 0.9rem; }
    .hv-day.claimed { background: #ffe0a3; color: #b5651d; }
    .hv-day.today { outline: 3px solid #ff8f3c; }
    .hv-eng-reward { font-size: 2.6rem; margin: 6px 0; }
    .hv-eng-btn { margin-top: 12px; width: 100%; padding: 13px; border: none; border-radius: 14px;
      background: linear-gradient(135deg,#ffb347,#ff8f1f); color: #fff; font-size: 1.05rem; font-weight: 900; cursor: pointer; box-shadow: 0 5px 0 #c46a10; }
    .hv-eng-btn:active { transform: translateY(3px); box-shadow: 0 2px 0 #c46a10; }
    /* today's goal widget */
    #hv-goal { position: fixed; left: 50%; transform: translateX(-50%); top: 4px; z-index: 2147482500;
      background: rgba(255,255,255,0.94); border-radius: 999px; padding: 5px 12px 5px 8px; display: none; align-items: center; gap: 8px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.18); font-family: 'Nunito',system-ui,sans-serif; pointer-events: none; }
    #hv-goal.show { display: flex; }
    #hv-goal .g-ic { font-size: 1.1rem; }
    #hv-goal .g-bar { width: 86px; height: 9px; background: #eee; border-radius: 999px; overflow: hidden; }
    #hv-goal .g-fill { height: 100%; background: linear-gradient(90deg,#7ee27e,#34c77b); border-radius: 999px; transition: width .4s; }
    #hv-goal .g-txt { font-size: 0.78rem; font-weight: 900; color: #2e7d32; }
    #hv-goal.done .g-txt { color: #ff8f1f; }
    `;
    document.head.appendChild(s);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Daily login reward (home page)
  const DAY_REWARDS = [
    { ic: '💎', n: '+5 Kim cương', d: '+5💎' },
    { ic: '⭐', n: 'Nhãn dán', d: 'sticker' },
    { ic: '💎', n: '+8 Kim cương', d: '+8💎' },
    { ic: '🎁', n: 'Nhãn dán hiếm', d: 'sticker2' },
    { ic: '💎', n: '+10 Kim cương', d: '+10💎' },
    { ic: '⭐', n: 'Nhãn dán', d: 'sticker' },
    { ic: '🏆', n: 'Thưởng lớn!', d: 'big' },
  ];

  function getDaily() { return load('daily', { last: '', streak: 0 }); }
  function grantSticker(quality) { if (window.HocVuiCollection && window.HocVuiCollection.reward) return window.HocVuiCollection.reward(quality); return null; }

  function maybeShowDailyReward() {
    if (!isHome()) return;
    if (pid() === 'guest') return; // require a profile
    const st = getDaily();
    if (st.last === today()) return; // already claimed today
    // streak: consecutive days
    const y = new Date(); y.setDate(y.getDate() - 1);
    const yStr = y.getFullYear() + '-' + (y.getMonth() + 1) + '-' + y.getDate();
    const newStreak = (st.last === yStr) ? (st.streak + 1) : 1;
    showDailyModal(newStreak);
  }

  let overlay = null;
  function ensureOverlay() { injectStyles(); if (!overlay) { overlay = document.createElement('div'); overlay.className = 'hv-eng-overlay'; document.body.appendChild(overlay); } }

  function showDailyModal(streak) {
    ensureOverlay();
    const dayIdx = ((streak - 1) % 7);
    const days = DAY_REWARDS.map((r, i) => {
      const cls = i < dayIdx ? 'claimed' : (i === dayIdx ? 'today' : '');
      return `<div class="hv-day ${cls}"><span class="d-ic">${i < dayIdx ? '✅' : r.ic}</span>N${i + 1}</div>`;
    }).join('');
    overlay.innerHTML = `
      <div class="hv-eng-card">
        <div class="hv-eng-title">🎁 Quà Mỗi Ngày</div>
        <div class="hv-eng-sub">Chuỗi ${streak} ngày — mở quà nào!</div>
        <div class="hv-chests"><span class="hv-chest shake" id="hv-chest">🎁</span></div>
        <div class="hv-eng-days">${days}</div>
        <div id="hv-reward-reveal"></div>
        <button class="hv-eng-btn" id="hv-eng-claim" style="display:none;">Tuyệt vời! 🎉</button>
      </div>`;
    overlay.classList.add('show');
    const chest = document.getElementById('hv-chest');
    let opened = false;
    chest.addEventListener('click', () => {
      if (opened) return; opened = true;
      chest.classList.remove('shake');
      chest.textContent = '📭';
      const reward = DAY_REWARDS[dayIdx];
      claimReward(reward, streak);
      const rev = document.getElementById('hv-reward-reveal');
      rev.innerHTML = `<div class="hv-eng-reward">${reward.ic}</div><div style="font-weight:900;color:#d2691e;">${reward.n}</div>`;
      document.getElementById('hv-eng-claim').style.display = 'block';
      if (window.HocVuiSound) window.HocVuiSound.play('win');
      burstConfetti();
    });
    document.addEventListener('click', function close(e) {
      const btn = document.getElementById('hv-eng-claim');
      if (btn && e.target === btn) { overlay.classList.remove('show'); document.removeEventListener('click', close); }
    });
  }

  function claimReward(reward, streak) {
    save('daily', { last: today(), streak });
    // Apply reward: diamonds bump the server balance if possible; stickers via collection.
    if (reward.d.startsWith('+')) addDiamonds(parseInt(reward.d.replace(/\D/g, '')) || 5);
    else if (reward.d === 'sticker') grantSticker(1);
    else if (reward.d === 'sticker2') grantSticker(3);
    else if (reward.d === 'big') { addDiamonds(15); grantSticker(3); }
  }

  async function addDiamonds(amount) {
    // The diamonds endpoint is read-only; reward is applied optimistically to the
    // on-screen balance + remembered locally. Real diamonds accrue from gameplay.
    try {
      const cur = load('bonusDiamonds', 0) + amount;
      save('bonusDiamonds', cur);
      const el = document.getElementById('rb-diamonds');
      if (el) { const m = (el.textContent.match(/\d+/) || [0])[0]; el.textContent = '💎 ' + (parseInt(m) + amount); }
    } catch (e) {}
  }

  function burstConfetti() {
    const colors = ['#ffd54f', '#ff7043', '#81c784', '#64b5f6', '#ba68c8', '#fff'];
    for (let i = 0; i < 30; i++) {
      const c = document.createElement('span');
      c.style.cssText = `position:fixed;top:-10px;left:${Math.random() * 100}%;width:9px;height:15px;border-radius:2px;z-index:2147483600;pointer-events:none;background:${colors[i % colors.length]};animation:hvEngConf 1.6s ease-in forwards;animation-delay:${Math.random() * 0.5}s;`;
      document.body.appendChild(c);
      c.addEventListener('animationend', () => c.remove(), { once: true });
    }
    if (!document.getElementById('hv-eng-conf-kf')) {
      const st = document.createElement('style'); st.id = 'hv-eng-conf-kf';
      st.textContent = '@keyframes hvEngConf { to { transform: translateY(105vh) rotate(540deg); opacity: .2; } }';
      document.head.appendChild(st);
    }
  }

  function onGoalDone() {
    if (window.HocVuiSound) window.HocVuiSound.play('win');
    if (window.HocVuiMascot) window.HocVuiMascot.say('Đạt mục tiêu hôm nay! 🎯🎉', 'good');
    burstConfetti();
    // bonus sticker for completing the daily goal
    grantSticker(3);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Today's goal widget (game pages)
  let goalEl = null;
  function ensureGoalWidget() {
    injectStyles();
    if (goalEl) return;
    goalEl = document.createElement('div');
    goalEl.id = 'hv-goal';
    goalEl.innerHTML = `<span class="g-ic">🎯</span><div class="g-bar"><div class="g-fill" id="hv-goal-fill"></div></div><span class="g-txt" id="hv-goal-txt"></span>`;
    document.body.appendChild(goalEl);
  }
  function updateGoalWidget() {
    if (!goalEl) return;
    const g = Progress.goalToday();
    const pct = Math.min(100, Math.round(g.n / g.target * 100));
    document.getElementById('hv-goal-fill').style.width = pct + '%';
    document.getElementById('hv-goal-txt').textContent = g.done ? 'Đạt rồi! 🌟' : `${g.n}/${g.target}`;
    goalEl.classList.toggle('done', g.done);
    goalEl.classList.add('show');
  }

  // ─────────────────────────────────────────────────────────────────────────
  function init() {
    if (isGamePage()) {
      ensureGoalWidget();
      updateGoalWidget();
      try { mo.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] }); } catch (e) {}
    }
    if (isHome()) {
      // slight delay so the profile is verified first
      setTimeout(maybeShowDailyReward, 1200);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
