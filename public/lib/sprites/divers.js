// Học Vui — V36 "Thợ Lặn Kho Báu" sprite registry.
// Chibi scuba-diver avatar + treasure-chest mascot. Each species is an SVG
// (viewBox 0 0 100 100) with named <g>: .body, .head, .accent.
// CSS in v36/style.css drives animation per state (idle / happy).
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[divers.js] character.js must load first');
    return;
  }

  const OUT = '#03284a';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.6" fill="' + OUT + '"/>';
  }

  // Main player avatar — a cheerful chibi scuba diver with mask + flippers.
  const diver =
    '<svg viewBox="0 0 100 100" class="diver" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        // air tank on the back
        '<rect x="20" y="40" width="13" height="26" rx="6" fill="#48cae4"/>' +
        '<rect x="24" y="36" width="5" height="6" rx="2" fill="#0077b6"/>' +
        // rising bubbles
        '<circle class="bub b1" cx="72" cy="30" r="3" fill="#caf0f8" stroke="none"/>' +
        '<circle class="bub b2" cx="79" cy="22" r="2.2" fill="#caf0f8" stroke="none"/>' +
        '<circle class="bub b3" cx="68" cy="20" r="1.8" fill="#caf0f8" stroke="none"/>' +
      '</g>' +
      '<g class="body">' +
        // wetsuit torso
        '<rect x="34" y="50" width="32" height="30" rx="13" fill="#023e8a"/>' +
        '<rect x="34" y="60" width="32" height="6" fill="#0077b6" stroke="none"/>' +
        // arms
        '<rect x="28" y="52" width="10" height="20" rx="5" fill="#0077b6"/>' +
        '<rect x="62" y="52" width="10" height="20" rx="5" fill="#0077b6"/>' +
        // flippers
        '<path class="flipper fl-l" d="M34 78 Q24 88 30 94 L44 86 Z" fill="#ffb703"/>' +
        '<path class="flipper fl-r" d="M66 78 Q76 88 70 94 L56 86 Z" fill="#ffb703"/>' +
      '</g>' +
      '<g class="head">' +
        // head + skin
        '<circle cx="50" cy="32" r="18" fill="#ffd9a8"/>' +
        // diving mask glass
        '<rect class="mask" x="35" y="24" width="30" height="16" rx="8" fill="#90e0ef" stroke="#0077b6" stroke-width="2.5"/>' +
        '<rect x="35" y="24" width="30" height="16" rx="8" fill="none" stroke="#48cae4" stroke-width="1.5"/>' +
        eye(44, 32) + eye(56, 32) +
        // snorkel mouthpiece
        '<path d="M68 24 Q76 24 76 34 L76 44" stroke="#ffb703" stroke-width="4" fill="none"/>' +
        // smile under the mask
        '<path class="mouth" d="M44 45 Q50 49 56 45" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
      '</g>' +
    '</svg>';

  // Treasure-chest mascot — friendly chest with eyes that opens when found.
  const chest =
    '<svg viewBox="0 0 100 100" class="chest" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        // sparkles around the chest
        '<path class="spark s1" d="M22 24 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z" fill="#ffd60a" stroke="none"/>' +
        '<path class="spark s2" d="M80 30 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5 Z" fill="#fff3b0" stroke="none"/>' +
      '</g>' +
      '<g class="body">' +
        // chest base
        '<rect x="22" y="50" width="56" height="32" rx="6" fill="#8b5e34"/>' +
        // lid
        '<path class="lid" d="M22 50 Q22 30 50 30 Q78 30 78 50 Z" fill="#a06a3c"/>' +
        // gold bands
        '<rect x="22" y="60" width="56" height="6" fill="#ffd60a" stroke="none"/>' +
        '<rect x="46" y="50" width="8" height="32" fill="#ffd60a" stroke="none"/>' +
        // lock
        '<rect x="44" y="62" width="12" height="12" rx="2" fill="#ffd60a"/>' +
        '<circle cx="50" cy="67" r="2" fill="' + OUT + '" stroke="none"/>' +
      '</g>' +
      '<g class="head">' +
        // mascot eyes on the lid
        eye(42, 42) + eye(58, 42) +
        '<path class="mouth" d="M44 47 Q50 51 56 47" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
      '</g>' +
    '</svg>';

  const C = window.HocVuiCharacters;
  C.registerSpecies('diver', { svg: diver, classPrefix: 'diver' });
  C.registerSpecies('chest', { svg: chest, classPrefix: 'chest' });
})();
