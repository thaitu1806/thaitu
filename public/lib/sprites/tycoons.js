// Học Vui — V11 "Tỉ Phú Trí Tuệ" sprite registry.
// Chibi tycoon player tokens (one suit colour per player slot) + a money-bag
// mascot. Each species is an SVG (viewBox 0 0 100 100) with named <g>:
// .body, .head, .accent. CSS in v11/style.css drives animation per state
// (idle / happy). Mirrors the registry style of lib/sprites/ocean.js.
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[tycoons.js] character.js must load first');
    return;
  }

  const OUT = '#2a2118';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';
  const HAT = '#2b2b35';
  const SKIN = '#f3c79b';

  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.6" fill="' + OUT + '"/>';
  }

  // Chibi businessperson token. Suit colour keys the player slot.
  function makeTycoon(suit, band) {
    return '<svg viewBox="0 0 100 100" class="tycoon" ' + STROKE + ' aria-hidden="true">' +
        '<g class="accent">' +
          // Top hat
          '<rect x="28" y="21" width="44" height="6" rx="3" fill="' + HAT + '"/>' +
          '<rect x="36" y="4" width="28" height="19" rx="3" fill="' + HAT + '"/>' +
          '<rect x="36" y="16" width="28" height="5" fill="' + band + '"/>' +
        '</g>' +
        '<g class="head">' +
          '<circle cx="50" cy="42" r="16" fill="' + SKIN + '"/>' +
          eye(44, 42) + eye(56, 42) +
          '<path class="mouth" d="M44 50 Q50 55 56 50" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
          '<circle cx="56" cy="44" r="6" fill="none" stroke="' + OUT + '" stroke-width="1.4" opacity="0.6"/>' +
        '</g>' +
        '<g class="body">' +
          '<path d="M27 94 Q24 64 50 60 Q76 64 73 94 Z" fill="' + suit + '"/>' +
          '<path d="M50 60 L42 94 L58 94 Z" fill="#ffffff"/>' +
          '<path class="tie" d="M50 60 L45 67 L50 73 L55 67 Z" fill="' + band + '"/>' +
          '<circle cx="50" cy="80" r="1.8" fill="' + band + '" stroke="none"/>' +
          '<circle cx="50" cy="88" r="1.8" fill="' + band + '" stroke="none"/>' +
        '</g>' +
      '</svg>';
  }

  // Money-bag mascot — bobs in the board centre.
  const moneybag =
    '<svg viewBox="0 0 100 100" class="moneybag" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        '<circle cx="22" cy="86" r="8" fill="#ffd93d"/>' +
        '<circle cx="22" cy="86" r="4" fill="none" stroke="#b8860b" stroke-width="1.5"/>' +
        '<circle cx="80" cy="88" r="7" fill="#ffd93d"/>' +
        '<circle cx="80" cy="88" r="3.5" fill="none" stroke="#b8860b" stroke-width="1.5"/>' +
      '</g>' +
      '<g class="body">' +
        '<path d="M30 34 Q50 26 70 34 L62 40 Q50 36 38 40 Z" fill="#d9b24a"/>' +
        '<path d="M36 40 Q18 56 24 78 Q30 96 50 96 Q70 96 76 78 Q82 56 64 40 Z" fill="#caa23c"/>' +
      '</g>' +
      '<g class="head">' +
        eye(42, 60) + eye(60, 60) +
        '<path class="mouth" d="M42 70 Q51 76 60 70" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
        '<path class="dollar" d="M51 46 L51 64 M57 50 Q44 47 44 53 Q44 58 53 59 Q62 60 51 65 Q44 66 43 61" stroke="#ffffff" stroke-width="2.4" fill="none"/>' +
      '</g>' +
    '</svg>';

  const C = window.HocVuiCharacters;
  // Player slots keyed to PLAYER_COLORS order in game.js.
  C.registerSpecies('tycoon0', { svg: makeTycoon('#FF5722', '#ffd93d'), classPrefix: 'tycoon' });
  C.registerSpecies('tycoon1', { svg: makeTycoon('#2196F3', '#ffd93d'), classPrefix: 'tycoon' });
  C.registerSpecies('tycoon2', { svg: makeTycoon('#4CAF50', '#ffd93d'), classPrefix: 'tycoon' });
  C.registerSpecies('tycoon3', { svg: makeTycoon('#9C27B0', '#ffd93d'), classPrefix: 'tycoon' });
  C.registerSpecies('moneybag', { svg: moneybag, classPrefix: 'moneybag' });
})();
