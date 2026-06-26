// Học Vui — V42 "Khinh Khí Cầu Bay Cao" sprite registry.
// Chibi hot-air-balloon characters. Each species is an SVG (viewBox 0 0 100 100)
// with named <g>: .body (envelope), .head (smiley face), .accent (basket + ropes + flame + motif).
// CSS in v42/style.css drives animation per state (idle / happy / scared).
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[balloons.js] character.js must load first');
    return;
  }

  const OUT = '#23314d';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  // Reusable bits ────────────────────────────────────────────────────────
  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.8" fill="' + OUT + '"/>';
  }
  function smile() {
    return '<path class="mouth" d="M43 47 Q50 54 57 47" stroke="' + OUT + '" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
  }
  function cheeks() {
    return (
      '<circle cx="38" cy="46" r="3" fill="#ff8aa0" opacity="0.65"/>' +
      '<circle cx="62" cy="46" r="3" fill="#ff8aa0" opacity="0.65"/>'
    );
  }

  // Envelope outline path — classic teardrop hot-air-balloon shape.
  const ENVELOPE = 'M50 10 C72 10 82 30 79 46 C77 59 65 66 58 68 L42 68 C35 66 23 59 21 46 C18 30 28 10 50 10 Z';

  // Three vertical "gore" seams that give the segmented balloon look.
  function gores() {
    return (
      '<g class="gores">' +
        '<path d="M50 11 L50 68" stroke="' + OUT + '" stroke-width="1.6" fill="none" opacity="0.55"/>' +
        '<path d="M50 11 C39 28 37 50 42 67" stroke="' + OUT + '" stroke-width="1.6" fill="none" opacity="0.55"/>' +
        '<path d="M50 11 C61 28 63 50 58 67" stroke="' + OUT + '" stroke-width="1.6" fill="none" opacity="0.55"/>' +
      '</g>'
    );
  }

  // Basket, suspension ropes and the burner flame (accent group).
  function basket(o) {
    return (
      '<g class="ropes">' +
        '<path d="M42 68 L45 80" stroke="' + OUT + '" stroke-width="1.6" fill="none"/>' +
        '<path d="M58 68 L55 80" stroke="' + OUT + '" stroke-width="1.6" fill="none"/>' +
        '<path d="M50 68 L50 80" stroke="' + OUT + '" stroke-width="1.6" fill="none" opacity="0.7"/>' +
      '</g>' +
      '<g class="flame"><path d="M50 66 C46 72 50 76 50 76 C50 76 54 72 50 66 Z" fill="#ffc107" stroke="#ff7043" stroke-width="1.2"/></g>' +
      '<g class="basket"><rect x="43" y="80" width="14" height="11" rx="2.5" fill="' + o.basket + '"/>' +
        '<path d="M43 84 L57 84" stroke="' + OUT + '" stroke-width="1.4" opacity="0.6"/></g>'
    );
  }

  // Main balloon factory ──────────────────────────────────────────────────
  // opts: { envelope, band, basket, motif }
  function makeBalloon(o) {
    const motif = o.motif || '';
    return (
      '<svg viewBox="0 0 100 100" class="balloon-sprite" ' + STROKE + ' aria-hidden="true">' +
        '<g class="accent accent-back">' + basket(o) + '</g>' +
        '<g class="body">' +
          '<path class="envelope" d="' + ENVELOPE + '" fill="' + o.envelope + '"/>' +
          (o.band ? '<path class="band" d="M24 50 C36 56 64 56 76 50" stroke="' + o.band + '" stroke-width="6" fill="none" opacity="0.85"/>' : '') +
          gores() + motif +
        '</g>' +
        '<g class="head">' + eye(44, 40) + eye(56, 40) + smile() + cheeks() + '</g>' +
      '</svg>'
    );
  }

  const C = window.HocVuiCharacters;

  // Balloon character pool (picked at random each run).
  C.registerSpecies('balloon-sunrise', { svg: makeBalloon({ envelope: '#ff7e5f', band: '#feb47b', basket: '#8d6e63',
    motif: '<path d="M50 24 L53 32 L61 32 L55 37 L57 45 L50 40 L43 45 L45 37 L39 32 L47 32 Z" fill="#fff3c4" opacity="0.9"/>' }), classPrefix: 'balloon-sunrise' });

  C.registerSpecies('balloon-ocean', { svg: makeBalloon({ envelope: '#29b6f6', band: '#0277bd', basket: '#6d4c41',
    motif: '<path d="M28 30 Q34 25 40 30 M44 26 Q50 21 56 26 M60 30 Q66 25 72 30" stroke="#e1f5fe" stroke-width="2.2" fill="none" opacity="0.9"/>' }), classPrefix: 'balloon-ocean' });

  C.registerSpecies('balloon-forest', { svg: makeBalloon({ envelope: '#66bb6a', band: '#2e7d32', basket: '#5d4037',
    motif: '<circle cx="38" cy="30" r="3.2" fill="#e8f5e9" opacity="0.9"/><circle cx="62" cy="30" r="3.2" fill="#e8f5e9" opacity="0.9"/><circle cx="50" cy="24" r="3.2" fill="#e8f5e9" opacity="0.9"/>' }), classPrefix: 'balloon-forest' });

  C.registerSpecies('balloon-berry', { svg: makeBalloon({ envelope: '#ab47bc', band: '#ffeb3b', basket: '#6d4c41',
    motif: '<path d="M50 22 C46 26 46 32 50 34 C54 32 54 26 50 22 Z" fill="#fff3c4" opacity="0.9"/>' }), classPrefix: 'balloon-berry' });

  C.registerSpecies('balloon-candy', { svg: makeBalloon({ envelope: '#ff8a80', band: '#ffffff', basket: '#8d6e63',
    motif: '<path d="M30 28 L42 22 M44 34 L56 28 M58 28 L70 22" stroke="#fff" stroke-width="3" fill="none" opacity="0.85"/>' }), classPrefix: 'balloon-candy' });

  C.registerSpecies('balloon-sunny', { svg: makeBalloon({ envelope: '#ffd54f', band: '#fb8c00', basket: '#5d4037',
    motif: '<circle cx="50" cy="29" r="5" fill="#fff9c4"/><path d="M50 20 L50 16 M58 23 L61 20 M42 23 L39 20 M59 31 L63 31 M41 31 L37 31" stroke="#fff9c4" stroke-width="1.8"/>' }), classPrefix: 'balloon-sunny' });
})();
