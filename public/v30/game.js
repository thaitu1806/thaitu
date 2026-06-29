// V30 - Giải Đố Vui (Puzzle Party)
(function() {
'use strict';

const STORAGE_KEY = 'v30_party';
const TOTAL_ROUNDS = 10;

const ROUND_TYPES = [
  { id: 'normal', name: 'Bình thường', icon: '🎯', timer: 10, desc: '4 lựa chọn, 10 giây', cssClass: 'type-normal' },
  { id: 'truefalse', name: 'Đúng/Sai', icon: '✅', timer: 8, desc: '2 nút: Đúng hoặc Sai', cssClass: 'type-truefalse' },
  { id: 'speed', name: 'Tốc Độ', icon: '⚡', timer: 5, desc: '4 lựa chọn, chỉ 5 giây!', cssClass: 'type-speed' },
  { id: 'golden', name: 'Vàng', icon: '🌟', timer: 10, desc: '3x điểm nếu đúng!', cssClass: 'type-golden' },
  { id: 'reverse', name: 'Ngược', icon: '🔄', timer: 10, desc: 'Chọn đáp án SAI!', cssClass: 'type-reverse' }
];

// State
let highScore = loadHighScore();
let questions = [];
let currentRound = 0;
let score = 0;
let correctCount = 0;
let roundTypes = [];
let timer = null;
let timeLeft = 0;

function loadHighScore() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved).highScore || 0;
  } catch(e) {}
  return 0;
}

function saveHighScore(s) {
  highScore = Math.max(highScore, s);
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ highScore }));
}

// Screen management
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// Generate random round types for 10 rounds
function generateRoundTypes() {
  const types = [];
  for (let i = 0; i < TOTAL_ROUNDS; i++) {
    types.push(ROUND_TYPES[Math.floor(Math.random() * ROUND_TYPES.length)]);
  }
  return types;
}

// ========== START ==========
function init() {
  document.getElementById('high-score').textContent = highScore;
  document.getElementById('btn-start').onclick = startGame;
  document.getElementById('btn-replay').onclick = startGame;
}

async function startGame() {
  // Fetch questions
  try {
    const profile = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
    const grade = profile.grade ?? 2;
    const subjects = ['math', 'vietnamese', 'english'];
    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    const res = await fetch(`/api/questions?subject=${subject}&difficulty=easy&limit=${TOTAL_ROUNDS}&grade=${grade}`);
    questions = await res.json();
    if (!questions || questions.length === 0) {
      alert('Không tải được câu hỏi!');
      return;
    }
  } catch(e) {
    alert('Lỗi kết nối!');
    return;
  }

  currentRound = 0;
  score = 0;
  correctCount = 0;
  roundTypes = generateRoundTypes();
  spinWheel();
}

// ========== WHEEL SPIN ==========
function spinWheel() {
  showScreen('wheel-screen');
  document.getElementById('wheel-round').textContent = currentRound + 1;
  document.getElementById('round-result').textContent = '';

  const wheel = document.getElementById('wheel');
  const roundType = roundTypes[currentRound];
  const typeIndex = ROUND_TYPES.findIndex(t => t.id === roundType.id);

  // Calculate rotation: each segment is 72deg, spin multiple full rotations + land on segment
  const segAngle = 72;
  const targetAngle = (typeIndex * segAngle) + (segAngle / 2);
  const spins = 3 + Math.floor(Math.random() * 3); // 3-5 full rotations
  const finalRotation = spins * 360 + (360 - targetAngle);

  wheel.style.transition = 'none';
  wheel.style.transform = 'rotate(0deg)';

  // Force reflow
  wheel.offsetHeight;

  wheel.style.transition = 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
  wheel.style.transform = `rotate(${finalRotation}deg)`;

  setTimeout(() => {
    document.getElementById('round-result').innerHTML = 
      `${roundType.icon} <strong>${roundType.name}</strong><br><small>${roundType.desc}</small>`;
  }, 2500);

  setTimeout(() => {
    showQuestion();
  }, 3800);
}

