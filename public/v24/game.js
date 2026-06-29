(function() {
  'use strict';

  // === CONSTANTS ===
  const STORAGE_KEY = 'v24_city';
  const GRID_SIZE = 4;
  const QUIZ_TOTAL = 10;

  const BUILDINGS = [
    { id: 'house', emoji: '🏠', name: 'Nhà', cost: { brick: 5, wood: 0, glass: 0 }, pop: 4 },
    { id: 'school', emoji: '🏫', name: 'Trường', cost: { brick: 8, wood: 0, glass: 3 }, pop: 10 },
    { id: 'hospital', emoji: '🏥', name: 'Bệnh viện', cost: { brick: 10, wood: 0, glass: 5 }, pop: 8 },
    { id: 'park', emoji: '🌳', name: 'Công viên', cost: { brick: 0, wood: 3, glass: 0 }, pop: 2 },
    { id: 'shop', emoji: '🏪', name: 'Cửa hàng', cost: { brick: 6, wood: 2, glass: 0 }, pop: 5 },
    { id: 'library', emoji: '🏛️', name: 'Thư viện', cost: { brick: 7, wood: 0, glass: 4 }, pop: 6 },
  ];

  // === STATE ===
  let state = loadState();
  let selectedBuilding = null;
  let quizQuestions = [];
  let quizIndex = 0;
  let quizCorrect = 0;
  let quizEarned = { brick: 0, wood: 0, glass: 0 };
  let selectedSubject = 'math';
  let selectedDifficulty = 'easy';

  function getDefaultState() {
    return {
      grid: Array(GRID_SIZE * GRID_SIZE).fill(null),
      materials: { brick: 10, wood: 5, glass: 3 },
      population: 0
    };
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.grid && parsed.materials) return parsed;
      }
    } catch(e) {}
    return getDefaultState();
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  // === SCREEN MANAGEMENT ===
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  // === CITY RENDERING ===
  function renderCity(gridEl) {
    if (!gridEl) return;
    gridEl.innerHTML = '';
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
      const cell = document.createElement('div');
      cell.className = 'city-cell ' + (state.grid[i] ? 'building' : 'empty');
      cell.dataset.index = i;
      if (state.grid[i]) {
        const b = BUILDINGS.find(b => b.id === state.grid[i]);
        cell.textContent = b ? b.emoji : '❓';
      } else {
        cell.textContent = '+';
      }
      gridEl.appendChild(cell);
    }
  }

  function updateHUD() {
    document.getElementById('hud-brick').textContent = state.materials.brick;
    document.getElementById('hud-wood').textContent = state.materials.wood;
    document.getElementById('hud-glass').textContent = state.materials.glass;
    document.getElementById('hud-pop').textContent = state.population;
  }

  function calcPopulation() {
    let pop = 0;
    state.grid.forEach(cell => {
      if (cell) {
        const b = BUILDINGS.find(b => b.id === cell);
        if (b) pop += b.pop;
      }
    });
    state.population = pop;
  }

  function refreshCityScreen() {
    calcPopulation();
    renderCity(document.getElementById('city-grid'));
    updateHUD();
    saveState();
  }

  // === BUILD MODE ===
  function canAfford(building) {
    return building.cost.brick <= state.materials.brick &&
           building.cost.wood <= state.materials.wood &&
           building.cost.glass <= state.materials.glass;
  }

  function formatCost(cost) {
    const parts = [];
    if (cost.brick > 0) parts.push(`🧱${cost.brick}`);
    if (cost.wood > 0) parts.push(`🌲${cost.wood}`);
    if (cost.glass > 0) parts.push(`🔷${cost.glass}`);
    return parts.join(' ');
  }

  function renderBuildList() {
    const list = document.getElementById('build-list');
    list.innerHTML = '';
    BUILDINGS.forEach(b => {
      const item = document.createElement('div');
      const affordable = canAfford(b);
      item.className = 'build-item' + (!affordable ? ' disabled' : '') + (selectedBuilding === b.id ? ' selected' : '');
      item.innerHTML = `
        <span class="build-emoji">${b.emoji}</span>
        <div class="build-info">
          <span class="build-name">${b.name}</span>
          <span class="build-cost">${formatCost(b.cost)}</span>
          <span class="build-pop">+${b.pop} 👥</span>
        </div>
      `;
      if (affordable) {
        item.addEventListener('click', () => {
          selectedBuilding = b.id;
          renderBuildList();
          renderBuildGrid();
        });
      }
      list.appendChild(item);
    });
  }

  function renderBuildGrid() {
    const gridEl = document.getElementById('build-grid');
    renderCity(gridEl);
    // Make empty cells clickable
    if (selectedBuilding) {
      gridEl.querySelectorAll('.city-cell.empty').forEach(cell => {
        cell.addEventListener('click', () => {
          placeBuilding(parseInt(cell.dataset.index));
        });
      });
    }
  }

  function placeBuilding(index) {
    if (!selectedBuilding) return;
    if (state.grid[index]) return;

    const b = BUILDINGS.find(b => b.id === selectedBuilding);
    if (!b || !canAfford(b)) return;

    // Deduct materials
    state.materials.brick -= b.cost.brick;
    state.materials.wood -= b.cost.wood;
    state.materials.glass -= b.cost.glass;

    // Place
    state.grid[index] = selectedBuilding;
    calcPopulation();
    saveState();

    // Refresh build screen
    selectedBuilding = null;
    renderBuildList();
    renderBuildGrid();

    // Animate
    const cells = document.getElementById('build-grid').querySelectorAll('.city-cell');
    if (cells[index]) {
      cells[index].classList.add('pop-in');
    }
  }

  // === QUIZ ===
  function getProfile() {
    try {
      const p = localStorage.getItem('hocvui_profile');
      return p ? JSON.parse(p) : null;
    } catch(e) { return null; }
  }

  async function fetchQuestions() {
    const profile = getProfile();
    const grade = profile ? profile.grade ?? 2 : 2;
    const playerId = profile ? profile.id : '';
    try {
      const url = `/api/questions?subject=${selectedSubject}&difficulty=${selectedDifficulty}&limit=${QUIZ_TOTAL}&grade=${grade}&player_id=${playerId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      if (data.length === 0) throw new Error('No questions');
      return data;
    } catch(e) {
      return generateFallbackQuestions();
    }
  }

  function generateFallbackQuestions() {
    const qs = [];
    for (let i = 0; i < QUIZ_TOTAL; i++) {
      const a = Math.floor(Math.random() * 20) + 1;
      const b = Math.floor(Math.random() * 20) + 1;
      const correct = a + b;
      const opts = [correct];
      while (opts.length < 4) {
        const wrong = correct + Math.floor(Math.random() * 10) - 5;
        if (wrong !== correct && wrong > 0 && !opts.includes(wrong)) opts.push(wrong);
      }
      opts.sort(() => Math.random() - 0.5);
      const correctIdx = opts.indexOf(correct);
      const labels = ['a','b','c','d'];
      qs.push({
        question_text: `${a} + ${b} = ?`,
        option_a: String(opts[0]),
        option_b: String(opts[1]),
        option_c: String(opts[2]),
        option_d: String(opts[3]),
        correct_answer: labels[correctIdx]
      });
    }
    return qs;
  }

  function startQuiz() {
    quizIndex = 0;
    quizCorrect = 0;
    quizEarned = { brick: 0, wood: 0, glass: 0 };
    showScreen('quiz-screen');
    showQuestion();
  }

  function showQuestion() {
    if (quizIndex >= quizQuestions.length) {
      endQuiz();
      return;
    }

    const q = quizQuestions[quizIndex];
    document.getElementById('quiz-progress').textContent = `Câu ${quizIndex + 1}/${quizQuestions.length}`;
    document.getElementById('quiz-score').textContent = `✅ ${quizCorrect}`;
    document.getElementById('quiz-question').textContent = q.question_text;
    document.getElementById('quiz-feedback').textContent = '';

    const btns = document.querySelectorAll('#quiz-answers .quiz-ans');
    const opts = ['a','b','c','d'];
    btns.forEach((btn, i) => {
      btn.textContent = q['option_' + opts[i]];
      btn.className = 'quiz-ans';
      btn.onclick = () => handleAnswer(opts[i]);
    });
  }

  function handleAnswer(selected) {
    const q = quizQuestions[quizIndex];
    const isCorrect = selected.toLowerCase() === q.correct_answer.toLowerCase();
    const btns = document.querySelectorAll('#quiz-answers .quiz-ans');
    const opts = ['a','b','c','d'];

    // Disable all
    btns.forEach((btn, i) => {
      btn.classList.add('disabled');
      if (opts[i].toLowerCase() === q.correct_answer.toLowerCase()) btn.classList.add('correct');
      if (opts[i] === selected && !isCorrect) btn.classList.add('wrong');
    });

    const feedback = document.getElementById('quiz-feedback');
    if (isCorrect) {
      quizCorrect++;
      feedback.textContent = '🎉 Đúng rồi!';
      // Award random materials
      awardMaterial();
    } else {
      feedback.textContent = '❌ Sai rồi!';
    }

    // Next question after delay
    setTimeout(() => {
      quizIndex++;
      showQuestion();
    }, 1200);
  }

  function awardMaterial() {
    const types = ['brick', 'wood', 'glass'];
    const type = types[Math.floor(Math.random() * types.length)];
    const amount = Math.floor(Math.random() * 2) + 1; // 1-2
    quizEarned[type] += amount;
  }

  function endQuiz() {
    // Add earned materials to state
    state.materials.brick += quizEarned.brick;
    state.materials.wood += quizEarned.wood;
    state.materials.glass += quizEarned.glass;
    saveState();

    // Show result screen
    showScreen('result-screen');
    document.getElementById('result-score').textContent = `Trả lời đúng: ${quizCorrect}/${quizQuestions.length}`;

    const matsEl = document.getElementById('result-materials');
    matsEl.innerHTML = '';
    const matData = [
      { icon: '🧱', count: quizEarned.brick, name: 'Gạch' },
      { icon: '🌲', count: quizEarned.wood, name: 'Gỗ' },
      { icon: '🔷', count: quizEarned.glass, name: 'Kính' },
    ];
    matData.forEach(m => {
      const div = document.createElement('div');
      div.className = 'result-mat pop-in';
      div.innerHTML = `
        <span class="result-mat-icon">${m.icon}</span>
        <span class="result-mat-count">+${m.count}</span>
        <span class="result-mat-name">${m.name}</span>
      `;
      matsEl.appendChild(div);
    });

    // Save session to API
    saveSession();

    // Check and show parent linking prompt after game ends
    if (typeof checkAndShowPrompt === 'function') {
      checkAndShowPrompt();
    }
  }

  async function saveSession() {
    const profile = getProfile();
    if (!profile) return;
    try {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: profile.id,
          subject: selectedSubject,
          difficulty: selectedDifficulty,
          score: quizCorrect * 10,
          total_questions: quizQuestions.length,
          correct_answers: quizCorrect,
          stars_earned: Math.floor(quizCorrect / 3),
          combo_max: 0,
          mode: 'v24'
        })
      });
    } catch(e) {}
  }

  // === EVENT HANDLERS ===
  function init() {
    refreshCityScreen();

    // Quiz button
    document.getElementById('btn-quiz').addEventListener('click', () => {
      showScreen('subject-screen');
    });

    // Build button
    document.getElementById('btn-build').addEventListener('click', () => {
      selectedBuilding = null;
      showScreen('build-screen');
      renderBuildList();
      renderBuildGrid();
    });

    // Back from build
    document.getElementById('btn-back-city').addEventListener('click', () => {
      showScreen('city-screen');
      refreshCityScreen();
    });

    // Back from result
    document.getElementById('btn-back-result').addEventListener('click', () => {
      showScreen('city-screen');
      refreshCityScreen();
    });

    // Subject selection
    document.querySelectorAll('#subject-screen .subject-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#subject-screen .subject-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedSubject = btn.dataset.subject;
      });
    });

    // Difficulty selection
    document.querySelectorAll('#subject-screen .diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#subject-screen .diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedDifficulty = btn.dataset.diff;
      });
    });

    // Start quiz
    document.getElementById('btn-start-quiz').addEventListener('click', async () => {
      document.getElementById('btn-start-quiz').textContent = '⏳ Đang tải...';
      quizQuestions = await fetchQuestions();
      document.getElementById('btn-start-quiz').textContent = '🚀 Bắt đầu!';
      startQuiz();
    });

    // Back from subject
    document.getElementById('btn-back-subject').addEventListener('click', () => {
      showScreen('city-screen');
    });
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// ===== CHARACTER SYSTEM INTEGRATION (presentation only, additive) =====
// V24's game logic lives in a private IIFE above. This block adds animated
// character sprites, particle effects and styled modals WITHOUT touching any
// existing logic — it observes the DOM the logic already updates.
(function () {
  'use strict';

  let mayorChar = null;
  let citizenChar = null;

  const C = window.HocVuiCharacters;

  function mount(hostId, speciesId, emojiFallback) {
    const host = document.getElementById(hostId);
    if (!host) return null;
    host.innerHTML = '';
    if (C && C.hasSpecies(speciesId)) {
      return C.createCharacter(speciesId, host, { state: 'idle' });
    }
    host.textContent = emojiFallback;
    return null;
  }

  function pulseHappy(char) {
    if (!char) return;
    char.setState('happy');
    setTimeout(() => { if (char) char.setState('idle'); }, 900);
  }

  // Particle helper — sparkle / confetti around a host element.
  function spawnParticles(parent, kind, count) {
    if (!parent) return;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'pfx pfx-' + kind;
      p.style.setProperty('--tx', (Math.random() * 80 - 40) + 'px');
      p.style.setProperty('--ty', -(Math.random() * 46 + 22) + 'px');
      p.style.setProperty('--delay', (Math.random() * 0.18) + 's');
      if (kind === 'confetti') {
        const colors = ['#ffd700', '#4facfe', '#27ae60', '#ff7eb3', '#ffaa00'];
        p.style.background = colors[Math.floor(Math.random() * colors.length)];
      }
      parent.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
  }
  function spawnSparkle(parent, n) { spawnParticles(parent, 'sparkle', n || 7); }
  function spawnConfetti(parent, n) { spawnParticles(parent, 'confetti', n || 14); }
  window.__v24_spawnParticles = spawnParticles;

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    const $ = id => document.getElementById(id);

    // --- Mount sprites ---
    mayorChar = mount('mayor-stage', 'mayor', '👷');
    citizenChar = mount('quiz-mascot', 'citizen', '🙂');

    // --- Celebrate correct answers: watch quiz feedback text ---
    const feedback = $('quiz-feedback');
    if (feedback) {
      const fbObs = new MutationObserver(() => {
        const txt = feedback.textContent || '';
        if (txt.indexOf('Đúng') !== -1) {
          pulseHappy(citizenChar);
          spawnConfetti($('quiz-mascot'), 14);
        }
      });
      fbObs.observe(feedback, { childList: true, characterData: true, subtree: true });
    }

    // --- Celebrate building placement: watch build-grid for pop-in cells ---
    const buildGrid = $('build-grid');
    if (buildGrid) {
      const bObs = new MutationObserver(muts => {
        muts.forEach(m => {
          if (m.type === 'attributes' && m.target.classList &&
              m.target.classList.contains('pop-in')) {
            spawnSparkle(m.target, 7);
            pulseHappy(mayorChar);
          }
        });
      });
      bObs.observe(buildGrid, { attributes: true, attributeFilter: ['class'], subtree: true });
    }

    // --- Mayor reacts when returning to a freshly built city ---
    const cityScreen = $('city-screen');
    if (cityScreen) {
      const csObs = new MutationObserver(() => {
        if (cityScreen.classList.contains('active') && !mayorChar &&
            C && C.hasSpecies('mayor')) {
          mayorChar = mount('mayor-stage', 'mayor', '👷');
        }
      });
      csObs.observe(cityScreen, { attributes: true, attributeFilter: ['class'] });
    }

    // --- Guide modal ---
    const guide = $('guide-modal');
    const guideBtn = $('btn-guide');
    if (guide && guideBtn) {
      guideBtn.addEventListener('click', () => { guide.style.display = 'flex'; });
      const gc = $('btn-guide-close');
      if (gc) gc.addEventListener('click', () => { guide.style.display = 'none'; });
      guide.addEventListener('click', e => { if (e.target === guide) guide.style.display = 'none'; });
    }

    // --- Styled exit modal ---
    const exit = $('exit-modal');
    const exitBtn = $('btn-exit');
    if (exit && exitBtn) {
      exitBtn.addEventListener('click', () => { exit.style.display = 'flex'; });
      const ec = $('btn-exit-cancel');
      if (ec) ec.addEventListener('click', () => { exit.style.display = 'none'; });
      const ef = $('btn-exit-confirm');
      if (ef) ef.addEventListener('click', () => {
        exit.style.display = 'none';
        window.location.reload();
      });
      exit.addEventListener('click', e => { if (e.target === exit) exit.style.display = 'none'; });
    }
  });
})();
