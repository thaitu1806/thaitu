# Project Structure

```
├── server.js            # Main Express server (local dev entry point)
├── ws-server.js         # WebSocket server for V4 online duel
├── vercel.json          # Vercel deployment routing config
├── api/                 # Serverless API handlers (Vercel-compatible)
│   ├── admin/index.js   # Admin CRUD (questions, exams, stats, players, parents)
│   ├── answers.js       # Log individual answers
│   ├── exams.js         # Exam CRUD + submission
│   ├── players.js       # Player create/get
│   ├── questions.js     # Fetch random questions
│   ├── room.js          # Polling-based room API (V4 fallback for Vercel)
│   ├── sessions.js      # Save game sessions
│   └── db.js            # Shared DB getter for serverless handlers
├── db/
│   ├── database.js      # DB abstraction (SQLite local / Turso prod)
│   ├── schema.sql       # Full database schema
│   ├── seed.js          # Local seeder
│   ├── seed-turso.js    # Production seeder
│   ├── local.db         # Local SQLite database file
│   └── questions/       # Seed data files organized by subject-difficulty. Picture (emoji) sets by grade: picture-preschool.js (grade 0, "5 tuổi"), picture-grade1.js (grade 1), picture-math.js (grade 2)
├── public/              # Static frontend files
│   ├── index.html       # Capacitor entry — redirects to home.html
│   ├── api-config.js    # Runtime API base URL patch for native shell
│   ├── home.html        # Landing page / game selector
│   ├── game.html + game.js + style.css   # V1 Classic mode
│   ├── admin.html + admin.js + admin.css # Admin dashboard
│   ├── exam.html + exam.js + exam.css    # Exam mode
│   ├── learn.html + learn.js + learn.css # Learning mode
│   ├── v2/ … v40/       # Self-contained game versions (index.html + game.js + style.css)
├── scripts/
│   └── inject-api-config.js # Idempotently injects api-config.js into every HTML file
├── android/             # Capacitor native Android project
├── ios/                 # Capacitor native iOS project
```

## Architecture Notes

- **Quiz answer engine (`public/quiz/`)**: pluggable answer engine. `public/quiz/engine.js` defines `window.HocVuiQuiz` with `registerMode(id, def)` + `render({ questionEl, optionsEl, question, onResult, mode? })`. Each question TYPE is a drop-in plugin file (`public/quiz/mode-*.js`) that calls `HocVuiQuiz.registerMode(...)` (or queues into `window.__hvQuizPending` if loaded before the engine). 11 modes (drop-in `mode-*.js`): `choice` (multiple choice, applies to all), `truefalse` (statement Đúng/Sai), `type` (numeric keypad / text input; only when answer is short — `helpers.isShortAnswer`), `tap` (tap the correct scattered chip), `mystery` (open mystery boxes), `slider` (drag a number slider), `eliminate` (remove wrongs then pick), `catch` (catch drifting chips), `balloon` (🎈 tap the correct rising balloon), `whack` (🔨 whack the mole holding the right answer), `scratch` (🪙 reveal scratch cards then pick). `public/quiz/all.js` is a bundle loader: it lists the `MODES` array and injects every `mode-*.js` — **adding a new question type = create `public/quiz/mode-<id>.js` and add its id to the `MODES` array in `all.js`; no game edits.** Shared CSS for all modes lives in `public/quiz/quiz-modes.css` (selectors key off the `qz-mode-*`/`qz-*-field` classes the engine applies, so they work regardless of a game's own options container). Modes apply `.option-btn`/`.correct`/`.wrong` so the shared sounds/mascot/collection/engagement observers fire. A game picks one applicable mode per question (weighted random); `render(...)` returns a handle with `revealTimeout()`. **Injected into v2, v6–v10, v41–v60** via `scripts/inject-quiz-engine.mjs` (standard `handleAns`/`curQ` template) and `scripts/inject-quiz-engine-v41.mjs` (the `handleAnswer(selectedKey)`/`currentQuestion` template for v41–v46; the engine returns a boolean `ok` and the injector synthesizes the correct/wrong letter key so the game's own handler runs unchanged), plus `scripts/inject-quiz-css.mjs` (adds the `quiz-modes.css` link). Each injected `index.html` loads `/quiz/engine.js` + `/quiz/all.js` before `game.js` and links `/quiz/quiz-modes.css`. NOT injected: v3, v4, v5, v11–v40 (embedded/custom question models — board games, 2-player duel, true/false-only, shop-cart, etc. — not generic A/B/C/D multiple choice). To apply to another game: include the same scripts + CSS, replace its hand-built option buttons with `HocVuiQuiz.render(...)`, and make its answer handler accept `ok`.

- **Lab branch (`public/lab/`)**: experimental new-mechanic games kept separate from v2–v60. Goal is interaction variety (drag-to-match, tap-to-pop, swipe) instead of the multiple-choice reskins of v2–v60. Each lab game lives in `public/lab/<name>/` with its own `index.html + game.js + game-logic.js + style.css`; pure logic is unit-tested (e.g. `tests/lab-match.unit.test.js` loads the IIFE via `new Function('window', src)` since the project is ESM). Lab menu at `public/lab/index.html`; routed in `vercel.json` (`/lab/...`) and served by the root static handler locally. The cross-version test contracts (game-versions/script-includes/routing) only scan v2–v60, so lab is unaffected. First lab game: `lab/match` ("Nối Cặp", drag-to-match, mode `lab-match`).

