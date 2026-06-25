// V35 - Tiệm Kem (Ice Cream Shop)
(function() {
'use strict';

const STORAGE_KEY = 'v35_icecream';
const LAYERS_PER_ORDER = 5;
const TOTAL_CUSTOMERS = 6;
const TIMER_SECONDS = 10;

const FLAVORS = [
  { emoji: '🍫', name: 'Socola' },
  { emoji: '🍓', name: 'Dâu' },
  { emoji: '🍵', name: 'Matcha' },
  { emoji: '🍋', name: 'Chanh' },
  { emoji: '🍇', name: 'Nho' },
  { emoji: '🍌', name: 'Chuối' }
];

const TOPPINGS = [
  { emoji: '🍒', name: 'Cherry' },
  { emoji: '🌰', name: 'Hạt' },
  { emoji: '🍯', name: 'Mật ong' },
  { emoji: '⭐', name: 'Sprinkles' }
];

const CUSTOMER_EMOJIS = ['🧑', '👧', '👦', '👩', '🧒', '👨'];
const HAPPY_REACTIONS = ['😍', '🤩', '😋', '🥰', '😊'];
const SAD_REACTIONS = ['😐', '😕', '😟'];

let highScore = 0;
let questions = [];
let currentCustomer = 0;
let currentLayer = 0;
let correctLayers = 0;
let totalCorrect = 0;
let happyCustomers = 0;
let currentOrder = [];
let timer = null;
let timeLeft = 0;

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      highScore = data.highScore || 0;
    }
  } catch(e) {}
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ highScore }));
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function generateOrder() {
  const order = [];
  const allItems = [...FLAVORS, ...TOPPINGS];
  for (let i = 0; i < LAYERS_PER_ORDER; i++) {
    order.push(allItems[Math.floor(Math.random() * allItems.length)]);
  }
  return order;
}

// ========== INIT ==========
function init() {
  loadData();
  document.getElementById('high-score').textContent = highScore;
  document.getElementById('btn-start').onclick = startGame;
  document.getElementById('btn-replay').onclick = startGame;
}

async function startGame() {
  try {
    const profile = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
    const grade = profile.grade || 2;
    const subjects = ['math', 'vietnamese', 'english'];
    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    const needed = LAYERS_PER_ORDER * TOTAL_CUSTOMERS;
    const res = await fetch(`/api/questions?subject=${subject}&difficulty=easy&limit=${needed}&grade=${grade}`);
    questions = await res.json();
    if (!questions || questions.length === 0) {
      alert('Không tải được câu hỏi!');
      return;
    }
  } catch(e) {
    alert('Lỗi kết nối!');
    return;
  }

  currentCustomer = 0;
  totalCorrect = 0;
  happyCustomers = 0;
  showScreen('game-screen');
  startCustomer();
}

function startCustomer() {
  currentLayer = 0;
  correctLayers = 0;
  currentOrder = generateOrder();

  document.getElementById('customer-num').textContent = currentCustomer + 1;
  document.getElementById('happy-num').textContent = happyCustomers;
  document.getElementById('customer-emoji').textContent = CUSTOMER_EMOJIS[currentCustomer % CUSTOMER_EMOJIS.length];
  document.getElementById('cone-layers').innerHTML = '';

  // Show order in speech bubble
  const orderStr = currentOrder.map(item => item.emoji).join(' ');
  document.getElementById('speech-bubble').innerHTML = `<span id="order-text">Cho tôi: ${orderStr}</span>`;

  showLayer();
}

