// Học Vui — V34 "Nhạc Sĩ Nhí" sprite registry.
// Chibi kid-musicians (violin / guitar / piano / singer) + a songbird and a
// musical-note mascot. Each species is an SVG (viewBox 0 0 100 100) with named
// <g>: .body, .head, .accent (and .instr / .arms where applicable).
// CSS in v34/style.css drives animation per state (idle / happy).
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[musicians.js] character.js must load first');
    return;
  }

  const OUT = '#2a0a4a';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  // Reusable bits ──────────────────────────────────────────────────────────
  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.6" fill="' + OUT + '"/>';
  }
  function smile() {
    return '<path class="mouth" d="M44 43 Q50 49 56 43" stroke="' + OUT + '" stroke-width="2" fill="none" stroke-linecap="round"/>';
  }
  function hairOf(kind, color) {
    if (kind === 'bun') {
      return '<circle cx="50" cy="15" r="6" fill="' + color + '" stroke="' + OUT + '" stroke-width="2"/>' +
        '<path d="M34 34 Q34 18 50 18 Q66 18 66 34 Q58 26 50 26 Q42 26 34 34 Z" fill="' + color + '" stroke="' + OUT + '" stroke-width="2"/>';
    }
    if (kind === 'curly') {
      return '<circle cx="38" cy="25" r="7" fill="' + color + '" stroke="' + OUT + '" stroke-width="2"/>' +
        '<circle cx="50" cy="21" r="8" fill="' + color + '" stroke="' + OUT + '" stroke-width="2"/>' +
        '<circle cx="62" cy="25" r="7" fill="' + color + '" stroke="' + OUT + '" stroke-width="2"/>';
    }
    if (kind === 'cap') {
      return '<path d="M34 33 Q50 14 66 33 Z" fill="' + color + '" stroke="' + OUT + '" stroke-width="2"/>' +
        '<path d="M30 33 L52 33 Q40 29 30 33 Z" fill="' + color + '" stroke="' + OUT + '" stroke-width="2"/>';
    }
    // short (default)
    return '<path d="M35 34 Q35 17 50 17 Q65 17 65 34 Q58 26 50 26 Q42 26 35 34 Z" fill="' + color + '" stroke="' + OUT + '" stroke-width="2"/>';
  }
  function noteAccent() {
    return (
      '<g class="note-accent">' +
        '<path d="M74 26 L74 12 L84 9 L84 22" stroke="#ffeb3b" stroke-width="2.5" fill="none"/>' +
        '<circle cx="72" cy="26" r="3" fill="#ffeb3b"/>' +
        '<circle cx="82" cy="22" r="3" fill="#ffeb3b"/>' +
      '</g>'
    );
  }

  // Instrument groups (drawn in front of the body) ──────────────────────────
  function instrumentOf(kind, accent) {
    if (kind === 'violin') {
      return (
        '<g class="instr">' +
          '<g class="arms"><path d="M40 60 L52 58 M62 60 L70 50" stroke="' + accent + '" stroke-width="5" fill="none"/></g>' +
          '<ellipse cx="60" cy="58" rx="9" ry="13" fill="#b5651d" transform="rotate(38 60 58)"/>' +
          '<path d="M66 49 L78 33" stroke="#5a3a18" stroke-width="4"/>' +
          '<path d="M34 70 L82 40" stroke="' + OUT + '" stroke-width="2"/>' +
        '</g>'
      );
    }
    if (kind === 'guitar') {
      return (
        '<g class="instr">' +
          '<g class="arms"><path d="M38 60 L48 64 M62 60 L70 56" stroke="' + accent + '" stroke-width="5" fill="none"/></g>' +
          '<ellipse cx="46" cy="68" rx="16" ry="13" fill="#e8a33d" transform="rotate(28 46 68)"/>' +
          '<circle cx="46" cy="68" r="5" fill="' + OUT + '"/>' +
          '<rect x="58" y="40" width="7" height="30" rx="2" fill="#7a4a1d" transform="rotate(28 61 55)"/>' +
        '</g>'
      );
    }
    if (kind === 'piano') {
      return (
        '<g class="instr">' +
          '<g class="arms"><path d="M40 60 L44 68 M60 60 L56 68" stroke="' + accent + '" stroke-width="5" fill="none"/></g>' +
          '<rect x="30" y="68" width="40" height="13" rx="3" fill="#f5f5f5"/>' +
          '<path d="M34 68 L34 81 M40 68 L40 81 M46 68 L46 81 M52 68 L52 81 M58 68 L58 81 M64 68 L64 81" stroke="' + OUT + '" stroke-width="1.5"/>' +
          '<rect x="36" y="68" width="3" height="8" fill="' + OUT + '"/>' +
          '<rect x="48" y="68" width="3" height="8" fill="' + OUT + '"/>' +
          '<rect x="60" y="68" width="3" height="8" fill="' + OUT + '"/>' +
        '</g>'
      );
    }
    // singer (microphone)
    return (
      '<g class="instr">' +
        '<g class="arms"><path d="M40 60 L52 56 M62 62 L66 72" stroke="' + accent + '" stroke-width="5" fill="none"/></g>' +
        '<rect x="48" y="44" width="7" height="20" rx="3" fill="#444" transform="rotate(-20 51 54)"/>' +
        '<circle cx="58" cy="36" r="9" fill="#00bcd4"/>' +
        '<path d="M51 32 L65 32 M50 36 L66 36 M51 40 L65 40" stroke="' + OUT + '" stroke-width="1.6"/>' +
      '</g>'
    );
  }

  // Main kid-musician factory ───────────────────────────────────────────────
  // o: { skin, shirt, hair, hairColor, instrument, accent }
  function makeMusician(o) {
    return (
      '<svg viewBox="0 0 100 100" class="musician" ' + STROKE + ' aria-hidden="true">' +
        '<g class="body">' +
          '<path d="M34 58 Q50 50 66 58 L70 82 L30 82 Z" fill="' + o.shirt + '"/>' +
        '</g>' +
        '<g class="head">' +
          '<circle cx="50" cy="38" r="14" fill="' + o.skin + '"/>' +
          hairOf(o.hair, o.hairColor) + eye(45, 39) + eye(55, 39) + smile() +
        '</g>' +
        instrumentOf(o.instrument, o.skin) +
        '<g class="accent">' + noteAccent() + '</g>' +
      '</svg>'
    );
  }

  // Songbird mascot — a cheerful singing bird ────────────────────────────────
  const songbird =
    '<svg viewBox="0 0 100 100" class="bird" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent"><path d="M70 28 L70 16 L80 13 L80 24" stroke="#ffeb3b" stroke-width="2.5" fill="none"/>' +
        '<circle cx="68" cy="28" r="2.6" fill="#ffeb3b"/></g>' +
      '<g class="body"><ellipse cx="48" cy="58" rx="26" ry="22" fill="#ffca28"/>' +
        '<path class="wing" d="M44 56 Q60 50 64 66 Q52 66 44 56 Z" fill="#ffa000"/>' +
        '<path d="M22 70 Q10 74 14 84 L26 76 Z" fill="#ffa000"/></g>' +
      '<g class="head"><circle cx="44" cy="40" r="15" fill="#ffd54f"/>' +
        '<path d="M30 40 L18 36 L30 32 Z" fill="#ff7043"/>' +
        eye(42, 38) + '<path class="mouth" d="M40 46 Q44 50 48 47" stroke="' + OUT + '" stroke-width="2" fill="none"/></g>' +
    '</svg>';

  // Musical-note mascot — a smiling eighth note ──────────────────────────────
  const noteMascot =
    '<svg viewBox="0 0 100 100" class="note" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent"><path d="M58 60 L58 22 L78 16 L78 30" stroke="' + OUT + '" stroke-width="3" fill="none"/>' +
        '<path d="M58 22 L78 16" stroke="' + OUT + '" stroke-width="3"/></g>' +
      '<g class="body"><ellipse cx="46" cy="64" rx="18" ry="14" fill="#e040fb" transform="rotate(-18 46 64)"/></g>' +
      '<g class="head">' + eye(40, 60) + eye(52, 62) +
        '<path class="mouth" d="M40 68 Q46 72 52 69" stroke="' + OUT + '" stroke-width="2" fill="none"/></g>' +
    '</svg>';

  const C = window.HocVuiCharacters;

  // Kid-musician pool (one picked at random per run).
  C.registerSpecies('violinist', { svg: makeMusician({ skin: '#ffcc80', shirt: '#e040fb', hair: 'short', hairColor: '#3a1d5c', instrument: 'violin', accent: '#ffcc80' }), classPrefix: 'musician' });
  C.registerSpecies('guitarist', { svg: makeMusician({ skin: '#f5cba7', shirt: '#7b1fa2', hair: 'cap', hairColor: '#1a0033', instrument: 'guitar', accent: '#f5cba7' }), classPrefix: 'musician' });
  C.registerSpecies('pianist', { svg: makeMusician({ skin: '#ffe0b2', shirt: '#00bcd4', hair: 'bun', hairColor: '#4a148c', instrument: 'piano', accent: '#ffe0b2' }), classPrefix: 'musician' });
  C.registerSpecies('singer', { svg: makeMusician({ skin: '#d7a86e', shirt: '#aa00ff', hair: 'curly', hairColor: '#2a0a4a', instrument: 'singer', accent: '#d7a86e' }), classPrefix: 'musician' });

  // Mascots.
  C.registerSpecies('songbird', { svg: songbird, classPrefix: 'bird' });
  C.registerSpecies('note-mascot', { svg: noteMascot, classPrefix: 'note' });
})();
