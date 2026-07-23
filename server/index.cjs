require('dotenv').config({ path: __dirname + '/.env' });

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const sanitizeHtml = require('sanitize-html');
const crypto = require('crypto');

const app = express();

function sanitizeArticleHtml(html) {
  if (!html) return '';
  return sanitizeHtml(html, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
      'li', 'b', 'i', 'strong', 'em', 'u', 'strike', 'code', 'pre', 'br', 'hr', 'img', 'span', 'div'
    ],
    allowedAttributes: {
      a: [ 'href', 'name', 'target', 'rel' ],
      img: [ 'src', 'alt', 'title', 'width', 'height' ],
      span: [ 'style' ],
      div: [ 'style' ]
    },
    allowedSchemes: [ 'http', 'https', 'ftp', 'mailto', 'tel' ]
  });
}

function stripAllTags(str) {
  if (!str) return '';
  return sanitizeHtml(str, {
    allowedTags: [],
    allowedAttributes: {}
  });
}

function sanitizeExistingArticles() {
  db.all('SELECT id, content, title, excerpt, category FROM articles', [], (err, rows) => {
    if (err || !rows) return;
    rows.forEach(row => {
      const cleanContent = sanitizeArticleHtml(row.content);
      const cleanTitle = stripAllTags(row.title);
      const cleanExcerpt = stripAllTags(row.excerpt);
      const cleanCategory = stripAllTags(row.category);
      
      if (cleanContent !== row.content || cleanTitle !== row.title || cleanExcerpt !== row.excerpt || cleanCategory !== row.category) {
        db.run(
          'UPDATE articles SET content = ?, title = ?, excerpt = ?, category = ? WHERE id = ?',
          [cleanContent, cleanTitle, cleanExcerpt, cleanCategory, row.id]
        );
      }
    });
    console.log('✅ Bonificación/Sanitización de artículos existentes en DB finalizada.');
  });
}
const PORT = process.env.PORT || 3000;

// ── Sicurezza: variabili obbligatorie ───────────────────────────
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('\n❌ FATAL: JWT_SECRET non impostato nelle variabili ambiente.');
  console.error('   Imposta JWT_SECRET su Railway prima di avviare il server.\n');
  process.exit(1);
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  console.error('\n❌ FATAL: ADMIN_PASSWORD non impostato nelle variabili ambiente.');
  console.error('   Imposta ADMIN_PASSWORD su Railway prima di avviare il server.\n');
  process.exit(1);
}

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

// Whitelist MIME: solo immagini
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_EXTS = /\.(jpg|jpeg|png|webp|gif)$/i;

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype) && ALLOWED_EXTS.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo se aceptan imágenes JPG, PNG, WebP o GIF.'));
    }
  }
});

// ── Security Middleware ──────────────────────────────────────────
app.disable('x-powered-by');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://accounts.google.com', 'https://www.googletagmanager.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'https://www.google-analytics.com'],
      connectSrc: ["'self'", 'https://prospectaexistov2-production.up.railway.app', 'https://www.google-analytics.com', 'https://analytics.google.com', 'https://www.googletagmanager.com'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  frameguard: { action: 'deny' },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

app.use(cors({
  origin: [
    FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:5173',
    'https://www.prospectaconexito.com',
    'https://prospectaconexito.com'
  ],
  credentials: true
}));

// ── Rate Limiters ────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 20,                   // max 20 tentativi per finestra
  message: { error: 'Demasiados intentos. Por favor espera 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false
});

const surveyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ora
  max: 30,
  message: { error: 'Demasiados envíos. Por favor espera.' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(express.static(path.join(__dirname, '../dist'), {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (filePath.includes(path.sep + 'assets' + path.sep) || filePath.includes(path.sep + 'fonts' + path.sep)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    }
  }
}));
app.use('/uploads', express.static(uploadDir, {
  maxAge: '1d',
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
}));

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

    // Indice UNIQUE sul titolo — previene duplicati anche dopo redeploy
    db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_title ON articles(title)`);

    // Pulizia preventiva duplicati (per eventuali DB già sporchi)
    db.run(`DELETE FROM articles WHERE id NOT IN (SELECT MIN(id) FROM articles GROUP BY title)`);

    // Schema updates for GDPR compliance V2
    db.run("ALTER TABLE users ADD COLUMN marketing_consent INTEGER DEFAULT 0", [], (err) => {
      // Ignore if column already exists
    });
    db.run("ALTER TABLE users ADD COLUMN gdpr_policy_version TEXT", [], (err) => {
      // Ignore if column already exists
    });

    // Create newsletter subscriptions table with double opt-in logs
    db.run(`CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'pending',
      token TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      confirmed_at DATETIME
    )`);

    console.log('All tables ready.');
    autoSeed();
    sanitizeExistingArticles();
  });
}

// ── Auto-seed (solo se DB è vuoto) ───────────────────────────────
async function autoSeed() {
  const bcrypt = require('bcryptjs');

  // 1. Superadmin
  db.get('SELECT id FROM users WHERE email = ?', ['baraccoy@gmail.com'], async (err, existing) => {
    if (err || existing) return; // già esiste, skip
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    db.run(
      `INSERT INTO users (email, password, name, role, gdpr_consent, gdpr_date)
       VALUES (?, ?, ?, 'superadmin', 1, CURRENT_TIMESTAMP)`,
      ['baraccoy@gmail.com', hash, 'Fernando Baccari'],
      function(e) {
        if (e) return console.error('Seed superadmin error:', e.message);
        console.log('✅ Superadmin auto-seeded (id:', this.lastID, ')');
        seedArticles(this.lastID); // seed articoli dopo aver creato l'utente
      }
    );
  });

  // 2. Roles predefiniti
  db.get('SELECT COUNT(*) as n FROM roles', [], (err, row) => {
    if (err || row.n > 0) return;
    const roles = ['SDR', 'Account Executive', 'Sales Manager', 'Director Comercial', 'Business Developer'];
    roles.forEach(name => db.run('INSERT INTO roles (name, is_active) VALUES (?, 1)', [name]));
    console.log('✅ Roles auto-seeded:', roles.join(', '));
  });

  // 3. Survey di default
  db.get('SELECT COUNT(*) as n FROM surveys', [], (err, row) => {
    if (err || row.n > 0) return;
    db.run(
      `INSERT INTO surveys (title, description) VALUES (?, ?)`,
      ['Diagnóstico de Prospección 2026', 'Evaluación del nivel de madurez en prospección comercial B2B para empresas en mercados hispanohablantes.'],
      function(e) {
        if (e) return;
        const sid = this.lastID;
        const questions = [
          { text: '¿Cuántas reuniones cualificadas generas por semana?', type: 'radio', options: '["0-1","2-3","4-6","7+"]', order_num: 1 },
          { text: '¿Qué canales usas habitualmente para prospectar?', type: 'checkbox', options: '["LinkedIn","Email frío","Teléfono","Eventos/networking","Referidos"]', order_num: 2 },
          { text: '¿Tienes una cadencia de prospección documentada?', type: 'radio', options: '["Sí, siempre la sigo","Tengo una pero no siempre","No tengo cadencia","Estoy construyendo una"]', order_num: 3 },
          { text: '¿Cuál es tu mayor dificultad en prospección?', type: 'text', options: '[]', order_num: 4 },
          { text: 'En una escala del 1 al 10, ¿cómo valorarías tu proceso actual de prospección?', type: 'scale', options: '[]', order_num: 5 }
        ];
        questions.forEach(q =>
          db.run('INSERT INTO questions (survey_id, text, type, options, order_num) VALUES (?,?,?,?,?)',
            [sid, q.text, q.type, q.options, q.order_num])
        );
        console.log('✅ Survey + 5 domande auto-seeded');
      }
    );
  });

  // 4. Articoli (solo se non ce ne sono già)
  db.get('SELECT COUNT(*) as n FROM articles', [], (err, row) => {
    if (err || row.n > 0) return;
    db.get('SELECT id FROM users WHERE email = ?', ['baraccoy@gmail.com'], (e2, author) => {
      if (e2 || !author) return;
      seedArticles(author.id);
    });
  });
}

function seedArticles(authorId) {
  // Controlla se ci sono già articoli per evitare duplicati
  db.get('SELECT COUNT(*) as n FROM articles', [], (err, row) => {
    if (err || row.n > 0) return;

    const articles = [
      {
        title: 'Cómo hacer prospección B2B efectiva en 2026',
        category: 'Guía',
        excerpt: 'El mercado está saturado y los decisores ya no responden al volumen. Descubre cómo construir un sistema de prospección B2B que genera pipeline de forma predecible.',
        cover_image: '/uploads/b2b_prospecting_2026.png',
        content: '<h2>Introducción</h2><p>La prospección B2B en 2026 ya no funciona con volumen. El mercado está saturado: los decisores reciben decenas de mensajes al día y su atención es un recurso escaso. Quien sigue enviando mensajes genéricos en masa no solo no obtiene respuestas, sino que daña su reputación comercial.</p><h2>Cómo estructurar una prospección efectiva</h2><p>Define tu ICP, construye listas cualificadas, diseña una cadencia multicanal y personaliza de forma escalable. Mide y ajusta constantemente.</p><h2>Conclusión</h2><p>La prospección B2B efectiva en 2026 no es una cuestión de volumen, sino de sistema.</p>'
      },
      {
        title: 'Prospección en LinkedIn: guía completa para 2026',
        category: 'Guía',
        excerpt: 'LinkedIn es el canal B2B más potente hoy en día. Pero su saturación obliga a cambiar el enfoque.',
        cover_image: '/uploads/linkedin_prospecting.png',
        content: '<h2>Introducción</h2><p>LinkedIn se ha convertido en el canal de referencia para la prospección B2B. Sin embargo, su popularidad también ha generado saturación.</p><h2>Estrategia de contacto</h2><p>Interactúa antes de contactar. Personaliza cada mensaje. Aporta valor antes de pedir algo.</p><h2>Conclusión</h2><p>LinkedIn no es un canal de volumen. Es un canal de precisión.</p>'
      },
      {
        title: 'Cómo escribir emails en frío que generan respuestas',
        category: 'Blog',
        excerpt: 'El email sigue siendo uno de los canales más efectivos en prospección B2B. Pero el 90% falla por los mismos motivos.',
        cover_image: '/uploads/cold_email.png',
        content: '<h2>Introducción</h2><p>El email frío tiene mala reputación, y en muchos casos merecida. La mayoría son largos, genéricos y centrados en quien los envía.</p><h2>Las claves</h2><p>Asunto específico, personalización real, brevedad y CTA simple de bajo compromiso.</p><h2>Conclusión</h2><p>Un buen email frío genera curiosidad. No vende directamente, abre una puerta.</p>'
      },
      {
        title: 'El rol del SDR en 2026: más estratégico, menos operativo',
        category: 'Blog',
        excerpt: 'La automatización ha cambiado el rol del SDR para siempre. Lo que queda es más exigente, más valioso y más humano.',
        cover_image: '/uploads/sdr_2026.png',
        content: '<h2>Introducción</h2><p>El rol del SDR está viviendo una transformación profunda. El modelo de volumen ya no funciona.</p><h2>Habilidades clave</h2><p>Pensamiento estratégico, claridad en la comunicación, uso inteligente de la tecnología y adaptabilidad cultural.</p><h2>Conclusión</h2><p>El futuro del SDR es más inteligente, no más operativo.</p>'
      }
    ];

    const stmt = db.prepare(
      'INSERT OR IGNORE INTO articles (title, content, excerpt, category, cover_image, author_id, author_name, published) VALUES (?,?,?,?,?,?,?,1)'
    );
    articles.forEach(a => stmt.run(a.title, a.content, a.excerpt, a.category, a.cover_image, authorId, 'Fernando Baccari'));
    stmt.finalize(() => console.log('✅ Seed articoli completato (INSERT OR IGNORE — nessun duplicato possibile)'));
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

// Newsletter consent registration utility
function registerNewsletterSubscriptionInternal(email, req) {
  const token = crypto.randomBytes(32).toString('hex');
  const ip = (req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || '').replace(/:\d+$/, '');
  const anonymizedIp = ip.split('.').slice(0, 3).join('.') + '.xxx'; // GDPR/AEPD log anonymization
  
  db.run(
    "INSERT OR REPLACE INTO newsletter_subscriptions (email, status, token, ip_address) VALUES (?, 'pending', ?, ?)",
    [email, token, anonymizedIp],
    function (err) {
      if (err) {
        console.error('Error inserting newsletter subscription:', err.message);
        return;
      }
      const host = req.get('host') || 'localhost:3000';
      const protocol = req.protocol || 'http';
      const confirmUrl = `${protocol}://${host}/api/newsletter/confirm?token=${token}`;
      console.log(`[NEWSLETTER DUMMY MAILER] Consent proof generated for ${email}. Confirm url: ${confirmUrl}`);
    }
  );
}

