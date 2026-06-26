# V48 Graphics Upgrade — Design

## Architecture

```
public/
├── lib/
│   ├── character.js              # Character system (new)
│   └── sprites/
│       └── dinosaurs.js          # V48 sprite registry (new)
└── v48/
    ├── index.html                # +2 script tags, +volcano SVG slot
    ├── game.js                   # Use createCharacter; particle helpers
    ├── game-logic.js             # UNCHANGED
    └── style.css                 # New animation rules
```

`public/lib/` là folder mới shared. Module mặc định attach lên `window.HocVuiCharacters` để các version vanilla JS dùng được không cần ES modules.

## Module: `public/lib/character.js`

### Public API

```js
// Returns { setState, getState, destroy, root }
window.HocVuiCharacters.createCharacter(speciesId, container, opts);
```

- `speciesId` (string) — phải đã đăng ký trước (xem registry bên dưới).
- `container` (HTMLElement) — element wrapper sẽ chứa SVG. Module sẽ append child, không xoá nội dung sẵn có (caller tự clear nếu cần).
- `opts.state` (string, default `'idle'`) — state khởi tạo.
- `opts.size` (number, optional) — kích thước CSS (px). Mặc định fill container.
- `opts.onStateChange` (fn, optional) — callback `(newState, prevState) => void`.

### Registry API

```js
window.HocVuiCharacters.registerSpecies(speciesId, definition);
```

Trong đó `definition = { svg: string, classPrefix: string }`:
- `svg`: chuỗi SVG markup hoàn chỉnh (`<svg viewBox="0 0 100 100">…</svg>`).
- `classPrefix`: prefix để gắn vào root SVG (ví dụ `'dino dino-trex'`) — cho phép CSS target từng loài nếu cần animation riêng.

### State management

Mỗi character có root `<div class="hv-char">` bao quanh SVG. State được represent bằng class:

```
hv-char hv-char--<speciesId> is-<state>
```

CSS rule trong `style.css` của V48 tự định nghĩa keyframes cho `.is-idle`, `.is-happy`, `.is-scared`, `.is-rescued`. Module không hardcode CSS — chỉ thay class. Điều này giữ module agnostic và cho phép mỗi version tự customize animation theo theme.

### Internal structure

```
<div class="hv-char hv-char--trex is-idle">
  <svg viewBox="0 0 100 100" class="dino dino-trex">
    <g class="body">…</g>
    <g class="head">…</g>
    <g class="tail">…</g>
    <g class="eye">…</g>
  </svg>
</div>
```

CSS animate các `<g>` con bằng `transform-origin` đặt sẵn, tận dụng GPU compositing.

### Code size estimate

~80 LOC (creation + registry + state class toggle + cleanup).

## Module: `public/lib/sprites/dinosaurs.js`

Single file, registers 8 species vào registry. Mỗi SVG ~30-60 line viewBox 100×100. Style chung:

- Outline: `stroke="#3e2723" stroke-width="2" stroke-linejoin="round"`.
- Fill chính: lấy từ palette V48 — `#ff7043` (cam đậm), `#8d6e63` (nâu), `#a1887f` (nâu nhạt), `#558b2f` (xanh raptor), `#fdd835` (vàng egg), `#1565c0` (xanh dương serpent), `#388e3c` (xanh croco), `#c5cae9` (xám bone stego).
- Mỗi sprite có các `<g>` named (`body`, `head`, `tail`, `eye`, optional `accent`) để CSS animate.
- Eyes là 2 ellipse với class `eye`, sẵn pivot cho blink/shock.

Tổng ước lượng: ~6-8KB unminified.

## Volcano upgrade

Thay element `<div class="volcano" id="volcano">🌋</div>` bằng:

```html
<div class="volcano" id="volcano" data-danger="0">
  <svg class="volcano-svg" viewBox="0 0 100 100" aria-hidden="true">
    <g class="smoke">
      <circle class="puff puff-1" .../>
      <circle class="puff puff-2" .../>
      <circle class="puff puff-3" .../>
    </g>
    <path class="mountain" .../>
    <path class="lava-crack" .../>
    <ellipse class="crater" .../>
    <g class="sparks"><!-- 3 small rects --></g>
  </svg>
</div>
```

Volcano root nhận attribute `data-danger="0..5"`. CSS rules dùng `[data-danger="3"]`, `[data-danger="4"]`, `[data-danger="5"]` để escalate:
- Tăng tần suất shake.
- Tăng số smoke puffs / saturation.
- Show/hide sparks.

Controller (`game.js`) chỉ cần `$('volcano').dataset.danger = state.danger`.

### Eruption (CSS-only)

Khi `outcome==='erupted'`, controller add class `is-erupting` lên volcano và spawn ~12 particle div bay lên + fall:

```css
.volcano.is-erupting .mountain { animation: erupt-shake 0.12s linear 12 }
.volcano.is-erupting .crater   { animation: erupt-flash 1.5s ease-out }
```