function showLayer() {
  document.getElementById('layer-num').textContent = currentLayer + 1;

  const qIndex = currentCustomer * LAYERS_PER_ORDER + currentLayer;
  if (qIndex >= questions.length) {
    // Not enough questions, end game
    endGame();
    return;
  }

  const q = questions[qIndex];
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

  // Highlight answers
  btns.forEach(b => {
    const btnText = b.textContent;
    const q = questions[currentCustomer * LAYERS_PER_ORDER + currentLayer];
    const correctText = q[`option_${correct.toLowerCase()}`];
    if (btnText === correctText) b.classList.add('correct');
    if (!isCorrect && btnText === q[`option_${selected.toLowerCase()}`]) b.classList.add('wrong');
  });

  if (isCorrect) {
    correctLayers++;
    totalCorrect++;
    addLayer(currentOrder[currentLayer], false);
  } else {
    // Add wrong topping
    const wrongTopping = TOPPINGS[Math.floor(Math.random() * TOPPINGS.length)];
    addLayer(wrongTopping, true);
  }

  setTimeout(() => {
    currentLayer++;
    if (currentLayer >= LAYERS_PER_ORDER) {
      finishCustomer();
    } else {
      showLayer();
    }
  }, 1000);
}

function handleTimeout() {
  const btns = document.querySelectorAll('.option-btn');
  btns.forEach(b => b.classList.add('disabled'));

  const q = questions[currentCustomer * LAYERS_PER_ORDER + currentLayer];
  btns.forEach(b => {
    const correctText = q[`option_${q.correct_answer.toLowerCase()}`];
    if (b.textContent === correctText) b.classList.add('correct');
  });

  // Add wrong topping for timeout
  const wrongTopping = TOPPINGS[Math.floor(Math.random() * TOPPINGS.length)];
  addLayer(wrongTopping, true);

  setTimeout(() => {
    currentLayer++;
    if (currentLayer >= LAYERS_PER_ORDER) {
      finishCustomer();
    } else {
      showLayer();
    }
  }, 1000);
}

function addLayer(item, isWrong) {
  const layersDiv = document.getElementById('cone-layers');
  const layer = document.createElement('div');
  layer.className = 'cone-layer' + (isWrong ? ' wrong' : '');
  layer.textContent = item.emoji;
  layersDiv.appendChild(layer);
}

function finishCustomer() {
  const isHappy = correctLayers >= 4; // 4 or 5 out of 5 = happy
  if (isHappy) {
    happyCustomers++;
    showReaction(HAPPY_REACTIONS[Math.floor(Math.random() * HAPPY_REACTIONS.length)]);
  } else {
    showReaction(SAD_REACTIONS[Math.floor(Math.random() * SAD_REACTIONS.length)]);
  }

  document.getElementById('happy-num').textContent = happyCustomers;

  setTimeout(() => {
    currentCustomer++;
    if (currentCustomer >= TOTAL_CUSTOMERS) {
      endGame();
    } else {
      startCustomer();
    }
  }, 1500);
}

function showReaction(emoji) {
  const popup = document.createElement('div');
  popup.className = 'reaction-popup';
  popup.textContent = emoji;
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 1200);
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

function endGame() {
  clearInterval(timer);
  showScreen('result-screen');

  const totalQuestions = LAYERS_PER_ORDER * TOTAL_CUSTOMERS;
  const accuracy = Math.round((totalCorrect / totalQuestions) * 100);

  document.getElementById('result-score').textContent = happyCustomers;

  if (happyCustomers > highScore) {
    highScore = happyCustomers;
    saveData();
    document.getElementById('result-title').textContent = '🎉 Kỷ Lục Mới!';
  } else {
    document.getElementById('result-title').textContent = '🍦 Ca Làm Xong!';
  }

  document.getElementById('result-detail').innerHTML = `
    ✅ Đúng: ${totalCorrect}/${totalQuestions} (${accuracy}%)<br>
    😊 Khách vui: ${happyCustomers}/${TOTAL_CUSTOMERS}<br>
    🏆 Kỷ lục: ${highScore}/${TOTAL_CUSTOMERS}
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
  const colors = ['#FF6B9D', '#FFB7D5', '#FF85A1', '#FFC3D7', '#4ECDC4', '#F7DC6F', '#BB8FCE'];
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
    const totalQuestions = LAYERS_PER_ORDER * TOTAL_CUSTOMERS;
    await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: profile.id,
        subject: 'mixed',
        difficulty: 'easy',
        score: happyCustomers * 10,
        total_questions: totalQuestions,
        correct_answers: totalCorrect,
        stars_earned: happyCustomers,
        combo_max: 0,
        mode: 'v35'
      })
    });
  } catch(e) {}
}

init();

})();
