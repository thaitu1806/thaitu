// Học Vui — V6 "Đua Xe Trí Tuệ" sprite registry.
// Chibi side-view race cars with a helmeted driver. Each species is an SVG
// (viewBox 0 0 100 100) with named <g>: .body, .head, .accent (wheels/trim).
// Cars are drawn facing LEFT so that the game's existing scaleX(-1) transform
// flips them to face the direction of travel (right).
// CSS in v6/style.css drives animation per state (idle / happy / drive / bump).
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[racers.js] character.js must load first');
    return;
  }

  const OUT = '#23203a';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  // Reusable race-car factory ─────────────────────────────────────────────
  // o: { body, trim, helmet, visor }
  function makeCar(o) {
    return (
      '<svg viewBox="0 0 100 100" class="racer" ' + STROKE + ' aria-hidden="true">' +
        '<g class="accent">' +
          '<circle class="wheel wheel-f" cx="27" cy="76" r="11" fill="#2b2b2b"/>' +
          '<circle class="hub hub-f" cx="27" cy="76" r="4.6" fill="' + o.trim + '"/>' +
          '<circle class="wheel wheel-r" cx="76" cy="76" r="11" fill="#2b2b2b"/>' +
          '<circle class="hub hub-r" cx="76" cy="76" r="4.6" fill="' + o.trim + '"/>' +
        '</g>' +
        '<g class="body">' +
          '<path class="spoiler" d="M82 56 L96 45 L99 49 L89 60 Z" fill="' + o.trim + '"/>' +
          '<path d="M8 66 Q8 57 22 55 L38 55 Q42 41 56 41 Q68 41 70 55 L84 55 Q94 55 94 66 Q94 72 86 72 L14 72 Q8 72 8 66 Z" fill="' + o.body + '"/>' +
          '<path d="M40 55 Q44 45 55 45 Q64 45 67 55 Z" fill="#cfeaff" opacity="0.9"/>' +
          '<circle class="light" cx="13" cy="63" r="3" fill="#fff3b0"/>' +
          '<rect class="stripe" x="30" y="62" width="44" height="4" rx="2" fill="' + o.trim + '" opacity="0.85"/>' +
        '</g>' +
        '<g class="head">' +
          '<circle class="helmet" cx="55" cy="37" r="11" fill="' + o.helmet + '"/>' +
          '<path class="visor" d="M47 37 Q55 31 63 37 L63 41 Q55 38 47 41 Z" fill="' + o.visor + '"/>' +
          '<path class="crest" d="M50 26 Q55 22 60 26" stroke="' + o.trim + '" stroke-width="3" fill="none"/>' +
        '</g>' +
      '</svg>'
    );
  }

  // Checkered finish flag — used for podium / finish accents if needed.
  const flag =
    '<svg viewBox="0 0 100 100" class="flag" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent"><rect x="22" y="14" width="5" height="72" rx="2.5" fill="#444"/></g>' +
      '<g class="body">' +
        '<rect x="27" y="18" width="14" height="14" fill="#222"/>' +
        '<rect x="41" y="18" width="14" height="14" fill="#fff"/>' +
        '<rect x="55" y="18" width="14" height="14" fill="#222"/>' +
        '<rect x="27" y="32" width="14" height="14" fill="#fff"/>' +
        '<rect x="41" y="32" width="14" height="14" fill="#222"/>' +
        '<rect x="55" y="32" width="14" height="14" fill="#fff"/>' +
        '<rect x="27" y="46" width="14" height="14" fill="#222"/>' +
        '<rect x="41" y="46" width="14" height="14" fill="#fff"/>' +
        '<rect x="55" y="46" width="14" height="14" fill="#222"/>' +
      '</g>' +
    '</svg>';

  const C = window.HocVuiCharacters;

  // Player cars — ids map to the two racers in the game (P1 red, P2 blue).
  C.registerSpecies('car-red',    { svg: makeCar({ body: '#e74c3c', trim: '#ffd23f', helmet: '#c0392b', visor: '#2b2b2b' }), classPrefix: 'racer' });
  C.registerSpecies('car-blue',   { svg: makeCar({ body: '#3498db', trim: '#ffffff', helmet: '#2471a3', visor: '#2b2b2b' }), classPrefix: 'racer' });
  // Extra liveries available for variety / future use (cheap, share the engine).
  C.registerSpecies('car-green',  { svg: makeCar({ body: '#27ae60', trim: '#f1c40f', helmet: '#1e8449', visor: '#2b2b2b' }), classPrefix: 'racer' });
  C.registerSpecies('car-yellow', { svg: makeCar({ body: '#f39c12', trim: '#2c3e50', helmet: '#d68910', visor: '#2b2b2b' }), classPrefix: 'racer' });

  C.registerSpecies('flag', { svg: flag, classPrefix: 'flag' });
})();
