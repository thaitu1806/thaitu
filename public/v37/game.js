// V37 - Vận Động Viên (Athlete - Mini Olympics)
(function() {
'use strict';

const STORAGE_KEY = 'v37_athlete';
const TIMER_SECONDS = 10;
const QUESTIONS_PER_EVENT = 5;

const EVENTS = [
  { emoji: '🏃', name: 'Chạy 100m', unit: 'giây', goodIsLow: true },
  { emoji: '🤸', name: 'Nhảy xa', unit: 'mét', goodIsLow: false },
  { emoji: '🏊', name: 'Bơi 50m', unit: 'giây', goodIsLow: true },
  { emoji: '🎯', name: 'Bắn cung', unit: 'điểm', goodIsLow: false },
  { emoji: '🚴', name: 'Xe đạp', unit: 'giây', goodIsLow: true }
];

const COUNTRIES = [
  { code: 'vn', flag: '🇻🇳', name: 'Bạn' },
  { code: 'jp', flag: '🇯🇵', name: 'JP' },
  { code: 'us', flag: '🇺🇸', name: 'US' },
  { code: 'kr', flag: '🇰🇷', name: 'KR' }
];

let bestMedals = 0;
let questions = [];
let questionIndex = 0;
let currentEvent = 0;
let correctThisEvent = 0;
let answeredThisEvent = 0;
let totalCorrect = 0;
let totalAnswered = 0;
let timer = null;
let timeLeft = 0;

// Results per event per country: [gold, silver, bronze, none]
let eventResults = []; // [{vn: score, jp: score, us: score, kr: score}]
let medals = { vn: { gold: 0, silver: 0, bronze: 0 }, jp: { gold: 0, silver: 0, bronze: 0 }, us: { gold: 0, silver: 0, bronze: 0 }, kr: { gold: 0, silver: 0, bronze: 0 } };

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      bestMedals = data.bestMedals || 0;
    }
  } catch(e) {}
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ bestMedals }));
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function init() {
  loadData();
  document.getElementById('high-medals').textContent = bestMedals;
  document.getElementById('btn-start').onclick = startGame;
  document.getElementById('btn-replay').onclick = startGame;
  document.getElementById('btn-next-event').onclick = nextEvent;
}

