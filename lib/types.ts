export type Player = {
  id: string
  groupId: string
  name: string
}

export type Group = {
  id: string
  name: string
  createdAt: string
}

export type Game = {
  id: string
  groupId: string
  name: string
  /** Cover image: data URL (uploaded) or a public path. */
  photoUrl?: string
  category?: string
  /** Suggested play time in minutes (optional metadata). */
  suggestedMinutes?: number
}

export type Match = {
  id: string
  groupId: string
  gameId: string
  /** ISO date of when it was played. */
  playedAt: string
  /** Duration of the match in minutes. */
  durationMinutes: number
  /** Players that took part in the match. */
  playerIds: string[]
  /** Winner (one of playerIds). */
  winnerId: string
}

/** Aggregated per-player statistics. */
export type PlayerStat = {
  playerId: string
  playerName: string
  groupId: string
  groupName: string
  played: number
  wins: number
  winrate: number
  minutesPlayed: number
}
