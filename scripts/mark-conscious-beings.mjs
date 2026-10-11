// Добавляет в quotes столбец conscious_being (0/1, по умолчанию 0) и
// проставляет его по списку со страницы «Сознательные существа»
// (src/i18n/conscious-beings.ts). Идемпотентен: можно гонять повторно.
//
//   node --experimental-strip-types scripts/mark-conscious-beings.mjs [путь/к/quotes.db] [--dry]
//
// Без пути берёт DB_PATH из окружения, иначе ./data/quotes.db.
import path from 'node:path'
import Database from 'better-sqlite3'
import { consciousBeings } from '../src/i18n/conscious-beings.ts'

const args = process.argv.slice(2)
const dry = args.includes('--dry')
const dbPath = path.resolve(
  args.find((a) => !a.startsWith('--')) ??
    process.env.DB_PATH ??
    './data/quotes.db',
)

// Автор в БД записан вольно, а в списке — каноническое имя. Приводим к виду
// без регистра, диакритики (ё/й/é), пунктуации и лишних пробелов.
const norm = (s) =>
  (s ?? '')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()

// Варианты написания того же человека, которые встречаются в БД, но не
// совпадают с каноническим именем из списка. Книги и тексты («Евангелие от
// Иоанна», «Песнь Соломона», «Книга Иова») сюда намеренно не входят.
const aliases = {
  ru: [
    'Блейк',
    'Вордсворт',
    'Гераклит Эфесский',
    'Данте',
    'Джалаладдин Руми',
    'Милтон',
    'Мильтон',
    'Леонардо',
    'Монтень',
    'Сервантес',
    'Райнер Рильке',
    'Бернард де Клерво',
    'Хафиз( в интерпретации Даниэля Ладински)',
    'Аменемопа',
    'Будда',
    'Иисус',
    'Христос',
    'Иисус (Евангелие от Фомы)',
    'Иезекииль',
    'Иоанн Богослов',
    'Апостол Павел, 1-е послание коринфянам',
    'Апостол Павел, Коринфянам',
    'Гете',
    'Иоганн Вольфганг фон Гете',
    'Гойя',
    'Франсиско де Гойя',
    'Петрарка',
    'Успенский',
    'П. Д. Успенский',
    'Пётр Успенский',
    'Алекс Хорн',
    'Святой Франциск Ассизский',
    'Рабия',
    'Рабиа',
    'Рабия аль-Адавийя',
    'Рабия аль-Басри',
    'Рабия аль-Басири',
    'Елизавета I',
    'Королева Елизавета I',
    'Роберт',
    'Роберт (Мысли)',
    'Мысли Роберта',
    'Роберт Бертон',
    'Роберт Бёртон',
    'Райнер Мария Рильке / Мысли Роберта',
  ],
  en: [
    'Blake',
    'Wordsworth',
    'Heraclitus of Ephesus',
    'Dante',
    'Jalal ad-Din Muhammad Rumi',
    'Milton',
    'Leonardo',
    'Montaigne',
    'Cervantes',
    'Rainer Rilke',
    'Bernard de Clairvaux',
    'Hafiz (as interpreted by Daniel Ladinsky)',
    'Eckhart',
    'Shakespeare',
    'Rilke',
    'Whitman',
    'Lincoln',
    'Aristocles',
    'Aristocles (Plato)',
    'Plato (Aristocles)',
    'Laozi',
    'Lao Tze',
    'Augustine',
    'Saint Augustine',
    'Augustine of Hippo',
    'Gerome',
    'Mohammed',
    'Gurdjieff',
    'G.I. Gurdjieff',
    'G. I. Gurdjieff',
    'Gurdjeff (as recorded by Fritz Peters)',
    'J.S. Bach',
    'Ibn al-Arabi',
    'Marcus Tullius Cicero',
    'Buddha',
    'Jesus',
    'Christ',
    'Jesus (Gospel of Thomas)',
    'Ezekiel',
    'John the Apostle',
    'Apostle Paul',
    'Paul',
    'Paul, the Apostle',
    'Paul, Corinthians',
    'Goethe',
    'Johann Wolfgang von Goethe',
    'Francisco Goya',
    'Francisco de Goya',
    'Petrarch',
    'Francesco Petrarca',
    'Ouspensky',
    'P. D. Ouspensky',
    'Peter Ouspensky',
    'Alex Horn',
    'St. Francis of Assisi',
    'Rabia',
    'Rabia al-Adawiyya',
    'Rabia al-Basri',
    'Elizabeth I',
    'Robert',
    'Robert (Thoughts)',
    'Thoughts of Robert',
    'Robert Burton',
    'Rainer Maria Rilke / Thoughts of Robert',
  ],
}

const names = { ru: new Set(), en: new Set() }
for (const lang of ['ru', 'en']) {
  for (const b of consciousBeings[lang]) names[lang].add(norm(b.name))
  for (const a of aliases[lang]) names[lang].add(norm(a))
}

const db = new Database(dbPath)
const hasColumn = db
  .prepare(
    `SELECT 1 FROM pragma_table_info('quotes') WHERE name = 'conscious_being'`,
  )
  .get()

if (!hasColumn && !dry) {
  db.exec(
    'ALTER TABLE quotes ADD COLUMN conscious_being INTEGER NOT NULL DEFAULT 0',
  )
}

const rows = db
  .prepare('SELECT DISTINCT author_ru, author_en FROM quotes')
  .all()
const matched = rows.filter(
  (r) => names.ru.has(norm(r.author_ru)) || names.en.has(norm(r.author_en)),
)

if (!dry) {
  const reset = db.prepare('UPDATE quotes SET conscious_being = 0')
  const set = db.prepare(
    'UPDATE quotes SET conscious_being = 1 WHERE author_ru IS ? AND author_en IS ?',
  )
  db.transaction(() => {
    reset.run()
    for (const r of matched) set.run(r.author_ru, r.author_en)
  })()
}

const total = db.prepare('SELECT count(*) AS n FROM quotes').get().n
const yes = dry
  ? '—'
  : db
      .prepare('SELECT count(*) AS n FROM quotes WHERE conscious_being = 1')
      .get().n
console.log(
  `${dry ? '[dry] ' : ''}${dbPath}\n` +
    `author pairs matched: ${matched.length} of ${rows.length}\n` +
    `quotes conscious_being=1: ${yes} of ${total}`,
)
if (dry)
  for (const r of matched) console.log(`  ${r.author_ru} | ${r.author_en}`)
