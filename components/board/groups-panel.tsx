'use client'

import { ChevronRight, Users, Gamepad2, Swords } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { PlayerAvatar } from '@/components/board/player-avatar'
import { CreateGroupDialog } from '@/components/board/create-group-dialog'
import { useStore } from '@/lib/store'
import { authClient } from '@/lib/auth-client'
import Link from 'next/link'

export function GroupsPanel({ onOpenGroup }: { onOpenGroup: (id: string) => void }) {
  const { groups, players, games, matches } = useStore()
  const { data: session, isPending } = authClient.useSession()
  const visibleGroups = session ? groups.filter((group) => players.some((player) => player.groupId === group.id && player.name.toLowerCase() === session.user.name.toLowerCase())) : []

  if (isPending) return null
  if (!session) return <Card className="border-primary/20 bg-card"><CardContent className="flex flex-col items-center gap-3 p-10 text-center"><h2 className="font-serif text-2xl font-semibold">Tus grupos están protegidos</h2><p className="max-w-md text-sm text-muted-foreground">Iniciá sesión para ver los grupos donde jugás. El leaderboard general permanece disponible para toda la mesa.</p><Link className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" href="/sign-in">Iniciar sesión</Link></CardContent></Card>

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl font-semibold text-foreground">Tus grupos</h2>
          <p className="text-sm text-muted-foreground">
            Elegí un grupo para gestionar sus juegos y cargar partidas.
          </p>
        </div>
        <CreateGroupDialog onCreated={onOpenGroup} />
      </div>

      {visibleGroups.length === 0 ? (
        <Empty className="rounded-xl border border-dashed border-border bg-card/50 py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users />
            </EmptyMedia>
            <EmptyTitle>Todavía no hay grupos</EmptyTitle>
            <EmptyDescription>
              Creá tu primer grupo y sumá a los jugadores de la mesa.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleGroups.map((group) => {
            const members = players.filter((p) => p.groupId === group.id)
            const gameCount = games.filter((g) => g.groupId === group.id).length
            const matchCount = matches.filter((m) => m.groupId === group.id).length
            return (
              <Card
                key={group.id}
                className="group overflow-hidden border-border/80 transition-colors hover:border-primary/50"
              >
                <CardContent className="flex h-full flex-col gap-4 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-serif text-lg font-semibold leading-tight text-foreground">
                        {group.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {members.length} jugadores
                      </p>
                    </div>
                    <Badge variant="secondary" className="gap-1">
                      <Swords className="size-3" />
                      {matchCount}
                    </Badge>
                  </div>

                  <div className="flex -space-x-2">
                    {members.slice(0, 5).map((m) => (
                      <PlayerAvatar
                        key={m.id}
                        id={m.id}
                        name={m.name}
                        className="size-9 ring-2 ring-card"
                      />
                    ))}
                    {members.length > 5 && (
                      <div className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground ring-2 ring-card">
                        +{members.length - 5}
                      </div>
                    )}
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Gamepad2 className="size-3.5" />
                      {gameCount} juegos
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenGroup(group.id)}
                      className="text-primary hover:text-primary"
                    >
                      Abrir
                      <ChevronRight data-icon="inline-end" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
