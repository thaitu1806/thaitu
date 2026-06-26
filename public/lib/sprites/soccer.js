// Học Vui — V55 "Sân Bóng Trí Tuệ" sprite registry.
// Chibi soccer characters: STRIKER (the player, jersey kid), KEEPER (opponent goalie),
// and a BALL mascot. Each species is an SVG (viewBox 0 0 100 100) with named <g>:
// .body, .head, .accent (plus .legs / .arms / .leg-r for the kick animation, .ball).
// CSS in v55/style.css drives animation per state (idle / happy / scared).
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[soccer.js] character.js must load first');
    return;
  }

  const OUT = '#0d2b0f';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  // Reusable bits ────────────────────────────────────────────────────────
  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.5" fill="' + OUT + '"/>';
  }
  function smile() {
    return '<path class="mouth" d="M44 47 Q50 53 56 47" stroke="' + OUT + '" stroke-width="2" fill="none" stroke-linecap="round"/>';
  }
  function cheek(cx) {
    return '<circle cx="' + cx + '" cy="46" r="2.6" fill="#ff8a80" opacity="0.55"/>';
  }
  // A small soccer ball glyph (used as foot-ball accent + ball mascot face base).
  function ballGlyph(cx, cy, r, cls) {
    return (
      '<g class="' + (cls || 'ball') + '">' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#fff" stroke="' + OUT + '" stroke-width="2"/>' +
        '<path d="M' + cx + ' ' + (cy - r * 0.55) + ' l' + (r * 0.45) + ' ' + (r * 0.35) + ' l-' + (r * 0.17) + ' ' + (r * 0.55) +
          ' h-' + (r * 0.56) + ' l-' + (r * 0.17) + ' -' + (r * 0.55) + ' Z" fill="' + OUT + '"/>' +
      '</g>'
    );
  }
  function sparkAccent() {
    return (
      '<g class="accent">' +
        '<path class="spark spark-1" d="M80 20 L81.4 24 L85.4 25.4 L81.4 26.8 L80 30.8 L78.6 26.8 L74.6 25.4 L78.6 24 Z" fill="#ffeb3b"/>' +
        '<circle class="spark spark-2" cx="20" cy="28" r="2.4" fill="#fff59d"/>' +
      '</g>'
    );
  }

  // Striker factory ─────────────────────────────────────────────────────────
  // A kid in a jersey, ready to dribble/kick. opts: { skin, jersey, shorts, sock, hair, hairColor, num }
  function makeStriker(o) {
    let hair;
    if (o.hair === 'curly') {
      hair = '<path d="M33 35 Q31 18 50 18 Q69 18 67 35 Q62 27 56 30 Q53 24 47 28 Q42 25 38 30 Q35 28 33 35 Z" fill="' + o.hairColor + '" stroke="' + OUT + '" stroke-width="2"/>';
    } else if (o.hair === 'spiky') {
      hair = '<path d="M33 36 L37 22 L44 33 L50 19 L56 33 L63 22 L67 36 Q58 28 50 28 Q42 28 33 36 Z" fill="' + o.hairColor + '" stroke="' + OUT + '" stroke-width="2"/>';
    } else if (o.hair === 'bowl') {
      hair = '<path d="M32 38 Q32 18 50 18 Q68 18 68 38 Q50 33 32 38 Z" fill="' + o.hairColor + '" stroke="' + OUT + '" stroke-width="2"/>';
    } else {
      hair = '<path d="M34 37 Q34 19 50 19 Q66 19 66 37 Q58 29 50 29 Q42 29 34 37 Z" fill="' + o.hairColor + '" stroke="' + OUT + '" stroke-width="2"/>';
    }
    const num = o.num
      ? '<text x="50" y="66" text-anchor="middle" font-size="11" font-weight="900" fill="#fff" stroke="' + OUT + '" stroke-width="0.6">' + o.num + '</text>'
      : '';
    return (
      '<svg viewBox="0 0 100 100" class="striker" ' + STROKE + ' aria-hidden="true">' +
        '<g class="legs">' +
          '<rect class="leg leg-l" x="40" y="70" width="8" height="14" rx="3.5" fill="' + o.skin + '"/>' +
          '<rect class="leg leg-r" x="52" y="70" width="8" height="14" rx="3.5" fill="' + o.skin + '"/>' +
          '<rect class="sock sock-l" x="39.5" y="80" width="9" height="6" rx="2" fill="' + o.sock + '"/>' +
          '<rect class="sock sock-r" x="51.5" y="80" width="9" height="6" rx="2" fill="' + o.sock + '"/>' +
          '<ellipse class="shoe shoe-l" cx="42" cy="88" rx="7" ry="4" fill="' + OUT + '"/>' +
          '<ellipse class="shoe shoe-r" cx="58" cy="88" rx="7" ry="4" fill="' + OUT + '"/>' +
        '</g>' +
        '<g class="arms">' +
          '<path class="arm arm-l" d="M36 58 Q27 62 27 71" stroke="' + o.jersey + '" stroke-width="6" fill="none"/>' +
          '<path class="arm arm-r" d="M64 58 Q73 62 73 71" stroke="' + o.jersey + '" stroke-width="6" fill="none"/>' +
          '<circle cx="27" cy="72" r="3.4" fill="' + o.skin + '"/>' +
          '<circle cx="73" cy="72" r="3.4" fill="' + o.skin + '"/>' +
        '</g>' +
        '<g class="body">' +
          '<path d="M35 55 Q50 49 65 55 L67 71 L33 71 Z" fill="' + o.jersey + '"/>' +
          '<rect x="40" y="68" width="20" height="6" rx="2" fill="' + o.shorts + '"/>' +
          num +
        '</g>' +
        '<g class="head">' +
          '<circle cx="50" cy="40" r="15" fill="' + o.skin + '"/>' +
          hair + eye(44, 41) + eye(56, 41) + cheek(40) + cheek(60) + smile() +
        '</g>' +
        '<g class="ball-foot">' + ballGlyph(64, 86, 7, 'ball') + '</g>' +
        sparkAccent() +
      '</svg>'
    );
  }

  // Keeper (opponent goalie) ─────────────────────────────────────────────────
  function makeKeeper(o) {
    return (
      '<svg viewBox="0 0 100 100" class="keeper" ' + STROKE + ' aria-hidden="true">' +
        '<g class="net" aria-hidden="true">' +
          '<rect x="10" y="22" width="80" height="56" rx="3" fill="none" stroke="#cfd8dc" stroke-width="2.5"/>' +
          '<path d="M24 22 L24 78 M38 22 L38 78 M52 22 L52 78 M66 22 L66 78 M76 22 L76 78 M10 36 L90 36 M10 50 L90 50 M10 64 L90 64" stroke="#cfd8dc" stroke-width="1" opacity="0.7"/>' +
        '</g>' +
        '<g class="legs">' +
          '<rect class="leg leg-l" x="40" y="70" width="8" height="14" rx="3.5" fill="' + o.skin + '"/>' +
          '<rect class="leg leg-r" x="52" y="70" width="8" height="14" rx="3.5" fill="' + o.skin + '"/>' +
          '<ellipse cx="42" cy="88" rx="7" ry="4" fill="' + OUT + '"/>' +
          '<ellipse cx="58" cy="88" rx="7" ry="4" fill="' + OUT + '"/>' +
        '</g>' +
        '<g class="arms">' +
          '<path class="arm arm-l" d="M35 57 Q22 56 19 47" stroke="' + o.jersey + '" stroke-width="6" fill="none"/>' +
          '<path class="arm arm-r" d="M65 57 Q78 56 81 47" stroke="' + o.jersey + '" stroke-width="6" fill="none"/>' +
          '<circle class="glove" cx="18" cy="45" r="5" fill="' + o.glove + '"/>' +
          '<circle class="glove" cx="82" cy="45" r="5" fill="' + o.glove + '"/>' +
        '</g>' +
        '<g class="body">' +
          '<path d="M35 55 Q50 49 65 55 L67 71 L33 71 Z" fill="' + o.jersey + '"/>' +
        '</g>' +
        '<g class="head">' +
          '<circle cx="50" cy="40" r="15" fill="' + o.skin + '"/>' +
          '<path d="M34 37 Q34 20 50 20 Q66 20 66 37 Q58 30 50 30 Q42 30 34 37 Z" fill="' + o.hairColor + '" stroke="' + OUT + '" stroke-width="2"/>' +
          // sly opponent eyebrows + grin
          '<path d="M40 37 L47 39 M60 37 L53 39" stroke="' + OUT + '" stroke-width="2"/>' +
          eye(45, 42) + eye(55, 42) +
          '<path class="mouth" d="M44 49 Q50 47 56 49" stroke="' + OUT + '" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '</g>' +
      '</svg>'
    );
  }

  // Ball mascot ───────────────────────────────────────────────────────────────
  const ballMascot =
    '<svg viewBox="0 0 100 100" class="ballmascot" ' + STROKE + ' aria-hidden="true">' +
      '<g class="body">' +
        '<circle cx="50" cy="52" r="30" fill="#fff" stroke="' + OUT + '" stroke-width="2.5"/>' +
        '<path d="M50 30 L62 39 L57 53 H43 L38 39 Z" fill="' + OUT + '"/>' +
        '<path d="M50 30 L62 39 M50 30 L38 39 M62 39 L74 36 M38 39 L26 36 M57 53 L66 64 M43 53 L34 64" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
      '</g>' +
      '<g class="head">' +
        eye(43, 50) + eye(57, 50) +
        '<path class="mouth" d="M43 60 Q50 66 57 60" stroke="' + OUT + '" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '</g>' +
      sparkAccent() +
    '</svg>';

  const C = window.HocVuiCharacters;

  // Striker pool — picked at random each run. Varied jersey colors on the green pitch palette.
  C.registerSpecies('striker',   { svg: makeStriker({ skin: '#ffcc9e', jersey: '#ffeb3b', shorts: '#1b5e20', sock: '#fff', hair: 'short',  hairColor: '#3a2410', num: '9' }),  classPrefix: 'striker' });
  C.registerSpecies('striker-2', { svg: makeStriker({ skin: '#f5c08a', jersey: '#e53935', shorts: '#fff',    sock: '#1b5e20', hair: 'spiky', hairColor: '#1a1a1a', num: '7' }), classPrefix: 'striker-2' });
  C.registerSpecies('striker-3', { svg: makeStriker({ skin: '#ffd9b3', jersey: '#1e88e5', shorts: '#fff',    sock: '#1e88e5', hair: 'curly', hairColor: '#4a2c0a', num: '10' }), classPrefix: 'striker-3' });
  C.registerSpecies('striker-4', { svg: makeStriker({ skin: '#e0a878', jersey: '#fff',    shorts: '#43a047', sock: '#43a047', hair: 'bowl',  hairColor: '#1a1a1a', num: '11' }), classPrefix: 'striker-4' });

  // Opponent goalie + ball mascot.
  C.registerSpecies('keeper', { svg: makeKeeper({ skin: '#e0a878', jersey: '#37474f', glove: '#ff7043', hairColor: '#1a1a1a' }), classPrefix: 'keeper' });
  C.registerSpecies('ball',   { svg: ballMascot, classPrefix: 'ball' });
})();
