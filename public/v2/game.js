// === V2 GAME ENGINE ===
const ZONES = [
  { name: '🌱 Vườn Hoa', levels: 10, bg: '#90EE90' },
  { name: '🌳 Khu Rừng', levels: 10, bg: '#228B22' },
  { name: '🏔️ Núi Cao', levels: 10, bg: '#87CEEB' },
  { name: '🌋 Núi Lửa', levels: 10, bg: '#FF6B35' },
  { name: '🏰 Lâu Đài', levels: 10, bg: '#4a0e4e' },
];

const PLANTS = [
  { id: 'sunflower', emoji: '🌻', name: 'Hoa Hướng Dương', unlockLevel: 1, damage: 1 },
  { id: 'rose', emoji: '🌹', name: 'Hoa Hồng', unlockLevel: 10, damage: 2 },
  { id: 'cactus', emoji: '🌵', name: 'Xương Rồng', unlockLevel: 20, damage: 1, special: 'slow' },
  { id: 'mushroom', emoji: '🍄', name: 'Nấm', unlockLevel: 30, damage: 1, special: 'freeze' },
  { id: 'tree', emoji: '🌳', name: 'Cây Cổ Thụ', unlockLevel: 40, damage: 3 },
];

const ZOMBIE_TYPES = [
  { id: 'normal', emoji: '💀', hp: 1, speed: 1, name: 'Zombie' },
  { id: 'strong', emoji: '👹', hp: 3, speed: 0.8, name: 'Quỷ Đỏ' },
  { id: 'fast', emoji: '👻', hp: 1, speed: 2, name: 'Ma Tốc Độ' },
  { id: 'shield', emoji: '🦹', hp: 4, speed: 0.6, name: 'Giáp Sắt' },
  { id: 'boss', emoji: '🐉', hp: 8, speed: 0.4, name: 'Rồng Boss' },
];

// Game state
const G = {
  player: null,
  currentLevel: 1,
  maxLevel: 50,
  selectedPlant: 'sunflower',
  // Battle state
  battle: null,
  // Persistent (saved to localStorage)
  save: { name: '', level: 1, coins: 0, stars: {}, plants: ['sunflower'], powerups: { eliminate: 3, freeze: 2, double: 2 }, dailyDate: '', dailyProgress: [0, 0, 0], timerSpeed: 'normal' },
};

// === SAVE/LOAD ===
function saveGame() {
  localStorage.setItem('hocvui_v2', JSON.stringify(G.save));
  // Sync to server if profile exists
  const profile = JSON.parse(localStorage.getItem('hocvui_profile') || 'null');
  if (profile?.id) {
    fetch(`/api/players/${profile.id}/progress/v2`, {
      method: 'PUT', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ level: G.save.level, stars: G.save.stars, coins: G.save.coins, plants: G.save.plants, powerups: G.save.powerups }),
    }).catch(() => {});
  }
}
async function loadGame() {
  // Try load from server first
  const profile = JSON.parse(localStorage.getItem('hocvui_profile') || 'null');
  if (profile?.id) {
    try {
      const res = await fetch(`/api/players/${profile.id}/progress/v2`);
      const data = await res.json();
      if (data && data.level) {
        G.save = { ...G.save, ...data, name: profile.name };
        // Validate: level should not exceed highest completed level + 1
        const highestCompleted = Object.keys(G.save.stars).map(Number).filter(k => G.save.stars[k] > 0).sort((a, b) => b - a)[0] || 0;
        if (G.save.level > highestCompleted + 1) {
          G.save.level = highestCompleted + 1;
        }
        localStorage.setItem('hocvui_v2', JSON.stringify(G.save));
        return;
      }
    } catch {}
    // Server has no data for this player - start fresh (don't use stale localStorage)
    G.save.name = profile.name;
    return;
  }
  // No profile - try localStorage as last resort
  const local = localStorage.getItem('hocvui_v2');
  if (local) {
    const parsed = JSON.parse(local);
    // Only use if same player name
    const currentProfile = JSON.parse(localStorage.getItem('hocvui_profile') || 'null');
    if (currentProfile && parsed.name === currentProfile.name) {
      G.save = { ...G.save, ...parsed };
      // Validate level
      const highestCompleted = Object.keys(G.save.stars).map(Number).filter(k => G.save.stars[k] > 0).sort((a, b) => b - a)[0] || 0;
      if (G.save.level > highestCompleted + 1) {
        G.save.level = highestCompleted + 1;
      }
    }
  }
}

