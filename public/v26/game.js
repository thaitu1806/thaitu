// V26 - Vòng Quay May Mắn (Lucky Wheel)
(function() {
  'use strict';

  const STORAGE_KEY = 'v26_wheel';
  const SEGMENTS = [
    { label: '💰+10', type: 'coins', value: 10, icon: '💰' },
    { label: '💰+20', type: 'coins', value: 20, icon: '💰' },
    { label: '💰+50', type: 'coins', value: 50, icon: '💰' },
    { label: '⭐+1', type: 'stars', value: 1, icon: '⭐' },
    { label: '🎯x2', type: 'double', value: 0, icon: '🎯' },
    { label: '💎+5', type: 'diamonds', value: 5, icon: '💎' },
    { label: '🍀Free', type: 'free_spin', value: 1, icon: '🍀' },
    { label: '😢', type: 'empty', value: 0, icon: '😢' }
  ];

  // State
  let state = loadState();
  let quizQuestions = [];
  let currentQuizIndex = 0;
  let quizCorrectCount = 0;
  let tokensEarnedThisQuiz = 0;
  let isSpinning = false;
  let doubleNextReward = false;
  let answered = false;

  // DOM elements
  const hubScreen = document.getElementById('hub-screen');
  const quizScreen = document.getElementById('quiz-screen');
  const wheel = document.getElementById('wheel');
  const btnSpin = document.getElementById('btn-spin');
  const btnStartQuiz = document.getElementById('btn-start-quiz');
  const btnNext = document.getElementById('btn-next');
  const btnBackHub = document.getElementById('btn-back-hub');
  const btnCloseResult = document.getElementById('btn-close-result');
  const resultOverlay = document.getElementById('result-overlay');
  const sparklesEl = document.getElementById('sparkles');

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return { coins: 0, stars: 0, diamonds: 0, tokens: 0, totalSpins: 0, history: [] };
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function updateUI() {
    document.getElementById('stat-tokens').textContent = state.tokens;
    document.getElementById('stat-coins').textContent = state.coins;
    document.getElementById('stat-stars').textContent = state.stars;
    document.getElementById('stat-diamonds').textContent = state.diamonds;
    document.getElementById('stat-total-spins').textContent = state.totalSpins;

    // Spin button state
    btnSpin.disabled = state.tokens <= 0 || isSpinning;
    btnSpin.textContent = isSpinning ? '...' : 'QUAY!';

    // History
    renderHistory();

    // Double indicator
    let doubleEl = document.querySelector('.double-active');
    if (doubleNextReward && !doubleEl) {
      doubleEl = document.createElement('div');
      doubleEl.className = 'double-active';
      doubleEl.textContent = '🎯 x2 lần sau!';
      document.body.appendChild(doubleEl);
    } else if (!doubleNextReward && doubleEl) {
      doubleEl.remove();
    }
  }

  function renderHistory() {
    const list = document.getElementById('history-list');
    list.innerHTML = '';
    const recent = state.history.slice(-8).reverse();
    if (recent.length === 0) {
      list.innerHTML = '<div class="history-item" style="justify-content:center;opacity:0.6;">Chưa có phần thưởng nào</div>';
      return;
    }
    recent.forEach(item => {
      const el = document.createElement('div');
      el.className = 'history-item';
      el.innerHTML = `<span>${item.prize}</span><span style="opacity:0.6">${item.time}</span>`;
      list.appendChild(el);
    });
  }

  // WHEEL SPIN LOGIC
  function spinWheel() {
    if (state.tokens <= 0 || isSpinning) return;
    isSpinning = true;
    state.tokens--;
    state.totalSpins++;
    saveState();
    updateUI();

    // Random segment
    const segIndex = Math.floor(Math.random() * SEGMENTS.length);
    // Calculate rotation: at least 5 full spins + segment position
    const segmentAngle = 360 / SEGMENTS.length; // 45deg each
    // Pointer is at top (0 deg). Segment 0 spans from -22.5 to 22.5 at the top.
    // We need to rotate the wheel so that the chosen segment ends at the top.
    const targetAngle = 360 - (segIndex * segmentAngle + segmentAngle / 2);
    const totalRotation = 360 * (5 + Math.floor(Math.random() * 3)) + targetAngle;

    wheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
    wheel.style.transform = `rotate(${totalRotation}deg)`;

    setTimeout(() => {
      isSpinning = false;
      applyPrize(segIndex);
      // Reset transform for next spin (keep visual position)
      wheel.style.transition = 'none';
      wheel.style.transform = `rotate(${totalRotation % 360}deg)`;
      updateUI();
    }, 4200);
  }

  function applyPrize(segIndex) {
    const seg = SEGMENTS[segIndex];
    let prizeText = '';
    let icon = seg.icon;
    let multiplier = doubleNextReward ? 2 : 1;
    let wasDouble = doubleNextReward;

    if (seg.type === 'double') {
      // x2 doesn't get doubled itself
      doubleNextReward = true;
      prizeText = '🎯 Lần quay sau x2!';
      icon = '🎯';
    } else {
      // Apply double if active (for prize types)
      if (seg.type !== 'empty' && seg.type !== 'free_spin') {
        doubleNextReward = false;
      }

      switch(seg.type) {
        case 'coins':
          const coinVal = seg.value * multiplier;
          state.coins += coinVal;
          prizeText = `💰 +${coinVal} xu` + (wasDouble ? ' (x2!)' : '');
          break;
        case 'stars':
          const starVal = seg.value * multiplier;
          state.stars += starVal;
          prizeText = `⭐ +${starVal} sao` + (wasDouble ? ' (x2!)' : '');
          break;
        case 'diamonds':
          const diaVal = seg.value * multiplier;
          state.diamonds += diaVal;
          prizeText = `💎 +${diaVal} kim cương` + (wasDouble ? ' (x2!)' : '');
          break;
        case 'free_spin':
          state.tokens += 1;
          prizeText = '🍀 +1 lượt quay miễn phí!';
          doubleNextReward = false; // reset double on free spin
          break;
        case 'empty':
          prizeText = '😢 Không có gì...';
          doubleNextReward = false; // reset double on empty
          break;
      }
    }

    // Add to history
    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    state.history.push({ prize: prizeText, time: timeStr });
    if (state.history.length > 20) state.history = state.history.slice(-20);
    saveState();

    // Show result
    showResult(icon, prizeText, seg.type !== 'empty');
  }

  function showResult(icon, text, isWin) {
    document.getElementById('result-icon').textContent = icon;
    document.getElementById('result-text').textContent = isWin ? 'Chúc mừng! 🎉' : 'Tiếc quá!';
    document.getElementById('result-prize').textContent = text;
    resultOverlay.classList.add('active');

    if (isWin) {
      createSparkles();
    }
  }

  function createSparkles() {
    sparklesEl.innerHTML = '';
    const colors = ['#ffe066', '#ff6b6b', '#6BCB77', '#4D96FF', '#9B59B6', '#FFA94D'];
    for (let i = 0; i < 20; i++) {
      const spark = document.createElement('div');
      spark.className = 'sparkle';
      spark.style.left = (30 + Math.random() * 40) + '%';
      spark.style.top = (30 + Math.random() * 40) + '%';
      spark.style.background = colors[Math.floor(Math.random() * colors.length)];
      spark.style.animationDelay = (Math.random() * 0.5) + 's';
      spark.style.width = (6 + Math.random() * 8) + 'px';
      spark.style.height = spark.style.width;
      sparklesEl.appendChild(spark);
    }
    setTimeout(() => { sparklesEl.innerHTML = ''; }, 1500);
  }

  // QUIZ LOGIC
  async function startQuiz() {
    showScreen('quiz');
    currentQuizIndex = 0;
    quizCorrectCount = 0;
    tokensEarnedThisQuiz = 0;
    answered = false;
    btnBackHub.style.display = 'none';

    const profile = getProfile();
    const grade = profile ? profile.grade : 2;
    const subjects = ['math', 'vietnamese', 'english'];
    const subject = subjects[Math.floor(Math.random() * subjects.length)];

    try {
      const res = await fetch(`/api/questions?subject=${subject}&difficulty=easy&limit=10&grade=${grade}`);
      quizQuestions = await res.json();
      if (!quizQuestions || quizQuestions.length === 0) {
        // Fallback
        quizQuestions = generateFallbackQuestions();
      }
    } catch(e) {
      quizQuestions = generateFallbackQuestions();
    }

    showQuizQuestion();
  }

  function generateFallbackQuestions() {
    const questions = [];
    for (let i = 0; i < 10; i++) {
      const a = Math.floor(Math.random() * 20) + 1;
      const b = Math.floor(Math.random() * 20) + 1;
      const correct = a + b;
      const options = shuffleArray([
        correct,
        correct + Math.floor(Math.random() * 5) + 1,
        correct - Math.floor(Math.random() * 5) - 1,
        correct + Math.floor(Math.random() * 10) + 2
      ].map(String));
      const correctLetter = ['a','b','c','d'][options.indexOf(String(correct))];
      questions.push({
        question_text: `${a} + ${b} = ?`,
        option_a: options[0],
        option_b: options[1],
        option_c: options[2],
        option_d: options[3],
        correct_answer: correctLetter
      });
    }
    return questions;
  }

  function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function showQuizQuestion() {
    if (currentQuizIndex >= quizQuestions.length) {
      endQuiz();
      return;
    }

    answered = false;
    const q = quizQuestions[currentQuizIndex];
    document.getElementById('quiz-current').textContent = currentQuizIndex + 1;
    document.getElementById('quiz-correct').textContent = quizCorrectCount;
    document.getElementById('quiz-question').textContent = q.question_text;
    document.getElementById('quiz-feedback').textContent = '';
    btnNext.style.display = 'none';

    const optionsEl = document.getElementById('quiz-options');
    optionsEl.innerHTML = '';
    const labels = ['A', 'B', 'C', 'D'];
    const optionValues = [q.option_a, q.option_b, q.option_c, q.option_d];

    labels.forEach((label, i) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt';
      btn.textContent = `${label}. ${optionValues[i]}`;
      btn.dataset.answer = label;
      btn.addEventListener('click', () => selectAnswer(label, q.correct_answer));
      optionsEl.appendChild(btn);
    });
  }

  function selectAnswer(selected, correct) {
    if (answered) return;
    answered = true;

    const options = document.querySelectorAll('.quiz-opt');
    options.forEach(opt => {
      opt.classList.add('disabled');
      if (opt.dataset.answer.toLowerCase() === correct.toLowerCase()) opt.classList.add('correct');
      if (opt.dataset.answer.toLowerCase() === selected.toLowerCase() && selected.toLowerCase() !== correct.toLowerCase()) opt.classList.add('wrong');
    });

    const feedback = document.getElementById('quiz-feedback');
    if (selected.toLowerCase() === correct.toLowerCase()) {
      quizCorrectCount++;
      feedback.textContent = '✅ Đúng rồi!';
      feedback.style.color = '#6BCB77';

      // Check if earned a token (every 3 correct)
      if (quizCorrectCount % 3 === 0) {
        state.tokens++;
        tokensEarnedThisQuiz++;
        saveState();
        feedback.textContent = '✅ Đúng rồi! 🎟️ +1 lượt quay!';
      }
    } else {
      feedback.textContent = `❌ Sai rồi! Đáp án: ${correct}`;
      feedback.style.color = '#ff6b6b';
    }

    document.getElementById('quiz-correct').textContent = quizCorrectCount;

    // Show next button
    if (currentQuizIndex < quizQuestions.length - 1) {
      btnNext.style.display = 'block';
      btnNext.textContent = 'Câu tiếp →';
    } else {
      btnNext.style.display = 'block';
      btnNext.textContent = '🎡 Xem kết quả';
    }
  }

  function nextQuestion() {
    currentQuizIndex++;
    if (currentQuizIndex >= quizQuestions.length) {
      endQuiz();
    } else {
      showQuizQuestion();
    }
  }

  function endQuiz() {
    const feedback = document.getElementById('quiz-feedback');
    feedback.style.color = '#ffe066';
    feedback.textContent = `🏁 Hoàn thành! Đúng ${quizCorrectCount}/10 - Nhận ${tokensEarnedThisQuiz} 🎟️ lượt quay!`;

    document.getElementById('quiz-question').textContent = `🎉 Bạn trả lời đúng ${quizCorrectCount}/10 câu!`;
    document.getElementById('quiz-options').innerHTML = '';
    btnNext.style.display = 'none';
    btnBackHub.style.display = 'block';
    updateUI();

    // Check and show parent linking prompt after game ends
    if (typeof checkAndShowPrompt === 'function') {
      checkAndShowPrompt();
    }
  }

  // NAVIGATION
  function showScreen(name) {
    hubScreen.classList.remove('active');
    quizScreen.classList.remove('active');
    if (name === 'hub') {
      hubScreen.classList.add('active');
      updateUI();
    } else if (name === 'quiz') {
      quizScreen.classList.add('active');
    }
  }

  function getProfile() {
    try {
      const p = localStorage.getItem('hocvui_profile');
      return p ? JSON.parse(p) : null;
    } catch(e) { return null; }
  }

  // EVENT LISTENERS
  btnSpin.addEventListener('click', spinWheel);
  btnStartQuiz.addEventListener('click', startQuiz);
  btnNext.addEventListener('click', nextQuestion);
  btnBackHub.addEventListener('click', () => showScreen('hub'));
  btnCloseResult.addEventListener('click', () => {
    resultOverlay.classList.remove('active');
    updateUI();
  });

  // INIT
  updateUI();
})();

