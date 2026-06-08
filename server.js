// ── Learning Schedule — local server ──────────────────────────────────────
// Pure Node.js, no npm packages needed.
// Run:  node server.js
// Then: http://localhost:3131
//
// Serves the app/ directory as static files and exposes one API endpoint:
//   POST /api/save-review   { weekRange, content }
//   → writes / updates logs/weekly-reviews.md

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT      = 3131;
const APP_DIR   = path.join(__dirname, 'app');
const LOGS_DIR  = path.join(__dirname, 'logs');
const REVIEWS_FILE = path.join(LOGS_DIR, 'weekly-reviews.md');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.md':   'text/markdown; charset=utf-8',
};

// Ensure logs dir exists on startup
if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR);

// ── Request handler ──

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204); res.end(); return;
  }

  if (req.method === 'POST' && req.url === '/api/save-review') {
    handleSaveReview(req, res);
    return;
  }

  serveStaticFile(req, res);
});

// ── API: save / update weekly review ──

function handleSaveReview(req, res) {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    try {
      const { weekRange, content } = JSON.parse(body);
      if (!weekRange || !content) throw new Error('Missing weekRange or content');
      upsertWeekSection(weekRange, content);
      json(res, 200, { ok: true });
    } catch (e) {
      console.error('Save error:', e.message);
      json(res, 500, { ok: false, error: e.message });
    }
  });
}

// Insert a new week section or replace the existing one
function upsertWeekSection(weekRange, weekSection) {
  let existing = '';
  try { existing = fs.readFileSync(REVIEWS_FILE, 'utf8'); } catch (_) { /* new file */ }

  const weekHeader = `## Week of ${weekRange}`;
  let updated;

  if (existing.includes(weekHeader)) {
    // Replace the existing section
    const startIdx  = existing.indexOf(weekHeader);
    const afterStart = startIdx + weekHeader.length;
    const nextIdx   = existing.indexOf('\n## Week of ', afterStart);
    const endIdx    = nextIdx === -1 ? existing.length : nextIdx;
    updated = existing.slice(0, startIdx) + weekSection + existing.slice(endIdx);
    console.log(`Updated existing entry: ${weekRange}`);
  } else {
    // Append a new section
    const fileHeader = "# Weekly Reviews — Boy, That's a Dandy Schedule!\n\n";
    updated = existing.trim()
      ? existing.trimEnd() + '\n\n' + weekSection
      : fileHeader + weekSection;
    console.log(`Added new entry: ${weekRange}`);
  }

  fs.writeFileSync(REVIEWS_FILE, updated, 'utf8');
}

// ── Static file serving ──

function serveStaticFile(req, res) {
  const urlPath  = req.url.split('?')[0]; // strip query string
  const filePath = path.join(APP_DIR, urlPath === '/' ? 'index.html' : urlPath);

  // Prevent directory traversal outside APP_DIR
  if (!filePath.startsWith(APP_DIR)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404); res.end('Not found'); return;
    }
    const ext  = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}

// ── Helpers ──

function json(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

// ── Start ──

server.listen(PORT, () => {
  console.log('');
  console.log('  🌸  Boy, That\'s a Dandy Schedule!');
  console.log(`  →   http://localhost:${PORT}`);
  console.log(`  →   Logs saved to: ${LOGS_DIR}`);
  console.log('');
});