// === SCREENS ===
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// === SPLASH ===
document.getElementById('btn-play').addEventListener('click', () => {
  const name = document.getElementById('player-name').value.trim();
  if (!name) return;
  G.save.name = name;
  G.save.timerSpeed = document.getElementById('timer-speed').value;
  saveGame();
  enterMap();
});
document.getElementById('player-name').addEventListener('keypress', e => { if (e.key === 'Enter') document.getElementById('btn-play').click(); });

// Init
(async () => {
  // Verify profile exists in DB
  const profileRaw = localStorage.getItem('hocvui_profile');
  if (!profileRaw) {
    window.location.href = '/';
    return;
  }
  const profileCheck = JSON.parse(profileRaw);
  try {
    const verifyRes = await fetch(`/api/players?id=${profileCheck.id}`);
    const verifyData = await verifyRes.json();
    if (!verifyData || verifyData.error || !verifyData.id) {
      localStorage.removeItem('hocvui_profile');
      window.location.href = '/';
      return;
    }
    localStorage.setItem('hocvui_profile', JSON.stringify({ id: verifyData.id, name: verifyData.name }));
  } catch {
    // Network error - trust local
  }

  // Clear stale V2 data if version mismatch
  if (localStorage.getItem('hocvui_v2_ver') !== '4') {
    localStorage.removeItem('hocvui_v2');
    localStorage.setItem('hocvui_v2_ver', '4');
    // Also clear server progress and wait for it
    const profile = JSON.parse(localStorage.getItem('hocvui_profile') || 'null');
    if (profile?.id) {
      try {
        await fetch(`/api/players/${profile.id}/progress/v2`, {
          method: 'PUT', headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ level: 1, stars: {}, coins: 0, plants: ['sunflower'], powerups: { eliminate: 3, freeze: 2, double: 2 } }),
        });
      } catch {}
    }
  }

  await loadGame();
  // Auto-fill from profile if exists
  const profile = JSON.parse(localStorage.getItem('hocvui_profile') || 'null');
  if (profile?.name && !G.save.name) G.save.name = profile.name;

  if (G.save.name) {
    document.getElementById('player-name').value = G.save.name;
    enterMap();
  }
})();

// === WORLD MAP ===
function enterMap() {
  showScreen('map-screen');
  document.getElementById('player-display').textContent = `👤 ${G.save.name}`;
  document.getElementById('coins-display').textContent = `🪙 ${G.save.coins}`;
  const totalStars = Object.values(G.save.stars).reduce((a, b) => a + b, 0);
  document.getElementById('stars-total').textContent = `⭐ ${totalStars}`;
  renderMap();
  renderPlantSelector();
}

