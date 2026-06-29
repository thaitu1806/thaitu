(function() {
  'use strict';

  // ===== CONFIG =====
  const TOTAL_PATIENTS = 8;
  const STEPS_PER_PATIENT = 4;
  const MAX_RETRIES = 2;
  const TIMER_SECONDS = 10;

  const PETS = ['🐶','🐱','🐰','🐹','🐦','🐢','🐟','🐴','🦊','🐼','🐧','🐸'];
  const ILLNESSES = ['Sốt','Đau bụng','Ho','Mệt mỏi','Đau chân','Không ăn được','Ngứa','Buồn ngủ nhiều'];
  const STEP_LABELS = ['🩺 Bước khám bệnh:','💊 Bước chẩn đoán:','💉 Bước điều trị:','❤️ Bước hồi phục:'];
  const STEP_ICONS = ['🩺','💊','💉','❤️'];
  const TREATMENT_EFFECTS = ['🩺','💊','💉','❤️‍🩹'];

  // ===== STATE =====
  let questions = [];
  let questionIndex = 0;
  let currentPatient = 0;
  let currentStep = 0;
  let retries = MAX_RETRIES;
  let healedCount = 0;
  let totalCorrect = 0;
  let totalAnswered = 0;
  let timer = TIMER_SECONDS;
  let timerInterval = null;
  let answering = false;
  let subject = 'math';
  let difficulty = 'easy';
  let patients = [];

  // ===== DOM =====
  const $ = id => document.getElementById(id);

  const startScreen = $('start-screen');
  const gameScreen = $('game-screen');
  const resultScreen = $('result-screen');

  const statHealed = $('stat-healed');
  const statShifts = $('stat-shifts');
  const statBest = $('stat-best');
  const btnStart = $('btn-start');

  const gamePatientNum = $('game-patient-num');
  const gameRetries = $('game-retries');
  const gameTimer = $('game-timer');
  const petEmoji = $('pet-emoji');
  const petIllness = $('pet-illness');
  const petMood = $('pet-mood');
  const stepProgress = $('step-progress');
  const questionLabel = $('question-label');
  const questionText = $('question-text');
  const answerGrid = $('answer-grid');
  const healedCountEl = $('healed-count');

  const resultIcon = $('result-icon');
  const resultTitle = $('result-title');
  const resultPets = $('result-pets');
  const resultStats = $('result-stats');
  const btnPlayAgain = $('btn-play-again');

  // ===== LOAD STATS =====
  function loadStats() {
    const data = JSON.parse(localStorage.getItem('v23_stats') || '{}');
    statHealed.textContent = data.totalHealed || 0;
    statShifts.textContent = data.shifts || 0;
    statBest.textContent = data.bestShift || 0;
  }

  function saveStats() {
    const data = JSON.parse(localStorage.getItem('v23_stats') || '{}');
    data.shifts = (data.shifts || 0) + 1;
    data.totalHealed = (data.totalHealed || 0) + healedCount;
    if (healedCount > (data.bestShift || 0)) data.bestShift = healedCount;
    localStorage.setItem('v23_stats', JSON.stringify(data));
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
    const grade = profile.grade ?? 2;
    const needed = TOTAL_PATIENTS * STEPS_PER_PATIENT + 10; // extra buffer
    try {
      const res = await fetch(`/api/questions?subject=${subject}&difficulty=${difficulty}&limit=${needed}&grade=${grade}`);
      const data = await res.json();
      if (data.length > 0) return data;
    } catch (e) {
      console.error('Fetch error:', e);
    }
    return generateFallbackQuestions(needed);
  }

  function generateFallbackQuestions(count) {
    const qs = [];
    for (let i = 0; i < count; i++) {
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

  // ===== GENERATE PATIENTS =====
  function generatePatients() {
    patients = [];
    const usedPets = [];
    for (let i = 0; i < TOTAL_PATIENTS; i++) {
      let pet;
      do {
        pet = PETS[Math.floor(Math.random() * PETS.length)];
      } while (usedPets.includes(pet) && usedPets.length < PETS.length);
      usedPets.push(pet);
      patients.push({
        pet,
        illness: ILLNESSES[Math.floor(Math.random() * ILLNESSES.length)],
        healed: false,
        failed: false
      });
    }
  }

  // ===== START GAME =====
  async function startGame() {
    btnStart.textContent = '⏳ Đang tải...';
    btnStart.disabled = true;

    questions = await fetchQuestions();
    questionIndex = 0;
    currentPatient = 0;
    currentStep = 0;
    retries = MAX_RETRIES;
    healedCount = 0;
    totalCorrect = 0;
    totalAnswered = 0;

    generatePatients();

    btnStart.textContent = '🩺 Bắt đầu ca trực!';
    btnStart.disabled = false;

    showScreen(gameScreen);
    showPatient();
  }

  // ===== SHOW PATIENT =====
  function showPatient() {
    if (currentPatient >= TOTAL_PATIENTS) {
      endGame();
      return;
    }

    const p = patients[currentPatient];
    gamePatientNum.textContent = `Bệnh nhân ${currentPatient + 1}/${TOTAL_PATIENTS}`;
    petEmoji.textContent = p.pet;
    petEmoji.className = 'pet-emoji';
    petIllness.textContent = `Bệnh: ${p.illness}`;
    petMood.textContent = '😷';
    retries = MAX_RETRIES;
    currentStep = 0;
    updateRetries();
    updateStepProgress();
    updateHealedCount();
    showQuestion();
  }

  // ===== UPDATE RETRIES =====
  function updateRetries() {
    let hearts = '';
    for (let i = 0; i < retries; i++) hearts += '❤️';
    for (let i = retries; i < MAX_RETRIES; i++) hearts += '🖤';
    gameRetries.textContent = hearts;
  }

  // ===== UPDATE STEP PROGRESS =====
  function updateStepProgress() {
    const dots = stepProgress.querySelectorAll('.step-dot');
    dots.forEach((dot, i) => {
      dot.classList.remove('active', 'done');
      if (i < currentStep) dot.classList.add('done');
      else if (i === currentStep) dot.classList.add('active');
    });
  }

  // ===== UPDATE HEALED COUNT =====
  function updateHealedCount() {
    healedCountEl.textContent = `❤️ Đã chữa: ${healedCount}`;
  }

  // ===== SHOW QUESTION =====
  function showQuestion() {
    if (questionIndex >= questions.length) {
      // Ran out of questions, end game
      endGame();
      return;
    }

    const q = questions[questionIndex];
    questionLabel.textContent = STEP_LABELS[currentStep];
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
    gameTimer.textContent = `⏱️ ${timer}`;
    if (timer <= 3) {
      gameTimer.classList.add('warning');
    } else {
      gameTimer.classList.remove('warning');
    }
  }

  function handleTimeout() {
    if (!answering) return;
    answering = false;

    const q = questions[questionIndex];
    const btns = answerGrid.querySelectorAll('.ans-btn');
    const correctIdx = ['a', 'b', 'c', 'd'].indexOf(q.correct_answer.toLowerCase());
    btns.forEach((btn, i) => {
      btn.disabled = true;
      if (i === correctIdx) btn.classList.add('correct');
    });

    totalAnswered++;
    questionIndex++;

    // Timeout = wrong answer
    handleWrongAnswer();
  }

  // ===== ANSWER HANDLING =====
  answerGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.ans-btn');
    if (!btn || btn.disabled || !answering) return;

    answering = false;
    clearInterval(timerInterval);

    const q = questions[questionIndex];
    const selected = btn.dataset.opt;
    const isCorrect = selected.toLowerCase() === q.correct_answer.toLowerCase();

    const btns = answerGrid.querySelectorAll('.ans-btn');
    const correctIdx = ['a', 'b', 'c', 'd'].indexOf(q.correct_answer.toLowerCase());
    btns.forEach((b, i) => {
      b.disabled = true;
      if (i === correctIdx) b.classList.add('correct');
    });

    if (!isCorrect) {
      btn.classList.add('wrong');
    }

    totalAnswered++;
    saveAnswerLog(q, selected, isCorrect);
    questionIndex++;

    if (isCorrect) {
      totalCorrect++;
      handleCorrectAnswer();
    } else {
      handleWrongAnswer();
    }
  });

  // ===== CORRECT ANSWER =====
  function handleCorrectAnswer() {
    // Show treatment effect
    showTreatmentEffect(TREATMENT_EFFECTS[currentStep]);
    petEmoji.classList.add('happy');
    setTimeout(() => petEmoji.classList.remove('happy'), 600);

    currentStep++;
    updateStepProgress();

    if (currentStep >= STEPS_PER_PATIENT) {
      // Patient healed!
      setTimeout(() => {
        patientHealed();
      }, 1000);
    } else {
      setTimeout(() => {
        showQuestion();
      }, 1200);
    }
  }

  // ===== WRONG ANSWER =====
  function handleWrongAnswer() {
    retries--;
    updateRetries();
    petEmoji.classList.add('sad');
    setTimeout(() => petEmoji.classList.remove('sad'), 500);
    petMood.textContent = retries > 0 ? '😰' : '😢';

    if (retries <= 0) {
      // Patient leaves sad
      setTimeout(() => {
        patientFailed();
      }, 1000);
    } else {
      setTimeout(() => {
        showQuestion();
      }, 1200);
    }
  }

  // ===== PATIENT HEALED =====
  function patientHealed() {
    patients[currentPatient].healed = true;
    healedCount++;
    updateHealedCount();

    petEmoji.classList.add('healed');
    petMood.textContent = '😊';

    showTreatmentEffect('❤️‍🩹');

    setTimeout(() => {
      currentPatient++;
      showPatient();
    }, 1500);
  }

  // ===== PATIENT FAILED =====
  function patientFailed() {
    patients[currentPatient].failed = true;
    petMood.textContent = '😢';
    petEmoji.style.opacity = '0.5';

    setTimeout(() => {
      petEmoji.style.opacity = '1';
      currentPatient++;
      showPatient();
    }, 1200);
  }

  // ===== TREATMENT EFFECT =====
  function showTreatmentEffect(emoji) {
    const petArea = document.querySelector('.pet-area');
    const effect = document.createElement('div');
    effect.className = 'treatment-effect';
    effect.textContent = emoji;
    petArea.appendChild(effect);
    setTimeout(() => effect.remove(), 1000);
  }

  // ===== END GAME =====
  function endGame() {
    clearInterval(timerInterval);
    saveStats();
    saveSession();

    showScreen(resultScreen);

    if (healedCount >= 7) {
      resultIcon.textContent = '🏆';
      resultTitle.textContent = 'Bác sĩ xuất sắc!';
    } else if (healedCount >= 5) {
      resultIcon.textContent = '⭐';
      resultTitle.textContent = 'Bác sĩ giỏi!';
    } else if (healedCount >= 3) {
      resultIcon.textContent = '👍';
      resultTitle.textContent = 'Cố gắng tốt!';
    } else {
      resultIcon.textContent = '💪';
      resultTitle.textContent = 'Lần sau sẽ tốt hơn!';
    }

    // Show pet results
    resultPets.innerHTML = patients.map(p => `
      <div class="result-pet ${p.healed ? 'healed' : 'failed'}">
        <span class="result-pet-emoji">${p.pet}</span>
        <span class="result-pet-status">${p.healed ? '✓ Khỏe' : '✗ Buồn'}</span>
      </div>
    `).join('');

    // Stats
    const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
    resultStats.innerHTML = `
      <div class="result-stat">
        <span class="result-stat-value">${healedCount}/${TOTAL_PATIENTS}</span>
        <span class="result-stat-label">Đã chữa</span>
      </div>
      <div class="result-stat">
        <span class="result-stat-value">${totalCorrect}/${totalAnswered}</span>
        <span class="result-stat-label">Đúng</span>
      </div>
      <div class="result-stat">
        <span class="result-stat-value">${accuracy}%</span>
        <span class="result-stat-label">Chính xác</span>
      </div>
    `;

    // checkAndShowPrompt for quest/diamond
    if (typeof window.checkAndShowPrompt === 'function') {
      window.checkAndShowPrompt();
    }
  }

  // ===== SAVE SESSION =====
  async function saveSession() {
    const profile = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
    if (!profile.id) return;

    const stars = healedCount >= 7 ? 3 : healedCount >= 5 ? 2 : healedCount >= 3 ? 1 : 0;
    const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

    try {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: profile.id,
          subject,
          difficulty,
          score: healedCount * 10,
          total_questions: totalAnswered,
          correct_answers: totalCorrect,
          stars_earned: stars,
          combo_max: healedCount,
          mode: 'v23',
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
  btnStart.addEventListener('click', startGame);
  btnPlayAgain.addEventListener('click', () => {
    showScreen(startScreen);
    loadStats();
  });

  // ===== INIT =====
  loadStats();
})();

// ===== CHARACTER SYSTEM INTEGRATION (presentation only, additive) =====
// V23 game logic lives in the IIFE above and is intentionally untouched. This
// block observes the existing #pet-emoji node and mounts animated vector
// sprites alongside, with graceful emoji fallback. It never alters game state.
(function () {
  'use strict';

  // Map the logic's pet emoji → registered sprite species. Pets without a
  // sprite simply keep their original emoji (fallback), so logic is unaffected.
  const PET_SPECIES = { '🐶': 'puppy', '🐱': 'kitten', '🐰': 'bunny' };

  let petChar = null;
  let vetChar = null;
  let currentSpecies = null;
  let observing = true;

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function petStateFromClasses(el) {
    if (el.classList.contains('healed') || el.classList.contains('happy')) return 'happy';
    if (el.classList.contains('sad')) return 'scared';
    return 'idle';
  }

  // Mount the cheerful kid-vet companion into the pet card (once per game card).
  function mountVet() {
    const area = document.querySelector('.pet-area');
    if (!area || area.querySelector('.vet-host')) return;
    const host = document.createElement('div');
    host.className = 'vet-host';
    area.appendChild(host);
    const C = window.HocVuiCharacters;
    if (C && C.hasSpecies('vet')) {
      vetChar = C.createCharacter('vet', host, { state: 'idle' });
    } else {
      host.textContent = '🧑‍⚕️';
    }
  }

  // Render the patient pet sprite inside #pet-emoji, replacing the raw emoji.
  function renderPet(emoji) {
    const el = document.getElementById('pet-emoji');
    if (!el) return;
    const species = PET_SPECIES[emoji];
    const C = window.HocVuiCharacters;
    if (!species || !C || !C.hasSpecies(species)) {
      // Fallback: leave the original emoji text in place.
      petChar = null;
      currentSpecies = null;
      return;
    }
    observing = false;
    el.textContent = '';
    petChar = C.createCharacter(species, el, { state: petStateFromClasses(el) });
    currentSpecies = species;
    observing = true;
  }

  function syncPetState() {
    if (!petChar) return;
    petChar.setState(petStateFromClasses(document.getElementById('pet-emoji')));
  }

  // Particle helpers (sparkle on a healed step, confetti when a patient is cured).
  function spawnParticles(parent, kind, count) {
    if (!parent) return;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'pfx pfx-' + kind;
      p.style.setProperty('--tx', (Math.random() * 90 - 45) + 'px');
      p.style.setProperty('--ty', -(Math.random() * 50 + 25) + 'px');
      p.style.setProperty('--delay', (Math.random() * 0.18) + 's');
      parent.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
  }

  function spawnConfetti(parent, count) {
    if (!parent) return;
    const colors = ['#e91e63', '#f06292', '#ffd54f', '#4caf50', '#42a5f5'];
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'pfx pfx-confetti';
      p.style.background = colors[i % colors.length];
      p.style.left = (Math.random() * 100) + '%';
      p.style.setProperty('--tx', (Math.random() * 60 - 30) + 'px');
      p.style.setProperty('--rot', (Math.random() * 540 - 270) + 'deg');
      p.style.setProperty('--delay', (Math.random() * 0.2) + 's');
      parent.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
  }
  window.__v23_spawnParticles = spawnParticles;

  ready(function () {
    const petEl = document.getElementById('pet-emoji');
    if (!petEl) return;

    // Initial mount (start screen → game keeps #pet-emoji in the DOM).
    mountVet();
    if (petEl.textContent && petEl.textContent.trim()) {
      renderPet(petEl.textContent.trim());
    }

    const observer = new MutationObserver((mutations) => {
      if (!observing) return;
      let textChanged = false;
      let classChanged = false;
      for (const m of mutations) {
        if (m.type === 'childList' || m.type === 'characterData') textChanged = true;
        if (m.type === 'attributes' && m.attributeName === 'class') classChanged = true;
      }
      if (textChanged) {
        const raw = (petEl.textContent || '').trim();
        if (raw && raw in PET_SPECIES) {
          // New patient with a sprite-backed pet — (re)mount the sprite.
          mountVet();
          renderPet(raw);
        } else if (raw) {
          // Emoji-only patient: keep fallback, drop any stale sprite ref.
          petChar = null;
          currentSpecies = null;
        }
      }
      if (classChanged) {
        const state = petStateFromClasses(petEl);
        syncPetState();
        if (vetChar && state === 'happy') {
          vetChar.setState('happy');
          setTimeout(() => { if (vetChar) vetChar.setState('idle'); }, 700);
        }
        const area = document.querySelector('.pet-area');
        if (area) {
          if (petEl.classList.contains('healed')) spawnConfetti(area, 16);
          else if (petEl.classList.contains('happy')) spawnParticles(area, 'sparkle', 8);
        }
      }
    });
    observer.observe(petEl, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  });

  // Modals (guide + exit) — styled overlays, no window.confirm.
  ready(function () {
    const $ = id => document.getElementById(id);
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
        // Stop any running interval/timer before leaving the page.
        try {
          const hi = window.setInterval(function () {}, 999999);
          for (let i = 1; i <= hi; i++) window.clearInterval(i);
        } catch (e) {}
        window.location.reload();
      });
      exit.addEventListener('click', e => { if (e.target === exit) exit.style.display = 'none'; });
    }
  });
})();
