/* ==========================================================================
   SOIS Question Paper Backend API Server (Node.js)
   Presidency University Bengaluru - School of Information Science
   ========================================================================== */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const DATA_DIR = path.join(__dirname, 'data');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure data folder and JSON files exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(SUBMISSIONS_FILE)) {
  fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify([]));
}

if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([]));
}

function readJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function writeJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving JSON:', e);
  }
}

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // --- API ENDPOINTS ---

  // GET /api/submissions - Retrieve all submitted papers
  if (req.method === 'GET' && pathname === '/api/submissions') {
    const submissions = readJson(SUBMISSIONS_FILE);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(submissions));
    return;
  }

  // POST /api/submit - Faculty submits a new paper
  if (req.method === 'POST' && pathname === '/api/submit') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const newSub = JSON.parse(body);
        const submissions = readJson(SUBMISSIONS_FILE);

        // Remove existing duplicate ID if re-submitted
        const existingIdx = submissions.findIndex(s => s.id === newSub.id);
        if (existingIdx !== -1) {
          submissions[existingIdx] = newSub;
        } else {
          submissions.unshift(newSub);
        }

        writeJson(SUBMISSIONS_FILE, submissions);
        console.log(`[API] New paper submitted: ${newSub.id} - ${newSub.courseCode} by ${newSub.facultyName}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Question Paper saved to Central Server!', submission: newSub }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Invalid submission JSON payload.' }));
      }
    });
    return;
  }

  // POST /api/update-status - Manager updates status / note
  if (req.method === 'POST' && pathname === '/api/update-status') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { id, status, managerNote } = JSON.parse(body);
        const submissions = readJson(SUBMISSIONS_FILE);
        const item = submissions.find(s => s.id === id);

        if (item) {
          item.status = status;
          if (managerNote !== undefined) item.managerNote = managerNote;
          item.updatedAt = new Date().toLocaleString();
          writeJson(SUBMISSIONS_FILE, submissions);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, submission: item }));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Submission not found.' }));
        }
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Invalid payload.' }));
      }
    });
    return;
  }

  // POST /api/delete-submission
  if (req.method === 'POST' && pathname === '/api/delete-submission') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { id } = JSON.parse(body);
        let submissions = readJson(SUBMISSIONS_FILE);
        submissions = submissions.filter(s => s.id !== id);
        writeJson(SUBMISSIONS_FILE, submissions);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: `Submission ${id} deleted.` }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Invalid payload.' }));
      }
    });
    return;
  }

  // GET /api/users
  if (req.method === 'GET' && pathname === '/api/users') {
    const users = readJson(USERS_FILE);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(users));
    return;
  }

  // POST /api/register
  if (req.method === 'POST' && pathname === '/api/register') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { punivId, name, password, role, email } = JSON.parse(body);
        const users = readJson(USERS_FILE);
        const pid = punivId.trim().toUpperCase();

        let user = users.find(u => u.punivId.toUpperCase() === pid);
        if (user) {
          user.name = name || user.name;
          user.password = password;
          user.role = role || user.role;
          if (email) user.email = email;
        } else {
          user = {
            punivId: pid,
            name: name.trim(),
            role: role || 'faculty',
            designation: role === 'manager' ? 'Manager / Course In-Charge' : 'Faculty Member',
            department: 'SOIS',
            password: password.trim(),
            email: email.trim() || `${pid.toLowerCase()}@presidencyuniversity.in`
          };
          users.push(user);
        }
        writeJson(USERS_FILE, users);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, user }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Invalid user registration payload.' }));
      }
    });
    return;
  }

  // --- STATIC FILE SERVING ---
  let filePath = path.join(__dirname, pathname === '/' ? 'faculty.html' : pathname);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, 'faculty.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'text/html';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 SOIS Central Server running on http://localhost:${PORT}`);
});
