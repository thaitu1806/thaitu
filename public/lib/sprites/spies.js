// Học Vui — V53 "Đặc Vụ Mèo" sprite registry.
// Chibi spy-agent cats. Each species is an SVG (viewBox 0 0 100 100) with named
// <g>: .body, .head, .accent (+ .tail, .ears for animation hooks).
// CSS in v53/style.css drives animation per state (idle / happy / scared).
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[spies.js] character.js must load first');
    return;
  }

  const OUT = '#14142b';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  // Reusable bits ────────────────────────────────────────────────────────
  function eye(cx, cy, r) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="' + (r || 2.6) + '" fill="' + OUT + '"/>';
  }
  function whiskers() {
    return (
      '<g class="whiskers" stroke="' + OUT + '" stroke-width="1.4" stroke-linecap="round">' +
        '<path d="M40 47 L28 45"/><path d="M40 50 L28 51"/>' +
        '<path d="M60 47 L72 45"/><path d="M60 50 L72 51"/>' +
      '</g>'
    );
  }
  function nose() {
    return '<path class="nose" d="M47 48 L53 48 L50 51 Z" fill="#e94560" stroke="' + OUT + '" stroke-width="1"/>';
  }
  function ears(fill, inner) {
    return (
      '<g class="ears">' +
        '<path d="M33 30 L30 14 L45 24 Z" fill="' + fill + '" stroke="' + OUT + '" stroke-width="2"/>' +
        '<path d="M67 30 L70 14 L55 24 Z" fill="' + fill + '" stroke="' + OUT + '" stroke-width="2"/>' +
        '<path d="M35 27 L33 18 L42 24 Z" fill="' + inner + '"/>' +
        '<path d="M65 27 L67 18 L58 24 Z" fill="' + inner + '"/>' +
      '</g>'
    );
  }

  // Main spy-cat factory ──────────────────────────────────────────────────
  // opts: { fur, inner, suit, tailTip, gear, accent }
  function makeCat(o) {
    const accent = o.accent || '';
    return (
      '<svg viewBox="0 0 100 100" class="spy" ' + STROKE + ' aria-hidden="true">' +
        // tail — curls behind, flicks during idle
        '<g class="tail">' +
          '<path d="M68 72 Q90 70 86 50 Q84 40 76 42" fill="none" stroke="' + o.fur + '" stroke-width="7"/>' +
          '<circle cx="76" cy="42" r="4.5" fill="' + (o.tailTip || o.fur) + '"/>' +
        '</g>' +
        // crouched body
        '<g class="body">' +
          '<path d="M28 84 Q26 60 50 60 Q74 60 72 84 Z" fill="' + o.suit + '"/>' +
          '<path d="M50 60 L50 84" stroke="' + OUT + '" stroke-width="1.2" opacity="0.5"/>' +
          // little paws
          '<ellipse cx="37" cy="84" rx="6" ry="4" fill="' + o.fur + '"/>' +
          '<ellipse cx="63" cy="84" rx="6" ry="4" fill="' + o.fur + '"/>' +
          accent +
        '</g>' +
        // head
        '<g class="head">' +
          ears(o.fur, o.inner) +
          '<circle cx="50" cy="42" r="20" fill="' + o.fur + '"/>' +
          eye(43, 43) + eye(57, 43) + nose() + whiskers() +
          (o.gear || '') +
        '</g>' +
      '</svg>'
    );
  }

  // Spy-gear accessories (worn on the head <g>) ────────────────────────────
  const sunglasses =
    '<g class="spy-gear">' +
      '<rect x="36" y="39" width="11" height="8" rx="2.5" fill="' + OUT + '"/>' +
      '<rect x="53" y="39" width="11" height="8" rx="2.5" fill="' + OUT + '"/>' +
      '<path d="M47 42 L53 42" stroke="' + OUT + '" stroke-width="2"/>' +
      '<path d="M30 41 L36 42 M64 42 L70 41" stroke="' + OUT + '" stroke-width="2"/>' +
      '<path d="M38 41 L44 40" stroke="#fff" stroke-width="1.4" opacity="0.7"/>' +
    '</g>';

  const fedora =
    '<g class="spy-gear">' +
      '<path d="M28 28 Q50 24 72 28 Q66 30 50 30 Q34 30 28 28 Z" fill="#3a2c1a" stroke="' + OUT + '" stroke-width="2"/>' +
      '<path d="M37 28 Q37 14 50 14 Q63 14 63 28 Z" fill="#4d3a22" stroke="' + OUT + '" stroke-width="2"/>' +
      '<rect x="37" y="24" width="26" height="4" fill="#e94560"/>' +
    '</g>';

  const ninjaMask =
    '<g class="spy-gear">' +
      '<path d="M30 36 Q50 32 70 36 L70 41 Q50 39 30 41 Z" fill="' + OUT + '"/>' +
      '<path d="M30 49 Q50 56 70 49 L70 62 Q50 66 30 62 Z" fill="' + OUT + '"/>' +
    '</g>';

  const earpiece =
    '<g class="spy-gear">' +
      '<circle cx="68" cy="46" r="4" fill="#222" stroke="' + OUT + '" stroke-width="1.5"/>' +
      '<path d="M68 50 Q70 60 60 62" stroke="' + OUT + '" stroke-width="1.6" fill="none"/>' +
      '<circle cx="68" cy="46" r="1.6" fill="#4caf50"/>' +
    '</g>';

  const bowtie =
    '<g class="accent-extra">' +
      '<path d="M44 66 L50 70 L44 74 Z" fill="#e94560" stroke="' + OUT + '" stroke-width="1.5"/>' +
      '<path d="M56 66 L50 70 L56 74 Z" fill="#e94560" stroke="' + OUT + '" stroke-width="1.5"/>' +
      '<circle cx="50" cy="70" r="2" fill="#c2185b"/>' +
    '</g>';

  const necktie =
    '<g class="accent-extra">' +
      '<path d="M50 62 L46 67 L50 70 L54 67 Z" fill="#f5d27a"/>' +
      '<path d="M50 70 L46 82 L50 86 L54 82 Z" fill="#f5d27a" stroke="' + OUT + '" stroke-width="1.2"/>' +
    '</g>';

  const badge =
    '<g class="accent-extra">' +
      '<circle cx="38" cy="72" r="5" fill="#f5d27a" stroke="' + OUT + '" stroke-width="1.5"/>' +
      '<path d="M38 69 L39 71.5 L41.5 71.5 L39.5 73 L40.5 75.5 L38 74 L35.5 75.5 L36.5 73 L34.5 71.5 L37 71.5 Z" fill="#c2185b"/>' +
    '</g>';

  const collar =
    '<g class="accent-extra">' +
      '<path d="M40 62 L50 68 L60 62" fill="none" stroke="#fff" stroke-width="2.5"/>' +
    '</g>';

  const C = window.HocVuiCharacters;

  // Spy-agent pool (picked at random each run).
  C.registerSpecies('spy-shadow', { svg: makeCat({
    fur: '#3d3d5c', inner: '#e94560', suit: '#22223b', tailTip: '#1a1a2e',
    gear: sunglasses, accent: necktie }), classPrefix: 'spy-shadow' });

  C.registerSpecies('spy-detective', { svg: makeCat({
    fur: '#c8893f', inner: '#ffd9b3', suit: '#5d4427', tailTip: '#8a5a2b',
    gear: fedora, accent: collar }), classPrefix: 'spy-detective' });

  C.registerSpecies('spy-ninja', { svg: makeCat({
    fur: '#2b2b40', inner: '#e94560', suit: '#1a1a2e', tailTip: '#e94560',
    gear: ninjaMask, accent: '' }), classPrefix: 'spy-ninja' });

  C.registerSpecies('spy-agent', { svg: makeCat({
    fur: '#9aa0b5', inner: '#e94560', suit: '#2d2d44', tailTip: '#6d7286',
    gear: earpiece, accent: bowtie }), classPrefix: 'spy-agent' });

  C.registerSpecies('spy-tux', { svg: makeCat({
    fur: '#1f1f30', inner: '#f5d27a', suit: '#0e0e1c', tailTip: '#fff',
    gear: sunglasses, accent: bowtie }), classPrefix: 'spy-tux' });

  C.registerSpecies('spy-golden', { svg: makeCat({
    fur: '#e8a849', inner: '#fff0d6', suit: '#7a4f1c', tailTip: '#c2185b',
    gear: earpiece, accent: badge }), classPrefix: 'spy-golden' });
})();
