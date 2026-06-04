// V5 Cờ Cá Ngựa - Game Engine
// Board game logic, state machine, bot AI, API integration

import {
  BOARD_CONFIG as IMPORTED_BOARD_CONFIG,
  calculateTargetTile,
  getNextPlayer,
  applySpecialTileEffect,
  checkKick,
  checkWinCondition,
  botAnswer,
  accumulateProgress,
  initializeGame,
  getTileType as _getTileType,
  generateRandomTiles,
} from './game-logic.js';

// ===== CONSTANTS =====
const COLORS = ['red', 'blue', 'green', 'yellow'];
const COLOR_EMOJIS = { red: '🐴', blue: '🦄', green: '🏇', yellow: '🎠' };
const BOT_NAMES = ['Bot 1', 'Bot 2', 'Bot 3'];
const ZOMBIE_SET = ['💀', '🧟', '👻', '👹', '👺', '🤖', '👾', '🦇', '🐛', '🦠','🎃', '☠️', '🕷️', '🦂', '🐍', '🦎', '🐲', '🐉', '🦖', '🦕','🐊', '🦈', '🐙', '🦑', '🪳', '🪲', '🐜', '🦗', '🕸️', '🦟','🐺', '🦁', '🐗', '🦍', '🦬', '🐏', '🦏', '🐻', '🧛', '🧙'];

// ===== BOARD CONFIGURATION =====
// Import from game-logic.js and add layout for rendering
const BOARD_CONFIG = {
  ...IMPORTED_BOARD_CONFIG,
  layout: 'rectangular-loop',
};

/**
 * Get tile type using local BOARD_CONFIG (which gets randomized each game)
 */
function getTileType(index) {
  if (index === BOARD_CONFIG.finishTile) return 'finish';
  if (BOARD_CONFIG.starTiles.includes(index)) return 'star';
  if (BOARD_CONFIG.trapTiles.includes(index)) return 'trap';
  return 'normal';
}

// Tile positions mapped to CSS grid coordinates (row, col)
// Board is an 8x12 grid (8 cols, 12 rows). The path forms a rectangular loop (portrait orientation):
// Top row: tiles 0-7, row 1, cols 1-8 (left to right)
// Right column: tiles 8-18, col 8, rows 2-12 (top to bottom)
// Bottom row: tiles 19-25, row 12, cols 7-1 (right to left)
// Left column: tiles 26-35, col 1, rows 11-2 (bottom to top)
const TILE_POSITIONS = (() => {
  const positions = [];

  // Top row: tiles 0-7, row=1, col=1..8
  for (let i = 0; i <= 7; i++) {
    positions.push({ row: 1, col: i + 1 });
  }

  // Right column: tiles 8-18, col=8, row=2..12
  for (let i = 0; i <= 10; i++) {
    positions.push({ row: i + 2, col: 8 });
  }

  // Bottom row: tiles 19-25, row=12, col=7..1 (right to left)
  for (let i = 0; i <= 6; i++) {
    positions.push({ row: 12, col: 7 - i });
  }

  // Left column: tiles 26-35, col=1, row=11..2 (bottom to top)
  for (let i = 0; i <= 9; i++) {
    positions.push({ row: 11 - i, col: 1 });
  }

  return positions;
})();

// ===== GAME STATE =====
let gameState = null;

// ===== SETUP MANAGER =====
const SetupManager = {
  config: {
    playerCount: 2,
    players: [],
    subject: 'math',
    difficulty: 'easy',
  },

  init() {
    this.config.playerCount = 2;
    this.config.subject = 'math';
    this.config.difficulty = 'easy';

    this.bindPlayerCountButtons();
    this.bindSubjectButtons();
    this.bindDifficultyButtons();
    this.bindStartButton();
    this.renderPlayerSlots();
    this.loadProfileName();
    this.validateConfig();
  },

  // Load player name from localStorage
  loadProfileName() {
    try {
      const profile = JSON.parse(localStorage.getItem('hocvui_profile'));
      if (profile && profile.name) {
        return profile.name;
      }
    } catch (e) {
      // ignore parse errors
    }
    return null;
  },

  // Get profile player id
  loadProfileId() {
    try {
      const profile = JSON.parse(localStorage.getItem('hocvui_profile'));
      if (profile && profile.id) {
        return profile.id;
      }
    } catch (e) {
      // ignore parse errors
    }
    return null;
  },

  bindPlayerCountButtons() {
    const group = document.getElementById('player-count-group');
    group.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-option');
      if (!btn) return;
      group.querySelectorAll('.btn-option').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this.config.playerCount = parseInt(btn.dataset.count);
      this.renderPlayerSlots();
      this.validateConfig();
    });
  },

  bindSubjectButtons() {
    const group = document.getElementById('subject-group');
    group.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-option');
      if (!btn) return;
      group.querySelectorAll('.btn-option').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this.config.subject = btn.dataset.subject;
    });
  },

  bindDifficultyButtons() {
    const group = document.getElementById('difficulty-group');
    group.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-option');
      if (!btn) return;
      group.querySelectorAll('.btn-option').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this.config.difficulty = btn.dataset.difficulty;
    });
  },

  bindStartButton() {
    const btn = document.getElementById('btn-start');
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      this.startGame();
    });
  },

  renderPlayerSlots() {
    const container = document.getElementById('player-slots');
    const count = this.config.playerCount;
    const profileName = this.loadProfileName();

    // Build players array
    this.config.players = [];
    for (let i = 0; i < count; i++) {
      const isFirstHuman = i === 0;
      this.config.players.push({
        slot: i,
        type: isFirstHuman ? 'human' : 'bot',
        name: isFirstHuman ? (profileName || 'Người chơi') : BOT_NAMES[i - 1] || `Bot ${i}`,
        color: COLORS[i],
      });
    }

    this.renderSlotCards(container);
    this.validateConfig();
  },

  renderSlotCards(container) {
    container.innerHTML = '';
    this.config.players.forEach((player, index) => {
      const slot = document.createElement('div');
      slot.className = 'player-slot';
      slot.innerHTML = `
        <div class="player-slot-color color-${player.color}">${COLOR_EMOJIS[player.color]}</div>
        <div class="player-slot-info">
          <input type="text" class="player-slot-name-input" data-slot="${index}" value="${player.name}" maxlength="12">
          <div class="player-slot-type">${player.type === 'human' ? '👤 Người chơi' : '🤖 Máy'}</div>
        </div>
        <button class="btn-toggle-type ${player.type === 'human' ? 'is-human' : 'is-bot'}" data-slot="${index}">
          ${player.type === 'human' ? '👤' : '🤖'}
        </button>
      `;
      container.appendChild(slot);
    });

    // Bind name inputs
    container.querySelectorAll('.player-slot-name-input').forEach(input => {
      input.addEventListener('change', () => {
        const slotIndex = parseInt(input.dataset.slot);
        const newName = input.value.trim();
        if (newName) {
          this.config.players[slotIndex].name = newName;
        } else {
          input.value = this.config.players[slotIndex].name;
        }
      });
    });

    // Bind toggle buttons
    container.querySelectorAll('.btn-toggle-type').forEach(btn => {
      btn.addEventListener('click', () => {
        const slotIndex = parseInt(btn.dataset.slot);
        this.togglePlayerType(slotIndex);
      });
    });
  },

  togglePlayerType(slotIndex) {
    const player = this.config.players[slotIndex];
    const profileName = this.loadProfileName();

    if (player.type === 'human') {
      player.type = 'bot';
      // Assign bot name based on how many bots there are
      const botCount = this.config.players.filter((p, i) => p.type === 'bot' && i !== slotIndex).length;
      player.name = `Bot ${botCount + 1}`;
    } else {
      player.type = 'human';
      // If this is the first human slot, use profile name
      const humanCount = this.config.players.filter((p, i) => p.type === 'human' && i !== slotIndex).length;
      if (humanCount === 0 && profileName) {
        player.name = profileName;
      } else {
        player.name = `Người chơi ${humanCount + 2}`;
      }
    }

    // Reassign bot names sequentially
    this.reassignBotNames();

    const container = document.getElementById('player-slots');
    this.renderSlotCards(container);
    this.validateConfig();
  },

  reassignBotNames() {
    let botIndex = 0;
    const profileName = this.loadProfileName();
    let humanIndex = 0;

    this.config.players.forEach(player => {
      if (player.type === 'bot') {
        botIndex++;
        player.name = `Bot ${botIndex}`;
      } else {
        humanIndex++;
        if (humanIndex === 1 && profileName) {
          player.name = profileName;
        } else {
          player.name = `Người chơi ${humanIndex}`;
        }
      }
    });
  },

  validateConfig() {
    const hasHuman = this.config.players.some(p => p.type === 'human');
    const btn = document.getElementById('btn-start');
    btn.disabled = !hasHuman;
    return hasHuman;
  },

  startGame() {
    if (!this.validateConfig()) return;

    const config = {
      playerCount: this.config.playerCount,
      players: this.config.players.map(p => ({ ...p })),
      subject: this.config.subject,
      difficulty: this.config.difficulty,
    };

    gameState = initializeGame(config);

    // Randomize star/trap tile positions for this game
    const randomTiles = generateRandomTiles();
    BOARD_CONFIG.starTiles = randomTiles.starTiles;
    BOARD_CONFIG.trapTiles = randomTiles.trapTiles;

    // Pre-fetch questions for the game session
    QuestionManager.init(config.subject, config.difficulty);

    // Switch screens
    document.getElementById('setup-screen').classList.remove('active');
    document.getElementById('board-screen').classList.add('active');

    // Render the board
    renderBoard();

    // Start the game loop
    startTurn();
  },
};

