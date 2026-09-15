# Quotes App

Полнофункциональное приложение для поиска и управления коллекцией цитат на русском и английском языках. Объединяет бывшие `quotes-frontend` (Vue) и `quotes-backend` (Express) в одно приложение на Next.js (App Router).

## Возможности

- **Семантический поиск** — AI-поиск по смыслу запроса (OpenAI `text-embedding-3-small` + косинусное сходство)
- **Строгий поиск** — точное совпадение по нормализованной строке
- **Двуязычный контент** — каждая цитата отображается на русском и английском одновременно
- **Ролевой доступ** — `student` (только поиск) и `editor` (CRUD, массовая загрузка, поиск дублей)
- **Тёмная/светлая тема** — переключение вручную или по системной настройке
- **Локализация интерфейса** — RU/EN с сохранением выбора

## Архитектура

Приложение построено на Next.js App Router по слоистому принципу:

```
src/
├── app/                    # Маршруты (страницы + Route Handlers) — тонкий слой
│   ├── api/                #   REST API: /api/auth/*, /api/quotes/*
│   ├── login/, bulk/, edit/[id]/, page.tsx
│   └── layout.tsx          #   Провайдеры темы, i18n, авторизации
├── components/             # UI-компоненты (shadcn/ui в components/ui + фичи)
├── contexts/                # React-контексты (auth)
├── i18n/                    # Лёгкий кастомный i18n-контекст (RU/EN)
└── lib/
    ├── db.ts               #   Синглтон better-sqlite3
    ├── auth/                #   JWT-сессии (jose), httpOnly-cookie, роли
    ├── ai/                  #   OpenAI-клиент и построение эмбеддингов
    ├── services/            #   Бизнес-логика поиска/CRUD цитат
    ├── utils/               #   Чистые хелперы (cosine similarity, нормализация и т.д.)
    └── api-client.ts        #   fetch-клиент для клиентских компонентов
```

Route Handlers остаются тонкими и делегируют логику в `lib/services`, которые работают с `lib/db` и `lib/ai`. Данные загружаются на клиенте через `lib/api-client.ts` (Client Components + Route Handlers), а не через Server Actions — это ближе к прежней axios-архитектуре и не требует полной переработки страниц на серверный рендеринг.

Маршрутизация и авторизация страниц защищены в `src/proxy.ts` (в Next.js 16 `middleware.ts` переименован в `proxy.ts`).

## Переменные окружения

Скопируйте `.env.example` в `.env` и заполните:

```env
CHAT_GPT_API_KEY=sk-proj-...      # OpenAI API key для эмбеддингов
JWT_SECRET=...                     # секрет для подписи сессионных JWT
DB_PATH=./data/quotes.db           # путь к SQLite-базе
AUTH_STUDENT_PASSWORD=presence     # пароль роли student
AUTH_EDITOR_PASSWORD=presence      # пароль роли editor
```

## Запуск

```bash
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production-сборка
npm run start   # production-сервер (next start — нужен постоянный диск для SQLite)
npm run lint
npm run format
```

## Стек

| Слой        | Технологии                               |
| ----------- | ---------------------------------------- |
| Фреймворк   | Next.js 16 (App Router), React 19        |
| UI          | shadcn/ui, Tailwind CSS v4, lucide-react |
| Тема        | next-themes (светлая/тёмная)             |
| БД          | SQLite (`better-sqlite3`)                |
| Авторизация | JWT в httpOnly-cookie (`jose`)           |
| AI          | OpenAI Embeddings API                    |
| Уведомления | sonner                                   |
