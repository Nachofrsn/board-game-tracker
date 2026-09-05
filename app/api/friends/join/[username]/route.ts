import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, userFriendships } from '@/lib/db/schema'
import { eq, or, and, sql } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params
  if (!username) {
    return NextResponse.json({ error: 'Usuario no especificado' }, { status: 400 })
  }

  const cleanUsername = decodeURIComponent(username).trim().toLowerCase()

  const [inviter] = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      image: users.image,
    })
    .from(users)
    .where(
      or(
        sql`LOWER(${users.username}) = LOWER(${cleanUsername})`,
        sql`LOWER(${users.id}) = LOWER(${cleanUsername})`
      )
    )
    .limit(1)

  if (!inviter) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  const session = await auth.api.getSession({ headers: await headers() })
  const currentUserId = session?.user?.id

  if (!currentUserId) {
    return NextResponse.json({
      inviter,
      isLoggedIn: false,
      isSelf: false,
      status: 'none',
      currentUser: null,
    })
  }

  const isSelf = currentUserId === inviter.id
  if (isSelf) {
    return NextResponse.json({
      inviter,
      isLoggedIn: true,
      isSelf: true,
      status: 'self',
      currentUser: {
        id: session.user.id,
        name: session.user.name,
        username: (session.user as any).username || null,
      },
    })
  }

  const [existing] = await db
    .select()
    .from(userFriendships)
    .where(
      or(
        and(eq(userFriendships.userId, currentUserId), eq(userFriendships.friendId, inviter.id)),
        and(eq(userFriendships.userId, inviter.id), eq(userFriendships.friendId, currentUserId))
      )
    )
    .limit(1)

  let status: 'none' | 'friend' | 'pending_sent' | 'pending_received' = 'none'
  if (existing) {
    if (existing.status === 'accepted') {
      status = 'friend'
    } else if (existing.status === 'pending') {
      status = existing.userId === currentUserId ? 'pending_sent' : 'pending_received'
    }
  }

  return NextResponse.json({
    inviter,
    isLoggedIn: true,
    isSelf: false,
    status,
    currentUser: {
      id: session.user.id,
      name: session.user.name,
      username: (session.user as any).username || null,
    },
  })
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Iniciá sesión o registrate para agregar como amigo.' },
      { status: 401 }
    )
  }

  const { username } = await params
  if (!username) {
    return NextResponse.json({ error: 'Usuario no especificado' }, { status: 400 })
  }

  const cleanUsername = decodeURIComponent(username).trim().toLowerCase()

  const [inviter] = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
    })
    .from(users)
    .where(
      or(
        sql`LOWER(${users.username}) = LOWER(${cleanUsername})`,
        sql`LOWER(${users.id}) = LOWER(${cleanUsername})`
      )
    )
    .limit(1)

  if (!inviter) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  const currentUserId = session.user.id
  if (currentUserId === inviter.id) {
    return NextResponse.json(
      { error: 'No podés agregarte a vos mismo como amigo.' },
      { status: 400 }
    )
  }

  const [existing] = await db
    .select()
    .from(userFriendships)
    .where(
      or(
        and(eq(userFriendships.userId, currentUserId), eq(userFriendships.friendId, inviter.id)),
        and(eq(userFriendships.userId, inviter.id), eq(userFriendships.friendId, currentUserId))
      )
    )
    .limit(1)

  if (existing) {
    if (existing.status === 'accepted') {
      return NextResponse.json({
        ok: true,
        alreadyFriend: true,
        message: `Ya sos amigo de ${inviter.name}.`,
      })
    }

    await db
      .update(userFriendships)
      .set({ status: 'accepted', updatedAt: new Date() })
      .where(eq(userFriendships.id, existing.id))

    return NextResponse.json({
      ok: true,
      alreadyFriend: false,
      message: `¡Ahora sos amigo de ${inviter.name}!`,
    })
  }

  const newId = 'f-' + Math.random().toString(36).slice(2, 10)
  await db.insert(userFriendships).values({
    id: newId,
    userId: inviter.id,
    friendId: currentUserId,
    status: 'accepted',
  })

  return NextResponse.json({
    ok: true,
    alreadyFriend: false,
    message: `¡Ahora sos amigo de ${inviter.name}!`,
  })
}
