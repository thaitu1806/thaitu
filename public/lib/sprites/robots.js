// Học Vui — V45 "Lập Trình Robot Mini" sprite registry.
// Chibi maze-robots (ORIGINAL cute designs — neon/tech palette to match V45).
// Each species is an SVG (viewBox 0 0 100 100) with named <g>: .body, .head, .accent.
// The robot is designed FACING UP (antenna + visor toward the top of the cell);
// CSS .face-* rotation classes on the grid cell handle the other directions.
// CSS in v45/style.css drives animation per state (idle / happy / scared).
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[robots.js] character.js must load first');
    return;
  }

  const OUT = '#062e1c';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  // Reusable bits ────────────────────────────────────────────────────────
  function eye(cx, cy, color) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="3.4" fill="' + (color || '#fff') + '" stroke="' + OUT + '" stroke-width="1.2"/>';
  }
  function smile(color) {
    return '<path class="mouth" d="M43 50 Q50 56 57 50" stroke="' + (color || OUT) + '" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
  }
  // Antenna sits at the TOP (robot faces up). .antenna group is pulsed in idle.
  function antenna(stalk, bulb) {
    return (
      '<g class="antenna">' +
        '<line x1="50" y1="22" x2="50" y2="9" stroke="' + stalk + '" stroke-width="3"/>' +
        '<circle class="antenna-bulb" cx="50" cy="7" r="4.5" fill="' + bulb + '" stroke="' + OUT + '" stroke-width="1.5"/>' +
      '</g>'
    );
  }
  // Tread / wheels at the bottom of the body.
  function treads(color) {
    return (
      '<g class="treads">' +
        '<rect x="28" y="80" width="44" height="11" rx="5" fill="' + color + '" stroke="' + OUT + '" stroke-width="2"/>' +
        '<circle cx="37" cy="85.5" r="2.6" fill="#fff" opacity="0.8"/>' +
        '<circle cx="50" cy="85.5" r="2.6" fill="#fff" opacity="0.8"/>' +
        '<circle cx="63" cy="85.5" r="2.6" fill="#fff" opacity="0.8"/>' +
      '</g>'
    );
  }

  // Main robot factory ──────────────────────────────────────────────────────
  // opts: { shell, panel, screen, glow, eyeColor, visor }
  //   visor: 'eyes' | 'visor' | 'cyclops'
  function makeRobot(o) {
    let face;
    if (o.visor === 'visor') {
      // single wide visor band with two glowing eyes
      face = (
        '<rect x="33" y="33" width="34" height="15" rx="7" fill="' + o.screen + '" stroke="' + OUT + '" stroke-width="2"/>' +
        '<circle class="eye" cx="43" cy="40.5" r="3" fill="' + o.eyeColor + '"/>' +
        '<circle class="eye" cx="57" cy="40.5" r="3" fill="' + o.eyeColor + '"/>'
      );
    } else if (o.visor === 'cyclops') {
      // single big central eye
      face = (
        '<circle cx="50" cy="40" r="11" fill="' + o.screen + '" stroke="' + OUT + '" stroke-width="2"/>' +
        '<circle class="eye" cx="50" cy="40" r="5" fill="' + o.eyeColor + '"/>' +
        '<circle cx="52" cy="38" r="1.6" fill="#fff" opacity="0.9"/>'
      );
    } else {
      // two round eyes + smile
      face = eye(43, 39, o.eyeColor) + eye(57, 39, o.eyeColor) + smile(o.eyeColor);
    }
    const ears = (
      '<rect x="22" y="36" width="6" height="13" rx="3" fill="' + o.panel + '" stroke="' + OUT + '" stroke-width="2"/>' +
      '<rect x="72" y="36" width="6" height="13" rx="3" fill="' + o.panel + '" stroke="' + OUT + '" stroke-width="2"/>'
    );
    return (
      '<svg viewBox="0 0 100 100" class="bot" ' + STROKE + ' aria-hidden="true">' +
        '<g class="accent">' + antenna(o.panel, o.glow) + '</g>' +
        '<g class="body">' +
          '<rect x="30" y="56" width="40" height="28" rx="8" fill="' + o.shell + '"/>' +
          '<rect x="38" y="62" width="24" height="14" rx="4" fill="' + o.screen + '"/>' +
          '<circle class="core" cx="50" cy="69" r="4" fill="' + o.glow + '" stroke="' + OUT + '" stroke-width="1.2"/>' +
          treads(o.panel) +
        '</g>' +
        '<g class="head">' +
          '<rect x="29" y="26" width="42" height="28" rx="10" fill="' + o.shell + '"/>' +
          ears + face +
        '</g>' +
      '</svg>'
    );
  }

  const C = window.HocVuiCharacters;

  // Maze-robot pool (picked at random per level). Neon/tech palette on dark.
  C.registerSpecies('bot-emerald', { svg: makeRobot({ shell: '#16c47f', panel: '#0a8f5a', screen: '#04261a', glow: '#00ff88', eyeColor: '#00ff88', visor: 'eyes' }), classPrefix: 'bot-emerald' });
  C.registerSpecies('bot-cyan',    { svg: makeRobot({ shell: '#1fb6c9', panel: '#0d7d8c', screen: '#042027', glow: '#3df0ff', eyeColor: '#3df0ff', visor: 'visor' }), classPrefix: 'bot-cyan' });
  C.registerSpecies('bot-lime',    { svg: makeRobot({ shell: '#9ccc3a', panel: '#5f8a16', screen: '#1c2606', glow: '#d4ff3d', eyeColor: '#1c2606', visor: 'eyes' }), classPrefix: 'bot-lime' });
  C.registerSpecies('bot-amber',   { svg: makeRobot({ shell: '#ffb13d', panel: '#c47a0d', screen: '#2a1a04', glow: '#ffd700', eyeColor: '#2a1a04', visor: 'cyclops' }), classPrefix: 'bot-amber' });
  C.registerSpecies('bot-violet',  { svg: makeRobot({ shell: '#9d7bff', panel: '#5e3fc4', screen: '#1a0f33', glow: '#c4b0ff', eyeColor: '#c4b0ff', visor: 'visor' }), classPrefix: 'bot-violet' });
  C.registerSpecies('bot-mint',    { svg: makeRobot({ shell: '#2fe0b0', panel: '#13a37d', screen: '#04261f', glow: '#7dffd9', eyeColor: '#04261f', visor: 'eyes' }), classPrefix: 'bot-mint' });
})();
