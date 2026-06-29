// V32 - Nhà Khoa Học Nhí (Little Scientist)
(function() {
'use strict';

const STORAGE_KEY = 'v32_lab';
const INGREDIENTS_PER_EXPERIMENT = 5;
const QUESTION_TIME = 10;
const MAX_EXPERIMENTS = 3; // 3 experiments per session (15 questions total)

const RESULTS_POOL = [
  { emoji: '🧪', name: 'Thuốc Đỏ' },
  { emoji: '🧫', name: 'Bọt Xanh' },
  { emoji: '🦠', name: 'Vi Khuẩn Tím' },
  { emoji: '🌈', name: 'Cầu Vồng Lỏng' },
  { emoji: '💎', name: 'Tinh Thể' },
  { emoji: '🌟', name: 'Bụi Sao' },
  { emoji: '🔮', name: 'Cầu Pha Lê' },
  { emoji: '💧', name: 'Bong Bóng Ma Thuật' }
];

// State
let collection = loadCollection();
let selectedSubject = 'math';
let questions = [];
let currentQuestion = 0;
let currentExperiment = 0;
let ingredientsFilled = 0;
let score = 0;
let totalCorrect = 0;
let totalQuestions = 0;
let sessionResults = [];
let questionTimer = null;
let questionTimeLeft = QUESTION_TIME;

function loadCollection() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch(e) {}
  return { results: [], totalExperiments: 0 };
}

function saveCollection() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
}

// Screen management
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ========== INIT ==========
function init() {
  document.getElementById('collection-count').textContent = collection.results.length;
  document.getElementById('btn-start').onclick = startGame;
  document.getElementById('btn-replay').onclick = startGame;
  document.getElementById('btn-next-experiment').onclick = nextExperiment;

  // Subject selector
  document.querySelectorAll('.subj-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.subj-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedSubject = btn.dataset.subject;
    });
  });
}

async function startGame() {
  // Fetch questions (enough for all experiments)
  const totalNeeded = MAX_EXPERIMENTS * INGREDIENTS_PER_EXPERIMENT;
  try {
    const profile = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
    const grade = profile.grade ?? 2;
    const res = await fetch(`/api/questions?subject=${selectedSubject}&difficulty=easy&limit=${totalNeeded}&grade=${grade}`);
    questions = await res.json();
    if (!questions || questions.length === 0) {
      alert('Không tải được câu hỏi!');
      return;
    }
  } catch(e) {
    alert('Lỗi kết nối!');
    return;
  }

  // Reset state
  currentQuestion = 0;
  currentExperiment = 0;
  ingredientsFilled = 0;
  score = 0;
  totalCorrect = 0;
  totalQuestions = 0;
  sessionResults = [];

  showScreen('game-screen');
  resetLabUI();
  showNextQuestion();
}

function resetLabUI() {
  // Reset test tube
  const liquid = document.getElementById('tube-liquid');
  liquid.className = 'tube-liquid';

  // Reset slots
  document.querySelectorAll('.slot').forEach(s => {
    s.classList.remove('filled', 'fizzle');
    s.textContent = '';
  });

  // Update header
  document.getElementById('ingredient-count').textContent = `🧫 ${ingredientsFilled}/${INGREDIENTS_PER_EXPERIMENT}`;
  document.getElementById('experiment-num').textContent = `Thí nghiệm ${currentExperiment + 1}`;
  document.getElementById('game-score').textContent = `⭐ ${score}`;
  document.getElementById('tube-label').textContent = 'Thêm nguyên liệu...';
}

// ========== QUESTIONS ==========
function showNextQuestion() {
  if (currentQuestion >= questions.length) {
    // Ran out of questions
    endGame();
    return;
  }

  const q = questions[currentQuestion];
  document.getElementById('q-text').textContent = q.question_text;
  renderOptions(q);
  document.getElementById('q-feedback').textContent = '';
  document.getElementById('q-feedback').className = 'q-feedback';
  startQuestionTimer();
}

function renderOptions(q) {
  const optionsGrid = document.getElementById('q-options');
  optionsGrid.innerHTML = '';

  const options = [
    { key: 'A', text: q.option_a },
    { key: 'B', text: q.option_b },
    { key: 'C', text: q.option_c },
    { key: 'D', text: q.option_d }
  ];

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = `${opt.key}. ${opt.text}`;
    btn.onclick = () => handleAnswer(opt.key, q);
    optionsGrid.appendChild(btn);
  });
}

