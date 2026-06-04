// Game State
const state = {
  player: null,
  subject: null,
  difficulty: null,
  questions: [],
  currentIndex: 0,
  score: 0,
  combo: 0,
  maxCombo: 0,
  correctCount: 0,
  zombiePosition: 0, // 0 = far right, 100 = reached house
  timerInterval: null,
  timeLeft: 100,
  isAnswering: false,
  sessionId: null,
  questionStartTime: 0,
  timerSpeedSetting: 'normal', // slow, normal, fast
  zombieEmoji: '💀',
  bulletEmoji: '☄️',
  explosionEmoji: '💥',
  plantEmoji: '🌻',
};

// Random sets for each game
const ZOMBIE_SET = [
  '💀', '🧟', '👻', '👹', '👺', '🤖', '👾', '🦇', '🐛', '🦠',
  '🎃', '☠️', '🕷️', '🦂', '🐍', '🦎', '🐲', '🐉', '🦖', '🦕',
  '🐊', '🦈', '🐙', '🦑', '🪳', '🪲', '🐜', '🦗', '🕸️', '🦟',
  '🐺', '🦁', '🐗', '🦍', '🦬', '🐏', '🦏', '🐻', '🧛', '🧙',
];
const BULLET_SET = [
  '☄️', '🔥', '⚡', '💫', '🌟', '🚀', '🎯', '💣', '🪨', '🌊',
  '🏹', '🗡️', '🪃', '🛡️', '⚔️', '🔱', '💎', '🧨', '🎱', '🪓',
  '🌩️', '❄️', '🌪️', '☀️', '🌶️', '🍉', '🥊', '🎾', '⚾', '🏈',
  '🪁', '🎳', '🧊', '💧', '🫧', '🌀', '⭐', '🔔', '🎵', '🍳',
];
const EXPLOSION_SET = [
  '💥', '🔥', '✨', '⭐', '🌟', '💫', '🎆', '🎇', '☀️', '🌈',
  '🎊', '🎉', '🪅', '🎀', '🌸', '🌺', '🏵️', '🌼', '💐', '🌻',
  '⚡', '💢', '❗', '🔆', '🔅', '✳️', '❇️', '🌠', '☄️', '🫨',
  '💨', '💦', '🫧', '🌀', '🎭', '🧧', '🪩', '🎪', '🎠', '🩵',
];
const PLANT_SET = [
  '🌻', '🌹', '🌵', '🍄', '🌲', '🎋', '🌸', '🪴', '🌿', '🏵️',
  '🌷', '🌺', '🌼', '💐', '🍀', '☘️', '🌱', '🎍', '🪻', '🫘',
  '🌾', '🎄', '🌳', '🍁', '🍂', '🍃', '🪷', '🪹', '🐚', '🥀',
  '🍇', '🍊', '🍋', '🍓', '🫐', '🥝', '🥥', '🌽', '🥕', '🥦',
];

// DOM Elements
const screens = {
  menu: document.getElementById('menu-screen'),
  subject: document.getElementById('subject-screen'),
  difficulty: document.getElementById('difficulty-screen'),
  game: document.getElementById('game-screen'),
  result: document.getElementById('result-screen'),
};

// Show screen
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

// MENU SCREEN
// Auto-fill from profile + verify with server
(async function() {
  const profile = localStorage.getItem('hocvui_profile');
  if (!profile) {
    window.location.href = '/';
    return;
  }
  const p = JSON.parse(profile);
  try {
    const res = await fetch(`/api/players?id=${p.id}`);
    const data = await res.json();
    if (!data || data.error || !data.id) {
      localStorage.removeItem('hocvui_profile');
      window.location.href = '/';
      return;
    }
    document.getElementById('player-welcome').textContent = `Chào ${data.name}! 🎉`;
    localStorage.setItem('hocvui_profile', JSON.stringify({ id: data.id, name: data.name }));
  } catch {
    // Network error - trust local
    document.getElementById('player-welcome').textContent = `Chào ${p.name}! 🎉`;
  }
})();

document.getElementById('btn-start').addEventListener('click', async () => {
  const profile = localStorage.getItem('hocvui_profile');
  if (!profile) {
    window.location.href = '/';
    return;
  }
  const p = JSON.parse(profile);
  const name = p.name;
  state.timerSpeedSetting = document.getElementById('timer-speed').value;
  state.player = p;
  document.getElementById('welcome-text').textContent = `Xin chào ${name}! 🎉`;
  showScreen('subject');
});

