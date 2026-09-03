import type { Group, Player, Game, Match, PlayerStat } from '@/lib/types'

export function computePlayerStats(
  players: Player[],
  matches: Match[],
  groups: Group[],
  groupId?: string,
): PlayerStat[] {
  const groupName = (id: string) => groups.find((g) => g.id === id)?.name ?? '—'
  const scoped = groupId ? players.filter((p) => p.groupId === groupId) : players

  const stats = scoped.map<PlayerStat>((p) => {
    const playerMatches = matches.filter((m) => m.playerIds.includes(p.id))
    const wins = playerMatches.filter((m) => m.winnerId === p.id).length
    const played = playerMatches.length
    const minutesPlayed = playerMatches.reduce((acc, m) => acc + m.durationMinutes, 0)
    return {
      playerId: p.id,
      playerName: p.name,
      groupId: p.groupId,
      groupName: groupName(p.groupId),
      played,
      wins,
      winrate: played ? wins / played : 0,
      minutesPlayed,
    }
  })

  return stats.sort((a, b) => b.wins - a.wins || b.winrate - a.winrate || b.played - a.played)
}

export function formatWinrate(w: number) {
  return `${Math.round(w * 100)}%`
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

export function gameName(games: Game[], id: string) {
  return games.find((g) => g.id === id)?.name ?? 'Juego'
}

export function playerName(players: Player[], id: string) {
  return players.find((p) => p.id === id)?.name ?? 'Jugador'
}

/** Deterministic initials for avatar fallbacks. */
export function initials(name: string) {
  return name
    .split(/\s+/)
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/** Assign a stable chart color index (1-5) to a player id. */
export function colorIndex(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 5
  return h + 1
}
