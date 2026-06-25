// V38 - Bác Sĩ Răng (Dentist)
(function() {
'use strict';

const STORAGE_KEY = 'v38_dentist';
const TIMER_SECONDS = 10;
const TOTAL_PATIENTS = 6;
const STEPS_PER_PATIENT = 4;
const MAX_RETRIES = 2;

const STEPS = [
  { emoji: '🔍', name: 'Khám', desc: 'Kiểm tra răng...' },
  { emoji: '🧹', name: 'Cạo vôi', desc: 'Cạo sạch vôi răng...' },
  { emoji: '🔧', name: 'Trám răng', desc: 'Trám chỗ sâu...' },
  { emoji: '✨', name: 'Đánh bóng', desc: 'Đánh bóng sáng loáng!' }
];

const MOUTH_STAGES = ['😬', '😐', '🙂', '😊', '😁'];
const PATIENT_EMOJIS = ['👦', '👧', '👴', '👵', '🧒', '👩'];

let highSmiles = 0;
let questions = [];
let questionIndex = 0;
let currentPatient = 0;
let currentStep = 0;
let retriesLeft = MAX_RETRIES;
let smiles = 0;
let totalCorrect = 0;
let totalAnswered = 0;
let patientResults = []; // track each patient outcome
let timer = null;
let timeLeft = 0;

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      highSmiles = data.highSmiles || 0;
    }
  } catch(e) {}
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ highSmiles }));
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function init() {
  loadData();
  document.getElementById('high-smiles').textContent = highSmiles;
  document.getElementById('btn-start').onclick = startGame;
  document.getElementById('btn-replay').onclick = startGame;
  createFloatingTeeth();
}

function createFloatingTeeth() {
  for (let i = 0; i < 6; i++) {
    const tooth = document.createElement('div');
    tooth.className = 'float-tooth';
    tooth.textContent = '🦷';
    tooth.style.left = Math.random() * 100 + '%';
    tooth.style.animationDuration = (8 + Math.random() * 10) + 's';
    tooth.style.animationDelay = (Math.random() * 6) + 's';
    document.body.appendChild(tooth);
  }
}

async function startGame() {
  try {
    const profile = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
    const grade = profile.grade || 2;
    const subjects = ['math', 'vietnamese', 'english'];
    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    const res = await fetch(`/api/questions?subject=${subject}&difficulty=easy&limit=30&grade=${grade}`);
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
  currentPatient = 0;
  currentStep = 0;
  retriesLeft = MAX_RETRIES;
  smiles = 0;
  totalCorrect = 0;
  totalAnswered = 0;
  questionIndex = 0;
  patientResults = [];

  showScreen('game-screen');
  startPatient();
}

function startPatient() {
  currentStep = 0;
  retriesLeft = MAX_RETRIES;
  updateUI();
  showQuestion();
}

function updateUI() {
  document.getElementById('patient-num').textContent = currentPatient + 1;
  document.getElementById('smiles').textContent = smiles;
  document.getElementById('retries').textContent = retriesLeft;

  // Update mouth visual based on step progress
  const mouthEmoji = document.getElementById('mouth-emoji');
  mouthEmoji.textContent = MOUTH_STAGES[currentStep];

  // Update teeth visual
  const teethRow = document.getElementById('teeth-row');
  const teeth = teethRow.querySelectorAll('.tooth');
  teeth.forEach((tooth, i) => {
    if (i < currentStep) {
      tooth.classList.remove('dirty');
      tooth.classList.add('clean');
    } else {
      tooth.classList.add('dirty');
      tooth.classList.remove('clean');
    }
  });

  // Update step dots
  const stepDots = document.querySelectorAll('.step-dot');
  stepDots.forEach((dot, i) => {
    dot.classList.remove('active', 'done');
    if (i < currentStep) dot.classList.add('done');
    else if (i === currentStep) dot.classList.add('active');
  });

  // Patient status
  document.getElementById('patient-status').textContent = STEPS[currentStep].desc;
}

function showQuestion() {
  if (questionIndex >= questions.length) {
    endGame();
    return;
  }

  const q = questions[questionIndex];
  document.getElementById('q-text').textContent = q.question_text;
  const optionsDiv = document.getElementById('q-options');
  optionsDiv.innerHTML = '';

  const options = [
    { key: 'a', text: q.option_a },
    { key: 'b', text: q.option_b },
    { key: 'c', text: q.option_c },
    { key: 'd', text: q.option_d }
  ];

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = opt.text;
    btn.onclick = () => handleAnswer(opt.key, q.correct_answer);
    optionsDiv.appendChild(btn);
  });

  startTimer();
}

