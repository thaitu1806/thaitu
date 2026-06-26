// Học Vui — V43 "Pizzeria Của Bé" sprite registry.
// Chibi CUSTOMER characters waiting for their pizza (ORIGINAL simple designs —
// hungry kids, animal patrons, a grandpa, etc.). Each species is an SVG
// (viewBox 0 0 100 100) with named <g>: .body, .head, .accent (plus .arms for
// the cheer/impatient animation). CSS in v43/style.css drives animation per
// state (idle / happy / scared).
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[pizza.js] character.js must load first');
    return;
  }

  const OUT = '#5c1f00';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  // Reusable bits ────────────────────────────────────────────────────────
  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.6" fill="' + OUT + '"/>';
  }
  function smile() {
    return '<path class="mouth" d="M44 49 Q50 55 56 49" stroke="' + OUT + '" stroke-width="2" fill="none" stroke-linecap="round"/>';
  }
  function openMouth() {
    // small hungry "o" mouth
    return '<ellipse class="mouth" cx="50" cy="50" rx="3.2" ry="3.8" fill="' + OUT + '"/>';
  }
  // Floating hunger marks (a fork & a small steam puff) — the idle "I'm hungry" accent.
  function hungerAccent() {
    return (
      '<g class="accent">' +
        '<g class="spark spark-1">' +
          '<path d="M76 18 L76 30" stroke="#ffd54a" stroke-width="2.4"/>' +
          '<path d="M72 18 L72 24 M76 18 L76 24 M80 18 L80 24" stroke="#ffd54a" stroke-width="2.2"/>' +
        '</g>' +
        '<path class="spark spark-2" d="M24 26 q-4 -4 0 -8 q4 -4 0 -8" stroke="#fff" stroke-width="2.2" fill="none" opacity="0.8"/>' +
      '</g>'
    );
  }

  // Arms used for cheering (happy) and impatient drumming (scared).
  function arms(sleeve, hand) {
    return (
      '<g class="arms">' +
        '<path class="arm arm-l" d="M36 60 Q26 64 27 73" stroke="' + sleeve + '" stroke-width="6" fill="none"/>' +
        '<path class="arm arm-r" d="M64 60 Q74 64 73 73" stroke="' + sleeve + '" stroke-width="6" fill="none"/>' +
        '<circle cx="27" cy="74" r="3.6" fill="' + hand + '"/>' +
        '<circle cx="73" cy="74" r="3.6" fill="' + hand + '"/>' +
      '</g>'
    );
  }

  // ── Human customer factory ──────────────────────────────────────────────
  // opts: { skin, shirt, hair, hairColor, cheek, mouth }
  function makeKid(o) {
    let hair;
    if (o.hair === 'bob') {
      hair = '<path d="M31 40 Q31 18 50 18 Q69 18 69 40 L69 30 Q50 24 31 30 Z" fill="' + o.hairColor + '"/>';
    } else if (o.hair === 'spiky') {
      hair = '<path d="M32 36 L37 23 L43 33 L50 20 L57 33 L63 23 L68 36 Q50 28 32 36 Z" fill="' + o.hairColor + '"/>';
    } else if (o.hair === 'bald') {
      hair = '<path d="M34 34 Q40 26 50 26 Q60 26 66 34 Q50 30 34 34 Z" fill="' + o.hairColor + '"/>';
    } else if (o.hair === 'bun') {
      hair = '<circle cx="50" cy="20" r="6" fill="' + o.hairColor + '"/>' +
             '<path d="M32 38 Q32 22 50 22 Q68 22 68 38 Q50 30 32 38 Z" fill="' + o.hairColor + '"/>';
    } else {
      hair = '<path d="M32 38 Q32 20 50 20 Q68 20 68 38 Q50 30 32 38 Z" fill="' + o.hairColor + '"/>';
    }
    const cheeks = o.cheek
      ? '<circle cx="38" cy="46" r="3.4" fill="' + o.cheek + '" opacity="0.6"/>' +
        '<circle cx="62" cy="46" r="3.4" fill="' + o.cheek + '" opacity="0.6"/>'
      : '';
    const beard = o.beard
      ? '<path d="M38 48 Q50 64 62 48 Q60 58 50 58 Q40 58 38 48 Z" fill="' + o.beard + '"/>'
      : '';
    const glasses = o.glasses
      ? '<circle cx="44" cy="42" r="6" fill="none" stroke="' + OUT + '" stroke-width="1.8"/>' +
        '<circle cx="56" cy="42" r="6" fill="none" stroke="' + OUT + '" stroke-width="1.8"/>' +
        '<path d="M50 42 L50 42 M38 41 L34 39 M62 41 L66 39" stroke="' + OUT + '" stroke-width="1.8"/>'
      : '';
    const mouthSvg = o.mouth === 'open' ? openMouth() : smile();
    return (
      '<svg viewBox="0 0 100 100" class="cust" ' + STROKE + ' aria-hidden="true">' +
        arms(o.shirt, o.skin) +
        '<g class="body">' +
          '<path d="M33 58 Q50 51 67 58 L70 86 L30 86 Z" fill="' + o.shirt + '"/>' +
          '<path d="M44 56 Q50 62 56 56 L56 60 Q50 65 44 60 Z" fill="' + o.skin + '"/>' +
        '</g>' +
        '<g class="head">' +
          '<circle cx="50" cy="42" r="17" fill="' + o.skin + '"/>' +
          hair + beard + cheeks +
          eye(43, 42) + eye(57, 42) + glasses + mouthSvg +
        '</g>' +
        hungerAccent() +
      '</svg>'
    );
  }

  // ── Animal customer factory ──────────────────────────────────────────────
  // opts: { fur, shirt, ear ('cat'|'round'), snout, nose, inner }
  function makeAnimal(o) {
    let ears;
    if (o.ear === 'cat') {
      ears = '<path d="M34 30 L30 16 L44 26 Z" fill="' + o.fur + '"/>' +
             '<path d="M66 30 L70 16 L56 26 Z" fill="' + o.fur + '"/>' +
             '<path d="M35 27 L33 20 L40 25 Z" fill="' + (o.inner || '#ffb3c1') + '"/>' +
             '<path d="M65 27 L67 20 L60 25 Z" fill="' + (o.inner || '#ffb3c1') + '"/>';
    } else {
      ears = '<circle cx="34" cy="28" r="9" fill="' + o.fur + '"/>' +
             '<circle cx="66" cy="28" r="9" fill="' + o.fur + '"/>' +
             '<circle cx="34" cy="28" r="4.5" fill="' + (o.inner || '#ffb3c1') + '"/>' +
             '<circle cx="66" cy="28" r="4.5" fill="' + (o.inner || '#ffb3c1') + '"/>';
    }
    const snout = o.snout
      ? '<ellipse cx="50" cy="50" rx="10" ry="8" fill="' + o.snout + '"/>'
      : '';
    return (
      '<svg viewBox="0 0 100 100" class="cust" ' + STROKE + ' aria-hidden="true">' +
        arms(o.shirt, o.fur) +
        '<g class="body">' +
          '<path d="M33 58 Q50 51 67 58 L70 86 L30 86 Z" fill="' + o.shirt + '"/>' +
        '</g>' +
        '<g class="head">' +
          ears +
          '<circle cx="50" cy="44" r="18" fill="' + o.fur + '"/>' +
          snout +
          eye(43, 42) + eye(57, 42) +
          '<ellipse class="nose" cx="50" cy="49" rx="3" ry="2.2" fill="' + (o.nose || OUT) + '"/>' +
          '<path class="mouth" d="M50 51 Q46 56 42 53 M50 51 Q54 56 58 53" stroke="' + OUT + '" stroke-width="1.8" fill="none"/>' +
        '</g>' +
        hungerAccent() +
      '</svg>'
    );
  }

  const C = window.HocVuiCharacters;

  // Customer pool — one is mounted at random per customer in the queue.
  C.registerSpecies('cust-kid', {
    svg: makeKid({ skin: '#ffd9b3', shirt: '#e8623a', hair: 'short', hairColor: '#3a2410', cheek: '#ff8a65', mouth: 'open' }),
    classPrefix: 'cust-kid',
  });
  C.registerSpecies('cust-girl', {
    svg: makeKid({ skin: '#ffe0bd', shirt: '#d6336c', hair: 'bob', hairColor: '#5c3a21', cheek: '#ff8fab', mouth: 'open' }),
    classPrefix: 'cust-girl',
  });
  C.registerSpecies('cust-grandpa', {
    svg: makeKid({ skin: '#f3c9a0', shirt: '#7a5230', hair: 'bald', hairColor: '#d9d2c5', cheek: '#e8a87c', beard: '#e6ddd0', glasses: true, mouth: 'smile' }),
    classPrefix: 'cust-grandpa',
  });
  C.registerSpecies('cust-cat', {
    svg: makeAnimal({ fur: '#f4a259', shirt: '#3a7d6e', ear: 'cat', snout: '#ffe0c2', nose: '#b5512e', inner: '#ffc9b3' }),
    classPrefix: 'cust-cat',
  });
  C.registerSpecies('cust-bear', {
    svg: makeAnimal({ fur: '#a9744f', shirt: '#f2b50a', ear: 'round', snout: '#e3c4a8', nose: '#3a2410', inner: '#c99' }),
    classPrefix: 'cust-bear',
  });
  C.registerSpecies('cust-bunny', {
    svg: makeAnimal({ fur: '#f0ece6', shirt: '#7b5ea7', ear: 'round', snout: '#ffffff', nose: '#e57fa0', inner: '#ffc4d6' }),
    classPrefix: 'cust-bunny',
  });
})();
