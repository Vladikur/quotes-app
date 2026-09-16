# Quotes App

A full-featured application for searching and managing a collection of quotes in Russian and English. Merges the former `quotes-frontend` (Vue) and `quotes-backend` (Express) into a single Next.js (App Router) application.

## Features

- **Semantic search** — AI-powered search by meaning (OpenAI `text-embedding-3-small` + cosine similarity)
- **Strict search** — exact match on a normalized string
- **Bilingual content** — every quote is shown in Russian and English at the same time
- **Role-based access** — `student` (search only) and `editor` (CRUD, bulk upload, duplicate search)
- **Dark/light theme** — manual toggle or system preference
- **Interface localization** — RU/EN with the choice remembered

## Architecture

The app is built on the Next.js App Router following a layered approach:

```
src/
├── app/                    # Routes (pages + Route Handlers) — a thin layer
│   ├── api/                #   REST API: /api/auth/*, /api/quotes/*
│   ├── login/, bulk/, edit/[id]/, page.tsx
│   └── layout.tsx          #   Theme, i18n and auth providers
├── components/             # UI components (shadcn/ui in components/ui + features)
├── contexts/                # React contexts (auth)
├── i18n/                    # Lightweight custom i18n context (RU/EN)
└── lib/
    ├── db.ts               #   better-sqlite3 singleton
    ├── auth/                #   JWT sessions (jose), httpOnly cookie, roles
    ├── ai/                  #   OpenAI client and embedding generation
    ├── services/            #   Quote search/CRUD business logic
    ├── utils/               #   Pure helpers (cosine similarity, normalization, etc.)
    └── api-client.ts        #   fetch client for client components
```

Route Handlers stay thin and delegate logic to `lib/services`, which works with `lib/db` and `lib/ai`. Data is loaded on the client via `lib/api-client.ts` (Client Components + Route Handlers) rather than Server Actions — this is closer to the previous axios-based architecture and avoids a full rewrite of the pages for server rendering.

Page routing and authorization are protected in `src/proxy.ts` (in Next.js 16, `middleware.ts` was renamed to `proxy.ts`).

## Environment variables

Copy `.env.example` to `.env` and fill in:

```env
CHAT_GPT_API_KEY=sk-proj-...      # OpenAI API key for embeddings
JWT_SECRET=...                     # secret used to sign session JWTs
DB_PATH=./data/quotes.db           # path to the SQLite database
AUTH_STUDENT_PASSWORD=presence     # password for the student role
AUTH_EDITOR_PASSWORD=presence      # password for the editor role
```

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm run start   # production server (next start — requires a persistent disk for SQLite)
npm run lint
npm run format
```

## Stack

| Layer         | Technologies                             |
| ------------- | ---------------------------------------- |
| Framework     | Next.js 16 (App Router), React 19        |
| UI            | shadcn/ui, Tailwind CSS v4, lucide-react |
| Theme         | next-themes (light/dark)                 |
| Database      | SQLite (`better-sqlite3`)                |
| Auth          | JWT in an httpOnly cookie (`jose`)       |
| AI            | OpenAI Embeddings API                    |
| Notifications | sonner                                   |
