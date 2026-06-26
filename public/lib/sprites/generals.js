// Học Vui — V9 "Đấu Tướng Trí Tuệ" sprite registry.
// Chibi chess-piece warriors for two opposing sides (red / blue):
//   <side>-general (the King 👑) and <side>-soldier (the Lính ⚔️).
// Each species is an inline SVG (viewBox 0 0 100 100) with named <g>:
//   .body / .head / .accent — so CSS can target parts.
// CSS in v9/style.css drives animation per state (idle / happy).
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[generals.js] character.js must load first');
    return;
  }

  const OUT = '#23232f';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';
  const GOLD = '#ffd54f';
  const SKIN = '#ffe0b2';

  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.3" fill="' + OUT + '"/>';
  }

  // The General — a crowned commander (maps to the King piece).
  function makeGeneral(p) {
    return '' +
      '<svg viewBox="0 0 100 100" class="gen" ' + STROKE + ' aria-hidden="true">' +
        '<g class="body">' +
          '<path d="M26 90 L33 54 Q50 47 67 54 L74 90 Z" fill="' + p.main + '"/>' +
          '<path d="M50 56 L50 90" stroke="' + p.dark + '" stroke-width="2"/>' +
          '<circle cx="50" cy="68" r="4.5" fill="' + GOLD + '"/>' +
          '<rect x="20" y="58" width="11" height="9" rx="4" fill="' + SKIN + '"/>' +
          '<rect x="69" y="58" width="11" height="9" rx="4" fill="' + SKIN + '"/>' +
        '</g>' +
        '<g class="head">' +
          '<circle cx="50" cy="38" r="15" fill="' + SKIN + '"/>' +
          eye(44, 37) + eye(56, 37) +
          '<path class="mouth" d="M44 44 Q50 48 56 44" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
        '</g>' +
        '<g class="accent">' +
          '<path d="M36 27 L40 13 L46 21 L50 10 L54 21 L60 13 L64 27 Z" fill="' + GOLD + '"/>' +
          '<rect x="36" y="26" width="28" height="6" rx="2" fill="' + GOLD + '"/>' +
          '<circle cx="50" cy="13" r="2.6" fill="' + p.dark + '"/>' +
        '</g>' +
      '</svg>';
  }

  // The Soldier — a helmeted warrior with a raised sword (maps to the Lính piece).
  function makeSoldier(p) {
    return '' +
      '<svg viewBox="0 0 100 100" class="sol" ' + STROKE + ' aria-hidden="true">' +
        '<g class="body">' +
          '<path d="M28 90 L33 56 Q50 49 67 56 L72 90 Z" fill="' + p.main + '"/>' +
          '<rect x="38" y="60" width="24" height="6" rx="3" fill="' + p.dark + '"/>' +
          '<rect x="19" y="61" width="11" height="9" rx="4" fill="' + SKIN + '"/>' +
          '<rect x="70" y="52" width="10" height="9" rx="4" fill="' + SKIN + '"/>' +
        '</g>' +
        '<g class="head">' +
          '<circle cx="49" cy="42" r="14" fill="' + SKIN + '"/>' +
          '<path d="M35 40 Q35 23 49 23 Q63 23 63 40 Z" fill="' + p.main + '"/>' +
          '<rect x="34" y="38" width="30" height="5" rx="2" fill="' + GOLD + '"/>' +
          '<rect x="47" y="14" width="4" height="10" rx="2" fill="' + p.dark + '"/>' +
          '<circle cx="49" cy="13" r="3" fill="' + GOLD + '"/>' +
          eye(44, 45) + eye(54, 45) +
          '<path class="mouth" d="M44 50 Q49 53 54 50" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
        '</g>' +
        '<g class="accent">' +
          '<rect x="76" y="18" width="5" height="34" rx="2" fill="#cfd8dc"/>' +
          '<path d="M78.5 12 L76 18 L81 18 Z" fill="#eceff1"/>' +
          '<rect x="71" y="48" width="15" height="5" rx="2" fill="' + GOLD + '"/>' +
        '</g>' +
      '</svg>';
  }

  const RED = { main: '#f44336', dark: '#b71c1c' };
  const BLUE = { main: '#2196f3', dark: '#0d47a1' };

  const C = window.HocVuiCharacters;
  C.registerSpecies('red-general', { svg: makeGeneral(RED), classPrefix: 'gen' });
  C.registerSpecies('red-soldier', { svg: makeSoldier(RED), classPrefix: 'sol' });
  C.registerSpecies('blue-general', { svg: makeGeneral(BLUE), classPrefix: 'gen' });
  C.registerSpecies('blue-soldier', { svg: makeSoldier(BLUE), classPrefix: 'sol' });
})();
