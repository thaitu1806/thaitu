(function() {
  'use strict';

  // === CASES DATA ===
  const CASES = [
    {
      id: 1,
      title: 'Ai lay banh cua Be Hoa?',
      titleDisplay: 'Ai lấy bánh của Bé Hoa?',
      story: 'Bé Hoa để bánh trên bàn bếp. Khi quay lại, bánh đã biến mất! Hãy tìm manh mối để phá án.',
      clues: [
        'Có dấu chân nhỏ xíu trên sàn bếp',
        'Trên bàn có vết kem dính lại',
        'Bé Nam đang ở ngoài sân lúc đó',
        'Cô Lan không vào bếp sáng nay',
        'Có tiếng kêu "meo meo" từ gầm bàn'
      ],
      suspects: [
        { name: 'Be Nam', nameDisplay: 'Bé Nam', emoji: '👦' },
        { name: 'Co Lan', nameDisplay: 'Cô Lan', emoji: '👩' },
        { name: 'Ong Ba', nameDisplay: 'Ông Ba', emoji: '👴' },
        { name: 'Con meo', nameDisplay: 'Con mèo', emoji: '🐱' }
      ],
      answer: 'Con meo'
    },
    {
      id: 2,
      title: 'Ai ve len tuong lop hoc?',
      titleDisplay: 'Ai vẽ lên tường lớp học?',
      story: 'Sáng nay, tường lớp học bị vẽ bậy bằng bút màu. Ai đã làm việc này?',
      clues: [
        'Hình vẽ có màu xanh lá và đỏ',
        'Bé Tùng mới mua bút màu hôm qua',
        'Tay Bé Tùng có vết màu dính',
        'Bé Minh đi học muộn sáng nay',
        'Bác bảo vệ thấy một bạn ở lại lớp giờ ra chơi'
      ],
      suspects: [
        { name: 'Be Minh', nameDisplay: 'Bé Minh', emoji: '👦' },
        { name: 'Be Hanh', nameDisplay: 'Bé Hạnh', emoji: '👧' },
        { name: 'Bac bao ve', nameDisplay: 'Bác bảo vệ', emoji: '👮' },
        { name: 'Be Tung', nameDisplay: 'Bé Tùng', emoji: '👦' }
      ],
      answer: 'Be Tung'
    },
    {
      id: 3,
      title: 'Ai giau chia khoa phong the duc?',
      titleDisplay: 'Ai giấu chìa khóa phòng thể dục?',
      story: 'Chìa khóa phòng thể dục bị giấu đi. Cả lớp không thể vào tập. Ai đã làm?',
      clues: [
        'Chìa khóa được tìm thấy trong balo một bạn nam',
        'Bé Đức không thích giờ thể dục',
        'Bé Lan và Bé Mai đã chờ ở cửa phòng từ sớm',
        'Thầy Nam để chìa khóa trên bàn giáo viên',
        'Bé Đức là người cuối cùng rời phòng giáo viên'
      ],
      suspects: [
        { name: 'Thay Nam', nameDisplay: 'Thầy Nam', emoji: '🧑‍🏫' },
        { name: 'Be Lan', nameDisplay: 'Bé Lan', emoji: '👧' },
        { name: 'Be Duc', nameDisplay: 'Bé Đức', emoji: '👦' },
        { name: 'Be Mai', nameDisplay: 'Bé Mai', emoji: '👧' }
      ],
      answer: 'Be Duc'
    },
    {
      id: 4,
      title: 'Mon qua bi an truoc cua nha',
      titleDisplay: 'Món quà bí ẩn trước cửa nhà',
      story: 'Sáng nay có một món quà được đặt trước cửa nhà, không có tên người gửi. Ai đã tặng?',
      clues: [
        'Quà được gói bằng giấy hoa có mùi nước hoa quen',
        'Bà ngoại gọi điện hỏi "con nhận được gì chưa?"',
        'Chú hàng xóm không biết chuyện gì',
        'Bưu tá hôm nay không đi qua xóm',
        'Trong quà có kẹo bà ngoại hay mua'
      ],
      suspects: [
        { name: 'Ba ngoai', nameDisplay: 'Bà ngoại', emoji: '👵' },
        { name: 'Be An', nameDisplay: 'Bé An', emoji: '👦' },
        { name: 'Chu hang xom', nameDisplay: 'Chú hàng xóm', emoji: '👨' },
        { name: 'Buu ta', nameDisplay: 'Bưu tá', emoji: '📮' }
      ],
      answer: 'Ba ngoai'
    },
    {
      id: 5,
      title: 'Ai an het keo trong lo?',
      titleDisplay: 'Ai ăn hết kẹo trong lọ?',
      story: 'Lọ kẹo đầy ắp tối qua, sáng nay đã trống không! Ai là "thủ phạm"?',
      clues: [
        'Trên bàn có giấy kẹo vương vãi',
        'Em bé có vết socola quanh miệng',
        'Chị Hai đang ăn kiêng, không ăn kẹo',
        'Bố đi công tác từ hôm qua',
        'Con chó không với tới lọ kẹo trên kệ cao'
      ],
      suspects: [
        { name: 'Em be', nameDisplay: 'Em bé', emoji: '👶' },
        { name: 'Chi Hai', nameDisplay: 'Chị Hai', emoji: '👩' },
        { name: 'Bo', nameDisplay: 'Bố', emoji: '👨' },
        { name: 'Con cho', nameDisplay: 'Con chó', emoji: '🐕' }
      ],
      answer: 'Em be'
    },
    {
      id: 6,
      title: 'Ai tang hoa cho co giao?',
      titleDisplay: 'Ai tặng hoa cho cô giáo?',
      story: 'Cô giáo nhận được bó hoa đẹp trên bàn nhưng không biết ai tặng. Hãy tìm ra!',
      clues: [
        'Hoa được cắt từ vườn nhà ai đó',
        'Bé Thảo nhà có vườn hoa hồng',
        'Bé Hùng hôm nay đi học trễ',
        'Phụ huynh không ai đến trường sáng nay',
        'Tay Bé Thảo có vết gai hoa hồng cào'
      ],
      suspects: [
        { name: 'Ca lop', nameDisplay: 'Cả lớp', emoji: '👫' },
        { name: 'Be Hung', nameDisplay: 'Bé Hùng', emoji: '👦' },
        { name: 'Be Thao', nameDisplay: 'Bé Thảo', emoji: '👧' },
        { name: 'Phu huynh', nameDisplay: 'Phụ huynh', emoji: '👨‍👩‍👧' }
      ],
      answer: 'Be Thao'
    }
  ];

  // === STATE ===
  let state = {
    subject: 'math',
    difficulty: 'easy',
    currentCase: null,
    cluesRevealed: 0,
    questions: [],
    questionIndex: 0,
    timer: null,
    timeLeft: 12,
    correctAnswers: 0,
    totalAnswered: 0,
    sessionId: null,
    startTime: null
  };

  // === PROFILE & PROGRESS ===
  function getProfile() {
    try { return JSON.parse(localStorage.getItem('hocvui_profile')); } catch { return null; }
  }

  function getProgress() {
    try { return JSON.parse(localStorage.getItem('v19_progress')) || { solved: [] }; } catch { return { solved: [] }; }
  }

  function saveProgress(progress) {
    localStorage.setItem('v19_progress', JSON.stringify(progress));
  }

  // === DOM REFERENCES ===
  const $ = id => document.getElementById(id);
  const screens = {
    setup: $('setup-screen'),
    cases: $('case-screen'),
    investigation: $('investigation-screen'),
    deduction: $('deduction-screen'),
    result: $('result-screen')
  };

  // === NAVIGATION ===
  function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
    window.scrollTo(0, 0);
  }

  // === SETUP ===
  function initSetup() {
    const progress = getProgress();
    $('cases-solved').textContent = progress.solved.length;

    // Subject buttons
    document.querySelectorAll('#subject-group .btn-option').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#subject-group .btn-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.subject = btn.dataset.subject;
      });
    });

    // Difficulty buttons
    document.querySelectorAll('#difficulty-group .btn-option').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#difficulty-group .btn-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.difficulty = btn.dataset.difficulty;
      });
    });

    $('btn-start').addEventListener('click', () => {
      showScreen('cases');
      renderCaseSelect();
    });

    $('btn-back-setup').addEventListener('click', () => {
      showScreen('setup');
    });
  }

  // === CASE SELECT ===
  function renderCaseSelect() {
    const progress = getProgress();
    const grid = $('case-grid');
    grid.innerHTML = '';

    CASES.forEach((c, index) => {
      const isSolved = progress.solved.includes(c.id);
      const isUnlocked = index === 0 || progress.solved.includes(CASES[index - 1].id);
      const statusClass = isSolved ? 'solved' : isUnlocked ? 'unlocked' : 'locked';

      const card = document.createElement('div');
      card.className = `case-card ${statusClass}`;
      card.innerHTML = `
        <div class="case-number">${isSolved ? '✅' : isUnlocked ? c.id : '🔒'}</div>
        <div class="case-info">
          <span class="case-name">${isUnlocked || isSolved ? c.titleDisplay : '???'}</span>
          <span class="case-status">${isSolved ? 'Đã phá án!' : isUnlocked ? 'Chưa giải' : 'Khóa'}</span>
        </div>
      `;

      if (isUnlocked && !isSolved) {
        card.addEventListener('click', () => startCase(c));
      } else if (isSolved) {
        card.addEventListener('click', () => startCase(c));
      }

      grid.appendChild(card);
    });
  }

  // === START CASE ===
  async function startCase(caseData) {
    state.currentCase = caseData;
    state.cluesRevealed = 0;
    state.questionIndex = 0;
    state.correctAnswers = 0;
    state.totalAnswered = 0;
    state.startTime = Date.now();

    // Fetch questions
    await fetchQuestions();

    // Setup investigation screen
    showScreen('investigation');
    renderInvestigation();
  }

  async function fetchQuestions() {
    const profile = getProfile();
    const params = new URLSearchParams({
      subject: state.subject === 'mix' ? ['math', 'vietnamese', 'english'][Math.floor(Math.random() * 3)] : state.subject,
      difficulty: state.difficulty,
      limit: 10
    });
    if (profile && profile.grade) params.set('grade', profile.grade);
    if (profile && profile.id) params.set('player_id', profile.id);

    try {
      const res = await fetch(`/api/questions?${params}`);
      state.questions = await res.json();
      if (!state.questions || state.questions.length === 0) {
        state.questions = generateFallbackQuestions();
      }
    } catch {
      state.questions = generateFallbackQuestions();
    }
  }

  function generateFallbackQuestions() {
    const qs = [];
    for (let i = 0; i < 10; i++) {
      const a = Math.floor(Math.random() * 10) + 1;
      const b = Math.floor(Math.random() * 10) + 1;
      const correct = a + b;
      const opts = [correct, correct + 1, correct - 1, correct + 2].sort(() => Math.random() - 0.5);
      const correctOpt = ['a','b','c','d'][opts.indexOf(correct)];
      qs.push({
        id: 9000 + i,
        question_text: `${a} + ${b} = ?`,
        option_a: String(opts[0]),
        option_b: String(opts[1]),
        option_c: String(opts[2]),
        option_d: String(opts[3]),
        correct_answer: correctOpt
      });
    }
    return qs;
  }

  // === INVESTIGATION ===
  function renderInvestigation() {
    const c = state.currentCase;
    $('case-badge').textContent = `Vu an #${c.id}`;
    $('case-story').textContent = c.titleDisplay;

    // Reset clue board
    const pins = document.querySelectorAll('.clue-pin');
    pins.forEach((pin, i) => {
      pin.classList.remove('revealed');
      pin.querySelector('.clue-text').textContent = '???';
    });

    // Reveal already-revealed clues
    for (let i = 0; i < state.cluesRevealed; i++) {
      revealClue(i, false);
    }

    updateActionButtons();
    $('quiz-area').style.display = 'none';
  }

  function revealClue(index, animate = true) {
    const pins = document.querySelectorAll('.clue-pin');
    if (index >= pins.length) return;
    const pin = pins[index];
    pin.classList.add('revealed');
    pin.querySelector('.clue-text').textContent = state.currentCase.clues[index];
    if (animate) {
      pin.style.animation = 'slideUp 0.4s ease';
      setTimeout(() => { pin.style.animation = ''; }, 400);
    }
  }

  function updateActionButtons() {
    const allRevealed = state.cluesRevealed >= 5;
    $('btn-investigate').style.display = allRevealed ? 'none' : 'inline-block';
    $('btn-deduce').style.display = 'inline-block';

    if (allRevealed) {
      $('btn-deduce').textContent = '🧠 Phán đoán thủ phạm!';
    } else {
      $('btn-deduce').textContent = '🧠 Đoán sớm (khó hơn!)';
    }
  }

  // === QUIZ ===
  function startQuiz() {
    if (state.questionIndex >= state.questions.length) {
      // Fetch more questions
      fetchQuestions().then(() => showQuizQuestion());
      return;
    }
    showQuizQuestion();
  }

  function showQuizQuestion() {
    const q = state.questions[state.questionIndex];
    if (!q) return;

    $('quiz-area').style.display = 'block';
    $('quiz-question').textContent = q.question_text;

    const btns = document.querySelectorAll('#quiz-answers .ans-btn');
    btns.forEach(btn => {
      const opt = btn.dataset.opt;
      btn.textContent = q[`option_${opt}`];
      btn.className = 'ans-btn';
      btn.disabled = false;
    });

    // Start timer
    state.timeLeft = 12;
    updateTimerDisplay();
    clearInterval(state.timer);
    state.timer = setInterval(() => {
      state.timeLeft -= 0.1;
      updateTimerDisplay();
      if (state.timeLeft <= 0) {
        clearInterval(state.timer);
        handleTimeout();
      }
    }, 100);
  }

  function updateTimerDisplay() {
    const fill = $('timer-fill');
    const pct = Math.max(0, (state.timeLeft / 12) * 100);
    fill.style.width = pct + '%';
    fill.className = 'timer-fill' + (state.timeLeft <= 4 ? ' warning' : '');
  }

  function handleTimeout() {
    const q = state.questions[state.questionIndex];
    const btns = document.querySelectorAll('#quiz-answers .ans-btn');
    btns.forEach(btn => {
      btn.disabled = true;
      if (btn.dataset.opt.toLowerCase() === q.correct_answer.toLowerCase()) btn.classList.add('correct');
    });
    state.totalAnswered++;
    state.questionIndex++;
    logAnswer(q, null, false);

    setTimeout(() => {
      $('quiz-area').style.display = 'none';
      // Don't reveal clue on timeout - player must try again
    }, 1500);
  }

  function handleAnswer(opt) {
    clearInterval(state.timer);
    const q = state.questions[state.questionIndex];
    const isCorrect = opt.toLowerCase() === q.correct_answer.toLowerCase();

    const btns = document.querySelectorAll('#quiz-answers .ans-btn');
    btns.forEach(btn => {
      btn.disabled = true;
      if (btn.dataset.opt.toLowerCase() === q.correct_answer.toLowerCase()) btn.classList.add('correct');
      if (btn.dataset.opt === opt && !isCorrect) btn.classList.add('wrong');
    });

    state.totalAnswered++;
    state.questionIndex++;
    logAnswer(q, opt, isCorrect);

    if (isCorrect) {
      state.correctAnswers++;
      // Reveal next clue
      setTimeout(() => {
        showMagnifyAnimation(() => {
          revealClue(state.cluesRevealed);
          state.cluesRevealed++;
          $('quiz-area').style.display = 'none';
          updateActionButtons();
        });
      }, 800);
    } else {
      setTimeout(() => {
        $('quiz-area').style.display = 'none';
      }, 1500);
    }
  }

  function showMagnifyAnimation(callback) {
    const overlay = document.createElement('div');
    overlay.className = 'magnify-overlay';
    overlay.innerHTML = '<div class="magnify-icon">🔍</div>';
    document.body.appendChild(overlay);
    setTimeout(() => {
      overlay.remove();
      if (callback) callback();
    }, 1200);
  }

  async function logAnswer(q, selected, isCorrect) {
    const profile = getProfile();
    if (!profile) return;
    try {
      await fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: state.sessionId || 0,
          player_id: profile.id,
          question_id: q.id,
          selected_answer: selected || 'timeout',
          correct_answer: q.correct_answer,
          is_correct: isCorrect,
          time_spent_ms: Math.round((12 - state.timeLeft) * 1000)
        })
      });
    } catch { /* non-fatal */ }
  }

  // === DEDUCTION ===
  function showDeduction() {
    const c = state.currentCase;
    showScreen('deduction');
    $('deduction-story').textContent = c.titleDisplay;

    const lineup = $('suspect-lineup');
    lineup.innerHTML = '';

    c.suspects.forEach(s => {
      const card = document.createElement('div');
      card.className = 'suspect-card';
      card.innerHTML = `
        <div class="suspect-avatar">${s.emoji}</div>
        <div class="suspect-name">${s.nameDisplay}</div>
      `;
      card.addEventListener('click', () => handleDeduction(s, card));
      lineup.appendChild(card);
    });
  }

  function handleDeduction(suspect, card) {
    const c = state.currentCase;
    const isCorrect = suspect.name === c.answer;

    // Disable all cards
    document.querySelectorAll('.suspect-card').forEach(sc => {
      sc.style.pointerEvents = 'none';
    });

    if (isCorrect) {
      card.classList.add('correct-reveal');
      setTimeout(() => showResult(true), 1000);
    } else {
      card.classList.add('wrong-reveal');
      // Highlight the correct one
      const correctSuspect = c.suspects.find(s => s.name === c.answer);
      setTimeout(() => {
        document.querySelectorAll('.suspect-card').forEach(sc => {
          if (sc.querySelector('.suspect-name').textContent === correctSuspect.nameDisplay) {
            sc.classList.add('correct-reveal');
          }
        });
      }, 800);
      setTimeout(() => showResult(false), 2000);
    }
  }

  // === RESULT ===
  async function showResult(caseSolved) {
    showScreen('result');
    const c = state.currentCase;
    const progress = getProgress();

    if (caseSolved && !progress.solved.includes(c.id)) {
      progress.solved.push(c.id);
      saveProgress(progress);
    }

    const container = $('result-container');
    const timeSpent = Math.round((Date.now() - state.startTime) / 1000);

    if (caseSolved) {
      container.innerHTML = `
        <div class="result-icon">🎉🕵️</div>
        <h2 class="result-title">Vụ án đã phá!</h2>
        <p class="result-message">Tuyệt vời! Thám tử nhí đã tìm ra thủ phạm: <strong>${c.suspects.find(s => s.name === c.answer).nameDisplay} ${c.suspects.find(s => s.name === c.answer).emoji}</strong></p>
        <div class="result-stats">
          <div class="result-stat"><span class="result-stat-label">Vụ án</span><span class="result-stat-value">${c.titleDisplay}</span></div>
          <div class="result-stat"><span class="result-stat-label">Manh mối tìm được</span><span class="result-stat-value">${state.cluesRevealed}/5</span></div>
          <div class="result-stat"><span class="result-stat-label">Câu hỏi đúng</span><span class="result-stat-value">${state.correctAnswers}/${state.totalAnswered}</span></div>
          <div class="result-stat"><span class="result-stat-label">Thời gian</span><span class="result-stat-value">${timeSpent}s</span></div>
          <div class="result-stat"><span class="result-stat-label">Tổng vụ án phá</span><span class="result-stat-value">${progress.solved.length}/6</span></div>
        </div>
        <button class="btn-result primary" id="btn-next-case">📁 Vụ án tiếp theo</button>
        <button class="btn-result secondary" id="btn-back-cases">🏠 Danh sách vụ án</button>
      `;
    } else {
      container.innerHTML = `
        <div class="result-icon">🤔</div>
        <h2 class="result-title">Sai rồi!</h2>
        <p class="result-message">Đó không phải thủ phạm. Thủ phạm thật là: <strong>${c.suspects.find(s => s.name === c.answer).nameDisplay} ${c.suspects.find(s => s.name === c.answer).emoji}</strong></p>
        <div class="result-stats">
          <div class="result-stat"><span class="result-stat-label">Vụ án</span><span class="result-stat-value">${c.titleDisplay}</span></div>
          <div class="result-stat"><span class="result-stat-label">Manh mối tìm được</span><span class="result-stat-value">${state.cluesRevealed}/5</span></div>
          <div class="result-stat"><span class="result-stat-label">Câu hỏi đúng</span><span class="result-stat-value">${state.correctAnswers}/${state.totalAnswered}</span></div>
        </div>
        <button class="btn-result primary" id="btn-retry-case">🔄 Thử lại vụ này</button>
        <button class="btn-result secondary" id="btn-back-cases">🏠 Danh sách vụ án</button>
      `;
    }

    // Save session
    await saveSession(caseSolved, timeSpent);

    // Bind result buttons
    const btnNext = $('btn-next-case');
    const btnRetry = $('btn-retry-case');
    const btnBackCases = $('btn-back-cases');

    if (btnNext) {
      btnNext.addEventListener('click', () => {
        const nextIndex = CASES.findIndex(cc => cc.id === c.id) + 1;
        if (nextIndex < CASES.length) {
          startCase(CASES[nextIndex]);
        } else {
          showScreen('cases');
          renderCaseSelect();
        }
      });
    }

    if (btnRetry) {
      btnRetry.addEventListener('click', () => {
        startCase(c);
      });
    }

    if (btnBackCases) {
      btnBackCases.addEventListener('click', () => {
        showScreen('cases');
        renderCaseSelect();
      });
    }

    // Call prompt check
    if (typeof window.checkAndShowPrompt === 'function') {
      window.checkAndShowPrompt();
    }
  }

  async function saveSession(caseSolved, timeSpent) {
    const profile = getProfile();
    if (!profile) return;

    const accuracy = state.totalAnswered > 0
      ? Math.round((state.correctAnswers / state.totalAnswered) * 100)
      : 0;
    const starsEarned = caseSolved ? (state.cluesRevealed >= 5 ? 3 : 2) : 0;

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: profile.id,
          subject: state.subject,
          difficulty: state.difficulty,
          score: state.correctAnswers * 10 + (caseSolved ? 50 : 0),
          total_questions: state.totalAnswered,
          correct_answers: state.correctAnswers,
          stars_earned: starsEarned,
          combo_max: state.correctAnswers, // best we can track
          mode: 'v19',
          accuracy: accuracy
        })
      });
      const data = await res.json();
      if (data.id) state.sessionId = data.id;
    } catch { /* non-fatal */ }
  }

  // === EVENT BINDINGS ===
  function bindEvents() {
    // Answer buttons in investigation
    document.querySelectorAll('#quiz-answers .ans-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!btn.disabled) handleAnswer(btn.dataset.opt);
      });
    });

    // Investigate button
    $('btn-investigate').addEventListener('click', () => {
      if (state.cluesRevealed < 5) {
        startQuiz();
      }
    });

    // Deduce button
    $('btn-deduce').addEventListener('click', () => {
      showDeduction();
    });

    // Back to investigation from deduction
    $('btn-back-investigation').addEventListener('click', () => {
      showScreen('investigation');
    });
  }

  // === INIT ===
  function init() {
    initSetup();
    bindEvents();
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

// ===== CHARACTER SYSTEM INTEGRATION (presentation only) =====
// V19's game logic lives in a private IIFE above, so this layer hooks the DOM
// non-invasively (MutationObservers + listeners) instead of wrapping globals.
(function () {
  'use strict';

  let detectiveChar = null;
  let pupChar = null;
  let happyTimer = null;

  function $(id) { return document.getElementById(id); }

  function mountDetectives() {
    const C = window.HocVuiCharacters;
    const dHost = $('detective-host');
    const pHost = $('pup-host');
    if (dHost && !detectiveChar) {
      dHost.innerHTML = '';
      if (C && C.hasSpecies('detective')) {
        detectiveChar = C.createCharacter('detective', dHost, { state: 'idle' });
      } else {
        dHost.textContent = '🕵️';
      }
    }
    if (pHost && !pupChar) {
      pHost.innerHTML = '';
      if (C && C.hasSpecies('pup')) {
        pupChar = C.createCharacter('pup', pHost, { state: 'idle' });
      } else {
        pHost.textContent = '🐶';
      }
    }
  }

  // Brief happy bounce, then settle back to idle.
  function cheer() {
    [detectiveChar, pupChar].forEach(c => {
      if (!c) return;
      c.setState('happy');
    });
    const stage = $('detective-stage');
    if (stage) spawnParticles(stage, 'sparkle', 8);
    clearTimeout(happyTimer);
    happyTimer = setTimeout(() => {
      [detectiveChar, pupChar].forEach(c => { if (c) c.setState('idle'); });
    }, 900);
  }

  // ===== PARTICLE HELPERS =====
  function spawnParticles(parent, kind, count) {
    if (!parent) return;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'pfx pfx-' + kind;
      p.style.setProperty('--tx', (Math.random() * 80 - 40) + 'px');
      p.style.setProperty('--ty', -(Math.random() * 50 + 20) + 'px');
      p.style.setProperty('--delay', (Math.random() * 0.15) + 's');
      parent.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
  }

  function spawnConfetti(parent, count) {
    if (!parent) return;
    const colors = ['#ffd700', '#7c4dff', '#4caf50', '#ff8c00', '#536dfe'];
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'pfx pfx-confetti';
      p.style.background = colors[i % colors.length];
      p.style.left = (Math.random() * 100) + '%';
      p.style.setProperty('--tx', (Math.random() * 120 - 60) + 'px');
      p.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
      p.style.setProperty('--delay', (Math.random() * 0.3) + 's');
      parent.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
  }
  window.__v19_spawnParticles = spawnParticles;
  window.__v19_spawnConfetti = spawnConfetti;

  // ===== OBSERVERS =====
  // Clue pins flip to .revealed only after a correct answer → cheer.
  function watchClueBoard() {
    const board = $('clue-board');
    if (!board) return;
    const obs = new MutationObserver(muts => {
      for (const m of muts) {
        if (m.type === 'attributes' && m.target.classList &&
            m.target.classList.contains('clue-pin') &&
            m.target.classList.contains('revealed')) {
          cheer();
          break;
        }
      }
    });
    obs.observe(board, { attributes: true, attributeFilter: ['class'], subtree: true });
  }

  // Case solved → confetti burst over the result.
  function watchResult() {
    const container = $('result-container');
    if (!container) return;
    const obs = new MutationObserver(() => {
      const title = container.querySelector('.result-title');
      if (title && /phá/i.test(title.textContent)) {
        spawnConfetti(container, 40);
      }
    });
    obs.observe(container, { childList: true });
  }

  // Mount sprites whenever the investigation screen becomes active.
  function watchScreens() {
    const inv = $('investigation-screen');
    if (!inv) return;
    const obs = new MutationObserver(() => {
      if (inv.classList.contains('active')) mountDetectives();
    });
    obs.observe(inv, { attributes: true, attributeFilter: ['class'] });
    if (inv.classList.contains('active')) mountDetectives();
  }

  // ===== MODALS (guide + exit) =====
  function wireModals() {
    const guide = $('guide-modal');
    const guideBtn = $('btn-guide');
    if (guide && guideBtn) {
      guideBtn.addEventListener('click', () => { guide.style.display = 'flex'; });
      const close = $('btn-guide-close');
      if (close) close.addEventListener('click', () => { guide.style.display = 'none'; });
      guide.addEventListener('click', e => { if (e.target === guide) guide.style.display = 'none'; });
    }

    const exit = $('exit-modal');
    const exitBtn = $('btn-exit');
    if (exit && exitBtn) {
      exitBtn.addEventListener('click', () => { exit.style.display = 'flex'; });
      const cancel = $('btn-exit-cancel');
      if (cancel) cancel.addEventListener('click', () => { exit.style.display = 'none'; });
      const confirm = $('btn-exit-confirm');
      if (confirm) confirm.addEventListener('click', () => {
        exit.style.display = 'none';
        // Reload the current game page to re-show the start/menu screen and stop all timers/loops.
        window.location.reload();
      });
      exit.addEventListener('click', e => { if (e.target === exit) exit.style.display = 'none'; });
    }
  }

  function init() {
    mountDetectives();
    watchClueBoard();
    watchResult();
    watchScreens();
    wireModals();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
