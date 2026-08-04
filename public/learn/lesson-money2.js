// === Interactive "Tiền Việt Nam" Lesson for Grade 2 ===
// Hooks into openTopic('money'). 4-step CPA: Explore → Exchange → Practice (3 types) → Reward
(function () {
  'use strict';

  const S = () => window.HocVuiSprite;
  const N = () => window.HocVuiNumbers;
  function numHtml(n, sz) { return N() ? N().html(n, sz || 28) : `<span style="font-weight:900;font-size:${sz || 28}px;">${n}</span>`; }

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
    return `<button class="lc-speak-btn" onclick="window._lessonMoney2.speak('${text.replace(/'/g, "\\'")}')">`
      + '<img src="/img/sound-on.png" style="width:22px;height:22px;"></button>';
  }

  // ── State ──
  let state = { step: 0, score: 0, total: 0, round: 0, group: 0 };

  // ── Helpers ──
  function $(id) { return document.getElementById(id); }
  function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }
  function playSound(type) { if (window.HocVuiSound) window.HocVuiSound.play(type); }
  function fmtMoney(n) { return n.toLocaleString('vi-VN') + ' đ'; }

  const PRAISE = ['Giỏi lắm!', 'Tuyệt vời!', 'Đúng rồi!', 'Hay quá!', 'Xuất sắc!'];
  const ENCOURAGE = ['Thử lại nhé!', 'Gần đúng rồi!', 'Cố lên!'];

  function getScreen() { return $('money2-interactive-screen'); }
  function show() { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); getScreen().classList.add('active'); }
  function updateProgress() {
    const bar = getScreen().querySelector('.lmo2-progress-bar');
    if (bar) bar.style.width = ((state.step + 1) / 4 * 100) + '%';
  }

  // ── Money data ──
  const BILLS = [
    { value: 1000, label: '1.000 đ', color: '#6d4c41', bg: '#efebe9', group: 0, w: 56, h: 28 },
    { value: 2000, label: '2.000 đ', color: '#4e342e', bg: '#efebe9', group: 0, w: 56, h: 28 },
    { value: 5000, label: '5.000 đ', color: '#1565c0', bg: '#e3f2fd', group: 0, w: 58, h: 29 },
    { value: 10000, label: '10.000 đ', color: '#f9a825', bg: '#fff8e1', group: 1, w: 62, h: 30 },
    { value: 20000, label: '20.000 đ', color: '#0277bd', bg: '#e1f5fe', group: 1, w: 62, h: 30 },
    { value: 50000, label: '50.000 đ', color: '#ad1457', bg: '#fce4ec', group: 1, w: 64, h: 31 },
    { value: 100000, label: '100.000 đ', color: '#2e7d32', bg: '#e8f5e9', group: 2, w: 66, h: 32 },
    { value: 200000, label: '200.000 đ', color: '#d84315', bg: '#fbe9e7', group: 2, w: 66, h: 32 },
    { value: 500000, label: '500.000 đ', color: '#1a237e', bg: '#e8eaf6', group: 2, w: 68, h: 33 },
  ];
  const GROUP_NAMES = ['🟢 Tiền lẻ (1k-5k)', '🟡 Tiền hàng ngày (10k-50k)', '🔴 Tiền lớn (100k-500k)'];
  const BILL_EXAMPLES = [
    '1 viên kẹo mút', '1 chiếc bút chì', '1 gói xôi nhỏ',
    '1 hộp sữa tươi', '1 tô phở nhỏ', '1 bộ truyện tranh',
    '1 cái balo', '1 bộ quần áo mới', '1 chiếc xe đạp trẻ em',
  ];

  function billHtml(bill, scale) {
    const s = scale || 1;
    const w = Math.round(bill.w * s * 1.6), h = Math.round(bill.h * s * 1.6);
    const ext = bill.value === 1000 ? 'jpeg' : 'jpg';
    return `<span style="display:inline-block;width:${w}px;height:${h}px;border-radius:6px;overflow:hidden;border:2px solid ${bill.color};box-shadow:0 2px 6px rgba(0,0,0,0.15);"><img src="/img/tiente/${bill.value}.${ext}" alt="${bill.label}" style="width:100%;height:100%;object-fit:cover;display:block;"></span>`;
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 0: Explore — Tap bills to learn, 3 groups
  // ══════════════════════════════════════════════════════════════════
  function renderExplore() {
    state.step = 0; state.group = 0;
    const body = getScreen().querySelector('.lmo2-body');
    body.innerHTML = `
      <div class="lmo2-section">
        <p class="lmo2-title">Khám phá Tiền Việt Nam! ${speakerBtn('Chạm vào tờ tiền để tìm hiểu')}</p>
        <div class="lmo2-tabs">
          ${GROUP_NAMES.map((g, i) => `<button class="lmo2-tab ${i === 0 ? 'active' : ''}" onclick="window._lessonMoney2.switchGroup(${i})">${g}</button>`).join('')}
        </div>
        <div id="lmo2-bills-grid"></div>
        <div class="lmo2-explore-info" id="lmo2-info">Chạm vào tờ tiền!</div>
        <div style="margin-top:12px;"><button class="lc-btn lc-btn-primary" onclick="window._lessonMoney2.startStep1()">Tiếp tục!</button></div>
      </div>`;
    renderBillsGrid(0);
    updateProgress();
  }

  function switchGroup(g) {
    state.group = g;
    getScreen().querySelectorAll('.lmo2-tab').forEach((t, i) => t.classList.toggle('active', i === g));
    renderBillsGrid(g);
  }

  function renderBillsGrid(g) {
    const bills = BILLS.filter(b => b.group === g);
    const el = $('lmo2-bills-grid');
    el.innerHTML = `<div class="lmo2-bills-row">${bills.map((b, i) => {
      const idx = BILLS.indexOf(b);
      return `<div class="lmo2-bill-card" onclick="window._lessonMoney2.tapBill(${idx})">${billHtml(b, 1.8)}</div>`;
    }).join('')}</div>`;
  }

  function tapBill(idx) {
    const b = BILLS[idx];
    const info = $('lmo2-info');
    if (info) info.innerHTML = `<strong>${b.label}</strong> — ${BILL_EXAMPLES[idx]}`;
    speak(b.label.replace(' đ', ' đồng') + '. Mua được ' + BILL_EXAMPLES[idx]);
    playSound('click');
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 1: Exchange — Ghép tiền to reach target
  // ══════════════════════════════════════════════════════════════════
  let exchangeTarget = 0, exchangeTotal = 0, exchangeSelected = [];

  function startStep1() {
    state.step = 1;
    renderExchange();
    updateProgress();
  }

  function renderExchange() {
    const targets = [35000, 45000, 75000, 15000, 55000, 120000];
    exchangeTarget = rand(targets);
    exchangeTotal = 0; exchangeSelected = [];
    const available = BILLS.filter(b => b.value <= exchangeTarget);

    getScreen().querySelector('.lmo2-body').innerHTML = `
      <div class="lmo2-section">
        <p class="lmo2-title">Ghép tiền! ${speakerBtn('Chọn các tờ tiền để ghép đủ số tiền cần')}</p>
        <p class="lmo2-question">Cần: <strong style="color:#2e7d32;">${fmtMoney(exchangeTarget)}</strong></p>
        <p class="lmo2-hint">Chạm tờ tiền để thêm vào. Ghép đủ số tiền!</p>
        <div class="lmo2-exchange-pool" id="lmo2-pool">
          ${available.map((b, i) => `<div class="lmo2-pool-bill" onclick="window._lessonMoney2.addBill(${BILLS.indexOf(b)})">${billHtml(b, 1.1)}</div>`).join('')}
        </div>
        <div class="lmo2-exchange-total">Đã chọn: <span id="lmo2-total-val" style="color:#2e7d32;font-weight:900;">0 đ</span></div>
        <div class="lmo2-exchange-selected" id="lmo2-selected"></div>
        <div class="lmo2-feedback" id="lmo2-fb"></div>
        <div id="lmo2-exchange-next"></div>
      </div>`;
    updateProgress();
  }

  function addBill(idx) {
    const b = BILLS[idx];
    if (exchangeTotal + b.value > exchangeTarget + 100000) return; // prevent absurd overshoot
    exchangeTotal += b.value;
    exchangeSelected.push(b);
    playSound('click');
    // Update display
    const totalEl = $('lmo2-total-val');
    if (totalEl) totalEl.textContent = fmtMoney(exchangeTotal);
    const selEl = $('lmo2-selected');
    if (selEl) selEl.innerHTML = exchangeSelected.map(b => billHtml(b, 0.9)).join(' ');

    if (exchangeTotal === exchangeTarget) {
      playSound('correct');
      const fb = $('lmo2-fb');
      if (fb) fb.innerHTML = `<div class="lmo2-fb-ok">${rand(PRAISE)} Đủ ${fmtMoney(exchangeTarget)}!</div>`;
      speak('Đúng rồi! Đủ ' + fmtMoney(exchangeTarget).replace(' đ', ' đồng'));
      const next = $('lmo2-exchange-next');
      if (next) next.innerHTML = `<button class="lc-btn lc-btn-primary" style="margin-top:10px;" onclick="window._lessonMoney2.startStep2()">Luyện tập!</button>`;
    } else if (exchangeTotal > exchangeTarget) {
      playSound('wrong');
      const fb = $('lmo2-fb');
      if (fb) fb.innerHTML = `<div class="lmo2-fb-wrong">Quá nhiều! Thử lại.</div>`;
      exchangeTotal = 0; exchangeSelected = [];
      setTimeout(() => renderExchange(), 1000);
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 2: Practice — 3 types (6 rounds)
  // Type 1 (1-2): Count piggy bank total
  // Type 2 (3-4): Calculate change
  // Type 3 (5-6): Compare wallets
  // ══════════════════════════════════════════════════════════════════
  let practiceRound = 0;

  function startStep2() {
    state.step = 2; practiceRound = 0; state.score = 0; state.total = 0;
    nextPractice();
    updateProgress();
  }

  function nextPractice() {
    practiceRound++;
    if (practiceRound > 6) { showReward(); return; }
    if (practiceRound <= 2) renderPiggyBank();
    else if (practiceRound <= 4) renderChange();
    else renderCompareWallets();
    updateProgress();
  }

  // ── Type 1: Count piggy bank ──
  function renderPiggyBank() {
    // Pick 3-5 random bills
    const count = randInt(3, 5);
    const picked = Array.from({ length: count }, () => rand(BILLS.slice(0, 7))); // up to 100k
    const total = picked.reduce((s, b) => s + b.value, 0);
    const options = shuffle([total, total + 10000, total - 5000].filter(v => v > 0));
    const correctIdx = options.indexOf(total);
    state._piggyAns = total;

    getScreen().querySelector('.lmo2-body').innerHTML = `
      <div class="lmo2-section">
        <div class="lmo2-header-row"><span class="lmo2-round-badge">Câu ${practiceRound}/6</span><span class="lmo2-score-badge">${S() ? S().named('star', 16) : '⭐'} ${numHtml(state.score, 20)}</span></div>
        <p class="lmo2-question">🐷 Trong heo đất có bao nhiêu tiền? ${speakerBtn('Tính tổng tiền trong heo đất')}</p>
        <div class="lmo2-piggy-bills">${picked.map(b => billHtml(b, 1.5)).join('')}</div>
        <div class="lmo2-options">${options.map((o, i) => `<button class="lmo2-opt" onclick="window._lessonMoney2.answerPiggy(${i},${correctIdx})">${fmtMoney(o)}</button>`).join('')}</div>
        <div class="lmo2-feedback" id="lmo2-fb"></div>
      </div>`;
  }

  function answerPiggy(picked, ci) {
    state.total++;
    const opts = getScreen().querySelectorAll('.lmo2-opt');
    opts.forEach((o, i) => { o.style.pointerEvents = 'none'; if (i === ci) o.classList.add('lmo2-opt-correct'); if (i === picked && i !== ci) o.classList.add('lmo2-opt-wrong'); });
    const fb = $('lmo2-fb');
    if (picked === ci) { state.score++; playSound('correct'); if (fb) fb.innerHTML = `<div class="lmo2-fb-ok">${rand(PRAISE)}</div>`; }
    else { playSound('wrong'); if (fb) fb.innerHTML = `<div class="lmo2-fb-wrong">${rand(ENCOURAGE)} Đáp án: ${fmtMoney(state._piggyAns)}</div>`; }
    setTimeout(() => nextPractice(), 1500);
  }

  // ── Type 2: Calculate change ──
  function renderChange() {
    const items = [
      { name: '🧸 Gấu bông', price: 130000 },
      { name: '📖 Bộ truyện', price: 45000 },
      { name: '🎨 Hộp màu', price: 35000 },
      { name: '⚽ Quả bóng', price: 80000 },
      { name: '🎮 Đồ chơi', price: 55000 },
    ];
    const item = rand(items);
    // Pick a bill larger than price
    const payBills = BILLS.filter(b => b.value > item.price && b.value <= 500000);
    const payBill = rand(payBills);
    const change = payBill.value - item.price;
    state._changeAns = change;

    getScreen().querySelector('.lmo2-body').innerHTML = `
      <div class="lmo2-section">
        <div class="lmo2-header-row"><span class="lmo2-round-badge">Câu ${practiceRound}/6</span><span class="lmo2-score-badge">${S() ? S().named('star', 16) : '⭐'} ${numHtml(state.score, 20)}</span></div>
        <p class="lmo2-question">💰 Trả tiền thừa! ${speakerBtn('Tính tiền thừa được trả lại')}</p>
        <div class="lmo2-change-info">
          <p>${item.name} giá <strong>${fmtMoney(item.price)}</strong></p>
          <p>Bé đưa: ${billHtml(payBill, 1.2)}</p>
          <p>Tiền thừa = ?</p>
        </div>
        <div class="lmo2-options">${shuffle([change, change + 10000, change - 5000].filter(v => v > 0)).map((o, i) => `<button class="lmo2-opt" onclick="window._lessonMoney2.answerChange(${o === change ? 1 : 0},${o})">${fmtMoney(o)}</button>`).join('')}</div>
        <div class="lmo2-feedback" id="lmo2-fb"></div>
      </div>`;
  }

  function answerChange(isCorrect, val) {
    state.total++;
    const opts = getScreen().querySelectorAll('.lmo2-opt');
    opts.forEach(o => {
      o.style.pointerEvents = 'none';
      const v = parseInt(o.textContent.replace(/\D/g, ''));
      if (v === state._changeAns) o.classList.add('lmo2-opt-correct');
      else if (o.textContent.includes(fmtMoney(val).replace(' đ', ''))) o.classList.add('lmo2-opt-wrong');
    });
    const fb = $('lmo2-fb');
    if (isCorrect) { state.score++; playSound('correct'); if (fb) fb.innerHTML = `<div class="lmo2-fb-ok">${rand(PRAISE)}</div>`; }
    else { playSound('wrong'); if (fb) fb.innerHTML = `<div class="lmo2-fb-wrong">${rand(ENCOURAGE)} Đáp án: ${fmtMoney(state._changeAns)}</div>`; }
    setTimeout(() => nextPractice(), 1500);
  }

  // ── Type 3: Compare wallets ──
  function renderCompareWallets() {
    const walletA = Array.from({ length: randInt(2, 3) }, () => rand(BILLS.slice(3, 8)));
    const walletB = Array.from({ length: randInt(2, 3) }, () => rand(BILLS.slice(3, 8)));
    const totalA = walletA.reduce((s, b) => s + b.value, 0);
    const totalB = walletB.reduce((s, b) => s + b.value, 0);
    const correct = totalA > totalB ? '>' : totalA < totalB ? '<' : '=';

    getScreen().querySelector('.lmo2-body').innerHTML = `
      <div class="lmo2-section">
        <div class="lmo2-header-row"><span class="lmo2-round-badge">Câu ${practiceRound}/6</span><span class="lmo2-score-badge">${S() ? S().named('star', 16) : '⭐'} ${numHtml(state.score, 20)}</span></div>
        <p class="lmo2-question">👛 So sánh 2 ví tiền! ${speakerBtn('Ví nào nhiều tiền hơn?')}</p>
        <div class="lmo2-wallets">
          <div class="lmo2-wallet"><div class="lmo2-wallet-label">Ví A</div>${walletA.map(b => billHtml(b, 0.9)).join('<br>')}</div>
          <div class="lmo2-wallet-vs">?</div>
          <div class="lmo2-wallet"><div class="lmo2-wallet-label">Ví B</div>${walletB.map(b => billHtml(b, 0.9)).join('<br>')}</div>
        </div>
        <div class="lmo2-options">
          <button class="lmo2-opt" onclick="window._lessonMoney2.answerWallet('>','${correct}')">A &gt; B</button>
          <button class="lmo2-opt" onclick="window._lessonMoney2.answerWallet('=','${correct}')">A = B</button>
          <button class="lmo2-opt" onclick="window._lessonMoney2.answerWallet('<','${correct}')">A &lt; B</button>
        </div>
        <div class="lmo2-feedback" id="lmo2-fb"></div>
      </div>`;
  }

  function answerWallet(picked, correct) {
    state.total++;
    const opts = getScreen().querySelectorAll('.lmo2-opt');
    opts.forEach(o => { o.style.pointerEvents = 'none'; });
    const fb = $('lmo2-fb');
    if (picked === correct) { state.score++; playSound('correct'); if (fb) fb.innerHTML = `<div class="lmo2-fb-ok">${rand(PRAISE)}</div>`; }
    else { playSound('wrong'); if (fb) fb.innerHTML = `<div class="lmo2-fb-wrong">${rand(ENCOURAGE)} Đáp án: A ${correct} B</div>`; }
    setTimeout(() => nextPractice(), 1500);
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 3: Reward
  // ══════════════════════════════════════════════════════════════════
  function showReward() {
    state.step = 3; playSound('win');
    const stars = state.score >= 5 ? 3 : state.score >= 3 ? 2 : 1;
    const starsHtml = Array.from({ length: 3 }, (_, i) =>
      S() ? S().el(2, 0, 0, i < stars ? 36 : 24, i >= stars ? 'lmo2-star-dim' : '') : (i < stars ? '⭐' : '☆')
    ).join(' ');
    const msg = stars === 3 ? 'Xuất sắc! Chuyên Gia Tài Chính!' : stars === 2 ? 'Tốt lắm!' : 'Cố gắng thêm nhé!';
    speak(msg);
    getScreen().querySelector('.lmo2-body').innerHTML = `
      <div class="lmo2-reward">
        <div class="lmo2-reward-stars">${starsHtml}</div>
        <h2 class="lmo2-reward-title">${msg}</h2>
        <div class="lmo2-reward-score">Đúng ${numHtml(state.score, 32)} / ${numHtml(state.total, 32)} câu</div>
        <div class="lmo2-reward-concepts">
          <div class="lmo2-concept">9 mệnh giá: 1k → 500k</div>
          <div class="lmo2-concept">Đếm số 0 để biết mệnh giá</div>
          <div class="lmo2-concept">Ghép tiền = cộng các tờ</div>
          <div class="lmo2-concept">Tiền thừa = Đưa − Giá</div>
        </div>
        <div class="lmo2-reward-actions">
          <button class="lc-btn lc-btn-secondary" onclick="window._lessonMoney2.restart()">Học lại</button>
          <button class="lc-btn lc-btn-primary" onclick="showScreen('menu-screen')">Về menu</button>
        </div>
      </div>`;
    if (window.HocVuiCollection && window.HocVuiCollection.reward) window.HocVuiCollection.reward(stars);
    updateProgress();
  }

  function restart() { state = { step: 0, score: 0, total: 0, round: 0, group: 0 }; practiceRound = 0; renderExplore(); }
  function open() { show(); restart(); }

  // ── Public API ──
  window._lessonMoney2 = { open, restart, speak, switchGroup, tapBill, startStep1, addBill, startStep2, answerPiggy, answerChange, answerWallet };

  // ── Hook into openTopic ──
  document.addEventListener('DOMContentLoaded', () => { setTimeout(() => { if (typeof openTopic === 'function') { const _o = openTopic; window.openTopic = function (t) { if (t === 'money') { window._lessonMoney2.open(); return; } _o(t); }; } }, 0); });
})();