// ===== BOARD RENDERER =====

/**
 * Render the full board screen: turn indicator, board grid, and dice/controls area
 */
function renderBoard() {
  const boardScreen = document.getElementById('board-screen');
  boardScreen.innerHTML = `
    <div class="board-layout">
      <!-- Exit confirm popup -->
      <div class="exit-confirm-overlay" id="exit-confirm-overlay">
        <div class="exit-confirm-card">
          <div class="exit-confirm-icon">🚪</div>
          <div class="exit-confirm-text">Bạn muốn thoát trò chơi?</div>
          <div class="exit-confirm-buttons">
            <button class="exit-confirm-btn cancel" id="exit-cancel">Tiếp tục</button>
            <button class="exit-confirm-btn confirm" id="exit-confirm">Thoát</button>
          </div>
        </div>
      </div>

      <!-- Turn Indicator with Exit button inside -->
      <div class="turn-indicator" id="turn-indicator">
        <span class="turn-indicator-dot" id="turn-dot"></span>
        <span class="turn-indicator-text" id="turn-text">Lượt chơi</span>
        <button class="btn-exit-game" id="btn-exit-game" title="Thoát">✕</button>
      </div>

      <!-- Board Grid (dice area inside center) -->
      <div class="board-grid" id="board-grid">
        ${renderTiles()}
        <!-- Dice area centered inside board -->
        <div class="dice-area-center" id="dice-area">
          <div class="dice-container" id="dice-container">
            <div class="dice-wrapper" id="dice-1" data-showing="1"></div>
            <div class="dice-wrapper" id="dice-2" data-showing="1"></div>
          </div>
          <div class="dice-result" id="dice-result"></div>
          <button class="btn-roll" id="btn-roll" disabled>🎲 Tung xúc xắc</button>
        </div>
      </div>
    </div>
  `;

  // Render tokens on board
  renderTokens();
  // Update turn indicator
  updateTurnIndicator();
  // Bind dice events and update roll button state
  bindDiceEvents();
  updateRollButton();
  // Bind exit button
  bindExitButton();
}

/**
 * Generate HTML for all 36 tiles positioned in the CSS grid
 */
function renderTiles() {
  let tilesHTML = '';

  for (let i = 0; i < BOARD_CONFIG.totalTiles; i++) {
    const pos = TILE_POSITIONS[i];
    const type = getTileType(i);
    let tileClass = 'tile';
    let tileContent = `<span class="tile-number">${i}</span>`;

    if (type === 'star') {
      tileClass += ' tile-star';
      tileContent = '⭐';
    } else if (type === 'trap') {
      tileClass += ' tile-trap';
      tileContent = '⚠️';
    } else if (type === 'finish') {
      tileClass += ' tile-finish';
      tileContent = '🏆';
    }

    tilesHTML += `<div class="${tileClass}" data-tile="${i}" style="grid-row: ${pos.row}; grid-column: ${pos.col};">${tileContent}</div>`;
  }

  return tilesHTML;
}

/**
 * Render player tokens on the board at their current positions.
 * Handles stacking when multiple tokens are on the same tile.
 */
function renderTokens() {
  const grid = document.getElementById('board-grid');
  if (!grid || !gameState) return;

  // Remove existing tokens from all tiles
  grid.querySelectorAll('.token').forEach(el => el.remove());

  // Group players by position
  const positionGroups = {};
  gameState.players.forEach((player, index) => {
    const pos = player.position;
    if (!positionGroups[pos]) positionGroups[pos] = [];
    positionGroups[pos].push({ ...player, index });
  });

  // Render tokens inside their respective tile elements
  Object.entries(positionGroups).forEach(([pos, players]) => {
    const tileIndex = parseInt(pos);
    if (tileIndex < 0 || tileIndex >= BOARD_CONFIG.totalTiles) return;

    // If at finish (position 36), don't render on board
    if (tileIndex === BOARD_CONFIG.finishPosition) return;

    const tileEl = grid.querySelector(`.tile[data-tile="${tileIndex}"]`);
    if (!tileEl) return;

    players.forEach((player, stackIndex) => {
      const token = document.createElement('span');
      token.className = `token token-${player.color}`;
      token.dataset.player = player.index;
      token.textContent = COLOR_EMOJIS[player.color];

      // Apply stacking offset when multiple tokens on same tile
      if (players.length > 1) {
        const offsets = getStackOffsets(players.length);
        const offset = offsets[stackIndex];
        token.style.transform = `translate(${offset.x}px, ${offset.y}px)`;
      }

      tileEl.appendChild(token);
    });
  });
}

