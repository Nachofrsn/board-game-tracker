'use client'

import * as React from 'react'
import { ChevronRight, Users, Gamepad2, Swords, MoreVertical, LogOut, Trash2, Share2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { PlayerAvatar } from '@/components/board/player-avatar'
import { CreateGroupDialog } from '@/components/board/create-group-dialog'
import { DeleteGroupDialog } from '@/components/board/delete-group-dialog'
import { LeaveGroupDialog } from '@/components/board/leave-group-dialog'
import { InviteGroupDialog } from '@/components/board/group-detail'
import { useStore } from '@/lib/store'
import { authClient } from '@/lib/auth-client'
import type { Group } from '@/lib/types'
import Link from 'next/link'

function GroupCardItem({
  group,
  session,
  onOpenGroup,
}: {
  group: Group
  session: any
  onOpenGroup: (id: string) => void
}) {
  const { players, games, matches } = useStore()
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [leaveOpen, setLeaveOpen] = React.useState(false)

  const members = players.filter((p) => p.groupId === group.id)
  const gameCount = games.filter((g) => g.groupId === group.id).length
  const matchCount = matches.filter((m) => m.groupId === group.id).length
  const isCreator = Boolean(group.createdBy && group.createdBy === session?.user?.id)
  const [inviteOpen, setInviteOpen] = React.useState(false)

  return (
    <>
      <Card className="group overflow-hidden border-border/80 transition-colors hover:border-primary/50">
        <CardContent className="flex h-full flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-semibold leading-tight text-foreground truncate">
                  {group.name}
                </h3>
                {isCreator && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                    Creador
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {members.length} {members.length === 1 ? 'jugador' : 'jugadores'}
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Badge variant="secondary" className="gap-1">
                <Swords className="size-3" />
                {matchCount}
              </Badge>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-foreground"
                    >
                      <MoreVertical className="size-4" />
                      <span className="sr-only">Opciones del grupo</span>
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onOpenGroup(group.id)}>
                    Abrir grupo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setInviteOpen(true)}>
                    <Share2 className="size-4 mr-1.5 text-primary" />
                    Invitar con link
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-amber-600 focus:text-amber-600 dark:text-amber-400"
                    onClick={() => setLeaveOpen(true)}
                  >
                    <LogOut className="size-4 mr-1.5" />
                    Salir del grupo
                  </DropdownMenuItem>
                  {isCreator && (
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setDeleteOpen(true)}
                    >
                      <Trash2 className="size-4 mr-1.5" />
                      Borrar grupo
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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

      {/* Confirmation Modals */}
      <InviteGroupDialog
        groupName={group.name}
        inviteCode={group.inviteCode}
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        trigger={null}
      />

      <LeaveGroupDialog
        groupId={group.id}
        groupName={group.name}
        isCreator={isCreator}
        memberCount={members.length}
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        trigger={null}
      />

      {isCreator && (
        <DeleteGroupDialog
          groupId={group.id}
          groupName={group.name}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          trigger={null}
        />
      )}
    </>
  )
}

export function GroupsPanel({ onOpenGroup }: { onOpenGroup: (id: string) => void }) {
  const { groups, players } = useStore()
  const { data: session, isPending } = authClient.useSession()
  const visibleGroups = session
    ? groups.filter(
        (group) =>
          (group.createdBy && group.createdBy === session.user.id) ||
          players.some(
            (player) =>
              player.groupId === group.id &&
              (player.userId === session.user.id ||
                player.name.toLowerCase() === session.user.name.toLowerCase())
          )
      )
    : []

  if (isPending) return null
  if (!session) {
    return (
      <Card className="border-primary/20 bg-card">
        <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
          <h2 className="font-serif text-2xl font-semibold">Tus grupos están protegidos</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Iniciá sesión para ver los grupos donde jugás. El leaderboard general permanece disponible para toda la mesa.
          </p>
          <Link
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            href="/sign-in"
          >
            Iniciar sesión
          </Link>
        </CardContent>
      </Card>
    )
  }

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
          {visibleGroups.map((group) => (
            <GroupCardItem
              key={group.id}
              group={group}
              session={session}
              onOpenGroup={onOpenGroup}
            />
          ))}
        </div>
      )}
    </div>
  )
}