// Register
app.post('/api/auth/register', authLimiter, async (req, res) => {
  const { email, password, name, gdpr_consent, marketing_consent } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  if (!gdpr_consent) return res.status(400).json({ error: 'GDPR consent required' });

  try {
    const hash = await bcrypt.hash(password, 12);
    const marketingVal = marketing_consent ? 1 : 0;
    db.run(
      "INSERT INTO users (email, password, name, gdpr_consent, gdpr_date, marketing_consent, gdpr_policy_version) VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP, ?, 'v2.0')",
      [email, hash, name || email.split('@')[0], marketingVal],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email already registered' });
          return res.status(500).json({ error: err.message });
        }
        
        if (marketing_consent) {
          registerNewsletterSubscriptionInternal(email, req);
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
app.post('/api/auth/login', authLimiter, (req, res) => {
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

    // Decoupled GDPR Verification on Google Login
    db.get('SELECT * FROM users WHERE email = ? OR google_id = ?', [email, googleId], (err, user) => {
      if (err) return res.redirect(`${FRONTEND_URL}/login.html?error=db_error`);

      if (user && user.gdpr_consent === 1) {
        // User already has given consent: issue temporary auth code inside oauth_token cookie
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
        res.cookie('oauth_token', token, {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          maxAge: 5 * 60 * 1000,
          path: '/'
        });
        return res.redirect(`${FRONTEND_URL}/login.html?exchange=1`);
      } else {
        // New user or has no gdpr_consent: issue a temporary registration state token
        const tempToken = jwt.sign({ tempRegister: true, googleId, email, name }, JWT_SECRET, { expiresIn: '15m' });
        res.cookie('oauth_token', tempToken, {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          maxAge: 5 * 60 * 1000,
          path: '/'
        });
        return res.redirect(`${FRONTEND_URL}/login.html?exchange=1`);
      }
    });
  } catch (e) {
    console.error('Google OAuth error:', e);
    res.redirect(`${FRONTEND_URL}/login.html?error=google_error`);
  }
});

// Secure code exchange endpoint (V2 supporting decoupled consent)
app.post('/api/auth/exchange-token', (req, res) => {
  const cookies = req.headers.cookie;
  if (!cookies) return res.status(401).json({ error: 'No session cookie found' });

  const match = cookies.match(/(?:^|; )oauth_token=([^;]*)/);
  if (!match) return res.status(401).json({ error: 'No active OAuth session found' });

  const token = match[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    res.clearCookie('oauth_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/'
    });

    if (decoded.tempRegister) {
      // Client must trigger the GDPR screen
      return res.json({ require_consent: true, temp_token: token });
    }

    res.json({
      token,
      user: {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role
      }
    });
  } catch (e) {
    res.status(401).json({ error: 'OAuth session has expired or is invalid' });
  }
});

// Completing OAuth registrations with explicit consent
app.post('/api/auth/accept-consent', (req, res) => {
  const { token, marketing_consent } = req.body;
  if (!token) return res.status(400).json({ error: 'Consent token required' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.tempRegister) return res.status(400).json({ error: 'Invalid consent token' });

    const { googleId, email, name } = decoded;
    const marketingVal = marketing_consent ? 1 : 0;

    db.get('SELECT * FROM users WHERE email = ? OR google_id = ?', [email, googleId], (err, user) => {
      if (err) return res.status(500).json({ error: err.message });

      const upsert = user
        ? { sql: "UPDATE users SET google_id=?, name=?, gdpr_consent=1, gdpr_date=CURRENT_TIMESTAMP, marketing_consent=?, gdpr_policy_version='v2.0' WHERE id=?", params: [googleId, name, marketingVal, user.id], role: user.role, id: user.id }
        : { sql: "INSERT INTO users (email, google_id, name, gdpr_consent, gdpr_date, marketing_consent, gdpr_policy_version, role) VALUES (?,?,?,1,CURRENT_TIMESTAMP,?, 'v2.0', 'user')", params: [email, googleId, name, marketingVal], role: 'user', id: null };

      db.run(upsert.sql, upsert.params, function(e2) {
        if (e2) return res.status(500).json({ error: e2.message });
        const userId = upsert.id || this.lastID;
        const role = user ? user.role : 'user';

        if (marketing_consent) {
          registerNewsletterSubscriptionInternal(email, req);
        }

        const authToken = jwt.sign({ id: userId, email, role, name }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
          token: authToken,
          user: { id: userId, email, name, role }
        });
      });
    });
  } catch (e) {
    res.status(401).json({ error: 'Consent token has expired or is invalid' });
  }
});



// ── GERTRUDE GDPR COMPLIANCE & NEWSLETTER ENDPOINTS ──────────────────

// Export personal account data (Portability)
app.get('/api/users/me/export', authMiddleware, (req, res) => {
  db.get(
    'SELECT id, name, email, role, gdpr_consent, gdpr_date, marketing_consent, gdpr_policy_version, created_at FROM users WHERE id = ?',
    [req.user.id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'User not found' });
      
      db.get('SELECT * FROM newsletter_subscriptions WHERE email = ?', [row.email], (err2, subRow) => {
        const personalData = {
          account_details: row,
          newsletter_subscription: subRow || null
        };
        res.setHeader('Content-Disposition', 'attachment; filename="prospecta_personal_data.json"');
        res.json(personalData);
      });
    }
  );
});

