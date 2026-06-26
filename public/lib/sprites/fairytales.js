// Học Vui — V28 "Truyện Cổ Tích" sprite registry.
// Chibi fairy-tale characters: little prince + princess, a friendly
// storybook fairy and a gentle dragon. Each species is an SVG
// (viewBox 0 0 100 100) with named <g>: .body, .head, .accent.
// CSS in v28/style.css drives animation per state (idle / happy).
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[fairytales.js] character.js must load first');
    return;
  }

  const OUT = '#4e342e';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.3" fill="' + OUT + '"/>';
  }
  function smile(cx, cy) {
    return '<path class="mouth" d="M' + (cx - 4) + ' ' + cy + ' Q' + cx + ' ' + (cy + 3.5) + ' ' + (cx + 4) + ' ' + cy + '" stroke="' + OUT + '" stroke-width="2" fill="none"/>';
  }

  // Storybook fairy — the friendly guide mascot.
  const fairy =
    '<svg viewBox="0 0 100 100" class="fairy" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        '<ellipse class="wing wing-l" cx="32" cy="52" rx="15" ry="21" fill="#ce93d8" opacity="0.85"/>' +
        '<ellipse class="wing wing-r" cx="68" cy="52" rx="15" ry="21" fill="#ce93d8" opacity="0.85"/>' +
        '<line x1="70" y1="66" x2="86" y2="50" stroke="#8d6e63" stroke-width="3"/>' +
        '<path class="star" d="M86 42 L89 49 L96 50 L91 55 L92 62 L86 58 L80 62 L81 55 L76 50 L83 49 Z" fill="#ffd54f"/>' +
      '</g>' +
      '<g class="body">' +
        '<path d="M37 60 Q50 52 63 60 L67 86 Q50 92 33 86 Z" fill="#7e57c2"/>' +
      '</g>' +
      '<g class="head">' +
        '<circle cx="50" cy="42" r="14" fill="#ffe0b2"/>' +
        '<circle cx="40" cy="31" r="3.2" fill="#ec407a"/>' +
        '<circle cx="50" cy="28" r="3.2" fill="#ffb300"/>' +
        '<circle cx="60" cy="31" r="3.2" fill="#ec407a"/>' +
        eye(45, 42) + eye(55, 42) + smile(50, 47) +
      '</g>' +
    '</svg>';

  // Little princess — pink dress + gold crown.
  const princess =
    '<svg viewBox="0 0 100 100" class="royal" ' + STROKE + ' aria-hidden="true">' +
      '<g class="body">' +
        '<path d="M34 62 Q50 54 66 62 L72 88 Q50 94 28 88 Z" fill="#f06292"/>' +
        '<path d="M44 62 L50 80 L56 62 Z" fill="#fce4ec"/>' +
      '</g>' +
      '<g class="head">' +
        '<path d="M36 38 Q34 60 42 64 L58 64 Q66 60 64 38 Z" fill="#5d4037"/>' +
        '<circle cx="50" cy="44" r="14" fill="#ffe0b2"/>' +
        eye(45, 44) + eye(55, 44) + smile(50, 50) +
      '</g>' +
      '<g class="accent">' +
        '<path class="crown" d="M40 30 L44 24 L50 30 L56 24 L60 30 L58 35 L42 35 Z" fill="#ffd54f"/>' +
        '<circle cx="50" cy="25" r="2" fill="#ef5350"/>' +
      '</g>' +
    '</svg>';

  // Little prince — blue tunic + gold crown.
  const prince =
    '<svg viewBox="0 0 100 100" class="royal" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        '<path d="M30 64 Q24 80 30 90 L40 86 L40 66 Z" fill="#ef5350"/>' +
      '</g>' +
      '<g class="body">' +
        '<path d="M36 62 Q50 56 64 62 L68 88 Q50 92 32 88 Z" fill="#42a5f5"/>' +
        '<rect x="47" y="62" width="6" height="26" fill="#ffd54f"/>' +
      '</g>' +
      '<g class="head">' +
        '<path d="M37 40 Q36 30 50 30 Q64 30 63 40 L60 44 L40 44 Z" fill="#6d4c41"/>' +
        '<circle cx="50" cy="44" r="14" fill="#ffe0b2"/>' +
        eye(45, 44) + eye(55, 44) + smile(50, 50) +
      '</g>' +
      '<g class="accent">' +
        '<path class="crown" d="M40 31 L44 25 L50 31 L56 25 L60 31 L58 36 L42 36 Z" fill="#ffd54f"/>' +
      '</g>' +
    '</svg>';

  // Friendly storybook dragon — green, tiny wings, no fire.
  const dragon =
    '<svg viewBox="0 0 100 100" class="creature" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        '<path class="wing" d="M40 40 Q26 26 22 40 Q30 42 36 50 Z" fill="#aed581"/>' +
        '<path d="M16 70 Q6 70 8 60 Q16 62 22 66 Z" fill="#81c784"/>' +
      '</g>' +
      '<g class="body">' +
        '<ellipse cx="54" cy="62" rx="26" ry="20" fill="#66bb6a"/>' +
        '<path d="M30 64 Q16 66 18 78 Q26 74 34 72 Z" fill="#66bb6a"/>' +
        '<ellipse cx="54" cy="66" rx="14" ry="11" fill="#dcedc8"/>' +
      '</g>' +
      '<g class="head">' +
        '<circle cx="60" cy="40" r="15" fill="#66bb6a"/>' +
        '<path d="M52 28 L55 22 L58 30 Z" fill="#aed581"/>' +
        '<path d="M66 28 L69 22 L72 30 Z" fill="#aed581"/>' +
        '<ellipse cx="66" cy="44" rx="7" ry="5" fill="#dcedc8"/>' +
        eye(57, 38) + eye(67, 38) +
        '<circle cx="63" cy="45" r="1.2" fill="' + OUT + '"/>' +
        '<circle cx="69" cy="45" r="1.2" fill="' + OUT + '"/>' +
      '</g>' +
    '</svg>';

  const C = window.HocVuiCharacters;
  C.registerSpecies('fairy', { svg: fairy, classPrefix: 'fairy' });
  C.registerSpecies('princess', { svg: princess, classPrefix: 'royal' });
  C.registerSpecies('prince', { svg: prince, classPrefix: 'royal' });
  C.registerSpecies('dragon', { svg: dragon, classPrefix: 'creature' });
})();
