// Học Vui — V48 dinosaur sprite registry.
// Each species is a chibi SVG (viewBox 0 0 100 100) with named <g>:
//   .body, .head, .tail (where applicable), .eye, .accent
// CSS in v48/style.css drives animation per state.
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[dinosaurs.js] character.js must load first');
    return;
  }

  const STROKE = 'stroke="#3e2723" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" fill-rule="evenodd"';
  const EYE_WHITE = '#fff';
  const PUPIL = '#3e2723';

  // Reusable bits ──────────────────────────────────────────────────────────
  function eye(cx, cy, r) {
    return (
      '<g class="eye">' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + EYE_WHITE + '" stroke="#3e2723" stroke-width="1.5"/>' +
        '<circle class="pupil" cx="' + cx + '" cy="' + (cy + 0.5) + '" r="' + (r * 0.55) + '" fill="' + PUPIL + '"/>' +
      '</g>'
    );
  }
  function blush(cx, cy) {
    return '<circle class="blush" cx="' + cx + '" cy="' + cy + '" r="3" fill="#ff8a80" opacity="0.6"/>';
  }
  function smile(d) {
    return '<path class="mouth" d="' + d + '" stroke="#3e2723" stroke-width="2" fill="none" stroke-linecap="round"/>';
  }

  // T-Rex ──────────────────────────────────────────────────────────────────
  const trex =
    '<svg viewBox="0 0 100 100" class="dino dino-trex" ' + STROKE + ' aria-hidden="true">' +
      '<g class="tail"><path d="M22 70 Q8 60 14 78 Q22 76 30 72 Z" fill="#ff7043"/></g>' +
      '<g class="legs">' +
        '<rect x="42" y="76" width="8" height="16" rx="3" fill="#e64a19"/>' +
        '<rect x="56" y="76" width="8" height="16" rx="3" fill="#e64a19"/>' +
      '</g>' +
      '<g class="body"><path d="M28 70 Q26 50 48 44 L72 44 Q88 50 84 72 Q70 86 50 84 Q34 84 28 70 Z" fill="#ff7043"/></g>' +
      '<g class="arms"><path d="M60 60 L58 70" stroke="#3e2723" stroke-width="2" fill="none"/></g>' +
      '<g class="head"><path d="M62 26 Q90 24 92 50 Q92 58 84 60 L66 60 Q56 56 56 44 Z" fill="#ff7043"/>' +
        '<path d="M82 50 L88 50 L86 54 Z M76 50 L82 50 L80 54 Z" fill="#fff" stroke="#3e2723" stroke-width="1"/>' +
        eye(76, 38, 5) +
      '</g>' +
      '<g class="accent"><path d="M30 56 L34 50 L38 56 L42 50 L46 56" stroke="#bf360c" stroke-width="2" fill="none"/></g>' +
    '</svg>';

  // Brachiosaurus — long neck ──────────────────────────────────────────────
  const brachio =
    '<svg viewBox="0 0 100 100" class="dino dino-brachio" ' + STROKE + ' aria-hidden="true">' +
      '<g class="tail"><path d="M20 72 Q6 70 12 82 Q22 80 32 76 Z" fill="#8d6e63"/></g>' +
      '<g class="legs">' +
        '<rect x="36" y="76" width="8" height="16" rx="3" fill="#6d4c41"/>' +
        '<rect x="52" y="76" width="8" height="16" rx="3" fill="#6d4c41"/>' +
        '<rect x="64" y="76" width="8" height="16" rx="3" fill="#6d4c41"/>' +
      '</g>' +
      '<g class="body"><ellipse cx="50" cy="68" rx="30" ry="16" fill="#8d6e63"/></g>' +
      '<g class="neck"><path d="M64 64 Q80 50 78 30 Q78 22 86 22" stroke="#8d6e63" stroke-width="14" fill="none" stroke-linecap="round"/></g>' +
      '<g class="head"><ellipse cx="86" cy="22" rx="9" ry="7" fill="#8d6e63"/>' +
        eye(88, 20, 3) +
      '</g>' +
      '<g class="accent">' +
        '<circle cx="36" cy="62" r="3" fill="#a1887f"/>' +
        '<circle cx="48" cy="58" r="3" fill="#a1887f"/>' +
        '<circle cx="60" cy="62" r="3" fill="#a1887f"/>' +
      '</g>' +
    '</svg>';

  // Dragon (Long) ──────────────────────────────────────────────────────────
  const dragon =
    '<svg viewBox="0 0 100 100" class="dino dino-dragon" ' + STROKE + ' aria-hidden="true">' +
      '<g class="tail"><path d="M14 74 Q4 64 10 56 Q20 64 26 72 Z" fill="#43a047"/></g>' +
      '<g class="wing"><path d="M40 46 Q30 26 56 30 Q52 44 46 50 Z" fill="#66bb6a" opacity="0.9"/></g>' +
      '<g class="legs">' +
        '<rect x="38" y="74" width="8" height="16" rx="3" fill="#2e7d32"/>' +
        '<rect x="56" y="74" width="8" height="16" rx="3" fill="#2e7d32"/>' +
      '</g>' +
      '<g class="body"><ellipse cx="50" cy="64" rx="26" ry="18" fill="#43a047"/></g>' +
      '<g class="head"><ellipse cx="72" cy="38" rx="14" ry="12" fill="#43a047"/>' +
        '<path d="M82 32 L92 28 L86 36 Z" fill="#ffd54f" stroke="#3e2723" stroke-width="1"/>' +
        eye(74, 34, 4) +
        '<path d="M64 30 L60 22 M70 26 L68 18" stroke="#3e2723" stroke-width="2"/>' +
      '</g>' +
      '<g class="accent"><path d="M30 52 L36 46 L42 52 L48 46 L54 52" stroke="#1b5e20" stroke-width="2" fill="none"/></g>' +
    '</svg>';

  // Raptor ─────────────────────────────────────────────────────────────────
  const raptor =
    '<svg viewBox="0 0 100 100" class="dino dino-raptor" ' + STROKE + ' aria-hidden="true">' +
      '<g class="tail"><path d="M16 72 Q4 56 12 50 Q22 60 28 70 Z" fill="#558b2f"/></g>' +
      '<g class="legs">' +
        '<path d="M40 76 L36 92 L44 92 L44 78 Z" fill="#33691e"/>' +
        '<path d="M58 76 L54 92 L62 92 L62 78 Z" fill="#33691e"/>' +
      '</g>' +
      '<g class="body"><path d="M26 70 Q30 50 48 46 L66 46 Q80 50 78 70 Q68 82 52 82 Q34 82 26 70 Z" fill="#7cb342"/></g>' +
      '<g class="head"><path d="M64 36 Q88 38 88 56 L66 58 Q58 54 58 44 Z" fill="#7cb342"/>' +
        '<path d="M80 50 L86 50 L84 54 Z M74 50 L80 50 L78 54 Z" fill="#fff" stroke="#3e2723" stroke-width="1"/>' +
        eye(74, 46, 4) +
      '</g>' +
      '<g class="accent"><path d="M26 60 L30 54 L34 60 L38 54 L42 60" stroke="#33691e" stroke-width="2" fill="none"/></g>' +
    '</svg>';

  // Dino egg ───────────────────────────────────────────────────────────────
  const egg =
    '<svg viewBox="0 0 100 100" class="dino dino-egg" ' + STROKE + ' aria-hidden="true">' +
      '<g class="body"><path d="M50 14 Q22 24 22 64 Q22 90 50 90 Q78 90 78 64 Q78 24 50 14 Z" fill="#fdd835"/></g>' +
      '<g class="accent">' +
        '<path d="M28 50 Q40 56 32 64 Q44 66 36 76" stroke="#bf6a00" stroke-width="2.5" fill="none"/>' +
        '<circle cx="58" cy="36" r="3" fill="#bf6a00"/>' +
        '<circle cx="64" cy="60" r="3.5" fill="#bf6a00"/>' +
        '<circle cx="46" cy="76" r="3" fill="#bf6a00"/>' +
      '</g>' +
      '<g class="head">' +
        eye(42, 52, 4) +
        eye(58, 52, 4) +
        smile('M42 64 Q50 70 58 64') +
        blush(34, 64) +
        blush(66, 64) +
      '</g>' +
    '</svg>';

  // Crocodile ──────────────────────────────────────────────────────────────
  const croco =
    '<svg viewBox="0 0 100 100" class="dino dino-croco" ' + STROKE + ' aria-hidden="true">' +
      '<g class="tail"><path d="M14 72 Q2 70 8 80 Q18 78 26 74 Z" fill="#558b2f"/></g>' +
      '<g class="legs">' +
        '<rect x="30" y="74" width="6" height="14" rx="2" fill="#33691e"/>' +
        '<rect x="46" y="74" width="6" height="14" rx="2" fill="#33691e"/>' +
        '<rect x="60" y="74" width="6" height="14" rx="2" fill="#33691e"/>' +
      '</g>' +
      '<g class="body"><path d="M18 64 Q22 56 50 56 L82 60 Q92 64 88 74 Q60 80 30 78 Q18 76 18 64 Z" fill="#558b2f"/></g>' +
      '<g class="head"><path d="M58 52 L94 56 L94 64 L58 66 Z" fill="#558b2f"/>' +
        '<path d="M62 58 L66 62 M70 58 L74 62 M78 58 L82 62 M86 58 L90 62" stroke="#fff" stroke-width="1.5"/>' +
        eye(64, 50, 4) +
      '</g>' +
      '<g class="accent">' +
        '<path d="M24 58 L26 50 L30 58 L34 50 L38 58 L42 50 L46 58" stroke="#33691e" stroke-width="2" fill="none"/>' +
      '</g>' +
    '</svg>';

  // Sea serpent / coiled dragon ────────────────────────────────────────────
  const serpent =
    '<svg viewBox="0 0 100 100" class="dino dino-serpent" ' + STROKE + ' aria-hidden="true">' +
      '<g class="body">' +
        '<path d="M14 76 Q24 60 40 70 Q56 80 70 70 Q86 56 86 40" stroke="#1565c0" stroke-width="16" fill="none" stroke-linecap="round"/>' +
        '<path d="M14 76 Q24 60 40 70 Q56 80 70 70 Q86 56 86 40" stroke="#42a5f5" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.7"/>' +
      '</g>' +
      '<g class="head"><circle cx="86" cy="30" r="12" fill="#1565c0"/>' +
        '<path d="M82 18 L78 10 M90 18 L94 10" stroke="#3e2723" stroke-width="2"/>' +
        eye(88, 28, 4) +
      '</g>' +
      '<g class="accent">' +
        '<circle cx="26" cy="72" r="3" fill="#90caf9"/>' +
        '<circle cx="46" cy="76" r="3" fill="#90caf9"/>' +
        '<circle cx="68" cy="74" r="3" fill="#90caf9"/>' +
      '</g>' +
    '</svg>';

  // Stegosaurus ────────────────────────────────────────────────────────────
  const stego =
    '<svg viewBox="0 0 100 100" class="dino dino-stego" ' + STROKE + ' aria-hidden="true">' +
      '<g class="tail"><path d="M16 72 Q4 64 10 56 Q22 64 28 70 Z" fill="#a1887f"/></g>' +
      '<g class="legs">' +
        '<rect x="34" y="74" width="8" height="16" rx="3" fill="#6d4c41"/>' +
        '<rect x="58" y="74" width="8" height="16" rx="3" fill="#6d4c41"/>' +
      '</g>' +
      '<g class="body"><ellipse cx="50" cy="68" rx="28" ry="14" fill="#a1887f"/></g>' +
      '<g class="head"><ellipse cx="78" cy="64" rx="14" ry="10" fill="#a1887f"/>' +
        eye(82, 62, 3.5) +
      '</g>' +
      '<g class="accent plates">' +
        '<path d="M28 56 L34 42 L40 56 Z" fill="#c5cae9" stroke="#3e2723" stroke-width="1.5"/>' +
        '<path d="M40 52 L48 36 L56 52 Z" fill="#9fa8da" stroke="#3e2723" stroke-width="1.5"/>' +
        '<path d="M56 52 L64 38 L72 52 Z" fill="#c5cae9" stroke="#3e2723" stroke-width="1.5"/>' +
      '</g>' +
    '</svg>';

  // Pterodactyl — winged flyer ────────────────────────────────────────────
  const pterodactyl =
    '<svg viewBox="0 0 100 100" class="dino dino-pterodactyl" ' + STROKE + ' aria-hidden="true">' +
      '<g class="wing">' +
        '<path d="M14 60 Q22 38 50 50 L50 64 Q30 70 14 60 Z" fill="#90a4ae"/>' +
        '<path d="M86 60 Q78 38 50 50 L50 64 Q70 70 86 60 Z" fill="#90a4ae"/>' +
      '</g>' +
      '<g class="body"><ellipse cx="50" cy="60" rx="10" ry="14" fill="#607d8b"/></g>' +
      '<g class="head"><ellipse cx="50" cy="40" rx="10" ry="9" fill="#607d8b"/>' +
        '<path d="M58 40 L78 36 L60 46 Z" fill="#ffd54f" stroke="#3e2723" stroke-width="1.5"/>' +
        '<path d="M48 38 L36 30 L48 42 Z" fill="#90a4ae" stroke="#3e2723" stroke-width="1"/>' +
        eye(50, 38, 3.5) +
      '</g>' +
      '<g class="legs">' +
        '<path d="M46 72 L42 86" stroke="#3e2723" stroke-width="2"/>' +
        '<path d="M54 72 L58 86" stroke="#3e2723" stroke-width="2"/>' +
      '</g>' +
    '</svg>';

  // Ankylosaurus — armored club tail ───────────────────────────────────────
  const ankylo =
    '<svg viewBox="0 0 100 100" class="dino dino-ankylo" ' + STROKE + ' aria-hidden="true">' +
      '<g class="tail"><path d="M16 72 L4 70 L4 80 L16 78 Z" fill="#6d4c41"/>' +
        '<circle cx="4" cy="75" r="6" fill="#5d4037"/>' +
      '</g>' +
      '<g class="legs">' +
        '<rect x="34" y="76" width="7" height="14" rx="2" fill="#4e342e"/>' +
        '<rect x="56" y="76" width="7" height="14" rx="2" fill="#4e342e"/>' +
      '</g>' +
      '<g class="body"><path d="M22 70 Q26 52 50 50 L70 50 Q86 54 84 72 Q60 82 36 80 Q22 78 22 70 Z" fill="#795548"/></g>' +
      '<g class="accent plates">' +
        '<path d="M30 56 L34 48 L38 56 Z" fill="#a1887f"/>' +
        '<path d="M42 52 L48 42 L54 52 Z" fill="#a1887f"/>' +
        '<path d="M58 52 L64 42 L70 52 Z" fill="#a1887f"/>' +
        '<path d="M74 56 L78 48 L82 56 Z" fill="#a1887f"/>' +
      '</g>' +
      '<g class="head"><ellipse cx="80" cy="62" rx="10" ry="8" fill="#795548"/>' +
        eye(84, 60, 3) +
      '</g>' +
    '</svg>';

  // Triceratops — 3 horns + frill ──────────────────────────────────────────
  const triceratops =
    '<svg viewBox="0 0 100 100" class="dino dino-triceratops" ' + STROKE + ' aria-hidden="true">' +
      '<g class="tail"><path d="M16 72 Q6 66 12 80 Q22 76 28 74 Z" fill="#558b2f"/></g>' +
      '<g class="legs">' +
        '<rect x="34" y="76" width="8" height="14" rx="2.5" fill="#33691e"/>' +
        '<rect x="56" y="76" width="8" height="14" rx="2.5" fill="#33691e"/>' +
      '</g>' +
      '<g class="body"><ellipse cx="48" cy="66" rx="26" ry="14" fill="#7cb342"/></g>' +
      '<g class="head"><path d="M62 64 Q76 50 92 56 Q92 76 76 78 Q64 76 60 70 Z" fill="#7cb342"/>' +
        '<path d="M76 56 Q86 46 92 50" fill="none" stroke="#fff8e1" stroke-width="3"/>' +
        '<path d="M78 48 L80 36 L84 48 Z" fill="#fff8e1" stroke="#3e2723" stroke-width="1.5"/>' +
        '<path d="M72 50 L66 38 L72 50 Z" fill="#fff8e1" stroke="#3e2723" stroke-width="1.5"/>' +
        '<path d="M82 60 L86 56 L88 62 Z" fill="#fff8e1" stroke="#3e2723" stroke-width="1.5"/>' +
        eye(76, 64, 3.5) +
      '</g>' +
    '</svg>';

  // Spinosaurus — sail-back ────────────────────────────────────────────────
  const spinosaurus =
    '<svg viewBox="0 0 100 100" class="dino dino-spinosaurus" ' + STROKE + ' aria-hidden="true">' +
      '<g class="tail"><path d="M14 70 Q4 68 10 78 Q22 76 30 72 Z" fill="#0277bd"/></g>' +
      '<g class="accent">' +
        '<path d="M28 64 Q46 30 70 64 Z" fill="#01579b"/>' +
        '<path d="M34 56 L34 36 M44 50 L44 30 M54 48 L54 30 M64 52 L64 36" stroke="#80deea" stroke-width="1.5" fill="none"/>' +
      '</g>' +
      '<g class="legs">' +
        '<rect x="36" y="76" width="8" height="14" rx="2.5" fill="#01579b"/>' +
        '<rect x="56" y="76" width="8" height="14" rx="2.5" fill="#01579b"/>' +
      '</g>' +
      '<g class="body"><path d="M28 70 Q26 56 50 54 L70 54 Q84 58 82 72 Q66 82 50 82 Q34 82 28 70 Z" fill="#0277bd"/></g>' +
      '<g class="head"><path d="M68 50 Q88 52 92 64 L70 66 Q62 62 62 56 Z" fill="#0277bd"/>' +
        '<path d="M82 60 L88 60 L86 64 Z M76 60 L82 60 L80 64 Z" fill="#fff" stroke="#3e2723" stroke-width="1"/>' +
        eye(74, 56, 3.5) +
      '</g>' +
    '</svg>';

  // Mosasaur — sea creature ────────────────────────────────────────────────
  const mosasaur =
    '<svg viewBox="0 0 100 100" class="dino dino-mosasaur" ' + STROKE + ' aria-hidden="true">' +
      '<g class="tail"><path d="M10 60 Q2 50 4 70 Q14 66 22 62 Z" fill="#1565c0"/>' +
        '<path d="M4 60 L2 50 L8 56 Z" fill="#1976d2"/>' +
        '<path d="M4 60 L2 70 L8 64 Z" fill="#1976d2"/>' +
      '</g>' +
      '<g class="body"><path d="M18 60 Q28 44 60 46 L80 50 Q92 56 88 66 Q60 76 30 72 Q18 70 18 60 Z" fill="#1976d2"/></g>' +
      '<g class="accent">' +
        '<path d="M50 46 Q54 36 60 46" stroke="#42a5f5" stroke-width="3" fill="none"/>' +
        '<circle cx="36" cy="58" r="3" fill="#bbdefb"/>' +
        '<circle cx="56" cy="62" r="3" fill="#bbdefb"/>' +
      '</g>' +
      '<g class="head"><path d="M72 52 L94 56 L94 68 L72 68 Z" fill="#1976d2"/>' +
        '<path d="M76 60 L80 64 M84 60 L88 64" stroke="#fff" stroke-width="1.5"/>' +
        eye(78, 58, 3.5) +
      '</g>' +
    '</svg>';

  // Parasaurolophus — crested head ─────────────────────────────────────────
  const paraloph =
    '<svg viewBox="0 0 100 100" class="dino dino-paraloph" ' + STROKE + ' aria-hidden="true">' +
      '<g class="tail"><path d="M16 72 Q4 64 10 56 Q22 64 28 70 Z" fill="#ec407a"/></g>' +
      '<g class="legs">' +
        '<rect x="36" y="76" width="8" height="14" rx="2.5" fill="#ad1457"/>' +
        '<rect x="56" y="76" width="8" height="14" rx="2.5" fill="#ad1457"/>' +
      '</g>' +
      '<g class="body"><path d="M28 70 Q28 54 50 52 L66 52 Q82 56 80 72 Q66 82 50 82 Q34 82 28 70 Z" fill="#ec407a"/></g>' +
      '<g class="head"><ellipse cx="74" cy="42" rx="11" ry="9" fill="#ec407a"/>' +
        '<path d="M78 36 Q86 18 70 14 Q66 28 72 38 Z" fill="#f06292" stroke="#3e2723" stroke-width="2"/>' +
        eye(78, 40, 3.5) +
      '</g>' +
      '<g class="neck"><path d="M64 56 L70 46" stroke="#ec407a" stroke-width="10" fill="none" stroke-linecap="round"/></g>' +
    '</svg>';

  // Baby dino — chibi hatchling with shell remnants ────────────────────────
  const baby =
    '<svg viewBox="0 0 100 100" class="dino dino-baby" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent shell">' +
        '<path d="M22 30 L30 38 L24 46" stroke="#fff8e1" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<path d="M78 30 L70 38 L76 46" stroke="#fff8e1" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '</g>' +
      '<g class="body"><ellipse cx="50" cy="62" rx="22" ry="20" fill="#aed581"/></g>' +
      '<g class="legs">' +
        '<ellipse cx="38" cy="84" rx="6" ry="4" fill="#7cb342"/>' +
        '<ellipse cx="62" cy="84" rx="6" ry="4" fill="#7cb342"/>' +
      '</g>' +
      '<g class="head">' +
        eye(42, 56, 4.5) +
        eye(58, 56, 4.5) +
        smile('M42 70 Q50 76 58 70') +
        blush(32, 68) +
        blush(68, 68) +
        '<path d="M48 44 L50 38 L52 44 Z" fill="#aed581" stroke="#3e2723" stroke-width="1.5"/>' +
      '</g>' +
    '</svg>';

  // Compy — tiny scampering carnivore ──────────────────────────────────────
  const compy =
    '<svg viewBox="0 0 100 100" class="dino dino-compy" ' + STROKE + ' aria-hidden="true">' +
      '<g class="tail"><path d="M18 70 Q2 64 6 56 Q18 64 26 68 Z" fill="#ffb74d"/></g>' +
      '<g class="legs">' +
        '<path d="M40 76 L36 92 L44 92 L44 78 Z" fill="#fb8c00"/>' +
        '<path d="M58 76 L54 92 L62 92 L62 78 Z" fill="#fb8c00"/>' +
      '</g>' +
      '<g class="body"><ellipse cx="50" cy="68" rx="18" ry="14" fill="#ffb74d"/></g>' +
      '<g class="head"><ellipse cx="68" cy="48" rx="14" ry="11" fill="#ffb74d"/>' +
        '<path d="M78 52 L84 52 L82 56 Z M72 52 L78 52 L76 56 Z" fill="#fff" stroke="#3e2723" stroke-width="1"/>' +
        eye(70, 46, 4) +
      '</g>' +
      '<g class="neck"><path d="M58 60 L64 52" stroke="#ffb74d" stroke-width="9" fill="none" stroke-linecap="round"/></g>' +
      '<g class="accent">' +
        '<path d="M40 60 L42 54 L44 60 L46 54 L48 60" stroke="#e65100" stroke-width="1.5" fill="none"/>' +
      '</g>' +
    '</svg>';

  const C = window.HocVuiCharacters;
  C.registerSpecies('trex',         { svg: trex,         classPrefix: 'dino-trex' });
  C.registerSpecies('brachio',      { svg: brachio,      classPrefix: 'dino-brachio' });
  C.registerSpecies('dragon',       { svg: dragon,       classPrefix: 'dino-dragon' });
  C.registerSpecies('raptor',       { svg: raptor,       classPrefix: 'dino-raptor' });
  C.registerSpecies('egg',          { svg: egg,          classPrefix: 'dino-egg' });
  C.registerSpecies('croco',        { svg: croco,        classPrefix: 'dino-croco' });
  C.registerSpecies('serpent',      { svg: serpent,      classPrefix: 'dino-serpent' });
  C.registerSpecies('stego',        { svg: stego,        classPrefix: 'dino-stego' });
  C.registerSpecies('pterodactyl',  { svg: pterodactyl,  classPrefix: 'dino-pterodactyl' });
  C.registerSpecies('ankylo',       { svg: ankylo,       classPrefix: 'dino-ankylo' });
  C.registerSpecies('triceratops',  { svg: triceratops,  classPrefix: 'dino-triceratops' });
  C.registerSpecies('spinosaurus',  { svg: spinosaurus,  classPrefix: 'dino-spinosaurus' });
  C.registerSpecies('mosasaur',     { svg: mosasaur,     classPrefix: 'dino-mosasaur' });
  C.registerSpecies('paraloph',     { svg: paraloph,     classPrefix: 'dino-paraloph' });
  C.registerSpecies('baby',         { svg: baby,         classPrefix: 'dino-baby' });
  C.registerSpecies('compy',        { svg: compy,        classPrefix: 'dino-compy' });
})();
