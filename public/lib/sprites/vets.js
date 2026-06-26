// Học Vui — V23 "Bệnh Viện Thú Cưng" sprite registry.
// Chibi kid-vet + nurse helpers and cute patient pets (puppy / kitten / bunny).
// Each species is an SVG (viewBox 0 0 100 100) with named <g>: .body, .head, .accent.
// CSS in v23/style.css drives animation per state (idle / happy / scared).
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[vets.js] character.js must load first');
    return;
  }

  const OUT = '#4a2c3a';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.4" fill="' + OUT + '"/>';
  }

  // Kid veterinarian — white coat, stethoscope, pink medical cross.
  const vet =
    '<svg viewBox="0 0 100 100" class="vet" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        '<path d="M40 50 Q34 66 44 71" fill="none" stroke="#3a3f5a" stroke-width="2.5"/>' +
        '<path d="M60 50 Q66 66 56 71" fill="none" stroke="#3a3f5a" stroke-width="2.5"/>' +
        '<circle cx="50" cy="75" r="5" fill="#e0e4f0"/>' +
      '</g>' +
      '<g class="body">' +
        '<path d="M28 92 L28 60 Q28 50 38 48 L62 48 Q72 50 72 60 L72 92 Z" fill="#ffffff"/>' +
        '<path d="M50 48 L43 64 L50 60 L57 64 Z" fill="#eef2f8"/>' +
        '<rect x="56" y="70" width="11" height="11" rx="2" fill="#fce4ec"/>' +
        '<path d="M61.5 71.5 V79.5 M57.5 75.5 H65.5" stroke="#e91e63" stroke-width="2"/>' +
      '</g>' +
      '<g class="head">' +
        '<circle cx="50" cy="32" r="17" fill="#ffd9b3"/>' +
        '<path d="M33 31 Q33 13 50 13 Q67 13 67 31 Q60 22 50 22 Q40 22 33 31 Z" fill="#5a3a2a"/>' +
        eye(44, 33) + eye(56, 33) +
        '<path class="mouth" d="M45 40 Q50 44 55 40" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
        '<circle cx="40" cy="38" r="2.4" fill="#ffb3b3" stroke="none"/>' +
        '<circle cx="60" cy="38" r="2.4" fill="#ffb3b3" stroke="none"/>' +
      '</g>' +
    '</svg>';

  // Kid nurse — pink dress, white cap with cross.
  const nurse =
    '<svg viewBox="0 0 100 100" class="vet" ' + STROKE + ' aria-hidden="true">' +
      '<g class="body">' +
        '<path d="M28 92 L30 60 Q32 50 42 49 L58 49 Q68 50 70 60 L72 92 Z" fill="#f8bbd0"/>' +
        '<rect x="44" y="60" width="12" height="11" rx="2" fill="#ffffff"/>' +
        '<path d="M50 61 V70 M46 65.5 H54" stroke="#e91e63" stroke-width="2"/>' +
      '</g>' +
      '<g class="head">' +
        '<circle cx="50" cy="33" r="17" fill="#ffd9b3"/>' +
        '<path d="M33 34 Q31 17 50 17 Q69 17 67 34 Q66 25 50 25 Q34 25 33 34 Z" fill="#3a2a1a"/>' +
        '<path d="M40 21 L60 21 L58 12 L42 12 Z" fill="#ffffff"/>' +
        '<path d="M50 13 V19 M47 16 H53" stroke="#e91e63" stroke-width="2"/>' +
        eye(44, 34) + eye(56, 34) +
        '<path class="mouth" d="M45 41 Q50 45 55 41" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
        '<circle cx="40" cy="39" r="2.4" fill="#ffb3b3" stroke="none"/>' +
        '<circle cx="60" cy="39" r="2.4" fill="#ffb3b3" stroke="none"/>' +
      '</g>' +
    '</svg>';

  // Patient puppy.
  const puppy =
    '<svg viewBox="0 0 100 100" class="pet" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        '<path d="M30 30 Q19 28 22 49 Q31 45 35 37 Z" fill="#a9714b"/>' +
        '<path d="M70 30 Q81 28 78 49 Q69 45 65 37 Z" fill="#a9714b"/>' +
      '</g>' +
      '<g class="body"><ellipse cx="50" cy="76" rx="22" ry="15" fill="#c8966a"/></g>' +
      '<g class="head">' +
        '<circle cx="50" cy="46" r="24" fill="#d8a878"/>' +
        '<ellipse cx="50" cy="55" rx="13" ry="10" fill="#f3e0cc"/>' +
        eye(42, 42) + eye(58, 42) +
        '<ellipse cx="50" cy="50" rx="4" ry="3" fill="' + OUT + '"/>' +
        '<path class="mouth" d="M50 53 Q50 59 45 58 M50 53 Q50 59 55 58" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
      '</g>' +
    '</svg>';

  // Patient kitten.
  const kitten =
    '<svg viewBox="0 0 100 100" class="pet" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        '<path d="M34 30 L28 13 L47 26 Z" fill="#b0b6c0"/>' +
        '<path d="M66 30 L72 13 L53 26 Z" fill="#b0b6c0"/>' +
      '</g>' +
      '<g class="body"><ellipse cx="50" cy="76" rx="21" ry="14" fill="#c2c8d2"/></g>' +
      '<g class="head">' +
        '<circle cx="50" cy="46" r="23" fill="#cdd3dd"/>' +
        eye(42, 44) + eye(58, 44) +
        '<path d="M50 49 L46.5 52.5 L53.5 52.5 Z" fill="#ff9bb3"/>' +
        '<path class="mouth" d="M50 52 Q50 58 45 57 M50 52 Q50 58 55 57" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
        '<path d="M30 45 H40 M30 51 H40 M70 45 H60 M70 51 H60" stroke="' + OUT + '" stroke-width="1.5"/>' +
      '</g>' +
    '</svg>';

  // Patient bunny.
  const bunny =
    '<svg viewBox="0 0 100 100" class="pet" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        '<ellipse cx="42" cy="20" rx="6" ry="16" fill="#fbe9ef"/>' +
        '<ellipse cx="58" cy="20" rx="6" ry="16" fill="#fbe9ef"/>' +
      '</g>' +
      '<g class="body"><ellipse cx="50" cy="76" rx="20" ry="14" fill="#ffffff"/></g>' +
      '<g class="head">' +
        '<circle cx="50" cy="48" r="22" fill="#ffffff"/>' +
        eye(42, 46) + eye(58, 46) +
        '<path d="M50 51 L46.5 54.5 L53.5 54.5 Z" fill="#ff9bb3"/>' +
        '<path class="mouth" d="M50 54 Q50 60 45 59 M50 54 Q50 60 55 59" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
        '<circle cx="38" cy="52" r="2.6" fill="#ffd1dc" stroke="none"/>' +
        '<circle cx="62" cy="52" r="2.6" fill="#ffd1dc" stroke="none"/>' +
      '</g>' +
    '</svg>';

  const C = window.HocVuiCharacters;
  C.registerSpecies('vet', { svg: vet, classPrefix: 'vet' });
  C.registerSpecies('nurse', { svg: nurse, classPrefix: 'vet' });
  C.registerSpecies('puppy', { svg: puppy, classPrefix: 'pet' });
  C.registerSpecies('kitten', { svg: kitten, classPrefix: 'pet' });
  C.registerSpecies('bunny', { svg: bunny, classPrefix: 'pet' });
})();
