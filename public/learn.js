// === LEARN MODULE ===
let currentTopic = null;
let currentSlide = 0;
let slides = [];

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function renderSlide() {
  const body = document.getElementById('lesson-body');
  body.innerHTML = `<div class="slide">${slides[currentSlide]}</div>`;
  document.getElementById('lesson-page').textContent = `${currentSlide + 1}/${slides.length}`;
  document.getElementById('lesson-dots').innerHTML = slides.map((_, i) =>
    `<div class="l-dot ${i === currentSlide ? 'active' : ''}" onclick="goSlide(${i})"></div>`
  ).join('');
}

function nextSlide() { if (currentSlide < slides.length - 1) { currentSlide++; renderSlide(); } }
function prevSlide() { if (currentSlide > 0) { currentSlide--; renderSlide(); } }
function goSlide(i) { currentSlide = i; renderSlide(); }

// Swipe support
let touchStartX = 0;
document.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; });
document.addEventListener('touchend', e => {
  const diff = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(diff) > 50) { diff > 0 ? prevSlide() : nextSlide(); }
});

const TOPIC_NAMES = {
  // 5 tuổi (mầm non)
  count0: '🔢 Đếm 1-5',
  compare0: '⚖️ Nhiều - Ít',
  size0: '🐘 To - Nhỏ',
  colors0: '🌈 Màu Sắc',
  shapes0: '🔷 Hình Dạng',
  animals0: '🐶 Con Vật',
  // Lớp 1
  count1: '🔢 Đếm Đến 20',
  add1: '➕ Phép Cộng',
  sub1: '➖ Phép Trừ',
  compare1: '⚖️ So Sánh Số',
  order1: '🔢 Thứ Tự Số',
  shapes1: '🔷 Hình Khối',
  // Grade 2
  clock: '🕐 Đồng Hồ',
  units: '📏 Đo Lường',
  multiply: '✖️ Bảng Nhân',
  carry: '➕ Cộng Có Nhớ',
  shapes: '🔷 Hình Học',
  money: '💰 Tiền Việt Nam',
  // Grade 3
  mul3: '✖️ Bảng Nhân 6-9',
  div3: '➗ Phép Chia',
  fractions3: '🍕 Phân Số',
  perimeter3: '📐 Chu Vi & Diện Tích',
  time3: '📅 Thời Gian',
  calc3: '🧮 Tính Nhẩm',
  // Grade 4
  bignum4: '🔢 Số Lớn',
  fractions4: '🍕 Phân Số',
  angle4: '📐 Góc & Hình',
  area4: '⬜ Diện Tích',
  average4: '📊 Trung Bình Cộng',
  expr4: '🧮 Biểu Thức',
  // Grade 5
  decimal5: '🔢 Số Thập Phân',
  percent5: '💯 Phần Trăm',
  area5: '📐 Diện Tích',
  volume5: '📦 Thể Tích',
  speed5: '🚗 Chuyển Động',
  ratio5: '⚖️ Tỉ Lệ',
};

// SVG Clock generator
function clockSVG(hour, minute, size = 180) {
  const cx = size / 2, cy = size / 2, r = size / 2 - 10;
  // Hour hand angle
  const hAngle = ((hour % 12) + minute / 60) * 30 - 90;
  const hLen = r * 0.5;
  const hx = cx + hLen * Math.cos(hAngle * Math.PI / 180);
  const hy = cy + hLen * Math.sin(hAngle * Math.PI / 180);
  // Minute hand angle
  const mAngle = minute * 6 - 90;
  const mLen = r * 0.75;
  const mx = cx + mLen * Math.cos(mAngle * Math.PI / 180);
  const my = cy + mLen * Math.sin(mAngle * Math.PI / 180);
  // Numbers
  let nums = '';
  for (let i = 1; i <= 12; i++) {
    const a = (i * 30 - 90) * Math.PI / 180;
    const nx = cx + (r - 18) * Math.cos(a);
    const ny = cy + (r - 18) * Math.sin(a);
    nums += `<text x="${nx}" y="${ny}" text-anchor="middle" dominant-baseline="central" font-size="${size * 0.1}" font-weight="bold" fill="#333">${i}</text>`;
  }
  // Tick marks
  let ticks = '';
  for (let i = 0; i < 60; i++) {
    const a = (i * 6 - 90) * Math.PI / 180;
    const outer = r - 3;
    const inner = i % 5 === 0 ? r - 10 : r - 6;
    ticks += `<line x1="${cx + inner * Math.cos(a)}" y1="${cy + inner * Math.sin(a)}" x2="${cx + outer * Math.cos(a)}" y2="${cy + outer * Math.sin(a)}" stroke="#666" stroke-width="${i % 5 === 0 ? 2 : 1}"/>`;
  }
  return `<svg class="clock-svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="white" stroke="#333" stroke-width="3"/>
    ${ticks}${nums}
    <line x1="${cx}" y1="${cy}" x2="${hx}" y2="${hy}" stroke="#333" stroke-width="4" stroke-linecap="round"/>
    <line x1="${cx}" y1="${cy}" x2="${mx}" y2="${my}" stroke="#2196F3" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${cy}" r="4" fill="#f44336"/>
  </svg>`;
}

function clockWithLabel(hour, minute, size = 140) {
  const label = minute === 0 ? `${hour} giờ` : `${hour} giờ ${minute} phút`;
  return `<div style="display:inline-block;text-align:center;margin:5px">${clockSVG(hour, minute, size)}<div style="font-weight:bold;margin-top:5px">${label}</div></div>`;
}

