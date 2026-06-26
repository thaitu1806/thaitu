// Học Vui — V49 "DJ Nhí" sprite registry.
// Chibi DJ characters + theme-track icons. Each species is an SVG (viewBox 0 0 100 100)
// with named <g>: .body, .head, .accent (and .deck/.arms where applicable).
// CSS in v49/style.css drives animation per state (idle / happy / groove).
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[dj.js] character.js must load first');
    return;
  }

  const OUT = '#1a0033';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  // Reusable bits ────────────────────────────────────────────────────────
  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.6" fill="' + OUT + '"/>';
  }
  function smile() {
    return '<path class="mouth" d="M44 47 Q50 53 56 47" stroke="' + OUT + '" stroke-width="2" fill="none" stroke-linecap="round"/>';
  }
  function phones(cup) {
    return (
      '<path class="hp-band" d="M32 40 A18 18 0 0 1 68 40" fill="none" stroke="' + OUT + '" stroke-width="4"/>' +
      '<rect class="hp-cup" x="27" y="37" width="9" height="15" rx="4" fill="' + cup + '" stroke="' + OUT + '" stroke-width="2"/>' +
      '<rect class="hp-cup" x="64" y="37" width="9" height="15" rx="4" fill="' + cup + '" stroke="' + OUT + '" stroke-width="2"/>'
    );
  }
  function noteAccent() {
    return (
      '<g class="note-accent">' +
        '<path d="M72 24 L72 12 L80 10 L80 20" stroke="#ffeb3b" stroke-width="2" fill="none"/>' +
        '<circle cx="70" cy="24" r="2.8" fill="#ffeb3b"/>' +
        '<circle cx="78" cy="20" r="2.8" fill="#ffeb3b"/>' +
      '</g>'
    );
  }

  // Main DJ factory ───────────────────────────────────────────────────────
  // opts: { skin, shirt, hairColor, cup, discL, discR, hair, mark }
  function makeDJ(o) {
    let hair;
    if (o.hair === 'spiky') {
      hair = '<path d="M33 36 L37 22 L44 33 L50 19 L56 33 L63 22 L67 36 Q58 28 50 28 Q42 28 33 36 Z" fill="' + o.hairColor + '" stroke="' + OUT + '" stroke-width="2"/>';
    } else if (o.hair === 'afro') {
      hair = '<circle cx="50" cy="32" r="19" fill="' + o.hairColor + '" stroke="' + OUT + '" stroke-width="2"/>';
    } else if (o.hair === 'beanie') {
      hair = '<path d="M34 36 Q34 18 50 18 Q66 18 66 36 Z" fill="' + o.hairColor + '" stroke="' + OUT + '" stroke-width="2"/>' +
             '<rect x="33" y="34" width="34" height="5" rx="2.5" fill="' + o.hairColor + '" stroke="' + OUT + '" stroke-width="2"/>';
    } else if (o.hair === 'cap') {
      hair = '<path d="M33 35 Q50 15 67 35 Z" fill="' + o.hairColor + '" stroke="' + OUT + '" stroke-width="2"/>' +
             '<path d="M30 35 L50 35 Q40 31 30 35 Z" fill="' + o.hairColor + '" stroke="' + OUT + '" stroke-width="2"/>';
    } else {
      hair = '<path d="M34 37 Q34 19 50 19 Q66 19 66 37 Q59 29 50 29 Q41 29 34 37 Z" fill="' + o.hairColor + '" stroke="' + OUT + '" stroke-width="2"/>';
    }
    const mark = o.mark || '';
    return (
      '<svg viewBox="0 0 100 100" class="dj" ' + STROKE + ' aria-hidden="true">' +
        '<g class="deck">' +
          '<rect x="15" y="72" width="70" height="16" rx="5" fill="#311b4f"/>' +
          '<circle class="disc disc-l" cx="33" cy="80" r="6" fill="' + o.discL + '"/>' +
          '<circle class="disc disc-r" cx="67" cy="80" r="6" fill="' + o.discR + '"/>' +
        '</g>' +
        '<g class="arms">' +
          '<path d="M40 64 L31 75" stroke="' + o.skin + '" stroke-width="5" fill="none"/>' +
          '<path d="M60 64 L69 75" stroke="' + o.skin + '" stroke-width="5" fill="none"/>' +
        '</g>' +
        '<g class="body">' +
          '<path d="M35 54 Q50 47 65 54 L69 72 L31 72 Z" fill="' + o.shirt + '"/>' + mark +
        '</g>' +
        '<g class="head">' +
          '<circle cx="50" cy="39" r="15" fill="' + o.skin + '"/>' +
          hair + eye(44, 40) + eye(56, 40) + smile() +
        '</g>' +
        '<g class="accent">' + phones(o.cup) + noteAccent() + '</g>' +
      '</svg>'
    );
  }

  // Theme-track icons (ids MUST match TRACK_THEMES in game-logic.js) ────────
  const popStar =
    '<svg viewBox="0 0 100 100" class="trk trk-pop" ' + STROKE + ' aria-hidden="true">' +
      '<g class="body"><path d="M50 12 L60 38 L88 40 L66 58 L73 86 L50 70 L27 86 L34 58 L12 40 L40 38 Z" fill="#ffeb3b"/></g>' +
      '<g class="head">' + eye(44, 50) + eye(56, 50) + smile() + '</g>' +
      '<g class="accent"><circle cx="50" cy="50" r="13" fill="none" stroke="#e040fb" stroke-width="2" opacity="0.8"/></g>' +
    '</svg>';

  const rockGuitar =
    '<svg viewBox="0 0 100 100" class="trk trk-rock" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent"><rect x="64" y="14" width="9" height="40" rx="3" fill="#311b4f" transform="rotate(35 68 34)"/>' +
        '<rect x="80" y="10" width="14" height="12" rx="2" fill="#1a0033"/></g>' +
      '<g class="body"><ellipse cx="40" cy="64" rx="24" ry="20" fill="#e040fb" transform="rotate(35 40 64)"/>' +
        '<circle cx="40" cy="64" r="7" fill="#1a0033"/></g>' +
      '<g class="head"><path d="M22 54 L34 70" stroke="#ffeb3b" stroke-width="2"/>' +
        '<path d="M30 50 L42 66" stroke="#ffeb3b" stroke-width="2"/></g>' +
    '</svg>';

  const hipMic =
    '<svg viewBox="0 0 100 100" class="trk trk-hip" ' + STROKE + ' aria-hidden="true">' +
      '<g class="body"><rect x="46" y="50" width="8" height="36" rx="4" fill="#311b4f" transform="rotate(-18 50 68)"/></g>' +
      '<g class="head"><circle cx="58" cy="34" r="17" fill="#00bcd4"/>' +
        '<path d="M47 28 L69 28 M45 34 L71 34 M47 40 L69 40" stroke="#1a0033" stroke-width="2"/></g>' +
      '<g class="accent"><circle cx="58" cy="34" r="17" fill="none" stroke="#80deea" stroke-width="2" opacity="0.7"/></g>' +
    '</svg>';

  const edmEq =
    '<svg viewBox="0 0 100 100" class="trk trk-edm" ' + STROKE + ' aria-hidden="true">' +
      '<g class="body">' +
        '<rect class="bar bar-1" x="20" y="50" width="12" height="34" rx="3" fill="#00e5ff"/>' +
        '<rect class="bar bar-2" x="38" y="34" width="12" height="50" rx="3" fill="#e040fb"/>' +
        '<rect class="bar bar-3" x="56" y="44" width="12" height="40" rx="3" fill="#b388ff"/>' +
        '<rect class="bar bar-4" x="74" y="28" width="12" height="56" rx="3" fill="#ffeb3b"/>' +
      '</g>' +
      '<g class="accent"><path d="M14 86 L92 86" stroke="' + OUT + '" stroke-width="3"/></g>' +
    '</svg>';

  const funkyDisco =
    '<svg viewBox="0 0 100 100" class="trk trk-funky" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent"><path d="M50 8 L50 26" stroke="' + OUT + '" stroke-width="3"/></g>' +
      '<g class="body"><circle cx="50" cy="56" r="28" fill="#b388ff"/>' +
        '<path d="M28 44 L72 44 M24 56 L76 56 M28 68 L72 68" stroke="#1a0033" stroke-width="1.5"/>' +
        '<path d="M40 30 L40 82 M50 28 L50 84 M60 30 L60 82" stroke="#1a0033" stroke-width="1.5"/>' +
        '<circle cx="42" cy="48" r="4" fill="#fff" opacity="0.85"/>' +
        '<circle cx="60" cy="62" r="3.5" fill="#fff" opacity="0.7"/></g>' +
    '</svg>';

  const C = window.HocVuiCharacters;

  // DJ stage-character pool (picked at random each run).
  C.registerSpecies('dj-classic', { svg: makeDJ({ skin: '#ffcc80', shirt: '#e040fb', hairColor: '#311b4f', cup: '#00e5ff', discL: '#00e5ff', discR: '#ffeb3b', hair: 'short',
    mark: '<path d="M50 56 L46 64 L51 64 L47 71" stroke="#ffeb3b" stroke-width="2" fill="none"/>' }), classPrefix: 'dj-classic' });
  C.registerSpecies('dj-cool', { svg: makeDJ({ skin: '#ffe0b2', shirt: '#00bcd4', hairColor: '#1a0033', cup: '#ffeb3b', discL: '#e040fb', discR: '#00e5ff', hair: 'spiky',
    mark: '<circle cx="50" cy="62" r="5" fill="none" stroke="#1a0033" stroke-width="2"/>' }), classPrefix: 'dj-cool' });
  C.registerSpecies('dj-star', { svg: makeDJ({ skin: '#f5cba7', shirt: '#7b1fa2', hairColor: '#4a148c', cup: '#b388ff', discL: '#ffeb3b', discR: '#e040fb', hair: 'short',
    mark: '<path d="M50 58 L52 63 L57 63 L53 66 L55 71 L50 68 L45 71 L47 66 L43 63 L48 63 Z" fill="#ffeb3b"/>' }), classPrefix: 'dj-star' });
  C.registerSpecies('dj-funky', { svg: makeDJ({ skin: '#d7a86e', shirt: '#ffeb3b', hairColor: '#311b4f', cup: '#e040fb', discL: '#00e5ff', discR: '#7b1fa2', hair: 'afro',
    mark: '<circle cx="50" cy="62" r="4" fill="#e040fb"/>' }), classPrefix: 'dj-funky' });
  C.registerSpecies('dj-neon', { svg: makeDJ({ skin: '#ffcc80', shirt: '#00e5ff', hairColor: '#e040fb', cup: '#ffeb3b', discL: '#e040fb', discR: '#00e5ff', hair: 'beanie',
    mark: '<path d="M44 62 L56 62" stroke="#1a0033" stroke-width="2"/>' }), classPrefix: 'dj-neon' });
  C.registerSpecies('dj-retro', { svg: makeDJ({ skin: '#f5cba7', shirt: '#b388ff', hairColor: '#1a0033', cup: '#00bcd4', discL: '#ffeb3b', discR: '#e040fb', hair: 'cap',
    mark: '<path d="M46 58 L46 68 M50 58 L50 68 M54 58 L54 68" stroke="#1a0033" stroke-width="2"/>' }), classPrefix: 'dj-retro' });

  // Theme-track icons.
  C.registerSpecies('pop',   { svg: popStar,     classPrefix: 'trk-pop' });
  C.registerSpecies('rock',  { svg: rockGuitar,  classPrefix: 'trk-rock' });
  C.registerSpecies('hip',   { svg: hipMic,      classPrefix: 'trk-hip' });
  C.registerSpecies('edm',   { svg: edmEq,       classPrefix: 'trk-edm' });
  C.registerSpecies('funky', { svg: funkyDisco,  classPrefix: 'trk-funky' });
})();