function renderMap() {
  const map = document.getElementById('world-map');
  map.innerHTML = '';
  let levelNum = 0;

  ZONES.forEach((zone, zi) => {
    const zoneEl = document.createElement('div');
    zoneEl.className = 'map-zone';
    zoneEl.innerHTML = `<div class="zone-title">${zone.name}</div><div class="zone-levels"></div>`;
    const levelsEl = zoneEl.querySelector('.zone-levels');

    for (let i = 0; i < zone.levels; i++) {
      levelNum++;
      const isBoss = (i === zone.levels - 1);
      const stars = G.save.stars[levelNum] || 0;
      const isCompleted = stars > 0;
      const isCurrent = levelNum === G.save.level;
      const isLocked = levelNum > G.save.level;

      const node = document.createElement('div');
      node.className = `level-node ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isLocked ? 'locked' : ''} ${isBoss ? 'boss' : ''}`;
      node.textContent = isBoss ? '👑' : levelNum;
      if (isCompleted) node.innerHTML += `<div class="level-stars">${'⭐'.repeat(stars)}</div>`;

      if (!isLocked) {
        node.addEventListener('click', () => startLevel(levelNum));
      }
      levelsEl.appendChild(node);
    }
    map.appendChild(zoneEl);
  });

  // Scroll to current level
  setTimeout(() => {
    const current = map.querySelector('.level-node.current');
    if (current) current.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
}

function renderPlantSelector() {
  const sel = document.getElementById('plant-selector');
  sel.innerHTML = PLANTS.map(p => {
    const unlocked = G.save.plants.includes(p.id);
    const selected = G.selectedPlant === p.id;
    return `<div class="plant-item ${selected ? 'selected' : ''} ${!unlocked ? 'locked' : ''}" 
      data-plant="${p.id}" title="${p.name} ${!unlocked ? '(Level ' + p.unlockLevel + ')' : ''}">
      ${p.emoji}
    </div>`;
  }).join('');

  sel.querySelectorAll('.plant-item:not(.locked)').forEach(el => {
    el.addEventListener('click', () => {
      G.selectedPlant = el.dataset.plant;
      renderPlantSelector();
    });
  });
}

// === BATTLE ENGINE ===
function startLevel(level) {
  G.currentLevel = level;
  const zone = getZone(level);
  const localLevel = level - getZoneStartLevel(zone);
  const isBoss = (localLevel === ZONES[zone].levels - 1);

  // Determine difficulty mix based on level
  const difficulty = level <= 10 ? 'easy' : level <= 30 ? 'medium' : 'hard';
  const questionsNeeded = isBoss ? 8 : 5;

  G.battle = {
    level, zone, isBoss, difficulty,
    hp: 3,
    score: 0,
    combo: 0,
    maxCombo: 0,
    correct: 0,
    total: 0,
    zombies: [],
    currentZombie: null,
    questions: [],
    qIndex: 0,
    timer: null,
    timeLeft: 100,
    frozen: false,
    doubleNext: false,
  };

  // Setup UI
  document.getElementById('level-label').textContent = `Level ${level}`;
  document.getElementById('zone-label').textContent = ZONES[zone].name;
  document.getElementById('hp-display').textContent = `❤️ ${G.battle.hp}`;
  document.getElementById('battle-score').textContent = `💰 0`;
  document.getElementById('active-plant').textContent = PLANTS.find(p => p.id === G.selectedPlant).emoji;
  updatePowerupUI();

  showScreen('battle-screen');
  fetchAndStartBattle(difficulty, questionsNeeded);
}

async function fetchAndStartBattle(difficulty, count) {
  // Mix subjects
  const mathCount = Math.ceil(count * 0.6);
  const vietCount = count - mathCount;

  try {
    const [mathRes, vietRes] = await Promise.all([
      fetch(`/api/questions?subject=math&difficulty=${difficulty}&limit=${mathCount}`),
      fetch(`/api/questions?subject=vietnamese&difficulty=${vietCount > 0 ? difficulty : 'easy'}&limit=${vietCount}`),
    ]);
    const mathQs = await mathRes.json();
    const vietQs = await vietRes.json();
    G.battle.questions = shuffle([...mathQs, ...vietQs]);
  } catch {
    G.battle.questions = generateFallback(count);
  }

  if (G.battle.questions.length === 0) G.battle.questions = generateFallback(count);

  // Spawn zombies
  spawnZombies();
  nextZombie();
}

function spawnZombies() {
  const level = G.battle.level;
  const count = G.battle.questions.length;

  G.battle.zombies = G.battle.questions.map((_, i) => {
    let type;
    if (G.battle.isBoss && i === count - 1) {
      type = ZOMBIE_TYPES[4]; // boss
    } else if (level > 30 && Math.random() < 0.3) {
      type = ZOMBIE_TYPES[1]; // strong
    } else if (level > 20 && Math.random() < 0.2) {
      type = ZOMBIE_TYPES[2]; // fast
    } else {
      type = ZOMBIE_TYPES[0]; // normal
    }
    return { ...type, currentHp: type.hp, position: 0, alive: true };
  });

  document.getElementById('wave-display').textContent = `👾 1/${count}`;
}

function nextZombie() {
  const idx = G.battle.zombies.findIndex(z => z.alive);
  if (idx === -1) { winLevel(); return; }

  G.battle.currentZombie = G.battle.zombies[idx];
  renderZombie();
  showQuestion();
}

// === ZOMBIE RENDERING ===
function renderZombie() {
  const container = document.getElementById('zombies-container');
  const z = G.battle.currentZombie;
  container.innerHTML = `
    <div class="zombie-entity" id="active-zombie" style="right:${z.position}%">
      ${z.hp > 1 ? `<div class="zombie-hp"><div class="zombie-hp-fill" style="width:${100 * z.currentHp / z.hp}%"></div></div>` : ''}
      ${z.emoji}
    </div>
  `;
}

function animateZombieHit() {
  const el = document.getElementById('active-zombie');
  if (el) { el.classList.add('hit'); setTimeout(() => el.classList.remove('hit'), 300); }
}

function animateZombieDead() {
  const el = document.getElementById('active-zombie');
  if (el) el.classList.add('dead');
}

function moveZombieCloser() {
  G.battle.currentZombie.position += 15;
  const el = document.getElementById('active-zombie');
  if (el) el.style.right = Math.min(G.battle.currentZombie.position, 80) + '%';

  if (G.battle.currentZombie.position >= 80) {
    G.battle.hp--;
    document.getElementById('hp-display').textContent = `❤️ ${G.battle.hp}`;
    if (G.battle.hp <= 0) { loseLevel(); return; }
    // Reset zombie position
    G.battle.currentZombie.position = 0;
    if (el) el.style.right = '0%';
    playSound('wrong');
  }
}

// === QUESTION FLOW ===
function showQuestion() {
  if (G.battle.qIndex >= G.battle.questions.length) { winLevel(); return; }

  const q = G.battle.questions[G.battle.qIndex];
  const badge = document.getElementById('q-type-badge');
  badge.textContent = q.subject === 'math' ? '🔢 Toán' : '📖 Tiếng Việt';

  document.getElementById('q-text').textContent = q.question_text;
  const btns = document.querySelectorAll('.q-btn');
  btns[0].textContent = `A. ${q.option_a}`;
  btns[1].textContent = `B. ${q.option_b}`;
  btns[2].textContent = `C. ${q.option_c}`;
  btns[3].textContent = `D. ${q.option_d}`;
  btns.forEach(b => { b.className = 'q-btn'; b.disabled = false; });

  G.battle.questionStart = Date.now();
  startTimer();
}

function startTimer() {
  G.battle.timeLeft = 100;
  const fill = document.querySelector('.q-timer-fill');
  fill.style.width = '100%';
  fill.className = 'q-timer-fill';

  clearInterval(G.battle.timer);
  const speedMultiplier = G.save.timerSpeed === 'slow' ? 1.5 : G.save.timerSpeed === 'fast' ? 0.6 : 1;
  const baseSpeed = G.battle.frozen ? 300 : G.battle.level > 30 ? 120 : G.battle.level > 15 ? 150 : 200;
  const speed = Math.round(baseSpeed * speedMultiplier);

  G.battle.timer = setInterval(() => {
    G.battle.timeLeft -= 1;
    fill.style.width = G.battle.timeLeft + '%';
    if (G.battle.timeLeft <= 20) fill.className = 'q-timer-fill danger';
    else if (G.battle.timeLeft <= 50) fill.className = 'q-timer-fill warn';

    if (G.battle.timeLeft <= 0) {
      clearInterval(G.battle.timer);
      handleWrong(null);
    }
  }, speed);
}

// === ANSWER HANDLING ===
document.querySelectorAll('.q-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.disabled || btn.classList.contains('eliminated')) return;
    clearInterval(G.battle.timer);

    const q = G.battle.questions[G.battle.qIndex];
    const selected = btn.dataset.opt;
    const isCorrect = selected === q.correct_answer;

    document.querySelectorAll('.q-btn').forEach(b => b.disabled = true);

    if (isCorrect) {
      btn.classList.add('correct');
      handleCorrect(q);
    } else {
      btn.classList.add('wrong');
      document.querySelectorAll('.q-btn').forEach(b => {
        if (b.dataset.opt === q.correct_answer) b.classList.add('correct');
      });
      handleWrong(selected);
    }

    // Log answer
    logAnswer(q, selected, isCorrect);

    G.battle.total++;
    G.battle.qIndex++;
    document.getElementById('wave-display').textContent = `👾 ${G.battle.qIndex}/${G.battle.questions.length}`;

    setTimeout(() => {
      const z = G.battle.currentZombie;
      if (!z.alive) {
        animateZombieDead();
        setTimeout(() => nextZombie(), 400);
      } else {
        showQuestion();
      }
    }, 1200);
  });
});

