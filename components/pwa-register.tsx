'use client'

import * as React from 'react'
import { Download, Share, PlusSquare, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const IOS_DISMISS_KEY = 'mesa_mayor_ios_pwa_dismissed'

export function PwaRegister() {
  const [installPrompt, setInstallPrompt] = React.useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = React.useState(false)
  const [isIOS, setIsIOS] = React.useState(false)
  const [showIOSModal, setShowIOSModal] = React.useState(false)
  const [dismissedIOS, setDismissedIOS] = React.useState(true)

  React.useEffect(() => {
    // Register Service Worker
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      window.location.protocol.startsWith('http')
    ) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          reg.addEventListener('updatefound', () => {
            const installingWorker = reg.installing
            if (installingWorker) {
              installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('Nueva versión de Mesa Mayor disponible.')
                }
              })
            }
          })
        })
        .catch((err) => {
          console.error('Service Worker registration failed:', err)
        })
    }

    // Check if app is running in standalone mode (already installed)
    const isStandalone =
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true)

    if (isStandalone) {
      setInstalled(true)
      return
    }

    // Detect iOS / iPadOS
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent
      const isApple =
        /iPad|iPhone|iPod/.test(ua) ||
        (ua.includes('Macintosh') && Boolean(navigator.maxTouchPoints && navigator.maxTouchPoints > 1))
      setIsIOS(isApple)
      const dismissed = localStorage.getItem(IOS_DISMISS_KEY) === 'true'
      setDismissedIOS(dismissed)
    }

    // Listen for beforeinstallprompt (Android / Chrome)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }

    const handleAppInstalled = () => {
      setInstalled(true)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  async function handleAndroidInstallClick() {
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      setInstallPrompt(null)
    }
  }

  function handleDismissIOS() {
    setDismissedIOS(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem(IOS_DISMISS_KEY, 'true')
    }
  }

  if (installed) {
    return null
  }

  // Case 1: Android / Desktop Chrome with beforeinstallprompt ready
  if (installPrompt) {
    return (
      <div className="fixed bottom-4 right-4 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <Button
          onClick={handleAndroidInstallClick}
          variant="outline"
          size="sm"
          className="gap-2 bg-card/95 backdrop-blur-md shadow-lg border-primary/40 text-foreground hover:border-primary font-medium"
        >
          <Download className="size-4 text-primary" />
          Instalar app
        </Button>
      </div>
    )
  }

  // Case 2: iOS / iPadOS Safari instructions
  if (isIOS && !dismissedIOS) {
    return (
      <>
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-card/95 p-1.5 shadow-xl backdrop-blur-md sm:max-w-xs">
            <Button
              onClick={() => setShowIOSModal(true)}
              variant="ghost"
              size="sm"
              className="flex-1 justify-start gap-2 text-foreground font-medium hover:text-primary px-2.5 h-8 text-xs sm:text-sm"
            >
              <Download className="size-4 text-primary shrink-0" />
              <span className="truncate">Instalar app en iPhone</span>
            </Button>
            <Button
              onClick={handleDismissIOS}
              variant="ghost"
              size="icon-xs"
              className="size-7 text-muted-foreground hover:text-foreground shrink-0 rounded-lg"
              title="Cerrar sugerencia"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </div>

        <Dialog open={showIOSModal} onOpenChange={setShowIOSModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif text-lg text-foreground">
                Instalar Mesa Mayor en tu iPhone
              </DialogTitle>
              <DialogDescription>
                Sigue estos pasos en Safari para añadir la app a tu pantalla de inicio y usarla a pantalla completa:
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-sm text-foreground">
              <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/40 p-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
                  <Share className="size-4" />
                </div>
                <div>
                  <p className="font-medium text-foreground">1. Toca Compartir</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    En la barra inferior de Safari, pulsa el botón de compartir (cuadrado con flecha hacia arriba).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/40 p-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
                  <PlusSquare className="size-4" />
                </div>
                <div>
                  <p className="font-medium text-foreground">2. Selecciona «Agregar a inicio»</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Baja en la lista de opciones y pulsa <strong>«Agregar a pantalla de inicio»</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/40 p-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary font-bold text-xs">
                  +
                </div>
                <div>
                  <p className="font-medium text-foreground">3. Confirma «Agregar»</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Toca «Agregar» en la esquina superior derecha para fijar el ícono en tu pantalla.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={() => {
                  setShowIOSModal(false)
                  handleDismissIOS()
                }}
                className="w-full sm:w-auto"
              >
                ¡Entendido!
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return null
}