// SUBJECT SELECT
document.querySelectorAll('[data-subject]').forEach(card => {
  card.addEventListener('click', () => {
    state.subject = card.dataset.subject;
    showScreen('difficulty');
  });
});

// DIFFICULTY SELECT
document.querySelectorAll('[data-difficulty]').forEach(card => {
  card.addEventListener('click', async () => {
    state.difficulty = card.dataset.difficulty;
    await startGame();
  });
});

document.getElementById('btn-back-subject').addEventListener('click', () => showScreen('subject'));

// START GAME
async function startGame() {
  // Reset state
  state.currentIndex = 0;
  state.score = 0;
  state.combo = 0;
  state.maxCombo = 0;
  state.correctCount = 0;
  state.zombiePosition = 0;
  state.isAnswering = false;
  state.sessionId = null;

  // Random zombie, bullet, explosion, plant for this game session
  state.zombieEmoji = ZOMBIE_SET[Math.floor(Math.random() * ZOMBIE_SET.length)];
  state.bulletEmoji = BULLET_SET[Math.floor(Math.random() * BULLET_SET.length)];
  state.explosionEmoji = EXPLOSION_SET[Math.floor(Math.random() * EXPLOSION_SET.length)];
  state.plantEmoji = PLANT_SET[Math.floor(Math.random() * PLANT_SET.length)];

  // Apply random emojis to DOM
  document.getElementById('zombie').textContent = state.zombieEmoji;
  document.getElementById('bullet').textContent = state.bulletEmoji;
  document.getElementById('plant').textContent = state.plantEmoji;

  // Init audio on first interaction
  initAudio();

  // Fetch questions
  try {
    const res = await fetch(`/api/questions?subject=${state.subject}&difficulty=${state.difficulty}&limit=10`);
    state.questions = await res.json();
  } catch {
    // Fallback if server not available
    state.questions = generateFallbackQuestions();
  }

  if (state.questions.length === 0) {
    state.questions = generateFallbackQuestions();
  }

  // Update UI
  const subjectLabel = state.subject === 'math' ? '🔢 Toán' : '📖 Tiếng Việt';
  const diffLabels = { easy: '⭐ Dễ', medium: '⭐⭐ TB', hard: '⭐⭐⭐ Khó' };
  document.getElementById('game-subject-label').textContent = subjectLabel;
  document.getElementById('game-difficulty-label').textContent = diffLabels[state.difficulty];

  updateStats();
  showScreen('game');
  resetZombie();
  showQuestion();
}

// SHOW QUESTION
function showQuestion() {
  if (state.currentIndex >= state.questions.length) {
    endGame();
    return;
  }

  const q = state.questions[state.currentIndex];
  document.getElementById('question-text').innerHTML = formatQuestionText(q.question_text);

  const options = document.querySelectorAll('.option-btn');
  options[0].textContent = `A. ${q.option_a}`;
  options[1].textContent = `B. ${q.option_b}`;
  options[2].textContent = `C. ${q.option_c}`;
  options[3].textContent = `D. ${q.option_d}`;

  // Reset option styles
  options.forEach(btn => {
    btn.classList.remove('correct', 'wrong');
    btn.classList.add('reset');
    btn.disabled = false;
    btn.blur();
    // Remove reset class after a frame to allow fresh interaction
    requestAnimationFrame(() => btn.classList.remove('reset'));
  });

  state.isAnswering = true;
  state.questionStartTime = Date.now();
  startTimer();
}

// TIMER
function startTimer() {
  state.timeLeft = 100;
  const timerBar = document.getElementById('timer-bar');
  timerBar.style.width = '100%';
  timerBar.className = 'timer-bar';

  clearInterval(state.timerInterval);

  const speedMultiplier = state.timerSpeedSetting === 'slow' ? 1.5 : state.timerSpeedSetting === 'fast' ? 0.6 : 1;
  const baseSpeed = state.difficulty === 'hard' ? 120 : state.difficulty === 'medium' ? 150 : 200;
  const timerSpeed = Math.round(baseSpeed * speedMultiplier);

  state.timerInterval = setInterval(() => {
    state.timeLeft -= 1;
    timerBar.style.width = state.timeLeft + '%';

    if (state.timeLeft <= 20) {
      timerBar.className = 'timer-bar danger';
    } else if (state.timeLeft <= 50) {
      timerBar.className = 'timer-bar warning';
    }

    // Zombie creeps forward while player hasn't answered
    if (state.timeLeft % 10 === 0 && state.timeLeft < 80) {
      state.zombiePosition += 2;
      const zombie = document.getElementById('zombie');
      zombie.style.right = Math.min(state.zombiePosition, 85) + '%';
    }

    if (state.timeLeft <= 0) {
      clearInterval(state.timerInterval);
      handleTimeout();
    }
  }, timerSpeed);
}

