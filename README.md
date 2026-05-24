# RMG Platform — Skill-Based Duels

Онлайн-платформа для дуэлей в настольных игры на навык (шашки, шахматы, нарды). Первая игра — шашки.

## Quick Start

```bash
# 1. Клонируй репозиторий
git clone https://github.com/flexandstyle/SkillBasedRMG.git
cd SkillBasedRMG

# 2. Установи зависимости
pnpm install

# 3. Скопируй переменные окружения
cp .env.example .env

# 4. Подними PostgreSQL + Redis
docker compose -f infra/docker-compose.yml up -d

# 5. Запусти dev-серверы
pnpm dev
```

После запуска:
- **API**: http://localhost:3001 (health: http://localhost:3001/health)
- **Web**: http://localhost:3000

## Стек

| Слой | Технология |
|------|-----------|
| Backend | Node.js + TypeScript + NestJS |
| Frontend | Next.js 14 + React + Tailwind |
| БД | PostgreSQL 16 |
| Cache | Redis 7 |
| ORM | Drizzle ORM |
| Realtime | WebSocket (native ws) |
| CI | GitHub Actions |
| Monorepo | pnpm workspaces + Turborepo |

## Структура

```
├── apps/
│   ├── api/          # NestJS backend
│   └── web/          # Next.js frontend
├── packages/
│   ├── game-sdk/     # Интерфейс игры (контракт платформы)
│   └── shared-types/ # Общие типы
├── infra/
│   └── docker-compose.yml
└── docs/
    ├── PRODUCT_SPEC.md
    ├── ARCHITECTURE.md
    └── ROADMAP.md
```

## Документация

- [PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md) — что строим, зачем, границы продукта
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — технические решения и контракты
- [ROADMAP.md](docs/ROADMAP.md) — план спринтов

## Команды

```bash
pnpm dev          # Запустить все dev-серверы
pnpm build        # Собрать все пакеты
pnpm lint         # Линтинг
pnpm typecheck    # Проверка типов
pnpm test         # Тесты
pnpm format       # Форматирование (Prettier)
```

## Текущий спринт

**Sprint 1 — Foundation** (нед. 1–2)