- Local dev: single `server.js` serves both API and static files, plus WebSocket
- Production (Vercel): API routes are serverless functions in `api/`, static files served from `public/`
- Each game version (v1+) is a self-contained HTML/JS/CSS bundle with no build step
- The `api/` handlers mirror the routes defined inline in `server.js` for Vercel compatibility
- `answer_logs.session_id` is **nullable** (FK to `game_sessions`). Games log each answer *during* play but the session row is only created when the game finishes, so `api/answers.js` + `server.js` insert `NULL` (not `0`) when no valid session id is present — otherwise the FK fails with a 500. Never pass `session_id: 0`.
- Multi-grade questions: `questions.grade` ranges **0–5** (0 = "5 tuổi" mầm non, 1 = Lớp 1, … 5 = Lớp 5). `api/questions.js` filters strictly by grade. Picture/emoji question sets exist for the youngest grades (see `db/questions/picture-*.js`). The child's grade is set in `public/profile.html` (buttons include 5 tuổi + Lớp 1–5) and stored on the player + in localStorage `hocvui_profile`. **Always read grade with `?? 2` not `|| 2`** (grade 0 is falsy) — both in game `fetchQ`/`fetchQuestions` and in `api/players.js`/`server.js` POST+PUT (PUT range allows 0–5). The learn page (`public/learn.js`) also has `GRADE_TOPICS`/`GRADE_SUBTITLES`/`TOPIC_NAMES`/`LESSONS` entries for grade 0 (count0/compare0/size0/colors0/shapes0/animals0) and grade 1 (count1/add1/sub1/compare1/order1/shapes1); learn.html grade tabs include 5 tuổi + Lớp 1.
- V4 online duel uses Firebase Realtime Database directly from the client (the legacy `ws-server.js` is only used locally and is being phased out)
- Parent system: `public/parent.html` (register/login/dashboard for parents) backed by `api/parent.js` (`/api/parent?action=...`). On Vercel `/api/parent` routes to `api/features.js?feature=parent`; locally `server.js` mounts `api/parent.js` directly at `/api/parent`. Admins manage parents via the "Phụ huynh" tab in `admin.html` → `api/admin/index.js` `resource=parents` (list / children / unlink / delete).
- Parent-created rewards ("Quà từ bố mẹ"): parents define real-life gifts per child (icon+title+diamond price) in the parent dashboard "🎁 Quà của con" tab. Tables `parent_rewards` + `parent_reward_claims` (auto-created via `api/db.js` migration on Turso). Actions on `/api/parent`: `create-reward`, `rewards` (parent view with parent_id, child view without), `delete-reward`, `redeem-reward` (child spends diamonds → claim), `claims`, `fulfill-claim`. The child sees these in `shop.html` (top "Quà từ bố mẹ" section); parents get a pending-claims banner to mark fulfilled.
- Sound: `public/sounds.js` is a shared Web Audio (synthesized, no files) sound system injected into every HTML page (run `node scripts/inject-sounds.js` after adding new pages). It auto-plays correct/wrong cues by observing option buttons that gain `.correct`/`.wrong` classes, renders a fixed 🔊/🔇 mute toggle (state in localStorage `hocvui_sound_on`), and exposes `window.HocVuiSound.play('correct'|'wrong'|'win'|'lose'|'combo'|'star'|'coin'|'click')`. v2–v10 call `HocVuiSound.play('win'|'lose')` on finish.
- Mascot: `public/mascot.js` is a shared companion ("Bé Vui", inline SVG) injected into every HTML page (run `node scripts/inject-mascot.js`). It only renders on game pages (`/vNN/`, game/learn/exam.html), cheers/encourages by observing the same `.correct`/`.wrong` feedback, shows speech bubbles, has a 🌱 show/hide toggle (localStorage `hocvui_mascot_on`), and exposes `window.HocVuiMascot.cheer()/encourage()/say()`.
- Home `continue-banner`: a 1-tap "Chơi tiếp" hero on home.html that resumes the most recently played game from localStorage `hocvui_recent`.
- Collection: `public/collection.js` is a self-contained sticker album (no backend) injected into every page (run `node scripts/inject-collection.js`). Games call `window.HocVuiCollection.reward(stars)` on finish to maybe unlock a random sticker (drop rate + rarity scale with stars 0-3) with a reveal animation; stickers stored in localStorage `hocvui_stickers_<profileId>`. A universal `fetch` hook also auto-rewards on any `POST /api/sessions` (covers every game incl. v4/v5/v11-v60) with a cooldown to dedupe direct calls. Home opens the album via `showAlbum()` (📔 Sưu tập chip + pet-card button).
- Engagement: `public/engagement.js` (injected before mascot.js via `node scripts/inject-engagement.js`) provides the daily-login reward chest (7-day streak, home only), the "today's goal" widget (answer 10 correct/day, game pages), weekly "Phiếu Bé Ngoan" report card (`HocVuiProgress.showReportCard()`, home footer link), and `window.HocVuiProgress` (lifetimeCorrect counter + `petStage()` 0-4 + weekly tally). It counts correct answers by observing `.correct` feedback. The mascot evolves through 5 stages via `HocVuiMascot.refreshStage()`; home.html shows a pet-showcase card mirroring the same stage/progress.
- Avatar: `public/avatar.js` (injected after engagement.js via `node scripts/inject-avatar.js`) lets the child pick an avatar; 15 avatars unlock progressively by `HocVuiProgress.lifetimeCorrect`. Stored per-profile in localStorage; applied to `#hero-avatar` (tap to open picker). Exposes `window.HocVuiAvatar`.
- Native Android/iOS builds are produced via Capacitor — see `mobile-build.md`
