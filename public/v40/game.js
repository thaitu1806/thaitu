// V40 - Siêu Thị Mini (Mini Supermarket)
(function() {
'use strict';

const STORAGE_KEY = 'v40_market';
const TIMER_SECONDS = 10;
const CUSTOMERS_PER_SHIFT = 8;

const SHOP_LEVELS = [
  { id: 0, name: 'Xe Đẩy', emoji: '🛒', cost: 0, items: 5 },
  { id: 1, name: 'Quán Nhỏ', emoji: '🏪', cost: 100, items: 8 },
  { id: 2, name: 'Siêu Thị', emoji: '🏬', cost: 300, items: 12 },
  { id: 3, name: 'Mega Market', emoji: '🏢', cost: 500, items: 16 }
];

const ALL_ITEMS = [
  { emoji: '🍎', name: 'Táo', price: 2000 },
  { emoji: '🥛', name: 'Sữa', price: 5000 },
  { emoji: '🍞', name: 'Bánh mì', price: 3000 },
  { emoji: '🥚', name: 'Trứng', price: 4000 },
  { emoji: '🍌', name: 'Chuối', price: 1000 },
  { emoji: '🧃', name: 'Nước ép', price: 6000 },
  { emoji: '🍪', name: 'Bánh quy', price: 3000 },
  { emoji: '🍜', name: 'Mì gói', price: 4000 },
  { emoji: '🧁', name: 'Bánh cupcake', price: 7000 },
  { emoji: '🍫', name: 'Sô-cô-la', price: 8000 },
  { emoji: '🥤', name: 'Nước ngọt', price: 5000 },
  { emoji: '🍭', name: 'Kẹo', price: 2000 },
  { emoji: '🧀', name: 'Phô mai', price: 9000 },
  { emoji: '🍿', name: 'Bắp rang', price: 6000 },
  { emoji: '🥐', name: 'Bánh sừng bò', price: 7000 },
  { emoji: '🍩', name: 'Donut', price: 5000 }
];

const CUSTOMER_EMOJIS = ['🧑', '👩', '👨', '👧', '👦', '🧓', '👴', '👵'];

// State
let gameData = {
  profit: 0,
  level: 0,
  totalShifts: 0
};

let shiftProfit = 0;
let customerIndex = 0;
let totalCorrect = 0;
let totalAnswered = 0;
let timer = null;
let timeLeft = 0;
let currentQuestion = null;
let questions = [];
let questionIndex = 0;
let useApiQuestion = false;

// ========== PERSISTENCE ==========
function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      gameData.profit = data.profit || 0;
      gameData.level = data.level || 0;
      gameData.totalShifts = data.totalShifts || 0;
    }
  } catch(e) {}
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(gameData));
}

// ========== HELPERS ==========
function getAvailableItems() {
  const itemCount = SHOP_LEVELS[gameData.level].items;
  return ALL_ITEMS.slice(0, itemCount);
}

