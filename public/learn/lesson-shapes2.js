// === Interactive "Hình Học Lớp 2" (Geometry) Lesson for Grade 2 ===
// Hooks into openTopic('shapes'). 4-step CPA: Explore → Formulas → Practice (3 types) → Reward
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
    return `<button class="lc-speak-btn" onclick="window._lessonShapes2.speak('${text.replace(/'/g, "\\'")}')">`
      + '<img src="/img/sound-on.png" style="width:22px;height:22px;"></button>';
  }

  // ── State ──
  let state = { step: 0, score: 0, total: 0, round: 0, exploreTab: 0 };

  // ── Helpers ──
  function $(id) { return document.getElementById(id); }
  function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }
  function playSound(type) { if (window.HocVuiSound) window.HocVuiSound.play(type); }

  const PRAISE = ['Giỏi lắm!', 'Tuyệt vời!', 'Đúng rồi!', 'Hay quá!', 'Xuất sắc!'];
  const ENCOURAGE = ['Thử lại nhé!', 'Gần đúng rồi!', 'Cố lên!'];

  function getScreen() { return $('shapes2-interactive-screen'); }
  function show() { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); getScreen().classList.add('active'); }
  function updateProgress() {
    const bar = getScreen().querySelector('.lsg2-progress-bar');
    if (bar) bar.style.width = ((state.step + 1) / 4 * 100) + '%';
  }


  // ══════════════════════════════════════════════════════════════════
  // STEP 1: Formulas
  // ══════════════════════════════════════════════════════════════════
  function startStep1() { state.step = 1; renderFormulas(); updateProgress(); }
  function renderFormulas() {
    getScreen().querySelector('.lsg2-body').innerHTML = `
      <div class="lsg2-section">
        <p class="lsg2-title">Công thức ${speakerBtn('Độ dài gấp khúc bằng tổng các đoạn. Chu vi bằng tổng các cạnh.')}</p>
        <div class="lsg2-formula-cards">
          <div class="lsg2-formula-card">
            <div style="display:flex;align-items:center;gap:10px;">
              <svg width="100" height="60" viewBox="0 0 100 60"><polyline points="5,50 30,10 65,45 95,15" fill="none" stroke="#ad1457" stroke-width="2.5" stroke-linejoin="round"/><circle cx="5" cy="50" r="3" fill="#ad1457"/><circle cx="30" cy="10" r="3" fill="#ad1457"/><circle cx="65" cy="45" r="3" fill="#ad1457"/><circle cx="95" cy="15" r="3" fill="#ad1457"/><text x="14" y="28" font-size="7" fill="#666">3</text><text x="46" y="34" font-size="7" fill="#666">4</text><text x="80" y="36" font-size="7" fill="#666">5</text></svg>
              <div><h3>⚡ Đường gấp khúc</h3><p>= đoạn 1 + đoạn 2 + ...</p><p class="lsg2-formula-ex">3+4+5 = ${numHtml(12, 18)}cm</p></div>
            </div>
          </div>
          <div class="lsg2-formula-card">
            <div style="display:flex;align-items:center;gap:10px;">
              <svg width="80" height="70" viewBox="0 0 80 70"><polygon points="40,5 10,65 70,65" fill="rgba(46,125,50,0.1)" stroke="#2e7d32" stroke-width="2.5" stroke-dasharray="6,3"/><text x="18" y="38" font-size="8" fill="#2e7d32">5</text><text x="56" y="38" font-size="8" fill="#2e7d32">6</text><text x="40" y="63" font-size="8" fill="#2e7d32" text-anchor="middle">7</text></svg>
              <div><h3>🔺 Chu vi tam giác</h3><p>P = a + b + c</p><p class="lsg2-formula-ex">5+6+7 = ${numHtml(18, 18)}cm</p></div>
            </div>
          </div>
          <div class="lsg2-formula-card">
            <div style="display:flex;align-items:center;gap:10px;">
              <svg width="80" height="65" viewBox="0 0 80 65"><polygon points="10,10 60,5 70,55 5,50" fill="rgba(103,58,183,0.1)" stroke="#673ab7" stroke-width="2.5" stroke-dasharray="6,3"/><text x="35" y="8" font-size="7" fill="#673ab7" text-anchor="middle">3</text><text x="70" y="32" font-size="7" fill="#673ab7">4</text><text x="35" y="60" font-size="7" fill="#673ab7" text-anchor="middle">5</text><text x="2" y="32" font-size="7" fill="#673ab7">6</text></svg>
              <div><h3>◇ Chu vi tứ giác</h3><p>P = a + b + c + d</p><p class="lsg2-formula-ex">3+4+5+6 = ${numHtml(18, 18)}cm</p></div>
            </div>
          </div>
        </div>
        <div style="margin-top:14px;"><button class="lc-btn lc-btn-primary" onclick="window._lessonShapes2.startStep2()">Luyện tập!</button></div>
      </div>`;
  }


  // ── Type 2: Perimeter calculation ──
  function renderPerimeterCalc() {
    const isTri = Math.random() > 0.5;
    const sides = isTri ? [randInt(3, 8), randInt(3, 8), randInt(3, 8)] : [randInt(2, 7), randInt(2, 7), randInt(2, 7), randInt(2, 7)];
    const ans = sides.reduce((s, v) => s + v, 0);
    state._periAns = ans;
    // Build shape SVG with labeled sides
    let shapeSvg;
    if (isTri) {
      shapeSvg = `<svg width="180" height="120" viewBox="0 0 180 120">
        <polygon points="90,10 20,105 160,105" fill="rgba(46,125,50,0.08)" stroke="#2e7d32" stroke-width="3"/>
        <text x="46" y="58" font-size="11" fill="#2e7d32" font-weight="700">${sides[0]} cm</text>
        <text x="118" y="58" font-size="11" fill="#2e7d32" font-weight="700">${sides[1]} cm</text>
        <text x="90" y="118" font-size="11" fill="#2e7d32" font-weight="700" text-anchor="middle">${sides[2]} cm</text>
      </svg>`;
    } else {
      shapeSvg = `<svg width="180" height="110" viewBox="0 0 180 110">
        <polygon points="20,15 160,15 160,95 20,95" fill="rgba(103,58,183,0.08)" stroke="#673ab7" stroke-width="3"/>
        <text x="90" y="12" font-size="11" fill="#673ab7" font-weight="700" text-anchor="middle">${sides[0]} cm</text>
        <text x="165" y="58" font-size="11" fill="#673ab7" font-weight="700">${sides[1]} cm</text>
        <text x="90" y="108" font-size="11" fill="#673ab7" font-weight="700" text-anchor="middle">${sides[2]} cm</text>
        <text x="5" y="58" font-size="11" fill="#673ab7" font-weight="700">${sides[3]} cm</text>
      </svg>`;
    }
    getScreen().querySelector('.lsg2-body').innerHTML = `
      <div class="lsg2-section">
        <div class="lsg2-header-row"><span class="lsg2-round-badge">Câu ${practiceRound}/8</span><span class="lsg2-score-badge">${S() ? S().named('star', 16) : '⭐'} ${numHtml(state.score, 20)}</span></div>
        <p class="lsg2-question">Chu vi hình ${isTri ? 'tam giác' : 'tứ giác'}? ${speakerBtn('Tính chu vi')}</p>
        <div style="margin:10px 0;">${shapeSvg}</div>
        <p class="lsg2-hint">P = ${sides.join(' + ')} = ?</p>
        <div class="lsg2-input-row">
          <input class="lsg2-input" id="lsg2-pi" type="number" inputmode="numeric" placeholder="?">
          <span style="font-weight:700;color:#666;">cm</span>
          <button class="lsg2-submit-btn" onclick="window._lessonShapes2.submitPerimeter()">OK</button>
        </div>
        <div class="lsg2-feedback" id="lsg2-fb"></div>
      </div>`;
  }
  function submitPerimeter() {
    const input = $('lsg2-pi'); if (!input) return;
    const val = parseInt(input.value, 10); if (isNaN(val)) return;
    state.total++; input.disabled = true;
    const btn = getScreen().querySelector('.lsg2-submit-btn'); if (btn) btn.disabled = true;
    const fb = $('lsg2-fb');
    if (val === state._periAns) { state.score++; playSound('correct'); if (fb) fb.innerHTML = `<div class="lsg2-fb-ok">${rand(PRAISE)} = ${numHtml(state._periAns, 24)} cm</div>`; }
    else { playSound('wrong'); if (fb) fb.innerHTML = `<div class="lsg2-fb-wrong">${rand(ENCOURAGE)} Đáp án: ${numHtml(state._periAns, 24)} cm</div>`; }
    setTimeout(() => nextPractice(), 1500);
  }


  // ── Type 3: Zigzag length ──
  function renderZigzagCalc() {
    const n = randInt(3, 4);
    const segs = Array.from({ length: n }, () => randInt(2, 9));
    const ans = segs.reduce((s, v) => s + v, 0);
    state._zigAns = ans;
    // Build zigzag SVG with labeled segments
    const pts = [{ x: 15, y: 70 }];
    const stepX = 250 / n;
    for (let i = 1; i <= n; i++) pts.push({ x: 15 + i * stepX, y: i % 2 === 1 ? 20 : 80 });
    let zigSvg = '<polyline points="' + pts.map(p => p.x + ',' + p.y).join(' ') + '" fill="none" stroke="#ad1457" stroke-width="3" stroke-linejoin="round"/>';
    const labels = 'ABCDE';
    pts.forEach((p, i) => { zigSvg += `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#ad1457"/><text x="${p.x}" y="${p.y + (p.y < 50 ? -8 : 16)}" text-anchor="middle" font-size="10" font-weight="700" fill="#ad1457">${labels[i]}</text>`; });
    for (let i = 0; i < n; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      const my = (pts[i].y + pts[i + 1].y) / 2 - 8;
      zigSvg += `<text x="${mx}" y="${my}" text-anchor="middle" font-size="10" font-weight="700" fill="#333">${segs[i]} cm</text>`;
    }
    getScreen().querySelector('.lsg2-body').innerHTML = `
      <div class="lsg2-section">
        <div class="lsg2-header-row"><span class="lsg2-round-badge">Câu ${practiceRound}/8</span><span class="lsg2-score-badge">${S() ? S().named('star', 16) : '⭐'} ${numHtml(state.score, 20)}</span></div>
        <p class="lsg2-question">Tính độ dài đường gấp khúc ${speakerBtn('Tính độ dài đường gấp khúc')}</p>
        <div style="margin:10px 0;"><svg width="280" height="100" viewBox="0 0 280 100">${zigSvg}</svg></div>
        <p class="lsg2-hint">${segs.join(' + ')} = ?</p>
        <div class="lsg2-input-row">
          <input class="lsg2-input" id="lsg2-zi" type="number" inputmode="numeric" placeholder="?">
          <span style="font-weight:700;color:#666;">cm</span>
          <button class="lsg2-submit-btn" onclick="window._lessonShapes2.submitZigzag()">OK</button>
        </div>
        <div class="lsg2-feedback" id="lsg2-fb"></div>
      </div>`;
  }
  function submitZigzag() {
    const input = $('lsg2-zi'); if (!input) return;
    const val = parseInt(input.value, 10); if (isNaN(val)) return;
    state.total++; input.disabled = true;
    const btn = getScreen().querySelector('.lsg2-submit-btn'); if (btn) btn.disabled = true;
    const fb = $('lsg2-fb');
    if (val === state._zigAns) { state.score++; playSound('correct'); if (fb) fb.innerHTML = `<div class="lsg2-fb-ok">${rand(PRAISE)} = ${numHtml(state._zigAns, 24)} cm</div>`; }
    else { playSound('wrong'); if (fb) fb.innerHTML = `<div class="lsg2-fb-wrong">${rand(ENCOURAGE)} Đáp án: ${numHtml(state._zigAns, 24)} cm</div>`; }
    setTimeout(() => nextPractice(), 1500);
  }

  // ── Type 3: "Xây rào công viên" — Word problem about perimeter ──
  const FENCE_PROBLEMS = [
    { text: 'Bác nông dân cần làm hàng rào quanh vườn hình tam giác có 3 cạnh: 5 m, 6 m, 7 m. Hàng rào dài bao nhiêu mét?', sides: [5, 6, 7], ans: 18, shape: 'tri' },
    { text: 'Sân trường hình tứ giác có 4 cạnh: 10 m, 8 m, 10 m, 8 m. Tính chu vi sân trường?', sides: [10, 8, 10, 8], ans: 36, shape: 'quad' },
    { text: 'Khung ảnh hình tam giác có 3 cạnh: 4 cm, 5 cm, 6 cm. Cần dây dài bao nhiêu để viền quanh?', sides: [4, 5, 6], ans: 15, shape: 'tri' },
    { text: 'Mảnh đất hình tứ giác có 4 cạnh: 7 m, 5 m, 6 m, 4 m. Tính chu vi mảnh đất?', sides: [7, 5, 6, 4], ans: 22, shape: 'quad' },
  ];

  function renderFenceWordProblem() {
    const p = rand(FENCE_PROBLEMS);
    state._fenceAns = p.ans;
    let shapeSvg;
    if (p.shape === 'tri') {
      shapeSvg = `<svg width="140" height="100" viewBox="0 0 140 100"><polygon points="70,8 15,90 125,90" fill="rgba(139,195,74,0.15)" stroke="#689f38" stroke-width="3"/><text x="35" y="52" font-size="10" fill="#689f38" font-weight="700">${p.sides[0]}</text><text x="100" y="52" font-size="10" fill="#689f38" font-weight="700">${p.sides[1]}</text><text x="70" y="98" font-size="10" fill="#689f38" font-weight="700" text-anchor="middle">${p.sides[2]}</text></svg>`;
    } else {
      shapeSvg = `<svg width="140" height="90" viewBox="0 0 140 90"><rect x="15" y="10" width="110" height="70" fill="rgba(139,195,74,0.15)" stroke="#689f38" stroke-width="3" rx="2"/><text x="70" y="8" font-size="10" fill="#689f38" font-weight="700" text-anchor="middle">${p.sides[0]}</text><text x="130" y="48" font-size="10" fill="#689f38" font-weight="700">${p.sides[1]}</text><text x="70" y="88" font-size="10" fill="#689f38" font-weight="700" text-anchor="middle">${p.sides[2]}</text><text x="5" y="48" font-size="10" fill="#689f38" font-weight="700">${p.sides[3]}</text></svg>`;
    }
    getScreen().querySelector('.lsg2-body').innerHTML = `
      <div class="lsg2-section">
        <div class="lsg2-header-row"><span class="lsg2-round-badge">Câu ${practiceRound}/8</span><span class="lsg2-score-badge">${S() ? S().named('star', 16) : '⭐'} ${numHtml(state.score, 20)}</span></div>
        <p class="lsg2-question">🌳 Xây rào công viên! ${speakerBtn(p.text)}</p>
        <div class="lsg2-word-problem">${p.text}</div>
        <div style="margin:8px 0;">${shapeSvg}</div>
        <p class="lsg2-hint">P = ${p.sides.join(' + ')} = ?</p>
        <div class="lsg2-input-row">
          <input class="lsg2-input" id="lsg2-fence" type="number" inputmode="numeric" placeholder="?">
          <span style="font-weight:700;color:#666;">${p.text.includes('cm') ? 'cm' : 'm'}</span>
          <button class="lsg2-submit-btn" onclick="window._lessonShapes2.submitFence()">OK</button>
        </div>
        <div class="lsg2-feedback" id="lsg2-fb"></div>
      </div>`;
  }

  function submitFence() {
    const input = $('lsg2-fence'); if (!input) return;
    const val = parseInt(input.value, 10); if (isNaN(val)) return;
    state.total++; input.disabled = true;
    const btn = getScreen().querySelector('.lsg2-submit-btn'); if (btn) btn.disabled = true;
    const fb = $('lsg2-fb');
    if (val === state._fenceAns) { state.score++; playSound('correct'); if (fb) fb.innerHTML = `<div class="lsg2-fb-ok">${rand(PRAISE)} Chu vi = ${numHtml(state._fenceAns, 24)}</div>`; }
    else { playSound('wrong'); if (fb) fb.innerHTML = `<div class="lsg2-fb-wrong">${rand(ENCOURAGE)} Đáp án: ${numHtml(state._fenceAns, 24)}</div>`; }
    setTimeout(() => nextPractice(), 1500);
  }

  // ── Type 4: "Nối điểm thẳng hàng" — Collinear points challenge ──
  const COLLINEAR_PROBLEMS = [
    { points: [{x:30,y:70},{x:90,y:40},{x:150,y:10},{x:200,y:80},{x:250,y:50}], collinear: [0,1,2], labels: ['A','B','C','D','E'] },
    { points: [{x:20,y:30},{x:80,y:60},{x:140,y:90},{x:200,y:20},{x:260,y:70}], collinear: [0,1,2], labels: ['M','N','P','Q','R'] },
    { points: [{x:40,y:80},{x:100,y:50},{x:220,y:50},{x:160,y:50},{x:260,y:20}], collinear: [1,3,2], labels: ['A','B','C','D','E'] },
  ];

  function renderCollinearChallenge() {
    const p = rand(COLLINEAR_PROBLEMS);
    state._collinearAns = p.collinear.map(i => p.labels[i]).sort().join('');
    state._collinearSelected = [];
    state._collinearData = p;

    const dotsSvg = p.points.map((pt, i) => `<circle cx="${pt.x}" cy="${pt.y}" r="14" fill="#e3f2fd" stroke="#1565c0" stroke-width="2.5" style="cursor:pointer;" data-idx="${i}"/><text x="${pt.x}" y="${pt.y + 4}" text-anchor="middle" font-size="11" font-weight="700" fill="#1565c0" style="pointer-events:none;">${p.labels[i]}</text>`).join('');

    getScreen().querySelector('.lsg2-body').innerHTML = `
      <div class="lsg2-section">
        <div class="lsg2-header-row"><span class="lsg2-round-badge">Câu ${practiceRound}/8</span><span class="lsg2-score-badge">${S() ? S().named('star', 16) : '⭐'} ${numHtml(state.score, 20)}</span></div>
        <p class="lsg2-question">🐦 Tìm 3 điểm thẳng hàng! ${speakerBtn('Chạm 3 điểm cùng nằm trên 1 đường thẳng')}</p>
        <p class="lsg2-hint">Chạm 3 điểm mà bé nghĩ cùng nằm trên 1 đường thẳng!</p>
        <div style="margin:8px 0;">
          <svg id="lsg2-collinear-svg" width="280" height="100" viewBox="0 0 280 100" style="background:#fff;border-radius:12px;border:2px solid #e0e0e0;touch-action:none;">${dotsSvg}</svg>
        </div>
        <div class="lsg2-feedback" id="lsg2-fb"></div>
      </div>`;
    // Attach tap listeners
    const svg = $('lsg2-collinear-svg');
    svg.querySelectorAll('circle').forEach(c => {
      c.addEventListener('click', () => window._lessonShapes2.tapCollinear(parseInt(c.dataset.idx)));
      c.addEventListener('touchend', (e) => { e.preventDefault(); window._lessonShapes2.tapCollinear(parseInt(c.dataset.idx)); });
    });
  }

  function tapCollinear(idx) {
    const sel = state._collinearSelected;
    if (sel.includes(idx)) return;
    sel.push(idx);
    playSound('click');
    const svg = $('lsg2-collinear-svg');
    const circles = svg.querySelectorAll('circle');
    circles[idx].setAttribute('fill', '#bbdefb');
    circles[idx].setAttribute('stroke', '#0d47a1');

    if (sel.length >= 3) {
      state.total++;
      const picked = sel.map(i => state._collinearData.labels[i]).sort().join('');
      const fb = $('lsg2-fb');
      svg.style.pointerEvents = 'none';
      if (picked === state._collinearAns) {
        state.score++; playSound('correct');
        // Draw line through the 3 collinear points
        const pts = state._collinearData.collinear.map(i => state._collinearData.points[i]);
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', 0); line.setAttribute('y1', pts[0].y - (pts[0].x * (pts[2].y - pts[0].y) / (pts[2].x - pts[0].x)));
        line.setAttribute('x2', 280); line.setAttribute('y2', pts[0].y + ((280 - pts[0].x) * (pts[2].y - pts[0].y) / (pts[2].x - pts[0].x)));
        line.setAttribute('stroke', '#4caf50'); line.setAttribute('stroke-width', '2'); line.setAttribute('stroke-dasharray', '5,3');
        svg.insertBefore(line, svg.firstChild);
        if (fb) fb.innerHTML = `<div class="lsg2-fb-ok">${rand(PRAISE)} 3 điểm thẳng hàng! ✓</div>`;
      } else {
        playSound('wrong');
        const correct = state._collinearData.collinear.map(i => state._collinearData.labels[i]).join(', ');
        if (fb) fb.innerHTML = `<div class="lsg2-fb-wrong">${rand(ENCOURAGE)} Đáp án: ${correct}</div>`;
      }
      setTimeout(() => nextPractice(), 1800);
    }
  }
  // ══════════════════════════════════════════════════════════════════
  let practiceRound = 0;
  function startStep2() { state.step = 2; practiceRound = 0; state.score = 0; state.total = 0; nextPractice(); updateProgress(); }
  function nextPractice() {
    practiceRound++;
    if (practiceRound > 8) { showReward(); return; }
    if (practiceRound <= 2) renderCountQuads();
    else if (practiceRound <= 4) renderPerimeterCalc();
    else if (practiceRound <= 6) renderFenceWordProblem();
    else renderCollinearChallenge();
    updateProgress();
  }

  // ── Type 1: Count shapes ──
  const QUAD_PROBLEMS = [
    { svg: '<rect x="20" y="20" width="120" height="80" fill="none" stroke="#673ab7" stroke-width="2.5"/><line x1="20" y1="20" x2="140" y2="100" stroke="#673ab7" stroke-width="2"/>', q: 'Có bao nhiêu hình tứ giác?', ans: 1 },
    { svg: '<rect x="20" y="20" width="120" height="80" fill="none" stroke="#673ab7" stroke-width="2.5"/><line x1="80" y1="20" x2="80" y2="100" stroke="#673ab7" stroke-width="2"/>', q: 'Có bao nhiêu hình tứ giác?', ans: 3 },
    { svg: '<polygon points="30,90 80,20 130,90" fill="none" stroke="#673ab7" stroke-width="2.5"/><line x1="55" y1="55" x2="105" y2="55" stroke="#673ab7" stroke-width="2"/>', q: 'Có bao nhiêu hình tam giác?', ans: 3 },
    { svg: '<rect x="20" y="20" width="120" height="80" fill="none" stroke="#673ab7" stroke-width="2.5"/><line x1="20" y1="60" x2="140" y2="60" stroke="#673ab7" stroke-width="2"/><line x1="80" y1="20" x2="80" y2="100" stroke="#673ab7" stroke-width="2"/>', q: 'Có bao nhiêu hình tứ giác?', ans: 5 },
    { svg: '<polygon points="20,100 80,20 140,100" fill="none" stroke="#673ab7" stroke-width="2.5"/>', q: 'Có bao nhiêu hình tam giác?', ans: 1 },
    { svg: '<rect x="30" y="20" width="100" height="80" fill="none" stroke="#673ab7" stroke-width="2.5"/><line x1="30" y1="20" x2="130" y2="100" stroke="#673ab7" stroke-width="2"/><line x1="130" y1="20" x2="30" y2="100" stroke="#673ab7" stroke-width="2"/>', q: 'Có bao nhiêu hình tam giác?', ans: 4 },
  ];
  let _usedQuadIdx = [];

  function renderCountQuads() {
    if (_usedQuadIdx.length >= QUAD_PROBLEMS.length) _usedQuadIdx = [];
    let idx;
    do { idx = Math.floor(Math.random() * QUAD_PROBLEMS.length); } while (_usedQuadIdx.includes(idx));
    _usedQuadIdx.push(idx);
    const p = QUAD_PROBLEMS[idx];
    const opts = shuffle([p.ans, p.ans + 1, Math.max(1, p.ans - 1)]);
    const ci = opts.indexOf(p.ans);
    getScreen().querySelector('.lsg2-body').innerHTML = `
      <div class="lsg2-section">
        <div class="lsg2-header-row"><span class="lsg2-round-badge">Câu ${practiceRound}/8</span><span class="lsg2-score-badge">${S() ? S().named('star', 16) : '⭐'} ${numHtml(state.score, 20)}</span></div>
        <p class="lsg2-question">${p.q} ${speakerBtn(p.q)}</p>
        <div class="lsg2-shape-display"><svg width="160" height="120" viewBox="0 0 160 120">${p.svg}</svg></div>
        <div class="lsg2-options">${opts.map((o, i) => `<button class="lsg2-opt" onclick="window._lessonShapes2.answerCount(${i},${ci})">${numHtml(o, 28)}</button>`).join('')}</div>
        <div class="lsg2-feedback" id="lsg2-fb"></div>
      </div>`;
  }
  function answerCount(picked, ci) {
    state.total++;
    const opts = getScreen().querySelectorAll('.lsg2-opt');
    opts.forEach((o, i) => { o.style.pointerEvents = 'none'; if (i === ci) o.classList.add('lsg2-opt-correct'); if (i === picked && i !== ci) o.classList.add('lsg2-opt-wrong'); });
    const fb = $('lsg2-fb');
    if (picked === ci) { state.score++; playSound('correct'); if (fb) fb.innerHTML = `<div class="lsg2-fb-ok">${rand(PRAISE)}</div>`; }
    else { playSound('wrong'); if (fb) fb.innerHTML = `<div class="lsg2-fb-wrong">${rand(ENCOURAGE)}</div>`; }
    setTimeout(() => nextPractice(), 1500);
  }


  // ══════════════════════════════════════════════════════════════════
  // STEP 3: Reward
  // ══════════════════════════════════════════════════════════════════
  function showReward() {
    state.step = 3; playSound('win');
    const stars = state.score >= 6 ? 3 : state.score >= 4 ? 2 : 1;
    const starsHtml = Array.from({ length: 3 }, (_, i) =>
      S() ? S().el(2, 0, 0, i < stars ? 36 : 24, i >= stars ? 'lsg2-star-dim' : '') : (i < stars ? '⭐' : '☆')
    ).join(' ');
    const msg = stars === 3 ? 'Xuất sắc! Chuyên gia Hình học!' : stars === 2 ? 'Tốt lắm!' : 'Cố gắng thêm nhé!';
    speak(msg);
    getScreen().querySelector('.lsg2-body').innerHTML = `
      <div class="lsg2-reward">
        <div class="lsg2-reward-stars">${starsHtml}</div>
        <h2 class="lsg2-reward-title">${msg}</h2>
        <div class="lsg2-reward-score">Đúng ${numHtml(state.score, 32)} / ${numHtml(state.total, 32)} câu</div>
        <div class="lsg2-reward-concepts">
          <div class="lsg2-concept">Đoạn thẳng: 2 điểm giới hạn</div>
          <div class="lsg2-concept">Đường gấp khúc = tổng các đoạn</div>
          <div class="lsg2-concept">Chu vi = tổng các cạnh</div>
        </div>
        <div class="lsg2-reward-actions">
          <button class="lc-btn lc-btn-secondary" onclick="window._lessonShapes2.restart()">Học lại</button>
          <button class="lc-btn lc-btn-primary" onclick="showScreen('menu-screen')">Về menu</button>
        </div>
      </div>`;
    if (window.HocVuiCollection && window.HocVuiCollection.reward) window.HocVuiCollection.reward(stars);
    updateProgress();
  }

  function restart() { state = { step: 0, score: 0, total: 0, round: 0, exploreTab: 0 }; practiceRound = 0; renderExplore(); }
  function open() { show(); restart(); }


  // ══════════════════════════════════════════════════════════════════
  // STEP 0: Explore — Tabs for 4 concepts
  // ══════════════════════════════════════════════════════════════════
  const EXPLORE_TABS = [
    { id: 'line', label: '📏 Đoạn thẳng' },
    { id: 'zigzag', label: '⚡ Gấp khúc' },
    { id: 'quad', label: '◇ Tứ giác' },
    { id: 'perimeter', label: '🔲 Chu vi' },
  ];

  function renderExplore() {
    state.step = 0; state.exploreTab = 0;
    const body = getScreen().querySelector('.lsg2-body');
    body.innerHTML = `
      <div class="lsg2-section">
        <p class="lsg2-title">Khám phá Hình học! ${speakerBtn('Khám phá các khái niệm hình học lớp 2')}</p>
        <div class="lsg2-tabs" id="lsg2-tabs">
          ${EXPLORE_TABS.map((t, i) => `<button class="lsg2-tab ${i === 0 ? 'active' : ''}" onclick="window._lessonShapes2.switchExplore(${i})">${t.label}</button>`).join('')}
        </div>
        <div id="lsg2-explore-content"></div>
        <div id="lsg2-explore-next" style="margin-top:12px;">
          <button class="lc-btn lc-btn-primary" onclick="window._lessonShapes2.startStep1()">Tiếp tục!</button>
        </div>
      </div>`;
    renderExploreTab(0);
    updateProgress();
  }

  function switchExplore(idx) {
    state.exploreTab = idx;
    getScreen().querySelectorAll('.lsg2-tab').forEach((t, i) => t.classList.toggle('active', i === idx));
    renderExploreTab(idx);
  }

  function renderExploreTab(idx) {
    const el = $('lsg2-explore-content');
    if (idx === 0) renderLineInteractive(el);
    else if (idx === 1) renderZigzagInteractive(el);
    else if (idx === 2) el.innerHTML = `<div class="lsg2-visual-card"><svg width="280" height="130" viewBox="0 0 280 130"><polygon points="40,30 180,20 200,110 30,100" fill="rgba(103,58,183,0.1)" stroke="#673ab7" stroke-width="3"/><circle cx="40" cy="30" r="4" fill="#673ab7"/><circle cx="180" cy="20" r="4" fill="#673ab7"/><circle cx="200" cy="110" r="4" fill="#673ab7"/><circle cx="30" cy="100" r="4" fill="#673ab7"/><text x="30" y="22" font-size="10" fill="#673ab7">A</text><text x="190" y="16" font-size="10" fill="#673ab7">B</text><text x="210" y="115" font-size="10" fill="#673ab7">C</text><text x="18" y="106" font-size="10" fill="#673ab7">D</text></svg><p class="lsg2-explain">• <strong>Hình tứ giác</strong>: 4 cạnh, 4 đỉnh, 4 góc<br>• Vuông, chữ nhật cũng là tứ giác!</p></div>`;
    else el.innerHTML = `<div class="lsg2-visual-card"><svg width="280" height="120" viewBox="0 0 280 120"><polygon points="60,100 140,20 220,100" fill="rgba(46,125,50,0.1)" stroke="#2e7d32" stroke-width="3" stroke-dasharray="8,4"/><text x="90" y="65" font-size="10" fill="#2e7d32">5cm</text><text x="185" y="65" font-size="10" fill="#2e7d32">6cm</text><text x="140" y="116" font-size="10" fill="#2e7d32">7cm</text><text x="140" y="12" text-anchor="middle" font-size="10" fill="#555">Chu vi = 5+6+7 = 18 cm</text></svg><p class="lsg2-explain">• <strong>Chu vi</strong> = tổng độ dài các cạnh<br>• Tam giác: P = a+b+c | Tứ giác: P = a+b+c+d</p></div>`;
    if (idx === 2) speak('Hình tứ giác có 4 cạnh và 4 góc.');
    else if (idx === 3) speak('Chu vi bằng tổng các cạnh.');
  }

  // ── Interactive: Tap to place points, draw segment, extend to line ──
  let lineState = { points: [], phase: 'tap1' }; // tap1 → tap2 → segment → line
  function renderLineInteractive(el) {
    lineState = { points: [], phase: 'tap1' };
    el.innerHTML = `
      <div class="lsg2-visual-card" style="position:relative;">
        <p class="lsg2-hint" id="lsg2-line-hint">Chạm vào mặt phẳng để đặt điểm A!</p>
        <svg id="lsg2-line-svg" width="280" height="160" viewBox="0 0 280 160" style="background:repeating-linear-gradient(0deg,transparent,transparent 19px,#e0e0e044 19px,#e0e0e044 20px),repeating-linear-gradient(90deg,transparent,transparent 19px,#e0e0e044 19px,#e0e0e044 20px);border-radius:12px;cursor:crosshair;touch-action:none;"></svg>
        <p class="lsg2-explain" id="lsg2-line-explain"></p>
      </div>`;
    const svg = $('lsg2-line-svg');
    svg.addEventListener('click', onLineClick);
    svg.addEventListener('touchend', (e) => { e.preventDefault(); const t = e.changedTouches[0]; const r = svg.getBoundingClientRect(); onLineClickAt(t.clientX - r.left, t.clientY - r.top); });
    speak('Chạm vào mặt phẳng để đặt điểm A!');
  }

  function onLineClick(e) { const r = e.currentTarget.getBoundingClientRect(); onLineClickAt(e.clientX - r.left, e.clientY - r.top); }

  function onLineClickAt(x, y) {
    const svg = $('lsg2-line-svg');
    const hint = $('lsg2-line-hint');
    const explain = $('lsg2-line-explain');
    if (!svg) return;
    const sx = x * 280 / svg.getBoundingClientRect().width;
    const sy = y * 160 / svg.getBoundingClientRect().height;

    if (lineState.phase === 'tap1') {
      lineState.points.push({ x: sx, y: sy });
      svg.innerHTML += `<circle cx="${sx}" cy="${sy}" r="6" fill="#1565c0"/><text x="${sx}" y="${sy - 10}" text-anchor="middle" font-size="12" font-weight="700" fill="#1565c0">A</text>`;
      lineState.phase = 'tap2';
      if (hint) hint.textContent = 'Chạm thêm 1 điểm nữa để đặt điểm B!';
      playSound('click'); speak('Điểm A! Chạm thêm 1 điểm nữa!');
    } else if (lineState.phase === 'tap2') {
      lineState.points.push({ x: sx, y: sy });
      const A = lineState.points[0], B = lineState.points[1];
      svg.innerHTML += `<circle cx="${sx}" cy="${sy}" r="6" fill="#1565c0"/><text x="${sx}" y="${sy - 10}" text-anchor="middle" font-size="12" font-weight="700" fill="#1565c0">B</text>`;
      svg.innerHTML += `<line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" stroke="#2e7d32" stroke-width="3"/>`;
      lineState.phase = 'segment';
      if (hint) hint.textContent = 'Đoạn thẳng AB! Chạm lần nữa để kéo dài thành đường thẳng →';
      if (explain) explain.innerHTML = '✓ <strong>Đoạn thẳng AB</strong>: có 2 điểm giới hạn A và B';
      playSound('correct'); speak('Đoạn thẳng AB! Chạm lần nữa để kéo dài.');
    } else if (lineState.phase === 'segment') {
      const A = lineState.points[0], B = lineState.points[1];
      const dx = B.x - A.x, dy = B.y - A.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const ext = 300 / len;
      const x1 = A.x - dx * ext, y1 = A.y - dy * ext;
      const x2 = B.x + dx * ext, y2 = B.y + dy * ext;
      svg.innerHTML = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#e65100" stroke-width="2.5"/><circle cx="${A.x}" cy="${A.y}" r="5" fill="#1565c0"/><circle cx="${B.x}" cy="${B.y}" r="5" fill="#1565c0"/><text x="${A.x}" y="${A.y - 10}" text-anchor="middle" font-size="12" font-weight="700" fill="#1565c0">A</text><text x="${B.x}" y="${B.y - 10}" text-anchor="middle" font-size="12" font-weight="700" fill="#1565c0">B</text><text x="140" y="155" text-anchor="middle" font-size="10" fill="#e65100">← Đường thẳng (kéo dài mãi) →</text>`;
      lineState.phase = 'done';
      if (hint) hint.textContent = 'Đường thẳng AB kéo dài mãi về 2 phía!';
      if (explain) explain.innerHTML = '✓ <strong>Đường thẳng</strong>: kéo dài vô tận, không có điểm giới hạn';
      playSound('correct'); speak('Đường thẳng kéo dài mãi về hai phía!');
    }
  }

  // ── Interactive: Connect-the-dots zigzag (ant path) ──
  let zigState = { dots: [], connected: 0 };
  function renderZigzagInteractive(el) {
    const dots = [{ x: 30, y: 120, label: 'A' }, { x: 90, y: 30, label: 'B' }, { x: 180, y: 110, label: 'C' }, { x: 260, y: 40, label: 'D' }];
    zigState = { dots, connected: 0 };
    el.innerHTML = `
      <div class="lsg2-visual-card" style="position:relative;">
        <p class="lsg2-hint" id="lsg2-zig-hint">🐜 Chạm lần lượt các điểm A→B→C→D để kiến bò!</p>
        <svg id="lsg2-zig-svg" width="290" height="140" viewBox="0 0 290 140" style="border-radius:12px;touch-action:none;">
          ${dots.map(d => `<circle cx="${d.x}" cy="${d.y}" r="12" fill="#f8bbd0" stroke="#ad1457" stroke-width="2" style="cursor:pointer;" data-label="${d.label}"/><text x="${d.x}" y="${d.y + 4}" text-anchor="middle" font-size="11" font-weight="700" fill="#ad1457" style="pointer-events:none;">${d.label}</text>`).join('')}
          <text x="25" y="12" font-size="18">🐜</text>
        </svg>
        <p class="lsg2-explain" id="lsg2-zig-explain"></p>
      </div>`;
    const svg = $('lsg2-zig-svg');
    svg.querySelectorAll('circle').forEach(c => {
      c.addEventListener('click', () => onZigDotClick(c.dataset.label));
      c.addEventListener('touchend', (e) => { e.preventDefault(); onZigDotClick(c.dataset.label); });
    });
    speak('Chạm lần lượt các điểm A, B, C, D để kiến bò!');
  }

  function onZigDotClick(label) {
    const expected = zigState.dots[zigState.connected];
    if (!expected || label !== expected.label) { playSound('wrong'); return; }
    const svg = $('lsg2-zig-svg');
    const hint = $('lsg2-zig-hint');
    const explain = $('lsg2-zig-explain');
    zigState.connected++;
    playSound('click');
    // Highlight dot
    svg.querySelectorAll('circle').forEach(c => { if (c.dataset.label === label) { c.setAttribute('fill', '#ad1457'); } });
    // Draw line segment
    if (zigState.connected > 1) {
      const prev = zigState.dots[zigState.connected - 2];
      const curr = zigState.dots[zigState.connected - 1];
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', prev.x); line.setAttribute('y1', prev.y);
      line.setAttribute('x2', curr.x); line.setAttribute('y2', curr.y);
      line.setAttribute('stroke', '#ad1457'); line.setAttribute('stroke-width', '3');
      svg.insertBefore(line, svg.firstChild);
      speak(`Đoạn ${prev.label}${curr.label}!`);
    } else {
      speak('Điểm A!');
    }
    if (hint) hint.textContent = zigState.connected < 4 ? `Chạm điểm ${zigState.dots[zigState.connected].label}!` : '🐜 Kiến đã bò xong! Đường gấp khúc ABCD!';
    if (zigState.connected >= 4) {
      if (explain) explain.innerHTML = '✓ <strong>Đường gấp khúc ABCD</strong>: 3 đoạn thẳng AB, BC, CD nối tiếp nhau';
      playSound('correct'); speak('Đường gấp khúc ABCD gồm 3 đoạn thẳng!');
    }
  }

  // ── Public API & Hook ──
  window._lessonShapes2 = { open, restart, speak, switchExplore, startStep1, startStep2, answerCount, submitPerimeter, submitZigzag, submitFence, tapCollinear, onLineClickAt, onZigDotClick };
  document.addEventListener('DOMContentLoaded', () => { setTimeout(() => { if (typeof openTopic === 'function') { const _o = openTopic; window.openTopic = function (t) { if (t === 'shapes') { window._lessonShapes2.open(); return; } _o(t); }; } }, 0); });
})();
