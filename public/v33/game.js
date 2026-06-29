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
    return p.grade ?? 2;
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

// ===== CHARACTER SYSTEM INTEGRATION (presentation only, additive) =====
// V33's game logic lives in a self-contained IIFE above (private `state` and
// functions). This block never touches that logic — it observes the DOM to
// mount animated sprites, sync states, throw particles, and wire the modals.
(function () {
  'use strict';

  // --- Track game intervals so the exit button can stop loops cleanly. ---
  // The question timer is created via setInterval during play. We record any
  // interval ids spawned after this block loads so exit can clear them.
  const tracked = new Set();
  const origSetInterval = window.setInterval.bind(window);
  const origClearInterval = window.clearInterval.bind(window);
  window.setInterval = function () {
    const id = origSetInterval.apply(null, arguments);
    tracked.add(id);
    return id;
  };
  window.clearInterval = function (id) {
    tracked.delete(id);
    return origClearInterval(id);
  };
  function stopAllLoops() {
    tracked.forEach(id => origClearInterval(id));
    tracked.clear();
  }

  function getC() { return window.HocVuiCharacters; }

  // Mount a species into a host element, with emoji fallback.
  function mount(hostId, species, fallback, size) {
    const host = document.getElementById(hostId);
    if (!host) return null;
    host.innerHTML = '';
    const C = getC();
    if (C && C.hasSpecies(species)) {
      return C.createCharacter(species, host, { state: 'idle', size: size });
    }
    host.textContent = fallback;
    return null;
  }

  let heroChar = null;     // start screen mascot
  let rescuerChar = null;  // mission scene rescuer
  let chopperChar = null;  // rescue-success helicopter

  // Particle helper — sparkle/confetti burst around an element.
  function spawnParticles(parent, kind, count) {
    if (!parent) return;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'pfx pfx-' + kind;
      p.style.setProperty('--tx', (Math.random() * 80 - 40) + 'px');
      p.style.setProperty('--ty', -(Math.random() * 50 + 25) + 'px');
      p.style.setProperty('--delay', (Math.random() * 0.2) + 's');
      if (kind === 'confetti') {
        const colors = ['#ee5a24', '#ffd93d', '#4caf50', '#00b4d8', '#f472b6'];
        p.style.background = colors[Math.floor(Math.random() * colors.length)];
      }
      parent.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
  }
  window.__v33_spawnParticles = spawnParticles;

  function celebrate(char, hostId, kind, count) {
    if (char) {
      char.setState('happy');
      setTimeout(() => { if (char) char.setState('idle'); }, 700);
    }
    const host = document.getElementById(hostId);
    if (host) spawnParticles(host, kind, count);
  }

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    const $ = id => document.getElementById(id);

    // Mount the start-screen mascot immediately.
    heroChar = mount('hero-mascot', 'rescue_worker', '🚁', 96);

    // Observe each screen's active state to (re)mount sprites at the right time.
    function onScreenActive(id, fn) {
      const el = $(id);
      if (!el) return;
      const obs = new MutationObserver(() => {
        if (el.classList.contains('active')) fn();
      });
      obs.observe(el, { attributes: true, attributeFilter: ['class'] });
      if (el.classList.contains('active')) fn();
    }

    onScreenActive('start-screen', () => {
      if (!heroChar) heroChar = mount('hero-mascot', 'rescue_worker', '🚁', 96);
    });
    onScreenActive('mission-screen', () => {
      rescuerChar = mount('rescuer-mascot', 'rescue_worker', '🚁', 80);
    });
    onScreenActive('rescue-screen', () => {
      const msg = $('rescue-msg');
      const success = !msg || msg.textContent.indexOf('Đã cứu') !== -1 || msg.textContent.indexOf('thành công') !== -1;
      if (success) {
        chopperChar = mount('rescue-chopper', 'rescue_chopper', '🚁', 110);
        celebrate(chopperChar, 'rescue-chopper', 'confetti', 18);
      } else {
        // Mission failed — show a gentle idle chopper, no confetti.
        chopperChar = mount('rescue-chopper', 'rescue_chopper', '🚁', 110);
      }
    });

    // Celebrate on the rescuer when a question is answered correctly.
    const feedback = $('q-feedback');
    if (feedback) {
      const fbObs = new MutationObserver(() => {
        const t = feedback.textContent || '';
        if (t.indexOf('Đúng') !== -1) {
          celebrate(rescuerChar, 'rescuer-mascot', 'sparkle', 8);
        }
      });
      fbObs.observe(feedback, { childList: true, characterData: true, subtree: true });
    }

    // Guide modal -----------------------------------------------------------
    const guide = $('guide-modal');
    const guideBtn = $('btn-guide');
    if (guide && guideBtn) {
      guideBtn.addEventListener('click', () => { guide.style.display = 'flex'; });
      const close = $('btn-guide-close');
      if (close) close.addEventListener('click', () => { guide.style.display = 'none'; });
      guide.addEventListener('click', e => { if (e.target === guide) guide.style.display = 'none'; });
    }

    // Exit modal ------------------------------------------------------------
    const exit = $('exit-modal');
    const exitBtn = $('btn-exit');
    if (exit && exitBtn) {
      exitBtn.addEventListener('click', () => { exit.style.display = 'flex'; });
      const cancel = $('btn-exit-cancel');
      if (cancel) cancel.addEventListener('click', () => { exit.style.display = 'none'; });
      const confirm = $('btn-exit-confirm');
      if (confirm) confirm.addEventListener('click', () => {
        exit.style.display = 'none';
        stopAllLoops();           // clear question timer + any other loops
        window.location.reload();
      });
      exit.addEventListener('click', e => { if (e.target === exit) exit.style.display = 'none'; });
    }
  });
})();
