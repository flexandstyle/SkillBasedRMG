// packages/game-sdk/src/index.ts
// Центральный контракт платформы.
// Каждая игра реализует ровно этот интерфейс.
// Платформа взаимодействует с играми ТОЛЬКО через него.

export interface GameDefinition<TState, TMove, TConfig = object> {
  id: string;
  displayName: string;
  minPlayers: 2;
  maxPlayers: 2;
  averageDurationSec: number;
  drawPossible: boolean;

  /** Создать начальное состояние матча */
  initMatch(config: TConfig, seed: string): TState;

  /** Чей ход сейчас? Возвращает индекс игрока 0 или 1 */
  getCurrentTurn(state: TState): 0 | 1;

  /** Список всех валидных ходов для текущего игрока */
  getValidMoves(state: TState, playerIdx: 0 | 1): TMove[];

  /** Валиден ли ход. Вызывается НА СЕРВЕРЕ перед применением. */
  isValidMove(state: TState, move: TMove, playerIdx: 0 | 1): ValidationResult;

  /** Применить ход. Возвращает новое состояние. Чистая функция. */
  applyMove(state: TState, move: TMove, playerIdx: 0 | 1): TState;

  /** Окончен ли матч и кто победитель */
  checkGameOver(state: TState): GameOverResult;

  /**
   * Возвращает видимую часть состояния для конкретного игрока.
   * Для игр с полной информацией (шашки) — возвращает всё.
   * Для игр со скрытой информацией (нарды) — скрывает данные оппонента.
   */
  getClientView(state: TState, playerIdx: 0 | 1): unknown;

  /** Сериализация ходов для replay-лога */
  serializeReplay(initialState: TState, moves: TMove[]): ReplayBlob;

  /** Восстановление состояния из replay */
  replayFromBlob(blob: ReplayBlob): TState;

  /** Таймаут хода в секундах */
  getMoveTimeoutSec(state: TState): number;
}

export type ValidationResult =
  | { valid: true }
  | { valid: false; reason: string };

export type GameOverResult =
  | { over: false }
  | { over: true; winner: 0 | 1 | 'draw' };

export interface ReplayBlob {
  gameId: string;
  version: number;
  initialState: unknown;
  moves: unknown[];
  seed: string;
}
