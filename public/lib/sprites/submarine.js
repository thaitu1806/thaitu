// Học Vui — V50 "Tàu Ngầm Đại Dương" sprite registry.
// Chibi side-view submarines + a diving bell & bathysphere explorer pod.
// Each species is an SVG (viewBox 0 0 100 100) with named <g>:
//   .body, .head (porthole face), .accent, plus .prop (propeller) and .bubbles
//   so CSS can spin the propeller, bob the hull and drift bubbles.
// Subs face RIGHT and descend; CSS in v50/style.css drives idle / happy / scared.
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[submarine.js] character.js must load first');
    return;
  }

  const OUT = '#002233';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  // Reusable bits ────────────────────────────────────────────────────────
  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.4" fill="' + OUT + '"/>';
  }
  function smile(d) {
    return '<path class="mouth" d="' + d + '" stroke="' + OUT + '" stroke-width="2" fill="none" stroke-linecap="round"/>';
  }
  function bubbles(x) {
    x = x || 52;
    return (
      '<g class="bubbles">' +
        '<circle cx="' + x + '" cy="22" r="3" fill="#bfe9ff" opacity="0.85"/>' +
        '<circle cx="' + (x + 6) + '" cy="14" r="2.2" fill="#bfe9ff" opacity="0.7"/>' +
        '<circle cx="' + (x - 4) + '" cy="10" r="1.8" fill="#bfe9ff" opacity="0.6"/>' +
      '</g>'
    );
  }
  // Spinning propeller mounted at the tail (left). Its <g> bbox centre is the
  // spin axis, so CSS `transform-origin:center` rotates it in place.
  function propeller(blade) {
    return (
      '<g class="accent">' +
        '<rect x="13" y="47" width="8" height="10" rx="3" fill="' + blade + '"/>' +
        '<g class="prop"><ellipse cx="10" cy="52" rx="3.6" ry="11" fill="' + blade + '"/>' +
          '<circle cx="10" cy="52" r="2.4" fill="' + OUT + '"/></g>' +
      '</g>'
    );
  }

  // Generic submarine factory ───────────────────────────────────────────────
  // Faces RIGHT (porthole at front). opts: { hull, belly, tower, fin, glass }
  function makeSub(o) {
    const glass = o.glass || '#bfe9ff';
    return (
      '<svg viewBox="0 0 100 100" class="sub" ' + STROKE + ' aria-hidden="true">' +
        bubbles(52) +
        propeller(o.fin) +
        '<g class="accent">' +
          '<path d="M24 64 L18 78 L34 70 Z" fill="' + o.fin + '"/>' +   // lower rudder fin
          '<path d="M70 64 L66 76 L80 70 Z" fill="' + o.fin + '"/>' +   // dive plane
        '</g>' +
        '<g class="body">' +
          '<rect x="20" y="37" width="62" height="30" rx="15" fill="' + o.hull + '"/>' +
          '<path d="M24 58 Q51 67 80 58 Q51 63 24 58 Z" fill="' + o.belly + '"/>' +
          '<rect class="tower" x="43" y="25" width="17" height="16" rx="5" fill="' + o.tower + '"/>' +
          '<rect x="50" y="16" width="4" height="11" rx="2" fill="' + o.tower + '"/>' +
          '<circle cx="52" cy="15" r="2.6" fill="' + o.tower + '"/>' +
        '</g>' +
        '<g class="head">' +
          '<circle cx="66" cy="52" r="11" fill="' + glass + '" stroke="' + OUT + '" stroke-width="2.5"/>' +
          '<path d="M60 47 A11 11 0 0 1 71 45" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.7"/>' +
          eye(62, 51) + eye(70, 51) + smile('M61 56 Q66 60 71 56') +
        '</g>' +
      '</svg>'
    );
  }

  // Diving bell — round dome on a cable, porthole face, little legs ───────────
  const divingBell =
    '<svg viewBox="0 0 100 100" class="sub sub-bell" ' + STROKE + ' aria-hidden="true">' +
      bubbles(50) +
      '<g class="accent">' +
        '<path d="M50 4 L50 24" stroke="#90a4ae" stroke-width="3"/>' +    // cable
        '<rect x="26" y="74" width="10" height="8" rx="2" fill="#455a64"/>' +
        '<rect x="64" y="74" width="10" height="8" rx="2" fill="#455a64"/>' +
      '</g>' +
      '<g class="body">' +
        '<path d="M26 70 Q26 26 50 26 Q74 26 74 70 Z" fill="#ff8f00"/>' +
        '<rect x="24" y="68" width="52" height="8" rx="4" fill="#e65100"/>' +
        '<path d="M34 40 Q50 32 66 40" stroke="#ffd54f" stroke-width="3" fill="none" opacity="0.7"/>' +
      '</g>' +
      '<g class="head">' +
        '<circle cx="50" cy="54" r="13" fill="#bfe9ff" stroke="' + OUT + '" stroke-width="2.5"/>' +
        '<path d="M42 48 A13 13 0 0 1 56 46" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.7"/>' +
        eye(45, 53) + eye(55, 53) + smile('M44 59 Q50 64 56 59') +
      '</g>' +
    '</svg>';

  // Bathysphere — riveted explorer pod with a big front window face ───────────
  const bathysphere =
    '<svg viewBox="0 0 100 100" class="sub sub-pod" ' + STROKE + ' aria-hidden="true">' +
      bubbles(54) +
      '<g class="accent">' +
        '<g class="prop"><ellipse cx="14" cy="52" rx="3.4" ry="10" fill="#37474f"/>' +
          '<circle cx="14" cy="52" r="2.2" fill="' + OUT + '"/></g>' +
        '<rect x="16" y="48" width="8" height="9" rx="3" fill="#37474f"/>' +
        '<path d="M58 70 L54 80 L68 74 Z" fill="#455a64"/>' +
      '</g>' +
      '<g class="body">' +
        '<circle cx="56" cy="52" r="26" fill="#546e7a"/>' +
        '<circle cx="56" cy="52" r="26" fill="none" stroke="#90a4ae" stroke-width="2" opacity="0.6"/>' +
        '<circle cx="56" cy="28" r="1.8" fill="#cfd8dc"/>' +
        '<circle cx="74" cy="40" r="1.8" fill="#cfd8dc"/>' +
        '<circle cx="78" cy="60" r="1.8" fill="#cfd8dc"/>' +
        '<circle cx="40" cy="70" r="1.8" fill="#cfd8dc"/>' +
      '</g>' +
      '<g class="head">' +
        '<circle cx="58" cy="50" r="15" fill="#bfe9ff" stroke="' + OUT + '" stroke-width="3"/>' +
        '<path d="M49 43 A15 15 0 0 1 65 41" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.7"/>' +
        eye(53, 49) + eye(63, 49) + smile('M52 55 Q58 60 64 55') +
      '</g>' +
    '</svg>';

  const C = window.HocVuiCharacters;

  // Submarine pool (picked at random each run).
  C.registerSpecies('sub-classic', { svg: makeSub({ hull: '#0288d1', belly: '#b3e5fc', tower: '#01579b', fin: '#014a7f' }), classPrefix: 'sub-classic' });
  C.registerSpecies('sub-yellow',  { svg: makeSub({ hull: '#ffca28', belly: '#fff3c4', tower: '#f9a825', fin: '#c87f00' }), classPrefix: 'sub-yellow' });
  C.registerSpecies('sub-coral',   { svg: makeSub({ hull: '#ef5350', belly: '#ffcdd2', tower: '#c62828', fin: '#8e1f1f' }), classPrefix: 'sub-coral' });
  C.registerSpecies('sub-teal',    { svg: makeSub({ hull: '#26a69a', belly: '#b2dfdb', tower: '#00796b', fin: '#004d40' }), classPrefix: 'sub-teal' });
  C.registerSpecies('sub-violet',  { svg: makeSub({ hull: '#7e57c2', belly: '#d1c4e9', tower: '#4527a0', fin: '#311b92' }), classPrefix: 'sub-violet' });
  C.registerSpecies('diving-bell', { svg: divingBell, classPrefix: 'sub-bell' });
  C.registerSpecies('bathysphere', { svg: bathysphere, classPrefix: 'sub-pod' });
})();