// === LESSON CONTENT ===
const LESSONS = {

// ==================== 5 TUỔI — ĐẾM 1-5 ====================
count0: [
  `<h2>🔢 Tập đếm</h2>
  <div class="visual">🍎</div>
  <p>Đây là <strong>1</strong> quả táo. Đọc to: "Một!"</p>
  <p class="tip">Mỗi đồ vật đếm 1 lần thôi nhé!</p>`,
  `<h2>Đếm đến 3</h2>
  <div class="visual">⭐ ⭐ ⭐</div>
  <p>1... 2... 3! Có <strong>3</strong> ngôi sao.</p>
  <div class="highlight">Chỉ tay vào từng ngôi sao và đếm: một, hai, ba.</div>`,
  `<h2>Đếm đến 5</h2>
  <div class="visual">🐥 🐥 🐥 🐥 🐥</div>
  <p>1, 2, 3, 4, 5 — có <strong>5</strong> chú gà con!</p>
  <p class="tip">Con thử đếm ngón tay trên một bàn tay xem: cũng là 5 đó!</p>`,
  `<h2>👆 Thực hành đếm</h2>
  <div id="count0-practice" class="practice-zone">
    <div class="practice-q" id="count0-q"></div>
    <div class="practice-options" id="count0-opts"></div>
    <div class="practice-result" id="count0-result"></div>
    <button class="ln-btn" onclick="newCount0Practice()" style="margin-top:12px">🎲 Câu mới</button>
    <div class="practice-score">✅ <span id="count0-score">0</span></div>
  </div>
  <script>newCount0Practice()</script>`,
],

// ==================== 5 TUỔI — NHIỀU - ÍT ====================
compare0: [
  `<h2>⚖️ Bên nào nhiều hơn?</h2>
  <div class="visual">🍓🍓🍓🍓</div>
  <div class="visual">🍌🍌</div>
  <p>Hàng dâu có <strong>4</strong>, hàng chuối có <strong>2</strong>.</p>
  <div class="highlight">🍓 nhiều hơn 🍌 (4 > 2)</div>`,
  `<h2>Bên nào ít hơn?</h2>
  <div class="visual">🐶🐶🐶</div>
  <div class="visual">🐱🐱🐱🐱🐱</div>
  <p>Chó có 3, mèo có 5. <strong>🐶 ít hơn 🐱</strong>.</p>
  <p class="tip">Ít hơn nghĩa là số lượng nhỏ hơn.</p>`,
  `<h2>👆 Thực hành nhiều-ít</h2>
  <div id="compare0-practice" class="practice-zone">
    <div class="practice-q" id="compare0-q"></div>
    <div class="practice-options" id="compare0-opts"></div>
    <div class="practice-result" id="compare0-result"></div>
    <button class="ln-btn" onclick="newCompare0Practice()" style="margin-top:12px">🎲 Câu mới</button>
    <div class="practice-score">✅ <span id="compare0-score">0</span></div>
  </div>
  <script>newCompare0Practice()</script>`,
],

// ==================== 5 TUỔI — TO - NHỎ ====================
size0: [
  `<h2>🐘 To và nhỏ</h2>
  <div class="visual">🐘 ... 🐭</div>
  <p>Con voi <strong>TO</strong>, con chuột <strong>NHỎ</strong>.</p>
  <div class="highlight">To = lớn hơn &nbsp;|&nbsp; Nhỏ = bé hơn</div>`,
  `<h2>Cái nào to hơn?</h2>
  <div class="visual">🍉 và 🍒</div>
  <p>Quả dưa hấu 🍉 to hơn quả anh đào 🍒.</p>`,
  `<h2>Thêm ví dụ</h2>
  <div class="visual">🌳 và 🌱</div>
  <p>Cây 🌳 to hơn mầm cây 🌱.</p>
  <div class="visual">🚌 và 🚲</div>
  <p>Xe buýt 🚌 to hơn xe đạp 🚲.</p>
  <p class="tip">Nhìn xem cái nào chiếm nhiều chỗ hơn là cái đó to hơn.</p>`,
  `<h2>👆 Thực hành to-nhỏ</h2>
  <div id="size0-practice" class="practice-zone">
    <div class="practice-q" id="size0-q"></div>
    <div class="practice-options" id="size0-opts"></div>
    <div class="practice-result" id="size0-result"></div>
    <button class="ln-btn" onclick="newSize0Practice()" style="margin-top:12px">🎲 Câu mới</button>
    <div class="practice-score">✅ <span id="size0-score">0</span></div>
  </div>
  <script>newSize0Practice()</script>`,
],

// ==================== 5 TUỔI — MÀU SẮC ====================
colors0: [
  `<h2>🌈 Các màu cơ bản</h2>
  <div class="visual">🔴 🟡 🔵</div>
  <p><strong>Đỏ - Vàng - Xanh dương</strong></p>
  <div class="highlight">🍎 màu đỏ &nbsp; 🍌 màu vàng &nbsp; 💧 màu xanh dương</div>`,
  `<h2>Thêm vài màu nữa</h2>
  <div class="visual">🟢 🟠 🟣</div>
  <p><strong>Xanh lá - Cam - Tím</strong></p>
  <p>🍀 xanh lá, 🍊 cam, 🍇 tím.</p>`,
  `<h2>Tìm đồ vật cùng màu</h2>
  <p>Đỏ: 🍎 🍓 🌹 ❤️</p>
  <p>Vàng: 🍌 🌟 🌼 🧀</p>
  <p>Xanh lá: 🍀 🥦 🐸 🌲</p>
  <p>Cam: 🍊 🥕 🦊</p>
  <p class="tip">Con tìm đồ vật quanh nhà cùng màu nhé!</p>`,
  `<h2>👆 Thực hành chọn màu</h2>
  <div id="colors0-practice" class="practice-zone">
    <div class="practice-q" id="colors0-q"></div>
    <div class="practice-options" id="colors0-opts"></div>
    <div class="practice-result" id="colors0-result"></div>
    <button class="ln-btn" onclick="newColors0Practice()" style="margin-top:12px">🎲 Câu mới</button>
    <div class="practice-score">✅ <span id="colors0-score">0</span></div>
  </div>
  <script>newColors0Practice()</script>`,
],

// ==================== 5 TUỔI — HÌNH DẠNG ====================
shapes0: [
  `<h2>🔷 Các hình quen thuộc</h2>
  <div class="visual">⭕ 🟦 🔺</div>
  <p><strong>Hình tròn - Hình vuông - Hình tam giác</strong></p>
  <div class="highlight">Tròn không có góc, vuông có 4 góc, tam giác có 3 góc.</div>`,
  `<h2>Tìm hình quanh em</h2>
  <div class="visual">🕐 ⬜ 🍕</div>
  <p>Đồng hồ tròn, cửa sổ vuông, miếng bánh tam giác.</p>
  <p class="tip">Hình tròn giống bánh xe, mặt trời!</p>`,
  `<h2>👆 Thực hành hình dạng</h2>
  <div id="shapes0-practice" class="practice-zone">
    <div class="practice-q" id="shapes0-q"></div>
    <div class="practice-options" id="shapes0-opts"></div>
    <div class="practice-result" id="shapes0-result"></div>
    <button class="ln-btn" onclick="newShapes0Practice()" style="margin-top:12px">🎲 Câu mới</button>
    <div class="practice-score">✅ <span id="shapes0-score">0</span></div>
  </div>
  <script>newShapes0Practice()</script>`,
],

// ==================== 5 TUỔI — CON VẬT ====================
animals0: [
  `<h2>🐶 Con vật kêu thế nào?</h2>
  <div class="visual" style="font-size:2.5rem">🐶 🐱 🐮</div>
  <p>🐶 "Gâu gâu" &nbsp; 🐱 "Meo meo" &nbsp; 🐮 "Bò ò"</p>
  <div class="highlight">Đọc to tiếng kêu cùng bố mẹ nhé!</div>`,
  `<h2>Tiếng kêu các bạn nhà nông</h2>
  <div class="visual" style="font-size:2.5rem">🐓 🐷 🦆 🐑</div>
  <p>🐓 "Ò ó o" &nbsp; 🐷 "Ụt ịt"<br>🦆 "Cạp cạp" &nbsp; 🐑 "Be be"</p>`,
  `<h2>Con vật sống ở đâu?</h2>
  <p>🐟 Cá — sống dưới <strong>nước</strong></p>
  <p>🐦 Chim — bay trên <strong>trời</strong></p>
  <p>🐰 Thỏ — sống trên <strong>đất</strong></p>
  <p>🐢 Rùa — sống cả nước lẫn đất</p>`,
  `<h2>Con vật có mấy chân?</h2>
  <p>🐶🐱🐮🐷 — <strong>4 chân</strong> (thú)</p>
  <p>🐓🦆🐦 — <strong>2 chân</strong> (chim)</p>
  <p>🐟🐍 — <strong>0 chân</strong> (bơi / bò)</p>
  <p>🐛🐜 — <strong>nhiều chân</strong> (côn trùng)</p>
  <p class="tip">Con thử bắt chước tiếng kêu + đếm chân xem!</p>`,
  `<h2>👆 Thực hành con vật</h2>
  <div id="animals0-practice" class="practice-zone">
    <div class="practice-q" id="animals0-q"></div>
    <div class="practice-options" id="animals0-opts"></div>
    <div class="practice-result" id="animals0-result"></div>
    <button class="ln-btn" onclick="newAnimals0Practice()" style="margin-top:12px">🎲 Câu mới</button>
    <div class="practice-score">✅ <span id="animals0-score">0</span></div>
  </div>
  <script>newAnimals0Practice()</script>`,
],

// ==================== LỚP 1 — ĐẾM ĐẾN 20 ====================
count1: [
  `<h2>🔢 Đếm đến 10</h2>
  <div class="visual">1 2 3 4 5 6 7 8 9 10</div>
  <p>Đọc xuôi: một, hai, ba... đến mười.</p>
  <div class="highlight">🍎×10 = mười quả táo</div>`,
  `<h2>Đếm từ 11 đến 20</h2>
  <div class="visual">11 12 13 14 15<br>16 17 18 19 20</div>
  <p>Mười một, mười hai... đến hai mươi.</p>
  <p class="tip">Các số này đều bắt đầu bằng "mười..." (trừ hai mươi).</p>`,
],

// ==================== LỚP 1 — PHÉP CỘNG ====================
add1: [
  `<h2>➕ Phép cộng là gì?</h2>
  <div class="visual">🍎🍎 + 🍎 = ?</div>
  <p>2 quả thêm 1 quả là <strong>3</strong> quả. Viết: 2 + 1 = 3.</p>
  <div class="highlight">Cộng = gộp lại, đếm tất cả.</div>`,
  `<h2>Cộng trong phạm vi 10</h2>
  <p style="font-size:1.4rem;text-align:center">3 + 4 = <strong>7</strong></p>
  <div class="visual">🌸🌸🌸 + 🌸🌸🌸🌸</div>
  <p class="tip">Đếm tất cả bông hoa: 1,2,3,4,5,6,7 → bằng 7!</p>`,
],

// ==================== LỚP 1 — PHÉP TRỪ ====================
sub1: [
  `<h2>➖ Phép trừ là gì?</h2>
  <div class="visual">🍪🍪🍪🍪🍪</div>
  <p>Có 5 cái bánh, ăn mất 2 cái, còn <strong>3</strong> cái.</p>
  <div class="highlight">Viết: 5 - 2 = 3. Trừ = bớt đi.</div>`,
  `<h2>Trừ trong phạm vi 10</h2>
  <p style="font-size:1.4rem;text-align:center">8 - 3 = <strong>5</strong></p>
  <p class="tip">Bắt đầu từ 8, đếm lùi 3 bước: 7, 6, 5 → còn 5!</p>`,
],

// ==================== LỚP 1 — SO SÁNH SỐ ====================
compare1: [
  `<h2>⚖️ Lớn hơn, bé hơn, bằng</h2>
  <p style="font-size:1.3rem;text-align:center">7 <strong>></strong> 4 &nbsp;&nbsp; 3 <strong><</strong> 9 &nbsp;&nbsp; 5 <strong>=</strong> 5</p>
  <div class="highlight">Dấu > là "lớn hơn", < là "bé hơn", = là "bằng nhau".</div>`,
  `<h2>Mẹo nhớ dấu</h2>
  <p>Miệng cá sấu luôn há về phía <strong>số lớn hơn</strong>!</p>
  <p style="font-size:1.3rem;text-align:center">8 > 2 &nbsp;(cá sấu há về phía 8)</p>
  <p class="tip">Số nào đếm sau (xa số 0 hơn) thì lớn hơn.</p>`,
],

// ==================== LỚP 1 — THỨ TỰ SỐ ====================
order1: [
  `<h2>🔢 Số liền trước, liền sau</h2>
  <p style="font-size:1.3rem;text-align:center">... 5 &nbsp; <strong>6</strong> &nbsp; 7 ...</p>
  <p>Số liền trước 6 là <strong>5</strong>. Số liền sau 6 là <strong>7</strong>.</p>
  <div class="highlight">Liền sau = thêm 1. Liền trước = bớt 1.</div>`,
  `<h2>Sắp xếp thứ tự</h2>
  <p style="text-align:center">Từ bé đến lớn: 2 → 4 → 6 → 8</p>
  <p class="tip">Đọc xuôi từ nhỏ đến lớn, đọc ngược từ lớn về nhỏ.</p>`,
],

// ==================== LỚP 1 — HÌNH KHỐI ====================
shapes1: [
  `<h2>🔷 Các hình phẳng</h2>
  <div class="visual">⭕ 🟦 🔺 ▭</div>
  <p>Hình tròn, hình vuông, hình tam giác, hình chữ nhật.</p>
  <div class="highlight">Vuông: 4 cạnh bằng nhau. Chữ nhật: 2 cạnh dài, 2 cạnh ngắn.</div>`,
  `<h2>Đếm cạnh và góc</h2>
  <p>🔺 Tam giác: <strong>3</strong> cạnh, 3 góc.<br>🟦 Vuông: <strong>4</strong> cạnh, 4 góc.</p>
  <p class="tip">Hình tròn không có cạnh, không có góc nào cả!</p>`,
],

// ==================== ĐỒNG HỒ ====================
clock: [
  `<h2>🕐 Làm quen với đồng hồ</h2>
  ${clockSVG(3, 0, 200)}
  <p>Đồng hồ có <strong>2 kim</strong>:</p>
  <div class="highlight">Kim ngắn (đen, mập) 👉 chỉ GIỜ<br>Kim dài (xanh, gầy) 👉 chỉ PHÚT</div>
  <p class="tip">Nhìn đồng hồ trên: Kim ngắn chỉ số 3, kim dài chỉ số 12 → 3 giờ đúng!</p>`,

  `<h2>Kim ngắn chỉ giờ</h2>
  <div class="clock-row">
    ${clockWithLabel(1, 0, 130)}
    ${clockWithLabel(3, 0, 130)}
    ${clockWithLabel(8, 0, 130)}
  </div>
  <p>Kim ngắn chỉ vào số nào → đó là mấy giờ!</p>
  <div class="example">
    <strong>Kim ngắn chỉ số 1 → 1 giờ</strong><br>
    <strong>Kim ngắn chỉ số 3 → 3 giờ</strong><br>
    <strong>Kim ngắn chỉ số 8 → 8 giờ</strong>
  </div>
  <p class="tip">Nhìn kim NGẮN (mập) trước, đọc số nó chỉ!</p>`,

  `<h2>Kim dài chỉ phút</h2>
  <div class="clock-row">
    ${clockWithLabel(9, 0, 140)}
    ${clockWithLabel(9, 30, 140)}
  </div>
  <p>Kim dài chỉ số <strong>12</strong> → đúng giờ (0 phút)</p>
  <p>Kim dài chỉ số <strong>6</strong> → 30 phút (rưỡi)</p>
  <div class="formula">Kim dài chỉ số 12 = "giờ đúng"<br>Kim dài chỉ số 6 = "giờ rưỡi"</div>`,

  `<h2>Đọc phút chi tiết</h2>
  ${clockSVG(10, 15, 180)}
  <p>Mỗi số trên đồng hồ = <strong>5 phút</strong></p>
  <div class="formula">Số 1 = 5 phút | Số 2 = 10 phút | Số 3 = 15 phút<br>Số 4 = 20 phút | Số 5 = 25 phút | Số 6 = 30 phút</div>
  <div class="example"><strong>Ví dụ trên: Kim ngắn chỉ 10, kim dài chỉ 3</strong><br>→ 10 giờ 15 phút</div>
  <p class="tip">Đếm nhẩm: 5, 10, 15, 20... theo số kim dài chỉ!</p>`,

  `<h2>Thực hành đọc giờ</h2>
  <div class="clock-row">
    ${clockWithLabel(7, 0, 120)}
    ${clockWithLabel(2, 30, 120)}
    ${clockWithLabel(5, 15, 120)}
  </div>
  <div class="highlight">Bước 1: Đọc kim ngắn → giờ<br>Bước 2: Đọc kim dài → phút<br>Bước 3: Ghép lại!</div>
  <p class="tip">Luyện tập: Nhìn đồng hồ thật ở nhà và đọc giờ mỗi ngày!</p>`,

  `<h2>👆 Kéo kim đồng hồ!</h2>
  <p>Bấm nút bên dưới để luyện tập kéo kim:</p>
  <div style="margin:20px 0"><button class="ln-btn" onclick="openClockPlay()" style="font-size:1.2rem;padding:15px 30px">👆🕐 Bắt đầu kéo kim!</button></div>
  <p class="tip">Kéo gần tâm = kim giờ, kéo xa tâm = kim phút.<br>Bố mẹ hỏi giờ, con kéo kim cho đúng nhé!</p>`,
],

// ==================== ĐO LƯỜNG ====================
units: [
  `<h2>📏 Đơn vị đo độ dài</h2>
  <div class="visual-lg">📏</div>
  <p>Có 2 đơn vị chính:</p>
  <div class="formula">cm (xen-ti-mét) → đo vật nhỏ<br>m (mét) → đo vật lớn</div>
  <div class="example"><strong>Cây bút: 15 cm</strong><br><strong>Cửa lớp: 2 m</strong><br><strong>Sân trường: 50 m</strong></div>`,

  `<h2>Quy đổi cm ↔ m</h2>
  <div class="highlight">1 m = 100 cm</div>
  <div class="visual">📏📏📏...📏 = 100 cái 1cm = 1m</div>
  <p>Tưởng tượng: 1 mét = chiều dài từ sàn đến ngang bụng con!</p>
  <div class="example">
    <strong>2 m = 200 cm</strong> (2 × 100)<br>
    <strong>150 cm = 1 m 50 cm</strong><br>
    <strong>3 m 20 cm = 320 cm</strong>
  </div>
  <p class="tip">Muốn đổi m → cm: nhân 100<br>Muốn đổi cm → m: chia 100</p>`,

  `<h2>⚖️ Đơn vị đo khối lượng</h2>
  <div class="visual-lg">⚖️</div>
  <div class="formula">1 kg = 1000 g</div>
  <div class="example">
    <strong>🍎 Quả táo: khoảng 200 g</strong><br>
    <strong>📚 Cặp sách: khoảng 2 kg</strong><br>
    <strong>🧒 Em bé lớp 2: khoảng 25 kg</strong>
  </div>
  <p class="tip">kg dùng cho vật nặng (người, gạo, sách)<br>g dùng cho vật nhẹ (kẹo, viên thuốc)</p>`,

  `<h2>🥛 Đơn vị đo thể tích</h2>
  <div class="visual-lg">🥛🪣</div>
  <div class="formula">lít (l) → đo chất lỏng</div>
  <div class="example">
    <strong>🥛 Hộp sữa nhỏ: 200 ml</strong><br>
    <strong>🍶 Chai nước: 1 lít</strong><br>
    <strong>🪣 Xô nước: 10 lít</strong>
  </div>
  <p class="tip">1 lít = 1000 ml (mi-li-lít)</p>`,

  `<h2>🎯 Mẹo nhớ nhanh</h2>
  <div class="highlight">
    📏 Độ dài: 1 m = 100 cm<br>
    ⚖️ Nặng: 1 kg = 1000 g<br>
    🥛 Nước: 1 l = 1000 ml
  </div>
  <div class="tip">Cách nhớ: "Mét thì TRĂM, Ký và Lít thì NGHÌN"</div>
  <div class="example">
    <strong>Bài tập:</strong><br>
    5 m = ? cm → 5 × 100 = <strong>500 cm</strong><br>
    2 kg = ? g → 2 × 1000 = <strong>2000 g</strong><br>
    3 l = ? ml → 3 × 1000 = <strong>3000 ml</strong>
  </div>`,

  `<h2>👆 Thực hành đổi đơn vị</h2>
  <div id="units-practice" class="practice-zone">
    <div class="practice-q" id="units-q"></div>
    <div class="practice-options" id="units-opts"></div>
    <div class="practice-result" id="units-result"></div>
    <button class="ln-btn" onclick="newUnitsPractice()" style="margin-top:12px">🎲 Câu mới</button>
    <div class="practice-score">✅ <span id="units-score">0</span></div>
  </div>
  <script>newUnitsPractice()</script>`,
],

// ==================== BẢNG NHÂN ====================
multiply: [
  `<h2>✖️ Phép nhân là gì?</h2>
  <p>Phép nhân = <strong>cộng nhiều lần</strong> cùng 1 số!</p>
  <div class="formula">3 + 3 + 3 + 3 = 3 × 4 = 12</div>
  <div class="multiply-grid">
    <div class="mg-item">🍎</div><div class="mg-item">🍎</div><div class="mg-item">🍎</div><div class="mg-item"></div><div class="mg-item"></div>
    <div class="mg-item">🍎</div><div class="mg-item">🍎</div><div class="mg-item">🍎</div><div class="mg-item"></div><div class="mg-item"></div>
    <div class="mg-item">🍎</div><div class="mg-item">🍎</div><div class="mg-item">🍎</div><div class="mg-item"></div><div class="mg-item"></div>
    <div class="mg-item">🍎</div><div class="mg-item">🍎</div><div class="mg-item">🍎</div><div class="mg-item"></div><div class="mg-item"></div>
  </div>
  <p>4 hàng, mỗi hàng 3 quả = <strong>3 × 4 = 12 quả</strong></p>`,

  `<h2>Bảng nhân 2</h2>
  <div class="formula" style="text-align:left; display:inline-block;">
    2 × 1 = 2 &nbsp;&nbsp; 2 × 6 = 12<br>
    2 × 2 = 4 &nbsp;&nbsp; 2 × 7 = 14<br>
    2 × 3 = 6 &nbsp;&nbsp; 2 × 8 = 16<br>
    2 × 4 = 8 &nbsp;&nbsp; 2 × 9 = 18<br>
    2 × 5 = 10 &nbsp; 2 × 10 = 20
  </div>
  <p class="tip">Mẹo: Nhân 2 = đếm cách 2!<br>2, 4, 6, 8, 10, 12, 14, 16, 18, 20</p>
  <div class="example"><strong>Tưởng tượng:</strong> 2 × 5 = 5 cặp đũa = 10 chiếc đũa 🥢🥢🥢🥢🥢</div>`,

  `<h2>Bảng nhân 3</h2>
  <div class="formula" style="text-align:left; display:inline-block;">
    3 × 1 = 3 &nbsp;&nbsp; 3 × 6 = 18<br>
    3 × 2 = 6 &nbsp;&nbsp; 3 × 7 = 21<br>
    3 × 3 = 9 &nbsp;&nbsp; 3 × 8 = 24<br>
    3 × 4 = 12 &nbsp; 3 × 9 = 27<br>
    3 × 5 = 15 &nbsp; 3 × 10 = 30
  </div>
  <p class="tip">Mẹo: Nhân 3 = đếm cách 3!<br>3, 6, 9, 12, 15, 18, 21, 24, 27, 30</p>
  <div class="example"><strong>Tưởng tượng:</strong> 3 × 4 = 4 chiếc xe 3 bánh 🛺🛺🛺🛺 = 12 bánh</div>`,

  `<h2>Bảng nhân 4 và 5</h2>
  <div class="formula" style="text-align:left; display:inline-block;">
    <strong>Nhân 4:</strong> 4, 8, 12, 16, 20, 24, 28, 32, 36, 40<br><br>
    <strong>Nhân 5:</strong> 5, 10, 15, 20, 25, 30, 35, 40, 45, 50
  </div>
  <p class="tip">Mẹo nhân 5: Kết quả luôn tận cùng bằng 0 hoặc 5!</p>
  <div class="example">
    <strong>Nhân 4:</strong> = Nhân 2 rồi nhân 2 lần nữa!<br>
    4 × 6 = (2 × 6) × 2 = 12 × 2 = <strong>24</strong><br><br>
    <strong>Nhân 5:</strong> = Chia 2 rồi nhân 10!<br>
    5 × 8 = (8 ÷ 2) × 10 = 4 × 10 = <strong>40</strong>
  </div>`,

  `<h2>🎯 Mẹo học thuộc bảng nhân</h2>
  <div class="highlight">
    1️⃣ Đọc to mỗi ngày 3 lần<br>
    2️⃣ Hát theo nhịp (như bài hát)<br>
    3️⃣ Dùng ngón tay đếm<br>
    4️⃣ Chơi game luyện tập!
  </div>
  <div class="tip">Nhân 9 có mẹo hay: Dùng 10 ngón tay!<br>
  9 × 3: Gập ngón thứ 3 → bên trái 2 ngón, bên phải 7 ngón = <strong>27</strong>!</div>
  <div class="example"><strong>Quy tắc giao hoán:</strong><br>3 × 4 = 4 × 3 = 12<br>Biết 1 phép tính = biết 2!</div>`,

  `<h2>👆 Thực hành bảng nhân</h2>
  <div id="mul-practice" class="practice-zone">
    <div class="practice-q" id="mul-q"></div>
    <div class="practice-options" id="mul-opts"></div>
    <div class="practice-result" id="mul-result"></div>
    <button class="ln-btn" onclick="newMulPractice()" style="margin-top:12px">🎲 Câu mới</button>
    <div class="practice-score">✅ <span id="mul-score">0</span></div>
  </div>
  <script>newMulPractice()</script>`,
],

// ==================== CỘNG CÓ NHỚ ====================
carry: [
  `<h2>➕ Cộng không nhớ vs Có nhớ</h2>
  <p><strong>Không nhớ:</strong> Cộng hàng đơn vị < 10</p>
  <div class="carry-box">
    &nbsp;23<br>+14<br>---<br>&nbsp;37
  </div>
  <p>3 + 4 = 7 (nhỏ hơn 10 → không nhớ)</p>
  <p><strong>Có nhớ:</strong> Cộng hàng đơn vị ≥ 10</p>
  <div class="carry-box">
    <span class="carry-num">&nbsp;1</span><br>&nbsp;27<br>+15<br>---<br>&nbsp;42
  </div>
  <p>7 + 5 = 12 (lớn hơn 10 → viết 2, nhớ 1)</p>`,

  `<h2>Cách làm phép cộng có nhớ</h2>
  <div class="highlight">Bước 1: Cộng hàng đơn vị<br>Bước 2: Nếu ≥ 10 → viết số lẻ, nhớ 1<br>Bước 3: Cộng hàng chục (+ số nhớ)</div>
  <div class="carry-box">
    <span class="carry-num">&nbsp;1</span><br>&nbsp;38<br>+25<br>---<br>&nbsp;63
  </div>
  <div class="example">
    <strong>Bước 1:</strong> 8 + 5 = 13 → viết 3, nhớ 1<br>
    <strong>Bước 2:</strong> 3 + 2 + 1(nhớ) = 6<br>
    <strong>Kết quả:</strong> 63 ✓
  </div>`,

  `<h2>Mẹo cộng nhanh qua 10</h2>
  <div class="formula">Tách số để tạo thành 10!</div>
  <div class="example">
    <strong>8 + 5 = ?</strong><br>
    Tách 5 = 2 + 3<br>
    8 + 2 = 10<br>
    10 + 3 = <strong>13</strong> ✓
  </div>
  <div class="example">
    <strong>7 + 6 = ?</strong><br>
    Tách 6 = 3 + 3<br>
    7 + 3 = 10<br>
    10 + 3 = <strong>13</strong> ✓
  </div>
  <p class="tip">Luôn tìm cách tạo số 10 trước!</p>`,

  `<h2>Phép trừ có nhớ</h2>
  <div class="carry-box">
    &nbsp;42<br>-17<br>---<br>&nbsp;25
  </div>
  <div class="example">
    <strong>Bước 1:</strong> 2 - 7 → không trừ được!<br>
    → Mượn 1 chục: 12 - 7 = 5<br>
    <strong>Bước 2:</strong> 4 - 1(mượn) - 1 = 2<br>
    <strong>Kết quả:</strong> 25 ✓
  </div>
  <p class="tip">Khi hàng đơn vị không trừ được → "mượn" 1 từ hàng chục!</p>`,

  `<h2>🎯 Luyện tập</h2>
  <p>Thử tự làm nhé:</p>
  <div class="formula">
    46 + 27 = ?<br>
    53 + 38 = ?<br>
    71 - 34 = ?<br>
    80 - 45 = ?
  </div>
  <div class="example">
    <strong>Đáp án:</strong><br>
    46 + 27 = 73 (6+7=13, nhớ 1)<br>
    53 + 38 = 91 (3+8=11, nhớ 1)<br>
    71 - 34 = 37 (mượn 1: 11-4=7)<br>
    80 - 45 = 35 (mượn 1: 10-5=5)
  </div>
  <p class="tip">Luyện mỗi ngày 5 bài, 1 tuần sẽ thành thạo!</p>`,

  `<h2>👆 Thực hành cộng trừ</h2>
  <div id="carry-practice" class="practice-zone">
    <div class="practice-q" id="carry-q"></div>
    <div class="practice-options" id="carry-opts"></div>
    <div class="practice-result" id="carry-result"></div>
    <button class="ln-btn" onclick="newCarryPractice()" style="margin-top:12px">🎲 Câu mới</button>
    <div class="practice-score">✅ <span id="carry-score">0</span></div>
  </div>
  <script>newCarryPractice()</script>`,
],

// ==================== HÌNH HỌC ====================
shapes: [
  `<h2>🔷 Các hình cơ bản</h2>
  <div class="visual">🔺 ⬜ ⬟ ⭕</div>
  <div class="formula">
    🔺 Tam giác: 3 cạnh, 3 góc<br>
    ⬜ Hình vuông: 4 cạnh bằng nhau, 4 góc vuông<br>
    ▬ Hình chữ nhật: 2 cạnh dài, 2 cạnh ngắn<br>
    ⭕ Hình tròn: không có cạnh, không có góc
  </div>`,

  `<h2>📐 Góc vuông</h2>
  <div class="visual-lg">📐</div>
  <p>Góc vuông = góc bằng góc của quyển vở!</p>
  <div class="example">
    <strong>Hình vuông:</strong> 4 góc vuông ✓<br>
    <strong>Hình chữ nhật:</strong> 4 góc vuông ✓<br>
    <strong>Hình tam giác:</strong> có thể có 1 góc vuông
  </div>
  <p class="tip">Dùng góc quyển vở để kiểm tra góc vuông!</p>`,

  `<h2>📏 Chu vi là gì?</h2>
  <p><strong>Chu vi</strong> = tổng độ dài tất cả các cạnh</p>
  <p>Tưởng tượng: con kiến bò quanh hình 1 vòng → quãng đường đó = chu vi!</p>
  <div class="formula">Chu vi = Cạnh 1 + Cạnh 2 + Cạnh 3 + ...</div>
  <div class="example">
    <strong>Tam giác</strong> cạnh 3cm, 4cm, 5cm:<br>
    Chu vi = 3 + 4 + 5 = <strong>12 cm</strong>
  </div>`,

  `<h2>Chu vi hình vuông & chữ nhật</h2>
  <div class="formula">
    ⬜ Chu vi hình vuông = Cạnh × 4<br><br>
    ▬ Chu vi hình chữ nhật = (Dài + Rộng) × 2
  </div>
  <div class="example">
    <strong>Hình vuông</strong> cạnh 5cm:<br>
    Chu vi = 5 × 4 = <strong>20 cm</strong><br><br>
    <strong>Hình chữ nhật</strong> dài 6cm, rộng 4cm:<br>
    Chu vi = (6 + 4) × 2 = 10 × 2 = <strong>20 cm</strong>
  </div>`,

  `<h2>🎯 Nhận biết hình trong đời sống</h2>
  <div class="example">
    <strong>⬜ Hình vuông:</strong> viên gạch, mặt xúc xắc, khăn tay<br>
    <strong>▬ Hình chữ nhật:</strong> quyển vở, cửa sổ, bảng lớp<br>
    <strong>🔺 Tam giác:</strong> mái nhà, biển báo, lát bánh pizza<br>
    <strong>⭕ Hình tròn:</strong> đồng hồ, bánh xe, đĩa ăn
  </div>
  <p class="tip">Nhìn quanh phòng và tìm các hình nhé! Đếm xem có bao nhiêu hình vuông, hình chữ nhật...</p>`,

  `<h2>👆 Thực hành chu vi</h2>
  <div id="shapes-practice" class="practice-zone">
    <div class="practice-q" id="shapes-q"></div>
    <div class="practice-options" id="shapes-opts"></div>
    <div class="practice-result" id="shapes-result"></div>
    <button class="ln-btn" onclick="newShapesPractice()" style="margin-top:12px">🎲 Câu mới</button>
    <div class="practice-score">✅ <span id="shapes-score">0</span></div>
  </div>
  <script>newShapesPractice()</script>`,
],

// ==================== TIỀN VIỆT NAM ====================
money: [
  `<h2>💰 Các tờ tiền Việt Nam</h2>
  <div class="visual">💵💵💵</div>
  <p>Tiền Việt Nam hiện nay là <strong>tiền polymer</strong> (nhựa, không rách):</p>
  <div class="formula">
    Mệnh giá nhỏ: 1.000đ, 2.000đ, 5.000đ<br>
    Mệnh giá vừa: 10.000đ, 20.000đ, 50.000đ<br>
    Mệnh giá lớn: 100.000đ, 200.000đ, 500.000đ
  </div>
  <div class="tip">Tiền xu đã không còn sử dụng. Tất cả đều là tiền giấy polymer!</div>
  <div class="example">
    <strong>Cách nhận biết:</strong><br>
    💚 1.000đ - 5.000đ: tờ nhỏ, màu nhạt<br>
    💛 10.000đ - 50.000đ: tờ vừa<br>
    💗 100.000đ - 500.000đ: tờ lớn, màu đậm
  </div>`,

  `<h2>🛒 Tính tiền mua hàng</h2>
  <p>Mua nhiều món → <strong>cộng</strong> giá lại!</p>
  <div class="example">
    <strong>Mua:</strong><br>
    🍭 Kẹo: 2.000đ<br>
    📒 Vở: 5.000đ<br>
    ✏️ Bút: 3.000đ<br>
    <strong>Tổng = 2.000 + 5.000 + 3.000 = 10.000đ</strong>
  </div>
  <p class="tip">Mẹo: Bỏ 3 số 0 cuối để dễ tính!<br>2 + 5 + 3 = 10 → rồi thêm ".000" = 10.000đ</p>`,

  `<h2>💸 Tính tiền thừa</h2>
  <div class="formula">Tiền thừa = Tiền đưa − Tiền phải trả</div>
  <div class="example">
    <strong>Mua kem 7.000đ, đưa tờ 10.000đ</strong><br>
    Tiền thừa = 10.000 − 7.000 = <strong>3.000đ</strong><br><br>
    <strong>Mua sách 35.000đ, đưa tờ 50.000đ</strong><br>
    Tiền thừa = 50.000 − 35.000 = <strong>15.000đ</strong>
  </div>
  <p class="tip">Mẹo đếm thêm: 35 → 40 → 50 = thêm 15 (nghìn)</p>`,

  `<h2>💵 Ghép tiền đủ số</h2>
  <p>Ghép nhiều tờ để trả đúng số tiền:</p>
  <div class="example">
    <strong>Trả 8.000đ:</strong><br>
    → 1 tờ 5.000 + 1 tờ 2.000 + 1 tờ 1.000 ✓<br><br>
    <strong>Trả 17.000đ:</strong><br>
    → 1 tờ 10.000 + 1 tờ 5.000 + 1 tờ 2.000 ✓<br><br>
    <strong>Trả 45.000đ:</strong><br>
    → 2 tờ 20.000 + 1 tờ 5.000 ✓
  </div>
  <p class="tip">Luôn dùng tờ lớn nhất có thể trước, rồi bù thêm tờ nhỏ!</p>`,

  `<h2>🎯 Bài tập thực tế</h2>
  <div class="example">
    <strong>Bài 1:</strong> Mẹ cho 20.000đ. Mua bút 6.000đ và vở 8.000đ. Còn lại?<br>
    → 6.000 + 8.000 = 14.000đ<br>
    → 20.000 − 14.000 = <strong>6.000đ</strong><br><br>
    <strong>Bài 2:</strong> Mỗi cái bánh 5.000đ. Mua 4 cái hết bao nhiêu?<br>
    → 5.000 × 4 = <strong>20.000đ</strong><br><br>
    <strong>Bài 3:</strong> Có tờ 50.000đ, mua đồ hết 32.000đ. Được trả lại?<br>
    → 50.000 − 32.000 = <strong>18.000đ</strong>
  </div>
  <p class="tip">Thực hành: Khi đi mua đồ cùng bố mẹ, thử tự tính tiền nhé!</p>`,

  `<h2>👆 Thực hành tính tiền</h2>
  <div id="money-practice" class="practice-zone">
    <div class="practice-q" id="money-q"></div>
    <div class="practice-options" id="money-opts"></div>
    <div class="practice-result" id="money-result"></div>
    <button class="ln-btn" onclick="newMoneyPractice()" style="margin-top:12px">🎲 Câu mới</button>
    <div class="practice-score">✅ <span id="money-score">0</span></div>
  </div>
  <script>newMoneyPractice()</script>`,
],


// ==================== LỚP 3 ====================
mul3: [
  `<h2>✖️ Bảng nhân 6, 7, 8, 9</h2>
  <div class="visual-lg">✖️</div>
  <p>Lớp 3, chúng ta học tiếp bảng nhân <strong>6, 7, 8, 9</strong>!</p>
  <div class="formula" style="text-align:left; display:inline-block;">
    6 × 1 = 6 &nbsp;&nbsp; 7 × 1 = 7<br>
    6 × 2 = 12 &nbsp; 7 × 2 = 14<br>
    6 × 3 = 18 &nbsp; 7 × 3 = 21<br>
    6 × 4 = 24 &nbsp; 7 × 4 = 28<br>
    6 × 5 = 30 &nbsp; 7 × 5 = 35
  </div>
  <p class="tip">🎵 Đọc to như hát: "Sáu một sáu, sáu hai mười hai..."</p>`,

  `<h2>Bảng nhân 8 và 9</h2>
  <div class="formula" style="text-align:left; display:inline-block;">
    <strong>Nhân 8:</strong> 8, 16, 24, 32, 40, 48, 56, 64, 72, 80<br><br>
    <strong>Nhân 9:</strong> 9, 18, 27, 36, 45, 54, 63, 72, 81, 90
  </div>
  <div class="highlight">Mẹo nhân 9: Hàng chục tăng 1, hàng đơn vị giảm 1!<br>09, 18, 27, 36, 45, 54, 63, 72, 81, 90</div>
  <p class="tip">Tổng 2 chữ số của kết quả nhân 9 luôn = 9!<br>Ví dụ: 9×4=36 → 3+6=9 ✓</p>`,

  `<h2>🖐️ Mẹo nhân 9 bằng ngón tay</h2>
  <p>Xòe 10 ngón tay ra, gập ngón thứ N:</p>
  <div class="example">
    <strong>9 × 3:</strong> Gập ngón thứ 3<br>
    → Bên trái: 2 ngón = hàng chục<br>
    → Bên phải: 7 ngón = hàng đơn vị<br>
    → Kết quả: <strong>27</strong> ✓
  </div>
  <div class="example">
    <strong>9 × 7:</strong> Gập ngón thứ 7<br>
    → Bên trái: 6, bên phải: 3 → <strong>63</strong> ✓
  </div>
  <p class="tip">Thử với mọi số từ 1-10 nhé! 🖐️🖐️</p>`,

  `<h2>Quy tắc giao hoán & kết hợp</h2>
  <div class="formula">a × b = b × a (giao hoán)<br>(a × b) × c = a × (b × c) (kết hợp)</div>
  <div class="example">
    <strong>6 × 7 = 7 × 6 = 42</strong><br>
    Học 1 phép tính = biết 2 phép tính!<br><br>
    <strong>(2 × 3) × 4 = 2 × (3 × 4) = 24</strong>
  </div>
  <p class="tip">Biết nhân 2-5 rồi → dùng giao hoán để tính nhân 6-9!<br>7 × 4 = 4 × 7 = 28 (dùng bảng nhân 4)</p>`,

  `<h2>🎯 Luyện nhớ bảng nhân lớn</h2>
  <div class="highlight">
    📝 Mỗi ngày học 1 bảng, đọc 5 lần<br>
    🎵 Hát theo nhịp cho dễ nhớ<br>
    🖐️ Dùng ngón tay kiểm tra nhân 9<br>
    🔄 Dùng giao hoán để giảm số cần nhớ
  </div>
  <div class="example">
    <strong>Các tích hay quên:</strong><br>
    6 × 7 = 42 | 6 × 8 = 48 | 6 × 9 = 54<br>
    7 × 8 = 56 | 7 × 9 = 63 | 8 × 9 = 72
  </div>
  <p class="tip">Chỉ cần nhớ 6 tích này là xong toàn bộ bảng nhân! 💪</p>`,
],

div3: [
  `<h2>➗ Phép chia là gì?</h2>
  <div class="visual-lg">➗</div>
  <p>Phép chia = <strong>chia đều</strong> thành nhiều phần!</p>
  <div class="formula">12 ÷ 3 = 4<br>(12 quả chia đều cho 3 bạn, mỗi bạn 4 quả)</div>
  <div class="example">
    🍎🍎🍎🍎 | 🍎🍎🍎🍎 | 🍎🍎🍎🍎<br>
    12 quả ÷ 3 phần = 4 quả mỗi phần
  </div>
  <p class="tip">Phép chia là phép tính ngược của nhân!<br>3 × 4 = 12 → 12 ÷ 3 = 4</p>`,

  `<h2>Chia hết và chia có dư</h2>
  <div class="highlight">
    <strong>Chia hết:</strong> Chia vừa đúng, không thừa<br>
    <strong>Chia có dư:</strong> Chia xong vẫn còn thừa
  </div>
  <div class="example">
    <strong>Chia hết:</strong> 15 ÷ 3 = 5 (không dư)<br>
    <strong>Chia có dư:</strong> 17 ÷ 3 = 5 (dư 2)<br>
    Vì 3 × 5 = 15, còn thừa 17 - 15 = 2
  </div>
  <div class="formula">17 = 3 × 5 + 2<br>Số bị chia = Số chia × Thương + Số dư</div>
  <p class="tip">Số dư luôn nhỏ hơn số chia!</p>`,

  `<h2>Cách thực hiện phép chia</h2>
  <div class="formula">Bước 1: Nhẩm bảng nhân tìm thương<br>Bước 2: Nhân ngược lại kiểm tra<br>Bước 3: Trừ để tìm số dư</div>
  <div class="example">
    <strong>23 ÷ 4 = ?</strong><br>
    → 4 × 5 = 20 (gần nhất mà ≤ 23)<br>
    → 4 × 6 = 24 (quá lớn!)<br>
    → Thương = 5, dư = 23 - 20 = <strong>3</strong><br>
    → 23 ÷ 4 = 5 (dư 3) ✓
  </div>
  <p class="tip">Luôn thử nhân ngược để kiểm tra kết quả!</p>`,

  `<h2>Mối quan hệ Nhân - Chia</h2>
  <div class="formula">Nếu a × b = c<br>thì c ÷ a = b<br>và c ÷ b = a</div>
  <div class="example">
    <strong>6 × 7 = 42</strong><br>
    → 42 ÷ 6 = 7 ✓<br>
    → 42 ÷ 7 = 6 ✓<br><br>
    <strong>8 × 9 = 72</strong><br>
    → 72 ÷ 8 = 9 ✓<br>
    → 72 ÷ 9 = 8 ✓
  </div>
  <p class="tip">Thuộc bảng nhân → làm phép chia dễ dàng! 💡</p>`,
],

fractions3: [
  `<h2>🍕 Phân số là gì?</h2>
  <div class="visual-lg">🍕</div>
  <p>Phân số = chia 1 cái thành nhiều phần <strong>bằng nhau</strong>!</p>
  <div class="formula" style="font-size:1.5rem">
    <sup>1</sup>&frasl;<sub>2</sub> &nbsp; <sup>1</sup>&frasl;<sub>3</sub> &nbsp; <sup>1</sup>&frasl;<sub>4</sub>
  </div>
  <div class="example">
    🍕 Cắt pizza làm 2 → mỗi miếng = <strong>1/2</strong><br>
    🍕 Cắt pizza làm 4 → mỗi miếng = <strong>1/4</strong><br>
    🍫 Thanh socola 3 phần → mỗi phần = <strong>1/3</strong>
  </div>
  <p class="tip">Số trên = Tử số (phần lấy)<br>Số dưới = Mẫu số (tổng phần chia)</p>`,

  `<h2>Đọc và viết phân số</h2>
  <div class="formula">
    <sup>Tử số</sup>&frasl;<sub>Mẫu số</sub> = "Tử số phần Mẫu số"
  </div>
  <div class="example">
    <strong>1/2</strong> → đọc: "một phần hai"<br>
    <strong>1/3</strong> → đọc: "một phần ba"<br>
    <strong>2/5</strong> → đọc: "hai phần năm"<br>
    <strong>3/4</strong> → đọc: "ba phần tư"
  </div>
  <div class="highlight">
    Mẫu số cho biết: chia thành bao nhiêu phần<br>
    Tử số cho biết: lấy bao nhiêu phần
  </div>`,

  `<h2>So sánh phân số cùng mẫu</h2>
  <div class="formula">Cùng mẫu số → so sánh tử số!<br>Tử số lớn hơn → phân số lớn hơn</div>
  <div class="example">
    <strong>2/5 và 3/5:</strong> Cùng mẫu 5<br>
    → 2 < 3 nên 2/5 < 3/5 ✓<br><br>
    <strong>1/4 và 3/4:</strong> Cùng mẫu 4<br>
    → 1 < 3 nên 1/4 < 3/4 ✓
  </div>
  <p class="tip">Tưởng tượng: cùng 1 chiếc pizza cắt 5, lấy 3 miếng nhiều hơn lấy 2 miếng! 🍕</p>`,

  `<h2>So sánh phân số cùng tử</h2>
  <div class="formula">Cùng tử số → mẫu số lớn hơn → phân số NHỎ hơn!</div>
  <div class="example">
    <strong>1/2 và 1/4:</strong> Cùng tử 1<br>
    → Mẫu 2 < mẫu 4, nên 1/2 > 1/4 ✓<br><br>
    <strong>1/3 và 1/5:</strong> Cùng tử 1<br>
    → 1/3 > 1/5 ✓
  </div>
  <p class="tip">Chia càng nhiều phần → mỗi phần càng nhỏ!<br>🍕 cắt 2 > 🍕 cắt 4 (mỗi miếng to hơn)</p>`,

  `<h2>🎯 Phân số trong đời sống</h2>
  <div class="example">
    🕐 <strong>Nửa giờ</strong> = 1/2 giờ = 30 phút<br>
    🕐 <strong>Một phần tư giờ</strong> = 1/4 giờ = 15 phút<br>
    🍰 Chia bánh cho <strong>4 bạn</strong> → mỗi bạn 1/4<br>
    📏 <strong>Nửa mét</strong> = 1/2 m = 50 cm
  </div>
  <div class="highlight">
    1/2 = một nửa (chia 2)<br>
    1/3 = một phần ba (chia 3)<br>
    1/4 = một phần tư (chia 4)
  </div>
  <p class="tip">Nhìn xung quanh: con thấy phân số ở đâu? 👀</p>`,
],

perimeter3: [
  `<h2>📐 Chu vi là gì?</h2>
  <div class="visual-lg">📐</div>
  <p><strong>Chu vi</strong> = độ dài đường bao quanh hình</p>
  <div class="formula">Chu vi = Tổng tất cả các cạnh</div>
  <div class="example">
    🐜 Con kiến bò quanh hình 1 vòng<br>
    → Quãng đường kiến bò = <strong>chu vi</strong>!
  </div>
  <p class="tip">Tưởng tượng dùng sợi dây quấn quanh hình → đo sợi dây = chu vi!</p>`,

  `<h2>Chu vi hình vuông & chữ nhật</h2>
  <div class="formula">
    ⬜ Chu vi hình vuông = cạnh × 4<br><br>
    ▬ Chu vi hình chữ nhật = (dài + rộng) × 2
  </div>
  <div class="example">
    <strong>Hình vuông</strong> cạnh 6cm:<br>
    P = 6 × 4 = <strong>24 cm</strong><br><br>
    <strong>Hình chữ nhật</strong> dài 8cm, rộng 5cm:<br>
    P = (8 + 5) × 2 = 13 × 2 = <strong>26 cm</strong>
  </div>`,

  `<h2>⬜ Diện tích là gì?</h2>
  <p><strong>Diện tích</strong> = phần mặt phẳng bên trong hình</p>
  <div class="formula">Đơn vị: cm², m² (xen-ti-mét vuông, mét vuông)</div>
  <div class="example">
    Tưởng tượng lát gạch vuông 1cm × 1cm<br>
    → Đếm số viên gạch = diện tích!<br><br>
    ⬜⬜⬜<br>
    ⬜⬜⬜<br>
    → 3 × 2 = 6 ô = <strong>6 cm²</strong>
  </div>
  <p class="tip">Chu vi = đo "đường viền", Diện tích = đo "phần bên trong"</p>`,

  `<h2>Công thức diện tích</h2>
  <div class="formula">
    ⬜ Diện tích hình vuông = cạnh × cạnh<br><br>
    ▬ Diện tích hình chữ nhật = dài × rộng
  </div>
  <div class="example">
    <strong>Hình vuông</strong> cạnh 5cm:<br>
    S = 5 × 5 = <strong>25 cm²</strong><br><br>
    <strong>Hình chữ nhật</strong> dài 7cm, rộng 4cm:<br>
    S = 7 × 4 = <strong>28 cm²</strong>
  </div>
  <p class="tip">Nhớ: Chu vi đo bằng cm/m, Diện tích đo bằng cm²/m²!</p>`,

  `<h2>🎯 Bài tập thực tế</h2>
  <div class="example">
    <strong>Bài 1:</strong> Sân trường hình chữ nhật dài 30m, rộng 20m.<br>
    Chu vi = (30 + 20) × 2 = <strong>100 m</strong><br>
    Diện tích = 30 × 20 = <strong>600 m²</strong><br><br>
    <strong>Bài 2:</strong> Viên gạch hình vuông cạnh 30cm.<br>
    Chu vi = 30 × 4 = <strong>120 cm</strong><br>
    Diện tích = 30 × 30 = <strong>900 cm²</strong>
  </div>
  <p class="tip">Thực hành: Đo phòng ngủ của con và tính chu vi, diện tích! 📏</p>`,
],

time3: [
  `<h2>📅 Ngày, tháng, năm</h2>
  <div class="visual-lg">📅</div>
  <div class="formula">
    1 năm = 12 tháng<br>
    1 tháng = 28, 29, 30 hoặc 31 ngày<br>
    1 tuần = 7 ngày
  </div>
  <div class="example">
    <strong>Tháng 31 ngày:</strong> 1, 3, 5, 7, 8, 10, 12<br>
    <strong>Tháng 30 ngày:</strong> 4, 6, 9, 11<br>
    <strong>Tháng 2:</strong> 28 ngày (năm nhuận: 29 ngày)
  </div>
  <p class="tip">🎵 Mẹo nhớ: "Một-ba-năm-bảy-tám-mười-chạp, ba mốt ngày không thiếu một ngày"</p>`,

  `<h2>⏰ Đổi giờ - phút</h2>
  <div class="formula">1 giờ = 60 phút<br>1 phút = 60 giây</div>
  <div class="example">
    <strong>2 giờ = ? phút</strong><br>
    → 2 × 60 = <strong>120 phút</strong><br><br>
    <strong>90 phút = ? giờ ? phút</strong><br>
    → 90 ÷ 60 = 1 (dư 30)<br>
    → <strong>1 giờ 30 phút</strong>
  </div>
  <p class="tip">Nhớ: 1 giờ = 60 phút, nửa giờ = 30 phút, 1/4 giờ = 15 phút</p>`,

  `<h2>Tính khoảng thời gian</h2>
  <div class="formula">Thời gian = Giờ kết thúc - Giờ bắt đầu</div>
  <div class="example">
    <strong>Học từ 7 giờ 30 đến 10 giờ 30:</strong><br>
    → 10 giờ 30 - 7 giờ 30 = <strong>3 giờ</strong><br><br>
    <strong>Đi từ 8 giờ 15 đến 9 giờ 45:</strong><br>
    → 9 giờ 45 - 8 giờ 15 = <strong>1 giờ 30 phút</strong>
  </div>
  <p class="tip">Trừ giờ riêng, trừ phút riêng. Nếu phút không đủ trừ → mượn 1 giờ = 60 phút!</p>`,

  `<h2>📆 Ngày trong tuần & lịch</h2>
  <div class="highlight">
    Thứ 2 → Thứ 3 → ... → Thứ 7 → Chủ nhật<br>
    (7 ngày = 1 tuần)
  </div>
  <div class="example">
    <strong>Hôm nay thứ 4, sau 5 ngày là thứ mấy?</strong><br>
    → Thứ 4 + 5 ngày: 5, 6, 7, CN, Thứ 2<br>
    → Đáp án: <strong>Thứ 2</strong><br><br>
    <strong>Từ 15/3 đến 20/3 là mấy ngày?</strong><br>
    → 20 - 15 = <strong>5 ngày</strong>
  </div>
  <p class="tip">Dùng lịch để đếm ngày chính xác nhé! 📅</p>`,
],

calc3: [
  `<h2>🧮 Tính nhẩm nhân nhanh</h2>
  <div class="visual-lg">🧮</div>
  <p>Các mẹo nhân nhẩm giúp tính nhanh hơn!</p>
  <div class="formula">Nhân 10: thêm số 0 vào cuối<br>Nhân 100: thêm 2 số 0 vào cuối<br>Nhân 5: nhân 10 rồi chia 2</div>
  <div class="example">
    <strong>13 × 10 = 130</strong> (thêm 0)<br>
    <strong>25 × 100 = 2500</strong> (thêm 00)<br>
    <strong>14 × 5 = 14 × 10 ÷ 2 = 140 ÷ 2 = 70</strong>
  </div>`,

  `<h2>Mẹo nhân với 9, 11</h2>
  <div class="formula">Nhân 9 = Nhân 10 rồi trừ đi chính nó<br>Nhân 11 = Nhân 10 rồi cộng chính nó</div>
  <div class="example">
    <strong>7 × 9:</strong> 7 × 10 - 7 = 70 - 7 = <strong>63</strong> ✓<br>
    <strong>12 × 9:</strong> 12 × 10 - 12 = 120 - 12 = <strong>108</strong> ✓<br><br>
    <strong>7 × 11:</strong> 7 × 10 + 7 = 70 + 7 = <strong>77</strong> ✓<br>
    <strong>15 × 11:</strong> 15 × 10 + 15 = 150 + 15 = <strong>165</strong> ✓
  </div>
  <p class="tip">Nhân 9: trừ đi | Nhân 11: cộng thêm | Dễ nhớ! 💡</p>`,

  `<h2>Tính nhẩm chia nhanh</h2>
  <div class="formula">Chia 10: bỏ số 0 cuối<br>Chia 2: tìm một nửa<br>Chia 5: chia 10 rồi nhân 2</div>
  <div class="example">
    <strong>250 ÷ 10 = 25</strong> (bỏ 0)<br>
    <strong>48 ÷ 2 = 24</strong> (một nửa)<br>
    <strong>60 ÷ 5 = 60 ÷ 10 × 2 = 6 × 2 = 12</strong>
  </div>
  <p class="tip">Chia cho 5: dễ hơn nếu chia 10 trước rồi nhân 2!</p>`,

  `<h2>Tách số để tính nhanh</h2>
  <div class="formula">Tách số thành các phần dễ tính!</div>
  <div class="example">
    <strong>13 × 4:</strong><br>
    = (10 + 3) × 4 = 10×4 + 3×4 = 40 + 12 = <strong>52</strong><br><br>
    <strong>25 × 8:</strong><br>
    = 25 × 4 × 2 = 100 × 2 = <strong>200</strong><br><br>
    <strong>99 × 6:</strong><br>
    = (100 - 1) × 6 = 600 - 6 = <strong>594</strong>
  </div>
  <p class="tip">Tìm số tròn gần nhất để tính dễ hơn! 🎯</p>`,
],


// ==================== LỚP 4 ====================
bignum4: [
  `<h2>🔢 Số lớn: Hàng triệu, hàng tỉ</h2>
  <div class="visual-lg">🔢</div>
  <p>Lớp 4 ta học các số rất lớn!</p>
  <div class="formula">
    Hàng đơn vị → Hàng chục → Hàng trăm → Hàng nghìn<br>
    → Hàng chục nghìn → Hàng trăm nghìn<br>
    → Hàng triệu → Hàng chục triệu → Hàng trăm triệu → Hàng tỉ
  </div>
  <div class="example">
    <strong>1.000.000</strong> = một triệu<br>
    <strong>10.000.000</strong> = mười triệu<br>
    <strong>1.000.000.000</strong> = một tỉ
  </div>
  <p class="tip">Đếm số chữ số 0: triệu có 6 số 0, tỉ có 9 số 0!</p>`,

  `<h2>Đọc và viết số lớn</h2>
  <div class="formula">Tách thành từng lớp 3 chữ số (từ phải sang trái)</div>
  <div class="example">
    <strong>5.432.168</strong><br>
    → 5 triệu 432 nghìn 168<br>
    → Đọc: "Năm triệu bốn trăm ba mươi hai nghìn một trăm sáu mươi tám"<br><br>
    <strong>21.056.007</strong><br>
    → Đọc: "Hai mươi mốt triệu không trăm năm mươi sáu nghìn không trăm linh bảy"
  </div>
  <p class="tip">Dùng dấu chấm ngăn cách mỗi 3 chữ số cho dễ đọc!</p>`,

  `<h2>So sánh số lớn</h2>
  <div class="formula">Bước 1: Đếm số chữ số (nhiều hơn → lớn hơn)<br>Bước 2: Nếu bằng nhau → so từ trái sang phải</div>
  <div class="example">
    <strong>5.432.168 và 843.219:</strong><br>
    → 7 chữ số > 6 chữ số<br>
    → 5.432.168 > 843.219 ✓<br><br>
    <strong>3.456.789 và 3.465.789:</strong><br>
    → Cùng 7 chữ số, so từ trái: 3=3, 4=4, 5<6<br>
    → 3.456.789 < 3.465.789 ✓
  </div>
  <p class="tip">Nhiều chữ số hơn = số lớn hơn! Đơn giản vậy thôi 😊</p>`,

  `<h2>Làm tròn số</h2>
  <div class="formula">Làm tròn = thay bằng số tròn gần nhất</div>
  <div class="example">
    <strong>Làm tròn đến hàng nghìn:</strong><br>
    4.368 → <strong>4.000</strong> (vì 3 < 5, làm tròn xuống)<br>
    4.682 → <strong>5.000</strong> (vì 6 ≥ 5, làm tròn lên)<br><br>
    <strong>Làm tròn đến hàng triệu:</strong><br>
    2.345.678 → <strong>2.000.000</strong><br>
    7.891.234 → <strong>8.000.000</strong>
  </div>
  <p class="tip">Chữ số ngay sau vị trí làm tròn: ≥ 5 thì tăng lên, < 5 giữ nguyên!</p>`,
],

fractions4: [
  `<h2>🍕 Phân số nâng cao</h2>
  <div class="visual-lg">🍕</div>
  <p>Lớp 4: Rút gọn, quy đồng, cộng trừ phân số!</p>
  <div class="formula">Rút gọn = chia cả tử và mẫu cho cùng 1 số</div>
  <div class="example">
    <strong>4/8:</strong> chia cả 2 cho 4<br>
    → 4÷4 / 8÷4 = <strong>1/2</strong> ✓<br><br>
    <strong>6/9:</strong> chia cả 2 cho 3<br>
    → 6÷3 / 9÷3 = <strong>2/3</strong> ✓
  </div>
  <p class="tip">Tìm số lớn nhất chia hết cả tử và mẫu (ƯCLN)!</p>`,

  `<h2>Quy đồng mẫu số</h2>
  <div class="formula">Quy đồng = làm cho 2 phân số có cùng mẫu số</div>
  <div class="example">
    <strong>So sánh 2/3 và 3/4:</strong><br>
    → Mẫu chung: 3 × 4 = 12<br>
    → 2/3 = (2×4)/(3×4) = 8/12<br>
    → 3/4 = (3×3)/(4×3) = 9/12<br>
    → 8/12 < 9/12 nên <strong>2/3 < 3/4</strong> ✓
  </div>
  <p class="tip">Nhân chéo: tử nhân mẫu kia, mẫu nhân mẫu kia!</p>`,

  `<h2>Cộng trừ phân số cùng mẫu</h2>
  <div class="formula">Cùng mẫu: Cộng/trừ tử số, giữ nguyên mẫu số</div>
  <div class="example">
    <strong>2/7 + 3/7 = 5/7</strong> (cộng tử: 2+3=5)<br>
    <strong>5/9 - 2/9 = 3/9 = 1/3</strong> (trừ tử, rút gọn)<br><br>
    <strong>1/5 + 3/5 = 4/5</strong><br>
    <strong>7/8 - 3/8 = 4/8 = 1/2</strong>
  </div>
  <p class="tip">Sau khi cộng/trừ xong → nhớ rút gọn nếu được!</p>`,

  `<h2>Cộng trừ phân số khác mẫu</h2>
  <div class="formula">Bước 1: Quy đồng mẫu số<br>Bước 2: Cộng/trừ tử số<br>Bước 3: Rút gọn kết quả</div>
  <div class="example">
    <strong>1/2 + 1/3 = ?</strong><br>
    → Quy đồng (mẫu chung = 6):<br>
    → 1/2 = 3/6, &nbsp; 1/3 = 2/6<br>
    → 3/6 + 2/6 = <strong>5/6</strong> ✓<br><br>
    <strong>3/4 - 1/3 = ?</strong><br>
    → 3/4 = 9/12, &nbsp; 1/3 = 4/12<br>
    → 9/12 - 4/12 = <strong>5/12</strong> ✓
  </div>`,

  `<h2>🎯 Mẹo nhớ về phân số</h2>
  <div class="highlight">
    📝 Rút gọn: chia cùng 1 số<br>
    🔄 Quy đồng: nhân chéo<br>
    ➕ Cộng/trừ: quy đồng rồi tính tử<br>
    ✅ Luôn rút gọn kết quả cuối!
  </div>
  <div class="example">
    <strong>Phân số tối giản:</strong> tử và mẫu không chia được cho số nào nữa<br>
    1/2, 2/3, 3/4, 1/5, 3/7... đều là tối giản ✓
  </div>
  <p class="tip">Kiểm tra: nếu tử và mẫu cùng chẵn → chia cho 2, cùng chia hết cho 3 → chia cho 3!</p>`,
],

angle4: [
  `<h2>📐 Các loại góc</h2>
  <div class="visual-lg">📐</div>
  <p>Góc được đo bằng <strong>độ</strong> (kí hiệu: °)</p>
  <div class="formula">
    Góc vuông = 90°<br>
    Góc nhọn < 90°<br>
    Góc tù > 90° (và < 180°)<br>
    Góc bẹt = 180°
  </div>
  <div class="example">
    📐 <strong>Góc vuông:</strong> góc quyển vở, góc bàn<br>
    📌 <strong>Góc nhọn:</strong> mũi bút chì, kim đồng hồ lúc 2 giờ<br>
    📎 <strong>Góc tù:</strong> quạt mở rộng, kim lúc 10 giờ 10
  </div>`,

  `<h2>Đo góc bằng thước đo góc</h2>
  <div class="formula">Bước 1: Đặt tâm thước vào đỉnh góc<br>Bước 2: Đặt cạnh gốc trùng vạch 0°<br>Bước 3: Đọc số ở cạnh còn lại</div>
  <div class="example">
    <strong>45°</strong> → góc nhọn ✓ (nhỏ hơn 90°)<br>
    <strong>90°</strong> → góc vuông ✓<br>
    <strong>120°</strong> → góc tù ✓ (lớn hơn 90°)<br>
    <strong>180°</strong> → góc bẹt ✓ (thẳng hàng)
  </div>
  <p class="tip">Góc nhọn "nhọn" như mũi kim, góc tù "tù" tức mở rộng ra!</p>`,

  `<h2>Hình bình hành</h2>
  <div class="formula">Hình bình hành: 2 cặp cạnh đối song song và bằng nhau</div>
  <div class="example">
    <strong>Tính chất:</strong><br>
    ✓ Cạnh đối bằng nhau<br>
    ✓ Góc đối bằng nhau<br>
    ✓ 2 đường chéo cắt nhau tại trung điểm<br><br>
    <strong>Chu vi</strong> = (cạnh a + cạnh b) × 2<br>
    <strong>Diện tích</strong> = đáy × chiều cao
  </div>
  <p class="tip">Hình chữ nhật là hình bình hành đặc biệt (có góc vuông)!</p>`,

  `<h2>Hình thoi</h2>
  <div class="formula">Hình thoi: 4 cạnh bằng nhau, cạnh đối song song</div>
  <div class="example">
    <strong>Tính chất:</strong><br>
    ✓ 4 cạnh bằng nhau<br>
    ✓ Góc đối bằng nhau<br>
    ✓ 2 đường chéo vuông góc với nhau<br><br>
    <strong>Chu vi</strong> = cạnh × 4<br>
    <strong>Diện tích</strong> = (đường chéo 1 × đường chéo 2) ÷ 2
  </div>
  <p class="tip">Hình vuông là hình thoi đặc biệt (có góc vuông)! ◆</p>`,

  `<h2>🎯 Phân biệt các hình</h2>
  <div class="highlight">
    ⬜ <strong>Hình vuông:</strong> 4 cạnh bằng, 4 góc vuông<br>
    ▬ <strong>Hình chữ nhật:</strong> cạnh đối bằng, 4 góc vuông<br>
    ◇ <strong>Hình thoi:</strong> 4 cạnh bằng, góc đối bằng<br>
    ▱ <strong>Hình bình hành:</strong> cạnh đối bằng và song song
  </div>
  <div class="example">
    Hình vuông = Hình chữ nhật + Hình thoi<br>
    (vừa 4 góc vuông, vừa 4 cạnh bằng)
  </div>
  <p class="tip">Hình vuông là "vua" vì nó có TẤT CẢ tính chất! 👑</p>`,
],

area4: [
  `<h2>⬜ Diện tích hình vuông</h2>
  <div class="visual-lg">⬜</div>
  <div class="formula">S = cạnh × cạnh = a × a = a²</div>
  <div class="example">
    <strong>Hình vuông cạnh 7cm:</strong><br>
    S = 7 × 7 = <strong>49 cm²</strong><br><br>
    <strong>Hình vuông cạnh 12m:</strong><br>
    S = 12 × 12 = <strong>144 m²</strong>
  </div>
  <div class="highlight">
    Đơn vị diện tích: cm², dm², m², km²<br>
    1 m² = 10.000 cm²<br>
    1 dm² = 100 cm²
  </div>`,

  `<h2>▬ Diện tích hình chữ nhật</h2>
  <div class="formula">S = dài × rộng = a × b</div>
  <div class="example">
    <strong>Hình chữ nhật dài 9cm, rộng 5cm:</strong><br>
    S = 9 × 5 = <strong>45 cm²</strong><br><br>
    <strong>Sân bóng dài 100m, rộng 60m:</strong><br>
    S = 100 × 60 = <strong>6.000 m²</strong>
  </div>
  <p class="tip">Nhớ: dài và rộng phải cùng đơn vị trước khi nhân!</p>`,

  `<h2>Đổi đơn vị diện tích</h2>
  <div class="formula">
    1 m² = 100 dm² = 10.000 cm²<br>
    1 dm² = 100 cm²<br>
    1 km² = 1.000.000 m²
  </div>
  <div class="example">
    <strong>3 m² = ? dm²</strong> → 3 × 100 = <strong>300 dm²</strong><br>
    <strong>5 dm² = ? cm²</strong> → 5 × 100 = <strong>500 cm²</strong><br>
    <strong>20.000 cm² = ? m²</strong> → 20.000 ÷ 10.000 = <strong>2 m²</strong>
  </div>
  <p class="tip">Mỗi đơn vị diện tích liền kề hơn/kém nhau 100 lần!</p>`,

  `<h2>🎯 Bài toán thực tế</h2>
  <div class="example">
    <strong>Bài 1:</strong> Phòng hình chữ nhật dài 5m, rộng 4m. Lát gạch vuông cạnh 50cm. Cần bao nhiêu viên?<br>
    → S phòng = 5 × 4 = 20 m² = 200.000 cm²<br>
    → S gạch = 50 × 50 = 2.500 cm²<br>
    → Số viên = 200.000 ÷ 2.500 = <strong>80 viên</strong><br><br>
    <strong>Bài 2:</strong> Vườn hình vuông cạnh 15m. Tính diện tích?<br>
    → S = 15 × 15 = <strong>225 m²</strong>
  </div>
  <p class="tip">Đọc kỹ đề → vẽ hình → áp công thức → đổi đơn vị nếu cần!</p>`,
],

average4: [
  `<h2>📊 Trung bình cộng là gì?</h2>
  <div class="visual-lg">📊</div>
  <p><strong>Trung bình cộng</strong> = giá trị "ở giữa" của nhóm số</p>
  <div class="formula">Trung bình cộng = Tổng các số ÷ Số lượng các số</div>
  <div class="example">
    <strong>Tìm trung bình cộng của 4, 6, 8:</strong><br>
    → Tổng = 4 + 6 + 8 = 18<br>
    → Số lượng = 3<br>
    → TB = 18 ÷ 3 = <strong>6</strong>
  </div>
  <p class="tip">Tưởng tượng: san bằng tất cả cho đều nhau = trung bình!</p>`,

  `<h2>Cách tính trung bình cộng</h2>
  <div class="formula">TB = (a + b + c + ...) ÷ n<br>(n = số lượng các số)</div>
  <div class="example">
    <strong>Điểm 4 bài kiểm tra: 7, 8, 9, 10</strong><br>
    → TB = (7 + 8 + 9 + 10) ÷ 4<br>
    → TB = 34 ÷ 4 = <strong>8,5 điểm</strong><br><br>
    <strong>Chiều cao 5 bạn: 120, 125, 118, 130, 127 cm</strong><br>
    → TB = (120+125+118+130+127) ÷ 5<br>
    → TB = 620 ÷ 5 = <strong>124 cm</strong>
  </div>`,

  `<h2>Tìm tổng biết trung bình cộng</h2>
  <div class="formula">Tổng = Trung bình cộng × Số lượng</div>
  <div class="example">
    <strong>Trung bình 3 số là 25. Tổng 3 số = ?</strong><br>
    → Tổng = 25 × 3 = <strong>75</strong><br><br>
    <strong>Trung bình cộng 5 bài kiểm tra là 8 điểm. Tổng điểm?</strong><br>
    → Tổng = 8 × 5 = <strong>40 điểm</strong>
  </div>
  <p class="tip">Biết TB và số lượng → tìm tổng: nhân lên!<br>Biết tổng và số lượng → tìm TB: chia ra!</p>`,

  `<h2>🎯 Bài toán thực tế</h2>
  <div class="example">
    <strong>Bài 1:</strong> Ba bạn cân nặng 28kg, 32kg, 30kg. TB cân nặng?<br>
    → (28+32+30) ÷ 3 = 90 ÷ 3 = <strong>30 kg</strong><br><br>
    <strong>Bài 2:</strong> TB 4 số là 15. Ba số đầu: 12, 14, 18. Số thứ tư?<br>
    → Tổng 4 số = 15 × 4 = 60<br>
    → Số thứ tư = 60 - 12 - 14 - 18 = <strong>16</strong><br><br>
    <strong>Bài 3:</strong> Lớp có 20 bạn nam TB 35kg, 15 bạn nữ TB 30kg. TB cả lớp?<br>
    → Tổng = 20×35 + 15×30 = 700 + 450 = 1150<br>
    → TB = 1150 ÷ 35 = <strong>32,9 kg</strong>
  </div>`,
],

expr4: [
  `<h2>🧮 Thứ tự thực hiện phép tính</h2>
  <div class="visual-lg">🧮</div>
  <p>Biểu thức có nhiều phép tính → phải tính theo <strong>thứ tự</strong>!</p>
  <div class="formula">
    1️⃣ Ngoặc ( ) trước<br>
    2️⃣ Nhân × Chia ÷ trước<br>
    3️⃣ Cộng + Trừ − sau<br>
    4️⃣ Từ trái sang phải
  </div>
  <div class="example">
    <strong>3 + 2 × 4 = ?</strong><br>
    → Nhân trước: 2 × 4 = 8<br>
    → Cộng sau: 3 + 8 = <strong>11</strong> (không phải 20!)
  </div>`,

  `<h2>Dấu ngoặc ( ) thay đổi thứ tự</h2>
  <div class="formula">Trong ngoặc LUÔN tính trước!</div>
  <div class="example">
    <strong>Không ngoặc:</strong> 3 + 2 × 4 = 3 + 8 = <strong>11</strong><br>
    <strong>Có ngoặc:</strong> (3 + 2) × 4 = 5 × 4 = <strong>20</strong><br><br>
    <strong>20 − (3 + 5) × 2:</strong><br>
    → Ngoặc: 3 + 5 = 8<br>
    → Nhân: 8 × 2 = 16<br>
    → Trừ: 20 − 16 = <strong>4</strong>
  </div>
  <p class="tip">Thấy ngoặc → tính trong ngoặc trước mọi thứ!</p>`,

  `<h2>Nhiều ngoặc lồng nhau</h2>
  <div class="formula">Ngoặc trong tính trước, ngoặc ngoài tính sau<br>{ [ ( ) ] }</div>
  <div class="example">
    <strong>100 − [20 + (5 × 3)]:</strong><br>
    → Ngoặc tròn: 5 × 3 = 15<br>
    → Ngoặc vuông: 20 + 15 = 35<br>
    → Kết quả: 100 − 35 = <strong>65</strong><br><br>
    <strong>2 × [30 − (4 + 6)]:</strong><br>
    → (4 + 6) = 10<br>
    → [30 − 10] = 20<br>
    → 2 × 20 = <strong>40</strong>
  </div>`,

  `<h2>🎯 Luyện tập biểu thức</h2>
  <div class="example">
    <strong>Tính:</strong><br>
    a) 15 + 6 × 3 = 15 + 18 = <strong>33</strong><br>
    b) (15 + 6) × 3 = 21 × 3 = <strong>63</strong><br>
    c) 48 ÷ 4 − 2 × 3 = 12 − 6 = <strong>6</strong><br>
    d) 48 ÷ (4 − 2) × 3 = 48 ÷ 2 × 3 = 24 × 3 = <strong>72</strong>
  </div>
  <div class="highlight">
    Nhớ quy tắc: Ngoặc → Nhân Chia → Cộng Trừ → Trái sang Phải<br>
    Viết tắt: <strong>N-NC-CT-TP</strong>
  </div>
  <p class="tip">Gạch chân phần tính trước để không bị nhầm! ✏️</p>`,
],


// ==================== LỚP 5 ====================
decimal5: [
  `<h2>🔢 Số thập phân</h2>
  <div class="visual-lg">🔢</div>
  <p>Số thập phân có phần nguyên và phần thập phân, ngăn cách bởi <strong>dấu phẩy</strong></p>
  <div class="formula">
    3,14 → phần nguyên: 3, phần thập phân: 14<br>
    0,5 = 5/10 = 1/2<br>
    0,25 = 25/100 = 1/4
  </div>
  <div class="example">
    <strong>Đọc số thập phân:</strong><br>
    3,7 → "ba phẩy bảy"<br>
    12,05 → "mười hai phẩy không năm"<br>
    0,125 → "không phẩy một trăm hai mươi lăm"
  </div>
  <p class="tip">Phần thập phân: hàng phần mười, phần trăm, phần nghìn...</p>`,

  `<h2>So sánh số thập phân</h2>
  <div class="formula">Bước 1: So phần nguyên<br>Bước 2: Nếu bằng → so phần thập phân từ trái sang phải</div>
  <div class="example">
    <strong>3,14 và 3,2:</strong><br>
    → Phần nguyên: 3 = 3<br>
    → Phần thập phân: 1 < 2 (hàng phần mười)<br>
    → 3,14 < 3,2 ✓<br><br>
    <strong>5,08 và 5,1:</strong><br>
    → 5 = 5, so tiếp: 0 < 1<br>
    → 5,08 < 5,1 ✓
  </div>
  <p class="tip">Thêm số 0 vào cuối cho dễ so sánh: 3,2 = 3,20 > 3,14!</p>`,

  `<h2>Cộng trừ số thập phân</h2>
  <div class="formula">Đặt thẳng cột dấu phẩy → cộng/trừ như số tự nhiên!</div>
  <div class="example">
    <strong>3,25 + 1,4:</strong><br>
    &nbsp;&nbsp;3,25<br>
    + 1,40<br>
    ------<br>
    &nbsp;&nbsp;<strong>4,65</strong><br><br>
    <strong>5,7 − 2,35:</strong><br>
    &nbsp;&nbsp;5,70<br>
    − 2,35<br>
    ------<br>
    &nbsp;&nbsp;<strong>3,35</strong>
  </div>
  <p class="tip">Luôn thẳng hàng dấu phẩy! Thêm số 0 cho đủ chữ số.</p>`,

  `<h2>Nhân chia số thập phân</h2>
  <div class="formula">
    Nhân: đếm tổng chữ số thập phân → đặt phẩy<br>
    Chia: dời phẩy rồi chia như bình thường
  </div>
  <div class="example">
    <strong>1,5 × 0,3:</strong><br>
    → 15 × 3 = 45, tổng 2 chữ số thập phân<br>
    → Kết quả: <strong>0,45</strong><br><br>
    <strong>7,2 ÷ 0,4:</strong><br>
    → Dời phẩy: 72 ÷ 4 = <strong>18</strong><br><br>
    <strong>Nhân/chia 10, 100:</strong><br>
    3,14 × 10 = 31,4 (dời phẩy phải 1)<br>
    3,14 ÷ 10 = 0,314 (dời phẩy trái 1)
  </div>`,

  `<h2>🎯 Số thập phân trong đời sống</h2>
  <div class="example">
    💰 <strong>Giá:</strong> 15.500đ = 15,5 nghìn đồng<br>
    📏 <strong>Chiều cao:</strong> 1,45 m = 1 mét 45 cm<br>
    ⚖️ <strong>Cân nặng:</strong> 32,5 kg<br>
    🌡️ <strong>Nhiệt độ:</strong> 36,5°C
  </div>
  <div class="highlight">
    0,1 = 1/10 &nbsp;|&nbsp; 0,01 = 1/100<br>
    0,5 = 1/2 &nbsp;|&nbsp; 0,25 = 1/4<br>
    0,75 = 3/4 &nbsp;|&nbsp; 0,2 = 1/5
  </div>
  <p class="tip">Số thập phân có mặt ở khắp nơi: tiền, đo lường, nhiệt độ! 🌍</p>`,
],

percent5: [
  `<h2>💯 Phần trăm là gì?</h2>
  <div class="visual-lg">💯</div>
  <p><strong>Phần trăm (%)</strong> = phần trên tổng 100 phần</p>
  <div class="formula">
    1% = 1/100 = 0,01<br>
    50% = 50/100 = 1/2<br>
    100% = toàn bộ
  </div>
  <div class="example">
    🍕 Ăn 25% pizza = ăn 1/4 pizza<br>
    📊 Đúng 80% bài = đúng 80 trên 100 câu<br>
    🏷️ Giảm giá 30% = giảm 30 phần trên mỗi 100
  </div>
  <p class="tip">% chính là phân số có mẫu là 100!</p>`,

  `<h2>Tìm phần trăm của một số</h2>
  <div class="formula">a% của b = b × a ÷ 100</div>
  <div class="example">
    <strong>25% của 80 = ?</strong><br>
    → 80 × 25 ÷ 100 = 2000 ÷ 100 = <strong>20</strong><br><br>
    <strong>15% của 200 = ?</strong><br>
    → 200 × 15 ÷ 100 = 3000 ÷ 100 = <strong>30</strong><br><br>
    <strong>Mẹo nhanh:</strong><br>
    50% = chia 2 | 25% = chia 4 | 10% = chia 10
  </div>
  <p class="tip">10% dễ tính nhất: bỏ 1 số 0 cuối (hoặc chia 10)!</p>`,

  `<h2>Tìm tỉ số phần trăm</h2>
  <div class="formula">Tỉ số % = (phần ÷ toàn bộ) × 100%</div>
  <div class="example">
    <strong>Lớp 40 bạn, 32 bạn giỏi. Tỉ lệ % giỏi?</strong><br>
    → (32 ÷ 40) × 100% = 0,8 × 100% = <strong>80%</strong><br><br>
    <strong>Mua 50.000đ, được giảm 10.000đ. Giảm bao nhiêu %?</strong><br>
    → (10.000 ÷ 50.000) × 100% = 0,2 × 100% = <strong>20%</strong>
  </div>
  <p class="tip">Phần ÷ Tổng × 100 = phần trăm! Đơn giản vậy thôi 😊</p>`,

  `<h2>🎯 Bài toán phần trăm thực tế</h2>
  <div class="example">
    <strong>Bài 1:</strong> Áo giá 200.000đ, giảm 15%. Giá mới?<br>
    → Giảm: 200.000 × 15 ÷ 100 = 30.000đ<br>
    → Giá mới: 200.000 − 30.000 = <strong>170.000đ</strong><br><br>
    <strong>Bài 2:</strong> Gửi 1.000.000đ, lãi suất 5%/năm. Sau 1 năm có?<br>
    → Lãi: 1.000.000 × 5 ÷ 100 = 50.000đ<br>
    → Tổng: 1.000.000 + 50.000 = <strong>1.050.000đ</strong>
  </div>
  <p class="tip">Phần trăm xuất hiện nhiều trong mua sắm, ngân hàng, điểm số! 🛒🏦</p>`,
],

area5: [
  `<h2>📐 Diện tích tam giác</h2>
  <div class="visual-lg">🔺</div>
  <div class="formula">S = (đáy × chiều cao) ÷ 2<br>S = a × h ÷ 2</div>
  <div class="example">
    <strong>Tam giác đáy 8cm, cao 5cm:</strong><br>
    S = 8 × 5 ÷ 2 = 40 ÷ 2 = <strong>20 cm²</strong><br><br>
    <strong>Tam giác đáy 12m, cao 7m:</strong><br>
    S = 12 × 7 ÷ 2 = 84 ÷ 2 = <strong>42 m²</strong>
  </div>
  <p class="tip">Diện tích tam giác = một nửa hình chữ nhật bao quanh nó!</p>`,

  `<h2>Diện tích hình thang</h2>
  <div class="formula">S = (đáy lớn + đáy bé) × chiều cao ÷ 2<br>S = (a + b) × h ÷ 2</div>
  <div class="example">
    <strong>Hình thang: đáy lớn 10cm, đáy bé 6cm, cao 4cm:</strong><br>
    S = (10 + 6) × 4 ÷ 2<br>
    S = 16 × 4 ÷ 2 = 64 ÷ 2 = <strong>32 cm²</strong>
  </div>
  <div class="highlight">Mẹo nhớ: Trung bình 2 đáy × chiều cao ÷ 2<br>Hoặc: (tổng 2 đáy) × cao ÷ 2</div>`,

  `<h2>⭕ Diện tích hình tròn</h2>
  <div class="formula">S = r × r × 3,14<br>S = r² × π (π ≈ 3,14)</div>
  <div class="example">
    <strong>Hình tròn bán kính 5cm:</strong><br>
    S = 5 × 5 × 3,14 = 25 × 3,14 = <strong>78,5 cm²</strong><br><br>
    <strong>Hình tròn bán kính 10m:</strong><br>
    S = 10 × 10 × 3,14 = <strong>314 m²</strong>
  </div>
  <div class="highlight">
    Chu vi hình tròn: C = d × 3,14 (d = đường kính)<br>
    Bán kính r = d ÷ 2
  </div>`,

  `<h2>🎯 So sánh công thức diện tích</h2>
  <div class="highlight">
    ⬜ Hình vuông: S = a × a<br>
    ▬ Hình chữ nhật: S = a × b<br>
    🔺 Tam giác: S = a × h ÷ 2<br>
    ▱ Hình thang: S = (a + b) × h ÷ 2<br>
    ⭕ Hình tròn: S = r × r × 3,14
  </div>
  <div class="example">
    <strong>Đất hình thang:</strong> đáy 20m, 14m, cao 10m<br>
    → S = (20+14) × 10 ÷ 2 = 34 × 10 ÷ 2 = <strong>170 m²</strong>
  </div>
  <p class="tip">Mỗi hình 1 công thức, học thuộc rồi áp dụng! 📝</p>`,
],

volume5: [
  `<h2>📦 Thể tích là gì?</h2>
  <div class="visual-lg">📦</div>
  <p><strong>Thể tích</strong> = không gian mà vật chiếm chỗ (3 chiều!)</p>
  <div class="formula">
    Đơn vị: cm³, dm³, m³<br>
    1 dm³ = 1.000 cm³ = 1 lít<br>
    1 m³ = 1.000 dm³ = 1.000 lít
  </div>
  <div class="example">
    📦 Hộp sữa 1 lít = 1 dm³<br>
    🧊 Viên đá nhỏ ≈ 1 cm³<br>
    🏠 Phòng 3×4×3m = 36 m³
  </div>
  <p class="tip">Diện tích = 2 chiều (mặt phẳng), Thể tích = 3 chiều (không gian)!</p>`,

  `<h2>Thể tích hình lập phương</h2>
  <div class="formula">V = cạnh × cạnh × cạnh = a³</div>
  <div class="example">
    <strong>Hình lập phương cạnh 4cm:</strong><br>
    V = 4 × 4 × 4 = <strong>64 cm³</strong><br><br>
    <strong>Hình lập phương cạnh 10cm:</strong><br>
    V = 10 × 10 × 10 = <strong>1.000 cm³ = 1 dm³ = 1 lít</strong>
  </div>
  <div class="highlight">Diện tích toàn phần hình lập phương:<br>S = cạnh × cạnh × 6 = a² × 6</div>`,

  `<h2>Thể tích hình hộp chữ nhật</h2>
  <div class="formula">V = dài × rộng × cao = a × b × c</div>
  <div class="example">
    <strong>Hình hộp dài 5cm, rộng 3cm, cao 4cm:</strong><br>
    V = 5 × 3 × 4 = <strong>60 cm³</strong><br><br>
    <strong>Bể cá dài 50cm, rộng 30cm, cao 40cm:</strong><br>
    V = 50 × 30 × 40 = <strong>60.000 cm³ = 60 dm³ = 60 lít</strong>
  </div>
  <div class="highlight">Diện tích toàn phần hình hộp chữ nhật:<br>S = 2 × (ab + bc + ac)</div>`,

  `<h2>🎯 Bài toán thể tích thực tế</h2>
  <div class="example">
    <strong>Bài 1:</strong> Bể nước hình hộp dài 1,5m, rộng 1m, cao 0,8m. Chứa được bao nhiêu lít?<br>
    → V = 1,5 × 1 × 0,8 = 1,2 m³<br>
    → 1,2 m³ = 1.200 dm³ = <strong>1.200 lít</strong><br><br>
    <strong>Bài 2:</strong> Khối rubik cạnh 6cm. Thể tích?<br>
    → V = 6 × 6 × 6 = <strong>216 cm³</strong><br><br>
    <strong>Bài 3:</strong> Đổ đầy bể 80 lít, mỗi phút đổ 5 lít. Cần mấy phút?<br>
    → 80 ÷ 5 = <strong>16 phút</strong>
  </div>`,
],

speed5: [
  `<h2>🚗 Chuyển động đều</h2>
  <div class="visual-lg">🚗</div>
  <p><strong>Chuyển động đều</strong> = đi với vận tốc không đổi</p>
  <div class="formula">
    v = s ÷ t (vận tốc = quãng đường ÷ thời gian)<br>
    s = v × t (quãng đường = vận tốc × thời gian)<br>
    t = s ÷ v (thời gian = quãng đường ÷ vận tốc)
  </div>
  <div class="example">
    <strong>v</strong> = velocity (vận tốc) - nhanh cỡ nào<br>
    <strong>s</strong> = distance (quãng đường) - đi xa cỡ nào<br>
    <strong>t</strong> = time (thời gian) - đi lâu cỡ nào
  </div>`,

  `<h2>Đơn vị vận tốc</h2>
  <div class="formula">km/giờ (km/h) → ô tô, xe máy<br>m/phút (m/min) → người đi bộ<br>m/giây (m/s) → chạy, rơi</div>
  <div class="example">
    🚗 Ô tô: 60 km/giờ (mỗi giờ đi 60km)<br>
    🚶 Đi bộ: 60 m/phút (mỗi phút đi 60m)<br>
    🏃 Chạy: 5 m/giây (mỗi giây đi 5m)
  </div>
  <div class="highlight">
    Đổi đơn vị:<br>
    1 km = 1000 m | 1 giờ = 60 phút = 3600 giây
  </div>`,

  `<h2>Giải bài toán chuyển động</h2>
  <div class="example">
    <strong>Bài 1:</strong> Xe đi 150km trong 3 giờ. Vận tốc?<br>
    → v = 150 ÷ 3 = <strong>50 km/giờ</strong><br><br>
    <strong>Bài 2:</strong> Đi bộ vận tốc 4km/giờ, đi 2 giờ. Quãng đường?<br>
    → s = 4 × 2 = <strong>8 km</strong><br><br>
    <strong>Bài 3:</strong> Đi 120km với vận tốc 40km/giờ. Thời gian?<br>
    → t = 120 ÷ 40 = <strong>3 giờ</strong>
  </div>
  <p class="tip">Tam giác v-s-t: che cái cần tìm, 2 cái còn lại chỉ cách tính!</p>`,

  `<h2>Hai xe chuyển động</h2>
  <div class="formula">
    Đi ngược chiều: v tổng = v₁ + v₂<br>
    Đi cùng chiều: v hiệu = v₁ − v₂
  </div>
  <div class="example">
    <strong>Hai xe ngược chiều:</strong> cách 200km, xe A: 60km/h, xe B: 40km/h<br>
    → v tổng = 60 + 40 = 100 km/h<br>
    → Gặp nhau sau: 200 ÷ 100 = <strong>2 giờ</strong><br><br>
    <strong>Hai xe cùng chiều:</strong> cách 50km, xe trước: 40km/h, xe sau: 60km/h<br>
    → v hiệu = 60 − 40 = 20 km/h<br>
    → Đuổi kịp sau: 50 ÷ 20 = <strong>2,5 giờ</strong>
  </div>
  <p class="tip">Ngược chiều = cộng vận tốc, Cùng chiều = trừ vận tốc! 🚗↔️🚙</p>`,
],

ratio5: [
  `<h2>⚖️ Tỉ số là gì?</h2>
  <div class="visual-lg">⚖️</div>
  <p><strong>Tỉ số</strong> = so sánh 2 đại lượng bằng phép chia</p>
  <div class="formula">Tỉ số của a và b = a : b = a/b</div>
  <div class="example">
    <strong>Lớp có 20 nam, 15 nữ:</strong><br>
    → Tỉ số nam và nữ = 20 : 15 = 4 : 3<br>
    → Cứ 4 bạn nam thì có 3 bạn nữ<br><br>
    <strong>Pha nước cam: 1 phần cam, 4 phần nước:</strong><br>
    → Tỉ số cam : nước = 1 : 4
  </div>
  <p class="tip">Rút gọn tỉ số giống rút gọn phân số: chia cùng 1 số!</p>`,

  `<h2>Tỉ lệ thuận</h2>
  <div class="formula">Tỉ lệ thuận: đại lượng này tăng → đại lượng kia cũng tăng<br>(theo cùng tỉ số)</div>
  <div class="example">
    <strong>1 quyển vở 5.000đ:</strong><br>
    → 2 quyển = 10.000đ<br>
    → 5 quyển = 25.000đ<br>
    → Số vở tăng bao nhiêu lần, tiền tăng bấy nhiêu lần!<br><br>
    <strong>Xe đi 50km/h:</strong><br>
    → 1 giờ = 50km, 2 giờ = 100km, 3 giờ = 150km
  </div>
  <p class="tip">Mua nhiều hơn → trả nhiều hơn = tỉ lệ thuận! 📈</p>`,

  `<h2>Tỉ lệ nghịch</h2>
  <div class="formula">Tỉ lệ nghịch: đại lượng này tăng → đại lượng kia GIẢM<br>(tích không đổi)</div>
  <div class="example">
    <strong>12 cái kẹo chia cho các bạn:</strong><br>
    → 2 bạn: mỗi bạn 6 cái<br>
    → 3 bạn: mỗi bạn 4 cái<br>
    → 6 bạn: mỗi bạn 2 cái<br>
    → Nhiều bạn hơn = ít kẹo hơn!<br><br>
    <strong>Đi 120km:</strong> v=40 → t=3h, v=60 → t=2h<br>
    → Nhanh hơn = ít thời gian hơn
  </div>
  <p class="tip">Nhiều người làm → nhanh hơn = tỉ lệ nghịch! 📉</p>`,

  `<h2>🎯 Giải bài toán tỉ lệ</h2>
  <div class="example">
    <strong>Bài 1 (Tỉ lệ thuận):</strong> 3 công nhân làm 12 sản phẩm. 5 công nhân làm?<br>
    → 1 CN: 12÷3 = 4 SP<br>
    → 5 CN: 4×5 = <strong>20 SP</strong><br><br>
    <strong>Bài 2 (Tỉ lệ nghịch):</strong> 4 người làm xong trong 6 ngày. 8 người?<br>
    → Tổng công: 4×6 = 24 (ngày-người)<br>
    → 8 người: 24÷8 = <strong>3 ngày</strong><br><br>
    <strong>Bài 3 (Tỉ số):</strong> Chia 35 kẹo theo tỉ lệ 3:4<br>
    → Tổng phần: 3+4 = 7<br>
    → Phần 1: 35÷7×3 = <strong>15</strong>, Phần 2: 35÷7×4 = <strong>20</strong>
  </div>`,
],

}; // end LESSONS

