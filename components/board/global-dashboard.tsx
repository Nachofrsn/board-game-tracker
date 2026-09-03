'use client'

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts'
import { Users, Gamepad2, Swords, Clock, Crown, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { PlayerAvatar } from '@/components/board/player-avatar'
import { useStore } from '@/lib/store'
import { computePlayerStats, formatWinrate, formatDuration, colorIndex } from '@/lib/stats'

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  sub?: string
}) {
  return (
    <Card className="p-0">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="font-serif text-2xl font-semibold leading-tight text-foreground">{value}</p>
          {sub ? <p className="truncate text-xs text-muted-foreground">{sub}</p> : null}
        </div>
      </CardContent>
    </Card>
  )
}

export function GlobalDashboard() {
  const { groups, players, games, matches } = useStore()
  const stats = computePlayerStats(players, matches, groups).filter((s) => s.played > 0)

  const totalMinutes = matches.reduce((a, m) => a + m.durationMinutes, 0)
  const topPlayer = stats[0]

  const chartData = stats
    .slice()
    .sort((a, b) => b.wins - a.wins)
    .slice(0, 8)
    .map((s) => ({
      name: s.playerName,
      wins: s.wins,
      winrate: Math.round(s.winrate * 100),
      played: s.played,
      fill: `var(--chart-${colorIndex(s.playerId)})`,
    }))

  const chartConfig: ChartConfig = {
    wins: { label: 'Victorias' },
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-serif text-xl font-semibold text-foreground">Estadísticas globales</h2>
        <p className="text-sm text-muted-foreground">
          Todas las partidas y victorias, sumando todos los grupos.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Grupos" value={String(groups.length)} sub={`${players.length} jugadores`} />
        <StatCard icon={Gamepad2} label="Juegos" value={String(games.length)} />
        <StatCard icon={Swords} label="Partidas" value={String(matches.length)} />
        <StatCard
          icon={Clock}
          label="Tiempo jugado"
          value={formatDuration(totalMinutes)}
          sub={matches.length ? `~${Math.round(totalMinutes / matches.length)} min / partida` : undefined}
        />
      </div>

      {stats.length === 0 ? (
        <Empty className="rounded-xl border border-dashed border-border bg-card/50 py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TrendingUp />
            </EmptyMedia>
            <EmptyTitle>Sin datos aún</EmptyTitle>
            <EmptyDescription>
              Cargá partidas en tus grupos y acá vas a ver los gráficos y el winrate.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="font-serif">Victorias por jugador</CardTitle>
              <CardDescription>Top jugadores por partidas ganadas</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <BarChart accessibilityLayer data={chartData} margin={{ left: -12, top: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={12}
                  />
                  <YAxis tickLine={false} axisLine={false} allowDecimals={false} fontSize={12} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, _n, item) => (
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{item.payload.name}</span>
                            <span className="text-muted-foreground">
                              {value} victorias · {item.payload.winrate}% winrate · {item.payload.played} jugadas
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Bar dataKey="wins" radius={[6, 6, 0, 0]} maxBarSize={56}>
                    {chartData.map((d) => (
                      <Cell key={d.name} fill={d.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-serif">Ranking por winrate</CardTitle>
              <CardDescription>Todos los jugadores</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              {stats
                .slice()
                .sort((a, b) => b.winrate - a.winrate || b.wins - a.wins)
                .map((s, i) => (
                  <div
                    key={s.playerId}
                    className="flex items-center gap-3 rounded-lg px-1 py-1.5"
                  >
                    <span className="w-4 text-center text-sm font-medium text-muted-foreground">
                      {i + 1}
                    </span>
                    <PlayerAvatar id={s.playerId} name={s.playerName} className="size-8" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{s.playerName}</p>
                      <p className="truncate text-xs text-muted-foreground">{s.groupName}</p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-foreground">
                      {formatWinrate(s.winrate)}
                    </span>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      )}

      {topPlayer ? (
        <Card className="border-accent/40 bg-accent/10">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Crown className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Líder general
              </p>
              <p className="font-serif text-lg font-semibold text-foreground">
                {topPlayer.playerName}{' '}
                <span className="text-sm font-normal text-muted-foreground">
                  · {topPlayer.wins} victorias · {formatWinrate(topPlayer.winrate)} winrate
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
