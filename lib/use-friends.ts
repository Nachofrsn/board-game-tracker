'use client'

import * as React from 'react'
import type { Friend, FriendRequest } from '@/lib/types'
import { authClient } from '@/lib/auth-client'
import { toast } from 'sonner'

export function useFriends() {
  const { data: session } = authClient.useSession()
  const [friends, setFriends] = React.useState<Friend[]>([])
  const [incoming, setIncoming] = React.useState<FriendRequest[]>([])
  const [outgoing, setOutgoing] = React.useState<FriendRequest[]>([])
  const [loading, setLoading] = React.useState(true)

  const fetchFriends = React.useCallback(async () => {
    if (!session?.user) {
      setFriends([])
      setIncoming([])
      setOutgoing([])
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/friends')
      if (!res.ok) return
      const data = await res.json()
      setFriends(data.friends || [])
      setIncoming(data.incoming || [])
      setOutgoing(data.outgoing || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [session?.user])

  React.useEffect(() => {
    fetchFriends()
  }, [fetchFriends])

  const sendRequest = React.useCallback(
    async (emailOrId: { email?: string; targetUserId?: string }) => {
      try {
        const res = await fetch('/api/friends', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'send_request', ...emailOrId }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Error al enviar solicitud')
        toast.success(data.message || 'Solicitud enviada')
        await fetchFriends()
        return true
      } catch (err: any) {
        toast.error(err.message || 'Error al enviar solicitud')
        return false
      }
    },
    [fetchFriends]
  )

  const acceptRequest = React.useCallback(
    async (requestId: string) => {
      try {
        const res = await fetch('/api/friends', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'accept', requestId }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Error al aceptar solicitud')
        toast.success('¡Ahora son amigos!')
        await fetchFriends()
        return true
      } catch (err: any) {
        toast.error(err.message || 'Error al aceptar solicitud')
        return false
      }
    },
    [fetchFriends]
  )

  const declineRequest = React.useCallback(
    async (requestId: string) => {
      try {
        const res = await fetch('/api/friends', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'decline', requestId }),
        })
        if (!res.ok) throw new Error('Error al rechazar solicitud')
        toast.success('Solicitud rechazada')
        await fetchFriends()
        return true
      } catch (err: any) {
        toast.error(err.message || 'Error al rechazar solicitud')
        return false
      }
    },
    [fetchFriends]
  )

  const cancelRequest = React.useCallback(
    async (requestId: string) => {
      try {
        const res = await fetch('/api/friends', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'cancel', requestId }),
        })
        if (!res.ok) throw new Error('Error al cancelar solicitud')
        toast.success('Solicitud cancelada')
        await fetchFriends()
        return true
      } catch (err: any) {
        toast.error(err.message || 'Error al cancelar solicitud')
        return false
      }
    },
    [fetchFriends]
  )

  const removeFriend = React.useCallback(
    async (friendId: string) => {
      try {
        const res = await fetch('/api/friends', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'remove', friendId }),
        })
        if (!res.ok) throw new Error('Error al eliminar amigo')
        toast.success('Amigo eliminado')
        await fetchFriends()
        return true
      } catch (err: any) {
        toast.error(err.message || 'Error al eliminar amigo')
        return false
      }
    },
    [fetchFriends]
  )

  return {
    friends,
    incoming,
    outgoing,
    loading,
    refetch: fetchFriends,
    sendRequest,
    acceptRequest,
    declineRequest,
    cancelRequest,
    removeFriend,
  }
}
