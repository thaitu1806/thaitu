// Học Vui — V14 "Giải Cứu Hành Tinh" sprite registry.
// Chibi space-rescuer hero (astronaut) + a friendly little germ/alien mascot.
// Each species is an SVG (viewBox 0 0 100 100) with named <g>: .body, .head, .accent.
// CSS in v14/style.css drives animation per state (idle / happy).
// Species ids are prefixed "rescuer_" to avoid colliding with other space themes
// (e.g. V17 spacekids.js).
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[rescuers.js] character.js must load first');
    return;
  }

  const OUT = '#2a1248';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.6" fill="' + OUT + '"/>';
  }

  // Hero — a cheerful chibi rescuer astronaut in a purple-trimmed suit.
  const rescuer =
    '<svg viewBox="0 0 100 100" class="rescuer" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        // antenna
        '<path d="M50 16 L50 8" stroke="#a78bfa" stroke-width="2.5"/>' +
        '<circle cx="50" cy="6" r="3" fill="#22d3ee"/>' +
        // backpack
        '<rect x="33" y="46" width="34" height="30" rx="9" fill="#6d28d9"/>' +
      '</g>' +
      '<g class="body">' +
        // arms
        '<rect class="arm-l" x="22" y="52" width="12" height="22" rx="6" fill="#eef2ff"/>' +
        '<rect class="arm-r" x="66" y="52" width="12" height="22" rx="6" fill="#eef2ff"/>' +
        // torso suit
        '<rect x="34" y="50" width="32" height="34" rx="13" fill="#eef2ff"/>' +
        // legs
        '<rect x="38" y="80" width="10" height="12" rx="5" fill="#eef2ff"/>' +
        '<rect x="52" y="80" width="10" height="12" rx="5" fill="#eef2ff"/>' +
        // chest badge
        '<circle cx="50" cy="64" r="5" fill="#7c3aed" stroke="' + OUT + '" stroke-width="2"/>' +
      '</g>' +
      '<g class="head">' +
        // helmet
        '<circle cx="50" cy="34" r="21" fill="#f8fafc"/>' +
        // visor
        '<ellipse cx="50" cy="35" rx="14" ry="12" fill="#312e81" stroke="' + OUT + '" stroke-width="2"/>' +
        '<ellipse cx="45" cy="31" rx="4" ry="3" fill="#60a5fa" opacity="0.8"/>' +
        eye(45, 36) + eye(56, 36) +
        '<path class="mouth" d="M45 42 Q50 46 55 42" stroke="#a5b4fc" stroke-width="2" fill="none"/>' +
      '</g>' +
    '</svg>';

  // Enemy — a friendly green germ/alien mascot with antennae and spots.
  const germ =
    '<svg viewBox="0 0 100 100" class="germ" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        // antennae
        '<path d="M38 28 L32 14" stroke="#16a34a" stroke-width="2.5"/>' +
        '<circle cx="31" cy="12" r="3.5" fill="#bbf7d0"/>' +
        '<path d="M62 28 L68 14" stroke="#16a34a" stroke-width="2.5"/>' +
        '<circle cx="69" cy="12" r="3.5" fill="#bbf7d0"/>' +
        // little nubs around the body
        '<circle cx="22" cy="58" r="4" fill="#22c55e"/>' +
        '<circle cx="78" cy="58" r="4" fill="#22c55e"/>' +
        '<circle cx="34" cy="84" r="4" fill="#22c55e"/>' +
        '<circle cx="66" cy="84" r="4" fill="#22c55e"/>' +
      '</g>' +
      '<g class="body">' +
        '<circle cx="50" cy="56" r="28" fill="#4ade80"/>' +
        // darker spots
        '<circle cx="38" cy="66" r="4" fill="#22c55e"/>' +
        '<circle cx="62" cy="62" r="5" fill="#22c55e"/>' +
        '<circle cx="56" cy="74" r="3" fill="#22c55e"/>' +
      '</g>' +
      '<g class="head">' +
        '<ellipse cx="42" cy="50" rx="7" ry="8" fill="#fff" stroke="' + OUT + '" stroke-width="2"/>' +
        '<ellipse cx="60" cy="50" rx="7" ry="8" fill="#fff" stroke="' + OUT + '" stroke-width="2"/>' +
        eye(42, 51) + eye(60, 51) +
        '<path class="mouth" d="M44 66 Q51 72 58 66" stroke="' + OUT + '" stroke-width="2.5" fill="none"/>' +
      '</g>' +
    '</svg>';

  const C = window.HocVuiCharacters;
  C.registerSpecies('rescuer_hero', { svg: rescuer, classPrefix: 'rescuer' });
  C.registerSpecies('rescuer_germ', { svg: germ, classPrefix: 'germ' });
})();
