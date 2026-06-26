// Học Vui — V60 "Cổ Tích Việt Nam" sprite registry.
// Chibi characters for each Vietnamese fairy tale. Each species is an SVG
// (viewBox 0 0 100 100) with named <g>: .body, .head, .accent.
// CSS in v60/style.css drives animation per state (idle / happy / scared).
// IDs MUST match TALES ids in game-logic.js: tam_cam, so_dua, con_rong,
// thanh_giong, cay_khe, banh_chung. Plus an optional `storyteller` mascot.
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[tales.js] character.js must load first');
    return;
  }

  // Warm parchment / brown palette ────────────────────────────────────────
  const OUT = '#4e342e';                 // thin dark outline
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"';

  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.4" fill="' + OUT + '"/>';
  }
  function smile(d) {
    return '<path class="mouth" d="' + (d || 'M44 50 Q50 56 56 50') + '" stroke="' + OUT + '" stroke-width="2" fill="none" stroke-linecap="round"/>';
  }
  function blush(cx) {
    return '<circle class="cheek" cx="' + cx + '" cy="54" r="3" fill="#ef9a9a" opacity="0.7"/>';
  }
  function svg(cls, inner) {
    return '<svg viewBox="0 0 100 100" class="' + cls + '" ' + STROKE + ' aria-hidden="true">' + inner + '</svg>';
  }

  // 1. Tấm Cám — chibi girl in áo dài holding a little shoe ─────────────────
  const tamCam = svg('tale tale-tam',
    '<g class="body">' +
      '<path d="M37 60 Q50 54 63 60 L67 88 L33 88 Z" fill="#e57373"/>' +
      '<path d="M50 58 L50 88" stroke="' + OUT + '" stroke-width="1.6"/>' +
    '</g>' +
    '<g class="accent">' +
      '<path d="M64 70 L74 64 L80 70 L72 76 Z" fill="#ffd54f"/>' +    // little golden shoe
      '<path d="M64 70 L74 64" stroke="' + OUT + '" stroke-width="1.6"/>' +
    '</g>' +
    '<g class="head">' +
      '<path d="M33 42 Q30 22 50 22 Q70 22 67 42 L66 56 L34 56 Z" fill="#3e2723"/>' +  // hair
      '<circle cx="50" cy="44" r="14" fill="#ffe0b2"/>' +
      '<path d="M36 38 Q50 26 64 38 Q60 30 50 30 Q40 30 36 38 Z" fill="#3e2723"/>' +   // bangs
      '<circle cx="50" cy="29" r="3" fill="#ff80ab"/>' +                              // hair flower
      eye(45, 44) + eye(55, 44) + smile('M46 50 Q50 54 54 50') + blush(40) + blush(60) +
    '</g>');

  // 2. Sọ Dừa — a cute coconut ──────────────────────────────────────────────
  const soDua = svg('tale tale-sodua',
    '<g class="body">' +
      '<ellipse cx="50" cy="78" rx="20" ry="10" fill="#8d6e63" opacity="0.4"/>' +
    '</g>' +
    '<g class="head">' +
      '<circle cx="50" cy="52" r="30" fill="#795548"/>' +
      '<path d="M28 46 Q50 36 72 46" stroke="#5d4037" stroke-width="2" fill="none"/>' +
      '<circle cx="40" cy="44" r="3" fill="#4e342e"/>' +     // coconut "eyes" (the husk holes)
      '<circle cx="60" cy="44" r="3" fill="#4e342e"/>' +
      '<circle cx="50" cy="52" r="3" fill="#4e342e"/>' +
      eye(43, 56) + eye(57, 56) + smile('M43 64 Q50 70 57 64') + blush(36) + blush(64) +
    '</g>' +
    '<g class="accent">' +
      '<path d="M50 22 Q44 14 38 16 M50 22 Q56 14 62 16 M50 22 L50 14" stroke="#66bb6a" stroke-width="2.4" fill="none"/>' +   // sprout
    '</g>');

  // 3. Con Rồng Cháu Tiên — a little dragon ─────────────────────────────────
  const conRong = svg('tale tale-rong',
    '<g class="body">' +
      '<path d="M40 60 Q24 64 26 78 Q28 88 40 84" fill="none" stroke="#43a047" stroke-width="7"/>' +  // tail
      '<path d="M40 84 L34 90 M40 84 L44 92" stroke="#2e7d32" stroke-width="2"/>' +
      '<ellipse cx="52" cy="60" rx="16" ry="14" fill="#66bb6a"/>' +
    '</g>' +
    '<g class="accent">' +
      '<path d="M44 50 L40 40 L48 48 M58 48 L66 40 L60 50" fill="#fdd835"/>' +       // horns
      '<path d="M52 54 L52 74" stroke="#2e7d32" stroke-width="1.6" stroke-dasharray="3 3"/>' +
    '</g>' +
    '<g class="head">' +
      '<circle cx="52" cy="44" r="15" fill="#81c784"/>' +
      '<ellipse cx="52" cy="50" rx="9" ry="6" fill="#c5e1a5"/>' +    // snout
      '<circle cx="48" cy="50" r="1.4" fill="' + OUT + '"/>' +
      '<circle cx="56" cy="50" r="1.4" fill="' + OUT + '"/>' +
      eye(47, 42) + eye(57, 42) + smile('M46 46 Q52 51 58 46') +
    '</g>');

  // 4. Thánh Gióng — hero riding a horse ────────────────────────────────────
  const thanhGiong = svg('tale tale-giong',
    '<g class="body">' +
      '<path d="M30 66 Q34 56 46 58 L70 58 Q80 58 80 70 L80 80 L30 80 Z" fill="#a1887f"/>' +  // horse body
      '<path d="M36 80 L36 90 M48 80 L48 90 M66 80 L66 90 M76 80 L76 90" stroke="' + OUT + '" stroke-width="3.4"/>' +  // legs
      '<path d="M30 66 Q20 62 18 72 Q24 70 30 72" fill="#8d6e63"/>' +    // horse head
      '<path d="M22 64 L18 58 L26 62 Z" fill="#6d4c41"/>' +              // ear
      '<circle cx="22" cy="68" r="1.6" fill="' + OUT + '"/>' +
    '</g>' +
    '<g class="head">' +
      '<circle cx="58" cy="38" r="12" fill="#ffe0b2"/>' +
      '<path d="M46 36 Q46 24 58 24 Q70 24 70 36 Z" fill="#ffca28"/>' +   // golden helmet
      '<rect x="55" y="20" width="6" height="8" rx="2" fill="#ffd54f"/>' + // plume base
      eye(54, 38) + eye(62, 38) + smile('M54 43 Q58 47 62 43') +
    '</g>' +
    '<g class="accent">' +
      '<path d="M72 30 L88 14" stroke="#bcaaa4" stroke-width="4"/>' +     // iron rod / spear
      '<path d="M86 12 L92 16 L88 20 Z" fill="#cfd8dc"/>' +
    '</g>');

  // 5. Cây Khế — star-fruit tree ────────────────────────────────────────────
  function star(cx, cy, r, fill) {
    let pts = '';
    for (let i = 0; i < 5; i++) {
      const ao = -Math.PI / 2 + i * 2 * Math.PI / 5;
      const ai = ao + Math.PI / 5;
      pts += (i ? ' L' : 'M') + (cx + r * Math.cos(ao)).toFixed(1) + ' ' + (cy + r * Math.sin(ao)).toFixed(1);
      pts += ' L' + (cx + r * 0.45 * Math.cos(ai)).toFixed(1) + ' ' + (cy + r * 0.45 * Math.sin(ai)).toFixed(1);
    }
    return '<path d="' + pts + ' Z" fill="' + fill + '"/>';
  }
  const cayKhe = svg('tale tale-khe',
    '<g class="body">' +
      '<rect x="45" y="58" width="10" height="30" rx="3" fill="#8d6e63"/>' +   // trunk
      '<path d="M50 70 L38 78 M50 64 L62 72" stroke="#6d4c41" stroke-width="2.4"/>' +
    '</g>' +
    '<g class="head">' +
      '<circle cx="50" cy="40" r="26" fill="#66bb6a"/>' +
      '<circle cx="34" cy="46" r="12" fill="#81c784"/>' +
      '<circle cx="66" cy="46" r="12" fill="#81c784"/>' +
      eye(45, 40) + eye(57, 40) + smile('M45 47 Q51 53 57 47') + blush(38) + blush(64) +
    '</g>' +
    '<g class="accent">' +
      star(34, 30, 6, '#fdd835') + star(64, 34, 5.5, '#ffca28') + star(52, 22, 5, '#fdd835') +
    '</g>');

  // 6. Bánh Chưng Bánh Dày — a green square sticky-rice cake ─────────────────
  const banhChung = svg('tale tale-banh',
    '<g class="body">' +
      '<rect x="24" y="40" width="52" height="44" rx="6" fill="#66bb6a"/>' +
      '<rect x="24" y="40" width="52" height="44" rx="6" fill="none" stroke="#388e3c" stroke-width="2"/>' +
    '</g>' +
    '<g class="accent">' +
      '<path d="M24 56 L76 56 M24 68 L76 68 M40 40 L40 84 M58 40 L58 84" stroke="#fdd835" stroke-width="2.6"/>' +  // lá dong lacing
    '</g>' +
    '<g class="head">' +
      eye(42, 60) + eye(58, 60) + smile('M42 68 Q50 74 58 68') + blush(35) + blush(65) +
    '</g>');

  // Optional storyteller mascot — a friendly book ───────────────────────────
  const storyteller = svg('tale tale-book',
    '<g class="body">' +
      '<path d="M50 30 Q34 24 22 30 L22 78 Q34 72 50 78 Z" fill="#fff8e1"/>' +
      '<path d="M50 30 Q66 24 78 30 L78 78 Q66 72 50 78 Z" fill="#ffe0b2"/>' +
      '<path d="M50 30 L50 78" stroke="' + OUT + '" stroke-width="2.4"/>' +
      '<path d="M28 38 L44 41 M28 48 L44 51 M56 41 L72 38 M56 51 L72 48" stroke="#bcaaa4" stroke-width="1.6"/>' +
    '</g>' +
    '<g class="head">' +
      eye(40, 58) + eye(60, 58) + smile('M42 64 Q50 70 58 64') + blush(33) + blush(67) +
    '</g>' +
    '<g class="accent">' +
      star(26, 22, 5, '#fdd835') + star(74, 20, 4.5, '#ffca28') +
    '</g>');

  const C = window.HocVuiCharacters;
  C.registerSpecies('tam_cam',     { svg: tamCam,      classPrefix: 'tale-tam' });
  C.registerSpecies('so_dua',      { svg: soDua,       classPrefix: 'tale-sodua' });
  C.registerSpecies('con_rong',    { svg: conRong,     classPrefix: 'tale-rong' });
  C.registerSpecies('thanh_giong', { svg: thanhGiong,  classPrefix: 'tale-giong' });
  C.registerSpecies('cay_khe',     { svg: cayKhe,      classPrefix: 'tale-khe' });
  C.registerSpecies('banh_chung',  { svg: banhChung,   classPrefix: 'tale-banh' });
  C.registerSpecies('storyteller', { svg: storyteller, classPrefix: 'tale-book' });
})();
