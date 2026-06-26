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

## Banned emojis (avoid)
Xem `BANNED_EMOJI_PATTERNS` trong `tests/game-versions.test.js` (2020+ emojis: 🪴 🪙 🪼 🪸 🪨 🧊 🪵 🪟 🪢 🫧 🪚 🪜 🫗 🪷 🪹 🪺 🪣 🪤 🪥 🪧 🪆 🫐 🫑 🫒). Nếu dùng phải dùng emoji 2019 trở về trước.
