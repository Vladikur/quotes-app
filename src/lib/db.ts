import path from 'node:path'
import Database from 'better-sqlite3'

const globalForDb = globalThis as unknown as { db?: Database.Database }

// turbopackIgnore: без него сборщик видит нестатический путь, считает, что
// трассировать надо весь проект, и тащит в .next/standalone всю папку data —
// то есть сам файл БД на 138MB. Путь тут чисто рантаймовый, трассировать в нём
// нечего.
const dbPath = path.resolve(
  /* turbopackIgnore: true */ process.cwd(),
  process.env.DB_PATH ?? './data/quotes.db',
)

export const db = globalForDb.db ?? openDb()

function openDb(): Database.Database {
  const conn = new Database(dbPath)

  // Без индекса список «без поиска» (ORDER BY created_at) сканирует всю
  // таблицу, а created_at лежит после блобов эмбеддингов — SQLite проходит
  // их overflow-страницы и читает почти весь файл. На холодном page cache
  // VPS это секунды. Таблицы может не быть: в CI next build открывает
  // пустую БД-заглушку.
  const hasQuotes = conn
    .prepare(
      `SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'quotes'`,
    )
    .get()
  if (hasQuotes) {
    conn.exec(
      'CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at)',
    )
  }

  return conn
}

if (process.env.NODE_ENV !== 'production') {
  globalForDb.db = db
}
