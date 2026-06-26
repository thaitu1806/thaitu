// Học Vui — V15 "Vườn Thú Kỳ Diệu" sprite registry.
// Chibi zoo animals (lion / elephant / monkey / panda) the player collects and
// feeds. Each species is an SVG (viewBox 0 0 100 100) with named <g>:
// .body, .head, .accent. CSS in v15/style.css drives animation per state
// (idle / happy). Species ids match the ANIMALS ids in game.js so a sprite can
// be mounted decoratively over the matching emoji — the collection logic still
// keys off the emoji/id strings, which are left untouched.
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[zoo.js] character.js must load first');
    return;
  }

  const OUT = '#3a2618';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.6" fill="' + OUT + '"/>';
  }

  // Lion — golden body with a fluffy mane.
  const lion =
    '<svg viewBox="0 0 100 100" class="animal" ' + STROKE + ' aria-hidden="true">' +
      '<g class="body">' +
        '<ellipse cx="50" cy="78" rx="22" ry="16" fill="#f4a93d"/>' +
        '<ellipse cx="34" cy="92" rx="7" ry="5" fill="#e0922f"/>' +
        '<ellipse cx="66" cy="92" rx="7" ry="5" fill="#e0922f"/>' +
      '</g>' +
      '<g class="accent">' +
        '<circle cx="50" cy="42" r="30" fill="#c9702a"/>' +
        '<circle cx="50" cy="42" r="30" fill="none" stroke="#a85a20" stroke-width="2"/>' +
      '</g>' +
      '<g class="head">' +
        '<circle cx="50" cy="42" r="22" fill="#ffc861"/>' +
        '<ellipse cx="36" cy="34" rx="6" ry="6" fill="#ffc861"/>' +
        '<ellipse cx="64" cy="34" rx="6" ry="6" fill="#ffc861"/>' +
        eye(42, 40) + eye(58, 40) +
        '<path d="M47 48 L53 48 L50 52 Z" fill="' + OUT + '"/>' +
        '<path class="mouth" d="M50 52 Q44 58 39 54 M50 52 Q56 58 61 54" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
      '</g>' +
    '</svg>';

  // Elephant — grey body, big ears, curling trunk.
  const elephant =
    '<svg viewBox="0 0 100 100" class="animal" ' + STROKE + ' aria-hidden="true">' +
      '<g class="body">' +
        '<ellipse cx="52" cy="74" rx="26" ry="20" fill="#9aa6b2"/>' +
        '<rect x="34" y="84" width="9" height="12" rx="4" fill="#8593a0"/>' +
        '<rect x="58" y="84" width="9" height="12" rx="4" fill="#8593a0"/>' +
      '</g>' +
      '<g class="accent">' +
        '<ellipse cx="26" cy="50" rx="13" ry="16" fill="#b6c1cc"/>' +
        '<ellipse cx="74" cy="50" rx="13" ry="16" fill="#b6c1cc"/>' +
      '</g>' +
      '<g class="head">' +
        '<circle cx="50" cy="46" r="22" fill="#aeb9c4"/>' +
        eye(42, 42) + eye(58, 42) +
        '<path class="trunk" d="M50 54 Q50 70 40 74 Q32 77 34 84" stroke="' + OUT + '" stroke-width="6" fill="none" stroke-linecap="round"/>' +
        '<path d="M50 54 Q50 70 40 74 Q32 77 34 84" stroke="#aeb9c4" stroke-width="3.5" fill="none" stroke-linecap="round"/>' +
      '</g>' +
    '</svg>';

  // Monkey — brown body, peach face, round ears.
  const monkey =
    '<svg viewBox="0 0 100 100" class="animal" ' + STROKE + ' aria-hidden="true">' +
      '<g class="body">' +
        '<ellipse cx="50" cy="76" rx="20" ry="17" fill="#a06a3c"/>' +
        '<path class="tail" d="M70 78 Q86 76 84 60 Q83 52 76 54" stroke="' + OUT + '" stroke-width="5" fill="none"/>' +
        '<path d="M70 78 Q86 76 84 60 Q83 52 76 54" stroke="#a06a3c" stroke-width="2.5" fill="none"/>' +
      '</g>' +
      '<g class="accent">' +
        '<circle cx="28" cy="40" r="9" fill="#8a572f"/>' +
        '<circle cx="72" cy="40" r="9" fill="#8a572f"/>' +
        '<circle cx="28" cy="40" r="4.5" fill="#e6b88a"/>' +
        '<circle cx="72" cy="40" r="4.5" fill="#e6b88a"/>' +
      '</g>' +
      '<g class="head">' +
        '<circle cx="50" cy="42" r="20" fill="#a06a3c"/>' +
        '<ellipse cx="50" cy="48" rx="14" ry="13" fill="#e6b88a"/>' +
        eye(43, 42) + eye(57, 42) +
        '<ellipse cx="50" cy="52" rx="2.4" ry="1.8" fill="' + OUT + '"/>' +
        '<path class="mouth" d="M44 57 Q50 62 56 57" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
      '</g>' +
    '</svg>';

  // Panda — white body, black ears, eye-patches and limbs.
  const panda =
    '<svg viewBox="0 0 100 100" class="animal" ' + STROKE + ' aria-hidden="true">' +
      '<g class="body">' +
        '<ellipse cx="50" cy="76" rx="22" ry="18" fill="#f7f7f7"/>' +
        '<ellipse cx="34" cy="90" rx="7" ry="5" fill="#2b2b2b"/>' +
        '<ellipse cx="66" cy="90" rx="7" ry="5" fill="#2b2b2b"/>' +
      '</g>' +
      '<g class="accent">' +
        '<circle cx="32" cy="30" r="9" fill="#2b2b2b"/>' +
        '<circle cx="68" cy="30" r="9" fill="#2b2b2b"/>' +
      '</g>' +
      '<g class="head">' +
        '<circle cx="50" cy="44" r="22" fill="#fafafa"/>' +
        '<ellipse cx="40" cy="42" rx="6.5" ry="8" fill="#2b2b2b" transform="rotate(-18 40 42)"/>' +
        '<ellipse cx="60" cy="42" rx="6.5" ry="8" fill="#2b2b2b" transform="rotate(18 60 42)"/>' +
        eye(40, 42) + eye(60, 42) +
        '<ellipse cx="50" cy="50" rx="2.6" ry="2" fill="' + OUT + '"/>' +
        '<path class="mouth" d="M44 56 Q50 60 56 56" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
      '</g>' +
    '</svg>';

  const C = window.HocVuiCharacters;
  C.registerSpecies('lion', { svg: lion, classPrefix: 'animal' });
  C.registerSpecies('elephant', { svg: elephant, classPrefix: 'animal' });
  C.registerSpecies('monkey', { svg: monkey, classPrefix: 'animal' });
  C.registerSpecies('panda', { svg: panda, classPrefix: 'animal' });
})();
