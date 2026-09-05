import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  boardGroups,
  boardPlayers,
  boardGroupPlayers,
  boardGames,
  boardGroupGames,
  boardMatches,
  boardMatchPlayers,
} from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function GET() {
  const [groups, players, groupPlayers, games, groupGames, matches, matchPlayers] = await Promise.all([
    db.select().from(boardGroups),
    db.select().from(boardPlayers),
    db.select().from(boardGroupPlayers),
    db.select().from(boardGames),
    db.select().from(boardGroupGames),
    db.select().from(boardMatches),
    db.select().from(boardMatchPlayers),
  ])

  // Ensure all groups have an invite_code
  for (const g of groups) {
    if (!g.inviteCode) {
      const code = Math.random().toString(36).slice(2, 10)
      await db.update(boardGroups).set({ inviteCode: code }).where(eq(boardGroups.id, g.id))
      g.inviteCode = code
    }
  }

  return NextResponse.json({ groups, players, groupPlayers, games, groupGames, matches, matchPlayers })
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const id = String(body.id || '')
  if (!id || !['group', 'player', 'game', 'match'].includes(body.type)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  if (body.type === 'group') {
    const inviteCode = body.group.inviteCode || Math.random().toString(36).slice(2, 10)
    await db.insert(boardGroups).values({
      ...body.group,
      createdBy: session.user.id,
      inviteCode,
    })
    for (const player of body.players ?? []) {
      const playerUserId =
        player.userId ||
        (player.name.toLowerCase() === session.user.name.toLowerCase() ? session.user.id : null)
      await db.insert(boardPlayers).values({
        ...player,
        userId: playerUserId,
      })
      await db.insert(boardGroupPlayers).values({ groupId: id, playerId: player.id })
    }
  }

  if (body.type === 'player') {
    await db.insert(boardPlayers).values({
      ...body.player,
      userId: body.player.userId || null,
    })
    await db.insert(boardGroupPlayers).values({ groupId: body.groupId, playerId: body.player.id })
  }

  if (body.type === 'game') {
    await db.insert(boardGames).values(body.game)
    await db.insert(boardGroupGames).values({ groupId: body.groupId, gameId: id })
  }

  if (body.type === 'match') {
    await db.insert(boardMatches).values(body.match)
    for (const playerId of body.playerIds ?? []) {
      await db.insert(boardMatchPlayers).values({ matchId: id, playerId })
    }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const { type, id } = body
  if (!id || typeof id !== 'string' || !['group', 'game', 'match'].includes(type)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  if (type === 'group') {
    const [group] = await db.select().from(boardGroups).where(eq(boardGroups.id, id))
    if (!group) {
      return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 })
    }

    // Only creator can delete the group
    if (group.createdBy && group.createdBy !== session.user.id) {
      return NextResponse.json(
        { error: 'Solo la persona que creó el grupo puede eliminarlo.' },
        { status: 403 }
      )
    }

    await db.delete(boardGroupPlayers).where(eq(boardGroupPlayers.groupId, id))
    await db.delete(boardGroupGames).where(eq(boardGroupGames.groupId, id))
    const matches = await db.select({ id: boardMatches.id }).from(boardMatches).where(eq(boardMatches.groupId, id))
    for (const m of matches) {
      await db.delete(boardMatchPlayers).where(eq(boardMatchPlayers.matchId, m.id))
    }
    await db.delete(boardMatches).where(eq(boardMatches.groupId, id))
    await db.delete(boardGroups).where(eq(boardGroups.id, id))
  }

  if (type === 'game') {
    await db.delete(boardGroupGames).where(eq(boardGroupGames.gameId, id))
    const matches = await db.select({ id: boardMatches.id }).from(boardMatches).where(eq(boardMatches.gameId, id))
    for (const m of matches) {
      await db.delete(boardMatchPlayers).where(eq(boardMatchPlayers.matchId, m.id))
    }
    await db.delete(boardMatches).where(eq(boardMatches.gameId, id))
    await db.delete(boardGames).where(eq(boardGames.id, id))
  }

  if (type === 'match') {
    await db.delete(boardMatchPlayers).where(eq(boardMatchPlayers.matchId, id))
    await db.delete(boardMatches).where(eq(boardMatches.id, id))
  }

  return NextResponse.json({ ok: true })
}
