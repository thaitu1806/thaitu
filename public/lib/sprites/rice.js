// Học Vui — V58 "Hành Trình Lúa Gạo" sprite registry.
// Rice-farming characters: a growing rice plant (scaled per data-stage), cute
// farmers tending the paddy (nón lá conical hats), and a rice-sack bushel.
// Each species is an SVG (viewBox 0 0 100 100) with named <g>: .body, .head,
// .accent (and .arms / .soil where applicable). CSS in v58/style.css drives
// animation per state (idle / happy / scared) + a data-stage growth ramp.
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[rice.js] character.js must load first');
    return;
  }

  const OUT = '#2e4d12';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  // Reusable bits ────────────────────────────────────────────────────────
  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.4" fill="' + OUT + '"/>';
  }
  function smile(cx, cy) {
    return '<path class="mouth" d="M' + (cx - 5) + ' ' + cy + ' Q' + cx + ' ' + (cy + 5) + ' ' + (cx + 5) + ' ' + cy + '" stroke="' + OUT + '" stroke-width="2" fill="none" stroke-linecap="round"/>';
  }
  function blush(cx, cy) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="2.6" fill="#ff8a65" opacity="0.45"/>';
  }
  function face(cx, cy) {
    return eye(cx - 5, cy) + eye(cx + 5, cy) + smile(cx, cy + 5) + blush(cx - 9, cy + 3) + blush(cx + 9, cy + 3);
  }

  // Growing rice plant ─────────────────────────────────────────────────────
  // One sprite; scaled 0.5→1 by .stage-circle[data-stage] in v58 CSS so the
  // same plant reads as seed → sprout → grain → harvest.
  const ricePlant =
    '<svg viewBox="0 0 100 100" class="rice" ' + STROKE + ' aria-hidden="true">' +
      '<g class="soil">' +
        '<ellipse cx="50" cy="91" rx="23" ry="6.5" fill="#8d6e63"/>' +
        '<path d="M30 90 Q50 85 70 90" stroke="#5d4037" stroke-width="1.5" fill="none" opacity="0.6"/>' +
      '</g>' +
      '<g class="accent">' +
        '<path d="M43 66 Q21 62 14 44 Q36 50 45 62 Z" fill="#7cb342"/>' +
        '<path d="M57 66 Q79 62 86 44 Q64 50 55 62 Z" fill="#8bc34a"/>' +
      '</g>' +
      '<g class="body">' +
        '<path d="M40 88 Q37 62 50 50 Q63 62 60 88 Z" fill="#9ccc65"/>' +
        '<path d="M50 88 L50 52" stroke="#7cb342" stroke-width="1.5" opacity="0.6"/>' +
        face(50, 68) +
      '</g>' +
      '<g class="head">' +
        '<path d="M50 52 L50 42" stroke="#558b2f" stroke-width="2.5"/>' +
        '<ellipse cx="50" cy="36" rx="5" ry="8.5" fill="#ffd54f"/>' +
        '<ellipse cx="41" cy="41" rx="4" ry="7" fill="#ffca28" transform="rotate(-22 41 41)"/>' +
        '<ellipse cx="59" cy="41" rx="4" ry="7" fill="#ffca28" transform="rotate(22 59 41)"/>' +
        '<ellipse cx="45" cy="32" rx="3.4" ry="6" fill="#ffe082" transform="rotate(-13 45 32)"/>' +
        '<ellipse cx="55" cy="32" rx="3.4" ry="6" fill="#ffe082" transform="rotate(13 55 32)"/>' +
      '</g>' +
    '</svg>';

  // Farmer factory (nón lá conical hat) ────────────────────────────────────
  // opts: { skin, shirt, hat }
  function makeFarmer(o) {
    return (
      '<svg viewBox="0 0 100 100" class="farmer" ' + STROKE + ' aria-hidden="true">' +
        '<g class="body">' +
          '<path d="M34 90 Q33 66 50 60 Q67 66 66 90 Z" fill="' + o.shirt + '"/>' +
          '<path d="M50 62 L50 90" stroke="' + OUT + '" stroke-width="1.5" opacity="0.4"/>' +
        '</g>' +
        '<g class="arms">' +
          '<path d="M37 67 L26 77" stroke="' + o.skin + '" stroke-width="5" fill="none"/>' +
          '<path d="M63 67 L74 77" stroke="' + o.skin + '" stroke-width="5" fill="none"/>' +
        '</g>' +
        '<g class="head">' +
          '<circle cx="50" cy="46" r="14" fill="' + o.skin + '"/>' +
          face(50, 46) +
        '</g>' +
        '<g class="accent">' +
          '<path d="M26 37 Q50 5 74 37 Z" fill="' + o.hat + '"/>' +
          '<path d="M26 37 Q50 31 74 37" stroke="' + OUT + '" stroke-width="1.5" fill="none"/>' +
          '<path d="M38 29 Q50 25 62 29" stroke="' + OUT + '" stroke-width="1" fill="none" opacity="0.5"/>' +
          '<path d="M50 7 L50 14" stroke="' + OUT + '" stroke-width="1.5" opacity="0.5"/>' +
        '</g>' +
      '</svg>'
    );
  }

  // Rice-sack bushel ───────────────────────────────────────────────────────
  const bushelSack =
    '<svg viewBox="0 0 100 100" class="bushel" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        '<path d="M40 32 Q50 22 60 32 Z" fill="#c8a060"/>' +
        '<ellipse cx="50" cy="28" rx="8.5" ry="4.5" fill="#fff3c4"/>' +
        '<circle cx="46" cy="27" r="1.4" fill="#ffca28"/>' +
        '<circle cx="52" cy="29" r="1.4" fill="#ffca28"/>' +
        '<circle cx="50" cy="25" r="1.4" fill="#ffca28"/>' +
      '</g>' +
      '<g class="body">' +
        '<path d="M30 42 Q30 33 42 31 L58 31 Q70 33 70 42 L73 84 Q50 92 27 84 Z" fill="#d7b377"/>' +
        '<path d="M34 54 Q50 58 66 54" stroke="' + OUT + '" stroke-width="1.3" fill="none" opacity="0.4"/>' +
        '<path d="M50 31 L50 84" stroke="' + OUT + '" stroke-width="1.2" opacity="0.25"/>' +
      '</g>' +
      '<g class="head">' + face(50, 64) + '</g>' +
    '</svg>';

  const C = window.HocVuiCharacters;
  C.registerSpecies('rice',     { svg: ricePlant,  classPrefix: 'rice' });
  C.registerSpecies('farmer',   { svg: makeFarmer({ skin: '#ffcc80', shirt: '#4caf50', hat: '#e6c98f' }), classPrefix: 'farmer' });
  C.registerSpecies('farmer-2', { svg: makeFarmer({ skin: '#ffe0b2', shirt: '#0097a7', hat: '#d4a857' }), classPrefix: 'farmer-2' });
  C.registerSpecies('bushel',   { svg: bushelSack, classPrefix: 'bushel' });
})();
