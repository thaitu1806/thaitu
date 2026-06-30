// === HELP / RULES POPUP ===
// Auto-injects a "❓" button and shows game rules based on current game version.
// Include via <script src="/help-rules.js"></script> in any game page.
(function() {
  'use strict';

  const RULES = {
    '/v2/':  { title: '🗺️ Phiêu Lưu', rules: '• 50 level theo bản đồ\n• Mỗi level: 1-3 ngôi sao theo độ chính xác\n• Đúng tất cả = 3 ⭐, mở level mới\n• Tích sao đổi mở khoá game khác' },
    '/v3/':  { title: '👫 Đấu 2 Bạn', rules: '• Hai bạn dùng chung 1 màn hình\n• Mỗi câu: ai nhấn nhanh và đúng trước thắng\n• Tích điểm sau N câu để xác định người thắng' },
    '/v4/':  { title: '📱 Đấu Online', rules: '• 2 bạn ở 2 thiết bị khác nhau\n• Tạo phòng / nhập mã phòng\n• Đua câu hỏi cùng đề trong thời gian thực\n• Ai đúng nhiều hơn thắng' },
    '/v5/':  { title: '🎲 Cờ Cá Ngựa', rules: '• Lắc xúc xắc để di chuyển\n• Trả lời đúng = tiến đủ số ô, sai = đứng yên\n• Đá ngựa đối thủ về chuồng\n• Đưa hết ngựa về đích để thắng' },
    '/v6/':  { title: '🏎️ Đua Xe Trí Tuệ', rules: '• Đua với 3 xe AI\n• Đúng = xe bạn tiến\n• Sai = xe đứng yên, đối thủ vượt\n• Về đích đầu tiên = thắng' },
    '/v7/':  { title: '🧗 Leo Núi Trí Tuệ', rules: '• 2 người leo núi cùng lúc\n• Mỗi câu đúng = leo 1 nấc\n• Ai chạm đỉnh trước thắng' },
    '/v8/':  { title: '🏰 Xây Lâu Đài', rules: '• Đúng = đặt 1 khối lâu đài\n• Sai = không đặt được\n• Xây cao nhất trong N câu để thắng' },
    '/v9/':  { title: '♟️ Đấu Tướng', rules: '• Cờ vua mini kết hợp quiz\n• Trả lời đúng = được di chuyển quân\n• Bắt được tướng đối thủ = thắng' },
    '/v10/': { title: '💣 Dò Mìn Trí Tuệ', rules: '• Mở ô bằng cách trả lời đúng câu hỏi\n• Sai = ô đó dính mìn ảo\n• Tránh mìn, mở hết ô an toàn = thắng' },
    '/v11/': { title: '💰 Tỉ Phú Trí Tuệ', rules: '• Đi quanh bàn cờ tỉnh thành Việt Nam\n• Đúng = mua tỉnh / xây nhà\n• Đối thủ dừng ở ô của bạn = trả thuê\n• Phá sản đối thủ = thắng' },
    '/v12/': { title: '🧩 Lật Hình Trí Tuệ', rules: '• Ghép câu hỏi với đáp án đúng\n• Lật 2 thẻ mỗi lượt\n• Ghép đúng = thẻ biến mất\n• Ghép hết tất cả để thắng!' },
    '/v13/': { title: '🌊 Thám Hiểm Đại Dương', rules: '• Trả lời đúng = lặn sâu 50m\n• Trả lời sai = bị đẩy lên 30m\n• Oxy giảm dần (3 phút)\n• Thu thập sinh vật biển\n• Nhấn "Nổi lên" để giữ ngọc trai an toàn' },
    '/v14/': { title: '🚀 Giải Cứu Hành Tinh', rules: '• 5 vùng đất, mỗi vùng 5 câu + 1 boss\n• Boss có thanh máu (3-5 HP)\n• Đúng = -1HP boss, Sai = boss hồi +1HP\n• Trả lời nhanh (<5s) = Critical -2HP\n• Combo 3 câu đúng = nhận Shield 🛡️' },
    '/v15/': { title: '🦁 Vườn Thú Kỳ Diệu', rules: '• Chơi quiz kiếm xu\n• Mua thú cưng từ cửa hàng\n• 4 cấp: Thường → Hiếm → Siêu hiếm → Huyền thoại\n• Combo 5+ = mở khóa thú hiếm miễn phí\n• Đăng nhập mỗi ngày nhận xu bonus' },
    '/v16/': { title: '👨‍🍳 Đầu Bếp Nhí', rules: '• Khách yêu cầu món ăn\n• Mỗi món = 3 bước nấu (3 câu hỏi)\n• Đúng = hoàn thành bước, Sai = cháy 🔥\n• 2 lần cháy = mất khách\n• Phục vụ nhanh + không cháy = tip x2' },
    '/v17/': { title: '🚀 Phi Hành Gia Nhí', rules: '• Bay qua 8 hành tinh\n• Mỗi hành tinh: 5 câu hỏi\n• Sai = mất 15% nhiên liệu\n• Sai 3 câu/hành tinh = va chạm!\n• Perfect (0 sai) = thu mẫu vật' },
    '/v18/': { title: '⚔️ Ninja Toán Học', rules: '• Câu hỏi bay xuống dạng cuộn giấy\n• Chọn đúng = chém thành công\n• Sai/hết giờ = mất 1 mạng (3 ❤️)\n• Mỗi 5 sóng = Boss (cần 3 đúng liên tiếp)\n• Combo tăng điểm, lên đai theo tổng sóng' },
    '/v19/': { title: '🔍 Thám Tử Nhí', rules: '• Chọn vụ án để điều tra\n• Trả lời đúng = mở 1 manh mối\n• Thu thập 5 manh mối\n• Chọn thủ phạm từ 4 nghi phạm\n• Phá án = mở vụ tiếp theo' },
    '/v20/': { title: '🌾 Nông Trại Vui Vẻ', rules: '• Trồng cây trên 6-9 ô đất\n• Cây lớn theo thời gian thật\n• Chơi quiz "Tưới nước" = tăng tốc 1 giai đoạn\n• Thu hoạch bán lấy xu\n• Đăng nhập mỗi ngày nhận xu bonus' },
    '/v21/': { title: '🚒 Siêu Nhân Cứu Hỏa', rules: '• Tòa nhà 5 tầng đang cháy!\n• Đúng = dập 1 đám lửa\n• Sai = lửa lan thêm 1\n• Dập hết 1 tầng = cứu 1 người\n• 20 đám lửa = tòa nhà sụp đổ!' },
    '/v22/': { title: '🏎️ Đua Xe Tri Thức', rules: '• Đua với 3 xe bot (500m)\n• Đúng = tiến 50m, Sai = 10m\n• Combo 3+ = Boost 80m!\n• Bot trả lời ngẫu nhiên 60-70%\n• Về nhất = chiến thắng!' },
    '/v23/': { title: '🏥 Bệnh Viện Thú Cưng', rules: '• 8 bệnh nhân thú cưng/ca\n• Mỗi con: 4 bước chữa (4 câu)\n• Đúng = tiến 1 bước chữa\n• Sai = mất 1 cơ hội (tối đa 2)\n• Hết cơ hội = thú buồn bỏ đi' },
    '/v24/': { title: '🏙️ Xây Thành Phố', rules: '• Chơi quiz kiếm vật liệu (gạch/gỗ/kính)\n• Dùng vật liệu xây công trình\n• 6 loại: Nhà, Trường, Bệnh viện, Công viên...\n• Mỗi công trình tăng dân số\n• Xây 4x4 thành phố!' },
    '/v25/': { title: '🎈 Pháo Đài Bóng Bay', rules: '• Bóng bay tấn công pháo đài!\n• Đúng = bắn hạ 1 bóng gần nhất\n• Sai = bóng bay thoát\n• 10 bóng lọt = Game Over\n• Combo 3+ = bắn 2 bóng cùng lúc\n• Mỗi 5 sóng: bóng bọc thép (2 hit)' },
    '/v26/': { title: '🎡 Vòng Quay May Mắn', rules: '• Chơi quiz: 3 câu đúng = 1 lượt quay\n• 8 phần thưởng: xu, sao, kim cương, x2, free spin\n• Quay vòng quay nhận thưởng ngẫu nhiên\n• x2 = nhân đôi phần thưởng lần sau' },
    '/v27/': { title: '🧙 Lớp Học Phép Thuật', rules: '• Trả lời đúng = nhận mảnh ghép phép thuật\n• 3 mảnh = học 1 thần chú mới\n• 20 thần chú (Lửa/Nước/Đất/Gió)\n• Dùng thần chú đấu Boss\n• Chọn đúng hệ yếu điểm để gây damage' },
    '/v28/': { title: '📖 Truyện Cổ Tích', rules: '• Chọn 1 trong 5 truyện Việt Nam\n• Mỗi truyện 6 trang\n• Trả lời đúng = mở trang mới\n• Đọc hết truyện = nhận huy hiệu\n• Trang 1 luôn mở sẵn' },
    '/v29/': { title: '🏝️ Đảo Hoang Sinh Tồn', rules: '• Chơi quiz kiếm tài nguyên (gỗ/đá/dây)\n• Dùng tài nguyên chế tạo đồ\n• 5 vật phẩm: Lửa → Lều → Cần câu → Lọc nước → Bè\n• Chế tạo Bè = thoát đảo thành công!' },
    '/v30/': { title: '🎪 Giải Đố Vui', rules: '• 10 vòng, mỗi vòng quay bánh xe chọn thể loại\n• Bình thường (10s), Đúng/Sai (8s), Tốc Độ (5s)\n• Vàng = 3x điểm, Ngược = chọn đáp án SAI\n• Tích điểm, phá kỷ lục!' },
    '/v31/': { title: '📮 Bưu Điện Vui', rules: '• Giao thư đến đúng địa chỉ\n• Đúng = thư được giao\n• Sai = thư trả lại bưu cục\n• Giao đủ số thư trước hết giờ!' },
    '/v32/': { title: '🔬 Nhà Khoa Học Nhí', rules: '• Trả lời đúng = pha thuốc\n• 3 thuốc cùng loại = tạo sinh vật mới\n• Sai = ống nghiệm vỡ, reset\n• Sưu tập đủ bộ sinh vật để thắng!' },
    '/v33/': { title: '🚁 Đội Cứu Hộ', rules: '• Đúng = bay đến cứu động vật\n• Mỗi sai = mất nhiên liệu\n• Hết nhiên liệu = về căn cứ\n• Cứu đủ động vật mắc kẹt!' },
    '/v34/': { title: '🎵 Nhạc Sĩ Nhí', rules: '• Đúng = nhận 1 nốt nhạc\n• Ghép nốt thành bài hát\n• Combo = hợp âm hay\n• Hoàn thành đủ bài để thắng!' },
    '/v35/': { title: '🍦 Tiệm Kem', rules: '• Khách đặt ly kem nhiều tầng\n• Đúng = xếp 1 tầng kem\n• Sai = kem đổ\n• Phục vụ nhanh, nhận tip cao!' },
    '/v36/': { title: '🤿 Thợ Lặn Kho Báu', rules: '• Lật ô để tìm kho báu dưới đáy biển\n• Đúng = lật được 1 ô\n• Sai = mất 1 hơi (oxy)\n• Hết oxy = về tàu' },
    '/v37/': { title: '🏃 Vận Động Viên', rules: '• Tham gia Olympic mini\n• Mỗi môn 1 thử thách quiz\n• Đúng nhiều = huy chương vàng 🥇\n• Hoàn thành nhiều môn để vô địch!' },
    '/v38/': { title: '🦷 Bác Sĩ Răng', rules: '• Khám và chữa răng cho bệnh nhân\n• Đúng = trị 1 chiếc răng sâu\n• Sai = bệnh nhân khóc\n• Thu thật nhiều nụ cười 😁!' },
    '/v39/': { title: '👗 Thời Trang Show', rules: '• Đúng = mở khóa 1 trang phục\n• Ghép thành outfit hoàn chỉnh\n• Trình diễn trên sàn catwalk\n• Combo = ý tưởng sáng tạo' },
    '/v40/': { title: '🛒 Siêu Thị Mini', rules: '• Tính tiền cho khách\n• Đúng = giao dịch thành công\n• Sai = khách bỏ đi\n• Tích tiền nâng cấp shop!' },
    '/v41/': { title: '🍄 Phiêu Lưu Mario', rules: '• Đúng = Mario nhảy qua chướng ngại\n• Sai = mất 1 mạng (3 ❤️)\n• Combo 3+ = nhảy đôi, vượt 2 cấp\n• Đi hết 10 màn để cứu công chúa!' },
    '/v42/': { title: '🎈 Khinh Khí Cầu', rules: '• Đúng = khinh khí cầu bay cao hơn\n• Sai = mất khí, hạ thấp\n• Combo = bay siêu tốc\n• Bay tới đỉnh vũ trụ để thắng!' },
    '/v43/': { title: '🍕 Pizzeria Của Bé', rules: '• Khách gọi pizza nhiều topping\n• Đúng = thêm 1 topping đúng\n• Sai = sai topping, khách buồn\n• Phục vụ nhanh + đúng = tip cao!' },
    '/v44/': { title: '🦈 Vũ Trụ Cá Mập', rules: '• Đua tàu không gian qua các vùng\n• Đúng = bay nhanh hơn\n• Sai = bị cá mập đuổi\n• Mỗi vùng có boss cá mập!' },
    '/v45/': { title: '🤖 Lập Trình Robot', rules: '• Đúng = mở khóa 1 lệnh lập trình\n• Ghép lệnh thành chương trình\n• Chạy chương trình đưa robot về đích\n• Combo = lệnh nâng cao' },
    '/v46/': { title: '🌵 Tiệm Cây Cảnh', rules: '• Tưới 6 chậu cây\n• Đúng = cây lớn 1 cấp (🌱→🌿→🌳→🎋)\n• Cây trưởng thành = bonsai sưu tập\n• Trồng đủ vườn để thắng!' },
    '/v47/': { title: '🧪 Lab Slime', rules: '• Trả lời đúng = thêm 1 giọt vào bình\n• 3 giọt cùng màu = tạo slime\n• Sai = bình tràn, reset\n• Combo 5+ = slime hiếm ✨' },
    '/v48/': { title: '🦖 Cứu Hộ Khủng Long', rules: '• Đúng = cứu 1 khủng long khỏi núi lửa\n• Combo 3+ = cứu thêm 1 con bonus\n• Sai = núi lửa nguy hiểm hơn\n• 5 nguy hiểm = núi lửa phun trào!' },
    '/v49/': { title: '🎧 DJ Nhí', rules: '• Đúng = thêm 1 nhịp vào track\n• 4 nhịp = hoàn thành 1 track\n• Combo 3+ = nhịp đôi, track perfect\n• Mix 5 track để lên đỉnh sàn!' },
    '/v50/': { title: '⚓ Tàu Ngầm Đại Dương', rules: '• Đúng = lặn sâu 1 tầng\n• Sai = mất 1 oxy (tối đa 6)\n• Combo 3+ = nhận báu vật 💎\n• Lặn đến đáy đại dương (tầng 10)!' },
    '/v51/': { title: '🐢 Vườn Thú Pokémon Việt', rules: '• Đúng = ném bóng bắt thú hoang\n• Combo cao = tỉ lệ bắt tăng\n• Sai = mất combo\n• Bắt đủ 8 loài thú trong rừng!' },
    '/v52/': { title: '🏮 Lễ Hội Trung Thu', rules: '• Đúng = thắp 1 đèn lồng\n• Combo 4 = bắn pháo bông 🎆\n• Thắp đủ 7+ đèn trước trăng rằm = thắng\n• Thắp đủ 12 = hoàn hảo!' },
    '/v53/': { title: '🐱 Đặc Vụ Mèo', rules: '• Đúng = lẻn qua 1 tầng\n• Sai = báo động kêu 🚨 (3 = bị bắt)\n• Combo 4 = lấy được tài liệu mật 📁\n• Lẻn lên tầng 10 để thắng!' },
    '/v54/': { title: '🧙 Phù Thủy Thuốc', rules: '• Đúng = thêm nguyên liệu vào vạc\n• 3 nguyên liệu = 1 chai thuốc 🧪\n• Combo 5+ = thuốc huyền thoại ⚗️\n• Pha đủ 5 chai để thành phù thủy!' },
    '/v55/': { title: '⚽ Sân Bóng Trí Tuệ', rules: '• Đúng = sút bóng vào lưới\n• Combo cao = tỉ lệ sút trúng tăng (95%)\n• Sai = đối thủ có cơ hội sút\n• Ghi 5 bàn để thắng, 3 thủng lưới = thua' },
    '/v56/': { title: '⛄ Người Tuyết Cứu Bắc Cực', rules: '• Đúng = thêm 1 viên tuyết\n• 3 viên = 1 người tuyết ⛄\n• Sai = nắng làm tan 1 viên\n• Xây đủ 8 người tuyết để cứu Bắc Cực!' },
    '/v57/': { title: '👘 Tiệm May Áo Dài', rules: '• Đúng = khâu 1 mảnh vải\n• 4 mảnh = 1 áo dài hoàn chỉnh\n• Combo 5+ = áo dài vàng ✨\n• May đủ 5 áo để mở tiệm thành công!' },
    '/v58/': { title: '🌾 Hành Trình Lúa Gạo', rules: '• 4 giai đoạn: Gieo → Nảy → Bông → Thu\n• Đúng = tiến 1 giai đoạn\n• Sai = sâu hại, lùi 1 giai đoạn\n• Combo 4+ = vụ bội thu (2x lúa)\n• Thu hoạch 5 vụ mùa để thắng!' },
    '/v59/': { title: '🚴 Đua Xe Đạp', rules: '• Đúng = đạp 6m, combo cao = 12m\n• Sai = mất 1 sức (5 ❤️)\n• Hết sức = chỉ đi bộ 2m\n• Cán đích 100m để thắng!' },
    '/v60/': { title: '📜 Cổ Tích Việt Nam', rules: '• 4 chương cho mỗi truyện cổ tích\n• Đúng = lật trang mới\n• Sai = lùi 1 trang\n• Combo 4+ = học được bài học ✨\n• Đọc xong 3 truyện để thắng!' },
  };

  // Find matching rules for current path
  function getGameRules() {
    const path = window.location.pathname;
    for (const [key, val] of Object.entries(RULES)) {
      if (path.startsWith(key) || path === key) return val;
    }
    return null;
  }

  function createHelpButton() {
    const rules = getGameRules();

    // Always inject a 🏠 home button (with confirmation) on game pages,
    // even when the page has no rules entry.
    injectHomeButton();

    if (!rules) return; // No rules for this page

    // Create floating help button
    const btn = document.createElement('button');
    btn.className = 'help-rules-btn';
    btn.textContent = '❓';
    btn.title = 'Luật chơi';
    btn.style.cssText = 'position:fixed;top:12px;right:12px;z-index:9000;width:38px;height:38px;border-radius:50%;border:none;background:rgba(0,0,0,0.2);color:#fff;font-size:1.2rem;cursor:pointer;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);transition:transform 0.2s;';
    btn.addEventListener('click', () => showRulesPopup(rules));
    document.body.appendChild(btn);

    // Hide inline guide buttons since the floating ❓ already covers this
    document.querySelectorAll('.btn-guide, #btn-guide').forEach(el => { el.style.display = 'none'; });
  }

  function injectHomeButton() {
    // Only inject on /vN/ game pages (path starts with /vNN/)
    const path = window.location.pathname;
    if (!/^\/v\d+\/?/.test(path)) return;

    // Mark the page so the shared header CSS (HUD spacing + redundant home-link
    // hiding) applies. Only game versions get this treatment.
    document.body.classList.add('hv-game');

    // This shared floating 🚪 is the canonical "go home" button, present on every
    // screen (start + in-game). Hide any game-specific HUD exit button so we don't
    // get two stacked 🚪 in the top-left corner (e.g. v6–v10, v49–v57 have their own).
    document.querySelectorAll('#btn-exit, .btn-exit').forEach(el => { el.style.display = 'none'; });

    const btn = document.createElement('button');
    btn.className = 'help-home-btn';
    btn.textContent = '🚪';
    btn.title = 'Thoát game';
    btn.style.cssText = 'position:fixed;top:12px;left:12px;z-index:9000;width:38px;height:38px;border-radius:50%;border:none;background:rgba(0,0,0,0.2);color:#fff;font-size:1.2rem;cursor:pointer;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);transition:transform 0.2s;';
    btn.addEventListener('click', confirmExitToHome);
    document.body.appendChild(btn);
  }

  // Decide where the shared 🚪 should go: while a game round is in progress
  // ("game-screen"/"play-screen" is the active screen) → reload to restart;
  // at the menu/start/result screen → go back to the home page.
  function isInGameplay() {
    const active = document.querySelector('.screen.active, .screen.show');
    if (!active) return false;
    return /game|play/i.test(active.id || '');
  }

  function confirmExitToHome() {
    const existing = document.getElementById('help-exit-popup');
    if (existing) { existing.remove(); return; }

    const inGame = isInGameplay();
    const overlay = document.createElement('div');
    overlay.id = 'help-exit-popup';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px);animation:fadeIn 0.2s;';

    const card = document.createElement('div');
    card.style.cssText = 'background:#fff;border-radius:20px;padding:24px 20px;max-width:320px;width:90%;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,0.3);animation:popIn 0.3s;';

    const icon = document.createElement('div');
    icon.textContent = '🚪';
    icon.style.cssText = 'font-size:2.5rem;margin-bottom:8px;';

    const text = document.createElement('p');
    text.textContent = inGame ? 'Chơi lại từ đầu?' : 'Về trang chủ?';
    text.style.cssText = 'font-size:1.05rem;font-weight:800;color:#333;margin-bottom:6px;';

    const sub = document.createElement('p');
    sub.textContent = inGame ? 'Chơi lại ván này từ đầu.' : 'Quay về trang chủ Học Vui.';
    sub.style.cssText = 'font-size:0.85rem;color:#777;margin-bottom:18px;';

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:10px;justify-content:center;';

    const cancel = document.createElement('button');
    cancel.textContent = 'Tiếp tục chơi';
    cancel.style.cssText = 'padding:10px 18px;background:#eee;color:#333;border:none;border-radius:12px;font-weight:700;font-size:0.95rem;cursor:pointer;font-family:inherit;';
    cancel.addEventListener('click', () => overlay.remove());

    const confirm = document.createElement('button');
    confirm.textContent = inGame ? '🔄 Chơi lại' : '🚪 Thoát';
    confirm.style.cssText = 'padding:10px 18px;background:#f44336;color:#fff;border:none;border-radius:12px;font-weight:700;font-size:0.95rem;cursor:pointer;font-family:inherit;';
    confirm.addEventListener('click', () => { if (inGame) window.location.reload(); else window.location.href = '/'; });

    btnRow.appendChild(cancel);
    btnRow.appendChild(confirm);
    card.appendChild(icon);
    card.appendChild(text);
    card.appendChild(sub);
    card.appendChild(btnRow);
    overlay.appendChild(card);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  }

  function showRulesPopup(rules) {
    // Remove existing
    const existing = document.getElementById('help-rules-popup');
    if (existing) { existing.remove(); return; }

    const overlay = document.createElement('div');
    overlay.id = 'help-rules-popup';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px);animation:fadeIn 0.2s;';

    const card = document.createElement('div');
    card.style.cssText = 'background:#fff;border-radius:20px;padding:24px 20px;max-width:340px;width:90%;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,0.3);animation:popIn 0.3s;';

    const title = document.createElement('h3');
    title.textContent = rules.title;
    title.style.cssText = 'font-size:1.1rem;margin-bottom:14px;color:#333;';

    const body = document.createElement('p');
    body.textContent = rules.rules;
    body.style.cssText = 'text-align:left;line-height:2;font-size:0.9rem;white-space:pre-line;color:#555;margin-bottom:18px;';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Hiểu rồi!';
    closeBtn.style.cssText = 'padding:12px 28px;background:#4CAF50;color:#fff;border:none;border-radius:12px;font-weight:700;font-size:1rem;cursor:pointer;font-family:inherit;';
    closeBtn.addEventListener('click', () => overlay.remove());

    card.appendChild(title);
    card.appendChild(body);
    card.appendChild(closeBtn);
    overlay.appendChild(card);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  }

  // Inject styles for animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    @keyframes popIn { from{transform:scale(0.8);opacity:0} to{transform:scale(1);opacity:1} }
    .help-rules-btn:active, .help-home-btn:active { transform: scale(0.9); }
    /* Shared header fix for every game: the in-play HUD sits below the row of
       floating controls (🚪 exit top-left, ❓ help top-right, 🎯 daily-goal pill
       top-center) so the pill no longer overlaps the stats. margin-top (not
       padding) pushes the whole HUD down without distorting card-style HUDs. */
    body.hv-game #game-screen .game-hud { margin-top: 44px; }
    /* The floating 🚪 already returns to the home page, so the inline
       "🏠 Về trang chủ" link on a game's start menu is redundant. */
    body.hv-game #start-screen .home-link { display: none !important; }
  `;
  document.head.appendChild(style);

  // Init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createHelpButton);
  } else {
    createHelpButton();
  }
})();
