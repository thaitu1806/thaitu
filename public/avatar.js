// === Học Vui — Avatar Picker ===
// Lets the child choose their own avatar (emoji character). Some avatars are
// unlocked from the start; others unlock as the child answers more questions
// (uses window.HocVuiProgress.lifetimeCorrect). Choice stored per-profile in
// localStorage and applied to #hero-avatar on the home page. Self-contained,
// no backend. Exposes window.HocVuiAvatar.
(function () {
  'use strict';
  if (typeof window === 'undefined' || window.HocVuiAvatar) return;

  function pid() { try { return (JSON.parse(localStorage.getItem('hocvui_profile') || '{}').id) || 'guest'; } catch (e) { return 'guest'; } }
  function key() { return 'hv_avatar_' + pid(); }
  function getAvatar() { try { return localStorage.getItem(key()) || '0'; } catch (e) { return '0'; } }
  function setAvatar(a) { try { localStorage.setItem(key(), String(a)); } catch (e) {} }

  // Sprite sheet: 10 cols × 5 rows = 50 avatars, each 128×128, total 1280×640
  const SPRITE_URL = '/img/avatars.png';
  const SPRITE_COLS = 10, SPRITE_ROWS = 5, CELL_PX = 128;

  function avatarSpriteStyle(index, size) {
    size = size || 64;
    var scale = size / CELL_PX;
    var col = index % SPRITE_COLS;
    var row = Math.floor(index / SPRITE_COLS);
    var bgW = SPRITE_COLS * CELL_PX * scale;
    var bgH = SPRITE_ROWS * CELL_PX * scale;
    var x = -(col * CELL_PX * scale);
    var y = -(row * CELL_PX * scale);
    return 'display:inline-block;width:' + size + 'px;height:' + size + 'px;background:url(' + SPRITE_URL + ') ' + x + 'px ' + y + 'px/' + bgW + 'px ' + bgH + 'px no-repeat;border-radius:50%;';
  }

  // need = lifetime correct answers required to unlock.
  const AVATARS = [
    // ── Free (mở khóa ngay) ──
    { n: 'Bé Trai', need: 0 },
    { n: 'Bé Gái', need: 0 },
    { n: 'Bạn Nhỏ', need: 0 },
    // ── Beginner (10–30) ──
    { n: 'Mèo Con', need: 10 },
    { n: 'Cún Yêu', need: 10 },
    { n: 'Chuột Hamster', need: 15 },
    { n: 'Thỏ Ngọc', need: 20 },
    { n: 'Ếch Hoàng Tử', need: 25 },
    { n: 'Cáo Nhanh', need: 30 },
    // ── Explorer (40–80) ──
    { n: 'Gấu Trúc', need: 40 },
    { n: 'Gấu Koala', need: 50 },
    { n: 'Sư Tử', need: 60 },
    { n: 'Hổ Con', need: 70 },
    { n: 'Chim Cánh Cụt', need: 80 },
    // ── Adventurer (100–180) ──
    { n: 'Cú Thông Thái', need: 100 },
    { n: 'Bướm Tiên', need: 120 },
    { n: 'Cá Heo', need: 140 },
    { n: 'Kỳ Lân', need: 160 },
    { n: 'Rồng Nhí', need: 180 },
    { n: 'Đại Bàng', need: 200 },
    // ── Champion (220–340) ──
    { n: 'Bạch Tuộc', need: 220 },
    { n: 'Hồng Hạc', need: 240 },
    { n: 'Cá Mập', need: 260 },
    { n: 'Sói Xám', need: 280 },
    { n: 'Robot', need: 300 },
    { n: 'Bí Ngô', need: 320 },
    { n: 'Hoàng Tử', need: 340 },
    { n: 'Công Chúa', need: 360 },
    { n: 'Phù Thủy', need: 380 },
    { n: 'Ma Cà Rồng', need: 400 },
    // ── Master (430–580) ──
    { n: 'Nàng Tiên Cá', need: 430 },
    { n: 'Siêu Anh Hùng', need: 460 },
    { n: 'Tiên Nữ', need: 500 },
    { n: 'Ninja', need: 540 },
    { n: 'Rồng Vàng', need: 580 },
    // ── Legend (620–960) ──
    { n: 'Khủng Long T-Rex', need: 620 },
    { n: 'Brachiosaurus', need: 670 },
    { n: 'Cá Voi Xanh', need: 720 },
    { n: 'Cầu Vồng', need: 780 },
    { n: 'Sao Băng', need: 840 },
    // ── Mythic (900–1500) ──
    { n: 'UFO', need: 900 },
    { n: 'Thần Biển', need: 1000 },
    { n: 'Thần Sấm', need: 1100 },
    { n: 'Núi Lửa', need: 1200 },
    { n: 'Đỉnh Everest', need: 1300 },
    { n: 'Thiên Hà', need: 1400 },
    { n: 'Kim Cương', need: 1500 },
    { n: 'Hành Tinh', need: 1700 },
    { n: 'Pixel Alien', need: 1900 },
    { n: 'Phượng Hoàng', need: 2000 },
  ];

  function lifetime() { try { return (window.HocVuiProgress && window.HocVuiProgress.lifetimeCorrect) || 0; } catch (e) { return 0; } }
  function isUnlocked(a) { return lifetime() >= a.need; }

  function resolveAvatarIndex() {
    var raw = getAvatar();
    var idx = parseInt(raw, 10);
    if (!isNaN(idx) && idx >= 0 && idx < AVATARS.length) return idx;
    // Backward compat: old emoji-based storage → default to 0
    return 0;
  }

  function injectStyles() {
    if (document.getElementById('hv-avatar-style')) return;
    const s = document.createElement('style');
    s.id = 'hv-avatar-style';
    s.textContent = `
    .hv-av-overlay { position: fixed; inset: 0; z-index: 2147483400; display: none; align-items: center; justify-content: center;
      background: rgba(20,20,50,0.6); backdrop-filter: blur(4px); font-family: 'Nunito',system-ui,sans-serif; }
    .hv-av-overlay.show { display: flex; animation: hvAvFade .25s ease; }
    @keyframes hvAvFade { from { opacity: 0; } to { opacity: 1; } }
    .hv-av-card { background: #fff; border-radius: 24px; padding: 20px 18px; width: min(94%,440px); max-height: 86vh; overflow-y: auto;
      box-shadow: 0 24px 60px rgba(0,0,0,0.4); animation: hvAvPop .35s cubic-bezier(.34,1.56,.64,1) both; }
    @keyframes hvAvPop { 0% { opacity:0; transform: scale(0.7);} 100% { opacity:1; transform: scale(1);} }
    .hv-av-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
    .hv-av-head h2 { font-size: 1.3rem; font-weight: 900; color: #4a3aa0; }
    .hv-av-close { width: 36px; height: 36px; border: none; border-radius: 50%; background: #eee; font-size: 1.1rem; cursor: pointer; }
    .hv-av-sub { color: #8a87a0; font-weight: 800; font-size: 0.88rem; margin-bottom: 14px; }
    .hv-av-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(72px,1fr)); gap: 10px; }
    .hv-av-cell { aspect-ratio: 1; border-radius: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 2px; background: #f4f2fc; border: 3px solid #ece9f7; cursor: pointer; position: relative; transition: transform .12s; padding: 4px; }
    .hv-av-cell .av-e { width: 56px; height: 56px; line-height: 1; border-radius: 50%; }
    .hv-av-cell .av-n { font-size: 0.6rem; font-weight: 800; color: #6a6a8a; text-align: center; line-height: 1.05; }
    .hv-av-cell.sel { border-color: #7a3bd6; background: #efe6ff; box-shadow: 0 4px 12px rgba(122,59,214,0.3); }
    .hv-av-cell:active { transform: scale(0.93); }
    .hv-av-cell.locked { cursor: default; }
    .hv-av-cell.locked .av-e { filter: grayscale(1); opacity: 0.4; }
    .hv-av-cell.locked .av-n { color: #b0accb; }
    .hv-av-lock { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.55); border-radius: 13px; font-size: 0.62rem; font-weight: 900; color: #8a5cf6; gap: 2px; }
    .hv-av-lock .lk-ic { font-size: 1.1rem; }
    `;
    document.head.appendChild(s);
  }

  let overlay = null;
  function ensureOverlay() { injectStyles(); if (!overlay) { overlay = document.createElement('div'); overlay.className = 'hv-av-overlay'; document.body.appendChild(overlay); } }

  function open() {
    ensureOverlay();
    var cur = resolveAvatarIndex();
    var life = lifetime();
    var cells = AVATARS.map(function (a, i) {
      var unlocked = life >= a.need;
      var spr = avatarSpriteStyle(i, 56);
      if (!unlocked) {
        return '<div class="hv-av-cell locked"><span class="av-e" style="' + spr + 'filter:grayscale(1);opacity:0.4;"></span><span class="av-n">' + a.n + '</span>' +
          '<span class="hv-av-lock"><span class="lk-ic">🔒</span>' + a.need + ' câu</span></div>';
      }
      return '<div class="hv-av-cell ' + (i === cur ? 'sel' : '') + '" data-av="' + i + '"><span class="av-e" style="' + spr + '"></span><span class="av-n">' + a.n + '</span></div>';
    }).join('');
    overlay.innerHTML =
      '<div class="hv-av-card">' +
        '<div class="hv-av-head"><h2>🧑 Chọn Nhân Vật</h2><button class="hv-av-close" id="hv-av-close">✕</button></div>' +
        '<div class="hv-av-sub">Trả lời đúng nhiều câu để mở khóa thêm nhân vật! (Đã đúng: ' + life + ' câu)</div>' +
        '<div class="hv-av-grid">' + cells + '</div>' +
      '</div>';
    overlay.classList.add('show');
    document.getElementById('hv-av-close').addEventListener('click', function () { overlay.classList.remove('show'); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.classList.remove('show'); });
    overlay.querySelectorAll('.hv-av-cell[data-av]').forEach(function (cell) {
      cell.addEventListener('click', function () {
        var idx = parseInt(cell.dataset.av, 10);
        setAvatar(idx);
        apply();
        if (window.HocVuiSound) window.HocVuiSound.play('coin');
        overlay.classList.remove('show');
      });
    });
  }

  function apply() {
    var el = document.getElementById('hero-avatar');
    if (!el) return;
    // If the hero-avatar contains an <img> (logo), don't overwrite it
    if (el.querySelector('img')) return;
    var idx = resolveAvatarIndex();
    el.innerHTML = '<span style="' + avatarSpriteStyle(idx, 48) + '"></span>';
  }

  window.HocVuiAvatar = { open, get: getAvatar, getIndex: resolveAvatarIndex, set: function (a) { setAvatar(a); apply(); }, apply, spriteStyle: avatarSpriteStyle };

  function init() {
    apply();
    // Make the home hero avatar tappable to open the picker.
    const el = document.getElementById('hero-avatar');
    if (el) {
      el.style.cursor = 'pointer';
      el.title = 'Đổi nhân vật';
      el.addEventListener('click', open);
      // small "edit" hint badge
      if (!document.getElementById('hv-av-hint')) {
        const wrap = el.parentElement;
        if (wrap) {
          wrap.style.position = wrap.style.position || 'relative';
          const hint = document.createElement('span');
          hint.id = 'hv-av-hint';
          hint.textContent = '✏️';
          hint.style.cssText = 'position:absolute;left:46px;top:40px;font-size:0.85rem;background:#fff;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.2);pointer-events:none;';
          el.style.position = 'relative';
          el.appendChild(hint);
        }
      }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