function handleTimeout() {
  state.isAnswering = false;
  state.combo = 0;
  // Zombie đã bò dần rồi, chỉ thêm 1 bước nhỏ khi hết giờ
  state.zombiePosition += 5;
  const zombie = document.getElementById('zombie');
  zombie.style.right = Math.min(state.zombiePosition, 85) + '%';

  if (state.zombiePosition >= 85) { endGame(); return; }

  // Show correct answer
  const q = state.questions[state.currentIndex];
  const options = document.querySelectorAll('.option-btn');
  options.forEach(btn => {
    btn.disabled = true;
    if (btn.dataset.option === q.correct_answer) {
      btn.classList.add('correct');
    }
  });

  playSound('wrong');

  setTimeout(() => {
    state.currentIndex++;
    updateStats();
    showQuestion();
  }, 1500);
}

// HANDLE ANSWER
document.querySelectorAll('.option-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!state.isAnswering) return;
    state.isAnswering = false;
    clearInterval(state.timerInterval);

    const q = state.questions[state.currentIndex];
    const selected = btn.dataset.option;
    const isCorrect = selected === q.correct_answer;
    const timeSpent = Date.now() - state.questionStartTime;

    // Log answer
    logAnswer(q, selected, isCorrect, timeSpent);

    // Disable all buttons
    document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);

    if (isCorrect) {
      btn.classList.add('correct');
      state.combo++;
      state.maxCombo = Math.max(state.maxCombo, state.combo);
      state.correctCount++;

      // Score: base + combo bonus + time bonus
      const timeBonus = Math.floor(state.timeLeft / 10);
      const comboBonus = state.combo * 5;
      state.score += 10 + timeBonus + comboBonus;

      // Effects
      playSound('correct');
      showComboEffect();
      const rect = btn.getBoundingClientRect();
      createParticles(rect.left + rect.width / 2, rect.top, 'correct');

      // Plant attacks zombie
      shootZombie();
    } else {
      btn.classList.add('wrong');
      state.combo = 0;
      playSound('wrong');

      // Screen shake
      document.getElementById('game-screen').classList.add('shake');
      setTimeout(() => document.getElementById('game-screen').classList.remove('shake'), 300);

      // Show correct answer
      document.querySelectorAll('.option-btn').forEach(b => {
        if (b.dataset.option === q.correct_answer) b.classList.add('correct');
      });

      // Zombie moves forward
      moveZombieForward();
    }

    updateStats();

    setTimeout(() => {
      state.currentIndex++;
      showQuestion();
    }, 1500);
  });
});

// ZOMBIE MECHANICS
function resetZombie() {
  state.zombiePosition = 0;
  const zombie = document.getElementById('zombie');
  zombie.style.right = '0%';
}

function moveZombieForward() {
  state.zombiePosition += 15;
  const zombie = document.getElementById('zombie');
  zombie.style.right = Math.min(state.zombiePosition, 85) + '%';

  if (state.zombiePosition >= 85) {
    // Zombie reached house - game over early
    endGame();
  }
}

function shootZombie() {
  const plant = document.getElementById('plant');
  const bullet = document.getElementById('bullet');
  const zombie = document.getElementById('zombie');

  playSound('shoot');

  // Plant attack animation
  plant.classList.add('attack');
  setTimeout(() => plant.classList.remove('attack'), 300);

  // Calculate where zombie is (zombie uses right:X%, so bullet target from left, offset for zombie width)
  const targetLeft = 'calc(' + (100 - state.zombiePosition - 15) + '% - 20px)';
  bullet.style.setProperty('--target', targetLeft);

  // Bullet flies to zombie position
  bullet.classList.remove('hidden', 'explode');
  bullet.classList.add('shooting');
  bullet.textContent = state.bulletEmoji;

  // When bullet reaches zombie → explode at that position
  setTimeout(() => {
    bullet.classList.remove('shooting');
    bullet.style.left = targetLeft;
    bullet.textContent = state.explosionEmoji;
    bullet.classList.add('explode');

    // Zombie hit
    zombie.classList.add('hit');
    setTimeout(() => zombie.classList.remove('hit'), 300);

    // Push zombie back
    state.zombiePosition = Math.max(0, state.zombiePosition - 10);
    zombie.style.right = state.zombiePosition + '%';

    // Hide bullet after explosion
    setTimeout(() => {
      bullet.classList.remove('explode');
      bullet.classList.add('hidden');
      bullet.style.left = '0';
      bullet.textContent = state.bulletEmoji;
    }, 400);
  }, 500);
}

