// Học Vui — V27 "Lớp Học Phép Thuật" sprite registry.
// Chibi young wizard/witch student (pointed hat + wand) plus an owl familiar.
// Each species is an SVG (viewBox 0 0 100 100) with named <g>: .body, .head, .accent.
// CSS in v27/style.css drives animation per state (idle / happy).
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[wizards.js] character.js must load first');
    return;
  }

  const OUT = '#2a1148';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.4" fill="' + OUT + '"/>';
  }

  // Main player avatar — a cheerful chibi wizard student with hat + wand.
  const wizard =
    '<svg viewBox="0 0 100 100" class="wizard" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        '<line x1="64" y1="72" x2="90" y2="40" stroke="#9c6b3c" stroke-width="4"/>' +
        '<path class="wand-star" d="M90 28 l2.6 6 6.5 .5 -5 4.3 1.6 6.4 -5.7 -3.6 -5.7 3.6 1.6 -6.4 -5 -4.3 6.5 -.5 z" fill="#ffd700"/>' +
      '</g>' +
      '<g class="body">' +
        '<path d="M30 94 Q32 64 50 60 Q68 64 70 94 Z" fill="#7c3aed"/>' +
        '<path d="M42 62 Q50 70 58 62" fill="#a855f7"/>' +
        '<rect x="38" y="79" width="24" height="6" rx="3" fill="#ffd700"/>' +
        '<path class="arm" d="M31 70 Q25 79 29 87 L37 83 Q35 75 40 71 Z" fill="#6d28d9"/>' +
        '<path class="arm-wand" d="M60 69 Q71 70 69 79 L61 81 Q59 73 56 70 Z" fill="#6d28d9"/>' +
      '</g>' +
      '<g class="head">' +
        '<circle cx="50" cy="50" r="14" fill="#ffe0bd"/>' +
        eye(45, 49) + eye(56, 49) +
        '<circle cx="40" cy="54" r="2.4" fill="#ffb3c6"/>' +
        '<circle cx="61" cy="54" r="2.4" fill="#ffb3c6"/>' +
        '<path class="mouth" d="M45 56 Q50 61 56 56" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
        '<path class="hat" d="M28 38 Q50 32 72 38 L54 6 Q50 2 46 6 Z" fill="#5b21b6"/>' +
        '<ellipse class="brim" cx="50" cy="38" rx="25" ry="6" fill="#6d28d9"/>' +
        '<path d="M31 36 Q50 32 69 36" stroke="#ffd700" stroke-width="3" fill="none"/>' +
        '<path class="hat-star" d="M50 13 l1.8 4.3 4.7 .3 -3.6 3 1.2 4.6 -4.1 -2.6 -4.1 2.6 1.2 -4.6 -3.6 -3 4.7 -.3 z" fill="#ffd700"/>' +
      '</g>' +
    '</svg>';

  // Familiar mascot — a round owl with big eyes and a tiny hat tuft.
  const owl =
    '<svg viewBox="0 0 100 100" class="owl" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        '<path d="M34 30 L30 15 L43 26 Z" fill="#8b5e34"/>' +
        '<path d="M66 30 L70 15 L57 26 Z" fill="#8b5e34"/>' +
        '<path d="M42 84 L38 93 M48 85 L48 94 M52 85 L52 94 M58 84 L62 93" stroke="#ffb703" stroke-width="3"/>' +
      '</g>' +
      '<g class="body">' +
        '<ellipse cx="50" cy="56" rx="26" ry="28" fill="#a86b3c"/>' +
        '<ellipse cx="50" cy="62" rx="15" ry="18" fill="#f0d6ad"/>' +
        '<path class="wing" d="M24 50 Q19 64 30 75 Q25 60 30 50 Z" fill="#8b5e34"/>' +
        '<path class="wing" d="M76 50 Q81 64 70 75 Q75 60 70 50 Z" fill="#8b5e34"/>' +
      '</g>' +
      '<g class="head">' +
        '<circle cx="40" cy="45" r="11" fill="#fff"/>' +
        '<circle cx="60" cy="45" r="11" fill="#fff"/>' +
        '<circle class="eye" cx="40" cy="45" r="5" fill="' + OUT + '"/>' +
        '<circle class="eye" cx="60" cy="45" r="5" fill="' + OUT + '"/>' +
        '<circle cx="42" cy="43" r="1.6" fill="#fff"/>' +
        '<circle cx="62" cy="43" r="1.6" fill="#fff"/>' +
        '<path class="beak" d="M46 53 L54 53 L50 61 Z" fill="#ffb703"/>' +
      '</g>' +
    '</svg>';

  const C = window.HocVuiCharacters;
  C.registerSpecies('wizard', { svg: wizard, classPrefix: 'wizard' });
  C.registerSpecies('owl', { svg: owl, classPrefix: 'owl' });
})();
