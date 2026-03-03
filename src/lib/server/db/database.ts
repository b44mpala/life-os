import Database from 'better-sqlite3';

const db = new Database('lifeos.db');

db.exec(`PRAGMA foreign_keys = ON;`);

/* =========================
   SCHEMA VERSION
========================= */

db.exec(`
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY
);
`);

const version = db.prepare(
  `SELECT version FROM schema_version ORDER BY version DESC LIMIT 1`
).get() as { version: number } | undefined;

if (!version) {
  db.prepare(`INSERT INTO schema_version (version) VALUES (2)`).run();
}

/* =========================
   PROJECTS
========================= */

db.exec(`
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  flourishing_tag TEXT NOT NULL,
  timeline_start TEXT NOT NULL,
  timeline_end TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  progress_cached REAL DEFAULT 0,
  CHECK (timeline_end > timeline_start)
);
`);

/* =========================
   ROCKS
========================= */

db.exec(`
CREATE TABLE IF NOT EXISTS rocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  timeline_start TEXT NOT NULL,
  timeline_end TEXT NOT NULL,
  progress_cached REAL DEFAULT 0,
  FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CHECK (timeline_end > timeline_start)
);
`);

/* =========================
   TASKS
========================= */

db.exec(`
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rock_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  completed INTEGER DEFAULT 0 CHECK (completed IN (0,1)),
  FOREIGN KEY(rock_id) REFERENCES rocks(id) ON DELETE CASCADE
);
`);

/* =========================
   PROJECT LINKS
========================= */

db.exec(`
CREATE TABLE IF NOT EXISTS project_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  linked_project_id INTEGER NOT NULL,
  link_type TEXT DEFAULT 'related' CHECK (link_type IN ('related','dependency')),
  UNIQUE(project_id, linked_project_id),
  FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY(linked_project_id) REFERENCES projects(id) ON DELETE CASCADE
);
`);

/* =========================
   TIMELINE LOGS
========================= */

db.exec(`
CREATE TABLE IF NOT EXISTS timeline_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  previous_end TEXT,
  new_end TEXT,
  event_type TEXT,
  reason TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

/* =========================
   SETTINGS
========================= */

db.exec(`
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
`);

/* =========================
   DEFAULT SETTINGS
========================= */

db.prepare(`
INSERT INTO settings (key,value)
VALUES ('dependency_mode','soft')
ON CONFLICT(key) DO NOTHING
`).run();

export default db;