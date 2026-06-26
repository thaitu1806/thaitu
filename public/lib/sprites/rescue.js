// Học Vui — V33 "Đội Cứu Hộ" sprite registry.
// Chibi rescue worker (paramedic/lifeguard) + a friendly rescue helicopter.
// Each species is an SVG (viewBox 0 0 100 100) with named <g>: .body, .head, .accent.
// CSS in v33/style.css drives animation per state (idle / happy).
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[rescue.js] character.js must load first');
    return;
  }

  const OUT = '#1e3a14';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.4" fill="' + OUT + '"/>';
  }

  // Main avatar — a cheerful chibi rescue worker with helmet + red-cross badge.
  const worker =
    '<svg viewBox="0 0 100 100" class="worker" ' + STROKE + ' aria-hidden="true">' +
      '<g class="body">' +
        '<rect x="40" y="82" width="8" height="14" rx="3" fill="#3a4a2a"/>' +
        '<rect x="52" y="82" width="8" height="14" rx="3" fill="#3a4a2a"/>' +
        '<path d="M32 86 Q30 60 50 58 Q70 60 68 86 Z" fill="#ee5a24"/>' +
        '<path d="M34 76 Q50 80 66 76" fill="none" stroke="#ffd93d" stroke-width="4"/>' +
        '<path class="arm-l" d="M34 64 L22 74" stroke="#ee5a24" stroke-width="7"/>' +
        '<path class="arm-r" d="M66 64 L78 70" stroke="#ee5a24" stroke-width="7"/>' +
        '<circle cx="21" cy="75" r="4" fill="#ffd9b3"/>' +
        '<circle cx="79" cy="70" r="4" fill="#ffd9b3"/>' +
      '</g>' +
      '<g class="accent">' +
        '<rect x="45" y="64" width="10" height="3" fill="#fff"/>' +
        '<rect x="48.5" y="61" width="3" height="9" fill="#fff"/>' +
      '</g>' +
      '<g class="head">' +
        '<circle cx="50" cy="40" r="15" fill="#ffd9b3"/>' +
        '<path d="M34 38 Q34 18 50 18 Q66 18 66 38 Z" fill="#fff"/>' +
        '<rect x="33" y="36" width="34" height="5" rx="2" fill="#e63946" stroke="none"/>' +
        '<rect x="46" y="24" width="8" height="3" fill="#e63946" stroke="none"/>' +
        '<rect x="48.5" y="21.5" width="3" height="8" fill="#e63946" stroke="none"/>' +
        eye(45, 44) + eye(55, 44) +
        '<path class="mouth" d="M45 49 Q50 53 55 49" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
      '</g>' +
    '</svg>';

  // Companion vehicle — a friendly red rescue helicopter (matches the 🚁 theme).
  const chopper =
    '<svg viewBox="0 0 100 100" class="chopper" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        '<rect x="48" y="22" width="4" height="12" fill="#37474f"/>' +
        '<rect class="rotor" x="14" y="26" width="72" height="5" rx="2.5" fill="#37474f"/>' +
      '</g>' +
      '<g class="body">' +
        '<path d="M20 56 Q20 40 44 40 L60 40 Q74 40 78 52 L86 56 Q90 58 86 62 L70 64 Q60 70 44 70 Q20 70 20 56 Z" fill="#FF6B6B"/>' +
        '<path d="M78 54 L96 50 L96 56 L80 60 Z" fill="#ee5a24"/>' +
        '<g class="tail-rotor"><rect x="92" y="44" width="3" height="14" rx="1.5" fill="#37474f"/></g>' +
        '<path d="M30 72 L30 78 M58 72 L58 78 M24 80 L66 80" stroke="#37474f" stroke-width="3" fill="none"/>' +
        '<rect x="40" y="52" width="10" height="3.5" fill="#fff" stroke="none"/>' +
        '<rect x="43.25" y="48.75" width="3.5" height="10" fill="#fff" stroke="none"/>' +
      '</g>' +
      '<g class="head">' +
        '<path d="M22 54 Q22 44 34 44 Q40 44 40 54 Z" fill="#cfeffd"/>' +
        eye(30, 51) +
        '<path class="mouth" d="M26 58 Q31 61 35 58" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
      '</g>' +
    '</svg>';

  const C = window.HocVuiCharacters;
  C.registerSpecies('rescue_worker', { svg: worker, classPrefix: 'worker' });
  C.registerSpecies('rescue_chopper', { svg: chopper, classPrefix: 'chopper' });
})();
