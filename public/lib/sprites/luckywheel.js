// Học Vui — V26 "Vòng Quay May Mắn" sprite registry.
// Cheerful chibi game-show host + a lucky-cat mascot that present the wheel.
// Each species is an SVG (viewBox 0 0 100 100) with named <g>: .body, .head, .accent.
// CSS in v26/style.css drives animation per state (idle / happy).
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[luckywheel.js] character.js must load first');
    return;
  }

  const OUT = '#3a2a4a';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';
  const SKIN = '#ffd9a8';

  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.4" fill="' + OUT + '"/>';
  }

  // Primary avatar — a cheerful chibi game-show host presenting the wheel.
  const host =
    '<svg viewBox="0 0 100 100" class="host" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        // sparkle star near the raised hand
        '<path class="spark" d="M83 16 l2 4.6 4.6 2 -4.6 2 -2 4.6 -2 -4.6 -4.6 -2 4.6 -2 Z" fill="#ffe066"/>' +
        // raised, waving right arm presenting the prize
        '<path class="arm" d="M64 62 Q80 56 82 40" fill="none" stroke="' + SKIN + '" stroke-width="7"/>' +
        '<circle class="hand" cx="82" cy="38" r="6" fill="' + SKIN + '"/>' +
      '</g>' +
      '<g class="body">' +
        // left arm resting down
        '<path d="M36 62 Q26 68 27 80" fill="none" stroke="' + SKIN + '" stroke-width="7"/>' +
        '<circle cx="27" cy="81" r="5.5" fill="' + SKIN + '"/>' +
        // vest / torso
        '<path d="M32 60 Q50 54 68 60 L65 90 Q50 95 35 90 Z" fill="#764ba2"/>' +
        // shirt front
        '<path d="M50 56 L43 80 L50 75 L57 80 Z" fill="#ffffff"/>' +
        // bow tie
        '<path d="M45 60 L50 63 L45 66 Z" fill="#ff6b6b"/>' +
        '<path d="M55 60 L50 63 L55 66 Z" fill="#ff6b6b"/>' +
        '<circle cx="50" cy="63" r="1.8" fill="#ee5a24"/>' +
      '</g>' +
      '<g class="head">' +
        '<circle cx="50" cy="38" r="19" fill="' + SKIN + '"/>' +
        // top hat
        '<rect x="29" y="20" width="42" height="5" rx="2.5" fill="#4D96FF"/>' +
        '<rect x="37" y="5" width="26" height="16" rx="3" fill="#4D96FF"/>' +
        '<rect x="37" y="15" width="26" height="4" fill="#ffe066"/>' +
        // cheeks
        '<circle cx="40" cy="44" r="3" fill="#ffb3c1"/>' +
        '<circle cx="60" cy="44" r="3" fill="#ffb3c1"/>' +
        eye(43, 39) + eye(57, 39) +
        '<path class="mouth" d="M44 47 Q50 53 56 47" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
      '</g>' +
    '</svg>';

  // Secondary mascot — a lucky cat (maneki-neko) with a beckoning paw.
  const luckycat =
    '<svg viewBox="0 0 100 100" class="luckycat" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        // beckoning raised paw
        '<path class="paw" d="M70 56 Q82 50 82 38" fill="none" stroke="#ffffff" stroke-width="8"/>' +
        '<circle cx="82" cy="36" r="6.5" fill="#ffffff"/>' +
        // gold coin
        '<circle cx="50" cy="74" r="8" fill="#ffe066"/>' +
        '<text x="50" y="78" font-size="9" text-anchor="middle" fill="#c9971a" stroke="none">★</text>' +
      '</g>' +
      '<g class="body">' +
        '<path d="M30 58 Q50 50 70 58 L66 88 Q50 94 34 88 Z" fill="#ffffff"/>' +
        // resting left paw
        '<circle cx="35" cy="74" r="5.5" fill="#ffffff"/>' +
        // red collar
        '<path d="M38 60 Q50 66 62 60" fill="none" stroke="#ff6b6b" stroke-width="4"/>' +
        '<circle cx="50" cy="64" r="3" fill="#ffe066"/>' +
      '</g>' +
      '<g class="head">' +
        // ears
        '<path d="M32 26 L30 12 L44 22 Z" fill="#ffffff"/>' +
        '<path d="M68 26 L70 12 L56 22 Z" fill="#ffffff"/>' +
        '<path d="M34 22 L33 15 L41 21 Z" fill="#ffb3c1" stroke="none"/>' +
        '<path d="M66 22 L67 15 L59 21 Z" fill="#ffb3c1" stroke="none"/>' +
        '<circle cx="50" cy="38" r="19" fill="#ffffff"/>' +
        '<circle cx="40" cy="44" r="2.6" fill="#ffb3c1"/>' +
        '<circle cx="60" cy="44" r="2.6" fill="#ffb3c1"/>' +
        eye(43, 38) + eye(57, 38) +
        '<path class="mouth" d="M47 44 Q50 47 53 44" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
        // whiskers
        '<path d="M30 40 L40 41 M30 45 L40 44" stroke="' + OUT + '" stroke-width="1.4"/>' +
        '<path d="M70 40 L60 41 M70 45 L60 44" stroke="' + OUT + '" stroke-width="1.4"/>' +
      '</g>' +
    '</svg>';

  const C = window.HocVuiCharacters;
  C.registerSpecies('host', { svg: host, classPrefix: 'host' });
  C.registerSpecies('luckycat', { svg: luckycat, classPrefix: 'luckycat' });
})();