function handleCorrect(q) {
  G.battle.combo++;
  G.battle.maxCombo = Math.max(G.battle.maxCombo, G.battle.combo);
  G.battle.correct++;

  const plant = PLANTS.find(p => p.id === G.selectedPlant);
  let damage = plant.damage;
  if (G.battle.doubleNext) { damage *= 2; G.battle.doubleNext = false; }

  // Damage zombie
  G.battle.currentZombie.currentHp -= damage;
  if (G.battle.currentZombie.currentHp <= 0) {
    G.battle.currentZombie.alive = false;
  }

  // Score
  const bonus = G.battle.combo * 5 + Math.floor(G.battle.timeLeft / 10);
  G.battle.score += 10 + bonus;
  document.getElementById('battle-score').textContent = `💰 ${G.battle.score}`;

  // Effects
  playSound('correct');
  shootProjectile();
  animateZombieHit();
  renderZombie(); // update HP bar

  if (G.battle.combo >= 3) showCombo();
}

function handleWrong(selected) {
  G.battle.combo = 0;
  moveZombieCloser();
  playSound('wrong');
  document.querySelector('.battlefield').classList.add('damage-flash');
  setTimeout(() => document.querySelector('.battlefield').classList.remove('damage-flash'), 200);
}

function showCombo() {
  const popup = document.createElement('div');
  popup.className = 'combo-popup';
  popup.textContent = `🔥 x${G.battle.combo}!`;
  document.querySelector('.battle-arena').appendChild(popup);
  setTimeout(() => popup.remove(), 1000);
  if (G.battle.combo >= 5) playSound('combo');
}

