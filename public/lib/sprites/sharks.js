// Học Vui — V44 "Vũ Trụ Cá Mập" shark / sea-racer sprite registry.
// Chibi shark & sea-creature racers plus one menacing boss creature.
// Each species is an SVG (viewBox 0 0 100 100) with named <g>:
//   .body, .head, .tail, .accent (so CSS can wag the tail / bob the body).
// CSS in v44/style.css drives animation per state (idle / happy / scared).
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[sharks.js] character.js must load first');
    return;
  }

  const OUT = '#0a1f3a';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  // Reusable bits ────────────────────────────────────────────────────────
  function eye(cx, cy, r) {
    r = r || 3;
    return (
      '<g class="eye">' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#fff" stroke="' + OUT + '" stroke-width="1.2"/>' +
        '<circle class="pupil" cx="' + (cx + 0.6) + '" cy="' + cy + '" r="' + (r * 0.5) + '" fill="' + OUT + '"/>' +
      '</g>'
    );
  }
  function smile(d) {
    return '<path class="mouth" d="' + d + '" stroke="' + OUT + '" stroke-width="2" fill="none" stroke-linecap="round"/>';
  }
  function bubbles() {
    return (
      '<g class="bubbles">' +
        '<circle cx="14" cy="40" r="3" fill="#bfe9ff" opacity="0.8"/>' +
        '<circle cx="10" cy="52" r="2" fill="#bfe9ff" opacity="0.7"/>' +
        '<circle cx="18" cy="58" r="2.4" fill="#bfe9ff" opacity="0.6"/>' +
      '</g>'
    );
  }

  // Generic shark factory ─────────────────────────────────────────────────
  // Faces RIGHT (direction of travel). opts: { body, belly, fin, teeth }
  function makeShark(o) {
    const teeth = o.teeth
      ? '<path d="M70 56 L73 60 L76 56 L79 60 L82 56" stroke="#fff" stroke-width="1.4" fill="#fff"/>'
      : '';
    return (
      '<svg viewBox="0 0 100 100" class="shk" ' + STROKE + ' aria-hidden="true">' +
        '<g class="tail">' +
          '<path d="M22 52 L6 40 L12 52 L6 64 Z" fill="' + o.body + '"/>' +
        '</g>' +
        '<g class="body">' +
          '<path d="M20 52 Q40 34 78 44 Q92 48 92 54 Q92 60 78 64 Q40 74 20 52 Z" fill="' + o.body + '"/>' +
          '<path d="M30 58 Q52 70 80 60 Q60 68 36 62 Z" fill="' + o.belly + '"/>' +
        '</g>' +
        '<g class="accent">' +
          '<path d="M44 40 L54 22 L58 42 Z" fill="' + o.fin + '"/>' +
          '<path d="M40 60 L46 74 L52 60 Z" fill="' + o.fin + '"/>' +
          '<path d="M40 54 L52 54" stroke="' + OUT + '" stroke-width="1.4" opacity="0.5"/>' +
        '</g>' +
        '<g class="head">' +
          eye(78, 50, 3.4) +
          smile('M74 58 Q80 62 86 57') + teeth +
        '</g>' +
        bubbles() +
      '</svg>'
    );
  }

  // Hammerhead — wide T-shaped head ─────────────────────────────────────────
  const hammerhead =
    '<svg viewBox="0 0 100 100" class="shk shk-hammer" ' + STROKE + ' aria-hidden="true">' +
      '<g class="tail"><path d="M20 54 L6 42 L12 54 L6 66 Z" fill="#4a6fa5"/></g>' +
      '<g class="body"><path d="M18 54 Q40 38 72 48 Q86 52 84 58 Q60 70 30 64 Q18 60 18 54 Z" fill="#4a6fa5"/>' +
        '<path d="M30 60 Q50 68 76 58 Q56 66 34 62 Z" fill="#cfe0f5"/></g>' +
      '<g class="accent"><path d="M42 44 L50 28 L56 46 Z" fill="#37557f"/>' +
        '<path d="M38 60 L44 72 L50 60 Z" fill="#37557f"/></g>' +
      '<g class="head"><path d="M70 40 Q92 40 92 50 Q92 64 70 62 Q62 58 62 52 Q62 44 70 40 Z" fill="#4a6fa5"/>' +
        '<rect x="72" y="38" width="6" height="8" rx="2" fill="#4a6fa5"/>' +
        '<rect x="72" y="58" width="6" height="8" rx="2" fill="#4a6fa5"/>' +
        eye(75, 40, 2.6) + eye(75, 64, 2.6) +
        smile('M80 54 Q85 58 90 53') + '</g>' +
      bubbles() +
    '</svg>';

  // Orca — black & white killer whale ───────────────────────────────────────
  const orca =
    '<svg viewBox="0 0 100 100" class="shk shk-orca" ' + STROKE + ' aria-hidden="true">' +
      '<g class="tail"><path d="M20 54 L4 44 L12 54 L4 64 Z" fill="#1c2733"/></g>' +
      '<g class="body"><path d="M18 54 Q42 36 80 46 Q92 50 92 56 Q92 62 80 66 Q42 74 18 54 Z" fill="#1c2733"/>' +
        '<path d="M34 60 Q56 72 84 60 Q60 70 38 64 Z" fill="#fff"/>' +
        '<ellipse cx="74" cy="50" rx="6" ry="3.4" fill="#fff"/></g>' +
      '<g class="accent"><path d="M44 40 L52 24 L58 42 Z" fill="#0f1822"/></g>' +
      '<g class="head">' + eye(80, 52, 3.2) + smile('M78 60 Q83 64 89 59') + '</g>' +
      bubbles() +
    '</svg>';

  // Whale — round friendly racer ────────────────────────────────────────────
  const whale =
    '<svg viewBox="0 0 100 100" class="shk shk-whale" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent"><path d="M70 30 Q70 18 64 14 M70 30 Q72 18 78 16" stroke="#9fd8ff" stroke-width="3" fill="none"/></g>' +
      '<g class="tail"><path d="M18 56 L4 46 L12 56 L4 66 Z" fill="#3f8fd0"/></g>' +
      '<g class="body"><path d="M16 56 Q40 36 78 50 Q90 55 78 64 Q44 76 16 56 Z" fill="#3f8fd0"/>' +
        '<path d="M28 62 Q52 72 78 62 Q56 70 32 65 Z" fill="#d6efff"/></g>' +
      '<g class="head">' + eye(74, 52, 3.4) + smile('M70 60 Q77 66 84 59') + '</g>' +
      bubbles() +
    '</svg>';

  // Rocket sub — a tiny submarine racer (space-ocean crossover) ──────────────
  const sub =
    '<svg viewBox="0 0 100 100" class="shk shk-sub" ' + STROKE + ' aria-hidden="true">' +
      '<g class="tail"><path d="M20 52 L8 42 L14 52 L8 62 Z" fill="#ff8a5c"/>' +
        '<path d="M16 50 L10 48 M16 56 L10 58" stroke="#ff8a5c" stroke-width="3"/></g>' +
      '<g class="body"><rect x="22" y="42" width="60" height="22" rx="11" fill="#ffb347"/>' +
        '<path d="M22 53 L82 53" stroke="' + OUT + '" stroke-width="1.2" opacity="0.4"/></g>' +
      '<g class="accent"><rect x="46" y="30" width="10" height="12" rx="3" fill="#ff8a5c"/>' +
        '<circle cx="40" cy="53" r="4" fill="#bfe9ff" stroke="' + OUT + '" stroke-width="1.5"/>' +
        '<circle cx="56" cy="53" r="4" fill="#bfe9ff" stroke="' + OUT + '" stroke-width="1.5"/></g>' +
      '<g class="head"><circle cx="72" cy="53" r="7" fill="#bfe9ff" stroke="' + OUT + '" stroke-width="1.8"/>' +
        eye(72, 53, 2.6) + '</g>' +
      bubbles() +
    '</svg>';

  // Boss — Kraken / giant deep-sea menace (shown in boss phase) ──────────────
  const kraken =
    '<svg viewBox="0 0 100 100" class="shk shk-boss" ' + STROKE + ' aria-hidden="true">' +
      '<g class="tail arms">' +
        '<path class="tentacle t1" d="M40 64 Q28 78 16 74 Q26 84 38 80" fill="none" stroke="#6a2bb0" stroke-width="7" stroke-linecap="round"/>' +
        '<path class="tentacle t2" d="M52 70 Q48 88 36 90 Q50 92 58 82" fill="none" stroke="#7e34cc" stroke-width="7" stroke-linecap="round"/>' +
        '<path class="tentacle t3" d="M64 68 Q72 86 84 86 Q72 92 60 84" fill="none" stroke="#6a2bb0" stroke-width="7" stroke-linecap="round"/>' +
        '<path class="tentacle t4" d="M74 60 Q88 70 90 58 Q92 72 78 72" fill="none" stroke="#7e34cc" stroke-width="7" stroke-linecap="round"/>' +
      '</g>' +
      '<g class="body"><path d="M30 50 Q30 22 54 22 Q78 22 78 50 Q78 66 54 68 Q30 66 30 50 Z" fill="#8e3ee0"/>' +
        '<path d="M40 30 Q54 24 68 30" stroke="#c79bff" stroke-width="2" fill="none" opacity="0.6"/></g>' +
      '<g class="accent">' +
        '<circle cx="44" cy="14" r="3" fill="#ff4d6d"/>' +
        '<circle cx="64" cy="14" r="3" fill="#ff4d6d"/>' +
        '<path d="M44 14 L44 22 M64 14 L64 22" stroke="#6a2bb0" stroke-width="2"/></g>' +
      '<g class="head">' +
        '<circle cx="46" cy="46" r="6.5" fill="#fff" stroke="' + OUT + '" stroke-width="1.4"/>' +
        '<circle cx="62" cy="46" r="6.5" fill="#fff" stroke="' + OUT + '" stroke-width="1.4"/>' +
        '<circle class="pupil" cx="47" cy="47" r="3.2" fill="#ff1744"/>' +
        '<circle class="pupil" cx="63" cy="47" r="3.2" fill="#ff1744"/>' +
        '<path d="M40 58 L46 54 L52 58 L58 54 L64 58" stroke="' + OUT + '" stroke-width="2" fill="none"/></g>' +
    '</svg>';

  const C = window.HocVuiCharacters;

  // Shark / sea-racer pool (picked at random each run).
  C.registerSpecies('shark-blue',  { svg: makeShark({ body: '#2e7dd6', belly: '#d6efff', fin: '#1f5aaa', teeth: true }), classPrefix: 'shk-blue' });
  C.registerSpecies('shark-cyan',  { svg: makeShark({ body: '#17b8c4', belly: '#d4fbff', fin: '#0e8a93', teeth: true }), classPrefix: 'shk-cyan' });
  C.registerSpecies('shark-violet',{ svg: makeShark({ body: '#7a5cff', belly: '#e4ddff', fin: '#5a3edb', teeth: true }), classPrefix: 'shk-violet' });
  C.registerSpecies('hammerhead',  { svg: hammerhead, classPrefix: 'shk-hammer' });
  C.registerSpecies('orca',        { svg: orca,       classPrefix: 'shk-orca' });
  C.registerSpecies('whale',       { svg: whale,      classPrefix: 'shk-whale' });
  C.registerSpecies('sub',         { svg: sub,        classPrefix: 'shk-sub' });

  // Boss creature.
  C.registerSpecies('kraken',      { svg: kraken,     classPrefix: 'shk-boss' });
})();
