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
│   └── questions/       # Seed data files organized by subject-difficulty (incl. picture-math.js: emoji-based visual questions for grade 2)
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

- Local dev: single `server.js` serves both API and static files, plus WebSocket
- Production (Vercel): API routes are serverless functions in `api/`, static files served from `public/`
- Each game version (v1+) is a self-contained HTML/JS/CSS bundle with no build step
- The `api/` handlers mirror the routes defined inline in `server.js` for Vercel compatibility
- V4 online duel uses Firebase Realtime Database directly from the client (the legacy `ws-server.js` is only used locally and is being phased out)
- Parent system: `public/parent.html` (register/login/dashboard for parents) backed by `api/parent.js` (`/api/parent?action=...`). On Vercel `/api/parent` routes to `api/features.js?feature=parent`; locally `server.js` mounts `api/parent.js` directly at `/api/parent`. Admins manage parents via the "Phụ huynh" tab in `admin.html` → `api/admin/index.js` `resource=parents` (list / children / unlink / delete).
- Sound: `public/sounds.js` is a shared Web Audio (synthesized, no files) sound system injected into every HTML page (run `node scripts/inject-sounds.js` after adding new pages). It auto-plays correct/wrong cues by observing option buttons that gain `.correct`/`.wrong` classes, renders a fixed 🔊/🔇 mute toggle (state in localStorage `hocvui_sound_on`), and exposes `window.HocVuiSound.play('correct'|'wrong'|'win'|'lose'|'combo'|'star'|'coin'|'click')`. v2–v10 call `HocVuiSound.play('win'|'lose')` on finish.
- Mascot: `public/mascot.js` is a shared companion ("Bé Vui", inline SVG) injected into every HTML page (run `node scripts/inject-mascot.js`). It only renders on game pages (`/vNN/`, game/learn/exam.html), cheers/encourages by observing the same `.correct`/`.wrong` feedback, shows speech bubbles, has a 🌱 show/hide toggle (localStorage `hocvui_mascot_on`), and exposes `window.HocVuiMascot.cheer()/encourage()/say()`.
- Home `continue-banner`: a 1-tap "Chơi tiếp" hero on home.html that resumes the most recently played game from localStorage `hocvui_recent`.
- Collection: `public/collection.js` is a self-contained sticker album (no backend) injected into every page (run `node scripts/inject-collection.js`). Games call `window.HocVuiCollection.reward(stars)` on finish to maybe unlock a random sticker (drop rate + rarity scale with stars 0-3) with a reveal animation; stickers stored in localStorage `hocvui_stickers_<profileId>`. A universal `fetch` hook also auto-rewards on any `POST /api/sessions` (covers every game incl. v4/v5/v11-v60) with a cooldown to dedupe direct calls. Home opens the album via `showAlbum()` (📔 Sưu tập chip + pet-card button).
- Engagement: `public/engagement.js` (injected before mascot.js via `node scripts/inject-engagement.js`) provides the daily-login reward chest (7-day streak, home only), the "today's goal" widget (answer 10 correct/day, game pages), weekly "Phiếu Bé Ngoan" report card (`HocVuiProgress.showReportCard()`, home footer link), and `window.HocVuiProgress` (lifetimeCorrect counter + `petStage()` 0-4 + weekly tally). It counts correct answers by observing `.correct` feedback. The mascot evolves through 5 stages via `HocVuiMascot.refreshStage()`; home.html shows a pet-showcase card mirroring the same stage/progress.
- Avatar: `public/avatar.js` (injected after engagement.js via `node scripts/inject-avatar.js`) lets the child pick an avatar; 15 avatars unlock progressively by `HocVuiProgress.lifetimeCorrect`. Stored per-profile in localStorage; applied to `#hero-avatar` (tap to open picker). Exposes `window.HocVuiAvatar`.
- Native Android/iOS builds are produced via Capacitor — see `mobile-build.md`
