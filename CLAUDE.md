@AGENTS.md

# Quotes App

Next.js-приложение (App Router) для поиска и управления двуязычной (RU/EN) коллекцией
цитат с AI-поиском. Объединяет в себе то, что раньше было отдельными `quotes-frontend`
(Vue) и `quotes-backend` (Express) — теперь это один Next.js-проект. Подробности по
фичам и стеку — в `README.md`.

## Архитектурный принцип

Слоистая архитектура внутри App Router. Держись её при любых изменениях:

- `src/app/**` — маршруты и Route Handlers. Держи их тонкими: валидация входа,
  вызов `lib/services/*`, формирование ответа. Бизнес-логику сюда не тащить.
- `src/lib/services/*` — вся бизнес-логика (поиск, CRUD цитат, дубликаты).
- `src/lib/db.ts`, `src/lib/ai/*`, `src/lib/auth/*`, `src/lib/utils/*` — доступ к
  данным, внешним API и чистые хелперы. Не импортируются напрямую из компонентов.
- `src/components/**` — UI. `components/ui` — сгенерировано shadcn CLI (`npx shadcn add
<component>`), руками не редактировать точечно без необходимости — проще перегенерировать.
- `src/i18n`, `src/contexts` — кросс-cutting клиентские контексты (язык, тема, auth).

Данные на страницах грузятся **клиентскими компонентами через `lib/api-client.ts`**
(`fetch` к Route Handlers), а не Server Actions и не через прямой доступ к БД из
Server Components — так и оставляем, это осознанный выбор при миграции, не «ещё не
доделали».

## Next.js 16: он новее, чем ты думаешь

Смотри `AGENTS.md` — реально важно. В частности:

- Middleware называется **`proxy.ts`** (лежит в `src/proxy.ts`), а не `middleware.ts`.
  Экспортирует `proxy()`, а не `middleware()`.
- `cookies()`, `headers()`, `params` — асинхронные (`await`).
- Типизированные роуты: `LayoutProps<'/'>`, `PageProps<'/edit/[id]'>`,
  `RouteContext<'/api/quotes/[id]'>` — генерируются Next'ом (`next dev`/`build`/
  `next typegen`), не пиши свои интерфейсы для params вручную.

## Стили: Tailwind v4 + shadcn/ui

- Тема (light/dark, литературная палитра) задана CSS-переменными в
  `src/app/globals.css`, шрифт — Lora через `next/font/local` (`--font-lora` →
  `--font-sans`).
- **Никогда не добавляй глобальные правила вне `@layer`** (`* { ... }`, голые теговые
  селекторы и т.п.) в `globals.css`. Once already broke `mx-auto`, `space-y-*` и вообще
  все margin-утилиты по всему приложению — неслоёный CSS в каскаде всегда побеждает
  `@layer utilities`, независимо от специфичности. Если нужен глобальный сброс —
  добавляй его строго внутрь существующего `@layer base { ... }` в конце файла.
- Новые примитивы бери через `npx shadcn add <name>`, а не пиши руками — тогда они
  останутся консистентны с уже установленными (radix-ui, `cn` из пакета `cn`, тот же
  visual style "radix-nova").

## Auth

JWT в httpOnly-cookie (`src/lib/auth/session.ts`, подпись/проверка — `jose` в
`jwt.ts`, не `jsonwebtoken`: `jose` работает и в Route Handlers, и в `proxy.ts`).
Роли (`student`/`editor`) и пароли — в `.env` (`AUTH_STUDENT_PASSWORD`,
`AUTH_EDITOR_PASSWORD`), не хардкодить в коде. Проверка роли в API — через
`requireRole()` из `lib/auth/require-role.ts` в начале каждого защищённого хендлера;
защита страниц (`/bulk`, `/edit/*`) — в `proxy.ts`.

## Данные и окружение

- SQLite-файл лежит в `data/quotes.db` (путь — `DB_PATH` в `.env`), в git не
  коммитится. Синглтон подключения — `lib/db.ts` (переживает HMR через
  `globalThis`, так же сделаны OpenAI-клиент и in-memory кэши — паттерн общий,
  повторяй его для новых синглтонов).
- Для реального AI-поиска нужен `CHAT_GPT_API_KEY` в `.env` (см. `.env.example`).
  Без него семантический поиск падает, но обычный список и строгий поиск работают.
- `quotes-frontend/` и `quotes-backend/` (соседние директории) — старые проекты,
  оставлены как есть для истории/референса. Это не часть сборки `quotes-app`, в
  них ничего чинить не нужно, если явно не попросили.

## Команды

```bash
npm run dev            # next dev (Turbopack)
npm run build           # прод-сборка (next start рассчитан на VPS с постоянным диском — не Vercel serverless)
npm run lint / lint:fix
npm run format / format:check
```

После любых изменений в `.tsx`/`.ts` — гоняй `npx eslint . --fix` и
`npx prettier --write .`; сгенерированные shadcn-компоненты используют двойные
кавычки и другой стиль, prettier их выравнивает под конфиг проекта.

## Деплой

Прод — VPS `quotes.4thway.org` (1 vCPU, 900MB RAM). Собирать Next там нельзя,
поэтому `next build` живёт в GitHub Actions (`.github/workflows/deploy.yml`), а
на сервер едет только `.next/standalone`. Пуш в `main` = деплой.

- Сборка идёт в контейнере **`node:22-bullseye`**, и это не косметика: на
  сервере glibc 2.31 (Ubuntu 20.04), а на `ubuntu-latest` уже 2.39. Нативный
  `better-sqlite3`, собранный под 2.39, на проде не загрузится. Меняешь образ —
  проверь, что glibc совпадает.
- Раскладка на сервере: `/var/www/quotes-app/releases/<sha>/`, симлинк
  `current` переключается атомарно, держим три последних релиза. Откат =
  перевесить симлинк и `pm2 reload`.
- **БД лежит вне каталога деплоя** — `/var/lib/quotes/quotes.db` (`DB_PATH`).
  Так `rsync --delete` до неё не дотягивается. Туда же не коммить ничего: файл
  боевой, бэкапы — в `/var/backups/quotes/`.
- Секреты — в `/var/www/quotes-app/shared/.env.production`, симлинком в релиз.
  Деплой их не перезаписывает; Next подхватывает файл сам при старте.
- `ecosystem.config.js` — описание процесса для pm2. Инстанс намеренно один:
  кэш эмбеддингов держит в памяти ~250MB, второй процесс машина не потянет.

В CI нет отдельного шага линта — `next build` валит сборку на ошибках типов,
а prettier/eslint гоняются локально (см. выше).