// UPDATE STATS
function updateStats() {
  document.getElementById('score-display').textContent = `💰 ${state.score}`;
  document.getElementById('combo-display').textContent = `🔥 x${state.combo}`;
  document.getElementById('progress-display').textContent = `📋 ${state.currentIndex}/${state.questions.length}`;
}

// END GAME
function endGame() {
  clearInterval(state.timerInterval);

  const total = state.questions.length;
  const percentage = state.correctCount / total;
  let stars = 0;
  let title = '';

  if (percentage >= 0.9) {
    stars = 3;
    title = '🏆 Xuất sắc!';
    showCelebration('🏆 Xuất sắc! Giỏi quá!');
  } else if (percentage >= 0.7) {
    stars = 2;
    title = '👏 Giỏi lắm!';
    showCelebration('👏 Giỏi lắm!');
  } else if (percentage >= 0.5) {
    stars = 1;
    title = '👍 Cố gắng thêm!';
    playSound('clap');
  } else {
    stars = 0;
    title = '💪 Lần sau sẽ tốt hơn!';
    playSound('gameover');
  }

  document.getElementById('result-title').textContent = title;
  document.getElementById('result-stars').textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
  document.getElementById('result-correct').textContent = state.correctCount;
  document.getElementById('result-total').textContent = total;
  document.getElementById('result-score').textContent = state.score;
  document.getElementById('result-combo').textContent = state.maxCombo;

  // Save session
  saveSession(stars);

  showScreen('result');
}

async function saveSession(stars) {
  try {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: state.player.id,
        subject: state.subject,
        difficulty: state.difficulty,
        score: state.score,
        total_questions: state.questions.length,
        correct_answers: state.correctCount,
        stars_earned: stars,
        combo_max: state.maxCombo,
      }),
    });
    const data = await res.json();
    state.sessionId = data.id;
  } catch (e) {
    // Offline mode - no save
  }
}

async function logAnswer(question, selected, isCorrect, timeSpent) {
  if (!question.id || !state.player) return;
  try {
    await fetch('/api/answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: state.sessionId || 0,
        player_id: state.player.id,
        question_id: question.id,
        selected_answer: selected,
        correct_answer: question.correct_answer,
        is_correct: isCorrect,
        time_spent_ms: timeSpent,
      }),
    });
  } catch (e) { /* offline */ }
}

// RESULT BUTTONS
document.getElementById('btn-play-again').addEventListener('click', () => startGame());
document.getElementById('btn-back-menu').addEventListener('click', () => showScreen('subject'));

// EXIT GAME with custom popup
document.getElementById('btn-exit-game').addEventListener('click', () => {
  showConfirmPopup('😢', 'Bạn có muốn thoát\ntrò chơi không?', () => {
    clearInterval(state.timerInterval);
    window.location.href = '/';
  });
});