/**
 * Calculate stacking offsets for multiple tokens on the same tile.
 * Returns array of {x, y} pixel offsets.
 */
function getStackOffsets(count) {
  const offsets = [];
  const step = 3; // pixels of stagger

  if (count === 2) {
    offsets.push({ x: -step, y: -step });
    offsets.push({ x: step, y: step });
  } else if (count === 3) {
    offsets.push({ x: -step, y: -step });
    offsets.push({ x: step, y: -step });
    offsets.push({ x: 0, y: step });
  } else if (count === 4) {
    offsets.push({ x: -step, y: -step });
    offsets.push({ x: step, y: -step });
    offsets.push({ x: -step, y: step });
    offsets.push({ x: step, y: step });
  } else {
    for (let i = 0; i < count; i++) {
      offsets.push({ x: i * 2 - count, y: i * 2 - count });
    }
  }

  return offsets;
}

/**
 * Update the turn indicator to show the current player
 */
function updateTurnIndicator() {
  if (!gameState) return;
  const player = gameState.players[gameState.currentPlayerIndex];
  const dot = document.getElementById('turn-dot');
  const text = document.getElementById('turn-text');
  const indicator = document.getElementById('turn-indicator');
  if (dot && text) {
    dot.className = `turn-indicator-dot color-${player.color}`;
    text.textContent = `${COLOR_EMOJIS[player.color]} Lượt: ${player.name}`;
  }
  if (indicator) {
    // Remove previous color highlights
    indicator.classList.remove('active-red', 'active-blue', 'active-green', 'active-yellow');
    indicator.classList.add(`active-${player.color}`);
  }
}

// ===== DICE SYSTEM =====

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

/**
 * Get the emoji face for a die value (1-6) - kept for fallback/display
 */
function getDiceFace(value) {
  return DICE_FACES[value - 1] || '⚀';
}

/**
 * Dot positions for each dice value (1-9 grid positions)
 * Grid: [tl, tc, tr, ml, mc, mr, bl, bc, br] = positions 1-9
 */
const DICE_DOT_PATTERNS = {
  1: [5],                    // center
  2: [3, 7],                 // top-right, bottom-left
  3: [3, 5, 7],              // top-right, center, bottom-left
  4: [1, 3, 7, 9],           // four corners
  5: [1, 3, 5, 7, 9],        // four corners + center
  6: [1, 3, 4, 6, 7, 9],     // two columns of three
};

/**
 * Create a single face element with 9 dots, showing the correct pattern for a value
 */
function createDiceFace(value) {
  const face = document.createElement('div');
  face.className = `dice-face dice-face--${value}`;
  const pattern = DICE_DOT_PATTERNS[value];
  for (let i = 1; i <= 9; i++) {
    const dot = document.createElement('span');
    dot.className = pattern.includes(i) ? 'dot visible' : 'dot';
    face.appendChild(dot);
  }
  return face;
}

/**
 * Initialize a dice wrapper with 6 faces (1-6)
 */
function initDiceCube(wrapperEl) {
  if (!wrapperEl) return;
  wrapperEl.innerHTML = '';
  for (let v = 1; v <= 6; v++) {
    wrapperEl.appendChild(createDiceFace(v));
  }
  wrapperEl.dataset.showing = '1';
}

/**
 * Show a specific face on the dice cube
 */
function showDiceFace(wrapperEl, value) {
  if (!wrapperEl) return;
  wrapperEl.dataset.showing = String(value);
}

// Keep old functions as no-ops for compatibility
function renderDiceFace() {}
function initDiceDots() {}

/**
 * Roll two dice with tumbling animation.
 * Returns a Promise that resolves with [die1, die2] after animation completes.
 */
function rollDice() {
  return new Promise((resolve) => {
    if (!gameState || gameState.state !== 'waiting_roll') return resolve([1, 1]);

    gameState.state = 'dice_rolling';

    AudioManager.play('dice');

    const die1El = document.getElementById('dice-1');
    const die2El = document.getElementById('dice-2');
    const btnRoll = document.getElementById('btn-roll');

    // Disable the roll button during animation
    if (btnRoll) btnRoll.disabled = true;

    // Generate random results
    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;

    // Start tumbling animation with random direction per die
    const container = document.getElementById('dice-container');
    if (container) container.classList.add('rolling');

    if (die1El) {
      die1El.style.setProperty('--rx-dir', Math.random() > 0.5 ? '1' : '-1');
      die1El.style.setProperty('--ry-dir', Math.random() > 0.5 ? '1' : '-1');
      die1El.style.setProperty('--rz-dir', Math.random() > 0.5 ? '1' : '-1');
      die1El.classList.add('rolling');
    }
    if (die2El) {
      die2El.style.setProperty('--rx-dir', Math.random() > 0.5 ? '1' : '-1');
      die2El.style.setProperty('--ry-dir', Math.random() > 0.5 ? '1' : '-1');
      die2El.style.setProperty('--rz-dir', Math.random() > 0.5 ? '1' : '-1');
      die2El.classList.add('rolling');
    }

    // Animation duration
    const animDuration = 1000 + Math.random() * 1000; // 1-2 seconds

    setTimeout(() => {
      // Stop animation and show final face with bounce
      const container = document.getElementById('dice-container');
      if (container) container.classList.remove('rolling');

      if (die1El) {
        die1El.classList.remove('rolling');
        showDiceFace(die1El, die1);
        die1El.classList.add('bounce');
        setTimeout(() => die1El.classList.remove('bounce'), 500);
      }
      if (die2El) {
        die2El.classList.remove('rolling');
        showDiceFace(die2El, die2);
        die2El.classList.add('bounce');
        setTimeout(() => die2El.classList.remove('bounce'), 500);
      }

      // Store dice result
      gameState.diceResult = [die1, die2];

      // Display total result
      displayDiceResult(die1, die2);

      // Calculate and highlight target tile
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      const total = die1 + die2;
      const targetTile = Math.min(currentPlayer.position + total, BOARD_CONFIG.finishPosition);
      gameState.targetTile = targetTile;

      highlightTargetTile(targetTile);

      // Transition to waiting_tile_tap state
      gameState.state = 'waiting_tile_tap';

      resolve([die1, die2]);
    }, animDuration);
  });
}

