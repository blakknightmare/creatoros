import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'creatoros.db');

let db: SqlJsDatabase | null = null;

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

export async function getDb(): Promise<SqlJsDatabase> {
  if (!db) {
    ensureDir(path.dirname(DB_PATH));
    const SQL = await initSqlJs();

    if (fs.existsSync(DB_PATH)) {
      const fileBuffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(fileBuffer);
    } else {
      db = new SQL.Database();
    }
  }
  return db;
}

export async function initDb(): Promise<void> {
  const database = await getDb();

  database.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Migration: add subscription/usage columns if they don't exist
  try { database.run(`ALTER TABLE users ADD COLUMN tier TEXT DEFAULT 'free'`); } catch (_) { /* already exists */ }
  try { database.run(`ALTER TABLE users ADD COLUMN daily_generation_count INTEGER DEFAULT 0`); } catch (_) { /* already exists */ }
  try { database.run(`ALTER TABLE users ADD COLUMN daily_generation_date TEXT`); } catch (_) { /* already exists */ }
  try { database.run(`ALTER TABLE users ADD COLUMN stripe_customer_id TEXT`); } catch (_) { /* already exists */ }
  try { database.run(`ALTER TABLE users ADD COLUMN batch_generation_count INTEGER DEFAULT 0`); } catch (_) { /* already exists */ }

  // Ensure existing users have defaults for new columns
  database.run(`UPDATE users SET tier = 'free' WHERE tier IS NULL`);
  database.run(`UPDATE users SET daily_generation_count = 0 WHERE daily_generation_count IS NULL`);
  database.run(`UPDATE users SET batch_generation_count = 0 WHERE batch_generation_count IS NULL`);

  database.run(`
    CREATE TABLE IF NOT EXISTS brand_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      raw_description TEXT,
      business_name TEXT,
      niche TEXT,
      audience TEXT,
      tone TEXT,
      tone_of_voice TEXT,
      goals TEXT,
      offers TEXT,
      key_offers TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Migration: add new columns if they don't exist (sql.js doesn't support ALTER TABLE ADD COLUMN IF NOT EXISTS)
  try { database.run(`ALTER TABLE brand_profiles ADD COLUMN raw_description TEXT`); } catch (_) { /* already exists */ }
  try { database.run(`ALTER TABLE brand_profiles ADD COLUMN tone_of_voice TEXT`); } catch (_) { /* already exists */ }
  try { database.run(`ALTER TABLE brand_profiles ADD COLUMN key_offers TEXT`); } catch (_) { /* already exists */ }

  database.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content_type TEXT NOT NULL,
      topic TEXT,
      generated_content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS calendar_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      project_id INTEGER NOT NULL,
      scheduled_date TEXT NOT NULL,
      platform TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  saveDb();
  console.log('Database initialized successfully');
}