function shootProjectile() {
  const container = document.getElementById('projectiles-container');
  const z = G.battle.currentZombie;
  const targetLeft = 'calc(' + (100 - (z ? z.position : 0) - 15) + '% - 20px)';

  const proj = document.createElement('div');
  proj.className = 'projectile';
  proj.textContent = '☄️';
  proj.style.left = '0%';
  proj.style.setProperty('--ztarget', targetLeft);
  proj.style.animation = 'projFly 0.5s forwards';
  container.appendChild(proj);
  playSound('shoot');

  // After reaching zombie → explode at position
  setTimeout(() => {
    proj.style.left = targetLeft;
    proj.textContent = '💥';
    proj.style.animation = 'projExplode 0.4s forwards';
    setTimeout(() => proj.remove(), 400);
  }, 500);
}

// === WIN / LOSE ===
function winLevel() {
  clearInterval(G.battle.timer);
  const pct = G.battle.correct / G.battle.total;
  const stars = pct >= 0.9 ? 3 : pct >= 0.7 ? 2 : 1;
  const coins = G.battle.score + (stars * 10);

  // Save progress
  const prevStars = G.save.stars[G.currentLevel] || 0;
  G.save.stars[G.currentLevel] = Math.max(prevStars, stars);
  if (G.currentLevel >= G.save.level) G.save.level = Math.min(G.currentLevel + 1, G.maxLevel);
  G.save.coins += coins;

  // Check plant unlock
  let unlockMsg = '';
  PLANTS.forEach(p => {
    if (p.unlockLevel === G.currentLevel + 1 && !G.save.plants.includes(p.id)) {
      G.save.plants.push(p.id);
      unlockMsg = `🎁 Mở khóa: ${p.emoji} ${p.name}!`;
    }
  });

  saveGame();
  updateDailyProgress(G.battle.correct, G.battle.maxCombo, pct >= 1);

  // UI
  document.getElementById('complete-title').textContent = stars === 3 ? '🏆 Xuất sắc!' : stars === 2 ? '👏 Giỏi lắm!' : '👍 Qua level!';
  document.getElementById('complete-stars').textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
  document.getElementById('cs-correct').textContent = `${G.battle.correct}/${G.battle.total}`;
  document.getElementById('cs-combo').textContent = G.battle.maxCombo;
  document.getElementById('cs-coins').textContent = `+${coins} 🪙`;

  const unlockEl = document.getElementById('complete-unlock');
  if (unlockMsg) { unlockEl.textContent = unlockMsg; unlockEl.classList.remove('hidden'); }
  else { unlockEl.classList.add('hidden'); }

  // Celebration effect
  if (stars === 3) { showCelebration('🏆 Hoàn hảo!'); }
  else if (stars >= 2) { playSound('celebrate'); }
  else { playSound('win'); }
  showScreen('complete-screen');
}

