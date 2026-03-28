/**
 * Seed script — crea o aggiorna il superadmin
 * Uso: node server/seed-superadmin.cjs
 *
 * Per cambiare password in futuro, modifica SUPERADMIN_PASSWORD e riesegui.
 */

require('dotenv').config({ path: __dirname + '/.env' });
const sqlite3 = require('sqlite3').verbose();
const bcrypt  = require('bcryptjs');
const path    = require('path');

// ── Configurazione superadmin ──────────────────────────────────────
const SUPERADMIN_EMAIL    = 'baraccoy@gmail.com';
const SUPERADMIN_PASSWORD = '12345buba88';
const SUPERADMIN_NAME     = 'Fernando Baccari';
// ──────────────────────────────────────────────────────────────────

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

async function seed() {
  const hash = await bcrypt.hash(SUPERADMIN_PASSWORD, 12);

  db.get('SELECT id FROM users WHERE email = ?', [SUPERADMIN_EMAIL], (err, existing) => {
    if (err) { console.error('DB error:', err.message); process.exit(1); }

    if (existing) {
      // Aggiorna password e ruolo (utile per cambiare password in futuro)
      db.run(
        'UPDATE users SET password = ?, role = ?, name = ? WHERE email = ?',
        [hash, 'superadmin', SUPERADMIN_NAME, SUPERADMIN_EMAIL],
        (err2) => {
          if (err2) { console.error('Update error:', err2.message); process.exit(1); }
          console.log(`✅ Superadmin aggiornato: ${SUPERADMIN_EMAIL} (role: superadmin)`);
          db.close();
        }
      );
    } else {
      // Crea nuovo superadmin
      db.run(
        `INSERT INTO users (email, password, name, role, gdpr_consent, gdpr_date)
         VALUES (?, ?, ?, 'superadmin', 1, CURRENT_TIMESTAMP)`,
        [SUPERADMIN_EMAIL, hash, SUPERADMIN_NAME],
        function (err2) {
          if (err2) { console.error('Insert error:', err2.message); process.exit(1); }
          console.log(`✅ Superadmin creato: ${SUPERADMIN_EMAIL} (id: ${this.lastID})`);
          db.close();
        }
      );
    }
  });
}

seed().catch(e => { console.error(e); process.exit(1); });