function handleAnswer(selected, correct) {
  clearInterval(timer);
  const btns = document.querySelectorAll('.option-btn');
  btns.forEach(b => b.classList.add('disabled'));

  const isCorrect = selected.toLowerCase() === correct.toLowerCase();
  totalAnswered++;

  const q = questions[questionIndex];
  btns.forEach(b => {
    const correctText = q[`option_${correct.toLowerCase()}`];
    if (b.textContent === correctText) b.classList.add('correct');
    if (!isCorrect && b.textContent === q[`option_${selected.toLowerCase()}`]) b.classList.add('wrong');
  });

  questionIndex++;

  if (isCorrect) {
    totalCorrect++;
    currentStep++;

    setTimeout(() => {
      if (currentStep >= STEPS_PER_PATIENT) {
        // Patient fully treated!
        completePatient(true);
      } else {
        updateUI();
        showQuestion();
      }
    }, 800);
  } else {
    // Wrong answer - retry or fail patient
    retriesLeft--;

    setTimeout(() => {
      if (retriesLeft < 0) {
        // Patient failed
        completePatient(false);
      } else {
        updateUI();
        showQuestion();
      }
    }, 800);
  }
}

function handleTimeout() {
  const btns = document.querySelectorAll('.option-btn');
  btns.forEach(b => b.classList.add('disabled'));
  totalAnswered++;

  const q = questions[questionIndex];
  btns.forEach(b => {
    const correctText = q[`option_${q.correct_answer.toLowerCase()}`];
    if (b.textContent === correctText) b.classList.add('correct');
  });

  questionIndex++;
  retriesLeft--;

  setTimeout(() => {
    if (retriesLeft < 0) {
      completePatient(false);
    } else {
      updateUI();
      showQuestion();
    }
  }, 800);
}

function startTimer() {
  clearInterval(timer);
  timeLeft = TIMER_SECONDS;
  const fill = document.getElementById('timer-fill');
  fill.style.width = '100%';
  fill.classList.remove('warning');

  timer = setInterval(() => {
    timeLeft -= 0.1;
    const pct = (timeLeft / TIMER_SECONDS) * 100;
    fill.style.width = pct + '%';
    if (timeLeft <= 3) fill.classList.add('warning');
    if (timeLeft <= 0) {
      clearInterval(timer);
      handleTimeout();
    }
  }, 100);
}

function completePatient(success) {
  if (success) {
    smiles++;
    patientResults.push('😁');
    // Show happy mouth
    document.getElementById('mouth-emoji').textContent = '😁';
    document.getElementById('patient-status').textContent = '🎉 Bệnh nhân vui vẻ!';
    // All teeth clean
    document.querySelectorAll('.tooth').forEach(t => {
      t.classList.remove('dirty');
      t.classList.add('clean');
    });
    // All steps done
    document.querySelectorAll('.step-dot').forEach(d => d.classList.add('done'));
  } else {
    patientResults.push('😢');
    document.getElementById('mouth-emoji').textContent = '😢';
    document.getElementById('patient-status').textContent = '😢 Bệnh nhân chuyển viện...';
  }

  document.getElementById('smiles').textContent = smiles;

  setTimeout(() => {
    currentPatient++;
    if (currentPatient >= TOTAL_PATIENTS) {
      endGame();
    } else {
      startPatient();
    }
  }, 1200);
}

function endGame() {
  clearInterval(timer);
  showScreen('result-screen');

  document.getElementById('result-score').textContent = smiles;

  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  if (smiles > highSmiles) {
    highSmiles = smiles;
    saveData();
    document.getElementById('result-title').textContent = '🎉 Kỷ Lục Mới!';
  } else if (smiles >= 5) {
    document.getElementById('result-title').textContent = '🌟 Bác Sĩ Xuất Sắc!';
  } else {
    document.getElementById('result-title').textContent = '🦷 Ca Trực Kết Thúc!';
  }

  // Render smile collection
  const collDiv = document.getElementById('smile-collection');
  collDiv.innerHTML = '';
  patientResults.forEach((emoji, i) => {
    const item = document.createElement('span');
    item.className = 'smile-item';
    item.textContent = emoji;
    item.style.animationDelay = (i * 0.15) + 's';
    collDiv.appendChild(item);
  });

  document.getElementById('result-detail').innerHTML = `
    ✅ Đúng: ${totalCorrect}/${totalAnswered} (${accuracy}%)<br>
    😁 Chữa thành công: ${smiles}/${TOTAL_PATIENTS}<br>
    😢 Chuyển viện: ${TOTAL_PATIENTS - smiles}<br>
    🏆 Kỷ lục: ${highSmiles} nụ cười
  `;

  spawnConfetti();
  saveSession();

  if (typeof checkAndShowPrompt === 'function') {
    checkAndShowPrompt();
  }
}

function spawnConfetti() {
  const container = document.getElementById('confetti');
  container.innerHTML = '';
  const colors = ['#06b6d4', '#67e8f9', '#a5f3fc', '#fbbf24', '#a855f7', '#22c55e'];
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
        score: smiles * 10,
        total_questions: totalAnswered,
        correct_answers: totalCorrect,
        stars_earned: smiles,
        combo_max: smiles,
        mode: 'v38'
      })
    });
  } catch(e) {}
}

init();

})();