// ===== CHARACTER SYSTEM INTEGRATION (presentation only, additive) =====
// V26 is a special mode that does NOT save sessions. This block adds the
// shared animated character host + lucky-cat mascot, particle effects, and
// the guide/exit modals without altering any wheel/quiz logic above.
(function () {
  'use strict';
  let hostChar = null;

  function mountHost() {
    const slot = document.getElementById('host-mascot');
    if (!slot) return;
    slot.innerHTML = '';
    hostChar = null;
    const C = window.HocVuiCharacters;
    if (C && C.hasSpecies('host')) {
      hostChar = C.createCharacter('host', slot, { state: 'idle' });
    } else {
      slot.textContent = '🎩'; // emoji fallback
    }
  }

  function cheer() {
    if (hostChar) {
      hostChar.setState('happy');
      setTimeout(() => { if (hostChar) hostChar.setState('idle'); }, 800);
    }
  }

  // Particle helper — sparkle/confetti burst around a parent element.
  function spawnParticles(parent, kind, count) {
    if (!parent) return;
    const colors = ['#ffe066', '#ff6b6b', '#6BCB77', '#4D96FF', '#9B59B6', '#FFA94D'];
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'pfx pfx-' + kind;
      if (kind === 'confetti') p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.setProperty('--tx', (Math.random() * 90 - 45) + 'px');
      p.style.setProperty('--ty', -(Math.random() * 50 + 25) + 'px');
      p.style.setProperty('--delay', (Math.random() * 0.2) + 's');
      parent.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
  }
  window.__v26_spawnParticles = spawnParticles;

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    const $ = id => document.getElementById(id);
    mountHost();

    // Host cheers + confetti when a winning result popup appears.
    const overlay = $('result-overlay');
    if (overlay) {
      const mo = new MutationObserver(() => {
        if (overlay.classList.contains('active')) {
          const text = ($('result-text') || {}).textContent || '';
          if (text.indexOf('Chúc mừng') !== -1) {
            cheer();
            const popup = $('result-popup');
            if (popup) spawnParticles(popup, 'confetti', 16);
          }
        }
      });
      mo.observe(overlay, { attributes: true, attributeFilter: ['class'] });
    }

    // Host gives a little cheer + sparkles each time a correct quiz answer
    // earns a token. Watch the feedback line non-invasively.
    const feedback = $('quiz-feedback');
    if (feedback) {
      const fo = new MutationObserver(() => {
        if (feedback.textContent.indexOf('lượt quay') !== -1) {
          const slot = $('host-mascot');
          if (slot) spawnParticles(slot, 'sparkle', 8);
        }
      });
      fo.observe(feedback, { childList: true, characterData: true, subtree: true });
    }

    // Guide modal
    const guide = $('guide-modal');
    const guideBtn = $('btn-guide');
    if (guide && guideBtn) {
      guideBtn.addEventListener('click', () => { guide.style.display = 'flex'; });
      const gc = $('btn-guide-close');
      if (gc) gc.addEventListener('click', () => { guide.style.display = 'none'; });
      guide.addEventListener('click', e => { if (e.target === guide) guide.style.display = 'none'; });
    }

    // Exit modal (styled, no window.confirm). V26 does not save sessions.
    const exit = $('exit-modal');
    const exitBtn = $('btn-exit');
    if (exit && exitBtn) {
      exitBtn.addEventListener('click', () => { exit.style.display = 'flex'; });
      const ec = $('btn-exit-cancel');
      if (ec) ec.addEventListener('click', () => { exit.style.display = 'none'; });
      const ok = $('btn-exit-confirm');
      if (ok) ok.addEventListener('click', () => {
        exit.style.display = 'none';
        window.location.reload();
      });
      exit.addEventListener('click', e => { if (e.target === exit) exit.style.display = 'none'; });
    }
  });
})();
