'use client'

import * as React from 'react'
import { Plus, Trash2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { useStore } from '@/lib/store'
import { authClient } from '@/lib/auth-client'

export function CreateGroupDialog({ onCreated }: { onCreated?: (id: string) => void }) {
  const { addGroup } = useStore()
  const { data: session } = authClient.useSession()
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState('')
  const [players, setPlayers] = React.useState<string[]>(['', '', ''])

  React.useEffect(() => {
    if (session?.user?.name) {
      setPlayers((prev) => [session.user.name, prev[1] || '', prev[2] || ''])
    }
  }, [session?.user?.name, open])

  function reset() {
    setName('')
    setPlayers([session?.user?.name || '', '', ''])
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const cleanName = name.trim()
    const cleanPlayers = players.map((p) => p.trim()).filter(Boolean)
    if (!cleanName) {
      toast.error('Ponele un nombre al grupo')
      return
    }
    if (cleanPlayers.length < 2) {
      toast.error('Agregá al menos 2 jugadores')
      return
    }
    const id = addGroup(cleanName, cleanPlayers)
    toast.success(`Grupo "${cleanName}" creado`)
    setOpen(false)
    reset()
    onCreated?.(id)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) reset()
      }}
    >
      <DialogTrigger
        render={
          <Button>
            <Plus data-icon="inline-start" />
            Nuevo grupo
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Crear un grupo</DialogTitle>
          <DialogDescription>
            Un grupo reúne a los jugadores que comparten mesa. Ej: “Jelium” con Nacho, Gonzo y Renzo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="group-name">Nombre del grupo</FieldLabel>
              <Input
                id="group-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jelium"
                autoFocus
              />
            </Field>

            <Field>
              <FieldLabel>Jugadores</FieldLabel>
              <div className="flex flex-col gap-2">
                {players.map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={p}
                      onChange={(e) =>
                        setPlayers((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))
                      }
                      placeholder={`Jugador ${i + 1}`}
                    />
                    {players.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Quitar jugador"
                        onClick={() => setPlayers((prev) => prev.filter((_, idx) => idx !== i))}
                      >
                        <Trash2 />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-1 w-fit"
                onClick={() => setPlayers((prev) => [...prev, ''])}
              >
                <UserPlus data-icon="inline-start" />
                Agregar jugador
              </Button>
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-5">
            <Button type="submit">Crear grupo</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
