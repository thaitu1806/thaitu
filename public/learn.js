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
  clock: '🕐 Đồng Hồ',
  units: '📏 Đo Lường',
  multiply: '✖️ Bảng Nhân',
  carry: '➕ Cộng Có Nhớ',
  shapes: '🔷 Hình Học',
  money: '💰 Tiền Việt Nam',
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

}; // end LESSONS

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
