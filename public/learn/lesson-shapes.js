// === Interactive "Hình Dạng" (Shapes) Lesson for Grade 0 (5 tuổi) ===
// Hooks into openTopic('shapes0') in learn.js
// 4-step flow: Explore → Match → Puzzle → Reward
(function () {
  'use strict';

  const S = () => window.HocVuiSprite;

  // ── Shape definitions with SVG rendering ──
  const SHAPES = [
    { id: 'circle', name: 'Hình Tròn', desc: 'Không có góc, lăn được!', sides: 0,
      svg: (s, clr) => `<svg width="${s}" height="${s}" viewBox="0 0 60 60"><circle cx="30" cy="30" r="26" fill="${clr}" stroke="${clr}" stroke-width="3" fill-opacity="0.2"/></svg>`,
      items: ['đồng hồ', 'bánh xe', 'mặt trăng'] },
    { id: 'square', name: 'Hình Vuông', desc: '4 cạnh bằng nhau, 4 góc vuông!', sides: 4,
      svg: (s, clr) => `<svg width="${s}" height="${s}" viewBox="0 0 60 60"><rect x="8" y="8" width="44" height="44" fill="${clr}" stroke="${clr}" stroke-width="3" fill-opacity="0.2" rx="2"/></svg>`,
      items: ['cửa sổ', 'khăn tay', 'hộp quà'] },
    { id: 'triangle', name: 'Hình Tam Giác', desc: '3 cạnh, 3 góc nhọn!', sides: 3,
      svg: (s, clr) => `<svg width="${s}" height="${s}" viewBox="0 0 60 60"><polygon points="30,6 54,54 6,54" fill="${clr}" stroke="${clr}" stroke-width="3" fill-opacity="0.2"/></svg>`,
      items: ['mái nhà', 'biển báo', 'lát pizza'] },
    { id: 'rectangle', name: 'Hình Chữ Nhật', desc: '4 cạnh, 2 dài 2 ngắn!', sides: 4,
      svg: (s, clr) => `<svg width="${s}" height="${s}" viewBox="0 0 60 40"><rect x="4" y="4" width="52" height="32" fill="${clr}" stroke="${clr}" stroke-width="3" fill-opacity="0.2" rx="2"/></svg>`,
      items: ['cửa ra vào', 'bảng đen', 'điện thoại'] },
    { id: 'star', name: 'Hình Ngôi Sao', desc: '5 cánh nhọn, lấp lánh!', sides: 5,
      svg: (s, clr) => `<svg width="${s}" height="${s}" viewBox="0 0 60 60"><polygon points="30,4 37,22 56,22 41,34 47,52 30,42 13,52 19,34 4,22 23,22" fill="${clr}" stroke="${clr}" stroke-width="2" fill-opacity="0.2"/></svg>`,
      items: ['ngôi sao trên trời', 'huy hiệu', 'đỉnh cây thông'] },
    { id: 'heart', name: 'Hình Trái Tim', desc: 'Biểu tượng tình yêu!', sides: 0,
      svg: (s, clr) => `<svg width="${s}" height="${s}" viewBox="0 0 60 60"><path d="M30 52 C10 36 4 24 12 14 C20 4 30 10 30 18 C30 10 40 4 48 14 C56 24 50 36 30 52Z" fill="${clr}" stroke="${clr}" stroke-width="2" fill-opacity="0.2"/></svg>`,
      items: ['thiệp valentine', 'gối ôm', 'kẹo mút'] },
  ];

  const SHAPE_COLORS = ['#e53935', '#1e88e5', '#43a047', '#fb8c00', '#8e24aa', '#ec407a'];

  // ── TTS ──
  function speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'vi-VN'; u.rate = 0.85; u.pitch = 1.1;
    const voices = window.speechSynthesis.getVoices();
    const vi = voices.find(v => v.lang.startsWith('vi'));
    if (vi) u.voice = vi;
    window.speechSynthesis.speak(u);
  }
  function speakerBtn(text) {
    return `<button class="lc-speak-btn" onclick="window._lessonShapes.speak('${text.replace(/'/g, "\\'")}')"><img src="/img/sound-on.png" style="width:22px;height:22px;"></button>`;
  }

  // ── State ──
  let state = { step: 0, score: 0, total: 0, round: 0, explored: 0 };

  // ── Helpers ──
  function $(id) { return document.getElementById(id); }
  function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function playSound(type) { if (window.HocVuiSound) window.HocVuiSound.play(type); }
  function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

  const PRAISE = ['Giỏi lắm!', 'Tuyệt vời!', 'Đúng rồi!', 'Hay quá!', 'Xuất sắc!'];
  const ENCOURAGE = ['Thử lại nhé!', 'Gần đúng rồi!', 'Cố lên!'];

  function getScreen() { return $('shapes0-interactive-screen'); }
  function show() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    getScreen().classList.add('active');
  }
  function updateProgress() {
    const bar = getScreen().querySelector('.lsh-progress-bar');
    if (bar) bar.style.width = ((state.step + 1) / 4 * 100) + '%';
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 0: Explore — tap shapes to learn names and properties
  // ══════════════════════════════════════════════════════════════════
  function renderExplore() {
    state.step = 0;
    state.explored = 0;

    const body = getScreen().querySelector('.lsh-body');
    body.innerHTML = `
      <div class="lsh-explore">
        <p class="lsh-title">Chạm vào hình để khám phá! ${speakerBtn('Chạm vào hình để khám phá')}</p>
        <div class="lsh-shape-grid" id="lsh-explore-grid">
          ${SHAPES.map((sh, i) => `
            <div class="lsh-shape-card" id="lsh-card-${i}" onclick="window._lessonShapes.tapExplore(${i})">
              <div class="lsh-shape-svg">${sh.svg(50, SHAPE_COLORS[i])}</div>
              <span class="lsh-shape-name" id="lsh-sname-${i}">?</span>
            </div>
          `).join('')}
        </div>
        <div class="lsh-explore-info" id="lsh-explore-info"></div>
        <div id="lsh-explore-next" style="margin-top:12px;"></div>
      </div>
    `;
    updateProgress();
  }

  function tapExplore(idx) {
    const sh = SHAPES[idx];
    const card = $('lsh-card-' + idx);
    const nameEl = $('lsh-sname-' + idx);
    if (!card || card.classList.contains('lsh-explored')) return;

    card.classList.add('lsh-explored');
    nameEl.textContent = sh.name;
    nameEl.style.color = SHAPE_COLORS[idx];
    speak(sh.name + '! ' + sh.desc);
    playSound('click');

    const info = $('lsh-explore-info');
    if (info) {
      info.innerHTML = `<div class="lsh-info-bubble" style="border-left:4px solid ${SHAPE_COLORS[idx]}">
        <strong>${sh.name}</strong>: ${sh.desc}<br>
        <span style="color:#666;font-size:0.85rem">Ví dụ: ${sh.items.join(', ')}</span>
      </div>`;
    }

    state.explored++;
    if (state.explored >= 6) {
      setTimeout(() => {
        const next = $('lsh-explore-next');
        if (next) next.innerHTML = `<button class="lc-btn lc-btn-primary" onclick="window._lessonShapes.startMatch()">Tiếp tục!</button>`;
      }, 500);
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 1: Match — pick the correct shape by name or find object shape
  // ══════════════════════════════════════════════════════════════════
  function startMatch() {
    state.step = 1;
    state.round = 0;
    state.score = 0;
    state.total = 0;
    nextMatch();
  }

  function nextMatch() {
    if (state.round >= 4) { startPuzzle(); return; }
    state.round++;

    const target = SHAPES[randInt(0, 5)];
    const targetColor = SHAPE_COLORS[SHAPES.indexOf(target)];
    const wrongs = shuffle(SHAPES.filter(s => s.id !== target.id)).slice(0, 3);
    const options = shuffle([target, ...wrongs]);
    const correctIdx = options.indexOf(target);

    // Alternate between "find shape by name" and "what shape is this object?"
    const isNameMode = state.round <= 2;
    const question = isNameMode
      ? `Đâu là <strong>${target.name}</strong>?`
      : `"${rand(target.items)}" có hình gì?`;

    const body = getScreen().querySelector('.lsh-body');
    body.innerHTML = `
      <div class="lsh-match-section">
        <div class="lsh-match-header">
          <span class="lsh-round-badge">Câu ${state.round}/4</span>
          <span class="lsh-score-badge">${S().named('star', 16)} ${state.score}</span>
        </div>
        <p class="lsh-question">${question} ${speakerBtn(question.replace(/<[^>]+>/g, ''))}</p>
        <div class="lsh-match-options" id="lsh-match-opts">
          ${options.map((sh, i) => `
            <button class="lsh-match-opt" data-idx="${i}" onclick="window._lessonShapes.answerMatch(${i}, ${correctIdx})">
              ${sh.svg(56, SHAPE_COLORS[SHAPES.indexOf(sh)])}
              <span class="lsh-opt-label">${sh.name}</span>
            </button>
          `).join('')}
        </div>
        <div class="lsh-feedback" id="lsh-match-fb"></div>
      </div>
    `;
    updateProgress();
  }

  function answerMatch(picked, correctIdx) {
    state.total++;
    const opts = getScreen().querySelectorAll('.lsh-match-opt');
    opts.forEach((o, i) => {
      o.style.pointerEvents = 'none';
      if (i === correctIdx) o.classList.add('lsh-opt-correct');
      if (i === picked && i !== correctIdx) o.classList.add('lsh-opt-wrong');
    });
    const fb = $('lsh-match-fb');
    if (picked === correctIdx) {
      state.score++;
      playSound('correct');
      if (fb) fb.innerHTML = `<div class="lsh-fb-ok">${rand(PRAISE)}</div>`;
    } else {
      playSound('wrong');
      if (fb) fb.innerHTML = `<div class="lsh-fb-wrong">${rand(ENCOURAGE)}</div>`;
    }
    setTimeout(() => nextMatch(), 1400);
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 2: Puzzle — assemble shapes to build objects (tap in order)
  // ══════════════════════════════════════════════════════════════════
  const PUZZLES = [
    { name: 'Ngôi Nhà', parts: [
      { shape: 'square', label: 'Thân nhà', color: '#fb8c00' },
      { shape: 'triangle', label: 'Mái nhà', color: '#e53935' },
      { shape: 'rectangle', label: 'Cửa', color: '#6d4c41' },
    ]},
    { name: 'Xe Tải', parts: [
      { shape: 'rectangle', label: 'Thùng xe', color: '#1e88e5' },
      { shape: 'square', label: 'Cabin', color: '#43a047' },
      { shape: 'circle', label: 'Bánh xe', color: '#333' },
    ]},
    { name: 'Cây Thông', parts: [
      { shape: 'triangle', label: 'Tán lá', color: '#43a047' },
      { shape: 'triangle', label: 'Tán lá dưới', color: '#2e7d32' },
      { shape: 'rectangle', label: 'Thân cây', color: '#6d4c41' },
    ]},
  ];

  function startPuzzle() {
    state.step = 2;
    state.round = 0;
    nextPuzzle();
  }

  function nextPuzzle() {
    if (state.round >= 2) { showReward(); return; }
    state.round++;

    const puzzle = PUZZLES[state.round - 1];
    state._puzzleParts = puzzle.parts;
    state._puzzlePlaced = 0;

    // Shuffled parts for picking
    const shuffledParts = shuffle(puzzle.parts.map((p, i) => ({ ...p, idx: i })));

    const body = getScreen().querySelector('.lsh-body');
    body.innerHTML = `
      <div class="lsh-puzzle-section">
        <div class="lsh-match-header">
          <span class="lsh-round-badge">Ghép hình ${state.round}/2</span>
          <span class="lsh-score-badge">${S().named('star', 16)} ${state.score}</span>
        </div>
        <p class="lsh-question">Ghép hình tạo thành: <strong>${puzzle.name}</strong>! ${speakerBtn('Ghép hình tạo thành ' + puzzle.name)}</p>
        <p class="lsh-hint">Chạm theo thứ tự đúng!</p>
        <div class="lsh-puzzle-slots" id="lsh-puzzle-slots">
          ${puzzle.parts.map((p, i) => `
            <div class="lsh-puzzle-slot" id="lsh-slot-${i}">
              <span class="lsh-slot-hint">${p.label}</span>
            </div>
          `).join('')}
        </div>
        <div class="lsh-puzzle-pieces" id="lsh-puzzle-pieces">
          ${shuffledParts.map((p, i) => {
            const sh = SHAPES.find(s => s.id === p.shape);
            return `<div class="lsh-puzzle-piece" id="lsh-piece-${i}" onclick="window._lessonShapes.tapPuzzle(${i}, ${p.idx})">
              ${sh.svg(48, p.color)}
              <span class="lsh-piece-label">${sh.name}</span>
            </div>`;
          }).join('')}
        </div>
        <div class="lsh-feedback" id="lsh-puzzle-fb"></div>
      </div>
    `;
    updateProgress();
  }

  function tapPuzzle(pieceIdx, correctSlotIdx) {
    if (correctSlotIdx !== state._puzzlePlaced) {
      // Wrong order
      playSound('wrong');
      const piece = $('lsh-piece-' + pieceIdx);
      if (piece) piece.classList.add('lsh-piece-shake');
      setTimeout(() => { if (piece) piece.classList.remove('lsh-piece-shake'); }, 400);
      return;
    }

    // Correct piece for current slot
    state._puzzlePlaced++;
    playSound('click');
    speak(state._puzzleParts[correctSlotIdx].label);

    const piece = $('lsh-piece-' + pieceIdx);
    if (piece) { piece.classList.add('lsh-piece-placed'); piece.style.pointerEvents = 'none'; }

    const slot = $('lsh-slot-' + correctSlotIdx);
    if (slot) {
      const part = state._puzzleParts[correctSlotIdx];
      const sh = SHAPES.find(s => s.id === part.shape);
      slot.innerHTML = sh.svg(44, part.color);
      slot.classList.add('lsh-slot-filled');
    }

    if (state._puzzlePlaced >= state._puzzleParts.length) {
      state.score++;
      state.total++;
      playSound('correct');
      const fb = $('lsh-puzzle-fb');
      if (fb) fb.innerHTML = `<div class="lsh-fb-ok">${rand(PRAISE)} Hoàn thành!</div>`;
      setTimeout(() => nextPuzzle(), 1500);
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 3: Reward
  // ══════════════════════════════════════════════════════════════════
  function showReward() {
    state.step = 3;
    playSound('win');
    const stars = state.score >= 5 ? 3 : state.score >= 3 ? 2 : 1;
    const SP = S();
    const starsHtml = Array.from({length: 3}, (_, i) =>
      SP.el(2, 0, 0, i < stars ? 36 : 24, i >= stars ? 'lsh-star-dim' : '')
    ).join(' ');
    const message = stars === 3 ? 'Xuất sắc! Kĩ sư hình học!' :
                    stars === 2 ? 'Tốt lắm! Bé nhận biết hình giỏi!' :
                    'Cố gắng thêm nhé!';

    // Shape palette
    const palette = SHAPES.slice(0, 5).map((sh, i) => sh.svg(28, SHAPE_COLORS[i])).join('');

    const body = getScreen().querySelector('.lsh-body');
    body.innerHTML = `
      <div class="lsh-reward">
        <div class="lsh-reward-stars">${starsHtml}</div>
        <h2 class="lsh-reward-title">${message}</h2>
        <div class="lsh-reward-palette">${palette}</div>
        <div class="lsh-reward-score">Đúng <strong>${state.score}</strong> / ${state.total} câu</div>
        <div class="lsh-reward-actions">
          <button class="lc-btn lc-btn-secondary" onclick="window._lessonShapes.restart()">Học lại</button>
          <button class="lc-btn lc-btn-primary" onclick="showScreen('menu-screen')">Về menu</button>
        </div>
      </div>
    `;
    if (window.HocVuiCollection && window.HocVuiCollection.reward) window.HocVuiCollection.reward(stars);
    updateProgress();
  }

  // ── Public API ──
  function restart() { state = { step: 0, score: 0, total: 0, round: 0, explored: 0 }; renderExplore(); }
  function open() { show(); restart(); }

  window._lessonShapes = {
    open, restart, speak,
    tapExplore, startMatch, answerMatch,
    tapPuzzle,
  };

  // ── Hook ──
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (typeof openTopic === 'function') {
        const _orig = openTopic;
        window.openTopic = function (topic) {
          if (topic === 'shapes0') { window._lessonShapes.open(); return; }
          _orig(topic);
        };
      }
    }, 0);
  });
})();
