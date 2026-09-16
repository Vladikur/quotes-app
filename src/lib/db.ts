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

export const db = globalForDb.db ?? new Database(dbPath)

if (process.env.NODE_ENV !== 'production') {
  globalForDb.db = db
}
