// === Interactive "Màu Sắc" (Colors) Lesson for Grade 0 (5 tuổi) ===
// Hooks into openTopic('colors0') in learn.js
// 4-step flow: Explore → Sorting → Color Mixing → Reward
(function () {
  'use strict';

  const S = () => window.HocVuiSprite;

  // ── Color definitions (vibrant, pure colors) ──
  const COLORS = [
    { id: 'red', name: 'Đỏ', hex: '#e53935', items: ['quả dâu', 'xe cứu hỏa', 'trái tim'] },
    { id: 'yellow', name: 'Vàng', hex: '#fdd835', items: ['ngôi sao', 'mặt trời', 'quả chuối'] },
    { id: 'blue', name: 'Xanh Dương', hex: '#1e88e5', items: ['bầu trời', 'biển', 'giọt nước'] },
    { id: 'green', name: 'Xanh Lá', hex: '#43a047', items: ['chiếc lá', 'con ếch', 'cỏ'] },
    { id: 'orange', name: 'Cam', hex: '#fb8c00', items: ['quả cam', 'cà rốt', 'con cáo'] },
    { id: 'purple', name: 'Tím', hex: '#8e24aa', items: ['quả nho', 'hoa oải hương', 'bướm tím'] },
    { id: 'pink', name: 'Hồng', hex: '#ec407a', items: ['hoa hồng', 'kẹo', 'váy công chúa'] },
    { id: 'brown', name: 'Nâu', hex: '#6d4c41', items: ['gỗ', 'sô-cô-la', 'gấu bông'] },
  ];

  // Color mixing recipes
  const MIX_RECIPES = [
    { a: 'red', b: 'yellow', result: 'orange', resultName: 'Cam' },
    { a: 'red', b: 'blue', result: 'purple', resultName: 'Tím' },
    { a: 'blue', b: 'yellow', result: 'green', resultName: 'Xanh Lá' },
    { a: 'red', b: 'white', result: 'pink', resultName: 'Hồng' },
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
    return `<button class="lc-speak-btn" onclick="window._lessonColors.speak('${text.replace(/'/g, "\\'")}')"><img src="/img/sound-on.png" style="width:22px;height:22px;"></button>`;
  }

  // ── State ──
  let state = { step: 0, score: 0, total: 0, round: 0, explored: 0 };

  // ── Helpers ──
  function $(id) { return document.getElementById(id); }
  function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function playSound(type) { if (window.HocVuiSound) window.HocVuiSound.play(type); }
  function colorById(id) { return COLORS.find(c => c.id === id); }
  function colorDot(hex, size) {
    size = size || 40;
    return `<span class="lcl-dot" style="width:${size}px;height:${size}px;background:${hex};"></span>`;
  }

  const PRAISE = ['Giỏi lắm!', 'Tuyệt vời!', 'Đúng rồi!', 'Hay quá!', 'Xuất sắc!'];
  const ENCOURAGE = ['Thử lại nhé!', 'Gần đúng rồi!', 'Cố lên!'];

  function getScreen() { return $('colors0-interactive-screen'); }
  function show() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    getScreen().classList.add('active');
  }
  function updateProgress() {
    const bar = getScreen().querySelector('.lcl-progress-bar');
    if (bar) bar.style.width = ((state.step + 1) / 4 * 100) + '%';
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 0: Explore — tap color items to learn names
  // ══════════════════════════════════════════════════════════════════
  function renderExplore() {
    state.step = 0;
    state.explored = 0;

    // Show 6 colors to explore
    const exploreColors = COLORS.slice(0, 6);

    const body = getScreen().querySelector('.lcl-body');
    body.innerHTML = `
      <div class="lcl-explore">
        <p class="lcl-title">Chạm vào từng màu để nghe tên! ${speakerBtn('Chạm vào từng màu để nghe tên')}</p>
        <div class="lcl-color-grid" id="lcl-explore-grid">
          ${exploreColors.map((c, i) => `
            <div class="lcl-color-card" id="lcl-card-${i}" onclick="window._lessonColors.tapExplore(${i})">
              ${colorDot(c.hex, 50)}
              <span class="lcl-color-name" id="lcl-name-${i}">?</span>
            </div>
          `).join('')}
        </div>
        <div class="lcl-explore-info" id="lcl-explore-info"></div>
        <div id="lcl-explore-next" style="margin-top:12px;"></div>
      </div>
    `;
    updateProgress();
  }

  function tapExplore(idx) {
    const exploreColors = COLORS.slice(0, 6);
    const c = exploreColors[idx];
    const card = $('lcl-card-' + idx);
    const nameEl = $('lcl-name-' + idx);
    if (!card || card.classList.contains('lcl-explored')) return;

    card.classList.add('lcl-explored');
    nameEl.textContent = c.name;
    nameEl.style.color = c.hex;
    speak('Màu ' + c.name + '! Ví dụ: ' + c.items[0]);
    playSound('click');

    // Show info
    const info = $('lcl-explore-info');
    if (info) {
      info.innerHTML = `<div class="lcl-info-bubble" style="border-left:4px solid ${c.hex}">Màu <strong>${c.name}</strong>: ${c.items.join(', ')}</div>`;
    }

    state.explored++;
    if (state.explored >= 6) {
      setTimeout(() => {
        const next = $('lcl-explore-next');
        if (next) {
          next.innerHTML = `<button class="lc-btn lc-btn-primary" onclick="window._lessonColors.startSort()">Tiếp tục!</button>`;
        }
      }, 600);
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 1: Sorting — pick objects that match a target color
  // ══════════════════════════════════════════════════════════════════
  function startSort() {
    state.step = 1;
    state.round = 0;
    state.score = 0;
    state.total = 0;
    nextSort();
  }

  function nextSort() {
    if (state.round >= 4) { startMix(); return; }
    state.round++;

    // Pick a target color and create options (1 correct color + 3 wrong colors)
    const target = COLORS[randInt(0, 5)];
    const wrongs = COLORS.filter(c => c.id !== target.id).sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [target, ...wrongs].sort(() => Math.random() - 0.5);
    const correctIdx = options.indexOf(target);

    const question = `Chọn màu <strong style="color:${target.hex}">${target.name}</strong>!`;
    const hint = `(Gợi ý: giống ${rand(target.items)})`;

    const body = getScreen().querySelector('.lcl-body');
    body.innerHTML = `
      <div class="lcl-sort-section">
        <div class="lcl-sort-header">
          <span class="lcl-round-badge">Câu ${state.round}/4</span>
          <span class="lcl-score-badge">${S().named('star', 16)} ${state.score}</span>
        </div>
        <p class="lcl-question">${question} ${speakerBtn('Chọn màu ' + target.name)}</p>
        <p class="lcl-hint">${hint}</p>
        <div class="lcl-sort-options" id="lcl-sort-opts">
          ${options.map((c, i) => `
            <button class="lcl-sort-opt" data-idx="${i}" onclick="window._lessonColors.answerSort(${i}, ${correctIdx})" style="border-color:${c.hex}22">
              ${colorDot(c.hex, 48)}
              <span class="lcl-opt-name">${c.name}</span>
            </button>
          `).join('')}
        </div>
        <div class="lcl-feedback" id="lcl-sort-fb"></div>
      </div>
    `;
    updateProgress();
  }

  function answerSort(picked, correctIdx) {
    state.total++;
    const opts = getScreen().querySelectorAll('.lcl-sort-opt');
    opts.forEach((o, i) => {
      o.style.pointerEvents = 'none';
      if (i === correctIdx) o.classList.add('lcl-opt-correct');
      if (i === picked && i !== correctIdx) o.classList.add('lcl-opt-wrong');
    });
    const fb = $('lcl-sort-fb');
    if (picked === correctIdx) {
      state.score++;
      playSound('correct');
      if (fb) fb.innerHTML = `<div class="lcl-fb-ok">${rand(PRAISE)}</div>`;
    } else {
      playSound('wrong');
      if (fb) fb.innerHTML = `<div class="lcl-fb-wrong">${rand(ENCOURAGE)}</div>`;
    }
    setTimeout(() => nextSort(), 1400);
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 2: Color Mixing — discover what happens when 2 colors mix
  // ══════════════════════════════════════════════════════════════════
  function startMix() {
    state.step = 2;
    state.round = 0;
    nextMix();
  }

  function nextMix() {
    if (state.round >= 3) { showReward(); return; }
    state.round++;

    const recipe = MIX_RECIPES[state.round - 1];
    const colorA = colorById(recipe.a) || { name: recipe.a, hex: '#e53935' };
    const colorB = colorById(recipe.b) || { name: recipe.b === 'white' ? 'Trắng' : recipe.b, hex: recipe.b === 'white' ? '#ffffff' : '#1e88e5' };
    const resultColor = colorById(recipe.result) || { hex: '#fb8c00' };

    const question = `Trộn màu ${colorA.name} + ${colorB.name} = ?`;

    // 3 answer options
    const wrongColors = COLORS.filter(c => c.id !== recipe.result).sort(() => Math.random() - 0.5).slice(0, 2);
    const answers = [{ id: recipe.result, name: recipe.resultName, hex: resultColor.hex }, ...wrongColors.map(c => ({ id: c.id, name: c.name, hex: c.hex }))].sort(() => Math.random() - 0.5);
    const correctIdx = answers.findIndex(a => a.id === recipe.result);

    const body = getScreen().querySelector('.lcl-body');
    body.innerHTML = `
      <div class="lcl-mix-section">
        <div class="lcl-sort-header">
          <span class="lcl-round-badge">Pha màu ${state.round}/3</span>
          <span class="lcl-score-badge">${S().named('star', 16)} ${state.score}</span>
        </div>
        <p class="lcl-question">${question} ${speakerBtn(question)}</p>
        <div class="lcl-mix-demo">
          <div class="lcl-mix-pot" style="background:${colorA.hex}"></div>
          <span class="lcl-mix-plus">+</span>
          <div class="lcl-mix-pot" style="background:${colorB.hex};${recipe.b === 'white' ? 'border:2px solid #ccc;' : ''}"></div>
          <span class="lcl-mix-equals">=</span>
          <div class="lcl-mix-pot lcl-mix-result" id="lcl-mix-result">?</div>
        </div>
        <div class="lcl-mix-options" id="lcl-mix-opts">
          ${answers.map((a, i) => `
            <button class="lcl-mix-opt" onclick="window._lessonColors.answerMix(${i}, ${correctIdx}, '${resultColor.hex}')">
              ${colorDot(a.hex, 36)}
              <span>${a.name}</span>
            </button>
          `).join('')}
        </div>
        <div class="lcl-feedback" id="lcl-mix-fb"></div>
      </div>
    `;
    updateProgress();
  }

  function answerMix(picked, correctIdx, resultHex) {
    state.total++;
    const opts = getScreen().querySelectorAll('.lcl-mix-opt');
    opts.forEach((o, i) => {
      o.style.pointerEvents = 'none';
      if (i === correctIdx) o.classList.add('lcl-opt-correct');
      if (i === picked && i !== correctIdx) o.classList.add('lcl-opt-wrong');
    });

    // Reveal the result color in the pot
    const resultEl = $('lcl-mix-result');
    if (resultEl) {
      resultEl.textContent = '';
      resultEl.style.background = resultHex;
      resultEl.classList.add('lcl-mix-revealed');
    }

    const fb = $('lcl-mix-fb');
    if (picked === correctIdx) {
      state.score++;
      playSound('correct');
      if (fb) fb.innerHTML = `<div class="lcl-fb-ok">${rand(PRAISE)}</div>`;
    } else {
      playSound('wrong');
      if (fb) fb.innerHTML = `<div class="lcl-fb-wrong">${rand(ENCOURAGE)}</div>`;
    }
    setTimeout(() => nextMix(), 1800);
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 3: Reward
  // ══════════════════════════════════════════════════════════════════
  function showReward() {
    state.step = 3;
    playSound('win');
    const stars = state.score >= 6 ? 3 : state.score >= 4 ? 2 : 1;
    const SP = S();
    const starsHtml = Array.from({length: 3}, (_, i) =>
      SP.el(2, 0, 0, i < stars ? 36 : 24, i >= stars ? 'lcl-star-dim' : '')
    ).join(' ');
    const message = stars === 3 ? 'Xuất sắc! Họa sĩ tài ba!' :
                    stars === 2 ? 'Tốt lắm! Bé thuộc nhiều màu rồi!' :
                    'Cố gắng thêm nhé!';

    // Rainbow palette summary
    const palette = COLORS.slice(0, 6).map(c => colorDot(c.hex, 28)).join('');

    const body = getScreen().querySelector('.lcl-body');
    body.innerHTML = `
      <div class="lcl-reward">
        <div class="lcl-reward-stars">${starsHtml}</div>
        <h2 class="lcl-reward-title">${message}</h2>
        <div class="lcl-reward-palette">${palette}</div>
        <div class="lcl-reward-score">Đúng <strong>${state.score}</strong> / ${state.total} câu</div>
        <div class="lcl-reward-tip">Bé đã biết 6 màu sắc và cách pha trộn!</div>
        <div class="lcl-reward-actions">
          <button class="lc-btn lc-btn-secondary" onclick="window._lessonColors.restart()">Học lại</button>
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

  window._lessonColors = {
    open, restart, speak,
    tapExplore, startSort, answerSort,
    answerMix,
  };

  // ── Hook ──
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (typeof openTopic === 'function') {
        const _orig = openTopic;
        window.openTopic = function (topic) {
          if (topic === 'colors0') { window._lessonColors.open(); return; }
          _orig(topic);
        };
      }
    }, 0);
  });
})();