/**
 * Display the dice result text showing total move distance
 */
function displayDiceResult(die1, die2) {
  const resultEl = document.getElementById('dice-result');
  if (resultEl) {
    const total = die1 + die2;
    resultEl.textContent = `${die1} + ${die2} = ${total} ô`;
    resultEl.classList.add('show');
  }
}

/**
 * Clear the dice result display
 */
function clearDiceResult() {
  const resultEl = document.getElementById('dice-result');
  if (resultEl) {
    resultEl.textContent = '';
    resultEl.classList.remove('show');
  }
}

/**
 * Highlight the target tile with a pulsing animation
 */
function highlightTargetTile(tileIndex) {
  // Remove any existing highlights
  clearTileHighlight();

  if (tileIndex >= BOARD_CONFIG.totalTiles) return; // Finish position, no tile to highlight

  const grid = document.getElementById('board-grid');
  if (!grid) return;

  const tileEl = grid.querySelector(`.tile[data-tile="${tileIndex}"]`);
  if (tileEl) {
    tileEl.classList.add('tile-highlight');
  }
}

/**
 * Remove the target tile highlight
 */
function clearTileHighlight() {
  const grid = document.getElementById('board-grid');
  if (!grid) return;

  grid.querySelectorAll('.tile-highlight').forEach(el => {
    el.classList.remove('tile-highlight');
  });
}

/**
 * Enable or disable the roll button based on game state
 */
function updateRollButton() {
  const btnRoll = document.getElementById('btn-roll');
  if (!btnRoll || !gameState) return;

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const shouldEnable = gameState.state === 'waiting_roll' && currentPlayer.type === 'human';
  btnRoll.disabled = !shouldEnable;
}

/**
 * Handle the roll button click
 */
function onRollButtonClick() {
  if (!gameState || gameState.state !== 'waiting_roll') return;
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  if (currentPlayer.type !== 'human') return;

  rollDice().then(() => {
    // After dice roll completes, bind tile tap for human
    bindTileTap();
  });
}

/**
 * Bind dice area event listeners after board renders
 */
function bindDiceEvents() {
  const btnRoll = document.getElementById('btn-roll');
  if (btnRoll) {
    btnRoll.addEventListener('click', onRollButtonClick);
  }
  // Initialize 3D dice cubes
  const die1El = document.getElementById('dice-1');
  const die2El = document.getElementById('dice-2');
  initDiceCube(die1El);
  initDiceCube(die2El);
}

/**
 * Bind the exit/close button with confirm popup
 */
function bindExitButton() {
  const exitBtn = document.getElementById('btn-exit-game');
  const overlay = document.getElementById('exit-confirm-overlay');
  const cancelBtn = document.getElementById('exit-cancel');
  const confirmBtn = document.getElementById('exit-confirm');

  if (exitBtn) {
    exitBtn.addEventListener('click', () => {
      if (overlay) overlay.classList.add('active');
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      if (overlay) overlay.classList.remove('active');
    });
  }

  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      window.location.href = '/';
    });
  }
}

// ===== AUDIO MANAGER =====
const AudioManager = {
  ctx: null,

  _getContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.ctx;
  },

  /**
   * Play a short beep/tone for game events
   * @param {string} type - 'correct', 'wrong', 'star', 'trap', 'kick', 'dice', 'victory'
   */
  play(type) {
    try {
      const ctx = this._getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.3, now);

      switch (type) {
        case 'correct':
          osc.frequency.setValueAtTime(523, now); // C5
          osc.frequency.setValueAtTime(659, now + 0.1); // E5
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
          osc.start(now);
          osc.stop(now + 0.3);
          break;
        case 'wrong':
          osc.frequency.setValueAtTime(200, now);
          osc.frequency.setValueAtTime(150, now + 0.15);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
          osc.start(now);
          osc.stop(now + 0.4);
          break;
        case 'star':
          osc.frequency.setValueAtTime(659, now); // E5
          osc.frequency.setValueAtTime(784, now + 0.1); // G5
          osc.frequency.setValueAtTime(1047, now + 0.2); // C6
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
          osc.start(now);
          osc.stop(now + 0.4);
          break;
        case 'trap':
          osc.frequency.setValueAtTime(300, now);
          osc.frequency.setValueAtTime(200, now + 0.1);
          osc.frequency.setValueAtTime(100, now + 0.2);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
          osc.start(now);
          osc.stop(now + 0.4);
          break;
        case 'kick':
          osc.frequency.setValueAtTime(400, now);
          osc.frequency.setValueAtTime(600, now + 0.05);
          osc.frequency.setValueAtTime(200, now + 0.15);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
          osc.start(now);
          osc.stop(now + 0.35);
          break;
        case 'dice':
          osc.type = 'square';
          osc.frequency.setValueAtTime(800, now);
          osc.frequency.setValueAtTime(600, now + 0.05);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
          osc.start(now);
          osc.stop(now + 0.15);
          break;
        case 'victory':
          osc.frequency.setValueAtTime(523, now);    // C5
          osc.frequency.setValueAtTime(659, now + 0.15); // E5
          osc.frequency.setValueAtTime(784, now + 0.3);  // G5
          osc.frequency.setValueAtTime(1047, now + 0.45); // C6
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
          osc.start(now);
          osc.stop(now + 0.7);
          // Add applause (clapping noise bursts)
          this._playApplause(ctx, now + 0.3);
          break;
        default:
          osc.frequency.setValueAtTime(440, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          osc.start(now);
          osc.stop(now + 0.2);
      }
    } catch (e) {
      // Audio not available, silently ignore
    }
  },

  /**
   * Simulate applause/clapping using noise bursts
   */
  _playApplause(ctx, startTime) {
    try {
      const duration = 2.0;
      const clapCount = 12;
      
      for (let i = 0; i < clapCount; i++) {
        const time = startTime + (i * duration / clapCount) + Math.random() * 0.06;
        const bufferSize = ctx.sampleRate * 0.04; // 40ms noise burst
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let j = 0; j < bufferSize; j++) {
          data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (bufferSize * 0.3));
        }
        
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 3000 + Math.random() * 2000;
        filter.Q.value = 1;
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.15 + Math.random() * 0.1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
        
        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        source.start(time);
      }
    } catch (e) {
      // Silent fail
    }
  },
};

// ===== TOAST NOTIFICATION SYSTEM =====

/**
 * Show a toast notification on screen
 * @param {string} message - text to display
 * @param {number} duration - ms to show (default 2000)
 */
