// === Interactive "Đo Lường" (Measurement) Lesson for Grade 2 ===
// Hooks into openTopic('units'). 4-step CPA: Explore → Conversions → Practice (3 types) → Reward
(function () {
  'use strict';

  const S = () => window.HocVuiSprite;
  const N = () => window.HocVuiNumbers;
  function numHtml(n, sz) { return N() ? N().html(n, sz || 28) : `<span style="font-weight:900;font-size:${sz || 28}px;">${n}</span>`; }

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
    return `<button class="lc-speak-btn" onclick="window._lessonUnits2.speak('${text.replace(/'/g, "\\'")}')">`
      + '<img src="/img/sound-on.png" style="width:22px;height:22px;"></button>';
  }

  // ── State ──
  let state = { step: 0, tab: 'length', score: 0, total: 0, round: 0 };

  // ── Helpers ──
  function $(id) { return document.getElementById(id); }
  function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }
  function playSound(type) { if (window.HocVuiSound) window.HocVuiSound.play(type); }

  const PRAISE = ['Giỏi lắm!', 'Tuyệt vời!', 'Đúng rồi!', 'Hay quá!', 'Xuất sắc!'];
  const ENCOURAGE = ['Thử lại nhé!', 'Gần đúng rồi!', 'Cố lên!'];

  function getScreen() { return $('units2-interactive-screen'); }
  function show() { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); getScreen().classList.add('active'); }
  function updateProgress() {
    const bar = getScreen().querySelector('.lun2-progress-bar');
    if (bar) bar.style.width = ((state.step + 1) / 4 * 100) + '%';
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 0: Explore — Tabs: Độ dài / Khối lượng / Dung tích
  // ══════════════════════════════════════════════════════════════════
  function renderExplore() {
    state.step = 0; state.tab = 'length';
    const body = getScreen().querySelector('.lun2-body');
    body.innerHTML = `
      <div class="lun2-section">
        <p class="lun2-title">Khám phá Đo lường! ${speakerBtn('Khám phá các đơn vị đo lường')}</p>
        <div class="lun2-tabs">
          <button class="lun2-tab active" id="lun2-tab-length" onclick="window._lessonUnits2.switchTab('length')">📏 Độ dài</button>
          <button class="lun2-tab" id="lun2-tab-mass" onclick="window._lessonUnits2.switchTab('mass')">⚖️ Khối lượng</button>
          <button class="lun2-tab" id="lun2-tab-capacity" onclick="window._lessonUnits2.switchTab('capacity')">💧 Dung tích</button>
        </div>
        <div id="lun2-explore-content"></div>
        <div id="lun2-explore-next" style="margin-top:12px;">
          <button class="lc-btn lc-btn-primary" onclick="window._lessonUnits2.startStep1()">Tiếp tục!</button>
        </div>
      </div>`;
    renderLengthExplore();
    updateProgress();
  }

  function switchTab(tab) {
    state.tab = tab;
    ['length', 'mass', 'capacity'].forEach(t => {
      const el = $('lun2-tab-' + t);
      if (el) el.classList.toggle('active', t === tab);
    });
    if (tab === 'length') renderLengthExplore();
    else if (tab === 'mass') renderMassExplore();
    else renderCapacityExplore();
  }

  // ── Length: Interactive ruler ──
  let rulerLen = 12;
  function renderLengthExplore() {
    rulerLen = 12;
    const el = $('lun2-explore-content');
    el.innerHTML = `
      <p class="lun2-hint">Kéo bút chì trên thước để đo! Gốc đặt ở vạch 0.</p>
      <div class="lun2-ruler-wrap" id="lun2-ruler-wrap" style="width:320px;height:80px;">
        <div class="lun2-ruler-object" id="lun2-pencil" style="width:${rulerLen * 16}px;">✏️ Bút</div>
        <svg class="lun2-ruler-svg" width="320" height="44" viewBox="0 0 320 44">
          ${buildRulerSVG(20, 320)}
        </svg>
      </div>
      <div class="lun2-ruler-result" id="lun2-ruler-result">Bút chì dài ${numHtml(12, 32)} cm!</div>
      <p class="lun2-hint" style="margin-top:6px;">💡 1 cm ≈ chiều rộng ngón tay. 10 cm = 1 dm. 100 cm = 1 m.</p>`;
    setupRulerDrag();
  }

  function buildRulerSVG(maxCm, width) {
    const pxPerCm = (width - 8) / maxCm;
    let svg = `<rect x="0" y="20" width="${width}" height="24" fill="#fffde7" stroke="#bbb" stroke-width="1" rx="3"/>`;
    for (let i = 0; i <= maxCm; i++) {
      const x = 4 + i * pxPerCm;
      const h = i % 10 === 0 ? 18 : i % 5 === 0 ? 14 : 8;
      svg += `<line x1="${x}" y1="44" x2="${x}" y2="${44 - h}" stroke="#333" stroke-width="${i % 5 === 0 ? 1.5 : 0.8}"/>`;
      if (i % 5 === 0) svg += `<text x="${x}" y="16" text-anchor="middle" font-size="9" font-weight="700" fill="#333">${i}</text>`;
    }
    return svg;
  }

  function setupRulerDrag() {
    const wrap = $('lun2-ruler-wrap');
    const pencil = $('lun2-pencil');
    if (!wrap || !pencil) return;
    let dragging = false;
    const maxW = 312; // 20cm * 15.6px
    function onMove(e) {
      if (!dragging) return;
      e.preventDefault();
      const rect = wrap.getBoundingClientRect();
      const x = (e.clientX || (e.touches && e.touches[0].clientX) || 0) - rect.left;
      const w = Math.max(16, Math.min(maxW, x));
      pencil.style.width = w + 'px';
      rulerLen = Math.round(w / (312 / 20));
      const res = $('lun2-ruler-result');
      if (res) res.innerHTML = `Bút chì dài ${numHtml(rulerLen, 32)} cm!`;
    }
    pencil.addEventListener('mousedown', () => { dragging = true; });
    pencil.addEventListener('touchstart', () => { dragging = true; }, { passive: true });
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('mouseup', () => { dragging = false; });
    document.addEventListener('touchend', () => { dragging = false; });
  }

  // ── Mass: Scale with items ──
  let scaleKg = 0;
  const SCALE_ITEMS = [
    { name: '🍉 Dưa hấu', kg: 3 },
    { name: '🍎 Túi táo', kg: 1 },
    { name: '🍚 Túi gạo', kg: 5 },
    { name: '🧃 Hộp sữa', kg: 2 },
  ];

  function renderMassExplore() {
    scaleKg = 0;
    const el = $('lun2-explore-content');
    el.innerHTML = `
      <p class="lun2-hint">Kéo đồ vật lên cân để xem khối lượng!</p>
      <div class="lun2-scale-wrap">
        <svg class="lun2-scale-svg" width="220" height="175" viewBox="0 0 220 175" id="lun2-scale-svg">
          ${buildScaleSVG(0)}
        </svg>
        <div class="lun2-scale-result" id="lun2-scale-result">Chạm vật để đặt lên cân!</div>
      </div>
      <div class="lun2-scale-items" id="lun2-scale-items">
        ${SCALE_ITEMS.map((it, i) => `<button class="lun2-scale-item" id="lun2-si-${i}" onclick="window._lessonUnits2.placeOnScale(${i})">${it.name}</button>`).join('')}
      </div>
      <p class="lun2-hint">💡 1 kg ≈ 1 túi đường nhỏ.</p>`;
  }

  function buildScaleSVG(kg) {
    const needleAngle = -90 + (kg / 6) * 180; // 0-6kg range, needle from -90 to +90
    const cx = 110, cy = 80, r = 60;
    const rad = needleAngle * Math.PI / 180;
    const nx = cx + r * 0.7 * Math.cos(rad);
    const ny = cy + r * 0.7 * Math.sin(rad);
    let marks = '';
    for (let i = 0; i <= 6; i++) {
      const a = (-90 + i * 30) * Math.PI / 180;
      const mx = cx + r * Math.cos(a);
      const my = cy + r * Math.sin(a);
      const tx = cx + (r + 14) * Math.cos(a);
      const ty = cy + (r + 14) * Math.sin(a);
      marks += `<line x1="${cx + r * 0.85 * Math.cos(a)}" y1="${cy + r * 0.85 * Math.sin(a)}" x2="${mx}" y2="${my}" stroke="#333" stroke-width="2"/>`;
      marks += `<text x="${tx}" y="${ty}" text-anchor="middle" dominant-baseline="central" font-size="11" font-weight="700">${i}</text>`;
    }
    return `
      <ellipse cx="${cx}" cy="160" rx="50" ry="10" fill="#bbb"/>
      <rect x="${cx - 20}" y="148" width="40" height="14" fill="#888" rx="3"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" stroke="#333" stroke-width="3"/>
      <path d="M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}" fill="none" stroke="#eee" stroke-width="2"/>
      ${marks}
      <line x1="${cx}" y1="${cy}" x2="${nx}" y2="${ny}" stroke="#d32f2f" stroke-width="3" stroke-linecap="round"/>
      <circle cx="${cx}" cy="${cy}" r="5" fill="#333"/>
      <text x="${cx}" y="18" text-anchor="middle" font-size="10" font-weight="700" fill="#888">kg</text>`;
  }

  function placeOnScale(idx) {
    const item = SCALE_ITEMS[idx];
    const el = $('lun2-si-' + idx);
    if (el) el.classList.add('placed');
    scaleKg = item.kg;
    playSound('click');
    const svg = $('lun2-scale-svg');
    if (svg) svg.innerHTML = buildScaleSVG(scaleKg);
    const res = $('lun2-scale-result');
    if (res) res.innerHTML = `${item.name} nặng ${numHtml(scaleKg, 32)} kg!`;
    speak(`${item.name.replace(/^[^\s]+\s/, '')} nặng ${scaleKg} ki lô gam`);
  }

  // ── Capacity: Pour water into tank ──
  let tankLiters = 0, tankMax = 3;

  function renderCapacityExplore() {
    tankLiters = 0; tankMax = 3;
    const el = $('lun2-explore-content');
    el.innerHTML = `
      <p class="lun2-hint">Múc từng ca 1 lít đổ vào bể cá!</p>
      <div class="lun2-capacity-wrap">
        <div style="font-size:0.8rem;font-weight:700;color:#1565c0;margin-bottom:4px;">🐟 Bể cá (${tankMax} lít)</div>
        <div class="lun2-tank" id="lun2-tank">
          <div class="lun2-tank-water" id="lun2-water" style="height:0%;"></div>
          <div class="lun2-tank-label" id="lun2-tank-label">0 lít</div>
        </div>
        <button class="lun2-pour-btn" id="lun2-pour-btn" onclick="window._lessonUnits2.pourWater()">💧 Đổ 1 lít</button>
        <div class="lun2-capacity-result" id="lun2-cap-result"></div>
      </div>
      <p class="lun2-hint">💡 1 lít ≈ 1 chai nước khoáng lớn.</p>`;
  }

  function pourWater() {
    if (tankLiters >= tankMax) return;
    tankLiters++;
    playSound('click');
    const pct = (tankLiters / tankMax) * 100;
    const water = $('lun2-water');
    const label = $('lun2-tank-label');
    const btn = $('lun2-pour-btn');
    const res = $('lun2-cap-result');
    if (water) water.style.height = pct + '%';
    if (label) label.textContent = tankLiters + ' lít';
    speak(tankLiters + ' lít');
    if (tankLiters >= tankMax) {
      if (btn) btn.disabled = true;
      if (res) res.innerHTML = `Bể cá chứa được ${numHtml(tankMax, 32)} lít nước!`;
      speak(`Bể cá chứa được ${tankMax} lít nước`);
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 1: Conversions & Comparisons (Pictorial)
  // ══════════════════════════════════════════════════════════════════
  let convStep = 0;

  function startStep1() {
    state.step = 1; convStep = 0;
    renderConversion();
    updateProgress();
  }

  function renderConversion() {
    convStep++;
    if (convStep > 2) { startStep2(); return; }
    if (convStep === 1) renderBlockConversion();
    else renderCompare();
  }

  // Dạng 1: Ghép 10 khối 1cm = 1dm
  function renderBlockConversion() {
    let filled = 0;
    const body = getScreen().querySelector('.lun2-body');
    body.innerHTML = `
      <div class="lun2-section">
        <p class="lun2-title">Ghép đơn vị! ${speakerBtn('Mười xăng ti mét bằng một đề xi mét')}</p>
        <p class="lun2-hint">Chạm vào từng khối 1 cm để ghép thành 1 dm!</p>
        <div class="lun2-convert-visual" id="lun2-blocks">
          ${Array.from({length: 10}, (_, i) => `<div class="lun2-block" id="lun2-blk-${i}" onclick="window._lessonUnits2.tapBlock(${i})">cm</div>`).join('')}
        </div>
        <div class="lun2-convert-eq" id="lun2-conv-eq">? cm = 1 dm</div>
        <div class="lun2-feedback" id="lun2-fb"></div>
        <div id="lun2-conv-next"></div>
      </div>`;
    state._blocksFilled = 0;
    updateProgress();
  }

  function tapBlock(idx) {
    const el = $('lun2-blk-' + idx);
    if (!el || el.classList.contains('filled')) return;
    el.classList.add('filled');
    state._blocksFilled++;
    playSound('click');
    const eq = $('lun2-conv-eq');
    if (eq) eq.innerHTML = `${numHtml(state._blocksFilled, 24)} cm = ? dm`;
    if (state._blocksFilled >= 10) {
      if (eq) eq.innerHTML = `${numHtml(10, 28)} cm = ${numHtml(1, 28)} dm ✓`;
      speak('Mười xăng ti mét bằng một đề xi mét!');
      playSound('correct');
      const fb = $('lun2-fb');
      if (fb) fb.innerHTML = `<div class="lun2-fb-ok">10 cm = 1 dm. Tương tự: 100 cm = 1 m!</div>`;
      setTimeout(() => {
        const next = $('lun2-conv-next');
        if (next) next.innerHTML = `<button class="lc-btn lc-btn-primary" onclick="window._lessonUnits2.renderConversion()">Tiếp!</button>`;
      }, 800);
    }
  }

  // Dạng 2: Cân so sánh
  function renderCompare() {
    const left = randInt(1, 3);
    const right = randInt(left + 1, 5);
    const body = getScreen().querySelector('.lun2-body');
    body.innerHTML = `
      <div class="lun2-section">
        <p class="lun2-title">Bên nào nặng hơn? ${speakerBtn('Bên nào nặng hơn?')}</p>
        <svg class="lun2-compare-svg" width="260" height="140" viewBox="0 0 260 140">
          ${buildCompareSVG(left, right)}
        </svg>
        <p class="lun2-question">🍎 ${left} kg &nbsp; ◻ &nbsp; 🍊 ${right} kg</p>
        <div class="lun2-options">
          <button class="lun2-opt" onclick="window._lessonUnits2.answerCompare(0, 2)"> &lt; </button>
          <button class="lun2-opt" onclick="window._lessonUnits2.answerCompare(1, 2)"> = </button>
          <button class="lun2-opt" onclick="window._lessonUnits2.answerCompare(2, 2)"> &gt; </button>
        </div>
        <div class="lun2-feedback" id="lun2-fb"></div>
      </div>`;
    // correct is index 0 (<) since left < right
    updateProgress();
  }

  function buildCompareSVG(leftKg, rightKg) {
    // Simple balance beam
    const tilt = rightKg > leftKg ? 8 : rightKg < leftKg ? -8 : 0;
    return `
      <rect x="120" y="120" width="20" height="20" fill="#888" rx="3"/>
      <polygon points="130,60 125,120 135,120" fill="#aaa"/>
      <line x1="30" y1="${70 - tilt}" x2="230" y2="${70 + tilt}" stroke="#555" stroke-width="4" stroke-linecap="round"/>
      <rect x="15" y="${55 - tilt}" width="60" height="20" fill="#ffcc80" stroke="#e65100" stroke-width="2" rx="4"/>
      <text x="45" y="${68 - tilt}" text-anchor="middle" font-size="11" font-weight="700">${leftKg} kg</text>
      <rect x="185" y="${55 + tilt}" width="60" height="20" fill="#c8e6c9" stroke="#2e7d32" stroke-width="2" rx="4"/>
      <text x="215" y="${68 + tilt}" text-anchor="middle" font-size="11" font-weight="700">${rightKg} kg</text>`;
  }

  function answerCompare(picked, correct) {
    const opts = getScreen().querySelectorAll('.lun2-opt');
    opts.forEach((o, i) => { o.style.pointerEvents = 'none'; if (i === correct) o.classList.add('lun2-opt-correct'); if (i === picked && i !== correct) o.classList.add('lun2-opt-wrong'); });
    const fb = $('lun2-fb');
    if (picked === correct) { playSound('correct'); if (fb) fb.innerHTML = `<div class="lun2-fb-ok">${rand(PRAISE)}</div>`; }
    else { playSound('wrong'); if (fb) fb.innerHTML = `<div class="lun2-fb-wrong">${rand(ENCOURAGE)} Đáp án: &lt;</div>`; }
    setTimeout(() => renderConversion(), 1400);
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 2: Practice — 3 types (6 rounds)
  // Type 1 (rounds 1-2): Phép tính kèm đơn vị
  // Type 2 (rounds 3-4): Chọn đơn vị thích hợp
  // Type 3 (rounds 5-6): Bài toán có lời văn
  // ══════════════════════════════════════════════════════════════════
  let practiceRound = 0;

  function startStep2() {
    state.step = 2; practiceRound = 0; state.score = 0; state.total = 0;
    nextPractice();
    updateProgress();
  }

  function nextPractice() {
    practiceRound++;
    if (practiceRound > 6) { showReward(); return; }
    if (practiceRound <= 2) renderCalcUnit();
    else if (practiceRound <= 4) renderChooseUnit();
    else renderWordProblem();
    updateProgress();
  }

  // ── Type 1: Phép tính kèm đơn vị ──
  const CALC_PROBLEMS = [
    { a: 15, b: 20, op: '+', unit: 'cm', ans: 35 },
    { a: 45, b: 12, op: '-', unit: 'kg', ans: 33 },
    { a: 8, b: 5, op: '+', unit: 'l', ans: 13 },
    { a: 30, b: 10, op: '-', unit: 'cm', ans: 20 },
    { a: 24, b: 16, op: '+', unit: 'kg', ans: 40 },
    { a: 50, b: 25, op: '-', unit: 'cm', ans: 25 },
    { a: 3, b: 4, op: '+', unit: 'l', ans: 7 },
    { a: 100, b: 40, op: '-', unit: 'cm', ans: 60 },
  ];

  function renderCalcUnit() {
    const p = rand(CALC_PROBLEMS);
    state._calcAns = p.ans;
    state._calcUnit = p.unit;
    const unitName = p.unit === 'cm' ? 'xăng-ti-mét' : p.unit === 'kg' ? 'ki-lô-gam' : 'lít';
    getScreen().querySelector('.lun2-body').innerHTML = `
      <div class="lun2-section">
        <div class="lun2-header-row">
          <span class="lun2-round-badge">Câu ${practiceRound}/6</span>
          <span class="lun2-score-badge">${S() ? S().named('star', 16) : '⭐'} ${numHtml(state.score, 20)}</span>
        </div>
        <p class="lun2-question">${numHtml(p.a, 24)} ${p.unit} ${p.op === '+' ? '+' : '−'} ${numHtml(p.b, 24)} ${p.unit} = ? ${speakerBtn(`${p.a} ${unitName} ${p.op === '+' ? 'cộng' : 'trừ'} ${p.b} ${unitName} bằng bao nhiêu?`)}</p>
        <div class="lun2-input-row">
          <input class="lun2-input" id="lun2-ans-input" type="number" inputmode="numeric" placeholder="?">
          <span class="lun2-input-unit">${p.unit}</span>
          <button class="lun2-submit-btn" onclick="window._lessonUnits2.submitCalc()">OK</button>
        </div>
        <div class="lun2-feedback" id="lun2-fb"></div>
      </div>`;
  }

  function submitCalc() {
    const input = $('lun2-ans-input');
    if (!input) return;
    const val = parseInt(input.value, 10);
    if (isNaN(val)) return;
    state.total++;
    input.disabled = true;
    const btn = getScreen().querySelector('.lun2-submit-btn');
    if (btn) btn.disabled = true;
    const fb = $('lun2-fb');
    if (val === state._calcAns) {
      state.score++; playSound('correct');
      if (fb) fb.innerHTML = `<div class="lun2-fb-ok">${rand(PRAISE)} ${numHtml(state._calcAns, 24)} ${state._calcUnit}</div>`;
    } else {
      playSound('wrong');
      if (fb) fb.innerHTML = `<div class="lun2-fb-wrong">${rand(ENCOURAGE)} Đáp án: ${numHtml(state._calcAns, 24)} ${state._calcUnit}</div>`;
    }
    setTimeout(() => nextPractice(), 1500);
  }

  // ── Type 2: Chọn đơn vị thích hợp ──
  const UNIT_CHOICE = [
    { text: 'Tòa nhà cao 15 ...', correct: 'm', wrong: 'cm' },
    { text: 'Cục tẩy dài 3 ...', correct: 'cm', wrong: 'm' },
    { text: 'Hộp sữa chứa 1 ...', correct: 'l', wrong: 'kg' },
    { text: 'Bàn học dài 1 ...', correct: 'm', wrong: 'cm' },
    { text: 'Túi gạo nặng 5 ...', correct: 'kg', wrong: 'l' },
    { text: 'Chai nước chứa 2 ...', correct: 'l', wrong: 'kg' },
    { text: 'Quyển vở dày 1 ...', correct: 'cm', wrong: 'm' },
    { text: 'Em bé nặng 10 ...', correct: 'kg', wrong: 'l' },
    { text: 'Sợi dây dài 50 ...', correct: 'cm', wrong: 'kg' },
    { text: 'Xô nước chứa 5 ...', correct: 'l', wrong: 'cm' },
  ];

  function renderChooseUnit() {
    const q = rand(UNIT_CHOICE);
    const options = shuffle([q.correct, q.wrong]);
    const correctIdx = options.indexOf(q.correct);
    state._unitCorrectIdx = correctIdx;
    state._unitCorrectName = q.correct;

    getScreen().querySelector('.lun2-body').innerHTML = `
      <div class="lun2-section">
        <div class="lun2-header-row">
          <span class="lun2-round-badge">Câu ${practiceRound}/6</span>
          <span class="lun2-score-badge">${S() ? S().named('star', 16) : '⭐'} ${numHtml(state.score, 20)}</span>
        </div>
        <p class="lun2-question">Chọn đơn vị thích hợp: ${speakerBtn('Chọn đơn vị đo thích hợp')}</p>
        <p style="font-size:1.1rem;font-weight:800;color:#333;margin:10px 0;">${q.text} <span class="lun2-unit">[ ? ]</span></p>
        <div class="lun2-options">${options.map((o, i) => `
          <button class="lun2-opt" onclick="window._lessonUnits2.answerUnit(${i})">${o}</button>`).join('')}</div>
        <div class="lun2-feedback" id="lun2-fb"></div>
      </div>`;
  }

  function answerUnit(picked) {
    state.total++;
    const opts = getScreen().querySelectorAll('.lun2-opt');
    opts.forEach((o, i) => {
      o.style.pointerEvents = 'none';
      if (i === state._unitCorrectIdx) o.classList.add('lun2-opt-correct');
      if (i === picked && i !== state._unitCorrectIdx) o.classList.add('lun2-opt-wrong');
    });
    const fb = $('lun2-fb');
    if (picked === state._unitCorrectIdx) {
      state.score++; playSound('correct');
      if (fb) fb.innerHTML = `<div class="lun2-fb-ok">${rand(PRAISE)}</div>`;
    } else {
      playSound('wrong');
      if (fb) fb.innerHTML = `<div class="lun2-fb-wrong">${rand(ENCOURAGE)} Đáp án: ${state._unitCorrectName}</div>`;
    }
    setTimeout(() => nextPractice(), 1400);
  }

  // ── Type 3: Bài toán có lời văn ──
  const WORD_PROBLEMS = [
    { text: 'Cuộn dây xanh dài 35 m, cuộn dây đỏ ngắn hơn cuộn xanh 10 m. Hỏi cuộn dây đỏ dài bao nhiêu mét?', ans: 25, unit: 'm', hint: '35 − 10 = ?' },
    { text: 'Túi cam nặng 3 kg, túi táo nặng 2 kg. Hỏi cả hai túi nặng bao nhiêu ki-lô-gam?', ans: 5, unit: 'kg', hint: '3 + 2 = ?' },
    { text: 'Can nước có 8 lít, đổ ra 3 lít. Hỏi can còn lại bao nhiêu lít?', ans: 5, unit: 'l', hint: '8 − 3 = ?' },
    { text: 'Sợi dây dài 40 cm, cắt bớt 15 cm. Hỏi sợi dây còn lại bao nhiêu xăng-ti-mét?', ans: 25, unit: 'cm', hint: '40 − 15 = ?' },
    { text: 'Bình A chứa 4 lít, bình B chứa nhiều hơn bình A 2 lít. Hỏi bình B chứa bao nhiêu lít?', ans: 6, unit: 'l', hint: '4 + 2 = ?' },
    { text: 'Bao gạo nặng 10 kg, lấy ra 4 kg. Hỏi bao gạo còn bao nhiêu ki-lô-gam?', ans: 6, unit: 'kg', hint: '10 − 4 = ?' },
  ];

  function renderWordProblem() {
    const p = rand(WORD_PROBLEMS);
    state._wpAns = p.ans;
    state._wpUnit = p.unit;

    getScreen().querySelector('.lun2-body').innerHTML = `
      <div class="lun2-section">
        <div class="lun2-header-row">
          <span class="lun2-round-badge">Câu ${practiceRound}/6</span>
          <span class="lun2-score-badge">${S() ? S().named('star', 16) : '⭐'} ${numHtml(state.score, 20)}</span>
        </div>
        <p class="lun2-question">Giải bài toán: ${speakerBtn(p.text)}</p>
        <div class="lun2-word-problem">${p.text}</div>
        <p class="lun2-hint">Gợi ý: ${p.hint}</p>
        <div class="lun2-input-row">
          <input class="lun2-input" id="lun2-wp-input" type="number" inputmode="numeric" placeholder="?">
          <span class="lun2-input-unit">${p.unit}</span>
          <button class="lun2-submit-btn" onclick="window._lessonUnits2.submitWP()">OK</button>
        </div>
        <div class="lun2-feedback" id="lun2-fb"></div>
      </div>`;
  }

  function submitWP() {
    const input = $('lun2-wp-input');
    if (!input) return;
    const val = parseInt(input.value, 10);
    if (isNaN(val)) return;
    state.total++;
    input.disabled = true;
    const btn = getScreen().querySelector('.lun2-submit-btn');
    if (btn) btn.disabled = true;
    const fb = $('lun2-fb');
    if (val === state._wpAns) {
      state.score++; playSound('correct');
      if (fb) fb.innerHTML = `<div class="lun2-fb-ok">${rand(PRAISE)} ${numHtml(state._wpAns, 24)} ${state._wpUnit}</div>`;
    } else {
      playSound('wrong');
      if (fb) fb.innerHTML = `<div class="lun2-fb-wrong">${rand(ENCOURAGE)} Đáp án: ${numHtml(state._wpAns, 24)} ${state._wpUnit}</div>`;
    }
    setTimeout(() => nextPractice(), 1500);
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 3: Reward
  // ══════════════════════════════════════════════════════════════════
  function showReward() {
    state.step = 3; playSound('win');
    const stars = state.score >= 5 ? 3 : state.score >= 3 ? 2 : 1;
    const starsHtml = Array.from({ length: 3 }, (_, i) =>
      S() ? S().el(2, 0, 0, i < stars ? 36 : 24, i >= stars ? 'lun2-star-dim' : '') : (i < stars ? '⭐' : '☆')
    ).join(' ');
    const msg = stars === 3 ? 'Xuất sắc! Kỹ sư Đo lường Tài ba!' : stars === 2 ? 'Tốt lắm! Gần thành kỹ sư rồi!' : 'Cố gắng thêm nhé!';
    speak(msg);

    getScreen().querySelector('.lun2-body').innerHTML = `
      <div class="lun2-reward">
        <div class="lun2-reward-stars">${starsHtml}</div>
        <h2 class="lun2-reward-title">${msg}</h2>
        <div class="lun2-reward-score">Đúng ${numHtml(state.score, 32)} / ${numHtml(state.total, 32)} câu</div>
        <div class="lun2-reward-concepts">
          <div class="lun2-concept">1 dm = 10 cm, 1 m = 100 cm</div>
          <div class="lun2-concept">1 kg ≈ 1 túi đường nhỏ</div>
          <div class="lun2-concept">1 lít ≈ 1 chai nước lớn</div>
          <div class="lun2-concept">Luôn giữ đơn vị ở kết quả!</div>
        </div>
        <div class="lun2-reward-actions">
          <button class="lc-btn lc-btn-secondary" onclick="window._lessonUnits2.restart()">Học lại</button>
          <button class="lc-btn lc-btn-primary" onclick="showScreen('menu-screen')">Về menu</button>
        </div>
      </div>`;
    if (window.HocVuiCollection && window.HocVuiCollection.reward) window.HocVuiCollection.reward(stars);
    updateProgress();
  }

  // ── Entry / restart ──
  function restart() {
    state = { step: 0, tab: 'length', score: 0, total: 0, round: 0 };
    practiceRound = 0; convStep = 0;
    renderExplore();
  }
  function open() { show(); restart(); }

  // ── Public API ──
  window._lessonUnits2 = { open, restart, speak, switchTab, placeOnScale, pourWater, tapBlock, renderConversion, answerCompare, startStep1, startStep2, submitCalc, answerUnit, submitWP };

  // ── Hook into openTopic ──
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (typeof openTopic === 'function') {
        const _o = openTopic;
        window.openTopic = function (t) {
          if (t === 'units') { window._lessonUnits2.open(); return; }
          _o(t);
        };
      }
    }, 0);
  });
})();