// === GRADE TOPICS CONFIG ===
const GRADE_TOPICS = {
  0: [
    { id: 'count0', icon: '🔢', name: 'Đếm 1-5', desc: 'Đếm số đồ vật' },
    { id: 'compare0', icon: '⚖️', name: 'Nhiều - Ít', desc: 'So sánh số lượng' },
    { id: 'size0', icon: '🐘', name: 'To - Nhỏ', desc: 'So sánh kích thước' },
    { id: 'colors0', icon: '🌈', name: 'Màu Sắc', desc: 'Nhận biết màu' },
    { id: 'shapes0', icon: '🔷', name: 'Hình Dạng', desc: 'Tròn, vuông, tam giác' },
    { id: 'animals0', icon: '🐶', name: 'Con Vật', desc: 'Tiếng kêu con vật' },
  ],
  1: [
    { id: 'count1', icon: '🔢', name: 'Đếm Đến 20', desc: 'Đếm và viết số' },
    { id: 'add1', icon: '➕', name: 'Phép Cộng', desc: 'Cộng trong phạm vi 10' },
    { id: 'sub1', icon: '➖', name: 'Phép Trừ', desc: 'Trừ trong phạm vi 10' },
    { id: 'compare1', icon: '⚖️', name: 'So Sánh Số', desc: 'Lớn hơn, bé hơn, bằng' },
    { id: 'order1', icon: '🔢', name: 'Thứ Tự Số', desc: 'Liền trước, liền sau' },
    { id: 'shapes1', icon: '🔷', name: 'Hình Khối', desc: 'Nhận biết các hình' },
  ],
  2: [
    { id: 'clock', icon: '🕐', name: 'Đồng Hồ', desc: 'Đọc giờ, phút, kéo kim' },
    { id: 'units', icon: '📏', name: 'Đo Lường', desc: 'cm, m, kg, lít' },
    { id: 'multiply', icon: '✖️', name: 'Bảng Nhân', desc: 'Nhân 2, 3, 4, 5' },
    { id: 'carry', icon: '➕', name: 'Cộng Có Nhớ', desc: 'Cộng trừ qua 10' },
    { id: 'shapes', icon: '🔷', name: 'Hình Học', desc: 'Hình, cạnh, chu vi' },
    { id: 'money', icon: '💰', name: 'Tiền Việt Nam', desc: 'Đếm, trả tiền' },
  ],
  3: [
    { id: 'mul3', icon: '✖️', name: 'Bảng Nhân', desc: 'Nhân 6, 7, 8, 9' },
    { id: 'div3', icon: '➗', name: 'Phép Chia', desc: 'Chia hết, chia dư' },
    { id: 'fractions3', icon: '🍕', name: 'Phân Số', desc: 'Đọc, so sánh PS đơn giản' },
    { id: 'perimeter3', icon: '📐', name: 'Chu Vi', desc: 'Chu vi, diện tích' },
    { id: 'time3', icon: '📅', name: 'Thời Gian', desc: 'Ngày, tháng, năm' },
    { id: 'calc3', icon: '🧮', name: 'Tính Nhẩm', desc: 'Nhân chia nhẩm nhanh' },
  ],
  4: [
    { id: 'bignum4', icon: '🔢', name: 'Số Lớn', desc: 'Triệu, tỉ, so sánh' },
    { id: 'fractions4', icon: '🍕', name: 'Phân Số', desc: 'Rút gọn, quy đồng, cộng trừ' },
    { id: 'angle4', icon: '📐', name: 'Góc & Hình', desc: 'Góc nhọn, tù, vuông' },
    { id: 'area4', icon: '⬜', name: 'Diện Tích', desc: 'DT hình vuông, chữ nhật' },
    { id: 'average4', icon: '📊', name: 'Trung Bình', desc: 'Tìm số trung bình cộng' },
    { id: 'expr4', icon: '🧮', name: 'Biểu Thức', desc: 'Thứ tự tính, ngoặc' },
  ],
  5: [
    { id: 'decimal5', icon: '🔢', name: 'Số Thập Phân', desc: 'Đọc, viết, so sánh' },
    { id: 'percent5', icon: '💯', name: 'Phần Trăm', desc: 'Tính %, bài toán %' },
    { id: 'area5', icon: '📐', name: 'Diện Tích', desc: 'Tam giác, hình thang, tròn' },
    { id: 'volume5', icon: '📦', name: 'Thể Tích', desc: 'HLP, hình hộp CN' },
    { id: 'speed5', icon: '🚗', name: 'Chuyển Động', desc: 'Vận tốc, quãng đường, t/gian' },
    { id: 'ratio5', icon: '⚖️', name: 'Tỉ Lệ', desc: 'Tỉ số, bài toán tỉ lệ' },
  ],
};