// Delete user account cascadingally (Right to Erasure)
app.delete('/api/users/me', authMiddleware, (req, res) => {
  const userId = req.user.id;
  db.get('SELECT email FROM users WHERE id = ?', [userId], (err, user) => {
    if (err || !user) return res.status(404).json({ error: 'User not found' });
    const userEmail = user.email;

    db.serialize(() => {
      db.run('DELETE FROM newsletter_subscriptions WHERE email = ?', [userEmail]);
      db.run('DELETE FROM users WHERE id = ?', [userId], function (err2) {
        if (err2) return res.status(500).json({ error: err2.message });
        console.log(`[GDPR ERASURE] User ${userEmail} completely erased.`);
        res.json({ success: true, message: 'Account completely and permanently erased.' });
      });
    });
  });
});

// Newsletter Subscribe (Double Opt-in trigger)
app.post('/api/newsletter/subscribe', (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Email inválido' });

  const token = crypto.randomBytes(32).toString('hex');
  const ip = (req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || '').replace(/:\d+$/, '');
  const anonymizedIp = ip.split('.').slice(0, 3).join('.') + '.xxx'; // Anonymize IP

  db.run(
    "INSERT OR REPLACE INTO newsletter_subscriptions (email, status, token, ip_address) VALUES (?, 'pending', ?, ?)",
    [email, token, anonymizedIp],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      
      const host = req.get('host') || 'localhost:3000';
      const protocol = req.protocol || 'http';
      const confirmUrl = `${protocol}://${host}/api/newsletter/confirm?token=${token}`;
      console.log(`[NEWSLETTER DUMMY MAILER] Confirm subscription link: ${confirmUrl}`);
      
      res.json({ success: true, message: 'Double opt-in email sent' });
    }
  );
});