function loseLevel() {
  clearInterval(G.battle.timer);
  playSound('gameover');
  showScreen('gameover-screen');
}

// Navigation
document.getElementById('btn-next-level').addEventListener('click', () => {
  if (G.currentLevel < G.maxLevel) startLevel(G.currentLevel + 1);
  else enterMap();
});
document.getElementById('btn-back-map').addEventListener('click', enterMap);
document.getElementById('btn-back-map2').addEventListener('click', enterMap);
document.getElementById('btn-retry').addEventListener('click', () => startLevel(G.currentLevel));

// === POWER-UPS ===
function updatePowerupUI() {
  document.querySelector('#pu-eliminate .pu-count').textContent = G.save.powerups.eliminate;
  document.querySelector('#pu-freeze .pu-count').textContent = G.save.powerups.freeze;
  document.querySelector('#pu-double .pu-count').textContent = G.save.powerups.double;
}

document.getElementById('pu-eliminate').addEventListener('click', () => {
  if (G.save.powerups.eliminate <= 0) return;
  const q = G.battle.questions[G.battle.qIndex];
  const btns = [...document.querySelectorAll('.q-btn')];
  const wrongBtns = btns.filter(b => b.dataset.opt !== q.correct_answer && !b.classList.contains('eliminated'));
  if (wrongBtns.length > 0) {
    wrongBtns[Math.floor(Math.random() * wrongBtns.length)].classList.add('eliminated');
    G.save.powerups.eliminate--;
    updatePowerupUI();
    saveGame();
  }
});

document.getElementById('pu-freeze').addEventListener('click', () => {
  if (G.save.powerups.freeze <= 0 || G.battle.frozen) return;
  G.battle.frozen = true;
  G.save.powerups.freeze--;
  updatePowerupUI();
  saveGame();
  // Slow timer for 5 seconds
  setTimeout(() => { G.battle.frozen = false; }, 5000);
});

document.getElementById('pu-double').addEventListener('click', () => {
  if (G.save.powerups.double <= 0) return;
  G.battle.doubleNext = true;
  G.save.powerups.double--;
  updatePowerupUI();
  saveGame();
});

// === DAILY QUESTS ===
function getDailyQuests() {
  return [
    { text: 'Trả lời đúng 15 câu', target: 15, icon: '✅' },
    { text: 'Combo 5 liên tiếp', target: 5, icon: '🔥' },
    { text: 'Hoàn thành 1 level không sai', target: 1, icon: '💯' },
  ];
}