function startQuestionTimer() {
  clearInterval(questionTimer);
  questionTimeLeft = QUESTION_TIME;
  const fill = document.getElementById('timer-fill');
  fill.style.width = '100%';
  fill.classList.remove('warning');

  questionTimer = setInterval(() => {
    questionTimeLeft -= 0.1;
    const pct = (questionTimeLeft / QUESTION_TIME) * 100;
    fill.style.width = pct + '%';
    if (questionTimeLeft <= 3) fill.classList.add('warning');
    if (questionTimeLeft <= 0) {
      clearInterval(questionTimer);
      handleTimeout();
    }
  }, 100);
}

function handleAnswer(selected, q) {
  clearInterval(questionTimer);
  totalQuestions++;

  const btns = document.querySelectorAll('.option-btn');
  btns.forEach(b => b.classList.add('disabled'));

  const isCorrect = selected.toLowerCase() === q.correct_answer.toLowerCase();

  // Highlight
  btns.forEach(b => {
    const btnKey = b.textContent.charAt(0).toLowerCase();
    if (btnKey === q.correct_answer.toLowerCase()) b.classList.add('correct');
    if (!isCorrect && btnKey === selected.toLowerCase()) b.classList.add('wrong');
  });

  const fb = document.getElementById('q-feedback');

  if (isCorrect) {
    totalCorrect++;
    ingredientsFilled++;
    score += 10;
    fb.textContent = '🧪 Nguyên liệu thêm thành công!';
    fb.className = 'q-feedback correct';
    fillSlot(ingredientsFilled, true);
    updateTube();
  } else {
    fb.textContent = '💨 Nguyên liệu bốc hơi!';
    fb.className = 'q-feedback wrong';
    fizzleSlot();
  }

  // Log answer
  logAnswer(q, selected, isCorrect);
  document.getElementById('game-score').textContent = `⭐ ${score}`;
  document.getElementById('ingredient-count').textContent = `🧫 ${ingredientsFilled}/${INGREDIENTS_PER_EXPERIMENT}`;

  setTimeout(() => {
    currentQuestion++;
    if (ingredientsFilled >= INGREDIENTS_PER_EXPERIMENT) {
      // Experiment complete!
      triggerReaction();
    } else {
      showNextQuestion();
    }
  }, 1200);
}

function handleTimeout() {
  totalQuestions++;
  const btns = document.querySelectorAll('.option-btn');
  btns.forEach(b => b.classList.add('disabled'));

  const q = questions[currentQuestion];
  btns.forEach(b => {
    if (b.textContent.charAt(0).toLowerCase() === q.correct_answer.toLowerCase()) b.classList.add('correct');
  });

  const fb = document.getElementById('q-feedback');
  fb.textContent = '⏰ Hết giờ! Nguyên liệu bốc hơi!';
  fb.className = 'q-feedback wrong';
  fizzleSlot();

  logAnswer(q, null, false);

  setTimeout(() => {
    currentQuestion++;
    if (currentQuestion >= questions.length) {
      endGame();
    } else {
      showNextQuestion();
    }
  }, 1200);
}

// ========== LAB VISUALS ==========
function fillSlot(level, animate) {
  const slot = document.querySelector(`.slot[data-slot="${level}"]`);
  if (slot) {
    slot.classList.add('filled');
    slot.textContent = '✅';
  }
}

function fizzleSlot() {
  // Briefly show a fizzle on a random empty slot
  const emptySlots = document.querySelectorAll('.slot:not(.filled)');
  if (emptySlots.length > 0) {
    const slot = emptySlots[0];
    slot.classList.add('fizzle');
    slot.textContent = '💨';
    setTimeout(() => {
      slot.classList.remove('fizzle');
      slot.textContent = '';
    }, 800);
  }
}

function updateTube() {
  const liquid = document.getElementById('tube-liquid');
  liquid.className = `tube-liquid level-${ingredientsFilled}`;

  if (ingredientsFilled >= INGREDIENTS_PER_EXPERIMENT) {
    liquid.classList.add('full');
    document.getElementById('tube-label').textContent = '🎉 Đầy rồi!';
  } else {
    document.getElementById('tube-label').textContent = `${ingredientsFilled}/${INGREDIENTS_PER_EXPERIMENT} nguyên liệu`;
  }
}

