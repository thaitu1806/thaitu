// Học Vui — V22 "Đua Xe Tri Thức" sprite registry.
// Chibi turbo race cars with a goggled driver. Each species is an SVG
// (viewBox 0 0 100 100) with named <g>: .body, .head, .accent (wheels/turbo).
// Cars are drawn facing LEFT so the game's existing scaleX(-1) transform on
// .car-emoji flips them to face the direction of travel (right).
// Distinct from V6's racers.js — different ids (speedster-*) and a turbo theme.
// CSS in v22/style.css drives animation per state (idle / happy / boost).
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[speedsters.js] character.js must load first');
    return;
  }

  const OUT = '#1c1b29';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  // Reusable turbo race-car factory ───────────────────────────────────────
  // o: { body, trim, helmet, visor }
  function makeSpeedster(o) {
    return (
      '<svg viewBox="0 0 100 100" class="speedster" ' + STROKE + ' aria-hidden="true">' +
        '<g class="accent">' +
          '<circle class="wheel wheel-f" cx="26" cy="74" r="12" fill="#2b2b2b"/>' +
          '<circle class="hub hub-f" cx="26" cy="74" r="5" fill="' + o.trim + '"/>' +
          '<circle class="wheel wheel-r" cx="77" cy="74" r="12" fill="#2b2b2b"/>' +
          '<circle class="hub hub-r" cx="77" cy="74" r="5" fill="' + o.trim + '"/>' +
        '</g>' +
        '<g class="exhaust">' +
          '<path class="flame flame-a" d="M6 60 L18 56 L12 62 L20 62 L10 68 Z" fill="#ff9d2e"/>' +
          '<path class="flame flame-b" d="M10 62 L18 60 L14 64 Z" fill="#ffe14d"/>' +
        '</g>' +
        '<g class="body">' +
          '<path class="spoiler" d="M84 52 L98 40 L100 45 L90 56 Z" fill="' + o.trim + '"/>' +
          '<path d="M14 64 Q14 54 28 52 L42 52 Q47 38 60 38 Q72 38 74 52 L86 53 Q96 53 96 64 Q96 70 88 70 L20 70 Q14 70 14 64 Z" fill="' + o.body + '"/>' +
          '<path d="M44 52 Q48 42 59 42 Q68 42 70 52 Z" fill="#d8f3ff" opacity="0.92"/>' +
          '<circle class="light" cx="19" cy="61" r="3.2" fill="#fff6c2"/>' +
          '<rect class="stripe" x="30" y="60" width="46" height="5" rx="2.5" fill="' + o.trim + '" opacity="0.85"/>' +
          '<path class="bolt" d="M50 56 L46 62 L50 62 L47 67 L55 60 L51 60 Z" fill="#ffffff" opacity="0.9"/>' +
        '</g>' +
        '<g class="head">' +
          '<circle class="helmet" cx="58" cy="34" r="11.5" fill="' + o.helmet + '"/>' +
          '<path class="visor" d="M49 34 Q58 28 67 34 L67 38 Q58 35 49 38 Z" fill="' + o.visor + '"/>' +
          '<path class="crest" d="M52 23 Q58 19 64 23" stroke="' + o.trim + '" stroke-width="3" fill="none"/>' +
        '</g>' +
      '</svg>'
    );
  }

  // Trophy accent — for podium / winner flourishes if needed.
  const trophy =
    '<svg viewBox="0 0 100 100" class="trophy" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        '<path d="M30 24 Q18 24 18 36 Q18 46 30 46" fill="none" stroke="#e0a800" stroke-width="4"/>' +
        '<path d="M70 24 Q82 24 82 36 Q82 46 70 46" fill="none" stroke="#e0a800" stroke-width="4"/>' +
      '</g>' +
      '<g class="body">' +
        '<path d="M32 18 L68 18 L66 44 Q66 58 50 58 Q34 58 34 44 Z" fill="#ffd23f"/>' +
        '<rect x="44" y="58" width="12" height="14" fill="#e0a800"/>' +
        '<rect x="34" y="72" width="32" height="8" rx="2" fill="#c8920b"/>' +
      '</g>' +
      '<g class="head"><path class="shine" d="M44 26 Q50 24 56 26" stroke="#fff6c2" stroke-width="3" fill="none"/></g>' +
    '</svg>';

  const C = window.HocVuiCharacters;

  // Player + three bots — ids map to lane colors used in v22/style.css.
  C.registerSpecies('speedster-blue',  { svg: makeSpeedster({ body: '#4facfe', trim: '#00f2fe', helmet: '#2778c4', visor: '#1c1b29' }), classPrefix: 'speedster' });
  C.registerSpecies('speedster-red',   { svg: makeSpeedster({ body: '#ff6b6b', trim: '#ffd23f', helmet: '#d94343', visor: '#1c1b29' }), classPrefix: 'speedster' });
  C.registerSpecies('speedster-green', { svg: makeSpeedster({ body: '#4cd137', trim: '#ffffff', helmet: '#36a325', visor: '#1c1b29' }), classPrefix: 'speedster' });
  C.registerSpecies('speedster-gold',  { svg: makeSpeedster({ body: '#ffd700', trim: '#f0932b', helmet: '#d6a800', visor: '#1c1b29' }), classPrefix: 'speedster' });

  C.registerSpecies('trophy', { svg: trophy, classPrefix: 'trophy' });
})();
