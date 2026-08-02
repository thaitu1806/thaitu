// === Interactive "To - Nhỏ" (Size) Lesson for Grade 0 (5 tuổi) ===
// Hooks into openTopic('size0') in learn.js
// 4-step flow: Explore → Easy Pick → 3-Level Challenge → Reward
(function () {
  'use strict';

  const S = () => window.HocVuiSprite;

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
    return `<button class="lc-speak-btn" onclick="window._lessonSize.speak('${text.replace(/'/g, "\\'")}')"><img src="/img/sound-on.png" style="width:22px;height:22px;"></button>`;
  }

  // ── State ──
  let state = { step: 0, score: 0, total: 0, round: 0 };

  // ── Helpers ──
  function $(id) { return document.getElementById(id); }
  function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function iconHtml(item, size) { return S().html(item.s, item.r, item.c, size); }
  function playSound(type) { if (window.HocVuiSound) window.HocVuiSound.play(type); }

  const PRAISE = ['Giỏi lắm!', 'Tuyệt vời!', 'Đúng rồi!', 'Hay quá!', 'Xuất sắc!'];
  const ENCOURAGE = ['Thử lại nhé!', 'Gần đúng rồi!', 'Cố lên!'];

  function getScreen() { return $('size0-interactive-screen'); }
  function show() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    getScreen().classList.add('active');
  }
  function updateProgress() {
    const bar = getScreen().querySelector('.lsz-progress-bar');
    if (bar) bar.style.width = ((state.step + 1) / 4 * 100) + '%';
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 0: Explore — tap to discover big vs small (same object type)
  // ══════════════════════════════════════════════════════════════════
  function renderExplore() {
    state.step = 0;
    const item = S().randomKidFriendlyData();
    state._exploreItem = item;
    state._explored = { big: false, small: false };

    const body = getScreen().querySelector('.lsz-body');
    body.innerHTML = `
      <div class="lsz-explore">
        <p class="lsz-title">Chạm vào hình để khám phá! ${speakerBtn('Chạm vào hình để khám phá')}</p>
        <div class="lsz-explore-pair">
          <div class="lsz-explore-item lsz-big" id="lsz-big" onclick="window._lessonSize.tapExplore('big')">
            ${iconHtml(item, 80)}
            <span class="lsz-size-label" id="lsz-label-big"></span>
          </div>
          <div class="lsz-explore-item lsz-small" id="lsz-small" onclick="window._lessonSize.tapExplore('small')">
            ${iconHtml(item, 40)}
            <span class="lsz-size-label" id="lsz-label-small"></span>
          </div>
        </div>
        <div class="lsz-explore-tip" id="lsz-explore-tip">
          ${S().named('sun', 20)} Cùng loại nhưng kích thước khác nhau!
        </div>
        <div id="lsz-explore-next" style="margin-top:14px;"></div>
      </div>
    `;
    updateProgress();
  }

  function tapExplore(which) {
    const el = $(which === 'big' ? 'lsz-big' : 'lsz-small');
    const label = $(which === 'big' ? 'lsz-label-big' : 'lsz-label-small');
    if (!el || !label) return;

    if (which === 'big') {
      el.classList.add('lsz-bounced');
      label.textContent = 'TO!';
      label.className = 'lsz-size-label lsz-label-show lsz-label-big-color';
      speak('To!');
      state._explored.big = true;
    } else {
      el.classList.add('lsz-bounced');
      label.textContent = 'NHỎ!';
      label.className = 'lsz-size-label lsz-label-show lsz-label-small-color';
      speak('Nhỏ!');
      state._explored.small = true;
    }
    playSound('click');

    if (state._explored.big && state._explored.small) {
      setTimeout(() => {
        const next = $('lsz-explore-next');
        if (next) {
          next.innerHTML = `
            <div class="lsz-concept-box">
              <p><span class="lsz-hl-big">TO</span> = kích thước lớn ${speakerBtn('To là kích thước lớn')}</p>
              <p><span class="lsz-hl-small">NHỎ</span> = kích thước bé ${speakerBtn('Nhỏ là kích thước bé')}</p>
            </div>
            <button class="lc-btn lc-btn-primary" onclick="window._lessonSize.startEasy()">Tiếp tục!</button>
          `;
        }
      }, 500);
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 1: Easy Pick — choose the big or small one (same type, clear diff)
  // ══════════════════════════════════════════════════════════════════
  function startEasy() {
    state.step = 1;
    state.round = 0;
    state.score = 0;
    state.total = 0;
    nextEasy();
  }

  function nextEasy() {
    if (state.round >= 4) { startChallenge(); return; }
    state.round++;

    const item = S().randomKidFriendlyData();
    const askBig = Math.random() > 0.5;
    const question = askBig ? 'Chọn hình TO hơn!' : 'Chọn hình NHỎ hơn!';
    // Big = 72px, Small = 36px (clear 2x difference)
    const bigSize = 72, smallSize = 36;

    // Random left/right placement
    const bigLeft = Math.random() > 0.5;

    const body = getScreen().querySelector('.lsz-body');
    body.innerHTML = `
      <div class="lsz-pick-section">
        <div class="lsz-pick-header">
          <span class="lsz-round-badge">Câu ${state.round}/4</span>
        </div>
        <p class="lsz-question">${question} ${speakerBtn(question)}</p>
        <div class="lsz-pick-pair">
          <div class="lsz-pick-item" id="lsz-pick-left" onclick="window._lessonSize.answerEasy(${bigLeft}, ${askBig})">
            ${iconHtml(item, bigLeft ? bigSize : smallSize)}
          </div>
          <div class="lsz-pick-item" id="lsz-pick-right" onclick="window._lessonSize.answerEasy(${!bigLeft}, ${askBig})">
            ${iconHtml(item, bigLeft ? smallSize : bigSize)}
          </div>
        </div>
        <div class="lsz-feedback" id="lsz-easy-fb"></div>
      </div>
    `;
    updateProgress();
  }

  function answerEasy(pickedBig, wantedBig) {
    const correct = pickedBig === wantedBig;
    state.total++;
    const items = getScreen().querySelectorAll('.lsz-pick-item');
    items.forEach(i => i.style.pointerEvents = 'none');
    const fb = $('lsz-easy-fb');

    if (correct) {
      state.score++;
      playSound('correct');
      if (fb) fb.innerHTML = `<div class="lsz-fb-ok">${rand(PRAISE)}</div>`;
    } else {
      playSound('wrong');
      if (fb) fb.innerHTML = `<div class="lsz-fb-wrong">${rand(ENCOURAGE)}</div>`;
    }
    setTimeout(() => nextEasy(), 1400);
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 2: Challenge — 3 levels (biggest/smallest) + ordering
  // ══════════════════════════════════════════════════════════════════
  function startChallenge() {
    state.step = 2;
    state.round = 0;
    nextChallenge();
  }

  function nextChallenge() {
    if (state.round >= 4) { showReward(); return; }
    state.round++;

    // Alternate between "pick biggest/smallest from 3" and "order by size"
    if (state.round <= 2) {
      renderPickFromThree();
    } else {
      renderOrdering();
    }
  }

  function renderPickFromThree() {
    const item = S().randomKidFriendlyData();
    const askBiggest = Math.random() > 0.5;
    const question = askBiggest ? 'Chọn hình TO NHẤT!' : 'Chọn hình NHỎ NHẤT!';
    // 3 sizes: 72, 52, 32
    const sizes = [72, 52, 32];
    const correctIdx = askBiggest ? 0 : 2;

    // Shuffle positions
    const order = [0, 1, 2].sort(() => Math.random() - 0.5);
    const shuffledCorrect = order.indexOf(correctIdx);

    const body = getScreen().querySelector('.lsz-body');
    body.innerHTML = `
      <div class="lsz-pick-section">
        <div class="lsz-pick-header">
          <span class="lsz-round-badge">Thử thách ${state.round}/4</span>
          <span class="lsz-score-badge">${S().named('star', 16)} ${state.score}</span>
        </div>
        <p class="lsz-question">${question} ${speakerBtn(question)}</p>
        <div class="lsz-pick-three">
          ${order.map((oi, i) => `
            <div class="lsz-pick-item lsz-pick-three-item" onclick="window._lessonSize.answerThree(${i}, ${shuffledCorrect})">
              ${iconHtml(item, sizes[oi])}
            </div>
          `).join('')}
        </div>
        <div class="lsz-feedback" id="lsz-challenge-fb"></div>
      </div>
    `;
    updateProgress();
  }

  function answerThree(picked, correctIdx) {
    state.total++;
    const items = getScreen().querySelectorAll('.lsz-pick-three-item');
    items.forEach((el, i) => {
      el.style.pointerEvents = 'none';
      if (i === correctIdx) el.classList.add('lsz-item-correct');
      if (i === picked && i !== correctIdx) el.classList.add('lsz-item-wrong');
    });
    const fb = $('lsz-challenge-fb');
    if (picked === correctIdx) {
      state.score++;
      playSound('correct');
      if (fb) fb.innerHTML = `<div class="lsz-fb-ok">${rand(PRAISE)}</div>`;
    } else {
      playSound('wrong');
      if (fb) fb.innerHTML = `<div class="lsz-fb-wrong">${rand(ENCOURAGE)}</div>`;
    }
    setTimeout(() => nextChallenge(), 1400);
  }

  // Ordering: arrange 3 items from small to big
  function renderOrdering() {
    const item = S().randomKidFriendlyData();
    const askAsc = Math.random() > 0.5; // small→big or big→small
    const question = askAsc ? 'Xếp từ NHỎ đến TO!' : 'Xếp từ TO đến NHỎ!';
    const sizes = [32, 52, 72]; // small, medium, big
    const correctOrder = askAsc ? [0, 1, 2] : [2, 1, 0];

    // Shuffle the displayed order
    const display = [0, 1, 2].sort(() => Math.random() - 0.5);
    state._orderItem = item;
    state._orderSizes = sizes;
    state._correctOrder = correctOrder;
    state._orderDisplay = display;
    state._orderPicked = [];

    const body = getScreen().querySelector('.lsz-body');
    body.innerHTML = `
      <div class="lsz-order-section">
        <div class="lsz-pick-header">
          <span class="lsz-round-badge">Thử thách ${state.round}/4</span>
          <span class="lsz-score-badge">${S().named('star', 16)} ${state.score}</span>
        </div>
        <p class="lsz-question">${question} ${speakerBtn(question)}</p>
        <p class="lsz-hint">Chạm theo thứ tự đúng!</p>
        <div class="lsz-order-items" id="lsz-order-items">
          ${display.map((si, i) => `
            <div class="lsz-order-item" id="lsz-oi-${i}" onclick="window._lessonSize.tapOrder(${i})">
              ${iconHtml(item, sizes[si])}
            </div>
          `).join('')}
        </div>
        <div class="lsz-order-slots" id="lsz-order-slots">
          <div class="lsz-slot" id="lsz-slot-0">1</div>
          <div class="lsz-slot" id="lsz-slot-1">2</div>
          <div class="lsz-slot" id="lsz-slot-2">3</div>
        </div>
        <div class="lsz-feedback" id="lsz-order-fb"></div>
      </div>
    `;
    updateProgress();
  }

  function tapOrder(displayIdx) {
    const el = $('lsz-oi-' + displayIdx);
    if (!el || el.classList.contains('lsz-order-picked')) return;

    const picked = state._orderPicked;
    const sizeIdx = state._orderDisplay[displayIdx]; // which size (0=small,1=med,2=big)
    picked.push(sizeIdx);
    el.classList.add('lsz-order-picked');
    playSound('click');

    // Fill slot
    const slot = $('lsz-slot-' + (picked.length - 1));
    if (slot) {
      slot.innerHTML = iconHtml(state._orderItem, state._orderSizes[sizeIdx] * 0.6);
      slot.classList.add('lsz-slot-filled');
    }

    if (picked.length === 3) {
      // Check if order is correct
      state.total++;
      const correct = picked.every((v, i) => v === state._correctOrder[i]);
      const fb = $('lsz-order-fb');
      if (correct) {
        state.score++;
        playSound('correct');
        if (fb) fb.innerHTML = `<div class="lsz-fb-ok">${rand(PRAISE)}</div>`;
      } else {
        playSound('wrong');
        if (fb) fb.innerHTML = `<div class="lsz-fb-wrong">${rand(ENCOURAGE)}</div>`;
      }
      setTimeout(() => nextChallenge(), 1500);
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 3: Reward
  // ══════════════════════════════════════════════════════════════════
  function showReward() {
    state.step = 3;
    playSound('win');
    const stars = state.score >= 7 ? 3 : state.score >= 5 ? 2 : 1;
    const SP = S();
    const starsHtml = Array.from({length: 3}, (_, i) =>
      SP.el(2, 0, 0, i < stars ? 36 : 24, i >= stars ? 'lsz-star-dim' : '')
    ).join(' ');
    const message = stars === 3 ? 'Xuất sắc! Đôi mắt tinh anh!' :
                    stars === 2 ? 'Tốt lắm! Bé phân biệt giỏi rồi!' :
                    'Cố gắng thêm nhé!';

    const body = getScreen().querySelector('.lsz-body');
    body.innerHTML = `
      <div class="lsz-reward">
        <div class="lsz-reward-stars">${starsHtml}</div>
        <h2 class="lsz-reward-title">${message}</h2>
        <div class="lsz-reward-score">Đúng <strong>${state.score}</strong> / ${state.total} câu</div>
        <div class="lsz-reward-concepts">
          <div class="lsz-concept lsz-c-big">TO = kích thước lớn</div>
          <div class="lsz-concept lsz-c-small">NHỎ = kích thước bé</div>
        </div>
        <div class="lsz-reward-actions">
          <button class="lc-btn lc-btn-secondary" onclick="window._lessonSize.restart()">Học lại</button>
          <button class="lc-btn lc-btn-primary" onclick="showScreen('menu-screen')">Về menu</button>
        </div>
      </div>
    `;
    if (window.HocVuiCollection && window.HocVuiCollection.reward) window.HocVuiCollection.reward(stars);
    updateProgress();
  }

  // ── Public API ──
  function restart() { state = { step: 0, score: 0, total: 0, round: 0 }; renderExplore(); }
  function open() { show(); restart(); }

  window._lessonSize = {
    open, restart, speak,
    tapExplore, startEasy, answerEasy,
    answerThree, tapOrder,
  };

  // ── Hook ──
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (typeof openTopic === 'function') {
        const _orig = openTopic;
        window.openTopic = function (topic) {
          if (topic === 'size0') { window._lessonSize.open(); return; }
          _orig(topic);
        };
      }
    }, 0);
  });
})();
