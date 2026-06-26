// Học Vui — V18 "Ninja Toán Học" sprite registry.
// Chibi ninja hero + a boss-ogre target to slash. Each species is an SVG
// (viewBox 0 0 100 100) with named <g>: .body, .head, .accent.
// CSS in v18/style.css drives animation per state (idle / happy / attacking / hurt).
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[ninjas.js] character.js must load first');
    return;
  }

  const OUT = '#2a1505';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.6" fill="' + OUT + '"/>';
  }

  // Main player avatar — a chibi ninja with orange headband + katana.
  const ninja =
    '<svg viewBox="0 0 100 100" class="ninja" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        // katana (blade + hilt) held to the side
        '<g class="blade">' +
          '<path d="M74 58 L92 30" stroke="#cfd8e3" stroke-width="5"/>' +
          '<path d="M74 58 L92 30" stroke="#fff" stroke-width="1.6"/>' +
          '<rect x="69" y="56" width="10" height="5" rx="2" transform="rotate(-32 74 58)" fill="#ffd700"/>' +
          '<rect x="66" y="59" width="9" height="4" rx="2" transform="rotate(-32 70 61)" fill="#8b4513"/>' +
        '</g>' +
      '</g>' +
      '<g class="body">' +
        // legs
        '<rect x="38" y="74" width="9" height="16" rx="4" fill="#3a2410"/>' +
        '<rect x="53" y="74" width="9" height="16" rx="4" fill="#3a2410"/>' +
        // torso (dark gi)
        '<path d="M32 52 Q50 44 68 52 L64 78 Q50 84 36 78 Z" fill="#2d1a0a"/>' +
        // belt
        '<rect x="33" y="68" width="34" height="7" rx="2" fill="#ff6b35"/>' +
        '<path d="M50 75 L46 86 M50 75 L54 86" stroke="#ff6b35" stroke-width="3" fill="none"/>' +
        // arms
        '<path class="arm-l" d="M34 54 Q24 58 26 70" stroke="#2d1a0a" stroke-width="8" fill="none"/>' +
        '<path class="arm-r" d="M66 54 Q76 56 74 58" stroke="#2d1a0a" stroke-width="8" fill="none"/>' +
      '</g>' +
      '<g class="head">' +
        // hood / face mask
        '<circle cx="50" cy="38" r="18" fill="#2d1a0a"/>' +
        // eye slit band
        '<rect x="33" y="32" width="34" height="11" rx="5" fill="#f2d2a8"/>' +
        '<rect x="33" y="32" width="34" height="11" rx="5" fill="none" stroke="' + OUT + '" stroke-width="1.6"/>' +
        eye(44, 38) + eye(56, 38) +
        // headband ends fluttering
        '<g class="band"><path d="M30 30 Q14 28 12 36 L26 34 Z" fill="#ff6b35"/>' +
          '<path d="M28 33 Q16 36 16 44 L26 38 Z" fill="#ff4500"/></g>' +
      '</g>' +
    '</svg>';

  // Boss-ogre target — a chunky red oni the ninja slashes on boss waves.
  const oni =
    '<svg viewBox="0 0 100 100" class="oni" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        '<path d="M30 22 L24 8 L38 18 Z" fill="#f5e6c8"/>' +
        '<path d="M70 22 L76 8 L62 18 Z" fill="#f5e6c8"/>' +
      '</g>' +
      '<g class="body">' +
        '<path d="M28 60 Q26 84 50 86 Q74 84 72 60 Z" fill="#8a1a1a"/>' +
      '</g>' +
      '<g class="head">' +
        '<circle cx="50" cy="46" r="26" fill="#c0392b"/>' +
        '<path class="brow" d="M34 38 L46 42 M66 38 L54 42" stroke="' + OUT + '" stroke-width="3"/>' +
        eye(42, 46) + eye(58, 46) +
        '<path class="mouth" d="M40 60 Q50 56 60 60 Q50 68 40 60 Z" fill="#2a1505"/>' +
        '<path d="M44 60 L46 65 M56 60 L54 65" stroke="#fff" stroke-width="2"/>' +
      '</g>' +
    '</svg>';

  const C = window.HocVuiCharacters;
  C.registerSpecies('ninja', { svg: ninja, classPrefix: 'ninja' });
  C.registerSpecies('oni', { svg: oni, classPrefix: 'oni' });
})();
