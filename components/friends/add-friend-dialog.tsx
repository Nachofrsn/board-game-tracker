'use client'

import * as React from 'react'
import { UserPlus, Search, Check, Clock, Share2, Copy, Link as LinkIcon, MessageCircle } from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PlayerAvatar } from '@/components/board/player-avatar'
import { authClient } from '@/lib/auth-client'
import { toast } from 'sonner'

type SearchUser = {
  id: string
  name: string
  username?: string | null
  image?: string | null
  status: 'none' | 'friend' | 'pending_sent' | 'pending_received'
  friendshipId?: string
}

export function AddFriendDialog({
  onSendRequest,
  onAcceptRequest,
}: {
  onSendRequest: (data: { targetUserId?: string; targetUsername?: string }) => Promise<boolean>
  onAcceptRequest: (requestId: string) => Promise<boolean>
}) {
  const { data: session } = authClient.useSession()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [results, setResults] = React.useState<SearchUser[]>([])
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)

  const currentUsername =
    (session?.user as any)?.username || session?.user?.name || ''

  const inviteUrl =
    typeof window !== 'undefined' && currentUsername
      ? `${window.location.origin}/join/friend/${encodeURIComponent(currentUsername)}`
      : ''

  function copyToClipboard() {
    if (!inviteUrl) return
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    toast.success('¡Enlace de invitación copiado!')
    setTimeout(() => setCopied(false), 2000)
  }

  function handleShareWhatsApp() {
    if (!inviteUrl) return
    const text = `¡Hola! Te invito a sumarte como amigo en Mesa Mayor para registrar nuestras partidas de juegos de mesa:\n${inviteUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
  }

  function handleNativeShare() {
    if (typeof navigator !== 'undefined' && navigator.share && inviteUrl) {
      navigator
        .share({
          title: 'Sumate como amigo en Mesa Mayor',
          text: 'Te invito a sumarte a Mesa Mayor para jugar y registrar nuestras partidas de juegos de mesa.',
          url: inviteUrl,
        })
        .catch(() => {})
    } else {
      copyToClipboard()
    }
  }

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
          <DialogTitle className="font-serif text-xl">Agregar amigos</DialogTitle>
          <DialogDescription>
            Invitá a tus amigos con un enlace directo o buscalos si ya tienen cuenta.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="w-full pt-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link" className="gap-1.5 text-xs sm:text-sm">
              <LinkIcon className="size-3.5" />
              Invitar con link
            </TabsTrigger>
            <TabsTrigger value="search" className="gap-1.5 text-xs sm:text-sm">
              <Search className="size-3.5" />
              Buscar usuario
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Share link (WhatsApp / Copy) */}
          <TabsContent value="link" className="flex flex-col gap-4 pt-4">
            <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-muted/40 p-3.5">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Share2 className="size-3.5 text-primary" />
                Tu enlace personal de amistad
              </span>
              <p className="text-xs text-muted-foreground">
                Cualquiera que abra este enlace podrá agregarte como amigo al instante con su cuenta.
              </p>

              <div className="flex items-center gap-2 mt-1">
                <Input readOnly value={inviteUrl} className="font-mono text-xs select-all bg-background" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                  title="Copiar link"
                >
                  {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                className="w-full gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white border-0 shadow-sm"
                onClick={handleShareWhatsApp}
              >
                <MessageCircle className="size-4 fill-current" />
                Compartir por WhatsApp
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="gap-2 text-xs" onClick={copyToClipboard}>
                  {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
                  {copied ? '¡Copiado!' : 'Copiar enlace'}
                </Button>
                <Button variant="outline" className="gap-2 text-xs" onClick={handleNativeShare}>
                  <Share2 className="size-3.5" />
                  Más opciones
                </Button>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground text-center">
              No se necesita email: tus amigos solo eligen su usuario y contraseña para sumarse.
            </p>
          </TabsContent>

          {/* TAB 2: Search existing users */}
          <TabsContent value="search" className="flex flex-col gap-4 pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por usuario o nombre..."
                className="pl-9"
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto">
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
                        {user.username && (
                          <span className="text-xs text-muted-foreground">@{user.username}</span>
                        )}
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
                    No encontramos ningún usuario con &quot;{query}&quot;
                  </p>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    ¿Todavía no se registró? Compartile tu enlace por WhatsApp para que se sume:
                  </p>
                  <Button
                    size="sm"
                    className="gap-2 mt-1 bg-[#25D366] hover:bg-[#20ba59] text-white border-0"
                    onClick={handleShareWhatsApp}
                  >
                    <MessageCircle className="size-3.5 fill-current" />
                    Enviar invitación por WhatsApp
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Escribí al menos 2 letras para buscar entre los usuarios registrados.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