const GRADE_SUBTITLES = {
  0: 'Bé 5 tuổi - Học qua hình ảnh vui nhộn!',
  1: 'Toán lớp 1 - Đếm, cộng, trừ cơ bản!',
  2: 'Toán lớp 2 - Học qua hình ảnh!',
  3: 'Toán lớp 3 - Nâng cao hơn!',
  4: 'Toán lớp 4 - Khám phá số học!',
  5: 'Toán lớp 5 - Sẵn sàng lên cấp!',
};

let currentGrade = 2;

function switchGrade(grade) {
  currentGrade = grade;
  document.querySelectorAll('.grade-tab').forEach(t => t.classList.toggle('active', parseInt(t.dataset.grade) === grade));
  document.getElementById('learn-subtitle').textContent = GRADE_SUBTITLES[grade];
  renderTopicsGrid();
}

function renderTopicsGrid() {
  const grid = document.getElementById('topics-grid');
  const topics = GRADE_TOPICS[currentGrade] || [];
  grid.innerHTML = topics.map(t => `
    <div class="topic-card" onclick="openTopic('${t.id}')">
      <span class="topic-icon">${t.icon}</span>
      <span class="topic-name">${t.name}</span>
      <span class="topic-desc">${t.desc}</span>
    </div>
  `).join('');
}

