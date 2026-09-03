'use client'

import * as React from 'react'
import { ArrowLeft, Trophy, Gamepad2, ScrollText, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { PlayerAvatar } from '@/components/board/player-avatar'
import { GameCard } from '@/components/board/game-card'
import { Leaderboard } from '@/components/board/leaderboard'
import { MatchHistory } from '@/components/board/match-history'
import { AddGameDialog } from '@/components/board/add-game-dialog'
import { RecordMatchDialog } from '@/components/board/record-match-dialog'
import { useStore } from '@/lib/store'
import { computePlayerStats } from '@/lib/stats'

function AddPlayerDialog({ groupId }: { groupId: string }) {
  const { addPlayer } = useStore()
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return toast.error('Escribí un nombre')
    addPlayer(groupId, name)
    toast.success(`${name.trim()} se sumó al grupo`)
    setName('')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <UserPlus data-icon="inline-start" />
            Sumar jugador
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg">Sumar jugador</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="new-player">Nombre</FieldLabel>
              <Input
                id="new-player"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del jugador"
                autoFocus
              />
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-5">
            <Button type="submit">Agregar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function GroupDetail({ groupId, onBack }: { groupId: string; onBack: () => void }) {
  const { groups, players, games, matches } = useStore()
  const group = groups.find((g) => g.id === groupId)

  if (!group) {
    return (
      <div className="flex flex-col items-start gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft data-icon="inline-start" />
          Volver
        </Button>
        <p className="text-muted-foreground">Este grupo ya no existe.</p>
      </div>
    )
  }

  const groupPlayers = players.filter((p) => p.groupId === groupId)
  const groupGames = games.filter((g) => g.groupId === groupId)
  const groupMatches = matches.filter((m) => m.groupId === groupId)
  const stats = computePlayerStats(players, matches, groups, groupId)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="w-fit -ml-2">
          <ArrowLeft data-icon="inline-start" />
          Todos los grupos
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground">
              {group.name}
            </h2>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex -space-x-2">
                {groupPlayers.map((p) => (
                  <PlayerAvatar
                    key={p.id}
                    id={p.id}
                    name={p.name}
                    className="size-8 ring-2 ring-background"
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {groupPlayers.map((p) => p.name).join(', ')}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <AddPlayerDialog groupId={groupId} />
            <AddGameDialog groupId={groupId} />
            <RecordMatchDialog groupId={groupId} />
          </div>
        </div>
      </div>

      <Tabs defaultValue="leaderboard">
        <TabsList>
          <TabsTrigger value="leaderboard">
            <Trophy data-icon="inline-start" />
            Leaderboard
          </TabsTrigger>
          <TabsTrigger value="games">
            <Gamepad2 data-icon="inline-start" />
            Juegos
          </TabsTrigger>
          <TabsTrigger value="history">
            <ScrollText data-icon="inline-start" />
            Partidas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="pt-4">
          {groupMatches.length === 0 ? (
            <Empty className="rounded-xl border border-dashed border-border bg-card/50 py-10">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Trophy />
                </EmptyMedia>
                <EmptyTitle>El podio está vacío</EmptyTitle>
                <EmptyDescription>
                  Registrá partidas y el ranking de este grupo se va a armar solo.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Leaderboard stats={stats} />
          )}
        </TabsContent>

        <TabsContent value="games" className="pt-4">
          {groupGames.length === 0 ? (
            <Empty className="rounded-xl border border-dashed border-border bg-card/50 py-10">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Gamepad2 />
                </EmptyMedia>
                <EmptyTitle>Todavía no hay juegos</EmptyTitle>
                <EmptyDescription>Agregá el primer juego al que van a jugar.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groupGames.map((g) => (
                <GameCard key={g.id} game={g} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="pt-4">
          <MatchHistory matches={groupMatches} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
