// Học Vui — V19 "Thám Tử Nhí" sprite registry.
// Chibi kid-detective (deerstalker hat + magnifying glass) and a puppy sidekick.
// Each species is an SVG (viewBox 0 0 100 100) with named <g>: .body, .head, .accent.
// CSS in v19/style.css drives animation per state (idle / happy / searching).
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[detectives.js] character.js must load first');
    return;
  }

  const OUT = '#2a1a4a';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.4" fill="' + OUT + '"/>';
  }

  // Main avatar — a cheerful kid detective with a deerstalker hat + magnifier.
  const detective =
    '<svg viewBox="0 0 100 100" class="detective" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        // magnifying glass held up to the side
        '<circle class="lens" cx="77" cy="33" r="11" fill="#bfe3ff" stroke="#ffd700" stroke-width="3.5"/>' +
        '<circle class="glint" cx="73" cy="29" r="3" fill="#ffffff" opacity="0.85"/>' +
        '<line x1="70" y1="42" x2="63" y2="51" stroke="#8a5a2b" stroke-width="5"/>' +
      '</g>' +
      '<g class="body">' +
        // trench coat
        '<path d="M30 62 Q30 53 50 53 Q70 53 70 62 L74 90 L26 90 Z" fill="#5e60ce"/>' +
        '<path d="M44 55 L50 66 L56 55 Z" fill="#6930c3"/>' +
        '<circle cx="50" cy="70" r="1.8" fill="#ffd700"/>' +
        '<circle cx="50" cy="78" r="1.8" fill="#ffd700"/>' +
        // arm holding the magnifier
        '<path class="arm" d="M67 60 Q78 54 71 45" fill="none" stroke="#5e60ce" stroke-width="6.5"/>' +
      '</g>' +
      '<g class="head">' +
        '<circle cx="50" cy="40" r="15" fill="#ffcf9e"/>' +
        // deerstalker cap + brim + ear flaps
        '<ellipse cx="50" cy="30" rx="19" ry="4.5" fill="#8a5a2b"/>' +
        '<path d="M34 30 Q50 12 66 30 Z" fill="#a9744f"/>' +
        '<ellipse cx="33" cy="40" rx="4.5" ry="6.5" fill="#8a5a2b"/>' +
        '<ellipse cx="67" cy="40" rx="4.5" ry="6.5" fill="#8a5a2b"/>' +
        '<circle cx="50" cy="16" r="2.6" fill="#8a5a2b"/>' +
        eye(45, 42) + eye(55, 42) +
        '<path class="mouth" d="M45 48 Q50 52 55 48" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
      '</g>' +
    '</svg>';

  // Puppy sidekick — a little sniffer dog with a detective collar.
  const pup =
    '<svg viewBox="0 0 100 100" class="pup" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent"><path class="tail" d="M72 70 Q84 64 82 54" fill="none" stroke="#a9744f" stroke-width="6"/></g>' +
      '<g class="body"><ellipse cx="50" cy="72" rx="22" ry="15" fill="#c98a5e"/>' +
        '<rect x="36" y="60" width="28" height="6" rx="3" fill="#6930c3"/>' +
        '<circle cx="50" cy="63" r="2" fill="#ffd700"/></g>' +
      '<g class="head"><circle cx="50" cy="44" r="17" fill="#dea878"/>' +
        '<ellipse class="ear" cx="33" cy="40" rx="6.5" ry="12" fill="#a9744f"/>' +
        '<ellipse class="ear" cx="67" cy="40" rx="6.5" ry="12" fill="#a9744f"/>' +
        '<ellipse cx="50" cy="52" rx="8" ry="6" fill="#f0d2b0"/>' +
        '<circle cx="50" cy="49" r="2.8" fill="' + OUT + '"/>' +
        eye(43, 42) + eye(57, 42) + '</g>' +
    '</svg>';

  // A standalone magnifier icon mascot (for clue/discovery flourishes).
  const magnifier =
    '<svg viewBox="0 0 100 100" class="glass" ' + STROKE + ' aria-hidden="true">' +
      '<g class="body"><line x1="40" y1="58" x2="22" y2="80" stroke="#8a5a2b" stroke-width="9"/></g>' +
      '<g class="accent"><circle class="lens" cx="56" cy="42" r="24" fill="#bfe3ff" stroke="#ffd700" stroke-width="5"/>' +
        '<circle class="glint" cx="48" cy="34" r="6" fill="#ffffff" opacity="0.85"/></g>' +
    '</svg>';

  const C = window.HocVuiCharacters;
  C.registerSpecies('detective', { svg: detective, classPrefix: 'detective' });
  C.registerSpecies('pup', { svg: pup, classPrefix: 'pup' });
  C.registerSpecies('magnifier', { svg: magnifier, classPrefix: 'glass' });
})();
