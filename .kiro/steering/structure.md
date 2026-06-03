# Project Structure

```
├── server.js            # Main Express server (local dev entry point)
├── ws-server.js         # WebSocket server for V4 online duel
├── vercel.json          # Vercel deployment routing config
├── api/                 # Serverless API handlers (Vercel-compatible)
│   ├── admin/index.js   # Admin CRUD (questions, exams, stats, players)
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
│   └── questions/       # Seed data files organized by subject-difficulty
├── public/              # Static frontend files
│   ├── home.html        # Landing page / game selector
│   ├── game.html + game.js + style.css   # V1 Classic mode
│   ├── admin.html + admin.js + admin.css # Admin dashboard
│   ├── exam.html + exam.js + exam.css    # Exam mode
│   ├── learn.html + learn.js + learn.css # Learning mode
│   ├── v2/             # V2 Adventure mode (standalone HTML/JS/CSS)
│   ├── v3/             # V3 Local 2-Player Duel
│   └── v4/             # V4 Online Duel (WebSocket-based)
```

## Architecture Notes

- Local dev: single `server.js` serves both API and static files, plus WebSocket
- Production (Vercel): API routes are serverless functions in `api/`, static files served from `public/`
- Each game version (v1-v4) is a self-contained HTML/JS/CSS bundle with no build step
- The `api/` handlers mirror the routes defined inline in `server.js` for Vercel compatibility
- WebSocket (V4 duel) only works on the local server; Vercel uses polling via `api/room.js`