// Newsletter Confirm
app.get('/api/newsletter/confirm', (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send('<h3>Token de confirmación faltante</h3>');
  
  db.get('SELECT * FROM newsletter_subscriptions WHERE token = ?', [token], (err, row) => {
    if (err) return res.status(500).send('Error de base de datos');
    if (!row) return res.status(400).send('<h3>Enlace de confirmación inválido o expirado</h3>');
    
    db.run(
      "UPDATE newsletter_subscriptions SET status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP WHERE token = ?",
      [token],
      (err2) => {
        if (err2) return res.status(500).send('Error actualizando suscripción');
        res.send(`
          <div style="font-family:sans-serif; text-align:center; padding:3rem; color:#1B3B5A">
            <h2>🎉 ¡Suscripción confirmada!</h2>
            <p>Gracias por suscribirte a la newsletter de Prospecta con Éxito.</p>
            <p><a href="/" style="color:#5D9CB5; font-weight:600; text-decoration:none">Volver a la página principal</a></p>
          </div>
        `);
      }
    );
  });
});

// Newsletter Unsubscribe
app.get('/api/newsletter/unsubscribe', (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).send('<h3>Email faltante</h3>');
  
  db.run('DELETE FROM newsletter_subscriptions WHERE email = ?', [email], (err) => {
    if (err) return res.status(500).send('Error al dar de baja');
    res.send(`
      <div style="font-family:sans-serif; text-align:center; padding:3rem; color:#1B3B5A">
        <h2>✅ Te has dado de baja de la newsletter</h2>
        <p>Tu correo electrónico ha sido eliminado de nuestra lista de correo.</p>
        <p><a href="/" style="color:#5D9CB5; font-weight:600; text-decoration:none">Volver a la página principal</a></p>
      </div>
    `);
  });
});

