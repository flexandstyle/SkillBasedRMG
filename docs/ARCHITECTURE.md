# ARCHITECTURE.md

> Технический контракт платформы. Все архитектурные решения здесь обязательны.
> Изменение этого документа = архитектурное решение, требующее явного обсуждения.
>
> **Для Claude Code / AI-агента**: при любой задаче, затрагивающей структуру проекта, новые модули, новые таблицы, новые API — ОБЯЗАТЕЛЬНО прочитать этот файл и следовать паттернам. При сомнении — спросить, не делать "как удобнее".

---

## 1. Принципы архитектуры

1. **Платформа > игра.** Любая игра — это плагин. Платформа ничего не знает про шашки/шахматы/нарды, кроме того, что в её реестре зарегистрирован модуль с таким-то id.
2. **Server-authoritative.** Источник истины по матчу — сервер. Клиент не считает результаты, валидность, балансы, победу.
3. **Идемпотентность.** Все мутирующие операции на API имеют `Idempotency-Key`. Повторный запрос с тем же ключом возвращает тот же результат, а не создаёт дубль.
4. **Append-only финансы.** Баланс — это сумма строк ledger-таблицы. Не updates балансов руками.
5. **Состояние матча — в Redis, история — в Postgres.** Активные матчи живут в Redis (быстро, для WS). После окончания — мигрируют в Postgres со всеми ходами.
6. **Тесты на game logic — обязательны.** Любая игра, попавшая в `games/`, имеет покрытие правил юнит-тестами ≥ 90%.

## 2. Структура репозитория (монорепо)

```
rmg-platform/
├── apps/
│   ├── api/                  # NestJS backend
│   ├── ws/                   # WebSocket-сервер (отдельный процесс)
│   ├── web/                  # Next.js frontend
│   └── admin/                # Next.js админка
├── packages/
│   ├── game-sdk/             # Интерфейс игры (см. §4)
│   ├── games/
│   │   ├── checkers/         # Реализация шашек по game-sdk
│   │   ├── backgammon/       # (будущее) Нарды
│   │   └── chess/            # (будущее) Шахматы
│   ├── shared-types/         # DTO, типы API, события WS
│   ├── ui-kit/               # React-компоненты, общие для web/admin
│   └── antifraud/            # Чистые функции анти-фрод правил
├── infra/
│   ├── docker-compose.yml    # Локалка: postgres + redis
│   └── migrations/           # SQL миграции (drizzle/prisma)
├── docs/
│   ├── PRODUCT_SPEC.md
│   ├── ARCHITECTURE.md       # этот файл
│   ├── ROADMAP.md
│   └── ADDING_A_GAME.md
└── README.md
```

> ℹ️ На этапе до создания монорепо файлы документации могут лежать в корне. При создании монорепо перенести в `docs/`.

## 3. Слои бэкенда (NestJS-модули)

```
apps/api/src/
├── auth/             # JWT, refresh, регистрация
├── users/            # Профиль, настройки, self-exclusion
├── wallet/           # Балансы, ledger, депозиты, выводы
├── matchmaking/      # Очереди, Elo, создание матча
├── matches/          # Жизненный цикл матча, replay, результаты
├── tournaments/      # Турниры, brackets, призы
├── games/            # Реестр игр, вызов game-sdk
├── antifraud/        # Применение правил, ручной review
├── referrals/        # Реферальные коды и бонусы
├── leaderboards/     # Сезоны, расчёт рейтингов
├── admin/            # API для админки
└── common/           # Идемпотентность, middleware, pipes
```

## 4. Game SDK — центральный контракт платформы

Это сердце "платформы под много игр". Каждая игра реализует ровно этот интерфейс. Платформа взаимодействует с играми ТОЛЬКО через него.