// ========== QUESTION ==========
function showQuestion() {
  showScreen('question-screen');
  const q = questions[currentRound];
  const roundType = roundTypes[currentRound];

  // Header
  document.getElementById('q-round').textContent = `Vòng ${currentRound + 1}/${TOTAL_ROUNDS}`;
  document.getElementById('q-score').textContent = `${score} điểm`;
  
  const badge = document.getElementById('q-type-badge');
  badge.textContent = `${roundType.icon} ${roundType.name}`;
  badge.className = `q-type-badge ${roundType.cssClass}`;

  // Question text
  const qText = document.getElementById('q-text');
  if (roundType.id === 'reverse') {
    qText.textContent = `🔄 Chọn đáp án SAI: ${q.question_text}`;
  } else {
    qText.textContent = q.question_text;
  }

  // Options
  const optionsGrid = document.getElementById('q-options');
  optionsGrid.innerHTML = '';
  optionsGrid.className = 'q-options';

  if (roundType.id === 'truefalse') {
    // True/False mode: show correct answer as statement, ask Đúng/Sai
    renderTrueFalse(q, roundType);
  } else {
    // Standard 4-choice (normal, speed, golden, reverse)
    renderFourChoice(q, roundType);
  }

  // Feedback clear
  document.getElementById('q-feedback').textContent = '';
  document.getElementById('q-feedback').className = 'q-feedback';

  // Start timer
  startTimer(roundType.timer);
}

function renderTrueFalse(q, roundType) {
  const optionsGrid = document.getElementById('q-options');
  optionsGrid.className = 'q-options two-cols';

  // Randomly decide if we show the correct answer or a wrong one
  const showCorrect = Math.random() > 0.5;
  const correctAnswer = q.correct_answer.toLowerCase();
  const options = ['a', 'b', 'c', 'd'];
  const wrongOptions = options.filter(o => o !== correctAnswer);
  
  let displayedAnswer;
  if (showCorrect) {
    displayedAnswer = q[`option_${correctAnswer.toLowerCase()}`];
  } else {
    const wrongKey = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
    displayedAnswer = q[`option_${wrongKey.toLowerCase()}`];
  }

  // Update question text to show the statement with original question
  document.getElementById('q-text').textContent = `${q.question_text}\n"${displayedAnswer}" là đáp án đúng?`;

  const btnTrue = document.createElement('button');
  btnTrue.className = 'option-btn';
  btnTrue.textContent = '✅ Đúng';
  btnTrue.onclick = () => handleTrueFalse(showCorrect === true, roundType);

  const btnFalse = document.createElement('button');
  btnFalse.className = 'option-btn';
  btnFalse.textContent = '❌ Sai';
  btnFalse.onclick = () => handleTrueFalse(showCorrect === false, roundType);

  optionsGrid.appendChild(btnTrue);
  optionsGrid.appendChild(btnFalse);
}

function handleTrueFalse(isCorrect, roundType) {
  clearInterval(timer);
  const btns = document.querySelectorAll('.option-btn');
  btns.forEach(b => b.classList.add('disabled'));

  if (isCorrect) {
    const points = roundType.id === 'golden' ? 30 : 10;
    score += points;
    correctCount++;
    btns.forEach(b => {
      if ((isCorrect && b.textContent.includes('Đúng')) || (!isCorrect && b.textContent.includes('Sai'))) {
        b.classList.add('correct');
      }
    });
    showFeedback(true, points);
  } else {
    btns.forEach(b => b.classList.add('wrong'));
    showFeedback(false, 0);
  }

  setTimeout(nextRound, 1500);
}

function renderFourChoice(q, roundType) {
  const optionsGrid = document.getElementById('q-options');
  const options = [
    { key: 'A', text: q.option_a },
    { key: 'B', text: q.option_b },
    { key: 'C', text: q.option_c },
    { key: 'D', text: q.option_d }
  ];

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    if (roundType.id === 'golden') btn.className += ' golden-glow';
    if (roundType.id === 'reverse') btn.className += ' reverse-mode';
    btn.textContent = `${opt.key}. ${opt.text}`;
    btn.onclick = () => handleFourChoice(opt.key, q.correct_answer, roundType);
    optionsGrid.appendChild(btn);
  });
}

function handleFourChoice(selected, correct, roundType) {
  clearInterval(timer);
  const btns = document.querySelectorAll('.option-btn');
  btns.forEach(b => b.classList.add('disabled'));

  let isCorrect;
  if (roundType.id === 'reverse') {
    // In reverse mode, picking WRONG answer is correct
    isCorrect = selected.toLowerCase() !== correct.toLowerCase();
  } else {
    isCorrect = selected.toLowerCase() === correct.toLowerCase();
  }

  // Highlight
  btns.forEach(b => {
    const btnKey = b.textContent.charAt(0).toLowerCase();
    if (roundType.id === 'reverse') {
      // In reverse: correct answer should be avoided (mark it)
      if (btnKey === correct.toLowerCase()) b.classList.add('wrong');
      if (isCorrect && btnKey === selected.toLowerCase()) b.classList.add('correct');
      if (!isCorrect && btnKey === selected.toLowerCase()) b.classList.add('wrong');
    } else {
      if (btnKey === correct.toLowerCase()) b.classList.add('correct');
      if (!isCorrect && btnKey === selected.toLowerCase()) b.classList.add('wrong');
    }
  });

  if (isCorrect) {
    const points = roundType.id === 'golden' ? 30 : roundType.id === 'speed' ? 15 : 10;
    score += points;
    correctCount++;
    showFeedback(true, points);
  } else {
    showFeedback(false, 0);
  }

  setTimeout(nextRound, 1500);
}

