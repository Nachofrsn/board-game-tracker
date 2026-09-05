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

  // Fetch creator, members with join, and session in parallel
  const [creatorRes, members, session] = await Promise.all([
    group.createdBy
      ? db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, group.createdBy))
          .limit(1)
      : Promise.resolve([]),
    db
      .select({
        id: boardPlayers.id,
        name: boardPlayers.name,
        initials: boardPlayers.initials,
        color: boardPlayers.color,
        userId: boardPlayers.userId,
      })
      .from(boardGroupPlayers)
      .innerJoin(boardPlayers, eq(boardGroupPlayers.playerId, boardPlayers.id))
      .where(eq(boardGroupPlayers.groupId, group.id)),
    auth.api.getSession({ headers: await headers() }),
  ])

  const creatorName = creatorRes[0]?.name ?? null
  let isMember = false

  if (session?.user) {
    const currentUserId = session.user.id
    const currentUserNameLower = session.user.name?.toLowerCase()
    isMember = members.some(
      (m) =>
        m.userId === currentUserId ||
        (currentUserNameLower && m.name.toLowerCase() === currentUserNameLower)
    )
  }

  return NextResponse.json(
    {
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
        ? {
            id: session.user.id,
            name: session.user.name,
            username: (session.user as any).username || null,
            email: session.user.email,
          }
        : null,
    },
    {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    }
  )
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
    .select({ id: boardGroups.id })
    .from(boardGroups)
    .where(eq(boardGroups.inviteCode, code))
    .limit(1)

  if (!group) {
    return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 })
  }

  // Check if player is already member using a single JOIN query
  const [existing] = await db
    .select({ id: boardPlayers.id, userId: boardPlayers.userId })
    .from(boardGroupPlayers)
    .innerJoin(boardPlayers, eq(boardGroupPlayers.playerId, boardPlayers.id))
    .where(
      and(
        eq(boardGroupPlayers.groupId, group.id),
        or(
          eq(boardPlayers.userId, session.user.id),
          sql`LOWER(${boardPlayers.name}) = LOWER(${session.user.name})`
        )
      )
    )
    .limit(1)

  if (existing) {
    if (!existing.userId) {
      await db.update(boardPlayers).set({ userId: session.user.id }).where(eq(boardPlayers.id, existing.id))
    }
    return NextResponse.json({ ok: true, alreadyMember: true, groupId: group.id })
  }

  // Create new player for this group in a transaction
  const newPlayerId = 'p-' + Math.random().toString(36).slice(2, 10)
  const initials = (session.user.name || 'PL').slice(0, 2).toUpperCase()

  await db.transaction(async (tx) => {
    await tx.insert(boardPlayers).values({
      id: newPlayerId,
      name: session.user.name,
      initials,
      color: 'amber',
      userId: session.user.id,
    })

    await tx.insert(boardGroupPlayers).values({
      groupId: group.id,
      playerId: newPlayerId,
    })
  })

  return NextResponse.json({ ok: true, alreadyMember: false, groupId: group.id })
}
