// Học Vui — V51 "Vườn Thú Pokémon Việt" sprite registry.
// Chibi animal creatures, one per SPECIES id in v51/game-logic.js
// (turtle, frog, cat, fox, panda, koala, dragon, unicorn).
// Each species is an SVG (viewBox 0 0 100 100) with named <g>: .body, .head, .accent.
// CSS in v51/style.css drives animation per state (idle / happy / scared).
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[creatures.js] character.js must load first');
    return;
  }

  const OUT = '#14361a'; // thin dark green-brown outline on the V51 green palette
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"';

  // Reusable bits ────────────────────────────────────────────────────────
  function eye(cx, cy, r) {
    r = r || 3;
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + OUT + '"/>' +
           '<circle class="eye-shine" cx="' + (cx + r * 0.4) + '" cy="' + (cy - r * 0.4) + '" r="' + (r * 0.35) + '" fill="#fff"/>';
  }
  function smile(d) {
    return '<path class="mouth" d="' + d + '" stroke="' + OUT + '" stroke-width="2" fill="none" stroke-linecap="round"/>';
  }
  function cheek(cx, cy) {
    return '<circle class="cheek" cx="' + cx + '" cy="' + cy + '" r="3.4" fill="#ff8a80" opacity="0.65"/>';
  }
  function svg(cls, inner) {
    return '<svg viewBox="0 0 100 100" class="' + cls + '" ' + STROKE + ' aria-hidden="true">' + inner + '</svg>';
  }

  // turtle — Rùa Vàng ───────────────────────────────────────────────────────
  const turtle = svg('cr cr-turtle',
    '<g class="accent">' +
      '<path d="M22 78 L17 86 M78 78 L83 86" stroke="' + OUT + '" stroke-width="4"/>' +
    '</g>' +
    '<g class="body">' +
      '<ellipse cx="50" cy="62" rx="30" ry="23" fill="#43a047"/>' +
      '<path d="M50 40 Q72 44 78 62 Q72 80 50 84 Q28 80 22 62 Q28 44 50 40 Z" fill="#ffca28"/>' +
      '<path d="M50 40 L50 84 M24 56 L76 56 M24 68 L76 68" stroke="#c69200" stroke-width="2" fill="none"/>' +
      '<path d="M37 47 L40 56 L33 65 M63 47 L60 56 L67 65" stroke="#c69200" stroke-width="2" fill="none"/>' +
    '</g>' +
    '<g class="head">' +
      '<circle cx="50" cy="30" r="14" fill="#66bb6a"/>' +
      eye(44, 29) + eye(56, 29) + smile('M45 36 Q50 40 55 36') + cheek(38, 33) + cheek(62, 33) +
    '</g>'
  );

  // frog — Ếch Cốm ──────────────────────────────────────────────────────────
  const frog = svg('cr cr-frog',
    '<g class="accent">' +
      '<path d="M26 80 L18 88 M74 80 L82 88" stroke="' + OUT + '" stroke-width="4"/>' +
    '</g>' +
    '<g class="body">' +
      '<ellipse cx="50" cy="64" rx="28" ry="22" fill="#9ccc65"/>' +
      '<path d="M38 60 Q50 72 62 60" stroke="#558b2f" stroke-width="2" fill="none"/>' +
    '</g>' +
    '<g class="head">' +
      '<ellipse cx="50" cy="40" rx="26" ry="20" fill="#aed581"/>' +
      '<circle cx="37" cy="26" r="9" fill="#aed581"/>' +
      '<circle cx="63" cy="26" r="9" fill="#aed581"/>' +
      eye(37, 25, 4) + eye(63, 25, 4) + smile('M38 46 Q50 54 62 46') + cheek(34, 42) + cheek(66, 42) +
    '</g>'
  );

  // cat — Miu Mèo ───────────────────────────────────────────────────────────
  const cat = svg('cr cr-cat',
    '<g class="body">' +
      '<ellipse cx="50" cy="68" rx="24" ry="18" fill="#a5d6a7"/>' +
      '<path d="M70 70 Q84 64 80 50" stroke="' + OUT + '" stroke-width="4" fill="none"/>' +
    '</g>' +
    '<g class="head">' +
      '<path d="M32 30 L30 14 L44 24 Z" fill="#81c784"/>' +
      '<path d="M68 30 L70 14 L56 24 Z" fill="#81c784"/>' +
      '<circle cx="50" cy="40" r="22" fill="#a5d6a7"/>' +
      eye(42, 38) + eye(58, 38) +
      '<path d="M50 44 L47 47 L53 47 Z" fill="' + OUT + '"/>' +
      smile('M50 47 Q44 52 40 48 M50 47 Q56 52 60 48') +
      '<path d="M22 40 L34 42 M22 46 L34 46 M78 40 L66 42 M78 46 L66 46" stroke="' + OUT + '" stroke-width="1.5"/>' +
      cheek(35, 44) + cheek(65, 44) +
    '</g>'
  );

  // fox — Cáo Lửa ───────────────────────────────────────────────────────────
  const fox = svg('cr cr-fox',
    '<g class="accent">' +
      '<path d="M68 70 Q88 66 86 46 Q78 52 72 60 Z" fill="#ff7043"/>' +
      '<path d="M84 48 Q88 56 84 62" stroke="#fff3e0" stroke-width="4" fill="none"/>' +
    '</g>' +
    '<g class="body">' +
      '<ellipse cx="48" cy="68" rx="22" ry="17" fill="#ff8a65"/>' +
    '</g>' +
    '<g class="head">' +
      '<path d="M30 28 L26 10 L44 22 Z" fill="#ff7043"/>' +
      '<path d="M70 28 L74 10 L56 22 Z" fill="#ff7043"/>' +
      '<circle cx="50" cy="40" r="22" fill="#ff8a65"/>' +
      '<path d="M50 36 Q34 40 36 56 Q50 62 64 56 Q66 40 50 36 Z" fill="#fff3e0"/>' +
      eye(42, 38) + eye(58, 38) +
      '<path d="M50 48 L47 51 L53 51 Z" fill="' + OUT + '"/>' +
      smile('M50 51 Q46 55 43 52 M50 51 Q54 55 57 52') + cheek(34, 46) + cheek(66, 46) +
    '</g>'
  );

  // panda — Gấu Trúc ────────────────────────────────────────────────────────
  const panda = svg('cr cr-panda',
    '<g class="body">' +
      '<ellipse cx="50" cy="68" rx="24" ry="18" fill="#fafafa"/>' +
      '<path d="M30 64 Q24 74 30 84" stroke="' + OUT + '" stroke-width="6" fill="none"/>' +
      '<path d="M70 64 Q76 74 70 84" stroke="' + OUT + '" stroke-width="6" fill="none"/>' +
    '</g>' +
    '<g class="head">' +
      '<circle cx="33" cy="24" r="9" fill="#2e2e2e"/>' +
      '<circle cx="67" cy="24" r="9" fill="#2e2e2e"/>' +
      '<circle cx="50" cy="40" r="22" fill="#fafafa"/>' +
      '<ellipse cx="41" cy="40" rx="6.5" ry="8" fill="#2e2e2e" transform="rotate(-18 41 40)"/>' +
      '<ellipse cx="59" cy="40" rx="6.5" ry="8" fill="#2e2e2e" transform="rotate(18 59 40)"/>' +
      eye(41, 40, 2.6) + eye(59, 40, 2.6) +
      '<circle cx="50" cy="48" r="2.6" fill="' + OUT + '"/>' +
      smile('M50 50 Q45 55 41 52 M50 50 Q55 55 59 52') +
    '</g>'
  );

  // koala — Koala ───────────────────────────────────────────────────────────
  const koala = svg('cr cr-koala',
    '<g class="body">' +
      '<ellipse cx="50" cy="70" rx="22" ry="16" fill="#b0bec5"/>' +
    '</g>' +
    '<g class="accent">' +
      '<circle cx="26" cy="34" r="13" fill="#b0bec5"/>' +
      '<circle cx="74" cy="34" r="13" fill="#b0bec5"/>' +
      '<circle cx="26" cy="34" r="7" fill="#cfd8dc"/>' +
      '<circle cx="74" cy="34" r="7" fill="#cfd8dc"/>' +
    '</g>' +
    '<g class="head">' +
      '<circle cx="50" cy="42" r="21" fill="#cfd8dc"/>' +
      eye(43, 41) + eye(57, 41) +
      '<ellipse cx="50" cy="51" rx="6" ry="7.5" fill="#37474f"/>' +
      smile('M44 58 Q50 62 56 58') + cheek(36, 47) + cheek(64, 47) +
    '</g>'
  );

  // dragon — Long Tinh ──────────────────────────────────────────────────────
  const dragon = svg('cr cr-dragon',
    '<g class="accent">' +
      '<path d="M40 22 L36 10 L46 18 Z" fill="#ffca28"/>' +
      '<path d="M60 22 L64 10 L54 18 Z" fill="#ffca28"/>' +
      '<path d="M72 66 Q90 62 88 46 Q80 54 74 60 Z" fill="#66bb6a"/>' +
    '</g>' +
    '<g class="body">' +
      '<ellipse cx="48" cy="68" rx="22" ry="17" fill="#26a69a"/>' +
      '<path d="M40 58 L44 52 L48 58 L52 52 L56 58" stroke="#ffca28" stroke-width="2" fill="none"/>' +
    '</g>' +
    '<g class="head">' +
      '<circle cx="50" cy="40" r="22" fill="#4db6ac"/>' +
      '<ellipse cx="50" cy="50" rx="13" ry="9" fill="#80cbc4"/>' +
      eye(42, 36) + eye(58, 36) +
      '<circle cx="45" cy="51" r="1.8" fill="' + OUT + '"/>' +
      '<circle cx="55" cy="51" r="1.8" fill="' + OUT + '"/>' +
      smile('M44 55 Q50 59 56 55') + cheek(35, 44) + cheek(65, 44) +
    '</g>'
  );

  // unicorn — Kỳ Lân ────────────────────────────────────────────────────────
  const unicorn = svg('cr cr-unicorn',
    '<g class="accent">' +
      '<path d="M50 20 L46 4 L54 4 Z" fill="#ffd54f"/>' +
      '<path d="M46 4 L54 4 M47 9 L53 9 M48 14 L52 14" stroke="#f9a825" stroke-width="1.5"/>' +
      '<path d="M36 26 Q22 22 18 34 Q28 34 34 40 Z" fill="#ce93d8"/>' +
      '<path d="M64 26 Q78 22 82 34 Q72 34 66 40 Z" fill="#f48fb1"/>' +
    '</g>' +
    '<g class="body">' +
      '<ellipse cx="50" cy="70" rx="22" ry="16" fill="#f3e5f5"/>' +
    '</g>' +
    '<g class="head">' +
      '<circle cx="50" cy="42" r="22" fill="#fce4ec"/>' +
      '<path d="M34 30 L30 26 M66 30 L70 26" stroke="' + OUT + '" stroke-width="2"/>' +
      eye(43, 42) + eye(57, 42) +
      '<path d="M48 50 L47 52 L53 52 L52 50" fill="#ce93d8"/>' +
      smile('M44 56 Q50 60 56 56') + cheek(36, 48) + cheek(64, 48) +
    '</g>'
  );

  const C = window.HocVuiCharacters;
  C.registerSpecies('turtle',  { svg: turtle,  classPrefix: 'cr-turtle' });
  C.registerSpecies('frog',    { svg: frog,    classPrefix: 'cr-frog' });
  C.registerSpecies('cat',     { svg: cat,     classPrefix: 'cr-cat' });
  C.registerSpecies('fox',     { svg: fox,     classPrefix: 'cr-fox' });
  C.registerSpecies('panda',   { svg: panda,   classPrefix: 'cr-panda' });
  C.registerSpecies('koala',   { svg: koala,   classPrefix: 'cr-koala' });
  C.registerSpecies('dragon',  { svg: dragon,  classPrefix: 'cr-dragon' });
  C.registerSpecies('unicorn', { svg: unicorn, classPrefix: 'cr-unicorn' });
})();
