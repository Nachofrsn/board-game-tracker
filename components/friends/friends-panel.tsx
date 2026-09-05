'use client'

import * as React from 'react'
import { Users, UserMinus, Check, X, Clock, Layers } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PlayerAvatar } from '@/components/board/player-avatar'
import { AddFriendDialog } from '@/components/friends/add-friend-dialog'
import { useFriends } from '@/lib/use-friends'
import { useStore } from '@/lib/store'
import { authClient } from '@/lib/auth-client'
import Link from 'next/link'

export function FriendsPanel() {
  const { data: session, isPending } = authClient.useSession()
  const { groups, players } = useStore()
  const {
    friends,
    incoming,
    outgoing,
    loading,
    sendRequest,
    acceptRequest,
    declineRequest,
    cancelRequest,
    removeFriend,
  } = useFriends()

  const [friendToRemove, setFriendToRemove] = React.useState<{ id: string; name: string } | null>(null)
  const [removing, setRemoving] = React.useState(false)

  if (isPending || loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Cargando amigos...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <Card className="border-primary/20 bg-card">
        <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Users className="size-6" />
          </div>
          <h2 className="font-serif text-2xl font-semibold">Tus amigos te esperan</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Iniciá sesión para agregar a tus amigos, sumarlos a grupos de juego y llevar el historial
            de partidas juntos.
          </p>
          <Link
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground mt-2"
            href="/sign-in"
          >
            Iniciar sesión
          </Link>
        </CardContent>
      </Card>
    )
  }

  async function handleConfirmRemove() {
    if (!friendToRemove) return
    setRemoving(true)
    await removeFriend(friendToRemove.id)
    setRemoving(false)
    setFriendToRemove(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl font-semibold text-foreground">Tus amigos</h2>
          <p className="text-sm text-muted-foreground">
            Agregá a tus compañeros de mesa para sumarlos rápidamente a cualquier grupo.
          </p>
        </div>
        <AddFriendDialog onSendRequest={sendRequest} onAcceptRequest={acceptRequest} />
      </div>

      <Tabs defaultValue="friends">
        <TabsList>
          <TabsTrigger value="friends">
            <Users data-icon="inline-start" className="size-4" />
            Amigos ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="incoming">
            Solicitudes recibidas
            {incoming.length > 0 && (
              <Badge variant="destructive" className="ml-1.5 h-5 px-1.5 text-xs">
                {incoming.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="outgoing">
            Enviadas ({outgoing.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Friends List */}
        <TabsContent value="friends" className="pt-4">
          {friends.length === 0 ? (
            <Empty className="rounded-xl border border-dashed border-border bg-card/50 py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Users />
                </EmptyMedia>
                <EmptyTitle>Todavía no agregaste amigos</EmptyTitle>
                <EmptyDescription>
                  Buscá a tus amigos por su email o nombre de usuario para empezar a compartir mesas de juego.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {friends.map((friend) => {
                // Count common groups
                const commonGroups = groups.filter((g) => {
                  const hasFriend = players.some(
                    (p) => p.groupId === g.id && p.userId === friend.id
                  )
                  const hasUser =
                    g.createdBy === session.user.id ||
                    players.some(
                      (p) =>
                        p.groupId === g.id &&
                        (p.userId === session.user.id ||
                          p.name.toLowerCase() === session.user.name.toLowerCase())
                    )
                  return hasFriend && hasUser
                })

                return (
                  <Card key={friend.id} className="border-border/80 transition-colors hover:border-primary/40">
                    <CardContent className="flex flex-col gap-4 p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <PlayerAvatar
                            id={friend.id}
                            name={friend.name}
                            className="size-11 ring-2 ring-card"
                          />
                          <div className="flex flex-col">
                            <h3 className="font-serif text-base font-semibold text-foreground leading-tight">
                              {friend.name}
                            </h3>
                            <span className="text-xs text-muted-foreground">{friend.email}</span>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive size-8"
                          title="Eliminar amigo"
                          onClick={() => setFriendToRemove(friend)}
                        >
                          <UserMinus className="size-4" />
                        </Button>
                      </div>

                      <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Layers className="size-3.5" />
                          {commonGroups.length === 0
                            ? 'Sin grupos en común'
                            : `${commonGroups.length} ${commonGroups.length === 1 ? 'grupo' : 'grupos'} en común`}
                        </span>
                        <Badge variant="secondary" className="text-[10px] uppercase font-semibold">
                          Amigo
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Incoming Requests */}
        <TabsContent value="incoming" className="pt-4">
          {incoming.length === 0 ? (
            <Empty className="rounded-xl border border-dashed border-border bg-card/50 py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Users />
                </EmptyMedia>
                <EmptyTitle>No tenés solicitudes pendientes</EmptyTitle>
                <EmptyDescription>
                  Cuando alguien te envíe una solicitud de amistad aparecerá acá.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {incoming.map((req) => (
                <Card key={req.id} className="border-border/80">
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div className="flex items-center gap-3">
                      <PlayerAvatar
                        id={req.user.id}
                        name={req.user.name}
                        className="size-10 ring-1 ring-border"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">
                          {req.user.name}
                        </span>
                        <span className="text-xs text-muted-foreground">{req.user.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="gap-1 px-3"
                        onClick={() => acceptRequest(req.id)}
                      >
                        <Check className="size-3.5" />
                        Aceptar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="px-2 text-muted-foreground hover:text-destructive"
                        onClick={() => declineRequest(req.id)}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Outgoing Requests */}
        <TabsContent value="outgoing" className="pt-4">
          {outgoing.length === 0 ? (
            <Empty className="rounded-xl border border-dashed border-border bg-card/50 py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Clock />
                </EmptyMedia>
                <EmptyTitle>No enviaste solicitudes pendientes</EmptyTitle>
                <EmptyDescription>
                  Las solicitudes que envíes y aún no hayan sido aceptadas aparecerán acá.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {outgoing.map((req) => (
                <Card key={req.id} className="border-border/80">
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div className="flex items-center gap-3">
                      <PlayerAvatar
                        id={req.user.id}
                        name={req.user.name}
                        className="size-10 ring-1 ring-border"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">
                          {req.user.name}
                        </span>
                        <span className="text-xs text-muted-foreground">{req.user.email}</span>
                        <span className="text-[11px] text-muted-foreground/80 mt-0.5 flex items-center gap-1">
                          <Clock className="size-3" />
                          Esperando confirmación...
                        </span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs text-muted-foreground hover:text-destructive"
                      onClick={() => cancelRequest(req.id)}
                    >
                      Cancelar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Remove Friend Confirmation Dialog */}
      <Dialog
        open={Boolean(friendToRemove)}
        onOpenChange={(o) => {
          if (!o) setFriendToRemove(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">¿Eliminar amigo?</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que querés eliminar a <strong>{friendToRemove?.name}</strong> de tu lista de amigos?
              No se eliminará de los grupos donde ya esté participando.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              variant="outline"
              disabled={removing}
              onClick={() => setFriendToRemove(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={removing}
              onClick={handleConfirmRemove}
            >
              {removing ? 'Eliminando...' : 'Eliminar amigo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
