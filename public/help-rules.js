// === HELP / RULES POPUP ===
// Auto-injects a "❓" button and shows game rules based on current game version.
// Include via <script src="/help-rules.js"></script> in any game page.
(function() {
  'use strict';

  const RULES = {
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
    if (!rules) return; // No rules for this page

    // Create floating help button
    const btn = document.createElement('button');
    btn.className = 'help-rules-btn';
    btn.textContent = '❓';
    btn.title = 'Luật chơi';
    btn.style.cssText = 'position:fixed;top:12px;right:12px;z-index:9000;width:38px;height:38px;border-radius:50%;border:none;background:rgba(0,0,0,0.2);color:#fff;font-size:1.2rem;cursor:pointer;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);transition:transform 0.2s;';
    btn.addEventListener('click', () => showRulesPopup(rules));
    document.body.appendChild(btn);
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
    .help-rules-btn:active { transform: scale(0.9); }
  `;
  document.head.appendChild(style);

  // Init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createHelpButton);
  } else {
    createHelpButton();
  }
})();
