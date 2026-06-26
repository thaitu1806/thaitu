// Học Vui — V37 "Vận Động Viên" sprite registry.
// Chibi Olympic athletes (one per event) + a friendly medal mascot.
// Each species is an SVG (viewBox 0 0 100 100) with named <g>: .body, .head, .accent.
// CSS in v37/style.css drives animation per state (idle / happy).
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[athletes.js] character.js must load first');
    return;
  }

  const OUT = '#3a2410';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';
  const SKIN = '#fcd9a8';
  const JERSEY = '#ef4444';
  const JERSEY2 = '#dc2626';

  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.2" fill="' + OUT + '"/>';
  }
  // Smiling chibi head at (cx, cy) radius r, with optional headgear markup.
  function head(cx, cy, r, extra) {
    return '<g class="head">' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + SKIN + '"/>' +
      eye(cx - 3.2, cy - 1) + eye(cx + 3.2, cy - 1) +
      '<path class="mouth" d="M' + (cx - 3.5) + ' ' + (cy + 3) + ' Q' + cx + ' ' + (cy + 6.5) + ' ' + (cx + 3.5) + ' ' + (cy + 3) + '" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
      (extra || '') +
    '</g>';
  }

  // ---- Runner (Chạy 100m) — mid-stride sprint ----
  const runner =
    '<svg viewBox="0 0 100 100" class="athlete" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent"><path d="M14 40 L30 40 M10 52 L26 52 M14 64 L30 64" stroke="#fde047" stroke-width="3" opacity="0.85"/></g>' +
      '<g class="body">' +
        '<path class="leg leg-back" d="M52 64 L40 82 L30 84" fill="none" stroke="' + SKIN + '" stroke-width="8"/>' +
        '<path class="leg leg-front" d="M54 64 L66 78 L66 90" fill="none" stroke="' + SKIN + '" stroke-width="8"/>' +
        '<path d="M46 40 L58 40 L56 66 L48 66 Z" fill="' + JERSEY + '"/>' +
        '<path class="arm arm-back" d="M50 46 L38 50 L34 60" fill="none" stroke="' + SKIN + '" stroke-width="7"/>' +
        '<path class="arm arm-front" d="M54 46 L66 44 L70 36" fill="none" stroke="' + SKIN + '" stroke-width="7"/>' +
      '</g>' +
      head(57, 30, 12, '<path d="M45 26 Q57 16 69 26" fill="none" stroke="#1f2937" stroke-width="4"/>') +
    '</svg>';

  // ---- Gymnast (Nhảy xa) — leaping with ribbon ----
  const gymnast =
    '<svg viewBox="0 0 100 100" class="athlete" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent"><path class="ribbon" d="M78 24 Q92 30 84 44 Q76 56 88 64" fill="none" stroke="#f472b6" stroke-width="3.5"/></g>' +
      '<g class="body">' +
        '<path class="leg leg-back" d="M48 62 L36 74 L26 72" fill="none" stroke="' + SKIN + '" stroke-width="8"/>' +
        '<path class="leg leg-front" d="M54 62 L70 70 L80 64" fill="none" stroke="' + SKIN + '" stroke-width="8"/>' +
        '<path d="M44 38 L58 38 L55 64 L47 64 Z" fill="#a855f7"/>' +
        '<path class="arm arm-up" d="M50 42 L60 30 L74 24" fill="none" stroke="' + SKIN + '" stroke-width="7"/>' +
        '<path class="arm arm-back" d="M48 44 L36 38 L28 42" fill="none" stroke="' + SKIN + '" stroke-width="7"/>' +
      '</g>' +
      head(50, 28, 12, '<circle cx="50" cy="18" r="4" fill="#a855f7"/>') +
    '</svg>';

  // ---- Swimmer (Bơi 50m) — goggles + wave ----
  const swimmer =
    '<svg viewBox="0 0 100 100" class="athlete" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent"><path class="wave" d="M10 78 Q22 70 34 78 Q46 86 58 78 Q70 70 82 78 Q90 84 94 80" fill="none" stroke="#38bdf8" stroke-width="4"/></g>' +
      '<g class="body">' +
        '<path class="leg" d="M52 62 L66 70 L78 66" fill="none" stroke="' + SKIN + '" stroke-width="8"/>' +
        '<path class="leg" d="M50 62 L60 72 L70 72" fill="none" stroke="' + SKIN + '" stroke-width="8"/>' +
        '<path d="M42 40 L56 40 L54 64 L46 64 Z" fill="#0ea5e9"/>' +
        '<path class="arm arm-up" d="M48 44 L40 30 L46 18" fill="none" stroke="' + SKIN + '" stroke-width="7"/>' +
        '<path class="arm" d="M52 46 L64 44 L70 50" fill="none" stroke="' + SKIN + '" stroke-width="7"/>' +
      '</g>' +
      head(46, 30, 12, '<path d="M35 28 Q46 22 57 28" fill="none" stroke="#0369a1" stroke-width="5"/><circle cx="42" cy="29" r="3.2" fill="#bae6fd" stroke="#0369a1" stroke-width="1.5"/><circle cx="50" cy="29" r="3.2" fill="#bae6fd" stroke="#0369a1" stroke-width="1.5"/>') +
    '</svg>';

  // ---- Archer (Bắn cung) — drawing a bow ----
  const archer =
    '<svg viewBox="0 0 100 100" class="athlete" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        '<path class="bow" d="M74 22 Q90 50 74 78" fill="none" stroke="#92400e" stroke-width="4"/>' +
        '<line class="bowstring" x1="74" y1="22" x2="74" y2="78" stroke="#e5e7eb" stroke-width="2"/>' +
        '<line class="arrow" x1="48" y1="50" x2="82" y2="50" stroke="#fbbf24" stroke-width="3"/>' +
      '</g>' +
      '<g class="body">' +
        '<path class="leg" d="M48 64 L40 84 L30 86" fill="none" stroke="' + SKIN + '" stroke-width="8"/>' +
        '<path class="leg" d="M54 64 L62 84 L72 86" fill="none" stroke="' + SKIN + '" stroke-width="8"/>' +
        '<path d="M44 40 L58 40 L56 66 L46 66 Z" fill="#16a34a"/>' +
        '<path class="arm arm-front" d="M52 46 L70 50" fill="none" stroke="' + SKIN + '" stroke-width="7"/>' +
        '<path class="arm arm-draw" d="M50 48 L44 50 L48 54" fill="none" stroke="' + SKIN + '" stroke-width="7"/>' +
      '</g>' +
      head(48, 30, 12) +
    '</svg>';

  // ---- Cyclist (Xe đạp) — on a bike ----
  const cyclist =
    '<svg viewBox="0 0 100 100" class="athlete" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent wheels">' +
        '<circle class="wheel" cx="28" cy="74" r="14" fill="none" stroke="#1f2937" stroke-width="4"/>' +
        '<circle class="wheel" cx="74" cy="74" r="14" fill="none" stroke="#1f2937" stroke-width="4"/>' +
        '<path d="M28 74 L48 60 L66 60 L74 74 M48 60 L40 74" fill="none" stroke="#60a5fa" stroke-width="3"/>' +
      '</g>' +
      '<g class="body">' +
        '<path class="leg" d="M48 56 L48 70 L40 74" fill="none" stroke="' + SKIN + '" stroke-width="7"/>' +
        '<path d="M42 34 L56 34 L52 58 L44 58 Z" fill="' + JERSEY + '"/>' +
        '<path class="arm" d="M52 40 L66 56" fill="none" stroke="' + SKIN + '" stroke-width="6"/>' +
      '</g>' +
      head(44, 26, 11, '<path d="M33 24 Q44 14 55 24 Z" fill="#facc15"/>') +
    '</svg>';

  // ---- Medal mascot — gold medal with a cheerful face + ribbon ----
  const medal =
    '<svg viewBox="0 0 100 100" class="mascot" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        '<path d="M38 14 L46 50 L40 52 L32 18 Z" fill="' + JERSEY + '"/>' +
        '<path d="M62 14 L54 50 L60 52 L68 18 Z" fill="#3b82f6"/>' +
      '</g>' +
      '<g class="body">' +
        '<circle cx="50" cy="64" r="26" fill="#facc15"/>' +
        '<circle cx="50" cy="64" r="26" fill="none" stroke="#d97706" stroke-width="3"/>' +
        '<circle cx="50" cy="64" r="18" fill="none" stroke="#eab308" stroke-width="2"/>' +
      '</g>' +
      '<g class="head">' + eye(44, 60) + eye(56, 60) +
        '<path class="mouth" d="M43 68 Q50 75 57 68" stroke="' + OUT + '" stroke-width="2.2" fill="none"/>' +
        '<path d="M40 50 L46 36 L50 48 L54 36 L60 50" fill="none" stroke="#d97706" stroke-width="2.5"/>' +
      '</g>' +
    '</svg>';

  const C = window.HocVuiCharacters;
  C.registerSpecies('runner', { svg: runner, classPrefix: 'athlete' });
  C.registerSpecies('gymnast', { svg: gymnast, classPrefix: 'athlete' });
  C.registerSpecies('swimmer', { svg: swimmer, classPrefix: 'athlete' });
  C.registerSpecies('archer', { svg: archer, classPrefix: 'athlete' });
  C.registerSpecies('cyclist', { svg: cyclist, classPrefix: 'athlete' });
  C.registerSpecies('medal', { svg: medal, classPrefix: 'mascot' });
})();
