// Học Vui — V8 "Xây Lâu Đài" sprite registry.
// Chibi castle-building crew: a hard-hat builder + a knight, plus a king and
// princess mascot. Each species is an SVG (viewBox 0 0 100 100) with named
// <g>: .body, .head, .accent. CSS in v8/style.css drives animation per state
// (idle / happy / scared).
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[builders.js] character.js must load first');
    return;
  }

  const OUT = '#3a2c1e';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.3" fill="' + OUT + '"/>';
  }

  // Cheerful builder in yellow hard hat + green overalls, holding a hammer.
  const builder =
    '<svg viewBox="0 0 100 100" class="builder" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        '<g class="tool">' +
          '<rect x="74" y="40" width="5" height="30" rx="2" fill="#a9743b"/>' +
          '<rect x="68" y="34" width="18" height="10" rx="3" fill="#9aa6b2"/>' +
        '</g>' +
      '</g>' +
      '<g class="body">' +
        '<path d="M34 92 L34 64 Q34 54 50 54 Q66 54 66 64 L66 92 Z" fill="#27ae60"/>' +
        '<rect x="44" y="58" width="12" height="30" rx="3" fill="#2f8f55"/>' +
        '<circle cx="44" cy="66" r="2.2" fill="#f7d774"/>' +
        '<circle cx="56" cy="66" r="2.2" fill="#f7d774"/>' +
        '<g class="arm"><rect x="62" y="58" width="10" height="20" rx="5" fill="#f1c27d"/></g>' +
        '<rect x="28" y="58" width="10" height="20" rx="5" fill="#f1c27d"/>' +
      '</g>' +
      '<g class="head">' +
        '<circle cx="50" cy="40" r="16" fill="#f1c27d"/>' +
        '<path d="M31 40 Q31 22 50 22 Q69 22 69 40 Z" fill="#f4b41a"/>' +
        '<rect x="28" y="38" width="44" height="6" rx="3" fill="#f4b41a"/>' +
        eye(44, 41) + eye(56, 41) +
        '<path class="mouth" d="M45 48 Q50 52 55 48" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
      '</g>' +
    '</svg>';

  // Little knight in grey armour with a blue plume.
  const knight =
    '<svg viewBox="0 0 100 100" class="builder" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        '<g class="tool"><rect x="72" y="30" width="5" height="42" rx="2" fill="#c0c8d0"/>' +
          '<rect x="66" y="44" width="17" height="5" rx="2" fill="#8a939c"/></g>' +
      '</g>' +
      '<g class="body">' +
        '<path d="M34 92 L34 64 Q34 54 50 54 Q66 54 66 64 L66 92 Z" fill="#9aa6b2"/>' +
        '<path d="M44 56 L50 62 L56 56" fill="none" stroke="#6b7681" stroke-width="2"/>' +
        '<rect x="28" y="58" width="10" height="20" rx="5" fill="#9aa6b2"/>' +
        '<g class="arm"><rect x="62" y="58" width="10" height="20" rx="5" fill="#9aa6b2"/></g>' +
      '</g>' +
      '<g class="head">' +
        '<circle cx="50" cy="40" r="16" fill="#cfd6dd"/>' +
        '<path class="plume" d="M50 22 Q44 12 50 8 Q56 12 50 22" fill="#3498db"/>' +
        '<rect x="40" y="36" width="20" height="6" rx="2" fill="#aeb6bf"/>' +
        eye(45, 45) + eye(55, 45) +
        '<path class="mouth" d="M45 52 Q50 55 55 52" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
      '</g>' +
    '</svg>';

  // King mascot — crowned, red robe.
  const king =
    '<svg viewBox="0 0 100 100" class="builder" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent"><path class="crown" d="M34 26 L34 14 L42 22 L50 10 L58 22 L66 14 L66 26 Z" fill="#f4c430"/>' +
        '<circle cx="50" cy="13" r="2.4" fill="#e74c3c"/></g>' +
      '<g class="body">' +
        '<path d="M32 92 L32 62 Q32 52 50 52 Q68 52 68 62 L68 92 Z" fill="#c0392b"/>' +
        '<rect x="46" y="56" width="8" height="34" rx="2" fill="#f4c430"/>' +
        '<rect x="26" y="56" width="10" height="20" rx="5" fill="#f1c27d"/>' +
        '<g class="arm"><rect x="64" y="56" width="10" height="20" rx="5" fill="#f1c27d"/></g>' +
      '</g>' +
      '<g class="head">' +
        '<circle cx="50" cy="40" r="16" fill="#f1c27d"/>' +
        eye(44, 40) + eye(56, 40) +
        '<path d="M40 33 Q44 30 48 33 M52 33 Q56 30 60 33" stroke="' + OUT + '" stroke-width="1.6" fill="none"/>' +
        '<path class="mouth" d="M44 47 Q50 52 56 47" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
        '<path d="M42 50 Q50 60 58 50" fill="#fff" stroke="' + OUT + '" stroke-width="1.5"/>' +
      '</g>' +
    '</svg>';

  // Princess mascot — pink dress, small tiara.
  const princess =
    '<svg viewBox="0 0 100 100" class="builder" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent"><path class="crown" d="M40 24 L44 16 L50 22 L56 16 L60 24 Z" fill="#f4c430"/>' +
        '<circle cx="50" cy="18" r="2" fill="#e84393"/></g>' +
      '<g class="body">' +
        '<path d="M28 92 L40 60 Q44 54 50 54 Q56 54 60 60 L72 92 Z" fill="#ff7eb3"/>' +
        '<path d="M46 58 L50 64 L54 58" fill="none" stroke="#e84393" stroke-width="2"/>' +
        '<rect x="30" y="58" width="9" height="18" rx="4" fill="#f1c27d"/>' +
        '<g class="arm"><rect x="61" y="58" width="9" height="18" rx="4" fill="#f1c27d"/></g>' +
      '</g>' +
      '<g class="head">' +
        '<path d="M32 42 Q32 60 38 66 L62 66 Q68 60 68 42 Q68 26 50 26 Q32 26 32 42" fill="#7a4a1e"/>' +
        '<circle cx="50" cy="40" r="14" fill="#f1c27d"/>' +
        eye(45, 41) + eye(55, 41) +
        '<circle cx="41" cy="46" r="2.4" fill="#ff9eb5"/>' +
        '<circle cx="59" cy="46" r="2.4" fill="#ff9eb5"/>' +
        '<path class="mouth" d="M46 49 Q50 53 54 49" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
      '</g>' +
    '</svg>';

  const C = window.HocVuiCharacters;
  C.registerSpecies('builder', { svg: builder, classPrefix: 'builder' });
  C.registerSpecies('knight', { svg: knight, classPrefix: 'builder' });
  C.registerSpecies('king', { svg: king, classPrefix: 'builder' });
  C.registerSpecies('princess', { svg: princess, classPrefix: 'builder' });
})();
