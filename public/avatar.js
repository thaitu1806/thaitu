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
  function getAvatar() { try { return localStorage.getItem(key()) || '🧒'; } catch (e) { return '🧒'; } }
  function setAvatar(a) { try { localStorage.setItem(key(), a); } catch (e) {} }

  // need = lifetime correct answers required to unlock.
  const AVATARS = [
    { e: '🧒', n: 'Bé Trai', need: 0 },
    { e: '👧', n: 'Bé Gái', need: 0 },
    { e: '🧑', n: 'Bạn Nhỏ', need: 0 },
    { e: '🐱', n: 'Mèo Con', need: 10 },
    { e: '🐶', n: 'Cún Yêu', need: 10 },
    { e: '🐰', n: 'Thỏ Ngọc', need: 25 },
    { e: '🦊', n: 'Cáo Nhanh', need: 25 },
    { e: '🐼', n: 'Gấu Trúc', need: 50 },
    { e: '🦁', n: 'Sư Tử', need: 50 },
    { e: '🐯', n: 'Hổ Dũng', need: 80 },
    { e: '🦉', n: 'Cú Thông Thái', need: 120 },
    { e: '🦄', n: 'Kỳ Lân', need: 180 },
    { e: '🐲', n: 'Rồng Nhí', need: 260 },
    { e: '🤖', n: 'Robot', need: 350 },
    { e: '👑', n: 'Hoàng Tử/Công Chúa', need: 500 },
  ];

  function lifetime() { try { return (window.HocVuiProgress && window.HocVuiProgress.lifetimeCorrect) || 0; } catch (e) { return 0; } }
  function isUnlocked(a) { return lifetime() >= a.need; }

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
    .hv-av-cell .av-e { font-size: 2.1rem; line-height: 1; }
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
    const cur = getAvatar();
    const life = lifetime();
    const cells = AVATARS.map(a => {
      const unlocked = life >= a.need;
      if (!unlocked) {
        return `<div class="hv-av-cell locked"><span class="av-e">${a.e}</span><span class="av-n">${a.n}</span>
          <span class="hv-av-lock"><span class="lk-ic">🔒</span>${a.need} câu</span></div>`;
      }
      return `<div class="hv-av-cell ${a.e === cur ? 'sel' : ''}" data-av="${a.e}"><span class="av-e">${a.e}</span><span class="av-n">${a.n}</span></div>`;
    }).join('');
    overlay.innerHTML = `
      <div class="hv-av-card">
        <div class="hv-av-head"><h2>🧑 Chọn Nhân Vật</h2><button class="hv-av-close" id="hv-av-close">✕</button></div>
        <div class="hv-av-sub">Trả lời đúng nhiều câu để mở khóa thêm nhân vật! (Đã đúng: ${life} câu)</div>
        <div class="hv-av-grid">${cells}</div>
      </div>`;
    overlay.classList.add('show');
    document.getElementById('hv-av-close').addEventListener('click', () => overlay.classList.remove('show'));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('show'); });
    overlay.querySelectorAll('.hv-av-cell[data-av]').forEach(cell => {
      cell.addEventListener('click', () => {
        const e = cell.dataset.av;
        setAvatar(e);
        apply();
        if (window.HocVuiSound) window.HocVuiSound.play('coin');
        overlay.classList.remove('show');
      });
    });
  }

  function apply() {
    const el = document.getElementById('hero-avatar');
    if (el) el.textContent = getAvatar();
  }

  window.HocVuiAvatar = { open, get: getAvatar, set(a) { setAvatar(a); apply(); }, apply };

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
