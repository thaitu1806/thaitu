// Học Vui — V14 "Giải Cứu Hành Tinh" sprite registry.
// Chibi astronaut hero + space icons (rocket / planet / alien / star).
// Each species is an SVG (viewBox 0 0 100 100) with named <g>: .body, .head, .accent.
// CSS in v14/style.css drives animation per state (idle / happy).
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[space.js] character.js must load first');
    return;
  }

  const OUT = '#1a0533';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.4" fill="' + OUT + '"/>';
  }

  // Main player avatar — a cheerful chibi astronaut hero.
  const astronaut =
    '<svg viewBox="0 0 100 100" class="astro" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        '<rect x="20" y="40" width="14" height="22" rx="5" fill="#7c3aed"/>' +
        '<rect x="24" y="36" width="6" height="8" rx="2" fill="#a78bfa"/>' +
        '<g class="flame"><path d="M48 86 Q44 96 50 99 Q56 96 52 86 Z" fill="#fbbf24"/>' +
          '<path d="M50 88 Q48 94 50 97 Q52 94 50 88 Z" fill="#ef4444"/></g>' +
      '</g>' +
      '<g class="body">' +
        '<rect x="34" y="50" width="32" height="34" rx="14" fill="#eef2ff"/>' +
        '<rect x="40" y="62" width="20" height="12" rx="4" fill="#7c3aed"/>' +
        '<rect x="62" y="54" width="12" height="22" rx="5" fill="#e0e7ff"/>' +
        '<rect x="40" y="82" width="8" height="14" rx="3" fill="#e0e7ff"/>' +
        '<rect x="52" y="82" width="8" height="14" rx="3" fill="#e0e7ff"/>' +
      '</g>' +
      '<g class="head">' +
        '<circle cx="50" cy="34" r="20" fill="#f8fafc"/>' +
        '<path d="M34 34 A16 16 0 0 1 66 34 A16 16 0 0 1 50 48 Q38 46 34 34 Z" fill="#5eead4" opacity="0.85"/>' +
        '<path d="M34 34 A16 16 0 0 1 66 34" fill="none" stroke="#a78bfa" stroke-width="2"/>' +
        eye(44, 34) + eye(56, 34) +
        '<path class="mouth" d="M45 41 Q50 45 55 41" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
      '</g>' +
    '</svg>';

  const rocket =
    '<svg viewBox="0 0 100 100" class="icon" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent"><path d="M40 70 L30 86 L42 80 Z" fill="#7c3aed"/>' +
        '<path d="M60 70 L70 86 L58 80 Z" fill="#7c3aed"/>' +
        '<g class="flame"><path d="M44 82 Q50 98 56 82 Z" fill="#fbbf24"/></g></g>' +
      '<g class="body"><path d="M50 8 Q66 28 66 64 L34 64 Q34 28 50 8 Z" fill="#e0e7ff"/>' +
        '<rect x="42" y="64" width="16" height="10" rx="3" fill="#c7d2fe"/></g>' +
      '<g class="head"><circle cx="50" cy="34" r="8" fill="#5eead4" stroke="' + OUT + '" stroke-width="2"/></g>' +
    '</svg>';

  const planet =
    '<svg viewBox="0 0 100 100" class="icon" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent"><ellipse cx="50" cy="52" rx="42" ry="13" fill="none" stroke="#a78bfa" stroke-width="4" transform="rotate(-18 50 52)"/></g>' +
      '<g class="body"><circle cx="50" cy="50" r="26" fill="#4f46e5"/>' +
        '<circle cx="40" cy="44" r="6" fill="#6366f1"/><circle cx="60" cy="58" r="8" fill="#6366f1"/>' +
        '<circle cx="58" cy="40" r="4" fill="#818cf8"/></g>' +
    '</svg>';

  const alien =
    '<svg viewBox="0 0 100 100" class="icon" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent"><path d="M38 24 Q34 10 28 12 M62 24 Q66 10 72 12" stroke="#22c55e" stroke-width="3" fill="none"/>' +
        '<circle cx="28" cy="11" r="3" fill="#22c55e"/><circle cx="72" cy="11" r="3" fill="#22c55e"/></g>' +
      '<g class="body"><ellipse cx="50" cy="56" rx="24" ry="28" fill="#4ade80"/></g>' +
      '<g class="head"><ellipse class="eye" cx="42" cy="50" rx="6" ry="9" fill="' + OUT + '"/>' +
        '<ellipse class="eye" cx="58" cy="50" rx="6" ry="9" fill="' + OUT + '"/>' +
        '<path class="mouth" d="M44 70 Q50 74 56 70" stroke="' + OUT + '" stroke-width="2" fill="none"/></g>' +
    '</svg>';

  const star =
    '<svg viewBox="0 0 100 100" class="icon" ' + STROKE + ' aria-hidden="true">' +
      '<g class="body"><path d="M50 12 L60 40 L90 42 L66 60 L74 90 L50 72 L26 90 L34 60 L10 42 L40 40 Z" fill="#fbbf24"/></g>' +
      '<g class="head">' + eye(44, 50) + eye(56, 50) +
        '<path class="mouth" d="M44 60 Q50 66 56 60" stroke="' + OUT + '" stroke-width="2" fill="none"/></g>' +
    '</svg>';

  const C = window.HocVuiCharacters;
  C.registerSpecies('astronaut', { svg: astronaut, classPrefix: 'astro' });
  C.registerSpecies('rocket', { svg: rocket, classPrefix: 'icon' });
  C.registerSpecies('planet', { svg: planet, classPrefix: 'icon' });
  C.registerSpecies('alien', { svg: alien, classPrefix: 'icon' });
  C.registerSpecies('star', { svg: star, classPrefix: 'icon' });
})();
