'use client'

import * as React from 'react'
import { LogOut } from 'lucide-react'
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

interface LeaveGroupDialogProps {
  groupId: string
  groupName: string
  isCreator?: boolean
  memberCount?: number
  trigger?: React.ReactElement | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
}

export function LeaveGroupDialog({
  groupId,
  groupName,
  isCreator = false,
  memberCount = 1,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  onSuccess,
}: LeaveGroupDialogProps) {
  const { leaveGroup } = useStore()
  const [internalOpen, setInternalOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen

  async function handleLeave() {
    setLoading(true)
    const ok = await leaveGroup(groupId)
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
      className="text-muted-foreground hover:text-foreground gap-1.5"
    >
      <LogOut className="size-4" />
      Salir del grupo
    </Button>
  )

  const description =
    isCreator && memberCount > 1
      ? 'Sos el creador de este grupo. Si decidís salir, la administración del grupo se transferirá automáticamente a otro miembro y dejarás de tener acceso a las partidas y estadísticas.'
      : isCreator && memberCount <= 1
      ? 'Sos el único miembro de este grupo. Si salís, el grupo y todas sus partidas se eliminarán permanentemente.'
      : '¿Estás seguro de que querés salir de este grupo? Ya no podrás ver ni registrar partidas en esta mesa a menos que te vuelvan a invitar.'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== undefined ? (
        trigger ? <DialogTrigger render={trigger} /> : null
      ) : (
        <DialogTrigger render={defaultTrigger} />
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 mb-1">
            <LogOut className="size-5" />
          </div>
          <DialogTitle className="font-serif text-lg">
            ¿Salir del grupo &quot;{groupName}&quot;?
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button variant="outline" disabled={loading} onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" disabled={loading} onClick={handleLeave}>
            {loading ? 'Saliendo...' : 'Sí, salir del grupo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
