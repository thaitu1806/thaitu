// Học Vui — V24 "Xây Thành Phố" sprite registry.
// Chibi city crew: a hard-hat mayor / city-planner holding a blueprint plus a
// cheering citizen resident. Each species is an SVG (viewBox 0 0 100 100) with
// named <g>: .body, .head, .accent. CSS in v24/style.css drives animation per
// state (idle / happy). Distinct species ids from V8's builders.js.
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[citizens.js] character.js must load first');
    return;
  }

  const OUT = '#1e3a2e';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';
  const SKIN = '#f1c27d';

  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.3" fill="' + OUT + '"/>';
  }

  // Cheerful mayor / city-planner — yellow hard hat, blue vest, blueprint.
  const mayor =
    '<svg viewBox="0 0 100 100" class="citizen" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        '<g class="tool">' +
          '<rect x="66" y="48" width="22" height="16" rx="2" fill="#4facfe"/>' +
          '<path d="M70 53 H84 M70 57 H80 M70 61 H84" stroke="#eaf6ff" stroke-width="1.6"/>' +
        '</g>' +
      '</g>' +
      '<g class="body">' +
        '<path d="M34 92 L34 64 Q34 54 50 54 Q66 54 66 64 L66 92 Z" fill="#1a6b9c"/>' +
        '<path d="M50 54 L45 70 L50 74 L55 70 Z" fill="#ffd700"/>' +
        '<circle cx="45" cy="64" r="2.1" fill="#ffd700"/>' +
        '<circle cx="55" cy="64" r="2.1" fill="#ffd700"/>' +
        '<rect x="28" y="58" width="10" height="20" rx="5" fill="' + SKIN + '"/>' +
        '<g class="arm"><rect x="62" y="56" width="10" height="20" rx="5" fill="' + SKIN + '"/></g>' +
      '</g>' +
      '<g class="head">' +
        '<circle cx="50" cy="40" r="16" fill="' + SKIN + '"/>' +
        '<path d="M31 40 Q31 22 50 22 Q69 22 69 40 Z" fill="#ffd700"/>' +
        '<rect x="28" y="38" width="44" height="6" rx="3" fill="#f4b41a"/>' +
        '<rect x="47" y="22" width="6" height="8" rx="2" fill="#f4b41a"/>' +
        eye(44, 41) + eye(56, 41) +
        '<path class="mouth" d="M44 48 Q50 53 56 48" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
      '</g>' +
    '</svg>';

  // Happy citizen resident — green shirt, waving an arm.
  const citizen =
    '<svg viewBox="0 0 100 100" class="citizen" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent"></g>' +
      '<g class="body">' +
        '<path d="M34 92 L34 64 Q34 54 50 54 Q66 54 66 64 L66 92 Z" fill="#27ae60"/>' +
        '<path d="M44 56 L50 62 L56 56" fill="none" stroke="#1f9551" stroke-width="2"/>' +
        '<rect x="28" y="58" width="10" height="20" rx="5" fill="' + SKIN + '"/>' +
        '<g class="arm"><rect x="63" y="40" width="9" height="20" rx="4.5" fill="' + SKIN + '"/></g>' +
      '</g>' +
      '<g class="head">' +
        '<path d="M34 40 Q34 22 50 22 Q66 22 66 40 Q66 45 61 47 L39 47 Q34 45 34 40" fill="#5a3b22"/>' +
        '<circle cx="50" cy="42" r="15" fill="' + SKIN + '"/>' +
        eye(45, 42) + eye(55, 42) +
        '<circle cx="41" cy="48" r="2.3" fill="#ff9eb5"/>' +
        '<circle cx="59" cy="48" r="2.3" fill="#ff9eb5"/>' +
        '<path class="mouth" d="M44 50 Q50 56 56 50" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
      '</g>' +
    '</svg>';

  const C = window.HocVuiCharacters;
  C.registerSpecies('mayor', { svg: mayor, classPrefix: 'citizen' });
  C.registerSpecies('citizen', { svg: citizen, classPrefix: 'citizen' });
})();