function formatPrice(p) {
  return p.toLocaleString('vi-VN') + 'đ';
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ========== SCREENS ==========
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ========== START SCREEN ==========
function updateStartScreen() {
  const level = SHOP_LEVELS[gameData.level];
  document.getElementById('shop-emoji').textContent = level.emoji;
  document.getElementById('shop-level').textContent = level.name;
  document.getElementById('start-profit').textContent = gameData.profit;
  document.getElementById('start-shifts').textContent = gameData.totalShifts;
}

// ========== MATH QUESTION GENERATOR ==========
function generateMathQuestion() {
  const items = getAvailableItems();
  const type = Math.random() < 0.5 ? 'total' : 'change';

  if (type === 'total') {
    // Customer buys 1-3 items, calculate total
    const count = 1 + Math.floor(Math.random() * 3);
    const selected = [];
    for (let i = 0; i < count; i++) {
      selected.push(items[Math.floor(Math.random() * items.length)]);
    }
    const total = selected.reduce((sum, it) => sum + it.price, 0);
    const itemNames = selected.map(it => `${it.emoji} ${it.name} (${formatPrice(it.price)})`);
    const questionText = `Khách mua: ${itemNames.join(', ')}. Tổng bao nhiêu?`;

    // Generate options
    const correctAnswer = formatPrice(total);
    const options = generateOptions(total);

    return {
      question_text: questionText,
      options,
      correct: correctAnswer,
      cartItems: selected,
      profit: count * 1000
    };
  } else {
    // Customer pays X, calculate change
    const count = 1 + Math.floor(Math.random() * 2);
    const selected = [];
    for (let i = 0; i < count; i++) {
      selected.push(items[Math.floor(Math.random() * items.length)]);
    }
    const total = selected.reduce((sum, it) => sum + it.price, 0);

    // Round up to nearest 5000 or 10000 for payment
    const payments = [10000, 15000, 20000, 30000, 50000];
    const validPayments = payments.filter(p => p > total);
    const paid = validPayments.length > 0 ? validPayments[0] : total + 5000;
    const change = paid - total;

    const itemNames = selected.map(it => `${it.emoji} ${it.name}`);
    const questionText = `Khách mua ${itemNames.join(', ')} = ${formatPrice(total)}. Đưa ${formatPrice(paid)}. Trả lại?`;

    const correctAnswer = formatPrice(change);
    const options = generateOptions(change);

    return {
      question_text: questionText,
      options,
      correct: correctAnswer,
      cartItems: selected,
      profit: count * 1000
    };
  }
}

function generateOptions(correctValue) {
  const correct = formatPrice(correctValue);
  const optionsSet = new Set([correct]);

  // Generate plausible wrong answers
  const offsets = [1000, 2000, 3000, -1000, -2000, 5000, -3000];
  while (optionsSet.size < 4) {
    const offset = offsets[Math.floor(Math.random() * offsets.length)];
    const wrong = correctValue + offset;
    if (wrong > 0 && wrong !== correctValue) {
      optionsSet.add(formatPrice(wrong));
    }
  }

  return shuffleArray([...optionsSet]);
}

// ========== GAME ==========
async function startShift() {
  // Try to load some API questions too (mix)
  try {
    const profile = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
    const grade = profile.grade || 2;
    const res = await fetch(`/api/questions?subject=math&difficulty=easy&limit=4&grade=${grade}`);
    questions = await res.json();
    if (!questions || questions.length === 0) questions = [];
  } catch(e) {
    questions = [];
  }

  questionIndex = 0;
  customerIndex = 0;
  shiftProfit = 0;
  totalCorrect = 0;
  totalAnswered = 0;

  showScreen('game-screen');
  document.getElementById('profit').textContent = shiftProfit;
  nextCustomer();
}

function nextCustomer() {
  if (customerIndex >= CUSTOMERS_PER_SHIFT) {
    endShift();
    return;
  }

  customerIndex++;
  document.getElementById('cust-num').textContent = customerIndex;

  // Random customer avatar
  const avatar = CUSTOMER_EMOJIS[Math.floor(Math.random() * CUSTOMER_EMOJIS.length)];
  document.getElementById('customer-avatar').textContent = avatar;

  // Decide: math question from generated or API
  // Every 3rd customer uses API question if available
  useApiQuestion = (customerIndex % 3 === 0 && questionIndex < questions.length);

  if (useApiQuestion) {
    showApiQuestion();
  } else {
    showMathQuestion();
  }
}

function showMathQuestion() {
  currentQuestion = generateMathQuestion();

  // Show cart
  const cartDiv = document.getElementById('customer-cart');
  cartDiv.innerHTML = '';
  currentQuestion.cartItems.forEach(item => {
    const el = document.createElement('span');
    el.className = 'cart-item';
    el.textContent = `${item.emoji} ${formatPrice(item.price)}`;
    cartDiv.appendChild(el);
  });

  // Show question
  document.getElementById('q-text').textContent = currentQuestion.question_text;
  const optionsDiv = document.getElementById('q-options');
  optionsDiv.innerHTML = '';

  currentQuestion.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = opt;
    btn.onclick = () => handleMathAnswer(opt);
    optionsDiv.appendChild(btn);
  });

  document.getElementById('feedback').style.display = 'none';
  startTimer();
}

function showApiQuestion() {
  const q = questions[questionIndex];
  questionIndex++;

  currentQuestion = {
    question_text: q.question_text,
    correct: q[`option_${q.correct_answer.toLowerCase()}`],
    correct_key: q.correct_answer.toLowerCase(),
    options: [q.option_a, q.option_b, q.option_c, q.option_d],
    cartItems: [{ emoji: '📚', name: 'Câu hỏi', price: 0 }],
    profit: 2000,
    isApi: true,
    raw: q
  };

  // Show cart
  const cartDiv = document.getElementById('customer-cart');
  cartDiv.innerHTML = '<span class="cart-item">📚 Câu hỏi bonus!</span>';

  // Show question
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
    btn.onclick = () => handleApiAnswer(opt.key, q.correct_answer);
    optionsDiv.appendChild(btn);
  });

  document.getElementById('feedback').style.display = 'none';
  startTimer();
}

