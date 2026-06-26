// Học Vui — V29 "Đảo Hoang Sinh Tồn" sprite registry.
// Chibi castaway/survivor avatar + island mascots (crab + parrot). Each species
// is an SVG (viewBox 0 0 100 100) with named <g>: .body, .head, .accent.
// CSS in v29/style.css drives animation per state (idle / happy / scared).
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[castaways.js] character.js must load first');
    return;
  }

  const OUT = '#3d2a17';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.4" fill="' + OUT + '"/>';
  }

  // Main avatar — a cheerful shipwrecked survivor with a palm-leaf hat.
  const castaway =
    '<svg viewBox="0 0 100 100" class="castaway" ' + STROKE + ' aria-hidden="true">' +
      '<g class="body">' +
        '<rect x="40" y="70" width="8" height="18" rx="3" fill="#8a5a2b"/>' +
        '<rect x="52" y="70" width="8" height="18" rx="3" fill="#8a5a2b"/>' +
        '<path d="M33 48 Q50 42 67 48 L65 73 Q50 79 35 73 Z" fill="#efe2bf"/>' +
        '<path d="M37 56 H64 M37 64 H63" stroke="#c97b3a" stroke-width="3"/>' +
        '<g class="arm-l"><rect x="24" y="50" width="9" height="17" rx="4" fill="#e3a86f"/></g>' +
        '<g class="arm-r"><rect x="67" y="50" width="9" height="17" rx="4" fill="#e3a86f"/></g>' +
      '</g>' +
      '<g class="head">' +
        '<circle cx="50" cy="32" r="16" fill="#e3a86f"/>' +
        eye(44, 32) + eye(56, 32) +
        '<circle cx="40" cy="38" r="2.6" fill="#f0a878" stroke="none"/>' +
        '<circle cx="60" cy="38" r="2.6" fill="#f0a878" stroke="none"/>' +
        '<path class="mouth" d="M44 40 Q50 45 56 40" stroke="' + OUT + '" stroke-width="2.5" fill="none"/>' +
      '</g>' +
      '<g class="accent">' +
        '<path d="M33 22 Q50 14 67 22" fill="#6b4f2a"/>' +
        '<path d="M50 18 Q34 6 26 16 Q40 16 48 22 Z" fill="#3aa657"/>' +
        '<path d="M50 18 Q66 6 74 16 Q60 16 52 22 Z" fill="#2e8b57"/>' +
        '<path d="M50 16 Q50 2 58 8 Q52 12 52 20 Z" fill="#43b86b"/>' +
      '</g>' +
    '</svg>';

  // Island mascot — a friendly orange crab.
  const crab =
    '<svg viewBox="0 0 100 100" class="crab" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        '<path d="M30 60 L13 55 M30 68 L12 71 M70 60 L87 55 M70 68 L88 71" stroke="#d84727" stroke-width="3"/>' +
      '</g>' +
      '<g class="body">' +
        '<ellipse cx="50" cy="62" rx="26" ry="18" fill="#ff6b35"/>' +
        '<g class="claw-l"><path d="M26 54 Q13 47 9 56 Q12 63 21 60 Z" fill="#ff8c42"/></g>' +
        '<g class="claw-r"><path d="M74 54 Q87 47 91 56 Q88 63 79 60 Z" fill="#ff8c42"/></g>' +
      '</g>' +
      '<g class="head">' +
        '<path d="M42 47 L40 35 M58 47 L60 35" stroke="#d84727" stroke-width="3"/>' +
        '<circle cx="40" cy="33" r="5" fill="#fff"/><circle cx="60" cy="33" r="5" fill="#fff"/>' +
        eye(40, 33) + eye(60, 33) +
        '<path class="mouth" d="M44 66 Q50 71 56 66" stroke="#7a2410" stroke-width="2" fill="none"/>' +
      '</g>' +
    '</svg>';

  // Island mascot — a colourful parrot pal.
  const parrot =
    '<svg viewBox="0 0 100 100" class="parrot" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        '<path d="M58 72 L80 90 L66 70 Z" fill="#1e88e5"/>' +
        '<g class="wing"><path d="M48 50 Q30 54 36 74 Q50 68 54 56 Z" fill="#2e8b57"/></g>' +
      '</g>' +
      '<g class="body">' +
        '<ellipse cx="52" cy="56" rx="20" ry="24" fill="#ffd93d"/>' +
      '</g>' +
      '<g class="head">' +
        '<path d="M52 16 Q50 4 58 8 Q53 12 56 20 Z" fill="#ff8c42"/>' +
        '<circle cx="50" cy="30" r="14" fill="#e53935"/>' +
        eye(52, 28) +
        '<path d="M40 31 Q28 33 38 41 Q45 39 45 33 Z" fill="#ff8c42"/>' +
      '</g>' +
    '</svg>';

  const C = window.HocVuiCharacters;
  C.registerSpecies('castaway', { svg: castaway, classPrefix: 'castaway' });
  C.registerSpecies('crab', { svg: crab, classPrefix: 'crab' });
  C.registerSpecies('parrot', { svg: parrot, classPrefix: 'parrot' });
})();