// Periodic GDPR Data Minimization Cleanup scheduler (runs every 24 hours)
setInterval(() => {
  console.log('[GDPR CLEANUP JOB] Starting periodic cleanup...');
  // 1. Delete users who initiated signup (OAuth or email) but never completed GDPR consent after 7 days
  db.run("DELETE FROM users WHERE gdpr_consent = 0 AND created_at < date('now', '-7 days')", [], function(err) {
    if (err) console.error('[GDPR CLEANUP JOB] Error cleaning unconsented users:', err.message);
    else if (this.changes > 0) console.log(`[GDPR CLEANUP JOB] Suppressed ${this.changes} unconsented accounts.`);
  });

  // 2. Delete survey responses older than 1 year (as announced in the privacy policy)
  db.run("DELETE FROM responses WHERE timestamp < date('now', '-1 year')", [], function(err) {
    if (err) console.error('[GDPR CLEANUP JOB] Error cleaning old survey responses:', err.message);
    else if (this.changes > 0) console.log(`[GDPR CLEANUP JOB] Purged ${this.changes} outdated survey responses.`);
  });
}, 24 * 60 * 60 * 1000);


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
  
  const cleanTitle = stripAllTags(title);
  const cleanContent = sanitizeArticleHtml(content);
  const cleanExcerpt = stripAllTags(excerpt);
  const cleanCategory = stripAllTags(category);
  const cleanCoverImage = stripAllTags(cover_image);
  
  const authorName = req.user.name || req.user.email;
  db.run(
    'INSERT INTO articles (title, content, excerpt, category, cover_image, author_id, author_name, published) VALUES (?,?,?,?,?,?,?,?)',
    [cleanTitle, cleanContent, cleanExcerpt || '', cleanCategory || 'Blog', cleanCoverImage || '', req.user.id, authorName, published ? 1 : 0],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, message: 'Article created' });
    }
  );
});

