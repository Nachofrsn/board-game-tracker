import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { boardGroups, boardPlayers, boardGroupPlayers, users } from '@/lib/db/schema'
import { eq, inArray, and, or, sql } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  if (!code) {
    return NextResponse.json({ error: 'Código de invitación inválido' }, { status: 400 })
  }

  const [group] = await db
    .select()
    .from(boardGroups)
    .where(eq(boardGroups.inviteCode, code))
    .limit(1)

  if (!group) {
    return NextResponse.json({ error: 'Invitación no válida o expirada' }, { status: 404 })
  }

  // Get creator info
  let creatorName: string | null = null
  if (group.createdBy) {
    const [creator] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, group.createdBy))
      .limit(1)
    if (creator) creatorName = creator.name
  }

  // Get members
  const memberLinks = await db
    .select()
    .from(boardGroupPlayers)
    .where(eq(boardGroupPlayers.groupId, group.id))

  let members: Array<{ id: string; name: string; initials: string; color: string; userId: string | null }> = []
  if (memberLinks.length > 0) {
    members = await db
      .select({
        id: boardPlayers.id,
        name: boardPlayers.name,
        initials: boardPlayers.initials,
        color: boardPlayers.color,
        userId: boardPlayers.userId,
      })
      .from(boardPlayers)
      .where(inArray(boardPlayers.id, memberLinks.map((m) => m.playerId)))
  }

  // Check current session
  const session = await auth.api.getSession({ headers: await headers() })
  let isMember = false

  if (session?.user) {
    isMember = members.some(
      (m) =>
        m.userId === session.user.id ||
        m.name.toLowerCase() === session.user.name.toLowerCase()
    )
  }

  return NextResponse.json({
    group: {
      id: group.id,
      name: group.name,
      description: group.description,
      color: group.color,
    },
    creatorName,
    members,
    isMember,
    isLoggedIn: Boolean(session?.user),
    currentUser: session?.user
      ? { id: session.user.id, name: session.user.name, email: session.user.email }
      : null,
  })
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Debes iniciar sesión o registrarte para unirte al grupo.' },
      { status: 401 }
    )
  }

  const { code } = await params
  if (!code) {
    return NextResponse.json({ error: 'Código inválido' }, { status: 400 })
  }

  const [group] = await db
    .select()
    .from(boardGroups)
    .where(eq(boardGroups.inviteCode, code))
    .limit(1)

  if (!group) {
    return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 })
  }

  // Check if player is already member
  const memberLinks = await db
    .select()
    .from(boardGroupPlayers)
    .where(eq(boardGroupPlayers.groupId, group.id))

  let existingPlayerId: string | null = null

  if (memberLinks.length > 0) {
    const playerIds = memberLinks.map((m) => m.playerId)
    const [existing] = await db
      .select()
      .from(boardPlayers)
      .where(
        and(
          inArray(boardPlayers.id, playerIds),
          or(
            eq(boardPlayers.userId, session.user.id),
            sql`LOWER(${boardPlayers.name}) = LOWER(${session.user.name})`
          )
        )
      )
      .limit(1)

    if (existing) {
      existingPlayerId = existing.id
      if (!existing.userId) {
        await db.update(boardPlayers).set({ userId: session.user.id }).where(eq(boardPlayers.id, existing.id))
      }
      return NextResponse.json({ ok: true, alreadyMember: true, groupId: group.id })
    }
  }

  // Create new player for this group
  const newPlayerId = 'p-' + Math.random().toString(36).slice(2, 10)
  const initials = (session.user.name || 'PL').slice(0, 2).toUpperCase()

  await db.insert(boardPlayers).values({
    id: newPlayerId,
    name: session.user.name,
    initials,
    color: 'amber',
    userId: session.user.id,
  })

  await db.insert(boardGroupPlayers).values({
    groupId: group.id,
    playerId: newPlayerId,
  })

  return NextResponse.json({ ok: true, alreadyMember: false, groupId: group.id })
}