// ========== REACTION ==========
function triggerReaction() {
  // Pick random result
  const result = RESULTS_POOL[Math.floor(Math.random() * RESULTS_POOL.length)];
  sessionResults.push(result);

  // Add to collection if not already there
  if (!collection.results.find(r => r.name === result.name)) {
    collection.results.push(result);
  }
  collection.totalExperiments++;
  saveCollection();

  // Bonus score for completing experiment
  score += 20;

  // Show reaction screen
  showScreen('reaction-screen');
  document.getElementById('reaction-result').textContent = result.emoji;
  document.getElementById('reaction-name').textContent = result.name;
}

function nextExperiment() {
  currentExperiment++;
  if (currentExperiment >= MAX_EXPERIMENTS || currentQuestion >= questions.length) {
    endGame();
  } else {
    ingredientsFilled = 0;
    showScreen('game-screen');
    resetLabUI();
    showNextQuestion();
  }
}

// ========== END GAME ==========
function endGame() {
  clearInterval(questionTimer);
  showScreen('result-screen');

  document.getElementById('result-score').textContent = score;

  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  let detailHTML = `✅ Đúng: ${totalCorrect}/${totalQuestions} (${accuracy}%)<br>`;
  detailHTML += `🧪 Thí nghiệm hoàn thành: ${sessionResults.length}/${MAX_EXPERIMENTS}<br>`;
  detailHTML += `📦 Bộ sưu tập: ${collection.results.length}/${RESULTS_POOL.length} phát minh`;
  document.getElementById('result-detail').innerHTML = detailHTML;

  // Show session results
  if (sessionResults.length > 0) {
    const resultsHTML = sessionResults.map(r => `${r.emoji} ${r.name}`).join('<br>');
    document.getElementById('result-collection').innerHTML = `<strong>Phát minh hôm nay:</strong><br>${resultsHTML}`;
  } else {
    document.getElementById('result-collection').innerHTML = '<em>Chưa hoàn thành thí nghiệm nào</em>';
  }

  if (sessionResults.length === MAX_EXPERIMENTS) {
    document.getElementById('result-title').textContent = '🏆 Nhà Khoa Học Xuất Sắc!';
  } else {
    document.getElementById('result-title').textContent = '🔬 Kết Quả Phòng Thí Nghiệm!';
  }

  spawnConfetti();
  saveSession();

  if (typeof checkAndShowPrompt === 'function') {
    checkAndShowPrompt();
  }
}

// ========== UTILS ==========
function spawnConfetti() {
  const container = document.getElementById('confetti');
  container.innerHTML = '';
  const colors = ['#7c3aed', '#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

  for (let i = 0; i < 25; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = (Math.random() * 2) + 's';
    piece.style.animationDuration = (2 + Math.random() * 2) + 's';
    container.appendChild(piece);
  }
}

async function logAnswer(q, selected, isCorrect) {
  try {
    const profile = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
    if (!profile.id) return;
    await fetch('/api/answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: null,
        player_id: profile.id,
        question_id: q.id,
        selected_answer: selected || '',
        correct_answer: q.correct_answer,
        is_correct: isCorrect
      })
    });
  } catch(e) {}
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
        subject: selectedSubject,
        difficulty: 'easy',
        score: score,
        total_questions: totalQuestions,
        correct_answers: totalCorrect,
        stars_earned: Math.floor(totalCorrect / 3),
        combo_max: 0,
        mode: 'v32'
      })
    });
  } catch(e) {}
}

// ========== START ==========
init();

})();

