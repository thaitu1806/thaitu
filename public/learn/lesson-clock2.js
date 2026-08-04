// === Interactive "Đồng Hồ" (Clock) Lesson for Grade 2 ===
// Hooks into openTopic('clock'). 4-step CPA: Explore → Milestones → Practice (3 types) → Reward
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
    return `<button class="lc-speak-btn" onclick="window._lessonClock2.speak('${text.replace(/'/g, "\\'")}')">`
      + '<img src="/img/sound-on.png" style="width:22px;height:22px;"></button>';
  }

  // ── State ──
  let state = { step: 0, score: 0, total: 0, round: 0, explored: 0 };
  let clockHour = 12, clockMinute = 0, dragging = null;

  // ── Helpers ──
  function $(id) { return document.getElementById(id); }
  function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }
  function playSound(type) { if (window.HocVuiSound) window.HocVuiSound.play(type); }

  const PRAISE = ['Giỏi lắm!', 'Tuyệt vời!', 'Đúng rồi!', 'Hay quá!', 'Xuất sắc!'];
  const ENCOURAGE = ['Thử lại nhé!', 'Gần đúng rồi!', 'Cố lên!'];

  function getScreen() { return $('clock2-interactive-screen'); }
  function show() { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); getScreen().classList.add('active'); }
  function updateProgress() {
    const bar = getScreen().querySelector('.lck2-progress-bar');
    if (bar) bar.style.width = ((state.step + 1) / 4 * 100) + '%';
  }

  // ── Clock SVG rendering (self-contained, no conflict with learn.js) ──
  function clockSVG2(hour, minute, size, options) {
    const opts = options || {};
    const id = opts.id || '';
    const interactive = opts.interactive || false;
    const showMinuteRing = opts.showMinuteRing || false;
    const pad = showMinuteRing ? 24 : 12;
    const cx = size / 2, cy = size / 2, r = size / 2 - pad;

    // Hour hand position (moves proportionally with minutes)
    const hAngle = ((hour % 12) + minute / 60) * 30 - 90;
    const hLen = r * 0.5;
    const hx = cx + hLen * Math.cos(hAngle * Math.PI / 180);
    const hy = cy + hLen * Math.sin(hAngle * Math.PI / 180);

    // Minute hand
    const mAngle = minute * 6 - 90;
    const mLen = r * 0.75;
    const mx = cx + mLen * Math.cos(mAngle * Math.PI / 180);
    const my = cy + mLen * Math.sin(mAngle * Math.PI / 180);

    // Numbers & ticks
    let nums = '', ticks = '', minuteRing = '';
    for (let i = 1; i <= 12; i++) {
      const a = (i * 30 - 90) * Math.PI / 180;
      const nx = cx + (r - 20) * Math.cos(a);
      const ny = cy + (r - 20) * Math.sin(a);
      nums += `<text x="${nx}" y="${ny}" text-anchor="middle" dominant-baseline="central" font-size="${size * 0.09}" font-weight="bold" fill="#333">${i}</text>`;
    }
    for (let i = 0; i < 60; i++) {
      const a = (i * 6 - 90) * Math.PI / 180;
      const outer = r - 3;
      const inner = i % 5 === 0 ? r - 11 : r - 6;
      ticks += `<line x1="${cx + inner * Math.cos(a)}" y1="${cy + inner * Math.sin(a)}" x2="${cx + outer * Math.cos(a)}" y2="${cy + outer * Math.sin(a)}" stroke="#888" stroke-width="${i % 5 === 0 ? 2 : 1}"/>`;
    }
    // Optional minute ring showing 5-minute intervals outside
    if (showMinuteRing) {
      for (let i = 1; i <= 12; i++) {
        const a = (i * 30 - 90) * Math.PI / 180;
        const rx = cx + (r + 12) * Math.cos(a);
        const ry = cy + (r + 12) * Math.sin(a);
        minuteRing += `<text class="lck2-minute-ring" x="${rx}" y="${ry}" text-anchor="middle" dominant-baseline="central">${i * 5}</text>`;
      }
    }

    const idAttr = id ? ` id="${id}"` : '';
    const classAttr = interactive ? ' class="lck2-clock-svg"' : '';
    return `<svg${idAttr}${classAttr} width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="touch-action:none;">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="white" stroke="#333" stroke-width="3"/>
      ${ticks}${nums}${minuteRing}
      <line ${id ? 'id="'+id+'-hhand"' : ''} x1="${cx}" y1="${cy}" x2="${hx}" y2="${hy}" stroke="#d32f2f" stroke-width="5" stroke-linecap="round"/>
      <line ${id ? 'id="'+id+'-mhand"' : ''} x1="${cx}" y1="${cy}" x2="${mx}" y2="${my}" stroke="#1565c0" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="${cx}" cy="${cy}" r="5" fill="#f44336"/>
      ${interactive ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="transparent" stroke="transparent"/>` : ''}
    </svg>`;
  }

  // Small clock for milestones/options
  function miniClock(hour, minute, size) {
    return clockSVG2(hour, minute, size || 60, {});
  }

  // ── Interactive clock drag logic ──
  function setupInteractiveClock(svgId, size, onUpdate) {
    const svg = $(svgId);
    if (!svg) return;
    const cx = size / 2, cy = size / 2, r = size / 2 - 12;

    function getAngle(e) {
      const rect = svg.getBoundingClientRect();
      const scale = rect.width / size;
      const px = (e.clientX || (e.touches && e.touches[0].clientX) || 0) - rect.left;
      const py = (e.clientY || (e.touches && e.touches[0].clientY) || 0) - rect.top;
      const x = px / scale - cx, y = py / scale - cy;
      let angle = Math.atan2(y, x) * 180 / Math.PI + 90;
      return ((angle % 360) + 360) % 360;
    }

    function startDrag(e) {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const scale = rect.width / size;
      const px = (e.clientX || (e.touches && e.touches[0].clientX) || 0) - rect.left;
      const py = (e.clientY || (e.touches && e.touches[0].clientY) || 0) - rect.top;
      const dx = px / scale - cx, dy = py / scale - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      dragging = dist < r * 0.5 ? 'hour' : 'minute';
    }

    function onDrag(e) {
      if (!dragging) return;
      e.preventDefault();
      const angle = getAngle(e);
      if (dragging === 'minute') {
        clockMinute = Math.round(angle / 6) % 60;
      } else {
        clockHour = Math.round(angle / 30) % 12 || 12;
      }
      updateHands(svgId, size);
      if (onUpdate) onUpdate();
    }

    function endDrag() { dragging = null; }

    svg.addEventListener('mousedown', startDrag);
    svg.addEventListener('mousemove', onDrag);
    svg.addEventListener('mouseup', endDrag);
    svg.addEventListener('mouseleave', endDrag);
    svg.addEventListener('touchstart', startDrag, { passive: false });
    svg.addEventListener('touchmove', onDrag, { passive: false });
    svg.addEventListener('touchend', endDrag);
  }

  function updateHands(svgId, size) {
    const cx = size / 2, cy = size / 2, r = size / 2 - 12;
    const hAngle = ((clockHour % 12) + clockMinute / 60) * 30 - 90;
    const hLen = r * 0.5;
    const hx = cx + hLen * Math.cos(hAngle * Math.PI / 180);
    const hy = cy + hLen * Math.sin(hAngle * Math.PI / 180);
    const mAngle = clockMinute * 6 - 90;
    const mLen = r * 0.75;
    const mx = cx + mLen * Math.cos(mAngle * Math.PI / 180);
    const my = cy + mLen * Math.sin(mAngle * Math.PI / 180);

    const hhand = $(svgId + '-hhand');
    const mhand = $(svgId + '-mhand');
    if (hhand) { hhand.setAttribute('x2', hx); hhand.setAttribute('y2', hy); }
    if (mhand) { mhand.setAttribute('x2', mx); mhand.setAttribute('y2', my); }

    // Update display if exists
    const disp = $('lck2-time-display');
    if (disp) disp.textContent = clockHour.toString().padStart(2, '0') + ':' + clockMinute.toString().padStart(2, '0');
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 0: Explore — Interactive clock + tap numbers for 5-min rule
  // ══════════════════════════════════════════════════════════════════
  function renderExplore() {
    state.step = 0; state.explored = 0;
    clockHour = 8; clockMinute = 0;
    const body = getScreen().querySelector('.lck2-body');
    body.innerHTML = `
      <div class="lck2-section">
        <p class="lck2-title">Khám phá đồng hồ! ${speakerBtn('Kéo kim đồng hồ để khám phá')}</p>
        <p class="lck2-hint">Kéo <span class="lck2-hour-color">kim ngắn đỏ</span> = Giờ, <span class="lck2-minute-color">kim dài xanh</span> = Phút</p>
        <div class="lck2-clock-wrap">
          ${clockSVG2(clockHour, clockMinute, 220, { id: 'lck2-explore-clock', interactive: true, showMinuteRing: true })}
          <div class="lck2-clock-display" id="lck2-time-display">08:00</div>
        </div>
        <p class="lck2-hint">Chạm vào số trên đồng hồ để xem phút tương ứng!</p>
        <div class="lck2-explore-info" id="lck2-explore-info">
          <strong>Mẹo:</strong> Mỗi số = 5 phút. Số 3 = 15 phút, Số 6 = 30 phút (rưỡi)!
        </div>
        <div id="lck2-explore-next" style="margin-top:12px;"></div>
      </div>`;
    setupInteractiveClock('lck2-explore-clock', 220, onExploreUpdate);
    updateProgress();
    // Show next button after some interaction
    setTimeout(() => {
      const next = $('lck2-explore-next');
      if (next && !next.innerHTML) next.innerHTML = `<button class="lc-btn lc-btn-primary" onclick="window._lessonClock2.startStep1()">Tiếp tục!</button>`;
    }, 5000);
  }

  function onExploreUpdate() {
    state.explored++;
    if (state.explored >= 3) {
      const next = $('lck2-explore-next');
      if (next && !next.innerHTML) next.innerHTML = `<button class="lc-btn lc-btn-primary" onclick="window._lessonClock2.startStep1()">Tiếp tục!</button>`;
    }
    // Show info about current position
    const info = $('lck2-explore-info');
    if (!info) return;
    let text = '';
    if (clockMinute === 0) text = `<span class="lck2-hour-color">${clockHour} giờ đúng</span> — Kim dài chỉ số 12.`;
    else if (clockMinute === 15) text = `<span class="lck2-hour-color">${clockHour} giờ</span> <span class="lck2-minute-color">15 phút</span> — Kim dài chỉ số 3.`;
    else if (clockMinute === 30) text = `<span class="lck2-hour-color">${clockHour} giờ</span> <span class="lck2-minute-color">30 phút</span> (rưỡi) — Kim dài chỉ số 6.`;
    else if (clockMinute === 45) text = `<span class="lck2-hour-color">${clockHour} giờ</span> <span class="lck2-minute-color">45 phút</span> (${clockHour + 1} giờ kém 15) — Kim dài chỉ số 9.`;
    else text = `<span class="lck2-hour-color">${clockHour} giờ</span> <span class="lck2-minute-color">${clockMinute} phút</span>`;
    info.innerHTML = text;
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 1: Milestones — Show key time points with activities
  // ══════════════════════════════════════════════════════════════════
  const MILESTONES = [
    { hour: 7, minute: 0, label: '7 giờ đúng', type: 'Giờ đúng', activity: '🎒 Bé đeo balo đi học', desc: 'Kim ngắn chỉ số 7, kim dài chỉ số 12' },
    { hour: 7, minute: 15, label: '7 giờ 15 phút', type: 'Giờ hơn 15', activity: '🤸 Bé tập thể dục buổi sáng', desc: 'Kim ngắn qua số 7, kim dài chỉ số 3' },
    { hour: 7, minute: 30, label: '7 giờ 30 phút (rưỡi)', type: 'Giờ rưỡi', activity: '📚 Bé vào lớp học bài', desc: 'Kim ngắn giữa 7 và 8, kim dài chỉ số 6' },
    { hour: 7, minute: 45, label: '7 giờ 45 phút (8 giờ kém 15)', type: 'Giờ kém', activity: '🎉 Bé chuẩn bị ra chơi', desc: 'Kim ngắn gần số 8, kim dài chỉ số 9' },
  ];

  function startStep1() {
    state.step = 1;
    renderMilestones();
    updateProgress();
  }

  function renderMilestones() {
    const body = getScreen().querySelector('.lck2-body');
    body.innerHTML = `
      <div class="lck2-section">
        <p class="lck2-title">Các mốc giờ quan trọng ${speakerBtn('Các mốc giờ quan trọng')}</p>
        <p class="lck2-hint">Chạm vào từng mốc giờ để xem chi tiết!</p>
        <div class="lck2-milestones" id="lck2-milestones">
          ${MILESTONES.map((m, i) => `
            <div class="lck2-milestone" id="lck2-ms-${i}" onclick="window._lessonClock2.tapMilestone(${i})">
              <div class="lck2-milestone-clock">${miniClock(m.hour, m.minute, 90)}</div>
              <div class="lck2-milestone-info">
                <div class="lck2-milestone-time">${m.label}</div>
                <div class="lck2-milestone-desc">${m.desc}</div>
                <div class="lck2-milestone-activity">${m.activity}</div>
              </div>
            </div>`).join('')}
        </div>
        <div id="lck2-ms-next" style="margin-top:12px;">
          <button class="lc-btn lc-btn-primary" onclick="window._lessonClock2.startStep2()">Luyện tập!</button>
        </div>
      </div>`;
  }

  let msExplored = 0;
  function tapMilestone(idx) {
    const m = MILESTONES[idx];
    const el = $('lck2-ms-' + idx);
    if (el && !el.classList.contains('active')) {
      el.classList.add('active');
      msExplored++;
    }
    speak(m.label + '. ' + m.activity.replace(/^[^\s]+\s/, ''));
    playSound('click');
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 2: Practice — 3 types (6 rounds total)
  // Type 1 (rounds 1-2): Spin clock to target time
  // Type 2 (rounds 3-4): Match analog ↔ digital
  // Type 3 (rounds 5-6): Sort daily schedule
  // ══════════════════════════════════════════════════════════════════
  let practiceRound = 0;

  const CLOCK_STORIES = [
    { hour: 10, minute: 15, story: 'Bé hãy xoay đồng hồ đến 10 giờ 15 phút để cùng bạn Thỏ ăn trưa!' },
    { hour: 3, minute: 30, story: 'Xoay kim đến 3 giờ rưỡi — giờ ra chơi đến rồi!' },
    { hour: 6, minute: 0, story: 'Xoay về 6 giờ đúng — đến giờ ăn tối!' },
    { hour: 8, minute: 45, story: 'Xoay đến 8 giờ 45 — sắp đến giờ ngủ rồi!' },
    { hour: 9, minute: 0, story: 'Xoay đến 9 giờ đúng — giờ vào lớp!' },
    { hour: 2, minute: 15, story: 'Xoay đến 2 giờ 15 phút — giờ học vẽ!' },
  ];

  const MATCH_PAIRS = [
    { hour: 2, minute: 30, digital: '02:30' },
    { hour: 4, minute: 15, digital: '04:15' },
    { hour: 7, minute: 0, digital: '07:00' },
    { hour: 11, minute: 45, digital: '11:45' },
    { hour: 9, minute: 30, digital: '09:30' },
    { hour: 1, minute: 0, digital: '01:00' },
    { hour: 5, minute: 15, digital: '05:15' },
    { hour: 8, minute: 30, digital: '08:30' },
  ];

  const DAILY_SCHEDULES = [
    [
      { time: '06:30', emoji: '🥣', text: 'Bé ăn sáng', minutes: 390 },
      { time: '11:30', emoji: '🍚', text: 'Bé ăn trưa', minutes: 690 },
      { time: '21:00', emoji: '😴', text: 'Bé đi ngủ', minutes: 1260 },
    ],
    [
      { time: '07:00', emoji: '🎒', text: 'Đến trường', minutes: 420 },
      { time: '15:30', emoji: '🏠', text: 'Về nhà', minutes: 930 },
      { time: '19:00', emoji: '📖', text: 'Học bài', minutes: 1140 },
    ],
    [
      { time: '06:00', emoji: '🌅', text: 'Thức dậy', minutes: 360 },
      { time: '12:00', emoji: '☀️', text: 'Giữa trưa', minutes: 720 },
      { time: '18:00', emoji: '🌆', text: 'Chiều tối', minutes: 1080 },
    ],
  ];

  function startStep2() {
    state.step = 2; practiceRound = 0; state.score = 0; state.total = 0;
    nextPractice();
    updateProgress();
  }

  function nextPractice() {
    practiceRound++;
    if (practiceRound > 6) { showReward(); return; }
    if (practiceRound <= 2) renderSpinChallenge();
    else if (practiceRound <= 4) renderMatchChallenge();
    else renderSortChallenge();
    updateProgress();
  }

  // ── Type 1: Spin clock to target time ──
  function renderSpinChallenge() {
    const challenge = rand(CLOCK_STORIES);
    state._target = { hour: challenge.hour, minute: challenge.minute };
    clockHour = 12; clockMinute = 0;

    getScreen().querySelector('.lck2-body').innerHTML = `
      <div class="lck2-section">
        <div class="lck2-header-row">
          <span class="lck2-round-badge">Câu ${practiceRound}/6</span>
          <span class="lck2-score-badge">${S() ? S().named('star', 16) : '⭐'} ${numHtml(state.score, 20)}</span>
        </div>
        <p class="lck2-story">${challenge.story} ${speakerBtn(challenge.story)}</p>
        <div class="lck2-target-time"><span class="lck2-hour-color">${challenge.hour}</span> giờ <span class="lck2-minute-color">${challenge.minute === 0 ? '00' : challenge.minute}</span> phút</div>
        <div class="lck2-clock-wrap">
          ${clockSVG2(clockHour, clockMinute, 200, { id: 'lck2-practice-clock', interactive: true })}
          <div class="lck2-clock-display" id="lck2-time-display">12:00</div>
        </div>
        <button class="lck2-check-btn" onclick="window._lessonClock2.checkSpin()">Kiểm tra!</button>
        <div class="lck2-feedback" id="lck2-fb"></div>
      </div>`;
    setupInteractiveClock('lck2-practice-clock', 200, null);
  }

  function checkSpin() {
    state.total++;
    const target = state._target;
    const hOk = clockHour === target.hour;
    const mOk = clockMinute === target.minute;
    const fb = $('lck2-fb');
    const btn = getScreen().querySelector('.lck2-check-btn');
    if (btn) btn.disabled = true;

    if (hOk && mOk) {
      state.score++; playSound('correct');
      if (fb) fb.innerHTML = `<div class="lck2-fb-ok">${rand(PRAISE)} 🎉</div>`;
    } else {
      playSound('wrong');
      const ans = `${target.hour} giờ ${target.minute === 0 ? '00' : target.minute} phút`;
      if (fb) fb.innerHTML = `<div class="lck2-fb-wrong">${rand(ENCOURAGE)} Đáp án: ${ans}</div>`;
    }
    setTimeout(() => nextPractice(), 1500);
  }

  // ── Type 2: Match analog clock ↔ digital time ──
  let matchState = { pairs: [], selectedAnalog: -1, matched: 0 };

  function renderMatchChallenge() {
    // Pick 3 random pairs
    const pairs = shuffle([...MATCH_PAIRS]).slice(0, 3);
    matchState = { pairs, selectedAnalog: -1, matched: 0 };
    const shuffledDigital = shuffle(pairs.map((p, i) => ({ ...p, origIdx: i })));

    getScreen().querySelector('.lck2-body').innerHTML = `
      <div class="lck2-section">
        <div class="lck2-header-row">
          <span class="lck2-round-badge">Câu ${practiceRound}/6</span>
          <span class="lck2-score-badge">${S() ? S().named('star', 16) : '⭐'} ${numHtml(state.score, 20)}</span>
        </div>
        <p class="lck2-question">Nối đồng hồ kim với giờ điện tử! ${speakerBtn('Nối đồng hồ kim với đồng hồ điện tử cùng giờ')}</p>
        <div class="lck2-match-area">
          <div class="lck2-match-col">
            ${pairs.map((p, i) => `<div class="lck2-match-item" id="lck2-analog-${i}" onclick="window._lessonClock2.tapAnalog(${i})">${miniClock(p.hour, p.minute, 120)}</div>`).join('')}
          </div>
          <div class="lck2-match-col">
            ${shuffledDigital.map((p, i) => `<div class="lck2-match-item" id="lck2-digital-${i}" data-orig="${p.origIdx}" onclick="window._lessonClock2.tapDigital(${i},${p.origIdx})"><span class="lck2-digital">${p.digital}</span></div>`).join('')}
          </div>
        </div>
        <div class="lck2-feedback" id="lck2-fb"></div>
      </div>`;
  }

  function tapAnalog(idx) {
    // Deselect previous
    getScreen().querySelectorAll('.lck2-match-col:first-child .lck2-match-item').forEach(el => el.classList.remove('selected'));
    const el = $('lck2-analog-' + idx);
    if (el && !el.classList.contains('done')) {
      el.classList.add('selected');
      matchState.selectedAnalog = idx;
      playSound('click');
    }
  }

  function tapDigital(displayIdx, origIdx) {
    if (matchState.selectedAnalog < 0) return;
    const analogIdx = matchState.selectedAnalog;
    const analogEl = $('lck2-analog-' + analogIdx);
    const digitalEl = $('lck2-digital-' + displayIdx);

    if (analogIdx === origIdx) {
      // Correct match
      if (analogEl) { analogEl.classList.add('correct', 'done'); analogEl.classList.remove('selected'); }
      if (digitalEl) { digitalEl.classList.add('correct', 'done'); }
      matchState.matched++;
      playSound('correct');
      matchState.selectedAnalog = -1;

      if (matchState.matched >= matchState.pairs.length) {
        state.total++; state.score++;
        const fb = $('lck2-fb');
        if (fb) fb.innerHTML = `<div class="lck2-fb-ok">${rand(PRAISE)}</div>`;
        setTimeout(() => nextPractice(), 1400);
      }
    } else {
      // Wrong match
      if (digitalEl) { digitalEl.classList.add('wrong'); setTimeout(() => digitalEl.classList.remove('wrong'), 500); }
      playSound('wrong');
    }
  }

  // ── Type 3: Sort daily schedule (earliest → latest) ──
  let sortState = { cards: [], sorted: [], picked: [] };

  function renderSortChallenge() {
    const schedule = rand(DAILY_SCHEDULES);
    const sorted = [...schedule].sort((a, b) => a.minutes - b.minutes);
    const shuffled = shuffle([...schedule]);
    sortState = { cards: shuffled, sorted, picked: [] };

    getScreen().querySelector('.lck2-body').innerHTML = `
      <div class="lck2-section">
        <div class="lck2-header-row">
          <span class="lck2-round-badge">Câu ${practiceRound}/6</span>
          <span class="lck2-score-badge">${S() ? S().named('star', 16) : '⭐'} ${numHtml(state.score, 20)}</span>
        </div>
        <p class="lck2-question">Sắp xếp từ SÁNG đến TỐI! ${speakerBtn('Sắp xếp hoạt động từ sáng đến tối')}</p>
        <div class="lck2-sort-slots" id="lck2-sort-slots">
          ${sorted.map((_, i) => `<span class="lck2-sort-slot" id="lck2-slot-${i}">${i + 1}</span>`).join('')}
        </div>
        <div class="lck2-sort-cards" id="lck2-sort-cards">
          ${shuffled.map((c, i) => `
            <div class="lck2-sort-card" id="lck2-sc-${i}" onclick="window._lessonClock2.tapSortCard(${i})">
              <span class="lck2-sort-card-emoji">${c.emoji}</span>
              <div>
                <div class="lck2-sort-card-text">${c.text}</div>
                <div class="lck2-sort-card-time">${c.time}</div>
              </div>
            </div>`).join('')}
        </div>
        <div class="lck2-feedback" id="lck2-fb"></div>
      </div>`;
  }

  function tapSortCard(idx) {
    const card = sortState.cards[idx];
    const expected = sortState.sorted[sortState.picked.length];
    const el = $('lck2-sc-' + idx);

    if (card.minutes !== expected.minutes) {
      playSound('wrong');
      if (el) { el.classList.add('wrong'); setTimeout(() => el.classList.remove('wrong'), 400); }
      return;
    }

    // Correct pick
    sortState.picked.push(card);
    if (el) { el.classList.add('picked'); }
    playSound('click');

    const slot = $('lck2-slot-' + (sortState.picked.length - 1));
    if (slot) { slot.textContent = card.emoji + ' ' + card.time; slot.classList.add('filled'); }

    if (sortState.picked.length >= sortState.sorted.length) {
      state.total++; state.score++;
      const fb = $('lck2-fb');
      if (fb) fb.innerHTML = `<div class="lck2-fb-ok">${rand(PRAISE)}</div>`;
      setTimeout(() => nextPractice(), 1400);
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 3: Reward
  // ══════════════════════════════════════════════════════════════════
  function showReward() {
    state.step = 3; playSound('win');
    const stars = state.score >= 5 ? 3 : state.score >= 3 ? 2 : 1;
    const starsHtml = Array.from({ length: 3 }, (_, i) =>
      S() ? S().el(2, 0, 0, i < stars ? 36 : 24, i >= stars ? 'lck2-star-dim' : '') : (i < stars ? '⭐' : '☆')
    ).join(' ');
    const msg = stars === 3 ? 'Xuất sắc! Chuyên gia Quản lý Thời gian!' : stars === 2 ? 'Tốt lắm! Gần thành chuyên gia rồi!' : 'Cố gắng thêm nhé!';
    speak(msg);

    getScreen().querySelector('.lck2-body').innerHTML = `
      <div class="lck2-reward">
        <div class="lck2-reward-stars">${starsHtml}</div>
        <h2 class="lck2-reward-title">${msg}</h2>
        <div class="lck2-reward-score">Đúng ${numHtml(state.score, 32)} / ${numHtml(state.total, 32)} câu</div>
        <div class="lck2-reward-concepts">
          <div class="lck2-concept"><span class="lck2-hour-color">Kim ngắn đỏ</span> = Giờ, <span class="lck2-minute-color">Kim dài xanh</span> = Phút</div>
          <div class="lck2-concept">1 giờ = 60 phút, mỗi số = 5 phút</div>
          <div class="lck2-concept">Giờ đúng / Giờ hơn / Giờ rưỡi / Giờ kém</div>
        </div>
        <div class="lck2-reward-actions">
          <button class="lc-btn lc-btn-secondary" onclick="window._lessonClock2.restart()">Học lại</button>
          <button class="lc-btn lc-btn-primary" onclick="showScreen('menu-screen')">Về menu</button>
        </div>
      </div>`;
    if (window.HocVuiCollection && window.HocVuiCollection.reward) window.HocVuiCollection.reward(stars);
    updateProgress();
  }

  // ── Entry / restart ──
  function restart() {
    state = { step: 0, score: 0, total: 0, round: 0, explored: 0 };
    practiceRound = 0; msExplored = 0;
    clockHour = 12; clockMinute = 0; dragging = null;
    renderExplore();
  }
  function open() { show(); restart(); }

  // ── Public API ──
  window._lessonClock2 = { open, restart, speak, startStep1, tapMilestone, startStep2, checkSpin, tapAnalog, tapDigital, tapSortCard };

  // ── Hook into openTopic ──
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (typeof openTopic === 'function') {
        const _o = openTopic;
        window.openTopic = function (t) {
          if (t === 'clock') { window._lessonClock2.open(); return; }
          _o(t);
        };
      }
    }, 0);
  });
})();
