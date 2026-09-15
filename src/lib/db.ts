import path from 'node:path'
import Database from 'better-sqlite3'

const globalForDb = globalThis as unknown as { db?: Database.Database }

const dbPath = path.resolve(
  process.cwd(),
  process.env.DB_PATH ?? './data/quotes.db',
)

export const db = globalForDb.db ?? new Database(dbPath)

if (process.env.NODE_ENV !== 'production') {
  globalForDb.db = db
}
