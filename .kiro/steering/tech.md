# Tech Stack

## Runtime & Language
- Node.js with ES Modules (`"type": "module"` in package.json)
- Vanilla JavaScript (no TypeScript, no transpilation)
- No frontend framework — plain HTML/CSS/JS served as static files

## Backend
- Express.js for HTTP API
- `ws` (WebSocketServer) for real-time online duel (V4)
- `better-sqlite3` for local development (SQLite)
- `@libsql/client` for production (Turso, libSQL-compatible)

## Database
- SQLite locally (`db/local.db`), Turso in production
- Schema defined in `db/schema.sql`
- DB abstraction in `db/database.js` wraps better-sqlite3 to match the libsql client interface

## Deployment
- Vercel (serverless functions + static hosting)
- `vercel.json` routes API calls to serverless handlers in `api/`
- Local dev uses a single Express server (`server.js`) that serves everything

## Common Commands
- `npm run dev` — Start local dev server (Express + WebSocket on port 3000)
- `npm run seed` — Seed local SQLite database with question data
- `npm run seed:turso` — Seed production Turso database
- `npm start` — Same as dev (runs `node server.js`)

## Key Conventions
- All API routes prefixed with `/api/`
- Admin routes require Basic Auth (user: admin, pass: admin in dev)
- Database queries use parameterized `{ sql, args }` objects via the libsql client interface
- Environment variables: `TURSO_URL`, `TURSO_AUTH_TOKEN` (see `.env.example`)
- No test framework is currently set up
