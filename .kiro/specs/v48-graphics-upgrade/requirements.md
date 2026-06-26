# V48 Graphics Upgrade — Requirements

## Mục tiêu

Nâng cấp đồ họa cho V48 "Cứu Hộ Khủng Long" từ emoji tĩnh sang nhân vật vector động, giữ nguyên 100% game logic và toàn bộ tests đang pass. Pilot này tạo ra `public/lib/character.js` — một character sprite system tái sử dụng được cho V41-V60.

## Functional Requirements

### FR1 — Character system module
- Module mới `public/lib/character.js` expose `createCharacter(species, container, opts)`.
- Trả về object có method `setState(state)` và `destroy()`.
- States hỗ trợ: `'idle'`, `'happy'`, `'scared'`, `'rescued'`.
- Mặc định khởi tạo ở state `'idle'`.
- Module không phụ thuộc vào bất kỳ runtime nào ngoài DOM. Vanilla JS, không build step.

### FR2 — Sprite registry
- Module mới `public/lib/sprites/dinosaurs.js` đăng ký 8 loài V48: `trex, brachio, dragon, raptor, egg, croco, serpent, stego`.
- Mỗi loài là một SVG vector chibi tự vẽ (head + body + accents), kích thước viewBox `0 0 100 100`.
- Style nhất quán: outline đen mảnh, fill 2-3 màu hài hoà với palette cam-nâu V48.
- Tổng dung lượng sprites file < 30KB unminified.

### FR3 — Character animations (CSS-driven)
- `idle`: nhân vật thở/lắc lư nhẹ, 1.8-2.2s cycle. Subtle, không phân tâm.
- `scared`: rung lập cập + nghiêng người, kích hoạt khi volcano danger ≥ maxDanger − 1.
- `happy`: nhảy lên 1-2 lần, rotation/scale nhẹ.
- `rescued`: phát sáng + bounce + sticker 🛟 stays visible. Sau bounce trở về idle nhưng vẫn giữ glow.
- Tất cả animation dùng CSS keyframes + `transform`. Không JS rAF cho idle loops.

### FR4 — Volcano upgrade
- Volcano hiện tại là emoji 🌋 với `transform:translateX`. Thay bằng SVG inline có:
  - Body núi 2 lớp gradient.
  - Crater có ánh lava pulsing.
  - 3 cụm khói lười bay lên liên tục từ miệng núi, opacity fade out theo height.
- Cường độ động theo `danger`:
  - 0/5: khói nhẹ, không rung.
  - 1-2/5: khói nhiều hơn, rung biên độ thấp.
  - 3-4/5: rung mạnh, có tia lửa nhỏ.
  - 5/5 (eruption): phun trào full — flash + shake camera + Lottie hoặc CSS particles.

### FR5 — Particle effects
- `rescue-sparkle`: 6-8 hạt vàng tỏa ra từ slot khủng long vừa cứu, 600ms, tự cleanup.
- `volcano-ash`: 2-3 hạt tro lười rơi xuống từ đỉnh núi (luôn chạy lúc gameplay).
- `win-confetti`: 30-40 hạt nhiều màu rơi từ trên xuống khi `outcome==='won'`, 2.5s, tự cleanup.
- Tất cả particles dùng DOM nodes + CSS animation; cleanup sau khi animation kết thúc.

### FR6 — Eruption climax (Lottie OR CSS fallback)
- Khi `outcome==='erupted'`, hiển thị animation phun trào dramatic 1.5-2.5s trước khi sang result screen.
- Triển khai bằng CSS thuần (no Lottie dependency cho pilot này) để tránh license audit và bundle bloat. Nếu sau này muốn upgrade lên Lottie thì có hook sẵn (`renderEruption()` trong volcano module).

### FR7 — State transitions
- Khi `rescuedCount` tăng: trigger `happy` cho slot mới cứu được + spawn `rescue-sparkle` particles + slot fade vào style `rescued`.
- Khi `danger` tăng vào "critical zone" (≥ maxDanger−1): tất cả dino chưa cứu chuyển sang `scared`. Volcano shake mạnh hơn.
- Khi quay về `danger` thấp hơn (không xảy ra trong logic hiện tại nhưng API hỗ trợ): dinos về `idle`.
- Khi finish: chạy intro animation (eruption hoặc confetti) trước khi `ss('result-screen')`.

## Non-Functional Requirements

### NFR1 — Bundle budget
- Tổng bytes add cho V48 (vs pre-upgrade): ≤ 300KB.
- Baseline hiện tại: ~25KB toàn V48. Mục tiêu sau upgrade: ≤ 325KB.
- Không thêm npm dependency. Không bundler. Không transpile.

### NFR2 — Performance
- 60fps idle với 8 dinosaurs animate đồng thời + volcano + ash particles.
- Animation thuần CSS transform/opacity (composited layers), không layout thrash.
- Particles cleanup ngay khi animation kết thúc (no zombie nodes).

### NFR3 — Compatibility
- Hoạt động trong Capacitor Android shell (Android 7+) và iOS shell.
- Hoạt động trên trình duyệt desktop hiện đại (Chrome/Edge/Safari/Firefox).
- Không yêu cầu mạng cho assets.

### NFR4 — Test compatibility
- Toàn bộ tests đang pass phải tiếp tục pass: `npm test` 2716 tests.
- Game logic (`game-logic.js`) **không thay đổi**.
- File `public/v48/index.html` vẫn phải có đủ các thẻ và script include theo `tests/game-versions.test.js`.
- Không dùng emoji 2020+ trong HTML/JS/CSS mới.

### NFR5 — Reusability
- API `createCharacter` đủ tổng quát để V41-V47, V49-V60 dùng được.
- Sprite registry pattern (`public/lib/sprites/<theme>.js`) cho phép mỗi version đăng ký bộ riêng (robots, plants, sharks, etc.).
- Steering file `graphics-system.md` ghi lại pattern + folder convention sau khi pilot xong.

## Out of Scope

- Audio/sound effects (đã có TTS module).
- Lottie integration (giữ làm phase 2 nếu cần).
- Sửa game logic, balancing, hay nội dung câu hỏi.
- Re-skin V41-V47, V49-V60 (chỉ build infra cho lần sau).