function showToast(message, duration = 2000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Show zombie battle animation overlay when player lands on trap tile.
 * Zombie appears, attacks the horse, and pushes it back.
 */
function showZombieBattle(player) {
  return new Promise((resolve) => {
    const zombie = ZOMBIE_SET[Math.floor(Math.random() * ZOMBIE_SET.length)];
    const overlay = document.createElement('div');
    overlay.className = 'zombie-battle-overlay';
    overlay.innerHTML = `
      <div class="zombie-battle-scene">
        <div class="zombie-attacker">${zombie}</div>
        <div class="zombie-vs">⚔️</div>
        <div class="zombie-victim">${COLOR_EMOJIS[player.color]}</div>
      </div>
      <div class="zombie-text">${zombie} tấn công!</div>
    `;
    document.body.appendChild(overlay);

    requestAnimationFrame(() => overlay.classList.add('active'));

    setTimeout(() => {
      overlay.classList.add('attack');
    }, 400);

    setTimeout(() => {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 300);
      resolve();
    }, 1800);
  });
}

// ===== GAME LOOP / TURN FLOW =====

/**
 * Start a new turn for the current player.
 * This is the main entry point for each turn cycle.
 */
function startTurn() {
  if (!gameState || gameState.state === 'game_over') return;

  gameState.state = 'waiting_roll';
  gameState.diceResult = null;
  gameState.targetTile = null;

  // Update UI
  updateTurnIndicator();
  updateRollButton();
  clearDiceResult();
  clearTileHighlight();

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  if (currentPlayer.type === 'bot') {
    // Bot auto-roll after delay (will be fully implemented in Task 10)
    setTimeout(() => {
      if (!gameState || gameState.state !== 'waiting_roll') return;
      rollDice().then(() => {
        // Bot auto-tap tile after delay
        setTimeout(() => {
          if (!gameState || gameState.state !== 'waiting_tile_tap') return;
          handleTileTap();
        }, 1000);
      });
    }, 1000);
  }
  // For human players, the roll button click triggers the flow
}

/**
 * Bind click event to the highlighted target tile for confirmation.
 * Only the highlighted tile is clickable.
 */
function bindTileTap() {
  const grid = document.getElementById('board-grid');
  if (!grid || !gameState || gameState.state !== 'waiting_tile_tap') return;

  const highlightedTile = grid.querySelector('.tile-highlight');
  if (highlightedTile) {
    highlightedTile.style.cursor = 'pointer';
    highlightedTile.addEventListener('click', onTileTapClick, { once: true });
  }

  // If target is finish (36), there's no tile to tap — auto-confirm
  if (gameState.targetTile >= BOARD_CONFIG.totalTiles) {
    handleTileTap();
  }
}

/**
 * Handle click on highlighted tile
 */
function onTileTapClick() {
  if (!gameState || gameState.state !== 'waiting_tile_tap') return;
  handleTileTap();
}

/**
 * Process the tile tap confirmation: show question and handle answer.
 */
async function handleTileTap() {
  if (!gameState || gameState.state !== 'waiting_tile_tap') return;

  // Remove highlight and tile click
  clearTileHighlight();
  gameState.state = 'showing_question';

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const question = QuestionManager.getNextQuestion();

  if (!question) {
    // No question available, skip turn
    showToast('⏳ Đang tải câu hỏi...');
    endTurn();
    return;
  }

  // Track time for answer logging
  const startTime = Date.now();

  let answerResult;

  if (currentPlayer.type === 'bot') {
    // Bot answers automatically
    answerResult = await handleBotAnswer(question);
  } else {
    // Human answers via popup
    answerResult = await showQuestionPopup(question);
  }

  const timeSpent = Date.now() - startTime;

  // Update player stats
  if (answerResult.isCorrect) {
    currentPlayer.stats.correct++;
  } else {
    currentPlayer.stats.incorrect++;
  }
  currentPlayer.stats.turnsPlayed++;
  gameState.turnCount++;

  // Log answer to API (fire-and-forget)
  logAnswer(currentPlayer, question, answerResult, timeSpent);

  // Process answer result
  if (answerResult.isCorrect) {
    AudioManager.play('correct');
    await handleCorrectAnswer();
  } else {
    AudioManager.play('wrong');
    handleIncorrectAnswer();
    // Brief pause then end turn
    await wait(1000);
    endTurn();
  }
}

/**
 * Handle bot answering a question.
 * Uses the standalone botAnswer() function for answer selection.
 * @param {Object} question - the question object
 * @returns {Promise<{selected: string, correct: string, isCorrect: boolean}>}
 */
async function handleBotAnswer(question) {
  gameState.state = 'showing_question';

  const difficulty = gameState.config.difficulty;
  const selected = botAnswer(question, difficulty);
  const isCorrect = selected === question.correct_answer;

  // Show the question popup for the bot (display briefly)
  const result = await showBotQuestionPopup(question, selected);
  return result;
}

/**
 * Show question popup for bot — displays question, then reveals bot's answer after 1.5s.
 * @param {Object} question - question object
 * @param {string} botSelectedAnswer - the answer the bot selected
 * @returns {Promise<{selected: string, correct: string, isCorrect: boolean}>}
 */
function showBotQuestionPopup(question, botSelectedAnswer) {
  return new Promise((resolve) => {
    let overlay = document.getElementById('question-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'question-overlay';
      overlay.className = 'question-overlay';
      document.body.appendChild(overlay);
    }

    const options = [
      { key: 'a', text: question.option_a },
      { key: 'b', text: question.option_b },
      { key: 'c', text: question.option_c },
      { key: 'd', text: question.option_d },
    ];

    overlay.innerHTML = `
      <div class="question-card">
        <p class="question-text">${question.question_text}</p>
        <div class="answer-grid">
          ${options.map(opt => `
            <button class="answer-btn" data-answer="${opt.key}" disabled>
              <span class="answer-letter">${opt.key.toUpperCase()}</span>
              <span class="answer-text">${opt.text}</span>
            </button>
          `).join('')}
        </div>
        <p class="bot-thinking">🤖 Đang suy nghĩ...</p>
      </div>
    `;

    overlay.classList.add('active');

    // After 1.5s, reveal bot's answer
    setTimeout(() => {
      const correct = question.correct_answer;
      const isCorrect = botSelectedAnswer === correct;

      const selectedBtn = overlay.querySelector(`.answer-btn[data-answer="${botSelectedAnswer}"]`);
      if (selectedBtn) {
        selectedBtn.classList.add(isCorrect ? 'correct' : 'incorrect');
      }

      if (!isCorrect) {
        const correctBtn = overlay.querySelector(`.answer-btn[data-answer="${correct}"]`);
        if (correctBtn) correctBtn.classList.add('correct');
      }

      // Remove thinking text
      const thinkingEl = overlay.querySelector('.bot-thinking');
      if (thinkingEl) thinkingEl.remove();

      // Close after brief display
      setTimeout(() => {
        overlay.classList.remove('active');
        resolve({ selected: botSelectedAnswer, correct, isCorrect });
      }, isCorrect ? 800 : 1200);
    }, 1500);
  });
}

