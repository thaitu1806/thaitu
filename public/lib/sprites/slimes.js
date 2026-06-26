// Học Vui — V47 "Phòng Thí Nghiệm Slime" sprite registry.
// Chibi slime-creature characters, one per craft color + one rare rainbow/gold.
// Each species is an SVG (viewBox 0 0 100 100) with named <g>: .body, .head, .accent.
// CSS in v47/style.css drives animation per state (idle / happy / scared).
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[slimes.js] character.js must load first');
    return;
  }

  const OUT = '#1a0033';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  // Reusable bits ────────────────────────────────────────────────────────
  function eye(cx, cy) {
    return (
      '<g class="eye">' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="6" fill="#fff" stroke="' + OUT + '" stroke-width="1.5"/>' +
        '<circle cx="' + cx + '" cy="' + (cy + 1) + '" r="3" fill="' + OUT + '"/>' +
        '<circle cx="' + (cx + 1.4) + '" cy="' + (cy - 0.6) + '" r="1.1" fill="#fff"/>' +
      '</g>'
    );
  }
  function smile() {
    return '<path class="mouth" d="M42 60 Q50 68 58 60" stroke="' + OUT + '" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
  }
  // Glossy highlight blob on the body.
  function shine() {
    return '<ellipse class="shine" cx="38" cy="48" rx="7" ry="5" fill="#fff" opacity="0.45"/>';
  }
  // Little antenna/bubble on top of the head.
  function antenna(tip) {
    return (
      '<g class="antenna">' +
        '<path d="M50 30 Q50 20 56 16" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
        '<circle cx="57" cy="14" r="4" fill="' + tip + '" stroke="' + OUT + '" stroke-width="2"/>' +
      '</g>'
    );
  }

  // Main slime factory ─────────────────────────────────────────────────────
  // opts: { fill, shade, tip } — fill is body color, shade is the darker base puddle.
  function makeSlime(o) {
    return (
      '<svg viewBox="0 0 100 100" class="slime-spr" ' + STROKE + ' aria-hidden="true">' +
        // Shadow puddle under the blob.
        '<ellipse class="accent shadow" cx="50" cy="88" rx="26" ry="6" fill="' + OUT + '" opacity="0.25"/>' +
        '<g class="body">' +
          // Jiggly blob: domed top, wobbly drippy base.
          '<path d="M22 56 Q22 30 50 30 Q78 30 78 56 Q78 78 70 84 Q64 80 58 84 Q52 88 46 84 Q40 80 34 84 Q26 80 22 56 Z" fill="' + o.fill + '"/>' +
          // Darker base tint.
          '<path d="M26 70 Q38 80 50 80 Q62 80 74 70 Q78 78 70 84 Q64 80 58 84 Q52 88 46 84 Q40 80 34 84 Q26 80 26 70 Z" fill="' + o.shade + '" opacity="0.55" stroke="none"/>' +
          shine() +
        '</g>' +
        '<g class="head">' +
          eye(40, 52) + eye(60, 52) + smile() +
          // Rosy cheeks.
          '<circle class="cheek" cx="32" cy="60" r="3" fill="#ff8a80" opacity="0.55" stroke="none"/>' +
          '<circle class="cheek" cx="68" cy="60" r="3" fill="#ff8a80" opacity="0.55" stroke="none"/>' +
        '</g>' +
        '<g class="accent">' + antenna(o.tip) + '</g>' +
      '</svg>'
    );
  }

  // Rare slime — sparkly rainbow/gold blob with a crown of stars.
  function makeRareSlime() {
    return (
      '<svg viewBox="0 0 100 100" class="slime-spr slime-rare-spr" ' + STROKE + ' aria-hidden="true">' +
        '<defs>' +
          '<linearGradient id="slimeRareGrad" x1="0" y1="0" x2="1" y2="1">' +
            '<stop offset="0%" stop-color="#ff6f91"/>' +
            '<stop offset="35%" stop-color="#ffd54f"/>' +
            '<stop offset="65%" stop-color="#69f0ae"/>' +
            '<stop offset="100%" stop-color="#40c4ff"/>' +
          '</linearGradient>' +
        '</defs>' +
        '<ellipse class="accent shadow" cx="50" cy="88" rx="26" ry="6" fill="' + OUT + '" opacity="0.25"/>' +
        '<g class="body">' +
          '<path d="M22 56 Q22 30 50 30 Q78 30 78 56 Q78 78 70 84 Q64 80 58 84 Q52 88 46 84 Q40 80 34 84 Q26 80 22 56 Z" fill="url(#slimeRareGrad)"/>' +
          '<ellipse class="shine" cx="38" cy="48" rx="8" ry="6" fill="#fff" opacity="0.55"/>' +
        '</g>' +
        '<g class="head">' +
          eye(40, 52) + eye(60, 52) +
          '<path class="mouth" d="M42 60 Q50 69 58 60" stroke="' + OUT + '" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
          '<circle class="cheek" cx="32" cy="60" r="3" fill="#ff80ab" opacity="0.6" stroke="none"/>' +
          '<circle class="cheek" cx="68" cy="60" r="3" fill="#ff80ab" opacity="0.6" stroke="none"/>' +
        '</g>' +
        '<g class="accent">' +
          // Sparkle stars floating around the rare slime.
          '<path class="spark spark-1" d="M50 12 L52 18 L58 20 L52 22 L50 28 L48 22 L42 20 L48 18 Z" fill="#fff59d" stroke="#f9a825" stroke-width="1"/>' +
          '<path class="spark spark-2" d="M80 30 L81.5 34 L86 35.5 L81.5 37 L80 41 L78.5 37 L74 35.5 L78.5 34 Z" fill="#fff" stroke="#40c4ff" stroke-width="1"/>' +
          '<path class="spark spark-3" d="M18 36 L19.5 40 L24 41.5 L19.5 43 L18 47 L16.5 43 L12 41.5 L16.5 40 Z" fill="#fff" stroke="#ff6f91" stroke-width="1"/>' +
        '</g>' +
      '</svg>'
    );
  }

  const C = window.HocVuiCharacters;

  // One slime per craft color (ids match COLORS in game-logic.js).
  C.registerSpecies('slime-red',    { svg: makeSlime({ fill: '#ef5350', shade: '#c62828', tip: '#ffcdd2' }), classPrefix: 'slime-red' });
  C.registerSpecies('slime-blue',   { svg: makeSlime({ fill: '#42a5f5', shade: '#1565c0', tip: '#bbdefb' }), classPrefix: 'slime-blue' });
  C.registerSpecies('slime-green',  { svg: makeSlime({ fill: '#66bb6a', shade: '#2e7d32', tip: '#c8e6c9' }), classPrefix: 'slime-green' });
  C.registerSpecies('slime-yellow', { svg: makeSlime({ fill: '#ffca28', shade: '#f9a825', tip: '#fff9c4' }), classPrefix: 'slime-yellow' });
  C.registerSpecies('slime-purple', { svg: makeSlime({ fill: '#ab47bc', shade: '#6a1b9a', tip: '#e1bee7' }), classPrefix: 'slime-purple' });
  C.registerSpecies('slime-rare',   { svg: makeRareSlime(), classPrefix: 'slime-rare' });
})();
