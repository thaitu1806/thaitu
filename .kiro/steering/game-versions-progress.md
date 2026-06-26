---
inclusion: manual
---

# Game Versions Progress

## V41-V60 plan
Quy ước: mỗi game version mới (v41+) tuân theo pattern V41/V42:
- `public/vNN/{index.html, game.js, game-logic.js, style.css}`.
- Pure logic ở `game-logic.js` (no DOM/fetch); UI ở `game.js`; tests ở `tests/vNN-game-logic.{unit,property}.test.js`.
- Mode `vNN` trong saveSession.
- Cập nhật ranges trong: `tests/game-versions.test.js`, `tests/script-includes.test.js`, `tests/routing-consistency.test.js`, `tests/answer-comparison.test.js`, `tests/game-lifecycle.test.js`.
- Cập nhật `server.js` static mount, `vercel.json` route, `home.html` card.

## Completed
- ✅ V41 — Phiêu Lưu Mario 🍄
- ✅ V42 — Khinh Khí Cầu 🎈
- ✅ V43 — Pizzeria 🍕
- ✅ V44 — Vũ Trụ Cá Mập 🦈
- ✅ V45 — Lập Trình Robot 🤖
- ✅ V46 — Tiệm Cây Cảnh 🌵
- ✅ V47 — Lab Slime 🧪
- ✅ V48 — Cứu Hộ Khủng Long 🦖
- ✅ V49 — DJ Nhí 🎧
- ✅ V50 — Tàu Ngầm Đại Dương ⚓
- ✅ V51 — Vườn Thú Pokémon Việt 🐢
- ✅ V52 — Lễ Hội Trung Thu 🏮
- ✅ V53 — Đặc Vụ Mèo 🐱
- ✅ V54 — Phù Thủy Thuốc 🧙
- ✅ V55 — Sân Bóng Trí Tuệ ⚽
- ✅ V56 — Người Tuyết Cứu Bắc Cực ⛄
- ✅ V57 — Tiệm May Áo Dài 👘
- ✅ V58 — Hành Trình Lúa Gạo 🌾
- ✅ V59 — Đua Xe Đạp 🚴
- ✅ V60 — Cổ Tích Việt Nam 📜

## Pending
*(All planned versions V41-V60 complete.)*

## V2-V10 redesign (self-contained graphics rebuild)
Toàn bộ V2, V3, V6, V7, V8, V9, V10 đã được **viết lại hoàn toàn** với gameplay mới + đồ họa vector động (inline SVG/CSS, particle effects). Mỗi game tự chứa trong `game.js` (IIFE, không phụ thuộc sprite registry dùng chung) — giữ nguyên hợp đồng: `/api/questions`, `/api/sessions` mode `vNN`, `.toLowerCase()`, `checkAndShowPrompt()`, không emoji 2020+.
- V2 — Phiêu Lưu Kho Báu 🗺️ (đi đường mòn tới rương, bão = nguy hiểm)
- V3 — Kéo Co Trí Tuệ 💪 (đối kháng tốc độ, panel P2 xoay 180°, có Bot)
- V6 — Đua Xe Trí Tuệ 🏎️ (đua, combo 3 = nitro; **đã xóa `game-logic.js`** cũ)
- V7 — Leo Vách Đá 🧗 (leo mỏm đá, combo vọt 2 nấc, hết sức = rơi)
- V8 — Xếp Tháp Thăng Bằng 🏰 (cần cẩu đung đưa, bấm THẢ căn giữa, lệch nhiều = sụp)
- V9 — Phá Đảo Boss ⚔️ (RPG theo lượt, combo 3 = đại chiêu x3, hạ 3 boss)
- V10 — Đào Vàng Dò Mìn 💎 (minesweeper + quiz, flood-reveal, chế độ cắm cờ)

V4 (Đấu Online/Firebase) và V5 (Cờ Cá Ngựa, có `game-logic.js` riêng) **chỉ nâng cấp đồ họa** (backdrop động append vào `style.css`), giữ nguyên logic.

## Banned emojis (avoid)
Xem `BANNED_EMOJI_PATTERNS` trong `tests/game-versions.test.js` (2020+ emojis: 🪴 🪙 🪼 🪸 🪨 🧊 🪵 🪟 🪢 🫧 🪚 🪜 🫗 🪷 🪹 🪺 🪣 🪤 🪥 🪧 🪆 🫐 🫑 🫒). Nếu dùng phải dùng emoji 2019 trở về trước.
