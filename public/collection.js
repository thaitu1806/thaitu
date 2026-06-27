// === Học Vui — Sticker Collection ("Bộ Sưu Tập") ===
// A self-contained collectible loop: finishing a game has a chance to unlock a
// random sticker (rarer ones need a win / 3 stars). Stickers are stored in
// localStorage per profile. A reveal animation makes each unlock feel exciting,
// and an album modal shows collected vs locked ("12/40 — sưu tập hết nào!").
// No backend, no admin setup — works offline and drives daily return.
(function () {
  'use strict';
  if (typeof window === 'undefined' || window.HocVuiCollection) return;

  // Sticker catalog — themed sets. rarity: common / rare / epic.
  // Kept to pre-2020 emojis to match the project's banned-emoji rule.
  const STICKERS = [
    // Animals (common)
    { id: 'a1', e: '🐶', n: 'Cún Con', r: 'common' },
    { id: 'a2', e: '🐱', n: 'Mèo Mướp', r: 'common' },
    { id: 'a3', e: '🐰', n: 'Thỏ Trắng', r: 'common' },
    { id: 'a4', e: '🐼', n: 'Gấu Trúc', r: 'common' },
    { id: 'a5', e: '🦊', n: 'Cáo Lửa', r: 'common' },
    { id: 'a6', e: '🐯', n: 'Hổ Con', r: 'rare' },
    { id: 'a7', e: '🦁', n: 'Sư Tử', r: 'rare' },
    { id: 'a8', e: '🐲', n: 'Rồng Xanh', r: 'epic' },
    // Sea
    { id: 's1', e: '🐠', n: 'Cá Vàng', r: 'common' },
    { id: 's2', e: '🐢', n: 'Rùa Biển', r: 'common' },
    { id: 's3', e: '🐙', n: 'Bạch Tuộc', r: 'rare' },
    { id: 's4', e: '🦈', n: 'Cá Mập', r: 'rare' },
    { id: 's5', e: '🐳', n: 'Cá Voi', r: 'epic' },
    // Space
    { id: 'p1', e: '🚀', n: 'Tên Lửa', r: 'common' },
    { id: 'p2', e: '🌟', n: 'Ngôi Sao', r: 'common' },
    { id: 'p3', e: '🪐', n: 'Hành Tinh', r: 'rare' },
    { id: 'p4', e: '🌙', n: 'Mặt Trăng', r: 'rare' },
    { id: 'p5', e: '☄️', n: 'Sao Chổi', r: 'epic' },
    // Food / treats
    { id: 'f1', e: '🍩', n: 'Bánh Vòng', r: 'common' },
    { id: 'f2', e: '🍦', n: 'Kem Ốc Quế', r: 'common' },
    { id: 'f3', e: '🍓', n: 'Dâu Tây', r: 'common' },
    { id: 'f4', e: '🍕', n: 'Pizza', r: 'common' },
    { id: 'f5', e: '🎂', n: 'Bánh Kem', r: 'rare' },
    // Nature / fun
    { id: 'n1', e: '🌈', n: 'Cầu Vồng', r: 'rare' },
    { id: 'n2', e: '🌺', n: 'Hoa Râm Bụt', r: 'common' },
    { id: 'n3', e: '🍀', n: 'Cỏ May Mắn', r: 'rare' },
    { id: 'n4', e: '🦋', n: 'Bươm Bướm', r: 'common' },
    { id: 'n5', e: '🌻', n: 'Hướng Dương', r: 'common' },
    // Treasures (epic)
    { id: 't1', e: '👑', n: 'Vương Miện', r: 'epic' },
    { id: 't2', e: '💎', n: 'Kim Cương', r: 'epic' },
    { id: 't3', e: '🏆', n: 'Cúp Vàng', r: 'epic' },
    { id: 't4', e: '🎁', n: 'Hộp Quà', r: 'rare' },
    { id: 't5', e: '🪄', n: 'Đũa Phép', r: 'epic' },
    // Vehicles
    { id: 'v1', e: '🚗', n: 'Ô Tô', r: 'common' },
    { id: 'v2', e: '🚒', n: 'Xe Cứu Hỏa', r: 'common' },
    { id: 'v3', e: '🚁', n: 'Trực Thăng', r: 'rare' },
    { id: 'v4', e: '⛵', n: 'Thuyền Buồm', r: 'common' },
    { id: 'v5', e: '🎈', n: 'Bóng Bay', r: 'common' },
    // Music
    { id: 'm1', e: '🎵', n: 'Nốt Nhạc', r: 'common' },
    { id: 'm2', e: '🎸', n: 'Đàn Ghi-ta', r: 'rare' },
    { id: 'm3', e: '🎺', n: 'Kèn Trumpet', r: 'rare' },
  ];

  const RARITY = {
    common: { label: 'Thường', color: '#7bb86f', glow: 'rgba(123,184,111,0.5)' },
    rare: { label: 'Hiếm', color: '#4a90e2', glow: 'rgba(74,144,226,0.55)' },
    epic: { label: 'Cực Hiếm', color: '#b65fe0', glow: 'rgba(182,95,224,0.6)' },
  };

  function profileId() {
    try { const p = JSON.parse(localStorage.getItem('hocvui_profile') || '{}'); return p.id || 'guest'; } catch (e) { return 'guest'; }
  }
  function storeKey() { return 'hocvui_stickers_' + profileId(); }
  function getOwned() { try { return JSON.parse(localStorage.getItem(storeKey()) || '[]'); } catch (e) { return []; } }
  function setOwned(a) { try { localStorage.setItem(storeKey(), JSON.stringify(a)); } catch (e) {} }

  // Roll a reward. `quality` 0..3 (e.g. stars earned); higher = better odds &
  // access to rarer stickers. Returns the unlocked sticker, or null (no unlock).
  function roll(quality) {
    const owned = getOwned();
    // Drop chance scales with how well the child did.
    const chance = quality >= 3 ? 0.9 : quality >= 2 ? 0.7 : quality >= 1 ? 0.5 : 0.3;
    if (Math.random() > chance) return null;
    // Pick a rarity tier based on quality.
    let tier;
    const r = Math.random();
    if (quality >= 3) tier = r < 0.25 ? 'epic' : r < 0.6 ? 'rare' : 'common';
    else if (quality >= 2) tier = r < 0.1 ? 'epic' : r < 0.45 ? 'rare' : 'common';
    else tier = r < 0.03 ? 'epic' : r < 0.25 ? 'rare' : 'common';
    // Prefer not-yet-owned stickers in that tier; fall back to any tier.
    const pool = STICKERS.filter(s => s.r === tier && !owned.includes(s.id));
    let candidates = pool.length ? pool : STICKERS.filter(s => !owned.includes(s.id));
    if (!candidates.length) return null; // album complete
    const pickItem = candidates[Math.floor(Math.random() * candidates.length)];
    owned.push(pickItem.id);
    setOwned(owned);
    return pickItem;
  }

  // ── Styles ──
  function injectStyles() {
    if (document.getElementById('hv-collection-style')) return;
    const s = document.createElement('style');
    s.id = 'hv-collection-style';
    s.textContent = `
    .hvc-overlay { position: fixed; inset: 0; z-index: 2147483600; display: none; align-items: center; justify-content: center;
      background: rgba(20,10,40,0.62); backdrop-filter: blur(4px); font-family: 'Nunito', system-ui, sans-serif; }
    .hvc-overlay.show { display: flex; animation: hvcFade .25s ease; }
    @keyframes hvcFade { from { opacity: 0; } to { opacity: 1; } }
    /* reveal card */
    .hvc-reveal { background: linear-gradient(180deg,#fff,#f3efff); border-radius: 26px; padding: 26px 24px; width: min(90%,330px);
      text-align: center; box-shadow: 0 24px 60px rgba(0,0,0,0.4); animation: hvcPop .45s cubic-bezier(.34,1.56,.64,1) both; position: relative; overflow: hidden; }
    .hvc-reveal::before { content: ''; position: absolute; top: -40%; left: 50%; width: 240px; height: 240px; transform: translateX(-50%);
      background: conic-gradient(from 0deg, transparent, var(--rg,#ffd24d), transparent 30%); animation: hvcSpin 4s linear infinite; opacity: 0.5; }
    @keyframes hvcSpin { to { transform: translateX(-50%) rotate(360deg); } }
    @keyframes hvcPop { 0% { opacity: 0; transform: scale(0.5) rotate(-8deg); } 100% { opacity: 1; transform: scale(1) rotate(0); } }
    .hvc-reveal > * { position: relative; z-index: 1; }
    .hvc-banner { font-size: 0.95rem; font-weight: 900; color: #8a5cf6; letter-spacing: 1px; }
    .hvc-sticker { font-size: 5.5rem; margin: 10px 0 6px; filter: drop-shadow(0 6px 8px rgba(0,0,0,0.2)); animation: hvcBounce 1.4s ease-in-out infinite; }
    @keyframes hvcBounce { 50% { transform: translateY(-10px) scale(1.05); } }
    .hvc-name { font-size: 1.4rem; font-weight: 900; color: #2a2150; }
    .hvc-rarity { display: inline-block; margin-top: 6px; padding: 3px 14px; border-radius: 999px; color: #fff; font-weight: 800; font-size: 0.8rem; }
    .hvc-progress { margin-top: 12px; font-size: 0.9rem; color: #6a6a8a; font-weight: 700; }
    .hvc-btn { margin-top: 16px; width: 100%; padding: 13px; border: none; border-radius: 14px; background: linear-gradient(135deg,#a06bff,#7a3bd6);
      color: #fff; font-size: 1.05rem; font-weight: 900; cursor: pointer; box-shadow: 0 5px 0 #5a2aa0; }
    .hvc-btn:active { transform: translateY(3px); box-shadow: 0 2px 0 #5a2aa0; }
    .hvc-confetti { position: fixed; top: -10px; width: 9px; height: 15px; border-radius: 2px; z-index: 2147483601; pointer-events: none; animation: hvcConf 1.6s ease-in forwards; }
    @keyframes hvcConf { to { transform: translateY(105vh) rotate(540deg); opacity: 0.2; } }
    /* album */
    .hvc-album { background: #fff; border-radius: 24px; padding: 20px 18px; width: min(94%,520px); max-height: 88vh; overflow-y: auto;
      box-shadow: 0 24px 60px rgba(0,0,0,0.4); animation: hvcPop .35s cubic-bezier(.34,1.56,.64,1) both; }
    .hvc-album-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
    .hvc-album-head h2 { font-size: 1.4rem; font-weight: 900; color: #2a2150; }
    .hvc-close { width: 36px; height: 36px; border: none; border-radius: 50%; background: #eee; font-size: 1.1rem; cursor: pointer; }
    .hvc-album-sub { color: #8a87a0; font-weight: 800; font-size: 0.95rem; margin-bottom: 14px; }
    .hvc-bar { height: 10px; background: #ede9f7; border-radius: 999px; overflow: hidden; margin-bottom: 16px; }
    .hvc-bar-fill { height: 100%; background: linear-gradient(90deg,#a06bff,#ff7a59); border-radius: 999px; transition: width .4s; }
    .hvc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(62px,1fr)); gap: 10px; }
    .hvc-cell { aspect-ratio: 1; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.9rem;
      background: #f4f1fb; border: 2px solid #eae6f7; position: relative; }
    .hvc-cell.owned { background: #fff; border-color: var(--c,#a06bff); box-shadow: 0 4px 10px var(--g,rgba(160,107,255,0.25)); }
    .hvc-cell.locked { color: transparent; }
    .hvc-cell.locked::after { content: '❓'; position: absolute; font-size: 1.4rem; color: #c9c3e0; }
    `;
    document.head.appendChild(s);
  }

  // ── Reveal animation ──
  let overlay = null;
  function ensureOverlay() {
    injectStyles();
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'hvc-overlay';
    document.body.appendChild(overlay);
  }

  function showReveal(sticker) {
    ensureOverlay();
    const owned = getOwned().length, total = STICKERS.length;
    const rar = RARITY[sticker.r];
    overlay.innerHTML = `
      <div class="hvc-reveal" style="--rg:${rar.glow}">
        <div class="hvc-banner">✨ NHÃN DÁN MỚI ✨</div>
        <div class="hvc-sticker">${sticker.e}</div>
        <div class="hvc-name">${sticker.n}</div>
        <div class="hvc-rarity" style="background:${rar.color}">${rar.label}</div>
        <div class="hvc-progress">Bộ sưu tập: ${owned}/${total}</div>
        <button class="hvc-btn" id="hvc-reveal-ok">Tuyệt vời! 🎉</button>
      </div>`;
    overlay.classList.add('show');
    document.getElementById('hvc-reveal-ok').addEventListener('click', () => overlay.classList.remove('show'));
    if (window.HocVuiSound) window.HocVuiSound.play(sticker.r === 'epic' ? 'win' : 'star');
    if (window.HocVuiMascot) window.HocVuiMascot.say('Có nhãn dán mới nè! 🎉', 'good');
    burstConfetti();
  }

  function burstConfetti() {
    const colors = ['#ffd54f', '#ff7043', '#81c784', '#64b5f6', '#ba68c8', '#fff'];
    for (let i = 0; i < 28; i++) {
      const c = document.createElement('span');
      c.className = 'hvc-confetti';
      c.style.left = Math.random() * 100 + '%';
      c.style.background = colors[i % colors.length];
      c.style.animationDelay = (Math.random() * 0.5) + 's';
      document.body.appendChild(c);
      c.addEventListener('animationend', () => c.remove(), { once: true });
    }
  }

  // ── Album modal ──
  function showAlbum() {
    ensureOverlay();
    const owned = getOwned();
    const total = STICKERS.length;
    const pct = Math.round(owned.length / total * 100);
    const cells = STICKERS.map(s => {
      const has = owned.includes(s.id);
      const rar = RARITY[s.r];
      return has
        ? `<div class="hvc-cell owned" style="--c:${rar.color};--g:${rar.glow}" title="${s.n} (${rar.label})">${s.e}</div>`
        : `<div class="hvc-cell locked" title="Chưa mở khoá"></div>`;
    }).join('');
    overlay.innerHTML = `
      <div class="hvc-album">
        <div class="hvc-album-head">
          <h2>📔 Bộ Sưu Tập</h2>
          <button class="hvc-close" id="hvc-album-close">✕</button>
        </div>
        <div class="hvc-album-sub">Đã sưu tập ${owned.length}/${total} nhãn dán — chơi tiếp để mở hết nhé!</div>
        <div class="hvc-bar"><div class="hvc-bar-fill" style="width:${pct}%"></div></div>
        <div class="hvc-grid">${cells}</div>
      </div>`;
    overlay.classList.add('show');
    document.getElementById('hvc-album-close').addEventListener('click', () => overlay.classList.remove('show'));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('show'); });
  }

  // ── Public API ──
  window.HocVuiCollection = {
    // Call on game finish with stars earned (0..3). Shows a reveal if unlocked.
    reward(stars) {
      const s = roll(Math.max(0, Math.min(3, stars | 0)));
      if (s) { setTimeout(() => showReveal(s), 600); return s; }
      return null;
    },
    showAlbum,
    owned: () => getOwned().slice(),
    total: () => STICKERS.length,
    count: () => getOwned().length,
  };
})();
