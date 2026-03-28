require('dotenv').config({ path: __dirname + '/.env' });

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'prospecta_secret_2026';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ── Uploads directory ───────────────────────────────────────────
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const safe = Date.now() + '-' + file.originalname.replace(/[^a-z0-9.\-_]/gi, '_');
    cb(null, safe);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ── Middleware ───────────────────────────────────────────────────
app.use(cors({ origin: [FRONTEND_URL, 'http://localhost:3000'], credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../dist')));
app.use('/uploads', express.static(uploadDir));

// ── Database ─────────────────────────────────────────────────────
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Error opening database', err);
  else { console.log('Connected to SQLite database'); createTables(); }
});

function createTables() {
  db.serialize(() => {
    // Existing tables (IF NOT EXISTS → safe, never drops data)
    db.run(`CREATE TABLE IF NOT EXISTS surveys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      is_active BOOLEAN DEFAULT 1
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      survey_id INTEGER,
      text TEXT,
      type TEXT,
      options TEXT,
      category TEXT,
      order_num INTEGER,
      FOREIGN KEY(survey_id) REFERENCES surveys(id)
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      survey_id INTEGER,
      role_id INTEGER,
      answers TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(survey_id) REFERENCES surveys(id),
      FOREIGN KEY(role_id) REFERENCES roles(id)
    )`);

    // New tables
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      name TEXT,
      role TEXT DEFAULT 'user',
      google_id TEXT,
      gdpr_consent INTEGER DEFAULT 0,
      gdpr_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      excerpt TEXT,
      category TEXT DEFAULT 'Blog',
      cover_image TEXT,
      author_id INTEGER,
      author_name TEXT,
      published INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(author_id) REFERENCES users(id)
    )`);

    console.log('All tables ready.');
  });
}

// ── Auth Middleware ──────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ error: 'No token' });
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function adminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin')
      return res.status(403).json({ error: 'Admin only' });
    next();
  });
}

function superadminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    if (req.user.role !== 'superadmin')
      return res.status(403).json({ error: 'Superadmin only' });
    next();
  });
}

// ── AUTH ROUTES ──────────────────────────────────────────────────

// Register
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, gdpr_consent } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  if (!gdpr_consent) return res.status(400).json({ error: 'GDPR consent required' });

  try {
    const hash = await bcrypt.hash(password, 12);
    db.run(
      'INSERT INTO users (email, password, name, gdpr_consent, gdpr_date) VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)',
      [email, hash, name || email.split('@')[0]],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email already registered' });
          return res.status(500).json({ error: err.message });
        }
        const token = jwt.sign({ id: this.lastID, email, role: 'user', name: name || email.split('@')[0] }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: this.lastID, email, name, role: 'user' } });
      }
    );
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.password) return res.status(401).json({ error: 'Use Google to sign in' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  });
});

// Get current user (token check)
app.get('/api/auth/me', authMiddleware, (req, res) => {
  db.get('SELECT id, email, name, role, created_at FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err || !user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  });
});

// ── Google OAuth (manual redirect flow) ─────────────────────────
// Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env
// Uses Google's OAuth2 with a simple redirect-based flow
app.get('/api/auth/google', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
    return res.redirect(`${FRONTEND_URL}/login.html?error=google_not_configured`);
  }
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: process.env.GOOGLE_CALLBACK_URL,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account'
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

app.get('/api/auth/google/callback', async (req, res) => {
  const { code, error } = req.query;
  if (error) return res.redirect(`${FRONTEND_URL}/login.html?error=google_denied`);

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        grant_type: 'authorization_code'
      })
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.id_token) throw new Error('No id_token');

    // Decode id_token (simple base64 decode of payload)
    const payload = JSON.parse(Buffer.from(tokenData.id_token.split('.')[1], 'base64').toString());
    const { sub: googleId, email, name, picture } = payload;

    // Upsert user
    db.get('SELECT * FROM users WHERE email = ? OR google_id = ?', [email, googleId], (err, user) => {
      if (err) return res.redirect(`${FRONTEND_URL}/login.html?error=db_error`);

      const upsert = user
        ? { sql: 'UPDATE users SET google_id=?, name=?, gdpr_consent=1, gdpr_date=CURRENT_TIMESTAMP WHERE id=?', params: [googleId, name, user.id], id: user.id, role: user.role }
        : { sql: 'INSERT INTO users (email, google_id, name, gdpr_consent, gdpr_date, role) VALUES (?,?,?,1,CURRENT_TIMESTAMP,"user")', params: [email, googleId, name], id: null, role: 'user' };

      db.run(upsert.sql, upsert.params, function (e) {
        if (e) return res.redirect(`${FRONTEND_URL}/login.html?error=db_error`);
        const userId = upsert.id || this.lastID;
        const role = upsert.role;
        const token = jwt.sign({ id: userId, email, role, name }, JWT_SECRET, { expiresIn: '7d' });
        res.redirect(`${FRONTEND_URL}/login.html?token=${token}&name=${encodeURIComponent(name)}&role=${role}`);
      });
    });
  } catch (e) {
    console.error('Google OAuth error:', e);
    res.redirect(`${FRONTEND_URL}/login.html?error=google_error`);
  }
});

// ── ADMIN: Make user admin ────────────────────────────────────────
app.post('/api/auth/make-admin', adminMiddleware, (req, res) => {
  const { email } = req.body;
  db.run('UPDATE users SET role = "admin" WHERE email = ?', [email], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, updated: this.changes });
  });
});

// Bootstrap: make first user admin if no admins exist
app.post('/api/auth/bootstrap-admin', (req, res) => {
  db.get('SELECT COUNT(*) as cnt FROM users WHERE role="admin"', [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row.cnt > 0) return res.status(403).json({ error: 'Admin already exists' });
    const { email } = req.body;
    db.run('UPDATE users SET role="admin" WHERE email=?', [email], function (e) {
      if (e) return res.status(500).json({ error: e.message });
      // Re-sign token
      db.get('SELECT * FROM users WHERE email=?', [email], (e2, user) => {
        if (!user) return res.status(404).json({ error: 'User not found' });
        const token = jwt.sign({ id: user.id, email: user.email, role: 'admin', name: user.name }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, message: 'You are now admin' });
      });
    });
  });
});

// ── ARTICLES ROUTES ──────────────────────────────────────────────

// Public: get all published articles (for home - last 5)
app.get('/api/articles', (req, res) => {
  const { limit, published } = req.query;
  let sql = 'SELECT id, title, excerpt, category, cover_image, author_name, created_at FROM articles WHERE published=1 ORDER BY created_at DESC';
  const params = [];
  if (limit) { sql += ' LIMIT ?'; params.push(parseInt(limit)); }
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Public: get single article
app.get('/api/articles/:id', (req, res) => {
  db.get('SELECT * FROM articles WHERE id=? AND published=1', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  });
});

// Admin: get ALL articles (including drafts)
app.get('/api/admin/articles', adminMiddleware, (req, res) => {
  db.all('SELECT id, title, excerpt, category, published, author_name, created_at FROM articles ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Admin: get single article (full, for editing)
app.get('/api/admin/articles/:id', adminMiddleware, (req, res) => {
  db.get('SELECT * FROM articles WHERE id=?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  });
});

// Admin: create article
app.post('/api/admin/articles', adminMiddleware, (req, res) => {
  const { title, content, excerpt, category, cover_image, published } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content required' });
  const authorName = req.user.name || req.user.email;
  db.run(
    'INSERT INTO articles (title, content, excerpt, category, cover_image, author_id, author_name, published) VALUES (?,?,?,?,?,?,?,?)',
    [title, content, excerpt || '', category || 'Blog', cover_image || '', req.user.id, authorName, published ? 1 : 0],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, message: 'Article created' });
    }
  );
});

// Admin: update article
app.put('/api/admin/articles/:id', adminMiddleware, (req, res) => {
  const { title, content, excerpt, category, cover_image, published } = req.body;
  db.run(
    'UPDATE articles SET title=?, content=?, excerpt=?, category=?, cover_image=?, published=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
    [title, content, excerpt || '', category || 'Blog', cover_image || '', published ? 1 : 0, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Article updated' });
    }
  );
});

// Admin: delete article
app.delete('/api/admin/articles/:id', adminMiddleware, (req, res) => {
  db.run('DELETE FROM articles WHERE id=?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Article deleted' });
  });
});

// Upload image for article
app.post('/api/admin/upload', adminMiddleware, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// ── EXISTING ROUTES (surveys, roles, responses, reports) ─────────

app.get('/api/surveys', (req, res) => {
  db.all("SELECT * FROM surveys", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/surveys/:id', (req, res) => {
  const surveyId = req.params.id;
  db.get("SELECT * FROM surveys WHERE id = ?", [surveyId], (err, survey) => {
    if (err) return res.status(500).json({ error: err.message });
    db.all("SELECT * FROM questions WHERE survey_id = ? ORDER BY order_num ASC", [surveyId], (err2, questions) => {
      if (err2) return res.status(500).json({ error: err2.message });
      const parsedQuestions = questions.map(q => ({ ...q, options: JSON.parse(q.options) }));
      res.json({ ...survey, questions: parsedQuestions });
    });
  });
});

app.get('/api/roles', (req, res) => {
  db.all("SELECT * FROM roles WHERE is_active = 1", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/roles', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  db.run("INSERT INTO roles (name) VALUES (?)", [name], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, name, is_active: 1 });
  });
});

app.delete('/api/roles/:id', (req, res) => {
  db.run("UPDATE roles SET is_active = 0 WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.post('/api/responses', (req, res) => {
  const { surveyId, roleId, answers } = req.body;
  db.run("INSERT INTO responses (survey_id, role_id, answers) VALUES (?, ?, ?)",
    [surveyId, roleId, JSON.stringify(answers)], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    });
});

app.get('/api/reports/:surveyId', (req, res) => {
  const sql = `
    SELECT r.id, roles.name as role_name, r.answers, r.timestamp 
    FROM responses r
    JOIN roles ON r.role_id = roles.id
    WHERE r.survey_id = ?
    ORDER BY r.timestamp DESC
  `;
  db.all(sql, [req.params.surveyId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const reports = rows.map(r => ({ ...r, answers: JSON.parse(r.answers) }));
    res.json(reports);
  });
});

// ── SUPERADMIN ROUTES ────────────────────────────────────────────
// Lista tutti gli utenti
app.get('/api/superadmin/users', superadminMiddleware, (req, res) => {
  db.all(
    'SELECT id, email, name, role, gdpr_consent, created_at FROM users ORDER BY created_at DESC',
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Cambia ruolo a un utente
app.put('/api/superadmin/users/:id/role', superadminMiddleware, (req, res) => {
  const { role } = req.body;
  const allowed = ['user', 'admin', 'superadmin'];
  if (!allowed.includes(role)) return res.status(400).json({ error: 'Invalid role' });
  if (parseInt(req.params.id) === req.user.id && role !== 'superadmin')
    return res.status(400).json({ error: 'Cannot change your own superadmin role' });
  db.run('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, message: `Role updated to ${role}` });
  });
});

// Reset password di qualsiasi utente
app.put('/api/superadmin/users/:id/password', superadminMiddleware, async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) return res.status(400).json({ error: 'Min 6 characters' });
  try {
    const hash = await bcrypt.hash(password, 12);
    db.run('UPDATE users SET password = ? WHERE id = ?', [hash, req.params.id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Elimina utente
app.delete('/api/superadmin/users/:id', superadminMiddleware, (req, res) => {
  if (parseInt(req.params.id) === req.user.id)
    return res.status(400).json({ error: 'Cannot delete yourself' });
  db.run('DELETE FROM users WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ── SPA fallback ─────────────────────────────────────────────────
app.get('/{*path}', (req, res) => {
  const distIndex = path.join(__dirname, '../dist/index.html');
  if (fs.existsSync(distIndex)) res.sendFile(distIndex);
  else res.json({ status: 'API running', version: '2.0' });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
