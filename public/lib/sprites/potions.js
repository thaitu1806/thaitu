// Học Vui — V54 "Phù Thủy Thuốc" sprite registry.
// A chibi witch stirring the cauldron + cute potion-bottle characters (one per
// ingredient color) and a legendary potion. Each species is an SVG
// (viewBox 0 0 100 100) with named <g>: .body, .head, .accent.
// CSS in v54/style.css drives animation per state (idle / happy / scared).
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[potions.js] character.js must load first');
    return;
  }

  const OUT = '#2e0854';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  // Reusable bits ────────────────────────────────────────────────────────
  function eye(cx, cy) {
    return (
      '<g class="eye">' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="5" fill="#fff" stroke="' + OUT + '" stroke-width="1.4"/>' +
        '<circle cx="' + cx + '" cy="' + (cy + 0.8) + '" r="2.6" fill="' + OUT + '"/>' +
        '<circle cx="' + (cx + 1.3) + '" cy="' + (cy - 0.6) + '" r="1" fill="#fff"/>' +
      '</g>'
    );
  }
  function smile(d) {
    return '<path class="mouth" d="' + d + '" stroke="' + OUT + '" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
  }
  function cheeks(cx1, cx2, cy) {
    return (
      '<circle class="cheek" cx="' + cx1 + '" cy="' + cy + '" r="3" fill="#ff8ab8" opacity="0.55" stroke="none"/>' +
      '<circle class="cheek" cx="' + cx2 + '" cy="' + cy + '" r="3" fill="#ff8ab8" opacity="0.55" stroke="none"/>'
    );
  }

  // Witch factory ───────────────────────────────────────────────────────────
  // opts: { robe, hat, skin, brim, pet } — pet is an SVG snippet on the hat brim.
  function makeWitch(o) {
    const pet = o.pet || '';
    return (
      '<svg viewBox="0 0 100 100" class="witch-spr" ' + STROKE + ' aria-hidden="true">' +
        '<ellipse class="accent shadow" cx="50" cy="92" rx="24" ry="5" fill="' + OUT + '" opacity="0.25"/>' +
        // Stirring spoon held in front.
        '<g class="arms">' +
          '<path d="M58 64 L74 76" stroke="' + o.skin + '" stroke-width="5" fill="none"/>' +
          '<path d="M74 76 L82 58" stroke="#8d6e63" stroke-width="3.5" fill="none"/>' +
          '<ellipse cx="84" cy="55" rx="5" ry="3.5" fill="#8d6e63" stroke="' + OUT + '" stroke-width="1.5"/>' +
        '</g>' +
        '<g class="body">' +
          // Robe.
          '<path d="M34 58 Q50 50 66 58 L72 86 L28 86 Z" fill="' + o.robe + '"/>' +
          '<path d="M28 86 L72 86" stroke="' + OUT + '" stroke-width="2"/>' +
          // Belt buckle.
          '<rect x="44" y="70" width="12" height="8" rx="2" fill="#ffd54f" stroke="' + OUT + '" stroke-width="1.5"/>' +
        '</g>' +
        '<g class="head">' +
          '<circle cx="50" cy="42" r="14" fill="' + o.skin + '"/>' +
          eye(44, 43) + eye(56, 43) + smile('M45 49 Q50 54 55 49') +
          cheeks(40, 60, 48) +
        '</g>' +
        '<g class="accent">' +
          // Witch hat.
          '<ellipse class="brim" cx="50" cy="30" rx="26" ry="6" fill="' + o.brim + '"/>' +
          '<path class="hat" d="M36 30 Q48 -4 64 28 Q57 24 50 25 Q43 25 36 30 Z" fill="' + o.hat + '"/>' +
          '<path d="M37 29 Q50 24 63 28" stroke="#ffd54f" stroke-width="2.5" fill="none"/>' +
          '<path class="star" d="M52 6 L53.5 11 L58.5 11 L54.5 14 L56 19 L52 16 L48 19 L49.5 14 L45.5 11 L50.5 11 Z" fill="#fff59d" stroke="#f9a825" stroke-width="0.8"/>' +
          pet +
        '</g>' +
      '</svg>'
    );
  }

  // Pet snippets that perch by the hat brim.
  const PET_CAT =
    '<g class="pet">' +
      '<ellipse cx="22" cy="30" rx="6" ry="5" fill="#311b4f" stroke="' + OUT + '" stroke-width="1.5"/>' +
      '<path d="M18 26 L17 21 L21 25 Z" fill="#311b4f" stroke="' + OUT + '" stroke-width="1.2"/>' +
      '<path d="M26 26 L27 21 L23 25 Z" fill="#311b4f" stroke="' + OUT + '" stroke-width="1.2"/>' +
      '<circle cx="20" cy="30" r="1.2" fill="#ffeb3b"/>' +
      '<circle cx="24" cy="30" r="1.2" fill="#ffeb3b"/>' +
    '</g>';
  const PET_OWL =
    '<g class="pet">' +
      '<ellipse cx="22" cy="29" rx="6.5" ry="6" fill="#a1887f" stroke="' + OUT + '" stroke-width="1.5"/>' +
      '<circle cx="19.5" cy="28" r="2.2" fill="#fff" stroke="' + OUT + '" stroke-width="1"/>' +
      '<circle cx="24.5" cy="28" r="2.2" fill="#fff" stroke="' + OUT + '" stroke-width="1"/>' +
      '<circle cx="19.5" cy="28" r="0.9" fill="' + OUT + '"/>' +
      '<circle cx="24.5" cy="28" r="0.9" fill="' + OUT + '"/>' +
      '<path d="M22 30 L20.5 32 L23.5 32 Z" fill="#ffb300"/>' +
    '</g>';

  // Potion-bottle factory ───────────────────────────────────────────────────
  // opts: { fill, shade } — bubbly liquid color in a cute round flask with a face.
  function makePotion(o) {
    return (
      '<svg viewBox="0 0 100 100" class="potion-spr" ' + STROKE + ' aria-hidden="true">' +
        '<ellipse class="accent shadow" cx="50" cy="90" rx="22" ry="5" fill="' + OUT + '" opacity="0.25"/>' +
        '<g class="body">' +
          // Round flask glass.
          '<path d="M42 30 L42 44 Q26 54 26 70 Q26 88 50 88 Q74 88 74 70 Q74 54 58 44 L58 30 Z" fill="#e1bee7" opacity="0.55"/>' +
          // Liquid fill.
          '<path d="M31 58 Q50 50 69 58 Q72 64 72 70 Q72 86 50 86 Q28 86 28 70 Q28 64 31 58 Z" fill="' + o.fill + '"/>' +
          '<path d="M31 58 Q50 64 69 58 Q72 64 72 70 Q72 86 50 86 Q28 86 28 70 Q28 64 31 58 Z" fill="' + o.shade + '" opacity="0.4" stroke="none"/>' +
          // Glass highlight.
          '<path d="M37 50 Q33 60 35 72" stroke="#fff" stroke-width="3" fill="none" opacity="0.5" stroke-linecap="round"/>' +
          // Neck + cork.
          '<rect x="42" y="26" width="16" height="8" rx="2" fill="#e1bee7" opacity="0.7"/>' +
          '<rect x="40" y="20" width="20" height="8" rx="3" fill="#a1887f"/>' +
        '</g>' +
        '<g class="head">' +
          eye(43, 68) + eye(57, 68) + smile('M44 74 Q50 79 56 74') +
          cheeks(36, 64, 75) +
        '</g>' +
        '<g class="accent">' +
          // Rising bubbles.
          '<circle class="bub bub-1" cx="46" cy="64" r="2.6" fill="#fff" opacity="0.7"/>' +
          '<circle class="bub bub-2" cx="56" cy="60" r="2" fill="#fff" opacity="0.7"/>' +
          '<circle class="bub bub-3" cx="50" cy="56" r="1.6" fill="#fff" opacity="0.7"/>' +
        '</g>' +
      '</svg>'
    );
  }

  // Legendary potion — golden gradient flask with floating stars.
  function makeLegendary() {
    return (
      '<svg viewBox="0 0 100 100" class="potion-spr potion-legendary-spr" ' + STROKE + ' aria-hidden="true">' +
        '<defs>' +
          '<linearGradient id="potLegGrad" x1="0" y1="0" x2="1" y2="1">' +
            '<stop offset="0%" stop-color="#fff59d"/>' +
            '<stop offset="45%" stop-color="#ffd54f"/>' +
            '<stop offset="100%" stop-color="#ff8f00"/>' +
          '</linearGradient>' +
        '</defs>' +
        '<ellipse class="accent shadow" cx="50" cy="90" rx="22" ry="5" fill="' + OUT + '" opacity="0.25"/>' +
        '<g class="body">' +
          '<path d="M42 30 L42 44 Q26 54 26 70 Q26 88 50 88 Q74 88 74 70 Q74 54 58 44 L58 30 Z" fill="#fff8e1" opacity="0.55"/>' +
          '<path d="M31 56 Q50 48 69 56 Q72 63 72 70 Q72 86 50 86 Q28 86 28 70 Q28 63 31 56 Z" fill="url(#potLegGrad)"/>' +
          '<path d="M37 50 Q33 60 35 72" stroke="#fff" stroke-width="3" fill="none" opacity="0.6" stroke-linecap="round"/>' +
          '<rect x="42" y="26" width="16" height="8" rx="2" fill="#fff8e1" opacity="0.7"/>' +
          '<rect x="40" y="20" width="20" height="8" rx="3" fill="#8d6e63"/>' +
        '</g>' +
        '<g class="head">' +
          eye(43, 68) + eye(57, 68) +
          '<path class="mouth" d="M43 73 Q50 80 57 73" stroke="' + OUT + '" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
          cheeks(36, 64, 75) +
        '</g>' +
        '<g class="accent">' +
          '<path class="spark spark-1" d="M50 10 L52 16 L58 18 L52 20 L50 26 L48 20 L42 18 L48 16 Z" fill="#fff59d" stroke="#f9a825" stroke-width="1"/>' +
          '<path class="spark spark-2" d="M78 26 L79.5 30 L84 31.5 L79.5 33 L78 37 L76.5 33 L72 31.5 L76.5 30 Z" fill="#fff" stroke="#ffb300" stroke-width="1"/>' +
          '<path class="spark spark-3" d="M18 32 L19.5 36 L24 37.5 L19.5 39 L18 43 L16.5 39 L12 37.5 L16.5 36 Z" fill="#fff" stroke="#ffb300" stroke-width="1"/>' +
        '</g>' +
      '</svg>'
    );
  }

  const C = window.HocVuiCharacters;

  // Witch stage characters (picked at random each run).
  C.registerSpecies('witch',     { svg: makeWitch({ robe: '#7b1fa2', hat: '#4a148c', skin: '#ffcc80', brim: '#311b4f' }), classPrefix: 'witch' });
  C.registerSpecies('witch-cat', { svg: makeWitch({ robe: '#ad1457', hat: '#311b4f', skin: '#ffe0b2', brim: '#1a0033', pet: PET_CAT }), classPrefix: 'witch-cat' });
  C.registerSpecies('witch-owl', { svg: makeWitch({ robe: '#6a1b9a', hat: '#283593', skin: '#f5cba7', brim: '#1a237e', pet: PET_OWL }), classPrefix: 'witch-owl' });

  // Potion-bottle characters (ids match INGREDIENT_COLORS in game-logic.js).
  C.registerSpecies('potion-red',    { svg: makePotion({ fill: '#ef5350', shade: '#c62828' }), classPrefix: 'potion-red' });
  C.registerSpecies('potion-green',  { svg: makePotion({ fill: '#66bb6a', shade: '#2e7d32' }), classPrefix: 'potion-green' });
  C.registerSpecies('potion-blue',   { svg: makePotion({ fill: '#42a5f5', shade: '#1565c0' }), classPrefix: 'potion-blue' });
  C.registerSpecies('potion-purple', { svg: makePotion({ fill: '#ab47bc', shade: '#6a1b9a' }), classPrefix: 'potion-purple' });
  C.registerSpecies('potion-gold',   { svg: makePotion({ fill: '#ffca28', shade: '#f9a825' }), classPrefix: 'potion-gold' });
  C.registerSpecies('potion-legendary', { svg: makeLegendary(), classPrefix: 'potion-legendary' });
})();
