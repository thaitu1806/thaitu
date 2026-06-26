// Học Vui — V32 "Nhà Khoa Học Nhí" sprite registry.
// Chibi kid-scientist (lab coat + goggles) + bubbling beaker + robot-helper
// mascot. Each species is an SVG (viewBox 0 0 100 100) with named <g>:
// .body, .head, .accent. CSS in v32/style.css drives animation per state
// (idle / happy).
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[scientists.js] character.js must load first');
    return;
  }

  const OUT = '#16213e';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.4" fill="' + OUT + '"/>';
  }

  // Main player avatar — a chibi kid scientist in a lab coat + goggles,
  // holding a bubbling beaker.
  const scientist =
    '<svg viewBox="0 0 100 100" class="scientist" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        // bubbling beaker held in hand
        '<g class="beaker">' +
          '<path d="M64 60 L64 72 L72 80 L80 72 L80 60 Z" fill="#22d3ee"/>' +
          '<rect x="63" y="56" width="18" height="5" rx="2" fill="#67e8f9"/>' +
          '<circle class="bub" cx="70" cy="70" r="2" fill="#e0aaff"/>' +
          '<circle class="bub" cx="76" cy="66" r="1.6" fill="#fff"/>' +
        '</g>' +
      '</g>' +
      '<g class="body">' +
        // lab coat
        '<path d="M34 62 Q34 50 50 50 Q66 50 66 62 L70 90 L30 90 Z" fill="#f5f3ff"/>' +
        // purple shirt collar / lapel
        '<path d="M50 50 L43 80 M50 50 L57 80" stroke="#a855f7" stroke-width="2.5" fill="none"/>' +
        '<path d="M44 52 L50 64 L56 52 Z" fill="#7c3aed"/>' +
        // left arm (holding beaker)
        '<path d="M64 60 Q72 56 66 50" fill="#f5f3ff"/>' +
        // pocket
        '<rect x="36" y="70" width="9" height="9" rx="2" fill="none" stroke="#bb86fc" stroke-width="2"/>' +
      '</g>' +
      '<g class="head">' +
        // hair
        '<path d="M36 32 Q34 18 50 18 Q66 18 64 32 Z" fill="#5b3a1f"/>' +
        // face
        '<circle cx="50" cy="36" r="15" fill="#ffd9b3"/>' +
        // goggles strap + lenses
        '<rect x="34" y="31" width="32" height="4" rx="2" fill="#a855f7"/>' +
        '<circle cx="44" cy="36" r="6" fill="#67e8f9" stroke="' + OUT + '" stroke-width="2.5"/>' +
        '<circle cx="58" cy="36" r="6" fill="#67e8f9" stroke="' + OUT + '" stroke-width="2.5"/>' +
        eye(44, 36) + eye(58, 36) +
        '<path class="mouth" d="M45 45 Q50 49 55 45" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
      '</g>' +
    '</svg>';

  // Robot helper mascot — friendly lab assistant.
  const robot =
    '<svg viewBox="0 0 100 100" class="robot" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        '<line x1="50" y1="20" x2="50" y2="10" stroke="' + OUT + '" stroke-width="2.5"/>' +
        '<circle class="antenna" cx="50" cy="8" r="4" fill="#e0aaff"/>' +
      '</g>' +
      '<g class="body">' +
        '<rect x="34" y="60" width="32" height="26" rx="6" fill="#7c3aed"/>' +
        '<circle cx="42" cy="72" r="2.5" fill="#67e8f9"/>' +
        '<circle cx="50" cy="72" r="2.5" fill="#86efac"/>' +
        '<circle cx="58" cy="72" r="2.5" fill="#fbbf24"/>' +
        '<rect x="22" y="62" width="8" height="16" rx="4" fill="#a855f7"/>' +
        '<rect x="70" y="62" width="8" height="16" rx="4" fill="#a855f7"/>' +
      '</g>' +
      '<g class="head">' +
        '<rect x="32" y="22" width="36" height="32" rx="10" fill="#bb86fc"/>' +
        '<rect x="37" y="30" width="26" height="16" rx="6" fill="#16213e"/>' +
        '<circle class="bot-eye" cx="45" cy="38" r="3.4" fill="#67e8f9"/>' +
        '<circle class="bot-eye" cx="55" cy="38" r="3.4" fill="#67e8f9"/>' +
      '</g>' +
    '</svg>';

  // Bubbling beaker mascot — cheerful flask of glowing liquid.
  const beaker =
    '<svg viewBox="0 0 100 100" class="flask" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        '<circle class="bub" cx="44" cy="58" r="2.4" fill="#fff"/>' +
        '<circle class="bub" cx="56" cy="52" r="1.8" fill="#e0aaff"/>' +
        '<circle class="bub" cx="50" cy="46" r="2" fill="#fff"/>' +
      '</g>' +
      '<g class="body">' +
        '<path d="M42 26 L42 48 L28 82 Q26 88 34 88 L66 88 Q74 88 72 82 L58 48 L58 26 Z" fill="#a855f7" fill-opacity="0.35"/>' +
        '<path d="M30 70 Q26 84 34 88 L66 88 Q74 84 70 70 Z" fill="#22d3ee"/>' +
        '<rect x="40" y="22" width="20" height="5" rx="2" fill="#67e8f9"/>' +
      '</g>' +
      '<g class="head">' +
        eye(43, 78) + eye(57, 78) +
        '<path class="mouth" d="M44 83 Q50 87 56 83" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
      '</g>' +
    '</svg>';

  const C = window.HocVuiCharacters;
  C.registerSpecies('scientist', { svg: scientist, classPrefix: 'scientist' });
  C.registerSpecies('robot', { svg: robot, classPrefix: 'robot' });
  C.registerSpecies('beaker', { svg: beaker, classPrefix: 'flask' });
})();