async function startGame() {
  try {
    const profile = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
    const grade = profile.grade ?? 2;
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
  currentEvent = 0;
  questionIndex = 0;
  correctThisEvent = 0;
  answeredThisEvent = 0;
  totalCorrect = 0;
  totalAnswered = 0;
  eventResults = [];
  medals = { vn: { gold: 0, silver: 0, bronze: 0 }, jp: { gold: 0, silver: 0, bronze: 0 }, us: { gold: 0, silver: 0, bronze: 0 }, kr: { gold: 0, silver: 0, bronze: 0 } };

  showScreen('game-screen');
  startEvent();
}

function startEvent() {
  correctThisEvent = 0;
  answeredThisEvent = 0;
  updateEventUI();
  updateBars(0);
  showQuestion();
}

function updateEventUI() {
  const ev = EVENTS[currentEvent];
  document.getElementById('event-label').textContent = `${ev.emoji} ${ev.name}`;
  document.getElementById('event-num').textContent = currentEvent + 1;
  document.getElementById('q-num').textContent = 1;
}

function updateBars(playerProgress) {
  // Player bar shows progress during event
  const pct = (playerProgress / QUESTIONS_PER_EVENT) * 100;
  document.getElementById('bar-vn').style.width = pct + '%';

  // Bots show random partial progress (cosmetic only during questions)
  document.getElementById('bar-jp').style.width = (Math.random() * 60 + 20) + '%';
  document.getElementById('bar-us').style.width = (Math.random() * 60 + 20) + '%';
  document.getElementById('bar-kr').style.width = (Math.random() * 60 + 20) + '%';
}

function showQuestion() {
  if (questionIndex >= questions.length) {
    finishEvent();
    return;
  }

  document.getElementById('q-num').textContent = answeredThisEvent + 1;

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

  document.getElementById('question-box').style.display = 'block';
  document.getElementById('event-result').style.display = 'none';
  startTimer();
}

function handleAnswer(selected, correct) {
  clearInterval(timer);
  const btns = document.querySelectorAll('.option-btn');
  btns.forEach(b => b.classList.add('disabled'));

  const isCorrect = selected.toLowerCase() === correct.toLowerCase();
  totalAnswered++;
  answeredThisEvent++;

  const q = questions[questionIndex];
  btns.forEach(b => {
    const correctText = q[`option_${correct.toLowerCase()}`];
    if (b.textContent === correctText) b.classList.add('correct');
    if (!isCorrect && b.textContent === q[`option_${selected.toLowerCase()}`]) b.classList.add('wrong');
  });

  questionIndex++;

  if (isCorrect) {
    totalCorrect++;
    correctThisEvent++;
    updateBars(correctThisEvent);
  }

  setTimeout(() => {
    if (answeredThisEvent >= QUESTIONS_PER_EVENT) {
      finishEvent();
    } else {
      showQuestion();
    }
  }, 800);
}

function handleTimeout() {
  const btns = document.querySelectorAll('.option-btn');
  btns.forEach(b => b.classList.add('disabled'));
  totalAnswered++;
  answeredThisEvent++;

  const q = questions[questionIndex];
  btns.forEach(b => {
    const correctText = q[`option_${q.correct_answer.toLowerCase()}`];
    if (b.textContent === correctText) b.classList.add('correct');
  });

  questionIndex++;

  setTimeout(() => {
    if (answeredThisEvent >= QUESTIONS_PER_EVENT) {
      finishEvent();
    } else {
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

function finishEvent() {
  clearInterval(timer);

  // Generate bot scores (0-5 correct equivalent)
  const botScores = {
    jp: Math.floor(Math.random() * 4) + 1, // 1-4
    us: Math.floor(Math.random() * 4) + 1,
    kr: Math.floor(Math.random() * 4) + 1
  };

  const scores = {
    vn: correctThisEvent,
    jp: botScores.jp,
    us: botScores.us,
    kr: botScores.kr
  };

  eventResults.push(scores);

  // Update final bars
  document.getElementById('bar-vn').style.width = (scores.vn / 5 * 100) + '%';
  document.getElementById('bar-jp').style.width = (scores.jp / 5 * 100) + '%';
  document.getElementById('bar-us').style.width = (scores.us / 5 * 100) + '%';
  document.getElementById('bar-kr').style.width = (scores.kr / 5 * 100) + '%';

  // Determine rankings for this event
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  // Handle ties - give same medal to tied athletes
  const rankings = assignMedals(sorted);

  rankings.forEach(({ code, medal }) => {
    if (medal === 'gold') medals[code].gold++;
    else if (medal === 'silver') medals[code].silver++;
    else if (medal === 'bronze') medals[code].bronze++;
  });

  // Show event result
  const playerMedal = rankings.find(r => r.code === 'vn')?.medal || 'none';
  showEventResult(playerMedal);
}

function assignMedals(sorted) {
  const results = [];
  let currentRank = 0;
  let prevScore = -1;

  sorted.forEach(([code, score], index) => {
    if (score !== prevScore) {
      currentRank = index;
      prevScore = score;
    }

    let medal = 'none';
    if (currentRank === 0 && score > 0) medal = 'gold';
    else if (currentRank === 1 && score > 0) medal = 'silver';
    else if (currentRank === 2 && score > 0) medal = 'bronze';

    results.push({ code, score, medal });
  });

  return results;
}

function showEventResult(playerMedal) {
  const resultDiv = document.getElementById('event-result');
  const iconDiv = document.getElementById('event-result-icon');
  const textDiv = document.getElementById('event-result-text');

  let icon, text;
  switch (playerMedal) {
    case 'gold': icon = '🥇'; text = 'Huy chương vàng!'; break;
    case 'silver': icon = '🥈'; text = 'Huy chương bạc!'; break;
    case 'bronze': icon = '🥉'; text = 'Huy chương đồng!'; break;
    default: icon = '😅'; text = 'Chưa có huy chương...'; break;
  }

  iconDiv.textContent = icon;
  textDiv.textContent = `${EVENTS[currentEvent].emoji} ${EVENTS[currentEvent].name}: ${text}`;

  document.getElementById('question-box').style.display = 'none';
  resultDiv.style.display = 'flex';

  // Change button text if last event
  const nextBtn = document.getElementById('btn-next-event');
  if (currentEvent >= EVENTS.length - 1) {
    nextBtn.textContent = '🏆 Xem Kết Quả!';
  } else {
    nextBtn.textContent = 'Môn tiếp theo ➡️';
  }
}

function nextEvent() {
  currentEvent++;
  if (currentEvent >= EVENTS.length) {
    endGame();
  } else {
    startEvent();
  }
}

function endGame() {
  showScreen('result-screen');

  // Calculate total medals score for ranking
  const totalScore = (code) => medals[code].gold * 3 + medals[code].silver * 2 + medals[code].bronze;
  const rankings = COUNTRIES.map(c => ({
    ...c,
    score: totalScore(c.code),
    medals: medals[c.code]
  })).sort((a, b) => {
    if (b.medals.gold !== a.medals.gold) return b.medals.gold - a.medals.gold;
    if (b.medals.silver !== a.medals.silver) return b.medals.silver - a.medals.silver;
    return b.medals.bronze - a.medals.bronze;
  });

  // Build podium
  renderPodium(rankings);

  // Build medal tally
  renderMedalTally(rankings);

  // Player stats
  const playerRank = rankings.findIndex(r => r.code === 'vn') + 1;
  const playerMedals = medals.vn;
  const totalPlayerMedals = playerMedals.gold + playerMedals.silver + playerMedals.bronze;
  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  if (totalPlayerMedals > bestMedals) {
    bestMedals = totalPlayerMedals;
    saveData();
    document.getElementById('result-title').textContent = '🎉 Kỷ Lục Mới!';
  } else {
    document.getElementById('result-title').textContent = playerRank === 1 ? '🏆 Vô Địch!' : '🏟️ Kết Quả Olympic!';
  }

  document.getElementById('result-detail').innerHTML = `
    🇻🇳 Xếp hạng: #${playerRank}/4<br>
    ✅ Đúng: ${totalCorrect}/${totalAnswered} (${accuracy}%)<br>
    🥇 Vàng: ${playerMedals.gold} | 🥈 Bạc: ${playerMedals.silver} | 🥉 Đồng: ${playerMedals.bronze}<br>
    🏅 Tổng huy chương: ${totalPlayerMedals}
  `;

  spawnConfetti();
  saveSession();

  if (typeof checkAndShowPrompt === 'function') {
    checkAndShowPrompt();
  }
}

function renderPodium(rankings) {
  const podiumDiv = document.getElementById('podium');
  podiumDiv.innerHTML = '';

  // Show top 3 in podium order: 2nd, 1st, 3rd
  const podiumOrder = [rankings[1], rankings[0], rankings[2]];
  const classes = ['silver', 'gold', 'bronze'];
  const positions = ['2', '1', '3'];

  podiumOrder.forEach((r, i) => {
    if (!r) return;
    const place = document.createElement('div');
    place.className = 'podium-place';
    place.innerHTML = `
      <span class="podium-flag">${r.flag}</span>
      <span class="podium-medal">${i === 1 ? '🥇' : i === 0 ? '🥈' : '🥉'}</span>
      <div class="podium-bar ${classes[i]}">${positions[i]}</div>
    `;
    podiumDiv.appendChild(place);
  });
}

function renderMedalTally(rankings) {
  const tallyDiv = document.getElementById('medal-tally');
  tallyDiv.innerHTML = '';

  rankings.forEach(r => {
    const row = document.createElement('div');
    row.className = 'tally-row';
    row.innerHTML = `
      <span class="tally-country">${r.flag} ${r.name}</span>
      <span class="tally-medals">
        <span>🥇${r.medals.gold}</span>
        <span>🥈${r.medals.silver}</span>
        <span>🥉${r.medals.bronze}</span>
      </span>
    `;
    tallyDiv.appendChild(row);
  });
}

function spawnConfetti() {
  const container = document.getElementById('confetti');
  container.innerHTML = '';
  const colors = ['#fbbf24', '#f59e0b', '#22c55e', '#ef4444', '#3b82f6', '#a855f7'];
  for (let i = 0; i < 30; i++) {
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
    const playerMedals = medals.vn;
    const totalPlayerMedals = playerMedals.gold + playerMedals.silver + playerMedals.bronze;
    await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: profile.id,
        subject: 'mixed',
        difficulty: 'easy',
        score: totalPlayerMedals * 10 + totalCorrect,
        total_questions: totalAnswered,
        correct_answers: totalCorrect,
        stars_earned: playerMedals.gold * 3 + playerMedals.silver * 2 + playerMedals.bronze,
        combo_max: playerMedals.gold,
        mode: 'v37'
      })
    });
  } catch(e) {}
}

init();

})();

