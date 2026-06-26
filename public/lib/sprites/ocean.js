// Học Vui — V13 "Thám Hiểm Đại Dương" sprite registry.
// Chibi submarine avatar + sea-creature icons. Each species is an SVG
// (viewBox 0 0 100 100) with named <g>: .body, .head, .accent.
// CSS in v13/style.css drives animation per state (idle / happy / diving / rising).
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[ocean.js] character.js must load first');
    return;
  }

  const OUT = '#0a2a4a';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.4" fill="' + OUT + '"/>';
  }

  // Main player avatar — a cheerful yellow submarine.
  const submarine =
    '<svg viewBox="0 0 100 100" class="sub" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        '<rect x="46" y="14" width="5" height="20" rx="2" fill="#0077b6"/>' +
        '<path d="M48 14 L60 14 L60 20 L48 20 Z" fill="#00b4d8"/>' +
        '<g class="prop"><circle cx="14" cy="54" r="3" fill="#0077b6"/>' +
          '<path d="M14 54 L6 49 M14 54 L6 59" stroke="#0077b6" stroke-width="3"/></g>' +
      '</g>' +
      '<g class="body">' +
        '<ellipse cx="54" cy="54" rx="34" ry="20" fill="#ffd93d"/>' +
        '<path d="M20 54 L30 47 L30 61 Z" fill="#ffb703"/>' +
        '<rect x="44" y="30" width="22" height="10" rx="5" fill="#ffb703"/>' +
        '<path class="fin" d="M70 60 Q86 64 84 76 L70 70 Z" fill="#ffb703"/>' +
      '</g>' +
      '<g class="head">' +
        '<circle cx="58" cy="54" r="11" fill="#caf0f8" stroke="' + OUT + '" stroke-width="2.5"/>' +
        '<circle cx="58" cy="54" r="11" fill="none" stroke="#48cae4" stroke-width="2"/>' +
        eye(54, 52) + eye(62, 52) +
        '<path class="mouth" d="M53 58 Q58 62 63 58" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
      '</g>' +
    '</svg>';

  const clownfish =
    '<svg viewBox="0 0 100 100" class="fish" ' + STROKE + ' aria-hidden="true">' +
      '<g class="body"><ellipse cx="46" cy="52" rx="30" ry="20" fill="#ff7f11"/>' +
        '<path d="M76 52 L94 40 L94 64 Z" fill="#ff7f11"/>' +
        '<rect x="34" y="34" width="7" height="36" rx="3" fill="#fff"/>' +
        '<rect x="52" y="34" width="7" height="36" rx="3" fill="#fff"/></g>' +
      '<g class="head">' + eye(26, 48) +
        '<path class="mouth" d="M16 54 Q20 58 24 55" stroke="' + OUT + '" stroke-width="2" fill="none"/></g>' +
    '</svg>';

  const puffer =
    '<svg viewBox="0 0 100 100" class="fish" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent"><path d="M50 8 L54 22 M78 18 L70 30 M92 50 L78 50 M78 82 L70 70 M50 92 L46 78 M22 82 L30 70 M8 50 L22 50 M22 18 L30 30" stroke="#90be6d" stroke-width="3"/></g>' +
      '<g class="body"><circle cx="50" cy="50" r="28" fill="#90be6d"/></g>' +
      '<g class="head">' + eye(42, 46) + eye(58, 46) +
        '<path class="mouth" d="M44 60 Q50 64 56 60" stroke="' + OUT + '" stroke-width="2" fill="none"/></g>' +
    '</svg>';

  const turtle =
    '<svg viewBox="0 0 100 100" class="creature" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent"><ellipse cx="22" cy="58" rx="9" ry="6" fill="#52b788"/><ellipse cx="78" cy="58" rx="9" ry="6" fill="#52b788"/></g>' +
      '<g class="body"><ellipse cx="50" cy="54" rx="26" ry="22" fill="#2d6a4f"/>' +
        '<path d="M50 34 L50 76 M30 44 L70 44 M30 64 L70 64" stroke="#95d5b2" stroke-width="2"/></g>' +
      '<g class="head"><circle cx="50" cy="26" r="9" fill="#52b788"/>' + eye(46, 25) + eye(54, 25) + '</g>' +
    '</svg>';

  const whale =
    '<svg viewBox="0 0 100 100" class="creature" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent"><path d="M30 22 Q30 10 38 12 Q34 18 38 24" stroke="#48cae4" stroke-width="3" fill="none"/></g>' +
      '<g class="body"><path d="M14 52 Q14 32 44 32 L74 32 Q90 32 90 50 Q90 60 76 60 L74 60 L80 72 L62 60 L40 60 Q14 60 14 52 Z" fill="#0096c7"/></g>' +
      '<g class="head">' + eye(34, 46) +
        '<path class="mouth" d="M22 54 Q30 58 40 55" stroke="' + OUT + '" stroke-width="2" fill="none"/></g>' +
    '</svg>';

  const C = window.HocVuiCharacters;
  C.registerSpecies('submarine', { svg: submarine, classPrefix: 'sub' });
  C.registerSpecies('clownfish', { svg: clownfish, classPrefix: 'fish' });
  C.registerSpecies('puffer', { svg: puffer, classPrefix: 'fish' });
  C.registerSpecies('turtle', { svg: turtle, classPrefix: 'creature' });
  C.registerSpecies('whale', { svg: whale, classPrefix: 'creature' });
})();