// Admin: update article
app.put('/api/admin/articles/:id', adminMiddleware, (req, res) => {
  const { title, content, excerpt, category, cover_image, published } = req.body;
  
  const cleanTitle = stripAllTags(title);
  const cleanContent = sanitizeArticleHtml(content);
  const cleanExcerpt = stripAllTags(excerpt);
  const cleanCategory = stripAllTags(category);
  const cleanCoverImage = stripAllTags(cover_image);

  db.run(
    'UPDATE articles SET title=?, content=?, excerpt=?, category=?, cover_image=?, published=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
    [cleanTitle, cleanContent, cleanExcerpt || '', cleanCategory || 'Blog', cleanCoverImage || '', published ? 1 : 0, req.params.id],
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
app.post('/api/admin/upload', adminMiddleware, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ url: `/uploads/${req.file.filename}` });
  });
});

// ── SURVEY MANAGEMENT (admin) ─────────────────────────────────────

// Crea nuova encuesta
app.post('/api/admin/surveys', adminMiddleware, (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  db.run('INSERT INTO surveys (title, description) VALUES (?, ?)', [title, description || ''], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, title, description });
  });
});

// Aggiorna encuesta
app.put('/api/admin/surveys/:id', adminMiddleware, (req, res) => {
  const { title, description } = req.body;
  db.run('UPDATE surveys SET title=?, description=? WHERE id=?', [title, description || '', req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Elimina encuesta (e tutte le sue domande)
app.delete('/api/admin/surveys/:id', adminMiddleware, (req, res) => {
  db.run('DELETE FROM questions WHERE survey_id=?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    db.run('DELETE FROM surveys WHERE id=?', [req.params.id], function (err2) {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ success: true });
    });
  });
});

// Aggiungi domanda a una encuesta
app.post('/api/admin/surveys/:id/questions', adminMiddleware, (req, res) => {
  const { text, type, options, category } = req.body;
  if (!text) return res.status(400).json({ error: 'Question text required' });
  const optionsJson = JSON.stringify(options || []);
  db.get('SELECT MAX(order_num) as maxOrder FROM questions WHERE survey_id=?', [req.params.id], (err, row) => {
    const nextOrder = (row?.maxOrder || 0) + 1;
    db.run(
      'INSERT INTO questions (survey_id, text, type, options, category, order_num) VALUES (?,?,?,?,?,?)',
      [req.params.id, text, type || 'radio', optionsJson, category || '', nextOrder],
      function (err2) {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ id: this.lastID, text, type, options: options || [], category, order_num: nextOrder });
      }
    );
  });
});

// Aggiorna domanda
app.put('/api/admin/questions/:id', adminMiddleware, (req, res) => {
  const { text, type, options, category, order_num } = req.body;
  const optionsJson = JSON.stringify(options || []);
  db.run(
    'UPDATE questions SET text=?, type=?, options=?, category=?, order_num=? WHERE id=?',
    [text, type || 'radio', optionsJson, category || '', order_num, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// Elimina domanda
app.delete('/api/admin/questions/:id', adminMiddleware, (req, res) => {
  db.run('DELETE FROM questions WHERE id=?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Riordina domande (riceve array [{id, order_num}])
app.put('/api/admin/surveys/:id/questions/reorder', adminMiddleware, (req, res) => {
  const { order } = req.body; // [{id:1, order_num:1}, ...]
  if (!Array.isArray(order)) return res.status(400).json({ error: 'order array required' });
  const stmt = db.prepare('UPDATE questions SET order_num=? WHERE id=?');
  order.forEach(({ id, order_num }) => stmt.run(order_num, id));
  stmt.finalize(() => res.json({ success: true }));
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

app.post('/api/roles', adminMiddleware, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  db.run("INSERT INTO roles (name) VALUES (?)", [name], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, name, is_active: 1 });
  });
});

app.delete('/api/roles/:id', adminMiddleware, (req, res) => {
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

app.get('/api/reports/:surveyId', adminMiddleware, (req, res) => {
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
  else res.status(404).json({ error: 'Not found' });
});

// ── Global Error Handler ─────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.message && err.message.includes('Tipo de archivo')) {
    return res.status(400).json({ error: err.message });
  }
  console.error('[ERROR]', err.message);
  const isProd = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    error: isProd ? 'Internal server error' : err.message
  });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