// Init grade from player profile
(function initGrade() {
  try {
    const p = JSON.parse(localStorage.getItem('hocvui_profile'));
    if (p && p.grade != null && p.grade >= 0 && p.grade <= 5) { currentGrade = p.grade; switchGrade(currentGrade); return; }
  } catch {}
  renderTopicsGrid();
})();

// === INTERACTIVE CLOCK ===
let clockState = { hour: 12, minute: 0, dragging: null, targetHour: 3, targetMinute: 0, correct: 0, wrong: 0 };

function openClockPlay() {
  showScreen('clock-play-screen');
  drawInteractiveClock();
  newChallenge();
}

function drawInteractiveClock() {
  const svg = document.getElementById('interactive-clock');
  const cx = 140, cy = 140, r = 120;

  // Numbers & ticks
  let nums = '', ticks = '';
  for (let i = 1; i <= 12; i++) {
    const a = (i * 30 - 90) * Math.PI / 180;
    nums += `<text x="${cx + (r - 22) * Math.cos(a)}" y="${cy + (r - 22) * Math.sin(a)}" text-anchor="middle" dominant-baseline="central" font-size="18" font-weight="bold" fill="#333">${i}</text>`;
  }
  for (let i = 0; i < 60; i++) {
    const a = (i * 6 - 90) * Math.PI / 180;
    const o = r - 3, inner = i % 5 === 0 ? r - 12 : r - 7;
    ticks += `<line x1="${cx + inner * Math.cos(a)}" y1="${cy + inner * Math.sin(a)}" x2="${cx + o * Math.cos(a)}" y2="${cy + o * Math.sin(a)}" stroke="#888" stroke-width="${i % 5 === 0 ? 2 : 1}"/>`;
  }

  svg.innerHTML = `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="white" stroke="#333" stroke-width="4"/>
    ${ticks}${nums}
    <line id="hour-hand" x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy}" stroke="#333" stroke-width="6" stroke-linecap="round" style="cursor:pointer"/>
    <line id="minute-hand" x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy}" stroke="#2196F3" stroke-width="4" stroke-linecap="round" style="cursor:pointer"/>
    <circle cx="${cx}" cy="${cy}" r="6" fill="#f44336"/>
    <!-- Invisible larger touch targets -->
    <line id="hour-touch" x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy}" stroke="transparent" stroke-width="20" stroke-linecap="round" style="cursor:grab"/>
    <line id="minute-touch" x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy}" stroke="transparent" stroke-width="20" stroke-linecap="round" style="cursor:grab"/>
  `;

  updateClockHands();
  setupClockDrag();
}

