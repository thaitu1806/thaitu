// === Học Vui — Shared Mascot Companion ===
// A friendly buddy ("Bé Vui") that lives in the corner of every game, reacts to
// the child's answers (cheers when correct, gently encourages when wrong) and
// shows short speech bubbles. Pure inline SVG + CSS, no assets. It auto-reacts
// by observing the same .correct/.wrong feedback the sound system watches, so
// every game version gets a companion with zero per-game wiring.
(function () {
  'use strict';
  if (typeof window === 'undefined' || window.HocVuiMascot) return;

  const STORE_KEY = 'hocvui_mascot_on';
  let enabled = true;
  try { if (localStorage.getItem(STORE_KEY) === '0') enabled = false; } catch (e) {}

  // Don't show on non-game pages (home/admin/parent/etc). Only inside /vNN/,
  // game.html, learn.html, exam.html where a question flow exists.
  function isGamePage() {
    const p = location.pathname;
    if (/\/v\d+\//.test(p)) return true;
    return /\/(game|learn|exam)\.html$/.test(p) || /\/(game|learn|exam)$/.test(p);
  }

  // Cheerful + encouraging Vietnamese lines for a grade-2 audience.
  const CHEER = ['Giỏi quá! 🎉', 'Tuyệt vời! ⭐', 'Đúng rồi! 👏', 'Siêu ghê! 🌟', 'Hay lắm! 💪', 'Xuất sắc! 🏆'];
  const COMBO = ['Combo nè! 🔥', 'Liên tiếp luôn! ⚡', 'Đỉnh thật! 🚀'];
  const ENCOURAGE = ['Không sao đâu! 💛', 'Thử lại nha! 🤗', 'Cố lên nào! 🌈', 'Gần đúng rồi! 😊', 'Bình tĩnh nhé! 🍀'];
  const IDLE = ['Cùng học nào! 📚', 'Cố lên bạn ơi! 🌟'];

  let root = null, face = null, bubble = null, toggleBtn = null;
  let bubbleTimer = null, stateTimer = null;
  let streak = 0;

  // Mascot SVG — a round chibi sprout creature with big eyes. CSS targets the
  // named groups (.m-eye, .m-mouth, .m-cheek) to change expression per state.
  const SVG = `
  <svg viewBox="0 0 100 100" class="m-svg" aria-hidden="true">
    <ellipse class="m-shadow" cx="50" cy="92" rx="26" ry="6" fill="rgba(0,0,0,0.18)"/>
    <g class="m-leaf">
      <path d="M50 16 Q42 2 32 8 Q40 14 50 20 Z" fill="#5fce6b"/>
      <path d="M50 16 Q58 2 68 8 Q60 14 50 20 Z" fill="#49b857"/>
      <rect x="48.5" y="14" width="3" height="10" rx="1.5" fill="#3a9a47"/>
    </g>
    <circle class="m-body" cx="50" cy="56" r="32" fill="#ffd24d" stroke="#e8a91e" stroke-width="3"/>
    <circle class="m-belly" cx="50" cy="60" r="20" fill="#fff1c2"/>
    <g class="m-cheek"><circle cx="32" cy="60" r="5" fill="#ff9fdb" opacity="0.7"/><circle cx="68" cy="60" r="5" fill="#ff9fdb" opacity="0.7"/></g>
    <g class="m-eyes">
      <circle class="m-eye m-eye-l" cx="40" cy="50" r="6" fill="#3a2b1a"/>
      <circle class="m-eye m-eye-r" cx="60" cy="50" r="6" fill="#3a2b1a"/>
      <circle cx="42" cy="48" r="2" fill="#fff"/>
      <circle cx="62" cy="48" r="2" fill="#fff"/>
    </g>
    <path class="m-mouth" d="M42 64 Q50 72 58 64" fill="none" stroke="#3a2b1a" stroke-width="3" stroke-linecap="round"/>
    <g class="m-arms">
      <path class="m-arm-l" d="M20 58 Q10 54 12 46" fill="none" stroke="#e8a91e" stroke-width="5" stroke-linecap="round"/>
      <path class="m-arm-r" d="M80 58 Q90 54 88 46" fill="none" stroke="#e8a91e" stroke-width="5" stroke-linecap="round"/>
    </g>
  </svg>`;

  function injectStyles() {
    if (document.getElementById('hv-mascot-style')) return;
    const s = document.createElement('style');
    s.id = 'hv-mascot-style';
    s.textContent = `
    #hv-mascot { position: fixed; right: 8px; bottom: 80px; z-index: 2147482000; width: 88px; height: 104px; pointer-events: none; user-select: none; -webkit-user-select: none; }
    #hv-mascot .m-stage { position: absolute; bottom: 0; right: 0; width: 80px; height: 80px; pointer-events: auto; cursor: pointer; transition: transform .15s; }
    #hv-mascot .m-stage:active { transform: scale(0.92); }
    #hv-mascot .m-svg { width: 100%; height: 100%; display: block; filter: drop-shadow(0 4px 5px rgba(0,0,0,0.2)); animation: mIdle 2.8s ease-in-out infinite; transform-origin: 50% 90%; }
    @keyframes mIdle { 0%,100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-5px) rotate(-1.5deg); } }
    #hv-mascot.is-happy .m-svg { animation: mHappy .6s ease; }
    @keyframes mHappy { 0% { transform: translateY(0) scale(1); } 30% { transform: translateY(-16px) scale(1.08) rotate(-6deg); } 60% { transform: translateY(-4px) scale(1.02) rotate(4deg); } 100% { transform: translateY(0) scale(1); } }
    #hv-mascot.is-sad .m-svg { animation: mSad .7s ease; }
    @keyframes mSad { 0%,100% { transform: translateY(0); } 25% { transform: translateY(3px) rotate(-5deg); } 75% { transform: translateY(3px) rotate(5deg); } }
    #hv-mascot .m-arms { transform-origin: 50% 55%; }
    #hv-mascot.is-happy .m-arm-l, #hv-mascot.is-happy .m-arm-r { animation: mWave .3s ease 2 alternate; }
    @keyframes mWave { to { d: path('M20 58 Q10 48 16 40'); } }
    /* expression tweaks */
    #hv-mascot.is-happy .m-mouth { d: path('M40 62 Q50 76 60 62'); }
    #hv-mascot.is-sad .m-mouth { d: path('M42 70 Q50 62 58 70'); }
    #hv-mascot.is-sad .m-eye { r: 5px; }
    /* speech bubble */
    #hv-mascot .m-bubble {
      position: absolute; right: 4px; bottom: 84px; max-width: 160px; min-width: 64px;
      background: #fff; color: #333; font-family: 'Nunito', system-ui, sans-serif; font-weight: 800;
      font-size: 0.82rem; line-height: 1.25; padding: 8px 11px; border-radius: 14px;
      box-shadow: 0 6px 18px rgba(0,0,0,0.22); text-align: center;
      opacity: 0; transform: translateY(8px) scale(0.8); transform-origin: bottom right;
      transition: opacity .2s, transform .2s; pointer-events: none; white-space: normal;
    }
    #hv-mascot .m-bubble.show { opacity: 1; transform: translateY(0) scale(1); }
    #hv-mascot .m-bubble::after { content: ''; position: absolute; right: 22px; bottom: -7px; border: 8px solid transparent; border-top-color: #fff; border-bottom: 0; }
    #hv-mascot .m-bubble.good { background: #e8f9ec; color: #1f7a38; }
    #hv-mascot .m-bubble.good::after { border-top-color: #e8f9ec; }
    #hv-mascot .m-bubble.bad { background: #fff3e0; color: #b5651d; }
    #hv-mascot .m-bubble.bad::after { border-top-color: #fff3e0; }
    /* mascot mute/show toggle sits just above the sound toggle */
    #hv-mascot-toggle {
      position: fixed; left: 10px; bottom: 56px; z-index: 2147483000;
      width: 40px; height: 40px; border-radius: 50%; border: none;
      background: rgba(0,0,0,0.42); color: #fff; font-size: 1.1rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 3px 10px rgba(0,0,0,0.25); padding: 0; line-height: 1; opacity: 0.85;
      transition: transform .12s;
    }
    #hv-mascot-toggle:active { transform: scale(0.88); }
    @media (max-width: 360px) { #hv-mascot { width: 72px; height: 88px; } #hv-mascot .m-stage { width: 64px; height: 64px; } }
    `;
    document.head.appendChild(s);
  }

  function build() {
    if (root) return;
    injectStyles();
    root = document.createElement('div');
    root.id = 'hv-mascot';
    root.innerHTML = `<div class="m-bubble" id="hv-mascot-bubble"></div><div class="m-stage" id="hv-mascot-stage">${SVG}</div>`;
    document.body.appendChild(root);
    bubble = document.getElementById('hv-mascot-bubble');
    const stage = document.getElementById('hv-mascot-stage');
    stage.addEventListener('click', () => { setState('happy'); say(pick(IDLE), ''); if (window.HocVuiSound) window.HocVuiSound.play('click'); });

    toggleBtn = document.createElement('button');
    toggleBtn.id = 'hv-mascot-toggle';
    toggleBtn.type = 'button';
    toggleBtn.setAttribute('aria-label', 'Bật/tắt người bạn');
    toggleBtn.addEventListener('click', () => window.HocVuiMascot.toggle());
    document.body.appendChild(toggleBtn);
    applyVisibility();
  }

  function applyVisibility() {
    if (root) root.style.display = enabled ? 'block' : 'none';
    if (toggleBtn) { toggleBtn.textContent = enabled ? '🌱' : '🚫'; toggleBtn.style.opacity = enabled ? '0.85' : '0.6'; toggleBtn.title = enabled ? 'Ẩn người bạn' : 'Hiện người bạn'; }
  }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function setState(st) {
    if (!root) return;
    root.classList.remove('is-happy', 'is-sad');
    if (st === 'happy') root.classList.add('is-happy');
    else if (st === 'sad') root.classList.add('is-sad');
    clearTimeout(stateTimer);
    stateTimer = setTimeout(() => { if (root) root.classList.remove('is-happy', 'is-sad'); }, 1400);
  }

  function say(text, kind) {
    if (!bubble) return;
    bubble.textContent = text;
    bubble.className = 'm-bubble show' + (kind ? ' ' + kind : '');
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => { bubble.className = 'm-bubble'; }, 2200);
  }

  // Public API
  window.HocVuiMascot = {
    cheer() { streak++; setState('happy'); say(streak >= 3 ? pick(COMBO) : pick(CHEER), 'good'); },
    encourage() { streak = 0; setState('sad'); say(pick(ENCOURAGE), 'bad'); },
    say(text, kind) { say(text, kind || ''); },
    setState,
    isOn: () => enabled,
    setOn(on) { enabled = !!on; try { localStorage.setItem(STORE_KEY, enabled ? '1' : '0'); } catch (e) {} applyVisibility(); },
    toggle() { this.setOn(!enabled); },
  };

  // Auto-react by observing the same answer-feedback classes as the sound system.
  const seen = new WeakSet();
  function reactTo(el) {
    if (!enabled || !(el instanceof HTMLElement) || seen.has(el)) return;
    const cls = el.className || '';
    if (!/option|opt|to-btn|answer|choice|btn/.test(cls)) return;
    if (/\bcorrect\b/.test(cls)) { seen.add(el); window.HocVuiMascot.cheer(); }
    else if (/\bwrong\b/.test(cls)) { seen.add(el); window.HocVuiMascot.encourage(); }
  }
  const mo = new MutationObserver((muts) => {
    if (!enabled) return;
    for (const m of muts) {
      if (m.type === 'attributes' && m.target) reactTo(m.target);
      if (m.type === 'childList') m.addedNodes.forEach((n) => {
        if (n.nodeType !== 1) return;
        reactTo(n);
        n.querySelectorAll && n.querySelectorAll('.correct,.wrong').forEach(reactTo);
      });
    }
  });

  function init() {
    if (!isGamePage()) return;
    build();
    try { mo.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] }); } catch (e) {}
    // a friendly greeting shortly after entering a game
    setTimeout(() => { if (enabled) say('Chào bạn! Cùng học nha! 👋', ''); }, 900);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
