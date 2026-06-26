// Học Vui — V7 "Leo Núi Trí Tuệ" sprite registry.
// Chibi mountain-climber avatars (one per player color) + a mountain-goat
// mascot. Each species is an SVG (viewBox 0 0 100 100) with named <g>:
// .body, .head, .accent. CSS in v7/style.css drives animation per state
// (idle / happy / climb).
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[climbers.js] character.js must load first');
    return;
  }

  const OUT = '#3a2a1a';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';
  const SKIN = '#f7c89b';

  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.3" fill="' + OUT + '"/>';
  }

  // A chibi climber: helmet + jacket tinted by `color`, backpack, one arm
  // raised reaching up, legs in a climbing stride.
  function makeClimber(color, dark) {
    return (
      '<svg viewBox="0 0 100 100" class="climber-svg" ' + STROKE + ' aria-hidden="true">' +
        // backpack behind body
        '<g class="accent">' +
          '<rect x="30" y="46" width="20" height="24" rx="6" fill="' + dark + '"/>' +
          '<rect x="34" y="50" width="12" height="9" rx="2" fill="#fff" opacity="0.45"/>' +
        '</g>' +
        // body / jacket + limbs
        '<g class="body">' +
          // raised reaching arm
          '<path class="arm-up" d="M58 50 L72 34" stroke="' + color + '" stroke-width="8"/>' +
          '<circle cx="73" cy="32" r="4.5" fill="' + SKIN + '"/>' +
          // lower arm
          '<path d="M44 52 L34 64" stroke="' + color + '" stroke-width="8"/>' +
          '<circle cx="33" cy="65" r="4.5" fill="' + SKIN + '"/>' +
          // torso
          '<rect x="40" y="44" width="22" height="26" rx="9" fill="' + color + '"/>' +
          // legs
          '<path class="leg leg-l" d="M46 70 L42 86" stroke="' + dark + '" stroke-width="8"/>' +
          '<path class="leg leg-r" d="M56 70 L62 84" stroke="' + dark + '" stroke-width="8"/>' +
          '<ellipse cx="41" cy="88" rx="6" ry="3.5" fill="' + OUT + '"/>' +
          '<ellipse cx="63" cy="86" rx="6" ry="3.5" fill="' + OUT + '"/>' +
        '</g>' +
        // head + helmet
        '<g class="head">' +
          '<circle cx="51" cy="30" r="13" fill="' + SKIN + '"/>' +
          '<path d="M37 30 Q37 13 51 13 Q65 13 65 30 Z" fill="' + color + '"/>' +
          '<rect x="36" y="28" width="30" height="4" rx="2" fill="' + dark + '"/>' +
          eye(46, 31) + eye(56, 31) +
          '<path class="mouth" d="M46 37 Q51 41 56 37" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
        '</g>' +
      '</svg>'
    );
  }

  // Friendly mountain goat mascot — perched, with curved horns.
  const goat =
    '<svg viewBox="0 0 100 100" class="goat-svg" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        '<path d="M40 22 Q30 12 34 6 M60 22 Q70 12 66 6" stroke="#c9a36b" stroke-width="4" fill="none"/>' +
      '</g>' +
      '<g class="body">' +
        '<ellipse cx="50" cy="64" rx="26" ry="18" fill="#e8e2d6"/>' +
        '<path class="leg" d="M38 78 L36 90 M50 80 L50 92 M62 78 L64 90" stroke="#cdbfa6" stroke-width="6"/>' +
      '</g>' +
      '<g class="head">' +
        '<ellipse cx="50" cy="38" rx="16" ry="15" fill="#f3efe6"/>' +
        '<path d="M40 46 Q50 56 60 46 L58 54 Q50 60 42 54 Z" fill="#e8e2d6"/>' +
        eye(44, 36) + eye(56, 36) +
        '<path class="mouth" d="M45 50 Q50 53 55 50" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
        '<path class="beard" d="M48 54 L50 64 L52 54" fill="#fff"/>' +
      '</g>' +
    '</svg>';

  const C = window.HocVuiCharacters;
  // Climber palette mirrors V7's COLORS array (red, blue, green, orange).
  C.registerSpecies('climber0', { svg: makeClimber('#e74c3c', '#a93226'), classPrefix: 'climber' });
  C.registerSpecies('climber1', { svg: makeClimber('#3498db', '#21618c'), classPrefix: 'climber' });
  C.registerSpecies('climber2', { svg: makeClimber('#27ae60', '#1e8449'), classPrefix: 'climber' });
  C.registerSpecies('climber3', { svg: makeClimber('#f39c12', '#b9770e'), classPrefix: 'climber' });
  C.registerSpecies('goat', { svg: goat, classPrefix: 'goat' });
})();