Particles là `<div class="volcano-ember"></div>` injected vào `.rescue-stage`, mỗi cái random `--tx` `--ty` `--delay` qua CSS variable.

## Particle system (lightweight inline)

Helper trong `game.js`:

```js
function spawnParticles(parent, kind, count) {
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    p.className = `pfx pfx-${kind}`;
    p.style.setProperty('--tx', (Math.random() * 200 - 100) + 'px');
    p.style.setProperty('--ty', (-Math.random() * 80 - 40) + 'px');
    p.style.setProperty('--delay', (Math.random() * 0.2) + 's');
    parent.appendChild(p);
    p.addEventListener('animationend', () => p.remove(), { once: true });
  }
}
```

Kinds dùng trong V48: `sparkle` (rescue), `ash` (volcano idle), `confetti` (win), `ember` (eruption). Mỗi kind là 1 keyframe + 1 màu fill khác.

## Controller changes (`public/v48/game.js`)

Diff overview:
1. **`renderDinos()`** thay vì set `el.textContent = d.emoji`, gọi `createCharacter(d.id, el, { state })` lần đầu, lưu reference vào `state.dinos[i]._char`. Lần render sau chỉ gọi `_char.setState(...)`.
2. **`renderDanger()`** set `$('volcano').dataset.danger = state.danger` thay vì toggle class `critical`.
3. **`handleAns()` success path** sau khi update state, nếu có dino mới được rescue:
   - Set `_char.setState('rescued')`.
   - `spawnParticles(slotEl, 'sparkle', 8)`.
4. **`handleAns()` khi danger zone**: loop set state các dino chưa cứu thành `scared`.
5. **`finish()`** trước khi `ss('result-screen')`:
   - Nếu `outcome==='erupted'`: add `.is-erupting` lên volcano, spawn 12 embers, delay 1500ms trước ss.
   - Nếu `outcome==='won'`: spawn confetti trên `.rescue-stage`, delay 1200ms trước ss.
   - Đảm bảo `clearInterval(tH)` và button event vẫn fire OK (replay button trên result-screen không bị block).
6. **Ash particles** spawn loop khi vào `game-screen`: `setInterval(() => spawnParticles(volcanoEl, 'ash', 1), 600)`. Clear khi rời screen.

Không thay đổi: imports, fetch, save session, timer logic.

## CSS architecture

Phân tách trong `style.css`:
- Section "characters" — keyframes cho `is-idle`, `is-happy`, `is-scared`, `is-rescued` áp lên `.hv-char` và children.
- Section "volcano" — SVG styles + `data-danger` escalation rules.
- Section "particles" — `.pfx-sparkle`, `.pfx-ash`, `.pfx-confetti`, `.pfx-ember` với keyframes riêng.
- Existing rules giữ nguyên (selector-group, btn-primary, q-options, feedback, etc.).

Predicted CSS growth: ~120-180 lines.

## Test impact analysis

`tests/game-versions.test.js` validate index.html cho:
- Vietnamese lang, UTF-8, viewport, game.js, style.css, required scripts, no banned emojis, etc.
- Tất cả vẫn pass — chỉ thêm volcano SVG markup và `<script src="/lib/character.js">` + `<script src="/lib/sprites/dinosaurs.js">` vào head.

`tests/v48-game-logic.unit.test.js` + `property.test.js` test pure logic — không liên quan DOM.

`tests/script-includes.test.js` — kiểm tra include scripts. Cần check xem có whitelist nào không, có thể cần update.

`tests/routing-consistency.test.js` — không bị ảnh hưởng (route /v48 vẫn còn).

**Action**: chạy `npm test` sau implement; nếu có test gãy do thiếu khai báo lib scripts trong allowlist, update accordingly.

## Open questions resolved

- **Lottie?** No, defer phase 2. CSS đủ tạo eruption dramatic. Lưu hook `renderEruption()` cho phase sau.
- **Asset folder?** `public/lib/sprites/` cho sprite registry chung; `public/lib/character.js` cho engine. Mỗi version có thể có asset riêng dưới `public/v<NN>/assets/` nếu cần — V48 không cần.
- **Module loading?** Sync `<script>` tag, attach lên `window`. Không ES modules để khớp pattern hiện tại.

## Roll-out for other versions (post-pilot)

V41-V47, V49-V60 sẽ có folder `public/lib/sprites/<theme>.js` riêng:
- V42 (Khinh Khí Cầu) — `balloons.js`
- V44 (Cá Mập) — `sharks.js`
- V45 (Robot) — `robots.js`
- V51 (Pokémon Việt) — `creatures.js`
- v.v.

Mỗi version chỉ cần:
1. Tạo sprite registry file.
2. Thêm 2 `<script>` vào index.html.
3. Refactor `renderXxx()` để gọi `createCharacter(...)`.
4. Update style.css với keyframes phù hợp theme.

Pattern này document trong `.kiro/steering/graphics-system.md` (manual inclusion) sau khi pilot V48 verified.