function updateClockHands() {
  const cx = 140, cy = 140;
  const hAngle = ((clockState.hour % 12) + clockState.minute / 60) * 30 - 90;
  const mAngle = clockState.minute * 6 - 90;
  const hLen = 55, mLen = 85;

  const hx = cx + hLen * Math.cos(hAngle * Math.PI / 180);
  const hy = cy + hLen * Math.sin(hAngle * Math.PI / 180);
  const mx = cx + mLen * Math.cos(mAngle * Math.PI / 180);
  const my = cy + mLen * Math.sin(mAngle * Math.PI / 180);

  document.getElementById('hour-hand').setAttribute('x2', hx);
  document.getElementById('hour-hand').setAttribute('y2', hy);
  document.getElementById('hour-touch').setAttribute('x2', hx);
  document.getElementById('hour-touch').setAttribute('y2', hy);
  document.getElementById('minute-hand').setAttribute('x2', mx);
  document.getElementById('minute-hand').setAttribute('y2', my);
  document.getElementById('minute-touch').setAttribute('x2', mx);
  document.getElementById('minute-touch').setAttribute('y2', my);

  // Display
  const hStr = clockState.hour.toString().padStart(2, '0');
  const mStr = clockState.minute.toString().padStart(2, '0');
  document.getElementById('clock-time-display').textContent = `${hStr}:${mStr}`;
}

