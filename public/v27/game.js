(function() {
  'use strict';

  // === SPELL DATA ===
  const SPELLS = {
    fire: [
      { id: 'fire_1', name: 'Lửa Nhỏ', emoji: '🔥', element: 'fire' },
      { id: 'fire_2', name: 'Cầu Lửa', emoji: '🔥', element: 'fire' },
      { id: 'fire_3', name: 'Bão Lửa', emoji: '🔥', element: 'fire' },
      { id: 'fire_4', name: 'Phượng Hoàng', emoji: '🔥', element: 'fire' },
      { id: 'fire_5', name: 'Mặt Trời', emoji: '🔥', element: 'fire' },
    ],
    water: [
      { id: 'water_1', name: 'Giọt Nước', emoji: '💧', element: 'water' },
      { id: 'water_2', name: 'Sóng', emoji: '💧', element: 'water' },
      { id: 'water_3', name: 'Thủy Triều', emoji: '💧', element: 'water' },
      { id: 'water_4', name: 'Mưa Bão', emoji: '💧', element: 'water' },
      { id: 'water_5', name: 'Đại Dương', emoji: '💧', element: 'water' },
    ],
    earth: [
      { id: 'earth_1', name: 'Mầm Cây', emoji: '🌿', element: 'earth' },
      { id: 'earth_2', name: 'Rễ Quấn', emoji: '🌿', element: 'earth' },
      { id: 'earth_3', name: 'Động Đất', emoji: '🌿', element: 'earth' },
      { id: 'earth_4', name: 'Núi Đá', emoji: '🌿', element: 'earth' },
      { id: 'earth_5', name: 'Rừng Già', emoji: '🌿', element: 'earth' },
    ],
    wind: [
      { id: 'wind_1', name: 'Gió Nhẹ', emoji: '💨', element: 'wind' },
      { id: 'wind_2', name: 'Lốc Xoáy', emoji: '💨', element: 'wind' },
      { id: 'wind_3', name: 'Bão Tố', emoji: '💨', element: 'wind' },
      { id: 'wind_4', name: 'Sấm Sét', emoji: '💨', element: 'wind' },
      { id: 'wind_5', name: 'Vũ Bão', emoji: '💨', element: 'wind' },
    ],
  };

  const BOSSES = [
    { id: 'boss_1', name: 'Quỷ Đá', emoji: '🗿', weakness: 'water', hp: 3, desc: 'Yếu: Nước 💧' },
    { id: 'boss_2', name: 'Rồng Nước', emoji: '🐉', weakness: 'wind', hp: 3, desc: 'Yếu: Gió 💨' },
    { id: 'boss_3', name: 'Chim Bão', emoji: '🦅', weakness: 'earth', hp: 3, desc: 'Yếu: Đất 🌿' },
    { id: 'boss_4', name: 'Cây Ma', emoji: '🌳', weakness: 'fire', hp: 3, desc: 'Yếu: Lửa 🔥' },
    { id: 'boss_5', name: 'Bóng Tối', emoji: '👻', weakness: 'any', hp: 3, desc: 'Yếu: Bất kỳ (3 đòn)' },
  ];

  // === STATE ===
  let state = {
    spells: {}, // { spell_id: fragments (0-3), 3 = learned }
    bossesDefeated: [],
    currentFragments: 0,
    currentElement: 'fire',
    questions: [],
    questionIndex: 0,
    currentBoss: null,
    bossCurrentHp: 0,
  };

  // === PERSISTENCE ===
  function loadState() {
    try {
      const saved = localStorage.getItem('v27_spells');
      if (saved) {
        const parsed = JSON.parse(saved);
        state.spells = parsed.spells || {};
        state.bossesDefeated = parsed.bossesDefeated || [];
      }
    } catch(e) { /* ignore */ }
  }

  function saveState() {
    localStorage.setItem('v27_spells', JSON.stringify({
      spells: state.spells,
      bossesDefeated: state.bossesDefeated,
    }));
  }

  // === HELPERS ===
  function getProfile() {
    try {
      return JSON.parse(localStorage.getItem('hocvui_profile'));
    } catch { return null; }
  }

  function getLearnedCount() {
    return Object.values(state.spells).filter(f => f >= 3).length;
  }

  function getLearnedSpells() {
    const learned = [];
    for (const element of Object.keys(SPELLS)) {
      for (const spell of SPELLS[element]) {
        if ((state.spells[spell.id] || 0) >= 3) {
          learned.push(spell);
        }
      }
    }
    return learned;
  }

  function getNextSpellToLearn() {
    // Find next spell that isn't fully learned yet
    const elements = ['fire', 'water', 'earth', 'wind'];
    for (const el of elements) {
      for (const spell of SPELLS[el]) {
        if ((state.spells[spell.id] || 0) < 3) {
          return spell;
        }
      }
    }
    return null; // All learned!
  }

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  function createSparkles(x, y, count) {
    const container = document.getElementById('sparkles');
    for (let i = 0; i < count; i++) {
      const spark = document.createElement('div');
      spark.className = 'sparkle';
      spark.style.left = (x + (Math.random() - 0.5) * 60) + 'px';
      spark.style.top = (y + (Math.random() - 0.5) * 60) + 'px';
      spark.style.background = ['#ffd700', '#ff6b6b', '#a855f7', '#22c55e', '#3b82f6'][Math.floor(Math.random() * 5)];
      container.appendChild(spark);
      setTimeout(() => spark.remove(), 1000);
    }
  }

  // === MENU ===
  function updateMenuStats() {
    document.getElementById('stat-spells').textContent = getLearnedCount() + '/20';
    document.getElementById('stat-bosses').textContent = state.bossesDefeated.length + '/5';
  }

  // === QUIZ ===
  async function fetchQuestions() {
    const profile = getProfile();
    const grade = profile?.grade || 2;
    const subjects = ['math', 'vietnamese', 'english'];
    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    const difficulties = ['easy', 'medium'];
    const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];

    try {
      const params = new URLSearchParams({ subject, difficulty, limit: 10, grade });
      if (profile?.id) params.set('player_id', profile.id);
      const res = await fetch('/api/questions?' + params);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        state.questions = data;
        state.questionIndex = 0;
        return true;
      }
    } catch(e) { /* ignore */ }

    // Fallback questions
    state.questions = [
      { id: 0, question_text: '5 + 3 = ?', option_a: '7', option_b: '8', option_c: '9', option_d: '6', correct_answer: 'b' },
      { id: 0, question_text: '10 - 4 = ?', option_a: '5', option_b: '7', option_c: '6', option_d: '8', correct_answer: 'c' },
      { id: 0, question_text: '2 x 4 = ?', option_a: '6', option_b: '8', option_c: '10', option_d: '7', correct_answer: 'b' },
    ];
    state.questionIndex = 0;
    return true;
  }

  function startQuiz() {
    state.currentFragments = 0;
    showScreen('quiz-screen');
    updateFragmentBar();
    fetchQuestions().then(() => showQuestion());
  }

  function showQuestion() {
    if (state.questionIndex >= state.questions.length) {
      // Ran out of questions, fetch more
      fetchQuestions().then(() => showQuestion());
      return;
    }

    const q = state.questions[state.questionIndex];
    document.getElementById('quiz-question').textContent = q.question_text;
    document.getElementById('quiz-feedback').textContent = '';
    document.getElementById('quiz-feedback').className = 'quiz-feedback';

    const optionsEl = document.getElementById('quiz-options');
    optionsEl.innerHTML = '';

    const options = [
      { key: 'A', text: q.option_a },
      { key: 'B', text: q.option_b },
      { key: 'C', text: q.option_c },
      { key: 'D', text: q.option_d },
    ];

    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt';
      btn.textContent = opt.key + '. ' + opt.text;
      btn.addEventListener('click', () => handleAnswer(opt.key, q.correct_answer));
      optionsEl.appendChild(btn);
    });
  }

  function handleAnswer(selected, correct) {
    const optBtns = document.querySelectorAll('.quiz-opt');
    const feedbackEl = document.getElementById('quiz-feedback');

    // Disable all
    optBtns.forEach(btn => btn.classList.add('disabled'));

    // Highlight correct/wrong
    optBtns.forEach(btn => {
      const key = btn.textContent.charAt(0).toLowerCase();
      if (key === correct.toLowerCase()) btn.classList.add('correct');
      else if (key === selected.toLowerCase() && selected.toLowerCase() !== correct.toLowerCase()) btn.classList.add('wrong');
    });

    if (selected.toLowerCase() === correct.toLowerCase()) {
      state.currentFragments++;
      updateFragmentBar();

      if (state.currentFragments >= 3) {
        // Learn a spell!
        const spell = getNextSpellToLearn();
        if (spell) {
          state.spells[spell.id] = 3;
          saveState();
          feedbackEl.textContent = '🌟 Học được phép: ' + spell.emoji + ' ' + spell.name + '!';
          feedbackEl.className = 'quiz-feedback spell-fb';
          createSparkles(window.innerWidth / 2, window.innerHeight / 2, 20);
        } else {
          feedbackEl.textContent = '✨ Đã học hết phép thuật!';
          feedbackEl.className = 'quiz-feedback spell-fb';
        }
        // Reset fragments for next spell
        state.currentFragments = 0;
        setTimeout(() => updateFragmentBar(), 300);
      } else {
        feedbackEl.textContent = '✅ Đúng! +1 mảnh ghép';
        feedbackEl.className = 'quiz-feedback correct-fb';
      }

      // Add fragment to next unlearned spell
      const nextSpell = getNextSpellToLearn();
      if (nextSpell && state.currentFragments > 0) {
        state.spells[nextSpell.id] = Math.min(state.currentFragments, 2);
        saveState();
      }
    } else {
      feedbackEl.textContent = '❌ Sai rồi! Đáp án: ' + correct;
      feedbackEl.className = 'quiz-feedback wrong-fb';
    }

    // Log answer
    const profile = getProfile();
    if (profile?.id) {
      const q = state.questions[state.questionIndex];
      fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: profile.id,
          question_id: q.id,
          selected_answer: selected,
          correct_answer: correct,
          is_correct: selected.toLowerCase() === correct.toLowerCase(),
        }),
      }).catch(() => {});
    }

    // Next question after delay
    setTimeout(() => {
      state.questionIndex++;
      showQuestion();
    }, 1500);
  }

  function updateFragmentBar() {
    document.getElementById('fragment-count').textContent = state.currentFragments + '/3';
    document.getElementById('fragment-fill').style.width = (state.currentFragments / 3 * 100) + '%';
  }

  // === SPELL BOOK ===
  function showSpellBook() {
    showScreen('book-screen');
    renderSpellGrid('fire');
  }

  function renderSpellGrid(element) {
    state.currentElement = element;
    const grid = document.getElementById('spell-grid');
    grid.innerHTML = '';

    // Update tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.element === element);
    });

    const spells = SPELLS[element];
    spells.forEach(spell => {
      const fragments = state.spells[spell.id] || 0;
      const isLearned = fragments >= 3;

      const card = document.createElement('div');
      card.className = 'spell-card ' + (isLearned ? 'learned' : (fragments > 0 ? '' : 'locked'));
      card.innerHTML = `
        <div class="spell-emoji">${spell.emoji}</div>
        <div class="spell-name">${spell.name}</div>
        <div class="spell-fragments">${isLearned ? '✨ Đã học' : fragments + '/3 mảnh'}</div>
      `;
      grid.appendChild(card);
    });
  }

  // === BOSS ===
  function showBossSelect() {
    showScreen('boss-screen');
    document.getElementById('boss-title').textContent = '⚔️ Chọn Boss';
    document.getElementById('boss-arena').style.display = 'none';
    document.getElementById('boss-list').style.display = 'flex';

    const list = document.getElementById('boss-list');
    list.innerHTML = '';

    const learnedSpells = getLearnedSpells();

    BOSSES.forEach((boss, index) => {
      const isDefeated = state.bossesDefeated.includes(boss.id);
      // Require at least 1 learned spell of the weakness element (or any for final boss)
      const hasSpells = boss.weakness === 'any'
        ? learnedSpells.length >= 3
        : learnedSpells.some(s => s.element === boss.weakness);
      // Must defeat previous bosses first (except first)
      const prevDefeated = index === 0 || state.bossesDefeated.includes(BOSSES[index - 1].id);
      const isLocked = !prevDefeated || (!isDefeated && !hasSpells);

      const item = document.createElement('div');
      item.className = 'boss-item' + (isDefeated ? ' defeated' : '') + (isLocked ? ' locked' : '');
      item.innerHTML = `
        <div class="boss-item-emoji">${boss.emoji}</div>
        <div class="boss-item-info">
          <div class="boss-item-name">${boss.name}</div>
          <div class="boss-item-weakness">${boss.desc}</div>
        </div>
        <div class="boss-item-status">${isDefeated ? '✅ Đã hạ' : (isLocked ? '🔒' : '⚔️ Đấu')}</div>
      `;

      if (!isLocked && !isDefeated) {
        item.addEventListener('click', () => startBossFight(boss));
      } else if (!isLocked && isDefeated) {
        item.addEventListener('click', () => startBossFight(boss));
      }
      list.appendChild(item);
    });
  }

  function startBossFight(boss) {
    state.currentBoss = boss;
    state.bossCurrentHp = boss.hp;

    document.getElementById('boss-list').style.display = 'none';
    document.getElementById('boss-arena').style.display = 'block';
    document.getElementById('boss-title').textContent = '⚔️ ' + boss.name;
    document.getElementById('boss-emoji').textContent = boss.emoji;
    document.getElementById('boss-name').textContent = boss.name;
    document.getElementById('battle-log').innerHTML = '<p>🧙 Bắt đầu trận đấu với ' + boss.name + '!</p>';

    updateBossHp();
    renderPlayerSpells();
  }

  function updateBossHp() {
    const boss = state.currentBoss;
    const pct = (state.bossCurrentHp / boss.hp) * 100;
    document.getElementById('boss-hp-fill').style.width = pct + '%';
    document.getElementById('boss-hp-text').textContent = 'HP: ' + state.bossCurrentHp + '/' + boss.hp;
  }

  function renderPlayerSpells() {
    const container = document.getElementById('player-spells');
    container.innerHTML = '';

    const learned = getLearnedSpells();
    if (learned.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:#a080cc;">Chưa có phép nào! Hãy học thêm.</p>';
      return;
    }

    learned.forEach(spell => {
      const btn = document.createElement('button');
      btn.className = 'spell-btn ' + spell.element;
      btn.innerHTML = spell.emoji + '<br>' + spell.name;
      btn.addEventListener('click', () => useSpellOnBoss(spell, btn));
      container.appendChild(btn);
    });
  }

  function useSpellOnBoss(spell, btnEl) {
    const boss = state.currentBoss;
    if (!boss || state.bossCurrentHp <= 0) return;

    const log = document.getElementById('battle-log');
    const isEffective = boss.weakness === 'any' || spell.element === boss.weakness;

    if (isEffective) {
      state.bossCurrentHp--;
      btnEl.classList.add('effective');
      setTimeout(() => btnEl.classList.remove('effective'), 500);

      // Boss hit animation
      const bossEl = document.getElementById('boss-emoji');
      bossEl.classList.add('boss-hit');
      setTimeout(() => bossEl.classList.remove('boss-hit'), 400);

      log.innerHTML = '<p>🌟 ' + spell.emoji + ' ' + spell.name + ' gây sát thương!</p>' + log.innerHTML;
      createSparkles(window.innerWidth / 2, 200, 10);
      updateBossHp();

      if (state.bossCurrentHp <= 0) {
        // Boss defeated!
        setTimeout(() => bossDefeated(boss), 600);
      }
    } else {
      btnEl.classList.add('ineffective');
      setTimeout(() => btnEl.classList.remove('ineffective'), 400);
      log.innerHTML = '<p>💨 ' + spell.emoji + ' ' + spell.name + ' không hiệu quả...</p>' + log.innerHTML;
    }
  }

  function bossDefeated(boss) {
    if (!state.bossesDefeated.includes(boss.id)) {
      state.bossesDefeated.push(boss.id);
      saveState();
    }

    document.getElementById('victory-title').textContent = '🏆 Đánh bại ' + boss.name + '!';
    document.getElementById('victory-desc').textContent = 'Phép thuật của bạn đã thắng bóng tối!';
    showScreen('victory-screen');
    createSparkles(window.innerWidth / 2, window.innerHeight / 2, 30);
    updateMenuStats();

    // Check and show parent linking prompt after game ends
    if (typeof checkAndShowPrompt === 'function') {
      checkAndShowPrompt();
    }

    // Save session
    const profile = getProfile();
    if (profile?.id) {
      fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: profile.id,
          subject: 'mix',
          difficulty: 'medium',
          score: 100,
          total_questions: boss.hp,
          correct_answers: boss.hp,
          stars_earned: 3,
          combo_max: boss.hp,
          mode: 'v27',
        }),
      }).catch(() => {});
    }
  }

  // === INIT ===
  function init() {
    loadState();
    updateMenuStats();

    // Menu buttons
    document.getElementById('btn-study').addEventListener('click', startQuiz);
    document.getElementById('btn-book').addEventListener('click', showSpellBook);
    document.getElementById('btn-boss').addEventListener('click', showBossSelect);

    // Back buttons
    document.getElementById('btn-back-quiz').addEventListener('click', () => {
      showScreen('menu-screen');
      updateMenuStats();
    });
    document.getElementById('btn-back-book').addEventListener('click', () => {
      showScreen('menu-screen');
      updateMenuStats();
    });
    document.getElementById('btn-back-boss').addEventListener('click', () => {
      showScreen('menu-screen');
      updateMenuStats();
    });
    document.getElementById('btn-victory-back').addEventListener('click', () => {
      showScreen('menu-screen');
      updateMenuStats();
    });

    // Spell book tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => renderSpellGrid(btn.dataset.element));
    });
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
