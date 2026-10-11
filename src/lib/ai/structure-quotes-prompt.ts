import { consciousBeings } from '@/i18n/conscious-beings'

// Единственный источник списка — i18n/conscious-beings.ts (его же показывает
// страница «Сознательные существа»). Списки RU и EN идут в одном порядке.
const CONSCIOUS_BEINGS_LIST = consciousBeings.ru
  .map((b, i) => `- ${b.name} / ${consciousBeings.en[i]?.name ?? b.name}`)
  .join('\n')

export const STRUCTURE_QUOTES_PROMPT = `Структуризация цитат
Нужно все Цитаты структурировать по Шаблону в JSON массив и вернуть код. Строго запрещено как-либо менять сами цитаты.
Применять для каждой цитаты:

* Переносы строк делай через '/n'
* Лишние пробелы удаляй
* Даты жизни не вписывай
* Цифры в скобках у цитат убирай
* author_en, author_ru, text_en, text_ru are required
* если есть только источник, то его ставить в author
* Цитаты без русского перевода в массив не включать
* Цитаты просто студентов в массив не включать
* Цитаты Роберта включай
* Цитаты с цифрой, но без автора или источника (если это не афоризмы или народные изречения), принадлежат Роберту Бертону
* Не включай цитаты с автором или источником - Афоризм
* conscious_being: true, если автор цитаты — одно из сознательных существ из списка ниже (учитывай разные написания и транслитерации имени, титулы, "Святой"/"Св.", "Рабби" и т.п.; "Роберт" — это Роберт Эрл Бертон, он в списке). Если автора в списке нет, а также если автор — книга, текст, пословица или источник, а не человек из списка — false

Шаблон:
[
  {
    "author_en": "William Shakespeare",
    "author_ru": "Уильям Шекспир",
    "text_en": "Hush, and be mute /nOr else our spell is mar'd.",
    "text_ru": "Утихнуть и хранить молчанье, /nВедь все другое разрушит наше заклинание.",
    "source_en": "The Tempest, Prospero",
    "source_ru": "Буря, Просперо",
    "robert_comment_en": null,
    "robert_comment_ru": null,
    "conscious_being": true
  },
  {
    "author_en": "Egyptian Texts",
    "author_ru": "Египетские тексты",
    "text_en": "I shall descend into the water with you.",
    "text_ru": "Я спущусь в воду вместе с тобой.",
    "source_en": "Egyptian Love Poetry",
    "source_ru": "Египетская любовная поэзия",
    "robert_comment_en": null,
    "robert_comment_ru": null,
    "conscious_being": false
  }
]

Ответом должен быть строго JSON-массив объектов по шаблону выше, без markdown-разметки, кодовых блоков и каких-либо пояснений.

Список сознательных существ (русское имя / английское имя):
${CONSCIOUS_BEINGS_LIST}

Цитаты:
`
