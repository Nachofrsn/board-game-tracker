'use client'

import * as React from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useStore } from '@/lib/store'

interface DeleteGroupDialogProps {
  groupId: string
  groupName: string
  trigger?: React.ReactElement | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
}

export function DeleteGroupDialog({
  groupId,
  groupName,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  onSuccess,
}: DeleteGroupDialogProps) {
  const { deleteGroup } = useStore()
  const [internalOpen, setInternalOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen

  async function handleDelete() {
    setLoading(true)
    const ok = await deleteGroup(groupId)
    setLoading(false)
    if (ok) {
      setOpen(false)
      onSuccess?.()
    }
  }

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
    >
      <Trash2 className="size-4" />
      Borrar grupo
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== undefined ? (
        trigger ? <DialogTrigger render={trigger} /> : null
      ) : (
        <DialogTrigger render={defaultTrigger} />
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex size-10 items-center justify-center rounded-full bg-destructive/15 text-destructive mb-1">
            <AlertTriangle className="size-5" />
          </div>
          <DialogTitle className="font-serif text-lg text-destructive">
            ¿Eliminar el grupo &quot;{groupName}&quot;?
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Esta acción es irreversible. Se eliminarán permanentemente todos los juegos asociados, las partidas registradas y las estadísticas del grupo para todos los miembros.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button variant="outline" disabled={loading} onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" disabled={loading} onClick={handleDelete}>
            {loading ? 'Eliminando...' : 'Sí, eliminar grupo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
