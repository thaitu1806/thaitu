// === Interactive "Cộng Có Nhớ" (Carry Addition) Lesson for Grade 2 ===
// Hooks into openTopic('carry'). 4-step CPA: Explore blocks → Column technique → Practice (3 types) → Reward
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
    return `<button class="lc-speak-btn" onclick="window._lessonCarry2.speak('${text.replace(/'/g, "\\'")}')">`
      + '<img src="/img/sound-on.png" style="width:22px;height:22px;"></button>';
  }

  // ── State ──
  let state = { step: 0, score: 0, total: 0, round: 0 };

  // ── Helpers ──
  function $(id) { return document.getElementById(id); }
  function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }
  function playSound(type) { if (window.HocVuiSound) window.HocVuiSound.play(type); }

  const PRAISE = ['Giỏi lắm!', 'Tuyệt vời!', 'Đúng rồi!', 'Hay quá!', 'Xuất sắc!'];
  const ENCOURAGE = ['Thử lại nhé!', 'Gần đúng rồi!', 'Cố lên!'];

  function getScreen() { return $('carry2-interactive-screen'); }
  function show() { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); getScreen().classList.add('active'); }
  function updateProgress() {
    const bar = getScreen().querySelector('.lca2-progress-bar');
    if (bar) bar.style.width = ((state.step + 1) / 4 * 100) + '%';
  }

  // ── Generate carry addition problems ──
  function genCarryProblem() {
    // Ensure units sum >= 10 (carry required)
    let a, b;
    do {
      a = randInt(15, 68);
      b = randInt(5, 49);
    } while ((a % 10) + (b % 10) < 10 || a + b > 99);
    return { a, b, sum: a + b };
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 0: Explore — Base-10 blocks, merge 10 units into 1 ten
  // ══════════════════════════════════════════════════════════════════
  let exploreData = {};

  function renderExplore() {
    state.step = 0;
    const a = randInt(22, 38);
    const b = randInt(4, 9);
    const unitSum = (a % 10) + b;
    // Ensure carry
    const problem = unitSum >= 10 ? { a, b } : { a: 26, b: 7 };
    exploreData = { a: problem.a, b: problem.b, merged: false };

    const aTens = Math.floor(problem.a / 10);
    const aUnits = problem.a % 10;
    const totalUnits = aUnits + problem.b;

    const body = getScreen().querySelector('.lca2-body');
    body.innerHTML = `
      <div class="lca2-section">
        <p class="lca2-title">Khám phá Cộng có nhớ! ${speakerBtn('Khi cộng hàng đơn vị vượt quá 10, ta nhớ 1 sang hàng chục')}</p>
        <p class="lca2-question">${numHtml(problem.a, 32)} + ${numHtml(problem.b, 32)} = ? </p>
        <p class="lca2-hint">Gộp khối đơn vị lại, rồi gom 10 khối thành 1 thanh chục!</p>
        <div class="lca2-blocks-wrap">
          <div class="lca2-block-col">
            <div class="lca2-block-label">Hàng Chục</div>
            <div class="lca2-tens" id="lca2-tens">${Array.from({length: aTens}, () => '<div class="lca2-ten-bar"></div>').join('')}</div>
          </div>
          <div class="lca2-block-col">
            <div class="lca2-block-label">Hàng Đơn vị</div>
            <div class="lca2-units" id="lca2-units">${Array.from({length: totalUnits}, (_, i) => `<div class="lca2-unit-block" id="lca2-ub-${i}"></div>`).join('')}</div>
          </div>
        </div>
        <div class="lca2-blocks-result" id="lca2-blocks-result">${numHtml(aUnits, 20)} + ${numHtml(problem.b, 20)} = ${numHtml(totalUnits, 24)} khối lẻ (vượt 10!)</div>
        <button class="lca2-merge-btn" id="lca2-merge-btn" onclick="window._lessonCarry2.mergeBlocks()">Gom 10 khối → 1 thanh chục!</button>
        <div id="lca2-explore-next" style="margin-top:12px;"></div>
      </div>`;
    updateProgress();
  }

  function mergeBlocks() {
    if (exploreData.merged) return;
    exploreData.merged = true;
    playSound('correct');

    const a = exploreData.a, b = exploreData.b;
    const aTens = Math.floor(a / 10);
    const totalUnits = (a % 10) + b;
    const newTens = aTens + 1;
    const remainUnits = totalUnits - 10;
    const result = a + b;

    // Animate: first 10 units fade, add new ten bar
    for (let i = 0; i < 10; i++) {
      const ub = $('lca2-ub-' + i);
      if (ub) { ub.classList.add('merge'); setTimeout(() => ub.classList.add('fade'), 400); }
    }

    setTimeout(() => {
      const tens = $('lca2-tens');
      if (tens) tens.innerHTML += '<div class="lca2-ten-bar new"></div>';
      const units = $('lca2-units');
      if (units) units.innerHTML = Array.from({length: remainUnits}, () => '<div class="lca2-unit-block"></div>').join('');
      const res = $('lca2-blocks-result');
      if (res) res.innerHTML = `${numHtml(newTens, 22)} chục + ${numHtml(remainUnits, 22)} đơn vị = ${numHtml(result, 28)}`;
      speak(`${a} cộng ${b} bằng ${result}. Nhớ 1 sang hàng chục!`);
      const btn = $('lca2-merge-btn');
      if (btn) btn.disabled = true;
      const next = $('lca2-explore-next');
      if (next) next.innerHTML = `<button class="lc-btn lc-btn-primary" onclick="window._lessonCarry2.startStep1()">Tiếp tục!</button>`;
    }, 800);
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 1: Column addition technique (Đặt tính rồi tính)
  // ══════════════════════════════════════════════════════════════════
  let colData = {};

  function startStep1() {
    state.step = 1;
    renderColumnDemo();
    updateProgress();
  }

  function renderColumnDemo() {
    const { a, b, sum } = genCarryProblem();
    const a1 = a % 10, a10 = Math.floor(a / 10);
    const b1 = b % 10, b10 = Math.floor(b / 10);
    const unitSum = a1 + b1;
    const carry = Math.floor(unitSum / 10);
    const unitResult = unitSum % 10;
    const tenResult = a10 + b10 + carry;
    colData = { a, b, sum, a1, a10, b1, b10, unitResult, tenResult, carry, phase: 0 };

    const body = getScreen().querySelector('.lca2-body');
    body.innerHTML = `
      <div class="lca2-section">
        <p class="lca2-title">Đặt tính rồi tính ${speakerBtn('Đặt tính rồi tính. Tính hàng đơn vị trước, nhớ 1 sang hàng chục')}</p>
        <p class="lca2-hint">Bước 1: Tính hàng đơn vị → Bước 2: Nhớ 1 → Bước 3: Tính hàng chục</p>
        <div class="lca2-column-wrap" id="lca2-col-wrap">
          <div class="lca2-col-header">
            <span class="lca2-col-h">Chục</span>
            <span class="lca2-col-h">Đ.vị</span>
          </div>
          <div class="lca2-col-row">
            <span class="lca2-col-cell">${numHtml(a10, 22)}</span>
            <span class="lca2-col-cell">${numHtml(a1, 22)}</span>
          </div>
          <div class="lca2-col-row">
            <span class="lca2-col-op">+</span>
            <span class="lca2-col-cell">${b10 > 0 ? numHtml(b10, 22) : ''}</span>
            <span class="lca2-col-cell">${numHtml(b1, 22)}</span>
          </div>
          <div class="lca2-col-line"></div>
          <div class="lca2-col-row">
            <span class="lca2-col-cell" id="lca2-res-ten">?</span>
            <span class="lca2-col-cell" id="lca2-res-unit">?</span>
          </div>
          <span class="lca2-col-carry" id="lca2-carry-indicator" style="display:none;top:8px;left:12px;">🐦 ₁</span>
        </div>
        <div class="lca2-blocks-result" id="lca2-col-explain"></div>
        <button class="lca2-merge-btn" id="lca2-col-next-btn" onclick="window._lessonCarry2.colNextPhase()">Bước 1: Tính đơn vị</button>
        <div id="lca2-col-done" style="margin-top:12px;"></div>
      </div>`;
    updateProgress();
  }

  function colNextPhase() {
    colData.phase++;
    const btn = $('lca2-col-next-btn');
    const explain = $('lca2-col-explain');

    if (colData.phase === 1) {
      // Show unit result + carry
      const resUnit = $('lca2-res-unit');
      if (resUnit) resUnit.innerHTML = numHtml(colData.unitResult, 22);
      const carryEl = $('lca2-carry-indicator');
      if (carryEl) carryEl.style.display = 'block';
      if (explain) explain.innerHTML = `${numHtml(colData.a1, 18)} + ${numHtml(colData.b1, 18)} = ${numHtml(colData.a1 + colData.b1, 20)} → viết ${numHtml(colData.unitResult, 20)}, nhớ <span style="color:#ef5350;font-weight:900;">1</span>`;
      speak(`${colData.a1} cộng ${colData.b1} bằng ${colData.a1 + colData.b1}. Viết ${colData.unitResult}, nhớ 1.`);
      if (btn) btn.textContent = 'Bước 2: Tính hàng chục';
      playSound('click');
    } else if (colData.phase === 2) {
      // Show ten result
      const resTen = $('lca2-res-ten');
      if (resTen) resTen.innerHTML = numHtml(colData.tenResult, 22);
      if (explain) explain.innerHTML = `${numHtml(colData.a10, 18)} + ${numHtml(colData.b10, 18)} + <span style="color:#ef5350;">1</span> = ${numHtml(colData.tenResult, 20)}`;
      speak(`${colData.a10} cộng ${colData.b10} cộng 1 bằng ${colData.tenResult}. Kết quả là ${colData.sum}.`);
      playSound('correct');
      if (btn) btn.style.display = 'none';
      const done = $('lca2-col-done');
      if (done) done.innerHTML = `
        <p style="font-weight:800;color:#283593;margin-bottom:8px;">${numHtml(colData.a, 28)} + ${numHtml(colData.b, 28)} = ${numHtml(colData.sum, 32)}</p>
        <button class="lc-btn lc-btn-primary" onclick="window._lessonCarry2.startStep2()">Luyện tập!</button>`;
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 2: Practice — 3 types (6 rounds)
  // Type 1 (rounds 1-2): Fill column addition (carry transport)
  // Type 2 (rounds 3-4): Robot error detection
  // Type 3 (rounds 5-6): Word problem
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
    if (practiceRound <= 2) renderFillColumn();
    else if (practiceRound <= 4) renderRobotError();
    else renderWordProblem();
    updateProgress();
  }

  // ── Type 1: Fill column addition step by step ──
  let fillData = {};

  function renderFillColumn() {
    const { a, b, sum } = genCarryProblem();
    const a1 = a % 10, a10 = Math.floor(a / 10);
    const b1 = b % 10, b10 = Math.floor(b / 10);
    const unitSum = a1 + b1;
    const unitResult = unitSum % 10;
    const tenResult = a10 + b10 + 1;
    fillData = { a, b, sum, unitResult, tenResult, phase: 'unit' };

    getScreen().querySelector('.lca2-body').innerHTML = `
      <div class="lca2-section">
        <div class="lca2-header-row">
          <span class="lca2-round-badge">Câu ${practiceRound}/6</span>
          <span class="lca2-score-badge">${S() ? S().named('star', 16) : '⭐'} ${numHtml(state.score, 20)}</span>
        </div>
        <p class="lca2-question">Đặt tính: ${numHtml(a, 24)} + ${numHtml(b, 24)} ${speakerBtn(a + ' cộng ' + b + ' bằng bao nhiêu?')}</p>
        <div class="lca2-column-wrap">
          <div class="lca2-col-header"><span class="lca2-col-h">Chục</span><span class="lca2-col-h">Đ.vị</span></div>
          <div class="lca2-col-row">
            <span class="lca2-col-cell">${numHtml(a10, 20)}</span>
            <span class="lca2-col-cell">${numHtml(a1, 20)}</span>
          </div>
          <div class="lca2-col-row">
            <span class="lca2-col-op">+</span>
            <span class="lca2-col-cell">${b10 > 0 ? numHtml(b10, 20) : ''}</span>
            <span class="lca2-col-cell">${numHtml(b1, 20)}</span>
          </div>
          <div class="lca2-col-line"></div>
          <div class="lca2-col-row">
            <input class="lca2-col-input" id="lca2-fill-ten" maxlength="1" disabled placeholder="?">
            <input class="lca2-col-input" id="lca2-fill-unit" maxlength="1" placeholder="?" inputmode="numeric">
          </div>
        </div>
        <p class="lca2-hint" id="lca2-fill-hint">${numHtml(a1, 16)} + ${numHtml(b1, 16)} = ${numHtml(unitSum, 18)} → viết ? nhớ 1</p>
        <button class="lca2-submit-btn" id="lca2-fill-btn" onclick="window._lessonCarry2.submitFill()">OK</button>
        <div class="lca2-feedback" id="lca2-fb"></div>
      </div>`;
  }

  function submitFill() {
    if (fillData.phase === 'unit') {
      const input = $('lca2-fill-unit');
      if (!input) return;
      const val = parseInt(input.value, 10);
      if (isNaN(val)) return;
      if (val === fillData.unitResult) {
        input.classList.add('correct'); input.disabled = true;
        playSound('click');
        // Enable tens input
        fillData.phase = 'ten';
        const tenInput = $('lca2-fill-ten');
        if (tenInput) { tenInput.disabled = false; tenInput.focus(); }
        const hint = $('lca2-fill-hint');
        if (hint) hint.innerHTML = `Hàng chục: ${numHtml(Math.floor(fillData.a / 10), 16)} + ${numHtml(Math.floor(fillData.b / 10), 16)} + <span style="color:#ef5350;font-weight:900;">1</span> = ?`;
      } else {
        input.classList.add('wrong');
        setTimeout(() => { input.classList.remove('wrong'); input.value = ''; }, 500);
        playSound('wrong');
      }
    } else {
      const input = $('lca2-fill-ten');
      if (!input) return;
      const val = parseInt(input.value, 10);
      if (isNaN(val)) return;
      state.total++;
      const fb = $('lca2-fb');
      const btn = $('lca2-fill-btn');
      if (btn) btn.disabled = true;
      input.disabled = true;
      if (val === fillData.tenResult) {
        input.classList.add('correct');
        state.score++; playSound('correct');
        if (fb) fb.innerHTML = `<div class="lca2-fb-ok">${rand(PRAISE)} ${numHtml(fillData.a, 20)} + ${numHtml(fillData.b, 20)} = ${numHtml(fillData.sum, 24)}</div>`;
      } else {
        input.classList.add('wrong');
        playSound('wrong');
        if (fb) fb.innerHTML = `<div class="lca2-fb-wrong">${rand(ENCOURAGE)} Đáp án: ${numHtml(fillData.sum, 24)}</div>`;
      }
      setTimeout(() => nextPractice(), 1500);
    }
  }

  // ── Type 2: Robot error detection ──
  function renderRobotError() {
    const { a, b, sum } = genCarryProblem();
    // Robot "forgets" carry — shows wrong answer (sum - 10)
    const isCorrect = Math.random() > 0.6; // 40% chance Robot is correct
    const robotAnswer = isCorrect ? sum : sum - 10;
    const correctChoice = isCorrect ? 'correct' : 'wrong';

    getScreen().querySelector('.lca2-body').innerHTML = `
      <div class="lca2-section">
        <div class="lca2-header-row">
          <span class="lca2-round-badge">Câu ${practiceRound}/6</span>
          <span class="lca2-score-badge">${S() ? S().named('star', 16) : '⭐'} ${numHtml(state.score, 20)}</span>
        </div>
        <p class="lca2-question">Sửa lỗi cho Robot! ${speakerBtn('Robot làm tính. Kiểm tra đúng hay sai?')}</p>
        <div class="lca2-robot-wrap">
          <div class="lca2-robot-header">
            <span class="lca2-robot-icon">🤖</span>
            <span class="lca2-robot-speech">Robot tính: ${numHtml(a, 20)} + ${numHtml(b, 20)} = ${numHtml(robotAnswer, 24)}</span>
          </div>
          <div class="lca2-robot-options">
            <button class="lca2-robot-btn" id="lca2-rb-correct" onclick="window._lessonCarry2.answerRobot('correct','${correctChoice}',${sum})">✓ Đúng</button>
            <button class="lca2-robot-btn" id="lca2-rb-wrong" onclick="window._lessonCarry2.answerRobot('wrong','${correctChoice}',${sum})">✗ Sai</button>
          </div>
        </div>
        <div class="lca2-feedback" id="lca2-fb"></div>
      </div>`;
  }

  function answerRobot(picked, correct, realSum) {
    state.total++;
    const btnC = $('lca2-rb-correct');
    const btnW = $('lca2-rb-wrong');
    if (btnC) btnC.style.pointerEvents = 'none';
    if (btnW) btnW.style.pointerEvents = 'none';

    const isRight = picked === correct;
    if (picked === 'correct') { if (btnC) btnC.classList.add(isRight ? 'correct' : 'wrong'); }
    else { if (btnW) btnW.classList.add(isRight ? 'correct' : 'wrong'); }
    // Highlight correct button
    if (!isRight) {
      if (correct === 'correct' && btnC) btnC.classList.add('correct');
      if (correct === 'wrong' && btnW) btnW.classList.add('correct');
    }

    const fb = $('lca2-fb');
    if (isRight) {
      state.score++; playSound('correct');
      if (fb) fb.innerHTML = `<div class="lca2-fb-ok">${rand(PRAISE)} Đáp án đúng: ${numHtml(realSum, 22)}</div>`;
    } else {
      playSound('wrong');
      if (fb) fb.innerHTML = `<div class="lca2-fb-wrong">${rand(ENCOURAGE)} Đáp án đúng: ${numHtml(realSum, 22)}</div>`;
    }
    setTimeout(() => nextPractice(), 1500);
  }

  // ── Type 3: Word problem ──
  const WORD_PROBLEMS = [
    { text: 'Sân trường có 28 bạn nam và 15 bạn nữ đang chơi. Hỏi có tất cả bao nhiêu bạn?', a: 28, b: 15, ans: 43, unit: 'bạn' },
    { text: 'Thùng A có 36 quả cam, thùng B có 27 quả cam. Hỏi cả hai thùng có bao nhiêu quả cam?', a: 36, b: 27, ans: 63, unit: 'quả' },
    { text: 'Anh có 45 viên bi, em có 18 viên bi. Hỏi cả hai anh em có bao nhiêu viên bi?', a: 45, b: 18, ans: 63, unit: 'viên' },
    { text: 'Lớp 2A có 19 bạn, lớp 2B có 25 bạn. Hỏi cả hai lớp có bao nhiêu bạn?', a: 19, b: 25, ans: 44, unit: 'bạn' },
    { text: 'Mẹ mua 37 quả trứng, bà cho thêm 16 quả. Hỏi nhà có tất cả bao nhiêu quả trứng?', a: 37, b: 16, ans: 53, unit: 'quả' },
    { text: 'Xe buýt có 24 người, thêm 19 người lên xe. Hỏi trên xe có bao nhiêu người?', a: 24, b: 19, ans: 43, unit: 'người' },
  ];

  function renderWordProblem() {
    const p = rand(WORD_PROBLEMS);
    state._wpAns = p.ans;

    getScreen().querySelector('.lca2-body').innerHTML = `
      <div class="lca2-section">
        <div class="lca2-header-row">
          <span class="lca2-round-badge">Câu ${practiceRound}/6</span>
          <span class="lca2-score-badge">${S() ? S().named('star', 16) : '⭐'} ${numHtml(state.score, 20)}</span>
        </div>
        <p class="lca2-question">Giải bài toán: ${speakerBtn(p.text)}</p>
        <div class="lca2-word-problem">${p.text}</div>
        <p class="lca2-hint">Gợi ý: ${numHtml(p.a, 18)} + ${numHtml(p.b, 18)} = ?</p>
        <div class="lca2-input-row">
          <input class="lca2-input" id="lca2-wp-input" type="number" inputmode="numeric" placeholder="?">
          <span style="font-weight:700;color:#666;">${p.unit}</span>
          <button class="lca2-submit-btn" onclick="window._lessonCarry2.submitWP()">OK</button>
        </div>
        <div class="lca2-feedback" id="lca2-fb"></div>
      </div>`;
  }

  function submitWP() {
    const input = $('lca2-wp-input');
    if (!input) return;
    const val = parseInt(input.value, 10);
    if (isNaN(val)) return;
    state.total++;
    input.disabled = true;
    const btn = getScreen().querySelector('.lca2-submit-btn');
    if (btn) btn.disabled = true;
    const fb = $('lca2-fb');
    if (val === state._wpAns) {
      state.score++; playSound('correct');
      if (fb) fb.innerHTML = `<div class="lca2-fb-ok">${rand(PRAISE)} = ${numHtml(state._wpAns, 28)}</div>`;
    } else {
      playSound('wrong');
      if (fb) fb.innerHTML = `<div class="lca2-fb-wrong">${rand(ENCOURAGE)} Đáp án: ${numHtml(state._wpAns, 28)}</div>`;
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
      S() ? S().el(2, 0, 0, i < stars ? 36 : 24, i >= stars ? 'lca2-star-dim' : '') : (i < stars ? '⭐' : '☆')
    ).join(' ');
    const msg = stars === 3 ? 'Xuất sắc! Chuyên gia Cộng có nhớ!' : stars === 2 ? 'Tốt lắm! Sắp thành chuyên gia!' : 'Cố gắng thêm nhé!';
    speak(msg);

    getScreen().querySelector('.lca2-body').innerHTML = `
      <div class="lca2-reward">
        <div class="lca2-reward-stars">${starsHtml}</div>
        <h2 class="lca2-reward-title">${msg}</h2>
        <div class="lca2-reward-score">Đúng ${numHtml(state.score, 32)} / ${numHtml(state.total, 32)} câu</div>
        <div class="lca2-reward-concepts">
          <div class="lca2-concept">Đơn vị ≥ 10 → viết hàng đơn vị, nhớ 1</div>
          <div class="lca2-concept">Hàng chục: cộng thêm 1 (số nhớ)</div>
          <div class="lca2-concept">Luôn tính từ phải sang trái!</div>
        </div>
        <div class="lca2-reward-actions">
          <button class="lc-btn lc-btn-secondary" onclick="window._lessonCarry2.restart()">Học lại</button>
          <button class="lc-btn lc-btn-primary" onclick="showScreen('menu-screen')">Về menu</button>
        </div>
      </div>`;
    if (window.HocVuiCollection && window.HocVuiCollection.reward) window.HocVuiCollection.reward(stars);
    updateProgress();
  }

  // ── Entry / restart ──
  function restart() {
    state = { step: 0, score: 0, total: 0, round: 0 };
    practiceRound = 0;
    renderExplore();
  }
  function open() { show(); restart(); }

  // ── Public API ──
  window._lessonCarry2 = { open, restart, speak, mergeBlocks, startStep1, colNextPhase, startStep2, submitFill, answerRobot, submitWP };

  // ── Hook into openTopic ──
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (typeof openTopic === 'function') {
        const _o = openTopic;
        window.openTopic = function (t) {
          if (t === 'carry') { window._lessonCarry2.open(); return; }
          _o(t);
        };
      }
    }, 0);
  });
})();
