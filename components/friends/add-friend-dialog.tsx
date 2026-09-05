'use client'

import * as React from 'react'
import { UserPlus, Search, Check, Clock, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { PlayerAvatar } from '@/components/board/player-avatar'

type SearchUser = {
  id: string
  name: string
  email: string
  image?: string | null
  status: 'none' | 'friend' | 'pending_sent' | 'pending_received'
  friendshipId?: string
}

export function AddFriendDialog({
  onSendRequest,
  onAcceptRequest,
}: {
  onSendRequest: (data: { email?: string; targetUserId?: string }) => Promise<boolean>
  onAcceptRequest: (requestId: string) => Promise<boolean>
}) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [results, setResults] = React.useState<SearchUser[]>([])
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null)

  React.useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    const timer = setTimeout(() => {
      setLoading(true)
      fetch(`/api/users/search?q=${encodeURIComponent(q)}`)
        .then((r) => (r.ok ? r.json() : { users: [] }))
        .then((data) => {
          setResults(data.users || [])
        })
        .catch(() => {
          setResults([])
        })
        .finally(() => {
          setLoading(false)
        })
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  async function handleSendToUser(userId: string) {
    setActionLoadingId(userId)
    const ok = await onSendRequest({ targetUserId: userId })
    if (ok) {
      setResults((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: 'pending_sent' } : u))
      )
    }
    setActionLoadingId(null)
  }

  async function handleSendByEmail(email: string) {
    setActionLoadingId(email)
    const ok = await onSendRequest({ email })
    if (ok) {
      setQuery('')
      setResults([])
      setOpen(false)
    }
    setActionLoadingId(null)
  }

  async function handleAccept(friendshipId: string, userId: string) {
    setActionLoadingId(userId)
    const ok = await onAcceptRequest(friendshipId)
    if (ok) {
      setResults((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: 'friend' } : u))
      )
    }
    setActionLoadingId(null)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) {
          setQuery('')
          setResults([])
        }
      }}
    >
      <DialogTrigger
        render={
          <Button size="sm" className="gap-2">
            <UserPlus className="size-4" />
            Agregar amigo
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Agregar un amigo</DialogTitle>
          <DialogDescription>
            Buscá por nombre o email para enviar una solicitud de amistad.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 pt-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o email..."
              className="pl-9"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                Buscando usuarios...
              </div>
            ) : results.length > 0 ? (
              results.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg border border-border/70 p-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <PlayerAvatar id={user.id} name={user.name} className="size-9" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{user.name}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </div>

                  <div>
                    {user.status === 'friend' ? (
                      <Badge variant="secondary" className="gap-1">
                        <Check className="size-3" />
                        Amigos
                      </Badge>
                    ) : user.status === 'pending_sent' ? (
                      <Badge variant="outline" className="gap-1 text-muted-foreground">
                        <Clock className="size-3" />
                        Enviada
                      </Badge>
                    ) : user.status === 'pending_received' && user.friendshipId ? (
                      <Button
                        size="sm"
                        disabled={actionLoadingId === user.id}
                        onClick={() => handleAccept(user.friendshipId!, user.id)}
                      >
                        Aceptar
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoadingId === user.id}
                        onClick={() => handleSendToUser(user.id)}
                      >
                        {actionLoadingId === user.id ? 'Enviando...' : 'Agregar'}
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : query.trim().length >= 2 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
                <p className="text-sm text-muted-foreground">
                  No encontramos usuarios registrados con &quot;{query}&quot;
                </p>
                {query.includes('@') && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 mt-1"
                    disabled={actionLoadingId === query}
                    onClick={() => handleSendByEmail(query.trim())}
                  >
                    <Mail className="size-3.5" />
                    Enviar solicitud a {query.trim()}
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">
                Escribí al menos 2 letras para buscar entre los usuarios registrados.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