// ===== CHARACTER SYSTEM INTEGRATION (presentation only, additive) =====
// V37's game logic lives in a private IIFE above. This block adds animated
// athlete sprites, particle effects and styled modals WITHOUT touching any
// existing logic — it observes the DOM the logic already updates.
(function () {
  'use strict';

  const C = window.HocVuiCharacters;
  let athChar = null;
  let currentSpecies = null;

  // Map an event label (set by the logic) to the matching athlete species.
  function speciesForLabel(label) {
    const t = (label || '').toLowerCase();
    if (t.indexOf('chạy') !== -1) return 'runner';
    if (t.indexOf('nhảy') !== -1) return 'gymnast';
    if (t.indexOf('bơi') !== -1) return 'swimmer';
    if (t.indexOf('bắn') !== -1) return 'archer';
    if (t.indexOf('xe') !== -1) return 'cyclist';
    return 'runner';
  }

  function mountAthlete(species) {
    const host = document.getElementById('athlete-stage');
    if (!host) return;
    if (species === currentSpecies && athChar) return;
    host.innerHTML = '';
    athChar = null;
    currentSpecies = species;
    if (C && C.hasSpecies(species)) {
      athChar = C.createCharacter(species, host, { state: 'idle' });
    } else {
      // Emoji fallback mirrors the event icon set.
      const fb = { runner: '🏃', gymnast: '🤸', swimmer: '🏊', archer: '🎯', cyclist: '🚴' };
      host.textContent = fb[species] || '🏃';
    }
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
        const colors = ['#fbbf24', '#f59e0b', '#22c55e', '#ef4444', '#3b82f6', '#a855f7'];
        p.style.background = colors[Math.floor(Math.random() * colors.length)];
      }
      parent.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
  }
  function spawnSparkle(parent, n) { spawnParticles(parent, 'sparkle', n || 8); }
  window.__v37_spawnParticles = spawnParticles;

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    const $ = id => document.getElementById(id);

    // --- Mount / swap the athlete sprite whenever the event label changes ---
    const eventLabel = $('event-label');
    if (eventLabel) {
      const syncAthlete = () => mountAthlete(speciesForLabel(eventLabel.textContent));
      syncAthlete();
      const elObs = new MutationObserver(syncAthlete);
      elObs.observe(eventLabel, { childList: true, characterData: true, subtree: true });
    }

    // --- Celebrate correct answers: watch options for the .correct class ---
    const options = $('q-options');
    if (options) {
      const optObs = new MutationObserver(muts => {
        muts.forEach(m => {
          if (m.type === 'attributes' && m.target.classList &&
              m.target.classList.contains('correct')) {
            pulseHappy(athChar);
            spawnSparkle($('athlete-stage'), 8);
          }
        });
      });
      optObs.observe(options, { attributes: true, attributeFilter: ['class'], subtree: true });
    }

    // --- Celebrate medals: watch the event-result popup icon ---
    const resultIcon = $('event-result-icon');
    if (resultIcon) {
      const riObs = new MutationObserver(() => {
        const popup = $('event-result');
        const visible = popup && popup.style.display !== 'none';
        const txt = resultIcon.textContent || '';
        if (visible && (txt.indexOf('🥇') !== -1 || txt.indexOf('🥈') !== -1 || txt.indexOf('🥉') !== -1)) {
          pulseHappy(athChar);
          spawnParticles(popup, 'confetti', 18);
        }
      });
      riObs.observe(resultIcon, { childList: true, characterData: true, subtree: true });
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
        // Stop the question countdown loop before leaving. The logic's timer
        // is private, but navigating away fully unloads the page; we also
        // hide the question box so no further interaction can fire.
        const qbox = $('question-box');
        if (qbox) qbox.style.display = 'none';
        window.location.reload();
      });
      exit.addEventListener('click', e => { if (e.target === exit) exit.style.display = 'none'; });
    }
  });
})();
