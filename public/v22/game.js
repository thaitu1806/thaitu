(function() {
  'use strict';

  // ===== CONFIG =====
  const TRACK_DISTANCE = 500; // meters
  const ADVANCE_CORRECT = 50;
  const ADVANCE_WRONG = 10;
  const ADVANCE_BOOST = 80; // combo 3+
  const COMBO_THRESHOLD = 3;
  const MAX_QUESTIONS = 15;
  const TIMER_SECONDS = 10;
  const BOT_CORRECT_RATE_MIN = 0.6;
  const BOT_CORRECT_RATE_MAX = 0.7;
  const BOT_INTERVAL_MIN = 3000; // ms
  const BOT_INTERVAL_MAX = 6000; // ms

  // ===== STATE =====
  let questions = [];
  let currentQ = 0;
  let distances = [0, 0, 0, 0]; // player, bot1, bot2, bot3
  let combo = 0;
  let maxCombo = 0;
  let correctCount = 0;
  let totalAnswered = 0;
  let timer = TIMER_SECONDS;
  let timerInterval = null;
  let botIntervals = [];
  let raceFinished = false;
  let subject = 'math';
  let difficulty = 'easy';
  let answering = false;

  const racerNames = ['Bạn', 'Sao Băng', 'Tia Chớp', 'Gió Lốc'];
  const racerEmojis = ['🚙', '🚗', '🚕', '🚐'];

  // ===== DOM =====
  const $ = id => document.getElementById(id);

  // Screens
  const startScreen = $('start-screen');
  const raceScreen = $('race-screen');
  const resultScreen = $('result-screen');

  // Start elements
  const statWins = $('stat-wins');
  const statRaces = $('stat-races');
  const statBest = $('stat-best');
  const btnStart = $('btn-start');

  // Race elements
  const raceQNum = $('race-q-num');
  const raceCombo = $('race-combo');
  const raceTimer = $('race-timer');
  const questionText = $('question-text');
  const answerGrid = $('answer-grid');

  // Result elements
  const resultIcon = $('result-icon');
  const resultTitle = $('result-title');
  const resultStandings = $('result-standings');
  const resultStats = $('result-stats');
  const btnPlayAgain = $('btn-play-again');

  // ===== LOAD STATS =====
  function loadStats() {
    const data = JSON.parse(localStorage.getItem('v22_stats') || '{}');
    statWins.textContent = data.wins || 0;
    statRaces.textContent = data.races || 0;
    statBest.textContent = data.bestCombo || 0;
  }

  function saveStats(won) {
    const data = JSON.parse(localStorage.getItem('v22_stats') || '{}');
    data.races = (data.races || 0) + 1;
    if (won) data.wins = (data.wins || 0) + 1;
    if (maxCombo > (data.bestCombo || 0)) data.bestCombo = maxCombo;
    localStorage.setItem('v22_stats', JSON.stringify(data));
  }

  // ===== SUBJECT / DIFFICULTY SELECTION =====
  document.querySelectorAll('.subject-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.subject-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      subject = btn.dataset.subject;
    });
  });

  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      difficulty = btn.dataset.diff;
    });
  });

  // ===== SCREEN MANAGEMENT =====
  function showScreen(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
  }

  // ===== FETCH QUESTIONS =====
  async function fetchQuestions() {
    const profile = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
    const grade = profile.grade || 2;
    try {
      const res = await fetch(`/api/questions?subject=${subject}&difficulty=${difficulty}&limit=${MAX_QUESTIONS}&grade=${grade}`);
      const data = await res.json();
      if (data.length > 0) return data;
    } catch (e) {
      console.error('Fetch error:', e);
    }
    // Fallback questions
    return generateFallbackQuestions();
  }

  function generateFallbackQuestions() {
    const qs = [];
    for (let i = 0; i < MAX_QUESTIONS; i++) {
      const a = Math.floor(Math.random() * 10) + 1;
      const b = Math.floor(Math.random() * 10) + 1;
      const correct = a + b;
      const opts = [correct];
      while (opts.length < 4) {
        const wrong = correct + Math.floor(Math.random() * 7) - 3;
        if (wrong !== correct && wrong > 0 && !opts.includes(wrong)) opts.push(wrong);
      }
      opts.sort(() => Math.random() - 0.5);
      const correctIdx = opts.indexOf(correct);
      const letters = ['a', 'b', 'c', 'd'];
      qs.push({
        question_text: `${a} + ${b} = ?`,
        option_a: String(opts[0]),
        option_b: String(opts[1]),
        option_c: String(opts[2]),
        option_d: String(opts[3]),
        correct_answer: letters[correctIdx]
      });
    }
    return qs;
  }

  // ===== START RACE =====
  async function startRace() {
    btnStart.textContent = '⏳ Đang tải...';
    btnStart.disabled = true;

    questions = await fetchQuestions();
    currentQ = 0;
    distances = [0, 0, 0, 0];
    combo = 0;
    maxCombo = 0;
    correctCount = 0;
    totalAnswered = 0;
    raceFinished = false;
    answering = false;

    btnStart.textContent = '🏁 Bắt đầu đua!';
    btnStart.disabled = false;

    showScreen(raceScreen);
    updateTrack();
    showCountdown(() => {
      showQuestion();
      startBots();
    });
  }

  // ===== COUNTDOWN =====
  function showCountdown(callback) {
    const overlay = document.createElement('div');
    overlay.className = 'countdown-overlay';
    document.body.appendChild(overlay);

    let count = 3;
    function tick() {
      if (count === 0) {
        overlay.innerHTML = '<div class="countdown-number">🏁 GO!</div>';
        setTimeout(() => {
          overlay.remove();
          callback();
        }, 600);
        return;
      }
      overlay.innerHTML = `<div class="countdown-number">${count}</div>`;
      count--;
      setTimeout(tick, 800);
    }
    tick();
  }

  // ===== QUESTION DISPLAY =====
  function showQuestion() {
    if (raceFinished) return;
    if (currentQ >= questions.length) {
      endRace();
      return;
    }

    const q = questions[currentQ];
    raceQNum.textContent = `Câu ${currentQ + 1}/${questions.length}`;
    questionText.textContent = q.question_text;

    const btns = answerGrid.querySelectorAll('.ans-btn');
    const opts = [q.option_a, q.option_b, q.option_c, q.option_d];
    const labels = ['A', 'B', 'C', 'D'];
    btns.forEach((btn, i) => {
      btn.textContent = `${labels[i]}. ${opts[i]}`;
      btn.className = 'ans-btn';
      btn.disabled = false;
    });

    answering = true;
    startTimer();
  }

  // ===== TIMER =====
  function startTimer() {
    timer = TIMER_SECONDS;
    updateTimerDisplay();
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      timer--;
      updateTimerDisplay();
      if (timer <= 0) {
        clearInterval(timerInterval);
        handleTimeout();
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    raceTimer.textContent = `⏱️ ${timer}`;
    if (timer <= 3) {
      raceTimer.classList.add('warning');
    } else {
      raceTimer.classList.remove('warning');
    }
  }

  function handleTimeout() {
    if (!answering) return;
    answering = false;
    combo = 0;
    updateComboDisplay();

    // Highlight correct answer
    const q = questions[currentQ];
    const btns = answerGrid.querySelectorAll('.ans-btn');
    const correctIdx = ['a', 'b', 'c', 'd'].indexOf(q.correct_answer.toLowerCase());
    btns.forEach((btn, i) => {
      btn.disabled = true;
      if (i === correctIdx) btn.classList.add('correct');
    });

    // Advance player small amount (timeout = like wrong)
    advanceRacer(0, ADVANCE_WRONG, false);
    totalAnswered++;
    currentQ++;

    setTimeout(() => {
      if (!raceFinished) showQuestion();
    }, 1200);
  }

  // ===== ANSWER HANDLING =====
  answerGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.ans-btn');
    if (!btn || btn.disabled || !answering) return;

    answering = false;
    clearInterval(timerInterval);

    const q = questions[currentQ];
    const selected = btn.dataset.opt;
    const isCorrect = selected.toLowerCase() === q.correct_answer.toLowerCase();

    const btns = answerGrid.querySelectorAll('.ans-btn');
    const correctIdx = ['a', 'b', 'c', 'd'].indexOf(q.correct_answer.toLowerCase());
    btns.forEach((b, i) => {
      b.disabled = true;
      if (i === correctIdx) b.classList.add('correct');
    });

    if (isCorrect) {
      correctCount++;
      combo++;
      if (combo > maxCombo) maxCombo = combo;

      const isBoost = combo >= COMBO_THRESHOLD;
      const advance = isBoost ? ADVANCE_BOOST : ADVANCE_CORRECT;
      advanceRacer(0, advance, isBoost);
    } else {
      btn.classList.add('wrong');
      combo = 0;
      advanceRacer(0, ADVANCE_WRONG, false);
    }

    totalAnswered++;
    updateComboDisplay();
    currentQ++;

    // Save answer log
    saveAnswerLog(q, selected, isCorrect);

    setTimeout(() => {
      if (!raceFinished) showQuestion();
    }, 1000);
  });

  // ===== COMBO DISPLAY =====
  function updateComboDisplay() {
    if (combo >= COMBO_THRESHOLD) {
      raceCombo.textContent = `🔥 Combo x${combo}!`;
      raceCombo.classList.add('boost');
      setTimeout(() => raceCombo.classList.remove('boost'), 500);
    } else if (combo > 0) {
      raceCombo.textContent = `⚡ x${combo}`;
      raceCombo.classList.remove('boost');
    } else {
      raceCombo.textContent = '';
      raceCombo.classList.remove('boost');
    }
  }

  // ===== ADVANCE RACER =====
  function advanceRacer(index, amount, boost) {
    distances[index] = Math.min(distances[index] + amount, TRACK_DISTANCE);
    updateTrack();

    // Speed lines
    const speedEl = $(`speed-${index}`);
    if (speedEl) {
      speedEl.classList.add('active');
      setTimeout(() => speedEl.classList.remove('active'), 400);
    }

    // Boost animation
    if (boost) {
      const car = $(`car-${index}`);
      if (car) {
        car.classList.add('boosting');
        setTimeout(() => car.classList.remove('boosting'), 600);
      }
    }

    // Check if finish
    if (distances[index] >= TRACK_DISTANCE && !raceFinished) {
      raceFinished = true;
      clearInterval(timerInterval);
      botIntervals.forEach(id => clearInterval(id));
      botIntervals = [];
      setTimeout(() => endRace(), 800);
    }
  }

  // ===== UPDATE TRACK VISUAL =====
  function updateTrack() {
    const trackWidth = document.querySelector('.track-lane')?.offsetWidth || 300;
    const maxCarLeft = trackWidth - 60; // leave room for car

    for (let i = 0; i < 4; i++) {
      const pct = Math.min(distances[i] / TRACK_DISTANCE, 1);
      const car = $(`car-${i}`);
      if (car) {
        car.style.left = `${pct * maxCarLeft}px`;
      }

      const prog = $(`prog-${i}`);
      if (prog) {
        prog.style.width = `${pct * 100}%`;
      }

      const dist = $(`dist-${i}`);
      if (dist) {
        dist.textContent = `${distances[i]}m`;
      }
    }
  }

  // ===== BOT AI =====
  function startBots() {
    for (let i = 1; i <= 3; i++) {
      scheduleBotMove(i);
    }
  }

  function scheduleBotMove(botIndex) {
    if (raceFinished) return;
    const interval = BOT_INTERVAL_MIN + Math.random() * (BOT_INTERVAL_MAX - BOT_INTERVAL_MIN);
    const id = setTimeout(() => {
      if (raceFinished) return;
      botAnswer(botIndex);
      scheduleBotMove(botIndex);
    }, interval);
    botIntervals.push(id);
  }

  function botAnswer(botIndex) {
    const rate = BOT_CORRECT_RATE_MIN + Math.random() * (BOT_CORRECT_RATE_MAX - BOT_CORRECT_RATE_MIN);
    const isCorrect = Math.random() < rate;
    const advance = isCorrect ? ADVANCE_CORRECT : ADVANCE_WRONG;
    advanceRacer(botIndex, advance, false);
  }

  // ===== END RACE =====
  function endRace() {
    raceFinished = true;
    clearInterval(timerInterval);
    botIntervals.forEach(id => clearTimeout(id));
    botIntervals = [];

    // Determine standings
    const standings = distances.map((d, i) => ({ index: i, distance: d, name: racerNames[i], emoji: racerEmojis[i] }));
    standings.sort((a, b) => b.distance - a.distance);

    const playerPos = standings.findIndex(s => s.index === 0) + 1;
    const playerWon = playerPos === 1;

    // Save stats
    saveStats(playerWon);
    saveSession();

    // Show result
    showScreen(resultScreen);

    if (playerWon) {
      resultIcon.textContent = '🏆';
      resultTitle.textContent = 'Bạn thắng cuộc đua!';
      resultTitle.style.color = '#ffd700';
    } else {
      resultIcon.textContent = playerPos <= 2 ? '🥈' : '😅';
      resultTitle.textContent = playerPos === 2 ? 'Gần thắng rồi!' : `Bạn về thứ ${playerPos}`;
      resultTitle.style.color = 'white';
    }

    // Standings list
    const posEmojis = ['🥇', '🥈', '🥉', '4️⃣'];
    resultStandings.innerHTML = standings.map((s, i) => `
      <div class="standing-row ${s.index === 0 ? 'player-row' : ''}">
        <span class="standing-pos">${posEmojis[i]}</span>
        <span class="standing-name">${s.emoji} ${s.name}</span>
        <span class="standing-dist">${s.distance}m</span>
      </div>
    `).join('');

    // Stats
    const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
    resultStats.innerHTML = `
      <div class="result-stat">
        <span class="result-stat-value">${correctCount}/${totalAnswered}</span>
        <span class="result-stat-label">Đúng</span>
      </div>
      <div class="result-stat">
        <span class="result-stat-value">${accuracy}%</span>
        <span class="result-stat-label">Chính xác</span>
      </div>
      <div class="result-stat">
        <span class="result-stat-value">x${maxCombo}</span>
        <span class="result-stat-label">Combo max</span>
      </div>
      <div class="result-stat">
        <span class="result-stat-value">${distances[0]}m</span>
        <span class="result-stat-label">Quãng đường</span>
      </div>
    `;

    // Check and show parent linking prompt after game ends
    if (typeof checkAndShowPrompt === 'function') {
      checkAndShowPrompt();
    }
  }

  // ===== SAVE SESSION =====
  async function saveSession() {
    const profile = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
    if (!profile.id) return;

    const stars = correctCount >= 12 ? 3 : correctCount >= 8 ? 2 : correctCount >= 4 ? 1 : 0;
    const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

    try {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: profile.id,
          subject,
          difficulty,
          score: correctCount * 10,
          total_questions: totalAnswered,
          correct_answers: correctCount,
          stars_earned: stars,
          combo_max: maxCombo,
          mode: 'v22',
          accuracy,
          is_learn_session: false
        })
      });
    } catch (e) {
      console.error('Save session error:', e);
    }
  }

  // ===== SAVE ANSWER LOG =====
  async function saveAnswerLog(q, selected, isCorrect) {
    const profile = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
    if (!profile.id) return;
    try {
      await fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: null,
          player_id: profile.id,
          question_id: q.id || null,
          selected_answer: selected,
          correct_answer: q.correct_answer,
          is_correct: isCorrect,
          time_spent_ms: (TIMER_SECONDS - timer) * 1000
        })
      });
    } catch (e) {
      // non-critical
    }
  }

  // ===== EVENT LISTENERS =====
  btnStart.addEventListener('click', startRace);
  btnPlayAgain.addEventListener('click', () => {
    showScreen(startScreen);
    loadStats();
  });

  // ===== INIT =====
  loadStats();

  // Handle window resize for track
  window.addEventListener('resize', () => {
    if (raceScreen.classList.contains('active')) {
      updateTrack();
    }
  });
})();
