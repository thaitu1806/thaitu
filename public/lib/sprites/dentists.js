// Học Vui — V38 "Bác Sĩ Răng" sprite registry.
// Chibi kid-dentist (surgical cap, head-mirror, face mask, dental mirror tool)
// + a smiling tooth mascot. Each species is an SVG (viewBox 0 0 100 100) with
// named <g>: .body, .head, .accent so CSS can target parts.
// CSS in v38/style.css drives animation per state (idle / happy).
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[dentists.js] character.js must load first');
    return;
  }

  const OUT = '#0c4a6e';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.4" fill="' + OUT + '"/>';
  }

  // Player avatar — a cheerful chibi kid dentist.
  const dentist =
    '<svg viewBox="0 0 100 100" class="dentist" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        // dental mirror tool held in the right hand
        '<line x1="78" y1="60" x2="91" y2="36" stroke="' + OUT + '" stroke-width="3"/>' +
        '<circle cx="92" cy="33" r="6" fill="#cbd5e1"/>' +
        '<circle cx="92" cy="33" r="2.6" fill="#a5f3fc"/>' +
      '</g>' +
      '<g class="body">' +
        // white coat
        '<path d="M28 94 Q28 64 50 64 Q72 64 72 94 Z" fill="#ffffff"/>' +
        '<path d="M50 64 L45 94 M50 64 L55 94" stroke="#bae6fd" stroke-width="2" fill="none"/>' +
        // arms
        '<path d="M32 70 Q21 77 25 90" fill="none" stroke="#ffffff" stroke-width="9"/>' +
        '<path d="M68 70 Q81 66 80 58" fill="none" stroke="#ffffff" stroke-width="9"/>' +
        // hands
        '<circle cx="25" cy="90" r="4" fill="#ffd9b3"/>' +
        '<circle cx="80" cy="58" r="4" fill="#ffd9b3"/>' +
      '</g>' +
      '<g class="head">' +
        // face
        '<circle cx="50" cy="40" r="20" fill="#ffd9b3"/>' +
        // surgical cap
        '<path d="M30 36 Q30 14 50 14 Q70 14 70 36 Q60 27 50 27 Q40 27 30 36 Z" fill="#67e8f9"/>' +
        // head-mirror band + reflector disc on forehead
        '<rect x="41" y="30" width="18" height="4.5" rx="2" fill="#0891b2"/>' +
        '<circle cx="50" cy="32" r="5" fill="#cbd5e1"/>' +
        '<circle cx="50" cy="32" r="2" fill="#a5f3fc"/>' +
        // eyes
        eye(43, 40) + eye(57, 40) +
        // face mask + straps
        '<path d="M36 46 Q50 55 64 46 L62 57 Q50 64 38 57 Z" fill="#a5f3fc"/>' +
        '<path d="M36 47 L30 43 M64 47 L70 43" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
      '</g>' +
    '</svg>';

  // Mascot — a happy, sparkling clean tooth.
  const tooth =
    '<svg viewBox="0 0 100 100" class="tooth" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        // sparkle
        '<path d="M74 22 l2.2 6.4 l6.4 2.2 l-6.4 2.2 l-2.2 6.4 l-2.2 -6.4 l-6.4 -2.2 l6.4 -2.2 Z" fill="#a5f3fc"/>' +
      '</g>' +
      '<g class="body">' +
        // tooth crown + two roots
        '<path d="M28 40 Q28 16 50 16 Q72 16 72 40 Q72 54 62 56 L57 82 Q55 89 52 80 L50 62 L48 80 Q45 89 43 82 L38 56 Q28 54 28 40 Z" fill="#ffffff"/>' +
      '</g>' +
      '<g class="head">' +
        '<circle cx="37" cy="50" r="4.5" fill="#fca5a5" opacity="0.7"/>' +
        '<circle cx="63" cy="50" r="4.5" fill="#fca5a5" opacity="0.7"/>' +
        eye(43, 40) + eye(57, 40) +
        '<path class="mouth" d="M41 48 Q50 58 59 48" stroke="' + OUT + '" stroke-width="2.5" fill="none"/>' +
      '</g>' +
    '</svg>';

  const C = window.HocVuiCharacters;
  C.registerSpecies('dentist', { svg: dentist, classPrefix: 'dentist' });
  C.registerSpecies('tooth', { svg: tooth, classPrefix: 'tooth' });
})();
