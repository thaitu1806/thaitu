// Học Vui — V20 "Nông Trại Vui Vẻ" sprite registry.
// Chibi farm characters: a friendly farmer + farm animals (cow / chicken / pig).
// Each species is an SVG (viewBox 0 0 100 100) with named <g>: .body, .head, .accent.
// CSS in v20/style.css drives animation per state (idle / happy).
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[farm.js] character.js must load first');
    return;
  }

  const OUT = '#3d2812';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.4" fill="' + OUT + '"/>';
  }

  // Cheerful farmer with a straw hat and green overalls.
  const farmer =
    '<svg viewBox="0 0 100 100" class="farmer" ' + STROKE + ' aria-hidden="true">' +
      '<g class="body">' +
        '<path class="arm" d="M30 70 Q20 66 18 76" fill="none"/>' +
        '<path class="arm" d="M70 70 Q80 66 82 76" fill="none"/>' +
        '<path d="M30 88 Q30 62 50 62 Q70 62 70 88 Z" fill="#4CAF50"/>' +
        '<path d="M44 64 L44 88 M56 64 L56 88" stroke="#2E7D32" stroke-width="2.5" fill="none"/>' +
        '<rect x="42" y="70" width="16" height="11" rx="3" fill="#2E7D32"/>' +
      '</g>' +
      '<g class="head">' +
        '<circle cx="50" cy="46" r="17" fill="#f6c89a"/>' +
        eye(44, 46) + eye(56, 46) +
        '<circle cx="40" cy="52" r="3" fill="#f3a98a"/>' +
        '<circle cx="60" cy="52" r="3" fill="#f3a98a"/>' +
        '<path class="mouth" d="M44 54 Q50 60 56 54" stroke="' + OUT + '" stroke-width="2.2" fill="none"/>' +
        '<g class="hat">' +
          '<ellipse cx="50" cy="32" rx="24" ry="7" fill="#E8B84B"/>' +
          '<path d="M36 32 Q38 18 50 18 Q62 18 64 32 Z" fill="#F2C75C"/>' +
          '<path d="M34 32 Q50 36 66 32" stroke="#c9962f" stroke-width="2" fill="none"/>' +
        '</g>' +
      '</g>' +
    '</svg>';

  // Spotted dairy cow.
  const cow =
    '<svg viewBox="0 0 100 100" class="cow" ' + STROKE + ' aria-hidden="true">' +
      '<g class="body">' +
        '<ellipse cx="50" cy="66" rx="30" ry="21" fill="#ffffff"/>' +
        '<rect x="28" y="80" width="7" height="12" rx="3" fill="#ffffff"/>' +
        '<rect x="65" y="80" width="7" height="12" rx="3" fill="#ffffff"/>' +
      '</g>' +
      '<g class="accent">' +
        '<ellipse cx="34" cy="60" rx="8" ry="6" fill="#3d2812"/>' +
        '<ellipse cx="66" cy="72" rx="9" ry="7" fill="#3d2812"/>' +
      '</g>' +
      '<g class="head">' +
        '<path class="ear" d="M28 30 Q18 26 20 38 Q28 38 32 34 Z" fill="#ffffff"/>' +
        '<path class="ear" d="M72 30 Q82 26 80 38 Q72 38 68 34 Z" fill="#ffffff"/>' +
        '<ellipse cx="50" cy="38" rx="20" ry="17" fill="#ffffff"/>' +
        '<ellipse cx="50" cy="46" rx="12" ry="8" fill="#f7b6c2"/>' +
        '<circle cx="46" cy="46" r="1.8" fill="' + OUT + '"/>' +
        '<circle cx="54" cy="46" r="1.8" fill="' + OUT + '"/>' +
        eye(44, 34) + eye(56, 34) +
      '</g>' +
    '</svg>';

  // Plump little chicken.
  const chicken =
    '<svg viewBox="0 0 100 100" class="chicken" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        '<rect x="44" y="84" width="3" height="8" fill="#FF9800"/>' +
        '<rect x="53" y="84" width="3" height="8" fill="#FF9800"/>' +
      '</g>' +
      '<g class="body">' +
        '<ellipse cx="50" cy="62" rx="24" ry="22" fill="#fff7d6"/>' +
        '<path class="wing" d="M30 58 Q22 64 30 74 Q36 70 36 62 Z" fill="#ffe9a6"/>' +
      '</g>' +
      '<g class="head">' +
        '<path class="comb" d="M44 22 Q46 14 50 20 Q54 14 56 22 Z" fill="#E5392F"/>' +
        '<circle cx="50" cy="36" r="13" fill="#fffef0"/>' +
        '<path d="M50 40 L40 44 L50 48 Z" fill="#FF9800"/>' +
        '<path d="M48 48 Q50 54 52 48" fill="#E5392F" stroke="none"/>' +
        eye(52, 34) +
      '</g>' +
    '</svg>';

  // Round pink pig.
  const pig =
    '<svg viewBox="0 0 100 100" class="pig" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        '<path class="tail" d="M78 66 Q88 64 84 72 Q80 76 86 78" fill="none"/>' +
      '</g>' +
      '<g class="body">' +
        '<ellipse cx="50" cy="64" rx="28" ry="22" fill="#f7a8be"/>' +
        '<rect x="32" y="82" width="7" height="11" rx="3" fill="#f7a8be"/>' +
        '<rect x="61" y="82" width="7" height="11" rx="3" fill="#f7a8be"/>' +
      '</g>' +
      '<g class="head">' +
        '<path class="ear" d="M34 28 L28 16 L44 24 Z" fill="#f08fab"/>' +
        '<path class="ear" d="M66 28 L72 16 L56 24 Z" fill="#f08fab"/>' +
        '<circle cx="50" cy="40" r="18" fill="#f7a8be"/>' +
        '<ellipse cx="50" cy="46" rx="11" ry="8" fill="#e98aa6"/>' +
        '<circle cx="46" cy="46" r="2" fill="' + OUT + '"/>' +
        '<circle cx="54" cy="46" r="2" fill="' + OUT + '"/>' +
        eye(43, 36) + eye(57, 36) +
      '</g>' +
    '</svg>';

  const C = window.HocVuiCharacters;
  C.registerSpecies('farmer', { svg: farmer, classPrefix: 'farmer' });
  C.registerSpecies('cow', { svg: cow, classPrefix: 'cow' });
  C.registerSpecies('chicken', { svg: chicken, classPrefix: 'chicken' });
  C.registerSpecies('pig', { svg: pig, classPrefix: 'pig' });
})();