function showConfirmPopup(icon, text, onYes) {
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.innerHTML = `
    <div class="confirm-box">
      <div class="confirm-icon">${icon}</div>
      <div class="confirm-text">${text}</div>
      <div class="confirm-btns">
        <button class="confirm-btn confirm-btn-yes">Thoát</button>
        <button class="confirm-btn confirm-btn-no">Chơi tiếp</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('.confirm-btn-yes').addEventListener('click', () => { overlay.remove(); onYes(); });
  overlay.querySelector('.confirm-btn-no').addEventListener('click', () => overlay.remove());
}

// FALLBACK QUESTIONS (when server is not available)
function generateFallbackQuestions() {
  const mathEasy = [
    { question_text: "3 + 5 = ?", option_a: "8", option_b: "7", option_c: "9", option_d: "6", correct_answer: "a" },
    { question_text: "7 - 2 = ?", option_a: "4", option_b: "5", option_c: "6", option_d: "3", correct_answer: "b" },
    { question_text: "4 + 6 = ?", option_a: "9", option_b: "11", option_c: "10", option_d: "8", correct_answer: "c" },
    { question_text: "9 - 3 = ?", option_a: "5", option_b: "7", option_c: "4", option_d: "6", correct_answer: "d" },
    { question_text: "8 + 5 = ?", option_a: "13", option_b: "12", option_c: "14", option_d: "11", correct_answer: "a" },
    { question_text: "15 - 7 = ?", option_a: "7", option_b: "8", option_c: "9", option_d: "6", correct_answer: "b" },
    { question_text: "6 + 9 = ?", option_a: "14", option_b: "16", option_c: "15", option_d: "13", correct_answer: "c" },
    { question_text: "12 - 4 = ?", option_a: "7", option_b: "9", option_c: "6", option_d: "8", correct_answer: "d" },
    { question_text: "7 + 8 = ?", option_a: "15", option_b: "14", option_c: "16", option_d: "13", correct_answer: "a" },
    { question_text: "18 - 9 = ?", option_a: "8", option_b: "9", option_c: "10", option_d: "7", correct_answer: "b" },
  ];

  const vietEasy = [
    { question_text: "Từ nào đúng chính tả?", option_a: "sạch sẽ", option_b: "xạch xẽ", option_c: "sạch xẽ", option_d: "xạch sẽ", correct_answer: "a" },
    { question_text: "Trái nghĩa của 'to' là?", option_a: "lớn", option_b: "nhỏ", option_c: "cao", option_d: "dài", correct_answer: "b" },
    { question_text: "Con vật nào biết bay?", option_a: "Cá", option_b: "Mèo", option_c: "Chim", option_d: "Chó", correct_answer: "c" },
    { question_text: "Điền ch hay tr: ...ời nắng", option_a: "ch", option_b: "s", option_c: "x", option_d: "tr", correct_answer: "d" },
    { question_text: "Lá cây có màu gì?", option_a: "Xanh", option_b: "Đỏ", option_c: "Vàng", option_d: "Tím", correct_answer: "a" },
    { question_text: "Mẹ của mẹ gọi là?", option_a: "Bà nội", option_b: "Bà ngoại", option_c: "Cô", option_d: "Dì", correct_answer: "b" },
    { question_text: "Hình vuông có mấy cạnh?", option_a: "3", option_b: "5", option_c: "4", option_d: "6", correct_answer: "c" },
    { question_text: "Từ 'bàn' có vần gì?", option_a: "ăn", option_b: "ân", option_c: "en", option_d: "an", correct_answer: "d" },
    { question_text: "Số liền sau số 9 là?", option_a: "10", option_b: "8", option_c: "11", option_d: "7", correct_answer: "a" },
    { question_text: "Điền s hay x: ...e đạp", option_a: "s", option_b: "x", option_c: "ch", option_d: "tr", correct_answer: "b" },
  ];

  if (state.subject === 'math') return mathEasy;
  return vietEasy;
}

// === FORMAT QUESTION TEXT (vertical math) ===
function formatQuestionText(text) {
  if (!text.startsWith('Đặt tính:')) return escapeHtml(text);
  const lines = text.split('\n');
  const num1 = lines[1] ? lines[1].trim() : '';
  const opLine = lines[2] ? lines[2].trim() : '';
  const op = opLine.charAt(0);
  const num2 = opLine.substring(1).trim();
  return `<div class="vertical-math"><div class="vm-num">${num1}</div><div class="vm-op">${op}</div><div class="vm-num">${num2}</div><div class="vm-line"></div></div>`;
}
function escapeHtml(t) { return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// === SOUND EFFECTS (Web Audio API - no files needed) ===
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function initAudio() {
  if (!audioCtx) audioCtx = new AudioCtx();
}

function playSound(type) {
  try {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    switch (type) {
      case 'correct':
        osc.frequency.setValueAtTime(523, audioCtx.currentTime); // C5
        osc.frequency.setValueAtTime(659, audioCtx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(784, audioCtx.currentTime + 0.2); // G5
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start(); osc.stop(audioCtx.currentTime + 0.4);
        break;
      case 'wrong':
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.setValueAtTime(150, audioCtx.currentTime + 0.15);
        osc.type = 'sawtooth';
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start(); osc.stop(audioCtx.currentTime + 0.3);
        break;
      case 'shoot':
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.15);
        osc.type = 'square';
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.start(); osc.stop(audioCtx.currentTime + 0.15);
        break;
      case 'combo':
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc.frequency.setValueAtTime(1047, audioCtx.currentTime + 0.1);
        osc.frequency.setValueAtTime(1319, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start(); osc.stop(audioCtx.currentTime + 0.4);
        break;
      case 'gameover':
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.setValueAtTime(300, audioCtx.currentTime + 0.2);
        osc.frequency.setValueAtTime(200, audioCtx.currentTime + 0.4);
        osc.type = 'sawtooth';
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
        osc.start(); osc.stop(audioCtx.currentTime + 0.6);
        break;
      case 'win':
        [523, 659, 784, 1047].forEach((freq, i) => {
          const o = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          o.connect(g); g.connect(audioCtx.destination);
          o.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.15);
          g.gain.setValueAtTime(0.2, audioCtx.currentTime + i * 0.15);
          g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.15 + 0.3);
          o.start(audioCtx.currentTime + i * 0.15);
          o.stop(audioCtx.currentTime + i * 0.15 + 0.3);
        });
        break;
      case 'clap':
        // Tiếng vỗ tay - noise burst pattern
        for (let i = 0; i < 4; i++) {
          const bufSize = 800;
          const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
          const data = buf.getChannelData(0);
          for (let j = 0; j < bufSize; j++) data[j] = (Math.random() * 2 - 1) * (1 - j / bufSize);
          const src = audioCtx.createBufferSource();
          const g = audioCtx.createGain();
          src.buffer = buf; src.connect(g); g.connect(audioCtx.destination);
          const t = audioCtx.currentTime + i * 0.25;
          g.gain.setValueAtTime(0.3, t);
          g.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
          src.start(t); src.stop(t + 0.1);
        }
        break;
      case 'celebrate':
        // Fanfare chúc mừng
        [523, 659, 784, 1047, 1319].forEach((freq, i) => {
          const o = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          o.connect(g); g.connect(audioCtx.destination);
          o.type = i % 2 === 0 ? 'triangle' : 'sine';
          o.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.12);
          g.gain.setValueAtTime(0.25, audioCtx.currentTime + i * 0.12);
          g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.12 + 0.35);
          o.start(audioCtx.currentTime + i * 0.12);
          o.stop(audioCtx.currentTime + i * 0.12 + 0.35);
        });
        // Add clap after fanfare
        setTimeout(() => playSound('clap'), 600);
        break;
    }
  } catch (e) { /* audio not supported */ }
}

// === CELEBRATION EFFECTS ===
function showCelebration(text) {
  const el = document.createElement('div');
  el.className = 'celebration-overlay';
  el.innerHTML = `<div class="celebration-content"><div class="celebration-emojis">🎉🎊👏✨🌟</div><div class="celebration-text">${text}</div></div>`;
  document.body.appendChild(el);
  playSound('celebrate');
  setTimeout(() => el.remove(), 2500);
}

// === PARTICLE EFFECTS ===
function createParticles(x, y, type) {
  const container = document.querySelector('.game-arena');
  const colors = type === 'correct' ? ['#4CAF50', '#8BC34A', '#CDDC39'] : ['#f44336', '#FF5722', '#FF9800'];
  const emojis = type === 'correct' ? ['⭐', '✨', '💫'] : ['💥', '😵', '❌'];

  for (let i = 0; i < 8; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    particle.style.cssText = `
      position: absolute; left: ${x}px; top: ${y}px; font-size: ${12 + Math.random() * 16}px;
      pointer-events: none; z-index: 100;
      animation: particleFly ${0.5 + Math.random() * 0.5}s forwards;
      --dx: ${(Math.random() - 0.5) * 100}px;
      --dy: ${-50 - Math.random() * 80}px;
    `;
    container.appendChild(particle);
    setTimeout(() => particle.remove(), 1000);
  }
}

// === COMBO DISPLAY EFFECT ===
function showComboEffect() {
  if (state.combo < 2) return;
  const comboEl = document.getElementById('combo-display');
  comboEl.style.transform = 'scale(1.5)';
  comboEl.style.color = state.combo >= 5 ? '#f44336' : state.combo >= 3 ? '#FF9800' : '#4CAF50';
  setTimeout(() => { comboEl.style.transform = 'scale(1)'; comboEl.style.color = ''; }, 300);
  if (state.combo >= 3) playSound('combo');
}
