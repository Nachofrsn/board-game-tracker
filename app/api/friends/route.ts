import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { userFriendships, users } from '@/lib/db/schema'
import { eq, or, and, sql, inArray } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const currentUserId = session.user.id

  // 1. Get accepted friendships
  const acceptedRows = await db
    .select()
    .from(userFriendships)
    .where(
      and(
        eq(userFriendships.status, 'accepted'),
        or(eq(userFriendships.userId, currentUserId), eq(userFriendships.friendId, currentUserId))
      )
    )

  const friendIds = acceptedRows.map((r) => (r.userId === currentUserId ? r.friendId : r.userId))

  let friendsList: Array<{ id: string; name: string; email: string; image: string | null }> = []
  if (friendIds.length > 0) {
    friendsList = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
      })
      .from(users)
      .where(inArray(users.id, friendIds))
  }

  // 2. Incoming pending requests
  const incomingRows = await db
    .select({
      id: userFriendships.id,
      createdAt: userFriendships.createdAt,
      senderId: userFriendships.userId,
    })
    .from(userFriendships)
    .where(and(eq(userFriendships.friendId, currentUserId), eq(userFriendships.status, 'pending')))

  let incoming: Array<{ id: string; createdAt: Date; user: { id: string; name: string; email: string; image: string | null } }> = []
  if (incomingRows.length > 0) {
    const senderIds = incomingRows.map((r) => r.senderId)
    const senders = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
      })
      .from(users)
      .where(inArray(users.id, senderIds))

    const senderMap = new Map(senders.map((s) => [s.id, s]))
    incoming = incomingRows
      .map((r) => {
        const u = senderMap.get(r.senderId)
        if (!u) return null
        return {
          id: r.id,
          createdAt: r.createdAt,
          user: u,
        }
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x))
  }

  // 3. Outgoing pending requests
  const outgoingRows = await db
    .select({
      id: userFriendships.id,
      createdAt: userFriendships.createdAt,
      targetId: userFriendships.friendId,
    })
    .from(userFriendships)
    .where(and(eq(userFriendships.userId, currentUserId), eq(userFriendships.status, 'pending')))

  let outgoing: Array<{ id: string; createdAt: Date; user: { id: string; name: string; email: string; image: string | null } }> = []
  if (outgoingRows.length > 0) {
    const targetIds = outgoingRows.map((r) => r.targetId)
    const targets = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
      })
      .from(users)
      .where(inArray(users.id, targetIds))

    const targetMap = new Map(targets.map((t) => [t.id, t]))
    outgoing = outgoingRows
      .map((r) => {
        const u = targetMap.get(r.targetId)
        if (!u) return null
        return {
          id: r.id,
          createdAt: r.createdAt,
          user: u,
        }
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x))
  }

  return NextResponse.json({
    friends: friendsList,
    incoming,
    outgoing,
  })
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const currentUserId = session.user.id
  const body = await request.json().catch(() => ({}))
  const { action } = body

  if (action === 'send_request') {
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const targetUserId = typeof body.targetUserId === 'string' ? body.targetUserId.trim() : ''

    if (!email && !targetUserId) {
      return NextResponse.json({ error: 'Debes indicar un email o usuario.' }, { status: 400 })
    }

    // Find target user
    let targetUser: { id: string; name: string; email: string } | undefined
    if (email) {
      const [u] = await db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(sql`LOWER(${users.email}) = LOWER(${email})`)
        .limit(1)
      targetUser = u
    } else if (targetUserId) {
      const [u] = await db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, targetUserId))
        .limit(1)
      targetUser = u
    }

    if (!targetUser) {
      return NextResponse.json({ error: 'No se encontró ningún usuario con esos datos.' }, { status: 404 })
    }

    if (targetUser.id === currentUserId) {
      return NextResponse.json({ error: 'No podés agregarte a vos mismo como amigo.' }, { status: 400 })
    }

    // Check existing friendship
    const [existing] = await db
      .select()
      .from(userFriendships)
      .where(
        or(
          and(eq(userFriendships.userId, currentUserId), eq(userFriendships.friendId, targetUser.id)),
          and(eq(userFriendships.userId, targetUser.id), eq(userFriendships.friendId, currentUserId))
        )
      )
      .limit(1)

    if (existing) {
      if (existing.status === 'accepted') {
        return NextResponse.json({ error: 'Ya son amigos.' }, { status: 400 })
      }
      if (existing.status === 'pending') {
        if (existing.userId === currentUserId) {
          return NextResponse.json({ error: 'Ya enviaste una solicitud de amistad a este usuario.' }, { status: 400 })
        }
        // The other user had already sent a request to me: accept it!
        await db
          .update(userFriendships)
          .set({ status: 'accepted', updatedAt: new Date() })
          .where(eq(userFriendships.id, existing.id))
        return NextResponse.json({
          ok: true,
          message: `¡Solicitud aceptada! Ahora sos amigo de ${targetUser.name}.`,
          friend: targetUser,
        })
      }
      // If rejected, set to pending from current user
      await db
        .update(userFriendships)
        .set({
          userId: currentUserId,
          friendId: targetUser.id,
          status: 'pending',
          updatedAt: new Date(),
        })
        .where(eq(userFriendships.id, existing.id))
      return NextResponse.json({ ok: true, message: `Solicitud de amistad enviada a ${targetUser.name}.` })
    }

    // Create new pending friendship
    const id = 'f-' + Math.random().toString(36).slice(2, 10)
    await db.insert(userFriendships).values({
      id,
      userId: currentUserId,
      friendId: targetUser.id,
      status: 'pending',
    })

    return NextResponse.json({ ok: true, message: `Solicitud de amistad enviada a ${targetUser.name}.` })
  }

  if (action === 'accept') {
    const { requestId } = body
    if (!requestId) return NextResponse.json({ error: 'ID de solicitud faltante' }, { status: 400 })

    const [req] = await db
      .select()
      .from(userFriendships)
      .where(
        and(
          eq(userFriendships.id, requestId),
          eq(userFriendships.friendId, currentUserId),
          eq(userFriendships.status, 'pending')
        )
      )
      .limit(1)

    if (!req) return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })

    await db
      .update(userFriendships)
      .set({ status: 'accepted', updatedAt: new Date() })
      .where(eq(userFriendships.id, req.id))

    return NextResponse.json({ ok: true, message: 'Solicitud de amistad aceptada.' })
  }

  if (action === 'decline') {
    const { requestId } = body
    if (!requestId) return NextResponse.json({ error: 'ID de solicitud faltante' }, { status: 400 })

    await db
      .delete(userFriendships)
      .where(
        and(
          eq(userFriendships.id, requestId),
          eq(userFriendships.friendId, currentUserId)
        )
      )

    return NextResponse.json({ ok: true, message: 'Solicitud rechazada.' })
  }

  if (action === 'cancel') {
    const { requestId } = body
    if (!requestId) return NextResponse.json({ error: 'ID de solicitud faltante' }, { status: 400 })

    await db
      .delete(userFriendships)
      .where(
        and(
          eq(userFriendships.id, requestId),
          eq(userFriendships.userId, currentUserId)
        )
      )

    return NextResponse.json({ ok: true, message: 'Solicitud cancelada.' })
  }

  if (action === 'remove') {
    const { friendId } = body
    if (!friendId) return NextResponse.json({ error: 'ID de amigo faltante' }, { status: 400 })

    await db
      .delete(userFriendships)
      .where(
        or(
          and(eq(userFriendships.userId, currentUserId), eq(userFriendships.friendId, friendId)),
          and(eq(userFriendships.userId, friendId), eq(userFriendships.friendId, currentUserId))
        )
      )

    return NextResponse.json({ ok: true, message: 'Amigo eliminado.' })
  }

  return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
}