function setupClockDrag() {
  const svg = document.getElementById('interactive-clock');
  const cx = 140, cy = 140;

  function getAngle(e) {
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left - cx * (rect.width / 280);
    const y = (e.clientY || e.touches[0].clientY) - rect.top - cy * (rect.height / 280);
    return Math.atan2(y, x) * 180 / Math.PI + 90;
  }

  function normalizeAngle(a) { return ((a % 360) + 360) % 360; }

  // Determine which hand to drag based on click position
  function startDrag(e) {
    e.preventDefault();
    const rect = svg.getBoundingClientRect();
    const px = (e.clientX || e.touches[0].clientX) - rect.left;
    const py = (e.clientY || e.touches[0].clientY) - rect.top;
    const scale = rect.width / 280;
    const dx = px / scale - cx, dy = py / scale - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // If closer to center → hour hand, further → minute hand
    clockState.dragging = dist < 60 ? 'hour' : 'minute';
  }

  function onDrag(e) {
    if (!clockState.dragging) return;
    e.preventDefault();
    const angle = normalizeAngle(getAngle(e));

    if (clockState.dragging === 'minute') {
      clockState.minute = Math.round(angle / 6) % 60;
    } else {
      clockState.hour = Math.round(angle / 30) % 12 || 12;
    }
    updateClockHands();
  }

  function endDrag() { clockState.dragging = null; }

  svg.addEventListener('mousedown', startDrag);
  svg.addEventListener('mousemove', onDrag);
  svg.addEventListener('mouseup', endDrag);
  svg.addEventListener('mouseleave', endDrag);
  svg.addEventListener('touchstart', startDrag, { passive: false });
  svg.addEventListener('touchmove', onDrag, { passive: false });
  svg.addEventListener('touchend', endDrag);
}

function newChallenge() {
  clockState.targetHour = Math.floor(Math.random() * 12) + 1;
  // Only 0, 15, 30, 45 for easier challenges
  clockState.targetMinute = [0, 15, 30, 45][Math.floor(Math.random() * 4)];

  const minText = clockState.targetMinute === 0 ? '00' : clockState.targetMinute;
  document.getElementById('target-time').textContent = `${clockState.targetHour} giờ ${minText} phút`;
  document.getElementById('challenge-result').textContent = '';
  document.getElementById('challenge-result').className = 'challenge-result';

  // Reset clock to 12:00
  clockState.hour = 12;
  clockState.minute = 0;
  updateClockHands();
}

document.getElementById('btn-check-time').addEventListener('click', () => {
  const hOk = clockState.hour === clockState.targetHour;
  const mOk = clockState.minute === clockState.targetMinute;
  const el = document.getElementById('challenge-result');

  if (hOk && mOk) {
    el.textContent = '🎉 Đúng rồi! Giỏi lắm!';
    el.className = 'challenge-result correct';
    clockState.correct++;
    // Clap sound
    try { const ac = new (window.AudioContext || window.webkitAudioContext)(); for(let i=0;i<3;i++){const b=ac.createBuffer(1,800,ac.sampleRate);const d=b.getChannelData(0);for(let j=0;j<800;j++)d[j]=(Math.random()*2-1)*(1-j/800);const s=ac.createBufferSource();const g=ac.createGain();s.buffer=b;s.connect(g);g.connect(ac.destination);g.gain.setValueAtTime(0.25,ac.currentTime+i*0.2);g.gain.exponentialRampToValueAtTime(0.01,ac.currentTime+i*0.2+0.08);s.start(ac.currentTime+i*0.2);} } catch{}
  } else {
    el.textContent = `❌ Chưa đúng! Đáp án: ${clockState.targetHour}:${clockState.targetMinute.toString().padStart(2, '0')}`;
    el.className = 'challenge-result wrong';
    clockState.wrong++;
  }
  document.getElementById('cp-correct').textContent = clockState.correct;
  document.getElementById('cp-wrong').textContent = clockState.wrong;
});

document.getElementById('btn-new-challenge').addEventListener('click', newChallenge);

// Override openTopic for clock-play
const _originalOpenTopic = openTopic;
function openTopic(topic) {
  if (topic === 'clock-play') { openClockPlay(); return; }
  currentTopic = topic;
  currentSlide = 0;
  slides = LESSONS[topic] || [];
  document.getElementById('lesson-title').textContent = TOPIC_NAMES[topic];
  showScreen('lesson-screen');
  renderSlide();
}

// === PRACTICE ENGINES ===
let practiceScores = { units: 0, mul: 0, carry: 0, shapes: 0, money: 0 };

function makePracticeOptions(correct, wrongs) {
  const all = [correct, ...wrongs].sort(() => Math.random() - 0.5);
  return { options: all, correctIdx: all.indexOf(correct) };
}

function renderPractice(prefix, question, options, correctIdx) {
  document.getElementById(`${prefix}-q`).textContent = question;
  document.getElementById(`${prefix}-result`).textContent = '';
  document.getElementById(`${prefix}-result`).className = 'practice-result';
  const container = document.getElementById(`${prefix}-opts`);
  container.innerHTML = options.map((o, i) =>
    `<button onclick="checkPractice('${prefix}', ${i}, ${correctIdx})">${o}</button>`
  ).join('');
}

function checkPractice(prefix, selected, correct) {
  const btns = document.getElementById(`${prefix}-opts`).querySelectorAll('button');
  btns.forEach((b, i) => {
    b.style.pointerEvents = 'none';
    if (i === correct) b.classList.add('p-correct');
    if (i === selected && i !== correct) b.classList.add('p-wrong');
  });
  const el = document.getElementById(`${prefix}-result`);
  if (selected === correct) {
    el.textContent = '🎉 Đúng rồi!';
    el.className = 'practice-result p-ok';
    practiceScores[prefix]++;
  } else {
    el.textContent = '❌ Chưa đúng!';
    el.className = 'practice-result p-fail';
  }
  document.getElementById(`${prefix}-score`).textContent = practiceScores[prefix];
}

// --- UNITS PRACTICE ---
function newUnitsPractice() {
  const types = [
    () => { const n = Math.floor(Math.random() * 8) + 2; return { q: `${n} m = ? cm`, ans: `${n * 100} cm`, wrongs: [`${n * 10} cm`, `${n * 1000} cm`, `${n + 100} cm`] }; },
    () => { const n = (Math.floor(Math.random() * 5) + 1) * 100; return { q: `${n} cm = ? m`, ans: `${n / 100} m`, wrongs: [`${n / 10} m`, `${n * 10} m`, `${n} m`] }; },
    () => { const n = Math.floor(Math.random() * 5) + 2; return { q: `${n} kg = ? g`, ans: `${n * 1000} g`, wrongs: [`${n * 100} g`, `${n * 10} g`, `${n + 1000} g`] }; },
    () => { const n = Math.floor(Math.random() * 5) + 2; return { q: `${n} lít = ? ml`, ans: `${n * 1000} ml`, wrongs: [`${n * 100} ml`, `${n * 10} ml`, `${n + 1000} ml`] }; },
  ];
  const t = types[Math.floor(Math.random() * types.length)]();
  const { options, correctIdx } = makePracticeOptions(t.ans, t.wrongs);
  renderPractice('units', t.q, options, correctIdx);
}

// --- MULTIPLY PRACTICE ---
function newMulPractice() {
  const a = Math.floor(Math.random() * 4) + 2; // 2-5
  const b = Math.floor(Math.random() * 9) + 2; // 2-10
  const ans = a * b;
  const wrongs = [ans + a, ans - a, ans + b].filter(w => w !== ans && w > 0).slice(0, 3);
  while (wrongs.length < 3) wrongs.push(ans + Math.floor(Math.random() * 5) + 1);
  const { options, correctIdx } = makePracticeOptions(String(ans), wrongs.map(String));
  renderPractice('mul', `${a} × ${b} = ?`, options, correctIdx);
}

// --- CARRY PRACTICE ---
function newCarryPractice() {
  const isAdd = Math.random() > 0.3;
  let q, ans, wrongs;
  if (isAdd) {
    const a = Math.floor(Math.random() * 50) + 20;
    const b = Math.floor(Math.random() * 40) + 15;
    ans = a + b;
    q = `${a} + ${b} = ?`;
    wrongs = [ans + 1, ans - 1, ans + 10];
  } else {
    const a = Math.floor(Math.random() * 40) + 50;
    const b = Math.floor(Math.random() * 30) + 15;
    ans = a - b;
    q = `${a} - ${b} = ?`;
    wrongs = [ans + 1, ans - 1, ans + 10];
  }
  wrongs = wrongs.filter(w => w !== ans && w > 0).slice(0, 3);
  const { options, correctIdx } = makePracticeOptions(String(ans), wrongs.map(String));
  renderPractice('carry', q, options, correctIdx);
}

