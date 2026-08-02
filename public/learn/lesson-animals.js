// === Interactive "Con Vật" (Animals) Lesson for Grade 0 (5 tuổi) ===
// Hooks into openTopic('animals0') in learn.js
// 4-step flow: Explore → Sound Quiz + Sorting → Food Matching → Reward
(function () {
  'use strict';

  const S = () => window.HocVuiSprite;

  // ── Animal data (sprite coords from sheet 1) ──
  // VERIFIED positions:
  // Row 0: dog(0), cat(1), rabbit(2), panda(3), fox(4), tiger(5), dragon(6), koala(7), ?(8), frog(9)
  // Row 1: monkey(0), bear(1), penguin(2), sparrow(3), owl(4), eagle(5), wolf(6), unicorn(7), elephant(8), giraffe(9)
  // Row 2: deer(0), ?(1), turtle(2), shark(3), whale(4), raccoon(5), zebra(6), squid(7), snakehead(8), shrimp(9)
  // Row 3: goldfish(0), ?(1), octopus(2), ?(3), ?(4), crab(5), ray(6), narwhal(7), orca(8), anglerfish(9)
  // Row 4: dolphin(0), lobster(1), jellyfish(2), seahorse(3), starfish(4), clownfish(5)
  const ANIMALS = [
    { id: 'dog', name: 'Chó', sound: 'Gâu gâu', food: 'xương', habitat: 'land', sprite: {s:1,r:0,c:0}, fact: 'Chó rất trung thành với chủ!' },
    { id: 'cat', name: 'Mèo', sound: 'Meo meo', food: 'cá', habitat: 'land', sprite: {s:1,r:0,c:1}, fact: 'Mèo bắt chuột rất giỏi!' },
    { id: 'rabbit', name: 'Thỏ', sound: 'nhảy nhảy', food: 'cà rốt', habitat: 'land', sprite: {s:1,r:0,c:2}, fact: 'Thỏ có đôi tai dài và nhảy rất nhanh!' },
    { id: 'panda', name: 'Gấu Trúc', sound: 'nhai nhai', food: 'tre', habitat: 'land', sprite: {s:1,r:0,c:3}, fact: 'Gấu trúc chỉ ăn lá tre và rất quý hiếm!' },
    { id: 'fox', name: 'Cáo', sound: 'Xéo xéo', food: 'thịt', habitat: 'land', sprite: {s:1,r:0,c:4}, fact: 'Cáo rất thông minh và nhanh nhẹn!' },
    { id: 'tiger', name: 'Hổ', sound: 'Gầm gầm', food: 'thịt', habitat: 'land', sprite: {s:1,r:0,c:5}, fact: 'Hổ là loài mèo lớn nhất thế giới!' },
    { id: 'lion', name: 'Sư Tử', sound: 'Gào gào', food: 'thịt', habitat: 'land', sprite: {s:1,r:0,c:6}, fact: 'Sư tử là vua của muôn loài!' },
    { id: 'koala', name: 'Koala', sound: 'ôm ôm', food: 'lá bạch đàn', habitat: 'land', sprite: {s:1,r:0,c:8}, fact: 'Koala ngủ 20 tiếng mỗi ngày!' },
    { id: 'frog', name: 'Ếch', sound: 'Ộp ộp', food: 'côn trùng', habitat: 'water', sprite: {s:1,r:0,c:9}, fact: 'Ếch sống cả trên cạn và dưới nước!' },
    { id: 'monkey', name: 'Khỉ', sound: 'Khí khí', food: 'chuối', habitat: 'land', sprite: {s:1,r:1,c:0}, fact: 'Khỉ rất thông minh và leo cây giỏi!' },
    { id: 'bear', name: 'Gấu', sound: 'Gừ gừ', food: 'mật ong', habitat: 'land', sprite: {s:1,r:1,c:1}, fact: 'Gấu thích ăn mật ong và cá!' },
    { id: 'penguin', name: 'Chim Cánh Cụt', sound: 'Quéc quéc', food: 'cá', habitat: 'water', sprite: {s:1,r:1,c:2}, fact: 'Chim cánh cụt sống ở nơi rất lạnh!' },
    { id: 'owl', name: 'Cú Mèo', sound: 'Cú cú', food: 'chuột', habitat: 'land', sprite: {s:1,r:1,c:4}, fact: 'Cú mèo nhìn rõ trong đêm tối!' },
    { id: 'elephant', name: 'Voi', sound: 'Phì phì', food: 'mía', habitat: 'land', sprite: {s:1,r:1,c:8}, fact: 'Voi là động vật lớn nhất trên cạn!' },
    { id: 'giraffe', name: 'Hươu Cao Cổ', sound: 'lặng lẽ', food: 'lá cây', habitat: 'land', sprite: {s:1,r:1,c:9}, fact: 'Hươu cao cổ là con vật cao nhất thế giới!' },
    { id: 'deer', name: 'Hươu', sound: 'lặng lẽ', food: 'lá cây', habitat: 'land', sprite: {s:1,r:2,c:0}, fact: 'Hươu có đôi sừng rất đẹp!' },
    { id: 'parrot', name: 'Vẹt', sound: 'Xin chào', food: 'hạt', habitat: 'land', sprite: {s:1,r:2,c:3}, fact: 'Vẹt có thể nói tiếng người!' },
    { id: 'flamingo', name: 'Hồng Hạc', sound: 'lặng lẽ', food: 'tôm nhỏ', habitat: 'water', sprite: {s:1,r:2,c:4}, fact: 'Hồng hạc có bộ lông hồng rực rỡ!' },
    { id: 'zebra', name: 'Ngựa Vằn', sound: 'Hí hí', food: 'cỏ', habitat: 'land', sprite: {s:1,r:2,c:6}, fact: 'Ngựa vằn có bộ lông sọc đen trắng!' },
    { id: 'crocodile', name: 'Cá Sấu', sound: 'Grr grr', food: 'cá', habitat: 'water', sprite: {s:1,r:2,c:8}, fact: 'Cá sấu có hàm răng rất khỏe!' },
    { id: 'fish', name: 'Cá Vàng', sound: 'bơi bơi', food: 'tảo', habitat: 'water', sprite: {s:1,r:3,c:0}, fact: 'Cá sống dưới nước và thở bằng mang!' },
    { id: 'turtle', name: 'Rùa', sound: 'chậm chạp', food: 'lá', habitat: 'water', sprite: {s:1,r:3,c:1}, fact: 'Rùa sống rất lâu và có mai cứng!' },
    { id: 'octopus', name: 'Bạch Tuộc', sound: 'lặn lặn', food: 'tôm', habitat: 'water', sprite: {s:1,r:3,c:2}, fact: 'Bạch tuộc có 8 cái chân!' },
    { id: 'shark', name: 'Cá Mập', sound: 'đáng sợ', food: 'cá', habitat: 'water', sprite: {s:1,r:3,c:3}, fact: 'Cá mập có hàng trăm chiếc răng nhọn!' },
    { id: 'whale', name: 'Cá Voi', sound: 'Ùng ùng', food: 'tôm nhỏ', habitat: 'water', sprite: {s:1,r:3,c:4}, fact: 'Cá voi là động vật lớn nhất đại dương!' },
    { id: 'crab', name: 'Cua', sound: 'kẹp kẹp', food: 'rong biển', habitat: 'water', sprite: {s:1,r:3,c:5}, fact: 'Cua có hai càng kẹp rất khỏe!' },
    { id: 'dolphin', name: 'Cá Heo', sound: 'Éc éc', food: 'cá nhỏ', habitat: 'water', sprite: {s:1,r:4,c:0}, fact: 'Cá heo rất thân thiện với con người!' },
    { id: 'starfish', name: 'Sao Biển', sound: 'lặng lẽ', food: 'vỏ sò', habitat: 'water', sprite: {s:1,r:4,c:4}, fact: 'Sao biển có 5 cánh tay!' },
    { id: 'seahorse', name: 'Cá Ngựa', sound: 'lặng lẽ', food: 'tôm nhỏ', habitat: 'water', sprite: {s:1,r:4,c:3}, fact: 'Cá ngựa bơi đứng thẳng rất đặc biệt!' },
  ];

  // Food icons (approximate sprites)
  const FOOD_SPRITES = {
    'xương': {s:4,r:5,c:0}, 'cá': {s:1,r:3,c:0}, 'cà rốt': {s:3,r:5,c:2},
    'tre': {s:2,r:5,c:1}, 'thịt': {s:3,r:1,c:0}, 'chuối': {s:3,r:5,c:1},
    'mía': {s:2,r:5,c:1}, 'tảo': {s:2,r:5,c:0}, 'tôm': {s:1,r:3,c:9},
    'cá nhỏ': {s:1,r:3,c:0}, 'lá bạch đàn': {s:2,r:5,c:7}, 'côn trùng': {s:2,r:7,c:4},
    'mật ong': {s:3,r:0,c:5}, 'chuột': {s:3,r:0,c:0}, 'lá cây': {s:2,r:5,c:7},
    'cỏ': {s:2,r:5,c:7}, 'rong biển': {s:2,r:5,c:0},
    'vỏ sò': {s:1,r:3,c:6}, 'tôm nhỏ': {s:1,r:3,c:9}, 'hạt': {s:3,r:5,c:3}, 'lá': {s:2,r:5,c:7},
  };

  // ── TTS ──
  function speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'vi-VN'; u.rate = 0.85; u.pitch = 1.1;
    const voices = window.speechSynthesis.getVoices();
    const vi = voices.find(v => v.lang.startsWith('vi'));
    if (vi) u.voice = vi;
    window.speechSynthesis.speak(u);
  }
  function speakerBtn(text) {
    return `<button class="lc-speak-btn" onclick="window._lessonAnimals.speak('${text.replace(/'/g, "\\'")}')"><img src="/img/sound-on.png" style="width:22px;height:22px;"></button>`;
  }

  // ── State ──
  let state = { step: 0, score: 0, total: 0, round: 0, explored: 0 };

  // ── Helpers ──
  function $(id) { return document.getElementById(id); }
  function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function playSound(type) { if (window.HocVuiSound) window.HocVuiSound.play(type); }
  function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }
  function iconHtml(sprite, size) { return S().html(sprite.s, sprite.r, sprite.c, size); }

  const PRAISE = ['Giỏi lắm!', 'Tuyệt vời!', 'Đúng rồi!', 'Hay quá!', 'Xuất sắc!'];
  const ENCOURAGE = ['Thử lại nhé!', 'Gần đúng rồi!', 'Cố lên!'];

  function getScreen() { return $('animals0-interactive-screen'); }
  function show() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    getScreen().classList.add('active');
  }
  function updateProgress() {
    const bar = getScreen().querySelector('.lan-progress-bar');
    if (bar) bar.style.width = ((state.step + 1) / 4 * 100) + '%';
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 0: Explore — tap animals to hear sounds and learn facts
  // ══════════════════════════════════════════════════════════════════
  function renderExplore() {
    state.step = 0;
    state.explored = 0;
    const exploreSet = shuffle(ANIMALS).slice(0, 6);
    state._exploreSet = exploreSet;

    const body = getScreen().querySelector('.lan-body');
    body.innerHTML = `
      <div class="lan-explore">
        <p class="lan-title">Chạm vào con vật để nghe tiếng kêu! ${speakerBtn('Chạm vào con vật để nghe tiếng kêu')}</p>
        <div class="lan-animal-grid" id="lan-explore-grid">
          ${exploreSet.map((a, i) => `
            <div class="lan-animal-card" id="lan-acard-${i}" onclick="window._lessonAnimals.tapExplore(${i})">
              ${iconHtml(a.sprite, 48)}
              <span class="lan-animal-name" id="lan-aname-${i}">?</span>
            </div>
          `).join('')}
        </div>
        <div class="lan-explore-info" id="lan-explore-info"></div>
        <div id="lan-explore-next" style="margin-top:12px;"></div>
      </div>
    `;
    updateProgress();
  }

  function tapExplore(idx) {
    const a = state._exploreSet[idx];
    const card = $('lan-acard-' + idx);
    const nameEl = $('lan-aname-' + idx);
    if (!card || card.classList.contains('lan-explored')) return;

    card.classList.add('lan-explored');
    nameEl.textContent = a.name;
    speak(a.name + '! ' + a.sound + '! ' + a.fact);
    playSound('click');

    const info = $('lan-explore-info');
    if (info) {
      info.innerHTML = `<div class="lan-info-bubble">
        ${iconHtml(a.sprite, 36)}
        <div><strong>${a.name}</strong>: "${a.sound}"<br><span style="color:#666;font-size:0.85rem">${a.fact}</span></div>
      </div>`;
    }

    state.explored++;
    if (state.explored >= 6) {
      setTimeout(() => {
        const next = $('lan-explore-next');
        if (next) next.innerHTML = `<button class="lc-btn lc-btn-primary" onclick="window._lessonAnimals.startQuiz()">Tiếp tục!</button>`;
      }, 500);
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 1: Sound Quiz + Habitat Sorting
  // ══════════════════════════════════════════════════════════════════
  function startQuiz() {
    state.step = 1;
    state.round = 0;
    state.score = 0;
    state.total = 0;
    nextQuiz();
  }

  function nextQuiz() {
    if (state.round >= 4) { startFood(); return; }
    state.round++;

    if (state.round <= 2) {
      // Sound quiz: guess animal by its sound
      renderSoundQuiz();
    } else {
      // Habitat: land or water?
      renderHabitat();
    }
  }

  function renderSoundQuiz() {
    const landAnimals = ANIMALS.filter(a => a.habitat === 'land');
    const target = rand(landAnimals);
    const wrongs = shuffle(ANIMALS.filter(a => a.id !== target.id)).slice(0, 2);
    const options = shuffle([target, ...wrongs]);
    const correctIdx = options.indexOf(target);

    const question = `Bạn nào kêu "${target.sound}"?`;

    const body = getScreen().querySelector('.lan-body');
    body.innerHTML = `
      <div class="lan-quiz-section">
        <div class="lan-quiz-header">
          <span class="lan-round-badge">Câu ${state.round}/4</span>
          <span class="lan-score-badge">${S().named('star', 16)} ${state.score}</span>
        </div>
        <p class="lan-question">${question} ${speakerBtn(question)}</p>
        <div class="lan-quiz-options" id="lan-quiz-opts">
          ${options.map((a, i) => `
            <button class="lan-quiz-opt" onclick="window._lessonAnimals.answerQuiz(${i}, ${correctIdx})">
              ${iconHtml(a.sprite, 44)}
              <span>${a.name}</span>
            </button>
          `).join('')}
        </div>
        <div class="lan-feedback" id="lan-quiz-fb"></div>
      </div>
    `;
    updateProgress();
  }

  function renderHabitat() {
    const target = rand(ANIMALS);
    const question = `"${target.name}" sống ở đâu?`;
    const correctIsLand = target.habitat === 'land';

    const body = getScreen().querySelector('.lan-body');
    body.innerHTML = `
      <div class="lan-quiz-section">
        <div class="lan-quiz-header">
          <span class="lan-round-badge">Câu ${state.round}/4</span>
          <span class="lan-score-badge">${S().named('star', 16)} ${state.score}</span>
        </div>
        <p class="lan-question">${question} ${speakerBtn(question)}</p>
        <div class="lan-animal-display">${iconHtml(target.sprite, 64)}</div>
        <div class="lan-habitat-options" id="lan-quiz-opts">
          <button class="lan-habitat-btn lan-habitat-land" onclick="window._lessonAnimals.answerHabitat(true, ${correctIsLand})">
            ${S().named('leaf', 28)} Trên Cạn
          </button>
          <button class="lan-habitat-btn lan-habitat-water" onclick="window._lessonAnimals.answerHabitat(false, ${correctIsLand})">
            ${S().html(2, 3, 6, 28)} Dưới Nước
          </button>
        </div>
        <div class="lan-feedback" id="lan-quiz-fb"></div>
      </div>
    `;
    updateProgress();
  }

  function answerQuiz(picked, correctIdx) {
    state.total++;
    const opts = getScreen().querySelectorAll('.lan-quiz-opt');
    opts.forEach((o, i) => {
      o.style.pointerEvents = 'none';
      if (i === correctIdx) o.classList.add('lan-opt-correct');
      if (i === picked && i !== correctIdx) o.classList.add('lan-opt-wrong');
    });
    const fb = $('lan-quiz-fb');
    if (picked === correctIdx) {
      state.score++; playSound('correct');
      if (fb) fb.innerHTML = `<div class="lan-fb-ok">${rand(PRAISE)}</div>`;
    } else {
      playSound('wrong');
      if (fb) fb.innerHTML = `<div class="lan-fb-wrong">${rand(ENCOURAGE)}</div>`;
    }
    setTimeout(() => nextQuiz(), 1400);
  }

  function answerHabitat(pickedLand, correctIsLand) {
    state.total++;
    const btns = getScreen().querySelectorAll('.lan-habitat-btn');
    btns.forEach(b => b.style.pointerEvents = 'none');
    const fb = $('lan-quiz-fb');
    if (pickedLand === correctIsLand) {
      state.score++; playSound('correct');
      if (fb) fb.innerHTML = `<div class="lan-fb-ok">${rand(PRAISE)}</div>`;
      btns[correctIsLand ? 0 : 1].classList.add('lan-opt-correct');
    } else {
      playSound('wrong');
      if (fb) fb.innerHTML = `<div class="lan-fb-wrong">${rand(ENCOURAGE)}</div>`;
      btns[pickedLand ? 0 : 1].classList.add('lan-opt-wrong');
      btns[correctIsLand ? 0 : 1].classList.add('lan-opt-correct');
    }
    setTimeout(() => nextQuiz(), 1400);
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 2: Food Matching — feed the right food to each animal
  // ══════════════════════════════════════════════════════════════════
  function startFood() {
    state.step = 2;
    state.round = 0;
    nextFood();
  }

  function nextFood() {
    if (state.round >= 3) { showReward(); return; }
    state.round++;

    const target = rand(ANIMALS);
    const correctFood = target.food;
    const wrongFoods = shuffle(ANIMALS.filter(a => a.food !== correctFood).map(a => a.food))
      .filter((v, i, arr) => arr.indexOf(v) === i).slice(0, 2);
    const allFoods = shuffle([correctFood, ...wrongFoods]);
    const correctIdx = allFoods.indexOf(correctFood);

    const question = `Cho "${target.name}" ăn gì?`;

    const body = getScreen().querySelector('.lan-body');
    body.innerHTML = `
      <div class="lan-food-section">
        <div class="lan-quiz-header">
          <span class="lan-round-badge">Cho ăn ${state.round}/3</span>
          <span class="lan-score-badge">${S().named('star', 16)} ${state.score}</span>
        </div>
        <p class="lan-question">${question} ${speakerBtn(question)}</p>
        <div class="lan-animal-display">${iconHtml(target.sprite, 64)}<br><strong>${target.name}</strong></div>
        <div class="lan-food-options" id="lan-food-opts">
          ${allFoods.map((f, i) => {
            const fSprite = FOOD_SPRITES[f] || S().randomKidFriendlyData();
            return `<button class="lan-food-opt" onclick="window._lessonAnimals.answerFood(${i}, ${correctIdx})">
              ${iconHtml(fSprite, 36)}
              <span>${f}</span>
            </button>`;
          }).join('')}
        </div>
        <div class="lan-feedback" id="lan-food-fb"></div>
      </div>
    `;
    updateProgress();
  }

  function answerFood(picked, correctIdx) {
    state.total++;
    const opts = getScreen().querySelectorAll('.lan-food-opt');
    opts.forEach((o, i) => {
      o.style.pointerEvents = 'none';
      if (i === correctIdx) o.classList.add('lan-opt-correct');
      if (i === picked && i !== correctIdx) o.classList.add('lan-opt-wrong');
    });
    const fb = $('lan-food-fb');
    if (picked === correctIdx) {
      state.score++; playSound('correct');
      if (fb) fb.innerHTML = `<div class="lan-fb-ok">${rand(PRAISE)}</div>`;
    } else {
      playSound('wrong');
      if (fb) fb.innerHTML = `<div class="lan-fb-wrong">${rand(ENCOURAGE)}</div>`;
    }
    setTimeout(() => nextFood(), 1400);
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 3: Reward
  // ══════════════════════════════════════════════════════════════════
  function showReward() {
    state.step = 3;
    playSound('win');
    const stars = state.score >= 6 ? 3 : state.score >= 4 ? 2 : 1;
    const SP = S();
    const starsHtml = Array.from({length: 3}, (_, i) =>
      SP.el(2, 0, 0, i < stars ? 36 : 24, i >= stars ? 'lan-star-dim' : '')
    ).join(' ');
    const message = stars === 3 ? 'Xuất sắc! Nhà sinh vật học nhí!' :
                    stars === 2 ? 'Tốt lắm! Bé hiểu nhiều con vật!' :
                    'Cố gắng thêm nhé!';

    const animalPalette = ANIMALS.slice(0, 5).map(a => iconHtml(a.sprite, 28)).join(' ');

    const body = getScreen().querySelector('.lan-body');
    body.innerHTML = `
      <div class="lan-reward">
        <div class="lan-reward-stars">${starsHtml}</div>
        <h2 class="lan-reward-title">${message}</h2>
        <div class="lan-reward-palette">${animalPalette}</div>
        <div class="lan-reward-score">Đúng <strong>${state.score}</strong> / ${state.total} câu</div>
        <div class="lan-reward-tip">Nhớ yêu quý và bảo vệ động vật nhé!</div>
        <div class="lan-reward-actions">
          <button class="lc-btn lc-btn-secondary" onclick="window._lessonAnimals.restart()">Học lại</button>
          <button class="lc-btn lc-btn-primary" onclick="showScreen('menu-screen')">Về menu</button>
        </div>
      </div>
    `;
    if (window.HocVuiCollection && window.HocVuiCollection.reward) window.HocVuiCollection.reward(stars);
    updateProgress();
  }

  // ── Public API ──
  function restart() { state = { step: 0, score: 0, total: 0, round: 0, explored: 0 }; renderExplore(); }
  function open() { show(); restart(); }

  window._lessonAnimals = {
    open, restart, speak,
    tapExplore, startQuiz, answerQuiz, answerHabitat,
    answerFood,
  };

  // ── Hook ──
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (typeof openTopic === 'function') {
        const _orig = openTopic;
        window.openTopic = function (topic) {
          if (topic === 'animals0') { window._lessonAnimals.open(); return; }
          _orig(topic);
        };
      }
    }, 0);
  });
})();
