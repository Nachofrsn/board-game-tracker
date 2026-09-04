'use client'

import * as React from 'react'
import type { Group, Player, Game, Match } from '@/lib/types'

/*
 * In-memory data layer for the board game tracker.
 *
 * NOTE: This provider keeps all state in memory for the session. It is written
 * as a single access layer (the `useStore` hook) so it can later be swapped for
 * a real database (Neon/Supabase) without touching the UI components — each
 * mutation below maps 1:1 to an API route / SQL statement.
 */

type State = {
  groups: Group[]
  players: Player[]
  games: Game[]
  matches: Match[]
}

const uid = () => Math.random().toString(36).slice(2, 10)

const emptyState: State = {
  groups: [],
  players: [],
  games: [],
  matches: [],
}

type StoreValue = State & {
  addGroup: (name: string, playerNames: string[]) => string
  deleteGroup: (groupId: string) => void
  addPlayer: (groupId: string, name: string) => void
  removePlayer: (playerId: string) => void
  addGame: (game: Omit<Game, 'id'>) => void
  deleteGame: (gameId: string) => void
  addMatch: (match: Omit<Match, 'id'>) => void
  deleteMatch: (matchId: string) => void
}

const StoreContext = React.createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<State>(() => emptyState)
  const hydrated = React.useRef(false)

  React.useEffect(() => {
    fetch('/api/board')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data || hydrated.current) return
        hydrated.current = true
        if (Array.isArray(data.groups)) {
          setState({
            groups: (data.groups ?? []).map((g: any) => ({
              id: g.id,
              name: g.name,
              createdAt: g.createdAt ?? g.created_at,
            })),
            players: (data.players ?? []).map((p: any) => ({
              id: p.id,
              groupId:
                data.groupPlayers?.find((x: any) => x.playerId === p.id)?.groupId ??
                data.groupPlayers?.find((x: any) => x.player_id === p.id)?.group_id ??
                '',
              name: p.name,
            })),
            games: (data.games ?? []).map((g: any) => ({
              id: g.id,
              groupId: data.groupGames?.find((x: any) => x.gameId === g.id)?.groupId,
              name: g.name,
              photoUrl: g.imageUrl ?? g.image_url,
              category: g.description,
            })),
            matches: (data.matches ?? []).map((m: any) => ({
              id: m.id,
              groupId: m.groupId ?? m.group_id,
              gameId: m.gameId ?? m.game_id,
              winnerId: m.winnerId ?? m.winner_id,
              durationMinutes: m.durationMinutes ?? m.duration_minutes,
              playedAt: m.playedAt ?? m.played_at,
              playerIds: (data.matchPlayers ?? [])
                .filter((x: any) => x.matchId === m.id)
                .map((x: any) => x.playerId),
            })),
          })
        }
      })
      .catch(() => {
        hydrated.current = true
      })
  }, [])

  const persist = React.useCallback((payload: unknown) => { fetch('/api/board', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(() => {}) }, [])
  const remove = React.useCallback((type: 'group' | 'game' | 'match', id: string) => { fetch('/api/board', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, id }) }).catch(() => {}) }, [])

  const value = React.useMemo<StoreValue>(() => {
    return {
      ...state,
      addGroup(name, playerNames) {
        const id = 'g-' + uid()
        const group: Group = {
          id,
          name: name.trim(),
          createdAt: new Date().toISOString().slice(0, 10),
        }
        const players: Player[] = playerNames
          .map((n) => n.trim())
          .filter(Boolean)
          .map((n) => ({ id: 'p-' + uid(), groupId: id, name: n }))
        setState((s) => ({ ...s, groups: [...s.groups, group], players: [...s.players, ...players] }))
        persist({ type: 'group', id, group: { id, name: group.name, color: 'amber', description: null }, players: players.map((p) => ({ id: p.id, name: p.name, initials: p.name.slice(0, 2).toUpperCase(), color: 'amber' })) })
        return id
      },
      deleteGroup(groupId) {
        setState((s) => ({
          groups: s.groups.filter((g) => g.id !== groupId),
          players: s.players.filter((p) => p.groupId !== groupId),
          games: s.games.filter((g) => g.groupId !== groupId),
          matches: s.matches.filter((m) => m.groupId !== groupId),
        }))
        remove('group', groupId)
      },
      addPlayer(groupId, name) {
        const player: Player = { id: 'p-' + uid(), groupId, name: name.trim() }
        setState((s) => ({ ...s, players: [...s.players, player] }))
        persist({ type: 'player', id: player.id, groupId, player: { id: player.id, name: player.name, initials: player.name.slice(0, 2).toUpperCase(), color: 'amber' } })
      },
      removePlayer(playerId) {
        setState((s) => ({ ...s, players: s.players.filter((p) => p.id !== playerId) }))
      },
      addGame(game) {
        const full: Game = { ...game, id: 'game-' + uid() }
        setState((s) => ({ ...s, games: [...s.games, full] }))
        persist({ type: 'game', id: full.id, groupId: full.groupId, game: { id: full.id, name: full.name, description: full.category ?? null, imageUrl: full.photoUrl ?? null, color: 'amber' } })
      },
      deleteGame(gameId) {
        setState((s) => ({
          ...s,
          games: s.games.filter((g) => g.id !== gameId),
          matches: s.matches.filter((m) => m.gameId !== gameId),
        }))
        remove('game', gameId)
      },
      addMatch(match) {
        const full: Match = { ...match, id: 'm-' + uid() }
        setState((s) => ({ ...s, matches: [...s.matches, full] }))
        persist({ type: 'match', id: full.id, match: { id: full.id, groupId: full.groupId, gameId: full.gameId, winnerId: full.winnerId, durationMinutes: full.durationMinutes, playedAt: new Date(full.playedAt) }, playerIds: full.playerIds })
      },
      deleteMatch(matchId) {
        setState((s) => ({ ...s, matches: s.matches.filter((m) => m.id !== matchId) }))
        remove('match', matchId)
      },
    }
  }, [state, persist, remove])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = React.useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
