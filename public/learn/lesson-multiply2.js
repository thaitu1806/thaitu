// === Interactive "Bảng Nhân 2,3,4,5" Lesson for Grade 2 ===
// Hooks into openTopic('multiply'). 4-step CPA: Explore → Skip-count → Practice (3 types) → Reward
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
    return `<button class="lc-speak-btn" onclick="window._lessonMul2.speak('${text.replace(/'/g, "\\'")}')">`
      + '<img src="/img/sound-on.png" style="width:22px;height:22px;"></button>';
  }

  // ── State ──
  let state = { step: 0, score: 0, total: 0, round: 0, tableIdx: 0 };

  // ── Helpers ──
  function $(id) { return document.getElementById(id); }
  function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }
  function playSound(type) { if (window.HocVuiSound) window.HocVuiSound.play(type); }

  const PRAISE = ['Giỏi lắm!', 'Tuyệt vời!', 'Đúng rồi!', 'Hay quá!', 'Xuất sắc!'];
  const ENCOURAGE = ['Thử lại nhé!', 'Gần đúng rồi!', 'Cố lên!'];

  function getScreen() { return $('multiply2-interactive-screen'); }
  function show() { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); getScreen().classList.add('active'); }
  function updateProgress() {
    const bar = getScreen().querySelector('.lmu2-progress-bar');
    if (bar) bar.style.width = ((state.step + 1) / 4 * 100) + '%';
  }

  // ── Table data ──
  const TABLES = [2, 3, 4, 5];
  const TABLE_EMOJI = { 2: '🥢', 3: '🌀', 4: '🚗', 5: '✋' };
  const TABLE_ITEMS = { 2: 'đũa', 3: 'cánh quạt', 4: 'bánh xe', 5: 'ngón tay' };
  const TABLE_TIPS = {
    2: 'Kết quả Bảng 2 luôn là số chẵn!',
    3: 'Nhảy cách 3 trên tia số!',
    4: 'Bảng 4 = gấp đôi Bảng 2!',
    5: 'Kết quả luôn tận cùng bằng 0 hoặc 5!',
  };

  // ══════════════════════════════════════════════════════════════════
  // STEP 0: Explore — Understand multiplication as repeated addition
  // ══════════════════════════════════════════════════════════════════
  let exploreTaps = 0, exploreBase = 2, exploreGroups = 3;

  function renderExplore() {
    state.step = 0;
    exploreBase = rand([2, 3, 4, 5]);
    exploreGroups = randInt(2, 5);
    exploreTaps = 0;
    const emoji = TABLE_EMOJI[exploreBase];
    const itemsPerPlate = Array.from({ length: exploreBase }, () => emoji).join('');

    const body = getScreen().querySelector('.lmu2-body');
    body.innerHTML = `
      <div class="lmu2-section">
        <p class="lmu2-title">Phép Nhân là gì? ${speakerBtn('Phép nhân là phép cộng các số bằng nhau lặp lại nhiều lần')}</p>
        <p class="lmu2-hint">Chạm vào từng đĩa để đếm nhảy!</p>
        <div class="lmu2-plates" id="lmu2-plates">
          ${Array.from({ length: exploreGroups }, (_, i) => `
            <div class="lmu2-plate" id="lmu2-pl-${i}" onclick="window._lessonMul2.tapPlate(${i})">
              <span class="lmu2-plate-items">${itemsPerPlate}</span>
            </div>`).join('')}
        </div>
        <div class="lmu2-equation" id="lmu2-eq">Chạm từng đĩa!</div>
        <div id="lmu2-explore-next" style="margin-top:12px;"></div>
      </div>`;
    updateProgress();
  }

  function tapPlate(idx) {
    const el = $('lmu2-pl-' + idx);
    if (!el || el.classList.contains('tapped')) return;
    el.classList.add('tapped');
    exploreTaps++;
    playSound('click');
    const sum = exploreTaps * exploreBase;
    const addParts = Array.from({ length: exploreTaps }, () => numHtml(exploreBase, 20)).join(' + ');
    const eq = $('lmu2-eq');

    if (exploreTaps < exploreGroups) {
      if (eq) eq.innerHTML = `${addParts} = ${numHtml(sum, 24)}`;
      speak(String(sum));
    } else {
      // All tapped — show multiplication
      if (eq) eq.innerHTML = `
        <div>${addParts} = ${numHtml(sum, 24)}</div>
        <div class="lmu2-eq-highlight" style="margin-top:8px;">
          ${numHtml(exploreBase, 28)} <span class="lmu2-multiply-sign">×</span> ${numHtml(exploreGroups, 28)} = ${numHtml(sum, 32)}
        </div>`;
      speak(`${exploreBase} nhân ${exploreGroups} bằng ${sum}`);
      playSound('correct');
      setTimeout(() => {
        const next = $('lmu2-explore-next');
        if (next && !next.innerHTML) next.innerHTML = `<button class="lc-btn lc-btn-primary" onclick="window._lessonMul2.startStep1()">Tiếp tục!</button>`;
      }, 600);
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 1: Skip-count tables with number line
  // ══════════════════════════════════════════════════════════════════
  function startStep1() {
    state.step = 1; state.tableIdx = 0;
    renderTable();
    updateProgress();
  }

  function renderTable() {
    const base = TABLES[state.tableIdx];
    const results = Array.from({ length: 10 }, (_, i) => base * (i + 1));
    const maxVal = base * 10;

    // Number line
    let nlHtml = '';
    for (let i = 0; i <= maxVal; i++) {
      const isActive = i > 0 && i % base === 0;
      nlHtml += `<div class="lmu2-nl-num">
        <div class="lmu2-nl-dot ${isActive ? 'active' : ''}"></div>
        <span class="lmu2-nl-label ${isActive ? 'active' : ''}">${i % base === 0 ? i : ''}</span>
      </div>`;
    }

    // Table grid
    const gridHtml = results.map((r, i) => `<div class="lmu2-table-cell">${numHtml(base, 14)} × ${numHtml(i + 1, 14)} = ${numHtml(r, 16)}</div>`).join('');

    const body = getScreen().querySelector('.lmu2-body');
    body.innerHTML = `
      <div class="lmu2-section">
        <p class="lmu2-title">${TABLE_EMOJI[base]} Bảng nhân ${numHtml(base, 28)} ${speakerBtn('Bảng nhân ' + base)}</p>
        <div class="lmu2-tabs">
          ${TABLES.map((t, i) => `<button class="lmu2-tab ${i === state.tableIdx ? 'active' : ''}" onclick="window._lessonMul2.switchTable(${i})">${TABLE_EMOJI[t]} ×${t}</button>`).join('')}
        </div>
        <p class="lmu2-hint">Đếm nhảy ${base}: nhảy cách ${base} trên tia số</p>
        <div class="lmu2-numberline">${nlHtml}</div>
        <div class="lmu2-table-grid">${gridHtml}</div>
        <div class="lmu2-tip">${TABLE_TIPS[base]}</div>
        <div style="margin-top:12px;">
          <button class="lc-btn lc-btn-primary" onclick="window._lessonMul2.startStep2()">Luyện tập!</button>
        </div>
      </div>`;
    updateProgress();
  }

  function switchTable(idx) {
    state.tableIdx = idx;
    renderTable();
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 2: Practice — 3 types (6 rounds)
  // Type 1 (rounds 1-2): Frog jump on number line
  // Type 2 (rounds 3-4): Match expression ↔ result
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
    if (practiceRound <= 2) renderFrogJump();
    else if (practiceRound <= 4) renderMatch();
    else renderWordProblem();
    updateProgress();
  }

  // ── Type 1: Frog jump ──
  let frogPos = 0, frogTarget = 0, frogStep = 0, frogJumps = 0, frogMaxJumps = 0;

  function renderFrogJump() {
    const base = rand(TABLES);
    const times = randInt(2, 5);
    frogTarget = base * times;
    frogStep = base;
    frogJumps = 0;
    frogMaxJumps = times;
    frogPos = 0;

    const maxLine = frogTarget + 4;
    let lineHtml = '';
    for (let i = 0; i <= maxLine; i++) {
      const isBig = i % frogStep === 0;
      lineHtml += `<div class="lmu2-frog-tick">
        <div class="lmu2-frog-mark ${isBig ? 'big' : ''}"></div>
        <span class="lmu2-frog-num">${i % 5 === 0 || isBig ? i : ''}</span>
      </div>`;
    }

    getScreen().querySelector('.lmu2-body').innerHTML = `
      <div class="lmu2-section">
        <div class="lmu2-header-row">
          <span class="lmu2-round-badge">Câu ${practiceRound}/6</span>
          <span class="lmu2-score-badge">${S() ? S().named('star', 16) : '⭐'} ${numHtml(state.score, 20)}</span>
        </div>
        <p class="lmu2-question">${numHtml(base, 28)} <span class="lmu2-multiply-sign">×</span> ${numHtml(times, 28)} = ? ${speakerBtn(base + ' nhân ' + times + ' bằng bao nhiêu?')}</p>
        <p class="lmu2-hint">🐸 Bấm nhảy ${times} lần, mỗi lần nhảy ${base} bước!</p>
        <div class="lmu2-frog-wrap">
          <div style="position:relative;">
            <span class="lmu2-frog-pos" id="lmu2-frog" style="position:absolute;left:0;top:-20px;">🐸</span>
          </div>
          <div class="lmu2-frog-line" id="lmu2-frog-line">${lineHtml}</div>
        </div>
        <button class="lmu2-jump-btn" id="lmu2-jump-btn" onclick="window._lessonMul2.frogJump()">🐸 Nhảy +${base}!</button>
        <div class="lmu2-frog-result" id="lmu2-frog-result"></div>
        <div class="lmu2-feedback" id="lmu2-fb"></div>
      </div>`;
  }

  function frogJump() {
    frogJumps++;
    frogPos += frogStep;
    playSound('click');
    // Move frog visually
    const frog = $('lmu2-frog');
    if (frog) frog.style.left = (frogPos * 23) + 'px';
    const res = $('lmu2-frog-result');
    if (res) res.innerHTML = `Vị trí: ${numHtml(frogPos, 24)}`;
    speak(String(frogPos));

    if (frogJumps >= frogMaxJumps) {
      const btn = $('lmu2-jump-btn');
      if (btn) btn.disabled = true;
      state.total++;
      const fb = $('lmu2-fb');
      if (frogPos === frogTarget) {
        state.score++; playSound('correct');
        if (fb) fb.innerHTML = `<div class="lmu2-fb-ok">${rand(PRAISE)} ${numHtml(frogStep, 20)} × ${numHtml(frogMaxJumps, 20)} = ${numHtml(frogTarget, 24)}</div>`;
      } else {
        playSound('wrong');
        if (fb) fb.innerHTML = `<div class="lmu2-fb-wrong">Đáp án: ${numHtml(frogTarget, 24)}</div>`;
      }
      setTimeout(() => nextPractice(), 1600);
    }
  }

  // ── Type 2: Match expressions ↔ results ──
  let matchState = { pairs: [], selectedLeft: -1, matched: 0 };

  function renderMatch() {
    // Generate 3 unique multiplication pairs with unique results
    const pairs = [];
    const usedKeys = new Set();
    const usedResults = new Set();
    while (pairs.length < 3) {
      const base = rand(TABLES);
      const times = randInt(2, 9);
      const key = `${base}x${times}`;
      const result = base * times;
      if (usedKeys.has(key) || usedResults.has(result)) continue;
      usedKeys.add(key);
      usedResults.add(result);
      pairs.push({ expr: `${base} × ${times}`, result, base, times });
    }
    matchState = { pairs, selectedLeft: -1, matched: 0 };
    const shuffledResults = shuffle(pairs.map((p, i) => ({ result: p.result, origIdx: i })));

    getScreen().querySelector('.lmu2-body').innerHTML = `
      <div class="lmu2-section">
        <div class="lmu2-header-row">
          <span class="lmu2-round-badge">Câu ${practiceRound}/6</span>
          <span class="lmu2-score-badge">${S() ? S().named('star', 16) : '⭐'} ${numHtml(state.score, 20)}</span>
        </div>
        <p class="lmu2-question">Nối phép tính với kết quả! ${speakerBtn('Nối phép nhân với kết quả đúng')}</p>
        <div class="lmu2-match-area">
          <div class="lmu2-match-col">
            ${pairs.map((p, i) => `<div class="lmu2-match-item" id="lmu2-ml-${i}" onclick="window._lessonMul2.tapMatchLeft(${i})">${numHtml(p.base, 18)} <span class="lmu2-multiply-sign">×</span> ${numHtml(p.times, 18)}</div>`).join('')}
          </div>
          <div class="lmu2-match-col">
            ${shuffledResults.map((p, i) => `<div class="lmu2-match-item" id="lmu2-mr-${i}" data-orig="${p.origIdx}" onclick="window._lessonMul2.tapMatchRight(${i},${p.origIdx})">${numHtml(p.result, 22)}</div>`).join('')}
          </div>
        </div>
        <div class="lmu2-feedback" id="lmu2-fb"></div>
      </div>`;
  }

  function tapMatchLeft(idx) {
    getScreen().querySelectorAll('.lmu2-match-col:first-child .lmu2-match-item').forEach(el => el.classList.remove('selected'));
    const el = $('lmu2-ml-' + idx);
    if (el && !el.classList.contains('done')) {
      el.classList.add('selected');
      matchState.selectedLeft = idx;
      playSound('click');
    }
  }

  function tapMatchRight(displayIdx, origIdx) {
    if (matchState.selectedLeft < 0) return;
    const leftIdx = matchState.selectedLeft;
    const leftEl = $('lmu2-ml-' + leftIdx);
    const rightEl = $('lmu2-mr-' + displayIdx);

    if (leftIdx === origIdx) {
      if (leftEl) { leftEl.classList.add('correct', 'done'); leftEl.classList.remove('selected'); }
      if (rightEl) { rightEl.classList.add('correct', 'done'); }
      matchState.matched++;
      playSound('correct');
      matchState.selectedLeft = -1;
      if (matchState.matched >= matchState.pairs.length) {
        state.total++; state.score++;
        const fb = $('lmu2-fb');
        if (fb) fb.innerHTML = `<div class="lmu2-fb-ok">${rand(PRAISE)}</div>`;
        setTimeout(() => nextPractice(), 1400);
      }
    } else {
      if (rightEl) { rightEl.classList.add('wrong'); setTimeout(() => rightEl.classList.remove('wrong'), 500); }
      playSound('wrong');
    }
  }

  // ── Type 3: Word problems ──
  const WORD_PROBLEMS = [
    { text: 'Mỗi xe ô tô có 4 bánh. Hỏi 5 xe ô tô có tất cả bao nhiêu bánh?', a: 4, b: 5, ans: 20, unit: 'bánh' },
    { text: 'Mỗi bàn có 2 bạn ngồi. Hỏi 6 bàn có tất cả bao nhiêu bạn?', a: 2, b: 6, ans: 12, unit: 'bạn' },
    { text: 'Mỗi hộp có 3 cái bút. Hỏi 4 hộp có tất cả bao nhiêu cái bút?', a: 3, b: 4, ans: 12, unit: 'bút' },
    { text: 'Mỗi cây có 5 quả cam. Hỏi 3 cây có tất cả bao nhiêu quả cam?', a: 5, b: 3, ans: 15, unit: 'quả' },
    { text: 'Mỗi phòng có 4 cái ghế. Hỏi 3 phòng có tất cả bao nhiêu cái ghế?', a: 4, b: 3, ans: 12, unit: 'ghế' },
    { text: 'Mỗi túi có 5 cái kẹo. Hỏi 4 túi có tất cả bao nhiêu cái kẹo?', a: 5, b: 4, ans: 20, unit: 'kẹo' },
    { text: 'Mỗi bàn có 3 đĩa bánh. Hỏi 5 bàn có tất cả bao nhiêu đĩa bánh?', a: 3, b: 5, ans: 15, unit: 'đĩa' },
    { text: 'Mỗi lọ có 2 bông hoa. Hỏi 7 lọ có tất cả bao nhiêu bông hoa?', a: 2, b: 7, ans: 14, unit: 'bông' },
  ];

  function renderWordProblem() {
    const p = rand(WORD_PROBLEMS);
    state._wpAns = p.ans;

    getScreen().querySelector('.lmu2-body').innerHTML = `
      <div class="lmu2-section">
        <div class="lmu2-header-row">
          <span class="lmu2-round-badge">Câu ${practiceRound}/6</span>
          <span class="lmu2-score-badge">${S() ? S().named('star', 16) : '⭐'} ${numHtml(state.score, 20)}</span>
        </div>
        <p class="lmu2-question">Giải bài toán: ${speakerBtn(p.text)}</p>
        <div class="lmu2-word-problem">${p.text}</div>
        <p class="lmu2-hint">Gợi ý: ${numHtml(p.a, 18)} × ${numHtml(p.b, 18)} = ?</p>
        <div class="lmu2-input-row">
          <input class="lmu2-input" id="lmu2-wp-input" type="number" inputmode="numeric" placeholder="?">
          <span style="font-weight:700;color:#666;">${p.unit}</span>
          <button class="lmu2-submit-btn" onclick="window._lessonMul2.submitWP()">OK</button>
        </div>
        <div class="lmu2-feedback" id="lmu2-fb"></div>
      </div>`;
  }

  function submitWP() {
    const input = $('lmu2-wp-input');
    if (!input) return;
    const val = parseInt(input.value, 10);
    if (isNaN(val)) return;
    state.total++;
    input.disabled = true;
    const btn = getScreen().querySelector('.lmu2-submit-btn');
    if (btn) btn.disabled = true;
    const fb = $('lmu2-fb');
    if (val === state._wpAns) {
      state.score++; playSound('correct');
      if (fb) fb.innerHTML = `<div class="lmu2-fb-ok">${rand(PRAISE)} = ${numHtml(state._wpAns, 28)}</div>`;
    } else {
      playSound('wrong');
      if (fb) fb.innerHTML = `<div class="lmu2-fb-wrong">${rand(ENCOURAGE)} Đáp án: ${numHtml(state._wpAns, 28)}</div>`;
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
      S() ? S().el(2, 0, 0, i < stars ? 36 : 24, i >= stars ? 'lmu2-star-dim' : '') : (i < stars ? '⭐' : '☆')
    ).join(' ');
    const msg = stars === 3 ? 'Xuất sắc! Bậc thầy Phép Nhân!' : stars === 2 ? 'Tốt lắm! Gần thành bậc thầy!' : 'Cố gắng thêm nhé!';
    speak(msg);

    getScreen().querySelector('.lmu2-body').innerHTML = `
      <div class="lmu2-reward">
        <div class="lmu2-reward-stars">${starsHtml}</div>
        <h2 class="lmu2-reward-title">${msg}</h2>
        <div class="lmu2-reward-score">Đúng ${numHtml(state.score, 32)} / ${numHtml(state.total, 32)} câu</div>
        <div class="lmu2-reward-concepts">
          <div class="lmu2-concept">a × b = a được lấy b lần</div>
          <div class="lmu2-concept">Bảng 2: kết quả luôn chẵn</div>
          <div class="lmu2-concept">Bảng 5: tận cùng 0 hoặc 5</div>
          <div class="lmu2-concept">Bảng 4 = gấp đôi Bảng 2</div>
        </div>
        <div class="lmu2-reward-actions">
          <button class="lc-btn lc-btn-secondary" onclick="window._lessonMul2.restart()">Học lại</button>
          <button class="lc-btn lc-btn-primary" onclick="showScreen('menu-screen')">Về menu</button>
        </div>
      </div>`;
    if (window.HocVuiCollection && window.HocVuiCollection.reward) window.HocVuiCollection.reward(stars);
    updateProgress();
  }

  // ── Entry / restart ──
  function restart() {
    state = { step: 0, score: 0, total: 0, round: 0, tableIdx: 0 };
    practiceRound = 0;
    renderExplore();
  }
  function open() { show(); restart(); }

  // ── Public API ──
  window._lessonMul2 = { open, restart, speak, tapPlate, startStep1, switchTable, startStep2, frogJump, tapMatchLeft, tapMatchRight, submitWP };

  // ── Hook into openTopic ──
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (typeof openTopic === 'function') {
        const _o = openTopic;
        window.openTopic = function (t) {
          if (t === 'multiply') { window._lessonMul2.open(); return; }
          _o(t);
        };
      }
    }, 0);
  });
})();