```typescript
// packages/game-sdk/src/index.ts

export interface GameDefinition<TState, TMove, TConfig = {}> {
  id: string;                          // 'checkers', 'chess', 'backgammon'
  displayName: string;
  minPlayers: 2;
  maxPlayers: 2;
  averageDurationSec: number;          // для UI и матчмейкинга
  drawPossible: boolean;               // возможна ли ничья в этой игре

  // Создать начальное состояние матча
  initMatch(config: TConfig, seed: string): TState;

  // Чей ход сейчас? Возвращает индекс игрока 0 или 1
  getCurrentTurn(state: TState): 0 | 1;

  // Список всех валидных ходов для текущего игрока. Нужен для UI (подсветка), антифрода и детекта пата.
  getValidMoves(state: TState, playerIdx: 0 | 1): TMove[];

  // Валиден ли ход. ВЫЗЫВАЕТСЯ НА СЕРВЕРЕ перед применением.
  isValidMove(state: TState, move: TMove, playerIdx: 0 | 1): ValidationResult;

  // Применить ход. Возвращает новое состояние. Чистая функция.
  applyMove(state: TState, move: TMove, playerIdx: 0 | 1): TState;

  // Окончен ли матч и кто победитель.
  checkGameOver(state: TState): GameOverResult;

  // Возвращает видимую часть состояния для конкретного игрока.
  // Для игр с полной информацией (шашки, шахматы) — возвращает всё состояние.
  // Для игр со скрытой информацией (нарды, карты) — скрывает данные оппонента.
  // Именно это отправляется клиенту по WS, а НЕ полный state.
  getClientView(state: TState, playerIdx: 0 | 1): unknown;

  // Сериализация ходов для replay-лога (для disputes).
  serializeReplay(initialState: TState, moves: TMove[]): ReplayBlob;

  // Восстановление состояния из replay (для проверки целостности).
  replayFromBlob(blob: ReplayBlob): TState;

  // Опционально: даёт совет по таймауту хода (например, в шахматах часы сложнее)
  getMoveTimeoutSec(state: TState): number;
}

export type ValidationResult =
  | { valid: true }
  | { valid: false; reason: string };

export type GameOverResult =
  | { over: false }
  | { over: true; winner: 0 | 1 | 'draw' };

export type ReplayBlob = {
  gameId: string;
  version: number;
  initialState: unknown;
  moves: unknown[];
  seed: string;
};
```

### Жёсткие правила для модулей игр
1. `applyMove` — **чистая функция** (нет I/O, нет рандома вне `seed`, нет Date.now).
2. `isValidMove` всегда вызывается перед `applyMove` на сервере. Клиент валидирует для UX, но это не источник истины.
3. Любая случайность (бросок кубика в нардах, раздача карт) генерируется детерминированно из `seed`. Это нужно для воспроизводимости replay.
4. Состояние не имеет ссылок наружу — только сериализуемые в JSON структуры.
5. Клиенту по WS всегда отправляется `getClientView(state, playerIdx)`, а НЕ полный state. Это предотвращает утечку скрытой информации для игр с неполной информацией (нарды, карты).

## 5. Кошелёк и финансовая модель

### Таблицы
```sql
-- Баланс никогда не редактируется напрямую
CREATE TABLE wallet_ledger (
  id              UUID PRIMARY KEY,
  user_id         UUID NOT NULL,
  bucket          TEXT NOT NULL CHECK (bucket IN ('deposit', 'winnings', 'bonus', 'escrow')),
  amount_cents    BIGINT NOT NULL,              -- может быть отрицательным
  currency        TEXT NOT NULL,                -- 'COINS' (виртуалка) или 'USDT' позже
  operation       TEXT NOT NULL,                -- 'deposit', 'bet_lock', 'bet_settle', 'rake', 'withdrawal', 'bonus_grant', 'admin_adjust'
  ref_id          UUID,                         -- match_id, deposit_id и т.д.
  idempotency_key TEXT UNIQUE NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  metadata        JSONB
);

CREATE INDEX idx_ledger_user_currency ON wallet_ledger (user_id, currency, created_at DESC);

-- Кэшированный баланс. Источник истины — ledger. Этот view либо пересчитывается, либо materialized.
CREATE VIEW wallet_balance AS
SELECT user_id, currency, bucket, SUM(amount_cents) AS balance_cents
FROM wallet_ledger
GROUP BY user_id, currency, bucket;
```

### Правила
- Любая запись в `wallet_ledger` идёт внутри транзакции с `SERIALIZABLE` или с `SELECT ... FOR UPDATE` на блокирующий ресурс (например, при вводе/выводе блокируем строку user-а).
- **ОБЯЗАТЕЛЬНО**: При использовании `SERIALIZABLE` заложен автоматический механизм ретраев (retry) транзакций при ошибках сериализации (`40001 serialization_failure`).
- Перед списанием ставки сервис проверяет баланс по сумме ledger-записей в той же транзакции, потом пишет запись `bet_lock` с отрицательной суммой. Деньги "висят" в bucket `escrow` (или флаг в metadata).
- При завершении матча: одна транзакция — `bet_settle` победителю, `rake` себе. Если матч отменён — `bet_unlock` обоим. При ничьей — `bet_settle` обоим (ставка минус половина rake) + `rake` себе.
- НИКОГДА не пишем "просто обновим баланс". Только append в ledger.

