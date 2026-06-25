// V29 - Đảo Hoang Sinh Tồn (Survival Island)
(function() {
'use strict';

const STORAGE_KEY = 'v29_island';
const TIMER_SECONDS = 12;
const QUESTIONS_PER_SESSION = 10;

// Craft recipes
const RECIPES = [
  { id: 'fire', name: 'Lửa Trại', icon: '🔥', cost: { wood: 2, stone: 1, rope: 0 }, desc: 'Sưởi ấm & nấu ăn' },
  { id: 'shelter', name: 'Lều Trại', icon: '⛺', cost: { wood: 4, stone: 2, rope: 0 }, desc: 'Chỗ ở an toàn' },
  { id: 'fishing_rod', name: 'Cần Câu', icon: '🎣', cost: { wood: 2, stone: 0, rope: 2 }, desc: 'Bắt cá ăn' },
  { id: 'water_filter', name: 'Lọc Nước', icon: '💧', cost: { wood: 1, stone: 1, rope: 2 }, desc: 'Nước sạch uống' },
  { id: 'raft', name: 'Bè Tre', icon: '🚣', cost: { wood: 5, stone: 2, rope: 3 }, desc: 'Thoát khỏi đảo!' }
];

// Game state
let state = loadState();
let questions = [];
let currentQ = 0;
let sessionGathered = { wood: 0, stone: 0, rope: 0 };
let timer = null;
let timeLeft = TIMER_SECONDS;

function getDefaultState() {
  return {
    resources: { wood: 0, stone: 0, rope: 0 },
    crafted: [],
    totalGathered: { wood: 0, stone: 0, rope: 0 },
    gatherSessions: 0
  };
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch(e) {}
  return getDefaultState();
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Screen management
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ========== ISLAND SCREEN ==========
function renderIsland() {
  updateResourceDisplay();
  const grid = document.getElementById('island-grid');
  grid.innerHTML = '';

  RECIPES.forEach(recipe => {
    const isCrafted = state.crafted.includes(recipe.id);
    const div = document.createElement('div');
    div.className = `island-item ${isCrafted ? 'crafted' : 'locked'}`;
    div.innerHTML = `
      <span class="item-icon">${recipe.icon}</span>
      <span class="item-name">${recipe.name}</span>
      <span class="item-status">${isCrafted ? '✅ Đã có' : '🔒 Chưa có'}</span>
    `;
    grid.appendChild(div);
  });
}

function updateResourceDisplay() {
  document.getElementById('wood-count').textContent = state.resources.wood;
  document.getElementById('stone-count').textContent = state.resources.stone;
  document.getElementById('rope-count').textContent = state.resources.rope;
}

// ========== GATHER (QUIZ) ==========
async function startGather() {
  try {
    const profile = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
    const grade = profile.grade || 2;
    const subjects = ['math', 'vietnamese', 'english'];
    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    const res = await fetch(`/api/questions?subject=${subject}&difficulty=easy&limit=${QUESTIONS_PER_SESSION}&grade=${grade}`);
    questions = await res.json();
    if (!questions || questions.length === 0) {
      alert('Không tải được câu hỏi!');
      return;
    }
  } catch(e) {
    alert('Lỗi kết nối!');
    return;
  }

  currentQ = 0;
  sessionGathered = { wood: 0, stone: 0, rope: 0 };
  showScreen('gather-screen');
  showQuestion();
}

function showQuestion() {
  if (currentQ >= questions.length) {
    endGatherSession();
    return;
  }

  const q = questions[currentQ];
  document.getElementById('gather-progress').textContent = `Câu ${currentQ + 1}/${questions.length}`;
  updateGatherScore();
  document.getElementById('question-box').textContent = q.question_text;
  document.getElementById('feedback').textContent = '';
  document.getElementById('feedback').className = 'feedback';

  const grid = document.getElementById('options-grid');
  grid.innerHTML = '';
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
    btn.onclick = () => selectAnswer(opt.key, q.correct_answer);
    grid.appendChild(btn);
  });

  startTimer();
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

function handleTimeout() {
  const btns = document.querySelectorAll('.option-btn');
  btns.forEach(b => b.classList.add('disabled'));
  
  const q = questions[currentQ];
  // Highlight correct
  btns.forEach(b => {
    if (b.textContent.charAt(0).toLowerCase() === q.correct_answer.toLowerCase()) b.classList.add('correct');
  });

  document.getElementById('feedback').textContent = '⏰ Hết giờ!';
  document.getElementById('feedback').className = 'feedback wrong';

  setTimeout(() => { currentQ++; showQuestion(); }, 1200);
}

function selectAnswer(selected, correct) {
  clearInterval(timer);
  const btns = document.querySelectorAll('.option-btn');
  btns.forEach(b => b.classList.add('disabled'));

  const isCorrect = selected.toLowerCase() === correct.toLowerCase();
  btns.forEach(b => {
    if (b.textContent.charAt(0).toLowerCase() === correct.toLowerCase()) b.classList.add('correct');
    if (!isCorrect && b.textContent.charAt(0).toLowerCase() === selected.toLowerCase()) b.classList.add('wrong');
  });

  if (isCorrect) {
    // Give random resource
    const resources = ['wood', 'stone', 'rope'];
    // Weighted: more wood
    const weighted = ['wood', 'wood', 'wood', 'stone', 'stone', 'rope', 'rope'];
    const got = weighted[Math.floor(Math.random() * weighted.length)];
    sessionGathered[got]++;
    const icons = { wood: '🌲', stone: '🧱', rope: '🎀' };
    document.getElementById('feedback').textContent = `✅ Đúng! +1 ${icons[got]}`;
    document.getElementById('feedback').className = 'feedback correct';
  } else {
    document.getElementById('feedback').textContent = '❌ Sai rồi!';
    document.getElementById('feedback').className = 'feedback wrong';
  }

  updateGatherScore();
  setTimeout(() => { currentQ++; showQuestion(); }, 1200);
}

function updateGatherScore() {
  document.getElementById('gather-score').textContent = 
    `🌲${sessionGathered.wood} 🧱${sessionGathered.stone} 🎀${sessionGathered.rope}`;
}

function endGatherSession() {
  clearInterval(timer);
  // Add gathered resources to state
  state.resources.wood += sessionGathered.wood;
  state.resources.stone += sessionGathered.stone;
  state.resources.rope += sessionGathered.rope;
  state.totalGathered.wood += sessionGathered.wood;
  state.totalGathered.stone += sessionGathered.stone;
  state.totalGathered.rope += sessionGathered.rope;
  state.gatherSessions++;
  saveState();

  // Save session to server
  saveSession();

  showScreen('island-screen');
  renderIsland();
}

async function saveSession() {
  try {
    const profile = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
    if (!profile.id) return;
    const totalCorrect = sessionGathered.wood + sessionGathered.stone + sessionGathered.rope;
    await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: profile.id,
        subject: 'mixed',
        difficulty: 'easy',
        score: totalCorrect * 10,
        total_questions: QUESTIONS_PER_SESSION,
        correct_answers: totalCorrect,
        stars_earned: Math.floor(totalCorrect / 3),
        combo_max: 0,
        mode: 'v29'
      })
    });
  } catch(e) {}
}