// ===== CHARACTER SYSTEM INTEGRATION (presentation only, additive) =====
// V32's game logic lives in the IIFE above with private functions, so this
// layer hooks in non-invasively via DOM observation + event listeners. It
// never touches game state or rewrites logic.
(function () {
  'use strict';

  let sciChar = null;   // kid-scientist avatar
  let botChar = null;   // robot helper mascot
  let flaskChar = null; // beaker mascot on the reaction screen
  let happyTimer = null;

  const C = () => window.HocVuiCharacters;

  function mountLab() {
    const sciHost = document.getElementById('scientist-host');
    const botHost = document.getElementById('robot-host');
    if (sciHost && !sciChar) {
      if (C() && C().hasSpecies('scientist')) {
        sciChar = C().createCharacter('scientist', sciHost, { state: 'idle' });
      } else {
        sciHost.textContent = '🔬';
      }
    }
    if (botHost && !botChar) {
      if (C() && C().hasSpecies('robot')) {
        botChar = C().createCharacter('robot', botHost, { state: 'idle' });
      } else {
        botHost.textContent = '🤖';
      }
    }
  }

  function mountReaction() {
    const host = document.getElementById('reaction-stage');
    if (!host) return;
    if (flaskChar) { flaskChar.destroy(); flaskChar = null; }
    if (C() && C().hasSpecies('beaker')) {
      flaskChar = C().createCharacter('beaker', host, { state: 'happy' });
      setTimeout(() => { if (flaskChar) flaskChar.setState('idle'); }, 900);
    } else {
      host.textContent = '🧪';
    }
  }

  function celebrate() {
    [sciChar, botChar].forEach(ch => {
      if (!ch) return;
      ch.setState('happy');
    });
    if (happyTimer) clearTimeout(happyTimer);
    happyTimer = setTimeout(() => {
      if (sciChar) sciChar.setState('idle');
      if (botChar) botChar.setState('idle');
    }, 900);
    const stage = document.querySelector('.scientist-stage');
    if (stage) spawnParticles(stage, 'sparkle', 8);
  }

  // Particle helper — sparkles around the scientist on a correct answer.
  function spawnParticles(parent, kind, count) {
    if (!parent) return;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'pfx pfx-' + kind;
      p.style.setProperty('--tx', (Math.random() * 70 - 35) + 'px');
      p.style.setProperty('--ty', -(Math.random() * 40 + 20) + 'px');
      p.style.setProperty('--delay', (Math.random() * 0.15) + 's');
      parent.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
  }

  // Confetti burst for the reaction screen (separate from the result-screen one).
  function spawnReactionConfetti() {
    const host = document.getElementById('reaction-stage');
    if (!host) return;
    const colors = ['#7c3aed', '#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];
    for (let i = 0; i < 14; i++) {
      const p = document.createElement('span');
      p.className = 'pfx pfx-confetti';
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.setProperty('--tx', (Math.random() * 120 - 60) + 'px');
      p.style.setProperty('--ty', -(Math.random() * 50 + 30) + 'px');
      p.style.setProperty('--delay', (Math.random() * 0.2) + 's');
      host.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
  }

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    const $ = id => document.getElementById(id);

    // Mount the lab characters once the game screen is shown, and react to
    // screen transitions (game-screen / reaction-screen become .active).
    const gameScreen = $('game-screen');
    const reactionScreen = $('reaction-screen');
    if (gameScreen) {
      const obs = new MutationObserver(() => {
        if (gameScreen.classList.contains('active')) mountLab();
      });
      obs.observe(gameScreen, { attributes: true, attributeFilter: ['class'] });
      if (gameScreen.classList.contains('active')) mountLab();
    }
    if (reactionScreen) {
      const obs = new MutationObserver(() => {
        if (reactionScreen.classList.contains('active')) {
          mountReaction();
          spawnReactionConfetti();
        }
      });
      obs.observe(reactionScreen, { attributes: true, attributeFilter: ['class'] });
    }

    // Celebrate when feedback flips to "correct" (an ingredient was added).
    const feedback = $('q-feedback');
    if (feedback) {
      const obs = new MutationObserver(() => {
        if (feedback.classList.contains('correct')) celebrate();
      });
      obs.observe(feedback, { attributes: true, attributeFilter: ['class'] });
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

    // Styled exit modal
    const exit = $('exit-modal');
    const exitBtn = $('btn-exit');
    if (exit && exitBtn) {
      exitBtn.addEventListener('click', () => { exit.style.display = 'flex'; });
      const cancel = $('btn-exit-cancel');
      if (cancel) cancel.addEventListener('click', () => { exit.style.display = 'none'; });
      const confirm = $('btn-exit-confirm');
      if (confirm) confirm.addEventListener('click', () => {
        exit.style.display = 'none';
        // Best-effort: stop any running interval timers before leaving.
        try {
          const hi = setInterval(() => {}, 999999);
          for (let i = 0; i <= hi; i++) clearInterval(i);
        } catch (e) {}
        window.location.reload();
      });
      exit.addEventListener('click', e => { if (e.target === exit) exit.style.display = 'none'; });
    }
  });
})();
