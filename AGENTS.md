# AGENTS.md — Инструкции для ИИ-агентов

## О проекте

Система учёта производства блокнотов и настольных игр.

## Стек

- **Бэкенд:** Python 3, FastAPI, SQLAlchemy, Alembic
- **Фронтенд:** React 19, TypeScript 6, Vite 8, Chakra UI 2, Recharts
- **БД:** SQLite (`src/backend/uchet.db`)
- **Auth:** JWT

## Структура

```
src/backend/     — FastAPI сервер, модели, роутеры, миграции Alembic
src/frontend/    — React SPA, страницы, компоненты, API клиент
alembic.ini      — конфигурация миграций
```

## Правила

### БД — ВСЕГДА Alembic миграции

1. После изменения `models.py`:
   ```
   cd src/backend
   alembic revision --autogenerate -m "описание"
   alembic upgrade head
   ```
2. Никогда не редактируй `uchet.db` напрямую
3. Seed данные: `python init_db_migrations.py --seed`
4. SQLite: `render_as_batch=True`, `PRAGMA foreign_keys=ON`

### Фронтенд

1. Импорты Chakra — переименование обязательно:
   ```typescript
   import { Input as ChakraInput, Select as ChakraSelect } from '@chakra-ui/react';
   ```
2. API — через `src/api.ts`
3. Типы — `import type { ColumnConfig } from '../components/SortableTable'`

### Стиль

- Комментарии: русский
- Код: английский

## Чеклист

- [ ] `npx tsc --noEmit` — нет ошибок
- [ ] `alembic upgrade head` — миграции применены
- [ ] API функции в `api.ts`
- [ ] Страницы в навигации `App.tsx`

## Команды

```
cd src/backend && python init_db_migrations.py --seed && uvicorn main:app --reload
cd src/frontend && npm run dev && npx tsc --noEmit