// === Học Vui — Shared Sound System ===
// Synthesizes child-friendly sound effects with the Web Audio API (no audio
// files, zero bandwidth). Auto-plays "correct"/"wrong"/"win" cues by observing
// the DOM across every game version, and exposes window.HocVuiSound for manual
// triggers. A floating 🔊/🔇 button lets kids (or parents) mute; the choice is
// stored in localStorage and respected on every page.
(function () {
  'use strict';
  if (typeof window === 'undefined' || window.HocVuiSound) return;

  const STORE_KEY = 'hocvui_sound_on';
  let enabled = true;
  try { const v = localStorage.getItem(STORE_KEY); if (v === '0') enabled = false; } catch (e) {}

  let ctx = null;
  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    // iOS/Chrome suspend until a user gesture; resume opportunistically.
    if (ctx.state === 'suspended') { ctx.resume().catch(() => {}); }
    return ctx;
  }

  // Play one tone. type: sine/triangle/square/sawtooth.
  function tone(freq, start, dur, { type = 'sine', vol = 0.18, slideTo = null } = {}) {
    const a = ac(); if (!a) return;
    const t0 = a.currentTime + start;
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    // gentle attack + release so it never clicks/pops harshly
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain); gain.connect(a.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }

  // Short noise burst (for "pop"/sparkle textures).
  function noise(start, dur, vol = 0.12) {
    const a = ac(); if (!a) return;
    const t0 = a.currentTime + start;
    const len = Math.floor(a.sampleRate * dur);
    const buf = a.createBuffer(1, len, a.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = a.createBufferSource(); src.buffer = buf;
    const gain = a.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(gain); gain.connect(a.destination);
    src.start(t0); src.stop(t0 + dur);
  }

  // --- Named effects (cheerful, kid-friendly) ---
  const FX = {
    correct() { // rising happy two-note "ting-ling"
      tone(660, 0, 0.12, { type: 'sine', vol: 0.2 });
      tone(880, 0.09, 0.18, { type: 'sine', vol: 0.2 });
      tone(1320, 0.18, 0.16, { type: 'triangle', vol: 0.12 });
    },
    wrong() { // gentle descending "boop" — not harsh, never scary
      tone(300, 0, 0.16, { type: 'triangle', vol: 0.16, slideTo: 180 });
      tone(200, 0.14, 0.18, { type: 'sine', vol: 0.12, slideTo: 140 });
    },
    click() {
      tone(520, 0, 0.05, { type: 'square', vol: 0.08 });
    },
    combo() { // quick sparkle arpeggio for streaks
      [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.06, 0.12, { type: 'triangle', vol: 0.14 }));
      noise(0.05, 0.18, 0.06);
    },
    win() { // little victory fanfare
      const notes = [523, 659, 784, 1047, 1319];
      notes.forEach((f, i) => tone(f, i * 0.12, 0.25, { type: 'triangle', vol: 0.2 }));
      tone(1568, 0.6, 0.5, { type: 'sine', vol: 0.16 });
      noise(0.0, 0.25, 0.05);
    },
    lose() { // soft "aww", encouraging not punishing
      tone(440, 0, 0.2, { type: 'sine', vol: 0.16, slideTo: 330 });
      tone(330, 0.18, 0.3, { type: 'sine', vol: 0.14, slideTo: 247 });
    },
    star() { // a single bright sparkle (per star earned)
      tone(1047, 0, 0.1, { type: 'triangle', vol: 0.16 });
      tone(1568, 0.07, 0.16, { type: 'sine', vol: 0.12 });
    },
    coin() {
      tone(988, 0, 0.07, { type: 'square', vol: 0.12 });
      tone(1319, 0.06, 0.12, { type: 'square', vol: 0.12 });
    },
  };

  function play(name) {
    if (!enabled) return;
    const fn = FX[name];
    if (fn) { try { fn(); } catch (e) {} }
  }

  // --- Public API ---
  window.HocVuiSound = {
    play,
    isOn: () => enabled,
    setOn(on) {
      enabled = !!on;
      try { localStorage.setItem(STORE_KEY, enabled ? '1' : '0'); } catch (e) {}
      updateBtn();
      if (enabled) { ac(); play('click'); }
    },
    toggle() { this.setOn(!enabled); },
    // expose primitives for advanced per-game use
    tone, noise,
  };

  // --- Auto-play by observing answer feedback across all games ---
  // Games mark the chosen/correct option button with `.correct` / `.wrong`
  // (and various result classes). We watch for those classes appearing.
  const seen = new WeakSet();
  function reactTo(el) {
    if (!(el instanceof HTMLElement) || seen.has(el)) return;
    const cls = el.className || '';
    if (/\bcorrect\b/.test(cls) && /option|opt|to-btn|answer|choice|btn/.test(cls)) {
      seen.add(el); play('correct');
    } else if (/\bwrong\b/.test(cls) && /option|opt|to-btn|answer|choice|btn/.test(cls)) {
      seen.add(el); play('wrong');
    }
  }
  const mo = new MutationObserver((muts) => {
    if (!enabled) return;
    for (const m of muts) {
      if (m.type === 'attributes' && m.target) reactTo(m.target);
      if (m.type === 'childList') {
        m.addedNodes.forEach((n) => {
          if (n.nodeType !== 1) return;
          reactTo(n);
          n.querySelectorAll && n.querySelectorAll('.correct,.wrong').forEach(reactTo);
        });
      }
    }
  });
  function startObserving() {
    try {
      mo.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
    } catch (e) {}
    // Reset the per-question "seen" markers when a new question loads: clearing
    // is handled implicitly because option buttons are re-created each question.
  }

  // Resume the audio context + a soft click on the very first user gesture
  // (mobile browsers require this).
  function primeAudio() {
    ac();
    document.removeEventListener('pointerdown', primeAudio);
    document.removeEventListener('keydown', primeAudio);
  }

  // --- Floating mute toggle button ---
  let btn = null;
  function updateBtn() {
    if (!btn) return;
    btn.textContent = enabled ? '🔊' : '🔇';
    btn.classList.toggle('off', !enabled);
    btn.title = enabled ? 'Tắt âm thanh' : 'Bật âm thanh';
  }
  function makeBtn() {
    if (btn) return;
    btn = document.createElement('button');
    btn.id = 'hv-sound-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Bật/tắt âm thanh');
    btn.style.cssText = [
      'position:fixed', 'left:10px', 'bottom:10px', 'z-index:2147483000',
      'width:40px', 'height:40px', 'border-radius:50%', 'border:none',
      'background:rgba(0,0,0,0.42)', 'color:#fff', 'font-size:1.15rem',
      'cursor:pointer', 'display:flex', 'align-items:center', 'justify-content:center',
      'box-shadow:0 3px 10px rgba(0,0,0,0.25)', 'backdrop-filter:blur(4px)',
      'padding:0', 'line-height:1', 'transition:transform .12s,opacity .2s', 'opacity:0.85',
    ].join(';');
    btn.addEventListener('click', () => { btn.style.transform = 'scale(0.88)'; setTimeout(() => btn.style.transform = '', 120); window.HocVuiSound.toggle(); });
    btn.addEventListener('mouseenter', () => { btn.style.opacity = '1'; });
    btn.addEventListener('mouseleave', () => { btn.style.opacity = '0.85'; });
    document.body.appendChild(btn);
    updateBtn();
  }

  function init() {
    makeBtn();
    startObserving();
    document.addEventListener('pointerdown', primeAudio, { once: false });
    document.addEventListener('keydown', primeAudio, { once: false });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