/**
 * Handle correct answer: animate movement, check special tile, check kick.
 */
async function handleCorrectAnswer() {
  if (!gameState) return;

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const targetTile = gameState.targetTile;

  // Animate token movement tile-by-tile
  gameState.state = 'animating_move';
  await animateTokenMovement(currentPlayer, currentPlayer.position, targetTile);

  // Update position
  currentPlayer.position = targetTile;
  renderTokens();

  // Check win condition
  const positions = gameState.players.map(p => p.position);
  const winnerIndex = checkWinCondition(positions);
  if (winnerIndex !== -1) {
    gameState.state = 'game_over';
    gameState.winner = winnerIndex;
    AudioManager.play('victory');
    await handleGameEnd();
    return;
  }

  // Check special tile effects (not for finish tile - win is handled above)
  const tileType = getTileType(currentPlayer.position);
  if (tileType !== 'normal' && tileType !== 'finish') {
    gameState.state = 'special_effect';
    const newPosition = await handleSpecialTileEffect(currentPlayer, tileType);
    currentPlayer.position = newPosition;
    renderTokens();

    // Check win after special effect
    const positionsAfterEffect = gameState.players.map(p => p.position);
    const winnerAfterEffect = checkWinCondition(positionsAfterEffect);
    if (winnerAfterEffect !== -1) {
      gameState.state = 'game_over';
      gameState.winner = winnerAfterEffect;
      AudioManager.play('victory');
      await handleGameEnd();
      return;
    }
  }

  // Check kick mechanic
  const allPositions = gameState.players.map(p => p.position);
  const kickedIndex = checkKick(currentPlayer.position, allPositions, gameState.currentPlayerIndex);

  if (kickedIndex !== -1) {
    gameState.state = 'kick_animation';
    await handleKickEffect(kickedIndex);
  }

  // End turn
  endTurn();
}

/**
 * Handle incorrect answer: stay in place, show feedback.
 */
function handleIncorrectAnswer() {
  // Position doesn't change — the question popup already showed the correct answer
  // Just show a brief toast
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  showToast(`❌ ${currentPlayer.name} trả lời sai!`, 1500);
}

/**
 * Animate token moving tile-by-tile from startPos to endPos.
 * @param {Object} player - player object
 * @param {number} startPos - starting tile index
 * @param {number} endPos - ending tile index
 * @returns {Promise} resolves when animation completes
 */
function animateTokenMovement(player, startPos, endPos) {
  return new Promise((resolve) => {
    if (startPos === endPos) {
      resolve();
      return;
    }

    const stepDuration = 180; // ms per tile
    const steps = endPos - startPos;
    let currentStep = 0;

    function nextStep() {
      currentStep++;
      const intermediatePos = startPos + currentStep;

      // Temporarily move player position for rendering
      player.position = intermediatePos;
      renderTokens();

      if (currentStep < steps) {
        setTimeout(nextStep, stepDuration);
      } else {
        resolve();
      }
    }

    setTimeout(nextStep, stepDuration);
  });
}

/**
 * Handle special tile effect (star or trap).
 * Shows notification, plays sound, animates if needed.
 * @param {Object} player - the current player
 * @param {string} tileType - 'star' or 'trap'
 * @returns {Promise<number>} new position after effect
 */
async function handleSpecialTileEffect(player, tileType) {
  const currentPos = player.position;
  const newPos = applySpecialTileEffect(currentPos, tileType);

  if (tileType === 'star') {
    AudioManager.play('star');
    showToast('⭐ Tiến thêm 2 ô!', 2000);
    // Animate forward
    if (newPos !== currentPos) {
      await animateTokenMovement(player, currentPos, newPos);
    }
  } else if (tileType === 'trap') {
    AudioManager.play('trap');
    // Show zombie battle overlay with random zombie
    const zombie = ZOMBIE_SET[Math.floor(Math.random() * ZOMBIE_SET.length)];
    await showZombieBattle(player);
    showToast(`${zombie} đẩy lùi 3 ô!`, 2500);
    // Animate backward
    if (newPos !== currentPos) {
      await animateTokenBackward(player, currentPos, newPos);
    }
  }

  return newPos;
}

/**
 * Animate token moving backward tile-by-tile (for trap effect).
 * @param {Object} player - player object
 * @param {number} startPos - starting tile index
 * @param {number} endPos - ending tile index (lower)
 * @returns {Promise} resolves when animation completes
 */
function animateTokenBackward(player, startPos, endPos) {
  return new Promise((resolve) => {
    if (startPos === endPos) {
      resolve();
      return;
    }

    const stepDuration = 180; // ms per tile
    const steps = startPos - endPos;
    let currentStep = 0;

    function nextStep() {
      currentStep++;
      const intermediatePos = startPos - currentStep;

      player.position = intermediatePos;
      renderTokens();

      if (currentStep < steps) {
        setTimeout(nextStep, stepDuration);
      } else {
        resolve();
      }
    }

    setTimeout(nextStep, stepDuration);
  });
}

/**
 * Handle kick effect: send kicked player back to 0 with animation.
 * @param {number} kickedIndex - index of the kicked player
 */
async function handleKickEffect(kickedIndex) {
  const kickedPlayer = gameState.players[kickedIndex];
  const kickerPlayer = gameState.players[gameState.currentPlayerIndex];

  AudioManager.play('kick');
  showToast(`🦶 Đá ${kickedPlayer.name} về vạch xuất phát!`, 2500);

  // Animate kick — fly back to 0
  await animateKick(kickedPlayer);

  // Set position to 0
  kickedPlayer.position = 0;
  renderTokens();
}

/**
 * Animate a kicked token flying back to start.
 * Uses a CSS class for the fly-back animation.
 * @param {Object} player - the kicked player
 */
function animateKick(player) {
  return new Promise((resolve) => {
    const grid = document.getElementById('board-grid');
    if (!grid) {
      player.position = 0;
      resolve();
      return;
    }

    // Find the token element for this player
    const tokenEl = grid.querySelector(`.token[data-player="${player.index || gameState.players.indexOf(player)}"]`);
    if (tokenEl) {
      tokenEl.classList.add('token-kicked');
      setTimeout(() => {
        tokenEl.classList.remove('token-kicked');
        player.position = 0;
        renderTokens();
        resolve();
      }, 600);
    } else {
      player.position = 0;
      renderTokens();
      resolve();
    }
  });
}

/**
 * Handle game end: save session, save progress, show victory screen.
 */
async function handleGameEnd() {
  if (!gameState) return;

  const winner = gameState.players[gameState.winner];
  showToast(`🎉 ${winner.name} đã về đích!`, 3000);

  // Save session for all human players
  await saveSession();

  // Save progress for human players
  await saveProgress();

  // Brief delay then show victory screen
  await wait(1500);
  showVictoryScreen();
}

