// Học Vui — V35 "Tiệm Kem" sprite registry.
// Chibi ice-cream-shop server kid + a cute ice-cream-cone mascot.
// Each species is an SVG (viewBox 0 0 100 100) with named <g>: .body, .head, .accent.
// CSS in v35/style.css drives animation per state (idle / happy).
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[icecream.js] character.js must load first');
    return;
  }

  const OUT = '#7a2f52';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.6" fill="' + OUT + '"/>';
  }

  // Main avatar — a cheerful ice-cream-shop server kid with a paper hat and a scoop.
  const server =
    '<svg viewBox="0 0 100 100" class="server" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        // scoop held to the side
        '<line x1="80" y1="58" x2="90" y2="72" stroke="' + OUT + '" stroke-width="3"/>' +
        '<ellipse cx="78" cy="54" rx="9" ry="7" fill="#ffd6e7"/>' +
        '<circle cx="74" cy="51" r="2.2" fill="#fff" stroke="none"/>' +
      '</g>' +
      '<g class="body">' +
        // apron / torso
        '<path d="M34 70 Q34 56 50 56 Q66 56 66 70 L66 86 L34 86 Z" fill="#ff6b9d"/>' +
        '<path d="M44 60 L56 60 L54 80 L46 80 Z" fill="#fff0f5"/>' +
        '<line x1="50" y1="62" x2="50" y2="78" stroke="#ffb7d5" stroke-width="2"/>' +
      '</g>' +
      '<g class="head">' +
        '<circle cx="50" cy="38" r="18" fill="#ffe0c2"/>' +
        // paper server hat
        '<path class="hat" d="M32 30 Q34 16 50 16 Q66 16 68 30 Z" fill="#fff"/>' +
        '<rect x="31" y="28" width="38" height="5" rx="2.5" fill="#ff85a1"/>' +
        eye(43, 39) + eye(57, 39) +
        '<circle cx="38" cy="45" r="3" fill="#ffb7d5" stroke="none"/>' +
        '<circle cx="62" cy="45" r="3" fill="#ffb7d5" stroke="none"/>' +
        '<path class="mouth" d="M44 47 Q50 53 56 47" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
      '</g>' +
    '</svg>';

  // Mascot — a cute smiling ice-cream cone with a cherry.
  const cone =
    '<svg viewBox="0 0 100 100" class="cone" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        // cherry + stem
        '<path d="M50 14 Q56 8 62 12" stroke="#7a8c2f" stroke-width="2.5" fill="none"/>' +
        '<circle cx="50" cy="17" r="5" fill="#e63950"/>' +
        '<circle cx="48" cy="15" r="1.6" fill="#fff" stroke="none"/>' +
      '</g>' +
      '<g class="body">' +
        // waffle cone
        '<path d="M38 56 L62 56 L52 92 Q50 96 48 92 Z" fill="#f0a868"/>' +
        '<path d="M42 62 L58 62 M44 70 L56 70 M47 78 L53 78" stroke="#c8824a" stroke-width="1.6"/>' +
      '</g>' +
      '<g class="head">' +
        // two swirly scoops
        '<ellipse cx="50" cy="50" rx="18" ry="14" fill="#ffd6e7"/>' +
        '<ellipse cx="50" cy="38" rx="14" ry="11" fill="#fff0f5"/>' +
        eye(45, 46) + eye(56, 46) +
        '<circle cx="40" cy="51" r="2.6" fill="#ffb7d5" stroke="none"/>' +
        '<circle cx="61" cy="51" r="2.6" fill="#ffb7d5" stroke="none"/>' +
        '<path class="mouth" d="M45 53 Q50 58 56 53" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
      '</g>' +
    '</svg>';

  const C = window.HocVuiCharacters;
  C.registerSpecies('icecream-server', { svg: server, classPrefix: 'server' });
  C.registerSpecies('icecream-cone', { svg: cone, classPrefix: 'cone' });
})();
