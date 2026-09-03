'use client'

import { Crown, Medal } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { PlayerAvatar } from '@/components/board/player-avatar'
import { cn } from '@/lib/utils'
import { formatWinrate, formatDuration } from '@/lib/stats'
import type { PlayerStat } from '@/lib/types'

const rankTone = ['text-accent', 'text-muted-foreground', 'text-chart-3']

export function Leaderboard({ stats }: { stats: PlayerStat[] }) {
  if (stats.length === 0) return null

  return (
    <Card className="overflow-hidden p-0">
      <ol className="divide-y divide-border/60">
        {stats.map((s, i) => (
          <li
            key={s.playerId}
            className={cn(
              'flex items-center gap-3 px-4 py-3',
              i === 0 && 'bg-accent/10',
            )}
          >
            <div className="flex w-6 shrink-0 items-center justify-center">
              {i < 3 ? (
                i === 0 ? (
                  <Crown className={cn('size-5', rankTone[0])} />
                ) : (
                  <Medal className={cn('size-5', rankTone[i])} />
                )
              ) : (
                <span className="text-sm font-medium text-muted-foreground">{i + 1}</span>
              )}
            </div>

            <PlayerAvatar id={s.playerId} name={s.playerName} className="size-10" />

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-semibold text-foreground">{s.playerName}</p>
                <span className="shrink-0 text-sm font-semibold text-foreground">
                  {formatWinrate(s.winrate)}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-3">
                <Progress value={s.winrate * 100} className="h-1.5" />
                <span className="shrink-0 text-xs text-muted-foreground">
                  {s.wins}/{s.played}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <div className="flex items-center justify-between border-t border-border/60 bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
        <span>Ordenado por victorias y winrate</span>
        <Badge variant="secondary">
          {formatDuration(stats.reduce((a, s) => a + s.minutesPlayed, 0))} en total
        </Badge>
      </div>
    </Card>
  )
}