/**
 * Save game session via POST /api/sessions.
 */
async function saveSession() {
  const playerId = SetupManager.loadProfileId();
  if (!playerId) return;

  const winner = gameState.players[gameState.winner];
  const humanPlayer = gameState.players.find(p => p.type === 'human');
  if (!humanPlayer) return;

  const payload = {
    player_id: playerId,
    subject: gameState.config.subject === 'mix' ? 'mixed' : gameState.config.subject,
    difficulty: gameState.config.difficulty,
    score: humanPlayer.position,
    total_questions: humanPlayer.stats.correct + humanPlayer.stats.incorrect,
    correct_answers: humanPlayer.stats.correct,
    stars_earned: 0,
    combo_max: 0,
  };

  try {
    await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    // Silent failure — retry once
    try {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e2) {
      console.warn('Failed to save session:', e2);
    }
  }
}

/**
 * Save progress via PUT /api/players/:id/progress/v5.
 * Loads existing progress first to accumulate (not overwrite).
 */
async function saveProgress() {
  const playerId = SetupManager.loadProfileId();
  if (!playerId) return;

  const humanPlayer = gameState.players.find(p => p.type === 'human');
  if (!humanPlayer) return;

  const isWinner = gameState.players[gameState.winner] === humanPlayer;

  const newSession = {
    correct: humanPlayer.stats.correct,
    total: humanPlayer.stats.correct + humanPlayer.stats.incorrect,
    isWinner,
  };

  try {
    // Load existing progress
    const res = await fetch(`/api/players/${playerId}/progress/v5`);
    const existing = res.ok ? await res.json() : null;

    // Accumulate
    const updated = accumulateProgress(existing, newSession);

    // Save
    await fetch(`/api/players/${playerId}/progress/v5`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
  } catch (e) {
    // Silent retry once
    try {
      const updated = accumulateProgress(null, newSession);
      await fetch(`/api/players/${playerId}/progress/v5`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (e2) {
      console.warn('Failed to save progress:', e2);
    }
  }
}

/**
 * Show the victory screen with winner info, stats, confetti, and action buttons.
 */
function showVictoryScreen() {
  if (!gameState) return;

  const winner = gameState.players[gameState.winner];

  // Gather stats
  const totalTurns = gameState.turnCount;
  const playerStats = gameState.players.map(p => ({
    name: p.name,
    color: p.color,
    correct: p.stats.correct,
    incorrect: p.stats.incorrect,
    total: p.stats.correct + p.stats.incorrect,
  }));

  const victoryScreen = document.getElementById('victory-screen');
  victoryScreen.innerHTML = `
    <div class="victory-container">
      <div class="confetti-container" id="confetti-container"></div>
      <div class="victory-content">
        <div class="victory-trophy">🏆</div>
        <h1 class="victory-title">Chúc mừng!</h1>
        <div class="victory-winner">
          <span class="victory-winner-emoji">${COLOR_EMOJIS[winner.color]}</span>
          <span class="victory-winner-name">${winner.name}</span>
        </div>
        <p class="victory-subtitle">đã về đích đầu tiên!</p>

        <div class="victory-stats">
          <div class="victory-stat-row victory-stat-header">
            <span>📊 Thống kê trận đấu</span>
          </div>
          <div class="victory-stat-row">
            <span>Tổng lượt chơi:</span>
            <span class="victory-stat-value">${totalTurns}</span>
          </div>
          ${playerStats.map(p => `
            <div class="victory-stat-row">
              <span>${COLOR_EMOJIS[p.color]} ${p.name}:</span>
              <span class="victory-stat-value">✅ ${p.correct} / ❌ ${p.incorrect}</span>
            </div>
          `).join('')}
        </div>

        <div class="victory-buttons">
          <button class="btn-victory btn-play-again" id="btn-play-again">🔄 Chơi lại</button>
          <button class="btn-victory btn-go-home" id="btn-go-home">🏠 Về trang chủ</button>
        </div>
      </div>
    </div>
  `;

  // Switch screens
  document.getElementById('board-screen').classList.remove('active');
  victoryScreen.classList.add('active');

  // Start confetti animation
  startConfetti();

  // Bind buttons
  document.getElementById('btn-play-again').addEventListener('click', () => {
    stopConfetti();
    victoryScreen.classList.remove('active');
    document.getElementById('setup-screen').classList.add('active');
    gameState = null;
  });

  document.getElementById('btn-go-home').addEventListener('click', () => {
    window.location.href = '/';
  });
}

// ===== CONFETTI ANIMATION =====
let confettiInterval = null;

/**
 * Start the confetti particle animation on the victory screen.
 */
function startConfetti() {
  const container = document.getElementById('confetti-container');
  if (!container) return;

  const colors = ['#e74c3c', '#3498db', '#27ae60', '#f39c12', '#9b59b6', '#e91e63', '#00bcd4'];

  function createPiece() {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = (2 + Math.random() * 2) + 's';
    piece.style.animationDelay = Math.random() * 0.5 + 's';
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    container.appendChild(piece);

    // Remove after animation
    setTimeout(() => piece.remove(), 4500);
  }

  // Create initial burst
  for (let i = 0; i < 30; i++) {
    setTimeout(() => createPiece(), i * 50);
  }

  // Continue creating confetti
  confettiInterval = setInterval(() => {
    for (let i = 0; i < 5; i++) {
      createPiece();
    }
  }, 500);
}

/**
 * Stop the confetti animation.
 */
function stopConfetti() {
  if (confettiInterval) {
    clearInterval(confettiInterval);
    confettiInterval = null;
  }
  const container = document.getElementById('confetti-container');
  if (container) container.innerHTML = '';
}

/**
 * End the current turn and advance to next player.
 */
function endTurn() {
  if (!gameState || gameState.state === 'game_over') return;

  gameState.state = 'turn_transition';

  // Brief pause before next turn
  setTimeout(() => {
    if (!gameState || gameState.state === 'game_over') return;

    // Advance to next player
    gameState.currentPlayerIndex = getNextPlayer(gameState.currentPlayerIndex, gameState.players.length);

    // Start next turn
    startTurn();
  }, 800);
}

/**
 * Log answer to the server via POST /api/answers (fire-and-forget).
 */
function logAnswer(player, question, answerResult, timeSpent) {
  const playerId = SetupManager.loadProfileId() || 0;

  const payload = {
    session_id: 0,
    player_id: playerId,
    question_id: question.id,
    selected_answer: answerResult.selected,
    correct_answer: answerResult.correct,
    is_correct: answerResult.isCorrect,
    time_spent_ms: timeSpent,
  };

  fetch('/api/answers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {
    // Silent failure — non-blocking
  });
}

/**
 * Utility: wait for a given number of ms.
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== QUESTION MANAGER =====
const QuestionManager = {
  questions: [],
  usedIds: new Set(),
  subject: 'math',
  difficulty: 'easy',
  loading: false,

  /**
   * Initialize and pre-fetch 20 questions for the game session.
   * @param {string} subject - 'math', 'vietnamese', or 'mix'
   * @param {string} difficulty - 'easy', 'medium', or 'hard'
   */
  async init(subject, difficulty) {
    this.subject = subject;
    this.difficulty = difficulty;
    this.questions = [];
    this.usedIds = new Set();
    this.loading = false;
    await this.fetchQuestions();
  },

  /**
   * Fetch a batch of 20 questions from the API.
   * For 'mix' subject, fetches 10 math + 10 vietnamese and shuffles them.
   * Implements retry logic: retry once after 2s on failure.
   */
  async fetchQuestions() {
    if (this.loading) return;
    this.loading = true;

    try {
      let fetched;
      if (this.subject === 'mix') {
        // Fetch half math, half vietnamese
        const [mathQuestions, vietQuestions] = await Promise.all([
          this._fetchFromAPI('math', this.difficulty, 10),
          this._fetchFromAPI('vietnamese', this.difficulty, 10),
        ]);
        fetched = this._shuffle([...mathQuestions, ...vietQuestions]);
      } else {
        fetched = await this._fetchFromAPI(this.subject, this.difficulty, 20);
      }

      // Filter out already-used questions
      const newQuestions = fetched.filter(q => !this.usedIds.has(q.id));
      this.questions.push(...newQuestions);
      this.loading = false;
    } catch (err) {
      // Retry once after 2 seconds
      this.loading = false;
      await this._wait(2000);
      try {
        let fetched;
        if (this.subject === 'mix') {
          const [mathQuestions, vietQuestions] = await Promise.all([
            this._fetchFromAPI('math', this.difficulty, 10),
            this._fetchFromAPI('vietnamese', this.difficulty, 10),
          ]);
          fetched = this._shuffle([...mathQuestions, ...vietQuestions]);
        } else {
          fetched = await this._fetchFromAPI(this.subject, this.difficulty, 20);
        }
        const newQuestions = fetched.filter(q => !this.usedIds.has(q.id));
        this.questions.push(...newQuestions);
      } catch (retryErr) {
        // Persistent failure — show error to user
        this._showFetchError();
      }
    }
  },

  /**
   * Fetch questions from a single API endpoint.
   * @returns {Promise<Array>} array of question objects
   */
  async _fetchFromAPI(subject, difficulty, limit) {
    const res = await fetch(`/api/questions?subject=${encodeURIComponent(subject)}&difficulty=${encodeURIComponent(difficulty)}&limit=${limit}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  /**
   * Get the next unused question from the cache.
   * Triggers background refill if cache is running low.
   * If cache is empty and all questions have been used, clears usedIds and re-fetches.
   * @returns {Object|null} question object or null if unavailable
   */
  getNextQuestion() {
    // If cache is empty and we have used questions, reset and refetch
    if (this.questions.length === 0) {
      if (this.usedIds.size > 0) {
        this.usedIds.clear();
        this.fetchQuestions(); // background refetch
      }
      return null;
    }

    const question = this.questions.shift();
    this.usedIds.add(question.id);

    // Trigger background refill when remaining < 5
    this.refillIfNeeded();

    return question;
  },

  /**
   * Check if cache needs refilling and trigger background fetch if so.
   */
  refillIfNeeded() {
    if (this.questions.length < 5 && !this.loading) {
      this.fetchQuestions(); // fire-and-forget background fetch
    }
  },

  /**
   * Show error overlay when questions can't be loaded after retry.
   */
  _showFetchError() {
    // Create error overlay
    let overlay = document.getElementById('question-error-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'question-error-overlay';
      overlay.className = 'question-overlay';
      overlay.innerHTML = `
        <div class="question-card">
          <p class="question-text">❌ Không thể tải câu hỏi. Vui lòng kiểm tra kết nối mạng.</p>
          <button class="answer-btn answer-btn-back" id="btn-back-to-setup">🏠 Về cài đặt</button>
        </div>
      `;
      document.body.appendChild(overlay);
    }
    overlay.classList.add('active');

    document.getElementById('btn-back-to-setup').addEventListener('click', () => {
      overlay.classList.remove('active');
      overlay.remove();
      // Return to setup screen
      document.getElementById('board-screen').classList.remove('active');
      document.getElementById('setup-screen').classList.add('active');
      gameState = null;
    });
  },

  /**
   * Shuffle an array using Fisher-Yates algorithm.
   */
  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

  /**
   * Wait for a given number of milliseconds.
   */
  _wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
};

// ===== QUESTION POPUP UI =====

/**
 * Show the question popup overlay with the given question.
 * Returns a Promise that resolves with { selected, correct, isCorrect } when the player answers.
 * @param {Object} question - question object from API
 * @returns {Promise<{selected: string, correct: string, isCorrect: boolean}>}
 */
function showQuestionPopup(question) {
  return new Promise((resolve) => {
    let overlay = document.getElementById('question-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'question-overlay';
      overlay.className = 'question-overlay';
      document.body.appendChild(overlay);
    }

    const options = [
      { key: 'a', text: question.option_a },
      { key: 'b', text: question.option_b },
      { key: 'c', text: question.option_c },
      { key: 'd', text: question.option_d },
    ];

    overlay.innerHTML = `
      <div class="question-card">
        <p class="question-text">${question.question_text}</p>
        <div class="answer-grid">
          ${options.map(opt => `
            <button class="answer-btn" data-answer="${opt.key}">
              <span class="answer-letter">${opt.key.toUpperCase()}</span>
              <span class="answer-text">${opt.text}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    overlay.classList.add('active');

    // Bind answer button clicks
    const buttons = overlay.querySelectorAll('.answer-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const selected = btn.dataset.answer;
        const correct = question.correct_answer;
        const isCorrect = selected === correct;

        // Highlight selected button
        btn.classList.add(isCorrect ? 'correct' : 'incorrect');

        // If wrong, also highlight the correct answer
        if (!isCorrect) {
          const correctBtn = overlay.querySelector(`.answer-btn[data-answer="${correct}"]`);
          if (correctBtn) correctBtn.classList.add('correct');
        }

        // Disable all buttons
        buttons.forEach(b => b.disabled = true);

        // Brief delay before closing
        setTimeout(() => {
          overlay.classList.remove('active');
          resolve({ selected, correct, isCorrect });
        }, isCorrect ? 800 : 1500);
      });
    });
  });
}

// ===== INIT ON DOM LOAD =====
document.addEventListener('DOMContentLoaded', () => {
  SetupManager.init();
});