### Таблица матчей
```sql
CREATE TABLE matches (
  id              UUID PRIMARY KEY,
  game_id         TEXT NOT NULL,                 -- 'checkers', 'chess', ...
  player_0_id     UUID NOT NULL REFERENCES users(id),
  player_1_id     UUID NOT NULL REFERENCES users(id),
  status          TEXT NOT NULL CHECK (status IN ('waiting', 'starting', 'active', 'finished', 'cancelled', 'abandoned')),
  stake_cents     BIGINT NOT NULL,               -- ставка каждого игрока
  currency        TEXT NOT NULL,
  winner          SMALLINT CHECK (winner IN (0, 1)),  -- NULL = ничья или не завершён
  is_draw         BOOLEAN NOT NULL DEFAULT FALSE,
  seed            TEXT NOT NULL,                 -- для детерминированного replay
  replay_blob     JSONB,                         -- сохраняется после завершения
  move_count      INTEGER NOT NULL DEFAULT 0,
  started_at      TIMESTAMPTZ,
  finished_at     TIMESTAMPTZ,
  last_move_at    TIMESTAMPTZ,                   -- для детекта брошенных матчей
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_matches_status ON matches (status) WHERE status IN ('active', 'starting');
CREATE INDEX idx_matches_players ON matches (player_0_id, player_1_id, created_at DESC);
```

### Elo-система
```sql
CREATE TABLE user_ratings (
  user_id         UUID NOT NULL REFERENCES users(id),
  game_id         TEXT NOT NULL,                 -- Elo отдельно для каждой игры
  rating          INTEGER NOT NULL DEFAULT 1200, -- стартовый рейтинг
  matches_played  INTEGER NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, game_id)
);
```
- **Стартовый рейтинг**: 1200.
- **K-фактор**: 32 для первых 30 матчей (провизорный период), затем 16.
- Матчмейкинг по Elo включается только при ≥100 матчах у обоих игроков.

## 6. Жизненный цикл матча

```
1. Игрок 1 в лобби нажимает "играть на 100 коинов в шашки"
   → matchmaking создаёт ticket в Redis-очереди
2. Игрок 2 нажимает то же
   → matchmaking находит пару (строго атомарно через Lua-скрипты или готовую очередь типа BullMQ для избежания race conditions), создаёт MatchProposal
3. Платформа списывает ставки (bet_lock × 2 в ledger), создаёт match в Postgres со статусом 'starting'
4. Game SDK инициализирует state через initMatch(config, seed)
5. Состояние кладётся в Redis: key=match:{id}, ttl=2ч
6. Оба клиента подключаются по WS к этому matchId
7. Игрок шлёт move → WS-сервер вызывает isValidMove, applyMove, обновляет Redis, шлёт обоим getClientView (не полный state!)
8. checkGameOver → если over, матч завершается: settle ledger (учитывая ничью), save replay в Postgres, обновить Elo
9. Антифрод-хуки получают match-completed событие, проверяют паттерны
```

### Брошенные матчи (abandoned match cleanup)
Cron-job каждые 60 секунд проверяет активные матчи:
1. Если `last_move_at` > N минут назад (например, 10 мин) и оба игрока оффлайн — матч помечается `abandoned`.
2. Техпоражение тому, чей ход был (по `getCurrentTurn`). Если оба оффлайн и непонятно кто бросил — `bet_unlock` обоим, матч `cancelled`.
3. Выполняется `bet_settle` или `bet_unlock`, replay сохраняется, state удаляется из Redis.

## 7. WebSocket-протокол (упрощённый)

```typescript
// Клиент → Сервер
type ClientMessage =
  | { type: 'auth'; token: string }
  | { type: 'join_match'; matchId: string }
  | { type: 'submit_move'; matchId: string; move: unknown; moveIndex: number; idempotencyKey: string }
  | { type: 'resign'; matchId: string }
  | { type: 'ping' };

// Сервер → Клиент
type ServerMessage =
  | { type: 'auth_ok'; userId: string }
  | { type: 'match_state'; matchId: string; state: unknown; currentTurn: 0 | 1; clocks: { p0: number; p1: number }; lastMoveIndex: number }
  | { type: 'match_over'; matchId: string; winner: 0 | 1 | 'draw'; payout: number }
  | { type: 'invalid_move'; reason: string }
  | { type: 'opponent_disconnected'; reconnectDeadlineSec: number }
  | { type: 'error'; code: string; message: string }
  | { type: 'pong' };
```

