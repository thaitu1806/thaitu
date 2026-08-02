// === Interactive Counting Lesson for Grade 0 (5 tuổi) ===
// Self-contained module: hooks into openTopic('count0') in learn.js
// 4-step flow: Introduce → Tap-to-Count → Quiz → Reward
// Uses HocVuiSprite (shared module) for AI-style sprite icons
(function () {
  'use strict';

  // ── Helpers ──
  const S = () => window.HocVuiSprite; // shared sprite module

  // Get a random kid-friendly icon data {s, r, c}
  function randItem() {
    return S().randomKidFriendlyData();
  }

  // Render icon HTML from item data
  function iconHtml(item, size) {
    return S().html(item.s, item.r, item.c, size);
  }

  // ── Config ──
  const PRAISE = ['Giỏi lắm!', 'Tuyệt vời!', 'Đúng rồi!', 'Hay quá!', 'Xuất sắc!'];
  const ENCOURAGE = ['Thử lại nhé!', 'Gần đúng rồi!', 'Đếm lại nào!', 'Cố lên!'];

  let state = {
    step: 0,        // 0=intro, 1=tap-count, 2=quiz, 3=reward
    target: 1,      // target number to count to (1-5)
    itemSet: null,
    tapped: 0,
    quizScore: 0,
    quizTotal: 0,
    quizRound: 0,
    maxQuizRounds: 5,
  };

  // ── Helpers ──
  function $(id) { return document.getElementById(id); }
  function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function praise() { return rand(PRAISE); }
  function encourage() { return rand(ENCOURAGE); }

  function playSound(type) {
    if (window.HocVuiSound) window.HocVuiSound.play(type);
  }

  // ── TTS (Text-to-Speech) ──
  const NUMBER_WORDS = ['', 'Một', 'Hai', 'Ba', 'Bốn', 'Năm'];

  function speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'vi-VN';
    u.rate = 0.85;
    u.pitch = 1.1;
    // Try to find a Vietnamese voice
    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find(v => v.lang.startsWith('vi'));
    if (viVoice) u.voice = viVoice;
    window.speechSynthesis.speak(u);
  }

  function speakNumber(n) {
    if (n >= 1 && n <= 5) speak(NUMBER_WORDS[n]);
  }

  function speakerBtn(text) {
    return `<button class="lc-speak-btn" onclick="window._lessonCount.speak('${text.replace(/'/g, "\\'")}')"><img src="/img/sound-on.png" style="width:22px;height:22px;"></button>`;
  }

  // ── Render Screen ──
  function getScreen() { return $('count0-interactive-screen'); }

  function show() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    getScreen().classList.add('active');
  }

  // ── STEP 0: Introduction ──
  function renderIntro() {
    state.step = 0;
    state.target = 1;
    state.itemSet = randItem();

    const screen = getScreen();
    screen.querySelector('.lc-body').innerHTML = `
      <div class="lc-intro">
        <div class="lc-intro-icon">${iconHtml(state.itemSet, 96)}</div>
        <h2 class="lc-title">Tập đếm hình! ${speakerBtn('Tập đếm hình!')}</h2>
        <p class="lc-desc">Chạm vào từng hình để đếm nhé.</p>
        <div class="lc-tip">
          ${S().named('sun', 24)}
          Mỗi hình chỉ đếm <strong>1 lần</strong> thôi!
        </div>
        <button class="lc-btn lc-btn-primary" onclick="window._lessonCount.startTapCount()">
          Bắt đầu đếm!
        </button>
      </div>
    `;
    updateProgress();
  }

  // ── STEP 1: Tap-to-Count ──
  function startTapCount() {
    state.step = 1;
    state.tapped = 0;
    if (state.target > 5) {
      startQuiz();
      return;
    }

    state.itemSet = randItem();
    renderTapCount();
  }

  function renderTapCount() {
    const { target, itemSet, tapped } = state;
    const screen = getScreen();

    let itemsHTML = '';
    for (let i = 0; i < target; i++) {
      const tappedClass = i < tapped ? 'lc-item-tapped' : '';
      const delay = i * 0.1;
      itemsHTML += `
        <div class="lc-item ${tappedClass}" data-index="${i}"
             style="animation-delay:${delay}s"
             onclick="window._lessonCount.tapItem(${i})">
          ${iconHtml(itemSet, 56)}
          <span class="lc-item-number">${i < tapped ? i + 1 : ''}</span>
        </div>
      `;
    }

    screen.querySelector('.lc-body').innerHTML = `
      <div class="lc-tap-section">
        <div class="lc-instruction">
          <span class="lc-inst-text">Chạm vào từng hình để đếm! ${speakerBtn('Chạm vào từng hình để đếm')}</span>
          <span class="lc-counter">${tapped} / ${target}</span>
        </div>
        <div class="lc-items-grid lc-items-${target}">
          ${itemsHTML}
        </div>
        <div class="lc-number-display" id="lc-number-display">
          ${tapped > 0 ? `<span class="lc-big-number">${tapped}</span>` : '<span class="lc-big-number lc-placeholder">?</span>'}
        </div>
        <div class="lc-feedback" id="lc-tap-feedback"></div>
      </div>
    `;
    updateProgress();
  }

  function tapItem(index) {
    if (index !== state.tapped) return;

    state.tapped++;
    playSound('click');
    speakNumber(state.tapped); // Read the number aloud
    renderTapCount();

    if (state.tapped === state.target) {
      setTimeout(() => {
        playSound('correct');
        showTapSuccess();
      }, 400);
    }
  }

  function showTapSuccess() {
    const screen = getScreen();
    const fb = screen.querySelector('#lc-tap-feedback');
    if (fb) {
      fb.innerHTML = `
        <div class="lc-success-msg">
          ${S().named('star', 28)}
          <span>${praise()} Có <strong>${state.target}</strong> hình!</span>
        </div>
        <button class="lc-btn lc-btn-primary" onclick="window._lessonCount.nextTapRound()">
          ${state.target < 5 ? 'Đếm tiếp!' : 'Vào thử thách!'}
        </button>
      `;
    }
  }

  function nextTapRound() {
    state.target++;
    if (state.target > 5) {
      startQuiz();
    } else {
      state.tapped = 0;
      state.itemSet = randItem();
      renderTapCount();
    }
  }

  // ── STEP 2: Quiz ──
  function startQuiz() {
    state.step = 2;
    state.quizScore = 0;
    state.quizTotal = 0;
    state.quizRound = 0;
    nextQuizQuestion();
  }

  function nextQuizQuestion() {
    if (state.quizRound >= state.maxQuizRounds) {
      showReward();
      return;
    }

    state.quizRound++;
    const target = randInt(1, 5);
    const itemSet = randItem();

    // Generate items display using sprites
    let itemsHTML = '';
    for (let i = 0; i < target; i++) {
      itemsHTML += `<span class="lc-quiz-item" style="animation-delay:${i * 0.08}s">${iconHtml(itemSet, 48)}</span>`;
    }

    // Generate options (correct + 3 wrong)
    const wrongSet = new Set();
    while (wrongSet.size < 3) {
      const w = randInt(1, 5);
      if (w !== target) wrongSet.add(w);
    }
    const options = [target, ...wrongSet].sort(() => Math.random() - 0.5);

    const screen = getScreen();
    screen.querySelector('.lc-body').innerHTML = `
      <div class="lc-quiz-section">
        <div class="lc-quiz-header">
          <span class="lc-quiz-progress">Câu ${state.quizRound}/${state.maxQuizRounds}</span>
          <span class="lc-quiz-score">${S().named('star', 18)} ${state.quizScore}</span>
        </div>
        <p class="lc-quiz-question">Đếm xem có bao nhiêu hình? ${speakerBtn('Đếm xem có bao nhiêu hình?')}</p>
        <div class="lc-quiz-items">
          ${itemsHTML}
        </div>
        <div class="lc-quiz-options" id="lc-quiz-options">
          ${options.map(o => `
            <button class="lc-quiz-opt" data-value="${o}" onclick="window._lessonCount.answerQuiz(${o}, ${target})">
              ${o}
            </button>
          `).join('')}
        </div>
        <div class="lc-quiz-feedback" id="lc-quiz-feedback"></div>
      </div>
    `;
    updateProgress();
  }

  function answerQuiz(selected, correct) {
    const optionsEl = $('lc-quiz-options');
    const feedbackEl = $('lc-quiz-feedback');
    if (!optionsEl) return;

    optionsEl.querySelectorAll('.lc-quiz-opt').forEach(btn => {
      btn.disabled = true;
      const val = parseInt(btn.dataset.value);
      if (val === correct) btn.classList.add('lc-opt-correct');
      if (val === selected && val !== correct) btn.classList.add('lc-opt-wrong');
    });

    state.quizTotal++;
    if (selected === correct) {
      state.quizScore++;
      playSound('correct');
      feedbackEl.innerHTML = `<div class="lc-fb-correct">${praise()}</div>`;
    } else {
      playSound('wrong');
      feedbackEl.innerHTML = `<div class="lc-fb-wrong">${encourage()} Đáp án đúng là <strong>${correct}</strong>.</div>`;
    }

    setTimeout(() => nextQuizQuestion(), 1500);
  }

  // ── STEP 3: Reward ──
  function showReward() {
    state.step = 3;
    playSound('win');

    const stars = state.quizScore >= 4 ? 3 : state.quizScore >= 3 ? 2 : 1;
    const starsHTML = Array.from({length: 3}, (_, i) =>
      S().el(2, 0, 0, i < stars ? 36 : 24, i >= stars ? 'lc-star-dim' : '')
    ).join(' ');
    const message = stars === 3 ? 'Xuất sắc! Con giỏi quá!' :
                    stars === 2 ? 'Tốt lắm! Con làm tốt rồi!' :
                    'Cố gắng thêm nhé! Con làm được!';

    const screen = getScreen();
    screen.querySelector('.lc-body').innerHTML = `
      <div class="lc-reward">
        <div class="lc-reward-stars">${starsHTML}</div>
        <h2 class="lc-reward-title">${message}</h2>
        <div class="lc-reward-score">
          Đúng <strong>${state.quizScore}</strong> / ${state.maxQuizRounds} câu
        </div>
        <div class="lc-reward-actions">
          <button class="lc-btn lc-btn-secondary" onclick="window._lessonCount.restart()">Học lại</button>
          <button class="lc-btn lc-btn-primary" onclick="showScreen('menu-screen')">Về menu</button>
        </div>
      </div>
    `;

    if (window.HocVuiCollection && window.HocVuiCollection.reward) {
      window.HocVuiCollection.reward(stars);
    }
    updateProgress();
  }

  // ── Progress bar ──
  function updateProgress() {
    const bar = getScreen().querySelector('.lc-progress-bar');
    if (!bar) return;
    const pct = ((state.step + 1) / 4) * 100;
    bar.style.width = pct + '%';
  }

  // ── Public API ──
  function restart() {
    state.target = 1;
    state.tapped = 0;
    state.quizScore = 0;
    state.quizTotal = 0;
    state.quizRound = 0;
    renderIntro();
  }

  function open() {
    show();
    restart();
  }

  window._lessonCount = {
    open,
    restart,
    startTapCount,
    tapItem,
    nextTapRound,
    answerQuiz,
    speak,
  };

  // ── Hook into openTopic ──
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (typeof openTopic === 'function') {
        const _orig = openTopic;
        window.openTopic = function (topic) {
          if (topic === 'count0') {
            window._lessonCount.open();
            return;
          }
          _orig(topic);
        };
      }
    }, 0);
  });
})();
