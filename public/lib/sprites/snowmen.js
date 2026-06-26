// Học Vui — V56 "Người Tuyết Cứu Bắc Cực" sprite registry.
// Chibi snowman characters (viewBox 0 0 100 100) with named <g>: .body, .head, .face, .accent.
// One cute snowman factory reused for each accessory variant (ids match V56 ACCESSORIES),
// plus a "snow-pile" builder used in the build area. CSS in v56/style.css drives
// idle (gentle shiver/wobble) / happy (bounce) / melt (droop) per state.
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[snowmen.js] character.js must load first');
    return;
  }

  const OUT = '#0d47a1';                 // icy dark-blue outline
  const SNOW = '#ffffff';                // snow body
  const SHADE = '#d6eaf8';               // soft blue shading
  const COAL = '#0d47a1';                // coal eyes / buttons / smile
  const CARROT = '#fb8c00';              // carrot nose
  const TWIG = '#8d6e63';                // twig arms
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  // Reusable bits ────────────────────────────────────────────────────────
  function eye(cx) {
    return '<circle class="eye" cx="' + cx + '" cy="34" r="2.4" fill="' + COAL + '"/>';
  }
  function smile() {
    // dotted coal smile arc
    return (
      '<circle cx="44" cy="44" r="1.5" fill="' + COAL + '"/>' +
      '<circle cx="48" cy="46" r="1.5" fill="' + COAL + '"/>' +
      '<circle cx="52" cy="46" r="1.5" fill="' + COAL + '"/>' +
      '<circle cx="56" cy="44" r="1.5" fill="' + COAL + '"/>'
    );
  }
  function nose(big) {
    // carrot nose pointing down-right from the face center
    const tip = big ? 70 : 63;
    const w = big ? 5 : 4;
    return '<path class="nose" d="M50 ' + (40 - w / 2) + ' L' + tip + ' 41 L50 ' + (40 + w / 2) + ' Z" fill="' + CARROT + '" stroke="' + OUT + '" stroke-width="1.5"/>';
  }
  function arms(mitten) {
    let s =
      '<path d="M31 64 L16 56 M22 60 L18 53 M19 57 L13 58" stroke="' + TWIG + '" stroke-width="2.5" fill="none"/>' +
      '<path d="M69 64 L84 56 M78 60 L82 53 M81 57 L87 58" stroke="' + TWIG + '" stroke-width="2.5" fill="none"/>';
    if (mitten) {
      s +=
        '<circle cx="15" cy="55" r="5" fill="#1976d2" stroke="' + OUT + '" stroke-width="2"/>' +
        '<circle cx="85" cy="55" r="5" fill="#1976d2" stroke="' + OUT + '" stroke-width="2"/>';
    }
    return s;
  }

  // Accessory drawn in its own <g class="accent"> on top of the head.
  function accessory(kind) {
    if (kind === 'scarf') {
      return (
        '<g class="accent">' +
          '<path d="M37 50 Q50 56 63 50 L62 56 Q50 61 38 56 Z" fill="#e53935" stroke="' + OUT + '" stroke-width="2"/>' +
          '<path d="M57 55 L61 70 L54 70 L52 56 Z" fill="#e53935" stroke="' + OUT + '" stroke-width="2"/>' +
          '<path d="M55 62 L59 62 M54 67 L58 67" stroke="#fff" stroke-width="1.5"/>' +
        '</g>'
      );
    }
    if (kind === 'hat') {
      return (
        '<g class="accent">' +
          '<rect x="33" y="24" width="34" height="5" rx="2" fill="#37474f" stroke="' + OUT + '" stroke-width="2"/>' +
          '<rect x="39" y="9" width="22" height="17" rx="2" fill="#37474f" stroke="' + OUT + '" stroke-width="2"/>' +
          '<rect x="39" y="20" width="22" height="4" fill="#e53935"/>' +
        '</g>'
      );
    }
    if (kind === 'bonnet') {
      return (
        '<g class="accent">' +
          '<ellipse cx="50" cy="25" rx="24" ry="7" fill="#f48fb1" stroke="' + OUT + '" stroke-width="2"/>' +
          '<path d="M38 25 Q50 8 62 25 Z" fill="#f8bbd0" stroke="' + OUT + '" stroke-width="2"/>' +
          '<path d="M40 25 Q50 19 60 25" stroke="#ad1457" stroke-width="2" fill="none"/>' +
        '</g>'
      );
    }
    if (kind === 'gloves') {
      // gloves accessory = bright earmuffs band on the head (mittens already on arms)
      return (
        '<g class="accent">' +
          '<path d="M34 30 A18 18 0 0 1 66 30" fill="none" stroke="#1976d2" stroke-width="3"/>' +
          '<circle cx="34" cy="33" r="5" fill="#1976d2" stroke="' + OUT + '" stroke-width="2"/>' +
          '<circle cx="66" cy="33" r="5" fill="#1976d2" stroke="' + OUT + '" stroke-width="2"/>' +
        '</g>'
      );
    }
    // 'carrot' or none → no head accessory (big carrot is on the face)
    return '';
  }

  // Main snowman factory ───────────────────────────────────────────────────
  // o: { acc } where acc ∈ '', 'scarf', 'hat', 'carrot', 'gloves', 'bonnet'
  function makeSnowman(o) {
    o = o || {};
    const acc = o.acc || '';
    return (
      '<svg viewBox="0 0 100 100" class="sm" ' + STROKE + ' aria-hidden="true">' +
        '<g class="arms">' + arms(acc === 'gloves') + '</g>' +
        '<g class="body">' +
          '<circle cx="50" cy="74" r="20" fill="' + SNOW + '"/>' +
          '<ellipse cx="57" cy="80" rx="9" ry="6" fill="' + SHADE + '" opacity="0.6"/>' +
          '<circle cx="50" cy="66" r="2.2" fill="' + COAL + '"/>' +
          '<circle cx="50" cy="74" r="2.2" fill="' + COAL + '"/>' +
          '<circle cx="50" cy="82" r="2.2" fill="' + COAL + '"/>' +
        '</g>' +
        '<g class="head">' +
          '<circle cx="50" cy="37" r="14" fill="' + SNOW + '"/>' +
          '<ellipse cx="55" cy="42" rx="6" ry="4" fill="' + SHADE + '" opacity="0.6"/>' +
          '<g class="face">' + eye(44) + eye(56) + nose(acc === 'carrot') + smile() + '</g>' +
        '</g>' +
        accessory(acc) +
      '</svg>'
    );
  }

  // Builder snow-pile (build area at 0 pieces) ───────────────────────────────
  const snowPile =
    '<svg viewBox="0 0 100 100" class="sm-pile" ' + STROKE + ' aria-hidden="true">' +
      '<g class="body">' +
        '<path d="M14 82 Q30 60 50 62 Q70 60 86 82 Z" fill="' + SNOW + '"/>' +
        '<ellipse cx="40" cy="78" rx="8" ry="3" fill="' + SHADE + '" opacity="0.6"/>' +
        '<circle cx="64" cy="74" r="3" fill="' + SHADE + '" opacity="0.7"/>' +
      '</g>' +
      '<g class="accent">' +
        '<path d="M26 56 L28 50 M30 53 L24 52" stroke="#bbdefb" stroke-width="2"/>' +
        '<path d="M74 54 L76 48 M78 51 L72 50" stroke="#bbdefb" stroke-width="2"/>' +
      '</g>' +
    '</svg>';

  const C = window.HocVuiCharacters;

  // Plain snowman + one variant per V56 accessory.
  C.registerSpecies('snowman',         { svg: makeSnowman({ acc: '' }),        classPrefix: 'sm' });
  C.registerSpecies('snowman-scarf',   { svg: makeSnowman({ acc: 'scarf' }),   classPrefix: 'sm' });
  C.registerSpecies('snowman-hat',     { svg: makeSnowman({ acc: 'hat' }),     classPrefix: 'sm' });
  C.registerSpecies('snowman-carrot',  { svg: makeSnowman({ acc: 'carrot' }),  classPrefix: 'sm' });
  C.registerSpecies('snowman-gloves',  { svg: makeSnowman({ acc: 'gloves' }),  classPrefix: 'sm' });
  C.registerSpecies('snowman-bonnet',  { svg: makeSnowman({ acc: 'bonnet' }),  classPrefix: 'sm' });

  // Builder pile used while a snowman is still being stacked.
  C.registerSpecies('snow-pile',       { svg: snowPile,                        classPrefix: 'sm-pile' });
})();
