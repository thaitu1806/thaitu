---
inclusion: manual
---

# Graphics System (V5-V60 character animation)

Shared character-sprite system piloted in V48 (Cứu Hộ Khủng Long) and now applied across all game versions V5–V60. Use this pattern when upgrading any version from static emoji to animated vector characters.

## Folder convention

```
public/lib/
├── character.js              # Engine — registry + createCharacter()
└── sprites/
    ├── dinosaurs.js          # V48 (reference pilot)
    ├── dj.js                 # V49 (reference pilot — makeDJ() factory + theme-keyed icons)
    ├── ocean.js              # V13 (reference for embedded-logic versions)
    └── <theme>.js            # one file per theme; one (or more) per version V5–V60
```

- Engine is one file (`character.js`) — vanilla JS, attached to `window.HocVuiCharacters`.
- Each theme registers its species into the same registry. Themes never depend on each other.
- One sprite file per version theme; every version V5–V60 has its own (filenames mirror the theme, e.g. `horses.js`, `ninjas.js`, `athletes.js`). Pick a unique filename — do not reuse an existing theme file for a different version.
- Per-version assets (lottie JSON, raster art) belong under `public/v<NN>/assets/`. The shared `public/lib/` only holds reusable SVG sprite registries.

## Tech stack

- **Inline SVG + CSS keyframes** for every character idle/scared/happy/rescued state.
- **CSS animations** for volcano-type "boss" elements with `data-*` attribute escalation (e.g. `data-danger="0..5"`).
- **DOM particle nodes** for sparkle / ash / confetti / ember. No Canvas or WebGL.
- **Lottie deferred** — not used in pilot. Reserve for future climax-only moments if needed.
- Banned: emoji 2020+ (see `BANNED_EMOJI_PATTERNS` in `tests/game-versions.test.js`).

## Engine API

```js
HocVuiCharacters.registerSpecies(id, { svg, classPrefix });
const char = HocVuiCharacters.createCharacter(id, container, { state, size, onStateChange });
char.setState('idle' | 'happy' | 'scared' | 'rescued' | <theme-specific>);
char.getState(); char.destroy();
```

- Engine only toggles a CSS class `is-<state>` on the wrapper. All animation lives in each version's `style.css`.
- Sprite SVGs use viewBox `0 0 100 100`, named `<g>` children (`.head`, `.body`, `.tail`, `.eye`, `.accent`) so CSS can target parts.

## State naming

Stick to these states across themes whenever possible:

- `idle` — breathing / gentle sway. Always playing during gameplay.
- `happy` — short bounce, played once when an item is freshly collected/rescued.
- `scared` — shiver/tremble, used when the "boss" enters the danger zone.
- `rescued` (or `collected`, `unlocked` — theme-appropriate synonym) — terminal positive state with glow.

Add theme-specific states only when needed (e.g. V49 DJ Nhí adds a `groove` state — high-energy idle variant driven by the groove combo level).

Engine states are independent of DOM-attribute escalation. V48 escalates the volcano via `data-danger="0..5"`; V49 escalates the whole stage (lights/speakers) via `data-groove="0..4"` on the stage container. Use a `data-*` level attribute on a container for "intensity that ramps with a gameplay meter", separate from the per-character `is-<state>` classes.

## HTML wiring per version

```html
<script src="/lib/character.js"></script>
<script src="/lib/sprites/<theme>.js"></script>
<script src="game-logic.js" type="module"></script>
<script src="game.js"></script>
```

Load order matters: engine → sprites → game-logic → game. Engine and sprites can be sync; they are tiny and side-effect-only.

## Particle helpers

Copy `spawnParticles / spawnConfetti / spawnEmbers / startAshLoop` from `public/v48/game.js` and rename to match the theme. The CSS classes (`.pfx`, `.pfx-sparkle`, `.pfx-confetti`, etc.) live in the per-version `style.css`. They are intentionally not in a shared CSS file — each theme tunes colors and trajectories.

## Bundle budget

Per-version budget: ≤ 300KB total added (engine + sprites + version CSS/JS growth). V48 pilot adds ~30KB.

## Logic location varies by version

- **V41–V60 (and V5)** keep pure logic in a separate `game-logic.js` (ES module) — never touch it.
- **V2–V39 (except V5)** have NO `game-logic.js`; their game logic lives directly in `game.js`. For these, do NOT create a `game-logic.js` and do NOT rewrite the embedded logic. Add presentation only — wrap existing functions non-invasively (call the original first, then decorate) or observe the DOM via `MutationObserver` when the logic is sealed in a private IIFE. V13 (`public/v13/game.js`) is the reference for this embedded-logic integration.
- HTML wiring for non-module versions: `link-gate.js → /lib/character.js → /lib/sprites/<theme>.js → game.js` (no `type="module"` step).
- Special modes V26 (lucky wheel) and V28 (fairy tales) intentionally do NOT save sessions — `tests/game-versions.test.js` exempts them; do not add `/api/sessions` saving.

## Test contract

When upgrading a version:

1. `tests/v<NN>-game-logic.{unit,property}.test.js` (V5, V41–V60) must keep passing — never touch `game-logic.js`. V2–V39 have no per-version logic tests, so rely on the cross-version contracts below and be careful not to disturb embedded logic.
2. `tests/game-versions.test.js` validates index.html — keep required scripts and avoid banned emojis.
3. `tests/script-includes.test.js` — load order rules still apply (game.js before quest-widget.js, link-gate.js before game.js).
4. `npm test` is the verification gate before declaring an upgrade done. Known pre-existing flake: `tests/premium-gate.property.test.js` "shop purchase is blocked with 403" — unrelated to graphics, ignore it.

## Reference implementation

- Engine: `public/lib/character.js`
- Sprite registry: `public/lib/sprites/dinosaurs.js` (V48), `public/lib/sprites/dj.js` (V49 — shows a `makeDJ()` factory pattern for character variants plus theme-keyed icons whose ids match the logic's theme ids)
- Volcano + particle CSS: `public/v48/style.css`
- Controller integration: `public/v48/game.js` (see `buildDinoGrid`, `syncDinos`, `spawnParticles`, `finish`) and `public/v49/game.js` (see `buildDJ`, `syncStage`, `pulseBeat`, `spawnNotes`).
- Spec: `.kiro/specs/v48-graphics-upgrade/`
