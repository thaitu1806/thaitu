// === Interactive "Đếm Đến 20" Lesson for Grade 1 (Lớp 1) ===
// Hooks into openTopic('count1') in learn.js
// 4-step flow: Tap Count 1-10 → Tens Concept → Fill Missing → Reward
(function () {
  'use strict';

  const S = () => window.HocVuiSprite;

  // ── TTS ──
  const NUM_WORDS = ['không','một','hai','ba','bốn','năm','sáu','bảy','tám','chín','mười',
    'mười một','mười hai','mười ba','mười bốn','mười lăm','mười sáu','mười bảy','mười tám','mười chín','hai mươi'];

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
  function speakNum(n) { if (n >= 0 && n <= 20) speak(NUM_WORDS[n]); }
  function speakerBtn(text) {
    return `<button class="lc-speak-btn" onclick="window._lessonCount1.speak('${text.replace(/'/g, "\\'")}')"><img src="/img/sound-on.png" style="width:22px;height:22px;"></button>`;
  }

  // ── State ──
  let state = { step: 0, score: 0, total: 0, round: 0, tapped: 0 };

  // ── Helpers ──
  function $(id) { return document.getElementById(id); }
  function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function playSound(type) { if (window.HocVuiSound) window.HocVuiSound.play(type); }
  function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

  const PRAISE = ['Giỏi lắm!', 'Tuyệt vời!', 'Đúng rồi!', 'Hay quá!', 'Xuất sắc!'];
  const ENCOURAGE = ['Thử lại nhé!', 'Gần đúng rồi!', 'Cố lên!'];

  // Number sprite helper
  function numHtml(n, size) {
    if (window.HocVuiNumbers) return window.HocVuiNumbers.html(n, size || 28);
    return `<span style="font-weight:900;font-size:${size||28}px;">${n}</span>`;
  }

  function getScreen() { return $('count1-interactive-screen'); }
  function show() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    getScreen().classList.add('active');
  }
  function updateProgress() {
    const bar = getScreen().querySelector('.lc1-progress-bar');
    if (bar) bar.style.width = ((state.step + 1) / 4 * 100) + '%';
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 0: Tap Count 1-10 (review)
  // ══════════════════════════════════════════════════════════════════
  function renderTapCount() {
    state.step = 0;
    state.tapped = 0;
    const target = 10;
    state._tapTarget = target;

    const item = S().randomKidFriendlyData();
    state._tapItem = item;

    const body = getScreen().querySelector('.lc1-body');
    body.innerHTML = `
      <div class="lc1-tap-section">
        <p class="lc1-title">Ôn tập: Đếm đến 10! ${speakerBtn('Đếm đến mười')}</p>
        <p class="lc1-hint">Chạm từng hình theo thứ tự!</p>
        <div class="lc1-tap-grid" id="lc1-tap-grid">
          ${Array.from({length: target}, (_, i) => `
            <div class="lc1-tap-cell ${i < state.tapped ? 'lc1-tapped' : ''}" id="lc1-tap-${i}"
                 onclick="window._lessonCount1.tapCell(${i})">
              ${S().html(item.s, item.r, item.c, 36)}
              <span class="lc1-tap-num" id="lc1-num-${i}">${i < state.tapped ? numHtml(i + 1, 18) : ''}</span>
            </div>
          `).join('')}
        </div>
        <div class="lc1-counter" id="lc1-counter">${numHtml(0, 96)} / ${numHtml(10, 96)}</div>
        <div class="lc1-feedback" id="lc1-tap-fb"></div>
      </div>
    `;
    updateProgress();
  }

  function tapCell(idx) {
    if (idx !== state.tapped) return;
    state.tapped++;
    playSound('click');
    speakNum(state.tapped);

    // Update cell
    const cell = $('lc1-tap-' + idx);
    if (cell) cell.classList.add('lc1-tapped');
    const num = $('lc1-num-' + idx);
    if (num) num.innerHTML = numHtml(state.tapped, 18);
    const counter = $('lc1-counter');
    if (counter) counter.innerHTML = `${numHtml(state.tapped, 96)} / ${numHtml(10, 96)}`;

    if (state.tapped >= 10) {
      setTimeout(() => {
        playSound('correct');
        const fb = $('lc1-tap-fb');
        if (fb) fb.innerHTML = `
          <div class="lc1-success">${rand(PRAISE)} 10 là 1 chục!</div>
          <button class="lc-btn lc-btn-primary" onclick="window._lessonCount1.startTens()">Học tiếp: Chục!</button>
        `;
      }, 500);
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 1: Tens Concept — tens bars + units
  // ══════════════════════════════════════════════════════════════════
  function startTens() {
    state.step = 1;
    state.round = 0;
    state.score = 0;
    state.total = 0;
    nextTens();
  }

  function nextTens() {
    if (state.round >= 4) { startFill(); return; }
    state.round++;

    // Generate: show N tens-bars + M units, ask "What number?"
    const tens = randInt(1, 2);
    const units = randInt(0, 9);
    const answer = tens * 10 + units;

    // Wrong options
    const wrongs = new Set();
    while (wrongs.size < 3) {
      const w = randInt(10, 20);
      if (w !== answer) wrongs.add(w);
    }
    const options = shuffle([answer, ...wrongs]);
    const correctIdx = options.indexOf(answer);

    // Visual: tens bars and unit cubes from separate images
    const barsHtml = Array.from({length: tens}, () =>
      `<img src="/img/tens-bar.png" style="height:300px;" alt="10">`
    ).join('');
    const unitsHtml = units > 0 ? Array.from({length: units}, () =>
      `<img src="/img/unit-cube.png" style="width:56px;height:56px;margin:-2px;" alt="1">`
    ).join('') : '';

    const body = getScreen().querySelector('.lc1-body');
    body.innerHTML = `
      <div class="lc1-tens-section">
        <div class="lc1-tens-header">
          <span class="lc1-round-badge">Câu ${state.round}/4</span>
          <span class="lc1-score-badge">${S().named('star', 16)} ${state.score}</span>
        </div>
        <p class="lc1-question">Đây là số mấy? ${speakerBtn('Đây là số mấy?')}</p>
        <div class="lc1-blocks">
          <div class="lc1-bars">${barsHtml}</div>
          ${unitsHtml ? `<div class="lc1-units">${unitsHtml}</div>` : ''}
        </div>
        <p class="lc1-hint">${numHtml(tens * 10, 36)} + ${units > 0 ? numHtml(units, 36) : numHtml(0, 36)} = ?</p>
        <div class="lc1-options" id="lc1-tens-opts">
          ${options.map((o, i) => `
            <button class="lc1-opt" onclick="window._lessonCount1.answerTens(${i}, ${correctIdx}, ${answer})">${numHtml(o, 32)}</button>
          `).join('')}
        </div>
        <div class="lc1-feedback" id="lc1-tens-fb"></div>
      </div>
    `;
    updateProgress();
  }

  function answerTens(picked, correctIdx, answer) {
    state.total++;
    const opts = getScreen().querySelectorAll('.lc1-opt');
    opts.forEach((o, i) => {
      o.style.pointerEvents = 'none';
      if (i === correctIdx) o.classList.add('lc1-opt-correct');
      if (i === picked && i !== correctIdx) o.classList.add('lc1-opt-wrong');
    });
    const fb = $('lc1-tens-fb');
    if (picked === correctIdx) {
      state.score++; playSound('correct');
      speakNum(answer);
      if (fb) fb.innerHTML = `<div class="lc1-fb-ok">${rand(PRAISE)}</div>`;
    } else {
      playSound('wrong');
      if (fb) fb.innerHTML = `<div class="lc1-fb-wrong">${rand(ENCOURAGE)} Đáp án: ${answer}</div>`;
    }
    setTimeout(() => nextTens(), 1500);
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 2: Fill Missing Numbers (number chart 1-20)
  // ══════════════════════════════════════════════════════════════════
  function startFill() {
    state.step = 2;
    state.round = 0;
    nextFill();
  }

  function nextFill() {
    if (state.round >= 3) { showReward(); return; }
    state.round++;

    // Create a number chart 1-20 with some missing
    const missing = shuffle(Array.from({length: 20}, (_, i) => i + 1)).slice(0, 3);
    state._missing = [...missing];
    state._fillIdx = 0;

    const body = getScreen().querySelector('.lc1-body');
    body.innerHTML = `
      <div class="lc1-fill-section">
        <div class="lc1-tens-header">
          <span class="lc1-round-badge">Bảng ${state.round}/3</span>
          <span class="lc1-score-badge">${S().named('star', 16)} ${state.score}</span>
        </div>
        <p class="lc1-question">Điền số còn thiếu! ${speakerBtn('Điền số còn thiếu')}</p>
        <div class="lc1-chart" id="lc1-chart">
          ${Array.from({length: 20}, (_, i) => {
            const n = i + 1;
            const isMissing = missing.includes(n);
            return `<div class="lc1-chart-cell ${isMissing ? 'lc1-cell-missing' : ''}" id="lc1-cell-${n}">${isMissing ? '?' : numHtml(n, 22)}</div>`;
          }).join('')}
        </div>
        <div class="lc1-fill-prompt" id="lc1-fill-prompt"></div>
        <div class="lc1-feedback" id="lc1-fill-fb"></div>
      </div>
    `;
    showFillPrompt();
    updateProgress();
  }

  function showFillPrompt() {
    const idx = state._fillIdx;
    if (idx >= state._missing.length) {
      // All filled!
      state.score++;
      state.total++;
      playSound('correct');
      const fb = $('lc1-fill-fb');
      if (fb) fb.innerHTML = `<div class="lc1-fb-ok">${rand(PRAISE)} Bảng số hoàn chỉnh!</div>`;
      setTimeout(() => nextFill(), 1500);
      return;
    }

    const target = state._missing[idx];
    // Generate options
    const wrongs = new Set();
    while (wrongs.size < 2) {
      const w = randInt(1, 20);
      if (w !== target) wrongs.add(w);
    }
    const options = shuffle([target, ...wrongs]);
    const correctIdx = options.indexOf(target);

    const prompt = $('lc1-fill-prompt');
    if (prompt) {
      prompt.innerHTML = `
        <p style="font-weight:700;margin-bottom:8px;">Ô dấu ? là số mấy?</p>
        <div class="lc1-fill-opts">
          ${options.map((o, i) => `
            <button class="lc1-opt" onclick="window._lessonCount1.answerFill(${i}, ${correctIdx}, ${target})">${numHtml(o, 28)}</button>
          `).join('')}
        </div>
      `;
    }

    // Highlight the missing cell
    document.querySelectorAll('.lc1-cell-missing').forEach(c => c.classList.remove('lc1-cell-active'));
    const cell = $('lc1-cell-' + target);
    if (cell) cell.classList.add('lc1-cell-active');
  }

  function answerFill(picked, correctIdx, target) {
    const opts = getScreen().querySelectorAll('.lc1-fill-opts .lc1-opt');
    opts.forEach(o => o.style.pointerEvents = 'none');

    if (picked === correctIdx) {
      playSound('click');
      speakNum(target);
      // Fill in the cell
      const cell = $('lc1-cell-' + target);
      if (cell) {
        cell.innerHTML = numHtml(target, 22);
        cell.classList.remove('lc1-cell-missing', 'lc1-cell-active');
        cell.classList.add('lc1-cell-filled');
      }
      state._fillIdx++;
      setTimeout(() => showFillPrompt(), 600);
    } else {
      playSound('wrong');
      state.total++;
      const fb = $('lc1-fill-fb');
      if (fb) fb.innerHTML = `<div class="lc1-fb-wrong">${rand(ENCOURAGE)}</div>`;
      setTimeout(() => {
        if (fb) fb.innerHTML = '';
        showFillPrompt();
      }, 1000);
    }
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
      SP.el(2, 0, 0, i < stars ? 36 : 24, i >= stars ? 'lc1-star-dim' : '')
    ).join(' ');
    const message = stars === 3 ? 'Xuất sắc! Bé đếm giỏi!' :
                    stars === 2 ? 'Tốt lắm! Tiến bộ nhiều!' :
                    'Cố gắng thêm nhé!';

    const body = getScreen().querySelector('.lc1-body');
    body.innerHTML = `
      <div class="lc1-reward">
        <div class="lc1-reward-stars">${starsHtml}</div>
        <h2 class="lc1-reward-title">${message}</h2>
        <div class="lc1-reward-score">Đúng <strong>${state.score}</strong> / ${state.total} câu</div>
        <div class="lc1-reward-concepts">
          <div class="lc1-concept">10 đơn vị = 1 chục</div>
          <div class="lc1-concept">1 chục + đơn vị = số từ 11-19</div>
          <div class="lc1-concept">2 chục = 20</div>
        </div>
        <div class="lc1-reward-actions">
          <button class="lc-btn lc-btn-secondary" onclick="window._lessonCount1.restart()">Học lại</button>
          <button class="lc-btn lc-btn-primary" onclick="showScreen('menu-screen')">Về menu</button>
        </div>
      </div>
    `;
    if (window.HocVuiCollection && window.HocVuiCollection.reward) window.HocVuiCollection.reward(stars);
    updateProgress();
  }

  // ── Public API ──
  function restart() { state = { step: 0, score: 0, total: 0, round: 0, tapped: 0 }; renderTapCount(); }
  function open() { show(); restart(); }

  window._lessonCount1 = {
    open, restart, speak,
    tapCell, startTens, answerTens,
    answerFill,
  };

  // ── Hook ──
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (typeof openTopic === 'function') {
        const _orig = openTopic;
        window.openTopic = function (topic) {
          if (topic === 'count1') { window._lessonCount1.open(); return; }
          _orig(topic);
        };
      }
    }, 0);
  });
})();