function showFeedback(correct, points) {
  const fb = document.getElementById('q-feedback');
  if (correct) {
    fb.textContent = `✅ Đúng! +${points} điểm`;
    fb.className = 'q-feedback correct';
  } else {
    fb.textContent = '❌ Sai rồi!';
    fb.className = 'q-feedback wrong';
  }
  document.getElementById('q-score').textContent = `${score} điểm`;
}

function startTimer(seconds) {
  clearInterval(timer);
  timeLeft = seconds;
  const fill = document.getElementById('timer-fill');
  const text = document.getElementById('timer-text');
  fill.style.width = '100%';
  fill.classList.remove('warning', 'speed');
  
  if (seconds <= 5) fill.classList.add('speed');
  text.textContent = `${seconds}s`;

  timer = setInterval(() => {
    timeLeft -= 0.1;
    const pct = (timeLeft / seconds) * 100;
    fill.style.width = pct + '%';
    text.textContent = `${Math.ceil(timeLeft)}s`;
    if (timeLeft <= 3) fill.classList.add('warning');
    if (timeLeft <= 0) {
      clearInterval(timer);
      handleTimeout();
    }
  }, 100);
}

function handleTimeout() {
  const btns = document.querySelectorAll('.option-btn');
  btns.forEach(b => b.classList.add('disabled'));

  const q = questions[currentRound];
  // Highlight correct
  btns.forEach(b => {
    if (b.textContent.charAt(0).toLowerCase() === q.correct_answer.toLowerCase()) b.classList.add('correct');
  });

  const fb = document.getElementById('q-feedback');
  fb.textContent = '⏰ Hết giờ!';
  fb.className = 'q-feedback wrong';

  setTimeout(nextRound, 1500);
}

function nextRound() {
  currentRound++;
  if (currentRound >= TOTAL_ROUNDS) {
    showResults();
  } else {
    spinWheel();
  }
}

// ========== RESULTS ==========
function showResults() {
  showScreen('result-screen');

  document.getElementById('result-score').textContent = score;
  
  const accuracy = Math.round((correctCount / TOTAL_ROUNDS) * 100);
  document.getElementById('result-detail').innerHTML = `
    ✅ Đúng: ${correctCount}/${TOTAL_ROUNDS} (${accuracy}%)<br>
    🎯 Trung bình: ${Math.round(score / TOTAL_ROUNDS)} điểm/vòng
  `;

  const isNewHigh = score > highScore;
  if (isNewHigh) {
    document.getElementById('result-highscore').textContent = '🎉 KỶ LỤC MỚI!';
    document.getElementById('result-title').textContent = '🏆 Kỷ Lục Mới!';
  } else {
    document.getElementById('result-highscore').textContent = `🏆 Kỷ lục: ${highScore} điểm`;
    document.getElementById('result-title').textContent = '🎪 Kết Quả!';
  }

  saveHighScore(score);
  spawnConfetti();
  saveSession();

  // Call checkAndShowPrompt if available
  if (typeof checkAndShowPrompt === 'function') {
    checkAndShowPrompt();
  }
}

function spawnConfetti() {
  const container = document.getElementById('confetti');
  container.innerHTML = '';
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F', '#BB8FCE', '#FF9800', '#4CAF50'];
  
  for (let i = 0; i < 30; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = (Math.random() * 2) + 's';
    piece.style.animationDuration = (2 + Math.random() * 2) + 's';
    container.appendChild(piece);
  }
}

async function saveSession() {
  try {
    const profile = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
    if (!profile.id) return;
    await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: profile.id,
        subject: 'mixed',
        difficulty: 'easy',
        score: score,
        total_questions: TOTAL_ROUNDS,
        correct_answers: correctCount,
        stars_earned: Math.floor(correctCount / 3),
        combo_max: 0,
        mode: 'v30'
      })
    });
  } catch(e) {}
}