function updateDailyProgress(correct, maxCombo, perfect) {
  const today = new Date().toDateString();
  if (G.save.dailyDate !== today) { G.save.dailyDate = today; G.save.dailyProgress = [0, 0, 0]; }
  G.save.dailyProgress[0] += correct;
  G.save.dailyProgress[1] = Math.max(G.save.dailyProgress[1], maxCombo);
  if (perfect) G.save.dailyProgress[2]++;
  saveGame();
}

document.getElementById('btn-daily').addEventListener('click', () => {
  const quests = getDailyQuests();
  const today = new Date().toDateString();
  if (G.save.dailyDate !== today) { G.save.dailyDate = today; G.save.dailyProgress = [0, 0, 0]; }

  document.getElementById('daily-quests').innerHTML = quests.map((q, i) => {
    const progress = G.save.dailyProgress[i] || 0;
    const done = progress >= q.target;
    return `<div class="quest-item ${done ? 'done' : ''}">
      <span>${q.icon}</span>
      <span>${q.text}</span>
      <span class="quest-progress">${Math.min(progress, q.target)}/${q.target}</span>
    </div>`;
  }).join('');

  document.getElementById('daily-modal').classList.remove('hidden');
});
document.getElementById('close-daily').addEventListener('click', () => {
  document.getElementById('daily-modal').classList.add('hidden');
});

// === UTILITIES ===
function getZone(level) { let acc = 0; for (let i = 0; i < ZONES.length; i++) { acc += ZONES[i].levels; if (level <= acc) return i; } return ZONES.length - 1; }
function getZoneStartLevel(zoneIdx) { let acc = 0; for (let i = 0; i < zoneIdx; i++) acc += ZONES[i].levels; return acc; }
function shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

// === AUDIO ===
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;
function initAudio() { if (!audioCtx) audioCtx = new AudioCtx(); }

function showCelebration(text) {
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;pointer-events:none;animation:celebFade 2.5s forwards;';
  el.innerHTML = `<div style="text-align:center"><div style="font-size:3rem;animation:celebBounce 0.6s infinite alternate">🎉🎊👏✨🌟</div><div style="font-size:1.8rem;font-weight:900;color:#FFD700;text-shadow:2px 2px 8px rgba(0,0,0,0.5);margin-top:10px">${text}</div></div>`;
  if (!document.getElementById('celeb-style')) {
    const s = document.createElement('style');
    s.id = 'celeb-style';
    s.textContent = '@keyframes celebFade{0%{opacity:0}10%{opacity:1}80%{opacity:1}100%{opacity:0}}@keyframes celebBounce{from{transform:scale(1) rotate(-3deg)}to{transform:scale(1.2) rotate(3deg)}}';
    document.head.appendChild(s);
  }
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

function playSound(type) {
  try {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    switch (type) {
      case 'correct':
        osc.frequency.setValueAtTime(523, audioCtx.currentTime);
        osc.frequency.setValueAtTime(784, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start(); osc.stop(audioCtx.currentTime + 0.3); break;
      case 'wrong':
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.type = 'sawtooth';
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.start(); osc.stop(audioCtx.currentTime + 0.25); break;
      case 'shoot':
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.1);
        osc.type = 'square';
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start(); osc.stop(audioCtx.currentTime + 0.1); break;
      case 'combo':
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc.frequency.setValueAtTime(1319, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start(); osc.stop(audioCtx.currentTime + 0.3); break;
      case 'win':
        [523, 659, 784, 1047].forEach((f, i) => {
          const o = audioCtx.createOscillator(), g = audioCtx.createGain();
          o.connect(g); g.connect(audioCtx.destination);
          o.frequency.setValueAtTime(f, audioCtx.currentTime + i * 0.12);
          g.gain.setValueAtTime(0.2, audioCtx.currentTime + i * 0.12);
          g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.12 + 0.25);
          o.start(audioCtx.currentTime + i * 0.12); o.stop(audioCtx.currentTime + i * 0.12 + 0.25);
        }); break;
      case 'gameover':
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.setValueAtTime(150, audioCtx.currentTime + 0.3);
        osc.type = 'sawtooth';
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.start(); osc.stop(audioCtx.currentTime + 0.5); break;
      case 'celebrate':
        [523, 659, 784, 1047, 1319].forEach((f, i) => {
          const o = audioCtx.createOscillator(), g = audioCtx.createGain();
          o.connect(g); g.connect(audioCtx.destination);
          o.type = i % 2 === 0 ? 'triangle' : 'sine';
          o.frequency.setValueAtTime(f, audioCtx.currentTime + i * 0.12);
          g.gain.setValueAtTime(0.25, audioCtx.currentTime + i * 0.12);
          g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.12 + 0.35);
          o.start(audioCtx.currentTime + i * 0.12); o.stop(audioCtx.currentTime + i * 0.12 + 0.35);
        }); break;
    }
  } catch (e) {}
}

