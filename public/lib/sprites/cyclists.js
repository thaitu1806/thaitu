// Học Vui — V59 "Đua Xe Đạp" sprite registry.
// Chibi kid cyclists, side view facing right. Each species is an SVG
// (viewBox 0 0 100 100) with named <g>: .body, .head, .accent, plus a
// .wheels group (each .wheel spins) and a .legs group (pedals pump).
// CSS in v59/style.css drives animation per state (idle / happy / scared).
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[cyclists.js] character.js must load first');
    return;
  }

  const OUT = '#3e2723';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  // Reusable bits ────────────────────────────────────────────────────────
  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.4" fill="' + OUT + '"/>';
  }
  function smile(cx, cy) {
    return '<path class="mouth" d="M' + (cx - 4) + ' ' + cy + ' Q' + cx + ' ' + (cy + 4) + ' ' + (cx + 4) + ' ' + (cy - 1) + '" stroke="' + OUT + '" stroke-width="2" fill="none" stroke-linecap="round"/>';
  }
  // A spinning wheel: tire ring + hub + spokes (rotated about its own centre).
  function wheel(cx, cy, r, spoke) {
    return (
      '<g class="wheel">' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + OUT + '" stroke-width="3.5"/>' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r - 3) + '" fill="none" stroke="' + spoke + '" stroke-width="1"/>' +
        '<path d="M' + cx + ' ' + (cy - r) + ' L' + cx + ' ' + (cy + r) +
          ' M' + (cx - r) + ' ' + cy + ' L' + (cx + r) + ' ' + cy +
          ' M' + (cx - r * 0.7) + ' ' + (cy - r * 0.7) + ' L' + (cx + r * 0.7) + ' ' + (cy + r * 0.7) +
          ' M' + (cx - r * 0.7) + ' ' + (cy + r * 0.7) + ' L' + (cx + r * 0.7) + ' ' + (cy - r * 0.7) + '" stroke="' + spoke + '" stroke-width="1.4"/>' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="2.6" fill="' + OUT + '"/>' +
      '</g>'
    );
  }

  // Helmet shapes (side view, facing right) ────────────────────────────────
  function helmet(o, hx, hy) {
    if (o.helmet === 'aero') {
      return (
        '<path d="M' + (hx - 11) + ' ' + (hy - 3) + ' Q' + (hx - 2) + ' ' + (hy - 16) + ' ' + (hx + 12) + ' ' + (hy - 8) +
          ' Q' + (hx + 16) + ' ' + (hy - 4) + ' ' + (hx + 11) + ' ' + (hy - 1) + ' Z" fill="' + o.helmetColor + '"/>' +
        '<path d="M' + (hx + 9) + ' ' + (hy - 2) + ' L' + (hx + 16) + ' ' + (hy - 1) + '" stroke="' + OUT + '" stroke-width="2"/>'
      );
    }
    if (o.helmet === 'cap') {
      return (
        '<path d="M' + (hx - 11) + ' ' + (hy - 2) + ' Q' + hx + ' ' + (hy - 15) + ' ' + (hx + 11) + ' ' + (hy - 2) + ' Z" fill="' + o.helmetColor + '"/>' +
        '<path d="M' + (hx + 8) + ' ' + (hy - 2) + ' L' + (hx + 18) + ' ' + (hy - 4) + ' Q' + (hx + 18) + ' ' + (hy + 1) + ' ' + (hx + 9) + ' ' + (hy + 1) + ' Z" fill="' + o.helmetColor + '"/>'
      );
    }
    // round helmet with vents
    return (
      '<path d="M' + (hx - 11) + ' ' + (hy - 1) + ' Q' + (hx - 11) + ' ' + (hy - 15) + ' ' + hx + ' ' + (hy - 15) +
        ' Q' + (hx + 12) + ' ' + (hy - 15) + ' ' + (hx + 12) + ' ' + (hy - 1) + ' Z" fill="' + o.helmetColor + '"/>' +
      '<path d="M' + (hx - 5) + ' ' + (hy - 13) + ' L' + (hx - 5) + ' ' + (hy - 3) +
        ' M' + (hx + 1) + ' ' + (hy - 14) + ' L' + (hx + 1) + ' ' + (hy - 3) +
        ' M' + (hx + 7) + ' ' + (hy - 13) + ' L' + (hx + 7) + ' ' + (hy - 3) + '" stroke="' + OUT + '" stroke-width="1.6"/>'
    );
  }

  // Main cyclist factory ────────────────────────────────────────────────────
  // opts: { skin, jersey, helmetColor, frame, wheelSpoke, helmet, number }
  function makeCyclist(o) {
    const hx = 62, hy = 38; // head centre
    const num = o.number
      ? '<text class="jersey-num" x="46" y="56" font-size="10" font-weight="800" fill="' + (o.numColor || '#fff') + '" text-anchor="middle" font-family="Nunito, sans-serif">' + o.number + '</text>'
      : '';
    return (
      '<svg viewBox="0 0 100 100" class="cyc" ' + STROKE + ' aria-hidden="true">' +
        // ground shadow
        '<ellipse class="shadow" cx="50" cy="92" rx="34" ry="4" fill="rgba(62,39,35,0.18)" stroke="none"/>' +
        // bike frame
        '<g class="frame">' +
          '<path d="M26 80 L50 80 L46 56 M50 80 L70 60 L46 56 M70 60 L74 80 M70 60 L72 55" fill="none" stroke="' + o.frame + '" stroke-width="4"/>' +
          '<path d="M40 55 L52 55" stroke="' + OUT + '" stroke-width="3"/>' + // seat
          '<path d="M66 55 L78 55" stroke="' + OUT + '" stroke-width="3"/>' + // handlebar
        '</g>' +
        // wheels (spin)
        '<g class="wheels">' +
          wheel(26, 80, 13, o.wheelSpoke) +
          wheel(74, 80, 13, o.wheelSpoke) +
        '</g>' +
        // legs / pedals (pump)
        '<g class="legs">' +
          '<circle class="crank" cx="50" cy="80" r="3.4" fill="' + OUT + '"/>' +
          '<path class="leg leg-back" d="M47 58 L44 72 L52 82" fill="none" stroke="' + o.skin + '" stroke-width="5"/>' +
          '<path class="leg leg-front" d="M48 58 L55 70 L48 80" fill="none" stroke="' + o.skinDark + '" stroke-width="5"/>' +
        '</g>' +
        // body / jersey (leaning forward)
        '<g class="body">' +
          '<path d="M42 60 Q45 47 57 44 L62 49 Q52 52 48 62 Z" fill="' + o.jersey + '"/>' + num +
          '<path class="arm" d="M58 48 L76 55" fill="none" stroke="' + o.skin + '" stroke-width="4.5"/>' +
        '</g>' +
        // head + helmet
        '<g class="head">' +
          '<circle cx="' + hx + '" cy="' + hy + '" r="10" fill="' + o.skin + '"/>' +
          helmet(o, hx, hy) +
          eye(hx + 4, hy) + smile(hx + 5, hy + 5) +
        '</g>' +
        // accent: speed lines behind the rider
        '<g class="accent">' +
          '<path d="M8 40 L22 40 M6 50 L20 50 M10 60 L24 60" stroke="' + o.jersey + '" stroke-width="2.5" stroke-linecap="round" opacity="0.7"/>' +
        '</g>' +
      '</svg>'
    );
  }

  const C = window.HocVuiCharacters;

  // Cyclist pool (one picked at random each run).
  C.registerSpecies('cyc-red', { svg: makeCyclist({
    skin: '#ffcc80', skinDark: '#e0a060', jersey: '#e64a19', helmetColor: '#c62828',
    frame: '#3e2723', wheelSpoke: '#ef6c00', helmet: 'round', number: '1' }), classPrefix: 'cyc-red' });
  C.registerSpecies('cyc-blue', { svg: makeCyclist({
    skin: '#ffe0b2', skinDark: '#e0bd90', jersey: '#1565c0', helmetColor: '#0d47a1',
    frame: '#37474f', wheelSpoke: '#90caf9', helmet: 'aero', number: '7' }), classPrefix: 'cyc-blue' });
  C.registerSpecies('cyc-green', { svg: makeCyclist({
    skin: '#d7a86e', skinDark: '#b8895a', jersey: '#2e7d32', helmetColor: '#1b5e20',
    frame: '#3e2723', wheelSpoke: '#a5d6a7', helmet: 'cap', number: '3' }), classPrefix: 'cyc-green' });
  C.registerSpecies('cyc-yellow', { svg: makeCyclist({
    skin: '#ffcc80', skinDark: '#e0a060', jersey: '#fbc02d', numColor: '#3e2723', helmetColor: '#f9a825',
    frame: '#5d4037', wheelSpoke: '#fff59d', helmet: 'aero', number: '9' }), classPrefix: 'cyc-yellow' });
  C.registerSpecies('cyc-purple', { svg: makeCyclist({
    skin: '#f5cba7', skinDark: '#d6a878', jersey: '#7b1fa2', helmetColor: '#4a148c',
    frame: '#3e2723', wheelSpoke: '#ce93d8', helmet: 'round', number: '5' }), classPrefix: 'cyc-purple' });
  C.registerSpecies('cyc-pink', { svg: makeCyclist({
    skin: '#ffe0b2', skinDark: '#e0bd90', jersey: '#ec407a', helmetColor: '#ad1457',
    frame: '#4e342e', wheelSpoke: '#f8bbd0', helmet: 'cap', number: '8' }), classPrefix: 'cyc-pink' });
})();