### Правила WS
- Реконнект игрока в течение 60 сек не приводит к проигрышу. Для оптимизации при реконнекте можно передавать не весь state, а только лог ходов с последнего известного клиенту `moveIndex` (по желанию для MVP передается весь state).
- Если игрок не реконнектится за 60 сек — техническое поражение.
- На каждый submit_move есть idempotency: проверяется как `idempotencyKey`, так и `moveIndex`. Повторная отправка того же ключа или старого индекса хода возвращает текущее состояние и не применяется второй раз.

## 8. Антифрод-правила (v1)

Все — асинхронные после завершения матча, в очередь воркера. Срабатывание → флаг в БД, ручной review через админку.

1. **Pair-collusion**: пара игроков сыграла >5 матчей за 24ч между собой → flag.
2. **Same-network**: оба игрока с одного `/24` IP или одного ASN → flag.
3. **New-account drain**: игрок с возрастом аккаунта <24ч проиграл >$50 одному оппоненту → flag.
4. **Robot timing**: разброс времени на ход у игрока <500ms за 50 ходов подряд → flag.
5. **Engine-perfect play**: match-rate ходов с идеальной линией движка (Stockfish для шахмат, KingsRow/Aurora для шашек) >95% → flag. Обязательно для ВСЕХ skill-based игр с первого дня.

Действия по flags — только ручные на старте: warning, временный бан, разморозка только депозита, бан без вывода.

## 9. Тесты — что покрываем обязательно

| Слой | Покрытие |
|---|---|
| `packages/games/*` (правила игр) | ≥ 90% линий |
| `wallet/` | 100% операций ledger + race condition tests |
| `matches/` (lifecycle) | end-to-end happy path + дисконнекты + abandonment |
| Game SDK contract | каждая игра проходит общий тест-сьют (initMatch deterministic, replay round-trip) |
| Идемпотентность API | обязательно для всех мутирующих эндпоинтов |

## 10. Безопасность

- Все пароли — Argon2id (НЕ bcrypt в новых проектах).
- JWT — RS256 с ротацией ключей.
- Refresh token — opaque, в БД, можно отозвать.
- Все user-input идут через class-validator DTO. Никаких `body: any`.
- Rate limiting на auth-endpoints: 5 попыток в минуту с IP.
- CSRF не нужен (JWT в Authorization header, не куки), но HTTPS-only.
- Админка — отдельный домен, отдельный auth flow, IP allowlist.
- Логи: никогда не логируем JWT, пароли, токены платёжных провайдеров.

## 11. Деплой и среды

- `local` — docker-compose, локалка разраба.
- `staging` — Railway/Render, отдельная БД, тестовые деньги/коины.
- `production` — Railway/Render на старте, миграция на AWS/GCP при >500 DAU.

CI: на каждый PR — lint, typecheck, tests, build. Merge в `main` → автодеплой в staging. Тэг `vX.Y.Z` → деплой в prod.

### Graceful shutdown WS-сервера
При деплое нового кода WS-сервера:
1. Перестать принимать новые подключения (drain).
2. Дождаться завершения активных матчей или таймаута (120 сек).
3. Если таймаут — отправить клиентам `{ type: 'error', code: 'server_restart' }`, клиент автоматически реконнектится к новому инстансу (состояние в Redis, не потеряно).
4. Мониторинг: метрика `active_matches_count` — не деплоить если > 0 (для MVP).

## 12. Что NOT TO DO (типичные ошибки)

- ❌ Считать победителя на клиенте
- ❌ Хранить баланс как поле user-а, обновляя UPDATE
- ❌ Игнорировать idempotency для submit_move (приводит к двойным ходам при реконнекте)
- ❌ Помещать game-specific логику в `apps/api/matches/` (она в `packages/games/{game}/`)
- ❌ Использовать `Math.random()` в game logic (не воспроизводимо). Всегда seeded PRNG.
- ❌ Кэшировать баланс в Redis как источник истины (это денормализация, источник — ledger в Postgres)
- ❌ Доверять `created_at` от клиента
- ❌ Класть секреты в репо (используй .env.local, никогда не коммить)
- ❌ Делать "общий" чат — это вектор для коллюзии и токсичности

---

**При генерации кода по этому документу всегда проверяй**:
1. Соблюдён ли server-authority?
2. Идемпотентна ли операция?
3. Финансовые операции — в транзакции и через ledger?
4. Покрыто ли тестами?
5. Не нарушает ли §12?
