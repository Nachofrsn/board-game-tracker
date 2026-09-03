import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { initials, colorIndex } from '@/lib/stats'

const toneClasses: Record<number, string> = {
  1: 'bg-chart-1/20 text-chart-1',
  2: 'bg-chart-2/25 text-accent-foreground',
  3: 'bg-chart-3/20 text-chart-3',
  4: 'bg-chart-4/20 text-chart-4',
  5: 'bg-chart-5/20 text-chart-5',
}

export function PlayerAvatar({
  id,
  name,
  className,
}: {
  id: string
  name: string
  className?: string
}) {
  const tone = toneClasses[colorIndex(id)]
  return (
    <Avatar className={cn('ring-2 ring-border', className)}>
      <AvatarFallback className={cn('font-semibold', tone)}>{initials(name)}</AvatarFallback>
    </Avatar>
  )
}