// === ANSWER LOGGING ===
async function logAnswer(question, selected, isCorrect) {
  if (!question.id) return;
  try {
    await fetch('/api/answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: 0, player_id: 0, question_id: question.id,
        selected_answer: selected || 'timeout', correct_answer: question.correct_answer,
        is_correct: isCorrect, time_spent_ms: Date.now() - (G.battle.questionStart || Date.now()),
      }),
    });
  } catch {}
}

// === FALLBACK QUESTIONS ===
function generateFallback(count) {
  const qs = [];
  for (let i = 0; i < count; i++) {
    const a = Math.floor(Math.random() * 15) + 3;
    const b = Math.floor(Math.random() * 10) + 1;
    const answer = a + b;
    const opts = [answer, answer + 1, answer - 1, answer + 2].sort(() => Math.random() - 0.5);
    const correct = ['a', 'b', 'c', 'd'][opts.indexOf(answer)];
    qs.push({ question_text: `${a} + ${b} = ?`, option_a: String(opts[0]), option_b: String(opts[1]), option_c: String(opts[2]), option_d: String(opts[3]), correct_answer: correct, subject: 'math' });
  }
  return qs;
}

// EXIT BATTLE with custom popup
document.getElementById('btn-exit-battle').addEventListener('click', () => {
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.innerHTML = `
    <div class="confirm-box">
      <div class="confirm-icon">😢</div>
      <div class="confirm-text">Bạn có muốn thoát\ntrò chơi không?</div>
      <div class="confirm-btns">
        <button class="confirm-btn confirm-btn-yes">Thoát</button>
        <button class="confirm-btn confirm-btn-no">Chơi tiếp</button>
      </div>
    </div>
  `;
  // Inject CSS if not exists
  if (!document.getElementById('confirm-style')) {
    const s = document.createElement('style'); s.id = 'confirm-style';
    s.textContent = `.confirm-overlay{position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.6);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;animation:fadeIn .2s}@keyframes fadeIn{from{opacity:0}to{opacity:1}}.confirm-box{background:#fff;border-radius:20px;padding:30px 25px;text-align:center;max-width:300px;width:85%;box-shadow:0 20px 50px rgba(0,0,0,.3);animation:popIn .3s}@keyframes popIn{from{transform:scale(.8);opacity:0}to{transform:scale(1);opacity:1}}.confirm-icon{font-size:3rem;margin-bottom:10px}.confirm-text{font-size:1.15rem;font-weight:700;color:#333;margin-bottom:20px;line-height:1.4}.confirm-btns{display:flex;gap:10px}.confirm-btn{flex:1;padding:14px;border:none;border-radius:12px;font-size:1.05rem;font-weight:700;cursor:pointer}.confirm-btn:active{transform:scale(.95)}.confirm-btn-yes{background:#f44336;color:#fff}.confirm-btn-no{background:#e8e8e8;color:#333}`;
    document.head.appendChild(s);
  }
  document.body.appendChild(overlay);
  overlay.querySelector('.confirm-btn-yes').addEventListener('click', () => { overlay.remove(); clearInterval(G.battle?.timer); window.location.href = '/'; });
  overlay.querySelector('.confirm-btn-no').addEventListener('click', () => overlay.remove());
});
