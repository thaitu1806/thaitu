// V6 Đua Xe Trí Tuệ - Game Engine
// State machine, question flow, track controller, audio, input handling

import {
  calculateMovement,
  generateObstacles,
  generateFallbackQuestions,
  shuffleArray,
  calculateStats,
  checkWinCondition,
} from './game-logic.js';

// ===== CONSTANTS =====
const TIMER_DURATION = 15; // seconds
const TIMER_INTERVAL = 100; // ms
const TILE_WIDTH = 42; // px (tile width + gap)
const ANIMATION_DURATION = 600; // ms for car movement

// ===== GAME STATE =====
const State = {
  current: 'SETUP', // SETUP | LOADING | RACING | ROUND_ACTIVE | ROUND_RESOLVING | ANIMATING | RACE_OVER | RESULT
  settings: {
    p1Name: 'Xe Đỏ',
    p2Name: 'Xe Xanh',
    subject: 'math',
    difficulty: 'medium',
    trackLength: 15,
  },
  track: {
    p1Position: 0,
    p2Position: 0,
    obstacles: [],
    finishLine: 15,
  },
  round: {
    number: 0,
    question: null,
    p1: { answered: false, answer: null, time: 0 },
    p2: { answered: false, answer: null, time: 0 },
    timerStart: 0,
    timerId: null,
  },
  questions: [],
  questionIndex: 0,
  roundResults: [], // Array of { p1Correct, p2Correct, p1Time, p2Time }
};

// ===== STATE MACHINE =====
const VALID_TRANSITIONS = {
  SETUP: ['LOADING'],
  LOADING: ['RACING'],
  RACING: ['ROUND_ACTIVE'],
  ROUND_ACTIVE: ['RACING', 'RACE_OVER'],
  RACE_OVER: ['RESULT'],
  RESULT: ['SETUP'],
};

function transition(newState) {
  if (!VALID_TRANSITIONS[State.current]?.includes(newState)) {
    console.warn(`Invalid transition: ${State.current} → ${newState}`);
    return false;
  }
  State.current = newState;

  // Show/hide screens
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  if (newState === 'SETUP') {
    document.getElementById('setup-screen').classList.add('active');
  } else if (newState === 'RESULT') {
    document.getElementById('result-screen').classList.add('active');
  } else {
    document.getElementById('race-screen').classList.add('active');
  }

  return true;
}

// ===== PROFILE CHECK =====
(function checkProfile() {
  const profile = localStorage.getItem('hocvui_profile');
  if (!profile) {
    window.location.href = '/';
    return;
  }
  try {
    const p = JSON.parse(profile);
    if (p && p.name) {
      document.getElementById('p1-name').value = p.name;
    }
  } catch {
    localStorage.removeItem('hocvui_profile');
    window.location.href = '/';
  }
})();

