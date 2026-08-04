// === Interactive "Hình Khối" (Shapes) Lesson for Grade 1 ===
// Hooks into openTopic('shapes1'). 4-step CPA: Explore → Distinguish 2D/3D → Practice → Reward
(function () {
  'use strict';

  const S = () => window.HocVuiSprite;
  const N = () => window.HocVuiNumbers;
  function numHtml(n, sz) { return N() ? N().html(n, sz || 28) : `<span style="font-weight:900;font-size:${sz || 28}px;">${n}</span>`; }

  // ── Shape data: 2D shapes from shapes-2d.png (3×3 grid, cell ~166.7px) ──
  const SHAPES_2D = [
    { id: 'square',    name: 'Hình vuông',     desc: '4 cạnh bằng nhau, 4 góc vuông', row: 0, col: 0 },
    { id: 'rectangle', name: 'Hình chữ nhật',  desc: '2 cạnh dài, 2 cạnh ngắn, 4 góc vuông', row: 0, col: 1 },
    { id: 'triangle',  name: 'Hình tam giác',  desc: '3 cạnh, 3 góc', row: 0, col: 2 },
    { id: 'circle',    name: 'Hình tròn',      desc: 'Không có cạnh, không có góc', row: 1, col: 0 },
    { id: 'ellipse',   name: 'Hình elip',      desc: 'Giống hình tròn bị kéo dài', row: 1, col: 1 },
    { id: 'semicircle',name: 'Hình bán nguyệt',desc: 'Nửa hình tròn', row: 1, col: 2 },
    { id: 'heart',     name: 'Hình trái tim',  desc: 'Biểu tượng tình yêu', row: 2, col: 0 },
    { id: 'diamond',   name: 'Hình thoi',      desc: '4 cạnh bằng nhau, nghiêng', row: 2, col: 1 },
    { id: 'star',      name: 'Hình ngôi sao',  desc: '5 cánh nhọn', row: 2, col: 2 },
  ];

  // ── 3D shapes from shapes-3d.png (2×2 grid, cell 250px) ──
  const SHAPES_3D = [
    { id: 'cube',     name: 'Khối lập phương', desc: '6 mặt vuông, chồng được, không lăn', row: 0, col: 0, canRoll: false, canStack: true, face: 'square' },
    { id: 'cuboid',   name: 'Khối hộp chữ nhật', desc: '6 mặt chữ nhật, chồng được, không lăn', row: 0, col: 1, canRoll: false, canStack: true, face: 'rectangle' },
    { id: 'sphere',   name: 'Khối cầu',       desc: 'Tròn đều, lăn được mọi hướng, không chồng', row: 1, col: 0, canRoll: true, canStack: false, face: 'circle' },
    { id: 'cylinder', name: 'Khối trụ',       desc: 'Mặt tròn + thân cong, lăn được, chồng đứng được', row: 1, col: 1, canRoll: true, canStack: true, face: 'circle' },
  ];

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
    return `<button class="lc-speak-btn" onclick="window._lessonShapes1.speak('${text.replace(/'/g, "\\'")}')">`
      + '<img src="/img/sound-on.png" style="width:22px;height:22px;"></button>';
  }

  // ── State ──
  let state = { step: 0, tab: '2d', score: 0, total: 0, round: 0, explored2d: 0, explored3d: 0 };

  // ── Helpers ──
  function $(id) { return document.getElementById(id); }
  function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }
  function playSound(type) { if (window.HocVuiSound) window.HocVuiSound.play(type); }

  const PRAISE = ['Giỏi lắm!', 'Tuyệt vời!', 'Đúng rồi!', 'Hay quá!', 'Xuất sắc!'];
  const ENCOURAGE = ['Thử lại nhé!', 'Gần đúng rồi!', 'Cố lên!'];

  function getScreen() { return $('shapes1-interactive-screen'); }
  function show() { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); getScreen().classList.add('active'); }
  function updateProgress() {
    const bar = getScreen().querySelector('.lsh1-progress-bar');
    if (bar) bar.style.width = ((state.step + 1) / 4 * 100) + '%';
  }

  // ── Sprite rendering helpers ──
  function sprite2d(shape, size) {
    const cellW = 166.67, cellH = 166.67;
    const scale = size / cellW;
    return `<span class="lsh1-shape-sprite" style="width:${size}px;height:${size}px;background-image:url('/img/shapes-2d.png');background-size:${500 * scale}px ${500 * scale}px;background-position:-${shape.col * cellW * scale}px -${shape.row * cellH * scale}px;"></span>`;
  }
  function sprite3d(shape, size) {
    const cellW = 250, cellH = 250;
    const scale = size / cellW;
    return `<span class="lsh1-shape-sprite" style="width:${size}px;height:${size}px;background-image:url('/img/shapes-3d.png');background-size:${500 * scale}px ${500 * scale}px;background-position:-${shape.col * cellW * scale}px -${shape.row * cellH * scale}px;"></span>`;
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 0: Explore — Tab 2D / Tab 3D, tap to learn
  // ══════════════════════════════════════════════════════════════════
  function renderExplore() {
    state.step = 0;
    state.explored2d = 0;
    state.explored3d = 0;
    state.tab = '2d';
    const body = getScreen().querySelector('.lsh1-body');
    body.innerHTML = `
      <div class="lsh1-explore">
        <p class="lsh1-title">Khám phá các hình! ${speakerBtn('Chạm vào hình để khám phá')}</p>
        <div class="lsh1-tabs">
          <button class="lsh1-tab active" id="lsh1-tab-2d" onclick="window._lessonShapes1.switchTab('2d')">Hình phẳng 2D</button>
          <button class="lsh1-tab" id="lsh1-tab-3d" onclick="window._lessonShapes1.switchTab('3d')">Hình khối 3D</button>
        </div>
        <div id="lsh1-explore-content"></div>
        <div class="lsh1-info-bubble" id="lsh1-info" style="display:none;"></div>
        <div id="lsh1-explore-next" style="margin-top:12px;"></div>
      </div>`;
    renderTab2d();
    updateProgress();
  }

  function switchTab(tab) {
    state.tab = tab;
    $('lsh1-tab-2d').classList.toggle('active', tab === '2d');
    $('lsh1-tab-3d').classList.toggle('active', tab === '3d');
    if (tab === '2d') renderTab2d(); else renderTab3d();
    const info = $('lsh1-info');
    if (info) info.style.display = 'none';
    checkExploreComplete();
  }

  function renderTab2d() {
    const el = $('lsh1-explore-content');
    el.innerHTML = `<div class="lsh1-grid-2d">${SHAPES_2D.map((sh, i) => `
      <div class="lsh1-shape-card ${state['_exp2d_' + i] ? 'explored' : ''}" id="lsh1-c2d-${i}" onclick="window._lessonShapes1.tap2d(${i})">
        ${sprite2d(sh, 56)}
        <span class="lsh1-shape-name" id="lsh1-n2d-${i}">${state['_exp2d_' + i] ? sh.name : '?'}</span>
      </div>`).join('')}</div>`;
  }

  function renderTab3d() {
    const el = $('lsh1-explore-content');
    el.innerHTML = `<div class="lsh1-grid-3d">${SHAPES_3D.map((sh, i) => `
      <div class="lsh1-shape-card ${state['_exp3d_' + i] ? 'explored' : ''}" id="lsh1-c3d-${i}" onclick="window._lessonShapes1.tap3d(${i})">
        ${sprite3d(sh, 70)}
        <span class="lsh1-shape-name" id="lsh1-n3d-${i}">${state['_exp3d_' + i] ? sh.name : '?'}</span>
      </div>`).join('')}</div>`;
  }

  function tap2d(idx) {
    if (state['_exp2d_' + idx]) return;
    state['_exp2d_' + idx] = true;
    state.explored2d++;
    const sh = SHAPES_2D[idx];
    const card = $('lsh1-c2d-' + idx);
    const nameEl = $('lsh1-n2d-' + idx);
    if (card) card.classList.add('explored');
    if (nameEl) { nameEl.textContent = sh.name; nameEl.style.color = '#5c6bc0'; }
    speak(sh.name + '. ' + sh.desc);
    playSound('click');
    const info = $('lsh1-info');
    if (info) { info.style.display = 'block'; info.innerHTML = `<strong>${sh.name}</strong>: ${sh.desc}`; }
    checkExploreComplete();
  }

  function tap3d(idx) {
    if (state['_exp3d_' + idx]) return;
    state['_exp3d_' + idx] = true;
    state.explored3d++;
    const sh = SHAPES_3D[idx];
    const card = $('lsh1-c3d-' + idx);
    const nameEl = $('lsh1-n3d-' + idx);
    if (card) card.classList.add('explored');
    if (nameEl) { nameEl.textContent = sh.name; nameEl.style.color = '#5c6bc0'; }
    const rollText = sh.canRoll ? 'Lăn được.' : 'Không lăn được.';
    const stackText = sh.canStack ? 'Chồng lên nhau được.' : 'Không chồng được.';
    speak(sh.name + '. ' + sh.desc + '. ' + rollText + ' ' + stackText);
    playSound('click');
    const info = $('lsh1-info');
    if (info) { info.style.display = 'block'; info.innerHTML = `<strong>${sh.name}</strong>: ${sh.desc}<br><span style="color:#666;font-size:0.82rem">${rollText} ${stackText}</span>`; }
    checkExploreComplete();
  }

  function checkExploreComplete() {
    if (state.explored2d >= SHAPES_2D.length && state.explored3d >= SHAPES_3D.length) {
      setTimeout(() => {
        const next = $('lsh1-explore-next');
        if (next && !next.innerHTML) next.innerHTML = `<button class="lc-btn lc-btn-primary" onclick="window._lessonShapes1.startStep1()">Tiếp tục!</button>`;
      }, 400);
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 1: Distinguish 2D vs 3D
  // Type 1: Match face to solid (drag 2D shape → 3D solid)
  // Type 2: Classify real objects → correct 3D solid
  // ══════════════════════════════════════════════════════════════════
  const REAL_OBJECTS = [
    { name: 'Quả bóng', emoji: '⚽', solid: 'sphere' },
    { name: 'Lon nước', emoji: '🥫', solid: 'cylinder' },
    { name: 'Hộp quà', emoji: '🎁', solid: 'cube' },
    { name: 'Hộp sữa', emoji: '🧃', solid: 'cuboid' },
    { name: 'Quả cam', emoji: '🍊', solid: 'sphere' },
    { name: 'Cục tẩy', emoji: '🧱', solid: 'cuboid' },
    { name: 'Viên bi', emoji: '🔮', solid: 'sphere' },
    { name: 'Ống nước', emoji: '🧴', solid: 'cylinder' },
    { name: 'Xúc xắc', emoji: '🎲', solid: 'cube' },
    { name: 'Trái đất', emoji: '🌍', solid: 'sphere' },
  ];

  let step1Round = 0;
  function startStep1() {
    state.step = 1; step1Round = 0; state.score = 0; state.total = 0;
    nextStep1();
  }

  function nextStep1() {
    step1Round++;
    if (step1Round > 4) { startStep2(); return; }
    if (step1Round <= 2) renderFaceMatch();
    else renderClassify();
    updateProgress();
  }

  // Type 1: Tap the correct 2D face for a given 3D solid
  function renderFaceMatch() {
    const solid = rand(SHAPES_3D);
    // Get correct face shape
    const correctFace = SHAPES_2D.find(s => s.id === solid.face);
    // Pick 2 wrong faces
    const wrongs = shuffle(SHAPES_2D.filter(s => s.id !== solid.face)).slice(0, 2);
    const options = shuffle([correctFace, ...wrongs]);
    const correctIdx = options.indexOf(correctFace);

    getScreen().querySelector('.lsh1-body').innerHTML = `
      <div class="lsh1-practice">
        <div class="lsh1-header-row">
          <span class="lsh1-round-badge">Bước 1 - Câu ${step1Round}/4</span>
          <span class="lsh1-score-badge">${S() ? S().named('star', 16) : '⭐'} ${numHtml(state.score, 20)}</span>
        </div>
        <p class="lsh1-question">Mặt của ${solid.name} là hình gì? ${speakerBtn('Mặt của ' + solid.name + ' là hình gì?')}</p>
        <div style="margin:10px 0;">${sprite3d(solid, 80)}</div>
        <div class="lsh1-options">${options.map((o, i) => `
          <button class="lsh1-opt" onclick="window._lessonShapes1.answerStep1(${i},${correctIdx},'${correctFace.name}')">
            ${sprite2d(o, 40)} <span style="font-size:0.8rem;font-weight:700;">${o.name}</span>
          </button>`).join('')}</div>
        <div class="lsh1-feedback" id="lsh1-fb"></div>
      </div>`;
  }

  // Type 2: Classify real-world object → which 3D solid?
  function renderClassify() {
    const obj = rand(REAL_OBJECTS);
    const correctSolid = SHAPES_3D.find(s => s.id === obj.solid);
    const wrongs = shuffle(SHAPES_3D.filter(s => s.id !== obj.solid)).slice(0, 2);
    const options = shuffle([correctSolid, ...wrongs]);
    const correctIdx = options.indexOf(correctSolid);

    getScreen().querySelector('.lsh1-body').innerHTML = `
      <div class="lsh1-practice">
        <div class="lsh1-header-row">
          <span class="lsh1-round-badge">Bước 1 - Câu ${step1Round}/4</span>
          <span class="lsh1-score-badge">${S() ? S().named('star', 16) : '⭐'} ${numHtml(state.score, 20)}</span>
        </div>
        <p class="lsh1-question">${obj.emoji} ${obj.name} giống khối nào? ${speakerBtn(obj.name + ' giống khối nào?')}</p>
        <div class="lsh1-options">${options.map((o, i) => `
          <button class="lsh1-opt" onclick="window._lessonShapes1.answerStep1(${i},${correctIdx},'${correctSolid.name}')">
            ${sprite3d(o, 50)} <span style="font-size:0.8rem;font-weight:700;">${o.name}</span>
          </button>`).join('')}</div>
        <div class="lsh1-feedback" id="lsh1-fb"></div>
      </div>`;
  }

  function answerStep1(picked, correctIdx, correctName) {
    state.total++;
    const opts = getScreen().querySelectorAll('.lsh1-opt');
    opts.forEach((o, i) => {
      o.style.pointerEvents = 'none';
      if (i === correctIdx) o.classList.add('lsh1-opt-correct');
      if (i === picked && i !== correctIdx) o.classList.add('lsh1-opt-wrong');
    });
    const fb = $('lsh1-fb');
    if (picked === correctIdx) {
      state.score++; playSound('correct');
      if (fb) fb.innerHTML = `<div class="lsh1-fb-ok">${rand(PRAISE)}</div>`;
    } else {
      playSound('wrong');
      if (fb) fb.innerHTML = `<div class="lsh1-fb-wrong">${rand(ENCOURAGE)} Đáp án: ${correctName}</div>`;
    }
    setTimeout(() => nextStep1(), 1400);
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 2: Practice — 3 types (6 rounds)
  // Type 1: "Khối nào lăn được?" (multi-select)
  // Type 2: "Khối nào chồng được?" (multi-select)
  // Type 3: "Đây là hình hay khối?" (single choice)
  // ══════════════════════════════════════════════════════════════════
  let step2Round = 0;
  function startStep2() {
    state.step = 2; step2Round = 0;
    nextStep2();
  }

  function nextStep2() {
    step2Round++;
    if (step2Round > 6) { showReward(); return; }
    if (step2Round <= 2) renderRollQuestion();
    else if (step2Round <= 4) renderStackQuestion();
    else renderFlatOrSolid();
    updateProgress();
  }

  // Type 1: Which can roll?
  function renderRollQuestion() {
    const allShapes = shuffle([...SHAPES_3D]);
    const correctIds = allShapes.filter(s => s.canRoll).map(s => s.id);
    state._multiCorrect = correctIds;
    state._multiSelected = [];

    getScreen().querySelector('.lsh1-body').innerHTML = `
      <div class="lsh1-practice">
        <div class="lsh1-header-row">
          <span class="lsh1-round-badge">Câu ${step2Round}/6</span>
          <span class="lsh1-score-badge">${S() ? S().named('star', 16) : '⭐'} ${numHtml(state.score, 20)}</span>
        </div>
        <p class="lsh1-question">Khối nào LĂN được? ${speakerBtn('Khối nào lăn được? Chọn tất cả đáp án đúng')}</p>
        <p class="lsh1-hint">Chọn tất cả đáp án đúng</p>
        <div class="lsh1-multi-opts" id="lsh1-multi">${allShapes.map((s, i) => `
          <button class="lsh1-multi-opt" id="lsh1-mo-${i}" data-id="${s.id}" onclick="window._lessonShapes1.toggleMulti(${i},'${s.id}')">
            ${sprite3d(s, 50)}
            <span class="lsh1-multi-opt-label">${s.name}</span>
          </button>`).join('')}</div>
        <button class="lsh1-submit-btn" id="lsh1-submit" onclick="window._lessonShapes1.submitMulti()">Kiểm tra</button>
        <div class="lsh1-feedback" id="lsh1-fb"></div>
      </div>`;
  }

  // Type 2: Which can stack?
  function renderStackQuestion() {
    const allShapes = shuffle([...SHAPES_3D]);
    const correctIds = allShapes.filter(s => s.canStack).map(s => s.id);
    state._multiCorrect = correctIds;
    state._multiSelected = [];

    getScreen().querySelector('.lsh1-body').innerHTML = `
      <div class="lsh1-practice">
        <div class="lsh1-header-row">
          <span class="lsh1-round-badge">Câu ${step2Round}/6</span>
          <span class="lsh1-score-badge">${S() ? S().named('star', 16) : '⭐'} ${numHtml(state.score, 20)}</span>
        </div>
        <p class="lsh1-question">Khối nào CHỒNG lên nhau được? ${speakerBtn('Khối nào chồng lên nhau được?')}</p>
        <p class="lsh1-hint">Chọn tất cả đáp án đúng</p>
        <div class="lsh1-multi-opts" id="lsh1-multi">${allShapes.map((s, i) => `
          <button class="lsh1-multi-opt" id="lsh1-mo-${i}" data-id="${s.id}" onclick="window._lessonShapes1.toggleMulti(${i},'${s.id}')">
            ${sprite3d(s, 50)}
            <span class="lsh1-multi-opt-label">${s.name}</span>
          </button>`).join('')}</div>
        <button class="lsh1-submit-btn" id="lsh1-submit" onclick="window._lessonShapes1.submitMulti()">Kiểm tra</button>
        <div class="lsh1-feedback" id="lsh1-fb"></div>
      </div>`;
  }

  function toggleMulti(idx, id) {
    const el = $('lsh1-mo-' + idx);
    if (!el) return;
    const sIdx = state._multiSelected.indexOf(id);
    if (sIdx >= 0) { state._multiSelected.splice(sIdx, 1); el.classList.remove('selected'); }
    else { state._multiSelected.push(id); el.classList.add('selected'); }
    playSound('click');
  }

  function submitMulti() {
    if (state._multiSelected.length === 0) return;
    state.total++;
    const btn = $('lsh1-submit');
    if (btn) btn.disabled = true;
    const correct = state._multiCorrect;
    const selected = state._multiSelected;
    // Check if selection matches exactly
    const isCorrect = correct.length === selected.length && correct.every(c => selected.includes(c));
    // Highlight
    const allOpts = getScreen().querySelectorAll('.lsh1-multi-opt');
    allOpts.forEach(o => {
      o.style.pointerEvents = 'none';
      const id = o.dataset.id;
      if (correct.includes(id)) o.classList.add('correct');
      else if (selected.includes(id)) o.classList.add('wrong');
    });
    const fb = $('lsh1-fb');
    if (isCorrect) {
      state.score++; playSound('correct');
      if (fb) fb.innerHTML = `<div class="lsh1-fb-ok">${rand(PRAISE)}</div>`;
    } else {
      playSound('wrong');
      const names = correct.map(c => SHAPES_3D.find(s => s.id === c).name).join(', ');
      if (fb) fb.innerHTML = `<div class="lsh1-fb-wrong">${rand(ENCOURAGE)} Đáp án: ${names}</div>`;
    }
    setTimeout(() => nextStep2(), 1600);
  }

  // Type 3: Is this a 2D shape or a 3D solid?
  function renderFlatOrSolid() {
    const is3D = Math.random() > 0.5;
    let shape, spriteHtml;
    if (is3D) {
      shape = rand(SHAPES_3D);
      spriteHtml = sprite3d(shape, 80);
    } else {
      shape = rand(SHAPES_2D);
      spriteHtml = sprite2d(shape, 80);
    }
    const correctAnswer = is3D ? 'khối' : 'hình';
    const options = shuffle([
      { label: 'Hình phẳng (2D)', value: 'hình' },
      { label: 'Hình khối (3D)', value: 'khối' },
    ]);
    const correctIdx = options.findIndex(o => o.value === correctAnswer);

    getScreen().querySelector('.lsh1-body').innerHTML = `
      <div class="lsh1-practice">
        <div class="lsh1-header-row">
          <span class="lsh1-round-badge">Câu ${step2Round}/6</span>
          <span class="lsh1-score-badge">${S() ? S().named('star', 16) : '⭐'} ${numHtml(state.score, 20)}</span>
        </div>
        <p class="lsh1-question">Đây là HÌNH hay KHỐI? ${speakerBtn('Đây là hình phẳng hay hình khối?')}</p>
        <div style="margin:10px 0;">${spriteHtml}</div>
        <p style="font-weight:700;color:#555;margin-bottom:8px;">${shape.name}</p>
        <div class="lsh1-options">${options.map((o, i) => `
          <button class="lsh1-opt" onclick="window._lessonShapes1.answerFlat(${i},${correctIdx},'${correctAnswer}')">
            <span style="font-size:0.9rem;font-weight:700;">${o.label}</span>
          </button>`).join('')}</div>
        <div class="lsh1-feedback" id="lsh1-fb"></div>
      </div>`;
  }

  function answerFlat(picked, correctIdx, correctAnswer) {
    state.total++;
    const opts = getScreen().querySelectorAll('.lsh1-opt');
    opts.forEach((o, i) => {
      o.style.pointerEvents = 'none';
      if (i === correctIdx) o.classList.add('lsh1-opt-correct');
      if (i === picked && i !== correctIdx) o.classList.add('lsh1-opt-wrong');
    });
    const fb = $('lsh1-fb');
    if (picked === correctIdx) {
      state.score++; playSound('correct');
      if (fb) fb.innerHTML = `<div class="lsh1-fb-ok">${rand(PRAISE)}</div>`;
    } else {
      playSound('wrong');
      const msg = correctAnswer === 'khối' ? 'Đây là hình khối 3D!' : 'Đây là hình phẳng 2D!';
      if (fb) fb.innerHTML = `<div class="lsh1-fb-wrong">${rand(ENCOURAGE)} ${msg}</div>`;
    }
    setTimeout(() => nextStep2(), 1400);
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 3: Reward
  // ══════════════════════════════════════════════════════════════════
  function showReward() {
    state.step = 3; playSound('win');
    const stars = state.score >= 8 ? 3 : state.score >= 5 ? 2 : 1;
    const starsHtml = Array.from({ length: 3 }, (_, i) =>
      S() ? S().el(2, 0, 0, i < stars ? 36 : 24, i >= stars ? 'lsh1-star-dim' : '') : (i < stars ? '⭐' : '☆')
    ).join(' ');
    const msg = stars === 3 ? 'Xuất sắc! Bậc thầy Hình học!' : stars === 2 ? 'Tốt lắm! Giỏi hình khối!' : 'Cố gắng thêm nhé!';
    speak(msg);

    getScreen().querySelector('.lsh1-body').innerHTML = `
      <div class="lsh1-reward">
        <div class="lsh1-reward-stars">${starsHtml}</div>
        <h2 class="lsh1-reward-title">${msg}</h2>
        <div class="lsh1-reward-score">Đúng ${numHtml(state.score, 32)} / ${numHtml(state.total, 32)} câu</div>
        <div class="lsh1-reward-concepts">
          <div class="lsh1-concept">Hình phẳng 2D: vuông, tròn, tam giác...</div>
          <div class="lsh1-concept">Hình khối 3D: lập phương, cầu, trụ...</div>
          <div class="lsh1-concept">Khối cầu & trụ lăn được</div>
          <div class="lsh1-concept">Khối lập phương & hộp CN chồng được</div>
        </div>
        <div class="lsh1-reward-actions">
          <button class="lc-btn lc-btn-secondary" onclick="window._lessonShapes1.restart()">Học lại</button>
          <button class="lc-btn lc-btn-primary" onclick="showScreen('menu-screen')">Về menu</button>
        </div>
      </div>`;
    if (window.HocVuiCollection && window.HocVuiCollection.reward) window.HocVuiCollection.reward(stars);
    updateProgress();
  }

  // ── Entry / restart ──
  function restart() {
    state = { step: 0, tab: '2d', score: 0, total: 0, round: 0, explored2d: 0, explored3d: 0 };
    step1Round = 0; step2Round = 0;
    renderExplore();
  }
  function open() { show(); restart(); }

  // ── Public API ──
  window._lessonShapes1 = { open, restart, speak, switchTab, tap2d, tap3d, startStep1, answerStep1, toggleMulti, submitMulti, answerFlat };

  // ── Hook into openTopic ──
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (typeof openTopic === 'function') {
        const _o = openTopic;
        window.openTopic = function (t) {
          if (t === 'shapes1') { window._lessonShapes1.open(); return; }
          _o(t);
        };
      }
    }, 0);
  });
})();
