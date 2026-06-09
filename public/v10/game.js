// V10 - Dò Mìn Trí Tuệ (Minesweeper Quiz Game)
(function() {
  'use strict';

  // --- Profile Check ---
  const profile = localStorage.getItem('hocvui_profile');
  if (!profile) { window.location.href = '/'; return; }
  const player = JSON.parse(profile);

  // --- State ---
  let gridSize = 6;
  let subject = 'toan';
  let difficulty = 'easy';
  let board = [];       // 2D array: { mine, treasure, number, opened, flagged }
  let lives = 3;
  let score = 0;
  let timerSeconds = 0;
  let timerInterval = null;
  let questions = [];
  let questionIndex = 0;
  let totalMines = 0;
  let flagCount = 0;
  let minesHit = 0;
  let treasuresFound = 0;
  let correctAnswers = 0;
  let totalNonMine = 0;
  let openedCount = 0;
  let gameOver = false;
  let pendingCell = null;
  let longPressTimer = null;

  // --- DOM ---
  const setupScreen = document.getElementById('setup-screen');
  const gameScreen = document.getElementById('game-screen');
  const resultScreen = document.getElementById('result-screen');
  const quizOverlay = document.getElementById('quiz-overlay');
  const gridContainer = document.getElementById('grid-container');
  const livesDisplay = document.getElementById('lives-display');
  const scoreDisplay = document.getElementById('score-display');
  const timerDisplay = document.getElementById('timer-display');
  const minesDisplay = document.getElementById('mines-display');
  const quizQuestion = document.getElementById('quiz-question');
  const quizOptions = document.getElementById('quiz-options');
  const quizFeedback = document.getElementById('quiz-feedback');

  // --- Audio (Web Audio API) ---
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  function playSound(type) {
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      gain.gain.value = 0.15;

      switch (type) {
        case 'correct':
          osc.frequency.value = 523; osc.type = 'sine';
          gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
          osc.start(); osc.stop(audioCtx.currentTime + 0.3);
          break;
        case 'wrong':
          osc.frequency.value = 200; osc.type = 'sawtooth';
          gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
          osc.start(); osc.stop(audioCtx.currentTime + 0.4);
          break;
        case 'mine':
          osc.frequency.value = 80; osc.type = 'square';
          gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
          osc.start(); osc.stop(audioCtx.currentTime + 0.5);
          break;
        case 'treasure':
          osc.frequency.value = 880; osc.type = 'sine';
          gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
          // Second note
          setTimeout(() => {
            const o2 = audioCtx.createOscillator();
            const g2 = audioCtx.createGain();
            o2.connect(g2); g2.connect(audioCtx.destination);
            o2.frequency.value = 1100; o2.type = 'sine';
            g2.gain.setValueAtTime(0.15, audioCtx.currentTime);
            g2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            o2.start(); o2.stop(audioCtx.currentTime + 0.3);
          }, 150);
          osc.start(); osc.stop(audioCtx.currentTime + 0.3);
          break;
        case 'win':
          [523, 659, 784, 1047].forEach((freq, i) => {
            setTimeout(() => {
              const o = audioCtx.createOscillator();
              const g = audioCtx.createGain();
              o.connect(g); g.connect(audioCtx.destination);
              o.frequency.value = freq; o.type = 'sine';
              g.gain.setValueAtTime(0.12, audioCtx.currentTime);
              g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
              o.start(); o.stop(audioCtx.currentTime + 0.3);
            }, i * 150);
          });
          return;
      }
    } catch (e) { /* audio not critical */ }
  }

  // --- Setup Screen ---
  document.querySelectorAll('.opt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.dataset.opt;
      document.querySelectorAll(`.opt-btn[data-opt="${group}"]`).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  document.getElementById('start-btn').addEventListener('click', startGame);
  document.getElementById('quit-btn').addEventListener('click', () => showScreen('setup'));
  document.getElementById('replay-btn').addEventListener('click', startGame);
  document.getElementById('home-btn').addEventListener('click', () => { window.location.href = '/'; });

  function showScreen(name) {
    [setupScreen, gameScreen, resultScreen].forEach(s => s.classList.remove('active'));
    if (name === 'setup') setupScreen.classList.add('active');
    else if (name === 'game') gameScreen.classList.add('active');
    else if (name === 'result') resultScreen.classList.add('active');
  }

  // --- Start Game ---
  async function startGame() {
    // Read options
    gridSize = parseInt(document.querySelector('.opt-btn.active[data-opt="size"]').dataset.val);
    subject = document.querySelector('.opt-btn.active[data-opt="subject"]').dataset.val;
    difficulty = document.querySelector('.opt-btn.active[data-opt="difficulty"]').dataset.val;

    // Reset state
    lives = 3; score = 0; timerSeconds = 0; questionIndex = 0;
    minesHit = 0; treasuresFound = 0; correctAnswers = 0; openedCount = 0;
    flagCount = 0; gameOver = false; pendingCell = null;

    // Fetch questions
    const subjectParam = subject === 'mix' ? '' : (subject === 'toan' ? 'math' : 'vietnamese');
    const url = `/api/questions?difficulty=${difficulty}&limit=50${subjectParam ? '&subject=' + subjectParam : ''}`;
    try {
      const res = await fetch(url);
      questions = await res.json();
      if (!questions.length) { alert('Không tải được câu hỏi!'); return; }
    } catch (e) { alert('Lỗi kết nối!'); return; }

    // Resume audio context (mobile)
    if (audioCtx.state === 'suspended') audioCtx.resume();

    // Generate board
    generateBoard();
    renderGrid();
    updateHeader();
    startTimer();
    showScreen('game');
  }

  // --- Board Generation ---
  function generateBoard() {
    const total = gridSize * gridSize;
    totalMines = Math.round(total * 0.17); // ~17% mines
    const totalTreasures = Math.round(total * 0.10); // ~10% treasures
    totalNonMine = total - totalMines;

    // Create flat array of cell types
    const cells = [];
    for (let i = 0; i < totalMines; i++) cells.push('mine');
    for (let i = 0; i < totalTreasures; i++) cells.push('treasure');
    while (cells.length < total) cells.push('empty');

    // Shuffle
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }

    // Build 2D board
    board = [];
    for (let r = 0; r < gridSize; r++) {
      board[r] = [];
      for (let c = 0; c < gridSize; c++) {
        const type = cells[r * gridSize + c];
        board[r][c] = {
          mine: type === 'mine',
          treasure: type === 'treasure',
          number: 0,
          opened: false,
          flagged: false
        };
      }
    }

    // Calculate numbers (count adjacent mines)
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (board[r][c].mine) continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize && board[nr][nc].mine) {
              count++;
            }
          }
        }
        board[r][c].number = count;
      }
    }
  }

  // --- Render Grid ---
  function renderGrid() {
    gridContainer.innerHTML = '';
    gridContainer.className = `grid-container grid-${gridSize}`;

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const cellEl = document.createElement('div');
        cellEl.className = 'cell closed';
        cellEl.dataset.row = r;
        cellEl.dataset.col = c;

        // Touch events for long press (flag) and tap (open)
        cellEl.addEventListener('pointerdown', (e) => onCellPointerDown(e, r, c));
        cellEl.addEventListener('pointerup', (e) => onCellPointerUp(e, r, c));
        cellEl.addEventListener('pointerleave', cancelLongPress);
        cellEl.addEventListener('contextmenu', (e) => e.preventDefault());

        gridContainer.appendChild(cellEl);
      }
    }
  }

  // --- Cell Interaction ---
  function onCellPointerDown(e, r, c) {
    if (gameOver) return;
    e.preventDefault();
    longPressTimer = setTimeout(() => {
      longPressTimer = null;
      toggleFlag(r, c);
    }, 500);
  }

  function onCellPointerUp(e, r, c) {
    if (gameOver) return;
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
      onCellTap(r, c);
    }
  }

  function cancelLongPress() {
    if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
  }

  function toggleFlag(r, c) {
    const cell = board[r][c];
    if (cell.opened) return;
    cell.flagged = !cell.flagged;
    flagCount += cell.flagged ? 1 : -1;
    updateCellVisual(r, c);
    updateHeader();
  }

  function onCellTap(r, c) {
    const cell = board[r][c];
    if (cell.opened || cell.flagged) return;

    // Show quiz
    pendingCell = { r, c };
    showQuiz();
  }

  // --- Quiz ---
  function showQuiz() {
    if (questionIndex >= questions.length) questionIndex = 0;
    const q = questions[questionIndex];
    questionIndex++;

    quizQuestion.textContent = q.question_text || q.question || '';
    // Store current question for TTS
    window._v10CurrentQ = q;
    quizFeedback.textContent = '';
    quizOptions.innerHTML = '';

    const options = [
      { key: 'A', text: q.option_a },
      { key: 'B', text: q.option_b },
      { key: 'C', text: q.option_c },
      { key: 'D', text: q.option_d },
    ];

    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt-btn';
      btn.textContent = `${opt.key}. ${opt.text}`;
      btn.addEventListener('click', () => handleAnswer(opt.key, q.correct_answer.toUpperCase(), btn));
      quizOptions.appendChild(btn);
    });

    quizOverlay.classList.add('active');
  }

  function handleAnswer(selected, correct, btnEl) {
    const allBtns = quizOptions.querySelectorAll('.quiz-opt-btn');
    allBtns.forEach(b => b.classList.add('disabled'));

    if (selected === correct) {
      btnEl.classList.add('correct');
      quizFeedback.textContent = '✅ Đúng rồi!';
      quizFeedback.style.color = '#27ae60';
      playSound('correct');
      correctAnswers++;
      score += 10;

      setTimeout(() => {
        quizOverlay.classList.remove('active');
        revealCell(pendingCell.r, pendingCell.c);
      }, 700);
    } else {
      btnEl.classList.add('wrong');
      // Highlight correct
      allBtns.forEach(b => {
        if (b.textContent.startsWith(correct + '.')) b.classList.add('correct');
      });
      quizFeedback.textContent = '❌ Sai rồi! Mất 1 mạng';
      quizFeedback.style.color = '#e74c3c';
      playSound('wrong');
      lives--;
      updateHeader();

      setTimeout(() => {
        quizOverlay.classList.remove('active');
        if (lives <= 0) endGame(false);
      }, 1000);
    }
  }

  // --- Reveal Cell ---
  function revealCell(r, c) {
    const cell = board[r][c];
    if (cell.opened) return;

    cell.opened = true;
    cell.flagged = false;

    if (cell.mine) {
      // Hit a mine!
      minesHit++;
      lives--;
      playSound('mine');
      updateCellVisual(r, c);
      updateHeader();
      if (lives <= 0) { setTimeout(() => endGame(false), 500); }
    } else if (cell.treasure) {
      treasuresFound++;
      score += 50;
      openedCount++;
      playSound('treasure');
      updateCellVisual(r, c);
      updateHeader();
      checkWin();
    } else if (cell.number === 0) {
      // Flood fill empty cells
      openedCount++;
      updateCellVisual(r, c);
      floodFill(r, c);
      updateHeader();
      checkWin();
    } else {
      openedCount++;
      updateCellVisual(r, c);
      updateHeader();
      checkWin();
    }
  }

  // --- Flood Fill ---
  function floodFill(startR, startC) {
    const queue = [[startR, startC]];
    const visited = new Set();
    visited.add(`${startR},${startC}`);

    while (queue.length > 0) {
      const [r, c] = queue.shift();

      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr, nc = c + dc;
          const key = `${nr},${nc}`;
          if (nr < 0 || nr >= gridSize || nc < 0 || nc >= gridSize) continue;
          if (visited.has(key)) continue;
          visited.add(key);

          const neighbor = board[nr][nc];
          if (neighbor.opened || neighbor.mine || neighbor.flagged) continue;

          neighbor.opened = true;
          neighbor.flagged = false;
          openedCount++;
          updateCellVisual(nr, nc);

          if (neighbor.number === 0 && !neighbor.treasure) {
            queue.push([nr, nc]);
          }
        }
      }
    }
  }

  // --- Update Cell Visual ---
  function updateCellVisual(r, c) {
    const cell = board[r][c];
    const el = gridContainer.children[r * gridSize + c];

    if (!cell.opened) {
      if (cell.flagged) {
        el.className = 'cell flagged';
        el.textContent = '🚩';
      } else {
        el.className = 'cell closed';
        el.textContent = '';
      }
      return;
    }

    if (cell.mine) {
      el.className = 'cell mine-hit';
      el.textContent = '💣';
    } else if (cell.treasure) {
      el.className = 'cell treasure-found';
      el.textContent = '💎';
    } else if (cell.number > 0) {
      el.className = `cell opened num-${cell.number}`;
      el.textContent = cell.number;
    } else {
      el.className = 'cell opened';
      el.textContent = '';
    }
  }

  // --- Win Check ---
  function checkWin() {
    if (openedCount >= totalNonMine) {
      endGame(true);
    }
  }

  // --- Update Header ---
  function updateHeader() {
    const hearts = '❤️'.repeat(Math.max(0, lives)) + '🖤'.repeat(Math.max(0, 3 - lives));
    livesDisplay.textContent = hearts;
    scoreDisplay.textContent = score;
    minesDisplay.textContent = Math.max(0, totalMines - flagCount);
  }

  // --- Timer ---
  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerSeconds = 0;
    timerInterval = setInterval(() => {
      timerSeconds++;
      const mins = Math.floor(timerSeconds / 60);
      const secs = timerSeconds % 60;
      timerDisplay.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  }

  // --- End Game ---
  function endGame(won) {
    if (gameOver) return;
    gameOver = true;
    stopTimer();

    if (won) {
      score += 100; // All cleared bonus
      // Time bonus: <60s = +50, <120s = +30, <180s = +10
      if (timerSeconds < 60) score += 50;
      else if (timerSeconds < 120) score += 30;
      else if (timerSeconds < 180) score += 10;
      playSound('win');
    } else {
      playSound('mine');
      // Reveal all mines
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          if (board[r][c].mine && !board[r][c].opened) {
            board[r][c].opened = true;
            updateCellVisual(r, c);
          }
        }
      }
    }

    // Show result after short delay
    setTimeout(() => showResult(won), won ? 500 : 1200);

    // Save session
    saveSession(won);
  }

  // --- Show Result ---
  function showResult(won) {
    document.getElementById('result-icon').textContent = won ? '🏆' : '💥';
    document.getElementById('result-title').textContent = won ? 'Thắng rồi! 🎉' : 'Thua rồi! 😢';
    document.getElementById('result-score').textContent = score;
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    document.getElementById('result-time').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    document.getElementById('result-correct').textContent = correctAnswers;
    document.getElementById('result-treasures').textContent = treasuresFound;
    document.getElementById('result-mines').textContent = minesHit;
    showScreen('result');
  }

  // --- Save Session ---
  async function saveSession(won) {
    try {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: player.id,
          mode: 'minesweeper',
          score: score,
          total_questions: correctAnswers + (lives < 3 ? 3 - lives : 0),
          correct_answers: correctAnswers,
          subject: subject === 'mix' ? 'mixed' : (subject === 'toan' ? 'math' : 'vietnamese'),
          difficulty: difficulty,
          completed: won
        })
      });
    } catch (e) { /* non-critical */ }
  }

})();


// TTS speak button
document.getElementById('btn-speak-v10')?.addEventListener('click', () => {
  const q = window._v10CurrentQ;
  if (!q) return;
  window.ttsSpeakQuestion(q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, 'mix');
});