// ===== SETUP SCREEN LOGIC =====
// Button group selection
document.querySelectorAll('.btn-group').forEach(group => {
  group.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-option');
    if (!btn) return;
    group.querySelectorAll('.btn-option').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// Start button
document.getElementById('btn-start').addEventListener('click', async () => {
  if (State.current !== 'SETUP') return;

  // Read settings
  State.settings.p1Name = document.getElementById('p1-name').value.trim() || 'Xe Đỏ';
  State.settings.p2Name = document.getElementById('p2-name').value.trim() || 'Xe Xanh';
  State.settings.subject = document.querySelector('#subject-group .btn-option.active')?.dataset.value || 'math';
  State.settings.difficulty = document.querySelector('#difficulty-group .btn-option.active')?.dataset.value || 'medium';
  State.settings.trackLength = parseInt(document.querySelector('#track-length-group .btn-option.active')?.dataset.value) || 15;

  // Update UI names
  document.getElementById('az-p1-name').textContent = State.settings.p1Name;
  document.getElementById('az-p2-name').textContent = State.settings.p2Name;

  // Initialize race state
  State.track.p1Position = 0;
  State.track.p2Position = 0;
  State.track.finishLine = State.settings.trackLength;
  State.track.obstacles = generateObstacles(State.settings.trackLength);
  State.round.number = 0;
  State.questionIndex = 0;
  State.roundResults = [];

  // Initialize audio on user gesture
  AudioEngine.init();

  transition('LOADING');
  await fetchQuestions();
  transition('RACING');

  // Initialize track DOM
  TrackController.initTrack(State.settings.trackLength, State.track.obstacles);

  // Play start sound
  AudioEngine.play('start');

  // Start first round
  startRound();
});

// ===== QUESTION MANAGER =====
async function fetchQuestions() {
  const { subject, difficulty } = State.settings;
  try {
    let questions;
    if (subject === 'mix') {
      const [math, viet] = await Promise.all([
        fetch(`/api/questions?subject=math&difficulty=${difficulty}&limit=15`).then(r => r.json()),
        fetch(`/api/questions?subject=vietnamese&difficulty=${difficulty}&limit=15`).then(r => r.json()),
      ]);
      questions = [...math, ...viet];
    } else {
      const res = await fetch(`/api/questions?subject=${subject}&difficulty=${difficulty}&limit=30`);
      questions = await res.json();
    }
    if (Array.isArray(questions) && questions.length > 0) {
      State.questions = questions;
    } else {
      throw new Error('Empty response');
    }
  } catch {
    State.questions = generateFallbackQuestions(30);
  }
  // Same pool, different order for each player
  State.p1Questions = shuffleArray([...State.questions]);
  State.p2Questions = shuffleArray([...State.questions]);
  State.p1QuestionIndex = 0;
  State.p2QuestionIndex = 0;
}

function getNextQuestion(player) {
  if (player === 'p2') {
    if (State.p2QuestionIndex >= State.p2Questions.length) {
      State.p2Questions = [...State.p2Questions, ...shuffleArray(generateFallbackQuestions(15))];
    }
    return State.p2Questions[State.p2QuestionIndex++];
  }
  // Default: p1
  if (State.p1QuestionIndex >= State.p1Questions.length) {
    State.p1Questions = [...State.p1Questions, ...shuffleArray(generateFallbackQuestions(15))];
  }
  return State.p1Questions[State.p1QuestionIndex++];
}

// ===== ROUND LIFECYCLE =====
function startRound() {
  if (State.current !== 'RACING') return;

  State.round.number++;
  State.round.p1 = { answered: false, answer: null, time: 0 };
  State.round.p2 = { answered: false, answer: null, time: 0 };

  // Give each player their own independent question
  State.round.p1Question = getNextQuestion('p1');
  State.round.p2Question = getNextQuestion('p2');
  // Keep backward-compat reference
  State.round.question = State.round.p1Question;

  // Update round counter
  document.getElementById('round-counter').textContent = `Vòng ${State.round.number}`;

  // Display question in each zone independently
  renderPlayerQuestion('p1', State.round.p1Question);
  renderPlayerQuestion('p2', State.round.p2Question);

  // Clear statuses
  document.getElementById('p1-status').textContent = '';
  document.getElementById('p2-status').textContent = '';

  // Transition and start timer
  transition('ROUND_ACTIVE');
  State.round.timerStart = Date.now();
  startTimer();
}

function renderPlayerQuestion(player, q) {
  document.getElementById(`${player}-question`).textContent = q.question_text;
  const opts = [q.option_a, q.option_b, q.option_c, q.option_d];
  const btns = document.querySelectorAll(`#${player}-buttons .ans-btn`);
  btns.forEach((btn, i) => {
    btn.textContent = `${'ABCD'[i]}. ${opts[i]}`;
    btn.className = `ans-btn ${player}-btn`;
    btn.disabled = false;
    btn.dataset.opt = 'abcd'[i];
  });
}

// ===== TIMER =====
function startTimer() {
  const timerBar = document.getElementById('timer-bar');
  timerBar.style.width = '100%';
  timerBar.className = 'timer-bar';

  clearInterval(State.round.timerId);

  State.round.timerId = setInterval(() => {
    if (State.current !== 'ROUND_ACTIVE') {
      clearInterval(State.round.timerId);
      return;
    }

    const elapsed = (Date.now() - State.round.timerStart) / 1000;
    const remaining = Math.max(0, 1 - elapsed / TIMER_DURATION);
    timerBar.style.width = (remaining * 100) + '%';

    // Color coding
    if (remaining <= 0.2) {
      timerBar.className = 'timer-bar danger';
    } else if (remaining <= 0.5) {
      timerBar.className = 'timer-bar warn';
    }

    // Time's up — go to next round
    if (elapsed >= TIMER_DURATION) {
      clearInterval(State.round.timerId);
      // Show timeout for players who didn't answer
      if (!State.round.p1.answered) document.getElementById('p1-status').textContent = '⏰ Hết giờ!';
      if (!State.round.p2.answered) document.getElementById('p2-status').textContent = '⏰ Hết giờ!';
      setTimeout(() => nextRound(), 800);
    }
  }, TIMER_INTERVAL);
}

// ===== INPUT HANDLING =====
// Click/touch handlers for answer buttons
document.getElementById('p1-buttons').addEventListener('click', (e) => {
  const btn = e.target.closest('.ans-btn');
  if (!btn || State.current !== 'ROUND_ACTIVE' || State.round.p1.answered) return;
  handleAnswer('p1', btn.dataset.opt, btn);
});

document.getElementById('p2-buttons').addEventListener('click', (e) => {
  const btn = e.target.closest('.ans-btn');
  if (!btn || State.current !== 'ROUND_ACTIVE' || State.round.p2.answered) return;
  handleAnswer('p2', btn.dataset.opt, btn);
});

// Keyboard support: P1 = 1234, P2 = 7890
document.addEventListener('keydown', (e) => {
  if (State.current !== 'ROUND_ACTIVE') return;

  const p1Keys = { '1': 'a', '2': 'b', '3': 'c', '4': 'd' };
  const p2Keys = { '7': 'a', '8': 'b', '9': 'c', '0': 'd' };

  if (p1Keys[e.key] && !State.round.p1.answered) {
    const opt = p1Keys[e.key];
    const btn = document.querySelector(`#p1-buttons .ans-btn[data-opt="${opt}"]`);
    if (btn) handleAnswer('p1', opt, btn);
  }

  if (p2Keys[e.key] && !State.round.p2.answered) {
    const opt = p2Keys[e.key];
    const btn = document.querySelector(`#p2-buttons .ans-btn[data-opt="${opt}"]`);
    if (btn) handleAnswer('p2', opt, btn);
  }
});

function handleAnswer(player, opt, btn) {
  const pState = State.round[player];
  pState.answered = true;
  pState.answer = opt;
  pState.time = Date.now() - State.round.timerStart;

  // Use each player's own question
  const q = player === 'p1' ? State.round.p1Question : State.round.p2Question;
  const isCorrect = opt === q.correct_answer;

  // Lock buttons for this player
  const buttons = document.querySelectorAll(`#${player}-buttons .ans-btn`);
  buttons.forEach(b => {
    b.disabled = true;
  });

  // Show correct/wrong immediately
  btn.classList.add(isCorrect ? 'correct' : 'wrong');
  if (!isCorrect) {
    const correctBtn = document.querySelector(`#${player}-buttons .ans-btn[data-opt="${q.correct_answer}"]`);
    if (correctBtn) correctBtn.classList.add('correct');
  }

  if (isCorrect) {
    document.getElementById(`${player}-status`).textContent = '✅ Đúng! Tiến!';
    AudioEngine.play('correct');
    moveCarForward(player, 1);
  } else {
    document.getElementById(`${player}-status`).textContent = '❌ Sai!';
    AudioEngine.play('wrong');
  }

  // Record for stats
  if (player === 'p1') State.round._p1Correct = isCorrect;
  else State.round._p2Correct = isCorrect;

  // Auto-load next question for THIS player immediately after short delay
  setTimeout(() => {
    if (State.current !== 'ROUND_ACTIVE') return;
    const nextQ = getNextQuestion(player);
    if (player === 'p1') {
      State.round.p1Question = nextQ;
      State.round.p1.answered = false;
    } else {
      State.round.p2Question = nextQ;
      State.round.p2.answered = false;
    }
    document.getElementById(`${player}-status`).textContent = '';
    renderPlayerQuestion(player, nextQ);
  }, 800);
}

// Obstacle outcomes: random when hitting an obstacle
const OBSTACLE_OUTCOMES = ['lose', 'win', 'challenge']; // 1/3 each

// Move a car forward immediately (racing style)
function moveCarForward(player, tiles) {
  const pos = player === 'p1' ? 'p1Position' : 'p2Position';
  let newPos = State.track[pos] + tiles;

  // Check obstacle — random outcome
  if (State.track.obstacles.includes(newPos) && newPos < State.track.finishLine) {
    const outcome = OBSTACLE_OUTCOMES[Math.floor(Math.random() * OBSTACLE_OUTCOMES.length)];
    
    if (outcome === 'lose') {
      // Trượt: xe dừng ở ô TRƯỚC vỏ chuối
      newPos = newPos - 1;
      showObstacleNotify(player, '🍌', 'Trượt chuối! Dừng lại!');
      setTimeout(() => {
        TrackController.showObstacleHit(player);
        AudioEngine.play('obstacle');
      }, 300);
    } else if (outcome === 'win') {
      // Thắng: xe ở luôn chỗ vỏ chuối
      showObstacleNotify(player, '💪', 'Vượt qua!');
      // newPos stays the same (on the obstacle tile)
    } else {
      // Hòa: thử thách — popup câu hỏi
      // Tạm đặt xe ở ô chuối, chờ kết quả
      State.track[pos] = newPos;
      TrackController.moveCar(player, newPos);
      showObstacleChallenge(player, newPos);
      return; // exit early, challenge handles the rest
    }
  }

  // Clamp to finish
  newPos = Math.min(newPos, State.track.finishLine);
  State.track[pos] = newPos;

  // Animate
  TrackController.moveCar(player, newPos);
  TrackController.showCorrectEffect(player);

  // Check win
  setTimeout(() => checkForWinner(), ANIMATION_DURATION + 100);
}

function checkForWinner() {
  const winner = checkWinCondition(
    { p1: State.track.p1Position, p2: State.track.p2Position },
    State.track.finishLine
  );

  if (winner && State.current === 'ROUND_ACTIVE') {
    clearInterval(State.round.timerId);
    let finalWinner = winner;
    if (winner === 'tie') {
      finalWinner = (State.round.p1.time || 99999) <= (State.round.p2.time || 99999) ? 'p1' : 'p2';
    }

    // Record final round stats
    State.roundResults.push({
      p1Correct: State.round._p1Correct || false,
      p2Correct: State.round._p2Correct || false,
      p1Time: State.round.p1.time || TIMER_DURATION * 1000,
      p2Time: State.round.p2.time || TIMER_DURATION * 1000,
    });

    transition('RACE_OVER');
    AudioEngine.play('win');
    TrackController.showFinishAnimation(finalWinner);

    setTimeout(() => {
      showResult(finalWinner);
    }, 1500);
  }
}

// Timer expired → go to next round (no one gains)
function nextRound() {
  if (State.current !== 'ROUND_ACTIVE') return;

  // Record round result for stats
  State.roundResults.push({
    p1Correct: State.round._p1Correct || false,
    p2Correct: State.round._p2Correct || false,
    p1Time: State.round.p1.time || TIMER_DURATION * 1000,
    p2Time: State.round.p2.time || TIMER_DURATION * 1000,
  });

  // Check if someone won already
  const winner = checkWinCondition(
    { p1: State.track.p1Position, p2: State.track.p2Position },
    State.track.finishLine
  );
  if (winner) return; // checkForWinner already handled it

  // Transition to RACING then start next round
  transition('RACING');
  startRound();
}

// ===== RESULT SCREEN =====
function showResult(winner) {
  transition('RESULT');

  const winnerName = winner === 'p1' ? State.settings.p1Name : State.settings.p2Name;
  const winnerCar = winner === 'p1' ? '🚗' : '🚙';

  document.getElementById('result-title').textContent = `${winnerCar} ${winnerName} thắng!`;
  document.getElementById('result-winner').textContent = 'Về đích trước đối thủ!';

  // Stats
  const stats = calculateStats(State.roundResults);

  document.getElementById('stats-p1-name').textContent = `🚗 ${State.settings.p1Name}`;
  document.getElementById('stats-p2-name').textContent = `🚙 ${State.settings.p2Name}`;
  document.getElementById('stats-rounds').textContent = stats.p1.rounds;
  document.getElementById('stats-p1-correct').textContent = stats.p1.correct;
  document.getElementById('stats-p2-correct').textContent = stats.p2.correct;

  const p1Avg = stats.p1.rounds > 0 ? (stats.p1.totalTime / stats.p1.rounds / 1000).toFixed(1) + 's' : '-';
  const p2Avg = stats.p2.rounds > 0 ? (stats.p2.totalTime / stats.p2.rounds / 1000).toFixed(1) + 's' : '-';
  document.getElementById('stats-p1-time').textContent = p1Avg;
  document.getElementById('stats-p2-time').textContent = p2Avg;

  // Confetti
  showConfetti();
}

// Play Again
document.getElementById('btn-play-again').addEventListener('click', () => {
  if (State.current !== 'RESULT') return;
  transition('SETUP');
});

// Exit button with confirm
document.getElementById('btn-exit-race').addEventListener('click', () => {
  document.getElementById('exit-confirm-overlay').classList.add('active');
});
document.getElementById('exit-cancel').addEventListener('click', () => {
  document.getElementById('exit-confirm-overlay').classList.remove('active');
});
document.getElementById('exit-confirm').addEventListener('click', () => {
  window.location.href = '/';
});

// ===== TRACK CONTROLLER =====
const TrackController = {
  initTrack(trackLength, obstacles) {
    const lanes = ['lane-p1', 'lane-p2'];
    lanes.forEach(laneId => {
      const lane = document.getElementById(laneId);
      // Keep only the car element
      const car = lane.querySelector('.car');
      lane.innerHTML = '';
      lane.appendChild(car);

      // Create tiles
      for (let i = 0; i <= trackLength; i++) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.dataset.index = i;

        if (i === 0) {
          tile.classList.add('tile-start');
        } else if (i === trackLength) {
          tile.classList.add('tile-finish');
        } else if (obstacles.includes(i)) {
          tile.classList.add('tile-obstacle');
        }

        lane.appendChild(tile);
      }
    });

    // Reset car positions
    this.moveCar('p1', 0);
    this.moveCar('p2', 0);

    // Scroll to start (left edge)
    const wrapper = document.querySelector('.track-wrapper');
    if (wrapper) wrapper.scrollLeft = 0;
  },

  moveCar(player, toTile) {
    const car = document.getElementById(`car-${player}`);
    // Calculate actual tile width from DOM
    const lane = document.getElementById(`lane-${player}`);
    const tiles = lane.querySelectorAll('.tile');
    let xPos = 0;
    if (tiles.length > 0 && toTile > 0) {
      const firstTile = tiles[0];
      const targetTile = tiles[Math.min(toTile, tiles.length - 1)];
      xPos = targetTile.offsetLeft - firstTile.offsetLeft;
    }

    car.style.setProperty('--car-x', `${xPos}px`);
    car.style.left = `${xPos}px`;
    car.style.transform = `translateY(-50%) scaleX(-1)`;

    // Scroll track to keep cars visible
    this.scrollToView();
  },

  scrollToView() {
    const wrapper = document.querySelector('.track-wrapper');
    if (!wrapper) return;

    const maxPos = Math.max(State.track.p1Position, State.track.p2Position);

    // Don't scroll if cars are still in the first visible portion
    const lane = document.getElementById('lane-p1');
    if (!lane) return;
    const tiles = lane.querySelectorAll('.tile');
    if (tiles.length === 0 || maxPos === 0) return;

    const targetTile = tiles[Math.min(maxPos, tiles.length - 1)];
    if (!targetTile) return;

    const tileLeft = targetTile.offsetLeft;
    const halfView = wrapper.clientWidth / 2;

    // Only scroll when car goes beyond half the visible width
    if (tileLeft > halfView) {
      const scrollTarget = tileLeft - halfView + 40;
      wrapper.scrollTo({ left: scrollTarget, behavior: 'smooth' });
    }
  },

  showObstacleHit(player) {
    const car = document.getElementById(`car-${player}`);
    car.classList.add('shake');
    setTimeout(() => car.classList.remove('shake'), 400);
  },

  showBoostEffect(player) {
    const car = document.getElementById(`car-${player}`);
    car.classList.add('boost');
    setTimeout(() => car.classList.remove('boost'), 500);
  },

  showCorrectEffect(player) {
    const car = document.getElementById(`car-${player}`);
    car.classList.add('star');
    setTimeout(() => car.classList.remove('star'), 400);
  },

  showFinishAnimation(winner) {
    const car = document.getElementById(`car-${winner}`);
    car.style.fontSize = '2.5rem';
    setTimeout(() => { car.style.fontSize = ''; }, 2000);
  },
};

// ===== AUDIO ENGINE =====
const AudioEngine = {
  ctx: null,

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    } catch {
      // Audio not available
    }
  },

  play(type) {
    try {
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      switch (type) {
        case 'correct':
          this._tone(523, 0.1, 784, 0.25, 0.3);
          break;
        case 'wrong':
          this._toneSaw(200, 0.15, 0.2);
          break;
        case 'boost':
          this._sweep(400, 800, 0.2, 0.3);
          break;
        case 'obstacle':
          this._tone(100, 0.08, 80, 0.1, 0.2);
          break;
        case 'win':
          this._fanfare();
          break;
        case 'start':
          this._tone(440, 0.05, 880, 0.2, 0.15);
          break;
      }
    } catch {
      // Audio failure never blocks gameplay
    }
  },

  _tone(f1, t1, f2, vol, dur) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.frequency.setValueAtTime(f1, this.ctx.currentTime);
    osc.frequency.setValueAtTime(f2, this.ctx.currentTime + t1);
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur);
    osc.start();
    osc.stop(this.ctx.currentTime + dur);
  },

  _toneSaw(freq, vol, dur) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur);
    osc.start();
    osc.stop(this.ctx.currentTime + dur);
  },

  _sweep(startF, endF, vol, dur) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.frequency.setValueAtTime(startF, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(endF, this.ctx.currentTime + dur);
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur);
    osc.start();
    osc.stop(this.ctx.currentTime + dur);
  },

  _fanfare() {
    [523, 659, 784, 1047].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.frequency.setValueAtTime(f, this.ctx.currentTime + i * 0.12);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + i * 0.12 + 0.25);
      osc.start(this.ctx.currentTime + i * 0.12);
      osc.stop(this.ctx.currentTime + i * 0.12 + 0.25);
    });
  },
};

