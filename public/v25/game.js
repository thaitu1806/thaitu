// V25 - Pháo Đài Bóng Bay (Balloon Fort Defense)
(function() {
  'use strict';

  const BALLOON_EMOJIS = ['🎈', '❤️', '💚', '💛', '💜'];
  const TIMER_DURATION = 8000; // 8 seconds
  const MAX_LIVES = 10;
  const BALLOONS_PER_WAVE = 5;
  const COMBO_BONUS_THRESHOLD = 3; // 3+ combo = pop 2

  let state = {
    wave: 1,
    score: 0,
    combo: 0,
    maxCombo: 0,
    lives: MAX_LIVES,
    correctCount: 0,
    wrongCount: 0,
    subject: 'math',
    difficulty: 'easy',
    questions: [],
    currentQuestion: null,
    questionIndex: 0,
    balloons: [],
    balloonIdCounter: 0,
    balloonInterval: null,
    advanceInterval: null,
    timerInterval: null,
    timerStart: 0,
    gameActive: false,
    answering: false,
    balloonsSpawnedThisWave: 0,
    waveActive: false
  };

  // DOM elements
  const screens = {
    start: document.getElementById('start-screen'),
    game: document.getElementById('game-screen'),
    gameover: document.getElementById('gameover-screen')
  };

  const els = {
    hudWave: document.getElementById('hud-wave'),
    hudScore: document.getElementById('hud-score'),
    hudCombo: document.getElementById('hud-combo'),
    hudLives: document.getElementById('hud-lives'),
    skyField: document.getElementById('sky-field'),
    quizPanel: document.getElementById('quiz-panel'),
    questionText: document.getElementById('question-text'),
    answerGrid: document.getElementById('answer-grid'),
    feedback: document.getElementById('feedback'),
    timerFill: document.getElementById('timer-fill'),
    bestWave: document.getElementById('best-wave'),
    btnStart: document.getElementById('btn-start'),
    btnRetry: document.getElementById('btn-retry')
  };

  // UTILITY
  function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
  }

  function getProfile() {
    try { return JSON.parse(localStorage.getItem('hocvui_profile')); } catch { return null; }
  }

  function getBestWave() {
    return parseInt(localStorage.getItem('v25_best_wave') || '0');
  }

  function saveBestWave(wave) {
    const best = getBestWave();
    if (wave > best) {
      localStorage.setItem('v25_best_wave', wave.toString());
      return true;
    }
    return false;
  }

  // INIT
  function init() {
    showBestWave();
    setupStartScreen();
    els.btnStart.addEventListener('click', startGame);
    els.btnRetry.addEventListener('click', () => { showScreen('start'); showBestWave(); });
  }

  function showBestWave() {
    const best = getBestWave();
    els.bestWave.textContent = best > 0 ? `🏆 Kỷ lục: Đợt ${best}` : '';
  }

  function setupStartScreen() {
    document.querySelectorAll('.subject-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.subject-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.subject = btn.dataset.subject;
      });
    });
    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.difficulty = btn.dataset.diff;
      });
    });
  }

  // FETCH QUESTIONS
  async function fetchQuestions() {
    const profile = getProfile();
    const grade = profile?.grade || 2;
    const url = `/api/questions?subject=${state.subject}&difficulty=${state.difficulty}&limit=20&grade=${grade}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      if (data.length === 0) throw new Error('No questions');
      return data;
    } catch {
      // Fallback questions
      return generateFallbackQuestions();
    }
  }

  function generateFallbackQuestions() {
    const qs = [];
    for (let i = 0; i < 20; i++) {
      const a = Math.floor(Math.random() * 20) + 1;
      const b = Math.floor(Math.random() * 20) + 1;
      const sum = a + b;
      const opts = [sum, sum + 1, sum - 1, sum + 2].sort(() => Math.random() - 0.5);
      const correctIdx = opts.indexOf(sum);
      const labels = ['a', 'b', 'c', 'd'];
      qs.push({
        question_text: `${a} + ${b} = ?`,
        option_a: opts[0].toString(),
        option_b: opts[1].toString(),
        option_c: opts[2].toString(),
        option_d: opts[3].toString(),
        correct_answer: labels[correctIdx]
      });
    }
    return qs;
  }

  // START GAME
  async function startGame() {
    els.btnStart.disabled = true;
    els.btnStart.textContent = '⏳ Đang tải...';

    state.questions = await fetchQuestions();
    state.questionIndex = 0;
    state.wave = 1;
    state.score = 0;
    state.combo = 0;
    state.maxCombo = 0;
    state.lives = MAX_LIVES;
    state.correctCount = 0;
    state.wrongCount = 0;
    state.balloons = [];
    state.balloonIdCounter = 0;
    state.balloonsSpawnedThisWave = 0;
    state.gameActive = true;
    state.answering = false;

    els.btnStart.disabled = false;
    els.btnStart.textContent = '🚀 Bắt đầu!';

    updateHUD();
    clearBalloons();
    showScreen('game');
    startWave();
  }

  // WAVE MANAGEMENT
  function startWave() {
    state.waveActive = true;
    state.balloonsSpawnedThisWave = 0;

    const spawnDelay = getSpawnDelay();
    const advanceDelay = getAdvanceDelay();

    // Spawn balloons periodically
    state.balloonInterval = setInterval(() => {
      if (state.balloonsSpawnedThisWave < getBalloonsForWave()) {
        spawnBalloon();
        state.balloonsSpawnedThisWave++;
      } else {
        clearInterval(state.balloonInterval);
      }
    }, spawnDelay);

    // Advance balloons toward fort
    state.advanceInterval = setInterval(() => {
      advanceBalloons();
    }, advanceDelay);

    // Show first question
    nextQuestion();
  }

  function getSpawnDelay() {
    // Faster spawning as waves progress
    return Math.max(1500, 3000 - (state.wave - 1) * 150);
  }

  function getAdvanceDelay() {
    // Balloons advance faster each wave
    return Math.max(1500, 3000 - (state.wave - 1) * 100);
  }

  function getBalloonsForWave() {
    return BALLOONS_PER_WAVE + Math.floor(state.wave / 3);
  }

  function endWave() {
    state.waveActive = false;
    clearInterval(state.balloonInterval);

    // Next wave after short delay
    state.wave++;
    updateHUD();

    setTimeout(() => {
      if (state.gameActive && state.lives > 0) {
        startWave();
      }
    }, 1500);
  }

  // BALLOON MANAGEMENT
  function spawnBalloon() {
    const fieldWidth = els.skyField.clientWidth;
    const id = state.balloonIdCounter++;
    const emoji = BALLOON_EMOJIS[Math.floor(Math.random() * BALLOON_EMOJIS.length)];
    const isArmored = state.wave % 5 === 0 && Math.random() < 0.4;
    const x = 30 + Math.random() * (fieldWidth - 80);

    const balloon = {
      id,
      emoji,
      x,
      row: 0, // 0 = top, increases toward fort
      hp: isArmored ? 2 : 1,
      armored: isArmored,
      el: null
    };

    // Create DOM element
    const el = document.createElement('div');
    el.className = 'balloon' + (isArmored ? ' armored' : '');
    el.innerHTML = emoji + (isArmored ? '<span class="armor-badge">2</span>' : '');
    el.style.left = x + 'px';
    el.style.top = '0px';
    el.dataset.id = id;

    els.skyField.appendChild(el);
    balloon.el = el;
    state.balloons.push(balloon);
  }

  function advanceBalloons() {
    if (!state.gameActive) return;

    const fieldHeight = els.skyField.clientHeight;
    const fortLine = fieldHeight - 65; // Fort zone threshold
    const step = Math.max(30, 50 - state.wave * 2);

    for (let i = state.balloons.length - 1; i >= 0; i--) {
      const b = state.balloons[i];
      b.row++;
      const newTop = b.row * step;
      b.el.style.top = newTop + 'px';

      // Balloon reached fort
      if (newTop >= fortLine) {
        balloonReachedFort(b, i);
      }
    }

    // Check if wave is complete (all spawned + all gone)
    if (state.balloonsSpawnedThisWave >= getBalloonsForWave() && state.balloons.length === 0 && state.waveActive) {
      endWave();
    }
  }

  function balloonReachedFort(balloon, index) {
    state.lives--;
    updateHUD();

    // Remove balloon
    balloon.el.remove();
    state.balloons.splice(index, 1);

    // Check game over
    if (state.lives <= 0) {
      gameOver();
    }
  }

  function popBalloon(count) {
    // Pop the closest balloon(s) to the fort
    let popped = 0;
    const sorted = [...state.balloons].sort((a, b) => b.row - a.row);

    for (let i = 0; i < Math.min(count, sorted.length); i++) {
      const balloon = sorted[i];
      const idx = state.balloons.indexOf(balloon);
      if (idx === -1) continue;

      balloon.hp--;
      if (balloon.hp <= 0) {
        // Pop it
        balloon.el.classList.add('popping');
        createConfetti(balloon.el);
        state.score++;
        popped++;

        setTimeout(() => {
          balloon.el.remove();
        }, 400);

        state.balloons.splice(idx, 1);
      } else {
        // Armored: update badge
        const badge = balloon.el.querySelector('.armor-badge');
        if (badge) badge.textContent = balloon.hp;
      }
    }

    updateHUD();

    // Check if wave is complete
    if (state.balloonsSpawnedThisWave >= getBalloonsForWave() && state.balloons.length === 0 && state.waveActive) {
      endWave();
    }

    return popped;
  }

  function createConfetti(el) {
    const rect = el.getBoundingClientRect();
    const fieldRect = els.skyField.getBoundingClientRect();
    const x = rect.left - fieldRect.left + rect.width / 2;
    const y = rect.top - fieldRect.top;
    const colors = ['#f44336', '#ff9800', '#ffeb3b', '#4caf50', '#2196f3', '#9c27b0'];

    for (let i = 0; i < 8; i++) {
      const dot = document.createElement('div');
      dot.className = 'confetti';
      dot.style.left = (x + (Math.random() - 0.5) * 40) + 'px';
      dot.style.top = y + 'px';
      dot.style.background = colors[Math.floor(Math.random() * colors.length)];
      els.skyField.appendChild(dot);
      setTimeout(() => dot.remove(), 1000);
    }
  }

  function clearBalloons() {
    els.skyField.querySelectorAll('.balloon, .confetti').forEach(el => el.remove());
    state.balloons = [];
  }

  // QUESTION MANAGEMENT
  async function nextQuestion() {
    if (!state.gameActive) return;

    // Refetch if running low
    if (state.questionIndex >= state.questions.length) {
      state.questions = await fetchQuestions();
      state.questionIndex = 0;
    }

    state.currentQuestion = state.questions[state.questionIndex];
    state.questionIndex++;
    state.answering = true;
    displayQuestion();
    startTimer();
  }

  function displayQuestion() {
    const q = state.currentQuestion;
    els.questionText.textContent = q.question_text;
    const btns = els.answerGrid.querySelectorAll('.ans-btn');
    btns[0].textContent = q.option_a;
    btns[1].textContent = q.option_b;
    btns[2].textContent = q.option_c;
    btns[3].textContent = q.option_d;

    btns.forEach(btn => {
      btn.className = 'ans-btn';
      btn.onclick = () => handleAnswer(btn.dataset.opt);
    });

    els.feedback.textContent = '';
    els.feedback.className = 'feedback';
  }

  function handleAnswer(selected) {
    if (!state.answering) return;
    state.answering = false;
    stopTimer();

    const q = state.currentQuestion;
    const correct = selected.toLowerCase() === q.correct_answer.toLowerCase();
    const btns = els.answerGrid.querySelectorAll('.ans-btn');

    // Highlight answers
    btns.forEach(btn => {
      btn.classList.add('disabled');
      if (btn.dataset.opt.toLowerCase() === q.correct_answer.toLowerCase()) btn.classList.add('correct');
      if (!correct && btn.dataset.opt === selected) btn.classList.add('wrong');
    });

    if (correct) {
      state.correctCount++;
      state.combo++;
      if (state.combo > state.maxCombo) state.maxCombo = state.combo;
      updateHUD();

      // Pop balloons
      const popCount = state.combo >= COMBO_BONUS_THRESHOLD ? 2 : 1;
      const popped = popBalloon(popCount);

      if (popCount > 1 && popped > 1) {
        els.feedback.textContent = `🎯 Combo x${state.combo}! Bắn hạ 2 bóng!`;
      } else if (popped > 0) {
        els.feedback.textContent = '🎯 Bắn trúng!';
      } else {
        els.feedback.textContent = '✅ Đúng! (Không có bóng)';
      }
      els.feedback.className = 'feedback correct-fb';
    } else {
      state.wrongCount++;
      state.combo = 0;
      updateHUD();
      els.feedback.textContent = '❌ Sai rồi! Bóng bay thoát!';
      els.feedback.className = 'feedback wrong-fb';
    }

    // Log answer
    logAnswer(q, selected, correct);

    // Next question after delay
    setTimeout(() => {
      if (state.gameActive) nextQuestion();
    }, 1200);
  }

  function handleTimeout() {
    if (!state.answering) return;
    state.answering = false;
    state.wrongCount++;
    state.combo = 0;
    updateHUD();

    const q = state.currentQuestion;
    const btns = els.answerGrid.querySelectorAll('.ans-btn');
    btns.forEach(btn => {
      btn.classList.add('disabled');
      if (btn.dataset.opt.toLowerCase() === q.correct_answer.toLowerCase()) btn.classList.add('correct');
    });

    els.feedback.textContent = '⏰ Hết giờ! Bóng bay thoát!';
    els.feedback.className = 'feedback wrong-fb';

    logAnswer(q, null, false);

    setTimeout(() => {
      if (state.gameActive) nextQuestion();
    }, 1200);
  }

  // TIMER
  function startTimer() {
    state.timerStart = Date.now();
    els.timerFill.style.width = '100%';
    els.timerFill.classList.remove('danger');

    state.timerInterval = setInterval(() => {
      const elapsed = Date.now() - state.timerStart;
      const remaining = Math.max(0, TIMER_DURATION - elapsed);
      const pct = (remaining / TIMER_DURATION) * 100;
      els.timerFill.style.width = pct + '%';

      if (pct < 30) els.timerFill.classList.add('danger');

      if (remaining <= 0) {
        stopTimer();
        handleTimeout();
      }
    }, 50);
  }

  function stopTimer() {
    clearInterval(state.timerInterval);
  }

  // HUD
  function updateHUD() {
    els.hudWave.textContent = state.wave;
    els.hudScore.textContent = state.score;
    els.hudCombo.textContent = state.combo;
    els.hudLives.textContent = state.lives;

    // Flash lives when low
    if (state.lives <= 3) {
      els.hudLives.style.color = '#f44336';
    } else {
      els.hudLives.style.color = '#333';
    }
  }

  // GAME OVER
  function gameOver() {
    state.gameActive = false;
    state.waveActive = false;
    clearInterval(state.balloonInterval);
    clearInterval(state.advanceInterval);
    stopTimer();

    // Update game over screen
    document.getElementById('go-wave').textContent = state.wave;
    document.getElementById('go-score').textContent = state.score;
    document.getElementById('go-combo').textContent = state.maxCombo;
    document.getElementById('go-correct').textContent = state.correctCount;
    document.getElementById('go-wrong').textContent = state.wrongCount;

    const isNewBest = saveBestWave(state.wave);
    const goEl = document.getElementById('go-best');
    if (isNewBest) {
      goEl.textContent = '🏆 Kỷ lục mới!';
    } else {
      goEl.textContent = `🏆 Kỷ lục: Đợt ${getBestWave()}`;
    }

    showScreen('gameover');
    saveSession();

    // Check and show parent linking prompt after game ends
    if (typeof checkAndShowPrompt === 'function') {
      checkAndShowPrompt();
    }
  }

  // SAVE SESSION
  async function saveSession() {
    const profile = getProfile();
    if (!profile) return;

    const total = state.correctCount + state.wrongCount;
    const accuracy = total > 0 ? Math.round((state.correctCount / total) * 100) : 0;

    try {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: profile.id,
          subject: state.subject,
          difficulty: state.difficulty,
          score: state.score,
          total_questions: total,
          correct_answers: state.correctCount,
          stars_earned: Math.floor(state.score / 3),
          combo_max: state.maxCombo,
          mode: 'v25',
          accuracy
        })
      });
    } catch { /* silent */ }
  }

  // LOG ANSWER
  async function logAnswer(question, selected, correct) {
    const profile = getProfile();
    if (!profile || !question.id) return;

    try {
      await fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: profile.id,
          question_id: question.id,
          selected_answer: selected || '',
          correct_answer: question.correct_answer,
          is_correct: correct,
          time_spent_ms: Date.now() - state.timerStart
        })
      });
    } catch { /* silent */ }
  }

  // BOOT
  init();
})();

// ===== CHARACTER SYSTEM INTEGRATION (presentation only) =====
// Additive layer — does NOT touch the game-logic IIFE above. The fort guard
// mascot is mounted alongside the existing 🏰 emoji and synced to gameplay by
// observing the HUD/feedback DOM, so the shooting logic stays untouched.
(function () {
  'use strict';

  let guardChar = null;
  let happyTimer = null;

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  // Mount the chibi fort-guard into the fort zone (replaces the 🏰 emoji host,
  // with an emoji fallback if the sprite engine is unavailable).
  function mountGuard() {
    const host = document.getElementById('fort-emoji');
    if (!host || guardChar) return;
    const C = window.HocVuiCharacters;
    if (C && C.hasSpecies('fortguard')) {
      host.classList.add('fort-guard-host');
      host.textContent = '';
      guardChar = C.createCharacter('fortguard', host, { state: 'idle' });
    }
    // else: leave the existing 🏰 emoji as the fallback.
  }

  function cheer() {
    if (!guardChar) return;
    guardChar.setState('happy');
    if (happyTimer) clearTimeout(happyTimer);
    happyTimer = setTimeout(() => { if (guardChar) guardChar.setState('idle'); }, 700);
  }

  // Particle helper — confetti/sparkle burst around the fort on a balloon pop.
  function spawnParticles(parent, kind, count) {
    if (!parent) return;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'pfx pfx-' + kind;
      p.style.setProperty('--tx', (Math.random() * 80 - 40) + 'px');
      p.style.setProperty('--ty', -(Math.random() * 45 + 20) + 'px');
      p.style.setProperty('--delay', (Math.random() * 0.15) + 's');
      parent.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
  }
  function spawnSparkle(parent, count) { spawnParticles(parent, 'sparkle', count || 6); }
  function spawnConfetti(parent, count) { spawnParticles(parent, 'confetti', count || 8); }
  window.__v25_spawnParticles = spawnParticles;

  ready(function () {
    const $ = id => document.getElementById(id);

    // Mount the guard whenever the game screen becomes active.
    const gameScreen = $('game-screen');
    if (gameScreen) {
      mountGuard();
      const screenObs = new MutationObserver(() => {
        if (gameScreen.classList.contains('active')) mountGuard();
      });
      screenObs.observe(gameScreen, { attributes: true, attributeFilter: ['class'] });
    }

    // Balloon popped → score HUD increases → cheer + sparkle.
    const scoreEl = $('hud-score');
    if (scoreEl) {
      let last = parseInt(scoreEl.textContent, 10) || 0;
      const scoreObs = new MutationObserver(() => {
        const now = parseInt(scoreEl.textContent, 10) || 0;
        if (now > last) {
          cheer();
          const host = document.querySelector('.fort-guard-host') || $('fort-emoji');
          spawnSparkle(host, 6);
        }
        last = now;
      });
      scoreObs.observe(scoreEl, { childList: true, characterData: true, subtree: true });
    }

    // Correct answer feedback → small celebratory confetti on the fort guard.
    const feedbackEl = $('feedback');
    if (feedbackEl) {
      const fbObs = new MutationObserver(() => {
        if (feedbackEl.classList.contains('correct-fb')) {
          cheer();
          const host = document.querySelector('.fort-guard-host') || $('fort-emoji');
          spawnConfetti(host, 8);
        }
      });
      fbObs.observe(feedbackEl, { attributes: true, attributeFilter: ['class'] });
    }

    // Guide modal --------------------------------------------------------
    const guide = $('guide-modal');
    const guideBtn = $('btn-guide');
    if (guide && guideBtn) {
      guideBtn.addEventListener('click', () => { guide.style.display = 'flex'; });
      const close = $('btn-guide-close');
      if (close) close.addEventListener('click', () => { guide.style.display = 'none'; });
      guide.addEventListener('click', e => { if (e.target === guide) guide.style.display = 'none'; });
    }

    // Styled exit modal --------------------------------------------------
    const exit = $('exit-modal');
    const exitBtn = $('btn-exit');
    if (exit && exitBtn) {
      exitBtn.addEventListener('click', () => { exit.style.display = 'flex'; });
      const cancel = $('btn-exit-cancel');
      if (cancel) cancel.addEventListener('click', () => { exit.style.display = 'none'; });
      const confirm = $('btn-exit-confirm');
      if (confirm) confirm.addEventListener('click', () => {
        exit.style.display = 'none';
        // Stop any running loops/timers before leaving by clearing the highest
        // active interval ids (the logic IIFE owns them privately).
        try {
          const top = setInterval(function () {}, 9999);
          for (let i = 1; i <= top; i++) clearInterval(i);
          clearInterval(top);
        } catch (e) {}
        window.location.reload();
      });
      exit.addEventListener('click', e => { if (e.target === exit) exit.style.display = 'none'; });
    }
  });
})();