// --- SHAPES PRACTICE ---
function newShapesPractice() {
  const types = [
    () => { const c = Math.floor(Math.random() * 8) + 3; return { q: `Chu vi hình vuông cạnh ${c} cm = ?`, ans: `${c * 4} cm`, wrongs: [`${c * 3} cm`, `${c * 2} cm`, `${c * 5} cm`] }; },
    () => { const d = Math.floor(Math.random() * 6) + 4; const r = Math.floor(Math.random() * 4) + 2; return { q: `Chu vi HCN dài ${d}cm, rộng ${r}cm = ?`, ans: `${(d + r) * 2} cm`, wrongs: [`${d + r} cm`, `${d * r} cm`, `${(d + r) * 2 + 2} cm`] }; },
    () => { const a = Math.floor(Math.random() * 4) + 3; const b = a + 1; const c = b + 1; return { q: `Chu vi tam giác cạnh ${a}, ${b}, ${c} cm = ?`, ans: `${a + b + c} cm`, wrongs: [`${a + b} cm`, `${a + b + c + 1} cm`, `${a + b + c - 1} cm`] }; },
  ];
  const t = types[Math.floor(Math.random() * types.length)]();
  const { options, correctIdx } = makePracticeOptions(t.ans, t.wrongs);
  renderPractice('shapes', t.q, options, correctIdx);
}

// --- MONEY PRACTICE ---
function newMoneyPractice() {
  const types = [
    () => { const price = (Math.floor(Math.random() * 8) + 2) * 1000; const paid = price + [5000, 10000, 20000][Math.floor(Math.random() * 3)]; const change = paid - price; return { q: `Mua đồ ${price.toLocaleString()}đ, đưa ${paid.toLocaleString()}đ. Tiền thừa?`, ans: `${change.toLocaleString()}đ`, wrongs: [`${(change + 1000).toLocaleString()}đ`, `${(change - 1000).toLocaleString()}đ`, `${(price).toLocaleString()}đ`] }; },
    () => { const n = Math.floor(Math.random() * 4) + 2; const each = [2000, 3000, 5000][Math.floor(Math.random() * 3)]; const total = n * each; return { q: `Mua ${n} cái, mỗi cái ${each.toLocaleString()}đ. Tổng?`, ans: `${total.toLocaleString()}đ`, wrongs: [`${(total + each).toLocaleString()}đ`, `${(total - each).toLocaleString()}đ`, `${(each).toLocaleString()}đ`] }; },
    () => { const a = (Math.floor(Math.random() * 5) + 3) * 1000; const b = (Math.floor(Math.random() * 4) + 2) * 1000; const total = a + b; return { q: `Mua bút ${a.toLocaleString()}đ và vở ${b.toLocaleString()}đ. Tổng?`, ans: `${total.toLocaleString()}đ`, wrongs: [`${(total + 1000).toLocaleString()}đ`, `${(total - 1000).toLocaleString()}đ`, `${a.toLocaleString()}đ`] }; },
  ];
  const t = types[Math.floor(Math.random() * types.length)]();
  const { options, correctIdx } = makePracticeOptions(t.ans, t.wrongs);
  renderPractice('money', t.q, options, correctIdx);
}

// === GRADE 0 (5 tuổi) PRACTICE ENGINES ===
practiceScores.count0 = 0;
practiceScores.compare0 = 0;
practiceScores.size0 = 0;
practiceScores.colors0 = 0;
practiceScores.shapes0 = 0;
practiceScores.animals0 = 0;

// --- COUNT PRACTICE ---
function newCount0Practice() {
  const icons = ['🍎','🍌','🍓','⭐','🎈','🌸','🐥','🐟'];
  const icon = icons[Math.floor(Math.random() * icons.length)];
  const n = Math.floor(Math.random() * 5) + 1;
  const display = Array.from({length: n}, () => icon).join(' ');
  const wrongs = new Set();
  while (wrongs.size < 3) { const w = Math.floor(Math.random() * 6) + 1; if (w !== n) wrongs.add(w); }
  const { options, correctIdx } = makePracticeOptions(String(n), [...wrongs].map(String));
  document.getElementById('count0-q').innerHTML = `Đếm xem có mấy ${icon}?<br><span style="font-size:1.6rem">${display}</span>`;
  document.getElementById('count0-result').textContent = '';
  document.getElementById('count0-result').className = 'practice-result';
  const container = document.getElementById('count0-opts');
  container.innerHTML = options.map((o, i) =>
    `<button onclick="checkPractice('count0', ${i}, ${correctIdx})">${o}</button>`
  ).join('');
}

// --- COMPARE PRACTICE ---
function newCompare0Practice() {
  const icons = ['🍎','🍌','🍓','⭐','🎈','🌸','🐥','🐟','🐶','🐱'];
  const i1 = icons[Math.floor(Math.random() * icons.length)];
  let i2 = icons[Math.floor(Math.random() * icons.length)]; while (i2 === i1) i2 = icons[Math.floor(Math.random() * icons.length)];
  let a = Math.floor(Math.random() * 5) + 1, b = Math.floor(Math.random() * 5) + 1; while (b === a) b = Math.floor(Math.random() * 5) + 1;
  const isMore = Math.random() > 0.5;
  const q = isMore ? 'Hàng nào NHIỀU hơn?' : 'Hàng nào ÍT hơn?';
  const correct = isMore ? (a > b ? i1 : i2) : (a < b ? i1 : i2);
  const display = `${i1}: ${Array.from({length:a},()=>i1).join(' ')}\n${i2}: ${Array.from({length:b},()=>i2).join(' ')}`;
  const wrongs = icons.filter(x => x !== correct).slice(0, 3);
  const { options, correctIdx } = makePracticeOptions(correct, wrongs);
  document.getElementById('compare0-q').innerHTML = `${q}<br><span style="font-size:1.3rem">${display.replace('\n','<br>')}</span>`;
  document.getElementById('compare0-result').textContent = '';
  document.getElementById('compare0-result').className = 'practice-result';
  const container = document.getElementById('compare0-opts');
  container.innerHTML = options.map((o, i) =>
    `<button onclick="checkPractice('compare0', ${i}, ${correctIdx})" style="font-size:1.5rem">${o}</button>`
  ).join('');
}

// --- SIZE PRACTICE ---
function newSize0Practice() {
  const pairs = [
    { big: '🐘', small: '🐭', label: 'Voi và chuột' },
    { big: '🐳', small: '🐟', label: 'Cá voi và cá' },
    { big: '🌳', small: '🌱', label: 'Cây và mầm' },
    { big: '🚌', small: '🚲', label: 'Xe buýt và xe đạp' },
    { big: '🍉', small: '🍒', label: 'Dưa hấu và anh đào' },
    { big: '🦁', small: '🐈', label: 'Sư tử và mèo' },
    { big: '🏠', small: '🏕️', label: 'Nhà và lều' },
  ];
  const p = pairs[Math.floor(Math.random() * pairs.length)];
  const isBig = Math.random() > 0.5;
  const q = isBig ? `Cái nào TO hơn? ${p.big} và ${p.small}` : `Cái nào NHỎ hơn? ${p.big} và ${p.small}`;
  const correct = isBig ? p.big : p.small;
  const wrong = isBig ? p.small : p.big;
  const others = ['⚽','🎈','🐝'];
  const { options, correctIdx } = makePracticeOptions(correct, [wrong, others[0], others[1]]);
  document.getElementById('size0-q').innerHTML = q;
  document.getElementById('size0-result').textContent = '';
  document.getElementById('size0-result').className = 'practice-result';
  const container = document.getElementById('size0-opts');
  container.innerHTML = options.map((o, i) =>
    `<button onclick="checkPractice('size0', ${i}, ${correctIdx})" style="font-size:1.5rem">${o}</button>`
  ).join('');
}

// --- COLORS PRACTICE ---
function newColors0Practice() {
  const colors = [
    { name: 'ĐỎ', icon: '🔴', items: ['🍎','🍓','🌹','❤️'] },
    { name: 'VÀNG', icon: '🟡', items: ['🍌','🌟','🌼'] },
    { name: 'XANH LÁ', icon: '🟢', items: ['🍀','🥦','🐸'] },
    { name: 'XANH DƯƠNG', icon: '🔵', items: ['💧','🐬','🌊'] },
    { name: 'CAM', icon: '🟠', items: ['🍊','🥕','🦊'] },
    { name: 'TÍM', icon: '🟣', items: ['🍇','🍆','🔮'] },
  ];
  const c = colors[Math.floor(Math.random() * colors.length)];
  const others = colors.filter(x => x !== c);
  const wrongs = others.sort(() => Math.random() - 0.5).slice(0, 3).map(x => x.icon);
  const { options, correctIdx } = makePracticeOptions(c.icon, wrongs);
  const example = c.items[Math.floor(Math.random() * c.items.length)];
  document.getElementById('colors0-q').innerHTML = `Chấm nào màu <strong>${c.name}</strong>?<br><span style="font-size:1.3rem">(Gợi ý: giống ${example})</span>`;
  document.getElementById('colors0-result').textContent = '';
  document.getElementById('colors0-result').className = 'practice-result';
  const container = document.getElementById('colors0-opts');
  container.innerHTML = options.map((o, i) =>
    `<button onclick="checkPractice('colors0', ${i}, ${correctIdx})" style="font-size:2rem">${o}</button>`
  ).join('');
}

// --- SHAPES0 PRACTICE ---
function newShapes0Practice() {
  const shapes = [
    { name: 'HÌNH TRÒN', icon: '⭕' },
    { name: 'HÌNH VUÔNG', icon: '🟦' },
    { name: 'HÌNH TAM GIÁC', icon: '🔺' },
    { name: 'NGÔI SAO', icon: '⭐' },
    { name: 'TRÁI TIM', icon: '❤️' },
  ];
  const s = shapes[Math.floor(Math.random() * shapes.length)];
  const wrongs = shapes.filter(x => x !== s).sort(() => Math.random() - 0.5).slice(0, 3).map(x => x.icon);
  const { options, correctIdx } = makePracticeOptions(s.icon, wrongs);
  document.getElementById('shapes0-q').innerHTML = `Đâu là <strong>${s.name}</strong>?`;
  document.getElementById('shapes0-result').textContent = '';
  document.getElementById('shapes0-result').className = 'practice-result';
  const container = document.getElementById('shapes0-opts');
  container.innerHTML = options.map((o, i) =>
    `<button onclick="checkPractice('shapes0', ${i}, ${correctIdx})" style="font-size:2rem">${o}</button>`
  ).join('');
}

// --- ANIMALS PRACTICE ---
function newAnimals0Practice() {
  const animals = [
    { q: 'Con gì kêu "Gâu gâu"?', a: '🐶' },
    { q: 'Con gì kêu "Meo meo"?', a: '🐱' },
    { q: 'Con gì kêu "Ò ó o"?', a: '🐓' },
    { q: 'Con gì kêu "Ụt ịt"?', a: '🐷' },
    { q: 'Con gì kêu "Cạp cạp"?', a: '🦆' },
    { q: 'Con gì kêu "Bò ò"?', a: '🐮' },
    { q: 'Con gì kêu "Be be"?', a: '🐑' },
    { q: 'Con nào sống dưới nước?', a: '🐟' },
    { q: 'Con nào bay được?', a: '🐦' },
    { q: 'Con nào có 4 chân, trung thành?', a: '🐶' },
    { q: 'Con nào bắt chuột giỏi?', a: '🐱' },
    { q: 'Con nào có mai cứng, đi chậm?', a: '🐢' },
  ];
  const a = animals[Math.floor(Math.random() * animals.length)];
  const allIcons = ['🐶','🐱','🐓','🐷','🦆','🐮','🐑','🐟','🐦','🐢','🐸','🐰'];
  const wrongs = allIcons.filter(x => x !== a.a).sort(() => Math.random() - 0.5).slice(0, 3);
  const { options, correctIdx } = makePracticeOptions(a.a, wrongs);
  document.getElementById('animals0-q').innerHTML = a.q;
  document.getElementById('animals0-result').textContent = '';
  document.getElementById('animals0-result').className = 'practice-result';
  const container = document.getElementById('animals0-opts');
  container.innerHTML = options.map((o, i) =>
    `<button onclick="checkPractice('animals0', ${i}, ${correctIdx})" style="font-size:2rem">${o}</button>`
  ).join('');
}

// === AI TUTOR CHATBOT ===
let aiEnabled = false;
const chatHistory = []; // Session-scoped: [{role, content}]
let chatMessagesRemaining = 20;
const CHAT_DAILY_LIMIT = 20;

/**
 * Check AI status and show/hide AI features.
 */
async function checkAIStatus() {
  try {
    const res = await fetch('/api/ai/status');
    const data = await res.json();
    aiEnabled = data.enabled;
  } catch {
    aiEnabled = false;
  }
  document.querySelectorAll('.ai-feature').forEach(el => {
    el.style.display = aiEnabled ? '' : 'none';
  });
}

// Check AI status on page load
checkAIStatus();

/**
 * Toggle the chat panel visibility.
 */
function toggleChatPanel() {
  const panel = document.getElementById('ai-chat-panel');
  panel.classList.toggle('hidden');
  if (!panel.classList.contains('hidden')) {
    document.getElementById('ai-chat-input').focus();
  }
}

/**
 * Get the player_id from localStorage.
 */
function getPlayerId() {
  try {
    const profile = JSON.parse(localStorage.getItem('hocvui_profile'));
    return profile && profile.id ? profile.id : null;
  } catch { return null; }
}

/**
 * Get the player's grade from localStorage.
 */
function getPlayerGrade() {
  try {
    const profile = JSON.parse(localStorage.getItem('hocvui_profile'));
    return profile && profile.grade ? profile.grade : 2;
  } catch { return 2; }
}

/**
 * Get the current lesson context (topic name being viewed).
 */
function getLessonContext() {
  if (currentTopic && TOPIC_NAMES[currentTopic]) {
    return TOPIC_NAMES[currentTopic];
  }
  return 'Góc Học Tập - Toán';
}

/**
 * Add a message bubble to the chat UI.
 */
function addChatBubble(text, type) {
  const container = document.getElementById('ai-chat-messages');
  const bubble = document.createElement('div');
  bubble.className = `ai-msg ${type}`;
  bubble.textContent = text;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
  return bubble;
}

/**
 * Update the remaining messages display.
 */
function updateRemainingDisplay() {
  const el = document.getElementById('ai-chat-remaining');
  if (chatMessagesRemaining <= 5) {
    el.textContent = `Còn ${chatMessagesRemaining} lượt`;
    el.style.background = 'rgba(255,100,100,0.3)';
  } else {
    el.textContent = `Còn ${chatMessagesRemaining} lượt`;
    el.style.background = 'rgba(255,255,255,0.2)';
  }
}

/**
 * Disable the chat input when limit is reached.
 */
function disableChatInput() {
  const input = document.getElementById('ai-chat-input');
  const sendBtn = document.getElementById('ai-chat-send');
  input.disabled = true;
  input.placeholder = 'Hết lượt hỏi hôm nay rồi!';
  sendBtn.disabled = true;
  addChatBubble('Hết lượt hỏi hôm nay rồi! Mai hỏi tiếp nhé! 🌟', 'system');
}

/**
 * Send a message to the AI tutor.
 */
async function sendChatMessage() {
  const input = document.getElementById('ai-chat-input');
  const message = input.value.trim();
  if (!message) return;

  // Check client-side limit
  if (chatMessagesRemaining <= 0) {
    disableChatInput();
    return;
  }

  const playerId = getPlayerId();
  if (!playerId) {
    addChatBubble('Con cần đăng nhập trước nhé! 🙂', 'system');
    return;
  }

  // Show user message
  addChatBubble(message, 'user');
  input.value = '';
  input.disabled = true;
  document.getElementById('ai-chat-send').disabled = true;

  // Add to session history
  chatHistory.push({ role: 'user', content: message });

  // Show typing indicator
  const typingBubble = addChatBubble('Thầy đang nghĩ... 🤔', 'typing');

  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: playerId,
        messages: chatHistory,
        lesson_context: getLessonContext(),
        grade: getPlayerGrade()
      })
    });

    // Remove typing indicator
    typingBubble.remove();

    if (res.status === 429) {
      chatMessagesRemaining = 0;
      updateRemainingDisplay();
      disableChatInput();
      return;
    }

    if (!res.ok) {
      addChatBubble('Ối, thầy bị lỗi rồi. Thử lại sau nhé! 😅', 'bot');
      // Remove the user message from history since it failed
      chatHistory.pop();
      input.disabled = false;
      document.getElementById('ai-chat-send').disabled = false;
      input.focus();
      return;
    }

    const data = await res.json();
    const reply = data.reply || 'Thầy không hiểu câu hỏi. Hỏi lại nhé! 🤔';

    // Add bot reply to history and UI
    chatHistory.push({ role: 'assistant', content: reply });
    addChatBubble(reply, 'bot');

    // Update remaining count from server
    if (typeof data.messages_remaining === 'number') {
      chatMessagesRemaining = data.messages_remaining;
    } else {
      chatMessagesRemaining--;
    }
    updateRemainingDisplay();

    // Check if limit reached
    if (chatMessagesRemaining <= 0) {
      disableChatInput();
      return;
    }

  } catch (err) {
    typingBubble.remove();
    addChatBubble('Ối, không kết nối được. Thử lại sau nhé! 😅', 'bot');
    chatHistory.pop();
  }

  // Re-enable input
  input.disabled = false;
  document.getElementById('ai-chat-send').disabled = false;
  input.focus();
}
