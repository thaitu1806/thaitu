// Học Vui — V39 "Thời Trang Show" sprite registry.
// Chibi fashion characters for the runway: a glam runway model + a fashion
// designer. Each species is an SVG (viewBox 0 0 100 100) with named <g>:
// .body (figure + outfit), .head (face/hair), .accent (hat / bag / tools).
// CSS in v39/style.css drives animation per state (idle = gentle sway,
// happy = catwalk strut). ids: 'fashionista', 'designer' (distinct from
// V57 aodai.js which uses color ids red/pink/gold/blue/white).
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[fashionistas.js] character.js must load first');
    return;
  }

  const OUT = '#4a148c';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';
  const SKIN = '#ffcc80';

  // Reusable face bits ──────────────────────────────────────────────────────
  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.3" fill="' + OUT + '"/>';
  }
  function smile(cx, cy) {
    return '<path class="mouth" d="M' + (cx - 4) + ' ' + cy + ' Q' + cx + ' ' + (cy + 4) + ' ' + (cx + 4) + ' ' + cy + '" stroke="' + OUT + '" stroke-width="1.8" fill="none" stroke-linecap="round"/>';
  }
  function cheeks(cy) {
    return (
      '<circle cx="42" cy="' + cy + '" r="2.4" fill="#ff8a80" opacity="0.6" stroke="none"/>' +
      '<circle cx="58" cy="' + cy + '" r="2.4" fill="#ff8a80" opacity="0.6" stroke="none"/>'
    );
  }

  // ── Runway model: glamorous figure in a flowing magenta gown + sun-hat ─────
  const fashionista =
    '<svg viewBox="0 0 100 100" class="model" ' + STROKE + ' aria-hidden="true">' +
      '<g class="body">' +
        // legs
        '<rect x="44" y="74" width="5" height="16" rx="2.5" fill="' + SKIN + '"/>' +
        '<rect x="51" y="74" width="5" height="16" rx="2.5" fill="' + SKIN + '"/>' +
        // high heels
        '<path d="M39 90 L49 90 L49 95 L38 95 Z" fill="#7c4dff"/>' +
        '<path d="M51 90 L61 90 L62 95 L51 95 Z" fill="#7c4dff"/>' +
        // flowing gown
        '<path class="dress" d="M40 40 Q33 62 29 80 L71 80 Q67 62 60 40 Q50 35 40 40 Z" fill="#e91e9c"/>' +
        '<path d="M50 44 L50 80" stroke="#ad1457" stroke-width="1.6" fill="none"/>' +
        // arms
        '<path class="arm arm-l" d="M41 44 Q31 53 29 65" fill="none" stroke="' + SKIN + '" stroke-width="5"/>' +
        '<path class="arm arm-r" d="M59 44 Q70 53 73 64" fill="none" stroke="' + SKIN + '" stroke-width="5"/>' +
      '</g>' +
      '<g class="accent">' +
        // diagonal sash
        '<path d="M42 42 L60 62" stroke="#ffd700" stroke-width="4" fill="none"/>' +
        // handbag in right hand
        '<rect x="69" y="62" width="11" height="8" rx="2" fill="#ffd700"/>' +
        '<path d="M71 62 Q74.5 56 78 62" stroke="#ffd700" stroke-width="1.6" fill="none"/>' +
      '</g>' +
      '<g class="head">' +
        '<circle cx="50" cy="26" r="14" fill="' + SKIN + '"/>' +
        // long flowing hair
        '<path d="M35 25 Q32 8 50 8 Q68 8 65 25 Q67 40 60 44 Q63 26 50 23 Q37 26 40 44 Q33 40 35 25 Z" fill="#3e2723"/>' +
        eye(45, 27) + eye(55, 27) + smile(50, 31) + cheeks(31) +
        // wide-brim glam hat
        '<ellipse cx="50" cy="15" rx="21" ry="4.5" fill="#ffd700"/>' +
        '<path d="M40 15 Q40 4 50 4 Q60 4 60 15 Z" fill="#ffd700"/>' +
        '<path d="M40 13 Q50 16 60 13" stroke="#e91e9c" stroke-width="2" fill="none"/>' +
      '</g>' +
    '</svg>';

  // ── Fashion designer: chic figure in a purple blazer, glasses, holds a hanger
  const designer =
    '<svg viewBox="0 0 100 100" class="designer" ' + STROKE + ' aria-hidden="true">' +
      '<g class="body">' +
        // legs / trousers
        '<rect x="43" y="74" width="6" height="16" rx="2" fill="#37474f"/>' +
        '<rect x="51" y="74" width="6" height="16" rx="2" fill="#37474f"/>' +
        // shoes
        '<path d="M38 90 L49 90 L49 94 L37 94 Z" fill="' + OUT + '"/>' +
        '<path d="M51 90 L62 90 L63 94 L51 94 Z" fill="' + OUT + '"/>' +
        // blazer
        '<path class="jacket" d="M38 42 Q34 60 37 76 L63 76 Q66 60 62 42 Q50 38 38 42 Z" fill="#7c4dff"/>' +
        '<path d="M50 42 L46 60 M50 42 L54 60" stroke="#5e35b1" stroke-width="1.6" fill="none"/>' +
        // arms
        '<path class="arm arm-l" d="M39 45 Q30 54 31 66" fill="none" stroke="' + SKIN + '" stroke-width="5"/>' +
        '<path class="arm arm-r" d="M61 45 Q70 53 69 64" fill="none" stroke="' + SKIN + '" stroke-width="5"/>' +
      '</g>' +
      '<g class="accent">' +
        // measuring tape draped around the neck
        '<path d="M45 42 Q41 56 47 65 M55 42 Q59 56 53 65" stroke="#ffd700" stroke-width="3" fill="none"/>' +
        // a garment hanger held up in the right hand
        '<path d="M69 64 L62 56 L76 56 Z" fill="none" stroke="#ffd700" stroke-width="2.4"/>' +
        '<path d="M69 56 Q69 51 72 52" fill="none" stroke="#ffd700" stroke-width="2"/>' +
      '</g>' +
      '<g class="head">' +
        '<circle cx="50" cy="26" r="14" fill="' + SKIN + '"/>' +
        // neat hair + top-knot bun
        '<path d="M36 24 Q36 9 50 9 Q64 9 64 24 Q60 16 50 15 Q40 16 36 24 Z" fill="#5d4037"/>' +
        '<circle cx="50" cy="8" r="4.5" fill="#5d4037"/>' +
        // stylish glasses
        '<circle cx="45" cy="27" r="4" fill="#fff" stroke="' + OUT + '" stroke-width="2"/>' +
        '<circle cx="55" cy="27" r="4" fill="#fff" stroke="' + OUT + '" stroke-width="2"/>' +
        '<path d="M49 27 L51 27" stroke="' + OUT + '" stroke-width="2"/>' +
        eye(45, 27) + eye(55, 27) + smile(50, 32) + cheeks(32) +
      '</g>' +
    '</svg>';

  const C = window.HocVuiCharacters;
  C.registerSpecies('fashionista', { svg: fashionista, classPrefix: 'model' });
  C.registerSpecies('designer', { svg: designer, classPrefix: 'designer' });
})();
