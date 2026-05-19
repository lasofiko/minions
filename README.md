# Relink — сервис коротких ссылок

**Relink** — веб-приложение для сокращения URL, генерации QR-кодов и учёта переходов. Каждый пользователь работает в личном кабинете: создаёт ссылки, добавляет к ним заметки, смотрит статистику и удаляет ненужное.

Продакшен: **[https://linkshortener.ru](https://linkshortener.ru)**

Репозиторий ориентирован на MVP: понятный стек, SQLite без отдельного сервера БД, развёртывание через Docker Compose.

---

## Содержание

- [Что делает сервис](#что-делает-сервис)
- [Возможности](#возможности)
- [Как это работает для пользователя](#как-это-работает-для-пользователя)
- [Архитектура](#архитектура)
- [Стек технологий](#стек-технологий)
- [Структура репозитория](#структура-репозитория)
- [Локальная разработка](#локальная-разработка)
- [Запуск через Docker](#запуск-через-docker)
- [Продакшен-деплой](#продакшен-деплой)
- [Ограничения и планы](#ограничения-и-планы)

---

## Что делает сервис

1. Пользователь **регистрируется** или **входит** по email и паролю.
2. На дашборде **вставляет длинный URL** — получает короткую ссылку вида `https://linkshortener.ru/Ab3xYz` (6 символов, буквы и цифры).
3. Короткая ссылка **редиректит** на исходный адрес; при каждом переходе увеличивается счётчик кликов и обновляется время последнего клика.
4. Для ссылки можно сгенерировать **QR-код** (внешний API) и скачать PNG.
5. В таблице «Мои ссылки» — **поиск, сортировка**, редактирование **описания**, копирование URL, удаление.

Короткие коды обрабатывает **backend** (маршрут `/{short_code}`). Страницы React (`/auth`, `/dashboard`) отдаёт **frontend** через nginx-router.

---

## Возможности

| Область | Описание |
|--------|----------|
| **Аутентификация** | Регистрация (username, email, password), вход, JWT access + refresh, профиль `/auth/me` |
| **Ссылки** | Создание, список только своих, удаление, обновление описания (PUT) |
| **Редирект** | Публичный GET `/{short_code}` без авторизации |
| **Статистика** | `clicks_count`, `last_clicked_at`, дата создания (МСК) |
| **Описание** | Необязательное поле при создании и inline-редактирование в таблице |
| **QR-коды** | Генерация через [QR Server API](https://goqr.me/api/) на клиенте, скачивание PNG |
| **UI** | Вкладки «Создать ссылку» / «Мои ссылки», светлая и тёмная тема, сохранение вкладки и темы в `localStorage` |
| **Безопасность** | Пароли — bcrypt; API защищён Bearer-токеном; чужие ссылки изменить/удалить нельзя |

---

## Как это работает для пользователя

### Страницы

| Маршрут | Назначение |
|---------|------------|
| `/` | Редирект на `/dashboard` (если авторизован) или на `/auth` |
| `/auth` | Вход и регистрация |
| `/dashboard` | Личный кабинет (только для авторизованных) |
| `/{short_code}` | Редирект на оригинальный URL (не React-страница) |

### Дашборд

- **Создать ссылку** — форма URL + описание; автоматически добавляется `https://`, если протокол не указан; после создания — короткая ссылка, копирование, QR.
- **Мои ссылки** — таблица: оригинал, короткая ссылка, описание, клики, даты; поиск по URL, коду и описанию; сортировка по дате создания, кликам, последнему переходу; удаление с подтверждением.

---

## Архитектура

```mermaid
flowchart TB
    subgraph client [Браузер]
        React[React SPA]
    end

    subgraph router [nginx router]
        R[Маршрутизация]
    end

    subgraph services [Сервисы]
        FE[Frontend nginx :80]
        BE[FastAPI backend :8000]
    end

    DB[(SQLite)]

    React -->|/api/*| R
    React -->|/auth, /dashboard| R
    User -->|/{code}| R

    R -->|/api/*| BE
    R -->|статика, SPA| FE
    R -->|/{code}| BE
    BE --> DB
```

**Логика маршрутизации (dev и prod):**

- `/api/*` → backend (REST API)
- `/auth`, `/dashboard`, статика (`.js`, `.css`, …) → frontend
- всё остальное (`/abc123`) → backend (редирект)

Файлы конфигурации: `router/nginx.conf` (разработка), `router/nginx.prod.conf` (HTTPS, `linkshortener.ru`).

---

## Стек технологий

### Backend

- **Python 3.12**
- **FastAPI** — REST API и OpenAPI (`/docs`)
- **SQLAlchemy 2** — ORM, SQLite
- **Pydantic v2** — схемы запросов/ответов
- **python-jose** — JWT (access + refresh)
- **passlib[bcrypt]** — хеши паролей
- **Uvicorn** — ASGI-сервер

### Frontend

- **React 19** + **React Router 7**
- **Vite 8** — сборка и dev-сервер
- **Axios** — HTTP-клиент с перехватчиками
- **js-cookie** — хранение токенов

### Инфраструктура

- **Docker** / **Docker Compose** — локально и на сервере
- **nginx** — единая точка входа (router + статика frontend)
- **GitHub Actions** — линт, тесты, сборка образов

QR-коды **не** генерируются на backend: фронтенд обращается к `https://api.qrserver.com/v1/create-qr-code/`.

---

## Структура репозитория

```
minions/
├── backend/                 # FastAPI-приложение
│   ├── app/
│   │   ├── api/             # Роуты: v1 (auth, links), redirect
│   │   ├── core/            # config, database, security
│   │   ├── models/          # User, Link
│   │   ├── schemas/         # Pydantic-модели
│   │   ├── services/        # links_service, user_service
│   │   └── utils/           # short_link, logger
│   ├── data/                # SQLite (dev.db / links.db)
│   ├── Dockerfile           # Dev-образ с --reload
│   ├── Dockerfile.prod      # Продакшен-образ
│   └── requirements.txt
├── frontend/                # React SPA
│   ├── src/
│   │   ├── api/             # axios client
│   │   ├── components/      # CreateLink, LinkStatsTable, …
│   │   ├── contexts/        # AuthContext
│   │   └── pages/           # Auth, Dashboard
│   ├── Dockerfile / Dockerfile.prod
│   └── vite.config.js       # proxy /api → localhost:8000
├── router/                  # nginx: dev и prod конфиги
├── tests/                   # pytest (API, сервисы, фильтр, e2e-сценарии)
├── .github/workflows/       # ci-cd.yml
├── docker-compose.yml       # Локальный стек (dev)
├── docker-compose.prod.yml  # Продакшен на сервере
├── pytest.ini
├── .env.example
└── README.md
```

---

## Локальная разработка

### Требования

- Python **3.12+**
- Node.js **20+** и npm
- (опционально) Docker Desktop

### Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt

# .env в корне репозитория или backend — см. .env.example
# DATABASE_URL для локали, например:
# sqlite:///./data/dev.db

mkdir -p data
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

API: http://127.0.0.1:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

UI: http://localhost:5173 — Vite проксирует `/api` на `http://127.0.0.1:8000` (`vite.config.js`).

> Если база создана до добавления поля `description`, выполните в SQLite:  
> `ALTER TABLE links ADD COLUMN description VARCHAR;`

### Альтернатива: UV

В `backend/` есть `pyproject.toml` — можно ставить зависимости через [uv](https://github.com/astral-sh/uv):

```bash
cd backend
uv sync --extra dev
```

---

## Запуск через Docker

### Разработка (весь стек)

```bash
docker compose up --build
```

- Сайт: http://localhost (порт **80**, сервис `router`)
- Backend с hot-reload: volume `./backend/app`
- БД: `./backend/data/dev.db`

Остановка: `docker compose down`

### Продакшен на сервере

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

- HTTPS и редирект HTTP→HTTPS: `router/nginx.prod.conf`
- SSL-сертификаты: каталог `./ssl` (монтируется в контейнер router)
- Образы backend/frontend собираются из `Dockerfile.prod`
- Переменная `SECRET_KEY` — из `.env` на сервере

После обновления кода на сервере:

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Ограничения и планы

Текущий MVP **не включает**:

- Alembic / версионирование схемы БД
- Rate limiting и отдельный health-check endpoint
- Детальную аналитику кликов (IP, User-Agent, гео)
- Собственный сервис генерации QR на backend
- Автодеплой из CI (job отключён)

Возможные улучшения: PostgreSQL в prod, кастомные алиасы ссылок, срок жизни ссылки, админ-панель, единый язык сообщений об ошибках на русском.

---