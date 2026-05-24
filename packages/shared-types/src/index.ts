// Shared types for the RMG platform
// DTO, API types, WS events будут добавлены в следующих спринтах

export type UserId = string;
export type MatchId = string;
export type GameId = string;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
