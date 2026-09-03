import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { boardGroups, boardPlayers, boardGroupPlayers, boardGames, boardGroupGames, boardMatches, boardMatchPlayers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  const [groups, players, groupPlayers, games, groupGames, matches, matchPlayers] = await Promise.all([
    db.select().from(boardGroups), db.select().from(boardPlayers), db.select().from(boardGroupPlayers), db.select().from(boardGames), db.select().from(boardGroupGames), db.select().from(boardMatches), db.select().from(boardMatchPlayers),
  ])
  return NextResponse.json({ groups, players, groupPlayers, games, groupGames, matches, matchPlayers })
}

export async function POST(request: Request) {
  const body = await request.json()
  const id = String(body.id || '')
  if (!id || !['group', 'player', 'game', 'match'].includes(body.type)) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  if (body.type === 'group') { await db.insert(boardGroups).values(body.group); for (const player of body.players ?? []) { await db.insert(boardPlayers).values(player); await db.insert(boardGroupPlayers).values({ groupId: id, playerId: player.id }) } }
  if (body.type === 'player') { await db.insert(boardPlayers).values(body.player); await db.insert(boardGroupPlayers).values({ groupId: body.groupId, playerId: body.player.id }) }
  if (body.type === 'game') { await db.insert(boardGames).values(body.game); await db.insert(boardGroupGames).values({ groupId: body.groupId, gameId: id }) }
  if (body.type === 'match') { await db.insert(boardMatches).values(body.match); for (const playerId of body.playerIds ?? []) await db.insert(boardMatchPlayers).values({ matchId: id, playerId }) }
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const { type, id } = await request.json()
  if (type === 'group') await db.delete(boardGroups).where(eq(boardGroups.id, id))
  if (type === 'game') await db.delete(boardGames).where(eq(boardGames.id, id))
  if (type === 'match') await db.delete(boardMatches).where(eq(boardMatches.id, id))
  return NextResponse.json({ ok: true })
}
