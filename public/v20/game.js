(function() {
  'use strict';

  // ===== CROP DATA =====
  const CROPS = [
    { id: 'rau', emoji: '🥬', name: 'Rau cải', growMinutes: 2, sellPrice: 8, seedCost: 5, unlockHarvests: 0 },
    { id: 'carot', emoji: '🥕', name: 'Cà rốt', growMinutes: 3, sellPrice: 12, seedCost: 8, unlockHarvests: 0 },
    { id: 'bap', emoji: '🌽', name: 'Bắp', growMinutes: 4, sellPrice: 15, seedCost: 10, unlockHarvests: 0 },
    { id: 'cachua', emoji: '🍅', name: 'Cà chua', growMinutes: 5, sellPrice: 20, seedCost: 15, unlockHarvests: 10 },
    { id: 'hoa', emoji: '🌻', name: 'Hoa hướng dương', growMinutes: 5, sellPrice: 18, seedCost: 12, unlockHarvests: 15 },
    { id: 'dau', emoji: '🍓', name: 'Dâu tây', growMinutes: 6, sellPrice: 25, seedCost: 20, unlockHarvests: 25 },
    { id: 'nho', emoji: '🍇', name: 'Nho', growMinutes: 8, sellPrice: 35, seedCost: 30, unlockHarvests: 50 },
    { id: 'duahau', emoji: '🍉', name: 'Dưa hấu', growMinutes: 10, sellPrice: 50, seedCost: 40, unlockHarvests: 75 }
  ];

  // Growth stage emojis
  const STAGE_EMOJIS = ['🌱', '🌿', '🌸'];

  // ===== STATE =====
  let farm = null;
  let selectedPlot = -1;
  let quizQuestions = [];
  let quizIndex = 0;
  let quizCorrect = 0;
  let quizAnswers = [];
  let wateredCrops = [];

  // ===== PROFILE =====
  function getProfile() {
    try { return JSON.parse(localStorage.getItem('hocvui_profile')); } catch { return null; }
  }

  // ===== FARM PERSISTENCE =====
  function loadFarm() {
    try {
      const saved = localStorage.getItem('v20_farm');
      if (saved) {
        farm = JSON.parse(saved);
      }
    } catch { /* ignore */ }
    if (!farm) {
      farm = {
        coins: 50,
        totalHarvests: 0,
        plots: Array(6).fill(null), // null = empty, or { cropId, plantedAt, stage, stageAdvancedAt }
        unlockedPlots: 6, // can go up to 9
        lastDailyBonus: null
      };
    }
    // Advance growth based on real time
    advanceGrowth();
    saveFarm();
  }

  function saveFarm() {
    localStorage.setItem('v20_farm', JSON.stringify(farm));
  }

  function advanceGrowth() {
    const now = Date.now();
    farm.plots.forEach((plot, i) => {
      if (!plot || plot.stage >= 3) return;
      const crop = CROPS.find(c => c.id === plot.cropId);
      if (!crop) return;
      const stageTime = (crop.growMinutes / 3) * 60 * 1000; // ms per stage
      const elapsed = now - plot.stageAdvancedAt;
      const stagesAdvanced = Math.floor(elapsed / stageTime);
      if (stagesAdvanced > 0) {
        plot.stage = Math.min(3, plot.stage + stagesAdvanced);
        plot.stageAdvancedAt = now;
        farm.plots[i] = plot;
      }
    });
  }

  // ===== DAILY BONUS =====
  function checkDailyBonus() {
    const today = new Date().toDateString();
    if (farm.lastDailyBonus === today) return;
    const bonus = 10 + farm.totalHarvests;
    farm.coins += bonus;
    farm.lastDailyBonus = today;
    saveFarm();
    showDailyBonusPopup(bonus);
  }

  function showDailyBonusPopup(amount) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    const popup = document.createElement('div');
    popup.className = 'daily-bonus-popup';
    popup.innerHTML = `
      <div style="font-size:3rem;">🎁</div>
      <h3>Thưởng đăng nhập!</h3>
      <div class="bonus-amount">+${amount} xu</div>
      <p style="font-size:0.85rem;color:#888;font-weight:600;">Mỗi ngày nhận xu miễn phí!</p>
      <button id="close-daily-bonus">Nhận!</button>
    `;
    document.body.appendChild(overlay);
    document.body.appendChild(popup);
    const closeBtn = document.getElementById('close-daily-bonus');
    const close = () => { overlay.remove(); popup.remove(); };
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);
  }

  // ===== RENDER FARM =====
  function renderFarm() {
    updateCoinDisplay();
    document.getElementById('harvest-count').textContent = `🌿 Thu hoạch: ${farm.totalHarvests}`;

    const grid = document.getElementById('farm-grid');
    grid.innerHTML = '';

    const totalSlots = 9; // always show 9 slots
    for (let i = 0; i < totalSlots; i++) {
      const div = document.createElement('div');
      div.className = 'plot';

      if (i >= farm.unlockedPlots) {
        // Locked plot
        div.classList.add('locked');
        div.addEventListener('click', () => showScreen('shop-screen'));
      } else if (!farm.plots[i]) {
        // Empty plot
        div.classList.add('empty');
        div.addEventListener('click', () => openPlantScreen(i));
      } else {
        const plot = farm.plots[i];
        const crop = CROPS.find(c => c.id === plot.cropId);
        if (!crop) continue;

        if (plot.stage >= 3) {
          // Ready to harvest
          div.classList.add('ready');
          div.innerHTML = `<span class="plot-emoji">${crop.emoji}</span><span class="plot-label">Thu hoạch!</span>`;
          const bar = document.createElement('div');
          bar.className = 'plot-progress';
          bar.innerHTML = `<div class="plot-progress-fill ready"></div>`;
          div.appendChild(bar);
          div.addEventListener('click', () => harvest(i));
        } else {
          // Growing
          const stageEmoji = STAGE_EMOJIS[plot.stage] || '🌱';
          div.innerHTML = `<span class="plot-emoji">${stageEmoji}</span><span class="plot-label">${crop.name}</span>`;
          const bar = document.createElement('div');
          bar.className = 'plot-progress';
          const stageClass = `stage${plot.stage + 1}`;
          bar.innerHTML = `<div class="plot-progress-fill ${stageClass}"></div>`;
          div.appendChild(bar);
          div.addEventListener('click', () => showPlotInfo(i));
        }
      }
      grid.appendChild(div);
    }
  }

  function updateCoinDisplay() {
    document.getElementById('coin-amount').textContent = farm.coins;
    const shopCoins = document.getElementById('shop-coin-amount');
    if (shopCoins) shopCoins.textContent = farm.coins;
  }

  // ===== HARVEST =====
  function harvest(plotIndex) {
    const plot = farm.plots[plotIndex];
    if (!plot || plot.stage < 3) return;
    const crop = CROPS.find(c => c.id === plot.cropId);
    if (!crop) return;

    farm.coins += crop.sellPrice;
    farm.totalHarvests++;
    farm.plots[plotIndex] = null;
    saveFarm();

    // Show harvest popup
    showHarvestPopup(crop);
    renderFarm();
  }

  function showHarvestPopup(crop) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    const popup = document.createElement('div');
    popup.className = 'harvest-popup';
    popup.innerHTML = `
      <div class="harvest-emoji">${crop.emoji}</div>
      <div class="harvest-text">Thu hoạch ${crop.name}!</div>
      <div class="harvest-coins">+${crop.sellPrice} xu</div>
    `;
    document.body.appendChild(overlay);
    document.body.appendChild(popup);
    const close = () => { overlay.remove(); popup.remove(); };
    setTimeout(close, 1500);
    overlay.addEventListener('click', close);
  }

  function showPlotInfo(plotIndex) {
    const plot = farm.plots[plotIndex];
    if (!plot) return;
    const crop = CROPS.find(c => c.id === plot.cropId);
    if (!crop) return;

    const stageTime = (crop.growMinutes / 3) * 60 * 1000;
    const now = Date.now();
    const elapsed = now - plot.stageAdvancedAt;
    const remaining = Math.max(0, stageTime - elapsed);
    const remainSec = Math.ceil(remaining / 1000);

    let msg = `${crop.emoji} ${crop.name}\nGiai đoạn: ${plot.stage + 1}/3`;
    if (plot.stage < 3) {
      if (remainSec > 60) {
        msg += `\nCòn ~${Math.ceil(remainSec / 60)} phút nữa`;
      } else {
        msg += `\nCòn ~${remainSec} giây nữa`;
      }
    }
    alert(msg);
  }

  // ===== PLANT SCREEN =====
  function openPlantScreen(plotIndex) {
    selectedPlot = plotIndex;
    renderSeedList();
    showScreen('plant-screen');
  }

  function renderSeedList() {
    const list = document.getElementById('seed-list');
    list.innerHTML = '';
    CROPS.forEach(crop => {
      const card = document.createElement('div');
      card.className = 'seed-card';
      const unlocked = farm.totalHarvests >= crop.unlockHarvests;
      const canAfford = farm.coins >= crop.seedCost;

      if (!unlocked) {
        card.classList.add('locked');
        card.innerHTML = `
          <span class="seed-card-emoji">${crop.emoji}</span>
          <div class="seed-card-info">
            <span class="seed-card-name">${crop.name}</span>
            <span class="seed-card-detail">${crop.growMinutes} phút | Bán ${crop.sellPrice} xu</span>
          </div>
          <span class="seed-card-lock">🔒 ${crop.unlockHarvests} thu hoạch</span>
        `;
      } else {
        card.innerHTML = `
          <span class="seed-card-emoji">${crop.emoji}</span>
          <div class="seed-card-info">
            <span class="seed-card-name">${crop.name}</span>
            <span class="seed-card-detail">${crop.growMinutes} phút | Bán ${crop.sellPrice} xu</span>
          </div>
          <span class="seed-card-cost">${crop.seedCost} xu</span>
        `;
        if (canAfford) {
          card.addEventListener('click', () => plantCrop(crop));
        } else {
          card.style.opacity = '0.5';
        }
      }
      list.appendChild(card);
    });
  }

  function plantCrop(crop) {
    if (selectedPlot < 0 || selectedPlot >= farm.unlockedPlots) return;
    if (farm.coins < crop.seedCost) return;
    if (farm.plots[selectedPlot]) return;

    farm.coins -= crop.seedCost;
    farm.plots[selectedPlot] = {
      cropId: crop.id,
      plantedAt: Date.now(),
      stage: 0,
      stageAdvancedAt: Date.now()
    };
    saveFarm();
    showScreen('farm-screen');
    renderFarm();
  }

  // ===== SHOP SCREEN =====
  function renderShop() {
    updateCoinDisplay();
    const plotShop = document.getElementById('plot-shop');
    plotShop.innerHTML = '';
    const extraPlots = farm.unlockedPlots - 6;
    const maxExtra = 3;
    for (let i = 0; i < maxExtra; i++) {
      const btn = document.createElement('button');
      btn.className = 'shop-plot-btn';
      if (i < extraPlots) {
        btn.textContent = `Ô đất ${7 + i} ✅ Đã mua`;
        btn.disabled = true;
      } else {
        btn.innerHTML = `<span>Ô đất ${7 + i}</span><span style="color:#F57C00;font-weight:800;">100 xu</span>`;
        if (farm.coins >= 100) {
          btn.addEventListener('click', () => buyPlot());
        } else {
          btn.disabled = true;
        }
      }
      plotShop.appendChild(btn);
    }
  }

  function buyPlot() {
    if (farm.unlockedPlots >= 9) return;
    if (farm.coins < 100) return;
    farm.coins -= 100;
    farm.unlockedPlots++;
    // Ensure plots array is large enough
    while (farm.plots.length < farm.unlockedPlots) {
      farm.plots.push(null);
    }
    saveFarm();
    renderShop();
    updateCoinDisplay();
  }

  // ===== QUIZ =====
  async function startQuiz() {
    const profile = getProfile();
    if (!profile) { alert('Vui lòng tạo hồ sơ trước!'); return; }

    try {
      const subjects = ['math', 'vietnamese'];
      const subject = subjects[Math.floor(Math.random() * subjects.length)];
      const res = await fetch(`/api/questions?subject=${subject}&difficulty=easy&limit=10&player_id=${profile.id}`);
      quizQuestions = await res.json();
      if (!quizQuestions || quizQuestions.length === 0) {
        alert('Không tải được câu hỏi!');
        return;
      }
    } catch {
      alert('Lỗi kết nối!');
      return;
    }

    quizIndex = 0;
    quizCorrect = 0;
    quizAnswers = [];
    wateredCrops = [];
    showScreen('quiz-screen');
    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    if (quizIndex >= quizQuestions.length) {
      finishQuiz();
      return;
    }

    const q = quizQuestions[quizIndex];
    document.getElementById('quiz-progress-text').textContent = `Câu ${quizIndex + 1}/${quizQuestions.length}`;
    document.getElementById('quiz-progress-fill').style.width = `${((quizIndex) / quizQuestions.length) * 100}%`;
    document.getElementById('quiz-correct').textContent = quizCorrect;
    document.getElementById('quiz-question').textContent = q.question_text;

    const btns = document.querySelectorAll('#quiz-answers .ans-btn');
    const opts = ['a', 'b', 'c', 'd'];
    btns.forEach((btn, i) => {
      btn.textContent = `${opts[i].toUpperCase()}. ${q['option_' + opts[i]]}`;
      btn.className = 'ans-btn';
      btn.disabled = false;
      btn.onclick = () => selectAnswer(opts[i], btn);
    });
  }

  function selectAnswer(answer, btn) {
    const q = quizQuestions[quizIndex];
    const isCorrect = answer.toLowerCase() === q.correct_answer.toLowerCase();
    const btns = document.querySelectorAll('#quiz-answers .ans-btn');
    btns.forEach(b => { b.disabled = true; });

    if (isCorrect) {
      btn.classList.add('correct');
      quizCorrect++;
      // Water a random growing crop
      waterRandomCrop();
    } else {
      btn.classList.add('wrong');
      // Highlight correct
      btns.forEach(b => {
        if (b.dataset.opt.toLowerCase() === q.correct_answer.toLowerCase()) b.classList.add('correct');
      });
    }

    quizAnswers.push({
      question_id: q.id,
      selected_answer: answer,
      correct_answer: q.correct_answer,
      is_correct: isCorrect
    });

    quizIndex++;
    setTimeout(renderQuizQuestion, 1000);
  }

  function waterRandomCrop() {
    // Find growing crops (stage < 3)
    const growingIndices = [];
    farm.plots.forEach((plot, i) => {
      if (plot && plot.stage < 3) growingIndices.push(i);
    });
    if (growingIndices.length === 0) return;

    const idx = growingIndices[Math.floor(Math.random() * growingIndices.length)];
    farm.plots[idx].stage = Math.min(3, farm.plots[idx].stage + 1);
    farm.plots[idx].stageAdvancedAt = Date.now();
    saveFarm();

    const crop = CROPS.find(c => c.id === farm.plots[idx].cropId);
    wateredCrops.push(crop ? crop.name : 'cây');
  }

  async function finishQuiz() {
    // Show result
    showScreen('result-screen');
    document.getElementById('result-title').textContent = `💧 Tưới xong ${quizCorrect}/${quizQuestions.length} cây!`;
    document.getElementById('result-detail').textContent = quizCorrect > 7 ? 'Tuyệt vời! Cây lớn nhanh lắm!' :
      quizCorrect > 4 ? 'Khá tốt! Cây đang phát triển.' : 'Cố gắng thêm nhé!';

    const wateredDiv = document.getElementById('result-watered');
    if (wateredCrops.length > 0) {
      wateredDiv.innerHTML = `<p>🌱 Cây được tưới:</p>` +
        wateredCrops.map(name => `<p style="margin-left:10px;">💧 ${name}</p>`).join('');
    } else {
      wateredDiv.innerHTML = `<p>Chưa có cây nào đang mọc để tưới.</p>`;
    }

    // Save session
    const profile = getProfile();
    if (profile) {
      try {
        await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            player_id: profile.id,
            subject: quizQuestions[0]?.subject || 'math',
            difficulty: 'easy',
            score: quizCorrect * 10,
            total_questions: quizQuestions.length,
            correct_answers: quizCorrect,
            stars_earned: quizCorrect >= 8 ? 3 : quizCorrect >= 5 ? 2 : quizCorrect >= 3 ? 1 : 0,
            combo_max: 0,
            mode: 'v20-farm'
          })
        });
      } catch { /* ignore */ }
    }

    // Call prompt check
    if (typeof window.checkAndShowPrompt === 'function') {
      window.checkAndShowPrompt();
    }
  }

  // ===== SCREEN MANAGEMENT =====
  function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    if (screenId === 'farm-screen') {
      advanceGrowth();
      renderFarm();
    } else if (screenId === 'shop-screen') {
      renderShop();
    }
  }

  // ===== AUTO REFRESH =====
  let refreshInterval = null;

  function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(() => {
      if (document.getElementById('farm-screen').classList.contains('active')) {
        advanceGrowth();
        saveFarm();
        renderFarm();
      }
    }, 10000); // refresh every 10 seconds
  }

  // ===== INIT =====
  function init() {
    loadFarm();
    renderFarm();
    checkDailyBonus();
    startAutoRefresh();

    // Event listeners
    document.getElementById('btn-water').addEventListener('click', startQuiz);
    document.getElementById('btn-shop').addEventListener('click', () => showScreen('shop-screen'));
    document.getElementById('btn-back-farm').addEventListener('click', () => showScreen('farm-screen'));
    document.getElementById('btn-back-shop').addEventListener('click', () => showScreen('farm-screen'));
    document.getElementById('btn-back-result').addEventListener('click', () => showScreen('farm-screen'));
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
