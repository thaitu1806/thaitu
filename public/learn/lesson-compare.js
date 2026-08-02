// === Interactive "Nhiều - Ít" Lesson for Grade 0 (5 tuổi) ===
// Hooks into openTopic('compare0') in learn.js
// 4-step flow: Pairing Demo → Easy Compare → Challenge → Reward
// Uses HocVuiSprite + TTS for rich interactive experience
(function () {
  'use strict';

  const S = () => window.HocVuiSprite;

  // ── Themed scenarios (pairing contexts) ──
  const THEMES = [
    { subject: { s:1, r:0, c:3 }, object: { s:3, r:5, c:2 }, subjectName: 'chú thỏ', objectName: 'củ cà rốt', story: 'Mỗi chú thỏ cần 1 củ cà rốt!' },
    { subject: { s:2, r:7, c:2 }, object: { s:2, r:4, c:2 }, subjectName: 'chú ong', objectName: 'bông hoa', story: 'Mỗi chú ong đậu vào 1 bông hoa!' },
    { subject: { s:1, r:0, c:0 }, object: { s:3, r:0, c:5 }, subjectName: 'chú cún', objectName: 'cái bát', story: 'Mỗi chú cún cần 1 cái bát!' },
    { subject: { s:2, r:9, c:2 }, object: { s:2, r:6, c:4 }, subjectName: 'con chim', objectName: 'cái tổ', story: 'Mỗi con chim cần 1 cái tổ!' },
    { subject: { s:1, r:0, c:1 }, object: { s:1, r:3, c:0 }, subjectName: 'con mèo', objectName: 'con cá', story: 'Mỗi con mèo ăn 1 con cá!' },
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
    return `<button class="lc-speak-btn" onclick="window._lessonCompare.speak('${text.replace(/'/g, "\\'")}')"><img src="/img/sound-on.png" style="width:22px;height:22px;"></button>`;
  }

  // ── State ──
  let state = {
    step: 0,       // 0=pair-demo, 1=easy-compare, 2=challenge, 3=reward
    theme: null,
    score: 0,
    total: 0,
    round: 0,
    maxRounds: 5,
    paired: 0,
  };

  // ── Helpers ──
  function $(id) { return document.getElementById(id); }
  function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function iconHtml(item, size) { return S().html(item.s, item.r, item.c, size); }
  function playSound(type) { if (window.HocVuiSound) window.HocVuiSound.play(type); }

  const PRAISE = ['Giỏi lắm!', 'Tuyệt vời!', 'Đúng rồi!', 'Hay quá!', 'Xuất sắc!'];
  const ENCOURAGE = ['Thử lại nhé!', 'Gần đúng rồi!', 'Cố lên!'];

  function getScreen() { return $('compare0-interactive-screen'); }

  function show() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    getScreen().classList.add('active');
  }

  function updateProgress() {
    const bar = getScreen().querySelector('.lcp-progress-bar');
    if (!bar) return;
    bar.style.width = ((state.step + 1) / 4 * 100) + '%';
  }

  // ══════════════════════════════════════════════════════════════════════
  // STEP 0: Pairing Demo — teach 1-1 correspondence
  // ══════════════════════════════════════════════════════════════════════
  function renderPairDemo() {
    state.step = 0;
    state.theme = rand(THEMES);
    state.paired = 0;
    const t = state.theme;
    const subjectCount = randInt(3, 4);
    const objectCount = subjectCount - 1; // always 1 less so concept is clear
    state._pairSubject = subjectCount;
    state._pairObject = objectCount;

    const subjectsHtml = Array.from({length: subjectCount}, (_, i) =>
      `<div class="lcp-pair-item lcp-subject" data-idx="${i}" id="lcp-sub-${i}">${iconHtml(t.subject, 44)}</div>`
    ).join('');
    const objectsHtml = Array.from({length: objectCount}, (_, i) =>
      `<div class="lcp-pair-item lcp-object" data-idx="${i}" id="lcp-obj-${i}" onclick="window._lessonCompare.pairTap(${i})">${iconHtml(t.object, 44)}</div>`
    ).join('');

    const body = getScreen().querySelector('.lcp-body');
    body.innerHTML = `
      <div class="lcp-pair-section">
        <p class="lcp-story">${t.story} ${speakerBtn(t.story)}</p>
        <div class="lcp-pair-rows">
          <div class="lcp-row lcp-row-top" id="lcp-row-top">${subjectsHtml}</div>
          <div class="lcp-pair-lines" id="lcp-pair-lines"></div>
          <div class="lcp-row lcp-row-bottom" id="lcp-row-bottom">${objectsHtml}</div>
        </div>
        <p class="lcp-pair-instruction">Chạm vào từng ${t.objectName} để ghép đôi! ${speakerBtn('Chạm vào từng ' + t.objectName + ' để ghép đôi')}</p>
        <div class="lcp-pair-feedback" id="lcp-pair-feedback"></div>
      </div>
    `;
    updateProgress();
  }

  function pairTap(index) {
    if (index !== state.paired) return;
    state.paired++;
    playSound('click');
    speak(state.paired <= 5 ? ['', 'Một', 'Hai', 'Ba', 'Bốn', 'Năm'][state.paired] : '');

    // Visual: highlight paired items
    const subEl = $('lcp-sub-' + index);
    const objEl = $('lcp-obj-' + index);
    if (subEl) subEl.classList.add('lcp-paired');
    if (objEl) objEl.classList.add('lcp-paired');

    // Draw connection line (CSS-based)
    const lines = $('lcp-pair-lines');
    if (lines) {
      lines.innerHTML += `<div class="lcp-line" style="animation-delay:${index * 0.1}s"></div>`;
    }

    if (state.paired >= state._pairObject) {
      // All objects paired — show leftover subject
      setTimeout(() => {
        playSound('correct');
        const leftover = state._pairSubject - state._pairObject;
        const t = state.theme;
        const fb = $('lcp-pair-feedback');
        if (fb) {
          fb.innerHTML = `
            <div class="lcp-conclusion">
              <p>Còn thừa <strong>${leftover}</strong> ${t.subjectName} không có ${t.objectName}!</p>
              <p class="lcp-key-concept">${speakerBtn('Số ' + t.subjectName + ' nhiều hơn số ' + t.objectName)}
                Số ${t.subjectName} <span class="lcp-highlight-more">NHIỀU HƠN</span> số ${t.objectName}.</p>
              <p class="lcp-key-concept">${speakerBtn('Số ' + t.objectName + ' ít hơn số ' + t.subjectName)}
                Số ${t.objectName} <span class="lcp-highlight-less">ÍT HƠN</span> số ${t.subjectName}.</p>
              <button class="lc-btn lc-btn-primary" onclick="window._lessonCompare.startEasy()">Tiếp tục!</button>
            </div>
          `;
        }
        // Highlight the leftover subject
        for (let i = state._pairObject; i < state._pairSubject; i++) {
          const el = $('lcp-sub-' + i);
          if (el) el.classList.add('lcp-leftover');
        }
      }, 600);
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // STEP 1: Easy Compare — pick the group with more/less (big difference)
  // ══════════════════════════════════════════════════════════════════════
  function startEasy() {
    state.step = 1;
    state.round = 0;
    state.score = 0;
    state.total = 0;
    nextEasyRound();
  }

  function nextEasyRound() {
    if (state.round >= 3) {
      startChallenge();
      return;
    }
    state.round++;
    const isMore = Math.random() > 0.5;
    const question = isMore ? 'Nhóm nào NHIỀU HƠN?' : 'Nhóm nào ÍT HƠN?';
    const a = randInt(3, 5);
    let b = randInt(1, 2); // big difference for easy
    if (!isMore) { // ensure the "less" answer is obvious
      b = randInt(1, 2);
    } else {
      b = randInt(1, 2);
    }

    const itemA = S().randomKidFriendlyData();
    const itemB = S().randomKidFriendlyData();

    const correctIsA = isMore ? (a > b) : (a < b);

    const rowA = Array.from({length: a}, () => iconHtml(itemA, 32)).join(' ');
    const rowB = Array.from({length: b}, () => iconHtml(itemB, 32)).join(' ');

    const body = getScreen().querySelector('.lcp-body');
    body.innerHTML = `
      <div class="lcp-compare-section">
        <div class="lcp-compare-header">
          <span class="lcp-round-badge">Câu ${state.round}/3</span>
        </div>
        <p class="lcp-question">${question} ${speakerBtn(question)}</p>
        <div class="lcp-groups">
          <div class="lcp-group lcp-group-a" onclick="window._lessonCompare.answerEasy(true, ${correctIsA})">
            <div class="lcp-group-label">A</div>
            <div class="lcp-group-items">${rowA}</div>
          </div>
          <div class="lcp-group lcp-group-b" onclick="window._lessonCompare.answerEasy(false, ${correctIsA})">
            <div class="lcp-group-label">B</div>
            <div class="lcp-group-items">${rowB}</div>
          </div>
        </div>
        <div class="lcp-feedback" id="lcp-easy-feedback"></div>
      </div>
    `;
    updateProgress();
  }

  function answerEasy(pickedA, correctIsA) {
    const correct = pickedA === correctIsA;
    state.total++;
    const fb = $('lcp-easy-feedback');
    const groups = getScreen().querySelectorAll('.lcp-group');
    groups.forEach(g => g.style.pointerEvents = 'none');

    if (correct) {
      state.score++;
      playSound('correct');
      if (fb) fb.innerHTML = `<div class="lcp-fb-ok">${rand(PRAISE)}</div>`;
      const winEl = groups[correctIsA ? 0 : 1];
      if (winEl) winEl.classList.add('lcp-group-correct');
    } else {
      playSound('wrong');
      if (fb) fb.innerHTML = `<div class="lcp-fb-wrong">${rand(ENCOURAGE)}</div>`;
      const wrongEl = groups[pickedA ? 0 : 1];
      const rightEl = groups[correctIsA ? 0 : 1];
      if (wrongEl) wrongEl.classList.add('lcp-group-wrong');
      if (rightEl) rightEl.classList.add('lcp-group-correct');
    }
    setTimeout(() => nextEasyRound(), 1500);
  }

  // ══════════════════════════════════════════════════════════════════════
  // STEP 2: Challenge — harder comparison (small differences) + variety
  // ══════════════════════════════════════════════════════════════════════
  function startChallenge() {
    state.step = 2;
    state.round = 0;
    nextChallengeRound();
  }

  function nextChallengeRound() {
    if (state.round >= 4) {
      showReward();
      return;
    }
    state.round++;

    // Generate close numbers (difference of 1)
    const a = randInt(3, 5);
    const b = a - 1;
    const isMore = Math.random() > 0.5;
    const question = isMore ? 'Nhóm nào NHIỀU HƠN?' : 'Nhóm nào ÍT HƠN?';

    // Use same icon type (same size) to avoid size confusion
    const item = S().randomKidFriendlyData();
    const correctIsA = isMore ? true : false; // A always has more (a > b)

    const rowA = Array.from({length: a}, () => iconHtml(item, 32)).join(' ');
    const rowB = Array.from({length: b}, () => iconHtml(item, 32)).join(' ');

    const body = getScreen().querySelector('.lcp-body');
    body.innerHTML = `
      <div class="lcp-compare-section">
        <div class="lcp-compare-header">
          <span class="lcp-round-badge">Thử thách ${state.round}/4</span>
          <span class="lcp-score-badge">${S().named('star', 16)} ${state.score}</span>
        </div>
        <p class="lcp-question">${question} ${speakerBtn(question)}</p>
        <p class="lcp-hint">Cùng loại, cùng kích thước — đếm kỹ nhé!</p>
        <div class="lcp-groups">
          <div class="lcp-group lcp-group-a" onclick="window._lessonCompare.answerChallenge(true, ${correctIsA})">
            <div class="lcp-group-label">A</div>
            <div class="lcp-group-items">${rowA}</div>
          </div>
          <div class="lcp-group lcp-group-b" onclick="window._lessonCompare.answerChallenge(false, ${correctIsA})">
            <div class="lcp-group-label">B</div>
            <div class="lcp-group-items">${rowB}</div>
          </div>
        </div>
        <div class="lcp-feedback" id="lcp-challenge-feedback"></div>
      </div>
    `;
    updateProgress();
  }

  function answerChallenge(pickedA, correctIsA) {
    const correct = pickedA === correctIsA;
    state.total++;
    const fb = $('lcp-challenge-feedback');
    const groups = getScreen().querySelectorAll('.lcp-group');
    groups.forEach(g => g.style.pointerEvents = 'none');

    if (correct) {
      state.score++;
      playSound('correct');
      if (fb) fb.innerHTML = `<div class="lcp-fb-ok">${rand(PRAISE)}</div>`;
      const winEl = groups[correctIsA ? 0 : 1];
      if (winEl) winEl.classList.add('lcp-group-correct');
    } else {
      playSound('wrong');
      if (fb) fb.innerHTML = `<div class="lcp-fb-wrong">${rand(ENCOURAGE)}</div>`;
      const wrongEl = groups[pickedA ? 0 : 1];
      const rightEl = groups[correctIsA ? 0 : 1];
      if (wrongEl) wrongEl.classList.add('lcp-group-wrong');
      if (rightEl) rightEl.classList.add('lcp-group-correct');
    }
    setTimeout(() => nextChallengeRound(), 1500);
  }

  // ══════════════════════════════════════════════════════════════════════
  // STEP 3: Reward
  // ══════════════════════════════════════════════════════════════════════
  function showReward() {
    state.step = 3;
    playSound('win');

    const stars = state.score >= 6 ? 3 : state.score >= 4 ? 2 : 1;
    const SP = S();
    const starsHtml = Array.from({length: 3}, (_, i) =>
      SP.el(2, 0, 0, i < stars ? 36 : 24, i >= stars ? 'lcp-star-dim' : '')
    ).join(' ');
    const message = stars === 3 ? 'Xuất sắc! Bé giỏi quá!' :
                    stars === 2 ? 'Tốt lắm! Bé phân biệt giỏi rồi!' :
                    'Cố gắng thêm nhé!';

    const body = getScreen().querySelector('.lcp-body');
    body.innerHTML = `
      <div class="lcp-reward">
        <div class="lcp-reward-stars">${starsHtml}</div>
        <h2 class="lcp-reward-title">${message}</h2>
        <p class="lcp-reward-badge">Bậc thầy so sánh!</p>
        <div class="lcp-reward-score">Đúng <strong>${state.score}</strong> / ${state.total} câu</div>
        <div class="lcp-reward-concepts">
          <div class="lcp-concept-card lcp-more">NHIỀU HƠN = số lượng lớn hơn</div>
          <div class="lcp-concept-card lcp-less">ÍT HƠN = số lượng nhỏ hơn</div>
        </div>
        <div class="lcp-reward-actions">
          <button class="lc-btn lc-btn-secondary" onclick="window._lessonCompare.restart()">Học lại</button>
          <button class="lc-btn lc-btn-primary" onclick="showScreen('menu-screen')">Về menu</button>
        </div>
      </div>
    `;

    if (window.HocVuiCollection && window.HocVuiCollection.reward) {
      window.HocVuiCollection.reward(stars);
    }
    updateProgress();
  }

  // ── Public API ──
  function restart() {
    state.score = 0; state.total = 0; state.round = 0; state.paired = 0;
    renderPairDemo();
  }

  function open() { show(); restart(); }

  window._lessonCompare = {
    open, restart, speak,
    pairTap, startEasy, answerEasy,
    answerChallenge,
  };

  // ── Hook into openTopic ──
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (typeof openTopic === 'function') {
        const _orig = openTopic;
        window.openTopic = function (topic) {
          if (topic === 'compare0') { window._lessonCompare.open(); return; }
          _orig(topic);
        };
      }
    }, 0);
  });
})();
