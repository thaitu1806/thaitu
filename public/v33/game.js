// V33 - Đội Cứu Hộ (Rescue Team)
(function() {
'use strict';

const STORAGE_KEY = 'v33_rescue';
const TOTAL_MISSIONS = 10;
const STEPS_PER_MISSION = 3;
const MAX_FAILS_PER_MISSION = 2;
const TIMER_SECONDS = 10;

const ANIMALS = ['🐱', '🐶', '🐰', '🐦', '🐸', '🐢', '🐿️', '🦊', '🐧', '🐼'];
const LOCATIONS = [
  { name: 'trên cây', emoji: '🌲' },
  { name: 'dưới ao', emoji: '💧' },
  { name: 'trong hang', emoji: '🕳️' },
  { name: 'trên núi', emoji: '⛰️' },
  { name: 'giữa sông', emoji: '🏞️' },
  { name: 'trên mái nhà', emoji: '🏠' },
  { name: 'trong bụi rậm', emoji: '🌿' },
  { name: 'dưới cầu', emoji: '🌉' },
  { name: 'trên đảo', emoji: '🏝️' },
  { name: 'trong rừng', emoji: '🌳' }
];

// State
let state = {
  currentMission: 0,
  currentStep: 0,
  fails: 0,
  rescuedAnimals: [],
  missions: [],
  questions: [],
  questionIndex: 0,
  timer: null,
  timeLeft: TIMER_SECONDS
};

function getPlayerId() {
  try {
    const p = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
    return p.id || null;
  } catch { return null; }
}

function getGrade() {
  try {
    const p = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
    return p.grade || 2;
  } catch { return 2; }
}

function loadSaved() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch(e) {}
  return { totalRescued: 0, bestRun: 0, collection: [] };
}

function savePersist(rescuedCount, animals) {
  const saved = loadSaved();
  saved.totalRescued = (saved.totalRescued || 0) + rescuedCount;
  saved.bestRun = Math.max(saved.bestRun || 0, rescuedCount);
  // Add unique animals to collection
  animals.forEach(a => {
    if (!saved.collection.includes(a)) saved.collection.push(a);
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
}

// Screen management
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// Generate missions (shuffle animals + locations)
function generateMissions() {
  const shuffledAnimals = [...ANIMALS].sort(() => Math.random() - 0.5);
  const shuffledLocations = [...LOCATIONS].sort(() => Math.random() - 0.5);
  return shuffledAnimals.map((animal, i) => ({
    animal,
    location: shuffledLocations[i]
  }));
}

// Init
function init() {
  const saved = loadSaved();
  document.getElementById('rescued-count').textContent = saved.collection.length;
  renderRescuedGrid(saved.collection);
  document.getElementById('btn-start').onclick = startGame;
  document.getElementById('btn-replay').onclick = startGame;
  document.getElementById('btn-next-mission').onclick = nextMission;
}

function renderRescuedGrid(collection) {
  const grid = document.getElementById('rescued-grid');
  grid.innerHTML = ANIMALS.map(a => {
    const rescued = collection.includes(a);
    return `<div class="animal-badge ${rescued ? 'rescued' : 'empty'}">${rescued ? a : '❓'}</div>`;
  }).join('');
}

async function startGame() {
  // Fetch questions
  try {
    const grade = getGrade();
    const subjects = ['math', 'vietnamese', 'english'];
    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    const res = await fetch(`/api/questions?subject=${subject}&difficulty=easy&limit=30&grade=${grade}`);
    const data = await res.json();
    if (!data || data.length === 0) {
      alert('Không tải được câu hỏi!');
      return;
    }
    state.questions = data;
  } catch(e) {
    alert('Lỗi kết nối!');
    return;
  }

  state.currentMission = 0;
  state.currentStep = 0;
  state.fails = 0;
  state.rescuedAnimals = [];
  state.missions = generateMissions();
  state.questionIndex = 0;

  showScreen('mission-screen');
  startMission();
}

function startMission() {
  const mission = state.missions[state.currentMission];
  state.currentStep = 0;
  state.fails = 0;

  document.getElementById('mission-num').textContent = `Nhiệm vụ ${state.currentMission + 1}/${TOTAL_MISSIONS}`;
  document.getElementById('mission-fails').textContent = `❌ 0/${MAX_FAILS_PER_MISSION}`;
  document.getElementById('location-emoji').textContent = mission.location.emoji;
  document.getElementById('animal-emoji').textContent = mission.animal;
  document.getElementById('mission-text').textContent = `${mission.animal} mắc kẹt ${mission.location.name} ${mission.location.emoji}`;

  updateSteps();
  showQuestion();
}

function updateSteps() {
  for (let i = 1; i <= STEPS_PER_MISSION; i++) {
    const el = document.getElementById(`step-${i}`);
    el.className = 'step';
    if (i <= state.currentStep) {
      el.classList.add('completed');
    } else if (i === state.currentStep + 1) {
      el.classList.add('active');
    }
  }
}

function showQuestion() {
  // Get next question
  if (state.questionIndex >= state.questions.length) {
    state.questionIndex = 0; // Loop if needed
  }
  const q = state.questions[state.questionIndex];
  state.questionIndex++;

  document.getElementById('q-text').textContent = q.question_text;
  document.getElementById('q-feedback').textContent = '';

  const optionsEl = document.getElementById('q-options');
  const options = [
    { label: 'A', text: q.option_a },
    { label: 'B', text: q.option_b },
    { label: 'C', text: q.option_c },
    { label: 'D', text: q.option_d }
  ];

  optionsEl.innerHTML = options.map(opt => `
    <div class="q-option" data-answer="${opt.label}">${opt.text}</div>
  `).join('');

  optionsEl.querySelectorAll('.q-option').forEach(btn => {
    btn.addEventListener('click', () => handleAnswer(btn, q));
  });

  startTimer();
}

function startTimer() {
  state.timeLeft = TIMER_SECONDS;
  const fill = document.getElementById('timer-fill');
  fill.style.width = '100%';
  fill.classList.remove('warning');

  clearInterval(state.timer);
  state.timer = setInterval(() => {
    state.timeLeft -= 0.1;
    const pct = (state.timeLeft / TIMER_SECONDS) * 100;
    fill.style.width = pct + '%';

    if (state.timeLeft <= 3) fill.classList.add('warning');

    if (state.timeLeft <= 0) {
      clearInterval(state.timer);
      handleTimeout();
    }
  }, 100);
}

function handleTimeout() {
  document.getElementById('q-feedback').textContent = '⏰ Hết giờ!';
  document.querySelectorAll('.q-option').forEach(b => b.classList.add('disabled'));
  handleWrongAnswer();
}

function handleAnswer(btn, question) {
  clearInterval(state.timer);
  const selected = btn.dataset.answer.toLowerCase();
  const correct = question.correct_answer.toLowerCase();

  document.querySelectorAll('.q-option').forEach(b => b.classList.add('disabled'));

  if (selected === correct) {
    btn.classList.add('correct');
    document.getElementById('q-feedback').textContent = '✅ Đúng rồi!';
    handleCorrectAnswer();
  } else {
    btn.classList.add('wrong');
    // Highlight correct
    document.querySelectorAll('.q-option').forEach(b => {
      if (b.dataset.answer.toLowerCase() === correct) b.classList.add('correct');
    });
    document.getElementById('q-feedback').textContent = '❌ Sai rồi!';
    handleWrongAnswer();
  }
}

function handleCorrectAnswer() {
  state.currentStep++;
  updateSteps();

  setTimeout(() => {
    if (state.currentStep >= STEPS_PER_MISSION) {
      // Rescue success!
      rescueSuccess();
    } else {
      showQuestion();
    }
  }, 1000);
}

function handleWrongAnswer() {
  state.fails++;
  document.getElementById('mission-fails').textContent = `❌ ${state.fails}/${MAX_FAILS_PER_MISSION}`;

  setTimeout(() => {
    if (state.fails >= MAX_FAILS_PER_MISSION) {
      // Mission failed - skip
      missionFailed();
    } else {
      showQuestion();
    }
  }, 1200);
}

function rescueSuccess() {
  const mission = state.missions[state.currentMission];
  state.rescuedAnimals.push(mission.animal);

  document.getElementById('rescue-anim').textContent = mission.animal;
  document.getElementById('rescue-msg').textContent = `🎉 Đã cứu ${mission.animal} thành công!`;

  showScreen('rescue-screen');
}

function missionFailed() {
  const mission = state.missions[state.currentMission];
  document.getElementById('rescue-anim').textContent = '😢';
  document.getElementById('rescue-msg').textContent = `Không cứu được ${mission.animal}... Tiếp tục nào!`;

  showScreen('rescue-screen');
}

function nextMission() {
  state.currentMission++;

  if (state.currentMission >= TOTAL_MISSIONS) {
    endGame();
    return;
  }

  showScreen('mission-screen');
  startMission();
}

function endGame() {
  clearInterval(state.timer);

  const rescued = state.rescuedAnimals.length;
  document.getElementById('result-score').textContent = rescued;

  // Show collection
  const collEl = document.getElementById('result-collection');
  collEl.innerHTML = state.missions.map(m => {
    const wasRescued = state.rescuedAnimals.includes(m.animal);
    return `<div class="animal-result ${wasRescued ? '' : 'missed'}">${m.animal}</div>`;
  }).join('');

  if (rescued >= 8) {
    document.getElementById('result-title').textContent = '🏆 Tuyệt vời! Đội trưởng cứu hộ!';
  } else if (rescued >= 5) {
    document.getElementById('result-title').textContent = '⭐ Giỏi lắm! Thành viên cứu hộ!';
  } else {
    document.getElementById('result-title').textContent = '💪 Cố gắng thêm nhé!';
  }

  savePersist(rescued, state.rescuedAnimals);
  saveSession(rescued);

  showScreen('result-screen');

  // checkAndShowPrompt
  if (window.checkAndShowPrompt && getPlayerId()) {
    window.checkAndShowPrompt(getPlayerId());
  }
}

async function saveSession(rescued) {
  const playerId = getPlayerId();
  if (!playerId) return;
  try {
    await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: playerId,
        subject: 'mixed',
        difficulty: 'easy',
        score: rescued * 10,
        total_questions: TOTAL_MISSIONS * STEPS_PER_MISSION,
        correct_answers: rescued * STEPS_PER_MISSION,
        stars_earned: rescued >= 8 ? 3 : rescued >= 5 ? 2 : rescued >= 3 ? 1 : 0,
        combo_max: rescued,
        mode: 'v33'
      })
    });
  } catch(e) { /* non-critical */ }
}

// Start
init();

})();
