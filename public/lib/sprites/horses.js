// Học Vui — V5 "Cờ Cá Ngựa" sprite registry.
// Chibi horse game-pieces (one per player color) + a small dice mascot.
// Each species is an SVG (viewBox 0 0 100 100) with named <g>:
//   .body, .head, .accent, .legs, .mane — so CSS can target parts.
// CSS in v5/style.css drives animation per state (idle / happy).
// Emoji-fallback guard: if character.js is not loaded, warn and bail so the
// game falls back to its original emoji tokens.
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[horses.js] character.js must load first — falling back to emoji tokens');
    return;
  }

  const OUT = '#3a2410';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.3" fill="' + OUT + '"/>';
  }

  // Chibi horse factory.
  // o: { coat, mane, accent } where accent is one of 'none' | 'horn' | 'cap' | 'pole'
  function makeHorse(o) {
    const coat = o.coat;
    const mane = o.mane;

    // Optional head accent (unicorn horn / jockey cap / carousel pole-knob)
    let accent = '';
    if (o.accent === 'horn') {
      accent =
        '<g class="accent">' +
          '<path d="M50 16 L46 33 L54 33 Z" fill="#ffd93d" stroke="' + OUT + '" stroke-width="2"/>' +
          '<path d="M50 19 L49 30 M50 19 L51 30" stroke="#f0a500" stroke-width="1.5"/>' +
        '</g>';
    } else if (o.accent === 'cap') {
      accent =
        '<g class="accent">' +
          '<path d="M34 30 Q50 16 66 30 Z" fill="#e74c3c" stroke="' + OUT + '" stroke-width="2"/>' +
          '<circle cx="50" cy="22" r="3.5" fill="#fff" stroke="' + OUT + '" stroke-width="1.5"/>' +
        '</g>';
    } else if (o.accent === 'pole') {
      accent =
        '<g class="accent">' +
          '<rect x="47" y="8" width="6" height="26" rx="3" fill="#ffd93d" stroke="' + OUT + '" stroke-width="2"/>' +
          '<path d="M44 14 L56 14" stroke="#f0a500" stroke-width="2"/>' +
          '<path d="M44 22 L56 22" stroke="#f0a500" stroke-width="2"/>' +
        '</g>';
    }

    return (
      '<svg viewBox="0 0 100 100" class="horse" ' + STROKE + ' aria-hidden="true">' +
        accent +
        // Legs (gallop-able)
        '<g class="legs">' +
          '<rect class="leg leg-front" x="38" y="70" width="9" height="20" rx="4" fill="' + coat + '"/>' +
          '<rect class="leg leg-back" x="56" y="70" width="9" height="20" rx="4" fill="' + coat + '"/>' +
        '</g>' +
        // Body + tail
        '<g class="body">' +
          '<path class="tail" d="M30 52 Q14 50 16 74 Q24 64 30 66 Z" fill="' + mane + '"/>' +
          '<ellipse cx="52" cy="60" rx="26" ry="18" fill="' + coat + '"/>' +
        '</g>' +
        // Head + mane
        '<g class="head">' +
          '<path class="mane" d="M58 30 Q44 30 44 50 Q50 44 56 46 Z" fill="' + mane + '"/>' +
          '<path d="M60 34 Q78 32 80 52 Q82 64 70 66 Q56 66 56 50 Q56 38 60 34 Z" fill="' + coat + '"/>' +
          '<path class="ear" d="M62 32 L60 22 L70 30 Z" fill="' + coat + '"/>' +
          '<ellipse cx="78" cy="58" rx="7" ry="6" fill="' + coat + '"/>' +
          '<circle cx="80" cy="57" r="1.6" fill="' + OUT + '"/>' +
          '<circle cx="76" cy="60" r="1.6" fill="' + OUT + '"/>' +
          eye(70, 47) +
        '</g>' +
      '</svg>'
    );
  }

  // Cheerful dice mascot — board guide character.
  const diceMascot =
    '<svg viewBox="0 0 100 100" class="dicey" ' + STROKE + ' aria-hidden="true">' +
      '<g class="legs">' +
        '<rect x="38" y="74" width="8" height="16" rx="4" fill="#e0e6ed"/>' +
        '<rect x="54" y="74" width="8" height="16" rx="4" fill="#e0e6ed"/>' +
      '</g>' +
      '<g class="body">' +
        '<rect x="26" y="28" width="48" height="48" rx="12" fill="#ffffff"/>' +
        '<circle cx="40" cy="42" r="4" fill="#e74c3c"/>' +
        '<circle cx="60" cy="42" r="4" fill="#e74c3c"/>' +
        '<circle cx="50" cy="55" r="4" fill="#3498db"/>' +
      '</g>' +
      '<g class="head">' +
        eye(43, 64) + eye(57, 64) +
        '<path class="mouth" d="M44 69 Q50 74 56 69" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
      '</g>' +
    '</svg>';

  const C = window.HocVuiCharacters;
  // Player tokens keyed by color so game.js can mount `horse-<color>`.
  C.registerSpecies('horse-red',    { svg: makeHorse({ coat: '#e74c3c', mane: '#a93226', accent: 'cap'  }), classPrefix: 'horse' });
  C.registerSpecies('horse-blue',   { svg: makeHorse({ coat: '#5dade2', mane: '#2e86c1', accent: 'horn' }), classPrefix: 'horse' });
  C.registerSpecies('horse-green',  { svg: makeHorse({ coat: '#52be80', mane: '#1e8449', accent: 'none' }), classPrefix: 'horse' });
  C.registerSpecies('horse-yellow', { svg: makeHorse({ coat: '#f5c542', mane: '#d4960a', accent: 'pole' }), classPrefix: 'horse' });
  C.registerSpecies('dicey', { svg: diceMascot, classPrefix: 'dicey' });
})();
