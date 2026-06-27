# Бэкенд — Система учёта производства блокнотов и настольных игр

FastAPI сервер с SQLite, SQLAlchemy, Alembic.

## Предварительные требования

- Python 3.8+
- `pip` (менеджер пакетов Python)

## Быстрый старт

```bash
# Перейти в папку бэкенда
cd src/backend

# Создать и активировать виртуальное окружение
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Установить зависимости
pip install -r requirements.txt
```

## Работа с базой данных

Все операции с БД выполняются через единый скрипт `db.py`:

```bash
cd src/backend
python db.py <команда>
```

### Команды

| Команда | Описание |
|---------|----------|
| `reset` | Полный сброс: удалить `uchet.db` → очистить миграции → создать новую → применить → засеять |
| `migrate` | Только применить миграции (после `git pull`, если добавились новые) |
| `seed` | Только заполнить начальными данными (единицы, типы клиентов, налоги, admin) |
| `upgrade` | Создать авто-миграцию по изменениям в `models.py` и сразу применить |

### Примеры

```bash
# Полный сброс базы
python db.py reset

# Применить миграции
python db.py migrate

# Заполнить данными
python db.py seed

# Создать миграцию после изменения моделей
python db.py upgrade "добавлено поле для цены"
```

## Запуск сервера

```bash
cd src/backend
python main.py
```

Сервер запускается на `http://localhost:8000`.

## Проверка

```bash
curl http://localhost:8000/
# → {"message": "Добро пожаловать в API системы учёта производства!"}
```

## Документация API

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Структура файлов

```
src/backend/
├── main.py              — точка входа, подключение роутеров
├── database.py          — подключение к SQLite
├── models.py            — SQLAlchemy модели
├── schemas.py           — Pydantic схемы
├── auth.py              — JWT аутентификация
├── config.py            — настройки (секретный ключ и т.д.)
├── uchet.db             — SQLite база данных (создаётся автоматически)
├── alembic.ini          — конфигурация Alembic
├── alembic/             — миграции Alembic
│   └── versions/        — файлы миграций
├── routers/             — FastAPI роутеры
│   ├── materials.py     — CRUD материалов и закупок
│   ├── products.py      — CRUD продуктов и спецификаций
│   ├── customers.py     — CRUD клиентов
│   ├── equipment.py     — CRUD оборудования и расходников
│   ├── sales.py         — заказы, позиции, аналитика
│   ├── reports.py       — отчёты по остаткам
│   ├── categories.py    — категории материалов
│   ├── units.py         — единицы измерения
│   ├── shipping_methods.py — способы доставки
│   └── auth.py          — логин / регистрация
├── init_db_migrations.py — скрипт для первичного заполнения БД
├── init_db.py           — устаревший скрипт инициализации
├── init_units.py        — устаревший скрипт заполнения единиц
├── tests/
│   └── test_main.py     — тесты
└── requirements.txt     — зависимости Python
```