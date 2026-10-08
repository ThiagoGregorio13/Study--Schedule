import Database from "better-sqlite3"

const db = new Database("dados.db")

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    passwordHash TEXT NOT NULL,
    emailVerified INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS email_verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    code TEXT NOT NULL,
    expiresAt INTEGER NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    subject TEXT,
    completed INTEGER NOT NULL DEFAULT 0,
    userId INTEGER NOT NULL,
    notes TEXT DEFAULT '',
    images TEXT DEFAULT '[]',
    FOREIGN KEY (userId) REFERENCES users(id)
  );
`)

// Migrações para bancos antigos que ainda não têm essas colunas.
// Se a coluna já existe, o SQLite lança "duplicate column name": ignoramos só esse caso.
function addColumn(sql: string) {
  try {
    db.exec(sql)
  } catch (error: any) {
    if (!String(error?.message).includes("duplicate column name")) {
      throw error
    }
  }
}

addColumn("ALTER TABLE topics ADD COLUMN notes TEXT DEFAULT ''")
addColumn("ALTER TABLE topics ADD COLUMN images TEXT DEFAULT '[]'")
addColumn(
  "ALTER TABLE users ADD COLUMN emailVerified INTEGER NOT NULL DEFAULT 0"
)

export default db