// ===== CONFETTI =====
function showConfetti() {
  const container = document.getElementById('result-celebration');
  container.innerHTML = '';
  const colors = ['#e74c3c', '#3498db', '#27ae60', '#f39c12', '#9b59b6', '#1abc9c'];

  for (let i = 0; i < 30; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = (Math.random() * 1.5) + 's';
    piece.style.animationDuration = (2 + Math.random() * 1) + 's';
    container.appendChild(piece);
  }

  setTimeout(() => { container.innerHTML = ''; }, 4000);
}

// ===== UTILITY =====
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== NOTIFICATION POPUP =====
function showObstacleNotify(player, emoji, text) {
  const zone = document.getElementById(`zone-${player}`);
  if (!zone) return;

  const notify = document.createElement('div');
  notify.className = 'obstacle-notify';
  notify.innerHTML = `
    <span class="obstacle-notify-emoji">${emoji}</span>
    <span class="obstacle-notify-text">${text}</span>
  `;
  zone.appendChild(notify);

  requestAnimationFrame(() => notify.classList.add('show'));

  setTimeout(() => {
    notify.classList.remove('show');
    setTimeout(() => notify.remove(), 300);
  }, 1500);
}

// ===== OBSTACLE CHALLENGE (Hòa case) =====
function showObstacleChallenge(player, obstaclePos) {
  const q = getNextQuestion(player);
  const zone = document.getElementById(`zone-${player}`);
  if (!zone) return;
  // Append inside zone-inner so it inherits the 180° rotation for P1
  const zoneInner = zone.querySelector('.zone-inner');
  if (!zoneInner) return;

  const popup = document.createElement('div');
  popup.className = 'obstacle-challenge-popup';
  const opts = [q.option_a, q.option_b, q.option_c, q.option_d];
  popup.innerHTML = `
    <div class="obstacle-challenge-card">
      <div class="obstacle-challenge-title">⚡ Thử thách vượt chướng ngại!</div>
      <div class="obstacle-challenge-q">${q.question_text}</div>
      <div class="obstacle-challenge-btns">
        ${opts.map((o, i) => `<button class="obstacle-challenge-btn" data-opt="${'abcd'[i]}">${'ABCD'[i]}. ${o}</button>`).join('')}
      </div>
    </div>
  `;
  zoneInner.appendChild(popup);
  requestAnimationFrame(() => popup.classList.add('show'));

  // Handle answer
  popup.addEventListener('click', (e) => {
    const btn = e.target.closest('.obstacle-challenge-btn');
    if (!btn) return;

    const selected = btn.dataset.opt;
    const isCorrect = selected === q.correct_answer;

    // Disable all buttons
    popup.querySelectorAll('.obstacle-challenge-btn').forEach(b => b.disabled = true);
    btn.classList.add(isCorrect ? 'correct' : 'wrong');
    if (!isCorrect) {
      const correctBtn = popup.querySelector(`.obstacle-challenge-btn[data-opt="${q.correct_answer}"]`);
      if (correctBtn) correctBtn.classList.add('correct');
    }

    const pos = player === 'p1' ? 'p1Position' : 'p2Position';

    setTimeout(() => {
      popup.classList.remove('show');
      setTimeout(() => popup.remove(), 300);

      if (isCorrect) {
        // Thắng: ở lại ô chuối
        showObstacleNotify(player, '✅', 'Vượt qua!');
        AudioEngine.play('correct');
      } else {
        // Thua: về ô trước vỏ chuối
        const backPos = Math.max(0, obstaclePos - 1);
        State.track[pos] = backPos;
        TrackController.moveCar(player, backPos);
        showObstacleNotify(player, '❌', 'Trượt chuối! Lùi lại!');
        AudioEngine.play('wrong');
      }

      // Check win after challenge resolves
      setTimeout(() => checkForWinner(), 400);
    }, 800);
  });
}