function handleMathAnswer(selected) {
  clearInterval(timer);
  const btns = document.querySelectorAll('.option-btn');
  btns.forEach(b => b.classList.add('disabled'));
  totalAnswered++;

  const isCorrect = selected === currentQuestion.correct;

  // Highlight
  btns.forEach(b => {
    if (b.textContent === currentQuestion.correct) b.classList.add('correct');
    if (!isCorrect && b.textContent === selected) b.classList.add('wrong');
  });

  showFeedback(isCorrect, currentQuestion.profit);
}

function handleApiAnswer(selected, correct) {
  clearInterval(timer);
  const btns = document.querySelectorAll('.option-btn');
  btns.forEach(b => b.classList.add('disabled'));
  totalAnswered++;

  const isCorrect = selected.toLowerCase() === correct.toLowerCase();
  const q = currentQuestion.raw;

  btns.forEach(b => {
    const correctText = q[`option_${correct.toLowerCase()}`];
    if (b.textContent === correctText) b.classList.add('correct');
    if (!isCorrect && b.textContent === q[`option_${selected.toLowerCase()}`]) b.classList.add('wrong');
  });

  showFeedback(isCorrect, currentQuestion.profit);
}

function showFeedback(isCorrect, profitAmount) {
  const fb = document.getElementById('feedback');
  fb.style.display = 'block';

  if (isCorrect) {
    totalCorrect++;
    shiftProfit += profitAmount;
    document.getElementById('profit').textContent = shiftProfit;
    fb.className = 'feedback good';
    fb.textContent = `✅ Đúng rồi! +${formatPrice(profitAmount)}`;
  } else {
    // Lose some money on wrong answer
    const loss = 1000;
    shiftProfit = Math.max(0, shiftProfit - loss);
    document.getElementById('profit').textContent = shiftProfit;
    fb.className = 'feedback bad';
    fb.textContent = `❌ Sai! -${formatPrice(loss)}`;
  }

  setTimeout(() => nextCustomer(), 1200);
}

function handleTimeout() {
  const btns = document.querySelectorAll('.option-btn');
  btns.forEach(b => b.classList.add('disabled'));
  totalAnswered++;

  // Show correct answer
  if (currentQuestion.isApi) {
    const q = currentQuestion.raw;
    btns.forEach(b => {
      const correctText = q[`option_${q.correct_answer.toLowerCase()}`];
      if (b.textContent === correctText) b.classList.add('correct');
    });
  } else {
    btns.forEach(b => {
      if (b.textContent === currentQuestion.correct) b.classList.add('correct');
    });
  }

  const fb = document.getElementById('feedback');
  fb.style.display = 'block';
  fb.className = 'feedback bad';
  fb.textContent = '⏰ Hết giờ! Khách bỏ đi...';

  setTimeout(() => nextCustomer(), 1200);
}

function startTimer() {
  clearInterval(timer);
  timeLeft = TIMER_SECONDS;
  const fill = document.getElementById('timer-fill');
  const text = document.getElementById('timer-text');
  fill.style.width = '100%';
  fill.classList.remove('warning');
  text.textContent = TIMER_SECONDS;

  timer = setInterval(() => {
    timeLeft -= 0.1;
    const pct = (timeLeft / TIMER_SECONDS) * 100;
    fill.style.width = pct + '%';
    text.textContent = Math.ceil(timeLeft);
    if (timeLeft <= 3) fill.classList.add('warning');
    if (timeLeft <= 0) {
      clearInterval(timer);
      handleTimeout();
    }
  }, 100);
}

