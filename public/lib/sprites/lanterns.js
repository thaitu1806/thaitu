// Học Vui — V52 "Lễ Hội Trung Thu" sprite registry.
// Chibi paper-lantern characters, one per LANTERN_COLOR in v52/game-logic.js
// (ids: lantern-red / lantern-orange / lantern-yellow / lantern-pink / lantern-cyan),
// plus an optional smiling moon for the #moon spot.
// Each species is an SVG (viewBox 0 0 100 100) with named <g>: .body, .head, .accent
// (and .glow / .tassel where applicable). CSS in v52/style.css drives the
// idle (gentle glow + sway) and happy (bright bob) states.
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[lanterns.js] character.js must load first');
    return;
  }

  const OUT = '#3a0a4a';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"';

  // Reusable bits ────────────────────────────────────────────────────────
  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="3" fill="' + OUT + '"/>' +
           '<circle cx="' + (cx + 1) + '" cy="' + (cy - 1) + '" r="1" fill="#fff"/>';
  }
  function smile() {
    return '<path class="mouth" d="M43 50 Q50 57 57 50" stroke="' + OUT + '" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
  }
  function blush(tint) {
    return '<circle cx="37" cy="50" r="3.4" fill="' + tint + '" opacity="0.55"/>' +
           '<circle cx="63" cy="50" r="3.4" fill="' + tint + '" opacity="0.55"/>';
  }

  // Main lantern factory ───────────────────────────────────────────────────
  // opts: { color, light, glow, blush }
  //  color = main paper color, light = lighter inner gradient stop,
  //  glow  = soft halo color, blush = cheek tint.
  function makeLantern(o) {
    return (
      '<svg viewBox="0 0 100 100" class="lantern" ' + STROKE + ' aria-hidden="true">' +
        // halo glow behind everything
        '<g class="glow"><ellipse cx="50" cy="47" rx="34" ry="38" fill="' + o.glow + '" opacity="0.35" stroke="none"/></g>' +
        // hanging string + loop on top
        '<g class="accent accent-top">' +
          '<path d="M50 4 L50 16" stroke="' + OUT + '" stroke-width="2"/>' +
          '<circle cx="50" cy="6" r="3" fill="none" stroke="' + OUT + '" stroke-width="2"/>' +
        '</g>' +
        // lantern frame + paper body
        '<g class="body">' +
          '<rect x="35" y="15" width="30" height="7" rx="3" fill="' + o.color + '"/>' +
          '<path d="M33 25 Q17 47 33 71 L67 71 Q83 47 67 25 Z" fill="' + o.color + '"/>' +
          '<path d="M33 25 Q17 47 33 71 L67 71 Q83 47 67 25 Z" fill="' + o.light + '" opacity="0.45" stroke="none"/>' +
          // vertical ribs
          '<path class="rib" d="M50 24 L50 72" stroke="' + OUT + '" stroke-width="1.4" fill="none" opacity="0.55"/>' +
          '<path class="rib" d="M42 25 Q37 48 42 71" stroke="' + OUT + '" stroke-width="1.4" fill="none" opacity="0.45"/>' +
          '<path class="rib" d="M58 25 Q63 48 58 71" stroke="' + OUT + '" stroke-width="1.4" fill="none" opacity="0.45"/>' +
          '<rect x="40" y="71" width="20" height="6" rx="2.5" fill="' + o.color + '"/>' +
        '</g>' +
        // cute face
        '<g class="head">' + eye(43, 44) + eye(57, 44) + smile() + blush(o.blush) + '</g>' +
        // tassel under the lantern
        '<g class="accent tassel">' +
          '<path d="M50 77 L50 84" stroke="' + OUT + '" stroke-width="2"/>' +
          '<path d="M45 84 L45 94 M50 84 L50 96 M55 84 L55 94" stroke="' + o.color + '" stroke-width="2.4"/>' +
          '<circle cx="50" cy="84" r="2.6" fill="' + o.color + '"/>' +
        '</g>' +
      '</svg>'
    );
  }

  // Smiling moon for the #moon spot (optional). Named groups match lanterns.
  const moonChar =
    '<svg viewBox="0 0 100 100" class="moon-char" ' + STROKE + ' aria-hidden="true">' +
      '<g class="glow"><circle cx="50" cy="50" r="40" fill="#fff59d" opacity="0.35" stroke="none"/></g>' +
      '<g class="body"><circle cx="50" cy="50" r="32" fill="#fff176"/>' +
        '<circle cx="36" cy="38" r="5" fill="#ffe082" opacity="0.7" stroke="none"/>' +
        '<circle cx="64" cy="60" r="6.5" fill="#ffe082" opacity="0.7" stroke="none"/>' +
        '<circle cx="58" cy="32" r="3.5" fill="#ffe082" opacity="0.7" stroke="none"/></g>' +
      '<g class="head">' + eye(40, 48) + eye(60, 48) +
        '<path class="mouth" d="M40 60 Q50 70 60 60" stroke="' + OUT + '" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
        blush('#ff8a65') + '</g>' +
      '<g class="accent"><path d="M78 22 L80 16 L82 22 L88 24 L82 26 L80 32 L78 26 L72 24 Z" fill="#fff59d"/></g>' +
    '</svg>';

  const C = window.HocVuiCharacters;

  // One chibi lantern per LANTERN_COLOR (ids MUST match game-logic.js colors).
  C.registerSpecies('lantern-red',    { svg: makeLantern({ color: '#ff5252', light: '#ff8a80', glow: '#ff8a80', blush: '#b71c1c' }), classPrefix: 'lantern-red' });
  C.registerSpecies('lantern-orange', { svg: makeLantern({ color: '#ff9800', light: '#ffcc80', glow: '#ffcc80', blush: '#e65100' }), classPrefix: 'lantern-orange' });
  C.registerSpecies('lantern-yellow', { svg: makeLantern({ color: '#ffeb3b', light: '#fff59d', glow: '#fff59d', blush: '#f9a825' }), classPrefix: 'lantern-yellow' });
  C.registerSpecies('lantern-pink',   { svg: makeLantern({ color: '#f48fb1', light: '#f8bbd0', glow: '#f8bbd0', blush: '#ad1457' }), classPrefix: 'lantern-pink' });
  C.registerSpecies('lantern-cyan',   { svg: makeLantern({ color: '#4fc3f7', light: '#b3e5fc', glow: '#b3e5fc', blush: '#0277bd' }), classPrefix: 'lantern-cyan' });

  // Optional smiling moon.
  C.registerSpecies('moon', { svg: moonChar, classPrefix: 'moon-char' });
})();
