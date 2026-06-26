// Học Vui — V31 "Bưu Điện Vui" sprite registry.
// Chibi mail-carrier (postman) avatar + mailbox & carrier-pigeon mascots.
// Each species is an SVG (viewBox 0 0 100 100) with named <g>: .body, .head, .accent.
// CSS in v31/style.css drives animation per state (idle / happy).
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[postal.js] character.js must load first');
    return;
  }

  const OUT = '#234d20';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.3" fill="' + OUT + '"/>';
  }

  // Main player avatar — a cheerful chibi postman carrying a letter.
  const postman =
    '<svg viewBox="0 0 100 100" class="postman" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        // satchel strap across chest + yellow mail bag
        '<path d="M40 52 L70 84" stroke="#8d5524" stroke-width="4" fill="none"/>' +
        '<rect x="62" y="72" width="22" height="18" rx="3" fill="#FFC107"/>' +
        '<path d="M62 78 L84 78" stroke="#E65100" stroke-width="2"/>' +
        '<rect x="70" y="74" width="6" height="5" rx="1" fill="#fff"/>' +
      '</g>' +
      '<g class="body">' +
        // torso (green uniform)
        '<path d="M30 94 Q30 62 50 62 Q70 62 70 94 Z" fill="#4CAF50"/>' +
        // collar
        '<path d="M44 63 L50 72 L56 63 Z" fill="#fff"/>' +
        '<line x1="50" y1="72" x2="50" y2="92" stroke="#2E7D32" stroke-width="2"/>' +
        // left arm holding the letter
        '<rect class="arm" x="18" y="64" width="16" height="9" rx="4" fill="#4CAF50"/>' +
      '</g>' +
      '<g class="letter">' +
        // envelope in hand
        '<rect x="10" y="58" width="20" height="14" rx="2" fill="#fff"/>' +
        '<path d="M10 59 L20 67 L30 59" fill="none" stroke="#E65100" stroke-width="1.6"/>' +
      '</g>' +
      '<g class="head">' +
        '<circle cx="50" cy="38" r="16" fill="#ffd9a8"/>' +
        // postal cap (green) + brim + gold badge
        '<path d="M33 34 Q34 19 50 19 Q66 19 67 34 Z" fill="#2E7D32"/>' +
        '<rect x="31" y="32" width="38" height="6" rx="3" fill="#1B5E20"/>' +
        '<rect x="45" y="23" width="10" height="6" rx="2" fill="#FFC107"/>' +
        eye(44, 40) + eye(56, 40) +
        '<path class="mouth" d="M44 47 Q50 52 56 47" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
      '</g>' +
    '</svg>';

  // Mailbox mascot — friendly red/blue letterbox.
  const mailbox =
    '<svg viewBox="0 0 100 100" class="mailbox" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent"><rect class="flag" x="74" y="36" width="14" height="10" rx="1" fill="#E53935"/>' +
        '<line x1="74" y1="36" x2="74" y2="58" stroke="' + OUT + '" stroke-width="3"/></g>' +
      '<g class="body"><path d="M26 88 L26 50 Q26 34 50 34 Q74 34 74 50 L74 88 Z" fill="#1565C0"/>' +
        '<rect x="34" y="50" width="32" height="6" rx="3" fill="#0d3c7a"/>' +
        '<rect x="44" y="84" width="12" height="14" fill="#5d4037"/></g>' +
      '<g class="head">' + eye(43, 46) + eye(57, 46) +
        '<path class="mouth" d="M43 60 Q50 65 57 60" stroke="' + OUT + '" stroke-width="2" fill="none"/></g>' +
    '</svg>';

  // Carrier-pigeon mascot — little messenger bird with a tiny scroll.
  const pigeon =
    '<svg viewBox="0 0 100 100" class="pigeon" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent"><path class="wing" d="M48 54 Q30 44 22 58 Q36 60 48 62 Z" fill="#90a4ae"/>' +
        '<rect x="54" y="68" width="14" height="8" rx="2" fill="#fff8e1"/></g>' +
      '<g class="body"><ellipse cx="54" cy="58" rx="26" ry="20" fill="#cfd8dc"/>' +
        '<path d="M78 58 L94 50 L94 68 Z" fill="#b0bec5"/></g>' +
      '<g class="head"><circle cx="36" cy="44" r="13" fill="#eceff1"/>' +
        '<path d="M24 44 L12 42 L24 50 Z" fill="#FF9800"/>' + eye(33, 42) + '</g>' +
    '</svg>';

  const C = window.HocVuiCharacters;
  C.registerSpecies('postman', { svg: postman, classPrefix: 'postman' });
  C.registerSpecies('mailbox', { svg: mailbox, classPrefix: 'mailbox' });
  C.registerSpecies('pigeon', { svg: pigeon, classPrefix: 'pigeon' });
})();
