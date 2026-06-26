// Học Vui — V10 "Dò Mìn Trí Tuệ" sprite registry.
// Chibi bomb-squad explorer avatar + a cute bomb mascot + treasure gem.
// Each species is an SVG (viewBox 0 0 100 100) with named <g>:
// .body, .head, .accent. CSS in v10/style.css drives animation per state
// (idle / happy / scared).
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[sappers.js] character.js must load first');
    return;
  }

  const OUT = '#2a2320';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.6" fill="' + OUT + '"/>';
  }

  // Main mascot — a cheerful chibi bomb-squad explorer with a headlamp helmet.
  const sapper =
    '<svg viewBox="0 0 100 100" class="sapper" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        // headlamp beam
        '<path class="beam" d="M50 24 L34 6 L66 6 Z" fill="#ffe27a" opacity="0.55" stroke="none"/>' +
      '</g>' +
      '<g class="body">' +
        // safety vest torso
        '<path d="M28 66 Q28 54 50 54 Q72 54 72 66 L75 88 L25 88 Z" fill="#e67e22"/>' +
        // reflective stripes
        '<rect x="33" y="70" width="34" height="5" rx="2" fill="#ffd45e"/>' +
        '<path d="M44 56 L44 88 M56 56 L56 88" stroke="#c75c12" stroke-width="3"/>' +
        // arms
        '<path class="arm arm-l" d="M30 62 L18 76" stroke="#f39c12" stroke-width="7"/>' +
        '<path class="arm arm-r" d="M70 62 L82 76" stroke="#f39c12" stroke-width="7"/>' +
        '<circle cx="17" cy="77" r="4" fill="#f5d7b0"/>' +
        '<circle cx="83" cy="77" r="4" fill="#f5d7b0"/>' +
      '</g>' +
      '<g class="head">' +
        // face
        '<circle cx="50" cy="38" r="18" fill="#f5d7b0"/>' +
        // helmet shell
        '<path d="M30 38 Q30 17 50 17 Q70 17 70 38 Z" fill="#3498db"/>' +
        '<path d="M28 38 L72 38 L72 42 L28 42 Z" fill="#2c81bf"/>' +
        // headlamp
        '<rect x="45" y="19" width="10" height="9" rx="3" fill="#ffe27a"/>' +
        eye(43, 40) + eye(57, 40) +
        '<circle cx="38" cy="45" r="3" fill="#ff9b9b" opacity="0.6" stroke="none"/>' +
        '<circle cx="62" cy="45" r="3" fill="#ff9b9b" opacity="0.6" stroke="none"/>' +
        '<path class="mouth" d="M44 47 Q50 52 56 47" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
      '</g>' +
    '</svg>';

  // Cute bomb mascot — round black bomb with a sparking fuse and a face.
  const bomb =
    '<svg viewBox="0 0 100 100" class="bomb" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        '<path d="M60 30 Q70 16 78 22" stroke="#8a6d3b" stroke-width="3" fill="none"/>' +
        '<circle class="spark" cx="79" cy="20" r="5" fill="#f39c12" stroke="#e74c3c"/>' +
        '<path class="spark" d="M79 11 L79 6 M86 14 L90 11 M88 22 L93 23" stroke="#f1c40f" stroke-width="2"/>' +
      '</g>' +
      '<g class="body">' +
        '<circle cx="48" cy="58" r="30" fill="#34373b"/>' +
        '<ellipse cx="38" cy="48" rx="8" ry="5" fill="#5b6066" opacity="0.6" stroke="none"/>' +
        '<rect x="42" y="28" width="12" height="8" rx="2" fill="#54585d"/>' +
      '</g>' +
      '<g class="head">' +
        '<circle cx="40" cy="56" r="4.5" fill="#fff"/><circle cx="40" cy="56" r="2.2" fill="' + OUT + '"/>' +
        '<circle cx="57" cy="56" r="4.5" fill="#fff"/><circle cx="57" cy="56" r="2.2" fill="' + OUT + '"/>' +
        '<path class="mouth" d="M41 68 Q48 73 56 68" stroke="#fff" stroke-width="2.5" fill="none"/>' +
      '</g>' +
    '</svg>';

  // Treasure gem — sparkling blue diamond for safe finds.
  const gem =
    '<svg viewBox="0 0 100 100" class="gem" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent"><path class="spark" d="M78 24 L78 16 M84 28 L90 24 M16 30 L10 27" stroke="#ffe27a" stroke-width="2.5"/></g>' +
      '<g class="body">' +
        '<path d="M30 40 L42 22 L58 22 L70 40 L50 82 Z" fill="#3aa6d8"/>' +
        '<path d="M30 40 L70 40 L50 82 Z" fill="#7fd3f0"/>' +
        '<path d="M42 22 L46 40 M58 22 L54 40 M30 40 L50 40 L70 40" stroke="#d9f4ff" stroke-width="2"/>' +
      '</g>' +
    '</svg>';

  const C = window.HocVuiCharacters;
  C.registerSpecies('sapper', { svg: sapper, classPrefix: 'sapper' });
  C.registerSpecies('bomb', { svg: bomb, classPrefix: 'bomb' });
  C.registerSpecies('gem', { svg: gem, classPrefix: 'gem' });
})();