// ========== CRAFT SCREEN ==========
function showCraft() {
  showScreen('craft-screen');
  renderCraftList();
  document.getElementById('craft-wood').textContent = state.resources.wood;
  document.getElementById('craft-stone').textContent = state.resources.stone;
  document.getElementById('craft-rope').textContent = state.resources.rope;
}

function renderCraftList() {
  const list = document.getElementById('craft-list');
  list.innerHTML = '';

  RECIPES.forEach(recipe => {
    const isCrafted = state.crafted.includes(recipe.id);
    const canCraft = !isCrafted && 
      state.resources.wood >= recipe.cost.wood &&
      state.resources.stone >= recipe.cost.stone &&
      state.resources.rope >= recipe.cost.rope;

    const card = document.createElement('div');
    card.className = `craft-card ${isCrafted ? 'crafted' : canCraft ? 'available' : 'locked'}`;

    const costStr = [];
    if (recipe.cost.wood) costStr.push(`🌲${recipe.cost.wood}`);
    if (recipe.cost.stone) costStr.push(`🧱${recipe.cost.stone}`);
    if (recipe.cost.rope) costStr.push(`🎀${recipe.cost.rope}`);

    card.innerHTML = `
      <span class="craft-icon">${recipe.icon}</span>
      <div class="craft-info">
        <div class="craft-name">${recipe.name}</div>
        <div class="craft-cost">${costStr.join(' + ')} — ${recipe.desc}</div>
      </div>
    `;

    if (isCrafted) {
      const btn = document.createElement('button');
      btn.className = 'craft-btn done';
      btn.textContent = '✅ Đã có';
      btn.disabled = true;
      card.appendChild(btn);
    } else {
      const btn = document.createElement('button');
      btn.className = 'craft-btn';
      btn.textContent = canCraft ? '🔨 Chế tạo' : '🔒';
      btn.disabled = !canCraft;
      btn.onclick = () => craftItem(recipe);
      card.appendChild(btn);
    }

    list.appendChild(card);
  });
}

function craftItem(recipe) {
  // Deduct resources
  state.resources.wood -= recipe.cost.wood;
  state.resources.stone -= recipe.cost.stone;
  state.resources.rope -= recipe.cost.rope;
  state.crafted.push(recipe.id);
  saveState();

  // Check if raft is crafted (victory!)
  if (recipe.id === 'raft') {
    showVictory();
    return;
  }

  // Re-render
  showCraft();
}

// ========== VICTORY ==========
function showVictory() {
  showScreen('victory-screen');
  const stats = document.getElementById('victory-stats');
  stats.innerHTML = `
    <p>📊 Tổng tài nguyên đã kiếm:</p>
    <p>🌲 ${state.totalGathered.wood} gỗ | 🧱 ${state.totalGathered.stone} đá | 🎀 ${state.totalGathered.rope} dây</p>
    <p>🔍 ${state.gatherSessions} lần thu thập</p>
  `;

  // Call checkAndShowPrompt if available
  if (typeof checkAndShowPrompt === 'function') {
    checkAndShowPrompt();
  }
}

function resetGame() {
  state = getDefaultState();
  saveState();
  showScreen('island-screen');
  renderIsland();
}

// ========== INIT ==========
function init() {
  renderIsland();

  document.getElementById('btn-gather').onclick = startGather;
  document.getElementById('btn-craft').onclick = showCraft;
  document.getElementById('btn-craft-back').onclick = () => {
    showScreen('island-screen');
    renderIsland();
  };
  document.getElementById('btn-play-again').onclick = resetGame;

  // Check if already won (raft crafted)
  if (state.crafted.includes('raft')) {
    showVictory();
  }
}

init();

})();