// ========== INIT ==========
init();

})();

// ===== CHARACTER SYSTEM INTEGRATION (presentation only, additive) =====
(function () {
  'use strict';

  const hosts = {}; // id -> character instance

  function mountHost(hostId, species, fallback) {
    const el = document.getElementById(hostId);
    if (!el) return;
    el.innerHTML = '';
    const C = window.HocVuiCharacters;
    if (C && C.hasSpecies(species)) {
      hosts[hostId] = C.createCharacter(species, el, { state: 'idle' });
    } else {
      el.textContent = fallback;
      el.classList.add('host-fallback');
    }
  }

  function cheer(hostId) {
    const ch = hosts[hostId];
    if (!ch) return;
    ch.setState('happy');
    setTimeout(() => { if (ch) ch.setState('idle'); }, 700);
  }

  // Particle helper — sparkles around an element (good answer).
  function spawnSparkle(parent, count) {
    if (!parent) return;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'pfx pfx-sparkle';
      p.style.setProperty('--tx', (Math.random() * 80 - 40) + 'px');
      p.style.setProperty('--ty', -(Math.random() * 46 + 20) + 'px');
      p.style.setProperty('--delay', (Math.random() * 0.15) + 's');
      parent.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
  }

  // Confetti burst helper — colorful ribbons rising from an element.
  function spawnConfettiBurst(parent, count) {
    if (!parent) return;
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F', '#BB8FCE', '#FF9800'];
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'pfx pfx-confetti';
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.setProperty('--tx', (Math.random() * 120 - 60) + 'px');
      p.style.setProperty('--ty', -(Math.random() * 60 + 30) + 'px');
      p.style.setProperty('--delay', (Math.random() * 0.2) + 's');
      parent.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
  }
  window.__v30_spawnSparkle = spawnSparkle;
  window.__v30_spawnConfettiBurst = spawnConfettiBurst;

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    const $ = id => document.getElementById(id);

    // Mount mascots: cheerful host on start + wheel, clown buddy in question header.
    mountHost('host-stage', 'host', '🤹');
    mountHost('wheel-host', 'host', '🤹');
    mountHost('quiz-host', 'clown', '🤡');

    // Sync "happy" reaction to correct answers by observing the feedback node.
    const fb = $('q-feedback');
    if (fb && window.MutationObserver) {
      const obs = new MutationObserver(() => {
        if (fb.classList.contains('correct')) {
          cheer('quiz-host');
          const host = $('quiz-host');
          if (host) spawnSparkle(host, 7);
        }
      });
      obs.observe(fb, { attributes: true, attributeFilter: ['class'] });
    }

    // Celebrate on the result screen (when it becomes active).
    const resultScreen = $('result-screen');
    if (resultScreen && window.MutationObserver) {
      const robs = new MutationObserver(() => {
        if (resultScreen.classList.contains('active')) {
          const stage = $('host-stage');
          if (hosts['host-stage']) cheer('host-stage');
          if (stage) spawnConfettiBurst(stage, 14);
        }
      });
      robs.observe(resultScreen, { attributes: true, attributeFilter: ['class'] });
    }

    // Guide modal
    const guide = $('guide-modal');
    const guideBtn = $('btn-guide');
    if (guide && guideBtn) {
      guideBtn.addEventListener('click', () => { guide.style.display = 'flex'; });
      const close = $('btn-guide-close');
      if (close) close.addEventListener('click', () => { guide.style.display = 'none'; });
      guide.addEventListener('click', e => { if (e.target === guide) guide.style.display = 'none'; });
    }

    // Exit modal (styled, no window.confirm)
    const exit = $('exit-modal');
    const exitBtn = $('btn-exit');
    if (exit && exitBtn) {
      exitBtn.addEventListener('click', () => { exit.style.display = 'flex'; });
      const cancel = $('btn-exit-cancel');
      if (cancel) cancel.addEventListener('click', () => { exit.style.display = 'none'; });
      const confirm = $('btn-exit-confirm');
      if (confirm) confirm.addEventListener('click', () => {
        exit.style.display = 'none';
        // Stop any running timers/loops before leaving the page.
        try {
          const hi = setInterval(function () {}, 100000);
          for (let i = 0; i <= hi; i++) clearInterval(i);
        } catch (e) {}
        window.location.reload();
      });
      exit.addEventListener('click', e => { if (e.target === exit) exit.style.display = 'none'; });
    }
  });
})();
