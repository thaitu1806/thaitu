// Học Vui — V30 "Giải Đố Vui" sprite registry.
// Cheerful chibi carnival mascots: a ringmaster/quizmaster host + a clown pal.
// Each species is an SVG (viewBox 0 0 100 100) with named <g>: .body, .head, .accent.
// CSS in v30/style.css drives animation per state (idle / happy).
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[carnival.js] character.js must load first');
    return;
  }

  const OUT = '#3a2150';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.6" fill="' + OUT + '"/>';
  }

  // Main host — a cheerful carnival ringmaster / quizmaster with a top hat + bow tie.
  const host =
    '<svg viewBox="0 0 100 100" class="host" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        '<circle cx="16" cy="24" r="3" fill="#4ECDC4"/>' +
        '<circle cx="85" cy="22" r="3" fill="#F7DC6F"/>' +
        '<rect x="80" y="44" width="5" height="5" rx="1" fill="#FF6B6B"/>' +
        '<rect x="15" y="48" width="5" height="5" rx="1" fill="#BB8FCE"/>' +
      '</g>' +
      '<g class="body">' +
        '<path d="M28 96 Q28 64 50 64 Q72 64 72 96 Z" fill="#7b3fbf"/>' +
        '<path d="M50 66 L42 96 L58 96 Z" fill="#FF6B6B"/>' +
        '<path d="M50 64 L39 58 L39 71 Z" fill="#F7DC6F"/>' +
        '<path d="M50 64 L61 58 L61 71 Z" fill="#F7DC6F"/>' +
        '<circle cx="50" cy="64" r="3.2" fill="#ee5a24"/>' +
      '</g>' +
      '<g class="head">' +
        '<circle cx="50" cy="46" r="18" fill="#ffe0bd"/>' +
        '<circle class="cheek" cx="38" cy="51" r="3.5" fill="#ff9aa2" stroke="none"/>' +
        '<circle class="cheek" cx="62" cy="51" r="3.5" fill="#ff9aa2" stroke="none"/>' +
        eye(43, 45) + eye(57, 45) +
        '<path class="mouth" d="M42 54 Q50 61 58 54" stroke="' + OUT + '" stroke-width="2.5" fill="none"/>' +
        '<g class="hat">' +
          '<rect x="33" y="23" width="34" height="6" rx="2" fill="#3a2150"/>' +
          '<rect x="38" y="5" width="24" height="19" rx="2" fill="#7b3fbf"/>' +
          '<rect x="38" y="15" width="24" height="5" fill="#FF6B6B"/>' +
        '</g>' +
      '</g>' +
    '</svg>';

  // Clown mascot — jester hat with bells + red nose.
  const clown =
    '<svg viewBox="0 0 100 100" class="clown" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        '<path class="horn" d="M34 30 L16 16 L23 33 Z" fill="#4ECDC4"/>' +
        '<path class="horn" d="M66 30 L84 16 L77 33 Z" fill="#FF6B6B"/>' +
        '<path class="horn" d="M44 28 L50 5 L56 28 Z" fill="#F7DC6F"/>' +
        '<circle cx="16" cy="16" r="3.4" fill="#F7DC6F"/>' +
        '<circle cx="84" cy="16" r="3.4" fill="#4ECDC4"/>' +
        '<circle cx="50" cy="5" r="3.4" fill="#FF6B6B"/>' +
      '</g>' +
      '<g class="body">' +
        '<ellipse cx="50" cy="80" rx="22" ry="15" fill="#45B7D1"/>' +
        '<circle cx="50" cy="84" r="3" fill="#FF6B6B" stroke="none"/>' +
        '<circle cx="42" cy="79" r="2.4" fill="#fff" stroke="none"/>' +
        '<circle cx="58" cy="79" r="2.4" fill="#fff" stroke="none"/>' +
        '<path class="collar" d="M30 65 Q40 75 50 65 Q60 75 70 65 Q66 57 50 57 Q34 57 30 65 Z" fill="#F7DC6F"/>' +
      '</g>' +
      '<g class="head">' +
        '<circle cx="50" cy="44" r="17" fill="#fff5e8"/>' +
        eye(43, 42) + eye(57, 42) +
        '<circle class="cheek" cx="37" cy="48" r="3.4" fill="#ffb3c1" stroke="none"/>' +
        '<circle class="cheek" cx="63" cy="48" r="3.4" fill="#ffb3c1" stroke="none"/>' +
        '<circle class="nose" cx="50" cy="49" r="4.2" fill="#FF6B6B"/>' +
        '<path class="mouth" d="M40 53 Q50 63 60 53" stroke="' + OUT + '" stroke-width="2.5" fill="none"/>' +
      '</g>' +
    '</svg>';

  const C = window.HocVuiCharacters;
  C.registerSpecies('host', { svg: host, classPrefix: 'host' });
  C.registerSpecies('clown', { svg: clown, classPrefix: 'clown' });
})();
