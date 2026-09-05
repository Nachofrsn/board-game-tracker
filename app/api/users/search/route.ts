import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, userFriendships } from '@/lib/db/schema'
import { sql, ne, and, or, eq, inArray } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim().toLowerCase() || ''

  if (!q || q.length < 2) {
    return NextResponse.json({ users: [] })
  }

  const currentUserId = session.user.id
  const pattern = `%${q}%`

  // Search users matching name or username, excluding current user
  const foundUsers = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      image: users.image,
    })
    .from(users)
    .where(
      and(
        ne(users.id, currentUserId),
        or(
          sql`LOWER(${users.name}) LIKE ${pattern}`,
          sql`LOWER(${users.username}) LIKE ${pattern}`
        )
      )
    )
    .limit(10)

  if (foundUsers.length === 0) {
    return NextResponse.json({ users: [] })
  }

  // Check friendship status for each found user
  const userIds = foundUsers.map((u) => u.id)
  const existingFriendships = await db
    .select({
      id: userFriendships.id,
      userId: userFriendships.userId,
      friendId: userFriendships.friendId,
      status: userFriendships.status,
    })
    .from(userFriendships)
    .where(
      or(
        and(eq(userFriendships.userId, currentUserId), inArray(userFriendships.friendId, userIds)),
        and(eq(userFriendships.friendId, currentUserId), inArray(userFriendships.userId, userIds))
      )
    )

  const result = foundUsers.map((u) => {
    const f = existingFriendships.find(
      (rel) =>
        (rel.userId === currentUserId && rel.friendId === u.id) ||
        (rel.friendId === currentUserId && rel.userId === u.id)
    )

    let status: 'none' | 'friend' | 'pending_sent' | 'pending_received' = 'none'
    let friendshipId: string | undefined

    if (f) {
      friendshipId = f.id
      if (f.status === 'accepted') {
        status = 'friend'
      } else if (f.status === 'pending') {
        status = f.userId === currentUserId ? 'pending_sent' : 'pending_received'
      }
    }

    return {
      ...u,
      status,
      friendshipId,
    }
  })

  return NextResponse.json(
    { users: result },
    {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    }
  )
}