function endShift() {
  clearInterval(timer);

  gameData.profit += shiftProfit;
  gameData.totalShifts++;
  saveData();

  showScreen('result-screen');
  document.getElementById('result-score').textContent = shiftProfit;

  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  if (shiftProfit >= 10000) {
    document.getElementById('result-title').textContent = '🌟 Ca Xuất Sắc!';
  } else if (shiftProfit >= 5000) {
    document.getElementById('result-title').textContent = '👍 Ca Tốt!';
  } else {
    document.getElementById('result-title').textContent = '🧾 Kết Ca!';
  }

  document.getElementById('result-detail').innerHTML = `
    ✅ Đúng: ${totalCorrect}/${totalAnswered} (${accuracy}%)<br>
    🧑 Khách phục vụ: ${CUSTOMERS_PER_SHIFT}<br>
    💰 Tổng lợi nhuận: ${gameData.profit}<br>
    ${SHOP_LEVELS[gameData.level].emoji} Shop: ${SHOP_LEVELS[gameData.level].name}
  `;

  saveSession();

  if (typeof checkAndShowPrompt === 'function') {
    checkAndShowPrompt();
  }
}

// ========== UPGRADE ==========
function showUpgradeScreen() {
  showScreen('upgrade-screen');

  const currentLevel = SHOP_LEVELS[gameData.level];
  document.getElementById('upgrade-shop-emoji').textContent = currentLevel.emoji;
  document.getElementById('upgrade-shop-name').textContent = currentLevel.name;
  document.getElementById('upgrade-items-count').textContent = currentLevel.items + ' mặt hàng';
  document.getElementById('upgrade-profit').textContent = gameData.profit;

  const listDiv = document.getElementById('upgrade-list');
  listDiv.innerHTML = '';

  SHOP_LEVELS.forEach((lvl, i) => {
    const card = document.createElement('div');
    const isCurrent = i === gameData.level;
    const isUnlocked = i <= gameData.level;
    const canAfford = gameData.profit >= lvl.cost;
    const isNext = i === gameData.level + 1;

    card.className = 'upgrade-card' + (isCurrent ? ' current' : '') + (!isUnlocked && !canAfford ? ' locked' : '') + (isNext && canAfford ? ' available' : '');

    card.innerHTML = `
      <span class="upgrade-emoji">${lvl.emoji}</span>
      <div class="upgrade-info">
        <span class="upgrade-name">${lvl.name} ${isCurrent ? '(Hiện tại)' : ''}</span>
        <span class="upgrade-desc">${lvl.items} mặt hàng</span>
      </div>
      <span class="upgrade-cost">${isUnlocked ? '✅' : formatPrice(lvl.cost * 1000)}</span>
    `;

    if (isNext && canAfford) {
      card.onclick = () => doUpgrade(i);
    }

    listDiv.appendChild(card);
  });
}

function doUpgrade(levelIndex) {
  const lvl = SHOP_LEVELS[levelIndex];
  if (gameData.profit < lvl.cost) return;

  gameData.profit -= lvl.cost;
  gameData.level = levelIndex;
  saveData();
  showUpgradeScreen();
}

// ========== SESSION ==========
async function saveSession() {
  try {
    const profile = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
    if (!profile.id) return;
    await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: profile.id,
        subject: 'math',
        difficulty: 'easy',
        score: shiftProfit,
        total_questions: totalAnswered,
        correct_answers: totalCorrect,
        stars_earned: Math.floor(totalCorrect / 3),
        combo_max: totalCorrect,
        mode: 'v40'
      })
    });
  } catch(e) {}
}

// ========== DECORATIVE ==========
function addFloatingItems() {
  const items = getAvailableItems();
  for (let i = 0; i < 6; i++) {
    const el = document.createElement('div');
    el.className = 'shelf-item';
    el.textContent = items[Math.floor(Math.random() * items.length)].emoji;
    el.style.left = Math.random() * 90 + 5 + '%';
    el.style.top = Math.random() * 90 + 5 + '%';
    el.style.animationDelay = (Math.random() * 5) + 's';
    el.style.animationDuration = (8 + Math.random() * 6) + 's';
    document.body.appendChild(el);
  }
}

// ========== INIT ==========
function init() {
  loadData();
  updateStartScreen();
  addFloatingItems();

  document.getElementById('btn-start').onclick = startShift;
  document.getElementById('btn-upgrade').onclick = showUpgradeScreen;
  document.getElementById('btn-replay').onclick = startShift;
  document.getElementById('btn-to-upgrade').onclick = showUpgradeScreen;
  document.getElementById('btn-back-upgrade').onclick = () => {
    showScreen('start-screen');
    updateStartScreen();
  };
}

init();

})();
