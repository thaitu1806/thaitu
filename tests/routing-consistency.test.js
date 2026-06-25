/**
 * Routing Consistency Tests
 * Validates that server.js, vercel.json, and public/ folders are in sync.
 * Every game version folder must have:
 *  - A static route in server.js
 *  - A route entry in vercel.json
 *  - A matching public/vN/ folder with index.html
 */

import { describe, test, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

// Read config files
const serverJs = readFileSync('server.js', 'utf-8');
const vercelJson = JSON.parse(readFileSync('vercel.json', 'utf-8'));
const homeHtml = readFileSync('public/home.html', 'utf-8');

// Extract all vN folders from public/
const publicDirs = readdirSync('public', { withFileTypes: true })
  .filter(d => d.isDirectory() && /^v\d+$/.test(d.name))
  .map(d => d.name)
  .sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));

// Extract version numbers
const versionNumbers = publicDirs.map(d => parseInt(d.slice(1)));

// ===== FOLDER EXISTENCE =====
describe('Game Version Folders', () => {
  // All expected versions 2-40 should exist
  for (let v = 2; v <= 40; v++) {
    test(`public/v${v}/ folder exists`, () => {
      expect(existsSync(join('public', `v${v}`))).toBe(true);
    });

    test(`public/v${v}/index.html exists`, () => {
      expect(existsSync(join('public', `v${v}`, 'index.html'))).toBe(true);
    });

    test(`public/v${v}/game.js exists`, () => {
      expect(existsSync(join('public', `v${v}`, 'game.js'))).toBe(true);
    });

    test(`public/v${v}/style.css exists`, () => {
      expect(existsSync(join('public', `v${v}`, 'style.css'))).toBe(true);
    });
  }
});

// ===== SERVER.JS ROUTES =====
describe('server.js Static Routes', () => {
  for (let v = 2; v <= 40; v++) {
    test(`server.js has /v${v} static route`, () => {
      const pattern = new RegExp(`app\\.use\\(['"\`]/v${v}['"\`]`);
      expect(serverJs).toMatch(pattern);
    });
  }
});

// ===== VERCEL.JSON ROUTES =====
describe('vercel.json Routes', () => {
  const vercelRoutes = vercelJson.routes.map(r => r.src);

  for (let v = 2; v <= 40; v++) {
    test(`vercel.json has /v${v}/ route`, () => {
      const hasRoute = vercelRoutes.some(src => src.includes(`/v${v}/`));
      expect(hasRoute).toBe(true);
    });
  }
});

// ===== HOME.HTML GAME CARDS =====
describe('home.html Game Cards', () => {
  // V2+ should have an entry/link in home.html
  for (let v = 2; v <= 40; v++) {
    test(`home.html has link to /v${v}/`, () => {
      const hasLink = homeHtml.includes(`/v${v}/`) || homeHtml.includes(`/v${v}"`);
      expect(hasLink).toBe(true);
    });
  }
});

// ===== API ROUTE COMPLETENESS =====
describe('API Routes in vercel.json', () => {
  const requiredApiRoutes = [
    '/api/questions',
    '/api/sessions',
    '/api/answers',
    '/api/players',
  ];

  requiredApiRoutes.forEach(route => {
    test(`vercel.json has route for ${route}`, () => {
      const hasRoute = vercelJson.routes.some(r => r.src.includes(route.replace(/\//g, '\\/')));
      // Simpler check: just look for the route string in src fields
      const found = vercelJson.routes.some(r => r.src === route || r.src.startsWith(route));
      expect(found).toBe(true);
    });
  });
});

// ===== CROSS-REFERENCE: No orphan routes =====
describe('No Orphan Routes', () => {
  test('Every vercel.json /vN/ route has a matching public folder', () => {
    const vercelVersions = vercelJson.routes
      .filter(r => /^\/v\d+\//.test(r.src))
      .map(r => r.src.match(/^\/v(\d+)\//)[1])
      .map(Number);

    for (const v of vercelVersions) {
      expect(existsSync(join('public', `v${v}`))).toBe(true);
    }
  });

  test('Every server.js /vN route has a matching public folder', () => {
    const serverVersions = [];
    const regex = /app\.use\(['"`]\/v(\d+)['"`]/g;
    let match;
    while ((match = regex.exec(serverJs)) !== null) {
      serverVersions.push(parseInt(match[1]));
    }

    for (const v of serverVersions) {
      expect(existsSync(join('public', `v${v}`))).toBe(true);
    }
  });
});
