// Học Vui — V41 "Phiêu Lưu Cùng Mario" sprite registry.
// Chibi adventurer/hero characters (ORIGINAL designs — plumber-style caps + overalls,
// not trademarked likenesses). Each species is an SVG (viewBox 0 0 100 100) with
// named <g>: .body, .head, .accent (plus .arms / .legs for run/jump animation).
// CSS in v41/style.css drives animation per state (idle / happy / scared).
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[mario.js] character.js must load first');
    return;
  }

  const OUT = '#3a1d00';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  // Reusable bits ────────────────────────────────────────────────────────
  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.4" fill="' + OUT + '"/>';
  }
  function mustache() {
    return '<path class="mouth" d="M42 50 Q50 55 58 50" stroke="' + OUT + '" stroke-width="3.2" fill="none" stroke-linecap="round"/>';
  }
  function emblemStar(color) {
    // small star inside the cap's white badge
    return '<path d="M50 24 L51.3 27.2 L54.7 27.4 L52 29.5 L53 32.8 L50 30.8 L47 32.8 L48 29.5 L45.3 27.4 L48.7 27.2 Z" fill="' + color + '" stroke="' + OUT + '" stroke-width="0.8"/>';
  }
  function sparkleAccent() {
    return (
      '<g class="accent">' +
        '<path class="spark spark-1" d="M78 20 L79.6 24 L83.6 25.6 L79.6 27.2 L78 31.2 L76.4 27.2 L72.4 25.6 L76.4 24 Z" fill="#ffd700"/>' +
        '<circle class="spark spark-2" cx="22" cy="30" r="2.4" fill="#fff3b0"/>' +
      '</g>'
    );
  }

  // Main hero factory ──────────────────────────────────────────────────────
  // opts: { skin, cap, shirt, overalls, shoe, star }
  function makeHero(o) {
    return (
      '<svg viewBox="0 0 100 100" class="hero" ' + STROKE + ' aria-hidden="true">' +
        '<g class="legs">' +
          '<rect class="leg leg-l" x="37" y="71" width="9" height="15" rx="4" fill="' + o.overalls + '"/>' +
          '<rect class="leg leg-r" x="54" y="71" width="9" height="15" rx="4" fill="' + o.overalls + '"/>' +
          '<ellipse class="shoe shoe-l" cx="39" cy="88" rx="8" ry="5" fill="' + o.shoe + '"/>' +
          '<ellipse class="shoe shoe-r" cx="61" cy="88" rx="8" ry="5" fill="' + o.shoe + '"/>' +
        '</g>' +
        '<g class="arms">' +
          '<path class="arm arm-l" d="M35 58 Q26 63 28 72" stroke="' + o.shirt + '" stroke-width="6" fill="none"/>' +
          '<path class="arm arm-r" d="M65 58 Q74 63 72 72" stroke="' + o.shirt + '" stroke-width="6" fill="none"/>' +
          '<circle cx="28" cy="73" r="3.6" fill="' + o.skin + '"/>' +
          '<circle cx="72" cy="73" r="3.6" fill="' + o.skin + '"/>' +
        '</g>' +
        '<g class="body">' +
          '<path d="M34 56 Q50 50 66 56 L68 73 L32 73 Z" fill="' + o.shirt + '"/>' +
          '<path d="M40 55 L40 73 L60 73 L60 55 Q50 60 40 55 Z" fill="' + o.overalls + '"/>' +
          '<circle cx="44" cy="63" r="2.3" fill="#ffd700" stroke="' + OUT + '" stroke-width="1"/>' +
          '<circle cx="56" cy="63" r="2.3" fill="#ffd700" stroke="' + OUT + '" stroke-width="1"/>' +
        '</g>' +
        '<g class="head">' +
          '<circle cx="50" cy="40" r="16" fill="' + o.skin + '"/>' +
          '<path d="M32 36 Q33 19 50 19 Q67 19 68 36 Q50 30 32 36 Z" fill="' + o.cap + '"/>' +
          '<path d="M30 37 Q42 33 53 36 Q41 31 30 37 Z" fill="' + o.cap + '"/>' +
          '<circle cx="50" cy="27.5" r="5" fill="#fff" stroke="' + OUT + '" stroke-width="1.5"/>' +
          emblemStar(o.star) +
          eye(44, 41) + eye(56, 41) +
          '<circle cx="50" cy="46" r="3" fill="' + o.skin + '" stroke="' + OUT + '" stroke-width="1.4"/>' +
          mustache() +
        '</g>' +
        sparkleAccent() +
      '</svg>'
    );
  }

  const C = window.HocVuiCharacters;

  // Hero pool — picked at random each run. Varied caps / overalls, original palette.
  C.registerSpecies('hero-red',    { svg: makeHero({ skin: '#ffd9b3', cap: '#e23030', shirt: '#e23030', overalls: '#2a64c8', shoe: '#5c2700', star: '#ffd700' }), classPrefix: 'hero-red' });
  C.registerSpecies('hero-green',  { svg: makeHero({ skin: '#ffcc9e', cap: '#2e9e44', shirt: '#2e9e44', overalls: '#7a4a1e', shoe: '#3a1d00', star: '#ffd700' }), classPrefix: 'hero-green' });
  C.registerSpecies('hero-blue',   { svg: makeHero({ skin: '#ffd9b3', cap: '#2a64c8', shirt: '#2a64c8', overalls: '#c81818', shoe: '#3a1d00', star: '#fff3b0' }), classPrefix: 'hero-blue' });
  C.registerSpecies('hero-yellow', { svg: makeHero({ skin: '#f5c08a', cap: '#f2b50a', shirt: '#f2b50a', overalls: '#6a3aa0', shoe: '#5c2700', star: '#e23030' }), classPrefix: 'hero-yellow' });
  C.registerSpecies('hero-purple', { svg: makeHero({ skin: '#ffcc9e', cap: '#7b3fb0', shirt: '#7b3fb0', overalls: '#0f9aa0', shoe: '#3a1d00', star: '#ffd700' }), classPrefix: 'hero-purple' });
  C.registerSpecies('hero-orange', { svg: makeHero({ skin: '#f5c08a', cap: '#ef7d1a', shirt: '#ef7d1a', overalls: '#2e9e44', shoe: '#5c2700', star: '#fff' }), classPrefix: 'hero-orange' });
})();
