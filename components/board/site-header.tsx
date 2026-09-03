import { Dices } from 'lucide-react'
import { AuthControls } from '@/components/auth-controls'

export function SiteHeader() {
  return (
    <header className="border-b border-border/70 bg-card/60">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-5 sm:px-6">
        <div className="ml-auto order-last"><AuthControls /></div>
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm ring-1 ring-border">
          <Dices className="size-6" aria-hidden="true" />
        </div>
        <div className="flex flex-col">
          <h1 className="font-serif text-2xl font-semibold leading-none tracking-tight text-foreground">
            Mesa Mayor
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tracker de partidas, victorias y winrate
          </p>
        </div>
      </div>
    </header>
  )
}
